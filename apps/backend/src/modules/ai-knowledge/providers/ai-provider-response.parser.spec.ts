import {
  parseAnthropicResponse,
  parseGeminiResponse,
  parseOllamaResponse,
  parseOpenAiResponse,
  parseOpenRouterResponse,
  parseProviderJsonContent,
} from './ai-provider-response.parser';

describe('ai-provider-response.parser', () => {
  describe('parseOpenAiResponse', () => {
    it('extracts content from standard chat completion', () => {
      const data = {
        choices: [{ message: { content: '{"summary":"ok"}' } }],
      };
      expect(parseOpenAiResponse(data)).toBe('{"summary":"ok"}');
    });

    it('returns empty string when choices are missing', () => {
      expect(parseOpenAiResponse({})).toBe('');
      expect(parseOpenAiResponse({ choices: [] })).toBe('');
    });

    it('handles nested message with null content', () => {
      const data = { choices: [{ message: { content: null } }] };
      expect(parseOpenAiResponse(data)).toBe('');
    });
  });

  describe('parseAnthropicResponse', () => {
    it('extracts text from first content block', () => {
      const data = {
        content: [{ type: 'text', text: '{"summary":"auth fix"}' }],
      };
      expect(parseAnthropicResponse(data)).toBe('{"summary":"auth fix"}');
    });

    it('returns empty string when content blocks are absent', () => {
      expect(parseAnthropicResponse({})).toBe('');
      expect(parseAnthropicResponse({ content: [] })).toBe('');
    });

    it('ignores non-text blocks and uses first block text field', () => {
      const data = {
        content: [{ type: 'tool_use', id: 'x' }, { text: 'ignored' }],
      };
      expect(parseAnthropicResponse(data)).toBe('');
    });
  });

  describe('parseGeminiResponse', () => {
    it('extracts text from candidates[0].content.parts[0].text', () => {
      const data = {
        candidates: [
          {
            content: {
              parts: [{ text: '{"topics":["redis"]}' }],
            },
          },
        ],
      };
      expect(parseGeminiResponse(data)).toBe('{"topics":["redis"]}');
    });

    it('returns empty string for missing candidates', () => {
      expect(parseGeminiResponse({})).toBe('');
      expect(parseGeminiResponse({ candidates: [] })).toBe('');
    });

    it('handles multiple parts and reads the first text part', () => {
      const data = {
        candidates: [
          {
            content: {
              parts: [{ text: '{"kind":"commit"}' }, { text: 'extra' }],
            },
          },
        ],
      };
      expect(parseGeminiResponse(data)).toBe('{"kind":"commit"}');
    });
  });

  describe('parseOpenRouterResponse', () => {
    it('uses OpenAI-compatible response shape', () => {
      const data = {
        choices: [{ message: { content: '{"summary":"via openrouter"}' } }],
      };
      expect(parseOpenRouterResponse(data)).toBe(
        '{"summary":"via openrouter"}',
      );
    });
  });

  describe('parseOllamaResponse', () => {
    it('extracts chat message content', () => {
      expect(
        parseOllamaResponse({
          message: { role: 'assistant', content: '{"summary":"local"}' },
        }),
      ).toBe('{"summary":"local"}');
    });

    it('falls back to generate API response field', () => {
      expect(parseOllamaResponse({ response: '{"ok":true}' })).toBe(
        '{"ok":true}',
      );
    });
  });

  describe('parseProviderJsonContent', () => {
    it('parses raw JSON text', () => {
      expect(parseProviderJsonContent('{"summary":"plain"}')).toEqual({
        summary: 'plain',
      });
    });

    it('extracts JSON embedded in markdown fences', () => {
      const wrapped = 'Here is the result:\n```json\n{"summary":"fenced"}\n```';
      expect(parseProviderJsonContent(wrapped)).toEqual({ summary: 'fenced' });
    });

    it('extracts JSON object from surrounding prose', () => {
      const wrapped = 'Analysis complete. {"summary":"embedded"} End.';
      expect(parseProviderJsonContent(wrapped)).toEqual({
        summary: 'embedded',
      });
    });

    it('throws when no JSON object is present', () => {
      expect(() => parseProviderJsonContent('not json')).toThrow(
        'Provider response did not contain valid JSON',
      );
    });
  });
});
