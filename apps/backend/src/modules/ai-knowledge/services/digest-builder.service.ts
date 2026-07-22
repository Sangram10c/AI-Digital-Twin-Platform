import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { DigestKind, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { HYBRID_DEFAULTS } from '../constants/hybrid-pipeline.constants';
import type { HeuristicExtractionResult } from '../../knowledge-heuristics/services/knowledge-heuristics.service';

export interface BuiltDigests {
  repositoryDigestId: string;
  moduleDigestIds: string[];
  pullRequestDigestIds: string[];
  documentationDigestIds: string[];
  releaseDigestIds: string[];
  cacheHits: number;
  built: number;
}

@Injectable()
export class DigestBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async buildForRepository(
    repositoryId: string,
    heuristics: HeuristicExtractionResult,
    options: { prBatchSize?: number; mode?: 'LIGHT' | 'FULL' } = {},
  ): Promise<BuiltDigests> {
    const repository = await this.prisma.repository.findUniqueOrThrow({
      where: { id: repositoryId },
    });
    const prBatchSize = options.prBatchSize ?? HYBRID_DEFAULTS.prBatchSize;
    let cacheHits = 0;
    let built = 0;

    const repoSummary = this.buildRepositorySummary(repository, heuristics);
    const repoChecksum = this.checksum(repoSummary);
    const repositoryDigestId = await this.upsertRepositoryDigest({
      workspaceId: repository.workspaceId,
      repositoryId,
      title: `Repository digest: ${repository.fullName}`,
      summaryText: repoSummary,
      contentChecksum: repoChecksum,
      entityCount: heuristics.rawSignals.commitSample as number,
      metadata: {
        frameworks: heuristics.frameworks,
        modules: heuristics.modules,
        technologies: heuristics.technologies,
      },
    });
    const repoCache = await this.trackChecksum(
      repository.workspaceId,
      repositoryId,
      DigestKind.REPOSITORY,
      'repository',
      repoChecksum,
    );
    if (repoCache) cacheHits += 1;
    else built += 1;

    const moduleDigestIds: string[] = [];
    for (const moduleName of heuristics.modules.slice(0, 20)) {
      const text = this.buildModuleSummary(moduleName, heuristics);
      const checksum = this.checksum(text);
      const id = await this.upsertModuleDigest({
        workspaceId: repository.workspaceId,
        repositoryId,
        moduleKey: moduleName,
        title: `Module digest: ${moduleName}`,
        summaryText: text,
        contentChecksum: checksum,
        entityCount: 1,
        metadata: { module: moduleName },
      });
      moduleDigestIds.push(id);
      const hit = await this.trackChecksum(
        repository.workspaceId,
        repositoryId,
        DigestKind.MODULE,
        moduleName,
        checksum,
      );
      if (hit) cacheHits += 1;
      else built += 1;
    }

    const pullRequests = await this.prisma.pullRequest.findMany({
      where: { repositoryId },
      select: { number: true, title: true, body: true, state: true },
      orderBy: { openedAt: 'desc' },
      take: options.mode === 'FULL' ? 100 : 30,
    });
    const pullRequestDigestIds: string[] = [];
    for (let i = 0; i < pullRequests.length; i += prBatchSize) {
      const batch = pullRequests.slice(i, i + prBatchSize);
      const batchKey = `pr-batch-${Math.floor(i / prBatchSize) + 1}`;
      const text = this.buildPullRequestBatchSummary(batch);
      const checksum = this.checksum(text);
      const id = await this.upsertPullRequestDigest({
        workspaceId: repository.workspaceId,
        repositoryId,
        batchKey,
        title: `PR digest batch ${Math.floor(i / prBatchSize) + 1}`,
        summaryText: text,
        contentChecksum: checksum,
        entityCount: batch.length,
        metadata: { numbers: batch.map((p) => p.number) },
      });
      pullRequestDigestIds.push(id);
      const hit = await this.trackChecksum(
        repository.workspaceId,
        repositoryId,
        DigestKind.PULL_REQUEST,
        batchKey,
        checksum,
      );
      if (hit) cacheHits += 1;
      else built += 1;
    }

    const docs = await this.prisma.documentation.findMany({
      where: { repositoryId },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        filePath: true,
      },
      take: options.mode === 'FULL' ? 50 : 15,
      orderBy: { updatedAt: 'desc' },
    });
    const documentationDigestIds: string[] = [];
    for (const doc of docs) {
      const docKey = doc.filePath ?? doc.id;
      const text = [
        `# ${doc.title}`,
        `Type: ${doc.type}`,
        `Path: ${doc.filePath ?? 'n/a'}`,
        '',
        (doc.content ?? '').slice(0, 6000),
      ].join('\n');
      const checksum = this.checksum(text);
      const id = await this.upsertDocumentationDigest({
        workspaceId: repository.workspaceId,
        repositoryId,
        docKey,
        title: `Documentation digest: ${doc.title}`,
        summaryText: text,
        contentChecksum: checksum,
        entityCount: 1,
        metadata: { documentationId: doc.id, type: doc.type },
      });
      documentationDigestIds.push(id);
      const hit = await this.trackChecksum(
        repository.workspaceId,
        repositoryId,
        DigestKind.DOCUMENTATION,
        docKey,
        checksum,
      );
      if (hit) cacheHits += 1;
      else built += 1;
    }

    const releases = await this.prisma.release.findMany({
      where: { repositoryId },
      select: { tagName: true, name: true, body: true },
      take: options.mode === 'FULL' ? 40 : 10,
      orderBy: { publishedAt: 'desc' },
    });
    const releaseDigestIds: string[] = [];
    for (const release of releases) {
      const releaseKey = release.tagName;
      const text = [
        `# Release ${release.name ?? release.tagName}`,
        '',
        (release.body ?? '').slice(0, 4000),
      ].join('\n');
      const checksum = this.checksum(text);
      const id = await this.upsertReleaseDigest({
        workspaceId: repository.workspaceId,
        repositoryId,
        releaseKey,
        title: `Release digest: ${release.tagName}`,
        summaryText: text,
        contentChecksum: checksum,
        entityCount: 1,
        metadata: { tagName: release.tagName },
      });
      releaseDigestIds.push(id);
      const hit = await this.trackChecksum(
        repository.workspaceId,
        repositoryId,
        DigestKind.RELEASE,
        releaseKey,
        checksum,
      );
      if (hit) cacheHits += 1;
      else built += 1;
    }

    return {
      repositoryDigestId,
      moduleDigestIds,
      pullRequestDigestIds,
      documentationDigestIds,
      releaseDigestIds,
      cacheHits,
      built,
    };
  }

  private buildRepositorySummary(
    repository: {
      fullName: string;
      description: string | null;
      language: string | null;
      defaultBranch: string;
    },
    heuristics: HeuristicExtractionResult,
  ): string {
    return [
      `# Repository Digest: ${repository.fullName}`,
      repository.description ? `Description: ${repository.description}` : '',
      `Language: ${repository.language ?? 'unknown'}`,
      `Default branch: ${repository.defaultBranch}`,
      '',
      '## Deterministic stack',
      `Frameworks: ${heuristics.frameworks.join(', ') || 'none'}`,
      `Libraries: ${heuristics.libraries.slice(0, 20).join(', ') || 'none'}`,
      `Databases: ${heuristics.databases.join(', ') || 'none'}`,
      `CI/CD: ${heuristics.cicd.join(', ') || 'none'}`,
      `Modules: ${heuristics.modules.join(', ') || 'none'}`,
      `Topics: ${heuristics.topics.join(', ') || 'none'}`,
      '',
      '## Activity signals',
      `Features=${heuristics.featureCount}, BugFixes=${heuristics.bugFixCount}, Refactors=${heuristics.refactorCount}, Security=${heuristics.securityCount}, Performance=${heuristics.performanceCount}`,
      `RiskScore=${heuristics.riskScore}, Confidence=${heuristics.confidenceScore}`,
      '',
      '## Relationships (sample)',
      ...heuristics.relationships
        .slice(0, 15)
        .map((r) => `- ${r.type}: ${r.externalRefId} ${r.title ?? ''}`),
      '',
      'AI should generate meaning from this digest. Do not invent missing facts.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private buildModuleSummary(
    moduleName: string,
    heuristics: HeuristicExtractionResult,
  ): string {
    return [
      `# Module Digest: ${moduleName}`,
      `Related technologies: ${heuristics.technologies.slice(0, 15).join(', ') || 'n/a'}`,
      `Related topics: ${heuristics.topics.join(', ') || 'n/a'}`,
      `Confidence: ${heuristics.confidenceScore}`,
      '',
      'Summarize this module purpose, boundaries, and risks based on the repository heuristics.',
    ].join('\n');
  }

  private buildPullRequestBatchSummary(
    batch: Array<{
      number: number;
      title: string;
      body: string | null;
      state: string;
    }>,
  ): string {
    return [
      '# Pull Request Batch Digest',
      'This digest compresses multiple PRs. Do not analyze commits individually.',
      '',
      ...batch.map(
        (pr) =>
          `## PR #${pr.number} (${pr.state})\nTitle: ${pr.title}\n${(pr.body ?? '').slice(0, 800)}`,
      ),
    ].join('\n\n');
  }

  private checksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private async trackChecksum(
    workspaceId: string,
    repositoryId: string,
    digestKind: DigestKind,
    digestKey: string,
    checksum: string,
  ): Promise<boolean> {
    const existing = await this.prisma.digestChecksum.findUnique({
      where: {
        repositoryId_digestKind_digestKey: {
          repositoryId,
          digestKind,
          digestKey,
        },
      },
    });
    if (existing?.checksum === checksum) {
      return true;
    }
    await this.prisma.digestChecksum.upsert({
      where: {
        repositoryId_digestKind_digestKey: {
          repositoryId,
          digestKind,
          digestKey,
        },
      },
      create: {
        workspaceId,
        repositoryId,
        digestKind,
        digestKey,
        checksum,
        version: 1,
      },
      update: {
        checksum,
        version: { increment: 1 },
      },
    });
    return false;
  }

  private async upsertRepositoryDigest(input: {
    workspaceId: string;
    repositoryId: string;
    title: string;
    summaryText: string;
    contentChecksum: string;
    entityCount: number;
    metadata: Record<string, unknown>;
  }) {
    const existing = await this.prisma.repositoryDigest.findFirst({
      where: { repositoryId: input.repositoryId },
      orderBy: { updatedAt: 'desc' },
    });
    if (existing) {
      const updated = await this.prisma.repositoryDigest.update({
        where: { id: existing.id },
        data: {
          title: input.title,
          summaryText: input.summaryText,
          contentChecksum: input.contentChecksum,
          entityCount: input.entityCount,
          metadata: input.metadata as Prisma.InputJsonValue,
          version: { increment: 1 },
        },
      });
      return updated.id;
    }
    const created = await this.prisma.repositoryDigest.create({
      data: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
    return created.id;
  }

  private async upsertModuleDigest(input: {
    workspaceId: string;
    repositoryId: string;
    moduleKey: string;
    title: string;
    summaryText: string;
    contentChecksum: string;
    entityCount: number;
    metadata: Record<string, unknown>;
  }) {
    const row = await this.prisma.moduleDigest.upsert({
      where: {
        repositoryId_moduleKey: {
          repositoryId: input.repositoryId,
          moduleKey: input.moduleKey,
        },
      },
      create: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
      update: {
        title: input.title,
        summaryText: input.summaryText,
        contentChecksum: input.contentChecksum,
        entityCount: input.entityCount,
        metadata: input.metadata as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });
    return row.id;
  }

  private async upsertPullRequestDigest(input: {
    workspaceId: string;
    repositoryId: string;
    batchKey: string;
    title: string;
    summaryText: string;
    contentChecksum: string;
    entityCount: number;
    metadata: Record<string, unknown>;
  }) {
    const row = await this.prisma.pullRequestDigest.upsert({
      where: {
        repositoryId_batchKey: {
          repositoryId: input.repositoryId,
          batchKey: input.batchKey,
        },
      },
      create: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
      update: {
        title: input.title,
        summaryText: input.summaryText,
        contentChecksum: input.contentChecksum,
        entityCount: input.entityCount,
        metadata: input.metadata as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });
    return row.id;
  }

  private async upsertDocumentationDigest(input: {
    workspaceId: string;
    repositoryId: string;
    docKey: string;
    title: string;
    summaryText: string;
    contentChecksum: string;
    entityCount: number;
    metadata: Record<string, unknown>;
  }) {
    const row = await this.prisma.documentationDigest.upsert({
      where: {
        repositoryId_docKey: {
          repositoryId: input.repositoryId,
          docKey: input.docKey,
        },
      },
      create: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
      update: {
        title: input.title,
        summaryText: input.summaryText,
        contentChecksum: input.contentChecksum,
        entityCount: input.entityCount,
        metadata: input.metadata as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });
    return row.id;
  }

  private async upsertReleaseDigest(input: {
    workspaceId: string;
    repositoryId: string;
    releaseKey: string;
    title: string;
    summaryText: string;
    contentChecksum: string;
    entityCount: number;
    metadata: Record<string, unknown>;
  }) {
    const row = await this.prisma.releaseDigest.upsert({
      where: {
        repositoryId_releaseKey: {
          repositoryId: input.repositoryId,
          releaseKey: input.releaseKey,
        },
      },
      create: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
      update: {
        title: input.title,
        summaryText: input.summaryText,
        contentChecksum: input.contentChecksum,
        entityCount: input.entityCount,
        metadata: input.metadata as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });
    return row.id;
  }
}
