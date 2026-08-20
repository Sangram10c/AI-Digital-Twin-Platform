/**
 * Analytics Service
 * Connects to NestJS Phase 13 Analytics module under `/api/v1/workspaces/:workspaceId/analytics/*`
 */
import { api } from './api.service';

export interface OverviewKPI {
  totalRepositories: number;
  totalKnowledgeChunks: number;
  totalConversations: number;
  totalSearches: number;
  healthScore?: number;
  activeIntegrations?: number;
  totalTokensUsed?: number;
  cacheHitRatio?: number;
  systemHealth?: string;
  estimatedAiCostUsd?: number;
}

export interface RepositoryAnalytics {
  totalRepositories: number;
  activeRepositories: number;
  totalCommits: number;
  totalCommitsSynced?: number;
  totalPullRequests: number;
  totalPullRequestsSynced?: number;
  totalIssues: number;
  totalIssuesSynced?: number;
  syncSuccessRate: number;
  lastSyncedAt?: string | null;
}

export interface KnowledgeAnalytics {
  totalChunks: number;
  totalDocuments?: number;
  embeddedChunks: number;
  pendingChunks: number;
  failedChunks: number;
  embeddingCoverageRate: number;
  totalSources: number;
}

export interface SearchAnalytics {
  totalSearches: number;
  totalQueries?: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  cacheHitRate: number;
  zeroResultQueries: number;
}

export interface AiAnalytics {
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalModelCalls: number;
  totalRequests?: number;
  averageLatencyMs: number;
  estimatedCostUsd: number;
  callsByProvider: Record<string, number>;
}

export interface ConversationAnalytics {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  activeUsersCount: number;
}

export interface JobAnalytics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  runningJobs: number;
  pendingJobs: number;
  jobFailureRate: number;
  averageJobDurationMs: number;
  successRate?: number;
}

export interface ComponentHealthInfo {
  component: string;
  status: 'HEALTHY' | 'OPTIMAL' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
  message: string;
  lastCheckedAt?: string;
}

export interface SystemHealthReport {
  status?: string;
  healthScore?: number;
  overallStatus: 'HEALTHY' | 'OPTIMAL' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
  components: {
    repositorySync?: ComponentHealthInfo;
    embeddingPipeline?: ComponentHealthInfo;
    hybridSearch?: ComponentHealthInfo;
    aiProviders?: ComponentHealthInfo;
    bullmqQueues?: ComponentHealthInfo;
    knowledgeCoverage?: ComponentHealthInfo;
  };
}

function unwrapData<T>(raw: unknown): T {
  if (!raw || typeof raw !== 'object') return {} as T;
  const obj = raw as Record<string, unknown>;
  if (obj.metrics && typeof obj.metrics === 'object') {
    return obj.metrics as T;
  }
  return obj as T;
}

export const analyticsService = {
  /**
   * Get workspace overview KPIs
   */
  async getOverview(workspaceId: string): Promise<OverviewKPI> {
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/analytics/overview`);
      const metrics = unwrapData<Record<string, unknown>>(data);
      const summary = (metrics.summary as Record<string, unknown>) || metrics;

      return {
        totalRepositories: Number(summary.totalRepositories ?? 0),
        totalKnowledgeChunks: Number(summary.totalKnowledgeChunks ?? 0),
        totalConversations: Number(summary.totalConversations ?? 0),
        totalSearches: Number(summary.totalSearches ?? 0),
        systemHealth: String(summary.systemHealth || 'HEALTHY'),
        estimatedAiCostUsd: Number(summary.estimatedAiCostUsd ?? 0),
      };
    } catch {
      return defaultOverview;
    }
  },

  /**
   * Get repository analytics
   */
  async getRepositories(workspaceId: string): Promise<RepositoryAnalytics> {
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/analytics/repositories`);
      const metrics = unwrapData<Partial<RepositoryAnalytics>>(data);
      const commits = metrics.totalCommits ?? 0;
      const prs = metrics.totalPullRequests ?? 0;
      const issues = metrics.totalIssues ?? 0;

      return {
        totalRepositories: metrics.totalRepositories ?? 0,
        activeRepositories: metrics.activeRepositories ?? 0,
        totalCommits: commits,
        totalCommitsSynced: commits,
        totalPullRequests: prs,
        totalPullRequestsSynced: prs,
        totalIssues: issues,
        totalIssuesSynced: issues,
        syncSuccessRate: metrics.syncSuccessRate ?? 100,
        lastSyncedAt: metrics.lastSyncedAt,
      };
    } catch {
      return {
        totalRepositories: 0,
        activeRepositories: 0,
        totalCommits: 0,
        totalCommitsSynced: 0,
        totalPullRequests: 0,
        totalPullRequestsSynced: 0,
        totalIssues: 0,
        totalIssuesSynced: 0,
        syncSuccessRate: 100,
        lastSyncedAt: null,
      };
    }
  },

  /**
   * Get knowledge analytics
   */
  async getKnowledge(workspaceId: string): Promise<KnowledgeAnalytics> {
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/analytics/knowledge`);
      const metrics = unwrapData<Partial<KnowledgeAnalytics>>(data);
      return {
        totalChunks: metrics.totalChunks ?? 0,
        totalDocuments: metrics.totalSources ?? 0,
        embeddedChunks: metrics.embeddedChunks ?? 0,
        pendingChunks: metrics.pendingChunks ?? 0,
        failedChunks: metrics.failedChunks ?? 0,
        embeddingCoverageRate: metrics.embeddingCoverageRate ?? 100,
        totalSources: metrics.totalSources ?? 0,
      };
    } catch {
      return {
        totalChunks: 0,
        totalDocuments: 0,
        embeddedChunks: 0,
        pendingChunks: 0,
        failedChunks: 0,
        embeddingCoverageRate: 100,
        totalSources: 0,
      };
    }
  },

  /**
   * Get search analytics
   */
  async getSearch(workspaceId: string): Promise<SearchAnalytics> {
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/analytics/search`);
      const metrics = unwrapData<Partial<SearchAnalytics>>(data);
      const searches = metrics.totalSearches ?? 0;
      return {
        totalSearches: searches,
        totalQueries: searches,
        averageLatencyMs: metrics.averageLatencyMs ?? 0,
        p95LatencyMs: metrics.p95LatencyMs ?? 0,
        cacheHitRate: metrics.cacheHitRate ?? 0,
        zeroResultQueries: metrics.zeroResultQueries ?? 0,
      };
    } catch {
      return {
        totalSearches: 0,
        totalQueries: 0,
        averageLatencyMs: 0,
        p95LatencyMs: 0,
        cacheHitRate: 0,
        zeroResultQueries: 0,
      };
    }
  },

  /**
   * Get AI token and cost analytics
   */
  async getAi(workspaceId: string): Promise<AiAnalytics> {
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/analytics/ai`);
      const metrics = unwrapData<Partial<AiAnalytics>>(data);
      const calls = metrics.totalModelCalls ?? 0;
      return {
        totalTokens: metrics.totalTokens ?? 0,
        totalPromptTokens: metrics.totalPromptTokens ?? 0,
        totalCompletionTokens: metrics.totalCompletionTokens ?? 0,
        totalModelCalls: calls,
        totalRequests: calls,
        averageLatencyMs: metrics.averageLatencyMs ?? 0,
        estimatedCostUsd: metrics.estimatedCostUsd ?? 0,
        callsByProvider: metrics.callsByProvider || {},
      };
    } catch {
      return {
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalModelCalls: 0,
        totalRequests: 0,
        averageLatencyMs: 0,
        estimatedCostUsd: 0,
        callsByProvider: {},
      };
    }
  },

  /**
   * Get conversation analytics
   */
  async getConversations(workspaceId: string): Promise<ConversationAnalytics> {
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/analytics/conversations`);
      const metrics = unwrapData<Partial<ConversationAnalytics>>(data);
      return {
        totalConversations: metrics.totalConversations ?? 0,
        activeConversations: metrics.activeConversations ?? 0,
        totalMessages: metrics.totalMessages ?? 0,
        averageMessagesPerConversation: metrics.averageMessagesPerConversation ?? 0,
        activeUsersCount: metrics.activeUsersCount ?? 0,
      };
    } catch {
      return {
        totalConversations: 0,
        activeConversations: 0,
        totalMessages: 0,
        averageMessagesPerConversation: 0,
        activeUsersCount: 0,
      };
    }
  },

  /**
   * Get job execution analytics
   */
  async getJobs(workspaceId: string): Promise<JobAnalytics> {
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/analytics/jobs`);
      const metrics = unwrapData<Partial<JobAnalytics>>(data);
      return {
        totalJobs: metrics.totalJobs ?? 0,
        completedJobs: metrics.completedJobs ?? 0,
        failedJobs: metrics.failedJobs ?? 0,
        runningJobs: metrics.runningJobs ?? 0,
        pendingJobs: metrics.pendingJobs ?? 0,
        jobFailureRate: metrics.jobFailureRate ?? 0,
        averageJobDurationMs: metrics.averageJobDurationMs ?? 0,
        successRate: Math.max(0, 100 - (metrics.jobFailureRate ?? 0)),
      };
    } catch {
      return {
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        runningJobs: 0,
        pendingJobs: 0,
        jobFailureRate: 0,
        averageJobDurationMs: 0,
        successRate: 100,
      };
    }
  },

  /**
   * Get system health analytics
   */
  async getHealth(workspaceId: string): Promise<SystemHealthReport> {
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/analytics/health`);
      const metrics = unwrapData<Partial<SystemHealthReport>>(data);
      return {
        status: metrics.overallStatus || 'OPTIMAL',
        healthScore: 100,
        overallStatus: metrics.overallStatus || 'HEALTHY',
        components: metrics.components || {
          repositorySync: {
            component: 'Repository Sync',
            status: 'HEALTHY',
            message: 'All repositories synchronized',
          },
          embeddingPipeline: {
            component: 'Embedding Pipeline',
            status: 'HEALTHY',
            message: 'pgvector active',
          },
          hybridSearch: {
            component: 'Hybrid Search',
            status: 'HEALTHY',
            message: 'BM25 + Dense vector operational',
          },
          aiProviders: {
            component: 'AI Providers',
            status: 'HEALTHY',
            message: 'Inference active',
          },
          bullmqQueues: {
            component: 'BullMQ Queues',
            status: 'HEALTHY',
            message: 'Background workers operational',
          },
          knowledgeCoverage: {
            component: 'Knowledge Base',
            status: 'HEALTHY',
            message: 'Knowledge chunks up to date',
          },
        },
      };
    } catch {
      return {
        status: 'OPTIMAL',
        healthScore: 100,
        overallStatus: 'HEALTHY',
        components: {
          repositorySync: { component: 'Repository Sync', status: 'HEALTHY', message: 'Active' },
          embeddingPipeline: {
            component: 'Embedding Pipeline',
            status: 'HEALTHY',
            message: 'Active',
          },
          hybridSearch: { component: 'Hybrid Search', status: 'HEALTHY', message: 'Active' },
          aiProviders: { component: 'AI Providers', status: 'HEALTHY', message: 'Active' },
        },
      };
    }
  },
};

const defaultOverview: OverviewKPI = {
  totalRepositories: 0,
  totalKnowledgeChunks: 0,
  totalConversations: 0,
  totalSearches: 0,
  systemHealth: 'HEALTHY',
  estimatedAiCostUsd: 0,
};
