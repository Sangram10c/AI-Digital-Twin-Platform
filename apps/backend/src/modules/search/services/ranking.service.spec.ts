import { ConfigService } from '@nestjs/config';
import { RankingService } from './ranking.service';
import type { KeywordHit, VectorHit } from '../interfaces/search.interfaces';
import type { ChunkHydrationRow } from '../repositories/search.repository';

describe('RankingService', () => {
  const config = {
    get: (key: string) => {
      if (key === 'search.weights') {
        return {
          semantic: 0.55,
          keyword: 0.25,
          quality: 0.1,
          freshness: 0.05,
          repository: 0.05,
        };
      }
      if (key === 'search.rrfK') return 60;
      return undefined;
    },
  } as unknown as ConfigService;

  const service = new RankingService(config);

  const chunk = (
    id: string,
    content: string,
    overrides: Partial<ChunkHydrationRow> = {},
  ): ChunkHydrationRow => ({
    chunk_id: id,
    repository_id: 'repo-1',
    repository_name: 'backend',
    repository_full_name: 'org/backend',
    file_path: 'src/auth.ts',
    knowledge_type: 'DOCUMENTATION',
    knowledge_source_type: 'DOCUMENTATION',
    knowledge_source_id: 'ks-1',
    documentation_id: null,
    title: 'Auth',
    external_ref_id: 'auth',
    content,
    metadata: {},
    created_at: new Date(),
    token_count: 200,
    ...overrides,
  });

  it('merges vector and keyword hits into one ranked list', () => {
    const vectorHits: VectorHit[] = [
      { chunkId: 'a', similarity: 0.9, rank: 1 },
      { chunkId: 'b', similarity: 0.4, rank: 2 },
    ];
    const keywordHits: KeywordHit[] = [
      { chunkId: 'b', keywordScore: 0.8, rank: 1 },
      { chunkId: 'c', keywordScore: 0.2, rank: 2 },
    ];
    const ranked = service.mergeAndRank({
      vectorHits,
      keywordHits,
      chunks: [
        chunk('a', 'vector only'),
        chunk('b', 'both channels'),
        chunk('c', 'keyword only'),
      ],
      previewChars: 100,
    });

    expect(ranked).toHaveLength(3);
    expect(ranked[0].chunkId).toBe('a');
    expect(ranked.find((r) => r.chunkId === 'b')!.keywordScore).toBeGreaterThan(
      0,
    );
    expect(ranked.every((r) => r.citation.knowledgeChunkId)).toBe(true);
  });

  it('deduplicates near-identical previews', () => {
    const same = 'identical preview text for ranking dedupe test';
    const ranked = service.mergeAndRank({
      vectorHits: [
        { chunkId: 'a', similarity: 0.9, rank: 1 },
        { chunkId: 'b', similarity: 0.8, rank: 2 },
      ],
      keywordHits: [],
      chunks: [chunk('a', same), chunk('b', same)],
      previewChars: 100,
    });
    expect(ranked).toHaveLength(1);
  });

  it('boosts preferred repositories', () => {
    const ranked = service.mergeAndRank({
      vectorHits: [
        { chunkId: 'a', similarity: 0.7, rank: 1 },
        { chunkId: 'b', similarity: 0.7, rank: 2 },
      ],
      keywordHits: [],
      chunks: [
        chunk('a', 'alpha content here', { repository_id: 'repo-a' }),
        chunk('b', 'beta content here', { repository_id: 'repo-b' }),
      ],
      previewChars: 100,
      repositoryPriorityIds: ['repo-b'],
    });
    expect(ranked[0].chunkId).toBe('b');
  });

  it('ranks embedding-storage above synonym constants for storage queries', () => {
    const ranked = service.mergeAndRank({
      vectorHits: [],
      keywordHits: [
        { chunkId: 'constants', keywordScore: 1, rank: 1 },
        { chunkId: 'storage', keywordScore: 0.45, rank: 2 },
        { chunkId: 'module', keywordScore: 0.5, rank: 3 },
        { chunkId: 'vectorSearch', keywordScore: 0.9, rank: 4 },
      ],
      chunks: [
        chunk('constants', "embedding: ['pgvector', 'embedding-storage']", {
          file_path:
            'apps/backend/src/modules/search/constants/search.constants.ts',
          knowledge_type: 'CUSTOM',
          knowledge_source_type: 'CUSTOM',
          metadata: {
            documentType: 'source_code',
            symbolKind: 'const',
            symbolName: 'SEARCH_QUERY_EXPANSIONS',
          },
        }),
        chunk('storage', 'class EmbeddingStorageService { upsert() {} }', {
          file_path:
            'apps/backend/src/modules/embeddings/services/embedding-storage.service.ts',
          knowledge_type: 'CUSTOM',
          knowledge_source_type: 'CUSTOM',
          metadata: {
            documentType: 'source_code',
            symbolKind: 'class',
            symbolName: 'EmbeddingStorageService',
            startLine: 10,
          },
        }),
        chunk('module', 'providers: [EmbeddingStorageService]', {
          file_path: 'apps/backend/src/modules/embeddings/embeddings.module.ts',
          knowledge_type: 'CUSTOM',
          knowledge_source_type: 'CUSTOM',
          metadata: {
            documentType: 'source_code',
            symbolKind: 'file_slice',
          },
        }),
        chunk('vectorSearch', 'class VectorSearchService { search() {} }', {
          file_path:
            'apps/backend/src/modules/search/services/vector-search.service.ts',
          knowledge_type: 'CUSTOM',
          knowledge_source_type: 'CUSTOM',
          metadata: {
            documentType: 'source_code',
            symbolKind: 'class',
            symbolName: 'VectorSearchService',
            startLine: 9,
          },
        }),
      ],
      previewChars: 120,
      preferSourceCode: true,
      queryTerms: [
        'pgvector',
        'embedding',
        'vector',
        'storage',
        'embedding-storage',
      ],
    });

    expect(ranked[0].chunkId).toBe('storage');
    expect(ranked.findIndex((r) => r.chunkId === 'constants')).toBeGreaterThan(
      0,
    );
    expect(
      ranked.findIndex((r) => r.chunkId === 'vectorSearch'),
    ).toBeGreaterThan(0);
  });

  it('dedupes apps/backend/src vs src path variants', () => {
    const body = 'class VectorSearchService { search() {} }';
    const ranked = service.mergeAndRank({
      vectorHits: [],
      keywordHits: [
        { chunkId: 'long', keywordScore: 0.5, rank: 1 },
        { chunkId: 'short', keywordScore: 0.5, rank: 2 },
      ],
      chunks: [
        chunk('long', body, {
          file_path:
            'apps/backend/src/modules/search/services/vector-search.service.ts',
          metadata: {
            documentType: 'source_code',
            symbolKind: 'class',
            symbolName: 'VectorSearchService',
            startLine: 9,
          },
        }),
        chunk('short', body, {
          file_path: 'src/modules/search/services/vector-search.service.ts',
          metadata: {
            documentType: 'source_code',
            symbolKind: 'class',
            symbolName: 'VectorSearchService',
            startLine: 9,
          },
        }),
      ],
      previewChars: 100,
      preferSourceCode: true,
      queryTerms: ['vector', 'search'],
    });

    expect(ranked).toHaveLength(1);
    expect(ranked[0].filePath).toContain('apps/backend/src');
  });
});
