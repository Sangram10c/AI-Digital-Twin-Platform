import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { KnowledgeQueueService } from '../../knowledge/jobs/knowledge-queue.service';
import { RepositorySyncQueueService } from '../../repository/jobs/repository-sync-queue.service';
import { WebhookJobPayload } from '../interfaces/webhook.interfaces';

/**
 * After webhook domain sync succeeds:
 * 1) enqueue knowledge for changed entities
 * 2) enqueue documentation sync when docs/package files change
 * 3) keep pipeline automated without heavy work in the HTTP handler
 */
@Injectable()
export class WebhookKnowledgeBridgeService {
  private readonly logger = new Logger(WebhookKnowledgeBridgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeQueue: KnowledgeQueueService,
    private readonly repositoryQueue: RepositorySyncQueueService,
  ) {}

  async enqueueFromWebhook(payload: WebhookJobPayload): Promise<void> {
    const repositoryId = payload.repositoryId;
    const workspaceId = payload.workspaceId;
    if (!repositoryId || !workspaceId) {
      return;
    }

    const event = await this.prisma.webhookEvent.findUnique({
      where: { id: payload.webhookEventId },
    });
    if (!event) {
      return;
    }

    const envelope = event.payload as {
      body?: Record<string, unknown>;
    };
    const body = envelope.body ?? {};

    try {
      switch (payload.githubEvent) {
        case 'push':
        case 'create':
          await this.enqueueCommits(workspaceId, repositoryId, body);
          if (this.touchesDocumentationOrPackageJson(body)) {
            await this.repositoryQueue.enqueueDocumentationSync({
              workspaceId,
              repositoryId,
              triggeredBy: `webhook:${payload.deliveryId}`,
              force: false,
              continuePipeline: true,
            });
            this.logger.log(
              `Enqueued documentation sync after push for ${repositoryId}`,
            );
          } else if (this.touchesPackageJson(body)) {
            await this.knowledgeQueue.enqueueRepositoryProcessing({
              workspaceId,
              repositoryId,
              triggeredBy: `webhook:${payload.deliveryId}`,
              force: false,
            });
          }
          break;

        case 'pull_request':
        case 'pull_request_review':
          await this.enqueuePullRequest(workspaceId, repositoryId, body);
          break;

        case 'issues':
        case 'issue_comment':
          await this.enqueueIssue(workspaceId, repositoryId, body);
          break;

        case 'release':
          await this.repositoryQueue.enqueueDocumentationSync({
            workspaceId,
            repositoryId,
            triggeredBy: `webhook-release:${payload.deliveryId}`,
            force: false,
            continuePipeline: true,
          });
          break;

        case 'repository':
          await this.repositoryQueue.enqueuePipeline({
            workspaceId,
            repositoryId,
            triggeredBy: `webhook:${payload.deliveryId}`,
            force: false,
            stages: ['documentation', 'knowledge'],
          });
          this.logger.log(
            `Enqueued documentation+knowledge pipeline for ${repositoryId}`,
          );
          break;

        default:
          break;
      }
    } catch (error) {
      this.logger.warn(
        `Knowledge bridge skipped for ${payload.githubEvent}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async enqueueCommits(
    workspaceId: string,
    repositoryId: string,
    body: Record<string, unknown>,
  ) {
    const commits = Array.isArray(body.commits) ? body.commits : [];
    let enqueued = 0;

    for (const raw of commits) {
      if (!raw || typeof raw !== 'object') continue;
      const sha = (raw as { id?: string }).id;
      if (!sha) continue;

      const commit = await this.prisma.commit.findUnique({
        where: { repositoryId_sha: { repositoryId, sha } },
        select: { id: true },
      });
      if (!commit) continue;

      await this.knowledgeQueue.enqueueCommitProcessing({
        workspaceId,
        repositoryId,
        entityId: commit.id,
        triggeredBy: 'webhook',
        force: false,
      });
      enqueued += 1;
    }

    if (enqueued > 0) {
      this.logger.log(
        `Enqueued ${enqueued} commit knowledge job(s) for repository ${repositoryId}`,
      );
    }
  }

  private async enqueuePullRequest(
    workspaceId: string,
    repositoryId: string,
    body: Record<string, unknown>,
  ) {
    const pr = body.pull_request;
    if (!pr || typeof pr !== 'object') return;
    const number = (pr as { number?: number }).number;
    if (typeof number !== 'number') return;

    const pullRequest = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId, number } },
      select: { id: true },
    });
    if (!pullRequest) return;

    await this.knowledgeQueue.enqueuePullRequestProcessing({
      workspaceId,
      repositoryId,
      entityId: pullRequest.id,
      triggeredBy: 'webhook',
      force: false,
    });
    this.logger.log(
      `Enqueued PR #${number} knowledge job for repository ${repositoryId}`,
    );
  }

  private async enqueueIssue(
    workspaceId: string,
    repositoryId: string,
    body: Record<string, unknown>,
  ) {
    const issue = body.issue;
    if (!issue || typeof issue !== 'object') return;
    const number = (issue as { number?: number }).number;
    if (typeof number !== 'number') return;

    const saved = await this.prisma.issue.findUnique({
      where: { repositoryId_number: { repositoryId, number } },
      select: { id: true },
    });
    if (!saved) return;

    await this.knowledgeQueue.enqueueIssueProcessing({
      workspaceId,
      repositoryId,
      entityId: saved.id,
      triggeredBy: 'webhook',
      force: false,
    });
    this.logger.log(
      `Enqueued issue #${number} knowledge job for repository ${repositoryId}`,
    );
  }

  private collectChangedPaths(body: Record<string, unknown>): string[] {
    const commits = Array.isArray(body.commits) ? body.commits : [];
    const paths: string[] = [];
    for (const raw of commits) {
      if (!raw || typeof raw !== 'object') continue;
      const commit = raw as {
        added?: string[];
        modified?: string[];
        removed?: string[];
      };
      paths.push(
        ...(commit.added ?? []),
        ...(commit.modified ?? []),
        ...(commit.removed ?? []),
      );
    }
    return paths;
  }

  private touchesPackageJson(body: Record<string, unknown>): boolean {
    return this.collectChangedPaths(body).some(
      (path) => path === 'package.json' || path.endsWith('/package.json'),
    );
  }

  private touchesDocumentationOrPackageJson(
    body: Record<string, unknown>,
  ): boolean {
    return this.collectChangedPaths(body).some((path) => {
      const lower = path.toLowerCase();
      return (
        lower === 'package.json' ||
        lower.endsWith('/package.json') ||
        lower === 'readme.md' ||
        lower.endsWith('/readme.md') ||
        lower.startsWith('docs/') ||
        lower.startsWith('architecture/') ||
        lower.startsWith('adr/') ||
        lower.startsWith('.github/') ||
        lower.startsWith('changelog') ||
        lower.includes('contributing') ||
        lower.includes('security.md') ||
        lower.includes('license')
      );
    });
  }
}
