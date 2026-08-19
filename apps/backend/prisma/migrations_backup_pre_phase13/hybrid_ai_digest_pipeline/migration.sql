-- Hybrid AI digest / heuristics pipeline tables
-- Applied via prisma db push; kept here for documentation and environments that apply SQL manually.

CREATE TYPE "DigestKind" AS ENUM ('REPOSITORY', 'MODULE', 'PULL_REQUEST', 'DOCUMENTATION', 'RELEASE');
CREATE TYPE "AIExtractionMode" AS ENUM ('HEURISTICS_ONLY', 'LIGHT', 'FULL');
CREATE TYPE "AIAnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED', 'HEURISTICS_FALLBACK');

ALTER TYPE "BackgroundJobType" ADD VALUE IF NOT EXISTS 'HEURISTICS_EXTRACTION';
ALTER TYPE "BackgroundJobType" ADD VALUE IF NOT EXISTS 'DIGEST_BUILDER';
ALTER TYPE "BackgroundJobType" ADD VALUE IF NOT EXISTS 'AI_EXTRACTION';

-- Tables created by Prisma schema models:
-- heuristic_metadata, repository_digests, module_digests, pull_request_digests,
-- documentation_digests, release_digests, digest_checksums, ai_analyses,
-- provider_executions, provider_failures, ai_execution_logs
