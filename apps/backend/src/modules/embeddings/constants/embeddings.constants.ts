export const EMBEDDING_QUEUES = {
  EMBEDDINGS: 'embeddings',
} as const;

export const EMBEDDING_JOBS = {
  GENERATE: 'GENERATE_EMBEDDING',
  REGENERATE: 'REGENERATE_EMBEDDING',
  DELETE: 'DELETE_EMBEDDING',
  RETRY: 'RETRY_EMBEDDING',
  GENERATE_BATCH: 'GENERATE_EMBEDDING_BATCH',
} as const;

export type EmbeddingProviderName =
  'groq' | 'gemini' | 'openai' | 'voyage' | 'nomic' | 'local' | 'mock';

export const EMBEDDING_DEFAULTS = {
  batchSize: 20,
  maxRetries: 3,
  concurrency: 5,
  backoffDelayMs: 2000,
  version: 1,
  /** Matches OpenAI text-embedding-3-small + pgvector column. */
  dimensions: 1536,
  minProviderGapMs: 200,
} as const;

/**
 * Canonical model per provider (verified against each API).
 * Production default: openai + text-embedding-3-small (1536 dims).
 */
export const EMBEDDING_PROVIDER_MODELS: Record<
  EmbeddingProviderName,
  { model: string; nativeDims: number; forProduction: boolean }
> = {
  openai: {
    model: 'text-embedding-3-small',
    nativeDims: 1536,
    forProduction: true,
  },
  gemini: {
    model: 'gemini-embedding-001',
    nativeDims: 1536,
    forProduction: true,
  },
  voyage: {
    model: 'voyage-3-lite',
    nativeDims: 512,
    forProduction: true,
  },
  nomic: {
    model: 'nomic-embed-text-v1.5',
    nativeDims: 768,
    forProduction: false,
  },
  groq: {
    // Often unavailable on free Groq accounts (model_not_found).
    model: 'nomic-embed-text-v1_5',
    nativeDims: 768,
    forProduction: false,
  },
  local: {
    model: 'nomic-embed-text',
    nativeDims: 768,
    forProduction: false,
  },
  mock: {
    model: 'mock-embedding-v1',
    nativeDims: 1536,
    forProduction: false,
  },
};

/** Known model id → owning provider (used to ignore cross-provider EMBEDDING_MODEL). */
export const EMBEDDING_MODEL_OWNERS: Record<string, EmbeddingProviderName> = {
  'text-embedding-3-small': 'openai',
  'text-embedding-3-large': 'openai',
  'text-embedding-ada-002': 'openai',
  'gemini-embedding-001': 'gemini',
  'text-embedding-004': 'gemini',
  'embedding-001': 'gemini',
  'voyage-3-lite': 'voyage',
  'voyage-3': 'voyage',
  'voyage-3-large': 'voyage',
  'voyage-code-3': 'voyage',
  'nomic-embed-text-v1.5': 'nomic',
  'nomic-embed-text-v1_5': 'groq',
  'nomic-embed-text': 'local',
  'mock-embedding-v1': 'mock',
};

export const EMBEDDING_PROVIDER_TOKEN = Symbol('EMBEDDING_PROVIDER');
