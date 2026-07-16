import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  DEFAULT_WEBHOOK_LIMITS,
  WEBHOOK_JOBS,
  WEBHOOK_QUEUES,
} from '../constants/webhook.constants';
import {
  DomainQueueName,
  WebhookJobPayload,
} from '../interfaces/webhook.interfaces';

@Injectable()
export class WebhookQueueService {
  private readonly logger = new Logger(WebhookQueueService.name);

  constructor(
    @InjectQueue(WEBHOOK_QUEUES.WEBHOOK) private readonly webhookQueue: Queue,
    @InjectQueue(WEBHOOK_QUEUES.REPOSITORY_SYNC)
    private readonly repositorySyncQueue: Queue,
    @InjectQueue(WEBHOOK_QUEUES.COMMIT_SYNC)
    private readonly commitSyncQueue: Queue,
    @InjectQueue(WEBHOOK_QUEUES.PR_SYNC) private readonly prSyncQueue: Queue,
    @InjectQueue(WEBHOOK_QUEUES.ISSUE_SYNC)
    private readonly issueSyncQueue: Queue,
    @InjectQueue(WEBHOOK_QUEUES.RELEASE_SYNC)
    private readonly releaseSyncQueue: Queue,
    @InjectQueue(WEBHOOK_QUEUES.STATISTICS)
    private readonly statisticsQueue: Queue,
    @InjectQueue(WEBHOOK_QUEUES.DEAD_LETTER)
    private readonly deadLetterQueue: Queue,
  ) {}

  private defaultJobOptions() {
    return {
      attempts: DEFAULT_WEBHOOK_LIMITS.maxRetries,
      backoff: {
        type: 'exponential' as const,
        delay: DEFAULT_WEBHOOK_LIMITS.backoffDelayMs,
      },
      removeOnComplete: 200,
      removeOnFail: 500,
    };
  }

  private queueByName(name: DomainQueueName): Queue {
    switch (name) {
      case WEBHOOK_QUEUES.WEBHOOK:
        return this.webhookQueue;
      case WEBHOOK_QUEUES.REPOSITORY_SYNC:
        return this.repositorySyncQueue;
      case WEBHOOK_QUEUES.COMMIT_SYNC:
        return this.commitSyncQueue;
      case WEBHOOK_QUEUES.PR_SYNC:
        return this.prSyncQueue;
      case WEBHOOK_QUEUES.ISSUE_SYNC:
        return this.issueSyncQueue;
      case WEBHOOK_QUEUES.RELEASE_SYNC:
        return this.releaseSyncQueue;
      case WEBHOOK_QUEUES.STATISTICS:
        return this.statisticsQueue;
      case WEBHOOK_QUEUES.DEAD_LETTER:
        return this.deadLetterQueue;
      default:
        return this.webhookQueue;
    }
  }

  async enqueueWebhookProcessing(payload: WebhookJobPayload) {
    const job = await this.webhookQueue.add(
      WEBHOOK_JOBS.PROCESS_EVENT,
      payload,
      {
        ...this.defaultJobOptions(),
        jobId: `webhook:${payload.deliveryId}`,
      },
    );
    this.logger.debug(`Enqueued webhook job ${job.id}`);
    return job;
  }

  async enqueueDomainJob(
    queueName: DomainQueueName,
    jobName: string,
    payload: WebhookJobPayload,
  ) {
    const queue = this.queueByName(queueName);
    const job = await queue.add(jobName, payload, {
      ...this.defaultJobOptions(),
      jobId: `${queueName}:${payload.deliveryId}`,
    });
    return job;
  }

  async enqueueDeadLetter(
    payload: WebhookJobPayload & {
      error: string;
      attemptsMade: number;
      sourceQueue: string;
    },
  ) {
    return this.deadLetterQueue.add(WEBHOOK_JOBS.DEAD_LETTER, payload, {
      removeOnComplete: 1_000,
      removeOnFail: 1_000,
    });
  }

  async getQueueCounts() {
    const names = Object.values(WEBHOOK_QUEUES);
    const counts: Record<
      string,
      Awaited<ReturnType<Queue['getJobCounts']>>
    > = {};
    for (const name of names) {
      counts[name] = await this.queueByName(name).getJobCounts(
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
