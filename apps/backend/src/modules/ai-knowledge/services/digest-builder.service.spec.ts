import { DigestBuilderService } from './digest-builder.service';

describe('DigestBuilderService', () => {
  const prisma = {
    repository: {
      findUniqueOrThrow: jest.fn(),
    },
    repositoryDigest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    moduleDigest: { upsert: jest.fn() },
    pullRequestDigest: { upsert: jest.fn() },
    documentationDigest: { upsert: jest.fn() },
    releaseDigest: { upsert: jest.fn() },
    digestChecksum: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    pullRequest: { findMany: jest.fn() },
    documentation: { findMany: jest.fn() },
    release: { findMany: jest.fn() },
  };

  let service: DigestBuilderService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DigestBuilderService(prisma as never);
    prisma.repository.findUniqueOrThrow.mockResolvedValue({
      id: 'repo-1',
      workspaceId: 'ws-1',
      fullName: 'acme/app',
      description: 'Demo',
      language: 'TypeScript',
      defaultBranch: 'main',
    });
    prisma.pullRequest.findMany.mockResolvedValue([
      { number: 1, title: 'Add auth', body: 'oauth', state: 'MERGED' },
      { number: 2, title: 'Fix webhook', body: 'retry', state: 'OPEN' },
    ]);
    prisma.documentation.findMany.mockResolvedValue([
      {
        id: 'doc-1',
        title: 'README',
        content: '# App',
        type: 'README',
        filePath: 'README.md',
      },
    ]);
    prisma.release.findMany.mockResolvedValue([
      { tagName: 'v1.0.0', name: 'v1', body: 'First release' },
    ]);
    prisma.repositoryDigest.findFirst.mockResolvedValue(null);
    prisma.repositoryDigest.create.mockResolvedValue({ id: 'rd-1' });
    prisma.moduleDigest.upsert.mockResolvedValue({ id: 'md-1' });
    prisma.pullRequestDigest.upsert.mockResolvedValue({ id: 'pd-1' });
    prisma.documentationDigest.upsert.mockResolvedValue({ id: 'dd-1' });
    prisma.releaseDigest.upsert.mockResolvedValue({ id: 'rel-1' });
    prisma.digestChecksum.findUnique.mockResolvedValue(null);
    prisma.digestChecksum.upsert.mockResolvedValue({});
  });

  it('builds compressed digests without raw commit streams', async () => {
    const result = await service.buildForRepository(
      'repo-1',
      {
        languages: ['TypeScript'],
        frameworks: ['NestJS'],
        libraries: [],
        dependencies: [],
        databases: ['postgresql'],
        cloudProviders: [],
        cicd: ['github-actions'],
        modules: ['authentication', 'webhook'],
        topics: ['authentication'],
        technologies: ['NestJS', 'postgresql'],
        featureCount: 2,
        bugFixCount: 1,
        refactorCount: 0,
        securityCount: 1,
        performanceCount: 0,
        riskScore: 0.2,
        confidenceScore: 0.7,
        folderStructure: {},
        relationships: [],
        rawSignals: { commitSample: 200 },
        contentChecksum: 'abc',
      },
      { prBatchSize: 5, mode: 'LIGHT' },
    );

    expect(result.repositoryDigestId).toBe('rd-1');
    expect(result.moduleDigestIds.length).toBe(2);
    expect(result.documentationDigestIds).toEqual(['dd-1']);
    expect(result.releaseDigestIds).toEqual(['rel-1']);
    expect(prisma.repositoryDigest.create).toHaveBeenCalled();
    const createCalls = prisma.repositoryDigest.create.mock.calls as Array<
      [{ data: { summaryText: string } }]
    >;
    const summary = createCalls[0]?.[0]?.data.summaryText ?? '';
    expect(summary).toContain('Repository Digest');
    expect(summary).not.toMatch(/commit sha/i);
  });
});
