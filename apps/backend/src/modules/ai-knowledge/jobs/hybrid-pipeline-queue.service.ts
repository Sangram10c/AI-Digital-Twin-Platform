import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  HYBRID_DEFAULTS,
  HYBRID_JOBS,
  HYBRID_QUEUES,
  AIExtractionMode,
} from '../constants/hybrid-pipeline.constants';
import type { SupportedAiProvider } from '../interfaces/ai-knowledge.interfaces';

export interface HybridPipelineJobPayload {
  workspaceId: string;
  repositoryId: string;
  mode?: AIExtractionMode | string;
  provider?: SupportedAiProvider;
  force?: boolean;
  trigger?: string;
  stage?: 'heuristics' | 'digest-builder' | 'ai-extraction' | 'embeddings';
}

@Injectable()
export class HybridPipelineQueueService {
  private readonly logger = new Logger(HybridPipelineQueueService.name);

  constructor(
    @InjectQueue(HYBRID_QUEUES.HEURISTICS)
    private readonly heuristicsQueue: Queue,
    @InjectQueue(HYBRID_QUEUES.DIGEST_BUILDER)
    private readonly digestQueue: Queue,
    @InjectQueue(HYBRID_QUEUES.AI_EXTRACTION)
    private readonly aiQueue: Queue,
    @InjectQueue(HYBRID_QUEUES.EMBEDDINGS)
    private readonly embeddingsQueue: Queue,
  ) {}

  async enqueuePipeline(payload: HybridPipelineJobPayload) {
    this.logger.log(
      `Enqueue hybrid heuristics for repo=${payload.repositoryId} mode=${payload.mode ?? 'default'}`,
    );
    return this.heuristicsQueue.add(HYBRID_JOBS.RUN_HEURISTICS, payload, {
      jobId: `hybrid-heuristics-${payload.repositoryId}-${Date.now()}`,
      attempts: HYBRID_DEFAULTS.maxAiRetries,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
  }

  async enqueueDigestBuilder(payload: HybridPipelineJobPayload) {
    return this.digestQueue.add(HYBRID_JOBS.BUILD_DIGESTS, payload, {
      jobId: `hybrid-digest-${payload.repositoryId}-${Date.now()}`,
      attempts: HYBRID_DEFAULTS.maxAiRetries,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
  }

  async enqueueAiExtraction(payload: HybridPipelineJobPayload) {
    return this.aiQueue.add(HYBRID_JOBS.EXTRACT_AI, payload, {
      jobId: `hybrid-ai-${payload.repositoryId}-${Date.now()}`,
      attempts: HYBRID_DEFAULTS.maxAiRetries,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
  }

  async enqueueEmbeddingsStub(payload: HybridPipelineJobPayload) {
    return this.embeddingsQueue.add(HYBRID_JOBS.EMBED_STUB, payload, {
      jobId: `hybrid-embed-${payload.repositoryId}-${Date.now()}`,
      attempts: 1,
      removeOnComplete: 50,
      removeOnFail: 50,
    });
  }

  async getQueueCounts() {
    const entries: Array<[string, Queue]> = [
      [HYBRID_QUEUES.HEURISTICS, this.heuristicsQueue],
      [HYBRID_QUEUES.DIGEST_BUILDER, this.digestQueue],
      [HYBRID_QUEUES.AI_EXTRACTION, this.aiQueue],
      [HYBRID_QUEUES.EMBEDDINGS, this.embeddingsQueue],
    ];

    const counts: Record<string, unknown> = {};
    await Promise.all(
      entries.map(async ([name, queue]) => {
        try {
          counts[name] = await Promise.race([
            queue.getJobCounts(
              'waiting',
              'active',
              'completed',
              'failed',
              'delayed',
            ),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 2500),
            ),
          ]);
        } catch {
          counts[name] = { error: 'unavailable' };
        }
      }),
    );
    return counts;
  }
}
