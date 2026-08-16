// ============================================================
// AI Request Logging Service
// Writes ModelUsage, PromptHistory, and AIResponse records.
// All writes are fire-and-forget (non-critical, swallowed errors).
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { AiFinishReason, PromptType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import type { SupportedAiProvider } from '../../ai-knowledge/interfaces/ai-knowledge.interfaces';
import { CHAT_PROMPT_VERSION } from '../constants/chat.constants';

interface LogModelUsageParams {
  workspaceId: string;
  conversationId: string;
  messageId: string;
  aiResponseId?: string;
  provider: SupportedAiProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

interface LogPromptParams {
  conversationId: string;
  messageId: string;
  systemPrompt: string;
  userPrompt: string;
  promptType?: PromptType;
}

@Injectable()
export class AiRequestLoggingService {
  private readonly logger = new Logger(AiRequestLoggingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Logs token usage metrics to ModelUsage table.
   * Fire-and-forget — callers should NOT await.
   */
  async logModelUsage(params: LogModelUsageParams): Promise<void> {
    try {
      await this.prisma.modelUsage.create({
        data: {
          conversationId: params.conversationId,
          messageId: params.messageId,
          aiResponseId: params.aiResponseId ?? null,
          provider: params.provider,
          model: params.model,
          promptTokens: params.promptTokens,
          completionTokens: params.completionTokens,
          totalTokens: params.promptTokens + params.completionTokens,
          latencyMs: params.latencyMs,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to log model usage [conv=${params.conversationId}]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Logs system + user prompt to PromptHistory table for audit/debugging.
   * Fire-and-forget — callers should NOT await.
   */
  async logPromptHistory(params: LogPromptParams): Promise<void> {
    await Promise.allSettled([
      // Log system prompt entry
      this.logOnePrompt({
        conversationId: params.conversationId,
        messageId: params.messageId,
        promptType: PromptType.SYSTEM,
        content: params.systemPrompt.slice(0, 8000),
      }),
      // Log user prompt entry
      this.logOnePrompt({
        conversationId: params.conversationId,
        messageId: params.messageId,
        promptType: PromptType.USER,
        content: params.userPrompt.slice(0, 16000),
      }),
    ]);
  }

  private async logOnePrompt(params: {
    conversationId: string;
    messageId: string;
    promptType: PromptType;
    content: string;
  }): Promise<void> {
    try {
      await this.prisma.promptHistory.create({
        data: {
          conversationId: params.conversationId,
          messageId: params.messageId,
          promptType: params.promptType,
          content: params.content,
          version: CHAT_PROMPT_VERSION,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to log prompt history [conv=${params.conversationId}]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Creates an AIResponse row and returns its ID.
   * The ID links Citations and ModelUsage back to this response.
   */
  async createAiResponse(params: {
    messageId: string;
    provider: SupportedAiProvider;
    model: string;
    rawResponse: Record<string, unknown>;
    latencyMs: number;
    finishReason?: AiFinishReason;
  }): Promise<string | undefined> {
    try {
      const row = await this.prisma.aIResponse.create({
        data: {
          messageId: params.messageId,
          latencyMs: params.latencyMs,
          finishReason: params.finishReason ?? AiFinishReason.STOP,
          // Prisma InputJsonValue requires JSON.parse of a JSON.stringify to strip
          // TypeScript's strict index signature and produce a compatible type.
          rawResponse: JSON.parse(JSON.stringify(params.rawResponse)) as object,
        },
      });
      return row.id;
    } catch (error) {
      this.logger.error(
        `Failed to create AIResponse for message ${params.messageId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return undefined;
    }
  }
}
