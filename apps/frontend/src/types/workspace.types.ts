/**
 * Workspace Types & Role Enums
 * Mapped directly to backend Prisma schema & NestJS Workspace DTOs.
 */

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum WorkspaceStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export interface WorkspacePreferences {
  defaultBranch?: string;
  visibility?: 'private' | 'internal' | 'public';
  timezone?: string;
  language?: string;
}

export interface WorkspaceSettings {
  defaultAiProvider?: string | null;
  defaultAiModel?: string | null;
  defaultEmbeddingModel?: string | null;
  autoSyncEnabled: boolean;
  notificationsEnabled: boolean;
  preferences?: WorkspacePreferences | null;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  email: string;
  displayName?: string | null;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  ownerId?: string;
  status?: WorkspaceStatus;
  role?: WorkspaceRole | string;
  settings?: WorkspaceSettings;
  createdAt?: string;
  updatedAt?: string;
}
