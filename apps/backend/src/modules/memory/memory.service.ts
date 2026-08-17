// ============================================================
// Memory Service
// Manages ConversationMemory records — durable, bounded
// memory snippets attached to a conversation for context
// window extension across sessions.
//
// Design rules:
//  - Only meaningful, curated snippets are stored as memory.
//  - NOT every message — only explicit "remember this" items.
//  - Expired memories are excluded from retrieval.
//  - Memory is scoped to a single conversation (no leakage).
//  - Retrieval is bounded by limit + importance ordering.
// ============================================================

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const MEMORY_DEFAULTS = {
  /** Max number of active memories returned per retrieval. */
  maxRetrievalLimit: 10,
  /** Default importance score for new memories. */
  defaultImportance: 0.5,
  /** Minimum importance for a memory to be retrieved. */
  minImportance: 0.1,
} as const;

// ────────────────────────────────────────────────────────────
// Public DTO types
// ────────────────────────────────────────────────────────────

export interface AddMemoryParams {
  conversationId: string;
  content: string;
  importance?: number;
  expiresAt?: Date;
}

export interface MemoryRecord {
  id: string;
  conversationId: string;
  content: string;
  importance: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────
  // Add a durable memory snippet to a conversation.
  // Callers must explicitly decide to add a memory — this is
  // NOT called automatically for every message.
  // ──────────────────────────────────────────────────────────

  async addMemory(params: AddMemoryParams): Promise<MemoryRecord> {
    const importance = Math.min(
      1,
      Math.max(0, params.importance ?? MEMORY_DEFAULTS.defaultImportance),
    );

    const memory = await this.prisma.conversationMemory.create({
      data: {
        conversationId: params.conversationId,
        content: params.content.trim(),
        importance,
        expiresAt: params.expiresAt ?? null,
      },
    });

    this.logger.debug(
      `[Memory] addMemory conversationId=${params.conversationId} id=${memory.id} importance=${importance}`,
    );

    return memory;
  }

  // ──────────────────────────────────────────────────────────
  // Retrieve active (non-expired) memories for a conversation,
  // ordered by importance descending.
  // ──────────────────────────────────────────────────────────

  async getActiveMemories(
    conversationId: string,
    limit: number = MEMORY_DEFAULTS.maxRetrievalLimit,
  ): Promise<MemoryRecord[]> {
    const now = new Date();

    const memories = await this.prisma.conversationMemory.findMany({
      where: {
        conversationId,
        importance: { gte: MEMORY_DEFAULTS.minImportance },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { importance: 'desc' },
      take: Math.min(limit, MEMORY_DEFAULTS.maxRetrievalLimit),
    });

    this.logger.debug(
      `[Memory] getActiveMemories conversationId=${conversationId} count=${memories.length}`,
    );

    return memories;
  }

  // ──────────────────────────────────────────────────────────
  // Delete a single memory, asserting conversation ownership.
  // ──────────────────────────────────────────────────────────

  async deleteMemory(memoryId: string, conversationId: string): Promise<void> {
    const existing = await this.prisma.conversationMemory.findUnique({
      where: { id: memoryId },
      select: { id: true, conversationId: true },
    });

    if (!existing) {
      throw new NotFoundException(`Memory ${memoryId} not found`);
    }

    if (existing.conversationId !== conversationId) {
      throw new ForbiddenException(
        'Memory does not belong to the specified conversation',
      );
    }

    await this.prisma.conversationMemory.delete({ where: { id: memoryId } });

    this.logger.debug(
      `[Memory] deleteMemory id=${memoryId} conversationId=${conversationId}`,
    );
  }

  // ──────────────────────────────────────────────────────────
  // Prune all expired memories for a conversation.
  // Intended to be called periodically or post-session.
  // ──────────────────────────────────────────────────────────

  async pruneExpiredMemories(conversationId: string): Promise<number> {
    const now = new Date();

    const result = await this.prisma.conversationMemory.deleteMany({
      where: {
        conversationId,
        expiresAt: { lte: now },
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `[Memory] pruneExpiredMemories conversationId=${conversationId} removed=${result.count}`,
      );
    }

    return result.count;
  }

  // ──────────────────────────────────────────────────────────
  // Update the content or importance of an existing memory.
  // ──────────────────────────────────────────────────────────

  async updateMemory(
    memoryId: string,
    conversationId: string,
    updates: { content?: string; importance?: number; expiresAt?: Date | null },
  ): Promise<MemoryRecord> {
    // Assert ownership before update.
    const existing = await this.prisma.conversationMemory.findUnique({
      where: { id: memoryId },
      select: { id: true, conversationId: true },
    });

    if (!existing) {
      throw new NotFoundException(`Memory ${memoryId} not found`);
    }

    if (existing.conversationId !== conversationId) {
      throw new ForbiddenException(
        'Memory does not belong to the specified conversation',
      );
    }

    const data: Record<string, unknown> = {};
    if (updates.content !== undefined) data['content'] = updates.content.trim();
    if (updates.importance !== undefined)
      data['importance'] = Math.min(1, Math.max(0, updates.importance));
    if (updates.expiresAt !== undefined) data['expiresAt'] = updates.expiresAt;

    const updated = await this.prisma.conversationMemory.update({
      where: { id: memoryId },
      data,
    });

    this.logger.debug(
      `[Memory] updateMemory id=${memoryId} conversationId=${conversationId}`,
    );

    return updated;
  }

  // ──────────────────────────────────────────────────────────
  // Format memories for prompt injection (plain text list).
  // ──────────────────────────────────────────────────────────

  formatForPrompt(memories: MemoryRecord[]): string {
    if (memories.length === 0) return '';
    const items = memories.map((m, i) => `${i + 1}. ${m.content}`).join('\n');
    return `## Conversation Memory\n${items}\n`;
  }
}
