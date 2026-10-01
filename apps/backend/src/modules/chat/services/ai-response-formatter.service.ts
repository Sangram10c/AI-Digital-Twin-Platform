// ============================================================
// AI Response Formatter Service
// Parses and normalises the raw LLM JSON output into
// a clean ChatResponse with citations, confidence and sources.
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import type { SupportedAiProvider } from '../../ai-knowledge/interfaces/ai-knowledge.interfaces';
import { CHAT_DEFAULTS } from '../constants/chat.constants';
import type {
  ChatResponse,
  ChatSource,
  CitationRef,
  ParsedAiAnswer,
  TokenUsage,
} from '../interfaces/chat.interfaces';

@Injectable()
export class AiResponseFormatterService {
  private readonly logger = new Logger(AiResponseFormatterService.name);

  // ──────────────────────────────────────────────────────────
  // Parse raw provider output → ParsedAiAnswer
  // ──────────────────────────────────────────────────────────

  parseAnswer(rawText: string): ParsedAiAnswer {
    if (!rawText || rawText.trim() === '') {
      return {
        answer:
          'I could not find a relevant answer in the available knowledge base. Please try rephrasing your question.',
        confidence: 0,
        relatedFiles: [],
        relatedTopics: [],
      };
    }

    try {
      const json = this.extractJson(rawText);
      const parsed = JSON.parse(json) as Record<string, unknown>;

      const answer =
        typeof parsed.answer === 'string' && parsed.answer.trim()
          ? parsed.answer.trim()
          : rawText.trim();

      const confidence =
        typeof parsed.confidence === 'number'
          ? Math.min(1, Math.max(0, parsed.confidence))
          : undefined;

      const relatedFiles = Array.isArray(parsed.relatedFiles)
        ? (parsed.relatedFiles as unknown[]).filter(
            (f): f is string => typeof f === 'string',
          )
        : [];

      const relatedTopics = Array.isArray(parsed.relatedTopics)
        ? (parsed.relatedTopics as unknown[]).filter(
            (t): t is string => typeof t === 'string',
          )
        : [];

      return { answer, confidence, relatedFiles, relatedTopics };
    } catch {
      this.logger.debug(
        'Could not parse provider JSON directly — attempting regex extraction',
      );
      // Fallback: extract answer property with regex
      const answerMatch = rawText.match(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (answerMatch?.[1]) {
        try {
          const parsedAnswer = JSON.parse(`"${answerMatch[1]}"`) as unknown;
          const unescaped =
            typeof parsedAnswer === 'string' ? parsedAnswer : '';
          return {
            answer: unescaped,
            confidence: undefined,
            relatedFiles: [],
            relatedTopics: [],
          };
        } catch {
          // ignore
        }
      }

      // If rawText itself looks like a raw JSON object string with "answer", strip the wrapper
      let cleanFallback = rawText.trim();
      if (cleanFallback.startsWith('{') && cleanFallback.includes('"answer"')) {
        const fallbackMatch = cleanFallback.match(
          /"answer"\s*:\s*"([\s\S]*?)"\s*,\s*"confidence"/,
        );
        if (fallbackMatch?.[1]) {
          cleanFallback = fallbackMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"');
        }
      }

      return {
        answer: cleanFallback,
        confidence: undefined,
        relatedFiles: [],
        relatedTopics: [],
      };
    }
  }

  // ──────────────────────────────────────────────────────────
  // Format full ChatResponse
  // ──────────────────────────────────────────────────────────

  format(params: {
    conversationId: string;
    messageId: string;
    userMessageId?: string;
    rawText: string;
    provider: SupportedAiProvider;
    model: string;
    citations: CitationRef[];
    sources: ChatSource[];
    executionTimeMs: number;
    promptVersion: number;
    fallbackUsed: boolean;
    promptTokens?: number;
    completionTokens?: number;
  }): ChatResponse {
    const parsed = this.parseAnswer(params.rawText);

    const confidence =
      parsed.confidence ?? this.heuristicConfidence(params.citations.length);

    const tokenUsage: TokenUsage = {
      promptTokens: params.promptTokens ?? 0,
      completionTokens: params.completionTokens ?? 0,
      totalTokens: (params.promptTokens ?? 0) + (params.completionTokens ?? 0),
    };

    return {
      conversationId: params.conversationId,
      messageId: params.messageId,
      userMessageId: params.userMessageId,
      answer: parsed.answer,
      citations: params.citations,
      sources: params.sources,
      confidence,
      providerUsed: params.provider,
      modelUsed: params.model,
      executionTimeMs: params.executionTimeMs,
      tokenUsage,
      promptVersion: params.promptVersion,
      fallbackUsed: params.fallbackUsed,
    };
  }

  // ──────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────

  /**
   * Heuristic confidence: scales from 0.3 (no citations) to 1.0.
   */
  private heuristicConfidence(citationCount: number): number {
    if (citationCount <= 0) return 0.3;
    const ratio = Math.min(
      citationCount / CHAT_DEFAULTS.minCitationsForFullConfidence,
      1,
    );
    return Math.round((0.3 + ratio * 0.7) * 100) / 100;
  }

  /**
   * Extracts the first JSON object from a string.
   * Only strips markdown fences when they wrap the entire JSON payload,
   * avoiding accidental matching of inner code blocks.
   */
  private extractJson(text: string): string {
    const trimmed = text.trim();

    // 1. Direct JSON test
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        JSON.parse(trimmed);
        return trimmed;
      } catch {
        // Fall through
      }
    }

    // 2. Strip outer markdown fences if the whole text is wrapped in ```json ... ```
    const outerFenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (outerFenced?.[1]) {
      const inner = outerFenced[1].trim();
      try {
        JSON.parse(inner);
        return inner;
      } catch {
        // Fall through
      }
    }

    // 3. Find outer-most { and }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // Fall through
      }
    }

    return trimmed;
  }
}
