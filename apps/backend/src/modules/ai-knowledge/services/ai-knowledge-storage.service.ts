import { createHash } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Documentation, KnowledgeSource, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AI_KNOWLEDGE_METADATA_KEYS } from '../constants/ai-knowledge.constants';
import {
  AiAnalysisDocument,
  AiAnalysisKind,
  AiExtractionMetadata,
  ExtractedEngineeringKnowledge,
} from '../interfaces/ai-knowledge.interfaces';

@Injectable()
export class AiKnowledgeStorageService {
  constructor(private readonly prisma: PrismaService) {}

  checksum(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }

  async loadAnalysisDocument(
    kind: AiAnalysisKind,
    id: string,
  ): Promise<AiAnalysisDocument> {
    if (kind === 'document') {
      const documentation = await this.prisma.documentation.findUnique({
        where: { id },
        include: { repository: true },
      });
      if (!documentation) {
        throw new NotFoundException(`Documentation ${id} not found`);
      }
      const source = await this.ensureDocumentationSource(documentation);
      const content = documentation.content ?? '';
      return {
        id: source.id,
        workspaceId: documentation.repository.workspaceId,
        repositoryId: documentation.repositoryId,
        title: documentation.title,
        content,
        contentChecksum: this.checksum(content),
        sourceType: source.sourceType,
        documentationType: documentation.type,
        externalRefId: source.externalRefId,
        internalRefId: source.internalRefId,
        path: documentation.filePath,
        metadata: this.asObject(source.metadata),
        kind,
      };
    }

    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id },
    });
    if (!source) {
      throw new NotFoundException(`Knowledge source ${id} not found`);
    }
    const metadata = this.asObject(source.metadata);
    const content =
      typeof metadata.rawContent === 'string' ? metadata.rawContent : '';
    return {
      id: source.id,
      workspaceId: source.workspaceId,
      repositoryId: source.repositoryId,
      title: source.title ?? source.externalRefId,
      content,
      contentChecksum: this.checksum(content),
      sourceType: source.sourceType,
      externalRefId: source.externalRefId,
      internalRefId: source.internalRefId,
      path: source.path,
      metadata,
      kind,
    };
  }

  readExtractionMetadata(
    document: AiAnalysisDocument,
  ): AiExtractionMetadata | undefined {
    const raw = document.metadata[AI_KNOWLEDGE_METADATA_KEYS.extraction];
    if (!raw || typeof raw !== 'object') {
      return undefined;
    }
    return raw as AiExtractionMetadata;
  }

  async saveExtraction(
    document: AiAnalysisDocument,
    extraction: AiExtractionMetadata,
  ): Promise<void> {
    if (document.kind === 'document') {
      const source = await this.prisma.knowledgeSource.findUnique({
        where: { id: document.id },
      });
      if (!source) return;
      await this.prisma.knowledgeSource.update({
        where: { id: source.id },
        data: {
          metadata: {
            ...this.asObject(source.metadata),
            [AI_KNOWLEDGE_METADATA_KEYS.extraction]: extraction,
          } as unknown as Prisma.InputJsonValue,
        },
      });
      return;
    }

    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id: document.id },
    });
    if (!source) return;
    await this.prisma.knowledgeSource.update({
      where: { id: source.id },
      data: {
        metadata: {
          ...this.asObject(source.metadata),
          [AI_KNOWLEDGE_METADATA_KEYS.extraction]: extraction,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    if (document.kind === 'repository' && document.repositoryId) {
      const repository = await this.prisma.repository.findUnique({
        where: { id: document.repositoryId },
      });
      if (repository) {
        await this.prisma.repository.update({
          where: { id: document.repositoryId },
          data: {
            providerMetadata: {
              ...this.asObject(repository.providerMetadata),
              [AI_KNOWLEDGE_METADATA_KEYS.repositoryInsights]:
                extraction.result as ExtractedEngineeringKnowledge,
            } as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }
  }

  private async ensureDocumentationSource(
    documentation: Documentation & {
      repository: { workspaceId: string };
    },
  ): Promise<KnowledgeSource> {
    return this.prisma.knowledgeSource.upsert({
      where: {
        workspaceId_sourceType_externalRefId: {
          workspaceId: documentation.repository.workspaceId,
          sourceType: 'DOCUMENTATION',
          externalRefId: documentation.filePath ?? documentation.id,
        },
      },
      create: {
        workspaceId: documentation.repository.workspaceId,
        repositoryId: documentation.repositoryId,
        sourceType: 'DOCUMENTATION',
        externalRefId: documentation.filePath ?? documentation.id,
        internalRefId: documentation.id,
        title: documentation.title,
        path: documentation.filePath,
        metadata: {
          documentType: documentation.type.toLowerCase(),
          rawContent: documentation.content ?? '',
          filePath: documentation.filePath,
        },
      },
      update: {
        title: documentation.title,
        path: documentation.filePath,
        internalRefId: documentation.id,
        metadata: {
          documentType: documentation.type.toLowerCase(),
          rawContent: documentation.content ?? '',
          filePath: documentation.filePath,
        },
      },
    });
  }

  private asObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object') {
      return {};
    }
    return value as Record<string, unknown>;
  }
}
