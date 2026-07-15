import { WorkspaceMemberRole } from '@prisma/client';

export enum WorkspacePermission {
  READ_WORKSPACE = 'read_workspace',
  UPDATE_WORKSPACE = 'update_workspace',
  DELETE_WORKSPACE = 'delete_workspace',
  INVITE_MEMBERS = 'invite_members',
  MANAGE_MEMBERS = 'manage_members',
  UPDATE_SETTINGS = 'update_settings',
  TRANSFER_OWNERSHIP = 'transfer_ownership',
  CREATE_REPOSITORIES = 'create_repositories',
}

export const WORKSPACE_ROLE_PERMISSIONS: Record<
  WorkspaceMemberRole,
  ReadonlySet<WorkspacePermission>
> = {
  [WorkspaceMemberRole.OWNER]: new Set([
    WorkspacePermission.READ_WORKSPACE,
    WorkspacePermission.UPDATE_WORKSPACE,
    WorkspacePermission.DELETE_WORKSPACE,
    WorkspacePermission.INVITE_MEMBERS,
    WorkspacePermission.MANAGE_MEMBERS,
    WorkspacePermission.UPDATE_SETTINGS,
    WorkspacePermission.TRANSFER_OWNERSHIP,
    WorkspacePermission.CREATE_REPOSITORIES,
  ]),
  [WorkspaceMemberRole.ADMIN]: new Set([
    WorkspacePermission.READ_WORKSPACE,
    WorkspacePermission.UPDATE_WORKSPACE,
    WorkspacePermission.INVITE_MEMBERS,
    WorkspacePermission.MANAGE_MEMBERS,
    WorkspacePermission.UPDATE_SETTINGS,
    WorkspacePermission.CREATE_REPOSITORIES,
  ]),
  [WorkspaceMemberRole.MEMBER]: new Set([
    WorkspacePermission.READ_WORKSPACE,
    WorkspacePermission.CREATE_REPOSITORIES,
  ]),
  [WorkspaceMemberRole.VIEWER]: new Set([WorkspacePermission.READ_WORKSPACE]),
};

export function roleHasPermission(
  role: WorkspaceMemberRole,
  permission: WorkspacePermission,
): boolean {
  return WORKSPACE_ROLE_PERMISSIONS[role].has(permission);
}
