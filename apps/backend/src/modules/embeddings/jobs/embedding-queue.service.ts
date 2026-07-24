import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';
import {
  EMBEDDING_DEFAULTS,
  EMBEDDING_JOBS,
  EMBEDDING_QUEUES,
} from '../constants/embeddings.constants';
import { EmbeddingJobPayload } from '../interfaces/embeddings.interfaces';

@Injectable()
export class EmbeddingQueueService {
  constructor(
    @InjectQueue(EMBEDDING_QUEUES.EMBEDDINGS)
    private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  private defaultJobOptions() {
    const attempts =
      this.config.get<number>('ai.embeddings.maxRetries') ??
      EMBEDDING_DEFAULTS.maxRetries;
    return {
      attempts,
      backoff: {
        type: 'exponential' as const,
        delay: EMBEDDING_DEFAULTS.backoffDelayMs,
      },
      removeOnComplete: 200,
      removeOnFail: 500,
    };
  }

  enqueueGenerate(payload: EmbeddingJobPayload) {
    return this.queue.add(EMBEDDING_JOBS.GENERATE, payload, {
      ...this.defaultJobOptions(),
      jobId: payload.knowledgeChunkId
        ? `embed-gen-${payload.knowledgeChunkId}`
        : undefined,
    });
  }

  enqueueGenerateBatch(payload: EmbeddingJobPayload) {
    const key = payload.knowledgeChunkIds?.slice(0, 3).join('-') ?? 'batch';
    return this.queue.add(EMBEDDING_JOBS.GENERATE_BATCH, payload, {
      ...this.defaultJobOptions(),
      jobId: `embed-batch-${payload.workspaceId}-${key}-${Date.now()}`,
    });
  }

  enqueueRegenerate(payload: EmbeddingJobPayload) {
    return this.queue.add(
      EMBEDDING_JOBS.REGENERATE,
      { ...payload, force: true },
      {
        ...this.defaultJobOptions(),
        jobId: payload.knowledgeChunkId
          ? `embed-regen-${payload.knowledgeChunkId}`
          : undefined,
      },
    );
  }

  enqueueDelete(payload: EmbeddingJobPayload) {
    return this.queue.add(EMBEDDING_JOBS.DELETE, payload, {
      ...this.defaultJobOptions(),
      jobId: payload.knowledgeChunkId
        ? `embed-del-${payload.knowledgeChunkId}`
        : undefined,
    });
  }

  enqueueRetry(payload: EmbeddingJobPayload) {
    return this.queue.add(EMBEDDING_JOBS.RETRY, payload, {
      ...this.defaultJobOptions(),
    });
  }

  async getJob(jobId: string): Promise<Job | undefined> {
    const job = await this.queue.getJob(jobId);
    return job ?? undefined;
  }

  async retryJob(jobId: string): Promise<Job | undefined> {
    const job = await this.queue.getJob(jobId);
    if (!job) return undefined;
    await job.retry();
    return job;
  }

  async getQueueCounts() {
    const [waiting, active, completed, failed, delayed, paused] =
      await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
        this.queue.getDelayedCount(),
        this.queue.isPaused().then((p) => (p ? 1 : 0)),
      ]);
    return { waiting, active, completed, failed, delayed, paused };
  }
}
