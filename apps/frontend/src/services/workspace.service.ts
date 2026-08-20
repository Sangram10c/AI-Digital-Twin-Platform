/**
 * Workspace Service
 * Connects directly to NestJS Workspaces module under `/api/v1/workspaces/*`
 */
import { api } from './api.service';
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSettings,
  WorkspacePreferences,
} from '@/types/workspace.types';

export interface CreateWorkspacePayload {
  name: string;
  slug?: string;
  description?: string;
  githubTokenId?: string;
}

export interface UpdateWorkspacePayload {
  name?: string;
  description?: string;
}

export interface InviteMemberPayload {
  email: string;
  role: WorkspaceRole;
}

export interface UpdateWorkspaceSettingsPayload {
  defaultAiProvider?: string;
  defaultAiModel?: string;
  defaultEmbeddingModel?: string;
  autoSyncEnabled?: boolean;
  notificationsEnabled?: boolean;
  preferences?: WorkspacePreferences;
}

export const workspaceService = {
  /**
   * List all workspaces accessible by the authenticated user
   */
  async getWorkspaces(): Promise<Workspace[]> {
    const { data } = await api.get<Workspace[]>('/workspaces');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get single workspace by ID
   */
  async getWorkspaceById(id: string): Promise<Workspace> {
    const { data } = await api.get<Workspace>(`/workspaces/${id}`);
    return data;
  },

  /**
   * Create a new workspace
   */
  async createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
    const { data } = await api.post<Workspace>('/workspaces', payload);
    return data;
  },

  /**
   * Update workspace details (name, description)
   */
  async updateWorkspace(id: string, payload: UpdateWorkspacePayload): Promise<Workspace> {
    const { data } = await api.patch<Workspace>(`/workspaces/${id}`, payload);
    return data;
  },

  /**
   * Delete workspace (owner only)
   */
  async deleteWorkspace(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/workspaces/${id}`);
    return data;
  },

  /**
   * List workspace members
   */
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data } = await api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Invite a new member to the workspace
   */
  async inviteMember(workspaceId: string, payload: InviteMemberPayload): Promise<WorkspaceMember> {
    const { data } = await api.post<WorkspaceMember>(`/workspaces/${workspaceId}/invite`, payload);
    return data;
  },

  /**
   * Update member role (OWNER or ADMIN only)
   */
  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceMember> {
    const { data } = await api.patch<WorkspaceMember>(
      `/workspaces/${workspaceId}/members/${memberId}`,
      { role },
    );
    return data;
  },

  /**
   * Remove member from workspace (OWNER or ADMIN only)
   */
  async removeMember(workspaceId: string, memberId: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(
      `/workspaces/${workspaceId}/members/${memberId}`,
    );
    return data;
  },

  /**
   * Update workspace settings & AI preferences
   */
  async updateSettings(
    workspaceId: string,
    payload: UpdateWorkspaceSettingsPayload,
  ): Promise<WorkspaceSettings> {
    const { data } = await api.patch<WorkspaceSettings>(
      `/workspaces/${workspaceId}/settings`,
      payload,
    );
    return data;
  },

  /**
   * Transfer workspace ownership (owner only)
   */
  async transferOwnership(workspaceId: string, newOwnerId: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      `/workspaces/${workspaceId}/transfer-owner`,
      { newOwnerId },
    );
    return data;
  },
};
