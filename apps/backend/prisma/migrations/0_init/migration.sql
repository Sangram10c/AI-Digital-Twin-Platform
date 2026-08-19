-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public" VERSION "1.6";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog" VERSION "1.0";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public" VERSION "0.8.3";

-- CreateEnum
CREATE TYPE "public"."AIAnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED', 'HEURISTICS_FALLBACK');

-- CreateEnum
CREATE TYPE "public"."AIExtractionMode" AS ENUM ('HEURISTICS_ONLY', 'LIGHT', 'FULL');

-- CreateEnum
CREATE TYPE "public"."AiFinishReason" AS ENUM ('STOP', 'LENGTH', 'TOOL_CALL', 'CONTENT_FILTER', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."AnalyticsSnapshotType" AS ENUM ('REPOSITORY', 'DEVELOPER', 'AI', 'SEARCH', 'WORKSPACE', 'PLATFORM');

-- CreateEnum
CREATE TYPE "public"."BackgroundJobType" AS ENUM ('REPOSITORY_SYNC', 'EMBEDDING_GENERATION', 'NOTIFICATION_DELIVERY', 'ANALYTICS_AGGREGATION', 'CLEANUP', 'WEBHOOK_PROCESSING', 'HEURISTICS_EXTRACTION', 'DIGEST_BUILDER', 'AI_EXTRACTION');

-- CreateEnum
CREATE TYPE "public"."ConnectedAccountStatus" AS ENUM ('ACTIVE', 'DISCONNECTED', 'ERROR', 'TOKEN_EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'LOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."DigestKind" AS ENUM ('REPOSITORY', 'MODULE', 'PULL_REQUEST', 'DOCUMENTATION', 'RELEASE');

-- CreateEnum
CREATE TYPE "public"."DocumentationType" AS ENUM ('README', 'WIKI', 'MARKDOWN', 'ADR', 'CHANGELOG', 'API_DOC', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."EmbeddingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."GitProviderType" AS ENUM ('GITHUB', 'GITLAB', 'BITBUCKET');

-- CreateEnum
CREATE TYPE "public"."IssueState" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING');

-- CreateEnum
CREATE TYPE "public"."KnowledgeSourceType" AS ENUM ('COMMIT', 'PULL_REQUEST', 'ISSUE', 'RELEASE', 'DOCUMENTATION', 'REPOSITORY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM', 'REMINDER');

-- CreateEnum
CREATE TYPE "public"."PromptType" AS ENUM ('SYSTEM', 'USER', 'RETRIEVAL', 'TOOL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ProviderType" AS ENUM ('LOCAL', 'GOOGLE', 'GITHUB', 'MICROSOFT', 'SAML', 'OIDC');

-- CreateEnum
CREATE TYPE "public"."PullRequestState" AS ENUM ('OPEN', 'CLOSED', 'MERGED');

-- CreateEnum
CREATE TYPE "public"."RepositoryStatus" AS ENUM ('ACTIVE', 'SYNCING', 'ERROR', 'DISCONNECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ReviewState" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "public"."SearchType" AS ENUM ('KEYWORD', 'SEMANTIC', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."SyncTrigger" AS ENUM ('MANUAL', 'SCHEDULED', 'WEBHOOK', 'INITIAL');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."WebhookEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "public"."WebhookEventType" AS ENUM ('PUSH', 'PULL_REQUEST', 'ISSUE', 'RELEASE', 'INSTALLATION', 'REPOSITORY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."WorkspaceMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."WorkspaceStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'SUSPENDED', 'DELETED');

-- CreateTable
CREATE TABLE "public"."ai_analyses" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "digest_kind" "public"."DigestKind" NOT NULL,
    "mode" "public"."AIExtractionMode" NOT NULL DEFAULT 'LIGHT',
    "status" "public"."AIAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "repository_digest_id" UUID,
    "module_digest_id" UUID,
    "pull_request_digest_id" UUID,
    "documentation_digest_id" UUID,
    "release_digest_id" UUID,
    "provider" VARCHAR(64),
    "model" VARCHAR(128),
    "content_checksum" VARCHAR(64),
    "result" JSONB,
    "raw_text" TEXT,
    "latency_ms" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_execution_logs" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID,
    "mode" "public"."AIExtractionMode" NOT NULL DEFAULT 'LIGHT',
    "api_calls" INTEGER NOT NULL DEFAULT 0,
    "token_usage" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "failed_providers" INTEGER NOT NULL DEFAULT 0,
    "fallback_count" INTEGER NOT NULL DEFAULT 0,
    "digest_cache_hits" INTEGER NOT NULL DEFAULT 0,
    "heuristic_coverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_ai_time_ms" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_responses" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "finish_reason" "public"."AiFinishReason",
    "latency_ms" INTEGER,
    "provider_request_id" VARCHAR(255),
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics_snapshots" (
    "id" UUID NOT NULL,
    "workspace_id" UUID,
    "snapshot_type" "public"."AnalyticsSnapshotType" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL,
    "workspace_id" UUID,
    "user_id" UUID,
    "action" VARCHAR(128) NOT NULL,
    "entity_type" VARCHAR(128) NOT NULL,
    "entity_id" UUID,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(512),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."background_jobs" (
    "id" UUID NOT NULL,
    "workspace_id" UUID,
    "job_type" "public"."BackgroundJobType" NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "queue_job_id" VARCHAR(128),
    "payload" JSONB,
    "result" JSONB,
    "error_message" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."branches" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "last_commit_sha" VARCHAR(64),
    "provider_branch_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."citations" (
    "id" UUID NOT NULL,
    "knowledge_chunk_id" UUID NOT NULL,
    "knowledge_source_id" UUID,
    "message_id" UUID,
    "ai_response_id" UUID,
    "excerpt" TEXT NOT NULL,
    "start_offset" INTEGER,
    "end_offset" INTEGER,
    "relevance_score" DOUBLE PRECISION,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."commits" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "branch_id" UUID,
    "sha" VARCHAR(64) NOT NULL,
    "message" TEXT NOT NULL,
    "author_name" VARCHAR(255),
    "author_email" VARCHAR(320),
    "committed_at" TIMESTAMP(3) NOT NULL,
    "additions" INTEGER DEFAULT 0,
    "deletions" INTEGER DEFAULT 0,
    "changed_files" INTEGER DEFAULT 0,
    "parent_shas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provider_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."connected_accounts" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "git_provider_id" UUID NOT NULL,
    "oauth_token_id" UUID,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "provider_username" VARCHAR(255) NOT NULL,
    "provider_account_url" VARCHAR(2048),
    "provider_metadata" JSONB,
    "status" "public"."ConnectedAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMP(3),
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connected_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversation_memories" (
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
CREATE TABLE "public"."conversations" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "repository_id" UUID,
    "title" VARCHAR(512),
    "status" "public"."ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "ai_provider" VARCHAR(64),
    "ai_model" VARCHAR(128),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."digest_checksums" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "digest_kind" "public"."DigestKind" NOT NULL,
    "digest_key" VARCHAR(512) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digest_checksums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documentation" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "content" TEXT,
    "file_path" VARCHAR(1024),
    "type" "public"."DocumentationType" NOT NULL DEFAULT 'OTHER',
    "provider_doc_id" VARCHAR(255),
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documentation_digests" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "doc_key" VARCHAR(512) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "summary_text" TEXT NOT NULL,
    "content_checksum" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "entity_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentation_digests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."embeddings" (
    "id" UUID NOT NULL,
    "knowledge_chunk_id" UUID NOT NULL,
    "model" VARCHAR(128) NOT NULL,
    "dimensions" INTEGER NOT NULL DEFAULT 1536,
    "vector" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "embedding_checksum" VARCHAR(64),
    "embedding_version" INTEGER NOT NULL DEFAULT 1,
    "error_message" TEXT,
    "latency_ms" INTEGER,
    "provider" VARCHAR(64) NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."EmbeddingStatus" NOT NULL DEFAULT 'PENDING',
    "token_usage" INTEGER,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."git_providers" (
    "id" UUID NOT NULL,
    "type" "public"."GitProviderType" NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "display_name" VARCHAR(128) NOT NULL,
    "api_base_url" VARCHAR(512) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "git_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."heuristic_metadata" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "frameworks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "libraries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "databases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cloud_providers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cicd" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "feature_count" INTEGER NOT NULL DEFAULT 0,
    "bug_fix_count" INTEGER NOT NULL DEFAULT 0,
    "refactor_count" INTEGER NOT NULL DEFAULT 0,
    "security_count" INTEGER NOT NULL DEFAULT 0,
    "performance_count" INTEGER NOT NULL DEFAULT 0,
    "risk_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "folder_structure" JSONB,
    "relationships" JSONB,
    "raw_signals" JSONB,
    "content_checksum" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "heuristic_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."issues" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "body" TEXT,
    "state" "public"."IssueState" NOT NULL DEFAULT 'OPEN',
    "author_username" VARCHAR(255) NOT NULL,
    "provider_issue_id" VARCHAR(255) NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "provider_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."knowledge_chunks" (
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
    "search_vector" tsvector,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."knowledge_sources" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID,
    "source_type" "public"."KnowledgeSourceType" NOT NULL,
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
CREATE TABLE "public"."messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" "public"."MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "token_count" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."model_usages" (
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
CREATE TABLE "public"."module_digests" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "module_key" VARCHAR(255) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "summary_text" TEXT NOT NULL,
    "content_checksum" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "entity_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_digests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "type_preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "workspace_id" UUID,
    "user_id" UUID NOT NULL,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'INFO',
    "title" VARCHAR(512) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."oauth_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "public"."ProviderType" NOT NULL,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "access_token_encrypted" TEXT NOT NULL,
    "refresh_token_encrypted" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "token_type" VARCHAR(32) DEFAULT 'Bearer',
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provider_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pinned_conversations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "pinned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pinned_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prompt_history" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "message_id" UUID,
    "prompt_type" "public"."PromptType" NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_executions" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "ai_analysis_id" UUID,
    "provider" VARCHAR(64) NOT NULL,
    "model" VARCHAR(128),
    "success" BOOLEAN NOT NULL DEFAULT false,
    "latency_ms" INTEGER,
    "token_usage" INTEGER,
    "request_meta" JSONB,
    "response_meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_failures" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "ai_analysis_id" UUID,
    "provider" VARCHAR(64) NOT NULL,
    "error_code" VARCHAR(64),
    "error_message" TEXT NOT NULL,
    "retriable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_failures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pull_request_digests" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "batch_key" VARCHAR(255) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "summary_text" TEXT NOT NULL,
    "content_checksum" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "entity_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pull_request_digests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pull_requests" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "body" TEXT,
    "state" "public"."PullRequestState" NOT NULL DEFAULT 'OPEN',
    "source_branch" VARCHAR(255) NOT NULL,
    "target_branch" VARCHAR(255) NOT NULL,
    "author_username" VARCHAR(255) NOT NULL,
    "provider_pull_request_id" VARCHAR(255) NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "merged_at" TIMESTAMP(3),
    "provider_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pull_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" UUID,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_token_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."release_digests" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "release_key" VARCHAR(255) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "summary_text" TEXT NOT NULL,
    "content_checksum" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "entity_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "release_digests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."releases" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "tag_name" VARCHAR(255) NOT NULL,
    "name" VARCHAR(512),
    "body" TEXT,
    "is_prerelease" BOOLEAN NOT NULL DEFAULT false,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "provider_release_id" VARCHAR(255),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."repositories" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "connected_account_id" UUID NOT NULL,
    "git_provider_id" UUID NOT NULL,
    "provider_repository_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(512) NOT NULL,
    "description" TEXT,
    "url" VARCHAR(2048),
    "default_branch" VARCHAR(255) NOT NULL DEFAULT 'main',
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "is_fork" BOOLEAN NOT NULL DEFAULT false,
    "language" VARCHAR(64),
    "status" "public"."RepositoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_synced_at" TIMESTAMP(3),
    "provider_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."repository_contributors" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "commit_count" INTEGER NOT NULL DEFAULT 0,
    "last_contribution_at" TIMESTAMP(3),
    "provider_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_contributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."repository_digests" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "summary_text" TEXT NOT NULL,
    "content_checksum" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "entity_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_digests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."repository_statistics" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "star_count" INTEGER NOT NULL DEFAULT 0,
    "fork_count" INTEGER NOT NULL DEFAULT 0,
    "watcher_count" INTEGER NOT NULL DEFAULT 0,
    "open_issue_count" INTEGER NOT NULL DEFAULT 0,
    "open_pull_request_count" INTEGER NOT NULL DEFAULT 0,
    "commit_count" INTEGER NOT NULL DEFAULT 0,
    "contributor_count" INTEGER NOT NULL DEFAULT 0,
    "last_calculated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" UUID NOT NULL,
    "pull_request_id" UUID NOT NULL,
    "reviewer_username" VARCHAR(255) NOT NULL,
    "state" "public"."ReviewState" NOT NULL DEFAULT 'PENDING',
    "body" TEXT,
    "provider_review_id" VARCHAR(255),
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."saved_searches" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "query" VARCHAR(1024) NOT NULL,
    "search_type" "public"."SearchType" NOT NULL DEFAULT 'HYBRID',
    "search_filters" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_cache" (
    "id" UUID NOT NULL,
    "query_hash" VARCHAR(64) NOT NULL,
    "search_type" "public"."SearchType" NOT NULL,
    "results" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_histories" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "repository_id" UUID,
    "query" VARCHAR(1024) NOT NULL,
    "search_type" "public"."SearchType" NOT NULL,
    "results_count" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" INTEGER,
    "search_filters" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sync_histories" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "connected_account_id" UUID NOT NULL,
    "trigger" "public"."SyncTrigger" NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "repositories_synced" INTEGER NOT NULL DEFAULT 0,
    "commits_synced" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "metadata" JSONB,
    "job_id" VARCHAR(128),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "commit_sha" VARCHAR(64) NOT NULL,
    "provider_tag_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255),
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "display_name" VARCHAR(150),
    "avatar_url" VARCHAR(2048),
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "email_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "timezone" VARCHAR(64) DEFAULT 'UTC',
    "locale" VARCHAR(10) DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_events" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "connected_account_id" UUID NOT NULL,
    "provider_event_id" VARCHAR(255),
    "eventType" "public"."WebhookEventType" NOT NULL,
    "action" VARCHAR(64),
    "payload" JSONB NOT NULL,
    "signature_valid" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."WebhookEventStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_members" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "public"."WorkspaceMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_settings" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "default_ai_provider" VARCHAR(64),
    "default_ai_model" VARCHAR(128),
    "default_embedding_model" VARCHAR(128),
    "auto_sync_enabled" BOOLEAN NOT NULL DEFAULT true,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspaces" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "owner_id" UUID NOT NULL,
    "status" "public"."WorkspaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ai_analyses_digest_kind" ON "public"."ai_analyses"("digest_kind" ASC);

-- CreateIndex
CREATE INDEX "idx_ai_analyses_repository_id" ON "public"."ai_analyses"("repository_id" ASC);

-- CreateIndex
CREATE INDEX "idx_ai_analyses_status" ON "public"."ai_analyses"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_ai_analyses_workspace_id" ON "public"."ai_analyses"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_ai_execution_logs_repository_id" ON "public"."ai_execution_logs"("repository_id" ASC);

-- CreateIndex
CREATE INDEX "idx_ai_execution_logs_workspace_id" ON "public"."ai_execution_logs"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ai_responses_message_id_key" ON "public"."ai_responses"("message_id" ASC);

-- CreateIndex
CREATE INDEX "idx_ai_responses_finish_reason" ON "public"."ai_responses"("finish_reason" ASC);

-- CreateIndex
CREATE INDEX "idx_analytics_snapshots_period" ON "public"."analytics_snapshots"("period_start" ASC, "period_end" ASC);

-- CreateIndex
CREATE INDEX "idx_analytics_snapshots_snapshot_type" ON "public"."analytics_snapshots"("snapshot_type" ASC);

-- CreateIndex
CREATE INDEX "idx_analytics_snapshots_workspace_id" ON "public"."analytics_snapshots"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs"("action" ASC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs"("created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs"("entity_type" ASC, "entity_id" ASC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs"("user_id" ASC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_workspace_id" ON "public"."audit_logs"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "background_jobs_queue_job_id_key" ON "public"."background_jobs"("queue_job_id" ASC);

-- CreateIndex
CREATE INDEX "idx_background_jobs_job_type" ON "public"."background_jobs"("job_type" ASC);

-- CreateIndex
CREATE INDEX "idx_background_jobs_scheduled_at" ON "public"."background_jobs"("scheduled_at" ASC);

-- CreateIndex
CREATE INDEX "idx_background_jobs_status" ON "public"."background_jobs"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_background_jobs_workspace_id" ON "public"."background_jobs"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_branches_is_default" ON "public"."branches"("is_default" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_branches_repository_name" ON "public"."branches"("repository_id" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "idx_citations_ai_response_id" ON "public"."citations"("ai_response_id" ASC);

-- CreateIndex
CREATE INDEX "idx_citations_knowledge_source_id" ON "public"."citations"("knowledge_source_id" ASC);

-- CreateIndex
CREATE INDEX "idx_citations_message_id" ON "public"."citations"("message_id" ASC);

-- CreateIndex
CREATE INDEX "idx_citations_relevance_score" ON "public"."citations"("relevance_score" ASC);

-- CreateIndex
CREATE INDEX "idx_commits_author_email" ON "public"."commits"("author_email" ASC);

-- CreateIndex
CREATE INDEX "idx_commits_branch_id" ON "public"."commits"("branch_id" ASC);

-- CreateIndex
CREATE INDEX "idx_commits_committed_at" ON "public"."commits"("committed_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_commits_repository_sha" ON "public"."commits"("repository_id" ASC, "sha" ASC);

-- CreateIndex
CREATE INDEX "idx_connected_accounts_last_synced_at" ON "public"."connected_accounts"("last_synced_at" ASC);

-- CreateIndex
CREATE INDEX "idx_connected_accounts_status" ON "public"."connected_accounts"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_connected_accounts_user_id" ON "public"."connected_accounts"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_connected_accounts_workspace_provider_account" ON "public"."connected_accounts"("workspace_id" ASC, "git_provider_id" ASC, "provider_account_id" ASC);

-- CreateIndex
CREATE INDEX "idx_conversation_memories_conversation_id" ON "public"."conversation_memories"("conversation_id" ASC);

-- CreateIndex
CREATE INDEX "idx_conversation_memories_expires_at" ON "public"."conversation_memories"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "idx_conversation_memories_importance" ON "public"."conversation_memories"("importance" ASC);

-- CreateIndex
CREATE INDEX "idx_conversations_deleted_at" ON "public"."conversations"("deleted_at" ASC);

-- CreateIndex
CREATE INDEX "idx_conversations_repository_id" ON "public"."conversations"("repository_id" ASC);

-- CreateIndex
CREATE INDEX "idx_conversations_status" ON "public"."conversations"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_conversations_user_id" ON "public"."conversations"("user_id" ASC);

-- CreateIndex
CREATE INDEX "idx_conversations_workspace_id" ON "public"."conversations"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_digest_checksums_workspace_id" ON "public"."digest_checksums"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_digest_checksums_repo_kind_key" ON "public"."digest_checksums"("repository_id" ASC, "digest_kind" ASC, "digest_key" ASC);

-- CreateIndex
CREATE INDEX "idx_documentation_type" ON "public"."documentation"("type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_documentation_repository_file_path" ON "public"."documentation"("repository_id" ASC, "file_path" ASC);

-- CreateIndex
CREATE INDEX "idx_documentation_digests_workspace_id" ON "public"."documentation_digests"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_documentation_digests_repo_key" ON "public"."documentation_digests"("repository_id" ASC, "doc_key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "embeddings_knowledge_chunk_id_key" ON "public"."embeddings"("knowledge_chunk_id" ASC);

-- CreateIndex
CREATE INDEX "idx_embeddings_checksum" ON "public"."embeddings"("embedding_checksum" ASC);

-- CreateIndex
CREATE INDEX "idx_embeddings_model" ON "public"."embeddings"("model" ASC);

-- CreateIndex
CREATE INDEX "idx_embeddings_provider" ON "public"."embeddings"("provider" ASC);

-- CreateIndex
CREATE INDEX "idx_embeddings_status" ON "public"."embeddings"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_embeddings_vector_hnsw" ON "public"."embeddings"("vector" ASC);

-- CreateIndex
CREATE INDEX "idx_embeddings_version" ON "public"."embeddings"("embedding_version" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "git_providers_type_key" ON "public"."git_providers"("type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "heuristic_metadata_repository_id_key" ON "public"."heuristic_metadata"("repository_id" ASC);

-- CreateIndex
CREATE INDEX "idx_heuristic_metadata_workspace_id" ON "public"."heuristic_metadata"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_issues_opened_at" ON "public"."issues"("opened_at" ASC);

-- CreateIndex
CREATE INDEX "idx_issues_state" ON "public"."issues"("state" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_issues_repository_number" ON "public"."issues"("repository_id" ASC, "number" ASC);

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_content_hash" ON "public"."knowledge_chunks"("content_hash" ASC);

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_content_trgm" ON "public"."knowledge_chunks" USING GIN ("content" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_deleted_at" ON "public"."knowledge_chunks"("deleted_at" ASC);

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_documentation_id" ON "public"."knowledge_chunks"("documentation_id" ASC);

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_metadata_gin" ON "public"."knowledge_chunks" USING GIN ("metadata" jsonb_path_ops);

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_repository_id" ON "public"."knowledge_chunks"("repository_id" ASC);

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_search_vector_gin" ON "public"."knowledge_chunks" USING GIN ("search_vector" tsvector_ops);

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_workspace_id" ON "public"."knowledge_chunks"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_knowledge_chunks_ws_repo_deleted" ON "public"."knowledge_chunks"("workspace_id" ASC, "repository_id" ASC, "deleted_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_knowledge_chunks_documentation_index" ON "public"."knowledge_chunks"("documentation_id" ASC, "chunk_index" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_knowledge_chunks_source_index" ON "public"."knowledge_chunks"("knowledge_source_id" ASC, "chunk_index" ASC);

-- CreateIndex
CREATE INDEX "idx_knowledge_sources_path_trgm" ON "public"."knowledge_sources" USING GIN ("path" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_knowledge_sources_repository_id" ON "public"."knowledge_sources"("repository_id" ASC);

-- CreateIndex
CREATE INDEX "idx_knowledge_sources_source_type" ON "public"."knowledge_sources"("source_type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_knowledge_sources_workspace_type_ref" ON "public"."knowledge_sources"("workspace_id" ASC, "source_type" ASC, "external_ref_id" ASC);

-- CreateIndex
CREATE INDEX "idx_messages_created_at" ON "public"."messages"("created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_messages_role" ON "public"."messages"("role" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_messages_conversation_sequence" ON "public"."messages"("conversation_id" ASC, "sequence_number" ASC);

-- CreateIndex
CREATE INDEX "idx_model_usages_conversation_id" ON "public"."model_usages"("conversation_id" ASC);

-- CreateIndex
CREATE INDEX "idx_model_usages_created_at" ON "public"."model_usages"("created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_model_usages_provider_model" ON "public"."model_usages"("provider" ASC, "model" ASC);

-- CreateIndex
CREATE INDEX "idx_module_digests_workspace_id" ON "public"."module_digests"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_module_digests_repo_module" ON "public"."module_digests"("repository_id" ASC, "module_key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "public"."notification_preferences"("user_id" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_created_at" ON "public"."notifications"("created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_deleted_at" ON "public"."notifications"("deleted_at" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_is_read" ON "public"."notifications"("is_read" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_type" ON "public"."notifications"("type" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_user_id" ON "public"."notifications"("user_id" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_workspace_id" ON "public"."notifications"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_oauth_tokens_access_expires_at" ON "public"."oauth_tokens"("access_token_expires_at" ASC);

-- CreateIndex
CREATE INDEX "idx_oauth_tokens_user_id" ON "public"."oauth_tokens"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_oauth_tokens_provider_account" ON "public"."oauth_tokens"("provider" ASC, "provider_account_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_oauth_tokens_user_provider_account" ON "public"."oauth_tokens"("user_id" ASC, "provider" ASC, "provider_account_id" ASC);

-- CreateIndex
CREATE INDEX "idx_pinned_conversations_pinned_at" ON "public"."pinned_conversations"("pinned_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_pinned_conversations_user_conversation" ON "public"."pinned_conversations"("user_id" ASC, "conversation_id" ASC);

-- CreateIndex
CREATE INDEX "idx_prompt_history_conversation_id" ON "public"."prompt_history"("conversation_id" ASC);

-- CreateIndex
CREATE INDEX "idx_prompt_history_message_id" ON "public"."prompt_history"("message_id" ASC);

-- CreateIndex
CREATE INDEX "idx_prompt_history_prompt_type" ON "public"."prompt_history"("prompt_type" ASC);

-- CreateIndex
CREATE INDEX "idx_provider_executions_provider" ON "public"."provider_executions"("provider" ASC);

-- CreateIndex
CREATE INDEX "idx_provider_executions_workspace_id" ON "public"."provider_executions"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_provider_failures_provider" ON "public"."provider_failures"("provider" ASC);

-- CreateIndex
CREATE INDEX "idx_provider_failures_workspace_id" ON "public"."provider_failures"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_pr_digests_workspace_id" ON "public"."pull_request_digests"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_pr_digests_repo_batch" ON "public"."pull_request_digests"("repository_id" ASC, "batch_key" ASC);

-- CreateIndex
CREATE INDEX "idx_pull_requests_author_username" ON "public"."pull_requests"("author_username" ASC);

-- CreateIndex
CREATE INDEX "idx_pull_requests_opened_at" ON "public"."pull_requests"("opened_at" ASC);

-- CreateIndex
CREATE INDEX "idx_pull_requests_state" ON "public"."pull_requests"("state" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_pull_requests_repository_number" ON "public"."pull_requests"("repository_id" ASC, "number" ASC);

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_expires_at" ON "public"."refresh_tokens"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_revoked_at" ON "public"."refresh_tokens"("revoked_at" ASC);

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_session_id" ON "public"."refresh_tokens"("session_id" ASC);

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_user_id" ON "public"."refresh_tokens"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_replaced_by_token_id_key" ON "public"."refresh_tokens"("replaced_by_token_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "public"."refresh_tokens"("token_hash" ASC);

-- CreateIndex
CREATE INDEX "idx_release_digests_workspace_id" ON "public"."release_digests"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_release_digests_repo_key" ON "public"."release_digests"("repository_id" ASC, "release_key" ASC);

-- CreateIndex
CREATE INDEX "idx_releases_published_at" ON "public"."releases"("published_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_releases_repository_tag_name" ON "public"."releases"("repository_id" ASC, "tag_name" ASC);

-- CreateIndex
CREATE INDEX "idx_repositories_deleted_at" ON "public"."repositories"("deleted_at" ASC);

-- CreateIndex
CREATE INDEX "idx_repositories_git_provider_id" ON "public"."repositories"("git_provider_id" ASC);

-- CreateIndex
CREATE INDEX "idx_repositories_last_synced_at" ON "public"."repositories"("last_synced_at" ASC);

-- CreateIndex
CREATE INDEX "idx_repositories_status" ON "public"."repositories"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_repositories_workspace_id" ON "public"."repositories"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_repositories_account_provider_repo" ON "public"."repositories"("connected_account_id" ASC, "provider_repository_id" ASC);

-- CreateIndex
CREATE INDEX "idx_repository_contributors_commit_count" ON "public"."repository_contributors"("commit_count" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_repository_contributors_repository_username" ON "public"."repository_contributors"("repository_id" ASC, "username" ASC);

-- CreateIndex
CREATE INDEX "idx_repository_digests_repository_id" ON "public"."repository_digests"("repository_id" ASC);

-- CreateIndex
CREATE INDEX "idx_repository_digests_workspace_id" ON "public"."repository_digests"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_repository_digests_repo_checksum" ON "public"."repository_digests"("repository_id" ASC, "content_checksum" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "repository_statistics_repository_id_key" ON "public"."repository_statistics"("repository_id" ASC);

-- CreateIndex
CREATE INDEX "idx_reviews_pull_request_id" ON "public"."reviews"("pull_request_id" ASC);

-- CreateIndex
CREATE INDEX "idx_reviews_reviewer_username" ON "public"."reviews"("reviewer_username" ASC);

-- CreateIndex
CREATE INDEX "idx_reviews_state" ON "public"."reviews"("state" ASC);

-- CreateIndex
CREATE INDEX "idx_saved_searches_workspace_id" ON "public"."saved_searches"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_saved_searches_user_workspace_name" ON "public"."saved_searches"("user_id" ASC, "workspace_id" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "idx_search_cache_expires_at" ON "public"."search_cache"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "idx_search_cache_search_type" ON "public"."search_cache"("search_type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "search_cache_query_hash_key" ON "public"."search_cache"("query_hash" ASC);

-- CreateIndex
CREATE INDEX "idx_search_histories_created_at" ON "public"."search_histories"("created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_search_histories_repository_id" ON "public"."search_histories"("repository_id" ASC);

-- CreateIndex
CREATE INDEX "idx_search_histories_search_type" ON "public"."search_histories"("search_type" ASC);

-- CreateIndex
CREATE INDEX "idx_search_histories_user_id" ON "public"."search_histories"("user_id" ASC);

-- CreateIndex
CREATE INDEX "idx_search_histories_workspace_id" ON "public"."search_histories"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_sessions_expires_at" ON "public"."sessions"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "idx_sessions_revoked_at" ON "public"."sessions"("revoked_at" ASC);

-- CreateIndex
CREATE INDEX "idx_sessions_user_id" ON "public"."sessions"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "public"."sessions"("token_hash" ASC);

-- CreateIndex
CREATE INDEX "idx_sync_histories_connected_account_id" ON "public"."sync_histories"("connected_account_id" ASC);

-- CreateIndex
CREATE INDEX "idx_sync_histories_created_at" ON "public"."sync_histories"("created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_sync_histories_status" ON "public"."sync_histories"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_sync_histories_workspace_id" ON "public"."sync_histories"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_tags_commit_sha" ON "public"."tags"("commit_sha" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_tags_repository_name" ON "public"."tags"("repository_id" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "idx_users_deleted_at" ON "public"."users"("deleted_at" ASC);

-- CreateIndex
CREATE INDEX "idx_users_last_login_at" ON "public"."users"("last_login_at" ASC);

-- CreateIndex
CREATE INDEX "idx_users_status" ON "public"."users"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE INDEX "idx_webhook_events_connected_account_id" ON "public"."webhook_events"("connected_account_id" ASC);

-- CreateIndex
CREATE INDEX "idx_webhook_events_event_type" ON "public"."webhook_events"("eventType" ASC);

-- CreateIndex
CREATE INDEX "idx_webhook_events_received_at" ON "public"."webhook_events"("received_at" ASC);

-- CreateIndex
CREATE INDEX "idx_webhook_events_status" ON "public"."webhook_events"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_webhook_events_workspace_id" ON "public"."webhook_events"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_workspace_members_role" ON "public"."workspace_members"("role" ASC);

-- CreateIndex
CREATE INDEX "idx_workspace_members_user_id" ON "public"."workspace_members"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_workspace_members_workspace_user" ON "public"."workspace_members"("workspace_id" ASC, "user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_settings_workspace_id_key" ON "public"."workspace_settings"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "idx_workspaces_deleted_at" ON "public"."workspaces"("deleted_at" ASC);

-- CreateIndex
CREATE INDEX "idx_workspaces_owner_id" ON "public"."workspaces"("owner_id" ASC);

-- CreateIndex
CREATE INDEX "idx_workspaces_status" ON "public"."workspaces"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "public"."workspaces"("slug" ASC);

-- AddForeignKey
ALTER TABLE "public"."ai_analyses" ADD CONSTRAINT "ai_analyses_documentation_digest_id_fkey" FOREIGN KEY ("documentation_digest_id") REFERENCES "public"."documentation_digests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analyses" ADD CONSTRAINT "ai_analyses_module_digest_id_fkey" FOREIGN KEY ("module_digest_id") REFERENCES "public"."module_digests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analyses" ADD CONSTRAINT "ai_analyses_pull_request_digest_id_fkey" FOREIGN KEY ("pull_request_digest_id") REFERENCES "public"."pull_request_digests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analyses" ADD CONSTRAINT "ai_analyses_release_digest_id_fkey" FOREIGN KEY ("release_digest_id") REFERENCES "public"."release_digests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analyses" ADD CONSTRAINT "ai_analyses_repository_digest_id_fkey" FOREIGN KEY ("repository_digest_id") REFERENCES "public"."repository_digests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analyses" ADD CONSTRAINT "ai_analyses_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analyses" ADD CONSTRAINT "ai_analyses_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_execution_logs" ADD CONSTRAINT "ai_execution_logs_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_execution_logs" ADD CONSTRAINT "ai_execution_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_responses" ADD CONSTRAINT "ai_responses_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."background_jobs" ADD CONSTRAINT "background_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branches" ADD CONSTRAINT "branches_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."citations" ADD CONSTRAINT "citations_ai_response_id_fkey" FOREIGN KEY ("ai_response_id") REFERENCES "public"."ai_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."citations" ADD CONSTRAINT "citations_knowledge_chunk_id_fkey" FOREIGN KEY ("knowledge_chunk_id") REFERENCES "public"."knowledge_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."citations" ADD CONSTRAINT "citations_knowledge_source_id_fkey" FOREIGN KEY ("knowledge_source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."citations" ADD CONSTRAINT "citations_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commits" ADD CONSTRAINT "commits_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commits" ADD CONSTRAINT "commits_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connected_accounts" ADD CONSTRAINT "connected_accounts_git_provider_id_fkey" FOREIGN KEY ("git_provider_id") REFERENCES "public"."git_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connected_accounts" ADD CONSTRAINT "connected_accounts_oauth_token_id_fkey" FOREIGN KEY ("oauth_token_id") REFERENCES "public"."oauth_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connected_accounts" ADD CONSTRAINT "connected_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connected_accounts" ADD CONSTRAINT "connected_accounts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_memories" ADD CONSTRAINT "conversation_memories_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."digest_checksums" ADD CONSTRAINT "digest_checksums_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."digest_checksums" ADD CONSTRAINT "digest_checksums_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documentation" ADD CONSTRAINT "documentation_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documentation_digests" ADD CONSTRAINT "documentation_digests_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documentation_digests" ADD CONSTRAINT "documentation_digests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."embeddings" ADD CONSTRAINT "embeddings_knowledge_chunk_id_fkey" FOREIGN KEY ("knowledge_chunk_id") REFERENCES "public"."knowledge_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."heuristic_metadata" ADD CONSTRAINT "heuristic_metadata_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."heuristic_metadata" ADD CONSTRAINT "heuristic_metadata_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_documentation_id_fkey" FOREIGN KEY ("documentation_id") REFERENCES "public"."documentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_knowledge_source_id_fkey" FOREIGN KEY ("knowledge_source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_sources" ADD CONSTRAINT "knowledge_sources_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_sources" ADD CONSTRAINT "knowledge_sources_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."model_usages" ADD CONSTRAINT "model_usages_ai_response_id_fkey" FOREIGN KEY ("ai_response_id") REFERENCES "public"."ai_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."model_usages" ADD CONSTRAINT "model_usages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."model_usages" ADD CONSTRAINT "model_usages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."module_digests" ADD CONSTRAINT "module_digests_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."module_digests" ADD CONSTRAINT "module_digests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."oauth_tokens" ADD CONSTRAINT "oauth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pinned_conversations" ADD CONSTRAINT "pinned_conversations_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pinned_conversations" ADD CONSTRAINT "pinned_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prompt_history" ADD CONSTRAINT "prompt_history_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prompt_history" ADD CONSTRAINT "prompt_history_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_executions" ADD CONSTRAINT "provider_executions_ai_analysis_id_fkey" FOREIGN KEY ("ai_analysis_id") REFERENCES "public"."ai_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_executions" ADD CONSTRAINT "provider_executions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_failures" ADD CONSTRAINT "provider_failures_ai_analysis_id_fkey" FOREIGN KEY ("ai_analysis_id") REFERENCES "public"."ai_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_failures" ADD CONSTRAINT "provider_failures_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pull_request_digests" ADD CONSTRAINT "pull_request_digests_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pull_request_digests" ADD CONSTRAINT "pull_request_digests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pull_requests" ADD CONSTRAINT "pull_requests_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_token_id_fkey" FOREIGN KEY ("replaced_by_token_id") REFERENCES "public"."refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."release_digests" ADD CONSTRAINT "release_digests_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."release_digests" ADD CONSTRAINT "release_digests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."releases" ADD CONSTRAINT "releases_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repositories" ADD CONSTRAINT "repositories_connected_account_id_fkey" FOREIGN KEY ("connected_account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repositories" ADD CONSTRAINT "repositories_git_provider_id_fkey" FOREIGN KEY ("git_provider_id") REFERENCES "public"."git_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repositories" ADD CONSTRAINT "repositories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repository_contributors" ADD CONSTRAINT "repository_contributors_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repository_digests" ADD CONSTRAINT "repository_digests_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repository_digests" ADD CONSTRAINT "repository_digests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repository_statistics" ADD CONSTRAINT "repository_statistics_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "public"."pull_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."saved_searches" ADD CONSTRAINT "saved_searches_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."search_histories" ADD CONSTRAINT "search_histories_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."search_histories" ADD CONSTRAINT "search_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."search_histories" ADD CONSTRAINT "search_histories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sync_histories" ADD CONSTRAINT "sync_histories_connected_account_id_fkey" FOREIGN KEY ("connected_account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sync_histories" ADD CONSTRAINT "sync_histories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tags" ADD CONSTRAINT "tags_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_events" ADD CONSTRAINT "webhook_events_connected_account_id_fkey" FOREIGN KEY ("connected_account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_events" ADD CONSTRAINT "webhook_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_settings" ADD CONSTRAINT "workspace_settings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspaces" ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
