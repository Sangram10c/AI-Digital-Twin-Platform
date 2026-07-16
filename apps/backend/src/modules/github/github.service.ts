import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedAccount,
  ConnectedAccountStatus,
  GitProviderType,
  OAuthToken,
  ProviderType,
  UserStatus,
  WorkspaceStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GITHUB_AUDIT_ACTIONS } from './constants/github.constants';
import { ConnectedAccountView } from './interfaces/connected-account-view.interface';
import { GitHubProfile } from './interfaces/github-profile.interface';
import { GitHubTokenResponse } from './interfaces/github-token-response.interface';
import { UserGithubAccountView } from './interfaces/user-github-account-view.interface';
import { GithubApiClient } from './services/github-api.client';
import { GithubAuditService } from './services/github-audit.service';
import { GithubOAuthStateService } from './services/github-oauth-state.service';
import { OAuthTokenEncryptionService } from './services/oauth-token-encryption.service';

interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class GithubService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly githubApiClient: GithubApiClient,
    private readonly oauthStateService: GithubOAuthStateService,
    private readonly tokenEncryptionService: OAuthTokenEncryptionService,
    private readonly auditService: GithubAuditService,
  ) {}

  async initiateConnect(
    userId: string,
    workspaceId?: string,
    context: RequestContext = {},
  ): Promise<string> {
    await this.assertActiveUser(userId);

    if (workspaceId) {
      await this.assertWorkspaceMembership(userId, workspaceId);
    }

    const state = this.oauthStateService.createState(userId, workspaceId);

    await this.auditService.log(
      GITHUB_AUDIT_ACTIONS.CONNECT_INITIATED,
      { workspaceId, userId, ...context },
      { provider: GitProviderType.GITHUB, workspaceId: workspaceId ?? null },
    );

    return this.githubApiClient.buildAuthorizationUrl(state);
  }

  async handleCallback(
    code: string | undefined,
    state: string | undefined,
    context: RequestContext = {},
    githubError?: string,
    githubErrorDescription?: string,
  ): Promise<{ redirectUrl: string }> {
    const successRedirect =
      this.configService.get<string>('oauth.github.successRedirectUrl') ??
      'http://localhost:3000';
    const errorRedirect =
      this.configService.get<string>('oauth.github.errorRedirectUrl') ??
      successRedirect;

    try {
      if (githubError) {
        throw new BadRequestException(
          githubErrorDescription ??
            githubError ??
            'GitHub authorization denied',
        );
      }

      if (!code || !state) {
        throw new BadRequestException('Missing OAuth code or state');
      }

      const statePayload = this.oauthStateService.verifyState(state);
      await this.assertActiveUser(statePayload.userId);

      if (statePayload.workspaceId) {
        await this.assertWorkspaceMembership(
          statePayload.userId,
          statePayload.workspaceId,
        );
      }

      const tokenResponse =
        await this.githubApiClient.exchangeCodeForToken(code);
      const profile = await this.githubApiClient.getAuthenticatedUser(
        tokenResponse.access_token,
      );
      const email =
        profile.email ??
        (await this.githubApiClient.getPrimaryEmail(
          tokenResponse.access_token,
        ));

      const oauthToken = await this.persistOAuthToken({
        userId: statePayload.userId,
        profile,
        email,
        tokenResponse,
      });

      let connectedAccount: ConnectedAccount | null = null;
      if (statePayload.workspaceId) {
        connectedAccount = await this.linkTokenToWorkspace(
          statePayload.userId,
          statePayload.workspaceId,
          oauthToken.id,
        );
      }

      await this.auditService.log(
        GITHUB_AUDIT_ACTIONS.CONNECT_COMPLETED,
        {
          workspaceId: statePayload.workspaceId,
          userId: statePayload.userId,
          ...context,
        },
        {
          providerAccountId: profile.id.toString(),
          providerUsername: profile.login,
          oauthTokenId: oauthToken.id,
        },
        connectedAccount?.id,
      );

      const redirectUrl = new URL(successRedirect);
      redirectUrl.searchParams.set('status', 'connected');
      redirectUrl.searchParams.set('githubTokenId', oauthToken.id);
      if (connectedAccount) {
        redirectUrl.searchParams.set('accountId', connectedAccount.id);
        redirectUrl.searchParams.set('workspaceId', statePayload.workspaceId!);
      }

      return { redirectUrl: redirectUrl.toString() };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'GitHub connection failed';

      await this.auditService.log(
        GITHUB_AUDIT_ACTIONS.CONNECT_FAILED,
        context,
        { error: message },
      );

      const redirectUrl = new URL(errorRedirect);
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('message', message);

      return { redirectUrl: redirectUrl.toString() };
    }
  }

  async listUserGithubAccounts(
    userId: string,
  ): Promise<UserGithubAccountView[]> {
    await this.assertActiveUser(userId);

    const tokens = await this.prisma.oAuthToken.findMany({
      where: {
        userId,
        provider: ProviderType.GITHUB,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!tokens.length) {
      return [];
    }

    const providerAccountIds = tokens.map((token) => token.providerAccountId);
    const workspaceLinks = await this.prisma.connectedAccount.findMany({
      where: {
        userId,
        providerAccountId: { in: providerAccountIds },
        gitProvider: { type: GitProviderType.GITHUB },
      },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true, deletedAt: true },
        },
      },
      orderBy: { connectedAt: 'desc' },
    });

    return tokens.map((token) =>
      this.toUserGithubAccountView(token, workspaceLinks),
    );
  }

  async listWorkspaceAccounts(
    userId: string,
    workspaceId: string,
  ): Promise<ConnectedAccountView[]> {
    await this.assertWorkspaceMembership(userId, workspaceId);

    const gitProvider = await this.getGithubProvider();
    const accounts = await this.prisma.connectedAccount.findMany({
      where: {
        workspaceId,
        gitProviderId: gitProvider.id,
      },
      orderBy: { connectedAt: 'desc' },
    });

    return accounts.map((account) => this.toConnectedAccountView(account));
  }

  async linkTokenToWorkspace(
    userId: string,
    workspaceId: string,
    oauthTokenId: string,
  ): Promise<ConnectedAccount> {
    await this.assertActiveUser(userId);
    await this.assertWorkspaceMembership(userId, workspaceId, true);

    const oauthToken = await this.prisma.oAuthToken.findFirst({
      where: {
        id: oauthTokenId,
        userId,
        provider: ProviderType.GITHUB,
      },
    });

    if (!oauthToken) {
      throw new NotFoundException('GitHub account not found for this user');
    }

    const gitProvider = await this.getGithubProvider();
    const providerAccountId = oauthToken.providerAccountId;
    const metadata = (oauthToken.providerMetadata ?? {}) as {
      displayName?: string | null;
      avatarUrl?: string | null;
      email?: string | null;
      htmlUrl?: string | null;
    };

    const existingAccount = await this.prisma.connectedAccount.findUnique({
      where: {
        workspaceId_gitProviderId_providerAccountId: {
          workspaceId,
          gitProviderId: gitProvider.id,
          providerAccountId,
        },
      },
    });

    if (
      existingAccount &&
      existingAccount.status === ConnectedAccountStatus.ACTIVE
    ) {
      throw new ConflictException(
        'This GitHub account is already linked to the workspace',
      );
    }

    if (existingAccount) {
      return this.prisma.connectedAccount.update({
        where: { id: existingAccount.id },
        data: {
          userId,
          oauthTokenId,
          providerUsername: this.resolveGithubUsername(oauthToken),
          providerAccountUrl: metadata.htmlUrl ?? null,
          providerMetadata: oauthToken.providerMetadata ?? undefined,
          status: ConnectedAccountStatus.ACTIVE,
          disconnectedAt: null,
          lastSyncedAt: new Date(),
        },
      });
    }

    return this.prisma.connectedAccount.create({
      data: {
        workspaceId,
        userId,
        gitProviderId: gitProvider.id,
        oauthTokenId,
        providerAccountId,
        providerUsername: this.resolveGithubUsername(oauthToken),
        providerAccountUrl: metadata.htmlUrl ?? null,
        providerMetadata: oauthToken.providerMetadata ?? undefined,
        status: ConnectedAccountStatus.ACTIVE,
        lastSyncedAt: new Date(),
      },
    });
  }

  async disconnectUserGithubAccount(
    userId: string,
    oauthTokenId: string,
    context: RequestContext = {},
  ): Promise<{ message: string }> {
    await this.assertActiveUser(userId);

    const oauthToken = await this.prisma.oAuthToken.findFirst({
      where: {
        id: oauthTokenId,
        userId,
        provider: ProviderType.GITHUB,
      },
    });

    if (!oauthToken) {
      throw new NotFoundException('GitHub account not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.connectedAccount.updateMany({
        where: {
          userId,
          providerAccountId: oauthToken.providerAccountId,
          status: ConnectedAccountStatus.ACTIVE,
        },
        data: {
          status: ConnectedAccountStatus.DISCONNECTED,
          disconnectedAt: new Date(),
        },
      });

      await tx.oAuthToken.delete({ where: { id: oauthToken.id } });
    });

    await this.auditService.log(
      GITHUB_AUDIT_ACTIONS.DISCONNECT,
      { userId, ...context },
      {
        providerAccountId: oauthToken.providerAccountId,
        oauthTokenId,
      },
    );

    return { message: 'GitHub account removed successfully' };
  }

  async disconnectWorkspaceAccount(
    userId: string,
    workspaceId: string,
    accountId: string,
    context: RequestContext = {},
  ): Promise<{ message: string }> {
    await this.assertWorkspaceMembership(userId, workspaceId, true);

    const gitProvider = await this.getGithubProvider();
    const account = await this.prisma.connectedAccount.findFirst({
      where: {
        id: accountId,
        workspaceId,
        gitProviderId: gitProvider.id,
      },
    });

    if (!account) {
      throw new NotFoundException('Connected GitHub account not found');
    }

    if (account.status === ConnectedAccountStatus.DISCONNECTED) {
      throw new BadRequestException('GitHub account is already disconnected');
    }

    await this.prisma.connectedAccount.update({
      where: { id: account.id },
      data: {
        status: ConnectedAccountStatus.DISCONNECTED,
        disconnectedAt: new Date(),
      },
    });

    await this.auditService.log(
      GITHUB_AUDIT_ACTIONS.DISCONNECT,
      { workspaceId, userId, ...context },
      {
        providerAccountId: account.providerAccountId,
        providerUsername: account.providerUsername,
      },
      account.id,
    );

    return { message: 'GitHub account disconnected from workspace' };
  }

  private async persistOAuthToken(input: {
    userId: string;
    profile: GitHubProfile;
    email: string | null;
    tokenResponse: GitHubTokenResponse;
  }): Promise<OAuthToken> {
    const providerAccountId = input.profile.id.toString();
    const scopes = this.parseScopes(input.tokenResponse.scope);
    const accessTokenExpiresAt = input.tokenResponse.expires_in
      ? new Date(Date.now() + input.tokenResponse.expires_in * 1000)
      : null;
    const refreshTokenExpiresAt = input.tokenResponse.refresh_token_expires_in
      ? new Date(
          Date.now() + input.tokenResponse.refresh_token_expires_in * 1000,
        )
      : null;

    const providerMetadata = {
      displayName: input.profile.name,
      avatarUrl: input.profile.avatarUrl,
      email: input.email,
      htmlUrl: input.profile.htmlUrl,
      providerUsername: input.profile.login,
    };

    const existingForProvider = await this.prisma.oAuthToken.findUnique({
      where: {
        provider_providerAccountId: {
          provider: ProviderType.GITHUB,
          providerAccountId,
        },
      },
    });

    if (existingForProvider && existingForProvider.userId !== input.userId) {
      throw new ConflictException(
        'This GitHub account is already linked to another platform user',
      );
    }

    const encryptedAccessToken = this.tokenEncryptionService.encrypt(
      input.tokenResponse.access_token,
    );
    const encryptedRefreshToken = input.tokenResponse.refresh_token
      ? this.tokenEncryptionService.encrypt(input.tokenResponse.refresh_token)
      : null;

    return this.prisma.oAuthToken.upsert({
      where: {
        userId_provider_providerAccountId: {
          userId: input.userId,
          provider: ProviderType.GITHUB,
          providerAccountId,
        },
      },
      create: {
        userId: input.userId,
        provider: ProviderType.GITHUB,
        providerAccountId,
        accessTokenEncrypted: encryptedAccessToken,
        refreshTokenEncrypted: encryptedRefreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        tokenType: input.tokenResponse.token_type ?? 'Bearer',
        scopes,
        providerMetadata,
      },
      update: {
        accessTokenEncrypted: encryptedAccessToken,
        refreshTokenEncrypted: encryptedRefreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        tokenType: input.tokenResponse.token_type ?? 'Bearer',
        scopes,
        providerMetadata,
      },
    });
  }

  private resolveGithubUsername(oauthToken: OAuthToken): string {
    const metadata = (oauthToken.providerMetadata ?? {}) as {
      providerUsername?: string;
      htmlUrl?: string;
    };

    if (metadata.providerUsername) {
      return metadata.providerUsername;
    }

    if (metadata.htmlUrl) {
      const segments = metadata.htmlUrl.replace(/\/$/, '').split('/');
      const username = segments[segments.length - 1];
      if (username) {
        return username;
      }
    }

    return oauthToken.providerAccountId;
  }

  private async getGithubProvider() {
    const provider = await this.prisma.gitProvider.findUnique({
      where: { type: GitProviderType.GITHUB },
    });

    if (!provider || !provider.isEnabled) {
      throw new BadRequestException('GitHub provider is not available');
    }

    return provider;
  }

  private async assertActiveUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, deletedAt: true },
    });

    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User account is not active');
    }
  }

  private async assertWorkspaceMembership(
    userId: string,
    workspaceId: string,
    requireManagePermission = false,
  ): Promise<void> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        deletedAt: null,
        status: { not: WorkspaceStatus.DELETED },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (requireManagePermission) {
      const allowedRoles = ['OWNER', 'ADMIN', 'MEMBER'];
      if (!allowedRoles.includes(membership.role)) {
        throw new ForbiddenException('Insufficient workspace permissions');
      }
    }
  }

  private parseScopes(scopeHeader?: string): string[] {
    if (!scopeHeader) {
      return this.configService.get<string[]>('oauth.github.scopes') ?? [];
    }

    return scopeHeader
      .split(/[\s,]+/)
      .map((scope) => scope.trim())
      .filter(Boolean);
  }

  private toUserGithubAccountView(
    token: OAuthToken,
    workspaceLinks: Array<
      ConnectedAccount & {
        workspace: {
          id: string;
          name: string;
          slug: string;
          deletedAt: Date | null;
        };
      }
    >,
  ): UserGithubAccountView {
    const metadata = (token.providerMetadata ?? {}) as {
      displayName?: string | null;
      avatarUrl?: string | null;
      email?: string | null;
      htmlUrl?: string | null;
      providerUsername?: string;
    };

    const links = workspaceLinks.filter(
      (link) =>
        link.providerAccountId === token.providerAccountId &&
        !link.workspace.deletedAt,
    );

    return {
      id: token.id,
      provider: 'GITHUB',
      providerAccountId: token.providerAccountId,
      providerUsername: metadata.providerUsername ?? token.providerAccountId,
      displayName: metadata.displayName ?? null,
      avatarUrl: metadata.avatarUrl ?? null,
      email: metadata.email ?? null,
      profileUrl: metadata.htmlUrl ?? null,
      connectedAt: token.createdAt,
      lastUsedAt: token.updatedAt,
      workspaces: links.map((link) => ({
        id: link.workspace.id,
        name: link.workspace.name,
        slug: link.workspace.slug,
        connectedAccountId: link.id,
        status: link.status,
      })),
    };
  }

  private toConnectedAccountView(
    account: ConnectedAccount,
  ): ConnectedAccountView {
    const metadata = (account.providerMetadata ?? {}) as {
      displayName?: string | null;
      avatarUrl?: string | null;
      email?: string | null;
    };

    return {
      id: account.id,
      workspaceId: account.workspaceId,
      provider: 'GITHUB',
      providerAccountId: account.providerAccountId,
      providerUsername: account.providerUsername,
      displayName: metadata.displayName ?? null,
      avatarUrl: metadata.avatarUrl ?? null,
      email: metadata.email ?? null,
      profileUrl: account.providerAccountUrl,
      status: account.status,
      connectedAt: account.connectedAt,
      disconnectedAt: account.disconnectedAt,
      lastUsedAt: account.lastSyncedAt,
    };
  }
}
