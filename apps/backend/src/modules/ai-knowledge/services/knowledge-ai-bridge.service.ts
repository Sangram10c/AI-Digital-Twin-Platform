import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KnowledgeSourceType } from '@prisma/client';
import { KnowledgeDocumentKind } from '../../knowledge/interfaces/knowledge.interfaces';
import { HybridPipelineQueueService } from '../jobs/hybrid-pipeline-queue.service';

/**
 * Bridges completed knowledge processing into the hybrid AI pipeline.
 *
 * Cost control:
 * - Auto-trigger only for repository-level knowledge sources.
 * - Pipeline uses heuristics + digests; never one AI call per commit.
 */
@Injectable()
export class KnowledgeAiBridgeService {
  private readonly logger = new Logger(KnowledgeAiBridgeService.name);

  constructor(
    private readonly hybridQueue: HybridPipelineQueueService,
    private readonly configService: ConfigService,
  ) {}

  async enqueueAfterChunkGeneration(params: {
    workspaceId: string;
    repositoryId?: string | null;
    documentId: string;
    documentKind: KnowledgeDocumentKind;
    sourceType?: KnowledgeSourceType;
  }): Promise<void> {
    if (params.documentKind === KnowledgeDocumentKind.DOCUMENTATION) {
      this.logger.debug(
        `Skipped auto hybrid AI for documentation ${params.documentId}`,
      );
      return;
    }

    if (params.sourceType !== KnowledgeSourceType.REPOSITORY) {
      this.logger.debug(
        `Skipped auto hybrid AI for ${params.sourceType ?? 'unknown'} ${params.documentId}`,
      );
      return;
    }

    if (!params.repositoryId) {
      return;
    }

    const mode = this.configService.get<string>('ai.extractionMode') ?? 'light';

    await this.hybridQueue.enqueuePipeline({
      workspaceId: params.workspaceId,
      repositoryId: params.repositoryId,
      mode,
      force: false,
      trigger: 'knowledge:chunk-complete',
    });
    this.logger.log(
      `Enqueued hybrid pipeline for ${params.repositoryId} mode=${mode}`,
    );
  }

  async enqueueRepositoryAnalysis(params: {
    workspaceId: string;
    repositoryId: string;
    documentId: string;
  }): Promise<void> {
    const mode = this.configService.get<string>('ai.extractionMode') ?? 'light';
    await this.hybridQueue.enqueuePipeline({
      workspaceId: params.workspaceId,
      repositoryId: params.repositoryId,
      mode,
      force: false,
      trigger: 'knowledge:repository-complete',
    });
    this.logger.log(
      `Enqueued hybrid pipeline for ${params.repositoryId} mode=${mode}`,
    );
  }
}
