'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import type { ChatMessage, Citation, AIProvider } from '@/types/chat.types';

interface UseChatStreamOptions {
  workspaceId: string;
  conversationId?: string;
  repositoryId?: string;
  provider?: AIProvider;
  initialMessages?: ChatMessage[];
  onConversationCreated?: (newConvId: string) => void;
}

export function useChatStream({
  workspaceId,
  conversationId,
  repositoryId,
  provider = 'gemini',
  initialMessages = [],
  onConversationCreated,
}: UseChatStreamOptions) {
  const queryClient = useQueryClient();
  const [localMessages, setLocalMessages] = React.useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Combine initial server messages with local appended streaming messages
  const messages = React.useMemo(() => {
    if (localMessages.length === 0) return initialMessages;
    // If local messages exist, merge avoiding duplicate IDs
    const serverIds = new Set(initialMessages.map((m) => m.id));
    const newLocal = localMessages.filter((m) => !serverIds.has(m.id));
    return [...initialMessages, ...newLocal];
  }, [initialMessages, localMessages]);

  const stopGeneration = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setLocalMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1 && msg.role === 'assistant'
            ? { ...msg, isStreaming: false, status: 'cancelled' }
            : msg,
        ),
      );
    }
  }, []);

  const sendMessage = React.useCallback(
    async (queryText: string, customProvider?: AIProvider) => {
      if (!queryText.trim() || isStreaming) return;

      setError(null);
      const userMessageId = `user-${Date.now()}`;
      const assistantMessageId = `assistant-${Date.now()}`;

      const userMsg: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: queryText.trim(),
        createdAt: new Date().toISOString(),
        status: 'sent',
      };

      const assistantMsg: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        citations: [],
        createdAt: new Date().toISOString(),
        isStreaming: true,
        status: 'streaming',
      };

      setLocalMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const activeProvider = customProvider || provider;

      try {
        await chatService.streamChat(
          {
            workspaceId,
            query: queryText.trim(),
            conversationId: conversationId || undefined,
            repositoryIds: repositoryId ? [repositoryId] : undefined,
            provider: activeProvider,
          },
          {
            onDelta: (textChunk: string) => {
              setLocalMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + textChunk }
                    : msg,
                ),
              );
            },
            onCitations: (citations: Citation[]) => {
              setLocalMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        citations: [
                          ...(msg.citations || []),
                          ...citations.filter(
                            (c) =>
                              !(msg.citations || []).some((existing) => existing.index === c.index),
                          ),
                        ],
                      }
                    : msg,
                ),
              );
            },
            onDone: (data) => {
              setIsStreaming(false);
              abortControllerRef.current = null;
              setLocalMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, isStreaming: false, status: 'completed' }
                    : msg,
                ),
              );

              // Invalidate conversation list so new titles appear in sidebar
              queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] });

              if (data.conversationId && data.conversationId !== conversationId) {
                onConversationCreated?.(data.conversationId);
              }
            },
            onError: (err) => {
              setIsStreaming(false);
              abortControllerRef.current = null;
              setError(err.message || 'Failed to complete AI response');
              setLocalMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        isStreaming: false,
                        status: 'error',
                        error: err.message,
                        content:
                          msg.content ||
                          'I encountered an issue generating an answer. Please verify provider connectivity and try again.',
                      }
                    : msg,
                ),
              );
            },
          },
          controller.signal,
        );
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          const e = err instanceof Error ? err : new Error('Streaming failed');
          setIsStreaming(false);
          abortControllerRef.current = null;
          setError(e.message);
        }
      }
    },
    [
      conversationId,
      isStreaming,
      onConversationCreated,
      provider,
      queryClient,
      repositoryId,
      workspaceId,
    ],
  );

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopGeneration,
    setLocalMessages,
  };
}
