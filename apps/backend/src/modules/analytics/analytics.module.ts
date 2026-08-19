import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BullMqCoreModule } from '../../common/modules/bullmq-core.module';
import { RedisModule } from '../../common/modules/redis.module';
import {
  AnalyticsController,
  PlatformAnalyticsController,
} from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ANALYTICS_QUEUES } from './constants/analytics.constants';
import { AnalyticsAggregationQueueService } from './jobs/analytics-aggregation-queue.service';
import { AnalyticsAggregationProcessor } from './processors/analytics-aggregation.processor';
import { AnalyticsAggregatorService } from './services/analytics-aggregator.service';
import { AnalyticsCacheService } from './services/analytics-cache.service';
import { AnalyticsMetricsService } from './services/analytics-metrics.service';
import { AnalyticsPermissionService } from './services/analytics-permission.service';
import { AnalyticsRepositoryService } from './services/analytics-repository.service';
import { AnalyticsSnapshotService } from './services/analytics-snapshot.service';

@Module({
  imports: [
    BullMqCoreModule,
    RedisModule,
    BullModule.registerQueue({
      name: ANALYTICS_QUEUES.ANALYTICS,
    }),
  ],
  controllers: [AnalyticsController, PlatformAnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsPermissionService,
    AnalyticsCacheService,
    AnalyticsRepositoryService,
    AnalyticsSnapshotService,
    AnalyticsAggregatorService,
    AnalyticsMetricsService,
    AnalyticsAggregationQueueService,
    AnalyticsAggregationProcessor,
    RolesGuard,
  ],
  exports: [
    AnalyticsService,
    AnalyticsAggregatorService,
    AnalyticsSnapshotService,
    AnalyticsMetricsService,
  ],
})
export class AnalyticsModule {}
