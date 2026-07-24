import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import {
  EMBEDDING_DEFAULTS,
  EMBEDDING_JOBS,
  EMBEDDING_QUEUES,
} from '../constants/embeddings.constants';
import { EmbeddingJobPayload } from '../interfaces/embeddings.interfaces';
import { EmbeddingsService } from '../services/embeddings.service';

@Processor(EMBEDDING_QUEUES.EMBEDDINGS, {
  concurrency: EMBEDDING_DEFAULTS.concurrency,
})
export class EmbeddingProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbeddingProcessor.name);

  constructor(
    private readonly embeddings: EmbeddingsService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<EmbeddingJobPayload>): Promise<unknown> {
    const concurrency =
      this.config.get<number>('ai.embeddings.concurrency') ??
      EMBEDDING_DEFAULTS.concurrency;
    this.logger.debug(
      `Embedding job=${job.id} name=${job.name} concurrencyCfg=${concurrency}`,
    );

    await job.updateProgress(5);

    switch (job.name) {
      case EMBEDDING_JOBS.DELETE: {
        if (!job.data.knowledgeChunkId) {
          throw new Error('knowledgeChunkId required for DELETE_EMBEDDING');
        }
        await this.embeddings.deleteEmbedding(job.data.knowledgeChunkId);
        await job.updateProgress(100);
        return { deleted: job.data.knowledgeChunkId };
      }
      case EMBEDDING_JOBS.GENERATE:
      case EMBEDDING_JOBS.REGENERATE:
      case EMBEDDING_JOBS.RETRY:
      case EMBEDDING_JOBS.GENERATE_BATCH: {
        const ids =
          job.data.knowledgeChunkIds ??
          (job.data.knowledgeChunkId ? [job.data.knowledgeChunkId] : []);
        if (ids.length === 0) {
          throw new Error('No knowledgeChunkIds provided');
        }
        await job.updateProgress(20);
        const summary = await this.embeddings.embedChunks({
          knowledgeChunkIds: ids,
          force:
            job.data.force === true ||
            job.name === EMBEDDING_JOBS.REGENERATE ||
            job.name === EMBEDDING_JOBS.RETRY,
          provider: job.data.provider,
        });
        await job.updateProgress(100);
        if (summary.failed > 0 && summary.completed === 0) {
          throw new Error(
            `Embedding batch failed for all ${summary.failed} chunks`,
          );
        }
        return summary;
      }
      default:
        throw new Error(`Unknown embedding job: ${job.name}`);
    }
  }
}
