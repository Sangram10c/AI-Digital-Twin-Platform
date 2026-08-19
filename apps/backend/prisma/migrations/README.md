# Prisma Migrations — AI Digital Twin Platform

## Active Migration History

All 5 migrations below are applied to the production database.
**Do not modify applied migrations.**

| Order | Directory                                           | Description                                                        |
| ----- | --------------------------------------------------- | ------------------------------------------------------------------ |
| 1     | `0_init`                                            | Full baseline schema — all domains through Phase 8 (Platform)      |
| 2     | `20260818113928_phase13_analytics_insights`         | Phase 13: `AnalyticsSnapshot` repository FK + new snapshot types   |
| 3     | `20260818114706_restore_specialized_search_indexes` | Restore pgvector HNSW + pg_trgm GIN indexes dropped by migrate dev |
| 4     | `20260818115255`                                    | Housekeeping / metadata correction migration                       |
| 5     | `20260818135723_restore_gin_search_indexes`         | Final GIN index restoration (tsvector + JSONB + content trgm)      |

---

## Migration Details

### Migration 1 — `0_init` (Baseline)

**Type:** Baseline migration (Prisma `--from-empty` style)

Contains the full schema for all 8 domains as established at Phase 8:

- Identity domain: `users`, `sessions`, `refresh_tokens`, `oauth_tokens`
- Workspace domain: `workspaces`, `workspace_settings`, `workspace_members`
- Git Integration domain: `git_providers`, `connected_accounts`, `webhook_events`, `sync_histories`
- Repository domain: `repositories`, `branches`, `commits`, `pull_requests`, `reviews`, `issues`, `releases`, `tags`, `repository_contributors`, `repository_statistics`
- Knowledge domain: `knowledge_sources`, `documentation`, `knowledge_chunks`, `embeddings`, `citations`
- AI domain: `conversations`, `messages`, `ai_responses`, `prompt_history`, `model_usages`, `conversation_memories`, `pinned_conversations`
- Search & Platform domain: `search_histories`, `saved_searches`, `search_cache`, `notifications`, `notification_preferences`, `audit_logs`, `analytics_snapshots`, `background_jobs`
- Hybrid AI Pipeline domain: `heuristic_metadata`, `repository_digests`, `module_digests`, `pull_request_digests`, `documentation_digests`, `release_digests`, `digest_checksums`, `ai_analyses`, `provider_executions`, `provider_failures`, `ai_execution_logs`

PostgreSQL extensions: `pgvector`, `pg_trgm`

### Migration 2 — `20260818113928_phase13_analytics_insights`

**Type:** Schema change

- Added `repository_id` FK column to `analytics_snapshots` (nullable, enables per-repository analytics snapshots)
- Added new `AnalyticsSnapshotType` enum values: `KNOWLEDGE`, `CONVERSATION`, `JOB`, `RAG`, `EMBEDDING`

### Migration 3 — `20260818114706_restore_specialized_search_indexes`

**Type:** Index restoration (custom SQL)

- Restores pgvector HNSW index on `embeddings.vector`
- Restores pg_trgm GIN index on `knowledge_sources.path`
- These were accidentally dropped when `prisma migrate dev` was run without the `--create-only` flag, which regenerates the migration from the schema diff and loses manually added index definitions

### Migration 4 — `20260818115255`

**Type:** Housekeeping

Minor metadata correction applied during Phase 13 index restoration workflow.

### Migration 5 — `20260818135723_restore_gin_search_indexes`

**Type:** Index restoration (custom SQL)

Final restoration of the GIN indexes declared in `schema.prisma` using `@@index([...], type: Gin)`:

- `idx_knowledge_chunks_search_vector_gin` — tsvector FTS index on `knowledge_chunks`
- `idx_knowledge_chunks_content_trgm` — pg_trgm trigram index on chunk content
- `idx_knowledge_chunks_metadata_gin` — JSONB GIN index on chunk metadata
- Corresponding indexes on `knowledge_sources`, `embeddings`

---

## Why Custom Index SQL Exists in Migrations

Prisma's schema DSL supports `@@index([field], type: Gin)` syntax but does not always correctly emit the operator class (`gin_trgm_ops`, `jsonb_path_ops`) in the generated migration SQL. For these specialized index types:

1. `prisma migrate dev --create-only` generates the migration stub.
2. The SQL inside is manually augmented with the correct operator class before applying.
3. The resulting migration is applied with `prisma migrate dev` or `prisma migrate deploy`.

This is the recommended Prisma approach for complex index types not fully supported by the DSL.

---

## Development Migration Policy

1. Always use `prisma migrate dev --create-only` to create the SQL file for review before applying.
2. Review the generated SQL before running `prisma migrate dev`.
3. Never modify a migration that has already been applied (`migration_lock.toml` tracks applied state).
4. For index-heavy changes, manually verify the SQL contains correct operator classes.
5. After schema changes always run:
   ```bash
   prisma format
   prisma validate
   prisma generate
   ```

---

## Production Migration Policy

- Use `prisma migrate deploy` (never `migrate dev`) in CI/CD and production.
- Run `prisma generate` after `migrate deploy` before starting the app.
- Back up the database before destructive migrations.
- Coordinate index restoration migrations with maintenance windows on large tables.

---

## Backup / Rollback

A backup of the migration state prior to Phase 13 is in:

```
apps/backend/prisma/migrations_backup_pre_phase13/
```

> **Historical record — do not reapply.** This backup exists as a rollback reference only.

---

## Archived Migrations

The following migration naming scheme was described in earlier planning documents but was **never implemented**. The actual migration history uses timestamp-based names:

- `phase_02_identity/` — does not exist; content is in `0_init`
- `phase_03_workspace/` — does not exist; content is in `0_init`
- etc.

The old domain-folder naming was superseded by the single baseline approach (`0_init`) when all domain models were designed together before the first `prisma migrate dev` run.
