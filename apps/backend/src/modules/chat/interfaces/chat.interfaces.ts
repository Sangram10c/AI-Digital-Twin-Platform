// ============================================================
// Chat Module — Interfaces
// ============================================================

import type { SupportedAiProvider } from '../../ai-knowledge/interfaces/ai-knowledge.interfaces';
import type { RankedSearchHit } from '../../search/interfaces/search.interfaces';

// ────────────────────────────────────────────────────────────
// Request / Input
// ────────────────────────────────────────────────────────────

export interface ChatRequest {
  userId: string;
  workspaceId: string;
  query: string;
  conversationId?: string;
  repositoryIds?: string[];
  provider?: SupportedAiProvider;
  stream?: boolean;
  topK?: number;
  temperature?: number;
}

// ────────────────────────────────────────────────────────────
// Citation
// ────────────────────────────────────────────────────────────

export interface CitationRef {
  /** Index (1-based) as referred to in the answer text [^1], [^2], etc. */
  index: number;
  knowledgeChunkId: string;
  knowledgeSourceId: string | null;
  documentationId: string | null;
  repositoryId: string | null;
  repositoryName: string | null;
  filePath: string | null;
  externalRefId: string | null;
  title: string | null;
  excerpt: string;
  relevanceScore: number;
  url?: string;
}

// ────────────────────────────────────────────────────────────
// Token Budget
// ────────────────────────────────────────────────────────────

export interface TokenBudgetContext {
  /** Chunks kept after trimming to fit within the context window. */
  chunks: RankedSearchHit[];
  /** History messages kept after trimming. */
  historyMessages: HistoryMessage[];
  estimatedTokens: number;
  maxTokens: number;
  chunksDropped: number;
  historyDropped: number;
}

// ────────────────────────────────────────────────────────────
// Prompt
// ────────────────────────────────────────────────────────────

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Token estimate for this message. */
  tokenEstimate: number;
}

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
  promptVersion: number;
  /** Estimated total token count of the full prompt. */
  estimatedTokens: number;
}

export interface PromptBuildInput {
  workspaceId: string;
  repositoryIds?: string[];
  userQuery: string;
  history: HistoryMessage[];
  chunks: RankedSearchHit[];
  provider?: SupportedAiProvider;
}

// ────────────────────────────────────────────────────────────
// AI Answer (parsed from provider raw output)
// ────────────────────────────────────────────────────────────

export interface ParsedAiAnswer {
  answer: string;
  confidence?: number;
  relatedFiles?: string[];
  relatedTopics?: string[];
}

// ────────────────────────────────────────────────────────────
// Chat Response
// ────────────────────────────────────────────────────────────

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  answer: string;
  citations: CitationRef[];
  sources: ChatSource[];
  confidence: number;
  providerUsed: SupportedAiProvider;
  modelUsed: string;
  executionTimeMs: number;
  tokenUsage: TokenUsage;
  promptVersion: number;
  fallbackUsed: boolean;
}

export interface ChatSource {
  repositoryId: string | null;
  repositoryName: string | null;
  filePath: string | null;
  title: string | null;
  relevanceScore: number;
  externalRefId: string | null;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ────────────────────────────────────────────────────────────
// SSE Streaming
// ────────────────────────────────────────────────────────────

export interface ChatStreamChunk {
  event: 'delta' | 'citations' | 'done' | 'error';
  data: string | CitationRef[] | ChatResponse | { message: string };
}
