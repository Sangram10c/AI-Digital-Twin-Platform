import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  DEFAULT_WEBHOOK_LIMITS,
  WEBHOOK_QUEUES,
} from '../constants/webhook.constants';
import { WebhookJobPayload } from '../interfaces/webhook.interfaces';
import { WebhookQueueService } from '../jobs/webhook-queue.service';
import { WebhookKnowledgeBridgeService } from '../services/webhook-knowledge-bridge.service';
import { WebhookPayloadSyncService } from '../services/webhook-payload-sync.service';

abstract class DomainSyncProcessor extends WorkerHost {
  protected abstract readonly queueName: string;
  protected readonly logger: Logger;

  constructor(
    protected readonly payloadSync: WebhookPayloadSyncService,
    protected readonly queueService: WebhookQueueService,
    protected readonly knowledgeBridge: WebhookKnowledgeBridgeService,
    loggerContext: string,
  ) {
    super();
    this.logger = new Logger(loggerContext);
  }

  async process(job: Job<WebhookJobPayload>): Promise<unknown> {
    this.logger.log(
      `Processing ${job.data.githubEvent} for webhook ${job.data.webhookEventId}`,
    );
    await this.payloadSync.processDomainJob(job.data);
    await this.knowledgeBridge.enqueueFromWebhook(job.data);
    return { ok: true, knowledgeEnqueued: true };
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<WebhookJobPayload> | undefined, error: Error) {
    if (!job) return;
    const attempts = job.opts.attempts ?? DEFAULT_WEBHOOK_LIMITS.maxRetries;
    if (job.attemptsMade >= attempts) {
      await this.queueService.enqueueDeadLetter({
        ...job.data,
        error: error.message,
        attemptsMade: job.attemptsMade,
        sourceQueue: this.queueName,
      });
    }
  }
}

@Processor(WEBHOOK_QUEUES.COMMIT_SYNC, {
  concurrency: DEFAULT_WEBHOOK_LIMITS.workerConcurrency,
})
export class CommitSyncProcessor extends DomainSyncProcessor {
  protected readonly queueName = WEBHOOK_QUEUES.COMMIT_SYNC;

  constructor(
    payloadSync: WebhookPayloadSyncService,
    queueService: WebhookQueueService,
    knowledgeBridge: WebhookKnowledgeBridgeService,
  ) {
    super(payloadSync, queueService, knowledgeBridge, CommitSyncProcessor.name);
  }
}

@Processor(WEBHOOK_QUEUES.PR_SYNC, {
  concurrency: DEFAULT_WEBHOOK_LIMITS.workerConcurrency,
})
export class PullRequestSyncProcessor extends DomainSyncProcessor {
  protected readonly queueName = WEBHOOK_QUEUES.PR_SYNC;

  constructor(
    payloadSync: WebhookPayloadSyncService,
    queueService: WebhookQueueService,
    knowledgeBridge: WebhookKnowledgeBridgeService,
  ) {
    super(
      payloadSync,
      queueService,
      knowledgeBridge,
      PullRequestSyncProcessor.name,
    );
  }
}

@Processor(WEBHOOK_QUEUES.ISSUE_SYNC, {
  concurrency: DEFAULT_WEBHOOK_LIMITS.workerConcurrency,
})
export class IssueSyncProcessor extends DomainSyncProcessor {
  protected readonly queueName = WEBHOOK_QUEUES.ISSUE_SYNC;

  constructor(
    payloadSync: WebhookPayloadSyncService,
    queueService: WebhookQueueService,
    knowledgeBridge: WebhookKnowledgeBridgeService,
  ) {
    super(payloadSync, queueService, knowledgeBridge, IssueSyncProcessor.name);
  }
}

@Processor(WEBHOOK_QUEUES.RELEASE_SYNC, {
  concurrency: DEFAULT_WEBHOOK_LIMITS.workerConcurrency,
})
export class ReleaseSyncProcessor extends DomainSyncProcessor {
  protected readonly queueName = WEBHOOK_QUEUES.RELEASE_SYNC;

  constructor(
    payloadSync: WebhookPayloadSyncService,
    queueService: WebhookQueueService,
    knowledgeBridge: WebhookKnowledgeBridgeService,
  ) {
    super(
      payloadSync,
      queueService,
      knowledgeBridge,
      ReleaseSyncProcessor.name,
    );
  }
}

@Processor(WEBHOOK_QUEUES.REPOSITORY_SYNC, {
  concurrency: DEFAULT_WEBHOOK_LIMITS.workerConcurrency,
})
export class RepositorySyncFromWebhookProcessor extends DomainSyncProcessor {
  protected readonly queueName = WEBHOOK_QUEUES.REPOSITORY_SYNC;

  constructor(
    payloadSync: WebhookPayloadSyncService,
    queueService: WebhookQueueService,
    knowledgeBridge: WebhookKnowledgeBridgeService,
  ) {
    super(
      payloadSync,
      queueService,
      knowledgeBridge,
      RepositorySyncFromWebhookProcessor.name,
    );
  }
}

@Processor(WEBHOOK_QUEUES.STATISTICS, {
  concurrency: DEFAULT_WEBHOOK_LIMITS.workerConcurrency,
})
export class StatisticsSyncProcessor extends DomainSyncProcessor {
  protected readonly queueName = WEBHOOK_QUEUES.STATISTICS;

  constructor(
    payloadSync: WebhookPayloadSyncService,
    queueService: WebhookQueueService,
    knowledgeBridge: WebhookKnowledgeBridgeService,
  ) {
    super(
      payloadSync,
      queueService,
      knowledgeBridge,
      StatisticsSyncProcessor.name,
    );
  }
}

@Processor(WEBHOOK_QUEUES.DEAD_LETTER, { concurrency: 1 })
export class WebhookDeadLetterProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDeadLetterProcessor.name);

  async process(
    job: Job<
      WebhookJobPayload & {
        error: string;
        attemptsMade: number;
        sourceQueue: string;
      }
    >,
  ): Promise<unknown> {
    this.logger.error(
      `Dead letter: queue=${job.data.sourceQueue} delivery=${job.data.deliveryId} attempts=${job.data.attemptsMade} error=${job.data.error}`,
    );
    await Promise.resolve();
    return { stored: true };
  }
}
