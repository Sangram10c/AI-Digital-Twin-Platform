import { WebhookEventType } from '@prisma/client';
import { WEBHOOK_QUEUES } from '../constants/webhook.constants';

export interface GithubWebhookHeaders {
  event: string;
  deliveryId: string;
  signature256?: string;
  hookId?: string;
}

export interface ResolvedWebhookTarget {
  workspaceId: string;
  connectedAccountId: string;
  repositoryId?: string;
  providerRepositoryId?: string;
}

export interface IngestWebhookResult {
  accepted: boolean;
  duplicate: boolean;
  ignored: boolean;
  webhookEventId?: string;
  jobId?: string;
  message: string;
}

export interface WebhookJobPayload {
  webhookEventId: string;
  workspaceId: string;
  connectedAccountId: string;
  repositoryId?: string;
  githubEvent: string;
  action?: string | null;
  deliveryId: string;
}

export type DomainQueueName =
  (typeof WEBHOOK_QUEUES)[keyof typeof WEBHOOK_QUEUES];

export interface RoutedJob {
  queue: DomainQueueName;
  jobName: string;
  reason: string;
}

export function mapGithubEventToType(event: string): WebhookEventType {
  switch (event) {
    case 'push':
      return WebhookEventType.PUSH;
    case 'pull_request':
    case 'pull_request_review':
      return WebhookEventType.PULL_REQUEST;
    case 'issues':
    case 'issue_comment':
      return WebhookEventType.ISSUE;
    case 'release':
      return WebhookEventType.RELEASE;
    case 'installation':
    case 'installation_repositories':
      return WebhookEventType.INSTALLATION;
    case 'repository':
      return WebhookEventType.REPOSITORY;
    default:
      return WebhookEventType.OTHER;
  }
}
