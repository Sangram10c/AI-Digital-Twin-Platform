import { KnowledgeSourceType } from '@prisma/client';
import { AiKnowledgeOrchestrationService } from './ai-knowledge-orchestration.service';

describe('AiKnowledgeOrchestrationService (integration)', () => {
  const prisma = {
    repository: { findMany: jest.fn() },
    knowledgeSource: { findMany: jest.fn() },
    documentation: { findMany: jest.fn() },
  };
  const queueService = {
    enqueueRepository: jest.fn(),
    enqueueCommit: jest.fn(),
    enqueuePullRequest: jest.fn(),
    enqueueIssue: jest.fn(),
    enqueueDocument: jest.fn(),
  };

  let service: AiKnowledgeOrchestrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiKnowledgeOrchestrationService(
      prisma as never,
      queueService as never,
    );
  });

  it('enqueueWorkspace uses light scope and enqueues per repository', async () => {
    prisma.repository.findMany.mockResolvedValue([
      { id: 'repo-1' },
      { id: 'repo-2' },
    ]);
    prisma.knowledgeSource.findMany.mockResolvedValue([
      { id: 'src-repo', sourceType: KnowledgeSourceType.REPOSITORY },
    ]);
    prisma.documentation.findMany.mockResolvedValue([]);

    const result = await service.enqueueWorkspace('ws-1', {
      provider: 'gemini',
    });

    expect(result.accepted).toBe(true);
    expect(result.repositories).toBe(2);
    expect(result.scope).toBe('light');
    expect(queueService.enqueueRepository).toHaveBeenCalled();
  });

  it('light scope only loads repository/docs/release types', async () => {
    prisma.knowledgeSource.findMany.mockResolvedValue([
      { id: 'src-repo', sourceType: KnowledgeSourceType.REPOSITORY },
    ]);
    prisma.documentation.findMany.mockResolvedValue([{ id: 'doc-1' }]);

    const result = await service.enqueueRepository('repo-1', 'ws-1', {
      scope: 'light',
    });

    expect(prisma.knowledgeSource.findMany).toHaveBeenCalled();
    const findManyCalls = prisma.knowledgeSource.findMany.mock.calls as Array<
      [{ where: { sourceType: { in: KnowledgeSourceType[] } } }]
    >;
    expect(findManyCalls[0]?.[0]?.where.sourceType.in).toEqual([
      KnowledgeSourceType.REPOSITORY,
      KnowledgeSourceType.DOCUMENTATION,
      KnowledgeSourceType.RELEASE,
    ]);
    expect(result.scope).toBe('light');
    expect(queueService.enqueueCommit).not.toHaveBeenCalled();
    expect(queueService.enqueueDocument).toHaveBeenCalled();
  });

  it('full scope can enqueue commits and PRs', async () => {
    prisma.knowledgeSource.findMany.mockResolvedValue([
      { id: 'src-repo', sourceType: KnowledgeSourceType.REPOSITORY },
      { id: 'src-commit', sourceType: KnowledgeSourceType.COMMIT },
      { id: 'src-pr', sourceType: KnowledgeSourceType.PULL_REQUEST },
    ]);
    prisma.documentation.findMany.mockResolvedValue([]);

    await service.enqueueRepository('repo-1', 'ws-1', {
      scope: 'full',
      provider: 'gemini',
      force: true,
    });

    expect(queueService.enqueueCommit).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: 'src-commit', scope: 'full' }),
    );
    expect(queueService.enqueuePullRequest).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: 'src-pr', scope: 'full' }),
    );
  });
});
