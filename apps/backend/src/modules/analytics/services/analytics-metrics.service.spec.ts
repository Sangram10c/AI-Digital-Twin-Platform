import { HEALTH_STATUS } from '../constants/analytics.constants';
import { AnalyticsMetricsService } from './analytics-metrics.service';

describe('AnalyticsMetricsService', () => {
  let service: AnalyticsMetricsService;
  const repoService = {
    getRepositoryMetrics: jest.fn(),
    getKnowledgeMetrics: jest.fn(),
    getSearchMetrics: jest.fn(),
    getAiMetrics: jest.fn(),
    getJobMetrics: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsMetricsService(repoService as never);
  });

  it('evaluates overall system as HEALTHY when all components meet healthy thresholds', async () => {
    repoService.getRepositoryMetrics.mockResolvedValue({
      staleRepositoryCount: 0,
      syncFailureCount: 0,
      syncSuccessRate: 100,
    });
    repoService.getKnowledgeMetrics.mockResolvedValue({
      failedChunks: 0,
      pendingChunks: 5,
      totalChunks: 500,
      embeddingCoverageRate: 99,
      backlogCount: 5,
    });
    repoService.getSearchMetrics.mockResolvedValue({
      zeroResultRate: 2.0,
      averageLatencyMs: 120,
    });
    repoService.getAiMetrics.mockResolvedValue({
      failureRate: 0.5,
      averageLatencyMs: 800,
    });
    repoService.getJobMetrics.mockResolvedValue({
      jobFailureRate: 0.2,
      pendingJobs: 10,
    });

    const result = await service.evaluateSystemHealth('ws-1');

    expect(result.overallStatus).toBe(HEALTH_STATUS.HEALTHY);
    expect(result.components.repositorySync.status).toBe(HEALTH_STATUS.HEALTHY);
    expect(result.components.embeddingPipeline.status).toBe(
      HEALTH_STATUS.HEALTHY,
    );
    expect(result.components.hybridSearch.status).toBe(HEALTH_STATUS.HEALTHY);
  });

  it('evaluates overall status as DEGRADED when embedding backlog or search latency is elevated', async () => {
    repoService.getRepositoryMetrics.mockResolvedValue({
      staleRepositoryCount: 1, // degraded (>0)
      syncFailureCount: 1,
      syncSuccessRate: 98,
    });
    repoService.getKnowledgeMetrics.mockResolvedValue({
      failedChunks: 2,
      pendingChunks: 250, // degraded (>200)
      totalChunks: 500,
      embeddingCoverageRate: 94,
      backlogCount: 250,
    });
    repoService.getSearchMetrics.mockResolvedValue({
      zeroResultRate: 12.0, // degraded (>10%)
      averageLatencyMs: 600,
    });
    repoService.getAiMetrics.mockResolvedValue({
      failureRate: 0.5,
      averageLatencyMs: 800,
    });
    repoService.getJobMetrics.mockResolvedValue({
      jobFailureRate: 0.2,
      pendingJobs: 10,
    });

    const result = await service.evaluateSystemHealth('ws-1');

    expect(result.overallStatus).toBe(HEALTH_STATUS.DEGRADED);
    expect(result.components.repositorySync.status).toBe(
      HEALTH_STATUS.DEGRADED,
    );
    expect(result.components.embeddingPipeline.status).toBe(
      HEALTH_STATUS.DEGRADED,
    );
  });

  it('evaluates overall status as CRITICAL when sync failure or queue failure exceeds critical thresholds', async () => {
    repoService.getRepositoryMetrics.mockResolvedValue({
      staleRepositoryCount: 10, // critical (>5)
      syncFailureCount: 20,
      syncSuccessRate: 70, // critical (<85%)
    });
    repoService.getKnowledgeMetrics.mockResolvedValue({
      failedChunks: 50,
      pendingChunks: 1200, // critical (>1000)
      totalChunks: 500,
      embeddingCoverageRate: 60, // critical (<80%)
      backlogCount: 1200,
    });
    repoService.getSearchMetrics.mockResolvedValue({
      zeroResultRate: 30.0, // critical (>25%)
      averageLatencyMs: 3000,
    });
    repoService.getAiMetrics.mockResolvedValue({
      failureRate: 15.0, // critical (>10%)
      averageLatencyMs: 12000,
    });
    repoService.getJobMetrics.mockResolvedValue({
      jobFailureRate: 8.0, // critical (>5%)
      pendingJobs: 600,
    });

    const result = await service.evaluateSystemHealth('ws-1');

    expect(result.overallStatus).toBe(HEALTH_STATUS.CRITICAL);
    expect(result.components.repositorySync.status).toBe(
      HEALTH_STATUS.CRITICAL,
    );
    expect(result.components.bullmqQueues.status).toBe(HEALTH_STATUS.CRITICAL);
  });
});
