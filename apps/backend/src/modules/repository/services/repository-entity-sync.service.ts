import { Injectable, Logger } from '@nestjs/common';
import {
  IssueState,
  JobStatus,
  PullRequestState,
  ReviewState,
  SyncTrigger,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { GithubApiClient } from '../../github/services/github-api.client';
import { OAuthTokenStorageService } from '../../github/services/oauth-token-storage.service';
import { DEFAULT_REPOSITORY_SYNC_LIMITS } from '../constants/repository-sync.constants';
import {
  RepositorySyncJobPayload,
  SyncEntityKind,
} from '../interfaces/repository-sync.interfaces';
import { SyncCheckpointService } from './sync-checkpoint.service';

export interface EntitySyncResult {
  commits: number;
  pullRequests: number;
  issues: number;
  releases: number;
  tags: number;
  contributors: number;
  reviews: number;
}

@Injectable()
export class RepositoryEntitySyncService {
  private readonly logger = new Logger(RepositoryEntitySyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubApi: GithubApiClient,
    private readonly tokenStorage: OAuthTokenStorageService,
    private readonly checkpoints: SyncCheckpointService,
  ) {}

  async syncRepository(
    payload: RepositorySyncJobPayload,
  ): Promise<EntitySyncResult> {
    const repository = await this.prisma.repository.findFirst({
      where: { id: payload.repositoryId, deletedAt: null },
      include: {
        connectedAccount: { include: { oauthToken: true } },
      },
    });

    if (!repository?.connectedAccount?.oauthToken) {
      throw new Error(`Repository ${payload.repositoryId} missing OAuth token`);
    }

    const [owner, repo] = repository.fullName.split('/');
    if (!owner || !repo) {
      throw new Error(`Invalid fullName ${repository.fullName}`);
    }

    const accessToken = this.tokenStorage.decryptAccessToken(
      repository.connectedAccount.oauthToken,
    );

    const syncHistory = await this.prisma.syncHistory.create({
      data: {
        workspaceId: payload.workspaceId,
        connectedAccountId: repository.connectedAccountId,
        trigger: SyncTrigger.MANUAL,
        status: JobStatus.RUNNING,
        startedAt: new Date(),
        metadata: {
          repositoryId: payload.repositoryId,
          resume: payload.resume ?? true,
          triggeredBy: payload.triggeredBy,
        },
      },
    });

    const result: EntitySyncResult = {
      commits: 0,
      pullRequests: 0,
      issues: 0,
      releases: 0,
      tags: 0,
      contributors: 0,
      reviews: 0,
    };

    const entities: SyncEntityKind[] = payload.entities ?? [
      'commits',
      'pullRequests',
      'issues',
      'releases',
      'tags',
      'contributors',
    ];

    try {
      const ctx = {
        accessToken,
        owner,
        repo,
        repositoryId: repository.id,
        defaultBranch: repository.defaultBranch,
        resume: payload.resume !== false && !payload.force,
      };

      if (entities.includes('commits')) {
        result.commits = await this.syncCommits(ctx);
      }
      if (entities.includes('pullRequests')) {
        const prResult = await this.syncPullRequests(ctx);
        result.pullRequests = prResult.prs;
        result.reviews = prResult.reviews;
      }
      if (entities.includes('issues')) {
        result.issues = await this.syncIssues(ctx);
      }
      if (entities.includes('releases')) {
        result.releases = await this.syncReleases(ctx);
      }
      if (entities.includes('tags')) {
        result.tags = await this.syncTags(ctx);
      }
      if (entities.includes('contributors')) {
        result.contributors = await this.syncContributors(ctx);
      }

      await this.prisma.syncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
          repositoriesSynced: 1,
          commitsSynced: result.commits,
          metadata: { result } as never,
        },
      });

      await this.checkpoints.markPipelineStatus(payload.repositoryId, {
        entities: { ...result, completedAt: new Date().toISOString() },
      });

      await this.prisma.repository.update({
        where: { id: payload.repositoryId },
        data: { lastSyncedAt: new Date() },
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Entity sync failed';
      await this.prisma.syncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: JobStatus.FAILED,
          completedAt: new Date(),
          errorMessage: message,
        },
      });
      throw error;
    }
  }

  private async syncCommits(ctx: {
    accessToken: string;
    owner: string;
    repo: string;
    repositoryId: string;
    defaultBranch: string;
    resume: boolean;
  }): Promise<number> {
    const checkpoint = ctx.resume
      ? await this.checkpoints.getCheckpoint(ctx.repositoryId, 'commits')
      : undefined;
    const startPage = checkpoint && !checkpoint.completed ? checkpoint.page : 1;
    let total = 0;

    for await (const page of this.githubApi.listCommitsPage({
      accessToken: ctx.accessToken,
      owner: ctx.owner,
      repo: ctx.repo,
      sha: ctx.defaultBranch,
      startPage,
      perPage: DEFAULT_REPOSITORY_SYNC_LIMITS.perPage,
    })) {
      for (const item of page.items) {
        const sha = typeof item.sha === 'string' ? item.sha : undefined;
        if (!sha) continue;
        const commitObj =
          item.commit && typeof item.commit === 'object'
            ? (item.commit as Record<string, unknown>)
            : {};
        const author =
          commitObj.author && typeof commitObj.author === 'object'
            ? (commitObj.author as Record<string, unknown>)
            : {};
        const message =
          typeof commitObj.message === 'string'
            ? commitObj.message
            : '(no message)';
        const committedAt =
          typeof author.date === 'string' ? new Date(author.date) : new Date();

        await this.prisma.commit.upsert({
          where: {
            repositoryId_sha: { repositoryId: ctx.repositoryId, sha },
          },
          create: {
            repositoryId: ctx.repositoryId,
            sha,
            message,
            authorName: typeof author.name === 'string' ? author.name : null,
            authorEmail: typeof author.email === 'string' ? author.email : null,
            committedAt,
            providerMetadata: item as never,
          },
          update: {
            message,
            authorName: typeof author.name === 'string' ? author.name : null,
            authorEmail: typeof author.email === 'string' ? author.email : null,
            providerMetadata: item as never,
          },
        });
        total += 1;
      }

      await this.checkpoints.saveCheckpoint(ctx.repositoryId, {
        entity: 'commits',
        page: page.page + (page.hasNext ? 1 : 0),
        updatedAt: new Date().toISOString(),
        completed: !page.hasNext,
      });

      if (page.page >= DEFAULT_REPOSITORY_SYNC_LIMITS.maxPagesPerEntity) {
        break;
      }
    }

    this.logger.log(`Synced ${total} commits for ${ctx.repositoryId}`);
    return total;
  }

  private async syncPullRequests(ctx: {
    accessToken: string;
    owner: string;
    repo: string;
    repositoryId: string;
    resume: boolean;
  }): Promise<{ prs: number; reviews: number }> {
    const checkpoint = ctx.resume
      ? await this.checkpoints.getCheckpoint(ctx.repositoryId, 'pullRequests')
      : undefined;
    const startPage = checkpoint && !checkpoint.completed ? checkpoint.page : 1;
    let prs = 0;
    let reviews = 0;

    for await (const page of this.githubApi.listPullRequestsPage({
      accessToken: ctx.accessToken,
      owner: ctx.owner,
      repo: ctx.repo,
      state: 'all',
      startPage,
      perPage: DEFAULT_REPOSITORY_SYNC_LIMITS.perPage,
    })) {
      for (const item of page.items) {
        const number =
          typeof item.number === 'number' ? item.number : undefined;
        if (number === undefined) continue;
        const title =
          typeof item.title === 'string' ? item.title : `PR #${number}`;
        const stateRaw = typeof item.state === 'string' ? item.state : 'open';
        const merged = Boolean(item.merged_at);
        const state = merged
          ? PullRequestState.MERGED
          : stateRaw === 'closed'
            ? PullRequestState.CLOSED
            : PullRequestState.OPEN;
        const user =
          item.user && typeof item.user === 'object'
            ? (item.user as Record<string, unknown>)
            : {};
        const head =
          item.head && typeof item.head === 'object'
            ? (item.head as Record<string, unknown>)
            : {};
        const base =
          item.base && typeof item.base === 'object'
            ? (item.base as Record<string, unknown>)
            : {};

        const saved = await this.prisma.pullRequest.upsert({
          where: {
            repositoryId_number: {
              repositoryId: ctx.repositoryId,
              number,
            },
          },
          create: {
            repositoryId: ctx.repositoryId,
            number,
            title,
            body: typeof item.body === 'string' ? item.body : null,
            state,
            sourceBranch: typeof head.ref === 'string' ? head.ref : 'unknown',
            targetBranch: typeof base.ref === 'string' ? base.ref : 'unknown',
            authorUsername:
              typeof user.login === 'string' ? user.login : 'unknown',
            providerPullRequestId: String(
              typeof item.id === 'number' || typeof item.id === 'string'
                ? item.id
                : number,
            ),
            openedAt:
              typeof item.created_at === 'string'
                ? new Date(item.created_at)
                : new Date(),
            closedAt:
              typeof item.closed_at === 'string'
                ? new Date(item.closed_at)
                : null,
            mergedAt:
              typeof item.merged_at === 'string'
                ? new Date(item.merged_at)
                : null,
            providerMetadata: item as never,
          },
          update: {
            title,
            body: typeof item.body === 'string' ? item.body : null,
            state,
            providerMetadata: item as never,
            closedAt:
              typeof item.closed_at === 'string'
                ? new Date(item.closed_at)
                : null,
            mergedAt:
              typeof item.merged_at === 'string'
                ? new Date(item.merged_at)
                : null,
          },
        });
        prs += 1;

        reviews += await this.syncReviewsForPullRequest(ctx, number, saved.id);
      }

      await this.checkpoints.saveCheckpoint(ctx.repositoryId, {
        entity: 'pullRequests',
        page: page.page + (page.hasNext ? 1 : 0),
        updatedAt: new Date().toISOString(),
        completed: !page.hasNext,
      });

      if (page.page >= DEFAULT_REPOSITORY_SYNC_LIMITS.maxPagesPerEntity) {
        break;
      }
    }

    return { prs, reviews };
  }

  private async syncReviewsForPullRequest(
    ctx: {
      accessToken: string;
      owner: string;
      repo: string;
    },
    pullNumber: number,
    pullRequestId: string,
  ): Promise<number> {
    let count = 0;
    for await (const page of this.githubApi.listPullRequestReviewsPage({
      accessToken: ctx.accessToken,
      owner: ctx.owner,
      repo: ctx.repo,
      pullNumber,
      perPage: 50,
    })) {
      for (const item of page.items) {
        const providerReviewId =
          typeof item.id === 'number' || typeof item.id === 'string'
            ? String(item.id)
            : undefined;
        if (!providerReviewId) continue;
        const user =
          item.user && typeof item.user === 'object'
            ? (item.user as Record<string, unknown>)
            : {};
        const stateRaw =
          typeof item.state === 'string' ? item.state.toUpperCase() : 'PENDING';
        const state = (
          [
            'APPROVED',
            'CHANGES_REQUESTED',
            'COMMENTED',
            'DISMISSED',
            'PENDING',
          ].includes(stateRaw)
            ? stateRaw
            : 'PENDING'
        ) as ReviewState;

        const existing = await this.prisma.review.findFirst({
          where: { pullRequestId, providerReviewId },
        });
        if (existing) {
          await this.prisma.review.update({
            where: { id: existing.id },
            data: {
              body: typeof item.body === 'string' ? item.body : null,
              state,
              submittedAt:
                typeof item.submitted_at === 'string'
                  ? new Date(item.submitted_at)
                  : null,
            },
          });
        } else {
          await this.prisma.review.create({
            data: {
              pullRequestId,
              reviewerUsername:
                typeof user.login === 'string' ? user.login : 'unknown',
              state,
              body: typeof item.body === 'string' ? item.body : null,
              providerReviewId,
              submittedAt:
                typeof item.submitted_at === 'string'
                  ? new Date(item.submitted_at)
                  : null,
            },
          });
        }
        count += 1;
      }
      if (!page.hasNext) break;
    }
    return count;
  }

  private async syncIssues(ctx: {
    accessToken: string;
    owner: string;
    repo: string;
    repositoryId: string;
    resume: boolean;
  }): Promise<number> {
    const checkpoint = ctx.resume
      ? await this.checkpoints.getCheckpoint(ctx.repositoryId, 'issues')
      : undefined;
    const startPage = checkpoint && !checkpoint.completed ? checkpoint.page : 1;
    let total = 0;

    for await (const page of this.githubApi.listIssuesPage({
      accessToken: ctx.accessToken,
      owner: ctx.owner,
      repo: ctx.repo,
      state: 'all',
      startPage,
      perPage: DEFAULT_REPOSITORY_SYNC_LIMITS.perPage,
    })) {
      for (const item of page.items) {
        // GitHub issues API includes PRs — skip those
        if (item.pull_request) continue;
        const number =
          typeof item.number === 'number' ? item.number : undefined;
        if (number === undefined) continue;
        const user =
          item.user && typeof item.user === 'object'
            ? (item.user as Record<string, unknown>)
            : {};
        const stateRaw = typeof item.state === 'string' ? item.state : 'open';

        await this.prisma.issue.upsert({
          where: {
            repositoryId_number: {
              repositoryId: ctx.repositoryId,
              number,
            },
          },
          create: {
            repositoryId: ctx.repositoryId,
            number,
            title:
              typeof item.title === 'string' ? item.title : `Issue #${number}`,
            body: typeof item.body === 'string' ? item.body : null,
            state: stateRaw === 'closed' ? IssueState.CLOSED : IssueState.OPEN,
            authorUsername:
              typeof user.login === 'string' ? user.login : 'unknown',
            providerIssueId: String(
              typeof item.id === 'number' || typeof item.id === 'string'
                ? item.id
                : number,
            ),
            openedAt:
              typeof item.created_at === 'string'
                ? new Date(item.created_at)
                : new Date(),
            closedAt:
              typeof item.closed_at === 'string'
                ? new Date(item.closed_at)
                : null,
            providerMetadata: item as never,
          },
          update: {
            title:
              typeof item.title === 'string' ? item.title : `Issue #${number}`,
            body: typeof item.body === 'string' ? item.body : null,
            state: stateRaw === 'closed' ? IssueState.CLOSED : IssueState.OPEN,
            closedAt:
              typeof item.closed_at === 'string'
                ? new Date(item.closed_at)
                : null,
            providerMetadata: item as never,
          },
        });
        total += 1;
      }

      await this.checkpoints.saveCheckpoint(ctx.repositoryId, {
        entity: 'issues',
        page: page.page + (page.hasNext ? 1 : 0),
        updatedAt: new Date().toISOString(),
        completed: !page.hasNext,
      });

      if (page.page >= DEFAULT_REPOSITORY_SYNC_LIMITS.maxPagesPerEntity) {
        break;
      }
    }

    return total;
  }

  private async syncReleases(ctx: {
    accessToken: string;
    owner: string;
    repo: string;
    repositoryId: string;
    resume: boolean;
  }): Promise<number> {
    let total = 0;
    const checkpoint = ctx.resume
      ? await this.checkpoints.getCheckpoint(ctx.repositoryId, 'releases')
      : undefined;
    const startPage = checkpoint && !checkpoint.completed ? checkpoint.page : 1;

    for await (const page of this.githubApi.listReleasesPage({
      accessToken: ctx.accessToken,
      owner: ctx.owner,
      repo: ctx.repo,
      startPage,
      perPage: DEFAULT_REPOSITORY_SYNC_LIMITS.perPage,
    })) {
      for (const item of page.items) {
        const tagName =
          typeof item.tag_name === 'string' ? item.tag_name : undefined;
        if (!tagName) continue;
        await this.prisma.release.upsert({
          where: {
            repositoryId_tagName: {
              repositoryId: ctx.repositoryId,
              tagName,
            },
          },
          create: {
            repositoryId: ctx.repositoryId,
            tagName,
            name: typeof item.name === 'string' ? item.name : null,
            body: typeof item.body === 'string' ? item.body : null,
            isPrerelease: Boolean(item.prerelease),
            isDraft: Boolean(item.draft),
            providerReleaseId:
              typeof item.id === 'number' || typeof item.id === 'string'
                ? String(item.id)
                : null,
            publishedAt:
              typeof item.published_at === 'string'
                ? new Date(item.published_at)
                : null,
          },
          update: {
            name: typeof item.name === 'string' ? item.name : null,
            body: typeof item.body === 'string' ? item.body : null,
            isPrerelease: Boolean(item.prerelease),
            isDraft: Boolean(item.draft),
            publishedAt:
              typeof item.published_at === 'string'
                ? new Date(item.published_at)
                : null,
          },
        });
        total += 1;
      }

      await this.checkpoints.saveCheckpoint(ctx.repositoryId, {
        entity: 'releases',
        page: page.page + (page.hasNext ? 1 : 0),
        updatedAt: new Date().toISOString(),
        completed: !page.hasNext,
      });

      if (page.page >= DEFAULT_REPOSITORY_SYNC_LIMITS.maxPagesPerEntity) {
        break;
      }
    }
    return total;
  }

  private async syncTags(ctx: {
    accessToken: string;
    owner: string;
    repo: string;
    repositoryId: string;
    resume: boolean;
  }): Promise<number> {
    let total = 0;
    const checkpoint = ctx.resume
      ? await this.checkpoints.getCheckpoint(ctx.repositoryId, 'tags')
      : undefined;
    const startPage = checkpoint && !checkpoint.completed ? checkpoint.page : 1;

    for await (const page of this.githubApi.listTagsPage({
      accessToken: ctx.accessToken,
      owner: ctx.owner,
      repo: ctx.repo,
      startPage,
      perPage: DEFAULT_REPOSITORY_SYNC_LIMITS.perPage,
    })) {
      for (const item of page.items) {
        const name = typeof item.name === 'string' ? item.name : undefined;
        if (!name) continue;
        const commit =
          item.commit && typeof item.commit === 'object'
            ? (item.commit as Record<string, unknown>)
            : {};
        const sha = typeof commit.sha === 'string' ? commit.sha : 'unknown';
        await this.prisma.tag.upsert({
          where: {
            repositoryId_name: { repositoryId: ctx.repositoryId, name },
          },
          create: {
            repositoryId: ctx.repositoryId,
            name,
            commitSha: sha,
            providerTagId: name,
          },
          update: { commitSha: sha },
        });
        total += 1;
      }

      await this.checkpoints.saveCheckpoint(ctx.repositoryId, {
        entity: 'tags',
        page: page.page + (page.hasNext ? 1 : 0),
        updatedAt: new Date().toISOString(),
        completed: !page.hasNext,
      });

      if (page.page >= DEFAULT_REPOSITORY_SYNC_LIMITS.maxPagesPerEntity) {
        break;
      }
    }
    return total;
  }

  private async syncContributors(ctx: {
    accessToken: string;
    owner: string;
    repo: string;
    repositoryId: string;
    resume: boolean;
  }): Promise<number> {
    let total = 0;
    const checkpoint = ctx.resume
      ? await this.checkpoints.getCheckpoint(ctx.repositoryId, 'contributors')
      : undefined;
    const startPage = checkpoint && !checkpoint.completed ? checkpoint.page : 1;

    for await (const page of this.githubApi.listContributorsPage({
      accessToken: ctx.accessToken,
      owner: ctx.owner,
      repo: ctx.repo,
      startPage,
      perPage: DEFAULT_REPOSITORY_SYNC_LIMITS.perPage,
    })) {
      for (const item of page.items) {
        const username =
          typeof item.login === 'string' ? item.login : undefined;
        if (!username) continue;
        const commitCount =
          typeof item.contributions === 'number' ? item.contributions : 0;
        await this.prisma.repositoryContributor.upsert({
          where: {
            repositoryId_username: {
              repositoryId: ctx.repositoryId,
              username,
            },
          },
          create: {
            repositoryId: ctx.repositoryId,
            username,
            commitCount,
            providerMetadata: item as never,
          },
          update: {
            commitCount,
            providerMetadata: item as never,
          },
        });
        total += 1;
      }

      await this.checkpoints.saveCheckpoint(ctx.repositoryId, {
        entity: 'contributors',
        page: page.page + (page.hasNext ? 1 : 0),
        updatedAt: new Date().toISOString(),
        completed: !page.hasNext,
      });

      if (page.page >= DEFAULT_REPOSITORY_SYNC_LIMITS.maxPagesPerEntity) {
        break;
      }
    }
    return total;
  }
}
