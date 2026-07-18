import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  DEFAULT_REPOSITORY_SYNC_LIMITS,
  REPOSITORY_QUEUES,
} from '../constants/repository-sync.constants';
import {
  DocumentationSyncJobPayload,
  RepositoryDeadLetterPayload,
  RepositoryPipelineJobPayload,
  RepositorySyncJobPayload,
} from '../interfaces/repository-sync.interfaces';
import { RepositorySyncQueueService } from '../jobs/repository-sync-queue.service';
import { RepositoryPipelineService } from '../services/repository-pipeline.service';

abstract class RepositoryWorker extends WorkerHost {
  protected abstract readonly queueName: string;
  protected readonly logger: Logger;

  constructor(
    protected readonly queueService: RepositorySyncQueueService,
    loggerContext: string,
  ) {
    super();
    this.logger = new Logger(loggerContext);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error) {
    if (!job) return;
    const attempts =
      job.opts.attempts ?? DEFAULT_REPOSITORY_SYNC_LIMITS.maxRetries;
    if (job.attemptsMade >= attempts) {
      const data = job.data as {
        workspaceId: string;
        repositoryId: string;
      };
      await this.queueService.enqueueDeadLetter({
        workspaceId: data.workspaceId,
        repositoryId: data.repositoryId,
        sourceQueue: this.queueName,
        jobName: job.name,
        error: error.message,
        attemptsMade: job.attemptsMade,
      });
    }
  }
}

@Processor(REPOSITORY_QUEUES.PIPELINE, {
  concurrency: DEFAULT_REPOSITORY_SYNC_LIMITS.workerConcurrency,
})
export class RepositoryPipelineProcessor extends RepositoryWorker {
  protected readonly queueName = REPOSITORY_QUEUES.PIPELINE;

  constructor(
    private readonly pipeline: RepositoryPipelineService,
    queueService: RepositorySyncQueueService,
  ) {
    super(queueService, RepositoryPipelineProcessor.name);
  }

  async process(job: Job<RepositoryPipelineJobPayload>) {
    this.logger.log(`Running pipeline for repository ${job.data.repositoryId}`);
    return this.pipeline.runPipeline(job.data);
  }
}

@Processor(REPOSITORY_QUEUES.ENTITY_SYNC, {
  concurrency: DEFAULT_REPOSITORY_SYNC_LIMITS.workerConcurrency,
})
export class RepositoryEntitySyncProcessor extends RepositoryWorker {
  protected readonly queueName = REPOSITORY_QUEUES.ENTITY_SYNC;

  constructor(
    private readonly pipeline: RepositoryPipelineService,
    queueService: RepositorySyncQueueService,
  ) {
    super(queueService, RepositoryEntitySyncProcessor.name);
  }

  async process(job: Job<RepositorySyncJobPayload>) {
    const result = await this.pipeline.runEntitySync(job.data);
    await this.queueService.enqueueDocumentationSync({
      workspaceId: job.data.workspaceId,
      repositoryId: job.data.repositoryId,
      triggeredBy: job.data.triggeredBy,
      force: job.data.force,
      continuePipeline: true,
    });
    return result;
  }
}

@Processor(REPOSITORY_QUEUES.DOCUMENTATION_SYNC, {
  concurrency: DEFAULT_REPOSITORY_SYNC_LIMITS.workerConcurrency,
})
export class DocumentationSyncProcessor extends RepositoryWorker {
  protected readonly queueName = REPOSITORY_QUEUES.DOCUMENTATION_SYNC;

  constructor(
    private readonly pipeline: RepositoryPipelineService,
    queueService: RepositorySyncQueueService,
  ) {
    super(queueService, DocumentationSyncProcessor.name);
  }

  async process(job: Job<DocumentationSyncJobPayload>) {
    return this.pipeline.runDocumentationSync({
      ...job.data,
      continuePipeline: job.data.continuePipeline !== false,
    });
  }
}

@Processor(REPOSITORY_QUEUES.DEAD_LETTER, { concurrency: 1 })
export class RepositoryDeadLetterProcessor extends WorkerHost {
  private readonly logger = new Logger(RepositoryDeadLetterProcessor.name);

  process(
    job: Job<RepositoryDeadLetterPayload>,
  ): Promise<{ recorded: boolean }> {
    this.logger.error(
      `Repository dead-letter queue=${job.data.sourceQueue} job=${job.data.jobName} error=${job.data.error}`,
    );
    return Promise.resolve({ recorded: true });
  }
}
