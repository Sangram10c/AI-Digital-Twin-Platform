/**
 * Repository Feature Types
 */
export interface Repository {
  id: string;
  name: string;
  fullName?: string;
  owner?: string;
  description?: string | null;
  defaultBranch?: string;
  isPrivate?: boolean;
  language?: string | null;
  starsCount?: number;
  status?: string;
  commitsCount?: number;
  pullRequestsCount?: number;
  lastSyncedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  url?: string;
  htmlUrl?: string;
}

export interface SyncCheckpoint {
  phase: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  processedCount?: number;
  totalCount?: number;
  lastError?: string | null;
  updatedAt?: string;
}

export interface RepositorySyncStatusResponse {
  repositoryId: string;
  fullName?: string;
  lastSyncedAt?: string | null;
  pipelineStatus?: string | null;
  checkpoints?: Record<string, SyncCheckpoint>;
  queues?: {
    repository?: Record<string, number>;
    knowledge?: Record<string, number>;
  };
}
