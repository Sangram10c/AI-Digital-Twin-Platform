# Phase 14 — Background Job Architecture

> **Status: ✅ Implemented**
>
> BullMQ job queue infrastructure is implemented in `apps/backend/src/jobs/`. Redis ≥ 5.0 is required.

---

## Architecture

```
HTTP Handler / Scheduler / Webhook
          │
          ▼
    BullMQ Queue (Redis ≥ 5.0)
          │
    ┌─────┴──────────┐
    ▼                ▼
 Worker           Worker
 (Processor)      (Processor)
    │                │
    ▼                ▼
  Service Layer    Service Layer
    │
    ▼
PostgreSQL / Redis / AI Provider
```

---

## Queue Definitions

Queue names are defined in `apps/backend/src/jobs/queues/index.ts`:

```typescript
export const QUEUES = {
  EMBEDDING: 'embedding',
  NOTIFICATION: 'notification',
  EMAIL: 'email',
  AI_PROCESSING: 'ai-processing',
  ANALYTICS: 'analytics',
} as const;
```

## Queues

| Queue Name      | Constant               | Purpose                                            |
| --------------- | ---------------------- | -------------------------------------------------- |
| `embedding`     | `QUEUES.EMBEDDING`     | Generate pgvector embeddings for knowledge chunks  |
| `notification`  | `QUEUES.NOTIFICATION`  | Deliver in-app / push notifications to users       |
| `email`         | `QUEUES.EMAIL`         | Send transactional email messages                  |
| `ai-processing` | `QUEUES.AI_PROCESSING` | AI extraction: digest generation, heuristics       |
| `analytics`     | `QUEUES.ANALYTICS`     | Aggregate analytics snapshots per workspace/period |

> **Note:** Webhook processing and repository synchronization are handled directly by the `webhook` and `repository` modules using BullMQ internally rather than the shared `QUEUES` constant.

---

## Redis Requirement

BullMQ **requires Redis ≥ 5.0**. The platform uses Redis at `REDIS_URL` (see `apps/backend/.env`).

> **Local development:** Redis 3.x (Windows default service) will fail with `Redis version needs to be greater or equal than 5.0.0`. Use a Redis 5+ installation.

---

## Workers / Processors

Worker processors reside in `apps/backend/src/jobs/processors/`. The analytics aggregation processor is registered by `AnalyticsModule` and runs as:

| Processor                         | Queue       | What it does                                                        |
| --------------------------------- | ----------- | ------------------------------------------------------------------- |
| `AnalyticsAggregationProcessor`   | `analytics` | Aggregates 8 metric domains, stores JSONB snapshot, caches in Redis |
| `EmbeddingProcessor` (per module) | `embedding` | Fetches pending chunks, calls AI provider, stores pgvector vector   |
| Webhook ingest worker             | internal    | Parses and dispatches GitHub webhook events                         |
| Repository sync worker            | internal    | Syncs branches, commits, PRs, issues, releases                      |

---

## BullMQ Patterns Used

| Pattern             | Usage                                                               |
| ------------------- | ------------------------------------------------------------------- |
| Retry with backoff  | Embedding, AI-processing queues retry on provider errors            |
| Concurrency control | Analytics worker processes one workspace at a time per slot         |
| Job deduplication   | Analytics jobs check for duplicate period before enqueuing          |
| Fire-and-forget     | `ModelUsage` + `PromptHistory` persistence from chat orchestrator   |
| Idempotency         | Embedding generation uses content checksum to skip unchanged chunks |

---

## Related Documents

- [BullMQ Queues Detail](./queues.md)
- [Workers](./workers.md)
- [Retries](./retries.md)
- [Analytics & Insights](../backend/analytics.md)
- [Embedding Pipeline](../backend/embedding-pipeline.md)
