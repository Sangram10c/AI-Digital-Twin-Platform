import { ConfigService } from '@nestjs/config';
import { EmbeddingStatus } from '@prisma/client';
import { EmbeddingsService } from './embeddings.service';
import { EmbeddingChecksumService } from './embedding-checksum.service';

describe('EmbeddingsService', () => {
  const checksum = new EmbeddingChecksumService();

  function buildService(prisma: Record<string, unknown>) {
    const storage = {
      markProcessing: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      upsertWithVector: jest.fn().mockResolvedValue('emb-1'),
      markDeleted: jest.fn().mockResolvedValue(undefined),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'ai.embeddings.batchSize') return 10;
        if (key === 'ai.embeddings.version') return 1;
        if (key === 'ai.embeddings.provider') return 'mock';
        if (key === 'ai.embeddings.model') return 'mock';
        if (key === 'ai.embeddings.dimensions') return 8;
        return undefined;
      }),
    } as unknown as ConfigService;

    return {
      service: new EmbeddingsService(
        prisma as never,
        config,
        checksum,
        storage as never,
      ),
      storage,
    };
  }

  it('skips deleted and empty chunks and checksum hits', async () => {
    const hash = checksum.hashContent('same');
    const prisma = {
      knowledgeChunk: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'c1',
            content: 'same',
            contentHash: hash,
            deletedAt: null,
            embedding: {
              id: 'e1',
              checksum: hash,
              status: EmbeddingStatus.COMPLETED,
              provider: 'mock',
              model: 'mock',
              version: 1,
              dimensions: 8,
            },
          },
          {
            id: 'c2',
            content: '',
            contentHash: null,
            deletedAt: null,
            embedding: null,
          },
          {
            id: 'c3',
            content: 'x',
            contentHash: null,
            deletedAt: new Date(),
            embedding: null,
          },
        ]),
      },
    };
    const { service, storage } = buildService(prisma);
    const summary = await service.embedChunks({
      knowledgeChunkIds: ['c1', 'c2', 'c3'],
    });
    expect(summary.skipped).toBe(3);
    expect(summary.completed).toBe(0);
    expect(summary.cacheHits).toBe(1);
    expect(storage.upsertWithVector).not.toHaveBeenCalled();
  });

  it('embeds changed chunks in batches', async () => {
    const prisma = {
      knowledgeChunk: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'c1',
            content: 'hello',
            contentHash: null,
            deletedAt: null,
            embedding: null,
          },
        ]),
      },
    };
    const { service, storage } = buildService(prisma);
    const summary = await service.embedChunks({ knowledgeChunkIds: ['c1'] });
    expect(summary.completed).toBe(1);
    expect(storage.upsertWithVector).toHaveBeenCalled();
  });
});
