export const REPOSITORY_QUEUES = {
  ENTITY_SYNC: 'repository-entity-sync',
  DOCUMENTATION_SYNC: 'repository-documentation-sync',
  PIPELINE: 'repository-pipeline',
  DEAD_LETTER: 'repository-dead-letter',
} as const;

export const REPOSITORY_JOBS = {
  SYNC_ENTITIES: 'sync-entities',
  SYNC_DOCUMENTATION: 'sync-documentation',
  RUN_PIPELINE: 'run-pipeline',
  DEAD_LETTER: 'dead-letter',
} as const;

export const DEFAULT_REPOSITORY_SYNC_LIMITS = {
  perPage: 100,
  maxPagesPerEntity: 50,
  maxDocFiles: 200,
  maxDocBytes: 512 * 1024,
  maxRetries: 5,
  backoffDelayMs: 2000,
  workerConcurrency: 2,
} as const;

export const DOCUMENTATION_ROOT_FILES = [
  'README.md',
  'README',
  'LICENSE',
  'LICENSE.md',
  'CHANGELOG.md',
  'CHANGELOG',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
] as const;

export const DOCUMENTATION_DIR_PREFIXES = [
  'docs/',
  'architecture/',
  'adr/',
  'design/',
  'api/',
  'wiki/',
  '.github/',
] as const;

export const DOCUMENTATION_SKIP_PARTS = [
  'node_modules/',
  'dist/',
  'build/',
  'coverage/',
  'vendor/',
  '.next/',
  'out/',
] as const;

export const DOCUMENTATION_SKIP_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.svg',
  '.mp4',
  '.mp3',
  '.pdf',
  '.zip',
  '.gz',
  '.tar',
  '.exe',
  '.dll',
  '.bin',
  '.woff',
  '.woff2',
  '.ttf',
] as const;
