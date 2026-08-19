import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole, WorkspaceStatus } from '@prisma/client';
import { AnalyticsPermissionService } from './analytics-permission.service';

describe('AnalyticsPermissionService', () => {
  let service: AnalyticsPermissionService;
  const prisma = {
    workspace: {
      findFirst: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
    },
    repository: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsPermissionService(prisma as never);
  });

  describe('validateWorkspaceAccess', () => {
    it('allows access if user is platform ADMIN and workspace exists', async () => {
      prisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1' });

      await expect(
        service.validateWorkspaceAccess('admin-1', 'ws-1', UserRole.ADMIN),
      ).resolves.not.toThrow();

      expect(prisma.workspace.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'ws-1',
          deletedAt: null,
          status: { not: WorkspaceStatus.DELETED },
        },
        select: { id: true },
      });
    });

    it('throws NotFoundException if admin requests non-existent workspace', async () => {
      prisma.workspace.findFirst.mockResolvedValue(null);

      await expect(
        service.validateWorkspaceAccess('admin-1', 'ws-404', UserRole.ADMIN),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('allows access if user is active workspace member', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'member-1',
        workspace: {
          id: 'ws-1',
          status: WorkspaceStatus.ACTIVE,
          deletedAt: null,
        },
      });

      await expect(
        service.validateWorkspaceAccess('user-1', 'ws-1', UserRole.USER),
      ).resolves.not.toThrow();
    });

    it('throws ForbiddenException if user is NOT a member of the workspace (IDOR protection)', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        service.validateWorkspaceAccess(
          'attacker-user',
          'ws-victim',
          UserRole.USER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws ForbiddenException if workspace is deleted', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'member-1',
        workspace: {
          id: 'ws-1',
          status: WorkspaceStatus.DELETED,
          deletedAt: new Date(),
        },
      });

      await expect(
        service.validateWorkspaceAccess('user-1', 'ws-1', UserRole.USER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('validateRepositoryScope', () => {
    it('passes if no repositoryId is provided', async () => {
      await expect(
        service.validateRepositoryScope('ws-1', undefined),
      ).resolves.not.toThrow();
    });

    it('passes if repository belongs to workspace and is not deleted', async () => {
      prisma.repository.findFirst.mockResolvedValue({ id: 'repo-1' });

      await expect(
        service.validateRepositoryScope('ws-1', 'repo-1'),
      ).resolves.not.toThrow();

      expect(prisma.repository.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'repo-1',
          workspaceId: 'ws-1',
          deletedAt: null,
        },
        select: { id: true },
      });
    });

    it('throws NotFoundException if repository belongs to different workspace (Cross-workspace isolation)', async () => {
      prisma.repository.findFirst.mockResolvedValue(null);

      await expect(
        service.validateRepositoryScope('ws-1', 'repo-cross-ws'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
