import { EmbeddingProviderName } from '../constants/embeddings.constants';

export interface EmbeddingVectorResult {
  embedding: number[];
  tokenUsage?: number;
}

export interface EmbeddingBatchResult {
  embeddings: number[][];
  tokenUsage?: number;
}

/**
 * Pluggable embedding backend — never couple callers to a specific vendor.
 */
export interface EmbeddingProvider {
  providerName(): EmbeddingProviderName;
  model(): string;
  dimensions(): number;
  health(): Promise<{ ok: boolean; detail?: string }>;
  generateEmbedding(text: string): Promise<EmbeddingVectorResult>;
  generateEmbeddings(texts: string[]): Promise<EmbeddingBatchResult>;
}

export interface EmbeddingJobPayload {
  workspaceId: string;
  repositoryId?: string;
  knowledgeChunkId?: string;
  knowledgeChunkIds?: string[];
  force?: boolean;
  provider?: EmbeddingProviderName;
  /** Job correlation / monitoring */
  trigger?: string;
}

export interface EmbedChunkResult {
  knowledgeChunkId: string;
  status: 'COMPLETED' | 'SKIPPED' | 'FAILED';
  reason?: string;
  embeddingId?: string;
  latencyMs?: number;
  dimensions?: number;
}

export interface EmbedBatchSummary {
  processed: number;
  completed: number;
  skipped: number;
  failed: number;
  results: EmbedChunkResult[];
  provider: EmbeddingProviderName;
  model: string;
  cacheHits: number;
}
