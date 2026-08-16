// ============================================================
// Token Budget Service
// Trims retrieved chunks and history to fit within the
// provider's context window before prompt construction.
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import type { RankedSearchHit } from '../../search/interfaces/search.interfaces';
import type { SupportedAiProvider } from '../../ai-knowledge/interfaces/ai-knowledge.interfaces';
import {
  CHAT_DEFAULTS,
  PROVIDER_CONTEXT_LIMITS,
} from '../constants/chat.constants';
import type {
  HistoryMessage,
  TokenBudgetContext,
} from '../interfaces/chat.interfaces';

@Injectable()
export class TokenBudgetService {
  private readonly logger = new Logger(TokenBudgetService.name);

  /**
   * Rough token count estimate: characters / 4.
   * Avoids heavy tokenizer dependency while remaining conservative.
   */
  estimate(text: string): number {
    return Math.ceil(text.length / CHAT_DEFAULTS.charsPerToken);
  }

  getProviderLimit(provider?: SupportedAiProvider): number {
    if (!provider) return CHAT_DEFAULTS.defaultMaxContextTokens;
    return (
      PROVIDER_CONTEXT_LIMITS[provider] ?? CHAT_DEFAULTS.defaultMaxContextTokens
    );
  }

  /**
   * Allocates the context window across:
   *   systemPrompt + history + chunks + answer budget
   *
   * Strategy:
   *  1. Reserve budget for system prompt + answer tokens.
   *  2. Fill history from newest → oldest until tokens run out.
   *  3. Fill chunks by descending finalScore until remaining budget is used.
   *  4. Deduplicate chunks by content prefix (16 chars).
   */
  allocate(params: {
    systemPromptTokens: number;
    chunks: RankedSearchHit[];
    historyMessages: HistoryMessage[];
    provider?: SupportedAiProvider;
  }): TokenBudgetContext {
    const maxTokens = this.getProviderLimit(params.provider);
    const reserved =
      params.systemPromptTokens + CHAT_DEFAULTS.answerTokenBudget;
    let remaining = maxTokens - reserved;

    if (remaining <= 0) {
      this.logger.warn(
        `System prompt alone (${params.systemPromptTokens} tokens) exceeds provider limit (${maxTokens}). Truncating context.`,
      );
      remaining = Math.floor(maxTokens * 0.5);
    }

    // ── 1. Deduplicate chunks by first 64 chars of content ──
    const seenPreviews = new Set<string>();
    const uniqueChunks = params.chunks.filter((c) => {
      const key = c.preview.slice(0, 64);
      if (seenPreviews.has(key)) return false;
      seenPreviews.add(key);
      return true;
    });

    // Sort by finalScore descending (best first).
    uniqueChunks.sort((a, b) => b.finalScore - a.finalScore);

    // ── 2. Budget for history (up to 40% of remaining) ──
    const historyBudget = Math.floor(remaining * 0.4);
    let historyUsed = 0;
    const keptHistory: HistoryMessage[] = [];
    let historyDropped = 0;

    // Walk history from newest → oldest.
    for (let i = params.historyMessages.length - 1; i >= 0; i -= 1) {
      const msg = params.historyMessages[i];
      if (historyUsed + msg.tokenEstimate <= historyBudget) {
        keptHistory.unshift(msg);
        historyUsed += msg.tokenEstimate;
      } else {
        historyDropped += 1;
      }
    }

    remaining -= historyUsed;

    // ── 3. Budget for chunks (remaining after history) ──
    const keptChunks: RankedSearchHit[] = [];
    let chunkTokensUsed = 0;
    let chunksDropped = 0;

    for (const chunk of uniqueChunks) {
      const tokens = this.estimate(chunk.preview);
      if (chunkTokensUsed + tokens <= remaining) {
        keptChunks.push(chunk);
        chunkTokensUsed += tokens;
      } else {
        chunksDropped += 1;
      }
    }

    const estimatedTokens =
      params.systemPromptTokens +
      historyUsed +
      chunkTokensUsed +
      CHAT_DEFAULTS.answerTokenBudget;

    this.logger.debug(
      `Token budget: provider=${params.provider ?? 'default'} ` +
        `max=${maxTokens} system=${params.systemPromptTokens} ` +
        `history=${historyUsed}(dropped=${historyDropped}) ` +
        `chunks=${chunkTokensUsed}(dropped=${chunksDropped}) ` +
        `estimated=${estimatedTokens}`,
    );

    return {
      chunks: keptChunks,
      historyMessages: keptHistory,
      estimatedTokens,
      maxTokens,
      chunksDropped,
      historyDropped,
    };
  }
}
