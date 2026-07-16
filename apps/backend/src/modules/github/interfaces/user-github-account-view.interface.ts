export interface UserGithubAccountView {
  id: string;
  provider: 'GITHUB';
  providerAccountId: string;
  providerUsername: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  profileUrl: string | null;
  connectedAt: Date;
  lastUsedAt: Date | null;
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    connectedAccountId: string;
    status: string;
  }>;
}
