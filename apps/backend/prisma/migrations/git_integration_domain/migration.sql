-- Git Integration Domain (Phase 4)
-- GitProvider, ConnectedAccount, WebhookEvent, SyncHistory

-- CreateEnum
CREATE TYPE "GitProviderType" AS ENUM ('GITHUB', 'GITLAB', 'BITBUCKET');

-- CreateEnum
CREATE TYPE "ConnectedAccountStatus" AS ENUM ('ACTIVE', 'DISCONNECTED', 'ERROR', 'TOKEN_EXPIRED');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "WebhookEventType" AS ENUM ('PUSH', 'PULL_REQUEST', 'ISSUE', 'RELEASE', 'INSTALLATION', 'REPOSITORY', 'OTHER');

-- CreateEnum
CREATE TYPE "SyncTrigger" AS ENUM ('MANUAL', 'SCHEDULED', 'WEBHOOK', 'INITIAL');

-- CreateTable
CREATE TABLE "git_providers" (
    "id" UUID NOT NULL,
    "type" "GitProviderType" NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "display_name" VARCHAR(128) NOT NULL,
    "api_base_url" VARCHAR(512) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "git_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connected_accounts" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "git_provider_id" UUID NOT NULL,
    "oauth_token_id" UUID,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "provider_username" VARCHAR(255) NOT NULL,
    "provider_account_url" VARCHAR(2048),
    "provider_metadata" JSONB,
    "status" "ConnectedAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMP(3),
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connected_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "connected_account_id" UUID NOT NULL,
    "provider_event_id" VARCHAR(255),
    "event_type" "WebhookEventType" NOT NULL,
    "action" VARCHAR(64),
    "payload" JSONB NOT NULL,
    "signature_valid" BOOLEAN NOT NULL DEFAULT false,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_histories" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "connected_account_id" UUID NOT NULL,
    "trigger" "SyncTrigger" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
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

-- CreateIndex
CREATE UNIQUE INDEX "git_providers_type_key" ON "git_providers"("type");

-- CreateIndex
CREATE UNIQUE INDEX "connected_accounts_oauth_token_id_key" ON "connected_accounts"("oauth_token_id");

-- CreateIndex
CREATE INDEX "idx_connected_accounts_user_id" ON "connected_accounts"("user_id");

-- CreateIndex
CREATE INDEX "idx_connected_accounts_status" ON "connected_accounts"("status");

-- CreateIndex
CREATE INDEX "idx_connected_accounts_last_synced_at" ON "connected_accounts"("last_synced_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_connected_accounts_workspace_provider_account" ON "connected_accounts"("workspace_id", "git_provider_id", "provider_account_id");

-- CreateIndex
CREATE INDEX "idx_webhook_events_workspace_id" ON "webhook_events"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_webhook_events_connected_account_id" ON "webhook_events"("connected_account_id");

-- CreateIndex
CREATE INDEX "idx_webhook_events_status" ON "webhook_events"("status");

-- CreateIndex
CREATE INDEX "idx_webhook_events_received_at" ON "webhook_events"("received_at");

-- CreateIndex
CREATE INDEX "idx_webhook_events_event_type" ON "webhook_events"("event_type");

-- CreateIndex
CREATE INDEX "idx_sync_histories_workspace_id" ON "sync_histories"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_sync_histories_connected_account_id" ON "sync_histories"("connected_account_id");

-- CreateIndex
CREATE INDEX "idx_sync_histories_status" ON "sync_histories"("status");

-- CreateIndex
CREATE INDEX "idx_sync_histories_created_at" ON "sync_histories"("created_at");

-- AddForeignKey
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_git_provider_id_fkey" FOREIGN KEY ("git_provider_id") REFERENCES "git_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_oauth_token_id_fkey" FOREIGN KEY ("oauth_token_id") REFERENCES "oauth_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_connected_account_id_fkey" FOREIGN KEY ("connected_account_id") REFERENCES "connected_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_histories" ADD CONSTRAINT "sync_histories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_histories" ADD CONSTRAINT "sync_histories_connected_account_id_fkey" FOREIGN KEY ("connected_account_id") REFERENCES "connected_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
