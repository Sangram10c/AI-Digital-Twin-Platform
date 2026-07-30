# AI Digital Twin — Backend

NestJS backend for the AI Digital Twin Platform.

## Quick start

For Redis, Prisma, GitHub OAuth, and webhook commands, see **[COMMANDS.md](./COMMANDS.md)**.

```bash
# From monorepo root
cp apps/backend/.env.example apps/backend/.env
# Set DATABASE_URL, JWT_SECRET, GITHUB_*, REDIS_URL, GITHUB_WEBHOOK_SECRET

npm install
npm run --prefix apps/backend db:generate
# Start Redis ≥ 5 first (see COMMANDS.md)
npm run --prefix apps/backend start:dev
```

- API prefix: `/api/v1`
- Health: `/health`, `/ready`, `/live`
- Swagger (non-production): `/api/docs`

## Implemented modules

| Module             | Path                         | Docs                                                                    |
| ------------------ | ---------------------------- | ----------------------------------------------------------------------- |
| Foundation         | config, health, filters      | [backend-foundation](../../../docs/backend/backend-foundation.md)       |
| Identity           | `src/modules/identity`       | [identity-module](../../../docs/backend/identity-module.md)             |
| Workspaces         | `src/modules/workspaces`     | [workspace-module](../../../docs/backend/workspace-module.md)           |
| GitHub OAuth       | `src/modules/github`         | [github-integration](../../../docs/backend/github-integration.md)       |
| Webhooks           | `src/modules/webhook`        | [webhook-processing](../../../docs/backend/webhook-processing.md)       |
| Knowledge          | `src/modules/knowledge`      | [knowledge-processing](../../../docs/backend/knowledge-processing.md)   |
| Embeddings         | `src/modules/embeddings`     | [embedding-pipeline](../../../docs/backend/embedding-pipeline.md)       |
| Hybrid Search      | `src/modules/search`         | [hybrid-search-engine](../../../docs/backend/hybrid-search-engine.md)   |
| Source-code ingest | knowledge + chunker services | [source-code-ingestion](../../../docs/backend/source-code-ingestion.md) |

Module index: [docs/backend/README.md](../../../docs/backend/README.md)

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

## Status

**Complete:** Foundation, Identity, Workspaces, GitHub OAuth/Webhooks, Knowledge, Embeddings, **Hybrid Search**, source-code ingestion.  
**Next (project docs):** Background Job Architecture (doc 14).  
**Also upcoming:** Chat/answer generation over retrieved chunks.

Last updated: 2026-07-30
