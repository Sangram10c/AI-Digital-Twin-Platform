import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  AI_KNOWLEDGE_JOBS,
  AI_KNOWLEDGE_LIMITS,
  AI_KNOWLEDGE_QUEUES,
} from '../constants/ai-knowledge.constants';
import {
  AiKnowledgeJobPayload,
  AiRetryJobPayload,
} from '../interfaces/ai-knowledge.interfaces';
import { AiKnowledgeQueueService } from '../jobs/ai-knowledge-queue.service';
import { AiKnowledgeExtractionService } from '../services/ai-knowledge-extraction.service';

abstract class BaseAiKnowledgeProcessor extends WorkerHost {
  protected readonly logger: Logger;
  protected abstract readonly queueName: string;
  protected abstract readonly analysisKind:
    'repository' | 'commit' | 'pull_request' | 'issue' | 'document';

  constructor(
    protected readonly extraction: AiKnowledgeExtractionService,
    protected readonly queueService: AiKnowledgeQueueService,
    context: string,
  ) {
    super();
    this.logger = new Logger(context);
  }

  async process(job: Job<AiKnowledgeJobPayload>) {
    const targetId = job.data.documentId ?? job.data.documentationId;
    if (!targetId) {
      throw new Error(`AI job ${job.name} missing target document id`);
    }
    return this.extraction.analyze(this.analysisKind, targetId, {
      provider: job.data.provider,
      force: job.data.force,
    });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<AiKnowledgeJobPayload> | undefined, error: Error) {
    if (!job) return;
    const attempts = job.opts.attempts ?? AI_KNOWLEDGE_LIMITS.maxRetries;
    if (job.attemptsMade >= attempts) {
      await this.queueService.enqueueRetry({
        ...job.data,
        jobName: job.name,
        originalQueue: this.queueName,
        retryCount: 0,
        error: error.message,
      });
    }
  }
}

@Processor(AI_KNOWLEDGE_QUEUES.REPOSITORY, {
  concurrency: AI_KNOWLEDGE_LIMITS.workerConcurrency,
})
export class AiRepositoryAnalysisProcessor extends BaseAiKnowledgeProcessor {
  protected readonly queueName = AI_KNOWLEDGE_QUEUES.REPOSITORY;
  protected readonly analysisKind = 'repository' as const;

  constructor(
    extraction: AiKnowledgeExtractionService,
    queueService: AiKnowledgeQueueService,
  ) {
    super(extraction, queueService, AiRepositoryAnalysisProcessor.name);
  }
}

@Processor(AI_KNOWLEDGE_QUEUES.COMMIT, {
  concurrency: AI_KNOWLEDGE_LIMITS.workerConcurrency,
})
export class AiCommitAnalysisProcessor extends BaseAiKnowledgeProcessor {
  protected readonly queueName = AI_KNOWLEDGE_QUEUES.COMMIT;
  protected readonly analysisKind = 'commit' as const;

  constructor(
    extraction: AiKnowledgeExtractionService,
    queueService: AiKnowledgeQueueService,
  ) {
    super(extraction, queueService, AiCommitAnalysisProcessor.name);
  }
}

@Processor(AI_KNOWLEDGE_QUEUES.PULL_REQUEST, {
  concurrency: AI_KNOWLEDGE_LIMITS.workerConcurrency,
})
export class AiPullRequestAnalysisProcessor extends BaseAiKnowledgeProcessor {
  protected readonly queueName = AI_KNOWLEDGE_QUEUES.PULL_REQUEST;
  protected readonly analysisKind = 'pull_request' as const;

  constructor(
    extraction: AiKnowledgeExtractionService,
    queueService: AiKnowledgeQueueService,
  ) {
    super(extraction, queueService, AiPullRequestAnalysisProcessor.name);
  }
}

@Processor(AI_KNOWLEDGE_QUEUES.ISSUE, {
  concurrency: AI_KNOWLEDGE_LIMITS.workerConcurrency,
})
export class AiIssueAnalysisProcessor extends BaseAiKnowledgeProcessor {
  protected readonly queueName = AI_KNOWLEDGE_QUEUES.ISSUE;
  protected readonly analysisKind = 'issue' as const;

  constructor(
    extraction: AiKnowledgeExtractionService,
    queueService: AiKnowledgeQueueService,
  ) {
    super(extraction, queueService, AiIssueAnalysisProcessor.name);
  }
}

@Processor(AI_KNOWLEDGE_QUEUES.DOCUMENT, {
  concurrency: AI_KNOWLEDGE_LIMITS.workerConcurrency,
})
export class AiDocumentAnalysisProcessor extends BaseAiKnowledgeProcessor {
  protected readonly queueName = AI_KNOWLEDGE_QUEUES.DOCUMENT;
  protected readonly analysisKind = 'document' as const;

  constructor(
    extraction: AiKnowledgeExtractionService,
    queueService: AiKnowledgeQueueService,
  ) {
    super(extraction, queueService, AiDocumentAnalysisProcessor.name);
  }
}

@Processor(AI_KNOWLEDGE_QUEUES.RETRY, { concurrency: 1 })
export class AiRetryProcessor extends WorkerHost {
  constructor(private readonly queueService: AiKnowledgeQueueService) {
    super();
  }

  async process(job: Job<AiRetryJobPayload>) {
    const nextRetryCount = job.data.retryCount + 1;
    if (nextRetryCount > AI_KNOWLEDGE_LIMITS.maxProviderFailovers) {
      await this.queueService.enqueueDeadLetter(job.data);
      return { deadLettered: true };
    }

    const payload = {
      workspaceId: job.data.workspaceId,
      repositoryId: job.data.repositoryId,
      documentId: job.data.documentId,
      documentationId: job.data.documentationId,
      provider: undefined,
      force: true,
      trigger: `retry:${nextRetryCount}`,
    };

    switch (job.data.jobName) {
      case AI_KNOWLEDGE_JOBS.ANALYZE_REPOSITORY:
        await this.queueService.enqueueRepository(payload);
        break;
      case AI_KNOWLEDGE_JOBS.ANALYZE_COMMIT:
        await this.queueService.enqueueCommit(payload);
        break;
      case AI_KNOWLEDGE_JOBS.ANALYZE_PULL_REQUEST:
        await this.queueService.enqueuePullRequest(payload);
        break;
      case AI_KNOWLEDGE_JOBS.ANALYZE_ISSUE:
        await this.queueService.enqueueIssue(payload);
        break;
      default:
        await this.queueService.enqueueDocument(payload);
        break;
    }

    return { retried: true, retryCount: nextRetryCount };
  }
}

@Processor(AI_KNOWLEDGE_QUEUES.DEAD_LETTER, { concurrency: 1 })
export class AiDeadLetterProcessor extends WorkerHost {
  private readonly logger = new Logger(AiDeadLetterProcessor.name);

  process(job: Job<AiRetryJobPayload>): Promise<{ stored: boolean }> {
    this.logger.error(
      `AI dead-letter queue=${job.data.originalQueue} job=${job.data.jobName} error=${job.data.error}`,
    );
    return Promise.resolve({ stored: true });
  }
}
