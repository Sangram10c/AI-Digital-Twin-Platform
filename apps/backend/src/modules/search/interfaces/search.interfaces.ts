import type { KnowledgeSourceType, SearchType } from '@prisma/client';
import type { SearchMode, SearchTopK } from '../constants/search.constants';

export interface SearchFilters {
  workspaceId: string;
  repositoryIds?: string[];
  branch?: string;
  language?: string;
  framework?: string;
  module?: string;
  directory?: string;
  fileExtension?: string;
  documentType?: string;
  knowledgeSourceType?: KnowledgeSourceType;
  commitSha?: string;
  pullRequestId?: string;
  issueId?: string;
  tag?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ProcessedQuery {
  raw: string;
  normalized: string;
  language: string;
  keywords: string[];
  expandedTerms: string[];
  phrases: string[];
  exactTerms: string[];
  repositoryAliases: string[];
  tsQuery: string;
  /** Terms suitable for embedding (normalized + expansions). */
  embeddingText: string;
}

export interface VectorHit {
  chunkId: string;
  similarity: number;
  rank: number;
}

export interface KeywordHit {
  chunkId: string;
  keywordScore: number;
  rank: number;
  headline?: string;
}

export interface RankedSearchHit {
  chunkId: string;
  repositoryId: string | null;
  repositoryName: string | null;
  repositoryFullName: string | null;
  filePath: string | null;
  knowledgeType: string | null;
  knowledgeSourceType: KnowledgeSourceType | null;
  similarityScore: number;
  keywordScore: number;
  qualityScore: number;
  freshnessScore: number;
  repositoryPriority: number;
  rrfScore: number;
  finalScore: number;
  preview: string;
  metadata: Record<string, unknown>;
  citation: {
    knowledgeChunkId: string;
    knowledgeSourceId: string | null;
    documentationId: string | null;
    path: string | null;
    title: string | null;
    externalRefId: string | null;
  };
}

export interface SearchTiming {
  totalMs: number;
  queryMs: number;
  embeddingMs: number;
  vectorMs: number;
  keywordMs: number;
  rankMs: number;
  cacheHit: boolean;
}

export interface SearchResponse {
  mode: SearchMode;
  query: ProcessedQuery;
  results: RankedSearchHit[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  timing: SearchTiming;
  searchType: SearchType;
}

export interface SearchExecuteInput {
  userId: string;
  mode: SearchMode;
  query: string;
  filters: SearchFilters;
  topK: SearchTopK;
  page: number;
  pageSize: number;
  skipCache?: boolean;
}
