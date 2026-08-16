// ============================================================
// Chat Module — Constants
// ============================================================

import type { SupportedAiProvider } from '../../ai-knowledge/interfaces/ai-knowledge.interfaces';

export const CHAT_DEFAULTS = {
  /** Default number of retrieved knowledge chunks. */
  topK: 10,
  /** Maximum conversation history messages injected into prompt. */
  maxHistoryMessages: 10,
  /** Rough character-to-token ratio used for budget estimation. */
  charsPerToken: 4,
  /** Fallback context-window limit when provider is unknown. */
  defaultMaxContextTokens: 4096,
  /** Max answer tokens allocated for response generation. */
  answerTokenBudget: 1024,
  /** Minimum citations required for full confidence score. */
  minCitationsForFullConfidence: 3,
  /** Default AI provider for chat (chat-optimised, free tier). */
  defaultProvider: 'groq' as SupportedAiProvider,
  /** Title auto-generated from first user message (max chars). */
  autoTitleMaxChars: 80,
  /** Max conversation title length stored in DB. */
  maxTitleLength: 512,
} as const;

/** Per-provider approximate context window token limits. */
export const PROVIDER_CONTEXT_LIMITS: Record<SupportedAiProvider, number> = {
  groq: 8192,
  openrouter: 8192,
  huggingface: 4096,
  cloudflare: 4096,
  gemini: 32768,
  openai: 16384,
  anthropic: 100000,
  ollama: 4096,
} as const;

/** Chat module queue names (future async processing). */
export const CHAT_QUEUE = 'chat-async' as const;

/** Prompt version — increment when prompt template changes. */
export const CHAT_PROMPT_VERSION = 1 as const;

/** SSE event type labels. */
export const SSE_EVENTS = {
  DELTA: 'delta',
  CITATIONS: 'citations',
  DONE: 'done',
  ERROR: 'error',
} as const;
