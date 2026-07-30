import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../../../database/prisma.service';
import { GithubApiClient } from '../../github/services/github-api.client';
import { OAuthTokenStorageService } from '../../github/services/oauth-token-storage.service';
import {
  SOURCE_CODE_INGEST,
  hasSourceCodeExtension,
  isSkippableSourcePath,
  sourceCodePriority,
} from '../constants/source-code.constants';
import { MetadataExtractorService } from '../extractors/metadata-extractor.service';
import { KnowledgeQueueService } from '../jobs/knowledge-queue.service';
import { DocumentBuilderService } from './document-builder.service';
import { KnowledgeValidatorService } from '../validators/knowledge-validator.service';

export interface SourceCodeIngestResult {
  repositoryId: string;
  enabled: boolean;
  discovered: number;
  selected: number;
  enqueued: number;
  skipped: number;
  failed: number;
  paths: string[];
  discoveryMode?: 'tree' | 'directory-walk' | 'local' | 'none';
  hint?: string;
}

type DiscoveredFile = {
  path: string;
  score: number;
  source: 'github' | 'local';
  absolutePath?: string;
};

@Injectable()
export class SourceCodeIngestionService {
  private readonly logger = new Logger(SourceCodeIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly githubApi: GithubApiClient,
    private readonly tokenStorage: OAuthTokenStorageService,
    private readonly metadataExtractor: MetadataExtractorService,
    private readonly documentBuilder: DocumentBuilderService,
    private readonly queueService: KnowledgeQueueService,
    private readonly validator: KnowledgeValidatorService,
  ) {}

  isEnabled(): boolean {
    const raw =
      this.config.get<string>('knowledge.sourceCodeEnabled') ??
      process.env.KNOWLEDGE_SOURCE_CODE_ENABLED ??
      'true';
    return String(raw).toLowerCase() !== 'false';
  }

  maxFiles(): number {
    return (
      this.config.get<number>('knowledge.sourceCodeMaxFiles') ??
      SOURCE_CODE_INGEST.maxFilesPerRepo
    );
  }

  allowLocal(): boolean {
    return (
      this.config.get<boolean>('knowledge.sourceCodeAllowLocal') ??
      (
        process.env.KNOWLEDGE_SOURCE_CODE_ALLOW_LOCAL || 'true'
      ).toLowerCase() !== 'false'
    );
  }

  /**
   * Discover, prioritize, fetch, and enqueue chunking for source files.
   * Free-tier: GitHub first; on 401/empty tree, optional local monorepo walk.
   */
  async ingestRepository(
    repositoryId: string,
    options: { force?: boolean; triggeredBy?: string } = {},
  ): Promise<SourceCodeIngestResult> {
    if (!this.isEnabled()) {
      return {
        repositoryId,
        enabled: false,
        discovered: 0,
        selected: 0,
        enqueued: 0,
        skipped: 0,
        failed: 0,
        paths: [],
        discoveryMode: 'none',
        hint: 'KNOWLEDGE_SOURCE_CODE_ENABLED=false',
      };
    }

    const repository = await this.prisma.repository.findFirst({
      where: { id: repositoryId, deletedAt: null },
      include: {
        connectedAccount: { include: { oauthToken: true } },
      },
    });

    if (!repository) {
      return {
        repositoryId,
        enabled: true,
        discovered: 0,
        selected: 0,
        enqueued: 0,
        skipped: 0,
        failed: 0,
        paths: [],
        discoveryMode: 'none',
        hint: 'Repository not found',
      };
    }

    const [owner, repo] = repository.fullName.split('/');
    let accessToken: string | null = null;
    if (repository.connectedAccount?.oauthToken) {
      accessToken = this.tokenStorage.decryptAccessToken(
        repository.connectedAccount.oauthToken,
      );
    }

    let discoveryMode: SourceCodeIngestResult['discoveryMode'] = 'none';
    let relativePaths: string[] = [];
    let githubHint: string | undefined;

    if (accessToken && owner && repo) {
      relativePaths = await this.githubApi.getRepositoryTreePaths({
        accessToken,
        owner,
        repo,
        ref: repository.defaultBranch,
      });
      if (relativePaths.length > 0) {
        discoveryMode = 'tree';
      } else {
        this.logger.warn(
          `Recursive tree empty for ${repository.fullName}@${repository.defaultBranch}; trying directory walk`,
        );
        relativePaths = await this.discoverViaDirectoryWalk({
          accessToken,
          owner,
          repo,
          ref: repository.defaultBranch,
        });
        if (relativePaths.length > 0) {
          discoveryMode = 'directory-walk';
        } else {
          githubHint =
            'GitHub returned 401/empty for tree+contents. Token may be expired or missing `repo` scope. Reconnect GitHub OAuth after updating GITHUB_OAUTH_SCOPES.';
        }
      }
    } else {
      githubHint =
        'No GitHub OAuth token on repository. Reconnect GitHub, or use local ingest.';
    }

    let discovered: DiscoveredFile[] = relativePaths
      .filter((p) => hasSourceCodeExtension(p) && !isSkippableSourcePath(p))
      .map((p) => ({
        path: p.replace(/\\/g, '/'),
        score: sourceCodePriority(p),
        source: 'github' as const,
      }));

    if (discovered.length === 0 && this.allowLocal()) {
      const localFiles = await this.discoverLocalSourceFiles();
      if (localFiles.length > 0) {
        discoveryMode = 'local';
        discovered = localFiles;
        this.logger.log(
          `Using local filesystem ingest (${localFiles.length} candidates) — GitHub contents unavailable`,
        );
      }
    }

    if (discovered.length === 0) {
      return {
        repositoryId,
        enabled: true,
        discovered: 0,
        selected: 0,
        enqueued: 0,
        skipped: 0,
        failed: 0,
        paths: [],
        discoveryMode,
        hint:
          githubHint ??
          `No source files found for ${repository.fullName} (branch ${repository.defaultBranch}).`,
      };
    }

    discovered.sort(
      (a, b) => b.score - a.score || a.path.localeCompare(b.path),
    );
    const selected = discovered.slice(0, this.maxFiles());
    const maxBytes =
      this.config.get<number>('knowledge.sourceCodeMaxFileBytes') ??
      SOURCE_CODE_INGEST.maxFileBytes;
    const gapMs =
      this.config.get<number>('knowledge.sourceCodeFetchGapMs') ??
      SOURCE_CODE_INGEST.fetchGapMs;

    let enqueued = 0;
    let skipped = 0;
    let failed = 0;
    const paths: string[] = [];

    for (const item of selected) {
      try {
        let content: string | null = null;
        let sha: string | undefined;

        if (item.source === 'local' && item.absolutePath) {
          const buf = await fs.readFile(item.absolutePath);
          if (buf.byteLength > maxBytes) {
            skipped += 1;
            continue;
          }
          content = buf.toString('utf8');
          sha = createHash('sha1').update(buf).digest('hex');
        } else if (accessToken && owner && repo) {
          const file = await this.githubApi.getRepositoryFileContent({
            accessToken,
            owner,
            repo,
            path: item.path,
            ref: repository.defaultBranch,
          });
          if (!file?.content) {
            skipped += 1;
            continue;
          }
          if (Buffer.byteLength(file.content, 'utf8') > maxBytes) {
            skipped += 1;
            continue;
          }
          content = file.content;
          sha = file.sha;
        } else {
          skipped += 1;
          continue;
        }

        if (!content?.trim()) {
          skipped += 1;
          continue;
        }

        if (this.validator.isUnsupportedPath(item.path)) {
          skipped += 1;
          continue;
        }

        const document = this.metadataExtractor.fromSourceFile({
          repository,
          path: item.path,
          content,
          sha,
        });

        this.validator.validateDocument(document);
        const persisted = await this.documentBuilder.upsertDocument(document, {
          force: options.force,
        });

        if (!persisted.skipped || options.force) {
          await this.queueService.enqueueChunkGeneration({
            workspaceId: repository.workspaceId,
            repositoryId,
            documentKind: persisted.documentKind,
            documentId: persisted.documentId,
            force: options.force,
          });
          enqueued += 1;
          paths.push(item.path);
        } else {
          skipped += 1;
        }
      } catch (error) {
        failed += 1;
        this.logger.warn(
          `Source ingest failed for ${item.path}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      if (gapMs > 0 && item.source === 'github') {
        await this.sleep(gapMs);
      }
    }

    this.logger.log(
      `Source-code ingest repo=${repositoryId} mode=${discoveryMode} discovered=${discovered.length} selected=${selected.length} enqueued=${enqueued} skipped=${skipped} failed=${failed}`,
    );

    return {
      repositoryId,
      enabled: true,
      discovered: discovered.length,
      selected: selected.length,
      enqueued,
      skipped,
      failed,
      paths,
      discoveryMode,
      hint:
        discoveryMode === 'local'
          ? 'Ingested from local disk because GitHub contents API returned 401/empty. Reconnect GitHub with `repo` scope for remote ingest.'
          : undefined,
    };
  }

  private async discoverViaDirectoryWalk(input: {
    accessToken: string;
    owner: string;
    repo: string;
    ref: string;
  }): Promise<string[]> {
    const roots = [
      'apps/backend/src',
      'apps/frontend/src',
      'packages',
      'src',
      'backend/src',
    ];
    const found: string[] = [];
    const maxDirs = 80;
    let dirsVisited = 0;

    for (const root of roots) {
      const queue = [root];
      while (queue.length > 0 && dirsVisited < maxDirs && found.length < 500) {
        const dir = queue.shift()!;
        dirsVisited += 1;
        const entries = await this.githubApi.listRepositoryDirectory({
          accessToken: input.accessToken,
          owner: input.owner,
          repo: input.repo,
          path: dir,
          ref: input.ref,
        });
        if (entries.length === 0) continue;

        for (const entry of entries) {
          if (isSkippableSourcePath(entry.path)) continue;
          if (entry.type === 'file' && hasSourceCodeExtension(entry.path)) {
            found.push(entry.path);
          } else if (entry.type === 'dir') {
            queue.push(entry.path);
          }
        }
      }
    }

    return found;
  }

  private async discoverLocalSourceFiles(): Promise<DiscoveredFile[]> {
    const configured = (
      this.config.get<string>('knowledge.sourceCodeLocalRoot') ||
      process.env.KNOWLEDGE_SOURCE_CODE_LOCAL_ROOT ||
      ''
    ).trim();

    const roots = this.resolveLocalRoots(configured);
    const out: DiscoveredFile[] = [];

    for (const root of roots) {
      await this.walkLocalDir(root.rootDir, root.relativePrefix, out);
    }

    return out;
  }

  private resolveLocalRoots(configured: string): Array<{
    rootDir: string;
    relativePrefix: string;
  }> {
    const candidates: string[] = [];
    if (configured) candidates.push(configured);

    // apps/backend cwd → monorepo root
    candidates.push(path.resolve(process.cwd(), '../..'));
    candidates.push(process.cwd());
    candidates.push(path.resolve(process.cwd(), '..'));

    const roots: Array<{ rootDir: string; relativePrefix: string }> = [];
    const seenAbsDirs = new Set<string>();

    const pushUnique = (rootDir: string, relativePrefix: string) => {
      const abs = path.resolve(rootDir);
      if (seenAbsDirs.has(abs)) return;
      seenAbsDirs.add(abs);
      roots.push({ rootDir: abs, relativePrefix });
    };

    for (const base of candidates) {
      const normalized = path.resolve(base);
      const backendSrc = path.join(normalized, 'apps', 'backend', 'src');
      const plainSrc = path.join(normalized, 'src');

      // Prefer monorepo-relative paths so search citations stay consistent.
      pushUnique(backendSrc, 'apps/backend/src');
      // Only add plain `src` when it is a different physical directory
      // (avoids duplicate chunks: src/foo.ts vs apps/backend/src/foo.ts).
      pushUnique(plainSrc, 'src');
    }

    return roots;
  }

  private async walkLocalDir(
    absDir: string,
    relativePrefix: string,
    out: DiscoveredFile[],
    depth = 0,
  ): Promise<void> {
    if (depth > 12 || out.length > 2000) return;

    let entries: Array<{
      name: string;
      isDirectory(): boolean;
      isFile(): boolean;
    }>;
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const abs = path.join(absDir, entry.name);
      const rel = `${relativePrefix}/${entry.name}`.replace(/\\/g, '/');

      if (isSkippableSourcePath(rel)) continue;

      if (entry.isDirectory()) {
        await this.walkLocalDir(abs, rel, out, depth + 1);
      } else if (entry.isFile() && hasSourceCodeExtension(rel)) {
        out.push({
          path: rel,
          score: sourceCodePriority(rel),
          source: 'local',
          absolutePath: abs,
        });
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
