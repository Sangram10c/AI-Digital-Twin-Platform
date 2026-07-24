-- Phase 09: Embedding pipeline — enhance embeddings table for providers, versioning, checksums.
DO $$ BEGIN
  CREATE TYPE "EmbeddingStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'SKIPPED',
    'DELETED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "embeddings"
  ADD COLUMN IF NOT EXISTS "provider" VARCHAR(64) NOT NULL DEFAULT 'mock',
  ADD COLUMN IF NOT EXISTS "embedding_version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "status" "EmbeddingStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "embedding_checksum" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "error_message" TEXT,
  ADD COLUMN IF NOT EXISTS "latency_ms" INTEGER,
  ADD COLUMN IF NOT EXISTS "token_usage" INTEGER,
  ADD COLUMN IF NOT EXISTS "retry_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "idx_embeddings_status" ON "embeddings"("status");
CREATE INDEX IF NOT EXISTS "idx_embeddings_provider" ON "embeddings"("provider");
CREATE INDEX IF NOT EXISTS "idx_embeddings_checksum" ON "embeddings"("embedding_checksum");
CREATE INDEX IF NOT EXISTS "idx_embeddings_version" ON "embeddings"("embedding_version");
