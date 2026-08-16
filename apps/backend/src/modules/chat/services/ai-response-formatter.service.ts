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
        'Could not parse provider JSON — using rawText as answer',
      );
      return {
        answer: rawText.trim(),
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
   * Extracts the first JSON object/array from a string.
   * Handles provider outputs that wrap JSON in markdown fences.
   */
  private extractJson(text: string): string {
    // Strip markdown fences.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced?.[1]) return fenced[1].trim();

    // Find first { or [ and last matching } or ].
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');

    let start = -1;
    if (
      firstBrace !== -1 &&
      (firstBracket === -1 || firstBrace < firstBracket)
    ) {
      start = firstBrace;
    } else if (firstBracket !== -1) {
      start = firstBracket;
    }

    if (start !== -1) {
      const lastBrace = text.lastIndexOf('}');
      const lastBracket = text.lastIndexOf(']');
      const end = Math.max(lastBrace, lastBracket);
      if (end > start) return text.slice(start, end + 1);
    }

    return text;
  }
}
