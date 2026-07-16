import { ConnectedAccountStatus } from '@prisma/client';

export interface ConnectedAccountView {
  id: string;
  workspaceId: string;
  provider: 'GITHUB';
  providerAccountId: string;
  providerUsername: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  profileUrl: string | null;
  status: ConnectedAccountStatus;
  connectedAt: Date;
  disconnectedAt: Date | null;
  lastUsedAt: Date | null;
}
