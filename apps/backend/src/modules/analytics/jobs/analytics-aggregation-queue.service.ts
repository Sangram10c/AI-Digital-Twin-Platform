import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  ANALYTICS_PERIOD,
  ANALYTICS_QUEUES,
  AnalyticsPeriod,
} from '../constants/analytics.constants';

export interface AnalyticsAggregationJobPayload {
  workspaceId?: string;
  repositoryId?: string;
  period?: AnalyticsPeriod;
  isPlatformWide?: boolean;
  triggeredBy?: string;
  timestamp: string;
}

@Injectable()
export class AnalyticsAggregationQueueService {
  private readonly logger = new Logger(AnalyticsAggregationQueueService.name);

  constructor(
    @InjectQueue(ANALYTICS_QUEUES.ANALYTICS)
    private readonly analyticsQueue: Queue,
  ) {}

  /**
   * Enqueues an asynchronous aggregation job for a workspace.
   */
  async enqueueWorkspaceAggregation(
    workspaceId: string,
    repositoryId?: string,
    period: AnalyticsPeriod = ANALYTICS_PERIOD.DAILY,
    userId?: string,
  ) {
    const payload: AnalyticsAggregationJobPayload = {
      workspaceId,
      repositoryId,
      period,
      isPlatformWide: false,
      triggeredBy: userId,
      timestamp: new Date().toISOString(),
    };

    const jobId = `analytics-ws-${workspaceId}${repositoryId ? `-${repositoryId}` : ''}-${period}-${Date.now()}`;
    const job = await this.analyticsQueue.add('aggregate-workspace', payload, {
      jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    });

    this.logger.debug(
      `Enqueued workspace analytics aggregation job ${job.id} for workspace ${workspaceId}`,
    );
    return job;
  }

  /**
   * Enqueues a platform-wide aggregation job (Admin only / scheduled).
   */
  async enqueuePlatformAggregation(
    period: AnalyticsPeriod = ANALYTICS_PERIOD.DAILY,
  ) {
    const payload: AnalyticsAggregationJobPayload = {
      isPlatformWide: true,
      period,
      timestamp: new Date().toISOString(),
    };

    const job = await this.analyticsQueue.add('aggregate-platform', payload, {
      jobId: `analytics-platform-${period}-${Date.now()}`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 50,
      removeOnFail: 100,
    });

    this.logger.debug(`Enqueued platform analytics aggregation job ${job.id}`);
    return job;
  }

  /**
   * Returns BullMQ queue status.
   */
  async getQueueStatus() {
    return this.analyticsQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    );
  }
}
