export const AI_KNOWLEDGE_QUEUES = {
  REPOSITORY: 'ai-repository-analysis',
  COMMIT: 'ai-commit-analysis',
  PULL_REQUEST: 'ai-pr-analysis',
  ISSUE: 'ai-issue-analysis',
  DOCUMENT: 'ai-document-analysis',
  RETRY: 'ai-retry',
  DEAD_LETTER: 'ai-dead-letter',
} as const;

export const AI_KNOWLEDGE_JOBS = {
  ANALYZE_REPOSITORY: 'analyze-repository',
  ANALYZE_COMMIT: 'analyze-commit',
  ANALYZE_PULL_REQUEST: 'analyze-pull-request',
  ANALYZE_ISSUE: 'analyze-issue',
  ANALYZE_DOCUMENT: 'analyze-document',
  RETRY_ANALYSIS: 'retry-analysis',
  DEAD_LETTER: 'dead-letter',
} as const;

export const AI_KNOWLEDGE_METADATA_KEYS = {
  extraction: 'aiExtraction',
  repositoryInsights: 'aiRepositoryInsights',
} as const;

/**
 * Free-tier safe defaults.
 * - light scope: only repository + docs (a few Gemini calls)
 * - full scope: every commit/PR/issue (can burn thousands of requests)
 * - minProviderGapMs: serialize Gemini calls (~12/min max)
 */
export const AI_KNOWLEDGE_LIMITS = {
  maxInputCharacters: 16_000,
  maxRetries: 2,
  backoffDelayMs: 15_000,
  workerConcurrency: 1,
  maxProviderFailovers: 1,
  maxBatchDocuments: 20,
  /** Minimum delay between LLM API calls (free-tier friendly). Local Ollama can be lower. */
  minProviderGapMs: 1_000,
  /** Max recent commits/PRs/issues when scope=recent */
  recentEntityLimit: 10,
} as const;

export type AiExtractionScope = 'light' | 'recent' | 'full';

export const AI_EXTRACTION_SCOPES = {
  LIGHT: 'light',
  RECENT: 'recent',
  FULL: 'full',
} as const satisfies Record<string, AiExtractionScope>;

export const AI_TOPIC_KEYWORDS: Record<string, string[]> = {
  authentication: ['auth', 'authentication', 'login', 'jwt', 'oauth'],
  payments: ['payment', 'stripe', 'invoice', 'billing'],
  redis: ['redis', 'ioredis'],
  docker: ['docker', 'container', 'dockerfile', 'compose'],
  oauth: ['oauth', 'github app', 'authorization code'],
  jwt: ['jwt', 'access token', 'refresh token'],
  security: ['security', 'secret', 'permission', 'csrf', 'xss'],
  caching: ['cache', 'cached', 'ttl'],
  queues: ['queue', 'bullmq', 'worker', 'job'],
  graphql: ['graphql', 'apollo'],
  rest: ['rest', 'controller', 'endpoint', 'http'],
  prisma: ['prisma', '@prisma/client'],
  postgresql: ['postgres', 'postgresql', 'pg'],
  bullmq: ['bullmq', '@nestjs/bullmq'],
  cicd: ['github actions', 'workflow', 'ci', 'cd', 'pipeline'],
  devops: ['deploy', 'infra', 'docker', 'kubernetes'],
  testing: ['jest', 'playwright', 'spec.ts', 'test'],
};

export const KNOWN_PROJECT_MODULES = [
  'authentication',
  'repository',
  'webhook',
  'knowledge',
  'ai',
  'notification',
  'search',
  'analytics',
  'identity',
  'workspace',
  'github',
  'health',
] as const;
