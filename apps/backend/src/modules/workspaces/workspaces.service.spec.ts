import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  WorkspaceMemberRole,
  UserStatus,
  WorkspaceStatus,
} from '@prisma/client';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  const prisma = {
    workspace: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceSettings: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const githubService = {
    linkTokenToWorkspace: jest.fn(),
  };

  let service: WorkspacesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkspacesService(prisma as never, githubService as never);
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );
  });

  it('creates a workspace with owner membership', async () => {
    prisma.workspace.findFirst.mockResolvedValue(null);
    prisma.workspace.findUnique.mockResolvedValue(null);
    prisma.workspace.create.mockResolvedValue({
      id: 'ws-1',
      name: 'Acme',
      slug: 'acme',
      description: null,
      ownerId: 'user-1',
      status: WorkspaceStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        defaultAiProvider: null,
        defaultAiModel: null,
        defaultEmbeddingModel: null,
        autoSyncEnabled: true,
        notificationsEnabled: true,
        preferences: {},
      },
      members: [],
    });

    const result = await service.create('user-1', { name: 'Acme' });

    expect(result.slug).toBe('acme');
    expect(prisma.workspace.create).toHaveBeenCalled();
  });

  it('rejects inviting an existing member', async () => {
    prisma.workspace.findFirst.mockResolvedValue({
      id: 'ws-1',
      ownerId: 'user-1',
      deletedAt: null,
      status: WorkspaceStatus.ACTIVE,
      settings: null,
      members: [],
    });
    prisma.workspaceMember.findUnique
      .mockResolvedValueOnce({
        id: 'member-actor',
        role: WorkspaceMemberRole.OWNER,
      })
      .mockResolvedValueOnce({ id: 'member-2' });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      deletedAt: null,
      status: UserStatus.ACTIVE,
    });

    await expect(
      service.inviteMember('ws-1', 'user-1', {
        email: 'dev@example.com',
        role: WorkspaceMemberRole.MEMBER,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prevents owner from removing themselves', async () => {
    prisma.workspace.findFirst.mockResolvedValue({
      id: 'ws-1',
      ownerId: 'user-1',
      deletedAt: null,
      status: WorkspaceStatus.ACTIVE,
      settings: null,
      members: [],
    });
    prisma.workspaceMember.findUnique.mockResolvedValue({
      id: 'member-1',
      role: WorkspaceMemberRole.ADMIN,
    });
    prisma.workspaceMember.findFirst.mockResolvedValue({
      id: 'member-1',
      userId: 'user-1',
      role: WorkspaceMemberRole.ADMIN,
    });

    await expect(
      service.removeMember('ws-1', 'member-1', 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires owner role to delete workspace', async () => {
    prisma.workspace.findFirst.mockResolvedValue({
      id: 'ws-1',
      ownerId: 'user-2',
      deletedAt: null,
      status: WorkspaceStatus.ACTIVE,
      settings: null,
      members: [],
    });
    prisma.workspaceMember.findUnique.mockResolvedValue({
      id: 'member-1',
      role: WorkspaceMemberRole.ADMIN,
    });

    await expect(service.remove('ws-1', 'user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
