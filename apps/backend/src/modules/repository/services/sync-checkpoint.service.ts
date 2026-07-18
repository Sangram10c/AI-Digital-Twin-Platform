import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  SyncCheckpoint,
  SyncEntityKind,
} from '../interfaces/repository-sync.interfaces';

@Injectable()
export class SyncCheckpointService {
  constructor(private readonly prisma: PrismaService) {}

  async getCheckpoints(repositoryId: string): Promise<SyncCheckpoint[]> {
    const repository = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { providerMetadata: true },
    });
    const meta =
      repository?.providerMetadata &&
      typeof repository.providerMetadata === 'object'
        ? (repository.providerMetadata as Record<string, unknown>)
        : {};
    const checkpoints = meta.syncCheckpoints;
    return Array.isArray(checkpoints) ? (checkpoints as SyncCheckpoint[]) : [];
  }

  async getCheckpoint(
    repositoryId: string,
    entity: SyncEntityKind,
  ): Promise<SyncCheckpoint | undefined> {
    const all = await this.getCheckpoints(repositoryId);
    return all.find((item) => item.entity === entity);
  }

  async saveCheckpoint(
    repositoryId: string,
    checkpoint: SyncCheckpoint,
  ): Promise<void> {
    const repository = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { providerMetadata: true },
    });
    const meta =
      repository?.providerMetadata &&
      typeof repository.providerMetadata === 'object'
        ? (repository.providerMetadata as Record<string, unknown>)
        : {};
    const existing = Array.isArray(meta.syncCheckpoints)
      ? ([...(meta.syncCheckpoints as SyncCheckpoint[])] as SyncCheckpoint[])
      : [];
    const index = existing.findIndex(
      (item) => item.entity === checkpoint.entity,
    );
    if (index >= 0) {
      existing[index] = checkpoint;
    } else {
      existing.push(checkpoint);
    }

    await this.prisma.repository.update({
      where: { id: repositoryId },
      data: {
        providerMetadata: {
          ...meta,
          syncCheckpoints: existing,
          lastSyncCheckpointAt: new Date().toISOString(),
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async markPipelineStatus(
    repositoryId: string,
    status: Record<string, unknown>,
  ): Promise<void> {
    const repository = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { providerMetadata: true },
    });
    const meta =
      repository?.providerMetadata &&
      typeof repository.providerMetadata === 'object'
        ? (repository.providerMetadata as Record<string, unknown>)
        : {};

    await this.prisma.repository.update({
      where: { id: repositoryId },
      data: {
        providerMetadata: {
          ...meta,
          pipelineStatus: {
            ...(typeof meta.pipelineStatus === 'object' && meta.pipelineStatus
              ? meta.pipelineStatus
              : {}),
            ...status,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    });
  }
}
