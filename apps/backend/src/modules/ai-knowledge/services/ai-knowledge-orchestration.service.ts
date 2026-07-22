import { Injectable } from '@nestjs/common';
import { KnowledgeSourceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AI_KNOWLEDGE_LIMITS } from '../constants/ai-knowledge.constants';
import { AiKnowledgeQueueService } from '../jobs/ai-knowledge-queue.service';
import {
  AiExtractionScope,
  SupportedAiProvider,
} from '../interfaces/ai-knowledge.interfaces';

@Injectable()
export class AiKnowledgeOrchestrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: AiKnowledgeQueueService,
  ) {}

  async enqueueWorkspace(
    workspaceId: string,
    options: {
      provider?: SupportedAiProvider;
      force?: boolean;
      scope?: AiExtractionScope;
    } = {},
  ) {
    const scope = options.scope ?? 'light';
    const repositories = await this.prisma.repository.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true },
    });

    for (const repository of repositories) {
      await this.enqueueRepository(repository.id, workspaceId, {
        ...options,
        scope,
      });
    }

    return {
      accepted: true,
      repositories: repositories.length,
      scope,
      note:
        scope === 'full'
          ? 'full scope enqueues every commit/PR/issue — costly on free-tier Gemini'
          : 'light/recent scopes limit Gemini usage',
    };
  }

  /**
   * Default scope is `light`: repository summary + documentation only.
   * This avoids thousands of Gemini calls for every commit/PR.
   */
  async enqueueRepository(
    repositoryId: string,
    workspaceId: string,
    options: {
      provider?: SupportedAiProvider;
      force?: boolean;
      scope?: AiExtractionScope;
    } = {},
  ) {
    const scope = options.scope ?? 'light';
    const allowedTypes = this.sourceTypesForScope(scope);

    const sources = await this.prisma.knowledgeSource.findMany({
      where: {
        repositoryId,
        workspaceId,
        sourceType: { in: allowedTypes },
      },
      select: { id: true, sourceType: true },
      orderBy: { updatedAt: 'desc' },
      take:
        scope === 'full'
          ? AI_KNOWLEDGE_LIMITS.maxBatchDocuments * 5
          : AI_KNOWLEDGE_LIMITS.maxBatchDocuments,
    });

    // For recent/full, still cap entity types that explode request counts.
    const limitedSources =
      scope === 'recent'
        ? this.capRecentSources(sources)
        : scope === 'light'
          ? sources
          : sources.slice(0, AI_KNOWLEDGE_LIMITS.maxBatchDocuments * 5);

    const documentation =
      scope === 'full' || scope === 'light' || scope === 'recent'
        ? await this.prisma.documentation.findMany({
            where: { repositoryId },
            select: { id: true },
            orderBy: { updatedAt: 'desc' },
            take: scope === 'full' ? 100 : 20,
          })
        : [];

    for (const source of limitedSources) {
      await this.enqueueSource(
        workspaceId,
        repositoryId,
        source.id,
        source.sourceType,
        { ...options, scope },
      );
    }
    for (const doc of documentation) {
      await this.queueService.enqueueDocument({
        workspaceId,
        repositoryId,
        documentId: doc.id,
        documentationId: doc.id,
        provider: options.provider,
        force: options.force,
        scope,
        trigger: 'api:repository',
      });
    }

    return {
      accepted: true,
      scope,
      knowledgeSources: limitedSources.length,
      documentation: documentation.length,
      estimatedGeminiCalls: limitedSources.length + documentation.length,
      warning:
        scope === 'full'
          ? 'full scope can exhaust Gemini free-tier quota quickly'
          : undefined,
    };
  }

  private sourceTypesForScope(scope: AiExtractionScope): KnowledgeSourceType[] {
    if (scope === 'light') {
      return [
        KnowledgeSourceType.REPOSITORY,
        KnowledgeSourceType.DOCUMENTATION,
        KnowledgeSourceType.RELEASE,
      ];
    }
    if (scope === 'recent') {
      return [
        KnowledgeSourceType.REPOSITORY,
        KnowledgeSourceType.DOCUMENTATION,
        KnowledgeSourceType.RELEASE,
        KnowledgeSourceType.COMMIT,
        KnowledgeSourceType.PULL_REQUEST,
        KnowledgeSourceType.ISSUE,
      ];
    }
    return [
      KnowledgeSourceType.REPOSITORY,
      KnowledgeSourceType.DOCUMENTATION,
      KnowledgeSourceType.RELEASE,
      KnowledgeSourceType.COMMIT,
      KnowledgeSourceType.PULL_REQUEST,
      KnowledgeSourceType.ISSUE,
      KnowledgeSourceType.CUSTOM,
    ];
  }

  private capRecentSources(
    sources: Array<{ id: string; sourceType: KnowledgeSourceType }>,
  ) {
    const limit = AI_KNOWLEDGE_LIMITS.recentEntityLimit;
    const result: typeof sources = [];
    const counts: Partial<Record<KnowledgeSourceType, number>> = {};

    for (const source of sources) {
      if (
        source.sourceType === KnowledgeSourceType.REPOSITORY ||
        source.sourceType === KnowledgeSourceType.DOCUMENTATION ||
        source.sourceType === KnowledgeSourceType.RELEASE
      ) {
        result.push(source);
        continue;
      }
      const used = counts[source.sourceType] ?? 0;
      if (used >= limit) continue;
      counts[source.sourceType] = used + 1;
      result.push(source);
    }
    return result;
  }

  private async enqueueSource(
    workspaceId: string,
    repositoryId: string,
    sourceId: string,
    sourceType: KnowledgeSourceType,
    options: {
      provider?: SupportedAiProvider;
      force?: boolean;
      scope?: AiExtractionScope;
    },
  ) {
    const payload = {
      workspaceId,
      repositoryId,
      documentId: sourceId,
      sourceType,
      provider: options.provider,
      force: options.force,
      scope: options.scope,
      trigger: 'api:repository',
    };

    switch (sourceType) {
      case 'REPOSITORY':
        await this.queueService.enqueueRepository(payload);
        break;
      case 'COMMIT':
        await this.queueService.enqueueCommit(payload);
        break;
      case 'PULL_REQUEST':
      case 'CUSTOM':
        await this.queueService.enqueuePullRequest(payload);
        break;
      case 'ISSUE':
        await this.queueService.enqueueIssue(payload);
        break;
      case 'DOCUMENTATION':
        await this.queueService.enqueueDocument(payload);
        break;
      default:
        await this.queueService.enqueueDocument(payload);
        break;
    }
  }

  buildMetadataFilter(status?: string): Prisma.KnowledgeSourceWhereInput {
    if (!status) {
      return {};
    }
    return {
      metadata: {
        path: ['aiExtraction', 'status'],
        equals: status,
      },
    };
  }
}
