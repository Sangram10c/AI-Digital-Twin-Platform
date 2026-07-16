import { Injectable, Logger } from '@nestjs/common';
import {
  IssueState,
  JobStatus,
  Prisma,
  PullRequestState,
  RepositoryStatus,
  SyncTrigger,
  WebhookEventStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { WebhookJobPayload } from '../interfaces/webhook.interfaces';
import { WebhookMetricsService } from './webhook-metrics.service';

/**
 * Applies incremental DB updates from GitHub webhook payloads.
 * Does not crawl GitHub APIs — handlers only enqueue these jobs.
 */
@Injectable()
export class WebhookPayloadSyncService {
  private readonly logger = new Logger(WebhookPayloadSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: WebhookMetricsService,
  ) {}

  async processDomainJob(payload: WebhookJobPayload): Promise<void> {
    const started = Date.now();
    const event = await this.prisma.webhookEvent.findUnique({
      where: { id: payload.webhookEventId },
    });

    if (!event) {
      this.logger.warn(`Webhook event ${payload.webhookEventId} missing`);
      return;
    }

    if (
      event.status === WebhookEventStatus.PROCESSED ||
      event.status === WebhookEventStatus.IGNORED
    ) {
      return;
    }

    await this.prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: WebhookEventStatus.PROCESSING },
    });

    const syncHistory = await this.prisma.syncHistory.create({
      data: {
        workspaceId: payload.workspaceId,
        connectedAccountId: payload.connectedAccountId,
        trigger: SyncTrigger.WEBHOOK,
        status: JobStatus.RUNNING,
        startedAt: new Date(),
        metadata: {
          webhookEventId: payload.webhookEventId,
          deliveryId: payload.deliveryId,
          githubEvent: payload.githubEvent,
        },
      },
    });

    try {
      const envelope = event.payload as {
        body?: Record<string, unknown>;
        repositoryId?: string | null;
      };
      const body = envelope.body ?? {};
      const repositoryId =
        payload.repositoryId ?? envelope.repositoryId ?? undefined;

      let commitsSynced = 0;

      switch (payload.githubEvent) {
        case 'push':
        case 'create':
        case 'delete':
          commitsSynced = await this.applyPushLike(repositoryId, body);
          break;
        case 'pull_request':
        case 'pull_request_review':
          await this.applyPullRequest(repositoryId, body);
          break;
        case 'issues':
        case 'issue_comment':
          await this.applyIssue(repositoryId, body);
          break;
        case 'release':
          await this.applyRelease(repositoryId, body);
          break;
        case 'repository':
        case 'fork':
        case 'installation':
        case 'installation_repositories':
          await this.applyRepositoryMeta(repositoryId, body);
          break;
        case 'star':
        case 'watch':
          await this.applyStatistics(repositoryId, body);
          break;
        default:
          break;
      }

      await this.prisma.syncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
          repositoriesSynced: repositoryId ? 1 : 0,
          commitsSynced,
        },
      });

      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: WebhookEventStatus.PROCESSED,
          processedAt: new Date(),
          errorMessage: null,
        },
      });

      this.metrics.recordProcessed();
      this.metrics.recordLatency(Date.now() - started);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Webhook domain sync failed';
      await this.prisma.syncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: JobStatus.FAILED,
          completedAt: new Date(),
          errorMessage: message,
        },
      });
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: WebhookEventStatus.FAILED,
          errorMessage: message,
        },
      });
      this.metrics.recordFailed();
      throw error;
    }
  }

  private async applyPushLike(
    repositoryId: string | undefined,
    body: Record<string, unknown>,
  ): Promise<number> {
    if (!repositoryId) {
      return 0;
    }

    const ref = typeof body.ref === 'string' ? body.ref : undefined;
    const branchName = ref?.startsWith('refs/heads/')
      ? ref.replace('refs/heads/', '')
      : undefined;
    const after =
      typeof body.after === 'string' && body.after !== '0'.repeat(40)
        ? body.after
        : undefined;

    let branchId: string | undefined;
    if (branchName) {
      const branch = await this.prisma.branch.upsert({
        where: {
          repositoryId_name: { repositoryId, name: branchName },
        },
        create: {
          repositoryId,
          name: branchName,
          lastCommitSha: after ?? null,
          isDefault: false,
        },
        update: {
          lastCommitSha: after ?? undefined,
        },
      });
      branchId = branch.id;
    }

    const commits = Array.isArray(body.commits) ? body.commits : [];
    let count = 0;
    for (const raw of commits) {
      if (!raw || typeof raw !== 'object') continue;
      const commit = raw as Record<string, unknown>;
      const sha = typeof commit.id === 'string' ? commit.id : undefined;
      if (!sha) continue;
      const message =
        typeof commit.message === 'string' ? commit.message : '(no message)';
      const author =
        commit.author && typeof commit.author === 'object'
          ? (commit.author as Record<string, unknown>)
          : {};
      const committedAt =
        typeof commit.timestamp === 'string'
          ? new Date(commit.timestamp)
          : new Date();

      await this.prisma.commit.upsert({
        where: { repositoryId_sha: { repositoryId, sha } },
        create: {
          repositoryId,
          branchId: branchId ?? null,
          sha,
          message,
          authorName: typeof author.name === 'string' ? author.name : null,
          authorEmail: typeof author.email === 'string' ? author.email : null,
          committedAt,
          parentShas: Array.isArray(commit.parents)
            ? commit.parents
                .map((p) =>
                  p && typeof p === 'object' && 'id' in p
                    ? String((p as { id: unknown }).id)
                    : null,
                )
                .filter((v): v is string => Boolean(v))
            : [],
          providerMetadata: commit as Prisma.InputJsonValue,
        },
        update: {
          message,
          branchId: branchId ?? undefined,
          authorName: typeof author.name === 'string' ? author.name : undefined,
          authorEmail:
            typeof author.email === 'string' ? author.email : undefined,
        },
      });
      count += 1;
    }

    if (body.deleted === true && branchName) {
      await this.prisma.branch.deleteMany({
        where: { repositoryId, name: branchName },
      });
    }

    await this.prisma.repository.update({
      where: { id: repositoryId },
      data: { lastSyncedAt: new Date(), status: RepositoryStatus.ACTIVE },
    });

    return count;
  }

  private async applyPullRequest(
    repositoryId: string | undefined,
    body: Record<string, unknown>,
  ): Promise<void> {
    if (!repositoryId) return;
    const pr = body.pull_request;
    if (!pr || typeof pr !== 'object') return;
    const data = pr as Record<string, unknown>;
    const number = typeof data.number === 'number' ? data.number : undefined;
    if (number === undefined) return;

    const stateRaw = typeof data.state === 'string' ? data.state : 'open';
    const merged = Boolean(data.merged);
    const state = merged
      ? PullRequestState.MERGED
      : stateRaw === 'closed'
        ? PullRequestState.CLOSED
        : PullRequestState.OPEN;

    const user =
      data.user && typeof data.user === 'object'
        ? (data.user as Record<string, unknown>)
        : {};
    const head =
      data.head && typeof data.head === 'object'
        ? (data.head as Record<string, unknown>)
        : {};
    const base =
      data.base && typeof data.base === 'object'
        ? (data.base as Record<string, unknown>)
        : {};

    await this.prisma.pullRequest.upsert({
      where: {
        repositoryId_number: { repositoryId, number },
      },
      create: {
        repositoryId,
        number,
        title: typeof data.title === 'string' ? data.title : `PR #${number}`,
        body: typeof data.body === 'string' ? data.body : null,
        state,
        sourceBranch: typeof head.ref === 'string' ? head.ref : 'unknown',
        targetBranch: typeof base.ref === 'string' ? base.ref : 'unknown',
        authorUsername: typeof user.login === 'string' ? user.login : 'unknown',
        providerPullRequestId: this.providerId(data.id, number)!,
        openedAt:
          typeof data.created_at === 'string'
            ? new Date(data.created_at)
            : new Date(),
        closedAt:
          typeof data.closed_at === 'string' ? new Date(data.closed_at) : null,
        mergedAt:
          typeof data.merged_at === 'string' ? new Date(data.merged_at) : null,
        providerMetadata: data as Prisma.InputJsonValue,
      },
      update: {
        title: typeof data.title === 'string' ? data.title : undefined,
        body: typeof data.body === 'string' ? data.body : undefined,
        state,
        closedAt:
          typeof data.closed_at === 'string'
            ? new Date(data.closed_at)
            : undefined,
        mergedAt:
          typeof data.merged_at === 'string'
            ? new Date(data.merged_at)
            : undefined,
        providerMetadata: data as Prisma.InputJsonValue,
      },
    });
  }

  private async applyIssue(
    repositoryId: string | undefined,
    body: Record<string, unknown>,
  ): Promise<void> {
    if (!repositoryId) return;
    const issue = body.issue;
    if (!issue || typeof issue !== 'object') return;
    const data = issue as Record<string, unknown>;
    // Skip PR-backed "issues"
    if (data.pull_request) return;

    const number = typeof data.number === 'number' ? data.number : undefined;
    if (number === undefined) return;
    const stateRaw = typeof data.state === 'string' ? data.state : 'open';
    const state = stateRaw === 'closed' ? IssueState.CLOSED : IssueState.OPEN;
    const user =
      data.user && typeof data.user === 'object'
        ? (data.user as Record<string, unknown>)
        : {};

    await this.prisma.issue.upsert({
      where: { repositoryId_number: { repositoryId, number } },
      create: {
        repositoryId,
        number,
        title: typeof data.title === 'string' ? data.title : `Issue #${number}`,
        body: typeof data.body === 'string' ? data.body : null,
        state,
        authorUsername: typeof user.login === 'string' ? user.login : 'unknown',
        providerIssueId: this.providerId(data.id, number)!,
        openedAt:
          typeof data.created_at === 'string'
            ? new Date(data.created_at)
            : new Date(),
        closedAt:
          typeof data.closed_at === 'string' ? new Date(data.closed_at) : null,
        providerMetadata: data as Prisma.InputJsonValue,
      },
      update: {
        title: typeof data.title === 'string' ? data.title : undefined,
        body: typeof data.body === 'string' ? data.body : undefined,
        state,
        closedAt:
          typeof data.closed_at === 'string'
            ? new Date(data.closed_at)
            : undefined,
        providerMetadata: data as Prisma.InputJsonValue,
      },
    });
  }

  private async applyRelease(
    repositoryId: string | undefined,
    body: Record<string, unknown>,
  ): Promise<void> {
    if (!repositoryId) return;
    const release = body.release;
    if (!release || typeof release !== 'object') return;
    const data = release as Record<string, unknown>;
    const tagName =
      typeof data.tag_name === 'string' ? data.tag_name : undefined;
    if (!tagName) return;

    await this.prisma.release.upsert({
      where: { repositoryId_tagName: { repositoryId, tagName } },
      create: {
        repositoryId,
        tagName,
        name: typeof data.name === 'string' ? data.name : null,
        body: typeof data.body === 'string' ? data.body : null,
        isPrerelease: Boolean(data.prerelease),
        isDraft: Boolean(data.draft),
        providerReleaseId: this.providerId(data.id),
        publishedAt:
          typeof data.published_at === 'string'
            ? new Date(data.published_at)
            : null,
      },
      update: {
        name: typeof data.name === 'string' ? data.name : undefined,
        body: typeof data.body === 'string' ? data.body : undefined,
        isPrerelease: Boolean(data.prerelease),
        isDraft: Boolean(data.draft),
        publishedAt:
          typeof data.published_at === 'string'
            ? new Date(data.published_at)
            : undefined,
      },
    });

    const commitSha =
      data.target_commitish && typeof data.target_commitish === 'string'
        ? data.target_commitish
        : 'unknown';
    await this.prisma.tag.upsert({
      where: { repositoryId_name: { repositoryId, name: tagName } },
      create: {
        repositoryId,
        name: tagName,
        commitSha,
      },
      update: { commitSha },
    });
  }

  private async applyRepositoryMeta(
    repositoryId: string | undefined,
    body: Record<string, unknown>,
  ): Promise<void> {
    if (!repositoryId) return;
    const repository = body.repository;
    if (!repository || typeof repository !== 'object') return;
    const data = repository as Record<string, unknown>;

    await this.prisma.repository.update({
      where: { id: repositoryId },
      data: {
        name: typeof data.name === 'string' ? data.name : undefined,
        fullName:
          typeof data.full_name === 'string' ? data.full_name : undefined,
        description:
          typeof data.description === 'string' ? data.description : undefined,
        url: typeof data.html_url === 'string' ? data.html_url : undefined,
        defaultBranch:
          typeof data.default_branch === 'string'
            ? data.default_branch
            : undefined,
        isPrivate: typeof data.private === 'boolean' ? data.private : undefined,
        isFork: typeof data.fork === 'boolean' ? data.fork : undefined,
        status:
          data.archived === true
            ? RepositoryStatus.ARCHIVED
            : RepositoryStatus.ACTIVE,
        lastSyncedAt: new Date(),
        providerMetadata: data as Prisma.InputJsonValue,
      },
    });
  }

  private async applyStatistics(
    repositoryId: string | undefined,
    body: Record<string, unknown>,
  ): Promise<void> {
    if (!repositoryId) return;
    const repository = body.repository;
    if (!repository || typeof repository !== 'object') return;
    const data = repository as Record<string, unknown>;

    await this.prisma.repositoryStatistics.upsert({
      where: { repositoryId },
      create: {
        repositoryId,
        starCount:
          typeof data.stargazers_count === 'number' ? data.stargazers_count : 0,
        forkCount: typeof data.forks_count === 'number' ? data.forks_count : 0,
        watcherCount:
          typeof data.watchers_count === 'number' ? data.watchers_count : 0,
        openIssueCount:
          typeof data.open_issues_count === 'number'
            ? data.open_issues_count
            : 0,
        lastCalculatedAt: new Date(),
      },
      update: {
        starCount:
          typeof data.stargazers_count === 'number'
            ? data.stargazers_count
            : undefined,
        forkCount:
          typeof data.forks_count === 'number' ? data.forks_count : undefined,
        watcherCount:
          typeof data.watchers_count === 'number'
            ? data.watchers_count
            : undefined,
        openIssueCount:
          typeof data.open_issues_count === 'number'
            ? data.open_issues_count
            : undefined,
        lastCalculatedAt: new Date(),
      },
    });
  }

  private providerId(
    value: unknown,
    fallback?: number | string,
  ): string | null {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    if (fallback !== undefined) {
      return String(fallback);
    }
    return null;
  }
}
