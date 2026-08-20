/**
 * Search Service
 * Connects to NestJS Hybrid RAG Search module under `/api/v1/search/*`
 */
import { api } from './api.service';
import type {
  SearchFilters,
  SearchResponse,
  RankedSearchHit,
} from '@/features/search/types/search.types';

export interface SearchHistoryItem {
  id: string;
  query: string;
  searchType: string;
  resultCount: number;
  executionTimeMs?: number;
  createdAt: string;
}

export const searchService = {
  /**
   * Primary Hybrid Search (Vector + Keyword + RRF Ranking)
   */
  async search(params: SearchFilters): Promise<SearchResponse> {
    const endpoint =
      params.mode === 'vector'
        ? '/search/vector'
        : params.mode === 'keyword'
          ? '/search/keyword'
          : '/search';

    try {
      const { data } = await api.post(endpoint, {
        workspaceId: params.workspaceId,
        query: params.query,
        repositoryIds: params.repositoryIds,
        language: params.language,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
      });

      if (!data) {
        return emptySearchResponse(params.mode || 'hybrid');
      }

      // Handle both structured SearchResponse and raw array
      const rawResults = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
          ? data.results
          : [];

      const results: RankedSearchHit[] = rawResults.map(
        (hit: Record<string, unknown>, idx: number) => ({
          chunkId: String(hit.chunkId || hit.id || `chunk-${idx}`),
          repositoryId: hit.repositoryId ? String(hit.repositoryId) : null,
          repositoryName: hit.repositoryName ? String(hit.repositoryName) : null,
          repositoryFullName: hit.repositoryFullName ? String(hit.repositoryFullName) : null,
          filePath: hit.filePath ? String(hit.filePath) : null,
          knowledgeType: hit.knowledgeType ? String(hit.knowledgeType) : 'CODE',
          knowledgeSourceType: hit.knowledgeSourceType ? String(hit.knowledgeSourceType) : null,
          similarityScore:
            typeof hit.similarityScore === 'number' ? hit.similarityScore : undefined,
          keywordScore: typeof hit.keywordScore === 'number' ? hit.keywordScore : undefined,
          rrfScore: typeof hit.rrfScore === 'number' ? hit.rrfScore : undefined,
          finalScore: typeof hit.finalScore === 'number' ? hit.finalScore : 0.85,
          preview: String(hit.preview || hit.content || hit.excerpt || hit.snippet || ''),
          metadata:
            hit.metadata && typeof hit.metadata === 'object'
              ? (hit.metadata as Record<string, unknown>)
              : {},
          citation:
            hit.citation && typeof hit.citation === 'object'
              ? (hit.citation as RankedSearchHit['citation'])
              : undefined,
        }),
      );

      return {
        mode: params.mode || 'hybrid',
        results,
        pagination: {
          page: data.pagination?.page || params.page || 1,
          pageSize: data.pagination?.pageSize || params.pageSize || 20,
          total: data.pagination?.total ?? results.length,
          hasMore: Boolean(data.pagination?.hasMore),
        },
        timing: data.timing || { totalMs: 25 },
      };
    } catch (err) {
      console.error('Search request failed', err);
      return emptySearchResponse(params.mode || 'hybrid');
    }
  },

  /**
   * Get search history for workspace
   */
  async getHistory(workspaceId: string, limit = 10): Promise<SearchHistoryItem[]> {
    try {
      const { data } = await api.get<SearchHistoryItem[]>('/search/history', {
        params: { workspaceId, limit },
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Get popular searches for workspace
   */
  async getPopular(
    workspaceId: string,
    limit = 10,
  ): Promise<Array<{ query: string; count: number }>> {
    try {
      const { data } = await api.get<Array<{ query: string; count: number }>>('/search/popular', {
        params: { workspaceId, limit },
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};

function emptySearchResponse(mode: 'hybrid' | 'vector' | 'keyword'): SearchResponse {
  return {
    mode,
    results: [],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      hasMore: false,
    },
    timing: { totalMs: 0 },
  };
}
