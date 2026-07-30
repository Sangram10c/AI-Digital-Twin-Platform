import { registerAs } from '@nestjs/config';

export default registerAs('knowledge', () => ({
  sourceCodeEnabled:
    (process.env.KNOWLEDGE_SOURCE_CODE_ENABLED || 'true').toLowerCase() !==
    'false',
  sourceCodeMaxFiles: parseInt(
    process.env.KNOWLEDGE_SOURCE_CODE_MAX_FILES || '80',
    10,
  ),
  sourceCodeMaxFileBytes: parseInt(
    process.env.KNOWLEDGE_SOURCE_CODE_MAX_FILE_BYTES || String(200 * 1024),
    10,
  ),
  sourceCodeFetchGapMs: parseInt(
    process.env.KNOWLEDGE_SOURCE_CODE_FETCH_GAP_MS || '50',
    10,
  ),
  /** When GitHub token can't read contents (401), walk local monorepo paths in dev. */
  sourceCodeAllowLocal:
    (process.env.KNOWLEDGE_SOURCE_CODE_ALLOW_LOCAL || 'true').toLowerCase() !==
    'false',
  sourceCodeLocalRoot: process.env.KNOWLEDGE_SOURCE_CODE_LOCAL_ROOT || '',
}));
