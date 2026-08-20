/**
 * Search Service
 * Connects to NestJS Hybrid RAG Search module under `/api/v1/search/*`
 */
import { api } from './api.service';

export interface SearchResultItem {
  id?: string;
  title: string;
  path?: string;
  snippet: string;
  score: number | string;
  type: string;
  repositoryName?: string;
  repositoryId?: string;
  url?: string;
  language?: string;
  lineRange?: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
  totalResults: number;
  executionTimeMs?: number;
  query: string;
}

export interface SearchRequestParams {
  workspaceId: string;
  query: string;
  repositoryIds?: string[];
  entityTypes?: string[];
  limit?: number;
  offset?: number;
}

interface RawSearchResult {
  id?: string;
  knowledgeChunkId?: string;
  title?: string;
  filePath?: string;
  path?: string;
  content?: string;
  excerpt?: string;
  snippet?: string;
  score?: number | string;
  relevanceScore?: number | string;
  rrfScore?: number | string;
  entityType?: string;
  repositoryName?: string;
  url?: string;
}

interface BackendSearchEnvelope {
  results?: RawSearchResult[];
  total?: number;
  executionTimeMs?: number;
}

export const searchService = {
  /**
   * Hybrid search (RRF ranking vector + fulltext)
   */
  async search(params: SearchRequestParams): Promise<SearchResponse> {
    try {
      const { data } = await api.post<BackendSearchEnvelope | RawSearchResult[]>('/search', {
        workspaceId: params.workspaceId,
        query: params.query,
        repositoryIds: params.repositoryIds,
        entityTypes: params.entityTypes,
        limit: params.limit || 20,
        offset: params.offset || 0,
      });

      // Normalize results from backend
      const rawList: RawSearchResult[] = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray(data.results)
          ? data.results
          : [];

      const results: SearchResultItem[] = rawList.map((item: RawSearchResult) => ({
        id: item.id || item.knowledgeChunkId,
        title: item.title || item.filePath || 'Search Result',
        path: item.filePath || item.path,
        snippet: item.content || item.excerpt || item.snippet || '',
        score: item.score || item.relevanceScore || item.rrfScore || 0.9,
        type: item.entityType || (item.filePath?.includes('/') ? 'CODE_SYMBOL' : 'DOCUMENTATION'),
        repositoryName: item.repositoryName,
        url: item.url,
      }));

      const total =
        data && typeof data === 'object' && 'total' in data && typeof data.total === 'number'
          ? data.total
          : results.length;

      const executionTime =
        data && typeof data === 'object' && 'executionTimeMs' in data
          ? data.executionTimeMs
          : undefined;

      return {
        results,
        totalResults: total,
        executionTimeMs: executionTime,
        query: params.query,
      };
    } catch {
      return {
        results: [],
        totalResults: 0,
        query: params.query,
      };
    }
  },
};
