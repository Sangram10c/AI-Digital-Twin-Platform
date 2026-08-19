# Backend Module Documentation

Implementation docs for completed NestJS backend phases (`apps/backend`).

| Document                                                           | Status   | Phase | Description                                                         |
| ------------------------------------------------------------------ | -------- | ----- | ------------------------------------------------------------------- |
| [backend-foundation.md](./backend-foundation.md)                   | Complete | 01    | Config, health, security, logging, global filters                   |
| [identity-module.md](./identity-module.md)                         | Complete | 02    | Auth, JWT, users, sessions, refresh tokens                          |
| [workspace-module.md](./workspace-module.md)                       | Complete | 03    | Workspaces, members, permissions, RBAC                              |
| [organizations-module.md](./organizations-module.md)               | Complete | 03    | Multi-tenant organization hierarchies and shared scopes             |
| [settings-module.md](./settings-module.md)                         | Complete | 03    | Workspace and user configuration preferences                        |
| [github-integration.md](./github-integration.md)                   | Complete | 04    | GitHub OAuth, multi-account, workspace link                         |
| [integrations-module.md](./integrations-module.md)                 | Complete | 04    | Third-party developer platform connectivity                         |
| [webhook-processing.md](./webhook-processing.md)                   | Complete | 04    | GitHub webhooks, BullMQ routing, incremental sync                   |
| [repository-sync.md](./repository-sync.md)                         | Complete | 05    | Paginated entity sync, docs crawl, automated pipeline               |
| [knowledge-processing.md](./knowledge-processing.md)               | Complete | 06    | Knowledge normalization, chunking, BullMQ pipeline                  |
| [documents-module.md](./documents-module.md)                       | Complete | 06    | Documentation entities (ADRs, wikis, READMEs)                       |
| [uploads-module.md](./uploads-module.md)                           | Complete | 06    | File upload handling and storage integration                        |
| [knowledge-heuristics-module.md](./knowledge-heuristics-module.md) | Complete | 07    | Deterministic metadata extraction without LLM calls                 |
| [ai-knowledge-extraction.md](./ai-knowledge-extraction.md)         | Complete | 07    | Provider-based AI extraction, prompts, queues, incremental analysis |
| [ai-module.md](./ai-module.md)                                     | Complete | 07    | AI provider orchestration layer across LLM vendors                  |
| [hybrid-ai-pipeline.md](./hybrid-ai-pipeline.md)                   | Complete | 08    | Heuristics → digests → AI → embeddings hand-off                     |
| [embedding-pipeline.md](./embedding-pipeline.md)                   | Complete | 09    | pgvector embedding queue, providers, checksums, APIs                |
| [hybrid-search-engine.md](./hybrid-search-engine.md)               | Complete | 10    | Hybrid vector + keyword search, ranking, cache, metrics             |
| [source-code-ingestion.md](./source-code-ingestion.md)             | Complete | 10    | Prioritized `.ts`/`.js` symbol chunks for code-aware RAG            |
| [ai-models-used.md](./ai-models-used.md)                           | Complete | 11    | AI providers, models, fallback chain                                |
| [ai-chat.md](./ai-chat.md)                                         | Complete | 12    | 10-step RAG pipeline, SSE streaming, conversation management        |
| [memory-module.md](./memory-module.md)                             | Complete | 12    | Long-term conversation memory and importance scoring                |
| [notifications-module.md](./notifications-module.md)               | Complete | 12    | In-app notification delivery and preferences                        |
| [timeline-module.md](./timeline-module.md)                         | Complete | 12    | Chronological and milestone engineering history                     |
| [analytics.md](./analytics.md)                                     | Complete | 13    | 8-domain metrics, BullMQ aggregation, Redis caching, snapshots      |
| [admin-module.md](./admin-module.md)                               | Scaffold | 15    | System administration and audit views                               |
| [google-module.md](./google-module.md)                             | Scaffold | 15    | Google OAuth and future Workspace integration                       |

---

## Related Design Documents

- [Database ERD (07)](../07-database-erd/README.md) ✅
- [API Design (09)](../09-api-design/README.md) ✅
- [GitHub Integration (11)](../11-github-integration/README.md) ✅
- [AI / RAG Architecture (12)](../12-ai-rag-architecture/README.md) ✅
- [Search Engine Design (13)](../13-search-engine-design/README.md) ✅
- [Background Jobs (14)](../14-background-jobs/README.md) ✅

---

## Local Commands

See [`apps/backend/COMMANDS.md`](../../apps/backend/COMMANDS.md) for Redis, Prisma, Swagger, and webhook testing.

---

## Free GitHub APIs (official)

OAuth, REST, and webhooks used by this platform are **GitHub's free public APIs** (rate-limited). Sources:

- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- https://docs.github.com/en/rest
- https://docs.github.com/en/webhooks
- https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api

Last updated: 2026-08-19
