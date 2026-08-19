import { AnalyticsSnapshotType } from '@prisma/client';
import { AnalyticsAggregatorService } from './analytics-aggregator.service';

describe('AnalyticsAggregatorService', () => {
  let service: AnalyticsAggregatorService;
  const repoService = {
    getRepositoryMetrics: jest.fn(),
    getKnowledgeMetrics: jest.fn(),
    getSearchMetrics: jest.fn(),
    getRagMetrics: jest.fn(),
    getAiMetrics: jest.fn(),
    getConversationMetrics: jest.fn(),
    getJobMetrics: jest.fn(),
    getPlatformMetrics: jest.fn(),
  };

  const cacheService = {
    buildKey: jest.fn(
      (category: string, ws: string) => `test-key:${category}:${ws}`,
    ),
    set: jest.fn(),
    get: jest.fn(),
  };

  const snapshotService = {
    saveSnapshot: jest.fn(),
  };

  const metricsService = {
    evaluateSystemHealth: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsAggregatorService(
      repoService as never,
      cacheService as never,
      snapshotService as never,
      metricsService as never,
    );
  });

  describe('resolveDateRange', () => {
    it('resolves hourly window', () => {
      const now = new Date();
      const range = service.resolveDateRange(undefined, now, 'hourly');
      expect(range.end.getTime() - range.start.getTime()).toBeCloseTo(
        3600000,
        -3,
      );
    });

    it('resolves daily window', () => {
      const now = new Date();
      const range = service.resolveDateRange(undefined, now, 'daily');
      expect(range.end.getTime() - range.start.getTime()).toBeCloseTo(
        86400000,
        -3,
      );
    });

    it('uses explicit date bounds if supplied', () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-01-10');
      const range = service.resolveDateRange(start, end);
      expect(range.start).toEqual(start);
      expect(range.end).toEqual(end);
    });
  });

  describe('aggregateRepositories', () => {
    it('calculates metrics, caches result, and persists snapshot if persist flag is true', async () => {
      const mockMetrics = {
        totalRepositories: 4,
        activeRepositories: 4,
        syncingRepositories: 0,
        errorRepositories: 0,
        totalBranches: 12,
        totalCommits: 140,
        totalPullRequests: 22,
        openPullRequests: 3,
        mergedPullRequests: 18,
        totalIssues: 10,
        openIssues: 2,
        closedIssues: 8,
        totalReleases: 2,
        totalContributors: 5,
        lastSyncedAt: new Date(),
        syncSuccessRate: 100,
        syncFailureCount: 0,
        staleRepositoryCount: 0,
      };
      repoService.getRepositoryMetrics.mockResolvedValue(mockMetrics);

      const result = await service.aggregateRepositories(
        'ws-1',
        'repo-1',
        undefined,
        true,
      );

      expect(result).toEqual(mockMetrics);
      expect(cacheService.set).toHaveBeenCalledWith(
        'test-key:repositories:ws-1',
        mockMetrics,
        600,
      );
      expect(snapshotService.saveSnapshot).toHaveBeenCalledWith(
        'ws-1',
        AnalyticsSnapshotType.REPOSITORY,
        expect.any(Date),
        expect.any(Date),
        mockMetrics,
        'repo-1',
      );
    });
  });

  describe('aggregateOverview', () => {
    it('aggregates all 8 categories and combines them into overview payload', async () => {
      repoService.getRepositoryMetrics.mockResolvedValue({
        totalRepositories: 5,
      });
      repoService.getKnowledgeMetrics.mockResolvedValue({ totalChunks: 300 });
      repoService.getSearchMetrics.mockResolvedValue({ totalSearches: 50 });
      repoService.getRagMetrics.mockResolvedValue({ totalRagQueries: 40 });
      repoService.getAiMetrics.mockResolvedValue({
        totalTokens: 15000,
        estimatedCostUsd: 0.03,
      });
      repoService.getConversationMetrics.mockResolvedValue({
        totalConversations: 15,
      });
      repoService.getJobMetrics.mockResolvedValue({ totalJobs: 80 });
      metricsService.evaluateSystemHealth.mockResolvedValue({
        overallStatus: 'HEALTHY',
      });

      const overview = await service.aggregateOverview(
        'ws-1',
        undefined,
        'daily',
        undefined,
        undefined,
        true,
      );

      expect(overview.workspaceId).toBe('ws-1');
      expect(overview.summary.totalRepositories).toBe(5);
      expect(overview.summary.totalKnowledgeChunks).toBe(300);
      expect(overview.summary.systemHealth).toBe('HEALTHY');
      expect(snapshotService.saveSnapshot).toHaveBeenCalledWith(
        'ws-1',
        AnalyticsSnapshotType.WORKSPACE,
        expect.any(Date),
        expect.any(Date),
        overview,
        undefined,
      );
    });
  });
});
