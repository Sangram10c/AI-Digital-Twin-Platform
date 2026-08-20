/**
 * Repository Service
 * Connects to NestJS Repository/GitHub module
 */
import { api } from './api.service';

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
}

interface RawRepository {
  id: string;
  name: string;
  fullName?: string;
  owner?: string;
  ownerName?: string;
  description?: string | null;
  defaultBranch?: string;
  isPrivate?: boolean;
  language?: string | null;
  syncStatus?: string;
  status?: string;
  commitsCount?: number;
  pullRequestsCount?: number;
  _count?: { commits?: number; pullRequests?: number };
  lastSyncedAt?: string | null;
  syncedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const repositoryService = {
  /**
   * List connected repositories for a workspace
   */
  async getRepositories(workspaceId: string): Promise<Repository[]> {
    try {
      const { data } = await api.get<{ data?: RawRepository[] } | RawRepository[]>(
        `/workspaces/${workspaceId}/repositories`,
      );
      const list: RawRepository[] = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray(data.data)
          ? data.data
          : [];

      return list.map((r: RawRepository) => ({
        id: r.id,
        name: r.name,
        fullName: r.fullName || `${r.owner || 'org'}/${r.name}`,
        owner: r.owner || r.ownerName,
        description: r.description,
        defaultBranch: r.defaultBranch || 'main',
        isPrivate: r.isPrivate ?? false,
        language: r.language || 'TypeScript',
        status: r.syncStatus || r.status || 'ACTIVE',
        commitsCount: r.commitsCount || r._count?.commits || 0,
        pullRequestsCount: r.pullRequestsCount || r._count?.pullRequests || 0,
        lastSyncedAt: r.lastSyncedAt || r.syncedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Trigger full repository synchronization pipeline
   */
  async triggerSync(repositoryId: string, workspaceId: string, force = false) {
    const { data } = await api.post(`/repositories/${repositoryId}/sync`, {
      workspaceId,
      force,
    });
    return data;
  },

  /**
   * Get sync status and queue checkpoints
   */
  async getSyncStatus(repositoryId: string, workspaceId: string) {
    const { data } = await api.get(`/repositories/${repositoryId}/sync/status`, {
      params: { workspaceId },
    });
    return data;
  },

  /**
   * Get authenticated GitHub OAuth authorization URL
   */
  async getConnectGithubUrl(workspaceId?: string): Promise<string> {
    const { data } = await api.get<{ authorizationUrl: string }>('/github/connect', {
      params: { workspaceId, returnUrl: true },
    });
    return data.authorizationUrl;
  },
};
