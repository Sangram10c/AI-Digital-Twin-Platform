import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { KNOWLEDGE_METADATA_KEYS } from '../constants/knowledge.constants';
import {
  KnowledgeDocumentKind,
  KnowledgeProcessingStatus,
  NormalizedKnowledgeDocument,
} from '../interfaces/knowledge.interfaces';
import { contentChecksum } from '../utils/checksum.util';

export interface PersistedKnowledgeDocument {
  documentKind: KnowledgeDocumentKind;
  documentId: string;
  workspaceId: string;
  repositoryId: string;
  contentChecksum: string;
  skipped: boolean;
}

@Injectable()
export class DocumentBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertDocument(
    document: NormalizedKnowledgeDocument,
    options: { force?: boolean } = {},
  ): Promise<PersistedKnowledgeDocument> {
    const checksum = contentChecksum(document.rawContent);
    const existing = await this.findExisting(document);

    if (!options.force && existing) {
      const existingChecksum = await this.resolveChecksum(
        document,
        existing.id,
      );
      if (
        existingChecksum === checksum &&
        (await this.readStatusForDocument(document, existing.id)) ===
          KnowledgeProcessingStatus.COMPLETED
      ) {
        return {
          documentKind: document.documentKind,
          documentId: existing.id,
          workspaceId: document.workspaceId,
          repositoryId: document.repositoryId,
          contentChecksum: checksum,
          skipped: true,
        };
      }
    }

    const metadata = this.buildMetadata(
      document,
      checksum,
      document.documentKind === KnowledgeDocumentKind.SOURCE
        ? (existing as { metadata?: unknown } | null)?.metadata
        : undefined,
    );

    if (document.documentKind === KnowledgeDocumentKind.DOCUMENTATION) {
      const saved = await this.prisma.documentation.upsert({
        where: {
          repositoryId_filePath: {
            repositoryId: document.repositoryId,
            filePath: document.path ?? document.externalRefId,
          },
        },
        create: {
          repositoryId: document.repositoryId,
          title: document.title,
          content: document.rawContent,
          filePath: document.path ?? document.externalRefId,
          type: document.documentationType ?? 'OTHER',
          lastSyncedAt: new Date(),
        },
        update: {
          title: document.title,
          content: document.rawContent,
          type: document.documentationType ?? 'OTHER',
          lastSyncedAt: new Date(),
        },
      });

      await this.prisma.knowledgeSource.upsert({
        where: {
          workspaceId_sourceType_externalRefId: {
            workspaceId: document.workspaceId,
            sourceType: 'DOCUMENTATION',
            externalRefId: saved.filePath ?? saved.id,
          },
        },
        create: {
          workspaceId: document.workspaceId,
          repositoryId: document.repositoryId,
          sourceType: 'DOCUMENTATION',
          externalRefId: saved.filePath ?? saved.id,
          internalRefId: saved.id,
          title: saved.title,
          path: saved.filePath ?? undefined,
          metadata: metadata,
        },
        update: {
          title: saved.title,
          path: saved.filePath ?? undefined,
          internalRefId: saved.id,
          metadata: metadata,
        },
      });

      return {
        documentKind: KnowledgeDocumentKind.DOCUMENTATION,
        documentId: saved.id,
        workspaceId: document.workspaceId,
        repositoryId: document.repositoryId,
        contentChecksum: checksum,
        skipped: false,
      };
    }

    const saved = await this.prisma.knowledgeSource.upsert({
      where: {
        workspaceId_sourceType_externalRefId: {
          workspaceId: document.workspaceId,
          sourceType: document.sourceType!,
          externalRefId: document.externalRefId,
        },
      },
      create: {
        workspaceId: document.workspaceId,
        repositoryId: document.repositoryId,
        sourceType: document.sourceType!,
        externalRefId: document.externalRefId,
        internalRefId: document.internalRefId,
        title: document.title,
        url: document.url,
        path: document.path,
        metadata: metadata,
      },
      update: {
        title: document.title,
        url: document.url,
        path: document.path,
        internalRefId: document.internalRefId,
        metadata: metadata,
      },
    });

    return {
      documentKind: KnowledgeDocumentKind.SOURCE,
      documentId: saved.id,
      workspaceId: document.workspaceId,
      repositoryId: document.repositoryId,
      contentChecksum: checksum,
      skipped: false,
    };
  }

  async markProcessing(
    documentKind: KnowledgeDocumentKind,
    documentId: string,
  ): Promise<void> {
    await this.patchMetadata(documentKind, documentId, {
      [KNOWLEDGE_METADATA_KEYS.processingStatus]:
        KnowledgeProcessingStatus.PROCESSING,
    });
  }

  async markCompleted(
    documentKind: KnowledgeDocumentKind,
    documentId: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    await this.patchMetadata(documentKind, documentId, {
      ...patch,
      [KNOWLEDGE_METADATA_KEYS.processingStatus]:
        KnowledgeProcessingStatus.COMPLETED,
      [KNOWLEDGE_METADATA_KEYS.lastProcessedAt]: new Date().toISOString(),
      [KNOWLEDGE_METADATA_KEYS.processingError]: null,
    });
  }

  async markFailed(
    documentKind: KnowledgeDocumentKind,
    documentId: string,
    error: string,
  ): Promise<void> {
    await this.patchMetadata(documentKind, documentId, {
      [KNOWLEDGE_METADATA_KEYS.processingStatus]:
        KnowledgeProcessingStatus.FAILED,
      [KNOWLEDGE_METADATA_KEYS.processingError]: error,
      [KNOWLEDGE_METADATA_KEYS.lastProcessedAt]: new Date().toISOString(),
    });
  }

  async markSkipped(
    documentKind: KnowledgeDocumentKind,
    documentId: string,
    checksum: string,
  ): Promise<void> {
    await this.patchMetadata(documentKind, documentId, {
      [KNOWLEDGE_METADATA_KEYS.processingStatus]:
        KnowledgeProcessingStatus.SKIPPED,
      [KNOWLEDGE_METADATA_KEYS.contentChecksum]: checksum,
      [KNOWLEDGE_METADATA_KEYS.lastProcessedAt]: new Date().toISOString(),
    });
  }

  private async findExisting(document: NormalizedKnowledgeDocument) {
    if (document.documentKind === KnowledgeDocumentKind.DOCUMENTATION) {
      return this.prisma.documentation.findFirst({
        where: {
          repositoryId: document.repositoryId,
          filePath: document.path ?? document.externalRefId,
        },
      });
    }

    return this.prisma.knowledgeSource.findUnique({
      where: {
        workspaceId_sourceType_externalRefId: {
          workspaceId: document.workspaceId,
          sourceType: document.sourceType!,
          externalRefId: document.externalRefId,
        },
      },
    });
  }

  private buildMetadata(
    document: NormalizedKnowledgeDocument,
    checksum: string,
    existingMetadata?: unknown,
  ) {
    const base =
      existingMetadata && typeof existingMetadata === 'object'
        ? (existingMetadata as Record<string, unknown>)
        : {};

    const version =
      typeof base[KNOWLEDGE_METADATA_KEYS.version] === 'number'
        ? (base[KNOWLEDGE_METADATA_KEYS.version] as number) + 1
        : 1;

    return {
      ...base,
      ...document.metadata,
      [KNOWLEDGE_METADATA_KEYS.rawContent]: document.rawContent,
      [KNOWLEDGE_METADATA_KEYS.contentChecksum]: checksum,
      [KNOWLEDGE_METADATA_KEYS.processingStatus]:
        KnowledgeProcessingStatus.PENDING,
      [KNOWLEDGE_METADATA_KEYS.version]: version,
    };
  }

  private async patchMetadata(
    documentKind: KnowledgeDocumentKind,
    documentId: string,
    patch: Record<string, unknown>,
  ) {
    if (documentKind === KnowledgeDocumentKind.DOCUMENTATION) {
      const current = await this.prisma.documentation.findUnique({
        where: { id: documentId },
      });
      if (!current) return;

      const source = await this.prisma.knowledgeSource.findFirst({
        where: {
          internalRefId: documentId,
          sourceType: 'DOCUMENTATION',
        },
      });

      if (source) {
        await this.prisma.knowledgeSource.update({
          where: { id: source.id },
          data: {
            metadata: {
              ...(typeof source.metadata === 'object' && source.metadata
                ? source.metadata
                : {}),
              ...patch,
            } as Prisma.InputJsonValue,
          },
        });
      }
      return;
    }

    const current = await this.prisma.knowledgeSource.findUnique({
      where: { id: documentId },
    });
    if (!current) return;

    await this.prisma.knowledgeSource.update({
      where: { id: documentId },
      data: {
        metadata: {
          ...(typeof current.metadata === 'object' && current.metadata
            ? current.metadata
            : {}),
          ...patch,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private async resolveChecksum(
    document: NormalizedKnowledgeDocument,
    existingId: string,
  ): Promise<string | undefined> {
    if (document.documentKind === KnowledgeDocumentKind.DOCUMENTATION) {
      const source = await this.prisma.knowledgeSource.findFirst({
        where: { internalRefId: existingId, sourceType: 'DOCUMENTATION' },
      });
      return this.readChecksum(source?.metadata);
    }

    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id: existingId },
    });
    return this.readChecksum(source?.metadata);
  }

  private async readStatusForDocument(
    document: NormalizedKnowledgeDocument,
    existingId: string,
  ): Promise<KnowledgeProcessingStatus | undefined> {
    if (document.documentKind === KnowledgeDocumentKind.DOCUMENTATION) {
      const source = await this.prisma.knowledgeSource.findFirst({
        where: { internalRefId: existingId, sourceType: 'DOCUMENTATION' },
      });
      return this.readStatus(source?.metadata);
    }

    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id: existingId },
    });
    return this.readStatus(source?.metadata);
  }

  private readChecksum(metadata: unknown): string | undefined {
    if (!metadata || typeof metadata !== 'object') return undefined;
    return (metadata as Record<string, unknown>)[
      KNOWLEDGE_METADATA_KEYS.contentChecksum
    ] as string | undefined;
  }

  private readStatus(metadata: unknown): KnowledgeProcessingStatus | undefined {
    if (!metadata || typeof metadata !== 'object') return undefined;
    return (metadata as Record<string, unknown>)[
      KNOWLEDGE_METADATA_KEYS.processingStatus
    ] as KnowledgeProcessingStatus | undefined;
  }
}
