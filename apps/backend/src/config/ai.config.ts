import { registerAs } from '@nestjs/config';

/**
 * AI Configuration
 *
 * Provider-based architecture supporting:
 * - OpenAI
 * - Anthropic
 * - Google Gemini
 * - Ollama (local)
 */
export default registerAs('ai', () => ({
  defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'openai',

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    orgId: process.env.OPENAI_ORG_ID,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  },

  gemini: {
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: process.env.GOOGLE_AI_MODEL || 'gemini-2.0-flash',
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3',
  },

  embeddings: {
    provider: process.env.EMBEDDING_PROVIDER || 'openai',
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1536', 10),
  },
}));
