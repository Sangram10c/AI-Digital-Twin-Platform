import { KnowledgeSourceType } from '@prisma/client';
import { KnowledgeDocumentKind } from '../../knowledge/interfaces/knowledge.interfaces';
import { KnowledgeAiBridgeService } from './knowledge-ai-bridge.service';

describe('KnowledgeAiBridgeService', () => {
  const hybridQueue = {
    enqueuePipeline: jest.fn(),
  };
  const configService = {
    get: jest.fn().mockReturnValue('light'),
  };

  let service: KnowledgeAiBridgeService;

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockReturnValue('light');
    service = new KnowledgeAiBridgeService(
      hybridQueue as never,
      configService as never,
    );
  });

  it('does not auto-enqueue hybrid AI for documentation chunks', async () => {
    await service.enqueueAfterChunkGeneration({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      documentId: 'doc-1',
      documentKind: KnowledgeDocumentKind.DOCUMENTATION,
    });

    expect(hybridQueue.enqueuePipeline).not.toHaveBeenCalled();
  });

  it('does not auto-enqueue hybrid AI for commit chunks', async () => {
    await service.enqueueAfterChunkGeneration({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      documentId: 'src-commit',
      documentKind: KnowledgeDocumentKind.SOURCE,
      sourceType: KnowledgeSourceType.COMMIT,
    });

    expect(hybridQueue.enqueuePipeline).not.toHaveBeenCalled();
  });

  it('auto-enqueues hybrid pipeline only for repository sources', async () => {
    await service.enqueueAfterChunkGeneration({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      documentId: 'src-repo',
      documentKind: KnowledgeDocumentKind.SOURCE,
      sourceType: KnowledgeSourceType.REPOSITORY,
    });

    expect(hybridQueue.enqueuePipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryId: 'repo-1',
        mode: 'light',
        trigger: 'knowledge:chunk-complete',
      }),
    );
  });

  it('enqueues hybrid pipeline after repository knowledge processing', async () => {
    await service.enqueueRepositoryAnalysis({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      documentId: 'src-repo',
    });

    expect(hybridQueue.enqueuePipeline).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      mode: 'light',
      force: false,
      trigger: 'knowledge:repository-complete',
    });
  });
});
