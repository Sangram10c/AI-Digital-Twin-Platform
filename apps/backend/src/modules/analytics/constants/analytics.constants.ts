export const ANALYTICS_QUEUES = {
  ANALYTICS: 'analytics',
  DEAD_LETTER: 'analytics-dead-letter',
} as const;

export const ANALYTICS_CACHE_TTL = {
  OVERVIEW: 300, // 5 minutes
  PLATFORM: 300, // 5 minutes
  REPOSITORIES: 600, // 10 minutes
  KNOWLEDGE: 600, // 10 minutes
  SEARCH: 300, // 5 minutes
  RAG: 300, // 5 minutes
  AI: 300, // 5 minutes
  CONVERSATIONS: 300, // 5 minutes
  JOBS: 120, // 2 minutes
  HEALTH: 60, // 1 minute
} as const;

export const ANALYTICS_PERIOD = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

export type AnalyticsPeriod =
  (typeof ANALYTICS_PERIOD)[keyof typeof ANALYTICS_PERIOD];

export const HEALTH_STATUS = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  CRITICAL: 'CRITICAL',
} as const;

export type HealthStatusType =
  (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];

export const HEALTH_THRESHOLDS = {
  REPOSITORY_SYNC: {
    STALE_HOURS_DEGRADED: 24,
    STALE_HOURS_CRITICAL: 72,
    FAILURE_RATE_DEGRADED: 0.05,
    FAILURE_RATE_CRITICAL: 0.15,
  },
  EMBEDDING: {
    FAILED_RATE_DEGRADED: 0.01, // 1%
    FAILED_RATE_CRITICAL: 0.05, // 5%
    PENDING_BACKLOG_DEGRADED: 200,
    PENDING_BACKLOG_CRITICAL: 1000,
  },
  SEARCH: {
    ZERO_RESULT_RATE_DEGRADED: 0.1, // 10%
    ZERO_RESULT_RATE_CRITICAL: 0.25, // 25%
    LATENCY_MS_DEGRADED: 500,
    LATENCY_MS_CRITICAL: 2000,
  },
  AI_PROVIDER: {
    FAILURE_RATE_DEGRADED: 0.02, // 2%
    FAILURE_RATE_CRITICAL: 0.1, // 10%
    LATENCY_MS_DEGRADED: 4000,
    LATENCY_MS_CRITICAL: 10000,
  },
  QUEUE: {
    FAILURE_RATE_DEGRADED: 0.01, // 1%
    FAILURE_RATE_CRITICAL: 0.05, // 5%
    PENDING_JOBS_DEGRADED: 100,
    PENDING_JOBS_CRITICAL: 500,
  },
  KNOWLEDGE_BACKLOG: {
    PENDING_CHUNKS_DEGRADED: 100,
    PENDING_CHUNKS_CRITICAL: 500,
  },
} as const;
