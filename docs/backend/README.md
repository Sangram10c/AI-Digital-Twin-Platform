# Backend module documentation

Implementation docs for completed NestJS backend phases (`apps/backend`).

| Document                                                   | Status   | Description                                                         |
| ---------------------------------------------------------- | -------- | ------------------------------------------------------------------- |
| [backend-foundation.md](./backend-foundation.md)           | Complete | Config, health, security, logging                                   |
| [identity-module.md](./identity-module.md)                 | Complete | Auth, JWT, users                                                    |
| [workspace-module.md](./workspace-module.md)               | Complete | Workspaces, members, permissions                                    |
| [github-integration.md](./github-integration.md)           | Complete | GitHub OAuth, multi-account, workspace link                         |
| [webhook-processing.md](./webhook-processing.md)           | Complete | GitHub webhooks, BullMQ routing, incremental sync                   |
| [knowledge-processing.md](./knowledge-processing.md)       | Complete | Knowledge normalization, chunking, BullMQ pipeline                  |
| [repository-sync.md](./repository-sync.md)                 | Complete | Paginated entity sync, docs crawl, automated pipeline               |
| [ai-knowledge-extraction.md](./ai-knowledge-extraction.md) | Complete | Provider-based AI extraction, prompts, queues, incremental analysis |
| [hybrid-ai-pipeline.md](./hybrid-ai-pipeline.md)           | Complete | Heuristics → digests → AI → embeddings hand-off                     |
| [embedding-pipeline.md](./embedding-pipeline.md)           | Complete | pgvector embedding queue, providers, checksums, APIs                |
| [hybrid-search-engine.md](./hybrid-search-engine.md)       | Complete | Hybrid vector + keyword search, ranking, cache, metrics             |
| [source-code-ingestion.md](./source-code-ingestion.md)     | Complete | Prioritized `.ts`/`.js` symbol chunks for code-aware RAG            |

## Related (design / planning tree)

- [GitHub Integration (11)](../11-github-integration/README.md)
- [AI / RAG Architecture (12)](../12-ai-rag-architecture/README.md) ✅
- [Search Engine Design (13)](../13-search-engine-design/README.md) ✅
- [API Design — GitHub](../09-api-design/github.md)
- [Background Jobs (14)](../14-background-jobs/README.md) 🟡 current

## Local commands

See [`apps/backend/COMMANDS.md`](../../apps/backend/COMMANDS.md) for Redis, Prisma, Swagger, and webhook testing.

## Current implementation notes

| Module                     | Path                        | Notes                                                                       |
| -------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| GitHub OAuth               | `src/modules/github/`       | Live                                                                        |
| Webhooks                   | `src/modules/webhook/`      | Live — payload upserts via BullMQ                                           |
| Knowledge processing       | `src/modules/knowledge/`    | Live — normalized sources, chunk generation via BullMQ                      |
| Repository crawl/sync APIs | `src/modules/repository/`   | Live — paginated entity synchronization, docs crawl, pipeline orchestration |
| AI knowledge extraction    | `src/modules/ai-knowledge/` | Live — provider-based engineering knowledge extraction via BullMQ           |
| Embeddings (pgvector)      | `src/modules/embeddings/`   | Live — BullMQ embedding pipeline, multi-provider, checksum skip             |
| Hybrid search              | `src/modules/search/`       | Live — vector + FTS + ranking; `POST /api/v1/search`                        |
| Source-code ingestion      | knowledge services          | Live — free-tier capped prioritized `.ts`/`.js` symbol chunks               |

## Free GitHub APIs (official)

OAuth, REST, and webhooks used by this platform are **GitHub’s free public APIs** (rate-limited). Sources:

- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- https://docs.github.com/en/rest
- https://docs.github.com/en/webhooks
- https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api

Last updated: 2026-07-30
