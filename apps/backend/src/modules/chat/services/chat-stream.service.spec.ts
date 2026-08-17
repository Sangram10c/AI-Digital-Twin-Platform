// ============================================================
// ChatStreamService — Unit Tests
// ============================================================

import { Test, TestingModule } from '@nestjs/testing';
import { ChatStreamService } from './chat-stream.service';
import { ConversationOrchestratorService } from './conversation-orchestrator.service';
import { SSE_EVENTS } from '../constants/chat.constants';
import type { ChatResponse } from '../interfaces/chat.interfaces';
import { firstValueFrom, toArray } from 'rxjs';

describe('ChatStreamService', () => {
  let streamService: ChatStreamService;

  const mockOrchestrator = {
    chat: jest.fn(),
  };

  const mockResponse: ChatResponse = {
    conversationId: 'conv-1',
    messageId: 'msg-1',
    answer: 'Word1 Word2 Word3',
    citations: [
      {
        index: 1,
        knowledgeChunkId: 'kc-1',
        knowledgeSourceId: null,
        documentationId: null,
        repositoryId: null,
        repositoryName: null,
        filePath: null,
        externalRefId: null,
        title: null,
        excerpt: 'excerpt',
        relevanceScore: 0.9,
      },
    ],
    sources: [],
    confidence: 0.9,
    providerUsed: 'groq',
    modelUsed: 'llama',
    executionTimeMs: 100,
    tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    promptVersion: 1,
    fallbackUsed: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatStreamService,
        {
          provide: ConversationOrchestratorService,
          useValue: mockOrchestrator,
        },
      ],
    }).compile();

    streamService = module.get<ChatStreamService>(ChatStreamService);
    jest.clearAllMocks();
  });

  it('should emit delta events, citation event, and done event in sequence', async () => {
    mockOrchestrator.chat.mockResolvedValue(mockResponse);

    const stream$ = streamService.stream({
      userId: 'user-1',
      workspaceId: 'ws-1',
      query: 'test query',
    });

    const events = await firstValueFrom(stream$.pipe(toArray()));

    expect(events.length).toBeGreaterThanOrEqual(4); // 3 words + citations + done

    // First events should be DELTA
    const deltas = events.filter((e) => e.type === SSE_EVENTS.DELTA);
    expect(deltas.length).toBe(3);
    expect(deltas[0]?.data).toBe('Word1 ');
    expect(deltas[1]?.data).toBe('Word2 ');
    expect(deltas[2]?.data).toBe('Word3');

    // Next event should be CITATIONS
    const citationEvents = events.filter(
      (e) => e.type === SSE_EVENTS.CITATIONS,
    );
    expect(citationEvents.length).toBe(1);
    expect(citationEvents[0]?.data).toEqual(mockResponse.citations);

    // Final event should be DONE
    const doneEvents = events.filter((e) => e.type === SSE_EVENTS.DONE);
    expect(doneEvents.length).toBe(1);
    expect(doneEvents[0]?.data).toEqual(mockResponse);
  });

  it('should emit error event when orchestrator throws an exception', async () => {
    mockOrchestrator.chat.mockRejectedValue(new Error('AI provider failed'));

    const stream$ = streamService.stream({
      userId: 'user-1',
      workspaceId: 'ws-1',
      query: 'test query',
    });

    const events = await firstValueFrom(stream$.pipe(toArray()));

    expect(events.length).toBe(1);
    expect(events[0]?.type).toBe(SSE_EVENTS.ERROR);
    expect(events[0]?.data).toEqual({ message: 'AI provider failed' });
  });
});
