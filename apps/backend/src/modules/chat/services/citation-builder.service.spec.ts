// ============================================================
// CitationBuilderService — Unit Tests
// ============================================================

import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CitationBuilderService } from './citation-builder.service';
import { PrismaService } from '../../../database/prisma.service';
import type { RankedSearchHit } from '../../search/interfaces/search.interfaces';

// ── Helpers ──────────────────────────────────────────────────

function makeHit(overrides: Partial<RankedSearchHit> = {}): RankedSearchHit {
  return {
    chunkId: 'chunk-1',
    repositoryId: 'repo-1',
    repositoryName: 'my-repo',
    repositoryFullName: 'org/my-repo',
    filePath: 'src/auth.ts',
    knowledgeType: 'code',
    knowledgeSourceType: 'COMMIT',
    similarityScore: 0.9,
    keywordScore: 0.8,
    qualityScore: 0.85,
    freshnessScore: 0.7,
    repositoryPriority: 1,
    rrfScore: 0.88,
    finalScore: 0.92,
    preview: 'const token = sign(payload, secret);',
    metadata: {},
    citation: {
      knowledgeChunkId: 'kc-1',
      knowledgeSourceId: 'ks-1',
      documentationId: 'doc-1',
      path: 'src/auth.ts',
      title: 'Auth module',
      externalRefId: 'commit-abc',
    },
    ...overrides,
  };
}

// ── Mock PrismaService ────────────────────────────────────────

const mockCreateMany = jest.fn();
const mockCreate = jest.fn();

const mockPrisma = {
  citation: {
    createMany: mockCreateMany,
    create: mockCreate,
  },
};

interface CreateManyArgs {
  data: Array<Record<string, unknown>>;
  skipDuplicates?: boolean;
}

// ── Test suite ───────────────────────────────────────────────

describe('CitationBuilderService', () => {
  let service: CitationBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitationBuilderService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CitationBuilderService>(CitationBuilderService);
    jest.clearAllMocks();
  });

  // ── buildRefs ──────────────────────────────────────────────

  describe('buildRefs', () => {
    it('should return empty array for empty hits', () => {
      expect(service.buildRefs([])).toEqual([]);
    });

    it('should assign 1-based citation indices', () => {
      const hits = [makeHit(), makeHit({ chunkId: 'chunk-2' })];
      const refs = service.buildRefs(hits);
      expect(refs[0]?.index).toBe(1);
      expect(refs[1]?.index).toBe(2);
    });

    it('should populate all citation ref fields', () => {
      const hit = makeHit();
      const [ref] = service.buildRefs([hit]);
      expect(ref).toBeDefined();
      expect(ref?.knowledgeChunkId).toBe('kc-1');
      expect(ref?.knowledgeSourceId).toBe('ks-1');
      expect(ref?.documentationId).toBe('doc-1');
      expect(ref?.repositoryId).toBe('repo-1');
      expect(ref?.repositoryName).toBe('my-repo');
      expect(ref?.filePath).toBe('src/auth.ts');
      expect(ref?.externalRefId).toBe('commit-abc');
      expect(ref?.title).toBe('Auth module');
      expect(ref?.excerpt).toBe('const token = sign(payload, secret);');
      expect(ref?.relevanceScore).toBeCloseTo(0.92, 2);
    });

    it('should truncate long excerpts to 300 chars with ellipsis', () => {
      const longPreview = 'A'.repeat(400);
      const hit = makeHit({ preview: longPreview });
      const [ref] = service.buildRefs([hit]);
      expect(ref?.excerpt.length).toBeLessThanOrEqual(300);
      expect(ref?.excerpt.endsWith('…')).toBe(true);
    });

    it('should handle null/missing citation fields gracefully', () => {
      const hit = makeHit({
        repositoryId: null,
        repositoryName: null,
        citation: {
          knowledgeChunkId: 'kc-2',
          knowledgeSourceId: null,
          documentationId: null,
          path: null,
          title: null,
          externalRefId: null,
        },
      });
      const [ref] = service.buildRefs([hit]);
      expect(ref?.repositoryId).toBeNull();
      expect(ref?.knowledgeSourceId).toBeNull();
      expect(ref?.documentationId).toBeNull();
    });
  });

  // ── persistCitations ──────────────────────────────────────

  describe('persistCitations', () => {
    it('should return empty result when no hits provided', async () => {
      const result = await service.persistCitations({
        messageId: 'msg-1',
        hits: [],
      });
      expect(result.citations).toEqual([]);
      expect(result.allPersisted).toBe(true);
      expect(result.failureCount).toBe(0);
      expect(mockCreateMany).not.toHaveBeenCalled();
    });

    it('should use createMany for bulk persistence', async () => {
      mockCreateMany.mockResolvedValue({ count: 1 });

      const result = await service.persistCitations({
        messageId: 'msg-1',
        hits: [makeHit()],
        aiResponseId: 'air-1',
      });

      expect(mockCreateMany).toHaveBeenCalledTimes(1);
      expect(result.allPersisted).toBe(true);
      expect(result.failureCount).toBe(0);
      expect(result.citations).toHaveLength(1);
    });

    it('should NOT pass citationIndex or documentationId as top-level Prisma fields', async () => {
      mockCreateMany.mockResolvedValue({ count: 1 });

      await service.persistCitations({
        messageId: 'msg-1',
        hits: [makeHit()],
      });

      const calls = mockCreateMany.mock.calls as unknown as CreateManyArgs[][];
      const callArg = calls[0]?.[0];
      const row = callArg?.data[0];

      // Must NOT have invalid Prisma fields
      expect(row).not.toHaveProperty('citationIndex');
      expect(row).not.toHaveProperty('documentationId');
      expect(row).not.toHaveProperty('citationOrder');

      // Must store extras inside metadata
      const meta = row?.['metadata'] as Record<string, unknown>;
      expect(meta).toHaveProperty('index', 1);
      expect(meta).toHaveProperty('documentationId', 'doc-1');
    });

    it('should include skipDuplicates flag', async () => {
      mockCreateMany.mockResolvedValue({ count: 1 });

      await service.persistCitations({
        messageId: 'msg-1',
        hits: [makeHit()],
      });

      const calls = mockCreateMany.mock.calls as unknown as CreateManyArgs[][];
      const callArg = calls[0]?.[0];
      expect(callArg?.skipDuplicates).toBe(true);
    });

    it('should fall back to individual inserts when createMany fails', async () => {
      mockCreateMany.mockRejectedValue(new Error('DB error'));
      mockCreate.mockResolvedValue({ id: 'cit-1' });

      const result = await service.persistCitations({
        messageId: 'msg-1',
        hits: [makeHit()],
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result.allPersisted).toBe(true);
      expect(result.failureCount).toBe(0);
    });

    it('should throw InternalServerErrorException when all individual inserts fail', async () => {
      mockCreateMany.mockRejectedValue(new Error('bulk fail'));
      mockCreate.mockRejectedValue(new Error('single fail'));

      await expect(
        service.persistCitations({
          messageId: 'msg-1',
          hits: [makeHit()],
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should report partial failure count when some individual inserts fail', async () => {
      mockCreateMany.mockRejectedValue(new Error('bulk fail'));

      // First insert succeeds, second fails
      mockCreate
        .mockResolvedValueOnce({ id: 'cit-1' })
        .mockRejectedValueOnce(new Error('single fail'));

      const result = await service.persistCitations({
        messageId: 'msg-1',
        hits: [makeHit(), makeHit({ chunkId: 'chunk-2' })],
      });

      expect(result.failureCount).toBe(1);
      expect(result.allPersisted).toBe(false);
      expect(result.citations).toHaveLength(2); // Refs still returned
    });

    it('should store valid Prisma fields only in the data rows', async () => {
      mockCreateMany.mockResolvedValue({ count: 1 });

      await service.persistCitations({
        messageId: 'msg-1',
        hits: [makeHit()],
        aiResponseId: 'air-1',
      });

      const calls = mockCreateMany.mock.calls as unknown as CreateManyArgs[][];
      const callArg = calls[0]?.[0];
      const row = callArg?.data[0];

      // Valid fields must be present
      expect(row).toHaveProperty('messageId', 'msg-1');
      expect(row).toHaveProperty('aiResponseId', 'air-1');
      expect(row).toHaveProperty('knowledgeChunkId', 'kc-1');
      expect(row).toHaveProperty('knowledgeSourceId', 'ks-1');
      expect(row).toHaveProperty('excerpt');
      expect(row).toHaveProperty('relevanceScore');
      expect(row).toHaveProperty('metadata');
    });
  });

  // ── buildSources ──────────────────────────────────────────

  describe('buildSources', () => {
    it('should return empty sources for empty hits', () => {
      expect(service.buildSources([])).toEqual([]);
    });

    it('should deduplicate sources by repo+path+title', () => {
      const hits = [makeHit(), makeHit()]; // Same repo+path+title
      const sources = service.buildSources(hits);
      expect(sources).toHaveLength(1);
    });

    it('should sort sources by relevance descending', () => {
      const hits = [
        makeHit({ finalScore: 0.5 }),
        makeHit({
          chunkId: 'c2',
          finalScore: 0.9,
          citation: {
            knowledgeChunkId: 'kc-2',
            knowledgeSourceId: null,
            documentationId: null,
            path: 'other.ts',
            title: 'Other',
            externalRefId: null,
          },
        }),
      ];
      const sources = service.buildSources(hits);
      expect(sources[0]?.relevanceScore).toBeGreaterThan(
        sources[1]?.relevanceScore ?? 0,
      );
    });

    it('should handle hits with null repository', () => {
      const hit = makeHit({
        repositoryId: null,
        repositoryName: null,
      });
      const sources = service.buildSources([hit]);
      expect(sources[0]?.repositoryId).toBeNull();
    });
  });
});
