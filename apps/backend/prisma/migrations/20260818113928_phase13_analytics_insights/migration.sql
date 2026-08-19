-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnalyticsSnapshotType" ADD VALUE 'KNOWLEDGE';
ALTER TYPE "AnalyticsSnapshotType" ADD VALUE 'CONVERSATION';
ALTER TYPE "AnalyticsSnapshotType" ADD VALUE 'JOB';
ALTER TYPE "AnalyticsSnapshotType" ADD VALUE 'RAG';
ALTER TYPE "AnalyticsSnapshotType" ADD VALUE 'EMBEDDING';

-- DropIndex
DROP INDEX "idx_embeddings_vector_hnsw";

-- DropIndex
DROP INDEX "idx_knowledge_chunks_content_trgm";

-- DropIndex
DROP INDEX "idx_knowledge_chunks_metadata_gin";

-- DropIndex
DROP INDEX "idx_knowledge_chunks_search_vector_gin";

-- DropIndex
DROP INDEX "idx_knowledge_sources_path_trgm";

-- AlterTable
ALTER TABLE "analytics_snapshots" ADD COLUMN     "repository_id" UUID;

-- CreateIndex
CREATE INDEX "idx_analytics_snapshots_repository_id" ON "analytics_snapshots"("repository_id");

-- CreateIndex
CREATE INDEX "idx_analytics_snapshots_ws_type_period" ON "analytics_snapshots"("workspace_id", "snapshot_type", "period_start");

-- AddForeignKey
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
