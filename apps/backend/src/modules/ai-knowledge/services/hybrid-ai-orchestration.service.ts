import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AIExtractionMode } from '../constants/hybrid-pipeline.constants';
import type { SupportedAiProvider } from '../interfaces/ai-knowledge.interfaces';
import { HybridPipelineQueueService } from '../jobs/hybrid-pipeline-queue.service';
import { HybridAiPipelineService } from './hybrid-ai-pipeline.service';
import { AiProviderFallbackService } from '../providers/ai-provider-fallback.service';

@Injectable()
export class HybridAiOrchestrationService {
  private readonly logger = new Logger(HybridAiOrchestrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: HybridPipelineQueueService,
    private readonly pipeline: HybridAiPipelineService,
    private readonly providerFallback: AiProviderFallbackService,
  ) {}

  async enqueueWorkspace(
    workspaceId: string,
    options: {
      mode?: string;
      provider?: SupportedAiProvider;
      force?: boolean;
      sync?: boolean;
    } = {},
  ) {
    const repositories = await this.prisma.repository.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true },
    });
    const mode = this.pipeline.resolveMode(options.mode);
    const jobs = [];
    for (const repository of repositories) {
      jobs.push(
        await this.enqueueRepository(repository.id, workspaceId, {
          ...options,
          mode,
        }),
      );
    }
    return {
      workspaceId,
      mode,
      repositoryCount: repositories.length,
      jobs,
    };
  }

  async enqueueRepository(
    repositoryId: string,
    workspaceId: string,
    options: {
      mode?: string | AIExtractionMode;
      provider?: SupportedAiProvider;
      force?: boolean;
      sync?: boolean;
    } = {},
  ) {
    const repository = await this.prisma.repository.findFirst({
      where: { id: repositoryId, workspaceId, deletedAt: null },
    });
    if (!repository) {
      throw new NotFoundException('Repository not found in workspace');
    }

    const mode = this.pipeline.resolveMode(options.mode);

    if (options.sync) {
      const result = await this.pipeline.runForRepository({
        repositoryId,
        workspaceId,
        mode,
        provider: options.provider,
        force: options.force,
      });
      return { mode: 'sync', result };
    }

    const job = await this.queue.enqueuePipeline({
      workspaceId,
      repositoryId,
      mode,
      provider: options.provider,
      force: options.force,
      trigger: 'api:hybrid-extract',
    });

    this.logger.log(
      `Enqueued hybrid pipeline job=${job.id} repo=${repositoryId} mode=${mode}`,
    );
    return {
      mode: 'async',
      jobId: job.id,
      extractionMode: mode,
      repositoryId,
      workspaceId,
    };
  }

  listProviders() {
    return this.providerFallback.getProvidersStatus();
  }

  providersStatus() {
    return this.providerFallback.getProvidersStatus();
  }

  testProvider(provider: SupportedAiProvider) {
    return this.providerFallback.testProvider(provider);
  }

  async listDigests(workspaceId: string, repositoryId?: string) {
    const where = {
      workspaceId,
      ...(repositoryId ? { repositoryId } : {}),
    };
    const [repository, modules, pullRequests, documentation, releases] =
      await Promise.all([
        this.prisma.repositoryDigest.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            repositoryId: true,
            title: true,
            contentChecksum: true,
            version: true,
            entityCount: true,
            updatedAt: true,
          },
        }),
        this.prisma.moduleDigest.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          take: 100,
          select: {
            id: true,
            repositoryId: true,
            moduleKey: true,
            title: true,
            contentChecksum: true,
            version: true,
            updatedAt: true,
          },
        }),
        this.prisma.pullRequestDigest.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          take: 100,
          select: {
            id: true,
            repositoryId: true,
            batchKey: true,
            title: true,
            entityCount: true,
            contentChecksum: true,
            updatedAt: true,
          },
        }),
        this.prisma.documentationDigest.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          take: 100,
          select: {
            id: true,
            repositoryId: true,
            docKey: true,
            title: true,
            contentChecksum: true,
            updatedAt: true,
          },
        }),
        this.prisma.releaseDigest.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          take: 100,
          select: {
            id: true,
            repositoryId: true,
            releaseKey: true,
            title: true,
            contentChecksum: true,
            updatedAt: true,
          },
        }),
      ]);

    return {
      workspaceId,
      repositoryId: repositoryId ?? null,
      digests: {
        repository,
        modules,
        pullRequests,
        documentation,
        releases,
      },
    };
  }

  async getHybridJobs() {
    return this.queue.getQueueCounts();
  }

  async getHybridMonitoring(workspaceId: string) {
    const [logs, analyses, failures, heuristics] = await Promise.all([
      this.prisma.aIExecutionLog.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.aIAnalysis.groupBy({
        by: ['status'],
        where: { workspaceId },
        _count: true,
      }),
      this.prisma.providerFailure.count({ where: { workspaceId } }),
      this.prisma.heuristicMetadata.count({ where: { workspaceId } }),
    ]);

    const totals = logs.reduce(
      (acc, log) => {
        acc.apiCalls += log.apiCalls;
        acc.fallbackCount += log.fallbackCount;
        acc.digestCacheHits += log.digestCacheHits;
        acc.failedProviders += log.failedProviders;
        acc.averageAiTimeMs += log.averageAiTimeMs;
        return acc;
      },
      {
        apiCalls: 0,
        fallbackCount: 0,
        digestCacheHits: 0,
        failedProviders: 0,
        averageAiTimeMs: 0,
      },
    );

    return {
      workspaceId,
      heuristicRepositories: heuristics,
      providerFailures: failures,
      analysisByStatus: analyses,
      recentExecution: logs.slice(0, 10),
      aggregates: {
        ...totals,
        averageAiTimeMs:
          logs.length > 0
            ? Math.round(totals.averageAiTimeMs / logs.length)
            : 0,
      },
      queues: await this.queue.getQueueCounts(),
    };
  }
}
