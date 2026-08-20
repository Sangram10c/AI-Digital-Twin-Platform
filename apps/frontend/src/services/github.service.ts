/**
 * GitHub Integration Service
 * Connects to NestJS GitHub module under `/api/v1/github/*`
 */
import { api } from './api.service';

export interface ConnectedGithubAccount {
  id: string;
  workspaceId: string;
  providerAccountId: string;
  providerUsername?: string;
  providerAccountUrl?: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'DISCONNECTED';
  connectedAt?: string;
  lastSyncedAt?: string;
  providerMetadata?: {
    displayName?: string;
    avatarUrl?: string;
    email?: string;
    htmlUrl?: string;
  };
}

export interface UserGithubAccount {
  id: string;
  providerAccountId: string;
  providerUsername?: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  scopes: string[];
  createdAt: string;
  updatedAt: string;
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface AvailableGithubRepository {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  avatarUrl?: string;
  isPrivate: boolean;
  isFork: boolean;
  description?: string | null;
  defaultBranch: string;
  language?: string | null;
  starsCount: number;
  url?: string;
  htmlUrl?: string;
  updatedAt?: string;
  isImported: boolean;
  workspaceRepositoryId?: string;
}

export interface ImportGithubRepositoryPayload {
  workspaceId: string;
  providerRepositoryId: string;
  name: string;
  fullName: string;
  description?: string | null;
  defaultBranch?: string;
  isPrivate?: boolean;
  language?: string | null;
  url?: string;
}

export const githubService = {
  /**
   * List GitHub accounts linked to the active workspace
   */
  async listWorkspaceAccounts(workspaceId: string): Promise<ConnectedGithubAccount[]> {
    try {
      const { data } = await api.get<
        { data?: ConnectedGithubAccount[] } | ConnectedGithubAccount[]
      >('/github/account', {
        params: { workspaceId },
      });
      const list: ConnectedGithubAccount[] = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray(data.data)
          ? data.data
          : [];
      return list;
    } catch {
      return [];
    }
  },

  /**
   * List all GitHub accounts connected by the authenticated user
   */
  async listUserAccounts(): Promise<UserGithubAccount[]> {
    try {
      const { data } = await api.get<{ data?: UserGithubAccount[] } | UserGithubAccount[]>(
        '/github/accounts',
      );
      const list: UserGithubAccount[] = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray(data.data)
          ? data.data
          : [];
      return list;
    } catch {
      return [];
    }
  },

  /**
   * List remote GitHub repositories from the user's connected GitHub account
   */
  async listAvailableRepositories(workspaceId: string): Promise<AvailableGithubRepository[]> {
    try {
      const { data } = await api.get<
        { data?: AvailableGithubRepository[] } | AvailableGithubRepository[]
      >('/github/repositories', {
        params: { workspaceId },
      });
      const list: AvailableGithubRepository[] = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray(data.data)
          ? data.data
          : [];
      return list;
    } catch {
      return [];
    }
  },

  /**
   * Import and link a selected GitHub repository into the workspace
   */
  async importRepository(payload: ImportGithubRepositoryPayload) {
    const { data } = await api.post('/github/repositories/import', payload);
    return data;
  },

  /**
   * Disconnect a GitHub account from a workspace
   */
  async disconnectFromWorkspace(workspaceId: string, accountId: string) {
    const { data } = await api.delete('/github/disconnect', {
      params: { workspaceId, accountId },
    });
    return data;
  },

  /**
   * Remove a GitHub account token from the user profile
   */
  async removeUserAccount(oauthTokenId: string) {
    const { data } = await api.delete(`/github/accounts/${oauthTokenId}`);
    return data;
  },
};
