import { UserRole, type User } from '@/types/user.types';
import { WorkspaceRole, type Workspace } from '@/types/workspace.types';

export type AppPermission =
  | 'repository.read'
  | 'repository.write'
  | 'search.use'
  | 'chat.use'
  | 'analytics.read'
  | 'workspace.manage'
  | 'members.read'
  | 'members.manage'
  | 'settings.manage'
  | 'users.manage'
  | 'audit.read';

/**
 * Platform Role Permissions Matrix
 */
const PLATFORM_ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  [UserRole.ADMIN]: [
    'repository.read',
    'repository.write',
    'search.use',
    'chat.use',
    'analytics.read',
    'workspace.manage',
    'members.read',
    'members.manage',
    'settings.manage',
    'users.manage',
    'audit.read',
  ],
  [UserRole.USER]: ['repository.read', 'search.use', 'chat.use', 'analytics.read', 'members.read'],
  [UserRole.VIEWER]: ['repository.read', 'search.use'],
};

/**
 * Workspace Role Permissions Matrix (mapped to backend WorkspacePermission constants)
 */
const WORKSPACE_ROLE_PERMISSIONS: Record<WorkspaceRole, AppPermission[]> = {
  [WorkspaceRole.OWNER]: [
    'repository.read',
    'repository.write',
    'search.use',
    'chat.use',
    'analytics.read',
    'workspace.manage',
    'members.read',
    'members.manage',
    'settings.manage',
  ],
  [WorkspaceRole.ADMIN]: [
    'repository.read',
    'repository.write',
    'search.use',
    'chat.use',
    'analytics.read',
    'workspace.manage',
    'members.read',
    'members.manage',
    'settings.manage',
  ],
  [WorkspaceRole.MEMBER]: [
    'repository.read',
    'search.use',
    'chat.use',
    'analytics.read',
    'members.read',
  ],
  [WorkspaceRole.VIEWER]: ['repository.read', 'search.use'],
};

/**
 * Evaluate if a user has a specific permission based on platform role and workspace role
 */
export function hasPermission(
  permission: AppPermission,
  user: User | null,
  workspace?: Workspace | null,
): boolean {
  if (!user) return false;

  // Platform ADMIN has global override access
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  // Check workspace-scoped permissions if workspace is provided
  if (workspace && workspace.role) {
    const wsRole = workspace.role as WorkspaceRole;
    const wsPermissions = WORKSPACE_ROLE_PERMISSIONS[wsRole] || [];
    if (wsPermissions.includes(permission)) {
      return true;
    }
  }

  // Fallback to platform user role permissions
  const platformPermissions = PLATFORM_ROLE_PERMISSIONS[user.role] || [];
  return platformPermissions.includes(permission);
}
