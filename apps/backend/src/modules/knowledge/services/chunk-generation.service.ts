import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EmbeddingOrchestrationService } from '../../embeddings/services/embedding-orchestration.service';
import { KNOWLEDGE_METADATA_KEYS } from '../constants/knowledge.constants';
import {
  KnowledgeDocumentKind,
  NormalizedKnowledgeDocument,
} from '../interfaces/knowledge.interfaces';
import { contentChecksum } from '../utils/checksum.util';
import { ContentCleanerService } from '../normalizers/content-cleaner.service';
import { LanguageDetectorService } from '../extractors/language-detector.service';
import { KnowledgeValidatorService } from '../validators/knowledge-validator.service';
import { DocumentBuilderService } from './document-builder.service';
import { KnowledgeChunkerService } from './knowledge-chunker.service';

@Injectable()
export class ChunkGenerationService {
  private readonly logger = new Logger(ChunkGenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: KnowledgeValidatorService,
    private readonly cleaner: ContentCleanerService,
    private readonly languageDetector: LanguageDetectorService,
    private readonly chunker: KnowledgeChunkerService,
    private readonly documentBuilder: DocumentBuilderService,
    @Optional()
    private readonly embeddingOrchestration?: EmbeddingOrchestrationService,
  ) {}

  async generateForDocument(
    documentKind: KnowledgeDocumentKind,
    documentId: string,
    options: { force?: boolean } = {},
  ) {
    const document = await this.loadDocument(documentKind, documentId);
    await this.documentBuilder.markProcessing(documentKind, documentId);

    try {
      this.validator.validateDocument(document);
      const cleaned = this.cleaner.clean(document.rawContent);
      const enrichedMetadata = this.languageDetector.applyToMetadata(
        document,
        cleaned,
      );
      document.metadata = enrichedMetadata;

      const checksum = contentChecksum(document.rawContent);
      const existingChecksum = await this.readStoredChecksum(
        documentKind,
        documentId,
      );

      if (
        !options.force &&
        existingChecksum === checksum &&
        (await this.hasActiveChunks(documentKind, documentId))
      ) {
        await this.documentBuilder.markSkipped(
          documentKind,
          documentId,
          checksum,
        );
        return {
          skipped: true,
          chunkCount: 0,
          workspaceId: document.workspaceId,
          repositoryId: document.repositoryId,
          documentKind,
          documentId,
          sourceType: document.sourceType,
        };
      }

      const drafts = this.chunker.chunkDocument(cleaned);
      const chunkCount = await this.persistChunks(
        documentKind,
        documentId,
        document,
        drafts,
      );

      await this.documentBuilder.markCompleted(documentKind, documentId, {
        [KNOWLEDGE_METADATA_KEYS.contentChecksum]: checksum,
        [KNOWLEDGE_METADATA_KEYS.chunkCount]: chunkCount,
        [KNOWLEDGE_METADATA_KEYS.detectedLanguage]:
          enrichedMetadata.detectedLanguage,
        [KNOWLEDGE_METADATA_KEYS.languageKind]: enrichedMetadata.languageKind,
      });

      if (
        chunkCount > 0 &&
        document.repositoryId &&
        this.embeddingOrchestration
      ) {
        try {
          await this.embeddingOrchestration.enqueueIncrementalForRepository(
            document.repositoryId,
            document.workspaceId,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to enqueue incremental embeddings for repo=${document.repositoryId}: ${
              error instanceof Error ? error.message : 'unknown'
            }`,
          );
        }
      }

      return {
        skipped: false,
        chunkCount,
        workspaceId: document.workspaceId,
        repositoryId: document.repositoryId,
        documentKind,
        documentId,
        sourceType: document.sourceType,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Chunk generation failed';
      await this.documentBuilder.markFailed(documentKind, documentId, message);
      throw error;
    }
  }

  private async loadDocument(
    documentKind: KnowledgeDocumentKind,
    documentId: string,
  ): Promise<NormalizedKnowledgeDocument> {
    if (documentKind === KnowledgeDocumentKind.DOCUMENTATION) {
      const doc = await this.prisma.documentation.findUnique({
        where: { id: documentId },
        include: { repository: true },
      });
      if (!doc) {
        throw new Error(`Documentation ${documentId} not found`);
      }

      return {
        documentKind,
        workspaceId: doc.repository.workspaceId,
        repositoryId: doc.repositoryId,
        documentationType: doc.type,
        externalRefId: doc.filePath ?? doc.id,
        internalRefId: doc.id,
        title: doc.title,
        rawContent: doc.content ?? '',
        path: doc.filePath ?? undefined,
        metadata: {
          filePath: doc.filePath ?? undefined,
          documentType: doc.type.toLowerCase(),
        },
      };
    }

    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id: documentId },
    });
    if (!source) {
      throw new Error(`Knowledge source ${documentId} not found`);
    }

    const metadata =
      source.metadata && typeof source.metadata === 'object'
        ? (source.metadata as Record<string, unknown>)
        : {};

    const rawValue = metadata[KNOWLEDGE_METADATA_KEYS.rawContent];
    const rawContent =
      typeof rawValue === 'string'
        ? rawValue
        : typeof rawValue === 'number'
          ? String(rawValue)
          : '';

    return {
      documentKind,
      workspaceId: source.workspaceId,
      repositoryId: source.repositoryId ?? '',
      sourceType: source.sourceType,
      externalRefId: source.externalRefId,
      internalRefId: source.internalRefId ?? undefined,
      title: source.title ?? source.externalRefId,
      rawContent,
      path: source.path ?? undefined,
      url: source.url ?? undefined,
      metadata: metadata,
    };
  }

  private async readStoredChecksum(
    documentKind: KnowledgeDocumentKind,
    documentId: string,
  ): Promise<string | undefined> {
    if (documentKind === KnowledgeDocumentKind.DOCUMENTATION) {
      const source = await this.prisma.knowledgeSource.findFirst({
        where: { internalRefId: documentId, sourceType: 'DOCUMENTATION' },
      });
      return this.extractChecksum(source?.metadata);
    }

    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id: documentId },
    });
    return this.extractChecksum(source?.metadata);
  }

  private extractChecksum(metadata: unknown): string | undefined {
    if (!metadata || typeof metadata !== 'object') return undefined;
    return (metadata as Record<string, unknown>)[
      KNOWLEDGE_METADATA_KEYS.contentChecksum
    ] as string | undefined;
  }

  private async hasActiveChunks(
    documentKind: KnowledgeDocumentKind,
    documentId: string,
  ): Promise<boolean> {
    const count = await this.prisma.knowledgeChunk.count({
      where: {
        deletedAt: null,
        ...(documentKind === KnowledgeDocumentKind.DOCUMENTATION
          ? { documentationId: documentId }
          : { knowledgeSourceId: documentId }),
      },
    });
    return count > 0;
  }

  private async persistChunks(
    documentKind: KnowledgeDocumentKind,
    documentId: string,
    document: NormalizedKnowledgeDocument,
    drafts: ReturnType<KnowledgeChunkerService['chunkDocument']>,
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      if (documentKind === KnowledgeDocumentKind.DOCUMENTATION) {
        await tx.knowledgeChunk.updateMany({
          where: { documentationId: documentId, deletedAt: null },
          data: { deletedAt: now },
        });
      } else {
        await tx.knowledgeChunk.updateMany({
          where: { knowledgeSourceId: documentId, deletedAt: null },
          data: { deletedAt: now },
        });
      }

      if (drafts.length === 0) {
        return 0;
      }

      await tx.knowledgeChunk.createMany({
        data: drafts.map((draft) => ({
          workspaceId: document.workspaceId,
          repositoryId: document.repositoryId,
          knowledgeSourceId:
            documentKind === KnowledgeDocumentKind.SOURCE
              ? documentId
              : undefined,
          documentationId:
            documentKind === KnowledgeDocumentKind.DOCUMENTATION
              ? documentId
              : undefined,
          content: draft.content,
          chunkIndex: draft.chunkIndex,
          tokenCount: draft.tokenCount,
          contentHash: draft.contentHash,
          metadata: {
            ...draft.metadata,
            documentType: document.metadata.documentType,
            detectedLanguage: document.metadata.detectedLanguage,
          },
        })),
      });

      this.logger.debug(
        `Persisted ${drafts.length} chunks for ${documentKind}:${documentId}`,
      );

      return drafts.length;
    });
  }
}
