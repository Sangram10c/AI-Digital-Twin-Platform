import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeQueueService } from '../../knowledge/jobs/knowledge-queue.service';
import {
  DocumentationSyncJobPayload,
  RepositoryPipelineJobPayload,
  RepositorySyncJobPayload,
} from '../interfaces/repository-sync.interfaces';
import { DocumentationCrawlerService } from './documentation-crawler.service';
import { RepositoryEntitySyncService } from './repository-entity-sync.service';
import { RepositorySyncQueueService } from '../jobs/repository-sync-queue.service';
import { SyncCheckpointService } from './sync-checkpoint.service';

/**
 * Orchestrates: entity sync → documentation sync → knowledge processing → chunks.
 */
@Injectable()
export class RepositoryPipelineService {
  private readonly logger = new Logger(RepositoryPipelineService.name);

  constructor(
    private readonly entitySync: RepositoryEntitySyncService,
    private readonly documentationCrawler: DocumentationCrawlerService,
    private readonly queueService: RepositorySyncQueueService,
    private readonly knowledgeQueue: KnowledgeQueueService,
    private readonly checkpoints: SyncCheckpointService,
  ) {}

  async startPipeline(payload: RepositoryPipelineJobPayload) {
    await this.checkpoints.markPipelineStatus(payload.repositoryId, {
      status: 'QUEUED',
      stages: payload.stages ?? ['entities', 'documentation', 'knowledge'],
      triggeredBy: payload.triggeredBy,
    });

    const job = await this.queueService.enqueuePipeline(payload);
    return {
      accepted: true,
      jobId: job.id,
      repositoryId: payload.repositoryId,
    };
  }

  async runPipeline(payload: RepositoryPipelineJobPayload) {
    const stages = payload.stages ?? ['entities', 'documentation', 'knowledge'];
    const started = Date.now();

    await this.checkpoints.markPipelineStatus(payload.repositoryId, {
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
    });

    try {
      if (stages.includes('entities')) {
        await this.runEntitySync({
          workspaceId: payload.workspaceId,
          repositoryId: payload.repositoryId,
          triggeredBy: payload.triggeredBy,
          force: payload.force,
          resume: !payload.force,
        });
      }

      if (stages.includes('documentation')) {
        await this.runDocumentationSync({
          workspaceId: payload.workspaceId,
          repositoryId: payload.repositoryId,
          triggeredBy: payload.triggeredBy,
          force: payload.force,
          continuePipeline: stages.includes('knowledge'),
        });
      } else if (stages.includes('knowledge')) {
        await this.enqueueKnowledge(payload);
      }

      await this.checkpoints.markPipelineStatus(payload.repositoryId, {
        status: 'COMPLETED',
        durationMs: Date.now() - started,
        completedAt: new Date().toISOString(),
      });

      return { ok: true, durationMs: Date.now() - started };
    } catch (error) {
      await this.checkpoints.markPipelineStatus(payload.repositoryId, {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'pipeline failed',
        durationMs: Date.now() - started,
      });
      throw error;
    }
  }

  async runEntitySync(payload: RepositorySyncJobPayload) {
    const result = await this.entitySync.syncRepository(payload);
    this.logger.log(
      `Entity sync done for ${payload.repositoryId}: ${JSON.stringify(result)}`,
    );
    return result;
  }

  async runDocumentationSync(payload: DocumentationSyncJobPayload) {
    const result = await this.documentationCrawler.crawlRepository(
      payload.repositoryId,
      { force: payload.force },
    );

    if (payload.continuePipeline !== false) {
      await this.enqueueKnowledge({
        workspaceId: payload.workspaceId,
        repositoryId: payload.repositoryId,
        triggeredBy: payload.triggeredBy ?? 'documentation-sync',
        force: payload.force,
      });
    }

    return result;
  }

  private async enqueueKnowledge(payload: {
    workspaceId: string;
    repositoryId: string;
    triggeredBy?: string;
    force?: boolean;
  }) {
    await this.knowledgeQueue.enqueueRepositoryProcessing({
      workspaceId: payload.workspaceId,
      repositoryId: payload.repositoryId,
      triggeredBy: payload.triggeredBy,
      force: payload.force,
    });
    await this.checkpoints.markPipelineStatus(payload.repositoryId, {
      knowledge: {
        enqueuedAt: new Date().toISOString(),
        status: 'ENQUEUED',
      },
    });
    this.logger.log(
      `Enqueued knowledge processing for repository ${payload.repositoryId}`,
    );
  }
}
