/**
 * Knowledge Feature Types
 */

export interface KnowledgeDocument {
  id: string;
  title?: string | null;
  filePath?: string | null;
  documentType: string;
  chunkCount: number;
  isEmbedded?: boolean;
  status?: string;
  repositoryId?: string | null;
  repositoryName?: string | null;
  updatedAt: string;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  isEmbedded: boolean;
  filePath?: string;
  createdAt: string;
}

export interface KnowledgeStatistics {
  totalDocuments: number;
  totalChunks: number;
  embeddedChunks: number;
  pendingJobs: number;
}
