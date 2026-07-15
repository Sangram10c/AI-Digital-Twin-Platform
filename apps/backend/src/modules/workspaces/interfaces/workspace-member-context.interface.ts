import { WorkspaceMember, WorkspaceMemberRole } from '@prisma/client';

export interface WorkspaceMemberContext extends WorkspaceMember {
  workspaceId: string;
  role: WorkspaceMemberRole;
}
