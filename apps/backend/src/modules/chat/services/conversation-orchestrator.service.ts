// ============================================================
// Conversation Orchestrator Service
// The main 10-step RAG pipeline:
//   1.  Resolve / create conversation
//   2.  Persist user message
//   3.  Load conversation history (bounded)
//   4.  Execute hybrid search (RAG retrieval)
//   5.  Token budget allocation
//   6.  Build grounded prompt
//   7.  Call AI with fallback
//   8.  Parse & format response
//   9.  Persist assistant message + AIResponse (atomic)
//  10.  Persist citations + usage + prompt history (fire-and-forget)
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

    this.logger.log(
      `[Chat] chat_started userId=${request.userId} workspaceId=${request.workspaceId} ` +
        `conversationId=${request.conversationId ?? 'new'} provider=${provider}`,
    );

    // ── Step 1: Resolve / create conversation ────────────────
    let conversationId = request.conversationId;
    if (conversationId) {
      // Validate that conversation exists, is active, and belongs to user & workspace
      await this.conversationService.assertOwnership(
        conversationId,
        request.userId,
        request.workspaceId,
      );
    } else {
      const conv = await this.conversationService.createConversation({
        userId: request.userId,
        workspaceId: request.workspaceId,
        repositoryId: request.repositoryIds?.[0],
      });
      conversationId = conv.id;
      // Auto-title from first query — no LLM call needed.
      const autoTitle = this.conversationService.buildAutoTitle(request.query);
      await this.conversationService.updateTitle(
        conversationId,
        request.userId,
        autoTitle,
      );
      this.logger.log(
        `[Chat] conversation_created id=${conversationId} title="${autoTitle}"`,
      );
    }

    // ── Step 2: Persist user message ─────────────────────────
    const userMessage = await this.conversationService.addMessage({
      conversationId,
      role: MessageRole.USER,
      content: request.query,
      tokenCount: this.tokenBudget.estimate(request.query),
    });

    this.logger.log(
      `[Chat] message_created role=USER messageId=${userMessage.id} conversationId=${conversationId}`,
    );

    // ── Step 3: Load conversation history (bounded) ───────────
    const history = await this.conversationService.getHistory(
      conversationId,
      CHAT_DEFAULTS.maxHistoryMessages,
    );

    // ── Step 4: Execute hybrid search (RAG) ──────────────────
    let hits: RankedSearchHit[] = [];
    const ragStarted = Date.now();

    try {
      this.logger.log(
        `[Chat] rag_started conversationId=${conversationId} topK=${topK}`,
      );

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
      const ragLatencyMs = Date.now() - ragStarted;

      this.logger.log(
        `[Chat] rag_completed conversationId=${conversationId} ` +
          `chunks=${hits.length} latencyMs=${ragLatencyMs}`,
      );
    } catch (searchError) {
      const ragLatencyMs = Date.now() - ragStarted;
      this.logger.warn(
        `[Chat] rag_failed conversationId=${conversationId} ` +
          `latencyMs=${ragLatencyMs} error=${
            searchError instanceof Error
              ? searchError.message
              : String(searchError)
          } — proceeding with no context`,
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

    // ── Step 6: Call AI provider with fallback ────────────────
    this.logger.log(
      `[Chat] ai_generation_started conversationId=${conversationId} provider=${provider}`,
    );
    const aiStarted = Date.now();

    const aiResult = await this.providerFallback.generateWithFallback(
      {
        provider,
        systemPrompt: builtPrompt.systemPrompt,
        userPrompt: builtPrompt.userPrompt,
        temperature: request.temperature ?? 0.2,
      },
      { workspaceId: request.workspaceId },
    );

    const aiLatencyMs = Date.now() - aiStarted;

    this.logger.log(
      `[Chat] ai_generation_completed conversationId=${conversationId} ` +
        `provider=${aiResult.provider} model=${aiResult.model} ` +
        `fallback=${aiResult.fallbackUsed} latencyMs=${aiLatencyMs}`,
    );

    if (aiResult.allCloudProvidersFailed && !aiResult.rawText) {
      throw new ServiceUnavailableException(
        'All AI providers are currently unavailable. Please try again later.',
      );
    }

    const executionTimeMs = Date.now() - started;

    // ── Step 7: Parse and format answer ──────────────────────
    const parsed = this.formatter.parseAnswer(aiResult.rawText);

    // ── Step 8: Persist assistant message + AIResponse ────────
    // These are tightly coupled: assistant message must exist before
    // AIResponse and citations can reference it.
    const assistantMessage = await this.conversationService.addMessage({
      conversationId,
      role: MessageRole.ASSISTANT,
      content: parsed.answer,
      tokenCount: this.tokenBudget.estimate(parsed.answer),
    });

    this.logger.log(
      `[Chat] message_created role=ASSISTANT messageId=${assistantMessage.id} conversationId=${conversationId}`,
    );

    const aiResponseId = await this.loggingService.createAiResponse({
      messageId: assistantMessage.id,
      provider: aiResult.provider,
      model: aiResult.model,
      rawResponse: { rawText: aiResult.rawText, output: aiResult.output },
      latencyMs: aiResult.latencyMs,
    });

    // ── Step 9: Persist citations ─────────────────────────────
    let persistedCitations = this.citationBuilder.buildRefs(hits);

    if (hits.length > 0) {
      try {
        const citationResult = await this.citationBuilder.persistCitations({
          messageId: assistantMessage.id,
          hits,
          aiResponseId,
        });

        persistedCitations = citationResult.citations;

        if (!citationResult.allPersisted) {
          this.logger.warn(
            `[Chat] citation_persisted_partial messageId=${assistantMessage.id} ` +
              `failureCount=${citationResult.failureCount}`,
          );
        } else {
          this.logger.log(
            `[Chat] citation_persisted messageId=${assistantMessage.id} count=${persistedCitations.length}`,
          );
        }
      } catch (citationError) {
        // Citations failed entirely — log but do not block the response.
        this.logger.error(
          `[Chat] citation_persist_failed messageId=${assistantMessage.id}: ${
            citationError instanceof Error
              ? citationError.message
              : String(citationError)
          }`,
        );
      }
    }

    const sources = this.citationBuilder.buildSources(hits);

    // ── Step 10: Log usage + prompt history (fire-and-forget) ─
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

    this.logger.log(
      `[Chat] chat_stream_completed conversationId=${conversationId} ` +
        `executionTimeMs=${executionTimeMs} citations=${persistedCitations.length}`,
    );

    // ── Return formatted ChatResponse ────────────────────────
    return this.formatter.format({
      conversationId,
      messageId: assistantMessage.id,
      rawText: aiResult.rawText,
      provider: aiResult.provider,
      model: aiResult.model,
      citations: persistedCitations,
      sources,
      executionTimeMs,
      promptVersion: builtPrompt.promptVersion,
      fallbackUsed: aiResult.fallbackUsed,
      promptTokens: builtPrompt.estimatedTokens,
      completionTokens: this.tokenBudget.estimate(parsed.answer),
    });
  }
}
