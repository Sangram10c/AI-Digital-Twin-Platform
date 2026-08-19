# Phase 13 — Analytics & Insights: Implementation Plan

## Classification

| Field              | Value                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| **Classification** | LARGE                                                                         |
| **Impact Score**   | 9                                                                             |
| **Branch**         | `ANALYTICS-INSIGHTS`                                                          |
| **Workflow**       | Specify → Clarify → Plan → Checklist → Tasks → Analyze → Implement → Converge |

---

## Audit Findings — What Already Exists

### ✅ Schema Models — All Present

Every model required for analytics data sourcing already exists in the schema. No source data models need to be created.

| Model                  | Schema Line | Key Analytics Fields                                                                                    |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| `AnalyticsSnapshot`    | 1494        | `snapshotType`, `periodStart`, `periodEnd`, `metrics (JsonB)`, `workspaceId`                            |
| `ModelUsage`           | 1236        | `provider`, `model`, `promptTokens`, `completionTokens`, `totalTokens`, `estimatedCostUsd`, `latencyMs` |
| `SearchHistory`        | 1316        | `query`, `searchType`, `resultsCount`, `latencyMs`, `workspaceId`, `repositoryId`                       |
| `AuditLog`             | 1465        | `action`, `entityType`, `workspaceId`, `userId`, `metadata`                                             |
| `BackgroundJob`        | 1517        | `jobType`, `status`, `startedAt`, `completedAt`, `errorMessage`, `workspaceId`                          |
| `Conversation`         | 1123        | `workspaceId`, `userId`, `repositoryId`, `status`, `aiProvider`, `aiModel`                              |
| `Message`              | 1161        | `role`, `tokenCount`, `sequenceNumber`                                                                  |
| `AIResponse`           | 1189        | `finishReason`, `latencyMs`                                                                             |
| `RepositoryStatistics` | 863         | `starCount`, `forkCount`, `commitCount`, `contributorCount`, `openIssueCount`, `openPullRequestCount`   |
| `SyncHistory`          | 515         | `trigger`, `status`, `repositoriesSynced`, `commitsSynced`, `errorMessage`                              |
| `KnowledgeSource`      | 915         | `sourceType`, `workspaceId`, `repositoryId`                                                             |
| `KnowledgeChunk`       | 977         | `workspaceId`, `repositoryId`, `deletedAt`, `tokenCount`                                                |
| `Embedding`            | 1022        | `status`, `provider`, `model`, `latencyMs`, `tokenUsage`, `retryCount`, `errorMessage`                  |

---

### 🟡 Analytics Module — Dead Skeleton

| File                                                                                                                        | Status                                               |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [`analytics.module.ts`](file:///c:/AI-Digital-Twin-Platform/apps/backend/src/modules/analytics/analytics.module.ts)         | Skeleton — no imports, no PrismaService, no BullMQ   |
| [`analytics.controller.ts`](file:///c:/AI-Digital-Twin-Platform/apps/backend/src/modules/analytics/analytics.controller.ts) | Skeleton — `@Controller('analytics')` with no routes |
| [`analytics.service.ts`](file:///c:/AI-Digital-Twin-Platform/apps/backend/src/modules/analytics/analytics.service.ts)       | Skeleton — empty injectable                          |
| `dto/`, `interfaces/`, `constants/`, `types/`                                                                               | Empty placeholder `index.ts` files only              |

**`AnalyticsModule` is NOT imported in [`app.module.ts`](file:///c:/AI-Digital-Twin-Platform/apps/backend/src/app.module.ts).** It is completely inactive.

---

### ✅ BullMQ Infrastructure — Mature, Reusable

Working pattern confirmed in `webhook`, `repository`, `knowledge`, and `embeddings` modules:

- `BullModule.registerQueue()` in module
- `@Processor()` on processor class
- `@InjectQueue()` in queue service
- Dead-letter queue pattern established

`BackgroundJobType.ANALYTICS_AGGREGATION` **already exists** in the schema enum.
Queue name constant is **not yet registered** in `src/jobs/queues/index.ts`.

---

### ✅ Auth Infrastructure — Reusable

- `JwtAuthGuard` — `modules/auth/guards/jwt-auth.guard.ts`
- `@CurrentUser()` decorator — `common/decorators/current-user.decorator.ts`
- `RolesGuard` — `common/guards/roles.guard.ts`

No analytics-specific guards exist. Existing guards cover the requirements.

---

### ❌ Redis/Cache — Not Wired Into NestJS

Redis is configured in `docker-compose.yml` and `.env` but:

- No `CacheModule`, `CACHE_MANAGER`, `InjectRedis`, or `cache-manager` usage exists anywhere in `src/`
- BullMQ uses Redis internally but exposes no injectable Redis client
- A `RedisModule` must be created as part of this phase

---

### ❌ Analytics BullMQ Queue — Not Registered

`ANALYTICS_AGGREGATION` job type exists in the schema but:

- No queue constant in `src/jobs/queues/index.ts`
- No `@Processor` class exists
- No queue producer service exists

---

### ❌ Analytics Documentation

`docs/backend/analytics.md` does not exist.

---

## Open Questions

> [!IMPORTANT]
> **Q1 — AnalyticsSnapshot: repository-level granularity**
>
> The current `AnalyticsSnapshot` model only has `workspaceId`. Repository-scoped snapshots (e.g., per-repository embedding health, per-repository search analytics) require either:
>
> - **Option A:** Store `repositoryId` in the `metrics` JsonB field — no schema change, but not column-indexable
> - **Option B (Recommended):** Add nullable `repositoryId` column to `AnalyticsSnapshot` — small additive migration, enables proper indexing and scoped filtering
>
> Please confirm: **Option A or Option B?**

> [!IMPORTANT]
> **Q2 — AnalyticsSnapshotType enum: missing categories**
>
> The existing enum covers: `REPOSITORY`, `DEVELOPER`, `AI`, `SEARCH`, `WORKSPACE`, `PLATFORM`
>
> Phase 13 requires tracking: `KNOWLEDGE`, `CONVERSATION`, `JOB`, `RAG`, `EMBEDDING`
>
> - **Option A (Recommended):** Extend the enum — clean type safety, proper filtering, small additive migration
> - **Option B:** Use existing types with sub-categorization inside `metrics` JsonB — no migration
>
> Please confirm: **Option A or Option B?**

> [!IMPORTANT]
> **Q3 — Platform-wide admin analytics**
>
> The request mentions "Global/admin analytics require appropriate permissions."
>
> Does an existing `UserRole.ADMIN` or platform-level admin role exist in the codebase, or should workspace-owner be the maximum permission level for analytics access in this phase?

---

## Proposed Changes

---

### Schema (Conditional — Pending Q1 & Q2 answers)

#### [MODIFY] [schema.prisma](file:///c:/AI-Digital-Twin-Platform/apps/backend/prisma/schema.prisma)

If Q1=Option B:

- Add nullable `repositoryId` to `AnalyticsSnapshot`
- Add `@@index([repositoryId])` on `analytics_snapshots`

If Q2=Option A:

- Extend `AnalyticsSnapshotType` with: `KNOWLEDGE`, `CONVERSATION`, `JOB`, `RAG`, `EMBEDDING`

One migration covers both changes.

---

### Infrastructure

#### [MODIFY] [`src/jobs/queues/index.ts`](file:///c:/AI-Digital-Twin-Platform/apps/backend/src/jobs/queues/index.ts)

Add `ANALYTICS: 'analytics'` constant

#### [NEW] `src/common/modules/redis.module.ts`

Injectable Redis client using `ioredis` (already a transitive dependency via `@nestjs/bullmq`)

#### [MODIFY] [`app.module.ts`](file:///c:/AI-Digital-Twin-Platform/apps/backend/src/app.module.ts)

Import `AnalyticsModule`

---

### Analytics Module — Full Build

#### [MODIFY] [`analytics.module.ts`](file:///c:/AI-Digital-Twin-Platform/apps/backend/src/modules/analytics/analytics.module.ts)

Wire PrismaService, BullMQ queue registration, Redis, all services

#### [MODIFY] [`analytics.controller.ts`](file:///c:/AI-Digital-Twin-Platform/apps/backend/src/modules/analytics/analytics.controller.ts)

10 endpoints with `JwtAuthGuard`, `AnalyticsPermissionService`, Swagger docs, `AnalyticsFilterDto`

#### [MODIFY] [`analytics.service.ts`](file:///c:/AI-Digital-Twin-Platform/apps/backend/src/modules/analytics/analytics.service.ts)

Thin orchestrator — delegates to specialized services

#### [NEW] `analytics/services/analytics-repository.service.ts`

All Prisma aggregate queries, scoped by workspace/repository/period

#### [NEW] `analytics/services/analytics-aggregator.service.ts`

Metric calculation across all 8 categories — called by the BullMQ processor

#### [NEW] `analytics/services/analytics-snapshot.service.ts`

Snapshot upsert, lookup by type + period + workspace + repository

#### [NEW] `analytics/services/analytics-metrics.service.ts`

Health threshold evaluation, trend data construction, alert condition detection

#### [NEW] `analytics/services/analytics-cache.service.ts`

Redis get/set/invalidate with per-category configurable TTL

#### [NEW] `analytics/services/analytics-permission.service.ts`

Workspace membership check, repository access check, admin scope validation

#### [NEW] `analytics/jobs/analytics-aggregation-queue.service.ts`

BullMQ producer — enqueues `ANALYTICS_AGGREGATION` jobs (per workspace, per period)

#### [NEW] `analytics/processors/analytics-aggregation.processor.ts`

`@Processor('analytics')` — runs aggregation, persists snapshots, updates Redis cache

#### [NEW] `analytics/dto/analytics-filter.dto.ts`

`workspaceId`, `repositoryId?`, `dateFrom?`, `dateTo?`, `period?` with class-validator

#### [NEW] `analytics/dto/analytics-response.dto.ts`

Typed response shapes for each of the 8 metric categories + health + overview

#### [NEW] `analytics/interfaces/analytics-metrics.interface.ts`

TypeScript interfaces for all metric categories (used across services)

#### [NEW] `analytics/constants/analytics.constants.ts`

Queue name, cache TTLs per category, health thresholds (all named constants)

---

### Documentation

#### [NEW] `docs/backend/analytics.md`

Architecture, metric definitions, data sources, snapshot strategy, aggregation strategy,
cache strategy, permission model, API reference, performance notes

---

## API Design

| Endpoint                              | Auth Required          | Scope                       |
| ------------------------------------- | ---------------------- | --------------------------- |
| `GET /api/v1/analytics/overview`      | JWT + workspace member | Workspace summary           |
| `GET /api/v1/analytics/platform`      | JWT + admin role       | Platform-wide               |
| `GET /api/v1/analytics/repositories`  | JWT + workspace member | Workspace repositories      |
| `GET /api/v1/analytics/knowledge`     | JWT + workspace member | Workspace knowledge         |
| `GET /api/v1/analytics/search`        | JWT + workspace member | Workspace search            |
| `GET /api/v1/analytics/rag`           | JWT + workspace member | Workspace RAG               |
| `GET /api/v1/analytics/ai`            | JWT + workspace member | Workspace AI usage          |
| `GET /api/v1/analytics/conversations` | JWT + workspace member | Workspace conversations     |
| `GET /api/v1/analytics/jobs`          | JWT + workspace member | Workspace jobs              |
| `GET /api/v1/analytics/health`        | JWT + workspace member | Workspace health indicators |

All endpoints accept: `?workspaceId&repositoryId&dateFrom&dateTo&period`

---

## Aggregation Pipeline

```
Scheduled trigger (cron/manual)
   ↓
AnalyticsAggregationQueueService.enqueue()
   ↓
BullMQ: analytics queue
   ↓
AnalyticsAggregationProcessor.process()
   ↓ reads from (bounded time window):
   ModelUsage · SearchHistory · Conversation · Message
   AIResponse · BackgroundJob · KnowledgeChunk
   Embedding · SyncHistory · RepositoryStatistics
   ↓
AnalyticsAggregatorService.aggregate()
   ↓
AnalyticsSnapshotService.upsert()
   ↓ writes to:
   analytics_snapshots table
   ↓
AnalyticsCacheService.set() [TTL per category]
   ↓
Redis

API Request
   ↓
AnalyticsCacheService.get()  [hit → return]
   ↓ [miss]
AnalyticsSnapshotService.findLatest()
   ↓
Response
```

**API never queries raw activity tables directly for aggregated metrics.**

---

## Health Indicator Thresholds (Deterministic — No LLM)

| Indicator         | Healthy ✅                         | Degraded ⚠️            | Critical 🔴           |
| ----------------- | ---------------------------------- | ---------------------- | --------------------- |
| Repository Sync   | Last sync < 24h, failure rate = 0% | 24–72h OR < 5% failure | > 72h OR ≥ 5% failure |
| Embedding         | Failed < 1% of total               | 1–5%                   | > 5%                  |
| Search            | Zero-result rate < 10%             | 10–25%                 | > 25%                 |
| AI Provider       | Failure rate < 2%                  | 2–10%                  | > 10%                 |
| Queue             | Failure rate < 1%                  | 1–5%                   | > 5%                  |
| Knowledge Backlog | Pending < 100 chunks               | 100–500                | > 500                 |

All thresholds are named constants in `analytics.constants.ts`.

---

## Verification Plan

### Automated

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma format
npx prisma validate
npx prisma generate
```

### Test Coverage Plan

- **Unit:** aggregation logic, health threshold calculation, permission logic, cost calculation, trend aggregation
- **Integration:** analytics queries, snapshot persistence, Redis cache hit/miss, permission filtering, workspace isolation, repository isolation
- **Job:** aggregation processor, retry behavior, failure handling, idempotency
- **E2E:** activity → aggregation job → snapshot → API response correct values
- **Security:** unauthorized workspace access, unauthorized repository analytics, IDOR validation, user-scope enforcement
