# AI Digital Twin — Backend

NestJS backend for the AI Digital Twin Platform.

## Quick start

For Redis, Prisma, GitHub OAuth, and webhook commands, see **[COMMANDS.md](./COMMANDS.md)**.

```bash
# From monorepo root
cp apps/backend/.env.example apps/backend/.env
# Set DATABASE_URL, JWT_SECRET, GITHUB_*, REDIS_URL, GITHUB_WEBHOOK_SECRET, AI provider keys

npm install
npm run --prefix apps/backend db:generate
# Start Redis ≥ 5 first (see COMMANDS.md)
npm run --prefix apps/backend start:dev
```

- API prefix: `/api/v1`
- Health: `/health`, `/ready`, `/live`
- Swagger (non-production): `/api/docs`

---

## Implemented Modules

| Module               | Path                               | Docs                                                                        |
| -------------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| Foundation           | config, health, filters            | [backend-foundation](../../../docs/backend/backend-foundation.md)           |
| Identity             | `src/modules/identity`             | [identity-module](../../../docs/backend/identity-module.md)                 |
| Users                | `src/modules/users`                | —                                                                           |
| Auth                 | `src/modules/auth`                 | [identity-module](../../../docs/backend/identity-module.md)                 |
| Workspaces           | `src/modules/workspaces`           | [workspace-module](../../../docs/backend/workspace-module.md)               |
| Organizations        | `src/modules/organizations`        | —                                                                           |
| Settings             | `src/modules/settings`             | —                                                                           |
| GitHub OAuth         | `src/modules/github`               | [github-integration](../../../docs/backend/github-integration.md)           |
| Integrations         | `src/modules/integrations`         | —                                                                           |
| Webhooks             | `src/modules/webhook`              | [webhook-processing](../../../docs/backend/webhook-processing.md)           |
| Repository           | `src/modules/repository`           | [repository-sync](../../../docs/backend/repository-sync.md)                 |
| Knowledge            | `src/modules/knowledge`            | [knowledge-processing](../../../docs/backend/knowledge-processing.md)       |
| Knowledge Heuristics | `src/modules/knowledge-heuristics` | —                                                                           |
| Documents            | `src/modules/documents`            | —                                                                           |
| Uploads              | `src/modules/uploads`              | —                                                                           |
| AI Knowledge         | `src/modules/ai-knowledge`         | [ai-knowledge-extraction](../../../docs/backend/ai-knowledge-extraction.md) |
| AI                   | `src/modules/ai`                   | —                                                                           |
| Embeddings           | `src/modules/embeddings`           | [embedding-pipeline](../../../docs/backend/embedding-pipeline.md)           |
| Hybrid Search        | `src/modules/search`               | [hybrid-search-engine](../../../docs/backend/hybrid-search-engine.md)       |
| Source-code ingest   | knowledge + chunker services       | [source-code-ingestion](../../../docs/backend/source-code-ingestion.md)     |
| AI Chat              | `src/modules/chat`                 | [ai-chat](../../../docs/backend/ai-chat.md)                                 |
| Conversation Memory  | `src/modules/memory`               | [ai-chat](../../../docs/backend/ai-chat.md#4-conversation-memory)           |
| Notifications        | `src/modules/notifications`        | —                                                                           |
| Timeline             | `src/modules/timeline`             | —                                                                           |
| Analytics            | `src/modules/analytics`            | [analytics](../../../docs/backend/analytics.md)                             |
| Google               | `src/modules/google`               | — (scaffolded)                                                              |
| Admin                | `src/modules/admin`                | — (scaffolded)                                                              |

Module index: [docs/backend/README.md](../../../docs/backend/README.md)

---

## Scripts

| Script               | Purpose                    |
| -------------------- | -------------------------- |
| `start:dev`          | Watch mode                 |
| `build`              | Compile Nest app           |
| `lint` / `typecheck` | Quality gates              |
| `db:generate`        | Generate Prisma Client     |
| `db:validate`        | Validate schema            |
| `db:push`            | Push schema (dev)          |
| `db:migrate:deploy`  | Apply migrations (CI/prod) |
| `db:seed`            | Seed reference/dev data    |
| `test` / `test:e2e`  | Unit / e2e tests           |

---

## Status

**Complete:** Foundation, Identity, Auth, Users, Workspaces, Organizations, Settings, GitHub OAuth/Webhooks, Repository Sync, Knowledge Processing, Knowledge Heuristics, Documents, Uploads, AI Knowledge Extraction, AI providers, Embeddings, **Hybrid Search**, Source-code ingestion, **AI Chat & RAG**, Conversation Memory, Notifications, Timeline, **Analytics & Insights**.

**Next (Phase 14):** Frontend Dashboard.

Last updated: 2026-08-19
