import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { KnowledgeAiBridgeService } from '../../ai-knowledge/services/knowledge-ai-bridge.service';
import {
  DEFAULT_KNOWLEDGE_LIMITS,
  KNOWLEDGE_QUEUES,
} from '../constants/knowledge.constants';
import {
  KnowledgeChunkJobPayload,
  KnowledgeDeadLetterPayload,
  KnowledgeEntityJobPayload,
  KnowledgeJobPayload,
} from '../interfaces/knowledge.interfaces';
import { KnowledgeQueueService } from '../jobs/knowledge-queue.service';
import { ChunkGenerationService } from '../services/chunk-generation.service';
import { KnowledgeProcessingService } from '../services/knowledge-processing.service';

abstract class KnowledgeProcessor extends WorkerHost {
  protected abstract readonly queueName: string;
  protected readonly logger: Logger;

  constructor(
    protected readonly queueService: KnowledgeQueueService,
    loggerContext: string,
  ) {
    super();
    this.logger = new Logger(loggerContext);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error) {
    if (!job) return;
    const attempts = job.opts.attempts ?? DEFAULT_KNOWLEDGE_LIMITS.maxRetries;
    if (job.attemptsMade >= attempts) {
      const data = job.data as KnowledgeJobPayload & {
        entityId?: string;
      };
      await this.queueService.enqueueDeadLetter({
        ...data,
        error: error.message,
        attemptsMade: job.attemptsMade,
        sourceQueue: this.queueName,
        jobName: job.name,
        entityId: data.entityId,
      });
    }
  }
}

@Processor(KNOWLEDGE_QUEUES.REPOSITORY, {
  concurrency: DEFAULT_KNOWLEDGE_LIMITS.workerConcurrency,
})
export class RepositoryKnowledgeProcessor extends KnowledgeProcessor {
  protected readonly queueName = KNOWLEDGE_QUEUES.REPOSITORY;

  constructor(
    private readonly processingService: KnowledgeProcessingService,
    private readonly aiBridge: KnowledgeAiBridgeService,
    queueService: KnowledgeQueueService,
  ) {
    super(queueService, RepositoryKnowledgeProcessor.name);
  }

  async process(job: Job<KnowledgeJobPayload>) {
    this.logger.log(`Processing repository knowledge job ${job.id}`);
    const result = await this.processingService.processRepository(
      job.data.repositoryId,
      {
        triggeredBy: job.data.triggeredBy,
        force: job.data.force,
      },
    );

    if (result.documentId) {
      await this.aiBridge.enqueueRepositoryAnalysis({
        workspaceId: job.data.workspaceId,
        repositoryId: job.data.repositoryId,
        documentId: result.documentId,
      });
    }

    return result;
  }
}

@Processor(KNOWLEDGE_QUEUES.COMMIT, {
  concurrency: DEFAULT_KNOWLEDGE_LIMITS.workerConcurrency,
})
export class CommitKnowledgeProcessor extends KnowledgeProcessor {
  protected readonly queueName = KNOWLEDGE_QUEUES.COMMIT;

  constructor(
    private readonly processingService: KnowledgeProcessingService,
    queueService: KnowledgeQueueService,
  ) {
    super(queueService, CommitKnowledgeProcessor.name);
  }

  async process(job: Job<KnowledgeEntityJobPayload>) {
    return this.processingService.processCommit(
      job.data.repositoryId,
      job.data.entityId,
      { force: job.data.force },
    );
  }
}

@Processor(KNOWLEDGE_QUEUES.PULL_REQUEST, {
  concurrency: DEFAULT_KNOWLEDGE_LIMITS.workerConcurrency,
})
export class PullRequestKnowledgeProcessor extends KnowledgeProcessor {
  protected readonly queueName = KNOWLEDGE_QUEUES.PULL_REQUEST;

  constructor(
    private readonly processingService: KnowledgeProcessingService,
    queueService: KnowledgeQueueService,
  ) {
    super(queueService, PullRequestKnowledgeProcessor.name);
  }

  async process(job: Job<KnowledgeEntityJobPayload>) {
    return this.processingService.processPullRequest(
      job.data.repositoryId,
      job.data.entityId,
      { force: job.data.force },
    );
  }
}

@Processor(KNOWLEDGE_QUEUES.ISSUE, {
  concurrency: DEFAULT_KNOWLEDGE_LIMITS.workerConcurrency,
})
export class IssueKnowledgeProcessor extends KnowledgeProcessor {
  protected readonly queueName = KNOWLEDGE_QUEUES.ISSUE;

  constructor(
    private readonly processingService: KnowledgeProcessingService,
    queueService: KnowledgeQueueService,
  ) {
    super(queueService, IssueKnowledgeProcessor.name);
  }

  async process(job: Job<KnowledgeEntityJobPayload>) {
    return this.processingService.processIssue(
      job.data.repositoryId,
      job.data.entityId,
      { force: job.data.force },
    );
  }
}

@Processor(KNOWLEDGE_QUEUES.README, {
  concurrency: DEFAULT_KNOWLEDGE_LIMITS.workerConcurrency,
})
export class ReadmeKnowledgeProcessor extends KnowledgeProcessor {
  protected readonly queueName = KNOWLEDGE_QUEUES.README;

  constructor(
    private readonly processingService: KnowledgeProcessingService,
    queueService: KnowledgeQueueService,
  ) {
    super(queueService, ReadmeKnowledgeProcessor.name);
  }

  async process(job: Job<KnowledgeEntityJobPayload | KnowledgeJobPayload>) {
    const entityId = 'entityId' in job.data ? job.data.entityId : undefined;
    return this.processingService.processReadme(
      job.data.repositoryId,
      entityId,
      { force: job.data.force },
    );
  }
}

@Processor(KNOWLEDGE_QUEUES.CHUNK_GENERATION, {
  concurrency: DEFAULT_KNOWLEDGE_LIMITS.workerConcurrency,
})
export class ChunkGenerationProcessor extends KnowledgeProcessor {
  protected readonly queueName = KNOWLEDGE_QUEUES.CHUNK_GENERATION;

  constructor(
    private readonly chunkGeneration: ChunkGenerationService,
    private readonly aiBridge: KnowledgeAiBridgeService,
    queueService: KnowledgeQueueService,
  ) {
    super(queueService, ChunkGenerationProcessor.name);
  }

  async process(job: Job<KnowledgeChunkJobPayload>) {
    const result = await this.chunkGeneration.generateForDocument(
      job.data.documentKind,
      job.data.documentId,
      { force: job.data.force },
    );

    await this.aiBridge.enqueueAfterChunkGeneration({
      workspaceId: result.workspaceId,
      repositoryId: result.repositoryId,
      documentId: result.documentId,
      documentKind: result.documentKind,
      sourceType: result.sourceType,
    });

    return result;
  }
}

@Processor(KNOWLEDGE_QUEUES.DEAD_LETTER, { concurrency: 1 })
export class KnowledgeDeadLetterProcessor extends WorkerHost {
  private readonly logger = new Logger(KnowledgeDeadLetterProcessor.name);

  process(
    job: Job<KnowledgeDeadLetterPayload>,
  ): Promise<{ recorded: boolean }> {
    this.logger.error(
      `Knowledge dead-letter: queue=${job.data.sourceQueue} job=${job.data.jobName} error=${job.data.error}`,
    );
    return Promise.resolve({ recorded: true });
  }
}
