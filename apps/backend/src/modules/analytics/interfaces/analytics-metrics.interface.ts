import { HealthStatusType } from '../constants/analytics.constants';

export interface RepositoryAnalyticsMetrics {
  totalRepositories: number;
  activeRepositories: number;
  syncingRepositories: number;
  errorRepositories: number;
  totalBranches: number;
  totalCommits: number;
  totalPullRequests: number;
  openPullRequests: number;
  mergedPullRequests: number;
  totalIssues: number;
  openIssues: number;
  closedIssues: number;
  totalReleases: number;
  totalContributors: number;
  lastSyncedAt: Date | null;
  syncSuccessRate: number;
  syncFailureCount: number;
  staleRepositoryCount: number;
}

export interface KnowledgeAnalyticsMetrics {
  totalSources: number;
  sourcesByType: Record<string, number>;
  totalDocumentation: number;
  totalChunks: number;
  embeddedChunks: number;
  pendingChunks: number;
  failedChunks: number;
  embeddingCoverageRate: number;
  totalTokens: number;
  averageChunkLength: number;
  chunksByLanguage: Record<string, number>;
  backlogCount: number;
}

export interface SearchAnalyticsMetrics {
  totalSearches: number;
  searchesByType: {
    keyword: number;
    semantic: number;
    hybrid: number;
  };
  zeroResultQueries: number;
  zeroResultRate: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  cacheHitCount: number;
  cacheMissCount: number;
  cacheHitRate: number;
  topSearchTerms: Array<{ query: string; count: number }>;
}

export interface RagAnalyticsMetrics {
  totalRagQueries: number;
  averageCitationsPerResponse: number;
  zeroCitationCount: number;
  zeroCitationRate: number;
  topCitedSources: Array<{ sourceId: string; title: string; count: number }>;
  topCitedRepositories: Array<{
    repositoryId: string;
    name: string;
    count: number;
  }>;
  fallbackCount: number;
  fallbackRate: number;
  groundingScoreAverage: number;
}

export interface AiAnalyticsMetrics {
  totalModelCalls: number;
  callsByProvider: Record<string, number>;
  callsByModel: Record<string, number>;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  failureCount: number;
  failureRate: number;
  rateLimitHits: number;
}

export interface ConversationAnalyticsMetrics {
  totalConversations: number;
  activeConversations: number;
  archivedConversations: number;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  averageMessagesPerConversation: number;
  activeUsersCount: number;
  dailyActiveUsers: number;
  conversationRetentionRate: number;
}

export interface JobAnalyticsMetrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  runningJobs: number;
  pendingJobs: number;
  jobFailureRate: number;
  averageJobDurationMs: number;
  jobsByType: Record<
    string,
    { total: number; failed: number; avgDurationMs: number }
  >;
  deadLetterCount: number;
}

export interface ComponentHealthIndicator {
  component: string;
  status: HealthStatusType;
  message: string;
  details: Record<string, unknown>;
  lastCheckedAt: Date;
}

export interface SystemHealthMetrics {
  overallStatus: HealthStatusType;
  components: {
    repositorySync: ComponentHealthIndicator;
    embeddingPipeline: ComponentHealthIndicator;
    hybridSearch: ComponentHealthIndicator;
    aiProviders: ComponentHealthIndicator;
    bullmqQueues: ComponentHealthIndicator;
    knowledgeCoverage: ComponentHealthIndicator;
  };
  generatedAt: Date;
}

export interface AnalyticsOverviewMetrics {
  workspaceId: string;
  period: string;
  dateFrom: Date;
  dateTo: Date;
  summary: {
    totalRepositories: number;
    totalKnowledgeChunks: number;
    totalSearches: number;
    totalConversations: number;
    totalAiTokens: number;
    estimatedAiCostUsd: number;
    systemHealth: HealthStatusType;
  };
  repository: RepositoryAnalyticsMetrics;
  knowledge: KnowledgeAnalyticsMetrics;
  search: SearchAnalyticsMetrics;
  rag: RagAnalyticsMetrics;
  ai: AiAnalyticsMetrics;
  conversation: ConversationAnalyticsMetrics;
  jobs: JobAnalyticsMetrics;
  health: SystemHealthMetrics;
}

export interface PlatformAnalyticsMetrics {
  totalWorkspaces: number;
  activeWorkspaces: number;
  totalUsers: number;
  activeUsers: number;
  totalRepositories: number;
  totalKnowledgeChunks: number;
  totalConversations: number;
  totalSearches: number;
  totalTokens: number;
  estimatedCostUsd: number;
  globalHealthStatus: HealthStatusType;
  activeJobs: number;
  period: string;
  generatedAt: Date;
}
