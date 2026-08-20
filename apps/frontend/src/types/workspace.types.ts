/**
 * Workspace Types & Role Enums
 * Mapped directly to backend Prisma schema.
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

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  user?: {
    id: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId?: string;
  status?: WorkspaceStatus;
  role?: WorkspaceRole | string;
  createdAt?: string;
  updatedAt?: string;
}
