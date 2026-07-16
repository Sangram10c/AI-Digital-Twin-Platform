export const WEBHOOK_QUEUES = {
  WEBHOOK: 'webhook-processing',
  REPOSITORY_SYNC: 'webhook-repository-sync',
  COMMIT_SYNC: 'webhook-commit-sync',
  PR_SYNC: 'webhook-pr-sync',
  ISSUE_SYNC: 'webhook-issue-sync',
  RELEASE_SYNC: 'webhook-release-sync',
  STATISTICS: 'webhook-statistics',
  DEAD_LETTER: 'webhook-dead-letter',
} as const;

export const WEBHOOK_JOBS = {
  PROCESS_EVENT: 'process-webhook-event',
  SYNC_COMMITS: 'sync-commits-from-webhook',
  SYNC_PULL_REQUEST: 'sync-pull-request-from-webhook',
  SYNC_ISSUE: 'sync-issue-from-webhook',
  SYNC_RELEASE: 'sync-release-from-webhook',
  SYNC_REPOSITORY: 'sync-repository-from-webhook',
  UPDATE_STATISTICS: 'update-statistics-from-webhook',
  DEAD_LETTER: 'dead-letter',
} as const;

/** GitHub event names we explicitly support (others stored + ignored). */
export const SUPPORTED_GITHUB_EVENTS = [
  'push',
  'pull_request',
  'pull_request_review',
  'issues',
  'issue_comment',
  'create',
  'delete',
  'release',
  'fork',
  'star',
  'watch',
  'repository',
  'installation',
  'installation_repositories',
  'ping',
] as const;

export type SupportedGithubEvent = (typeof SUPPORTED_GITHUB_EVENTS)[number];

export const DEFAULT_WEBHOOK_LIMITS = {
  /** Reject deliveries older than this (replay protection window). */
  maxDeliveryAgeMs: 5 * 60 * 1000,
  maxRetries: 5,
  backoffDelayMs: 2000,
  workerConcurrency: 5,
  /** In-memory recent delivery IDs for fast duplicate rejection. */
  replayCacheMaxEntries: 5_000,
  replayCacheTtlMs: 10 * 60 * 1000,
} as const;

export const GITHUB_SIGNATURE_HEADER = 'x-hub-signature-256';
export const GITHUB_EVENT_HEADER = 'x-github-event';
export const GITHUB_DELIVERY_HEADER = 'x-github-delivery';
export const GITHUB_HOOK_ID_HEADER = 'x-github-hook-id';
