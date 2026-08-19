import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  SystemHealthMetrics,
} from '../interfaces/analytics-metrics.interface';

export class BaseAnalyticsResponseDto<T> {
  @ApiProperty({ description: 'Workspace ID or scope identifier' })
  workspaceId!: string;

  @ApiPropertyOptional({ description: 'Optional repository ID' })
  repositoryId?: string;

  @ApiProperty({ description: 'Reporting period start' })
  periodStart!: Date;

  @ApiProperty({ description: 'Reporting period end' })
  periodEnd!: Date;

  @ApiProperty({ description: 'Aggregation metrics data' })
  metrics!: T;

  @ApiProperty({ description: 'Source of data (cache vs live)' })
  source!: 'cache' | 'snapshot' | 'live';

  @ApiProperty({ description: 'Timestamp when metrics were computed' })
  generatedAt!: Date;
}

export class OverviewResponseDto extends BaseAnalyticsResponseDto<AnalyticsOverviewMetrics> {}
export class RepositoriesAnalyticsResponseDto extends BaseAnalyticsResponseDto<RepositoryAnalyticsMetrics> {}
export class KnowledgeAnalyticsResponseDto extends BaseAnalyticsResponseDto<KnowledgeAnalyticsMetrics> {}
export class SearchAnalyticsResponseDto extends BaseAnalyticsResponseDto<SearchAnalyticsMetrics> {}
export class RagAnalyticsResponseDto extends BaseAnalyticsResponseDto<RagAnalyticsMetrics> {}
export class AiAnalyticsResponseDto extends BaseAnalyticsResponseDto<AiAnalyticsMetrics> {}
export class ConversationsAnalyticsResponseDto extends BaseAnalyticsResponseDto<ConversationAnalyticsMetrics> {}
export class JobsAnalyticsResponseDto extends BaseAnalyticsResponseDto<JobAnalyticsMetrics> {}
export class HealthAnalyticsResponseDto extends BaseAnalyticsResponseDto<SystemHealthMetrics> {}
export class PlatformAnalyticsResponseDto extends BaseAnalyticsResponseDto<PlatformAnalyticsMetrics> {}
