import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  GITHUB_AUDIT_ACTIONS,
  GITHUB_AUDIT_ENTITY,
} from '../constants/github.constants';

interface AuditContext {
  workspaceId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class GithubAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    action: (typeof GITHUB_AUDIT_ACTIONS)[keyof typeof GITHUB_AUDIT_ACTIONS],
    context: AuditContext,
    metadata?: Prisma.InputJsonValue,
    entityId?: string,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action,
        entityType: GITHUB_AUDIT_ENTITY,
        entityId,
        workspaceId: context.workspaceId,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata,
      },
    });
  }
}
