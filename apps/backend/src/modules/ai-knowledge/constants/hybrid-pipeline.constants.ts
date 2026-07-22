export const HYBRID_QUEUES = {
  HEURISTICS: 'hybrid-heuristics',
  DIGEST_BUILDER: 'hybrid-digest-builder',
  AI_EXTRACTION: 'hybrid-ai-extraction',
  EMBEDDINGS: 'hybrid-embeddings',
} as const;

export const HYBRID_JOBS = {
  RUN_HEURISTICS: 'run-heuristics',
  BUILD_DIGESTS: 'build-digests',
  EXTRACT_AI: 'extract-ai',
  EMBED_STUB: 'embed-stub',
} as const;

export enum AIExtractionMode {
  HEURISTICS_ONLY = 'HEURISTICS_ONLY',
  LIGHT = 'LIGHT',
  FULL = 'FULL',
}

/**
 * Free-tier cloud providers (tried one-by-one).
 * Paid providers (openai, anthropic) are only appended when AI_BILLING_MODE != free_only.
 * Ollama is NEVER in this list — non-production last resort after heuristics.
 */
export const AI_FREE_PROVIDER_PRIORITY = [
  'groq',
  'openrouter',
  'huggingface',
  'cloudflare',
  'gemini',
] as const;

export const AI_PAID_PROVIDERS = ['openai', 'anthropic'] as const;

export const AI_CLOUD_PROVIDER_PRIORITY = [
  ...AI_FREE_PROVIDER_PRIORITY,
  ...AI_PAID_PROVIDERS,
] as const;

/** @deprecated Use AI_CLOUD_PROVIDER_PRIORITY — kept for import compatibility */
export const AI_PROVIDER_PRIORITY = AI_CLOUD_PROVIDER_PRIORITY;

export const HYBRID_DEFAULTS = {
  digestBatchSize: 10,
  prBatchSize: 5,
  maxAiRetries: 3,
  providerFallback: true,
  /** Below this confidence, heuristics is treated as insufficient → try Ollama (non-prod). */
  heuristicsMinConfidence: 0.15,
} as const;
