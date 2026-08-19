-- Knowledge Domain (Phase 6)
-- KnowledgeSource, Documentation, KnowledgeChunk, Embedding, Citation

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('COMMIT', 'PULL_REQUEST', 'ISSUE', 'RELEASE', 'DOCUMENTATION', 'REPOSITORY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DocumentationType" AS ENUM ('README', 'WIKI', 'MARKDOWN', 'ADR', 'CHANGELOG', 'API_DOC', 'OTHER');

-- CreateTable
CREATE TABLE "knowledge_sources" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID,
    "source_type" "KnowledgeSourceType" NOT NULL,
    "external_ref_id" VARCHAR(255) NOT NULL,
    "internal_ref_id" UUID,
    "title" VARCHAR(512),
    "url" VARCHAR(2048),
    "path" VARCHAR(1024),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentation" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "content" TEXT,
    "file_path" VARCHAR(1024),
    "type" "DocumentationType" NOT NULL DEFAULT 'OTHER',
    "provider_doc_id" VARCHAR(255),
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID,
    "knowledge_source_id" UUID,
    "documentation_id" UUID,
    "content" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "token_count" INTEGER,
    "content_hash" VARCHAR(64),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" UUID NOT NULL,
    "knowledge_chunk_id" UUID NOT NULL,
    "model" VARCHAR(128) NOT NULL,
    "dimensions" INTEGER NOT NULL DEFAULT 1536,
    "vector" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citations" (
    "id" UUID NOT NULL,
    "knowledge_chunk_id" UUID NOT NULL,
    "knowledge_source_id" UUID,
    "excerpt" TEXT NOT NULL,
    "start_offset" INTEGER,
    "end_offset" INTEGER,
    "relevance_score" DOUBLE PRECISION,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_knowledge_sources_workspace_type_ref" ON "knowledge_sources"("workspace_id", "source_type", "external_ref_id");

-- CreateIndex
CREATE INDEX "idx_knowledge_sources_repository_id" ON "knowledge_sources"("repository_id");

-- CreateIndex
CREATE INDEX "idx_knowledge_sources_source_type" ON "knowledge_sources"("source_type");

-- CreateIndex
CREATE UNIQUE INDEX "uq_documentation_repository_file_path" ON "documentation"("repository_id", "file_path");

-- CreateIndex
CREATE INDEX "idx_documentation_type" ON "documentation"("type");

-- CreateIndex
CREATE UNIQUE INDEX "uq_knowledge_chunks_source_index" ON "knowledge_chunks"("knowledge_source_id", "chunk_index");

-- CreateIndex
CREATE UNIQUE INDEX "uq_knowledge_chunks_documentation_index" ON "knowledge_chunks"("documentation_id", "chunk_index");

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_repository_id" ON "knowledge_chunks"("repository_id");

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_documentation_id" ON "knowledge_chunks"("documentation_id");

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_content_hash" ON "knowledge_chunks"("content_hash");

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_deleted_at" ON "knowledge_chunks"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "embeddings_knowledge_chunk_id_key" ON "embeddings"("knowledge_chunk_id");

-- CreateIndex
CREATE INDEX "idx_embeddings_model" ON "embeddings"("model");

-- CreateIndex
CREATE INDEX "idx_citations_knowledge_source_id" ON "citations"("knowledge_source_id");

-- CreateIndex
CREATE INDEX "idx_citations_relevance_score" ON "citations"("relevance_score");

-- AddForeignKey
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentation" ADD CONSTRAINT "documentation_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_knowledge_source_id_fkey" FOREIGN KEY ("knowledge_source_id") REFERENCES "knowledge_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_documentation_id_fkey" FOREIGN KEY ("documentation_id") REFERENCES "documentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_knowledge_chunk_id_fkey" FOREIGN KEY ("knowledge_chunk_id") REFERENCES "knowledge_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citations" ADD CONSTRAINT "citations_knowledge_chunk_id_fkey" FOREIGN KEY ("knowledge_chunk_id") REFERENCES "knowledge_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citations" ADD CONSTRAINT "citations_knowledge_source_id_fkey" FOREIGN KEY ("knowledge_source_id") REFERENCES "knowledge_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
