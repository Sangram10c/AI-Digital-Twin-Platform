-- Search & Platform Domain (Phase 8)
-- SearchHistory, SavedSearch, SearchCache, Notification, NotificationPreference,
-- AuditLog, AnalyticsSnapshot, BackgroundJob

-- CreateEnum
CREATE TYPE "SearchType" AS ENUM ('KEYWORD', 'SEMANTIC', 'HYBRID');

-- CreateEnum
CREATE TYPE "AnalyticsSnapshotType" AS ENUM ('REPOSITORY', 'DEVELOPER', 'AI', 'SEARCH', 'WORKSPACE', 'PLATFORM');

-- CreateEnum
CREATE TYPE "BackgroundJobType" AS ENUM ('REPOSITORY_SYNC', 'EMBEDDING_GENERATION', 'NOTIFICATION_DELIVERY', 'ANALYTICS_AGGREGATION', 'CLEANUP', 'WEBHOOK_PROCESSING');

-- CreateTable
CREATE TABLE "search_histories" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "repository_id" UUID,
    "query" VARCHAR(1024) NOT NULL,
    "search_type" "SearchType" NOT NULL,
    "results_count" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" INTEGER,
    "search_filters" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "query" VARCHAR(1024) NOT NULL,
    "search_type" "SearchType" NOT NULL DEFAULT 'HYBRID',
    "search_filters" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_cache" (
    "id" UUID NOT NULL,
    "query_hash" VARCHAR(64) NOT NULL,
    "search_type" "SearchType" NOT NULL,
    "results" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "workspace_id" UUID,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
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
CREATE TABLE "notification_preferences" (
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
CREATE TABLE "audit_logs" (
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
CREATE TABLE "analytics_snapshots" (
    "id" UUID NOT NULL,
    "workspace_id" UUID,
    "snapshot_type" "AnalyticsSnapshotType" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_jobs" (
    "id" UUID NOT NULL,
    "workspace_id" UUID,
    "job_type" "BackgroundJobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
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

-- CreateIndex
CREATE INDEX "idx_search_histories_workspace_id" ON "search_histories"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_search_histories_user_id" ON "search_histories"("user_id");

-- CreateIndex
CREATE INDEX "idx_search_histories_repository_id" ON "search_histories"("repository_id");

-- CreateIndex
CREATE INDEX "idx_search_histories_search_type" ON "search_histories"("search_type");

-- CreateIndex
CREATE INDEX "idx_search_histories_created_at" ON "search_histories"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_saved_searches_user_workspace_name" ON "saved_searches"("user_id", "workspace_id", "name");

-- CreateIndex
CREATE INDEX "idx_saved_searches_workspace_id" ON "saved_searches"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "search_cache_query_hash_key" ON "search_cache"("query_hash");

-- CreateIndex
CREATE INDEX "idx_search_cache_search_type" ON "search_cache"("search_type");

-- CreateIndex
CREATE INDEX "idx_search_cache_expires_at" ON "search_cache"("expires_at");

-- CreateIndex
CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_notifications_workspace_id" ON "notifications"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_notifications_type" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "idx_notifications_is_read" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "idx_notifications_deleted_at" ON "notifications"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_notifications_created_at" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_workspace_id" ON "audit_logs"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_analytics_snapshots_workspace_id" ON "analytics_snapshots"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_analytics_snapshots_snapshot_type" ON "analytics_snapshots"("snapshot_type");

-- CreateIndex
CREATE INDEX "idx_analytics_snapshots_period" ON "analytics_snapshots"("period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "background_jobs_queue_job_id_key" ON "background_jobs"("queue_job_id");

-- CreateIndex
CREATE INDEX "idx_background_jobs_workspace_id" ON "background_jobs"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_background_jobs_job_type" ON "background_jobs"("job_type");

-- CreateIndex
CREATE INDEX "idx_background_jobs_status" ON "background_jobs"("status");

-- CreateIndex
CREATE INDEX "idx_background_jobs_scheduled_at" ON "background_jobs"("scheduled_at");

-- AddForeignKey
ALTER TABLE "search_histories" ADD CONSTRAINT "search_histories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_histories" ADD CONSTRAINT "search_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_histories" ADD CONSTRAINT "search_histories_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
