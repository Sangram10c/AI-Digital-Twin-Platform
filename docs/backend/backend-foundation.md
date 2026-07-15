# Backend Foundation

Enterprise NestJS backend foundation for the AI Digital Twin Platform.

This document describes the **runtime foundation** only — configuration, database wiring, security baseline, health probes, logging, and bootstrap. Business features (Auth, Workspaces, GitHub, AI) are intentionally not implemented yet.

---

## Architecture

```
apps/backend/src/
├── main.ts                 # Bootstrap (Helmet, CORS, Swagger, shutdown)
├── app.module.ts           # Root module — wires foundation only
├── config/                 # Typed ConfigService namespaces + Joi validation
├── database/               # DatabaseModule + PrismaModule + PrismaService
├── common/
│   ├── filters/            # Global exception filter
│   ├── interceptors/       # Response transform interceptor
│   ├── middleware/         # Request ID + HTTP logging
│   ├── modules/            # JwtConfigModule (JWT infrastructure only)
│   ├── decorators/
│   ├── guards/
│   └── utils/
└── modules/health/         # /health, /ready, /live
```

Feature modules under `src/modules/*` remain scaffolded and are **not imported** into `AppModule` until implemented.

---

## Configuration

`ConfigModule` is global and loads:

| Namespace  | File                 | Purpose                               |
| ---------- | -------------------- | ------------------------------------- |
| `app`      | `app.config.ts`      | Port, host, CORS, throttle, log level |
| `database` | `database.config.ts` | `DATABASE_URL`                        |
| `jwt`      | `jwt.config.ts`      | Secret + token expirations            |
| `redis`    | `redis.config.ts`    | Redis connection                      |
| `oauth`    | `oauth.config.ts`    | Google / GitHub OAuth (optional)      |
| `ai`       | `ai.config.ts`       | AI providers + embeddings (optional)  |
| `storage`  | `storage.config.ts`  | Local / S3 storage                    |
| `bullmq`   | `bullmq.config.ts`   | Queue prefix + Redis connection       |

### Validation

`src/config/env.validation.ts` uses **Joi**.

- `DATABASE_URL` is **required** in all environments.
- In **production**, `JWT_SECRET` must be ≥ 32 characters and cannot be a well-known placeholder.
- Unknown keys are allowed (for monorepo shared `.env` files).

### Env file load order

1. Monorepo root `../../.env`
2. Backend `.env`
3. Backend `.env.local`

See `apps/backend/.env.example` for the full variable list.

---

## Database

- **ORM:** Prisma 7 with `@prisma/adapter-pg`
- **Module:** `DatabaseModule` → `PrismaModule` (`@Global()`)
- **Lifecycle:** connect on `onModuleInit`, disconnect on `onModuleDestroy`
- **Retry:** up to 5 connection attempts with 2s delay
- **Health:** `PrismaService.isHealthy()` runs `SELECT 1`

### NPM scripts

```bash
npm run db:generate
npm run db:validate
npm run db:format
npm run db:push              # local/dev schema sync
npm run db:migrate           # prisma migrate dev
npm run db:migrate:deploy    # prisma migrate deploy (CI/prod)
npm run db:seed
npm run db:studio
```

### Migration strategy note

Domain-named migration folders (`identity_domain`, `ai_domain`, …) are **not** compatible with Prisma’s lexicographic `migrate deploy` order.

**Recommended (do not auto-rename without a migration plan):**

```
20260715120000_identity_domain/
20260715130000_workspace_domain/
...
```

Until renamed, prefer `db:push` for local development and treat production deploy as blocked for migrate-based rollouts.

---

## Infrastructure

Registered globally:

| Concern    | Implementation                                                      |
| ---------- | ------------------------------------------------------------------- |
| Validation | `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) |
| Errors     | `AllExceptionsFilter` (logs + request ID)                           |
| Responses  | `TransformInterceptor` (skippable via `@SkipTransform()`)           |
| Request ID | `RequestIdMiddleware` → `X-Request-Id`                              |
| HTTP logs  | `LoggerMiddleware` + Pino                                           |
| Rate limit | `@nestjs/throttler` (`THROTTLE_TTL` / `THROTTLE_LIMIT`)             |
| API prefix | `API_PREFIX` (default `api`)                                        |
| Versioning | URI versioning (default `v1`)                                       |

Health probes are excluded from the global prefix:

- `GET /health`
- `GET /ready`
- `GET /live`

---

## Security Foundation

| Control            | Status                                            |
| ------------------ | ------------------------------------------------- |
| Helmet             | Enabled                                           |
| Compression        | Enabled                                           |
| CORS               | Config-driven                                     |
| Body size limit    | `BODY_LIMIT` (default `1mb`)                      |
| Trust proxy        | `TRUST_PROXY`                                     |
| Rate limiting      | Global `ThrottlerGuard`                           |
| Swagger            | **Disabled in production**                        |
| JWT module         | Registered for future auth (no strategies/routes) |
| Password hash util | Throws `NotImplementedException` until Auth phase |
| JWT guard          | Throws `NotImplementedException` until Auth phase |

---

## Health Checks

| Endpoint      | Purpose   | Checks                              |
| ------------- | --------- | ----------------------------------- |
| `GET /live`   | Liveness  | Process is up                       |
| `GET /ready`  | Readiness | PostgreSQL required; Redis optional |
| `GET /health` | Summary   | App metadata + readiness checks     |

If the database is down, `/ready` and `/health` return **503**.

Redis returns `skipped` when `REDIS_URL` is unset; `down` when configured but unreachable.

---

## Logging

- **Library:** `nestjs-pino` + `pino-http`
- **Pretty logs:** non-production via `pino-pretty`
- **Redaction:** `Authorization` and `Cookie` headers
- **Startup / shutdown:** bootstrap logs + Prisma connect/disconnect logs
- **Errors:** logged in `AllExceptionsFilter` with request ID

Log level: `LOG_LEVEL` (`fatal` | `error` | `warn` | `info` | `debug` | `trace` | `silent`)

---

## Startup Process

1. Validate environment (Joi) — fail fast
2. Create Nest app with buffered logs
3. Attach Pino logger
4. Apply Helmet, compression, body limits, CORS
5. Set global prefix (exclude health routes)
6. Enable URI versioning
7. Register ValidationPipe
8. Enable shutdown hooks
9. Mount Swagger (non-production only)
10. Listen on `BACKEND_HOST:BACKEND_PORT`

Graceful shutdown disconnects Prisma via Nest lifecycle hooks.

---

## Environment Variables (foundation)

### Required

| Variable       | Description                  |
| -------------- | ---------------------------- |
| `DATABASE_URL` | PostgreSQL connection string |

### Production-required

| Variable              | Description                                   |
| --------------------- | --------------------------------------------- |
| `JWT_SECRET`          | Strong secret (≥ 32 chars, not a placeholder) |
| `NODE_ENV=production` | Activates production rules                    |

### Common optional

| Variable         | Default                 | Description                  |
| ---------------- | ----------------------- | ---------------------------- |
| `BACKEND_PORT`   | `4000`                  | HTTP port                    |
| `API_PREFIX`     | `api`                   | Global prefix                |
| `CORS_ORIGIN`    | `http://localhost:3000` | CORS origin                  |
| `REDIS_URL`      | —                       | Optional Redis for readiness |
| `THROTTLE_TTL`   | `60`                    | Rate limit window (seconds)  |
| `THROTTLE_LIMIT` | `100`                   | Max requests per window      |
| `LOG_LEVEL`      | `info`                  | Pino log level               |
| `BODY_LIMIT`     | `1mb`                   | JSON / urlencoded limit      |

---

## Verification Commands

```bash
npm run lint
npm run typecheck
npm run build
npm run db:generate
npm run db:validate
```

---

## Out of Scope (next phases)

- Authentication (JWT strategies, sessions, Argon2 hashing)
- Workspace / Users APIs
- GitHub / Google integrations
- AI / RAG feature modules
- BullMQ workers / queue processors
- Soft-delete Prisma client extension
- Docker production entrypoint (`migrate deploy`)
