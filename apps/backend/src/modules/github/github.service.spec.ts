import { ForbiddenException } from '@nestjs/common';
import {
  ConnectedAccountStatus,
  GitProviderType,
  UserStatus,
  WorkspaceMemberRole,
} from '@prisma/client';
import { encryptSecret, decryptSecret } from './utils/token-encryption.util';
import { GithubOAuthStateService } from './services/github-oauth-state.service';
import { GithubService } from './github.service';

describe('GithubOAuthStateService', () => {
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'oauth.github.stateTtlSeconds') return 600;
      if (key === 'oauth.tokenEncryptionKey')
        return 'test-encryption-key-32-characters!!';
      return undefined;
    }),
  };

  let service: GithubOAuthStateService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GithubOAuthStateService(configService as never);
  });

  it('creates and verifies user-level OAuth state without workspace', () => {
    const state = service.createState('user-1');
    const payload = service.verifyState(state);

    expect(payload.userId).toBe('user-1');
    expect(payload.workspaceId).toBeUndefined();
  });

  it('rejects tampered state signatures', () => {
    const state = service.createState('user-1');
    expect(() => service.verifyState(`${state}x`)).toThrow(
      'Invalid OAuth state signature',
    );
  });
});

describe('GithubService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    workspace: { findFirst: jest.fn() },
    workspaceMember: { findUnique: jest.fn() },
    gitProvider: { findUnique: jest.fn() },
    connectedAccount: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    oAuthToken: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, unknown> = {
        'oauth.github.successRedirectUrl': 'http://localhost:3000/success',
        'oauth.github.errorRedirectUrl': 'http://localhost:3000/error',
        'oauth.github.scopes': ['read:user', 'user:email'],
      };
      return values[key];
    }),
  };

  const githubApiClient = {
    buildAuthorizationUrl: jest.fn(),
    exchangeCodeForToken: jest.fn(),
    getAuthenticatedUser: jest.fn(),
    getPrimaryEmail: jest.fn(),
  };

  const oauthStateService = {
    createState: jest.fn(),
    verifyState: jest.fn(),
  };

  const tokenEncryptionService = {
    encrypt: jest.fn((value: string) => encryptSecret(value, 'test-key')),
    decrypt: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  let service: GithubService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GithubService(
      prisma as never,
      configService as never,
      githubApiClient as never,
      oauthStateService as never,
      tokenEncryptionService as never,
      auditService as never,
    );

    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );
    prisma.auditLog.create.mockResolvedValue({});
    prisma.user.findUnique.mockResolvedValue({
      status: UserStatus.ACTIVE,
      deletedAt: null,
    });
    prisma.workspace.findFirst.mockResolvedValue({ id: 'workspace-1' });
    prisma.workspaceMember.findUnique.mockResolvedValue({
      role: WorkspaceMemberRole.OWNER,
    });
    prisma.gitProvider.findUnique.mockResolvedValue({
      id: 'provider-1',
      type: GitProviderType.GITHUB,
      isEnabled: true,
    });
  });

  it('initiates user-level connect without workspace membership check', async () => {
    oauthStateService.createState.mockReturnValue('signed-state');
    githubApiClient.buildAuthorizationUrl.mockReturnValue(
      'https://github.com/login/oauth/authorize?state=signed-state',
    );

    const url = await service.initiateConnect('user-1');

    expect(url).toContain('github.com');
    expect(oauthStateService.createState).toHaveBeenCalledWith(
      'user-1',
      undefined,
    );
    expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled();
  });

  it('rejects inactive users during connect', async () => {
    prisma.user.findUnique.mockResolvedValue({
      status: UserStatus.SUSPENDED,
      deletedAt: null,
    });

    await expect(service.initiateConnect('user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('stores OAuth token on callback without creating a workspace link', async () => {
    oauthStateService.verifyState.mockReturnValue({ userId: 'user-1' });
    githubApiClient.exchangeCodeForToken.mockResolvedValue({
      access_token: 'gho_token',
      scope: 'read:user user:email',
    });
    githubApiClient.getAuthenticatedUser.mockResolvedValue({
      id: 42,
      login: 'octocat',
      name: 'Octocat',
      avatarUrl: null,
      htmlUrl: 'https://github.com/octocat',
      email: null,
    });
    githubApiClient.getPrimaryEmail.mockResolvedValue('octocat@github.com');
    prisma.oAuthToken.findUnique.mockResolvedValue(null);
    prisma.oAuthToken.upsert.mockResolvedValue({
      id: 'token-1',
      providerAccountId: '42',
    });

    const result = await service.handleCallback('code', 'state');

    expect(result.redirectUrl).toContain('status=connected');
    expect(result.redirectUrl).toContain('githubTokenId=token-1');
    expect(prisma.oAuthToken.upsert).toHaveBeenCalled();
    expect(prisma.connectedAccount.create).not.toHaveBeenCalled();
  });

  it('disconnects a workspace account without deleting the OAuth token', async () => {
    prisma.connectedAccount.findFirst.mockResolvedValue({
      id: 'account-1',
      providerAccountId: '42',
      providerUsername: 'octocat',
      status: ConnectedAccountStatus.ACTIVE,
    });
    prisma.connectedAccount.update.mockResolvedValue({});

    const result = await service.disconnectWorkspaceAccount(
      'user-1',
      'workspace-1',
      'account-1',
    );

    expect(result.message).toContain('workspace');
    expect(prisma.oAuthToken.delete).not.toHaveBeenCalled();
  });
});

describe('token encryption util', () => {
  it('encrypts and decrypts secrets', () => {
    const key = 'test-encryption-key-32-characters!!';
    const encrypted = encryptSecret('super-secret-token', key);
    expect(decryptSecret(encrypted, key)).toBe('super-secret-token');
  });
});
