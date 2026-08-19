import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ANALYTICS_PERIOD } from '../constants/analytics.constants';

export class AnalyticsFilterDto {
  @ApiPropertyOptional({
    description: 'Optional repository ID filter',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  repositoryId?: string;

  @ApiPropertyOptional({
    description: 'Start of the analytics date range (ISO-8601)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'End of the analytics date range (ISO-8601)',
    example: '2026-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional({
    description: 'Aggregation period',
    enum: ANALYTICS_PERIOD,
    default: ANALYTICS_PERIOD.DAILY,
  })
  @IsOptional()
  @IsEnum(ANALYTICS_PERIOD)
  period?: (typeof ANALYTICS_PERIOD)[keyof typeof ANALYTICS_PERIOD] =
    ANALYTICS_PERIOD.DAILY;
}

export class AggregationTriggerDto {
  @ApiPropertyOptional({
    description: 'Optional repository ID for scoped aggregation',
  })
  @IsOptional()
  @IsUUID('4')
  repositoryId?: string;

  @ApiPropertyOptional({
    description: 'Aggregation period window',
    enum: ANALYTICS_PERIOD,
    default: ANALYTICS_PERIOD.DAILY,
  })
  @IsOptional()
  @IsEnum(ANALYTICS_PERIOD)
  period?: (typeof ANALYTICS_PERIOD)[keyof typeof ANALYTICS_PERIOD] =
    ANALYTICS_PERIOD.DAILY;
}
