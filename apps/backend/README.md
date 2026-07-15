# AI Digital Twin — Backend

NestJS backend for the AI Digital Twin Platform.

## Quick start

```bash
# From monorepo root
cp apps/backend/.env.example apps/backend/.env
# Set DATABASE_URL (and JWT_SECRET for production)

npm install
npm run --prefix apps/backend db:generate
npm run --prefix apps/backend start:dev
```

- API prefix: `/api/v1`
- Health: `/health`, `/ready`, `/live`
- Swagger (non-production): `/api/docs`

## Foundation docs

See [Backend Foundation](../../../docs/backend/backend-foundation.md) for configuration, security, health checks, logging, and environment variables.

## Scripts

| Script               | Purpose                                                   |
| -------------------- | --------------------------------------------------------- |
| `start:dev`          | Watch mode                                                |
| `build`              | Compile Nest app                                          |
| `lint` / `typecheck` | Quality gates                                             |
| `db:generate`        | Generate Prisma Client                                    |
| `db:validate`        | Validate schema                                           |
| `db:push`            | Push schema (dev)                                         |
| `db:migrate:deploy`  | Apply migrations (CI/prod — requires timestamped folders) |
| `db:seed`            | Seed reference/dev data                                   |

## Status

**Foundation complete.** Feature modules (Auth, Users, Workspaces, AI, etc.) are scaffolded but not implemented yet.
