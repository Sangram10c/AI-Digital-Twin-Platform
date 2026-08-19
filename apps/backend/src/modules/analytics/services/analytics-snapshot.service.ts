import { Injectable } from '@nestjs/common';
import { AnalyticsSnapshotType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AnalyticsSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists an analytics snapshot into the database.
   */
  async saveSnapshot(
    workspaceId: string,
    snapshotType: AnalyticsSnapshotType,
    periodStart: Date,
    periodEnd: Date,
    metrics: Record<string, unknown>,
    repositoryId?: string,
  ) {
    return this.prisma.analyticsSnapshot.create({
      data: {
        workspaceId,
        repositoryId: repositoryId || null,
        snapshotType,
        periodStart,
        periodEnd,
        metrics: metrics as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Finds the most recent snapshot for a workspace and category.
   */
  async getLatestSnapshot(
    workspaceId: string,
    snapshotType: AnalyticsSnapshotType,
    repositoryId?: string,
  ) {
    return this.prisma.analyticsSnapshot.findFirst({
      where: {
        workspaceId,
        repositoryId: repositoryId || null,
        snapshotType,
      },
      orderBy: { periodEnd: 'desc' },
    });
  }

  /**
   * Finds historical snapshots for trend reporting.
   */
  async getHistoricalSnapshots(
    workspaceId: string,
    snapshotType: AnalyticsSnapshotType,
    dateFrom: Date,
    dateTo: Date,
    repositoryId?: string,
  ) {
    return this.prisma.analyticsSnapshot.findMany({
      where: {
        workspaceId,
        repositoryId: repositoryId || null,
        snapshotType,
        periodStart: { gte: dateFrom },
        periodEnd: { lte: dateTo },
      },
      orderBy: { periodStart: 'asc' },
    });
  }
}
