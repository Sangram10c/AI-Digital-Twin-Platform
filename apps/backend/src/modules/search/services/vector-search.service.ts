import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { EmbeddingsService } from '../../embeddings/services/embeddings.service';
import type { SearchFilters, VectorHit } from '../interfaces/search.interfaces';
import { SearchRepository } from '../repositories/search.repository';
import { SearchCacheService } from './search-cache.service';

@Injectable()
export class VectorSearchService {
  constructor(
    private readonly embeddings: EmbeddingsService,
    private readonly repo: SearchRepository,
    private readonly cache: SearchCacheService,
  ) {}

  /**
   * Semantic nearest-neighbor search via pgvector.
   * Uses the configured embedding provider only — never chat/LLM models.
   */
  async search(
    filters: SearchFilters,
    embeddingText: string,
    topK: number,
  ): Promise<{ hits: VectorHit[]; embeddingMs: number; vectorMs: number }> {
    const embedStart = Date.now();
    const vector = await this.embedQuery(embeddingText);
    const embeddingMs = Date.now() - embedStart;

    const vectorStart = Date.now();
    const hits = await this.repo.vectorSearch(filters, vector, topK);
    const vectorMs = Date.now() - vectorStart;

    return { hits, embeddingMs, vectorMs };
  }

  private async embedQuery(text: string): Promise<number[]> {
    const hash = createHash('sha256').update(text).digest('hex');
    const cached = await this.cache.getEmbedding(hash);
    if (cached?.length) return cached;

    const provider = this.embeddings.getProvider();
    const result = await provider.generateEmbedding(text);
    await this.cache.setEmbedding(hash, result.embedding);
    return result.embedding;
  }
}
