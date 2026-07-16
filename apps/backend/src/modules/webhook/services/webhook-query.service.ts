import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WebhookEventStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { WebhookMetricsService } from './webhook-metrics.service';
import { WebhookQueueService } from '../jobs/webhook-queue.service';

@Injectable()
export class WebhookQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: WebhookMetricsService,
    private readonly queueService: WebhookQueueService,
  ) {}

  async listEvents(input: {
    workspaceId: string;
    status?: WebhookEventStatus;
    limit?: number;
    offset?: number;
  }) {
    const take = Math.min(input.limit ?? 50, 100);
    const skip = input.offset ?? 0;

    const where: Prisma.WebhookEventWhereInput = {
      workspaceId: input.workspaceId,
      ...(input.status ? { status: input.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.webhookEvent.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          workspaceId: true,
          connectedAccountId: true,
          providerEventId: true,
          eventType: true,
          action: true,
          signatureValid: true,
          status: true,
          errorMessage: true,
          receivedAt: true,
          processedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.webhookEvent.count({ where }),
    ]);

    return { items, total, limit: take, offset: skip };
  }

  async getEvent(id: string, workspaceId?: string) {
    const event = await this.prisma.webhookEvent.findFirst({
      where: {
        id,
        ...(workspaceId ? { workspaceId } : {}),
      },
    });
    if (!event) {
      throw new NotFoundException('Webhook event not found');
    }
    return event;
  }

  async getStatistics(workspaceId?: string) {
    const where = workspaceId ? { workspaceId } : {};
    const [byStatus, recentFailed, processedSample] = await Promise.all([
      this.prisma.webhookEvent.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.webhookEvent.count({
        where: { ...where, status: WebhookEventStatus.FAILED },
      }),
      this.prisma.webhookEvent.findMany({
        where: {
          ...where,
          processedAt: { not: null },
        },
        select: { receivedAt: true, processedAt: true },
        take: 500,
        orderBy: { receivedAt: 'desc' },
      }),
    ]);

    const durations = processedSample
      .filter((row) => row.processedAt)
      .map((row) => row.processedAt!.getTime() - row.receivedAt.getTime());
    const averageProcessingTimeMs =
      durations.length === 0
        ? 0
        : Math.round(
            durations.reduce((sum, ms) => sum + ms, 0) / durations.length,
          );

    const queueLengths = await this.queueService.getQueueCounts();
    const runtime = this.metrics.snapshot();

    return {
      workspaceId: workspaceId ?? null,
      byStatus: Object.fromEntries(
        byStatus.map((row) => [row.status, row._count._all]),
      ),
      failedEvents: recentFailed,
      averageProcessingTimeMs,
      runtimeCounters: runtime,
      queueLengths,
    };
  }
}
