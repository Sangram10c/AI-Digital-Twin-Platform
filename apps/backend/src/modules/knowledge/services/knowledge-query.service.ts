import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { KNOWLEDGE_METADATA_KEYS } from '../constants/knowledge.constants';
import {
  KnowledgeDocumentKind,
  KnowledgeProcessingStatus,
} from '../interfaces/knowledge.interfaces';
import { KnowledgeQueueService } from '../jobs/knowledge-queue.service';

@Injectable()
export class KnowledgeQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: KnowledgeQueueService,
  ) {}

  async listDocuments(params: {
    workspaceId: string;
    repositoryId?: string;
    sourceType?: string;
    status?: KnowledgeProcessingStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.KnowledgeSourceWhereInput = {
      workspaceId: params.workspaceId,
      ...(params.repositoryId ? { repositoryId: params.repositoryId } : {}),
      ...(params.sourceType ? { sourceType: params.sourceType as never } : {}),
    };

    const [sources, sourceCount, documentation, documentationCount] =
      await Promise.all([
        this.prisma.knowledgeSource.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.knowledgeSource.count({ where }),
        params.repositoryId
          ? this.prisma.documentation.findMany({
              where: { repositoryId: params.repositoryId },
              skip,
              take: limit,
              orderBy: { updatedAt: 'desc' },
            })
          : Promise.resolve([]),
        params.repositoryId
          ? this.prisma.documentation.count({
              where: { repositoryId: params.repositoryId },
            })
          : Promise.resolve(0),
      ]);

    const sourceItems = sources
      .map((source) => this.mapSourceDocument(source))
      .filter((item) =>
        params.status ? item.processingStatus === params.status : true,
      );

    const documentationItems = documentation.map((doc) =>
      this.mapDocumentationDocument(doc),
    );

    return {
      items: [...sourceItems, ...documentationItems],
      pagination: {
        page,
        limit,
        total: sourceCount + documentationCount,
      },
    };
  }

  async getDocument(id: string, workspaceId: string) {
    const source = await this.prisma.knowledgeSource.findFirst({
      where: { id, workspaceId },
    });
    if (source) {
      return this.mapSourceDocument(source, true);
    }

    const documentation = await this.prisma.documentation.findFirst({
      where: { id, repository: { workspaceId } },
      include: { repository: true },
    });
    if (documentation) {
      return this.mapDocumentationDocument(documentation, true);
    }

    throw new NotFoundException(`Knowledge document ${id} not found`);
  }

  async listChunks(params: {
    workspaceId: string;
    repositoryId?: string;
    documentId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.KnowledgeChunkWhereInput = {
      workspaceId: params.workspaceId,
      deletedAt: null,
      ...(params.repositoryId ? { repositoryId: params.repositoryId } : {}),
      ...(params.documentId
        ? {
            OR: [
              { knowledgeSourceId: params.documentId },
              { documentationId: params.documentId },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.knowledgeChunk.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ knowledgeSourceId: 'asc' }, { chunkIndex: 'asc' }],
      }),
      this.prisma.knowledgeChunk.count({ where }),
    ]);

    return {
      items: items.map((chunk) => ({
        id: chunk.id,
        workspaceId: chunk.workspaceId,
        repositoryId: chunk.repositoryId,
        knowledgeSourceId: chunk.knowledgeSourceId,
        documentationId: chunk.documentationId,
        chunkIndex: chunk.chunkIndex,
        tokenCount: chunk.tokenCount,
        contentHash: chunk.contentHash,
        contentPreview: chunk.content.slice(0, 240),
        metadata: chunk.metadata,
        createdAt: chunk.createdAt,
        updatedAt: chunk.updatedAt,
      })),
      pagination: { page, limit, total },
    };
  }

  async getChunk(id: string, workspaceId: string) {
    const chunk = await this.prisma.knowledgeChunk.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!chunk) {
      throw new NotFoundException(`Knowledge chunk ${id} not found`);
    }

    return {
      id: chunk.id,
      workspaceId: chunk.workspaceId,
      repositoryId: chunk.repositoryId,
      knowledgeSourceId: chunk.knowledgeSourceId,
      documentationId: chunk.documentationId,
      chunkIndex: chunk.chunkIndex,
      tokenCount: chunk.tokenCount,
      contentHash: chunk.contentHash,
      content: chunk.content,
      metadata: chunk.metadata,
      createdAt: chunk.createdAt,
      updatedAt: chunk.updatedAt,
    };
  }

  async getStatistics(workspaceId: string, repositoryId?: string) {
    const sourceWhere: Prisma.KnowledgeSourceWhereInput = {
      workspaceId,
      ...(repositoryId ? { repositoryId } : {}),
    };
    const chunkWhere: Prisma.KnowledgeChunkWhereInput = {
      workspaceId,
      deletedAt: null,
      ...(repositoryId ? { repositoryId } : {}),
    };

    const [
      sourceCount,
      chunkCount,
      documentationCount,
      statusGroups,
      queueCounts,
    ] = await Promise.all([
      this.prisma.knowledgeSource.count({ where: sourceWhere }),
      this.prisma.knowledgeChunk.count({ where: chunkWhere }),
      repositoryId
        ? this.prisma.documentation.count({ where: { repositoryId } })
        : this.prisma.documentation.count({
            where: { repository: { workspaceId } },
          }),
      this.prisma.knowledgeSource.findMany({
        where: sourceWhere,
        select: { metadata: true },
      }),
      this.queueService.getQueueCounts(),
    ]);

    const processingStatus = this.aggregateStatuses(statusGroups);

    return {
      workspaceId,
      repositoryId,
      totals: {
        knowledgeSources: sourceCount,
        documentationFiles: documentationCount,
        activeChunks: chunkCount,
      },
      processingStatus,
      queues: queueCounts,
    };
  }

  private mapSourceDocument(
    source: {
      id: string;
      workspaceId: string;
      repositoryId: string | null;
      sourceType: string;
      externalRefId: string;
      internalRefId: string | null;
      title: string | null;
      url: string | null;
      path: string | null;
      metadata: unknown;
      createdAt: Date;
      updatedAt: Date;
    },
    includeContent = false,
  ) {
    const metadata = this.asMetadata(source.metadata);
    return {
      id: source.id,
      documentKind: KnowledgeDocumentKind.SOURCE,
      workspaceId: source.workspaceId,
      repositoryId: source.repositoryId,
      sourceType: source.sourceType,
      externalRefId: source.externalRefId,
      internalRefId: source.internalRefId,
      title: source.title,
      url: source.url,
      path: source.path,
      documentType: metadata.documentType,
      processingStatus: metadata.processingStatus,
      contentChecksum: metadata.contentChecksum,
      lastProcessedAt: metadata.lastProcessedAt,
      detectedLanguage: metadata.detectedLanguage,
      chunkCount: metadata.chunkCount,
      rawContent: includeContent ? metadata.rawContent : undefined,
      metadata,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };
  }

  private mapDocumentationDocument(
    documentation: {
      id: string;
      repositoryId: string;
      title: string;
      content: string | null;
      filePath: string | null;
      type: string;
      createdAt: Date;
      updatedAt: Date;
    },
    includeContent = false,
  ) {
    return {
      id: documentation.id,
      documentKind: KnowledgeDocumentKind.DOCUMENTATION,
      repositoryId: documentation.repositoryId,
      sourceType: 'DOCUMENTATION',
      externalRefId: documentation.filePath ?? documentation.id,
      title: documentation.title,
      path: documentation.filePath,
      documentType: documentation.type.toLowerCase(),
      rawContent: includeContent ? documentation.content : undefined,
      createdAt: documentation.createdAt,
      updatedAt: documentation.updatedAt,
    };
  }

  private asMetadata(metadata: unknown) {
    if (!metadata || typeof metadata !== 'object') {
      return {} as Record<string, unknown>;
    }
    return metadata as Record<string, unknown>;
  }

  private aggregateStatuses(
    sources: Array<{ metadata: unknown }>,
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const source of sources) {
      const metadata = this.asMetadata(source.metadata);
      const status =
        (metadata[KNOWLEDGE_METADATA_KEYS.processingStatus] as string) ??
        KnowledgeProcessingStatus.PENDING;
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }
}
