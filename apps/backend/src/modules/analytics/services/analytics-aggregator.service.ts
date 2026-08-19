import { Injectable } from '@nestjs/common';
import { AnalyticsSnapshotType } from '@prisma/client';
import {
  ANALYTICS_CACHE_TTL,
  AnalyticsPeriod,
} from '../constants/analytics.constants';
import {
  AiAnalyticsMetrics,
  AnalyticsOverviewMetrics,
  ConversationAnalyticsMetrics,
  JobAnalyticsMetrics,
  KnowledgeAnalyticsMetrics,
  PlatformAnalyticsMetrics,
  RagAnalyticsMetrics,
  RepositoryAnalyticsMetrics,
  SearchAnalyticsMetrics,
} from '../interfaces/analytics-metrics.interface';
import { AnalyticsCacheService } from './analytics-cache.service';
import { AnalyticsMetricsService } from './analytics-metrics.service';
import {
  AnalyticsRepositoryService,
  DateRange,
} from './analytics-repository.service';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';

@Injectable()
export class AnalyticsAggregatorService {
  constructor(
    private readonly repoService: AnalyticsRepositoryService,
    private readonly cacheService: AnalyticsCacheService,
    private readonly snapshotService: AnalyticsSnapshotService,
    private readonly metricsService: AnalyticsMetricsService,
  ) {}

  /**
   * Helper to resolve DateRange from period or explicit dates.
   */
  resolveDateRange(
    dateFrom?: Date,
    dateTo?: Date,
    period: AnalyticsPeriod = 'daily',
  ): DateRange {
    const end = dateTo || new Date();
    if (dateFrom) {
      return { start: dateFrom, end };
    }

    const start = new Date(end);
    switch (period) {
      case 'hourly':
        start.setHours(start.getHours() - 1);
        break;
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
      default:
        start.setDate(start.getDate() - 1);
    }
    return { start, end };
  }

  // ===========================================================================
  // Aggregation Methods
  // ===========================================================================

  async aggregateRepositories(
    workspaceId: string,
    repositoryId?: string,
    dateRange?: DateRange,
    persist = false,
  ): Promise<RepositoryAnalyticsMetrics> {
    const metrics = await this.repoService.getRepositoryMetrics(
      workspaceId,
      repositoryId,
      dateRange,
    );

    if (persist) {
      const range = dateRange || this.resolveDateRange();
      await this.snapshotService.saveSnapshot(
        workspaceId,
        AnalyticsSnapshotType.REPOSITORY,
        range.start,
        range.end,
        metrics,
        repositoryId,
      );
    }

    const cacheKey = this.cacheService.buildKey(
      'repositories',
      workspaceId,
      repositoryId,
    );
    await this.cacheService.set(
      cacheKey,
      metrics,
      ANALYTICS_CACHE_TTL.REPOSITORIES,
    );

    return metrics;
  }

  async aggregateKnowledge(
    workspaceId: string,
    repositoryId?: string,
    dateRange?: DateRange,
    persist = false,
  ): Promise<KnowledgeAnalyticsMetrics> {
    const metrics = await this.repoService.getKnowledgeMetrics(
      workspaceId,
      repositoryId,
      dateRange,
    );

    if (persist) {
      const range = dateRange || this.resolveDateRange();
      await this.snapshotService.saveSnapshot(
        workspaceId,
        AnalyticsSnapshotType.KNOWLEDGE,
        range.start,
        range.end,
        metrics,
        repositoryId,
      );
    }

    const cacheKey = this.cacheService.buildKey(
      'knowledge',
      workspaceId,
      repositoryId,
    );
    await this.cacheService.set(
      cacheKey,
      metrics,
      ANALYTICS_CACHE_TTL.KNOWLEDGE,
    );

    return metrics;
  }

  async aggregateSearch(
    workspaceId: string,
    repositoryId?: string,
    dateRange?: DateRange,
    persist = false,
  ): Promise<SearchAnalyticsMetrics> {
    const metrics = await this.repoService.getSearchMetrics(
      workspaceId,
      repositoryId,
      dateRange,
    );

    if (persist) {
      const range = dateRange || this.resolveDateRange();
      await this.snapshotService.saveSnapshot(
        workspaceId,
        AnalyticsSnapshotType.SEARCH,
        range.start,
        range.end,
        metrics,
        repositoryId,
      );
    }

    const cacheKey = this.cacheService.buildKey(
      'search',
      workspaceId,
      repositoryId,
    );
    await this.cacheService.set(cacheKey, metrics, ANALYTICS_CACHE_TTL.SEARCH);

    return metrics;
  }

  async aggregateRag(
    workspaceId: string,
    repositoryId?: string,
    dateRange?: DateRange,
    persist = false,
  ): Promise<RagAnalyticsMetrics> {
    const metrics = await this.repoService.getRagMetrics(
      workspaceId,
      repositoryId,
      dateRange,
    );

    if (persist) {
      const range = dateRange || this.resolveDateRange();
      await this.snapshotService.saveSnapshot(
        workspaceId,
        AnalyticsSnapshotType.RAG,
        range.start,
        range.end,
        metrics,
        repositoryId,
      );
    }

    const cacheKey = this.cacheService.buildKey(
      'rag',
      workspaceId,
      repositoryId,
    );
    await this.cacheService.set(cacheKey, metrics, ANALYTICS_CACHE_TTL.RAG);

    return metrics;
  }

  async aggregateAi(
    workspaceId: string,
    repositoryId?: string,
    dateRange?: DateRange,
    persist = false,
  ): Promise<AiAnalyticsMetrics> {
    const metrics = await this.repoService.getAiMetrics(
      workspaceId,
      repositoryId,
      dateRange,
    );

    if (persist) {
      const range = dateRange || this.resolveDateRange();
      await this.snapshotService.saveSnapshot(
        workspaceId,
        AnalyticsSnapshotType.AI,
        range.start,
        range.end,
        metrics,
        repositoryId,
      );
    }

    const cacheKey = this.cacheService.buildKey(
      'ai',
      workspaceId,
      repositoryId,
    );
    await this.cacheService.set(cacheKey, metrics, ANALYTICS_CACHE_TTL.AI);

    return metrics;
  }

  async aggregateConversations(
    workspaceId: string,
    repositoryId?: string,
    dateRange?: DateRange,
    persist = false,
  ): Promise<ConversationAnalyticsMetrics> {
    const metrics = await this.repoService.getConversationMetrics(
      workspaceId,
      repositoryId,
      dateRange,
    );

    if (persist) {
      const range = dateRange || this.resolveDateRange();
      await this.snapshotService.saveSnapshot(
        workspaceId,
        AnalyticsSnapshotType.CONVERSATION,
        range.start,
        range.end,
        metrics,
        repositoryId,
      );
    }

    const cacheKey = this.cacheService.buildKey(
      'conversations',
      workspaceId,
      repositoryId,
    );
    await this.cacheService.set(
      cacheKey,
      metrics,
      ANALYTICS_CACHE_TTL.CONVERSATIONS,
    );

    return metrics;
  }

  async aggregateJobs(
    workspaceId: string,
    dateRange?: DateRange,
    persist = false,
  ): Promise<JobAnalyticsMetrics> {
    const metrics = await this.repoService.getJobMetrics(
      workspaceId,
      dateRange,
    );

    if (persist) {
      const range = dateRange || this.resolveDateRange();
      await this.snapshotService.saveSnapshot(
        workspaceId,
        AnalyticsSnapshotType.JOB,
        range.start,
        range.end,
        metrics,
      );
    }

    const cacheKey = this.cacheService.buildKey('jobs', workspaceId);
    await this.cacheService.set(cacheKey, metrics, ANALYTICS_CACHE_TTL.JOBS);

    return metrics;
  }

  async aggregateOverview(
    workspaceId: string,
    repositoryId?: string,
    period: AnalyticsPeriod = 'daily',
    dateFrom?: Date,
    dateTo?: Date,
    persist = false,
  ): Promise<AnalyticsOverviewMetrics> {
    const range = this.resolveDateRange(dateFrom, dateTo, period);

    const [repository, knowledge, search, rag, ai, conversation, jobs, health] =
      await Promise.all([
        this.aggregateRepositories(workspaceId, repositoryId, range, persist),
        this.aggregateKnowledge(workspaceId, repositoryId, range, persist),
        this.aggregateSearch(workspaceId, repositoryId, range, persist),
        this.aggregateRag(workspaceId, repositoryId, range, persist),
        this.aggregateAi(workspaceId, repositoryId, range, persist),
        this.aggregateConversations(workspaceId, repositoryId, range, persist),
        this.aggregateJobs(workspaceId, range, persist),
        this.metricsService.evaluateSystemHealth(workspaceId, repositoryId),
      ]);

    const overview: AnalyticsOverviewMetrics = {
      workspaceId,
      period,
      dateFrom: range.start,
      dateTo: range.end,
      summary: {
        totalRepositories: repository.totalRepositories,
        totalKnowledgeChunks: knowledge.totalChunks,
        totalSearches: search.totalSearches,
        totalConversations: conversation.totalConversations,
        totalAiTokens: ai.totalTokens,
        estimatedAiCostUsd: ai.estimatedCostUsd,
        systemHealth: health.overallStatus,
      },
      repository,
      knowledge,
      search,
      rag,
      ai,
      conversation,
      jobs,
      health,
    };

    if (persist) {
      await this.snapshotService.saveSnapshot(
        workspaceId,
        AnalyticsSnapshotType.WORKSPACE,
        range.start,
        range.end,
        overview as unknown as Record<string, unknown>,
        repositoryId,
      );
    }

    const cacheKey = this.cacheService.buildKey(
      'overview',
      workspaceId,
      repositoryId,
      period,
    );
    await this.cacheService.set(
      cacheKey,
      overview,
      ANALYTICS_CACHE_TTL.OVERVIEW,
    );

    return overview;
  }

  async aggregatePlatform(
    dateRange?: DateRange,
  ): Promise<PlatformAnalyticsMetrics> {
    const metrics = await this.repoService.getPlatformMetrics(dateRange);
    return metrics;
  }
}
