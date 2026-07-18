import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  roleHasPermission,
  WorkspacePermission,
} from '../../workspaces/constants/workspace-permissions.constants';
import { WORKSPACE_PERMISSIONS_KEY } from '../../workspaces/decorators/require-workspace-permission.decorator';

@Injectable()
export class GithubWorkspaceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      WorkspacePermission[]
    >(WORKSPACE_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { id: string };
      query?: { workspaceId?: string };
      body?: { workspaceId?: string };
    }>();

    const userId = request.user?.id;
    // Prefer query (GET/list), fall back to body (POST process endpoints).
    const workspaceId = request.query?.workspaceId ?? request.body?.workspaceId;

    if (!userId || !workspaceId) {
      throw new ForbiddenException('Workspace access denied');
    }

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

    const hasAllPermissions = requiredPermissions.every((permission) =>
      roleHasPermission(membership.role, permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient workspace permissions');
    }

    return true;
  }
}
