import { registerAs } from '@nestjs/config';

/**
 * AI Configuration — hybrid digest pipeline.
 *
 * Default billing mode: free_only
 * Free cloud order:
 *   Groq → OpenRouter (:free) → HuggingFace → Cloudflare → Gemini
 * Then heuristics. Ollama only as non-production last resort.
 * OpenAI / Anthropic are paid and skipped unless AI_BILLING_MODE=mixed|paid.
 */
export default registerAs('ai', () => ({
  defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'groq',
  /** free_only | mixed | paid */
  billingMode: (process.env.AI_BILLING_MODE || 'free_only').toLowerCase(),
  extractionMode: (process.env.AI_EXTRACTION_MODE || 'light').toLowerCase(),
  providerFallback:
    (process.env.AI_PROVIDER_FALLBACK || 'true').toLowerCase() !== 'false',
  digestBatchSize: parseInt(process.env.DIGEST_BATCH_SIZE || '10', 10),
  prBatchSize: parseInt(process.env.PR_BATCH_SIZE || '5', 10),
  maxAiRetries: parseInt(process.env.MAX_AI_RETRIES || '3', 10),

  groq: {
    apiKey: process.env.GROQ_API_KEY,
    // Free-tier Groq model
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    // Auto-selects a live free model on OpenRouter
    model: process.env.OPENROUTER_MODEL || 'openrouter/free',
  },

  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
    baseUrl:
      process.env.HUGGINGFACE_BASE_URL ||
      'https://router.huggingface.co/v1/chat/completions',
  },

  cloudflare: {
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    // Workers AI free-quota model
    model: process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    orgId: process.env.OPENAI_ORG_ID,
    // Still paid — only used when AI_BILLING_MODE=mixed|paid
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    // Still paid — only used when AI_BILLING_MODE=mixed|paid
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  },

  gemini: {
    apiKey: process.env.GOOGLE_AI_API_KEY,
    // Gemini free-tier flash model
    model: process.env.GOOGLE_AI_MODEL || 'gemini-2.0-flash',
  },

  ollama: {
    enabled:
      process.env.NODE_ENV !== 'production' &&
      (process.env.OLLAMA_ENABLED || 'false').toLowerCase() === 'true',
    allowInProduction: false,
    baseUrl:
      process.env.OLLAMA_URL ||
      process.env.OLLAMA_BASE_URL ||
      'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2:1b',
  },

  embeddings: {
    provider: process.env.EMBEDDING_PROVIDER || 'openai',
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1536', 10),
  },
}));
