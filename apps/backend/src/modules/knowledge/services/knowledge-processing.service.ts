import { Injectable, Logger } from '@nestjs/common';
import { DocumentationType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { DEFAULT_KNOWLEDGE_LIMITS } from '../constants/knowledge.constants';
import { MetadataExtractorService } from '../extractors/metadata-extractor.service';
import {
  KnowledgeDocumentKind,
  NormalizedKnowledgeDocument,
} from '../interfaces/knowledge.interfaces';
import { KnowledgeValidatorService } from '../validators/knowledge-validator.service';
import { KnowledgeQueueService } from '../jobs/knowledge-queue.service';
import { DocumentBuilderService } from './document-builder.service';
import { RepositoryStackService } from './repository-stack.service';

@Injectable()
export class KnowledgeProcessingService {
  private readonly logger = new Logger(KnowledgeProcessingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metadataExtractor: MetadataExtractorService,
    private readonly validator: KnowledgeValidatorService,
    private readonly documentBuilder: DocumentBuilderService,
    private readonly queueService: KnowledgeQueueService,
    private readonly repositoryStackService: RepositoryStackService,
  ) {}

  async processRepository(
    repositoryId: string,
    options: { triggeredBy?: string; force?: boolean } = {},
  ) {
    const repository =
      await this.validator.assertRepositoryProcessable(repositoryId);

    // Detect frameworks/libraries from package.json before building repo docs.
    let stackSummary: string | undefined;
    try {
      const stack = await this.repositoryStackService.detectAndPersist(
        repositoryId,
        { force: options.force },
      );
      stackSummary = stack?.summary;
    } catch (error) {
      this.logger.warn(
        `Stack detection failed for ${repositoryId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }

    const rawContent = [
      this.buildRepositoryContent(repository),
      stackSummary ? `\n\n${stackSummary}` : '',
    ]
      .filter(Boolean)
      .join('');

    const document = this.metadataExtractor.fromRepository(
      repository,
      rawContent,
    );

    const persisted = await this.documentBuilder.upsertDocument(document, {
      force: options.force,
    });

    if (!persisted.skipped || options.force) {
      await this.queueService.enqueueChunkGeneration({
        workspaceId: repository.workspaceId,
        repositoryId,
        documentKind: KnowledgeDocumentKind.SOURCE,
        documentId: persisted.documentId,
        force: options.force,
      });
    }

    await this.enqueueRepositoryEntities(
      repository.workspaceId,
      repositoryId,
      options,
    );

    return {
      repositoryId,
      documentId: persisted.documentId,
      skipped: persisted.skipped,
      enqueued: true,
    };
  }

  async processCommit(
    repositoryId: string,
    commitId: string,
    options: { force?: boolean } = {},
  ) {
    const repository =
      await this.validator.assertRepositoryProcessable(repositoryId);
    const commit = await this.prisma.commit.findFirst({
      where: { id: commitId, repositoryId },
    });
    if (!commit) {
      throw new Error(
        `Commit ${commitId} not found in repository ${repositoryId}`,
      );
    }

    const document = this.metadataExtractor.fromCommit(commit, repository);
    return this.persistAndChunk(document, options.force);
  }

  async processPullRequest(
    repositoryId: string,
    pullRequestId: string,
    options: { force?: boolean } = {},
  ) {
    const repository =
      await this.validator.assertRepositoryProcessable(repositoryId);
    const pullRequest = await this.prisma.pullRequest.findFirst({
      where: { id: pullRequestId, repositoryId },
      include: { reviews: true },
    });
    if (!pullRequest) {
      throw new Error(
        `Pull request ${pullRequestId} not found in repository ${repositoryId}`,
      );
    }

    const document = this.metadataExtractor.fromPullRequest(
      pullRequest,
      repository,
      pullRequest.reviews,
    );
    const result = await this.persistAndChunk(document, options.force);

    for (const review of pullRequest.reviews) {
      const reviewDoc = this.metadataExtractor.fromReview(
        review,
        pullRequest,
        repository,
      );
      await this.persistAndChunk(reviewDoc, options.force);
    }

    return result;
  }

  async processIssue(
    repositoryId: string,
    issueId: string,
    options: { force?: boolean } = {},
  ) {
    const repository =
      await this.validator.assertRepositoryProcessable(repositoryId);
    const issue = await this.prisma.issue.findFirst({
      where: { id: issueId, repositoryId },
    });
    if (!issue) {
      throw new Error(
        `Issue ${issueId} not found in repository ${repositoryId}`,
      );
    }

    const document = this.metadataExtractor.fromIssue(issue, repository);
    return this.persistAndChunk(document, options.force);
  }

  async processReadme(
    repositoryId: string,
    documentationId?: string,
    options: { force?: boolean } = {},
  ) {
    const repository =
      await this.validator.assertRepositoryProcessable(repositoryId);

    if (documentationId) {
      const documentation = await this.prisma.documentation.findFirst({
        where: { id: documentationId, repositoryId },
      });
      if (!documentation) {
        throw new Error(
          `Documentation ${documentationId} not found in repository ${repositoryId}`,
        );
      }
      const document = this.metadataExtractor.fromDocumentation(
        documentation,
        repository,
      );
      return this.persistAndChunk(document, options.force);
    }

    const docs = await this.prisma.documentation.findMany({
      where: {
        repositoryId,
        type: {
          in: [
            DocumentationType.README,
            DocumentationType.CHANGELOG,
            DocumentationType.MARKDOWN,
            DocumentationType.ADR,
            DocumentationType.WIKI,
            DocumentationType.OTHER,
          ],
        },
      },
    });

    if (docs.length === 0) {
      const seeded = await this.seedDefaultDocumentation(repository);
      return this.persistAndChunk(seeded, options.force);
    }

    const results = [];
    for (const doc of docs) {
      const document = this.metadataExtractor.fromDocumentation(
        doc,
        repository,
      );
      results.push(await this.persistAndChunk(document, options.force));
    }
    return results;
  }

  async processWorkspace(
    workspaceId: string,
    options: { triggeredBy?: string; force?: boolean } = {},
  ) {
    const repositories = await this.prisma.repository.findMany({
      where: { workspaceId, deletedAt: null, status: 'ACTIVE' },
      select: { id: true },
    });

    for (const repository of repositories) {
      await this.queueService.enqueueRepositoryProcessing({
        workspaceId,
        repositoryId: repository.id,
        triggeredBy: options.triggeredBy,
        force: options.force,
      });
    }

    return {
      workspaceId,
      repositoriesEnqueued: repositories.length,
    };
  }

  private async persistAndChunk(
    document: NormalizedKnowledgeDocument,
    force?: boolean,
  ) {
    this.validator.validateDocument(document);
    const persisted = await this.documentBuilder.upsertDocument(document, {
      force,
    });

    if (!persisted.skipped || force) {
      await this.queueService.enqueueChunkGeneration({
        workspaceId: document.workspaceId,
        repositoryId: document.repositoryId,
        documentKind: persisted.documentKind,
        documentId: persisted.documentId,
        force,
      });
    }

    return persisted;
  }

  private async enqueueRepositoryEntities(
    workspaceId: string,
    repositoryId: string,
    options: { force?: boolean; triggeredBy?: string },
  ) {
    const batchSize = DEFAULT_KNOWLEDGE_LIMITS.batchSize;

    const [commits, pullRequests, issues, releases, documentation] =
      await Promise.all([
        this.prisma.commit.findMany({
          where: { repositoryId },
          select: { id: true },
          take: batchSize,
          orderBy: { committedAt: 'desc' },
        }),
        this.prisma.pullRequest.findMany({
          where: { repositoryId },
          select: { id: true },
          take: batchSize,
          orderBy: { openedAt: 'desc' },
        }),
        this.prisma.issue.findMany({
          where: { repositoryId },
          select: { id: true },
          take: batchSize,
          orderBy: { openedAt: 'desc' },
        }),
        this.prisma.release.findMany({
          where: { repositoryId },
          select: { id: true },
          take: batchSize,
          orderBy: { publishedAt: 'desc' },
        }),
        this.prisma.documentation.findMany({
          where: { repositoryId },
          select: { id: true },
        }),
      ]);

    for (const commit of commits) {
      await this.queueService.enqueueCommitProcessing({
        workspaceId,
        repositoryId,
        entityId: commit.id,
        force: options.force,
        triggeredBy: options.triggeredBy,
      });
    }

    for (const pullRequest of pullRequests) {
      await this.queueService.enqueuePullRequestProcessing({
        workspaceId,
        repositoryId,
        entityId: pullRequest.id,
        force: options.force,
        triggeredBy: options.triggeredBy,
      });
    }

    for (const issue of issues) {
      await this.queueService.enqueueIssueProcessing({
        workspaceId,
        repositoryId,
        entityId: issue.id,
        force: options.force,
        triggeredBy: options.triggeredBy,
      });
    }

    for (const release of releases) {
      const repository =
        await this.validator.assertRepositoryProcessable(repositoryId);
      const releaseEntity = await this.prisma.release.findUnique({
        where: { id: release.id },
      });
      if (releaseEntity) {
        const document = this.metadataExtractor.fromRelease(
          releaseEntity,
          repository,
        );
        await this.persistAndChunk(document, options.force);
      }
    }

    if (documentation.length > 0) {
      for (const doc of documentation) {
        await this.queueService.enqueueReadmeProcessing({
          workspaceId,
          repositoryId,
          entityId: doc.id,
          force: options.force,
          triggeredBy: options.triggeredBy,
        });
      }
    } else {
      await this.queueService.enqueueReadmeProcessing({
        workspaceId,
        repositoryId,
        force: options.force,
        triggeredBy: options.triggeredBy,
      });
    }

    this.logger.log(
      `Enqueued knowledge jobs for repository ${repositoryId}: commits=${commits.length}, prs=${pullRequests.length}, issues=${issues.length}, releases=${releases.length}, docs=${documentation.length}`,
    );
  }

  private buildRepositoryContent(repository: {
    fullName: string;
    description: string | null;
    defaultBranch: string;
    language: string | null;
    url: string | null;
    isPrivate: boolean;
    isFork: boolean;
  }): string {
    return [
      `# Repository: ${repository.fullName}`,
      '',
      repository.description ? `Description: ${repository.description}` : '',
      `Default branch: ${repository.defaultBranch}`,
      repository.language ? `Primary language: ${repository.language}` : '',
      `Private: ${repository.isPrivate}`,
      `Fork: ${repository.isFork}`,
      repository.url ? `URL: ${repository.url}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async seedDefaultDocumentation(repository: {
    id: string;
    workspaceId: string;
    fullName: string;
    description: string | null;
  }): Promise<NormalizedKnowledgeDocument> {
    const content = [
      `# ${repository.fullName}`,
      '',
      repository.description ?? 'No README content synced yet.',
    ].join('\n');

    const documentation = await this.prisma.documentation.upsert({
      where: {
        repositoryId_filePath: {
          repositoryId: repository.id,
          filePath: 'README.md',
        },
      },
      create: {
        repositoryId: repository.id,
        title: 'README',
        content,
        filePath: 'README.md',
        type: DocumentationType.README,
        lastSyncedAt: new Date(),
      },
      update: {
        content,
        lastSyncedAt: new Date(),
      },
    });

    const repo = await this.validator.assertRepositoryProcessable(
      repository.id,
    );
    return this.metadataExtractor.fromDocumentation(documentation, repo);
  }
}
