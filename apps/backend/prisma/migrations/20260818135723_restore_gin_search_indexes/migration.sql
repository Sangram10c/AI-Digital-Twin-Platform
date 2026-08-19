-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_search_vector_gin" ON "knowledge_chunks" USING GIN ("search_vector");

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_content_trgm" ON "knowledge_chunks" USING GIN ("content" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_metadata_gin" ON "knowledge_chunks" USING GIN ("metadata" jsonb_path_ops);

-- CreateIndex
CREATE INDEX "idx_knowledge_sources_path_trgm" ON "knowledge_sources" USING GIN ("path" gin_trgm_ops);
