import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { KnowledgeQueueService } from '../../knowledge/jobs/knowledge-queue.service';
import { WebhookJobPayload } from '../interfaces/webhook.interfaces';

/**
 * After webhook domain sync succeeds, enqueue knowledge jobs so the
 * Digital Twin knowledge base stays fresh without a manual process call.
 */
@Injectable()
export class WebhookKnowledgeBridgeService {
  private readonly logger = new Logger(WebhookKnowledgeBridgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeQueue: KnowledgeQueueService,
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
          if (this.touchesPackageJson(body)) {
            await this.knowledgeQueue.enqueueRepositoryProcessing({
              workspaceId,
              repositoryId,
              triggeredBy: `webhook:${payload.deliveryId}`,
              force: false,
            });
            this.logger.log(
              `Enqueued repository knowledge (package.json change) for ${repositoryId}`,
            );
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
          await this.enqueueReleaseAsRepositoryRefresh(
            workspaceId,
            repositoryId,
            payload.deliveryId,
          );
          break;

        case 'repository':
          await this.knowledgeQueue.enqueueRepositoryProcessing({
            workspaceId,
            repositoryId,
            triggeredBy: `webhook:${payload.deliveryId}`,
            force: false,
          });
          this.logger.log(
            `Enqueued repository knowledge refresh for ${repositoryId}`,
          );
          break;

        default:
          break;
      }
    } catch (error) {
      // Knowledge enqueue must never fail the webhook sync path.
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

  private async enqueueReleaseAsRepositoryRefresh(
    workspaceId: string,
    repositoryId: string,
    deliveryId: string,
  ) {
    // Release knowledge is created during repository orchestration;
    // refresh repo knowledge so release notes get picked up.
    await this.knowledgeQueue.enqueueRepositoryProcessing({
      workspaceId,
      repositoryId,
      triggeredBy: `webhook-release:${deliveryId}`,
      force: false,
    });
    this.logger.log(
      `Enqueued repository knowledge after release for ${repositoryId}`,
    );
  }

  private touchesPackageJson(body: Record<string, unknown>): boolean {
    const commits = Array.isArray(body.commits) ? body.commits : [];
    for (const raw of commits) {
      if (!raw || typeof raw !== 'object') continue;
      const commit = raw as {
        added?: string[];
        modified?: string[];
        removed?: string[];
      };
      const paths = [
        ...(commit.added ?? []),
        ...(commit.modified ?? []),
        ...(commit.removed ?? []),
      ];
      if (
        paths.some(
          (path) => path === 'package.json' || path.endsWith('/package.json'),
        )
      ) {
        return true;
      }
    }
    return false;
  }
}
