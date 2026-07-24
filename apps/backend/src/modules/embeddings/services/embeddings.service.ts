import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  EMBEDDING_DEFAULTS,
  EmbeddingProviderName,
} from '../constants/embeddings.constants';
import {
  EmbedBatchSummary,
  EmbedChunkResult,
  type EmbeddingProvider,
} from '../interfaces/embeddings.interfaces';
import { createEmbeddingProvider } from '../providers/embedding-provider.factory';
import { EmbeddingChecksumService } from './embedding-checksum.service';
import { EmbeddingStorageService } from './embedding-storage.service';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly checksum: EmbeddingChecksumService,
    private readonly storage: EmbeddingStorageService,
  ) {}

  /** Always build from current config (avoids stale empty API keys after .env edits). */
  getProvider(override?: EmbeddingProviderName): EmbeddingProvider {
    return createEmbeddingProvider(this.config, override);
  }

  async embedChunks(input: {
    knowledgeChunkIds: string[];
    force?: boolean;
    provider?: EmbeddingProviderName;
  }): Promise<EmbedBatchSummary> {
    const provider = this.getProvider(input.provider);
    const version =
      this.config.get<number>('ai.embeddings.version') ??
      EMBEDDING_DEFAULTS.version;
    const batchSize =
      this.config.get<number>('ai.embeddings.batchSize') ??
      EMBEDDING_DEFAULTS.batchSize;

    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: {
        id: { in: input.knowledgeChunkIds },
      },
      include: { embedding: true },
    });

    const byId = new Map(chunks.map((c) => [c.id, c]));
    const results: EmbedChunkResult[] = [];
    let cacheHits = 0;
    let completed = 0;
    let skipped = 0;
    let failed = 0;

    const toEmbed: Array<{
      id: string;
      content: string;
      checksum: string;
    }> = [];

    for (const id of input.knowledgeChunkIds) {
      const chunk = byId.get(id);
      if (!chunk) {
        results.push({
          knowledgeChunkId: id,
          status: 'FAILED',
          reason: 'chunk_not_found',
        });
        failed += 1;
        continue;
      }
      if (chunk.deletedAt) {
        results.push({
          knowledgeChunkId: id,
          status: 'SKIPPED',
          reason: 'deleted',
        });
        skipped += 1;
        continue;
      }
      const content = chunk.content?.trim() ?? '';
      if (!content) {
        results.push({
          knowledgeChunkId: id,
          status: 'SKIPPED',
          reason: 'empty',
        });
        skipped += 1;
        continue;
      }

      const contentChecksum = this.checksum.resolveChunkChecksum(chunk);
      const existing = chunk.embedding;
      const sameChecksum =
        existing?.checksum === contentChecksum &&
        existing.status === EmbeddingStatus.COMPLETED &&
        existing.provider === provider.providerName() &&
        existing.model === provider.model() &&
        existing.version === version;

      if (!input.force && sameChecksum) {
        cacheHits += 1;
        results.push({
          knowledgeChunkId: id,
          status: 'SKIPPED',
          reason: 'checksum_unchanged',
          embeddingId: existing.id,
          dimensions: existing.dimensions,
        });
        skipped += 1;
        continue;
      }

      toEmbed.push({ id, content, checksum: contentChecksum });
    }

    for (let i = 0; i < toEmbed.length; i += batchSize) {
      const batch = toEmbed.slice(i, i + batchSize);
      const started = Date.now();
      const providerMeta = {
        provider: provider.providerName(),
        model: provider.model(),
        dimensions: provider.dimensions(),
      };
      try {
        for (const item of batch) {
          await this.storage.markProcessing(item.id, providerMeta);
        }
        const response = await provider.generateEmbeddings(
          batch.map((b) => b.content),
        );
        const latencyMs = Date.now() - started;
        const perItemMs = Math.round(latencyMs / Math.max(1, batch.length));

        for (let j = 0; j < batch.length; j += 1) {
          const item = batch[j];
          const vector = response.embeddings[j];
          if (!vector) {
            await this.storage.markFailed(
              item.id,
              'missing_vector_in_batch',
              0,
              providerMeta,
            );
            results.push({
              knowledgeChunkId: item.id,
              status: 'FAILED',
              reason: 'missing_vector_in_batch',
            });
            failed += 1;
            continue;
          }
          try {
            const embeddingId = await this.storage.upsertWithVector({
              knowledgeChunkId: item.id,
              provider: provider.providerName(),
              model: provider.model(),
              version,
              dimensions: provider.dimensions(),
              checksum: item.checksum,
              vector,
              latencyMs: perItemMs,
              tokenUsage: response.tokenUsage
                ? Math.round(response.tokenUsage / batch.length)
                : undefined,
            });
            results.push({
              knowledgeChunkId: item.id,
              status: 'COMPLETED',
              embeddingId,
              latencyMs: perItemMs,
              dimensions: provider.dimensions(),
            });
            completed += 1;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'store_failed';
            await this.storage.markFailed(item.id, message, 0, providerMeta);
            results.push({
              knowledgeChunkId: item.id,
              status: 'FAILED',
              reason: message,
            });
            failed += 1;
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'provider_batch_failed';
        this.logger.warn(`Embedding batch failed: ${message}`);
        for (const item of batch) {
          await this.storage.markFailed(item.id, message, 0, providerMeta);
          results.push({
            knowledgeChunkId: item.id,
            status: 'FAILED',
            reason: message,
          });
          failed += 1;
        }
      }
    }

    return {
      processed: results.length,
      completed,
      skipped,
      failed,
      results,
      provider: provider.providerName(),
      model: provider.model(),
      cacheHits,
    };
  }

  async deleteEmbedding(knowledgeChunkId: string): Promise<void> {
    await this.storage.markDeleted(knowledgeChunkId);
  }
}
