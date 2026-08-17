// ============================================================
// MemoryService — Unit Tests
// ============================================================

import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MemoryService } from './memory.service';
import { PrismaService } from '../../database/prisma.service';

const mockCreate = jest.fn();
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockDelete = jest.fn();
const mockDeleteMany = jest.fn();
const mockUpdate = jest.fn();

const mockPrisma = {
  conversationMemory: {
    create: mockCreate,
    findMany: mockFindMany,
    findUnique: mockFindUnique,
    delete: mockDelete,
    deleteMany: mockDeleteMany,
    update: mockUpdate,
  },
};

interface CreateArgs {
  data: {
    conversationId: string;
    content: string;
    importance: number;
    expiresAt: Date | null;
  };
}

interface FindManyArgs {
  where: {
    conversationId: string;
    importance?: { gte: number };
    OR?: Array<Record<string, unknown>>;
  };
  orderBy?: { importance: 'desc' };
  take?: number;
}

interface UpdateArgs {
  where: { id: string };
  data: Record<string, unknown>;
}

function makeMemory(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mem-1',
    conversationId: 'conv-1',
    content: 'JWT refresh rotation was introduced in Phase 2',
    importance: 0.8,
    expiresAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('MemoryService', () => {
  let service: MemoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MemoryService>(MemoryService);
    jest.clearAllMocks();
  });

  // ── addMemory ─────────────────────────────────────────────

  describe('addMemory', () => {
    it('should create a memory with default importance when not provided', async () => {
      const mem = makeMemory({ importance: 0.5 });
      mockCreate.mockResolvedValue(mem);

      const result = await service.addMemory({
        conversationId: 'conv-1',
        content: 'Some important fact',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-1',
          content: 'Some important fact',
          importance: 0.5,
          expiresAt: null,
        },
      });
      expect(result.importance).toBe(0.5);
    });

    it('should clamp importance to [0, 1]', async () => {
      mockCreate.mockResolvedValue(makeMemory({ importance: 1 }));

      await service.addMemory({
        conversationId: 'conv-1',
        content: 'test',
        importance: 999,
      });

      const calls = mockCreate.mock.calls as unknown as CreateArgs[][];
      const call = calls[0]?.[0];
      expect(call?.data.importance).toBe(1);
    });

    it('should clamp negative importance to 0', async () => {
      mockCreate.mockResolvedValue(makeMemory({ importance: 0 }));

      await service.addMemory({
        conversationId: 'conv-1',
        content: 'test',
        importance: -5,
      });

      const calls = mockCreate.mock.calls as unknown as CreateArgs[][];
      const call = calls[0]?.[0];
      expect(call?.data.importance).toBe(0);
    });

    it('should set expiresAt when provided', async () => {
      const expiresAt = new Date('2030-01-01');
      mockCreate.mockResolvedValue(makeMemory({ expiresAt }));

      await service.addMemory({
        conversationId: 'conv-1',
        content: 'expires soon',
        expiresAt,
      });

      const calls = mockCreate.mock.calls as unknown as CreateArgs[][];
      const call = calls[0]?.[0];
      expect(call?.data.expiresAt).toEqual(expiresAt);
    });
  });

  // ── getActiveMemories ─────────────────────────────────────

  describe('getActiveMemories', () => {
    it('should return active (non-expired) memories ordered by importance', async () => {
      const memories = [
        makeMemory(),
        makeMemory({ id: 'mem-2', importance: 0.6 }),
      ];
      mockFindMany.mockResolvedValue(memories);

      const result = await service.getActiveMemories('conv-1');

      const calls = mockFindMany.mock.calls as unknown as FindManyArgs[][];
      const callArg = calls[0]?.[0];
      expect(callArg?.where.conversationId).toBe('conv-1');
      expect(callArg?.orderBy).toEqual({ importance: 'desc' });
      expect(result).toHaveLength(2);
    });

    it('should filter by expiresAt=null or expiresAt > now', async () => {
      mockFindMany.mockResolvedValue([]);

      await service.getActiveMemories('conv-1');

      const calls = mockFindMany.mock.calls as unknown as FindManyArgs[][];
      const callArg = calls[0]?.[0];

      expect(callArg?.where.OR).toBeDefined();
    });

    it('should cap limit at maxRetrievalLimit (10)', async () => {
      mockFindMany.mockResolvedValue([]);

      await service.getActiveMemories('conv-1', 999);

      const calls = mockFindMany.mock.calls as unknown as FindManyArgs[][];
      const callArg = calls[0]?.[0];
      expect(callArg?.take).toBeLessThanOrEqual(10);
    });
  });

  // ── deleteMemory ──────────────────────────────────────────

  describe('deleteMemory', () => {
    it('should throw NotFoundException when memory does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        service.deleteMemory('non-existent', 'conv-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when memory belongs to a different conversation', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'mem-1',
        conversationId: 'different-conv',
      });

      await expect(service.deleteMemory('mem-1', 'conv-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should delete the memory when ownership is verified', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'mem-1',
        conversationId: 'conv-1',
      });
      mockDelete.mockResolvedValue({});

      await service.deleteMemory('mem-1', 'conv-1');

      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: 'mem-1' },
      });
    });
  });

  // ── pruneExpiredMemories ──────────────────────────────────

  describe('pruneExpiredMemories', () => {
    it('should delete expired memories and return count', async () => {
      mockDeleteMany.mockResolvedValue({ count: 3 });

      const count = await service.pruneExpiredMemories('conv-1');

      expect(count).toBe(3);
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          expiresAt: { lte: expect.any(Date) as Date },
        },
      });
    });

    it('should return 0 when no expired memories exist', async () => {
      mockDeleteMany.mockResolvedValue({ count: 0 });

      const count = await service.pruneExpiredMemories('conv-1');
      expect(count).toBe(0);
    });
  });

  // ── updateMemory ──────────────────────────────────────────

  describe('updateMemory', () => {
    it('should throw NotFoundException when memory not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        service.updateMemory('mem-1', 'conv-1', { content: 'new content' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for cross-conversation update', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'mem-1',
        conversationId: 'other-conv',
      });

      await expect(
        service.updateMemory('mem-1', 'conv-1', { content: 'new content' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update only provided fields', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'mem-1',
        conversationId: 'conv-1',
      });
      mockUpdate.mockResolvedValue(makeMemory());

      await service.updateMemory('mem-1', 'conv-1', { importance: 0.9 });

      const calls = mockUpdate.mock.calls as unknown as UpdateArgs[][];
      const callArg = calls[0]?.[0];
      expect(callArg?.data).toHaveProperty('importance', 0.9);
      expect(callArg?.data).not.toHaveProperty('content');
    });
  });

  // ── formatForPrompt ───────────────────────────────────────

  describe('formatForPrompt', () => {
    it('should return empty string for empty memories', () => {
      expect(service.formatForPrompt([])).toBe('');
    });

    it('should format memories as numbered list with header', () => {
      const memories = [
        makeMemory({ content: 'JWT uses RS256 algorithm' }),
        makeMemory({ id: 'mem-2', content: 'Redis is used for sessions' }),
      ];

      const output = service.formatForPrompt(memories);
      expect(output).toContain('## Conversation Memory');
      expect(output).toContain('1. JWT uses RS256 algorithm');
      expect(output).toContain('2. Redis is used for sessions');
    });
  });
});
