import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { ConversationService } from './conversation.service';
import { PrismaService } from '../../../database/prisma.service';

const mockPrisma = {
  conversation: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  pinnedConversation: {
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  repository: {
    findFirst: jest.fn(),
  },
};

describe('ConversationService', () => {
  let service: ConversationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should create a conversation with the given parameters', async () => {
      const expected = { id: 'conv-1', userId: 'user-1', workspaceId: 'ws-1' };
      mockPrisma.conversation.create.mockResolvedValue(expected);

      const result = await service.createConversation({
        userId: 'user-1',
        workspaceId: 'ws-1',
      });

      expect(result).toEqual(expected);
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          workspaceId: 'ws-1',
          repositoryId: null,
          title: null,
        },
      });
    });
  });

  describe('getConversation', () => {
    it('should throw NotFoundException when conversation does not exist', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null);
      await expect(
        service.getConversation('non-existent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the conversation', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        userId: 'other-user',
        messages: [],
      });
      await expect(service.getConversation('conv-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return the conversation when the user owns it', async () => {
      const conv = { id: 'conv-1', userId: 'user-1', messages: [] };
      mockPrisma.conversation.findUnique.mockResolvedValue(conv);
      const result = await service.getConversation('conv-1', 'user-1');
      expect(result).toEqual(conv);
    });
  });

  describe('addMessage', () => {
    it('should assign sequence number 1 for the first message', async () => {
      mockPrisma.message.findFirst.mockResolvedValue(null);
      mockPrisma.message.create.mockResolvedValue({
        id: 'msg-1',
        sequenceNumber: 1,
      });
      mockPrisma.conversation.update.mockResolvedValue({});

      const result = await service.addMessage({
        conversationId: 'conv-1',
        role: MessageRole.USER,
        content: 'Hello',
      });

      expect(result.sequenceNumber).toBe(1);
      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-1',
          role: MessageRole.USER,
          content: 'Hello',
          sequenceNumber: 1,
          tokenCount: null,
        },
      });
    });
  });

  describe('buildAutoTitle', () => {
    it('should return the full query if short enough', () => {
      const title = service.buildAutoTitle('How does JWT work?');
      expect(title).toBe('How does JWT work?');
    });

    it('should truncate long queries and append ellipsis', () => {
      const longQuery = 'A'.repeat(100);
      const title = service.buildAutoTitle(longQuery);
      expect(title.length).toBeLessThanOrEqual(80);
      expect(title.endsWith('…')).toBe(true);
    });
  });

  describe('assertOwnership', () => {
    it('should throw NotFoundException when conversation does not exist', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null);
      await expect(
        service.assertOwnership('conv-999', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when conversation is soft-deleted', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        deletedAt: new Date(),
      });
      await expect(service.assertOwnership('conv-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user does not own conversation', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        userId: 'other-user',
        workspaceId: 'ws-1',
        deletedAt: null,
      });
      await expect(service.assertOwnership('conv-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when workspace does not match', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        userId: 'user-1',
        workspaceId: 'other-ws',
        deletedAt: null,
      });
      await expect(
        service.assertOwnership('conv-1', 'user-1', 'ws-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should resolve without error when conversation is valid and owned', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        deletedAt: null,
      });
      await expect(
        service.assertOwnership('conv-1', 'user-1', 'ws-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('getHistory', () => {
    it('should return history in chronological order', async () => {
      mockPrisma.message.findMany.mockResolvedValue([
        { role: MessageRole.ASSISTANT, content: 'Answer' },
        { role: MessageRole.USER, content: 'Question' },
      ]);

      const history = await service.getHistory('conv-1');
      expect(history[0]?.role).toBe('USER');
      expect(history[1]?.role).toBe('ASSISTANT');
    });
  });
});
