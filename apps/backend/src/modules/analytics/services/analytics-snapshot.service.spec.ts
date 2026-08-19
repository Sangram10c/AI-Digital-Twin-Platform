import { AnalyticsSnapshotType } from '@prisma/client';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';

describe('AnalyticsSnapshotService', () => {
  let service: AnalyticsSnapshotService;
  const prisma = {
    analyticsSnapshot: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsSnapshotService(prisma as never);
  });

  it('saves snapshot to database with JSON metrics payload', async () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-02');
    const metrics = { totalRepos: 10 };

    prisma.analyticsSnapshot.create.mockResolvedValue({
      id: 'snap-1',
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshotType: AnalyticsSnapshotType.REPOSITORY,
      periodStart: start,
      periodEnd: end,
      metrics,
    });

    const res = await service.saveSnapshot(
      'ws-1',
      AnalyticsSnapshotType.REPOSITORY,
      start,
      end,
      metrics,
      'repo-1',
    );

    expect(prisma.analyticsSnapshot.create).toHaveBeenCalledWith({
      data: {
        workspaceId: 'ws-1',
        repositoryId: 'repo-1',
        snapshotType: AnalyticsSnapshotType.REPOSITORY,
        periodStart: start,
        periodEnd: end,
        metrics,
      },
    });
    expect(res.id).toBe('snap-1');
  });

  it('finds latest snapshot ordered by periodEnd desc', async () => {
    prisma.analyticsSnapshot.findFirst.mockResolvedValue({ id: 'snap-latest' });

    const res = await service.getLatestSnapshot(
      'ws-1',
      AnalyticsSnapshotType.WORKSPACE,
    );

    expect(prisma.analyticsSnapshot.findFirst).toHaveBeenCalledWith({
      where: {
        workspaceId: 'ws-1',
        repositoryId: null,
        snapshotType: AnalyticsSnapshotType.WORKSPACE,
      },
      orderBy: { periodEnd: 'desc' },
    });
    expect(res?.id).toBe('snap-latest');
  });
});
