-- AI Domain (Phase 7)
-- Conversation, Message, AIResponse, PromptHistory, ModelUsage, ConversationMemory, PinnedConversation
-- Also extends citations with message / AI response links.

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "PromptType" AS ENUM ('SYSTEM', 'USER', 'RETRIEVAL', 'TOOL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AiFinishReason" AS ENUM ('STOP', 'LENGTH', 'TOOL_CALL', 'CONTENT_FILTER', 'ERROR');

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "repository_id" UUID,
    "title" VARCHAR(512),
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "ai_provider" VARCHAR(64),
    "ai_model" VARCHAR(128),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "token_count" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_responses" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "finish_reason" "AiFinishReason",
    "latency_ms" INTEGER,
    "provider_request_id" VARCHAR(255),
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_history" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "message_id" UUID,
    "prompt_type" "PromptType" NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_usages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "message_id" UUID,
    "ai_response_id" UUID,
    "provider" VARCHAR(64) NOT NULL,
    "model" VARCHAR(128) NOT NULL,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DECIMAL(10,6),
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_memories" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pinned_conversations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "pinned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pinned_conversations_pkey" PRIMARY KEY ("id")
);

-- AlterTable: link citations to AI messages
ALTER TABLE "citations" ADD COLUMN "message_id" UUID;
ALTER TABLE "citations" ADD COLUMN "ai_response_id" UUID;

-- CreateIndex
CREATE INDEX "idx_conversations_workspace_id" ON "conversations"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_conversations_user_id" ON "conversations"("user_id");

-- CreateIndex
CREATE INDEX "idx_conversations_repository_id" ON "conversations"("repository_id");

-- CreateIndex
CREATE INDEX "idx_conversations_status" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "idx_conversations_deleted_at" ON "conversations"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_messages_conversation_sequence" ON "messages"("conversation_id", "sequence_number");

-- CreateIndex
CREATE INDEX "idx_messages_role" ON "messages"("role");

-- CreateIndex
CREATE INDEX "idx_messages_created_at" ON "messages"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_responses_message_id_key" ON "ai_responses"("message_id");

-- CreateIndex
CREATE INDEX "idx_ai_responses_finish_reason" ON "ai_responses"("finish_reason");

-- CreateIndex
CREATE INDEX "idx_prompt_history_conversation_id" ON "prompt_history"("conversation_id");

-- CreateIndex
CREATE INDEX "idx_prompt_history_message_id" ON "prompt_history"("message_id");

-- CreateIndex
CREATE INDEX "idx_prompt_history_prompt_type" ON "prompt_history"("prompt_type");

-- CreateIndex
CREATE INDEX "idx_model_usages_conversation_id" ON "model_usages"("conversation_id");

-- CreateIndex
CREATE INDEX "idx_model_usages_provider_model" ON "model_usages"("provider", "model");

-- CreateIndex
CREATE INDEX "idx_model_usages_created_at" ON "model_usages"("created_at");

-- CreateIndex
CREATE INDEX "idx_conversation_memories_conversation_id" ON "conversation_memories"("conversation_id");

-- CreateIndex
CREATE INDEX "idx_conversation_memories_importance" ON "conversation_memories"("importance");

-- CreateIndex
CREATE INDEX "idx_conversation_memories_expires_at" ON "conversation_memories"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_pinned_conversations_user_conversation" ON "pinned_conversations"("user_id", "conversation_id");

-- CreateIndex
CREATE INDEX "idx_pinned_conversations_pinned_at" ON "pinned_conversations"("pinned_at");

-- CreateIndex
CREATE INDEX "idx_citations_message_id" ON "citations"("message_id");

-- CreateIndex
CREATE INDEX "idx_citations_ai_response_id" ON "citations"("ai_response_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_responses" ADD CONSTRAINT "ai_responses_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_history" ADD CONSTRAINT "prompt_history_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_history" ADD CONSTRAINT "prompt_history_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_usages" ADD CONSTRAINT "model_usages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_usages" ADD CONSTRAINT "model_usages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_usages" ADD CONSTRAINT "model_usages_ai_response_id_fkey" FOREIGN KEY ("ai_response_id") REFERENCES "ai_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_memories" ADD CONSTRAINT "conversation_memories_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_conversations" ADD CONSTRAINT "pinned_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_conversations" ADD CONSTRAINT "pinned_conversations_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citations" ADD CONSTRAINT "citations_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citations" ADD CONSTRAINT "citations_ai_response_id_fkey" FOREIGN KEY ("ai_response_id") REFERENCES "ai_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
