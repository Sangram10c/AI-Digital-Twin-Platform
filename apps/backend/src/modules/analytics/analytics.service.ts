import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  AggregationTriggerDto,
  AnalyticsFilterDto,
} from './dto/analytics-filter.dto';
import {
  HealthAnalyticsResponseDto,
  OverviewResponseDto,
  PlatformAnalyticsResponseDto,
} from './dto/analytics-response.dto';
import { AnalyticsAggregationQueueService } from './jobs/analytics-aggregation-queue.service';
import { AnalyticsAggregatorService } from './services/analytics-aggregator.service';
import { AnalyticsCacheService } from './services/analytics-cache.service';
import { AnalyticsMetricsService } from './services/analytics-metrics.service';
import { AnalyticsPermissionService } from './services/analytics-permission.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly permissionService: AnalyticsPermissionService,
    private readonly cacheService: AnalyticsCacheService,
    private readonly aggregatorService: AnalyticsAggregatorService,
    private readonly metricsService: AnalyticsMetricsService,
    private readonly queueService: AnalyticsAggregationQueueService,
  ) {}

  // ===========================================================================
  // 1. Overview
  // ===========================================================================
  async getOverview(
    workspaceId: string,
    filter: AnalyticsFilterDto,
    userId?: string,
    userRole?: UserRole,
  ): Promise<OverviewResponseDto> {
    if (userId) {
      await this.permissionService.validateWorkspaceAccess(
        userId,
        workspaceId,
        userRole,
      );
      await this.permissionService.validateRepositoryScope(
        workspaceId,
        filter.repositoryId,
      );
    }

    const period = filter.period || 'daily';
    const cacheKey = this.cacheService.buildKey(
      'overview',
      workspaceId,
      filter.repositoryId,
      period,
    );

    // 1. Check Redis Cache
    if (!filter.dateFrom && !filter.dateTo) {
      const cached = await this.cacheService.get<OverviewResponseDto>(cacheKey);
      if (cached) {
        return { ...cached, source: 'cache' };
      }
    }

    // 2. Compute Live
    const range = this.aggregatorService.resolveDateRange(
      filter.dateFrom,
      filter.dateTo,
      period,
    );
    const overview = await this.aggregatorService.aggregateOverview(
      workspaceId,
      filter.repositoryId,
      period,
      filter.dateFrom,
      filter.dateTo,
      false, // non-blocking live read
    );

    const response: OverviewResponseDto = {
      workspaceId,
      repositoryId: filter.repositoryId,
      periodStart: range.start,
      periodEnd: range.end,
      metrics: overview,
      source: 'live',
      generatedAt: new Date(),
    };

    return response;
  }

  // ===========================================================================
  // 2. Repositories
  // ===========================================================================
  async getRepositories(
    workspaceId: string,
    filter: AnalyticsFilterDto,
    userId?: string,
    userRole?: UserRole,
  ) {
    if (userId) {
      await this.permissionService.validateWorkspaceAccess(
        userId,
        workspaceId,
        userRole,
      );
      await this.permissionService.validateRepositoryScope(
        workspaceId,
        filter.repositoryId,
      );
    }

    const range = this.aggregatorService.resolveDateRange(
      filter.dateFrom,
      filter.dateTo,
      filter.period,
    );
    const metrics = await this.aggregatorService.aggregateRepositories(
      workspaceId,
      filter.repositoryId,
      range,
    );

    return {
      workspaceId,
      repositoryId: filter.repositoryId,
      periodStart: range.start,
      periodEnd: range.end,
      metrics,
      source: 'live' as const,
      generatedAt: new Date(),
    };
  }

  // ===========================================================================
  // 3. Knowledge
  // ===========================================================================
  async getKnowledge(
    workspaceId: string,
    filter: AnalyticsFilterDto,
    userId?: string,
    userRole?: UserRole,
  ) {
    if (userId) {
      await this.permissionService.validateWorkspaceAccess(
        userId,
        workspaceId,
        userRole,
      );
      await this.permissionService.validateRepositoryScope(
        workspaceId,
        filter.repositoryId,
      );
    }

    const range = this.aggregatorService.resolveDateRange(
      filter.dateFrom,
      filter.dateTo,
      filter.period,
    );
    const metrics = await this.aggregatorService.aggregateKnowledge(
      workspaceId,
      filter.repositoryId,
      range,
    );

    return {
      workspaceId,
      repositoryId: filter.repositoryId,
      periodStart: range.start,
      periodEnd: range.end,
      metrics,
      source: 'live' as const,
      generatedAt: new Date(),
    };
  }

  // ===========================================================================
  // 4. Search
  // ===========================================================================
  async getSearch(
    workspaceId: string,
    filter: AnalyticsFilterDto,
    userId?: string,
    userRole?: UserRole,
  ) {
    if (userId) {
      await this.permissionService.validateWorkspaceAccess(
        userId,
        workspaceId,
        userRole,
      );
      await this.permissionService.validateRepositoryScope(
        workspaceId,
        filter.repositoryId,
      );
    }

    const range = this.aggregatorService.resolveDateRange(
      filter.dateFrom,
      filter.dateTo,
      filter.period,
    );
    const metrics = await this.aggregatorService.aggregateSearch(
      workspaceId,
      filter.repositoryId,
      range,
    );

    return {
      workspaceId,
      repositoryId: filter.repositoryId,
      periodStart: range.start,
      periodEnd: range.end,
      metrics,
      source: 'live' as const,
      generatedAt: new Date(),
    };
  }

  // ===========================================================================
  // 5. RAG
  // ===========================================================================
  async getRag(
    workspaceId: string,
    filter: AnalyticsFilterDto,
    userId?: string,
    userRole?: UserRole,
  ) {
    if (userId) {
      await this.permissionService.validateWorkspaceAccess(
        userId,
        workspaceId,
        userRole,
      );
      await this.permissionService.validateRepositoryScope(
        workspaceId,
        filter.repositoryId,
      );
    }

    const range = this.aggregatorService.resolveDateRange(
      filter.dateFrom,
      filter.dateTo,
      filter.period,
    );
    const metrics = await this.aggregatorService.aggregateRag(
      workspaceId,
      filter.repositoryId,
      range,
    );

    return {
      workspaceId,
      repositoryId: filter.repositoryId,
      periodStart: range.start,
      periodEnd: range.end,
      metrics,
      source: 'live' as const,
      generatedAt: new Date(),
    };
  }

  // ===========================================================================
  // 6. AI
  // ===========================================================================
  async getAi(
    workspaceId: string,
    filter: AnalyticsFilterDto,
    userId?: string,
    userRole?: UserRole,
  ) {
    if (userId) {
      await this.permissionService.validateWorkspaceAccess(
        userId,
        workspaceId,
        userRole,
      );
      await this.permissionService.validateRepositoryScope(
        workspaceId,
        filter.repositoryId,
      );
    }

    const range = this.aggregatorService.resolveDateRange(
      filter.dateFrom,
      filter.dateTo,
      filter.period,
    );
    const metrics = await this.aggregatorService.aggregateAi(
      workspaceId,
      filter.repositoryId,
      range,
    );

    return {
      workspaceId,
      repositoryId: filter.repositoryId,
      periodStart: range.start,
      periodEnd: range.end,
      metrics,
      source: 'live' as const,
      generatedAt: new Date(),
    };
  }

  // ===========================================================================
  // 7. Conversations
  // ===========================================================================
  async getConversations(
    workspaceId: string,
    filter: AnalyticsFilterDto,
    userId?: string,
    userRole?: UserRole,
  ) {
    if (userId) {
      await this.permissionService.validateWorkspaceAccess(
        userId,
        workspaceId,
        userRole,
      );
      await this.permissionService.validateRepositoryScope(
        workspaceId,
        filter.repositoryId,
      );
    }

    const range = this.aggregatorService.resolveDateRange(
      filter.dateFrom,
      filter.dateTo,
      filter.period,
    );
    const metrics = await this.aggregatorService.aggregateConversations(
      workspaceId,
      filter.repositoryId,
      range,
    );

    return {
      workspaceId,
      repositoryId: filter.repositoryId,
      periodStart: range.start,
      periodEnd: range.end,
      metrics,
      source: 'live' as const,
      generatedAt: new Date(),
    };
  }

  // ===========================================================================
  // 8. Jobs
  // ===========================================================================
  async getJobs(
    workspaceId: string,
    filter: AnalyticsFilterDto,
    userId?: string,
    userRole?: UserRole,
  ) {
    if (userId) {
      await this.permissionService.validateWorkspaceAccess(
        userId,
        workspaceId,
        userRole,
      );
    }

    const range = this.aggregatorService.resolveDateRange(
      filter.dateFrom,
      filter.dateTo,
      filter.period,
    );
    const metrics = await this.aggregatorService.aggregateJobs(
      workspaceId,
      range,
    );

    return {
      workspaceId,
      periodStart: range.start,
      periodEnd: range.end,
      metrics,
      source: 'live' as const,
      generatedAt: new Date(),
    };
  }

  // ===========================================================================
  // 9. Health Status
  // ===========================================================================
  async getHealth(
    workspaceId: string,
    repositoryId?: string,
    userId?: string,
    userRole?: UserRole,
  ): Promise<HealthAnalyticsResponseDto> {
    if (userId) {
      await this.permissionService.validateWorkspaceAccess(
        userId,
        workspaceId,
        userRole,
      );
      await this.permissionService.validateRepositoryScope(
        workspaceId,
        repositoryId,
      );
    }

    const health = await this.metricsService.evaluateSystemHealth(
      workspaceId,
      repositoryId,
    );

    return {
      workspaceId,
      repositoryId,
      periodStart: new Date(Date.now() - 3600000),
      periodEnd: new Date(),
      metrics: health,
      source: 'live',
      generatedAt: new Date(),
    };
  }

  // ===========================================================================
  // 10. Platform Global (Admin Only)
  // ===========================================================================
  async getPlatform(
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<PlatformAnalyticsResponseDto> {
    const range = this.aggregatorService.resolveDateRange(
      dateFrom,
      dateTo,
      'monthly',
    );
    const metrics = await this.aggregatorService.aggregatePlatform(range);

    return {
      workspaceId: 'global',
      periodStart: range.start,
      periodEnd: range.end,
      metrics,
      source: 'live',
      generatedAt: new Date(),
    };
  }

  // ===========================================================================
  // 11. Trigger Background Aggregation
  // ===========================================================================
  async triggerAggregation(
    workspaceId: string,
    dto: AggregationTriggerDto,
    userId?: string,
    userRole?: UserRole,
  ) {
    if (userId) {
      await this.permissionService.validateWorkspaceAccess(
        userId,
        workspaceId,
        userRole,
      );
      await this.permissionService.validateRepositoryScope(
        workspaceId,
        dto.repositoryId,
      );
    }

    try {
      const job = await this.queueService.enqueueWorkspaceAggregation(
        workspaceId,
        dto.repositoryId,
        dto.period,
        userId,
      );

      return {
        message: 'Analytics aggregation job enqueued successfully',
        jobId: job.id,
        workspaceId,
        repositoryId: dto.repositoryId,
        period: dto.period,
        enqueuedAt: new Date(),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to enqueue BullMQ job (${msg}), executing direct aggregation fallback`,
      );

      // Graceful fallback: run live aggregation and write snapshot directly to DB
      await this.aggregatorService.aggregateOverview(
        workspaceId,
        dto.repositoryId,
        dto.period || 'daily',
        undefined,
        undefined,
        true, // persist to DB
      );

      return {
        message:
          'Analytics aggregated and persisted successfully (direct execution fallback)',
        workspaceId,
        repositoryId: dto.repositoryId,
        period: dto.period || 'daily',
        enqueuedAt: new Date(),
      };
    }
  }
}
