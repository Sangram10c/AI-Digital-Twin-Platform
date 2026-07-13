# Prisma — AI Digital Twin Platform

Enterprise database layer conventions for the AI Digital Twin Platform backend.

> **Phase 1 scope:** generator, datasource, PostgreSQL extensions (pgvector), and global enums only. Models are added incrementally in subsequent phases.

> **Phase 2 scope:** Identity domain — `User`, `Session`, `RefreshToken`, `OAuthToken`.

> **Phase 3 scope:** Workspace domain — `Workspace`, `WorkspaceSettings`, `WorkspaceMember`.

> **Phase 4 scope:** Git Integration domain — `GitProvider`, `ConnectedAccount`, `WebhookEvent`, `SyncHistory`.

> **Phase 5 scope:** Repository domain — `Repository`, `Branch`, `Commit`, `PullRequest`, `Review`, `Issue`, `Release`, `Tag`, `RepositoryContributor`, `RepositoryStatistics`.

> **Phase 6 scope:** Knowledge domain — `KnowledgeSource`, `Documentation`, `KnowledgeChunk`, `Embedding`, `Citation`.

> **Phase 7 scope:** AI domain — `Conversation`, `Message`, `AIResponse`, `PromptHistory`, `ModelUsage`, `ConversationMemory`, `PinnedConversation`.

> **Phase 8 scope:** Search & Platform — `SearchHistory`, `SavedSearch`, `SearchCache`, `Notification`, `NotificationPreference`, `AuditLog`, `AnalyticsSnapshot`, `BackgroundJob`.

---

## Identity Domain (Phase 2)

| Model          | Table            | Purpose                                           |
| -------------- | ---------------- | ------------------------------------------------- |
| `User`         | `users`          | Primary platform identity (soft-delete supported) |
| `Session`      | `sessions`       | Device/browser session with hashed token          |
| `RefreshToken` | `refresh_tokens` | JWT refresh token rotation chain                  |
| `OAuthToken`   | `oauth_tokens`   | Encrypted OAuth provider credentials              |

### Security notes

- **Passwords** — stored as Argon2id hash in `password_hash` (application layer).
- **Session / refresh tokens** — only SHA-256 hashes persisted (`token_hash`).
- **OAuth tokens** — encrypted before storage (`access_token_encrypted`, `refresh_token_encrypted`).

---

## Workspace Domain (Phase 3)

| Model               | Table                | Purpose                                      |
| ------------------- | -------------------- | -------------------------------------------- |
| `Workspace`         | `workspaces`         | Tenancy boundary (soft-delete supported)     |
| `WorkspaceSettings` | `workspace_settings` | Per-workspace AI defaults and preferences    |
| `WorkspaceMember`   | `workspace_members`  | User ↔ workspace membership with scoped role |

### Relationship rules

- `User` → `Workspace` (owner): **RESTRICT** — owner must transfer workspaces before account deletion.
- `Workspace` → `WorkspaceSettings`: **CASCADE** — settings are owned by the workspace.
- `Workspace` / `User` → `WorkspaceMember`: **CASCADE** — membership rows are ephemeral join data.

### Deferred to future phases

- `Organization` (multi-tenant enterprise)
- `Invitation` (email-based workspace invites)

---

## Git Integration Domain (Phase 4)

| Model              | Table                | Purpose                                         |
| ------------------ | -------------------- | ----------------------------------------------- |
| `GitProvider`      | `git_providers`      | Supported SCM platforms (seeded reference data) |
| `ConnectedAccount` | `connected_accounts` | Workspace ↔ git account link                    |
| `WebhookEvent`     | `webhook_events`     | Inbound webhook delivery log                    |
| `SyncHistory`      | `sync_histories`     | Synchronization run audit trail                 |

### Relationship rules

- `Workspace` → `ConnectedAccount`: **CASCADE**
- `GitProvider` → `ConnectedAccount`: **RESTRICT** — cannot delete a provider with active connections
- `ConnectedAccount` → `OAuthToken`: **SET NULL** — optional link to identity OAuth credentials
- `ConnectedAccount` → `WebhookEvent` / `SyncHistory`: **CASCADE**

---

## Repository Domain (Phase 5)

| Model                   | Table                     | Purpose                                 |
| ----------------------- | ------------------------- | --------------------------------------- |
| `Repository`            | `repositories`            | Synced git repo (soft-delete supported) |
| `Branch`                | `branches`                | Tracked branches                        |
| `Commit`                | `commits`                 | Immutable commit history                |
| `PullRequest`           | `pull_requests`           | PR / MR records                         |
| `Review`                | `reviews`                 | PR code reviews                         |
| `Issue`                 | `issues`                  | Issue / ticket records                  |
| `Release`               | `releases`                | Release publishes                       |
| `Tag`                   | `tags`                    | Git tag references                      |
| `RepositoryContributor` | `repository_contributors` | Contributor activity aggregates         |
| `RepositoryStatistics`  | `repository_statistics`   | Point-in-time repo metrics              |

### Relationship rules

- `Workspace` / `ConnectedAccount` → `Repository`: **CASCADE**
- `GitProvider` → `Repository`: **RESTRICT**
- `Repository` → engineering history (`Commit`, `PullRequest`, etc.): **CASCADE**
- Engineering history is **immutable** — no `deleted_at` on commits, PRs, issues, or reviews

---

## Knowledge Domain (Phase 6)

| Model             | Table               | Purpose                                    |
| ----------------- | ------------------- | ------------------------------------------ |
| `KnowledgeSource` | `knowledge_sources` | Canonical pointer to engineering artifacts |
| `Documentation`   | `documentation`     | Synced docs (README, wiki, ADR, etc.)      |
| `KnowledgeChunk`  | `knowledge_chunks`  | RAG text chunks (soft-delete supported)    |
| `Embedding`       | `embeddings`        | pgvector embeddings (`vector(1536)`)       |
| `Citation`        | `citations`         | Traceable excerpts for AI grounding        |

### RAG pipeline flow

```
Repository → Documentation / KnowledgeSource → KnowledgeChunk → Embedding
                                                      ↓
                                                  Citation → Message / AIResponse
```

---

## AI Domain (Phase 7)

| Model                | Table                   | Purpose                                      |
| -------------------- | ----------------------- | -------------------------------------------- |
| `Conversation`       | `conversations`         | Chat session (soft-delete supported)         |
| `Message`            | `messages`              | Thread turns (user, assistant, system, tool) |
| `AIResponse`         | `ai_responses`          | Provider metadata for assistant messages     |
| `PromptHistory`      | `prompt_history`        | Audit log of prompts sent to models          |
| `ModelUsage`         | `model_usages`          | Token / cost tracking per inference          |
| `ConversationMemory` | `conversation_memories` | Long-term context snippets                   |
| `PinnedConversation` | `pinned_conversations`  | Per-user pinned chats                        |

---

## Search Domain (Phase 8)

| Model           | Table              | Purpose                    |
| --------------- | ------------------ | -------------------------- |
| `SearchHistory` | `search_histories` | Immutable search query log |
| `SavedSearch`   | `saved_searches`   | Named reusable queries     |
| `SearchCache`   | `search_cache`     | TTL-based result cache     |

---

## Platform Domain (Phase 8)

| Model                    | Table                      | Purpose                            |
| ------------------------ | -------------------------- | ---------------------------------- |
| `Notification`           | `notifications`            | In-app notifications (soft-delete) |
| `NotificationPreference` | `notification_preferences` | Per-user channel prefs             |
| `AuditLog`               | `audit_logs`               | Immutable security / activity log  |
| `AnalyticsSnapshot`      | `analytics_snapshots`      | Aggregated metrics snapshots       |
| `BackgroundJob`          | `background_jobs`          | BullMQ job tracking                |

---

## Primary Keys

| Rule         | Convention                                                |
| ------------ | --------------------------------------------------------- |
| Type         | `UUID` (`@db.Uuid`)                                       |
| Default      | `@default(uuid())` via `uuid-ossp` or `gen_random_uuid()` |
| Prisma field | `id String @id @default(uuid()) @db.Uuid`                 |

All top-level entities use UUID primary keys for distributed-system safety and to avoid sequential ID enumeration attacks.

---

## Timestamp Fields

Every model **must** include:

```prisma
createdAt DateTime  @default(now()) @map("created_at")
updatedAt DateTime  @updatedAt       @map("updated_at")
```

| Field       | Purpose                                         |
| ----------- | ----------------------------------------------- |
| `createdAt` | Immutable record creation time                  |
| `updatedAt` | Automatically maintained last-modification time |

---

## Soft Delete

Logical deletion uses a nullable timestamp — never hard-delete user-facing data in production:

```prisma
deletedAt DateTime? @map("deleted_at")
```

| Rule              | Detail                                                        |
| ----------------- | ------------------------------------------------------------- |
| Default queries   | Filter `WHERE deleted_at IS NULL`                             |
| Prisma middleware | Apply global soft-delete filter in `PrismaService` (Phase 2+) |
| Hard delete       | Reserved for GDPR erasure jobs and dev/test resets only       |

---

## Naming Conventions

| Layer              | Convention                 | Example                      |
| ------------------ | -------------------------- | ---------------------------- |
| Database tables    | `snake_case`, **plural**   | `users`, `workspace_members` |
| Database columns   | `snake_case`               | `created_at`, `user_id`      |
| Prisma models      | `PascalCase`, **singular** | `User`, `WorkspaceMember`    |
| Prisma fields      | `camelCase`                | `createdAt`, `userId`        |
| Prisma enums       | `PascalCase`               | `UserStatus`, `JobStatus`    |
| Enum values        | `SCREAMING_SNAKE_CASE`     | `PENDING_VERIFICATION`       |
| Foreign keys       | `{relation}Id`             | `userId`, `workspaceId`      |
| Join tables        | `{entity_a}_{entity_b}`    | `workspace_members`          |
| Indexes            | `idx_{table}_{columns}`    | `idx_users_email`            |
| Unique constraints | `uq_{table}_{columns}`     | `uq_users_email`             |

Use `@map("snake_case")` on every field that differs from the database column name.
Use `@@map("plural_snake_table")` on every model.

---

## Relationship Rules

### Cardinality

| Pattern      | Prisma syntax                                                                |
| ------------ | ---------------------------------------------------------------------------- |
| One-to-many  | Foreign key on the "many" side                                               |
| One-to-one   | `@unique` on the foreign key                                                 |
| Many-to-many | Explicit join model (never implicit `@relation` arrays without a join table) |

### Required practices

1. **Always name relations** on both sides for readability.
2. **Foreign keys are indexed** — add `@@index([foreignKeyField])`.
3. **Join tables** carry their own `id`, timestamps, and domain-specific columns (e.g. `role`).
4. **Avoid circular required relations** — at least one side must be optional.

---

## Cascade Rules

| Scenario                                         | `onDelete`        | Rationale                                    |
| ------------------------------------------------ | ----------------- | -------------------------------------------- |
| Parent owns child exclusively (sessions, tokens) | `Cascade`         | Child has no meaning without parent          |
| Child is a shared resource (documents)           | `Restrict`        | Prevent accidental orphaning                 |
| Optional association                             | `SetNull`         | Preserve child when parent is removed        |
| Audit / log tables                               | `Restrict`        | Never auto-delete audit history              |
| Soft-deleted parent                              | Application-level | Cascade soft-delete in service layer, not DB |

> **Rule of thumb:** prefer `Restrict` at the database level and handle cascading in the service layer for business-critical entities.

---

## Migration Rules

1. **Never edit applied migrations** — always create a new migration.
2. **One concern per migration** — don't mix unrelated schema changes.
3. **Descriptive names** — `add_users_table`, `add_workspace_status_enum_value`.
4. **Review SQL** — inspect generated SQL before applying to staging/production.
5. **Backward compatible** — add columns as nullable first, backfill, then enforce `NOT NULL`.
6. **Enum changes** — add new values in a separate migration; never rename/remove in place.
7. **pgvector** — extension is enabled via `extensions = [vector]` in the datasource block.
8. **Seed data** — belongs in `prisma/seed.ts`, never in migration SQL (except static reference data).
9. **Production** — use `prisma migrate deploy`; never `db push` in production.

### Workflow

```bash
# Development
npm run db:migrate        # Create & apply migration
npm run db:generate       # Regenerate Prisma Client
npm run db:seed           # Run seed script

# CI / Production
npm run db:migrate:deploy # Apply pending migrations only
```

---

## PostgreSQL Extensions

| Extension           | Purpose                                 | Status                      |
| ------------------- | --------------------------------------- | --------------------------- |
| `vector` (pgvector) | Semantic / similarity search embeddings | Enabled in schema (Phase 1) |

Vector columns will use `Unsupported("vector(n)")` until native Prisma vector support is stable.

---

## Scripts Reference

| Script        | Command                | Purpose                      |
| ------------- | ---------------------- | ---------------------------- |
| `db:generate` | `prisma generate`      | Regenerate Prisma Client     |
| `db:push`     | `prisma db push`       | Push schema to DB (dev only) |
| `db:migrate`  | `prisma migrate dev`   | Create & apply migration     |
| `db:reset`    | `prisma migrate reset` | Drop, migrate, and seed      |
| `db:studio`   | `prisma studio`        | Visual database browser      |
| `db:seed`     | `prisma db seed`       | Run `prisma/seed.ts`         |
| `db:format`   | `prisma format`        | Format schema file           |
| `db:validate` | `prisma validate`      | Validate schema syntax       |

---

## Environment

`DATABASE_URL` must be set in `.env` (backend) or the monorepo root `.env`:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

Loaded by `prisma.config.ts` via `env('DATABASE_URL')`.

---

## Troubleshooting

### `extension "vector" is not available`

Your local PostgreSQL does **not** have **pgvector** installed. The schema requires it for semantic search embeddings.

**Option A — Install pgvector on Windows PostgreSQL 16 (recommended for your setup)**

1. Open **PowerShell as Administrator**
2. Run:

```powershell
cd c:\AI-Digital-Twin-Platform\apps\backend
powershell -ExecutionPolicy Bypass -File .\prisma\scripts\install-pgvector-windows.ps1
```

3. Verify:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d ai_digital_twin -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

4. Retry:

```powershell
npm run db:push
```

**Option B — Use Docker (project default)**

The repo includes `pgvector/pgvector:pg17` in `docker-compose.yml`. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), then:

```powershell
cd c:\AI-Digital-Twin-Platform
docker compose up -d postgres
```

Point `DATABASE_URL` to `postgresql://postgres:postgres@localhost:5432/ai_digital_twin?schema=public` and stop the local Windows PostgreSQL service if port 5432 conflicts.

**Option C — Build from source (official)**

See [pgvector Windows install docs](https://github.com/pgvector/pgvector#windows).
