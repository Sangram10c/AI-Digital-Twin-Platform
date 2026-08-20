/**
 * Analytics Feature Types
 */
export type TimeRangeFilter = '24h' | '7d' | '30d' | '90d';

export interface AnalyticsFilterState {
  timeRange: TimeRangeFilter;
  repositoryId?: string;
}
