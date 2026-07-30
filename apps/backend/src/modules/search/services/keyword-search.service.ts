import { Injectable } from '@nestjs/common';
import type {
  KeywordHit,
  SearchFilters,
} from '../interfaces/search.interfaces';
import { SearchRepository } from '../repositories/search.repository';

@Injectable()
export class KeywordSearchService {
  constructor(private readonly repo: SearchRepository) {}

  /**
   * PostgreSQL full-text search (tsvector / tsquery / ts_rank).
   * Independent of vector search — no embedding or AI calls.
   */
  async search(
    filters: SearchFilters,
    tsQuery: string,
    fallbackQuery: string,
    topK: number,
    pathTerms: string[] = [],
  ): Promise<{ hits: KeywordHit[]; keywordMs: number }> {
    const started = Date.now();
    let hits = await this.repo.keywordSearch(filters, tsQuery, topK);
    if (!hits.length && fallbackQuery.trim()) {
      hits = await this.repo.keywordSearch(filters, fallbackQuery, topK);
    }

    // Also match source file paths/names (e.g. embedding-storage.service.ts)
    // so implementation files surface even when docs dominate FTS for "pgvector".
    if (pathTerms.length) {
      const pathHits = await this.repo.pathKeywordSearch(
        filters,
        pathTerms,
        Math.min(Math.max(topK, 40), 50),
      );
      hits = this.mergeHits(hits, pathHits, topK);
    }

    return { hits, keywordMs: Date.now() - started };
  }

  private mergeHits(
    primary: KeywordHit[],
    secondary: KeywordHit[],
    topK: number,
  ): KeywordHit[] {
    const byId = new Map<string, KeywordHit>();
    for (const hit of primary) {
      byId.set(hit.chunkId, hit);
    }
    for (const hit of secondary) {
      const existing = byId.get(hit.chunkId);
      if (!existing || hit.keywordScore > existing.keywordScore) {
        byId.set(hit.chunkId, hit);
      }
    }
    return [...byId.values()]
      .sort((a, b) => b.keywordScore - a.keywordScore)
      .slice(0, topK)
      .map((hit, index) => ({ ...hit, rank: index + 1 }));
  }
}
