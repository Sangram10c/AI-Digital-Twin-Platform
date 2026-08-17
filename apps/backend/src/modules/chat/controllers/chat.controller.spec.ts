// ============================================================
// ChatController — Unit Tests
// ============================================================

import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ConversationOrchestratorService } from '../services/conversation-orchestrator.service';
import { ChatStreamService } from '../services/chat-stream.service';
import { ConversationService } from '../services/conversation.service';
import { PrismaService } from '../../../database/prisma.service';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedDeveloper } from '../../identity/entities/authenticated-developer.entity';
import { of } from 'rxjs';

describe('ChatController', () => {
  let controller: ChatController;

  const mockOrchestrator = {
    chat: jest.fn(),
  };

  const mockStreamService = {
    stream: jest.fn(),
  };

  const mockConversationService = {
    listConversations: jest.fn(),
    getConversation: jest.fn(),
    updateTitle: jest.fn(),
    deleteConversation: jest.fn(),
    pinConversation: jest.fn(),
    unpinConversation: jest.fn(),
    listMessages: jest.fn(),
  };

  const mockPrisma = {};

  const mockDeveloper: AuthenticatedDeveloper = {
    id: 'dev-1',
    email: 'dev@example.com',
    role: 'USER',
    status: 'ACTIVE',
    sessionId: 'sess-1',
    passwordHash: null,
    firstName: 'Dev',
    lastName: 'User',
    displayName: 'Dev User',
    avatarUrl: null,
    emailVerifiedAt: new Date(),
    lastLoginAt: new Date(),
    timezone: 'UTC',
    locale: 'en',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ConversationOrchestratorService,
          useValue: mockOrchestrator,
        },
        { provide: ChatStreamService, useValue: mockStreamService },
        { provide: ConversationService, useValue: mockConversationService },
        { provide: PrismaService, useValue: mockPrisma },
        Reflector,
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    jest.clearAllMocks();
  });

  describe('chat', () => {
    it('should call orchestrator.chat with correct params and return response', async () => {
      const mockResult = {
        conversationId: 'conv-1',
        messageId: 'msg-1',
        answer: 'Hello',
        citations: [],
        sources: [],
        confidence: 0.9,
        providerUsed: 'groq',
        modelUsed: 'llama',
        executionTimeMs: 100,
        tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        promptVersion: 1,
        fallbackUsed: false,
      };
      mockOrchestrator.chat.mockResolvedValue(mockResult);

      const result = await controller.chat(
        {
          workspaceId: 'ws-1',
          query: 'What is this?',
          provider: 'groq',
          topK: 5,
          temperature: 0.2,
        },
        mockDeveloper,
      );

      expect(mockOrchestrator.chat).toHaveBeenCalledWith({
        userId: 'dev-1',
        workspaceId: 'ws-1',
        query: 'What is this?',
        conversationId: undefined,
        repositoryIds: undefined,
        provider: 'groq',
        topK: 5,
        temperature: 0.2,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('chatStream', () => {
    it('should delegate GET SSE streaming to streamService', () => {
      const observable = of({ data: 'token' });
      mockStreamService.stream.mockReturnValue(observable);

      const result = controller.chatStream(
        {
          workspaceId: 'ws-1',
          query: 'Stream this',
        },
        mockDeveloper,
      );

      expect(mockStreamService.stream).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'dev-1',
          workspaceId: 'ws-1',
          query: 'Stream this',
          stream: true,
        }),
      );
      expect(result).toBe(observable);
    });
  });

  describe('listConversations', () => {
    it('should return paginated conversations formatted as ConversationListResponseDto', async () => {
      mockConversationService.listConversations.mockResolvedValue({
        data: [
          {
            id: 'conv-1',
            title: 'Title',
            workspaceId: 'ws-1',
            repositoryId: null,
            _count: { messages: 4 },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      });

      const response = await controller.listConversations(
        { workspaceId: 'ws-1', page: 1, limit: 20 },
        mockDeveloper,
      );

      expect(response.total).toBe(1);
      expect(response.data[0]?.messageCount).toBe(4);
    });
  });

  describe('getConversation', () => {
    it('should return full conversation with messages', async () => {
      const conv = {
        id: 'conv-1',
        title: 'Title',
        workspaceId: 'ws-1',
        repositoryId: null,
        messages: [
          {
            id: 'msg-1',
            role: 'USER',
            content: 'Hi',
            sequenceNumber: 1,
            tokenCount: 5,
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockConversationService.getConversation.mockResolvedValue(conv);

      const response = await controller.getConversation(
        'conv-1',
        mockDeveloper,
      );

      expect(response.id).toBe('conv-1');
      expect(response.messageCount).toBe(1);
      expect(response.messages?.[0]?.content).toBe('Hi');
    });
  });

  describe('updateConversation', () => {
    it('should update conversation title', async () => {
      mockConversationService.updateTitle.mockResolvedValue({
        id: 'conv-1',
        title: 'New Title',
      });

      const result = await controller.updateConversation(
        'conv-1',
        { title: 'New Title' },
        mockDeveloper,
      );

      expect(mockConversationService.updateTitle).toHaveBeenCalledWith(
        'conv-1',
        'dev-1',
        'New Title',
      );
      expect(result).toEqual({ id: 'conv-1', title: 'New Title' });
    });
  });

  describe('deleteConversation', () => {
    it('should soft-delete conversation', async () => {
      mockConversationService.deleteConversation.mockResolvedValue({
        id: 'conv-1',
        deletedAt: new Date(),
      });

      await controller.deleteConversation('conv-1', mockDeveloper);

      expect(mockConversationService.deleteConversation).toHaveBeenCalledWith(
        'conv-1',
        'dev-1',
      );
    });
  });

  describe('pinConversation & unpinConversation', () => {
    it('should pin conversation', async () => {
      mockConversationService.pinConversation.mockResolvedValue({
        id: 'pin-1',
      });

      await controller.pinConversation('conv-1', mockDeveloper);

      expect(mockConversationService.pinConversation).toHaveBeenCalledWith(
        'conv-1',
        'dev-1',
      );
    });

    it('should unpin conversation', async () => {
      mockConversationService.unpinConversation.mockResolvedValue({
        unpinned: true,
      });

      const res = await controller.unpinConversation('conv-1', mockDeveloper);

      expect(mockConversationService.unpinConversation).toHaveBeenCalledWith(
        'conv-1',
        'dev-1',
      );
      expect(res).toEqual({ unpinned: true });
    });
  });

  describe('listMessages', () => {
    it('should return paginated messages for a conversation', async () => {
      mockConversationService.listMessages.mockResolvedValue({
        data: [
          {
            id: 'msg-1',
            content: 'hello',
            role: 'user',
            sequenceNumber: 1,
            tokenCount: 2,
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        hasMore: false,
      });

      const result = await controller.listMessages(
        'conv-1',
        1,
        50,
        mockDeveloper,
      );

      expect(mockConversationService.listMessages).toHaveBeenCalledWith({
        conversationId: 'conv-1',
        userId: 'dev-1',
        page: 1,
        limit: 50,
      });
      expect(result.total).toBe(1);
    });
  });
});
