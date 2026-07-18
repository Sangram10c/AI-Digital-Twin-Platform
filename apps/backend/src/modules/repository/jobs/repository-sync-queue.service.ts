import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  DEFAULT_REPOSITORY_SYNC_LIMITS,
  REPOSITORY_JOBS,
  REPOSITORY_QUEUES,
} from '../constants/repository-sync.constants';
import {
  DocumentationSyncJobPayload,
  RepositoryDeadLetterPayload,
  RepositoryPipelineJobPayload,
  RepositorySyncJobPayload,
} from '../interfaces/repository-sync.interfaces';

@Injectable()
export class RepositorySyncQueueService {
  private readonly logger = new Logger(RepositorySyncQueueService.name);

  constructor(
    @InjectQueue(REPOSITORY_QUEUES.ENTITY_SYNC)
    private readonly entitySyncQueue: Queue,
    @InjectQueue(REPOSITORY_QUEUES.DOCUMENTATION_SYNC)
    private readonly documentationSyncQueue: Queue,
    @InjectQueue(REPOSITORY_QUEUES.PIPELINE)
    private readonly pipelineQueue: Queue,
    @InjectQueue(REPOSITORY_QUEUES.DEAD_LETTER)
    private readonly deadLetterQueue: Queue,
  ) {}

  private defaultJobOptions() {
    return {
      attempts: DEFAULT_REPOSITORY_SYNC_LIMITS.maxRetries,
      backoff: {
        type: 'exponential' as const,
        delay: DEFAULT_REPOSITORY_SYNC_LIMITS.backoffDelayMs,
      },
      removeOnComplete: 200,
      removeOnFail: 500,
    };
  }

  enqueuePipeline(payload: RepositoryPipelineJobPayload) {
    return this.pipelineQueue.add(REPOSITORY_JOBS.RUN_PIPELINE, payload, {
      ...this.defaultJobOptions(),
      jobId: `repo-pipeline-${payload.repositoryId}-${Date.now()}`,
    });
  }

  enqueueEntitySync(payload: RepositorySyncJobPayload) {
    return this.entitySyncQueue.add(REPOSITORY_JOBS.SYNC_ENTITIES, payload, {
      ...this.defaultJobOptions(),
      jobId: `repo-entities-${payload.repositoryId}-${Date.now()}`,
    });
  }

  enqueueDocumentationSync(payload: DocumentationSyncJobPayload) {
    return this.documentationSyncQueue.add(
      REPOSITORY_JOBS.SYNC_DOCUMENTATION,
      payload,
      {
        ...this.defaultJobOptions(),
        jobId: `repo-docs-${payload.repositoryId}-${Date.now()}`,
      },
    );
  }

  enqueueDeadLetter(payload: RepositoryDeadLetterPayload) {
    this.logger.warn(
      `Repository dead-letter ${payload.jobName}: ${payload.error}`,
    );
    return this.deadLetterQueue.add(REPOSITORY_JOBS.DEAD_LETTER, payload, {
      removeOnComplete: 1000,
      removeOnFail: 1000,
    });
  }

  async getQueueCounts() {
    const queues = [
      this.entitySyncQueue,
      this.documentationSyncQueue,
      this.pipelineQueue,
      this.deadLetterQueue,
    ];
    const names = Object.values(REPOSITORY_QUEUES);
    const counts: Record<
      string,
      Awaited<ReturnType<Queue['getJobCounts']>>
    > = {};
    for (let i = 0; i < queues.length; i++) {
      counts[names[i]] = await queues[i].getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
        'paused',
      );
    }
    return counts;
  }
}
