/**
 * AI Chat & RAG Conversation Types
 * Mapped to backend Chat module & Response DTOs.
 */

export type AIProvider =
  | 'gemini'
  | 'groq'
  | 'openai'
  | 'anthropic'
  | 'ollama'
  | 'cloudflare'
  | 'huggingface'
  | 'openrouter';

export interface Citation {
  index: number;
  knowledgeChunkId: string;
  knowledgeSourceId?: string | null;
  documentationId?: string | null;
  repositoryId?: string | null;
  repositoryName?: string | null;
  filePath?: string | null;
  externalRefId?: string | null;
  title?: string | null;
  excerpt: string;
  relevanceScore: number;
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sequenceNumber?: number;
  tokenCount?: number | null;
  createdAt: string;
  citations?: Citation[];
  isStreaming?: boolean;
  status?: 'sending' | 'sent' | 'streaming' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  workspaceId: string;
  repositoryId?: string | null;
  repositoryName?: string | null;
  messageCount: number;
  messages?: ChatMessage[];
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationListResponse {
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ChatRequestPayload {
  workspaceId: string;
  query: string;
  conversationId?: string;
  repositoryIds?: string[];
  provider?: string;
  topK?: number;
  temperature?: number;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  answer: string;
  citations: Citation[];
  sources?: Array<{
    repositoryId?: string | null;
    repositoryName?: string | null;
    filePath?: string | null;
    title?: string | null;
    relevanceScore: number;
  }>;
  confidence?: number;
  providerUsed?: string;
  modelUsed?: string;
  executionTimeMs?: number;
}
