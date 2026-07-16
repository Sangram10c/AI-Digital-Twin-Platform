import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  BackgroundJobType,
  JobStatus,
  Prisma,
  WebhookEventStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  GITHUB_DELIVERY_HEADER,
  GITHUB_EVENT_HEADER,
  GITHUB_HOOK_ID_HEADER,
  GITHUB_SIGNATURE_HEADER,
} from '../constants/webhook.constants';
import { mapGithubEventToType } from '../interfaces/webhook.interfaces';
import type { IngestWebhookResult } from '../interfaces/webhook.interfaces';
import { WebhookQueueService } from '../jobs/webhook-queue.service';
import { WebhookReplayGuardService } from '../services/webhook-replay-guard.service';
import { WebhookSignatureService } from '../services/webhook-signature.service';
import { WebhookTargetResolverService } from '../services/webhook-target-resolver.service';
import { WebhookMetricsService } from '../services/webhook-metrics.service';

@Injectable()
export class WebhookIngestionService {
  private readonly logger = new Logger(WebhookIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly signatureService: WebhookSignatureService,
    private readonly replayGuard: WebhookReplayGuardService,
    private readonly targetResolver: WebhookTargetResolverService,
    private readonly queueService: WebhookQueueService,
    private readonly metrics: WebhookMetricsService,
  ) {}

  async ingest(input: {
    rawBody: Buffer;
    headers: Record<string, string | string[] | undefined>;
    body: unknown;
    workspaceIdHint?: string;
    connectedAccountIdHint?: string;
  }): Promise<IngestWebhookResult> {
    const started = Date.now();
    const event = this.header(input.headers, GITHUB_EVENT_HEADER);
    const deliveryId = this.header(input.headers, GITHUB_DELIVERY_HEADER);
    const signature = this.header(input.headers, GITHUB_SIGNATURE_HEADER);
    const hookId = this.header(input.headers, GITHUB_HOOK_ID_HEADER);

    if (!event) {
      throw new BadRequestException(`Missing ${GITHUB_EVENT_HEADER} header`);
    }
    if (!deliveryId) {
      throw new BadRequestException(`Missing ${GITHUB_DELIVERY_HEADER} header`);
    }

    this.signatureService.verifySignature(input.rawBody, signature);

    if (this.replayGuard.hasSeen(deliveryId)) {
      this.metrics.recordDuplicate();
      return {
        accepted: true,
        duplicate: true,
        ignored: false,
        message: 'Duplicate delivery ignored (replay cache)',
      };
    }

    const existing = await this.prisma.webhookEvent.findFirst({
      where: { providerEventId: deliveryId },
      select: { id: true, status: true },
    });

    if (existing) {
      this.replayGuard.remember(deliveryId);
      this.metrics.recordDuplicate();
      return {
        accepted: true,
        duplicate: true,
        ignored: false,
        webhookEventId: existing.id,
        message: 'Duplicate delivery ignored (idempotent)',
      };
    }

    const payload = this.asObject(input.body);
    const providerRepositoryId = this.extractProviderRepositoryId(payload);

    let target;
    try {
      target = await this.targetResolver.resolve({
        providerRepositoryId,
        workspaceIdHint: input.workspaceIdHint,
        connectedAccountIdHint: input.connectedAccountIdHint,
      });
    } catch (error) {
      // Ping without repo + without hints: acknowledge so GitHub does not retry forever
      if (event === 'ping') {
        this.metrics.recordReceived();
        this.metrics.recordIgnored();
        return {
          accepted: true,
          duplicate: false,
          ignored: true,
          message:
            'Ping acknowledged without workspace binding (configure query params on webhook URL)',
        };
      }
      throw error;
    }

    const action =
      typeof payload.action === 'string' ? payload.action : undefined;

    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        workspaceId: target.workspaceId,
        connectedAccountId: target.connectedAccountId,
        providerEventId: deliveryId,
        eventType: mapGithubEventToType(event),
        action: action ?? null,
        payload: {
          githubEvent: event,
          hookId: hookId ?? null,
          repositoryId: target.repositoryId ?? null,
          providerRepositoryId: target.providerRepositoryId ?? null,
          body: payload as Prisma.InputJsonValue,
        },
        signatureValid: true,
        status:
          event === 'ping'
            ? WebhookEventStatus.IGNORED
            : WebhookEventStatus.PENDING,
        receivedAt: new Date(),
        processedAt: event === 'ping' ? new Date() : null,
      },
    });

    this.replayGuard.remember(deliveryId);
    this.metrics.recordReceived();

    if (event === 'ping') {
      this.metrics.recordIgnored();
      this.metrics.recordLatency(Date.now() - started);
      return {
        accepted: true,
        duplicate: false,
        ignored: true,
        webhookEventId: webhookEvent.id,
        message: 'Ping stored and ignored',
      };
    }

    const job = await this.queueService.enqueueWebhookProcessing({
      webhookEventId: webhookEvent.id,
      workspaceId: target.workspaceId,
      connectedAccountId: target.connectedAccountId,
      repositoryId: target.repositoryId,
      githubEvent: event,
      action,
      deliveryId,
    });

    await this.prisma.backgroundJob.create({
      data: {
        workspaceId: target.workspaceId,
        jobType: BackgroundJobType.WEBHOOK_PROCESSING,
        status: JobStatus.QUEUED,
        queueJobId: String(job.id),
        payload: {
          webhookEventId: webhookEvent.id,
          deliveryId,
          githubEvent: event,
        },
        scheduledAt: new Date(),
      },
    });

    this.metrics.recordLatency(Date.now() - started);
    this.logger.log(
      `Accepted webhook ${event} delivery=${deliveryId} eventId=${webhookEvent.id}`,
    );

    return {
      accepted: true,
      duplicate: false,
      ignored: false,
      webhookEventId: webhookEvent.id,
      jobId: String(job.id),
      message: 'Webhook accepted and queued',
    };
  }

  private header(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ): string | undefined {
    const value = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private asObject(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Webhook payload must be a JSON object');
    }
    return body as Record<string, unknown>;
  }

  private extractProviderRepositoryId(
    payload: Record<string, unknown>,
  ): string | undefined {
    const repository = payload.repository;
    if (repository && typeof repository === 'object') {
      const id = (repository as { id?: number | string }).id;
      if (id !== undefined && id !== null) {
        return String(id);
      }
    }
    return undefined;
  }
}
