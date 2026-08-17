// ============================================================
// ConversationOrchestratorService — Unit Tests
// ============================================================

import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationOrchestratorService } from './conversation-orchestrator.service';
import { ConversationService } from './conversation.service';
import { SearchService } from '../../search/search.service';
import { AiProviderFallbackService } from '../../ai-knowledge/providers/ai-provider-fallback.service';
import { PromptBuilderService } from './prompt-builder.service';
import { CitationBuilderService } from './citation-builder.service';
import { AiResponseFormatterService } from './ai-response-formatter.service';
import { AiRequestLoggingService } from './ai-request-logging.service';
import { TokenBudgetService } from './token-budget.service';
import { MessageRole } from '@prisma/client';

describe('ConversationOrchestratorService', () => {
  let orchestrator: ConversationOrchestratorService;

  const mockConversationService = {
    createConversation: jest.fn(),
    updateTitle: jest.fn(),
    buildAutoTitle: jest.fn(),
    addMessage: jest.fn(),
    getHistory: jest.fn(),
    assertOwnership: jest.fn(),
  };

  const mockSearchService = {
    search: jest.fn(),
  };

  const mockProviderFallback = {
    generateWithFallback: jest.fn(),
  };

  const mockPromptBuilder = {
    build: jest.fn(),
  };

  const mockCitationBuilder = {
    buildRefs: jest.fn(),
    persistCitations: jest.fn(),
    buildSources: jest.fn(),
  };

  const mockFormatter = {
    parseAnswer: jest.fn(),
    format: jest.fn(),
  };

  const mockLoggingService = {
    createAiResponse: jest.fn(),
    logModelUsage: jest.fn(),
    logPromptHistory: jest.fn(),
  };

  const mockTokenBudget = {
    estimate: jest.fn().mockReturnValue(10),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationOrchestratorService,
        { provide: ConversationService, useValue: mockConversationService },
        { provide: SearchService, useValue: mockSearchService },
        { provide: AiProviderFallbackService, useValue: mockProviderFallback },
        { provide: PromptBuilderService, useValue: mockPromptBuilder },
        { provide: CitationBuilderService, useValue: mockCitationBuilder },
        { provide: AiResponseFormatterService, useValue: mockFormatter },
        { provide: AiRequestLoggingService, useValue: mockLoggingService },
        { provide: TokenBudgetService, useValue: mockTokenBudget },
      ],
    }).compile();

    orchestrator = module.get<ConversationOrchestratorService>(
      ConversationOrchestratorService,
    );
    jest.clearAllMocks();
  });

  it('should orchestrate a full chat flow from query to response', async () => {
    mockConversationService.createConversation.mockResolvedValue({
      id: 'conv-new',
    });
    mockConversationService.buildAutoTitle.mockReturnValue('Auto Title');
    mockConversationService.updateTitle.mockResolvedValue({});
    mockConversationService.addMessage
      .mockResolvedValueOnce({ id: 'msg-user-1', role: MessageRole.USER })
      .mockResolvedValueOnce({
        id: 'msg-assistant-1',
        role: MessageRole.ASSISTANT,
      });
    mockConversationService.getHistory.mockResolvedValue([]);

    mockSearchService.search.mockResolvedValue({
      results: [
        {
          chunkId: 'chk-1',
          finalScore: 0.95,
          preview: 'JWT authentication snippet',
          citation: { knowledgeChunkId: 'chk-1', path: 'src/auth.ts' },
        },
      ],
    });

    mockPromptBuilder.build.mockResolvedValue({
      systemPrompt: 'Sys Prompt',
      userPrompt: 'User Prompt',
      promptVersion: 1,
      estimatedTokens: 100,
    });

    mockProviderFallback.generateWithFallback.mockResolvedValue({
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      rawText: '{"answer":"JWT is used."}',
      output: {},
      latencyMs: 150,
      fallbackUsed: false,
      allCloudProvidersFailed: false,
    });

    mockFormatter.parseAnswer.mockReturnValue({
      answer: 'JWT is used.',
      confidence: 0.9,
      relatedFiles: ['src/auth.ts'],
      relatedTopics: ['auth'],
    });

    mockLoggingService.createAiResponse.mockResolvedValue('air-1');

    mockCitationBuilder.buildRefs.mockReturnValue([
      {
        index: 1,
        knowledgeChunkId: 'chk-1',
        excerpt: 'JWT snippet',
        relevanceScore: 0.95,
      },
    ]);
    mockCitationBuilder.persistCitations.mockResolvedValue({
      citations: [
        {
          index: 1,
          knowledgeChunkId: 'chk-1',
          excerpt: 'JWT snippet',
          relevanceScore: 0.95,
        },
      ],
      allPersisted: true,
      failureCount: 0,
    });
    mockCitationBuilder.buildSources.mockReturnValue([
      {
        repositoryId: null,
        repositoryName: null,
        filePath: 'src/auth.ts',
        title: null,
        relevanceScore: 0.95,
        externalRefId: null,
      },
    ]);

    const expectedResponse = {
      conversationId: 'conv-new',
      messageId: 'msg-assistant-1',
      answer: 'JWT is used.',
      citations: [
        {
          index: 1,
          knowledgeChunkId: 'chk-1',
          excerpt: 'JWT snippet',
          relevanceScore: 0.95,
        },
      ],
      sources: [],
      confidence: 0.9,
      providerUsed: 'groq',
      modelUsed: 'llama-3.3-70b-versatile',
      executionTimeMs: 200,
      tokenUsage: { promptTokens: 100, completionTokens: 10, totalTokens: 110 },
      promptVersion: 1,
      fallbackUsed: false,
    };
    mockFormatter.format.mockReturnValue(expectedResponse);

    const response = await orchestrator.chat({
      userId: 'user-1',
      workspaceId: 'ws-1',
      query: 'How does auth work?',
    });

    expect(response).toEqual(expectedResponse);
    expect(mockConversationService.createConversation).toHaveBeenCalledWith({
      userId: 'user-1',
      workspaceId: 'ws-1',
      repositoryId: undefined,
    });
    expect(mockConversationService.addMessage).toHaveBeenCalledTimes(2);
    expect(mockSearchService.search).toHaveBeenCalledTimes(1);
    expect(mockPromptBuilder.build).toHaveBeenCalledTimes(1);
    expect(mockProviderFallback.generateWithFallback).toHaveBeenCalledTimes(1);
    expect(mockCitationBuilder.persistCitations).toHaveBeenCalledTimes(1);
  });

  it('should reuse existing conversation if conversationId is passed', async () => {
    mockConversationService.addMessage
      .mockResolvedValueOnce({ id: 'msg-user-2', role: MessageRole.USER })
      .mockResolvedValueOnce({
        id: 'msg-assistant-2',
        role: MessageRole.ASSISTANT,
      });
    mockConversationService.getHistory.mockResolvedValue([]);
    mockSearchService.search.mockResolvedValue({ results: [] });
    mockPromptBuilder.build.mockResolvedValue({
      systemPrompt: '',
      userPrompt: '',
      promptVersion: 1,
      estimatedTokens: 50,
    });
    mockProviderFallback.generateWithFallback.mockResolvedValue({
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      rawText: 'Answer text',
      latencyMs: 100,
      fallbackUsed: false,
      allCloudProvidersFailed: false,
    });
    mockFormatter.parseAnswer.mockReturnValue({ answer: 'Answer text' });
    mockCitationBuilder.buildRefs.mockReturnValue([]);
    mockCitationBuilder.buildSources.mockReturnValue([]);
    mockFormatter.format.mockReturnValue({ answer: 'Answer text' });

    await orchestrator.chat({
      userId: 'user-1',
      workspaceId: 'ws-1',
      conversationId: 'existing-conv-id',
      query: 'Follow up question',
    });

    expect(mockConversationService.createConversation).not.toHaveBeenCalled();
    expect(mockConversationService.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'existing-conv-id' }),
    );
  });

  it('should throw ServiceUnavailableException when all AI providers fail without output', async () => {
    mockConversationService.createConversation.mockResolvedValue({
      id: 'conv-1',
    });
    mockConversationService.buildAutoTitle.mockReturnValue('Title');
    mockConversationService.updateTitle.mockResolvedValue({});
    mockConversationService.addMessage.mockResolvedValue({ id: 'msg-1' });
    mockConversationService.getHistory.mockResolvedValue([]);
    mockSearchService.search.mockResolvedValue({ results: [] });
    mockPromptBuilder.build.mockResolvedValue({
      systemPrompt: '',
      userPrompt: '',
      promptVersion: 1,
      estimatedTokens: 50,
    });

    mockProviderFallback.generateWithFallback.mockResolvedValue({
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      rawText: '',
      allCloudProvidersFailed: true,
    });

    await expect(
      orchestrator.chat({
        userId: 'user-1',
        workspaceId: 'ws-1',
        query: 'Help',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
