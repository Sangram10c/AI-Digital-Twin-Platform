-- Phase 10: Hybrid Search Engine — FTS + pgvector indexes
-- Safe to re-run (IF NOT EXISTS / OR REPLACE).

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text document column on knowledge chunks
ALTER TABLE "knowledge_chunks"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Backfill existing rows
UPDATE "knowledge_chunks"
SET "search_vector" = to_tsvector(
  'english',
  coalesce("content", '')
)
WHERE "search_vector" IS NULL
  AND "deleted_at" IS NULL;

-- Keep search_vector in sync on content changes
CREATE OR REPLACE FUNCTION knowledge_chunks_search_vector_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_knowledge_chunks_search_vector ON "knowledge_chunks";
CREATE TRIGGER trg_knowledge_chunks_search_vector
  BEFORE INSERT OR UPDATE OF content
  ON "knowledge_chunks"
  FOR EACH ROW
  EXECUTE PROCEDURE knowledge_chunks_search_vector_trigger();

-- GIN index for FTS
CREATE INDEX IF NOT EXISTS "idx_knowledge_chunks_search_vector_gin"
  ON "knowledge_chunks"
  USING GIN ("search_vector");

-- Trigram support for prefix / fuzzy path filters
CREATE INDEX IF NOT EXISTS "idx_knowledge_chunks_content_trgm"
  ON "knowledge_chunks"
  USING GIN ("content" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_knowledge_chunks_workspace_id"
  ON "knowledge_chunks" ("workspace_id");

CREATE INDEX IF NOT EXISTS "idx_knowledge_chunks_ws_repo_deleted"
  ON "knowledge_chunks" ("workspace_id", "repository_id", "deleted_at");

-- JSONB metadata filters (language, framework, module, directory, tags, …)
CREATE INDEX IF NOT EXISTS "idx_knowledge_chunks_metadata_gin"
  ON "knowledge_chunks"
  USING GIN ("metadata" jsonb_path_ops);

-- pgvector ANN index (cosine). Skip quietly if vector column missing.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'embeddings'
      AND column_name = 'vector'
  ) THEN
    EXECUTE $idx$
      CREATE INDEX IF NOT EXISTS "idx_embeddings_vector_hnsw"
      ON "embeddings"
      USING hnsw ("vector" vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
      WHERE "status" = 'COMPLETED' AND "vector" IS NOT NULL
    $idx$;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Skipping HNSW index: %', SQLERRM;
END $$;

-- Knowledge source filter helpers
CREATE INDEX IF NOT EXISTS "idx_knowledge_sources_path_trgm"
  ON "knowledge_sources"
  USING GIN ("path" gin_trgm_ops);

ANALYZE "knowledge_chunks";
ANALYZE "embeddings";
