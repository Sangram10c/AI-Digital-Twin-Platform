import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AiKnowledgeQueueService } from '../jobs/ai-knowledge-queue.service';
import { unknownToString } from '../utils/json.util';

@Injectable()
export class AiKnowledgeQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: AiKnowledgeQueueService,
  ) {}

  async getStatus(workspaceId: string) {
    const sources = await this.prisma.knowledgeSource.findMany({
      where: { workspaceId },
      select: { metadata: true },
      take: 1000,
      orderBy: { updatedAt: 'desc' },
    });
    const counts: Record<string, number> = {};
    for (const source of sources) {
      const metadata =
        source.metadata && typeof source.metadata === 'object'
          ? (source.metadata as Record<string, unknown>)
          : {};
      const extraction =
        metadata.aiExtraction && typeof metadata.aiExtraction === 'object'
          ? (metadata.aiExtraction as Record<string, unknown>)
          : {};
      const status = unknownToString(extraction.status, 'NOT_STARTED');
      counts[status] = (counts[status] ?? 0) + 1;
    }

    return {
      workspaceId,
      statuses: counts,
      queues: await this.queueService.getQueueCounts(),
    };
  }

  async getStatistics(workspaceId: string) {
    const [sources, docs, chunks, repositories] = await Promise.all([
      this.prisma.knowledgeSource.findMany({
        where: { workspaceId },
        select: { metadata: true },
        take: 2000,
      }),
      this.prisma.documentation.count({
        where: { repository: { workspaceId } },
      }),
      this.prisma.knowledgeChunk.count({
        where: { workspaceId, deletedAt: null },
      }),
      this.prisma.repository.count({ where: { workspaceId, deletedAt: null } }),
    ]);

    let completed = 0;
    let skipped = 0;
    let failed = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    for (const source of sources) {
      const extraction =
        source.metadata &&
        typeof source.metadata === 'object' &&
        typeof (source.metadata as Record<string, unknown>).aiExtraction ===
          'object'
          ? ((source.metadata as Record<string, unknown>)
              .aiExtraction as Record<string, unknown>)
          : null;
      if (!extraction) continue;
      const status = unknownToString(extraction.status);
      if (status === 'COMPLETED') completed += 1;
      if (status === 'SKIPPED') skipped += 1;
      if (status === 'FAILED') failed += 1;
      if (typeof extraction.latencyMs === 'number') {
        totalLatency += extraction.latencyMs;
        latencyCount += 1;
      }
    }

    return {
      workspaceId,
      totals: {
        repositories,
        documentationFiles: docs,
        knowledgeSources: sources.length,
        knowledgeChunks: chunks,
        completed,
        skipped,
        failed,
      },
      avgLatencyMs:
        latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0,
      queues: await this.queueService.getQueueCounts(),
    };
  }

  async getJobs() {
    return this.queueService.getQueueCounts();
  }
}
