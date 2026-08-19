-- Repository Domain (Phase 5)
-- Repository, Branch, Commit, PullRequest, Review, Issue, Release, Tag,
-- RepositoryContributor, RepositoryStatistics

-- CreateEnum
CREATE TYPE "PullRequestState" AS ENUM ('OPEN', 'CLOSED', 'MERGED');

-- CreateEnum
CREATE TYPE "IssueState" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReviewState" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED');

-- CreateTable
CREATE TABLE "repositories" (
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
    "status" "RepositoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_synced_at" TIMESTAMP(3),
    "provider_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
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
CREATE TABLE "commits" (
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
CREATE TABLE "pull_requests" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "body" TEXT,
    "state" "PullRequestState" NOT NULL DEFAULT 'OPEN',
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
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "pull_request_id" UUID NOT NULL,
    "reviewer_username" VARCHAR(255) NOT NULL,
    "state" "ReviewState" NOT NULL DEFAULT 'PENDING',
    "body" TEXT,
    "provider_review_id" VARCHAR(255),
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "body" TEXT,
    "state" "IssueState" NOT NULL DEFAULT 'OPEN',
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
CREATE TABLE "releases" (
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
CREATE TABLE "tags" (
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
CREATE TABLE "repository_contributors" (
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
CREATE TABLE "repository_statistics" (
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

-- CreateIndex
CREATE UNIQUE INDEX "uq_repositories_account_provider_repo" ON "repositories"("connected_account_id", "provider_repository_id");

-- CreateIndex
CREATE INDEX "idx_repositories_workspace_id" ON "repositories"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_repositories_git_provider_id" ON "repositories"("git_provider_id");

-- CreateIndex
CREATE INDEX "idx_repositories_status" ON "repositories"("status");

-- CreateIndex
CREATE INDEX "idx_repositories_deleted_at" ON "repositories"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_repositories_last_synced_at" ON "repositories"("last_synced_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_branches_repository_name" ON "branches"("repository_id", "name");

-- CreateIndex
CREATE INDEX "idx_branches_is_default" ON "branches"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "uq_commits_repository_sha" ON "commits"("repository_id", "sha");

-- CreateIndex
CREATE INDEX "idx_commits_branch_id" ON "commits"("branch_id");

-- CreateIndex
CREATE INDEX "idx_commits_committed_at" ON "commits"("committed_at");

-- CreateIndex
CREATE INDEX "idx_commits_author_email" ON "commits"("author_email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_pull_requests_repository_number" ON "pull_requests"("repository_id", "number");

-- CreateIndex
CREATE INDEX "idx_pull_requests_state" ON "pull_requests"("state");

-- CreateIndex
CREATE INDEX "idx_pull_requests_opened_at" ON "pull_requests"("opened_at");

-- CreateIndex
CREATE INDEX "idx_pull_requests_author_username" ON "pull_requests"("author_username");

-- CreateIndex
CREATE INDEX "idx_reviews_pull_request_id" ON "reviews"("pull_request_id");

-- CreateIndex
CREATE INDEX "idx_reviews_state" ON "reviews"("state");

-- CreateIndex
CREATE INDEX "idx_reviews_reviewer_username" ON "reviews"("reviewer_username");

-- CreateIndex
CREATE UNIQUE INDEX "uq_issues_repository_number" ON "issues"("repository_id", "number");

-- CreateIndex
CREATE INDEX "idx_issues_state" ON "issues"("state");

-- CreateIndex
CREATE INDEX "idx_issues_opened_at" ON "issues"("opened_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_releases_repository_tag_name" ON "releases"("repository_id", "tag_name");

-- CreateIndex
CREATE INDEX "idx_releases_published_at" ON "releases"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tags_repository_name" ON "tags"("repository_id", "name");

-- CreateIndex
CREATE INDEX "idx_tags_commit_sha" ON "tags"("commit_sha");

-- CreateIndex
CREATE UNIQUE INDEX "uq_repository_contributors_repository_username" ON "repository_contributors"("repository_id", "username");

-- CreateIndex
CREATE INDEX "idx_repository_contributors_commit_count" ON "repository_contributors"("commit_count");

-- CreateIndex
CREATE UNIQUE INDEX "repository_statistics_repository_id_key" ON "repository_statistics"("repository_id");

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_connected_account_id_fkey" FOREIGN KEY ("connected_account_id") REFERENCES "connected_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_git_provider_id_fkey" FOREIGN KEY ("git_provider_id") REFERENCES "git_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commits" ADD CONSTRAINT "commits_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commits" ADD CONSTRAINT "commits_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_contributors" ADD CONSTRAINT "repository_contributors_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_statistics" ADD CONSTRAINT "repository_statistics_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
