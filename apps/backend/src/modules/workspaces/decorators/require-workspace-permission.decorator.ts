import { SetMetadata } from '@nestjs/common';
import { WorkspacePermission } from '../constants/workspace-permissions.constants';

export const WORKSPACE_PERMISSIONS_KEY = 'workspace_permissions';

export const RequireWorkspacePermission = (
  ...permissions: WorkspacePermission[]
) => SetMetadata(WORKSPACE_PERMISSIONS_KEY, permissions);
