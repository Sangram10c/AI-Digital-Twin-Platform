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
}

export interface RepositoryAnalytics {
  totalRepositories: number;
  activeRepositories: number;
  totalCommitsSynced: number;
  totalPullRequestsSynced: number;
  totalIssuesSynced: number;
  syncSuccessRate: number;
  recentSyncs?: Array<{
    repositoryId: string;
    name: string;
    status: string;
    lastSyncedAt: string;
  }>;
}

export interface KnowledgeAnalytics {
  totalChunks: number;
  totalDocuments: number;
  averageChunkSize: number;
  embeddedPercentage: number;
  documentTypeBreakdown: Record<string, number>;
}

export interface SearchAnalytics {
  totalQueries: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  cacheHitRate: number;
  zeroResultQueriesCount: number;
}

export interface AiAnalytics {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalRequests: number;
  averageLatencyMs: number;
  estimatedCostUsd: number;
  providerBreakdown: Record<string, number>;
}

export interface ConversationAnalytics {
  totalConversations: number;
  totalMessages: number;
  averageTurnsPerConversation: number;
  activeUsersCount: number;
}

export interface JobAnalytics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  activeJobs: number;
  delayedJobs: number;
  successRate: number;
}

export interface HealthAnalytics {
  status: 'OPTIMAL' | 'DEGRADED' | 'UNHEALTHY';
  healthScore: number;
  domains: Record<string, { status: string; score: number; message?: string }>;
}

export const analyticsService = {
  /**
   * Get workspace overview KPIs
   */
  async getOverview(workspaceId: string): Promise<OverviewKPI> {
    try {
      const { data } = await api.get<OverviewKPI>(`/workspaces/${workspaceId}/analytics/overview`);
      return (
        data || {
          totalRepositories: 0,
          totalKnowledgeChunks: 0,
          totalConversations: 0,
          totalSearches: 0,
        }
      );
    } catch {
      return {
        totalRepositories: 0,
        totalKnowledgeChunks: 0,
        totalConversations: 0,
        totalSearches: 0,
      };
    }
  },

  /**
   * Get repository analytics
   */
  async getRepositories(workspaceId: string): Promise<RepositoryAnalytics> {
    try {
      const { data } = await api.get<RepositoryAnalytics>(
        `/workspaces/${workspaceId}/analytics/repositories`,
      );
      return data;
    } catch {
      return {
        totalRepositories: 0,
        activeRepositories: 0,
        totalCommitsSynced: 0,
        totalPullRequestsSynced: 0,
        totalIssuesSynced: 0,
        syncSuccessRate: 100,
      };
    }
  },

  /**
   * Get knowledge analytics
   */
  async getKnowledge(workspaceId: string): Promise<KnowledgeAnalytics> {
    try {
      const { data } = await api.get<KnowledgeAnalytics>(
        `/workspaces/${workspaceId}/analytics/knowledge`,
      );
      return data;
    } catch {
      return {
        totalChunks: 0,
        totalDocuments: 0,
        averageChunkSize: 0,
        embeddedPercentage: 0,
        documentTypeBreakdown: {},
      };
    }
  },

  /**
   * Get search analytics
   */
  async getSearch(workspaceId: string): Promise<SearchAnalytics> {
    try {
      const { data } = await api.get<SearchAnalytics>(
        `/workspaces/${workspaceId}/analytics/search`,
      );
      return data;
    } catch {
      return {
        totalQueries: 0,
        averageLatencyMs: 0,
        p95LatencyMs: 0,
        cacheHitRate: 0,
        zeroResultQueriesCount: 0,
      };
    }
  },

  /**
   * Get AI token and cost analytics
   */
  async getAi(workspaceId: string): Promise<AiAnalytics> {
    try {
      const { data } = await api.get<AiAnalytics>(`/workspaces/${workspaceId}/analytics/ai`);
      return data;
    } catch {
      return {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalRequests: 0,
        averageLatencyMs: 0,
        estimatedCostUsd: 0,
        providerBreakdown: {},
      };
    }
  },

  /**
   * Get conversation analytics
   */
  async getConversations(workspaceId: string): Promise<ConversationAnalytics> {
    try {
      const { data } = await api.get<ConversationAnalytics>(
        `/workspaces/${workspaceId}/analytics/conversations`,
      );
      return data;
    } catch {
      return {
        totalConversations: 0,
        totalMessages: 0,
        averageTurnsPerConversation: 0,
        activeUsersCount: 0,
      };
    }
  },

  /**
   * Get background job analytics
   */
  async getJobs(workspaceId: string): Promise<JobAnalytics> {
    try {
      const { data } = await api.get<JobAnalytics>(`/workspaces/${workspaceId}/analytics/jobs`);
      return data;
    } catch {
      return {
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        activeJobs: 0,
        delayedJobs: 0,
        successRate: 100,
      };
    }
  },

  /**
   * Get system health analytics
   */
  async getHealth(workspaceId: string): Promise<HealthAnalytics> {
    try {
      const { data } = await api.get<HealthAnalytics>(
        `/workspaces/${workspaceId}/analytics/health`,
      );
      return data;
    } catch {
      return {
        status: 'OPTIMAL',
        healthScore: 100,
        domains: {},
      };
    }
  },
};
