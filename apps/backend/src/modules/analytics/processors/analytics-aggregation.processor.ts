import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ANALYTICS_QUEUES } from '../constants/analytics.constants';
import { AnalyticsAggregationJobPayload } from '../jobs/analytics-aggregation-queue.service';
import { AnalyticsAggregatorService } from '../services/analytics-aggregator.service';

@Processor(ANALYTICS_QUEUES.ANALYTICS, { concurrency: 2 })
export class AnalyticsAggregationProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsAggregationProcessor.name);

  constructor(private readonly aggregatorService: AnalyticsAggregatorService) {
    super();
  }

  async process(job: Job<AnalyticsAggregationJobPayload>): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Processing analytics job ${job.id} (${job.name})`);

    const { workspaceId, repositoryId, period, isPlatformWide } = job.data;

    try {
      if (isPlatformWide) {
        await this.aggregatorService.aggregatePlatform();
        this.logger.log(
          `Completed platform analytics aggregation in ${Date.now() - startTime}ms`,
        );
        return;
      }

      if (!workspaceId) {
        throw new Error(
          'Workspace ID is required for workspace analytics aggregation job',
        );
      }

      // Compute and persist overview snapshot
      await this.aggregatorService.aggregateOverview(
        workspaceId,
        repositoryId,
        period || 'daily',
        undefined,
        undefined,
        true, // persist = true to write to DB snapshots table
      );

      this.logger.log(
        `Completed analytics aggregation for workspace ${workspaceId} in ${Date.now() - startTime}ms`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Analytics aggregation job ${job.id} failed: ${msg}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }
}
