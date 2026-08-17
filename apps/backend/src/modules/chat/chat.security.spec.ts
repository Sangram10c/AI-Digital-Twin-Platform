// ============================================================
// Chat Security & Multi-Tenancy Authorization — Unit Tests
// ============================================================

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from './services/conversation.service';
import { MemoryService } from '../memory/memory.service';
import { PrismaService } from '../../database/prisma.service';

describe('Chat Security & Isolation Tests', () => {
  let conversationService: ConversationService;
  let memoryService: MemoryService;

  const mockPrisma = {
    conversation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    pinnedConversation: {
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    conversationMemory: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        MemoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    conversationService = module.get<ConversationService>(ConversationService);
    memoryService = module.get<MemoryService>(MemoryService);
    jest.clearAllMocks();
  });

  describe('IDOR & Cross-User Conversation Protection', () => {
    it('should reject User B when reading User A conversation (ForbiddenException)', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-owner-A',
        userId: 'user-A',
        workspaceId: 'ws-1',
        messages: [],
      });

      await expect(
        conversationService.getConversation('conv-owner-A', 'user-B'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject User B when listing messages of User A conversation', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-owner-A',
        userId: 'user-A',
        workspaceId: 'ws-1',
      });

      await expect(
        conversationService.listMessages({
          conversationId: 'conv-owner-A',
          userId: 'user-B',
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject User B when updating title of User A conversation', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-owner-A',
        userId: 'user-A',
      });

      await expect(
        conversationService.updateTitle(
          'conv-owner-A',
          'user-B',
          'Hacked Title',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject User B when soft-deleting User A conversation', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-owner-A',
        userId: 'user-A',
      });

      await expect(
        conversationService.deleteConversation('conv-owner-A', 'user-B'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject User B when pinning User A conversation', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-owner-A',
        userId: 'user-A',
      });

      await expect(
        conversationService.pinConversation('conv-owner-A', 'user-B'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Cross-Conversation Memory Isolation', () => {
    it('should reject deleting memory belonging to Conversation A when targeting Conversation B', async () => {
      mockPrisma.conversationMemory.findUnique.mockResolvedValue({
        id: 'mem-1',
        conversationId: 'conv-A',
      });

      await expect(
        memoryService.deleteMemory('mem-1', 'conv-B'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject updating memory belonging to Conversation A when targeting Conversation B', async () => {
      mockPrisma.conversationMemory.findUnique.mockResolvedValue({
        id: 'mem-1',
        conversationId: 'conv-A',
      });

      await expect(
        memoryService.updateMemory('mem-1', 'conv-B', { content: 'Modified' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if memory record does not exist', async () => {
      mockPrisma.conversationMemory.findUnique.mockResolvedValue(null);

      await expect(
        memoryService.deleteMemory('non-existent', 'conv-A'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
