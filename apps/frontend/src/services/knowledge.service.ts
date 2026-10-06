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
  path?: string | null;
  externalRefId?: string | null;
  documentType?: string;
  sourceType?: string;
  chunkCount?: number;
  _count?: { chunks?: number };
  isEmbedded?: boolean;
  status?: string;
  processingStatus?: string;
  repositoryId?: string | null;
  repositoryName?: string | null;
  repository?: { name?: string | null } | null;
  metadata?: {
    filePath?: string | null;
    chunkCount?: number;
    [key: string]: unknown;
  } | null;
  updatedAt?: string;
}

interface RawChunk {
  id: string;
  knowledgeSourceId?: string;
  documentationId?: string;
  documentId?: string;
  chunkIndex?: number;
  content?: string;
  contentPreview?: string;
  tokenCount?: number;
  isEmbedded?: boolean;
  filePath?: string;
  metadata?: { filePath?: string };
  createdAt?: string;
}

interface RawKnowledgeStatistics {
  totalDocuments?: number;
  totalChunks?: number;
  embeddedChunks?: number;
  pendingJobs?: number;
  totals?: {
    knowledgeSources?: number;
    documentationFiles?: number;
    activeChunks?: number;
  };
  processingStatus?: {
    COMPLETED?: number;
  };
  queues?: {
    waiting?: number;
    active?: number;
  };
}

export const knowledgeService = {
  /**
   * List knowledge documents
   */
  async listDocuments(workspaceId: string, page = 1, limit = 50): Promise<KnowledgeDocument[]> {
    try {
      const { data } = await api.get<unknown>('/knowledge/documents', {
        params: { workspaceId, page, limit },
      });
      const resData = data as Record<string, unknown> | RawKnowledgeDocument[];
      const list: RawKnowledgeDocument[] = Array.isArray(resData)
        ? resData
        : Array.isArray((resData as { items?: unknown })?.items)
          ? (resData as { items: RawKnowledgeDocument[] }).items
          : Array.isArray((resData as { data?: unknown })?.data)
            ? (resData as { data: RawKnowledgeDocument[] }).data
            : [];

      return list.map((d: RawKnowledgeDocument) => ({
        id: d.id,
        title: d.title || d.filePath || d.path || d.externalRefId || 'Document',
        filePath: d.filePath || d.path || d.metadata?.filePath || null,
        documentType: d.documentType || d.sourceType || 'DOCUMENTATION',
        chunkCount: d.chunkCount ?? d.metadata?.chunkCount ?? d._count?.chunks ?? 0,
        isEmbedded: d.isEmbedded ?? (d.processingStatus === 'COMPLETED' || (d.chunkCount ?? 0) > 0),
        status: d.processingStatus || d.status || 'PROCESSED',
        repositoryId: d.repositoryId,
        repositoryName: d.repositoryName || d.repository?.name || null,
        updatedAt: d.updatedAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },

  /**
   * List knowledge chunks
   */
  async listChunks(
    workspaceId: string,
    page = 1,
    limit = 50,
    documentId?: string,
  ): Promise<KnowledgeChunk[]> {
    try {
      const { data } = await api.get<unknown>('/knowledge/chunks', {
        params: { workspaceId, page, limit, ...(documentId ? { documentId } : {}) },
      });
      const resData = data as Record<string, unknown> | RawChunk[];
      const list: RawChunk[] = Array.isArray(resData)
        ? resData
        : Array.isArray((resData as { items?: unknown })?.items)
          ? (resData as { items: RawChunk[] }).items
          : Array.isArray((resData as { data?: unknown })?.data)
            ? (resData as { data: RawChunk[] }).data
            : [];
      return list.map((c: RawChunk) => ({
        id: c.id,
        documentId: c.knowledgeSourceId || c.documentationId || c.documentId || '',
        chunkIndex: c.chunkIndex ?? 0,
        content: c.content || c.contentPreview || '',
        tokenCount: c.tokenCount ?? 0,
        isEmbedded: c.isEmbedded ?? true,
        filePath: c.filePath || c.metadata?.filePath,
        createdAt: c.createdAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get knowledge statistics
   */
  async getStatistics(workspaceId: string): Promise<KnowledgeStatistics> {
    try {
      const { data } = await api.get<RawKnowledgeStatistics>('/knowledge/statistics', {
        params: { workspaceId },
      });
      if (!data) {
        return {
          totalDocuments: 0,
          totalChunks: 0,
          embeddedChunks: 0,
          pendingJobs: 0,
        };
      }

      const totalDocs =
        data.totalDocuments ??
        (data.totals?.knowledgeSources ?? 0) + (data.totals?.documentationFiles ?? 0);
      const totalChunks = data.totalChunks ?? data.totals?.activeChunks ?? 0;
      const embeddedChunks =
        data.embeddedChunks ?? data.totals?.activeChunks ?? data.processingStatus?.COMPLETED ?? 0;
      const pendingJobs =
        data.pendingJobs ?? (data.queues?.waiting ?? 0) + (data.queues?.active ?? 0);

      return {
        totalDocuments: totalDocs,
        totalChunks,
        embeddedChunks,
        pendingJobs,
      };
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
   * Get single knowledge document with raw content
   */
  async getDocument(id: string, workspaceId: string): Promise<Record<string, unknown> | null> {
    try {
      const { data } = await api.get<Record<string, unknown>>(`/knowledge/documents/${id}`, {
        params: { workspaceId },
      });
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Get single knowledge chunk
   */
  async getChunk(id: string, workspaceId: string): Promise<Record<string, unknown> | null> {
    try {
      const { data } = await api.get<Record<string, unknown>>(`/knowledge/chunks/${id}`, {
        params: { workspaceId },
      });
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Get full file content by file path in workspace
   */
  async getFileContent(
    workspaceId: string,
    filePath: string,
  ): Promise<{
    filePath: string;
    repositoryId?: string;
    content: string;
    chunkCount: number;
  } | null> {
    try {
      const { data } = await api.get<{
        filePath: string;
        repositoryId?: string;
        content: string;
        chunkCount: number;
      }>('/knowledge/file', {
        params: { workspaceId, filePath },
      });
      return data;
    } catch {
      return null;
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
