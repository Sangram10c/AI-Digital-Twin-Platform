import { ConfigService } from '@nestjs/config';
import { EmbeddingProvider } from '../interfaces/embeddings.interfaces';
import {
  EMBEDDING_DEFAULTS,
  EMBEDDING_MODEL_OWNERS,
  EMBEDDING_PROVIDER_MODELS,
  EmbeddingProviderName,
} from '../constants/embeddings.constants';
import { GeminiEmbeddingProvider } from './gemini-embedding.provider';
import { GroqEmbeddingProvider } from './groq-embedding.provider';
import { LocalEmbeddingProvider } from './local-embedding.provider';
import { MockEmbeddingProvider } from './mock-embedding.provider';
import { NomicEmbeddingProvider } from './nomic-embedding.provider';
import { OpenAiEmbeddingProvider } from './openai-embedding.provider';
import { VoyageEmbeddingProvider } from './voyage-embedding.provider';

/** Retired Gemini IDs → current Generative Language API model. */
const GEMINI_MODEL_ALIASES: Record<string, string> = {
  'text-embedding-004': 'gemini-embedding-001',
  'embedding-001': 'gemini-embedding-001',
  'models/text-embedding-004': 'gemini-embedding-001',
  'models/embedding-001': 'gemini-embedding-001',
};

/**
 * Resolve EMBEDDING_MODEL for the selected provider.
 * Ignores cross-provider / mock / retired model names so a single env var
 * cannot send e.g. mock-embedding-v1 to Groq or text-embedding-004 to Gemini.
 */
export function resolveEmbeddingModel(
  provider: EmbeddingProviderName,
  configured?: string,
): string {
  const fallback = EMBEDDING_PROVIDER_MODELS[provider].model;
  const value = configured?.trim();
  if (!value) return fallback;

  if (provider !== 'mock' && value.toLowerCase().startsWith('mock')) {
    return fallback;
  }

  if (provider === 'gemini') {
    const key = value.replace(/^models\//, '');
    return (
      GEMINI_MODEL_ALIASES[value] ??
      GEMINI_MODEL_ALIASES[key] ??
      (key.startsWith('text-embedding-') ? fallback : key)
    );
  }

  const owner = EMBEDDING_MODEL_OWNERS[value];
  if (owner && owner !== provider) {
    return fallback;
  }

  return value;
}

export function createEmbeddingProvider(
  config: ConfigService,
  override?: EmbeddingProviderName,
): EmbeddingProvider {
  const name = (
    override ??
    config.get<string>('ai.embeddings.provider') ??
    process.env.EMBEDDING_PROVIDER ??
    'mock'
  ).toLowerCase() as EmbeddingProviderName;

  const dims =
    config.get<number>('ai.embeddings.dimensions') ??
    EMBEDDING_DEFAULTS.dimensions;
  const configuredModel =
    config.get<string>('ai.embeddings.model') ?? process.env.EMBEDDING_MODEL;
  const model = resolveEmbeddingModel(name, configuredModel);

  switch (name) {
    case 'groq':
      return new GroqEmbeddingProvider(
        (
          config.get<string>('ai.groq.apiKey') ||
          process.env.GROQ_API_KEY ||
          ''
        ).trim(),
        model,
        dims,
      );
    case 'openai':
      return new OpenAiEmbeddingProvider(
        config.get<string>('ai.openai.apiKey') ?? '',
        model,
        dims,
        config.get<string>('ai.openai.orgId'),
      );
    case 'gemini':
      return new GeminiEmbeddingProvider(
        config.get<string>('ai.gemini.apiKey') ?? '',
        model,
        dims,
      );
    case 'voyage':
      return new VoyageEmbeddingProvider(
        (
          config.get<string>('ai.embeddings.voyageApiKey') ||
          process.env.VOYAGE_API_KEY ||
          ''
        ).trim(),
        model,
        dims,
      );
    case 'nomic':
      return new NomicEmbeddingProvider(
        (
          config.get<string>('ai.embeddings.nomicApiKey') ||
          process.env.NOMIC_API_KEY ||
          ''
        ).trim(),
        model,
        dims,
      );
    case 'local':
      return new LocalEmbeddingProvider(
        config.get<string>('ai.ollama.baseUrl') ?? 'http://127.0.0.1:11434',
        model,
        dims,
      );
    case 'mock':
    default:
      return new MockEmbeddingProvider(model || 'mock-embedding-v1', dims);
  }
}
