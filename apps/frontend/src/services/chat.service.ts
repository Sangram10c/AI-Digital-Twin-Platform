/**
 * AI Chat & Streaming Service
 * Connects to NestJS Chat module under `/api/v1/chat/*`
 */
import { api } from './api.service';
import { API_BASE_URL } from '@/config/api.config';
import type {
  ChatRequestPayload,
  ChatResponse,
  Conversation,
  ConversationListResponse,
  Citation,
} from '@/types/chat.types';

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onCitations?: (citations: Citation[]) => void;
  onDone?: (data: { conversationId?: string; messageId?: string }) => void;
  onError?: (err: Error) => void;
}

export const chatService = {
  /**
   * List conversations for a workspace
   */
  async listConversations(
    workspaceId: string,
    page = 1,
    limit = 50,
  ): Promise<ConversationListResponse> {
    const { data } = await api.get<ConversationListResponse>('/chat/conversations', {
      params: { workspaceId, page, limit },
    });
    return data;
  },

  /**
   * Get single conversation with full message history
   */
  async getConversation(id: string): Promise<Conversation> {
    const { data } = await api.get<Conversation>(`/chat/conversations/${id}`);
    return data;
  },

  /**
   * Rename conversation
   */
  async updateTitle(id: string, title: string): Promise<{ message?: string; title: string }> {
    const { data } = await api.patch<{ message?: string; title: string }>(
      `/chat/conversations/${id}`,
      {
        title,
      },
    );
    return data;
  },

  /**
   * Delete conversation
   */
  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/chat/conversations/${id}`);
  },

  /**
   * Pin conversation
   */
  async pinConversation(id: string): Promise<void> {
    await api.post(`/chat/conversations/${id}/pin`);
  },

  /**
   * Unpin conversation
   */
  async unpinConversation(id: string): Promise<void> {
    await api.delete(`/chat/conversations/${id}/pin`);
  },

  /**
   * Non-streaming Chat Request
   */
  async sendChat(payload: ChatRequestPayload): Promise<ChatResponse> {
    const { data } = await api.post<ChatResponse>('/chat', payload);
    return data;
  },

  /**
   * Streaming SSE Chat Request
   */
  async streamChat(
    payload: ChatRequestPayload,
    callbacks: StreamCallbacks,
    signal?: AbortSignal,
  ): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        let errMsg = `Server error ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData.message || errMsg;
        } catch {
          // Ignore JSON parse error
        }
        throw new Error(errMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body stream is not readable.');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim();
            continue;
          }

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();

            if (currentEvent === 'delta') {
              try {
                const parsed = JSON.parse(dataStr);
                callbacks.onDelta(
                  typeof parsed === 'string' ? parsed : parsed.text || parsed.delta || '',
                );
              } catch {
                callbacks.onDelta(dataStr);
              }
            } else if (currentEvent === 'citations') {
              try {
                const citations = JSON.parse(dataStr);
                callbacks.onCitations?.(Array.isArray(citations) ? citations : [citations]);
              } catch {
                // Ignore parsing error
              }
            } else if (currentEvent === 'done') {
              try {
                const doneData = JSON.parse(dataStr);
                callbacks.onDone?.(doneData);
              } catch {
                callbacks.onDone?.({});
              }
            } else if (currentEvent === 'error') {
              try {
                const errData = JSON.parse(dataStr);
                callbacks.onError?.(new Error(errData.message || 'Stream processing error'));
              } catch {
                callbacks.onError?.(new Error(dataStr));
              }
            } else {
              // Standard message fallback
              callbacks.onDelta(dataStr);
            }
          }
        }
      }

      callbacks.onDone?.({});
    } catch (err: unknown) {
      if (signal?.aborted) {
        return; // Normal cancellation
      }
      const error =
        err instanceof Error ? err : new Error('Failed to complete streaming conversation');
      callbacks.onError?.(error);
    }
  },
};
