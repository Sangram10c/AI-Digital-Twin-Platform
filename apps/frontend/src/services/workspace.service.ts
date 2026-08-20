/**
 * Workspace Service
 * Connects to NestJS Workspaces module at /api/v1/workspaces/*
 */
import { api } from './api.service';
import type { Workspace } from '@/types/workspace.types';

export interface CreateWorkspacePayload {
  name: string;
  slug?: string;
  description?: string;
  githubTokenId?: string;
}

export const workspaceService = {
  async getWorkspaces(): Promise<Workspace[]> {
    const { data } = await api.get<Workspace[]>('/workspaces');
    return data;
  },

  async getWorkspaceById(id: string): Promise<Workspace> {
    const { data } = await api.get<Workspace>(`/workspaces/${id}`);
    return data;
  },

  async createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
    const { data } = await api.post<Workspace>('/workspaces', payload);
    return data;
  },
};
