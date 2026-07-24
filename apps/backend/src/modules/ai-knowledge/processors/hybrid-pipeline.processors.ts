import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { KnowledgeHeuristicsService } from '../../knowledge-heuristics/services/knowledge-heuristics.service';
import { EmbeddingOrchestrationService } from '../../embeddings/services/embedding-orchestration.service';
import {
  AIExtractionMode,
  HYBRID_QUEUES,
} from '../constants/hybrid-pipeline.constants';
import {
  HybridPipelineJobPayload,
  HybridPipelineQueueService,
} from '../jobs/hybrid-pipeline-queue.service';
import { DigestBuilderService } from '../services/digest-builder.service';
import { HybridAiPipelineService } from '../services/hybrid-ai-pipeline.service';

@Processor(HYBRID_QUEUES.HEURISTICS, { concurrency: 1 })
export class HybridHeuristicsProcessor extends WorkerHost {
  private readonly logger = new Logger(HybridHeuristicsProcessor.name);

  constructor(
    private readonly heuristics: KnowledgeHeuristicsService,
    private readonly queue: HybridPipelineQueueService,
    private readonly pipeline: HybridAiPipelineService,
  ) {
    super();
  }

  async process(job: Job<HybridPipelineJobPayload>): Promise<unknown> {
    const mode = this.pipeline.resolveMode(job.data.mode);
    this.logger.log(
      `Heuristics stage repo=${job.data.repositoryId} mode=${mode}`,
    );
    await this.heuristics.extractForRepository(job.data.repositoryId);
    await this.queue.enqueueDigestBuilder({
      ...job.data,
      mode,
      stage: 'digest-builder',
    });
    return { stage: 'heuristics', ok: true };
  }
}

@Processor(HYBRID_QUEUES.DIGEST_BUILDER, { concurrency: 1 })
export class HybridDigestBuilderProcessor extends WorkerHost {
  private readonly logger = new Logger(HybridDigestBuilderProcessor.name);

  constructor(
    private readonly heuristics: KnowledgeHeuristicsService,
    private readonly digestBuilder: DigestBuilderService,
    private readonly queue: HybridPipelineQueueService,
    private readonly pipeline: HybridAiPipelineService,
  ) {
    super();
  }

  async process(job: Job<HybridPipelineJobPayload>): Promise<unknown> {
    const mode = this.pipeline.resolveMode(job.data.mode);
    this.logger.log(
      `Digest builder stage repo=${job.data.repositoryId} mode=${mode}`,
    );
    const heuristicsResult = await this.heuristics.extractForRepository(
      job.data.repositoryId,
    );
    const digests = await this.digestBuilder.buildForRepository(
      job.data.repositoryId,
      heuristicsResult,
      { mode: mode === AIExtractionMode.FULL ? 'FULL' : 'LIGHT' },
    );

    if (mode === AIExtractionMode.HEURISTICS_ONLY) {
      await this.queue.enqueueEmbeddingsStub({
        ...job.data,
        mode,
        stage: 'embeddings',
      });
      return { stage: 'digest-builder', digests, skippedAi: true };
    }

    await this.queue.enqueueAiExtraction({
      ...job.data,
      mode,
      stage: 'ai-extraction',
    });
    return { stage: 'digest-builder', digests };
  }
}

@Processor(HYBRID_QUEUES.AI_EXTRACTION, { concurrency: 1 })
export class HybridAiExtractionProcessor extends WorkerHost {
  private readonly logger = new Logger(HybridAiExtractionProcessor.name);

  constructor(
    private readonly pipeline: HybridAiPipelineService,
    private readonly queue: HybridPipelineQueueService,
  ) {
    super();
  }

  async process(job: Job<HybridPipelineJobPayload>): Promise<unknown> {
    this.logger.log(`AI extraction stage repo=${job.data.repositoryId}`);
    const result = await this.pipeline.runAiOnRepositoryDigests({
      repositoryId: job.data.repositoryId,
      workspaceId: job.data.workspaceId,
      mode: job.data.mode,
      provider: job.data.provider,
      force: job.data.force,
    });
    await this.queue.enqueueEmbeddingsStub({
      ...job.data,
      stage: 'embeddings',
    });
    return result;
  }
}

/**
 * Hybrid stage hand-off → EmbeddingModule pgvector queue (Phase 09).
 * Keeps hybrid-embeddings queue name for backward compatibility.
 */
@Processor(HYBRID_QUEUES.EMBEDDINGS, { concurrency: 1 })
export class HybridEmbeddingsStubProcessor extends WorkerHost {
  private readonly logger = new Logger(HybridEmbeddingsStubProcessor.name);

  constructor(
    private readonly embeddingOrchestration: EmbeddingOrchestrationService,
  ) {
    super();
  }

  async process(job: Job<HybridPipelineJobPayload>): Promise<unknown> {
    this.logger.log(
      `Hybrid embeddings stage → enqueue pgvector pipeline repo=${job.data.repositoryId}`,
    );
    const result =
      await this.embeddingOrchestration.enqueueIncrementalForRepository(
        job.data.repositoryId,
        job.data.workspaceId,
      );
    return {
      stage: 'embeddings',
      status: 'ENQUEUED',
      repositoryId: job.data.repositoryId,
      result,
    };
  }
}
