import { registerAs } from '@nestjs/config';

export default registerAs('search', () => ({
  defaultTopK: parseInt(process.env.SEARCH_DEFAULT_TOP_K || '10', 10),
  maxTopK: parseInt(process.env.SEARCH_MAX_TOP_K || '50', 10),
  timeoutMs: parseInt(process.env.SEARCH_TIMEOUT_MS || '8000', 10),
  previewChars: parseInt(process.env.SEARCH_PREVIEW_CHARS || '280', 10),
  cacheTtlSeconds: parseInt(process.env.SEARCH_CACHE_TTL_SECONDS || '300', 10),
  embeddingCacheTtlSeconds: parseInt(
    process.env.SEARCH_EMBEDDING_CACHE_TTL_SECONDS || '3600',
    10,
  ),
  historyLimit: parseInt(process.env.SEARCH_HISTORY_LIMIT || '50', 10),
  weights: {
    semantic: parseFloat(process.env.SEARCH_WEIGHT_SEMANTIC || '0.55'),
    keyword: parseFloat(process.env.SEARCH_WEIGHT_KEYWORD || '0.25'),
    quality: parseFloat(process.env.SEARCH_WEIGHT_QUALITY || '0.1'),
    freshness: parseFloat(process.env.SEARCH_WEIGHT_FRESHNESS || '0.05'),
    repository: parseFloat(process.env.SEARCH_WEIGHT_REPOSITORY || '0.05'),
  },
  rrfK: parseInt(process.env.SEARCH_RRF_K || '60', 10),
  enableCache:
    (process.env.SEARCH_CACHE_ENABLED || 'true').toLowerCase() !== 'false',
}));
