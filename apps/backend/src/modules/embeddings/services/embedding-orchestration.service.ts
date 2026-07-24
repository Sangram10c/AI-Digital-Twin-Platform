import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  EMBEDDING_DEFAULTS,
  EmbeddingProviderName,
} from '../constants/embeddings.constants';
import { EmbeddingJobPayload } from '../interfaces/embeddings.interfaces';
import { EmbeddingQueueService } from '../jobs/embedding-queue.service';
import { createEmbeddingProvider } from '../providers/embedding-provider.factory';

@Injectable()
export class EmbeddingOrchestrationService {
  private readonly logger = new Logger(EmbeddingOrchestrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly queue: EmbeddingQueueService,
  ) {}

  async enqueueWorkspace(
    workspaceId: string,
    options: {
      force?: boolean;
      provider?: EmbeddingProviderName;
      repositoryId?: string;
    } = {},
  ) {
    const where = {
      workspaceId,
      deletedAt: null,
      ...(options.repositoryId ? { repositoryId: options.repositoryId } : {}),
    };
    const chunks = await this.prisma.knowledgeChunk.findMany({
      where,
      select: { id: true },
      take: 5000,
      orderBy: { updatedAt: 'desc' },
    });

    return this.enqueueChunkBatches(
      workspaceId,
      chunks.map((c) => c.id),
      options,
    );
  }

  async enqueueRepository(
    repositoryId: string,
    workspaceId: string,
    options: {
      force?: boolean;
      provider?: EmbeddingProviderName;
    } = {},
  ) {
    const repo = await this.prisma.repository.findFirst({
      where: { id: repositoryId, workspaceId, deletedAt: null },
      select: { id: true },
    });
    if (!repo) {
      throw new NotFoundException('Repository not found');
    }
    return this.enqueueWorkspace(workspaceId, {
      ...options,
      repositoryId,
    });
  }

  async enqueueChunkBatches(
    workspaceId: string,
    knowledgeChunkIds: string[],
    options: {
      force?: boolean;
      provider?: EmbeddingProviderName;
      repositoryId?: string;
      trigger?: string;
    } = {},
  ) {
    const batchSize =
      this.config.get<number>('ai.embeddings.batchSize') ??
      EMBEDDING_DEFAULTS.batchSize;
    const jobs = [];
    for (let i = 0; i < knowledgeChunkIds.length; i += batchSize) {
      const slice = knowledgeChunkIds.slice(i, i + batchSize);
      const payload: EmbeddingJobPayload = {
        workspaceId,
        repositoryId: options.repositoryId,
        knowledgeChunkIds: slice,
        force: options.force,
        provider: options.provider,
        trigger: options.trigger ?? 'api',
      };
      jobs.push(await this.queue.enqueueGenerateBatch(payload));
    }
    this.logger.log(
      `Enqueued ${jobs.length} embedding batch jobs for workspace=${workspaceId} chunks=${knowledgeChunkIds.length}`,
    );
    return {
      workspaceId,
      repositoryId: options.repositoryId,
      chunkCount: knowledgeChunkIds.length,
      jobCount: jobs.length,
      jobIds: jobs.map((j) => j.id),
    };
  }

  async enqueueDeletedChunk(knowledgeChunkId: string, workspaceId: string) {
    return this.queue.enqueueDelete({
      workspaceId,
      knowledgeChunkId,
      trigger: 'incremental-delete',
    });
  }

  /**
   * After knowledge chunk generation — enqueue only new/changed chunks.
   */
  async enqueueIncrementalForRepository(
    repositoryId: string,
    workspaceId: string,
  ) {
    const enabled =
      (this.config.get<string>('ai.embeddings.incremental') ?? 'true')
        .toString()
        .toLowerCase() !== 'false';
    if (!enabled) {
      return { skipped: true, reason: 'incremental_disabled' };
    }

    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: { repositoryId, workspaceId, deletedAt: null },
      select: {
        id: true,
        contentHash: true,
        embedding: { select: { checksum: true, status: true } },
      },
      take: 5000,
    });

    const needsEmbed = chunks
      .filter((chunk) => {
        const emb = chunk.embedding;
        if (!emb || emb.status !== EmbeddingStatus.COMPLETED) return true;
        if (!chunk.contentHash) return true;
        return emb.checksum !== chunk.contentHash;
      })
      .map((c) => c.id);

    if (needsEmbed.length === 0) {
      return { skipped: true, reason: 'all_up_to_date', chunkCount: 0 };
    }

    return this.enqueueChunkBatches(workspaceId, needsEmbed, {
      repositoryId,
      trigger: 'incremental',
    });
  }

  listConfiguredProviders() {
    const names: EmbeddingProviderName[] = [
      'groq',
      'gemini',
      'openai',
      'voyage',
      'nomic',
      'local',
      'mock',
    ];
    return names.map((name) => {
      const provider = createEmbeddingProvider(this.config, name);
      return {
        provider: name,
        model: provider.model(),
        dimensions: provider.dimensions(),
      };
    });
  }
}
