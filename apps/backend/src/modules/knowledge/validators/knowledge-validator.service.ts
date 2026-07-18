import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DEFAULT_KNOWLEDGE_LIMITS } from '../constants/knowledge.constants';
import { NormalizedKnowledgeDocument } from '../interfaces/knowledge.interfaces';

@Injectable()
export class KnowledgeValidatorService {
  constructor(private readonly prisma: PrismaService) {}

  async assertRepositoryProcessable(repositoryId: string) {
    const repository = await this.prisma.repository.findFirst({
      where: { id: repositoryId, deletedAt: null },
    });

    if (!repository) {
      throw new NotFoundException(`Repository ${repositoryId} not found`);
    }

    if (repository.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Repository ${repositoryId} is not active for knowledge processing`,
      );
    }

    return repository;
  }

  validateContentSize(content: string, filePath?: string): void {
    const byteLength = Buffer.byteLength(content, 'utf8');
    if (byteLength > DEFAULT_KNOWLEDGE_LIMITS.maxFileSizeBytes) {
      throw new BadRequestException(
        `Content exceeds maximum size (${DEFAULT_KNOWLEDGE_LIMITS.maxFileSizeBytes} bytes)${
          filePath ? ` for ${filePath}` : ''
        }`,
      );
    }
  }

  validateDocument(document: NormalizedKnowledgeDocument): void {
    if (!document.rawContent?.trim()) {
      throw new BadRequestException(
        `Document ${document.externalRefId} has no processable content`,
      );
    }

    this.validateContentSize(
      document.rawContent,
      document.path ?? document.metadata.filePath,
    );

    if (this.isUnsupportedPath(document.path ?? document.metadata.filePath)) {
      throw new BadRequestException(
        `Unsupported file type: ${document.path ?? document.metadata.filePath}`,
      );
    }
  }

  isUnsupportedPath(filePath?: string): boolean {
    if (!filePath) return false;
    return /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|tar|exe|dll|bin|woff2?|ttf|mp4|mp3)$/i.test(
      filePath,
    );
  }

  async assertSourceExists(
    documentKind: 'source' | 'documentation',
    documentId: string,
  ) {
    if (documentKind === 'source') {
      const source = await this.prisma.knowledgeSource.findUnique({
        where: { id: documentId },
      });
      if (!source) {
        throw new NotFoundException(`Knowledge source ${documentId} not found`);
      }
      return source;
    }

    const documentation = await this.prisma.documentation.findUnique({
      where: { id: documentId },
    });
    if (!documentation) {
      throw new NotFoundException(`Documentation ${documentId} not found`);
    }
    return documentation;
  }
}
