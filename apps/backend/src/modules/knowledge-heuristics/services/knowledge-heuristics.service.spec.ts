import { KnowledgeHeuristicsService } from './knowledge-heuristics.service';

describe('KnowledgeHeuristicsService', () => {
  const prisma = {
    repository: {
      findUniqueOrThrow: jest.fn(),
    },
    commit: { findMany: jest.fn() },
    pullRequest: { findMany: jest.fn() },
    issue: { findMany: jest.fn() },
    release: { findMany: jest.fn() },
    knowledgeSource: { findMany: jest.fn() },
    heuristicMetadata: { upsert: jest.fn() },
  };

  let service: KnowledgeHeuristicsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new KnowledgeHeuristicsService(prisma as never);
    prisma.repository.findUniqueOrThrow.mockResolvedValue({
      id: 'repo-1',
      workspaceId: 'ws-1',
      fullName: 'acme/platform',
      description: 'NestJS platform with JWT oauth docker kubernetes',
      language: 'TypeScript',
      providerMetadata: {
        stack: {
          frameworks: [{ name: 'NestJS' }],
          libraries: [{ name: 'Prisma' }],
          otherDependencies: [],
        },
      },
      documentation: [
        { title: 'README', content: 'Authentication module and redis cache' },
      ],
    });
    prisma.commit.findMany.mockResolvedValue([
      { message: 'feat: add login', sha: 'aaaaaaaa' },
      { message: 'fix: security xss #12', sha: 'bbbbbbbb' },
    ]);
    prisma.pullRequest.findMany.mockResolvedValue([
      { number: 12, title: 'Auth PR', body: 'jwt' },
    ]);
    prisma.issue.findMany.mockResolvedValue([
      { number: 12, title: 'Auth issue', body: 'oauth' },
    ]);
    prisma.release.findMany.mockResolvedValue([]);
    prisma.knowledgeSource.findMany.mockResolvedValue([
      {
        path: 'src/modules/authentication/auth.service.ts',
        title: 'auth',
        metadata: {},
        sourceType: 'REPOSITORY',
      },
    ]);
    prisma.heuristicMetadata.upsert.mockResolvedValue({});
  });

  it('extracts deterministic stack and signals without AI', async () => {
    const result = await service.extractForRepository('repo-1');

    expect(result.frameworks).toEqual(expect.arrayContaining(['NestJS']));
    expect(result.modules).toEqual(expect.arrayContaining(['authentication']));
    expect(result.topics).toEqual(expect.arrayContaining(['authentication']));
    expect(result.bugFixCount).toBeGreaterThanOrEqual(1);
    expect(result.securityCount).toBeGreaterThanOrEqual(1);
    expect(result.relationships.length).toBeGreaterThan(0);
    expect(result.confidenceScore).toBeGreaterThan(0);
    expect(prisma.heuristicMetadata.upsert).toHaveBeenCalled();
  });
});
