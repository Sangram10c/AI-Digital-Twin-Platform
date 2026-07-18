export const KNOWLEDGE_QUEUES = {
  REPOSITORY: 'knowledge-repository',
  COMMIT: 'knowledge-commit',
  PULL_REQUEST: 'knowledge-pull-request',
  ISSUE: 'knowledge-issue',
  README: 'knowledge-readme',
  CHUNK_GENERATION: 'knowledge-chunk-generation',
  DEAD_LETTER: 'knowledge-dead-letter',
} as const;

export const KNOWLEDGE_JOBS = {
  PROCESS_REPOSITORY: 'process-repository',
  PROCESS_COMMIT: 'process-commit',
  PROCESS_PULL_REQUEST: 'process-pull-request',
  PROCESS_ISSUE: 'process-issue',
  PROCESS_README: 'process-readme',
  GENERATE_CHUNKS: 'generate-chunks',
  DEAD_LETTER: 'dead-letter',
} as const;

export const DEFAULT_KNOWLEDGE_LIMITS = {
  maxChunkSize: 1800,
  minChunkSize: 120,
  maxFileSizeBytes: 512 * 1024,
  batchSize: 50,
  maxRetries: 5,
  backoffDelayMs: 2000,
  workerConcurrency: 3,
  tokenEstimateRatio: 4,
} as const;

export const KNOWLEDGE_METADATA_KEYS = {
  processingStatus: 'processingStatus',
  contentChecksum: 'contentChecksum',
  lastProcessedAt: 'lastProcessedAt',
  rawContent: 'rawContent',
  documentType: 'documentType',
  detectedLanguage: 'detectedLanguage',
  languageKind: 'languageKind',
  author: 'author',
  labels: 'labels',
  branch: 'branch',
  commitSha: 'commitSha',
  prNumber: 'prNumber',
  issueNumber: 'issueNumber',
  filePath: 'filePath',
  sourceCreatedAt: 'sourceCreatedAt',
  sourceUpdatedAt: 'sourceUpdatedAt',
  chunkCount: 'chunkCount',
  processingError: 'processingError',
  version: 'version',
} as const;
