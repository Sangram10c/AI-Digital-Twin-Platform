import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  UserStatus,
  WorkspaceMemberRole,
  WorkspaceStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateWorkspaceDto,
  InviteMemberDto,
  TransferOwnershipDto,
  UpdateMemberRoleDto,
  UpdateWorkspaceDto,
  UpdateWorkspaceSettingsDto,
} from './dto';
import { appendSlugSuffix, slugifyWorkspaceName } from './utils/slug.util';

const workspaceInclude = {
  settings: true,
  members: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
          status: true,
          deletedAt: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' as const },
  },
} satisfies Prisma.WorkspaceInclude;

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    await this.assertUniqueWorkspaceName(dto.name);

    const slug = await this.resolveUniqueSlug(
      dto.slug ?? slugifyWorkspaceName(dto.name),
    );

    const workspace = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workspace.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim(),
          ownerId: userId,
          status: WorkspaceStatus.ACTIVE,
          settings: {
            create: {
              autoSyncEnabled: true,
              notificationsEnabled: true,
              preferences: {
                defaultBranch: 'main',
                visibility: 'private',
                timezone: 'UTC',
                language: 'en',
              },
            },
          },
          members: {
            create: {
              userId,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
        include: workspaceInclude,
      });

      return created;
    });

    return this.toWorkspaceResponse(workspace);
  }

  async findAllForUser(userId: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        deletedAt: null,
        status: { not: WorkspaceStatus.DELETED },
        members: { some: { userId } },
      },
      include: workspaceInclude,
      orderBy: { createdAt: 'desc' },
    });

    return workspaces.map((workspace) => this.toWorkspaceResponse(workspace));
  }

  async findOne(workspaceId: string, userId: string) {
    const workspace = await this.getActiveWorkspace(workspaceId);
    await this.assertMembership(workspaceId, userId);
    return this.toWorkspaceResponse(workspace);
  }

  async update(workspaceId: string, userId: string, dto: UpdateWorkspaceDto) {
    await this.getActiveWorkspace(workspaceId);
    await this.assertMembership(workspaceId, userId);

    if (dto.name) {
      await this.assertUniqueWorkspaceName(dto.name, workspaceId);
    }

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        status: dto.status,
      },
      include: workspaceInclude,
    });

    return this.toWorkspaceResponse(workspace);
  }

  async remove(workspaceId: string, userId: string) {
    await this.getActiveWorkspace(workspaceId);
    const membership = await this.getMembership(workspaceId, userId);

    if (membership.role !== WorkspaceMemberRole.OWNER) {
      throw new ForbiddenException('Only the workspace owner can delete it');
    }

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        deletedAt: new Date(),
        status: WorkspaceStatus.DELETED,
      },
    });

    return { message: 'Workspace deleted successfully' };
  }

  async inviteMember(
    workspaceId: string,
    actorUserId: string,
    dto: InviteMemberDto,
  ) {
    if (dto.role === WorkspaceMemberRole.OWNER) {
      throw new BadRequestException(
        'Use transfer ownership to assign a new owner',
      );
    }

    await this.getActiveWorkspace(workspaceId);
    await this.assertMembership(workspaceId, actorUserId);

    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.deletedAt || user.status === UserStatus.DELETED) {
      throw new NotFoundException('User not found for invitation');
    }

    if (
      user.status === UserStatus.INACTIVE ||
      user.status === UserStatus.SUSPENDED
    ) {
      throw new BadRequestException('Cannot invite an inactive user');
    }

    const existing = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: user.id },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a workspace member');
    }

    const member = await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.toMemberResponse(member);
  }

  async listMembers(workspaceId: string, userId: string) {
    await this.getActiveWorkspace(workspaceId);
    await this.assertMembership(workspaceId, userId);

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((member) => this.toMemberResponse(member));
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    actorUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    if (dto.role === WorkspaceMemberRole.OWNER) {
      throw new BadRequestException(
        'Use transfer ownership to assign a new owner',
      );
    }

    await this.getActiveWorkspace(workspaceId);
    await this.assertMembership(workspaceId, actorUserId);

    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    if (member.role === WorkspaceMemberRole.OWNER) {
      throw new BadRequestException('Cannot change the owner role directly');
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.toMemberResponse(updated);
  }

  async removeMember(
    workspaceId: string,
    memberId: string,
    actorUserId: string,
  ) {
    const workspace = await this.getActiveWorkspace(workspaceId);
    await this.assertMembership(workspaceId, actorUserId);

    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    if (member.role === WorkspaceMemberRole.OWNER) {
      throw new BadRequestException(
        'Cannot remove the workspace owner. Transfer ownership first.',
      );
    }

    if (member.userId === actorUserId) {
      throw new BadRequestException(
        'You cannot remove yourself from the workspace',
      );
    }

    if (member.userId === workspace.ownerId) {
      throw new BadRequestException('Cannot remove the workspace owner');
    }

    await this.prisma.workspaceMember.delete({ where: { id: memberId } });

    return { message: 'Member removed successfully' };
  }

  async updateSettings(
    workspaceId: string,
    userId: string,
    dto: UpdateWorkspaceSettingsDto,
  ) {
    await this.getActiveWorkspace(workspaceId);
    await this.assertMembership(workspaceId, userId);

    const existing = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (!existing) {
      throw new NotFoundException('Workspace settings not found');
    }

    const mergedPreferences = {
      ...((existing.preferences as Record<string, unknown> | null) ?? {}),
      ...(dto.preferences ?? {}),
    };

    const settings = await this.prisma.workspaceSettings.update({
      where: { workspaceId },
      data: {
        defaultAiProvider: dto.defaultAiProvider,
        defaultAiModel: dto.defaultAiModel,
        defaultEmbeddingModel: dto.defaultEmbeddingModel,
        autoSyncEnabled: dto.autoSyncEnabled,
        notificationsEnabled: dto.notificationsEnabled,
        preferences: mergedPreferences,
      },
    });

    return this.toSettingsResponse(settings);
  }

  async transferOwnership(
    workspaceId: string,
    actorUserId: string,
    dto: TransferOwnershipDto,
  ) {
    const workspace = await this.getActiveWorkspace(workspaceId);
    const actorMembership = await this.getMembership(workspaceId, actorUserId);

    if (
      workspace.ownerId !== actorUserId &&
      actorMembership.role !== WorkspaceMemberRole.OWNER
    ) {
      throw new ForbiddenException(
        'Only the workspace owner can transfer ownership',
      );
    }

    if (dto.newOwnerId === actorUserId) {
      throw new BadRequestException('You are already the workspace owner');
    }

    const newOwner = await this.prisma.user.findUnique({
      where: { id: dto.newOwnerId },
    });

    this.assertActiveUser(newOwner);

    const newOwnerMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: dto.newOwnerId,
        },
      },
    });

    if (!newOwnerMembership) {
      throw new BadRequestException(
        'New owner must already be a member of the workspace',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workspace.update({
        where: { id: workspaceId },
        data: { ownerId: dto.newOwnerId },
      });

      await tx.workspaceMember.update({
        where: { id: newOwnerMembership.id },
        data: { role: WorkspaceMemberRole.OWNER },
      });

      const previousOwnerMembership = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: actorUserId,
          },
        },
      });

      if (
        previousOwnerMembership &&
        previousOwnerMembership.id !== newOwnerMembership.id
      ) {
        await tx.workspaceMember.update({
          where: { id: previousOwnerMembership.id },
          data: { role: WorkspaceMemberRole.ADMIN },
        });
      }
    });

    return { message: 'Workspace ownership transferred successfully' };
  }

  private async getActiveWorkspace(workspaceId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        deletedAt: null,
        status: { not: WorkspaceStatus.DELETED },
      },
      include: workspaceInclude,
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  private async getMembership(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return membership;
  }

  private async assertMembership(workspaceId: string, userId: string) {
    await this.getMembership(workspaceId, userId);
  }

  private async assertUniqueWorkspaceName(name: string, excludeId?: string) {
    const existing = await this.prisma.workspace.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        deletedAt: null,
        status: { not: WorkspaceStatus.DELETED },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictException('A workspace with this name already exists');
    }
  }

  private async resolveUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug || 'workspace';
    let attempt = 0;

    while (attempt < 20) {
      const existing = await this.prisma.workspace.findUnique({
        where: { slug },
      });
      if (!existing) {
        return slug;
      }
      attempt += 1;
      slug = appendSlugSuffix(baseSlug || 'workspace', String(attempt));
    }

    throw new ConflictException('Unable to generate a unique workspace slug');
  }

  private assertActiveUser(
    user: {
      deletedAt: Date | null;
      status: UserStatus;
    } | null,
  ): asserts user is { deletedAt: Date | null; status: UserStatus } {
    if (!user || user.deletedAt || user.status === UserStatus.DELETED) {
      throw new NotFoundException('User not found');
    }

    if (
      user.status === UserStatus.INACTIVE ||
      user.status === UserStatus.SUSPENDED
    ) {
      throw new BadRequestException(
        'Cannot transfer ownership to an inactive user',
      );
    }
  }

  private toSettingsResponse(settings: {
    defaultAiProvider: string | null;
    defaultAiModel: string | null;
    defaultEmbeddingModel: string | null;
    autoSyncEnabled: boolean;
    notificationsEnabled: boolean;
    preferences: Prisma.JsonValue;
  }) {
    return {
      defaultAiProvider: settings.defaultAiProvider,
      defaultAiModel: settings.defaultAiModel,
      defaultEmbeddingModel: settings.defaultEmbeddingModel,
      autoSyncEnabled: settings.autoSyncEnabled,
      notificationsEnabled: settings.notificationsEnabled,
      preferences:
        (settings.preferences as Record<string, unknown> | null) ?? null,
    };
  }

  private toMemberResponse(member: {
    id: string;
    userId: string;
    role: WorkspaceMemberRole;
    joinedAt: Date;
    user: {
      email: string;
      displayName: string | null;
      firstName: string | null;
      lastName: string | null;
    };
  }) {
    return {
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      displayName:
        member.user.displayName ??
        ([member.user.firstName, member.user.lastName]
          .filter(Boolean)
          .join(' ') ||
          null),
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }

  private toWorkspaceResponse(workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    ownerId: string;
    status: WorkspaceStatus;
    createdAt: Date;
    updatedAt: Date;
    settings: {
      defaultAiProvider: string | null;
      defaultAiModel: string | null;
      defaultEmbeddingModel: string | null;
      autoSyncEnabled: boolean;
      notificationsEnabled: boolean;
      preferences: Prisma.JsonValue;
    } | null;
  }) {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      ownerId: workspace.ownerId,
      status: workspace.status,
      settings: workspace.settings
        ? this.toSettingsResponse(workspace.settings)
        : undefined,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }
}
