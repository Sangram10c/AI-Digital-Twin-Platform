import { AnalyticsAggregationProcessor } from './analytics-aggregation.processor';

describe('AnalyticsAggregationProcessor', () => {
  let processor: AnalyticsAggregationProcessor;
  const aggregatorService = {
    aggregatePlatform: jest.fn(),
    aggregateOverview: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new AnalyticsAggregationProcessor(aggregatorService as never);
  });

  it('processes workspace aggregation job with persist=true', async () => {
    const job = {
      id: 'job-1',
      name: 'aggregate-workspace',
      data: {
        workspaceId: 'ws-1',
        repositoryId: 'repo-1',
        period: 'daily' as const,
        isPlatformWide: false,
        timestamp: new Date().toISOString(),
      },
    };

    await processor.process(job as never);

    expect(aggregatorService.aggregateOverview).toHaveBeenCalledWith(
      'ws-1',
      'repo-1',
      'daily',
      undefined,
      undefined,
      true,
    );
  });

  it('processes platform-wide aggregation job', async () => {
    const job = {
      id: 'job-2',
      name: 'aggregate-platform',
      data: {
        isPlatformWide: true,
        period: 'monthly' as const,
        timestamp: new Date().toISOString(),
      },
    };

    await processor.process(job as never);

    expect(aggregatorService.aggregatePlatform).toHaveBeenCalled();
  });

  it('throws error if workspaceId is missing for workspace aggregation', async () => {
    const job = {
      id: 'job-3',
      name: 'aggregate-workspace',
      data: {
        isPlatformWide: false,
        timestamp: new Date().toISOString(),
      },
    };

    await expect(processor.process(job as never)).rejects.toThrow(
      'Workspace ID is required',
    );
  });
});
