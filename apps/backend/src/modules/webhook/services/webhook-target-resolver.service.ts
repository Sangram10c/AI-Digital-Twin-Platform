import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConnectedAccountStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ResolvedWebhookTarget } from '../interfaces/webhook.interfaces';

@Injectable()
export class WebhookTargetResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve tenant context from GitHub payload repository id and/or query hints.
   */
  async resolve(input: {
    providerRepositoryId?: string;
    workspaceIdHint?: string;
    connectedAccountIdHint?: string;
  }): Promise<ResolvedWebhookTarget> {
    if (input.workspaceIdHint && input.connectedAccountIdHint) {
      const account = await this.prisma.connectedAccount.findFirst({
        where: {
          id: input.connectedAccountIdHint,
          workspaceId: input.workspaceIdHint,
          status: ConnectedAccountStatus.ACTIVE,
          gitProvider: { type: 'GITHUB', isEnabled: true },
        },
      });
      if (!account) {
        throw new NotFoundException(
          'Connected GitHub account not found for workspace hints',
        );
      }

      let repositoryId: string | undefined;
      if (input.providerRepositoryId) {
        const repo = await this.prisma.repository.findFirst({
          where: {
            connectedAccountId: account.id,
            providerRepositoryId: input.providerRepositoryId,
            deletedAt: null,
          },
          select: { id: true },
        });
        repositoryId = repo?.id;
      }

      return {
        workspaceId: account.workspaceId,
        connectedAccountId: account.id,
        repositoryId,
        providerRepositoryId: input.providerRepositoryId,
      };
    }

    if (!input.providerRepositoryId) {
      throw new BadRequestException(
        'Unable to resolve webhook target: missing repository and workspace hints. Configure the webhook URL with workspaceId and connectedAccountId query params, or use a repository webhook.',
      );
    }

    const repository = await this.prisma.repository.findFirst({
      where: {
        providerRepositoryId: input.providerRepositoryId,
        deletedAt: null,
        connectedAccount: {
          status: ConnectedAccountStatus.ACTIVE,
          gitProvider: { type: 'GITHUB', isEnabled: true },
        },
      },
      select: {
        id: true,
        workspaceId: true,
        connectedAccountId: true,
        providerRepositoryId: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!repository) {
      throw new NotFoundException(
        `No active workspace repository found for GitHub repo id ${input.providerRepositoryId}`,
      );
    }

    return {
      workspaceId: repository.workspaceId,
      connectedAccountId: repository.connectedAccountId,
      repositoryId: repository.id,
      providerRepositoryId: repository.providerRepositoryId,
    };
  }
}
