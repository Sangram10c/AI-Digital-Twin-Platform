import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { hasPermission, type AppPermission } from '@/lib/permissions';

export function usePermissions() {
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();

  const can = (permission: AppPermission): boolean => {
    return hasPermission(permission, user, currentWorkspace);
  };

  return {
    can,
    userRole: user?.role,
    workspaceRole: currentWorkspace?.role,
    isAdmin: user?.role === 'ADMIN',
    isOwner: currentWorkspace?.role === 'OWNER',
  };
}
