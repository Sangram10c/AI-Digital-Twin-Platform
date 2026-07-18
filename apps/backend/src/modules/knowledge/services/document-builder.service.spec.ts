import { DocumentBuilderService } from './document-builder.service';
import {
  KnowledgeDocumentKind,
  KnowledgeProcessingStatus,
} from '../interfaces/knowledge.interfaces';
import { contentChecksum } from '../utils/checksum.util';

describe('DocumentBuilderService incremental logic', () => {
  const prisma = {
    documentation: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    knowledgeSource: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: DocumentBuilderService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DocumentBuilderService(prisma as never);
  });

  it('skips unchanged completed documents', async () => {
    const rawContent = '# Commit abc\n\nFix bug';
    const checksum = contentChecksum(rawContent);

    prisma.knowledgeSource.findUnique.mockResolvedValue({
      id: 'source-1',
      metadata: {
        contentChecksum: checksum,
        processingStatus: KnowledgeProcessingStatus.COMPLETED,
      },
    });

    const result = await service.upsertDocument({
      documentKind: KnowledgeDocumentKind.SOURCE,
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      sourceType: 'COMMIT',
      externalRefId: 'abc123',
      title: 'Commit',
      rawContent,
      metadata: { documentType: 'commit' },
    });

    expect(result.skipped).toBe(true);
    expect(prisma.knowledgeSource.upsert).not.toHaveBeenCalled();
  });
});

describe('contentChecksum', () => {
  it('produces stable sha256 hashes', () => {
    const first = contentChecksum('hello');
    const second = contentChecksum('hello');
    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });
});
