/**
 * Search Feature Types
 * Mapped to NestJS Search module and RankedSearchHit schema.
 */

export type SearchMode = 'hybrid' | 'vector' | 'keyword';

export interface SearchCitation {
  knowledgeChunkId: string;
  knowledgeSourceId?: string | null;
  documentationId?: string | null;
  path?: string | null;
  title?: string | null;
  externalRefId?: string | null;
}

export interface RankedSearchHit {
  chunkId: string;
  repositoryId?: string | null;
  repositoryName?: string | null;
  repositoryFullName?: string | null;
  filePath?: string | null;
  knowledgeType?: string | null;
  knowledgeSourceType?: string | null;
  similarityScore?: number;
  keywordScore?: number;
  rrfScore?: number;
  finalScore?: number;
  preview: string;
  metadata?: {
    startLine?: number;
    endLine?: number;
    language?: string;
    symbolName?: string;
    branch?: string;
    commitSha?: string;
    [key: string]: unknown;
  };
  citation?: SearchCitation;
}

export interface SearchTiming {
  totalMs: number;
  queryMs?: number;
  embeddingMs?: number;
  vectorMs?: number;
  keywordMs?: number;
  rankMs?: number;
  cacheHit?: boolean;
}

export interface SearchResponse {
  mode: SearchMode;
  results: RankedSearchHit[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  timing?: SearchTiming;
}

export interface SearchFilters {
  workspaceId: string;
  query: string;
  mode?: SearchMode;
  repositoryIds?: string[];
  language?: string;
  page?: number;
  pageSize?: number;
}
