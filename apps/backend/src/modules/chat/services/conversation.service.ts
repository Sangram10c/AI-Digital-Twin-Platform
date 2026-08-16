// ============================================================
// Conversation Service
// Manages Conversation and Message persistence.
// DOES NOT touch the existing AiKnowledge or Search modules.
// ============================================================

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import type { HistoryMessage } from '../interfaces/chat.interfaces';
import { CHAT_DEFAULTS } from '../constants/chat.constants';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────
  // Conversation CRUD
  // ──────────────────────────────────────────────────────────

  async createConversation(params: {
    userId: string;
    workspaceId: string;
    repositoryId?: string;
    title?: string;
  }) {
    const conversation = await this.prisma.conversation.create({
      data: {
        userId: params.userId,
        workspaceId: params.workspaceId,
        repositoryId: params.repositoryId ?? null,
        title: params.title ?? null,
      },
    });
    this.logger.debug(
      `Created conversation ${conversation.id} for user ${params.userId}`,
    );
    return conversation;
  }

  async getConversation(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }
    if (conversation.userId !== userId) {
      throw new ForbiddenException('Access denied to this conversation');
    }
    return conversation;
  }

  async listConversations(params: {
    userId: string;
    workspaceId: string;
    page: number;
    limit: number;
  }) {
    const skip = (params.page - 1) * params.limit;
    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          userId: params.userId,
          workspaceId: params.workspaceId,
          deletedAt: null,
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: params.limit,
        include: {
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.conversation.count({
        where: {
          userId: params.userId,
          workspaceId: params.workspaceId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      hasMore: skip + data.length < total,
    };
  }

  async updateTitle(id: string, userId: string, title: string) {
    await this.assertOwnership(id, userId);
    return this.prisma.conversation.update({
      where: { id },
      data: { title: title.slice(0, CHAT_DEFAULTS.maxTitleLength) },
    });
  }

  async deleteConversation(id: string, userId: string) {
    await this.assertOwnership(id, userId);
    return this.prisma.conversation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async pinConversation(id: string, userId: string) {
    await this.assertOwnership(id, userId);
    // Upsert: creates a pin if not exists, is a no-op if already pinned.
    return this.prisma.pinnedConversation.upsert({
      where: { userId_conversationId: { userId, conversationId: id } },
      create: { conversationId: id, userId },
      update: {},
    });
  }

  async unpinConversation(id: string, userId: string) {
    await this.assertOwnership(id, userId);
    try {
      await this.prisma.pinnedConversation.delete({
        where: { userId_conversationId: { userId, conversationId: id } },
      });
    } catch {
      // If not pinned, silently ignore.
    }
    return { unpinned: true };
  }

  // ──────────────────────────────────────────────────────────
  // Message CRUD
  // ──────────────────────────────────────────────────────────

  async addMessage(params: {
    conversationId: string;
    role: MessageRole;
    content: string;
    tokenCount?: number;
  }) {
    // Get next sequence number in one atomic query.
    const lastMsg = await this.prisma.message.findFirst({
      where: { conversationId: params.conversationId },
      orderBy: { sequenceNumber: 'desc' },
      select: { sequenceNumber: true },
    });
    const sequenceNumber = (lastMsg?.sequenceNumber ?? 0) + 1;

    const message = await this.prisma.message.create({
      data: {
        conversationId: params.conversationId,
        role: params.role,
        content: params.content,
        sequenceNumber,
        tokenCount: params.tokenCount ?? null,
      },
    });

    // Keep conversation.updatedAt fresh.
    await this.prisma.conversation
      .update({
        where: { id: params.conversationId },
        data: { updatedAt: new Date() },
      })
      .catch(() => {
        // Non-critical — conversation may have been soft-deleted.
      });

    return message;
  }

  /**
   * Retrieve the most recent N messages for prompt context injection.
   * Returns in chronological order (oldest first → prompt reads naturally).
   */
  async getHistory(
    conversationId: string,
    limit: number = CHAT_DEFAULTS.maxHistoryMessages,
  ): Promise<HistoryMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        role: { in: [MessageRole.USER, MessageRole.ASSISTANT] },
      },
      orderBy: { sequenceNumber: 'desc' },
      take: limit,
      select: { role: true, content: true },
    });

    return messages.reverse().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      tokenEstimate: Math.ceil(m.content.length / CHAT_DEFAULTS.charsPerToken),
    }));
  }

  // ──────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────

  private async assertOwnership(conversationId: string, userId: string) {
    const row = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });
    if (!row) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    if (row.userId !== userId) {
      throw new ForbiddenException('Access denied to this conversation');
    }
  }

  /**
   * Auto-generate a title from the first user message (no AI call needed).
   */
  buildAutoTitle(query: string): string {
    const trimmed = query.trim();
    return trimmed.length <= CHAT_DEFAULTS.autoTitleMaxChars
      ? trimmed
      : trimmed.slice(0, CHAT_DEFAULTS.autoTitleMaxChars - 1) + '…';
  }
}
