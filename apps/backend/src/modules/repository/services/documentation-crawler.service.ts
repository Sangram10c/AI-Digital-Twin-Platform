import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { DocumentationType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { GithubApiClient } from '../../github/services/github-api.client';
import { OAuthTokenStorageService } from '../../github/services/oauth-token-storage.service';
import {
  DEFAULT_REPOSITORY_SYNC_LIMITS,
  DOCUMENTATION_DIR_PREFIXES,
  DOCUMENTATION_ROOT_FILES,
  DOCUMENTATION_SKIP_EXTENSIONS,
  DOCUMENTATION_SKIP_PARTS,
} from '../constants/repository-sync.constants';
import { SyncCheckpointService } from './sync-checkpoint.service';

export interface DocumentationCrawlResult {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

@Injectable()
export class DocumentationCrawlerService {
  private readonly logger = new Logger(DocumentationCrawlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubApi: GithubApiClient,
    private readonly tokenStorage: OAuthTokenStorageService,
    private readonly checkpoints: SyncCheckpointService,
  ) {}

  async crawlRepository(
    repositoryId: string,
    options: { force?: boolean } = {},
  ): Promise<DocumentationCrawlResult> {
    const repository = await this.prisma.repository.findFirst({
      where: { id: repositoryId, deletedAt: null },
      include: {
        connectedAccount: { include: { oauthToken: true } },
      },
    });

    if (!repository?.connectedAccount?.oauthToken) {
      throw new Error(`Repository ${repositoryId} missing OAuth token`);
    }

    const [owner, repo] = repository.fullName.split('/');
    if (!owner || !repo) {
      throw new Error(`Invalid repository fullName: ${repository.fullName}`);
    }

    const accessToken = this.tokenStorage.decryptAccessToken(
      repository.connectedAccount.oauthToken,
    );

    const tree = await this.githubApi.getRepositoryTreePaths({
      accessToken,
      owner,
      repo,
      ref: repository.defaultBranch,
    });

    const candidates = tree
      .filter((path) => this.isDocumentationPath(path))
      .slice(0, DEFAULT_REPOSITORY_SYNC_LIMITS.maxDocFiles);

    const result: DocumentationCrawlResult = {
      discovered: candidates.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    };

    for (const path of candidates) {
      try {
        const file = await this.githubApi.getRepositoryFileContent({
          accessToken,
          owner,
          repo,
          path,
          ref: repository.defaultBranch,
        });
        if (!file) {
          result.skipped += 1;
          continue;
        }

        if (
          Buffer.byteLength(file.content, 'utf8') >
          DEFAULT_REPOSITORY_SYNC_LIMITS.maxDocBytes
        ) {
          result.skipped += 1;
          continue;
        }

        const checksum = createHash('sha256')
          .update(file.content, 'utf8')
          .digest('hex');
        const existing = await this.prisma.documentation.findUnique({
          where: {
            repositoryId_filePath: { repositoryId, filePath: path },
          },
        });

        if (
          !options.force &&
          existing?.providerDocId === file.sha &&
          existing.content === file.content
        ) {
          result.skipped += 1;
          continue;
        }

        // Soft checksum compare via providerDocId (GitHub blob sha)
        if (!options.force && existing?.providerDocId === checksum) {
          result.skipped += 1;
          continue;
        }

        const type = this.mapDocumentationType(path);
        const title = path.split('/').pop() ?? path;

        if (existing) {
          await this.prisma.documentation.update({
            where: { id: existing.id },
            data: {
              title,
              content: file.content,
              type,
              providerDocId: file.sha || checksum,
              lastSyncedAt: new Date(),
            },
          });
          result.updated += 1;
        } else {
          await this.prisma.documentation.create({
            data: {
              repositoryId,
              title,
              content: file.content,
              filePath: path,
              type,
              providerDocId: file.sha || checksum,
              lastSyncedAt: new Date(),
            },
          });
          result.created += 1;
        }
      } catch (error) {
        result.failed += 1;
        this.logger.warn(
          `Doc crawl failed for ${path}: ${
            error instanceof Error ? error.message : 'error'
          }`,
        );
      }
    }

    await this.checkpoints.markPipelineStatus(repositoryId, {
      documentation: {
        ...result,
        completedAt: new Date().toISOString(),
      },
    });

    await this.prisma.repository.update({
      where: { id: repositoryId },
      data: { lastSyncedAt: new Date() },
    });

    this.logger.log(
      `Documentation crawl ${repository.fullName}: discovered=${result.discovered} created=${result.created} updated=${result.updated} skipped=${result.skipped}`,
    );

    return result;
  }

  isDocumentationPath(path: string): boolean {
    const normalized = path.replace(/\\/g, '/');
    if (DOCUMENTATION_SKIP_PARTS.some((part) => normalized.includes(part))) {
      return false;
    }
    if (
      DOCUMENTATION_SKIP_EXTENSIONS.some((ext) =>
        normalized.toLowerCase().endsWith(ext),
      )
    ) {
      return false;
    }

    const base = normalized.split('/').pop() ?? normalized;
    if (
      (DOCUMENTATION_ROOT_FILES as readonly string[]).some(
        (name) => base.toLowerCase() === name.toLowerCase(),
      ) &&
      !normalized.includes('/')
    ) {
      return true;
    }

    // Root-level README etc. also when capitalized differently in subfolders? Only exact root.
    if (
      (DOCUMENTATION_ROOT_FILES as readonly string[]).includes(base) &&
      normalized === base
    ) {
      return true;
    }

    if (
      DOCUMENTATION_DIR_PREFIXES.some((prefix) =>
        normalized.toLowerCase().startsWith(prefix),
      )
    ) {
      return (
        normalized.toLowerCase().endsWith('.md') ||
        normalized.toLowerCase().endsWith('.mdx') ||
        normalized.toLowerCase().endsWith('.txt') ||
        base.toUpperCase().startsWith('LICENSE')
      );
    }

    // Root README.md variants
    return (DOCUMENTATION_ROOT_FILES as readonly string[]).some(
      (name) => normalized.toLowerCase() === name.toLowerCase(),
    );
  }

  mapDocumentationType(path: string): DocumentationType {
    const base = path.split('/').pop()?.toLowerCase() ?? '';
    if (base.startsWith('readme')) return DocumentationType.README;
    if (base.startsWith('changelog')) return DocumentationType.CHANGELOG;
    if (path.toLowerCase().includes('adr/')) return DocumentationType.ADR;
    if (path.toLowerCase().startsWith('api/')) return DocumentationType.API_DOC;
    if (path.toLowerCase().startsWith('wiki/')) return DocumentationType.WIKI;
    if (base.endsWith('.md') || base.endsWith('.mdx')) {
      return DocumentationType.MARKDOWN;
    }
    return DocumentationType.OTHER;
  }
}
