import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { JobStatus, WebhookEventStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import {
  DEFAULT_WEBHOOK_LIMITS,
  WEBHOOK_QUEUES,
} from '../constants/webhook.constants';
import { WebhookEventRouterService } from '../handlers/webhook-event-router.service';
import { WebhookJobPayload } from '../interfaces/webhook.interfaces';
import { WebhookQueueService } from '../jobs/webhook-queue.service';
import { WebhookMetricsService } from '../services/webhook-metrics.service';

@Processor(WEBHOOK_QUEUES.WEBHOOK, {
  concurrency: DEFAULT_WEBHOOK_LIMITS.workerConcurrency,
})
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly router: WebhookEventRouterService,
    private readonly queueService: WebhookQueueService,
    private readonly prisma: PrismaService,
    private readonly metrics: WebhookMetricsService,
  ) {
    super();
  }

  async process(job: Job<WebhookJobPayload>): Promise<unknown> {
    const payload = job.data;
    this.logger.log(
      `Routing webhook ${payload.githubEvent} delivery=${payload.deliveryId}`,
    );

    await this.prisma.webhookEvent.update({
      where: { id: payload.webhookEventId },
      data: { status: WebhookEventStatus.PROCESSING },
    });

    const route = this.router.route(payload.githubEvent);
    if (!route) {
      await this.prisma.webhookEvent.update({
        where: { id: payload.webhookEventId },
        data: {
          status: WebhookEventStatus.IGNORED,
          processedAt: new Date(),
        },
      });
      this.metrics.recordIgnored();
      return { ignored: true, reason: 'No domain route for event' };
    }

    const domainJob = await this.queueService.enqueueDomainJob(
      route.queue,
      route.jobName,
      payload,
    );

    await this.prisma.backgroundJob.updateMany({
      where: {
        queueJobId: String(job.id),
      },
      data: {
        status: JobStatus.RUNNING,
        startedAt: new Date(),
        result: {
          routedTo: route.queue,
          domainJobId: String(domainJob.id),
          reason: route.reason,
        },
      },
    });

    return {
      routed: true,
      queue: route.queue,
      domainJobId: String(domainJob.id),
      reason: route.reason,
    };
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<WebhookJobPayload> | undefined, error: Error) {
    if (!job) return;
    this.logger.error(
      `Webhook job ${job.id} failed: ${error.message}`,
      error.stack,
    );

    const attempts = job.opts.attempts ?? DEFAULT_WEBHOOK_LIMITS.maxRetries;
    if (job.attemptsMade >= attempts) {
      await this.queueService.enqueueDeadLetter({
        ...job.data,
        error: error.message,
        attemptsMade: job.attemptsMade,
        sourceQueue: WEBHOOK_QUEUES.WEBHOOK,
      });
      await this.prisma.webhookEvent.update({
        where: { id: job.data.webhookEventId },
        data: {
          status: WebhookEventStatus.FAILED,
          errorMessage: `Poison message after ${job.attemptsMade} attempts: ${error.message}`,
        },
      });
      this.metrics.recordFailed();
    }
  }
}
