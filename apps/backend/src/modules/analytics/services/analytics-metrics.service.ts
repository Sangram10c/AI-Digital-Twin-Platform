import { Injectable } from '@nestjs/common';
import {
  HEALTH_STATUS,
  HEALTH_THRESHOLDS,
  HealthStatusType,
} from '../constants/analytics.constants';
import {
  ComponentHealthIndicator,
  SystemHealthMetrics,
} from '../interfaces/analytics-metrics.interface';
import { AnalyticsRepositoryService } from './analytics-repository.service';

@Injectable()
export class AnalyticsMetricsService {
  constructor(private readonly repoService: AnalyticsRepositoryService) {}

  /**
   * Evaluates end-to-end health for a workspace.
   */
  async evaluateSystemHealth(
    workspaceId: string,
    repositoryId?: string,
  ): Promise<SystemHealthMetrics> {
    const [
      repoMetrics,
      knowledgeMetrics,
      searchMetrics,
      aiMetrics,
      jobMetrics,
    ] = await Promise.all([
      this.repoService.getRepositoryMetrics(workspaceId, repositoryId),
      this.repoService.getKnowledgeMetrics(workspaceId, repositoryId),
      this.repoService.getSearchMetrics(workspaceId, repositoryId),
      this.repoService.getAiMetrics(workspaceId, repositoryId),
      this.repoService.getJobMetrics(workspaceId),
    ]);

    const repoSyncHealth = this.evaluateRepositorySync(repoMetrics);
    const embeddingHealth = this.evaluateEmbeddingPipeline(knowledgeMetrics);
    const searchHealth = this.evaluateSearch(searchMetrics);
    const aiHealth = this.evaluateAiProviders(aiMetrics);
    const queueHealth = this.evaluateQueue(jobMetrics);
    const knowledgeHealth = this.evaluateKnowledgeCoverage(knowledgeMetrics);

    const components = {
      repositorySync: repoSyncHealth,
      embeddingPipeline: embeddingHealth,
      hybridSearch: searchHealth,
      aiProviders: aiHealth,
      bullmqQueues: queueHealth,
      knowledgeCoverage: knowledgeHealth,
    };

    const componentStatuses = Object.values(components).map((c) => c.status);
    let overallStatus: HealthStatusType = HEALTH_STATUS.HEALTHY;

    if (componentStatuses.includes(HEALTH_STATUS.CRITICAL)) {
      overallStatus = HEALTH_STATUS.CRITICAL;
    } else if (componentStatuses.includes(HEALTH_STATUS.DEGRADED)) {
      overallStatus = HEALTH_STATUS.DEGRADED;
    }

    return {
      overallStatus,
      components,
      generatedAt: new Date(),
    };
  }

  private evaluateRepositorySync(metrics: {
    staleRepositoryCount: number;
    syncFailureCount: number;
    syncSuccessRate: number;
  }): ComponentHealthIndicator {
    let status: HealthStatusType = HEALTH_STATUS.HEALTHY;
    let message = 'Repository sync is operating normally';

    if (
      metrics.staleRepositoryCount > 5 ||
      metrics.syncSuccessRate <
        (1 - HEALTH_THRESHOLDS.REPOSITORY_SYNC.FAILURE_RATE_CRITICAL) * 100
    ) {
      status = HEALTH_STATUS.CRITICAL;
      message = `Critical sync issues: ${metrics.staleRepositoryCount} stale repos, ${metrics.syncFailureCount} failed syncs`;
    } else if (
      metrics.staleRepositoryCount > 0 ||
      metrics.syncSuccessRate <
        (1 - HEALTH_THRESHOLDS.REPOSITORY_SYNC.FAILURE_RATE_DEGRADED) * 100
    ) {
      status = HEALTH_STATUS.DEGRADED;
      message = `Degraded sync performance: ${metrics.staleRepositoryCount} stale repositories`;
    }

    return {
      component: 'Repository Synchronization',
      status,
      message,
      details: {
        staleRepositories: metrics.staleRepositoryCount,
        syncSuccessRate: metrics.syncSuccessRate,
        failures: metrics.syncFailureCount,
      },
      lastCheckedAt: new Date(),
    };
  }

  private evaluateEmbeddingPipeline(metrics: {
    failedChunks: number;
    pendingChunks: number;
    totalChunks: number;
  }): ComponentHealthIndicator {
    let status: HealthStatusType = HEALTH_STATUS.HEALTHY;
    let message = 'Embedding pipeline is healthy';

    const failRate =
      metrics.totalChunks > 0 ? metrics.failedChunks / metrics.totalChunks : 0;

    if (
      failRate > HEALTH_THRESHOLDS.EMBEDDING.FAILED_RATE_CRITICAL ||
      metrics.pendingChunks >
        HEALTH_THRESHOLDS.EMBEDDING.PENDING_BACKLOG_CRITICAL
    ) {
      status = HEALTH_STATUS.CRITICAL;
      message = `Critical embedding failure rate: ${(failRate * 100).toFixed(1)}%, backlog: ${metrics.pendingChunks}`;
    } else if (
      failRate > HEALTH_THRESHOLDS.EMBEDDING.FAILED_RATE_DEGRADED ||
      metrics.pendingChunks >
        HEALTH_THRESHOLDS.EMBEDDING.PENDING_BACKLOG_DEGRADED
    ) {
      status = HEALTH_STATUS.DEGRADED;
      message = `Embedding pipeline backlog: ${metrics.pendingChunks} chunks pending`;
    }

    return {
      component: 'Embedding Pipeline',
      status,
      message,
      details: {
        failedChunks: metrics.failedChunks,
        pendingBacklog: metrics.pendingChunks,
        failureRate: Math.round(failRate * 10000) / 100,
      },
      lastCheckedAt: new Date(),
    };
  }

  private evaluateSearch(metrics: {
    zeroResultRate: number;
    averageLatencyMs: number;
  }): ComponentHealthIndicator {
    let status: HealthStatusType = HEALTH_STATUS.HEALTHY;
    let message = 'Search engine is performing normally';

    if (
      metrics.zeroResultRate >
        HEALTH_THRESHOLDS.SEARCH.ZERO_RESULT_RATE_CRITICAL * 100 ||
      metrics.averageLatencyMs > HEALTH_THRESHOLDS.SEARCH.LATENCY_MS_CRITICAL
    ) {
      status = HEALTH_STATUS.CRITICAL;
      message = `High zero-result rate (${metrics.zeroResultRate}%) or excessive latency (${metrics.averageLatencyMs}ms)`;
    } else if (
      metrics.zeroResultRate >
        HEALTH_THRESHOLDS.SEARCH.ZERO_RESULT_RATE_DEGRADED * 100 ||
      metrics.averageLatencyMs > HEALTH_THRESHOLDS.SEARCH.LATENCY_MS_DEGRADED
    ) {
      status = HEALTH_STATUS.DEGRADED;
      message = `Elevated search latency: ${metrics.averageLatencyMs}ms`;
    }

    return {
      component: 'Hybrid Search Engine',
      status,
      message,
      details: {
        zeroResultRate: metrics.zeroResultRate,
        averageLatencyMs: metrics.averageLatencyMs,
      },
      lastCheckedAt: new Date(),
    };
  }

  private evaluateAiProviders(metrics: {
    failureRate: number;
    averageLatencyMs: number;
  }): ComponentHealthIndicator {
    let status: HealthStatusType = HEALTH_STATUS.HEALTHY;
    let message = 'AI providers are responsive';

    if (
      metrics.failureRate >
        HEALTH_THRESHOLDS.AI_PROVIDER.FAILURE_RATE_CRITICAL * 100 ||
      metrics.averageLatencyMs >
        HEALTH_THRESHOLDS.AI_PROVIDER.LATENCY_MS_CRITICAL
    ) {
      status = HEALTH_STATUS.CRITICAL;
      message = `High AI provider error rate (${metrics.failureRate}%) or slow response (${metrics.averageLatencyMs}ms)`;
    } else if (
      metrics.failureRate >
        HEALTH_THRESHOLDS.AI_PROVIDER.FAILURE_RATE_DEGRADED * 100 ||
      metrics.averageLatencyMs >
        HEALTH_THRESHOLDS.AI_PROVIDER.LATENCY_MS_DEGRADED
    ) {
      status = HEALTH_STATUS.DEGRADED;
      message = `Elevated AI provider latency: ${metrics.averageLatencyMs}ms`;
    }

    return {
      component: 'AI Providers & Gateway',
      status,
      message,
      details: {
        failureRate: metrics.failureRate,
        averageLatencyMs: metrics.averageLatencyMs,
      },
      lastCheckedAt: new Date(),
    };
  }

  private evaluateQueue(metrics: {
    jobFailureRate: number;
    pendingJobs: number;
  }): ComponentHealthIndicator {
    let status: HealthStatusType = HEALTH_STATUS.HEALTHY;
    let message = 'Job queues are processing smoothly';

    if (
      metrics.jobFailureRate >
        HEALTH_THRESHOLDS.QUEUE.FAILURE_RATE_CRITICAL * 100 ||
      metrics.pendingJobs > HEALTH_THRESHOLDS.QUEUE.PENDING_JOBS_CRITICAL
    ) {
      status = HEALTH_STATUS.CRITICAL;
      message = `Queue overload: ${metrics.pendingJobs} pending jobs, ${metrics.jobFailureRate}% failure rate`;
    } else if (
      metrics.jobFailureRate >
        HEALTH_THRESHOLDS.QUEUE.FAILURE_RATE_DEGRADED * 100 ||
      metrics.pendingJobs > HEALTH_THRESHOLDS.QUEUE.PENDING_JOBS_DEGRADED
    ) {
      status = HEALTH_STATUS.DEGRADED;
      message = `Queue backpressure: ${metrics.pendingJobs} pending jobs`;
    }

    return {
      component: 'Background Job Queues (BullMQ)',
      status,
      message,
      details: {
        pendingJobs: metrics.pendingJobs,
        jobFailureRate: metrics.jobFailureRate,
      },
      lastCheckedAt: new Date(),
    };
  }

  private evaluateKnowledgeCoverage(metrics: {
    embeddingCoverageRate: number;
    backlogCount: number;
  }): ComponentHealthIndicator {
    let status: HealthStatusType = HEALTH_STATUS.HEALTHY;
    let message = 'Knowledge indexing is complete';

    if (metrics.embeddingCoverageRate < 80 || metrics.backlogCount > 500) {
      status = HEALTH_STATUS.CRITICAL;
      message = `Low knowledge coverage: ${metrics.embeddingCoverageRate}%, backlog: ${metrics.backlogCount}`;
    } else if (
      metrics.embeddingCoverageRate < 95 ||
      metrics.backlogCount > 100
    ) {
      status = HEALTH_STATUS.DEGRADED;
      message = `Pending knowledge processing: ${metrics.backlogCount} items`;
    }

    return {
      component: 'Knowledge Coverage',
      status,
      message,
      details: {
        coverageRate: metrics.embeddingCoverageRate,
        backlog: metrics.backlogCount,
      },
      lastCheckedAt: new Date(),
    };
  }
}
