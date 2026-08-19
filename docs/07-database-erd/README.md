# Enterprise Database ERD — AI Digital Twin Platform

**Project:** AI Digital Twin Platform
**Version:** 2.0
**Status:** Current — reflects schema as of Phase 13 (Analytics & Insights complete)
**Schema source:** `apps/backend/prisma/schema.prisma`
**Total models:** 43
**Domains:** 8

---

## 1. Purpose

This document describes the Entity Relationship structure of the AI Digital Twin Platform database. It covers all 43 Prisma models, their primary and foreign keys, domain boundaries, and relationship cardinalities.

> **Generation method:** This ERD is derived directly from `apps/backend/prisma/schema.prisma`. Each model section maps to a `model` block in the schema. Foreign key constraints, cascades, and indexes are preserved from the schema's `@@index`, `@@unique`, and relation definitions.

---

## 2. Domain Overview

| Domain                 | Tables | Phase | Purpose                                         |
| ---------------------- | ------ | ----- | ----------------------------------------------- |
| **Identity**           | 4      | 02    | Users, sessions, tokens                         |
| **Workspace**          | 3      | 03    | Multi-tenant isolation                          |
| **Git Integration**    | 4      | 04    | GitHub connections and webhook ingestion        |
| **Repository**         | 10     | 05    | Engineering history (commits, PRs, issues)      |
| **Knowledge**          | 5      | 06    | RAG chunking, embeddings, citations             |
| **AI**                 | 7      | 07    | Conversations, messages, model usage, memory    |
| **Search & Platform**  | 8      | 08    | Search history, analytics, audit, notifications |
| **Hybrid AI Pipeline** | 11     | 08–11 | Digest generation, AI analyses, execution logs  |

---

## 3. ERD — Domain Boundaries and Relationships

```mermaid
erDiagram

%% ============================================================
%% IDENTITY DOMAIN
%% ============================================================

User {
  uuid id PK
  varchar email UK
  varchar password_hash
  varchar first_name
  varchar last_name
  varchar display_name
  varchar avatar_url
  enum role
  enum status
  timestamp email_verified_at
  timestamp last_login_at
  varchar timezone
  varchar locale
  timestamp created_at
  timestamp updated_at
  timestamp deleted_at
}

Session {
  uuid id PK
  uuid user_id FK
  varchar token_hash UK
  timestamp expires_at
  timestamp revoked_at
  timestamp last_activity_at
  varchar ip_address
  varchar user_agent
}

RefreshToken {
  uuid id PK
  uuid user_id FK
  uuid session_id FK
  varchar token_hash UK
  timestamp expires_at
  timestamp revoked_at
  uuid replaced_by_token_id FK
}

OAuthToken {
  uuid id PK
  uuid user_id FK
  enum provider
  varchar provider_account_id
  text access_token_encrypted
  text refresh_token_encrypted
  timestamp access_token_expires_at
  timestamp refresh_token_expires_at
  varchar token_type
  text scopes
  jsonb provider_metadata
}

User ||--o{ Session : "has"
User ||--o{ RefreshToken : "has"
User ||--o{ OAuthToken : "has"
Session ||--o{ RefreshToken : "has"
RefreshToken |o--o| RefreshToken : "replaces (rotation)"

%% ============================================================
%% WORKSPACE DOMAIN
%% ============================================================

Workspace {
  uuid id PK
  varchar name
  varchar slug UK
  text description
  uuid owner_id FK
  enum status
  timestamp created_at
  timestamp updated_at
  timestamp deleted_at
}

WorkspaceSettings {
  uuid id PK
  uuid workspace_id FK_UK
  varchar default_ai_provider
  varchar default_ai_model
  varchar default_embedding_model
  boolean auto_sync_enabled
  boolean notifications_enabled
  jsonb preferences
}

WorkspaceMember {
  uuid id PK
  uuid workspace_id FK
  uuid user_id FK
  enum role
  timestamp joined_at
}

User ||--o{ Workspace : "owns"
User ||--o{ WorkspaceMember : "member of"
Workspace ||--|| WorkspaceSettings : "has"
Workspace ||--o{ WorkspaceMember : "has"

%% ============================================================
%% GIT INTEGRATION DOMAIN
%% ============================================================

GitProvider {
  uuid id PK
  enum type UK
  varchar name
  varchar display_name
  varchar api_base_url
  boolean is_enabled
}

ConnectedAccount {
  uuid id PK
  uuid workspace_id FK
  uuid user_id FK
  uuid git_provider_id FK
  uuid oauth_token_id FK
  varchar provider_account_id
  varchar provider_username
  varchar provider_account_url
  jsonb provider_metadata
  enum status
  timestamp connected_at
  timestamp disconnected_at
  timestamp last_synced_at
}

WebhookEvent {
  uuid id PK
  uuid workspace_id FK
  uuid connected_account_id FK
  varchar provider_event_id
  enum event_type
  varchar action
  jsonb payload
  boolean signature_valid
  enum status
  text error_message
  timestamp received_at
  timestamp processed_at
}

SyncHistory {
  uuid id PK
  uuid workspace_id FK
  uuid connected_account_id FK
  enum trigger
  enum status
  timestamp started_at
  timestamp completed_at
  int repositories_synced
  int commits_synced
  text error_message
  jsonb metadata
  varchar job_id
}

Workspace ||--o{ ConnectedAccount : "has"
User ||--o{ ConnectedAccount : "has"
GitProvider ||--o{ ConnectedAccount : "used by"
OAuthToken |o--o{ ConnectedAccount : "linked to"
Workspace ||--o{ WebhookEvent : "receives"
ConnectedAccount ||--o{ WebhookEvent : "delivers"
Workspace ||--o{ SyncHistory : "tracks"
ConnectedAccount ||--o{ SyncHistory : "triggers"

%% ============================================================
%% REPOSITORY DOMAIN
%% ============================================================

Repository {
  uuid id PK
  uuid workspace_id FK
  uuid connected_account_id FK
  uuid git_provider_id FK
  varchar provider_repository_id
  varchar name
  varchar full_name
  text description
  varchar url
  varchar default_branch
  boolean is_private
  boolean is_fork
  varchar language
  enum status
  timestamp last_synced_at
  jsonb provider_metadata
  timestamp created_at
  timestamp updated_at
  timestamp deleted_at
}

Branch {
  uuid id PK
  uuid repository_id FK
  varchar name
  boolean is_default
  varchar last_commit_sha
}

Commit {
  uuid id PK
  uuid repository_id FK
  uuid branch_id FK
  varchar sha
  text message
  varchar author_name
  varchar author_email
  timestamp committed_at
  int additions
  int deletions
  int changed_files
}

PullRequest {
  uuid id PK
  uuid repository_id FK
  int number
  varchar title
  text body
  enum state
  varchar source_branch
  varchar target_branch
  varchar author_username
  timestamp opened_at
  timestamp closed_at
  timestamp merged_at
}

Review {
  uuid id PK
  uuid pull_request_id FK
  varchar reviewer_username
  enum state
  text body
  timestamp submitted_at
}

Issue {
  uuid id PK
  uuid repository_id FK
  int number
  varchar title
  text body
  enum state
  varchar author_username
  timestamp opened_at
  timestamp closed_at
}

Release {
  uuid id PK
  uuid repository_id FK
  varchar tag_name
  varchar name
  text body
  boolean is_prerelease
  boolean is_draft
  timestamp published_at
}

Tag {
  uuid id PK
  uuid repository_id FK
  varchar name
  varchar commit_sha
}

RepositoryContributor {
  uuid id PK
  uuid repository_id FK
  varchar username
  int commit_count
  timestamp last_contribution_at
}

RepositoryStatistics {
  uuid id PK
  uuid repository_id FK_UK
  int star_count
  int fork_count
  int watcher_count
  int open_issue_count
  int open_pull_request_count
  int commit_count
  int contributor_count
  timestamp last_calculated_at
}

Workspace ||--o{ Repository : "contains"
ConnectedAccount ||--o{ Repository : "links"
GitProvider ||--o{ Repository : "from"
Repository ||--o{ Branch : "has"
Repository ||--o{ Commit : "has"
Repository ||--o{ PullRequest : "has"
Repository ||--o{ Issue : "has"
Repository ||--o{ Release : "has"
Repository ||--o{ Tag : "has"
Repository ||--o{ RepositoryContributor : "has"
Repository ||--|| RepositoryStatistics : "has"
Branch ||--o{ Commit : "contains"
PullRequest ||--o{ Review : "has"

%% ============================================================
%% KNOWLEDGE DOMAIN
%% ============================================================

KnowledgeSource {
  uuid id PK
  uuid workspace_id FK
  uuid repository_id FK
  enum source_type
  varchar external_ref_id
  uuid internal_ref_id
  varchar title
  varchar url
  varchar path
  jsonb metadata
}

Documentation {
  uuid id PK
  uuid repository_id FK
  varchar title
  text content
  varchar file_path
  enum type
  timestamp last_synced_at
}

KnowledgeChunk {
  uuid id PK
  uuid workspace_id FK
  uuid repository_id FK
  uuid knowledge_source_id FK
  uuid documentation_id FK
  text content
  int chunk_index
  int token_count
  varchar content_hash
  jsonb metadata
  tsvector search_vector
  timestamp deleted_at
}

Embedding {
  uuid id PK
  uuid knowledge_chunk_id FK_UK
  varchar provider
  varchar model
  int version
  int dimensions
  enum status
  varchar checksum
  vector_1536 vector
  text error_message
  int latency_ms
  int token_usage
  int retry_count
}

Citation {
  uuid id PK
  uuid knowledge_chunk_id FK
  uuid knowledge_source_id FK
  uuid message_id FK
  uuid ai_response_id FK
  text excerpt
  int start_offset
  int end_offset
  float relevance_score
  jsonb metadata
}

Workspace ||--o{ KnowledgeSource : "has"
Repository |o--o{ KnowledgeSource : "referenced by"
Repository ||--o{ Documentation : "has"
Workspace ||--o{ KnowledgeChunk : "has"
Repository |o--o{ KnowledgeChunk : "scoped to"
KnowledgeSource |o--o{ KnowledgeChunk : "source of"
Documentation |o--o{ KnowledgeChunk : "source of"
KnowledgeChunk ||--o| Embedding : "has (1:1)"
KnowledgeChunk ||--o{ Citation : "cited by"
KnowledgeSource |o--o{ Citation : "cited from"

%% ============================================================
%% AI DOMAIN
%% ============================================================

Conversation {
  uuid id PK
  uuid workspace_id FK
  uuid user_id FK
  uuid repository_id FK
  varchar title
  enum status
  varchar ai_provider
  varchar ai_model
  jsonb metadata
  timestamp deleted_at
}

Message {
  uuid id PK
  uuid conversation_id FK
  enum role
  text content
  int sequence_number
  int token_count
  jsonb metadata
}

AIResponse {
  uuid id PK
  uuid message_id FK_UK
  enum finish_reason
  int latency_ms
  varchar provider_request_id
  jsonb raw_response
}

PromptHistory {
  uuid id PK
  uuid conversation_id FK
  uuid message_id FK
  enum prompt_type
  text content
  int version
}

ModelUsage {
  uuid id PK
  uuid conversation_id FK
  uuid message_id FK
  uuid ai_response_id FK
  varchar provider
  varchar model
  int prompt_tokens
  int completion_tokens
  int total_tokens
  decimal estimated_cost_usd
  int latency_ms
}

ConversationMemory {
  uuid id PK
  uuid conversation_id FK
  text content
  float importance
  timestamp expires_at
}

PinnedConversation {
  uuid id PK
  uuid user_id FK
  uuid conversation_id FK
  timestamp pinned_at
}

Workspace ||--o{ Conversation : "has"
User ||--o{ Conversation : "creates"
Repository |o--o{ Conversation : "scoped to"
Conversation ||--o{ Message : "has"
Conversation ||--o{ PromptHistory : "has"
Conversation ||--o{ ModelUsage : "tracks"
Conversation ||--o{ ConversationMemory : "has"
Conversation ||--o{ PinnedConversation : "pinned by"
Message ||--o| AIResponse : "has (1:1)"
Message ||--o{ Citation : "cites"
Message ||--o{ PromptHistory : "logs"
Message ||--o{ ModelUsage : "tracks"
AIResponse ||--o{ Citation : "cites"
AIResponse ||--o{ ModelUsage : "tracks"
User ||--o{ PinnedConversation : "pins"

%% ============================================================
%% SEARCH & PLATFORM DOMAIN
%% ============================================================

SearchHistory {
  uuid id PK
  uuid workspace_id FK
  uuid user_id FK
  uuid repository_id FK
  varchar query
  enum search_type
  int results_count
  int latency_ms
  jsonb search_filters
  timestamp created_at
}

SavedSearch {
  uuid id PK
  uuid workspace_id FK
  uuid user_id FK
  varchar name
  varchar query
  enum search_type
  jsonb search_filters
}

SearchCache {
  uuid id PK
  varchar query_hash UK
  enum search_type
  jsonb results
  timestamp expires_at
}

Notification {
  uuid id PK
  uuid workspace_id FK
  uuid user_id FK
  enum type
  varchar title
  text message
  boolean is_read
  timestamp read_at
  jsonb data
  timestamp deleted_at
}

NotificationPreference {
  uuid id PK
  uuid user_id FK_UK
  boolean email_enabled
  boolean push_enabled
  boolean in_app_enabled
  jsonb type_preferences
}

AuditLog {
  uuid id PK
  uuid workspace_id FK
  uuid user_id FK
  varchar action
  varchar entity_type
  uuid entity_id
  varchar ip_address
  varchar user_agent
  jsonb metadata
  timestamp created_at
}

AnalyticsSnapshot {
  uuid id PK
  uuid workspace_id FK
  uuid repository_id FK
  enum snapshot_type
  timestamp period_start
  timestamp period_end
  jsonb metrics
  timestamp created_at
  timestamp updated_at
}

BackgroundJob {
  uuid id PK
  uuid workspace_id FK
  enum job_type
  enum status
  varchar queue_job_id UK
  jsonb payload
  jsonb result
  text error_message
  timestamp scheduled_at
  timestamp started_at
  timestamp completed_at
}

Workspace ||--o{ SearchHistory : "tracks"
User ||--o{ SearchHistory : "performs"
Workspace ||--o{ SavedSearch : "has"
User ||--o{ SavedSearch : "owns"
Workspace |o--o{ Notification : "receives"
User ||--o{ Notification : "receives"
User ||--o| NotificationPreference : "has"
Workspace |o--o{ AuditLog : "logged for"
User |o--o{ AuditLog : "logged by"
Workspace |o--o{ AnalyticsSnapshot : "has"
Repository |o--o{ AnalyticsSnapshot : "dimension of"
Workspace |o--o{ BackgroundJob : "tracks"
```

---

## 4. Hybrid AI Pipeline Domain (Additional Models)

These models support the AI knowledge extraction pipeline and do not fit cleanly in the mermaid diagram above due to complexity. They are listed here with their key relationships.

| Model                 | Table                   | Key Relations                                                                  |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| `HeuristicMetadata`   | `heuristic_metadata`    | `workspace_id` → Workspace, `repository_id` → Repository (1:1 with Repository) |
| `RepositoryDigest`    | `repository_digests`    | `workspace_id` → Workspace, `repository_id` → Repository                       |
| `ModuleDigest`        | `module_digests`        | `workspace_id` → Workspace, `repository_id` → Repository                       |
| `PullRequestDigest`   | `pull_request_digests`  | `workspace_id` → Workspace, `repository_id` → Repository                       |
| `DocumentationDigest` | `documentation_digests` | `workspace_id` → Workspace, `repository_id` → Repository                       |
| `ReleaseDigest`       | `release_digests`       | `workspace_id` → Workspace, `repository_id` → Repository                       |
| `DigestChecksum`      | `digest_checksums`      | `workspace_id` → Workspace, `repository_id` → Repository                       |
| `AIAnalysis`          | `ai_analyses`           | FK to Workspace, Repository, and all 5 Digest types                            |
| `ProviderExecution`   | `provider_executions`   | `workspace_id` → Workspace, `ai_analysis_id` → AIAnalysis                      |
| `ProviderFailure`     | `provider_failures`     | `workspace_id` → Workspace, `ai_analysis_id` → AIAnalysis                      |
| `AIExecutionLog`      | `ai_execution_logs`     | `workspace_id` → Workspace, `repository_id` → Repository                       |

---

## 5. Cascade / Delete Behaviors

| Relationship                  | On Delete |
| ----------------------------- | --------- |
| User → Session                | CASCADE   |
| User → RefreshToken           | CASCADE   |
| User → OAuthToken             | CASCADE   |
| Workspace → WorkspaceSettings | CASCADE   |
| Workspace → WorkspaceMember   | CASCADE   |
| Workspace → ConnectedAccount  | CASCADE   |
| Workspace → Repository        | CASCADE   |
| Repository → Branch           | CASCADE   |
| Repository → Commit           | CASCADE   |
| Repository → PullRequest      | CASCADE   |
| Repository → Issue            | CASCADE   |
| Repository → KnowledgeChunk   | CASCADE   |
| KnowledgeChunk → Embedding    | CASCADE   |
| Conversation → Message        | CASCADE   |
| Message → AIResponse          | CASCADE   |
| AuditLog → User               | SET NULL  |
| Citation → Message            | SET NULL  |
| Citation → AIResponse         | SET NULL  |
| User → Workspace (owner)      | RESTRICT  |

---

## 6. Key Indexes

| Table                 | Index                                         | Type            | Purpose                                    |
| --------------------- | --------------------------------------------- | --------------- | ------------------------------------------ |
| `knowledge_chunks`    | `search_vector`                               | GIN             | Full-text search (PostgreSQL tsvector)     |
| `knowledge_chunks`    | `content` (trgm ops)                          | GIN pg_trgm     | Trigram similarity search                  |
| `knowledge_chunks`    | `metadata` (jsonb ops)                        | GIN JSONB       | JSONB path queries                         |
| `knowledge_sources`   | `path` (trgm ops)                             | GIN pg_trgm     | Trigram path matching                      |
| `embeddings`          | `vector`                                      | HNSW (pgvector) | Approximate nearest-neighbor vector search |
| `analytics_snapshots` | `(workspace_id, snapshot_type, period_start)` | BTREE           | Analytics queries                          |
| `conversations`       | `(workspace_id, user_id, deleted_at)`         | BTREE           | Conversation listing                       |

---

## 7. References

- Schema source: [`apps/backend/prisma/schema.prisma`](../../apps/backend/prisma/schema.prisma)
- Migration history: [`apps/backend/prisma/migrations/README.md`](../../apps/backend/prisma/migrations/README.md)
- Prisma README (domain descriptions): [`apps/backend/prisma/README.md`](../../apps/backend/prisma/README.md)
- Analytics domain: [`docs/backend/analytics.md`](../backend/analytics.md)
- Knowledge domain: [`docs/backend/knowledge-processing.md`](../backend/knowledge-processing.md)
- AI Chat domain: [`docs/backend/ai-chat.md`](../backend/ai-chat.md)
