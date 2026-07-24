import { Injectable, NotFoundException } from '@nestjs/common';
import { EmbeddingStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { createEmbeddingProvider } from '../providers/embedding-provider.factory';
import { ConfigService } from '@nestjs/config';
import { EmbeddingQueueService } from '../jobs/embedding-queue.service';
import type { EmbeddingJobPayload } from '../interfaces/embeddings.interfaces';

@Injectable()
export class EmbeddingQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly queue: EmbeddingQueueService,
  ) {}

  async getRepositoryStatus(repositoryId: string) {
    const [totalChunks, byStatus, queues] = await Promise.all([
      this.prisma.knowledgeChunk.count({
        where: { repositoryId, deletedAt: null },
      }),
      this.prisma.embedding.groupBy({
        by: ['status'],
        where: { knowledgeChunk: { repositoryId, deletedAt: null } },
        _count: { _all: true },
      }),
      this.queue.getQueueCounts(),
    ]);

    const statusMap = Object.fromEntries(
      byStatus.map((row) => [row.status, row._count._all]),
    ) as Partial<Record<EmbeddingStatus, number>>;

    const completed = statusMap.COMPLETED ?? 0;
    const pending =
      totalChunks -
      (statusMap.COMPLETED ?? 0) -
      (statusMap.FAILED ?? 0) -
      (statusMap.PROCESSING ?? 0) -
      (statusMap.SKIPPED ?? 0);

    return {
      repositoryId,
      totalChunks,
      embedded: completed,
      pending: Math.max(0, pending),
      failed: statusMap.FAILED ?? 0,
      processing: statusMap.PROCESSING ?? 0,
      skipped: statusMap.SKIPPED ?? 0,
      deleted: statusMap.DELETED ?? 0,
      queues,
    };
  }

  async getJob(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Embedding job ${jobId} not found`);
    }
    const state = await job.getState();
    return {
      id: job.id,
      name: job.name,
      state,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      data: job.data as EmbeddingJobPayload,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      returnvalue: job.returnvalue as unknown,
    };
  }

  async getStatistics(workspaceId?: string) {
    const where = workspaceId
      ? { knowledgeChunk: { workspaceId, deletedAt: null } }
      : { knowledgeChunk: { deletedAt: null } };

    const [byStatus, latency, providers, queues] = await Promise.all([
      this.prisma.embedding.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.embedding.aggregate({
        where: { ...where, status: EmbeddingStatus.COMPLETED },
        _avg: { latencyMs: true },
        _sum: { tokenUsage: true },
      }),
      this.prisma.embedding.groupBy({
        by: ['provider'],
        where: { ...where, status: EmbeddingStatus.COMPLETED },
        _count: { _all: true },
      }),
      this.queue.getQueueCounts(),
    ]);

    const completed =
      byStatus.find((s) => s.status === EmbeddingStatus.COMPLETED)?._count
        ._all ?? 0;
    const skipped =
      byStatus.find((s) => s.status === EmbeddingStatus.SKIPPED)?._count._all ??
      0;
    const cacheHitRatio =
      completed + skipped > 0 ? skipped / (completed + skipped) : 0;

    return {
      workspaceId: workspaceId ?? null,
      byStatus: Object.fromEntries(
        byStatus.map((row) => [row.status, row._count._all]),
      ),
      averageLatencyMs: latency._avg.latencyMs ?? 0,
      tokenUsage: latency._sum.tokenUsage ?? 0,
      providerUsage: Object.fromEntries(
        providers.map((row) => [row.provider, row._count._all]),
      ),
      cacheHitRatio,
      queues,
    };
  }

  async providersStatus() {
    const names = [
      'groq',
      'gemini',
      'openai',
      'voyage',
      'nomic',
      'local',
      'mock',
    ] as const;
    const results = [];
    for (const name of names) {
      const provider = createEmbeddingProvider(this.config, name);
      const health = await provider.health();
      results.push({
        provider: name,
        model: provider.model(),
        dimensions: provider.dimensions(),
        ...health,
      });
    }
    return results;
  }
}
