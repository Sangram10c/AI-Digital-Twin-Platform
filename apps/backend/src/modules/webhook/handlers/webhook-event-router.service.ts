import { Injectable } from '@nestjs/common';
import {
  SUPPORTED_GITHUB_EVENTS,
  WEBHOOK_JOBS,
  WEBHOOK_QUEUES,
} from '../constants/webhook.constants';
import { RoutedJob } from '../interfaces/webhook.interfaces';

@Injectable()
export class WebhookEventRouterService {
  route(githubEvent: string): RoutedJob | null {
    if (!(SUPPORTED_GITHUB_EVENTS as readonly string[]).includes(githubEvent)) {
      return null;
    }

    switch (githubEvent) {
      case 'ping':
        return null;
      case 'push':
      case 'create':
      case 'delete':
        return {
          queue: WEBHOOK_QUEUES.COMMIT_SYNC,
          jobName: WEBHOOK_JOBS.SYNC_COMMITS,
          reason: `${githubEvent} → commit/branch sync`,
        };
      case 'pull_request':
      case 'pull_request_review':
        return {
          queue: WEBHOOK_QUEUES.PR_SYNC,
          jobName: WEBHOOK_JOBS.SYNC_PULL_REQUEST,
          reason: `${githubEvent} → pull request sync`,
        };
      case 'issues':
      case 'issue_comment':
        return {
          queue: WEBHOOK_QUEUES.ISSUE_SYNC,
          jobName: WEBHOOK_JOBS.SYNC_ISSUE,
          reason: `${githubEvent} → issue sync`,
        };
      case 'release':
        return {
          queue: WEBHOOK_QUEUES.RELEASE_SYNC,
          jobName: WEBHOOK_JOBS.SYNC_RELEASE,
          reason: `${githubEvent} → release sync`,
        };
      case 'repository':
      case 'installation':
      case 'installation_repositories':
      case 'fork':
        return {
          queue: WEBHOOK_QUEUES.REPOSITORY_SYNC,
          jobName: WEBHOOK_JOBS.SYNC_REPOSITORY,
          reason: `${githubEvent} → repository sync`,
        };
      case 'star':
      case 'watch':
        return {
          queue: WEBHOOK_QUEUES.STATISTICS,
          jobName: WEBHOOK_JOBS.UPDATE_STATISTICS,
          reason: `${githubEvent} → statistics update`,
        };
      default:
        return null;
    }
  }
}
