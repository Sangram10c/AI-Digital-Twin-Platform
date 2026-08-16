import { Test, TestingModule } from '@nestjs/testing';
import { AiResponseFormatterService } from './ai-response-formatter.service';

describe('AiResponseFormatterService', () => {
  let service: AiResponseFormatterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiResponseFormatterService],
    }).compile();

    service = module.get<AiResponseFormatterService>(
      AiResponseFormatterService,
    );
  });

  describe('parseAnswer', () => {
    it('should parse valid JSON with answer field', () => {
      const raw = JSON.stringify({
        answer: 'JWT was introduced in commit abc',
        confidence: 0.95,
      });
      const result = service.parseAnswer(raw);
      expect(result.answer).toBe('JWT was introduced in commit abc');
      expect(result.confidence).toBe(0.95);
    });

    it('should extract JSON from markdown code fence', () => {
      const raw = '```json\n{"answer":"hello","confidence":0.8}\n```';
      const result = service.parseAnswer(raw);
      expect(result.answer).toBe('hello');
    });

    it('should return rawText as answer when JSON parsing fails', () => {
      const raw = 'This is plain text response from the AI.';
      const result = service.parseAnswer(raw);
      expect(result.answer).toBe(raw);
    });

    it('should return fallback for empty rawText', () => {
      const result = service.parseAnswer('');
      expect(result.confidence).toBe(0);
      expect(result.answer).toContain('could not find');
    });

    it('should clamp confidence to [0, 1]', () => {
      const raw = JSON.stringify({ answer: 'test', confidence: 1.5 });
      const result = service.parseAnswer(raw);
      expect(result.confidence).toBe(1);
    });
  });

  describe('format', () => {
    const baseParams = {
      conversationId: 'conv-1',
      messageId: 'msg-1',
      rawText: JSON.stringify({ answer: 'Test answer', confidence: 0.9 }),
      provider: 'groq' as const,
      model: 'llama-3.1-8b',
      citations: [],
      sources: [],
      executionTimeMs: 500,
      promptVersion: 1,
      fallbackUsed: false,
    };

    it('should produce a ChatResponse with all required fields', () => {
      const result = service.format(baseParams);
      expect(result.conversationId).toBe('conv-1');
      expect(result.messageId).toBe('msg-1');
      expect(result.answer).toBe('Test answer');
      expect(result.providerUsed).toBe('groq');
      expect(result.executionTimeMs).toBe(500);
    });

    it('should use heuristic confidence when no citations (0.3)', () => {
      // parseAnswer returns confidence=undefined if JSON has none
      const result = service.format({
        ...baseParams,
        rawText: JSON.stringify({ answer: 'test' }),
        citations: [],
      });
      // 0 citations → 0.3 heuristic
      expect(result.confidence).toBeCloseTo(0.3, 1);
    });

    it('should use parsed confidence from provider output', () => {
      const result = service.format({ ...baseParams, citations: [] });
      expect(result.confidence).toBe(0.9);
    });

    it('should compute total token usage', () => {
      const result = service.format({
        ...baseParams,
        promptTokens: 100,
        completionTokens: 50,
      });
      expect(result.tokenUsage.totalTokens).toBe(150);
    });
  });
});
