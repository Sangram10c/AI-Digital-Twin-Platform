-- Phase 10 / Hybrid Search & Vector Extension Indexes Restoration
-- Restores specialized GIN and pgvector HNSW indexes required for Hybrid Search and Embedding similarity queries.

-- Ensure required PostgreSQL extensions are enabled
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Full-Text Search GIN index on knowledge_chunks.search_vector (tsvector)
CREATE INDEX IF NOT EXISTS "idx_knowledge_chunks_search_vector_gin"
  ON "public"."knowledge_chunks"
  USING GIN ("search_vector");

-- 2. Trigram fuzzy search GIN index on knowledge_chunks.content using gin_trgm_ops
CREATE INDEX IF NOT EXISTS "idx_knowledge_chunks_content_trgm"
  ON "public"."knowledge_chunks"
  USING GIN ("content" gin_trgm_ops);

-- 3. JSONB path ops metadata GIN index on knowledge_chunks.metadata using jsonb_path_ops
CREATE INDEX IF NOT EXISTS "idx_knowledge_chunks_metadata_gin"
  ON "public"."knowledge_chunks"
  USING GIN ("metadata" jsonb_path_ops);

-- 4. Trigram file path search GIN index on knowledge_sources.path using gin_trgm_ops
CREATE INDEX IF NOT EXISTS "idx_knowledge_sources_path_trgm"
  ON "public"."knowledge_sources"
  USING GIN ("path" gin_trgm_ops);

-- 5. pgvector HNSW Approximate Nearest Neighbor index for cosine similarity on embeddings.vector (fail-fast)
CREATE INDEX IF NOT EXISTS "idx_embeddings_vector_hnsw"
  ON "public"."embeddings"
  USING hnsw ("vector" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE "status" = 'COMPLETED' AND "vector" IS NOT NULL;