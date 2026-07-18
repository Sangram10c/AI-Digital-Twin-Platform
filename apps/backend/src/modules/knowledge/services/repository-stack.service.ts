import { Injectable, Logger } from '@nestjs/common';
import { DocumentationType, KnowledgeSourceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { GithubApiClient } from '../../github/services/github-api.client';
import { OAuthTokenStorageService } from '../../github/services/oauth-token-storage.service';
import { STACK_SCAN_LIMITS } from '../constants/known-packages.constants';
import { StackExtractorService } from '../extractors/stack-extractor.service';
import { KnowledgeDocumentKind } from '../interfaces/knowledge.interfaces';
import {
  RepositoryStackProfile,
  StackPackageRef,
} from '../interfaces/stack.interfaces';
import { KnowledgeQueueService } from '../jobs/knowledge-queue.service';
import { DocumentBuilderService } from './document-builder.service';

@Injectable()
export class RepositoryStackService {
  private readonly logger = new Logger(RepositoryStackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubApi: GithubApiClient,
    private readonly tokenStorage: OAuthTokenStorageService,
    private readonly stackExtractor: StackExtractorService,
    private readonly documentBuilder: DocumentBuilderService,
    private readonly queueService: KnowledgeQueueService,
  ) {}

  /**
   * Fetch package.json, detect frameworks/libraries, optionally scan imports,
   * persist structured stack metadata + AI-readable knowledge document.
   */
  async detectAndPersist(
    repositoryId: string,
    options: { force?: boolean } = {},
  ): Promise<RepositoryStackProfile | null> {
    const repository = await this.prisma.repository.findFirst({
      where: { id: repositoryId, deletedAt: null },
      include: {
        connectedAccount: {
          include: { oauthToken: true },
        },
      },
    });

    if (!repository?.connectedAccount?.oauthToken) {
      this.logger.warn(
        `Skipping stack detection for ${repositoryId}: missing OAuth token`,
      );
      return null;
    }

    const [owner, repo] = repository.fullName.split('/');
    if (!owner || !repo) {
      this.logger.warn(
        `Skipping stack detection for ${repositoryId}: invalid fullName`,
      );
      return null;
    }

    const accessToken = this.tokenStorage.decryptAccessToken(
      repository.connectedAccount.oauthToken,
    );

    const manifestPaths = await this.resolvePackageJsonPaths({
      accessToken,
      owner,
      repo,
      ref: repository.defaultBranch,
    });

    if (manifestPaths.length === 0) {
      this.logger.debug(`No package.json for ${repository.fullName}`);
      return null;
    }

    const extractedParts: Array<
      ReturnType<StackExtractorService['extractFromPackageJson']>
    > = [];
    let rootPackageJsonContent = '';

    for (const path of manifestPaths) {
      try {
        const file = await this.githubApi.getRepositoryFileContent({
          accessToken,
          owner,
          repo,
          path,
          ref: repository.defaultBranch,
        });
        if (!file) continue;
        if (path === 'package.json') {
          rootPackageJsonContent = file.content;
        }
        extractedParts.push(
          this.stackExtractor.extractFromPackageJson(file.content, {
            manifestPath: file.path,
          }),
        );
      } catch (error) {
        this.logger.debug(
          `Skip manifest ${path}: ${
            error instanceof Error ? error.message : 'error'
          }`,
        );
      }
    }

    if (extractedParts.length === 0) {
      return null;
    }

    const merged = this.stackExtractor.mergeExtractions(extractedParts);
    const tracked = [...merged.frameworks, ...merged.libraries];
    const usage = await this.scanImportUsage({
      accessToken,
      owner,
      repo,
      ref: repository.defaultBranch,
      tracked,
    });

    const profile: RepositoryStackProfile = {
      detectedAt: new Date().toISOString(),
      manifestPath: merged.manifestPath,
      manifestPaths: merged.manifestPaths,
      packageName: merged.packageName,
      packageManager: merged.packageManager,
      frameworks: merged.frameworks,
      libraries: merged.libraries,
      otherDependencies: merged.otherDependencies.slice(0, 150),
      usage,
      summary: '',
    };
    profile.summary = this.stackExtractor.buildAiReadableSummary(profile);

    await this.persistStack(repository.id, repository.workspaceId, profile, {
      packageJsonContent:
        rootPackageJsonContent ||
        JSON.stringify({
          name: profile.packageName,
          note: 'Merged monorepo stack; see manifestPaths',
          manifestPaths: profile.manifestPaths,
        }),
      force: options.force,
    });

    return profile;
  }

  private async resolvePackageJsonPaths(input: {
    accessToken: string;
    owner: string;
    repo: string;
    ref: string;
  }): Promise<string[]> {
    const tree = await this.githubApi.getRepositoryTreePaths({
      accessToken: input.accessToken,
      owner: input.owner,
      repo: input.repo,
      ref: input.ref,
    });

    const fromTree = tree
      .filter(
        (path) => path === 'package.json' || path.endsWith('/package.json'),
      )
      .filter(
        (path) =>
          !path.includes('node_modules/') &&
          !path.includes('/dist/') &&
          !path.includes('/.next/'),
      )
      .slice(0, 20);

    if (fromTree.length > 0) {
      // Prefer root first, then apps/*, packages/*
      return [
        ...fromTree.filter((p) => p === 'package.json'),
        ...fromTree.filter((p) => p.startsWith('apps/')),
        ...fromTree.filter((p) => p.startsWith('packages/')),
        ...fromTree.filter(
          (p) =>
            p !== 'package.json' &&
            !p.startsWith('apps/') &&
            !p.startsWith('packages/'),
        ),
      ].filter((path, index, all) => all.indexOf(path) === index);
    }

    // Fallback when tree API fails: try common monorepo locations
    return [
      'package.json',
      'apps/backend/package.json',
      'apps/frontend/package.json',
    ];
  }

  private async scanImportUsage(input: {
    accessToken: string;
    owner: string;
    repo: string;
    ref: string;
    tracked: StackPackageRef[];
  }) {
    if (input.tracked.length === 0) return [];

    const paths = await this.githubApi.getRepositoryTreePaths({
      accessToken: input.accessToken,
      owner: input.owner,
      repo: input.repo,
      ref: input.ref,
    });

    const candidates = paths
      .filter((path) =>
        STACK_SCAN_LIMITS.sourceExtensions.some((ext) => path.endsWith(ext)),
      )
      .filter(
        (path) =>
          !STACK_SCAN_LIMITS.ignoredPathParts.some((part) =>
            path.includes(part),
          ),
      )
      .slice(0, STACK_SCAN_LIMITS.maxSourceFiles);

    const files: Array<{ path: string; content: string }> = [];
    for (const path of candidates) {
      try {
        const file = await this.githubApi.getRepositoryFileContent({
          accessToken: input.accessToken,
          owner: input.owner,
          repo: input.repo,
          path,
          ref: input.ref,
        });
        if (
          file &&
          Buffer.byteLength(file.content, 'utf8') <=
            STACK_SCAN_LIMITS.maxFileBytes
        ) {
          files.push({ path: file.path, content: file.content });
        }
      } catch (error) {
        this.logger.debug(
          `Skip file ${path}: ${error instanceof Error ? error.message : 'error'}`,
        );
      }
    }

    return this.stackExtractor.buildUsageFromSourceFiles(files, input.tracked);
  }

  private async persistStack(
    repositoryId: string,
    workspaceId: string,
    profile: RepositoryStackProfile,
    options: { packageJsonContent: string; force?: boolean },
  ) {
    const repository = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) return;

    const existingMeta =
      repository.providerMetadata &&
      typeof repository.providerMetadata === 'object'
        ? (repository.providerMetadata as Record<string, unknown>)
        : {};

    await this.prisma.repository.update({
      where: { id: repositoryId },
      data: {
        providerMetadata: {
          ...existingMeta,
          stack: profile,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.documentation.upsert({
      where: {
        repositoryId_filePath: {
          repositoryId,
          filePath: 'package.json',
        },
      },
      create: {
        repositoryId,
        title: 'package.json',
        content: options.packageJsonContent,
        filePath: 'package.json',
        type: DocumentationType.OTHER,
        lastSyncedAt: new Date(),
      },
      update: {
        content: options.packageJsonContent,
        lastSyncedAt: new Date(),
      },
    });

    const stackDocument = await this.documentBuilder.upsertDocument(
      {
        documentKind: KnowledgeDocumentKind.SOURCE,
        workspaceId,
        repositoryId,
        sourceType: KnowledgeSourceType.CUSTOM,
        externalRefId: 'stack:package.json',
        internalRefId: repositoryId,
        title: `Stack profile: ${repository.fullName}`,
        rawContent: profile.summary,
        path: 'package.json',
        metadata: {
          documentType: 'repository_stack',
          filePath: 'package.json',
          detectedLanguage: 'markdown',
          stack: profile,
        },
      },
      { force: options.force },
    );

    if (!stackDocument.skipped || options.force) {
      await this.queueService.enqueueChunkGeneration({
        workspaceId,
        repositoryId,
        documentKind: KnowledgeDocumentKind.SOURCE,
        documentId: stackDocument.documentId,
        force: options.force,
      });
    }
  }
}
