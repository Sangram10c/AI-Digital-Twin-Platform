import { REPOSITORY_QUEUES } from '../constants/repository-sync.constants';

export type RepositoryQueueName =
  (typeof REPOSITORY_QUEUES)[keyof typeof REPOSITORY_QUEUES];

export type SyncEntityKind =
  | 'commits'
  | 'pullRequests'
  | 'issues'
  | 'releases'
  | 'tags'
  | 'contributors'
  | 'reviews';

export interface SyncCheckpoint {
  entity: SyncEntityKind;
  page: number;
  updatedAt: string;
  completed: boolean;
  lastError?: string;
}

export interface RepositorySyncJobPayload {
  workspaceId: string;
  repositoryId: string;
  connectedAccountId?: string;
  triggeredBy?: string;
  force?: boolean;
  resume?: boolean;
  /** Optional: only sync these entities */
  entities?: SyncEntityKind[];
}

export interface DocumentationSyncJobPayload {
  workspaceId: string;
  repositoryId: string;
  triggeredBy?: string;
  force?: boolean;
  /** When true, enqueue knowledge processing after docs sync */
  continuePipeline?: boolean;
}

export interface RepositoryPipelineJobPayload {
  workspaceId: string;
  repositoryId: string;
  triggeredBy?: string;
  force?: boolean;
  /** Stages to run; default all */
  stages?: Array<'entities' | 'documentation' | 'knowledge'>;
}

export interface RepositoryDeadLetterPayload {
  workspaceId: string;
  repositoryId: string;
  sourceQueue: string;
  jobName: string;
  error: string;
  attemptsMade: number;
}
