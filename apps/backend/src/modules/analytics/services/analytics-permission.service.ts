import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, WorkspaceStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AnalyticsPermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates that the user has authorization to access analytics for the specified workspace.
   * Throws ForbiddenException or NotFoundException if authorization fails.
   */
  async validateWorkspaceAccess(
    userId: string,
    workspaceId: string,
    userRole?: UserRole,
  ): Promise<void> {
    if (!userId || !workspaceId) {
      throw new ForbiddenException('Workspace and user context are required');
    }

    // Platform ADMIN has global read access
    if (userRole === UserRole.ADMIN) {
      const workspaceExists = await this.prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          deletedAt: null,
          status: { not: WorkspaceStatus.DELETED },
        },
        select: { id: true },
      });

      if (!workspaceExists) {
        throw new NotFoundException('Workspace not found');
      }
      return;
    }

    // Check workspace active state and user membership
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        workspace: {
          select: {
            id: true,
            status: true,
            deletedAt: true,
          },
        },
      },
    });

    if (
      !membership ||
      !membership.workspace ||
      membership.workspace.deletedAt !== null ||
      membership.workspace.status === WorkspaceStatus.DELETED
    ) {
      throw new ForbiddenException(
        'You do not have permission to view analytics for this workspace',
      );
    }
  }

  /**
   * Validates that the optional repository belongs to the specified workspace and is not deleted.
   */
  async validateRepositoryScope(
    workspaceId: string,
    repositoryId?: string,
  ): Promise<void> {
    if (!repositoryId) return;

    const repository = await this.prisma.repository.findFirst({
      where: {
        id: repositoryId,
        workspaceId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!repository) {
      throw new NotFoundException(
        'Repository not found or does not belong to this workspace',
      );
    }
  }
}
