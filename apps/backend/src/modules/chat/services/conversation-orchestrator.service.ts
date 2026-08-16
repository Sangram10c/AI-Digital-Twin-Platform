// ============================================================
// Conversation Orchestrator Service
// The main 10-step RAG pipeline:
//   1. Resolve / create conversation
//   2. Persist user message
//   3. Execute hybrid search
//   4. Token budget allocation
//   5. Build grounded prompt
//   6. Call AI with fallback
//   7. Parse & format response
//   8. Persist assistant message + AIResponse
//   9. Build & persist citations
//  10. Log ModelUsage + PromptHistory (fire-and-forget)
// ============================================================

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { SearchService } from '../../search/search.service';
import type { RankedSearchHit } from '../../search/interfaces/search.interfaces';
import { AiProviderFallbackService } from '../../ai-knowledge/providers/ai-provider-fallback.service';
import { CHAT_DEFAULTS } from '../constants/chat.constants';
import type { ChatRequest, ChatResponse } from '../interfaces/chat.interfaces';
import { ConversationService } from './conversation.service';
import { PromptBuilderService } from './prompt-builder.service';
import { CitationBuilderService } from './citation-builder.service';
import { AiResponseFormatterService } from './ai-response-formatter.service';
import { AiRequestLoggingService } from './ai-request-logging.service';
import { TokenBudgetService } from './token-budget.service';

@Injectable()
export class ConversationOrchestratorService {
  private readonly logger = new Logger(ConversationOrchestratorService.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly searchService: SearchService,
    private readonly providerFallback: AiProviderFallbackService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly citationBuilder: CitationBuilderService,
    private readonly formatter: AiResponseFormatterService,
    private readonly loggingService: AiRequestLoggingService,
    private readonly tokenBudget: TokenBudgetService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // Main orchestration pipeline
  // ──────────────────────────────────────────────────────────

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const started = Date.now();
    const provider = request.provider ?? CHAT_DEFAULTS.defaultProvider;
    // Map arbitrary topK to valid SearchTopK literal (5 | 10 | 20 | 50).
    const requestedTopK = request.topK ?? CHAT_DEFAULTS.topK;
    const validTopKValues = [5, 10, 20, 50] as const;
    const topK = validTopKValues.find((v) => v >= requestedTopK) ?? 10;

    // ── Step 1: Resolve / create conversation ────────────────
    let conversationId = request.conversationId;
    if (!conversationId) {
      const conv = await this.conversationService.createConversation({
        userId: request.userId,
        workspaceId: request.workspaceId,
      });
      conversationId = conv.id;
      // Auto-title from first query (no extra AI call).
      const autoTitle = this.conversationService.buildAutoTitle(request.query);
      await this.conversationService.updateTitle(
        conversationId,
        request.userId,
        autoTitle,
      );
    }

    // ── Step 2: Persist user message ─────────────────────────
    const userMessage = await this.conversationService.addMessage({
      conversationId,
      role: MessageRole.USER,
      content: request.query,
      tokenCount: this.tokenBudget.estimate(request.query),
    });

    // ── Step 3: Retrieve conversation history ────────────────
    const history = await this.conversationService.getHistory(
      conversationId,
      CHAT_DEFAULTS.maxHistoryMessages,
    );

    // ── Step 4: Execute hybrid search ────────────────────────
    let hits: RankedSearchHit[] = [];
    try {
      const searchResult = await this.searchService.search(request.userId, {
        workspaceId: request.workspaceId,
        query: request.query,
        repositoryIds: request.repositoryIds?.length
          ? request.repositoryIds
          : undefined,
        topK,
        page: 1,
        pageSize: topK,
        skipCache: false,
      });
      hits = searchResult.results;
    } catch (error) {
      this.logger.warn(
        `Search failed — proceeding without context: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    // ── Step 5: Build grounded prompt ────────────────────────
    const builtPrompt = await this.promptBuilder.build({
      workspaceId: request.workspaceId,
      repositoryIds: request.repositoryIds,
      userQuery: request.query,
      history,
      chunks: hits,
      provider,
    });

    // ── Step 6: Call AI with fallback ────────────────────────
    const aiResult = await this.providerFallback.generateWithFallback(
      {
        provider,
        systemPrompt: builtPrompt.systemPrompt,
        userPrompt: builtPrompt.userPrompt,
        temperature: request.temperature ?? 0.2,
      },
      { workspaceId: request.workspaceId },
    );

    if (aiResult.allCloudProvidersFailed && !aiResult.rawText) {
      throw new ServiceUnavailableException(
        'All AI providers are currently unavailable. Please try again later.',
      );
    }

    const executionTimeMs = Date.now() - started;

    // ── Step 7: Parse and format answer ──────────────────────
    const parsed = this.formatter.parseAnswer(aiResult.rawText);

    // ── Step 8: Persist assistant message ────────────────────
    const assistantMessage = await this.conversationService.addMessage({
      conversationId,
      role: MessageRole.ASSISTANT,
      content: parsed.answer,
      tokenCount: this.tokenBudget.estimate(parsed.answer),
    });

    // ── Step 8b: Persist AIResponse row ──────────────────────
    const aiResponseId = await this.loggingService.createAiResponse({
      messageId: assistantMessage.id,
      provider: aiResult.provider,
      model: aiResult.model,
      rawResponse: { rawText: aiResult.rawText, output: aiResult.output },
      latencyMs: aiResult.latencyMs,
    });

    // ── Step 9: Build & persist citations ────────────────────
    const citations = await this.citationBuilder.persistCitations({
      messageId: assistantMessage.id,
      hits,
      aiResponseId,
    });

    const sources = this.citationBuilder.buildSources(hits);

    // ── Step 10: Log usage (fire-and-forget) ─────────────────
    void this.loggingService.logModelUsage({
      workspaceId: request.workspaceId,
      conversationId,
      messageId: assistantMessage.id,
      aiResponseId,
      provider: aiResult.provider,
      model: aiResult.model,
      promptTokens: builtPrompt.estimatedTokens,
      completionTokens: this.tokenBudget.estimate(parsed.answer),
      latencyMs: executionTimeMs,
    });

    void this.loggingService.logPromptHistory({
      conversationId,
      messageId: userMessage.id,
      systemPrompt: builtPrompt.systemPrompt,
      userPrompt: builtPrompt.userPrompt,
    });

    // ── Return formatted ChatResponse ────────────────────────
    return this.formatter.format({
      conversationId,
      messageId: assistantMessage.id,
      rawText: aiResult.rawText,
      provider: aiResult.provider,
      model: aiResult.model,
      citations,
      sources,
      executionTimeMs,
      promptVersion: builtPrompt.promptVersion,
      fallbackUsed: aiResult.fallbackUsed,
      promptTokens: builtPrompt.estimatedTokens,
      completionTokens: this.tokenBudget.estimate(parsed.answer),
    });
  }
}
