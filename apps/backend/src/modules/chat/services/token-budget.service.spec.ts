import { Test, TestingModule } from '@nestjs/testing';
import { TokenBudgetService } from './token-budget.service';
import type { RankedSearchHit } from '../../search/interfaces/search.interfaces';

describe('TokenBudgetService', () => {
  let service: TokenBudgetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenBudgetService],
    }).compile();

    service = module.get<TokenBudgetService>(TokenBudgetService);
  });

  describe('estimate', () => {
    it('should estimate tokens as ceil(chars/4)', () => {
      expect(service.estimate('hello')).toBe(2); // 5/4 = 1.25 → ceil = 2
      expect(service.estimate('a'.repeat(100))).toBe(25);
    });

    it('should return 0 for empty string', () => {
      expect(service.estimate('')).toBe(0);
    });
  });

  describe('getProviderLimit', () => {
    it('should return correct limit for groq', () => {
      expect(service.getProviderLimit('groq')).toBe(8192);
    });

    it('should return correct limit for anthropic', () => {
      expect(service.getProviderLimit('anthropic')).toBe(100000);
    });

    it('should return default limit for undefined provider', () => {
      expect(service.getProviderLimit(undefined)).toBe(4096);
    });
  });

  describe('allocate', () => {
    const makeChunk = (preview: string, score: number): RankedSearchHit => ({
      chunkId: 'c1',
      repositoryId: null,
      repositoryName: null,
      repositoryFullName: null,
      filePath: null,
      knowledgeType: null,
      knowledgeSourceType: null,
      similarityScore: score,
      keywordScore: score,
      qualityScore: score,
      freshnessScore: score,
      repositoryPriority: score,
      rrfScore: score,
      finalScore: score,
      preview,
      metadata: {},
      citation: {
        knowledgeChunkId: 'c1',
        knowledgeSourceId: null,
        documentationId: null,
        path: null,
        title: null,
        externalRefId: null,
      },
    });

    it('should keep all chunks when within budget', () => {
      const chunks = [makeChunk('short', 0.9), makeChunk('text', 0.8)];
      const result = service.allocate({
        systemPromptTokens: 100,
        chunks,
        historyMessages: [],
        provider: 'groq',
      });
      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.chunksDropped).toBe(0);
    });

    it('should deduplicate chunks with same 64-char preview prefix', () => {
      const samePreview = 'x'.repeat(64) + 'different end';
      const chunks = [makeChunk(samePreview, 0.9), makeChunk(samePreview, 0.8)];
      const result = service.allocate({
        systemPromptTokens: 100,
        chunks,
        historyMessages: [],
        provider: 'groq',
      });
      expect(result.chunks.length).toBe(1);
    });

    it('should sort chunks by finalScore descending', () => {
      const chunks = [
        makeChunk('low score', 0.2),
        makeChunk('high score', 0.9),
      ];
      const result = service.allocate({
        systemPromptTokens: 100,
        chunks,
        historyMessages: [],
        provider: 'groq',
      });
      if (result.chunks.length >= 2) {
        expect(result.chunks[0].finalScore).toBeGreaterThanOrEqual(
          result.chunks[1].finalScore,
        );
      }
    });

    it('should estimate tokens is within maxTokens', () => {
      const chunks = [makeChunk('a'.repeat(500), 0.9)];
      const result = service.allocate({
        systemPromptTokens: 200,
        chunks,
        historyMessages: [],
        provider: 'groq',
      });
      expect(result.estimatedTokens).toBeLessThanOrEqual(result.maxTokens);
    });
  });
});
