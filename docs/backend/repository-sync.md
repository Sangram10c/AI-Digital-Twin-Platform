# Repository Sync & Documentation Pipeline

Production repository synchronization for the AI Digital Twin backend.

**Module:** `apps/backend/src/modules/repository/`

## Pipeline

```text
POST /api/v1/repositories/:id/sync
        │
        ▼
repository-pipeline queue
        │
        ├─► repository-entity-sync   (paginated GitHub API)
        │         │
        │         ▼
        ├─► repository-documentation-sync  (Contents / git tree crawl)
        │         │
        │         ▼
        └─► knowledge-repository → chunk-generation
```

Webhook automation:

```text
GitHub webhook
  → domain DB upsert
  → knowledge jobs (commits/PRs/issues)
  → documentation sync (when docs/package.json change)
  → knowledge + chunks
```

## Pagination strategy

- GitHub list endpoints use `page` + `per_page` (100)
- Async generators yield **one page at a time** (memory-safe)
- Checkpoints stored in `repositories.provider_metadata.syncCheckpoints`
- Resume continues from last incomplete page after interruption
- Max pages per entity configurable (`maxPagesPerEntity`, default 50)

Entities synced: commits, pull requests (+ reviews), issues, releases, tags, contributors.

## Documentation crawler

Uses recursive git tree + Contents API for:

- README / LICENSE / CHANGELOG / CONTRIBUTING / SECURITY / CODE_OF_CONDUCT
- `docs/**`, `architecture/**`, `adr/**`, `design/**`, `api/**`, `wiki/**`, `.github/*.md`

Skips `node_modules`, `dist`, binaries, images, etc.

Dedupes via GitHub blob SHA (`providerDocId`) — unchanged files are skipped.

## Queues

| Queue                           | Purpose                          |
| ------------------------------- | -------------------------------- |
| `repository-pipeline`           | Orchestrate full run             |
| `repository-entity-sync`        | Paginated entity sync            |
| `repository-documentation-sync` | Doc crawl then enqueue knowledge |
| `repository-dead-letter`        | Exhausted retries                |

Knowledge queues remain in the Knowledge module.

## API

| Method | Path                                          | Description               |
| ------ | --------------------------------------------- | ------------------------- |
| POST   | `/api/v1/repositories/:id/sync`               | Start full pipeline       |
| POST   | `/api/v1/repositories/:id/sync/documentation` | Docs only (+ knowledge)   |
| GET    | `/api/v1/repositories/:id/sync/status`        | Checkpoints + queues      |
| GET    | `/api/v1/repositories/pipeline/statistics`    | Workspace totals + queues |

All require JWT + workspace permissions (`workspaceId` in body/query).

## Rate limits

GitHub client respects `X-RateLimit-*` and `Retry-After`, with bounded backoff retries.

## Failure recovery

- BullMQ exponential retries (5)
- Dead-letter queue after exhaustion
- Checkpoints allow resume without re-downloading completed pages
