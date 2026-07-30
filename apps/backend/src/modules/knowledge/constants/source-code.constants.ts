/** Source-code ingestion limits tuned for free GitHub + free/mock embeddings. */
export const SOURCE_CODE_INGEST = {
  enabledEnv: 'KNOWLEDGE_SOURCE_CODE_ENABLED',
  /** Cap files per repo to protect free GitHub rate limits. */
  maxFilesPerRepo: parseInt(
    process.env.KNOWLEDGE_SOURCE_CODE_MAX_FILES || '80',
    10,
  ),
  maxFileBytes: parseInt(
    process.env.KNOWLEDGE_SOURCE_CODE_MAX_FILE_BYTES || String(200 * 1024),
    10,
  ),
  /** Small pause between GitHub content fetches (ms). */
  fetchGapMs: parseInt(
    process.env.KNOWLEDGE_SOURCE_CODE_FETCH_GAP_MS || '50',
    10,
  ),
} as const;

export const SOURCE_CODE_EXTENSIONS = new Set([
  'ts',
  'tsx',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'py',
  'go',
  'rs',
  'java',
  'kt',
  'cs',
  'rb',
  'php',
  'swift',
]);

/** Directory segments to skip (case-insensitive path parts). */
export const SOURCE_CODE_SKIP_DIRS = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.next',
  '.turbo',
  'vendor',
  'out',
  'tmp',
  'temp',
  '__pycache__',
  '.cache',
  'storybook-static',
] as const;

/**
 * Higher score = ingested first (auth/JWT/identity before generic files).
 * Free-tier caps mean priority order matters.
 */
export const SOURCE_CODE_PRIORITY_PATTERNS: Array<{
  re: RegExp;
  score: number;
}> = [
  {
    re: /(^|\/)(auth|identity|jwt|passport|oauth|session|guard|strategy)(\/|$)/i,
    score: 100,
  },
  { re: /(jwt|auth|passport|guard|strategy)\.[jt]sx?$/i, score: 95 },
  // Embeddings/search must beat auth under free-tier maxFiles cap (80).
  { re: /(^|\/)(embeddings|search)(\/|$)/i, score: 120 },
  {
    re: /(embedding-storage|embedding-query|vector-search|pgvector)/i,
    score: 125,
  },
  { re: /(^|\/)apps\/backend\/src\//i, score: 70 },
  { re: /(^|\/)src\/(modules|lib|services|controllers|guards)\//i, score: 60 },
  { re: /(^|\/)(apps|packages)\//i, score: 40 },
  { re: /\.(spec|test)\.[jt]sx?$/i, score: 10 },
];

export function sourceCodePriority(path: string): number {
  let score = 20;
  for (const rule of SOURCE_CODE_PRIORITY_PATTERNS) {
    if (rule.re.test(path)) score = Math.max(score, rule.score);
  }
  return score;
}

export function isSkippableSourcePath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.toLowerCase().split('/');
  if (
    parts.some((p) => (SOURCE_CODE_SKIP_DIRS as readonly string[]).includes(p))
  ) {
    return true;
  }
  // lockfiles / generated
  if (/\.(lock|min\.js|map)$/i.test(normalized)) return true;
  if (/package-lock\.json$/i.test(normalized)) return true;
  return false;
}

export function hasSourceCodeExtension(path: string): boolean {
  const match = /\.([a-z0-9]+)$/i.exec(path);
  if (!match) return false;
  return SOURCE_CODE_EXTENSIONS.has(match[1].toLowerCase());
}
