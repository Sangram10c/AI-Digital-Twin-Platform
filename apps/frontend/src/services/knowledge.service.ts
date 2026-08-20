/**
 * Knowledge Service
 * Connects to NestJS Knowledge Base module under `/api/v1/knowledge/*`
 */
import { api } from './api.service';

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

interface RawKnowledgeDocument {
  id: string;
  title?: string | null;
  filePath?: string | null;
  documentType?: string;
  sourceType?: string;
  chunkCount?: number;
  _count?: { chunks?: number };
  isEmbedded?: boolean;
  status?: string;
  repositoryId?: string | null;
  repositoryName?: string | null;
  updatedAt?: string;
}

export const knowledgeService = {
  /**
   * List knowledge documents
   */
  async listDocuments(workspaceId: string, page = 1, limit = 50): Promise<KnowledgeDocument[]> {
    try {
      const { data } = await api.get<{ data?: RawKnowledgeDocument[] } | RawKnowledgeDocument[]>(
        '/knowledge/documents',
        {
          params: { workspaceId, page, limit },
        },
      );
      const list: RawKnowledgeDocument[] = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray(data.data)
          ? data.data
          : [];

      return list.map((d: RawKnowledgeDocument) => ({
        id: d.id,
        title: d.title || d.filePath || 'Document',
        filePath: d.filePath,
        documentType: d.documentType || d.sourceType || 'DOCUMENTATION',
        chunkCount: d.chunkCount || d._count?.chunks || 0,
        isEmbedded: d.isEmbedded ?? true,
        status: d.status || 'PROCESSED',
        repositoryId: d.repositoryId,
        repositoryName: d.repositoryName,
        updatedAt: d.updatedAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },

  /**
   * List knowledge chunks
   */
  async listChunks(workspaceId: string, page = 1, limit = 50): Promise<KnowledgeChunk[]> {
    try {
      const { data } = await api.get<{ data?: KnowledgeChunk[] } | KnowledgeChunk[]>(
        '/knowledge/chunks',
        {
          params: { workspaceId, page, limit },
        },
      );
      const list: KnowledgeChunk[] = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray(data.data)
          ? data.data
          : [];
      return list;
    } catch {
      return [];
    }
  },

  /**
   * Get knowledge statistics
   */
  async getStatistics(workspaceId: string): Promise<KnowledgeStatistics> {
    try {
      const { data } = await api.get<KnowledgeStatistics>('/knowledge/statistics', {
        params: { workspaceId },
      });
      return (
        data || {
          totalDocuments: 0,
          totalChunks: 0,
          embeddedChunks: 0,
          pendingJobs: 0,
        }
      );
    } catch {
      return {
        totalDocuments: 0,
        totalChunks: 0,
        embeddedChunks: 0,
        pendingJobs: 0,
      };
    }
  },

  /**
   * Enqueue knowledge processing
   */
  async processWorkspace(
    workspaceId: string,
    force = false,
  ): Promise<{ accepted: boolean; message: string }> {
    const { data } = await api.post('/knowledge/process', { workspaceId, force });
    return data;
  },
};
