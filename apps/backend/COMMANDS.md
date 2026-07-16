# Backend commands

Local reference for running the NestJS backend (`apps/backend`).

**Working directory for most commands:**

```powershell
cd C:\AI-Digital-Twin-Platform\apps\backend
```

---

## Daily startup (recommended order)

1. Start **PostgreSQL** (your local Postgres must already be running on `5432`).
2. Start **Redis 5** (BullMQ — required for queued repository sync).
3. Start the **backend**.
4. Open Swagger.

---

## Redis (BullMQ)

BullMQ needs Redis **≥ 5.0**.

This machine uses a free local Redis 5.0.14 install:

| Item         | Value                      |
| ------------ | -------------------------- |
| Install path | `C:\Users\admin\redis5`    |
| Port         | **6380**                   |
| URL (`.env`) | `redis://localhost:6380/0` |

> There may also be an old Redis **3** Windows service on port **6379**. Do **not** point the backend at that — BullMQ will fail with `Redis version needs to be greater or equal than 5.0.0`.

### Start Redis 5

```powershell
Start-Process -FilePath "C:\Users\admin\redis5\redis-server.exe" `
  -ArgumentList "C:\Users\admin\redis5\redis.windows.conf","--port","6380" `
  -WorkingDirectory "C:\Users\admin\redis5" `
  -WindowStyle Hidden
```

### Check Redis

```powershell
C:\Users\admin\redis5\redis-cli.exe -p 6380 ping
```

Expected: `PONG`

```powershell
C:\Users\admin\redis5\redis-cli.exe -p 6380 info server | Select-String "redis_version"
```

Expected: `redis_version:5.0.14.1` (or similar 5.x)

### Stop Redis 5

```powershell
Get-Process redis-server -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -like "*redis5*" } |
  Stop-Process -Force
```

Stop **all** `redis-server` processes:

```powershell
Stop-Process -Name redis-server -Force -ErrorAction SilentlyContinue
```

### Optional: disable old Redis 3 service (Admin PowerShell)

```powershell
Stop-Service Redis
Set-Service Redis -StartupType Disabled
```

---

## Backend server

```powershell
cd C:\AI-Digital-Twin-Platform\apps\backend

# Development (watch mode)
npm run start:dev

# One-shot start
npm run start

# Debug
npm run start:debug

# Production (build first)
npm run build
npm run start:prod
```

| URL                            | Purpose    |
| ------------------------------ | ---------- |
| http://localhost:4000          | API        |
| http://localhost:4000/api/docs | Swagger UI |

If you see `EADDRINUSE` on port 4000, stop the old Node process using that port, then start again.

---

## Database (Prisma)

Prefer **`db:push`** locally if migrate fails on the shadow DB.

```powershell
cd C:\AI-Digital-Twin-Platform\apps\backend

npm run db:generate          # Generate Prisma client
npm run db:push              # Push schema to DB (local-friendly)
npm run db:migrate           # Create/apply migrations (may fail on shadow DB)
npm run db:migrate:deploy    # Apply migrations (CI/prod style)
npm run db:studio            # Prisma Studio UI
npm run db:seed              # Seed data
npm run db:validate          # Validate schema
npm run db:format            # Format schema.prisma
npm run admin:upsert         # Upsert admin user script
```

Reset (destructive — wipes data):

```powershell
npm run db:reset
```

---

## Quality / tests

```powershell
cd C:\AI-Digital-Twin-Platform\apps\backend

npm run typecheck
npm run lint
npm run lint:fix
npm run format
npm run format:check

npm run test                 # Unit tests
npm run test:watch
npm run test:cov
npm run test:e2e             # E2E tests
```

---

## Docker Redis (optional)

Only if Docker Desktop is installed and `docker` works in PATH:

```powershell
cd C:\AI-Digital-Twin-Platform
docker compose up -d redis
docker compose stop redis
docker compose ps
```

Default compose Redis is usually `localhost:6379`. If you use that, update `.env`:

```env
REDIS_URL=redis://localhost:6379/0
```

And ensure the container image is Redis **5+**.

---

## GitHub + repository sync (Swagger)

Base: http://localhost:4000/api/docs  
Authorize with JWT from login.

### Connect GitHub (user level)

1. `GET /api/v1/github/connect?returnUrl=true`
2. Open `authorizationUrl` in the browser and allow access.
3. Frontend redirect to `localhost:3000` may fail if the UI is not running — connection can still succeed.
4. `GET /api/v1/github/accounts` — use returned `id` as **`githubTokenId`**.

### Link to workspace

- Create workspace with body field `githubTokenId`, **or**
- `GET /api/v1/github/connect?workspaceId=<uuid>&returnUrl=true` and authorize again.

### Check workspace link

```
GET /api/v1/github/account?workspaceId=<uuid>
```

`status` must be **`ACTIVE`** (not `DISCONNECTED`).

### Full repository sync / list APIs

`POST /repositories/sync` and `GET /repositories` are **not available on this branch** (repository module missing).  
Near real-time updates use **webhooks** (section below). Schema tables still receive webhook upserts when a matching repository row exists.

See `docs/11-github-integration/repository-sync.md`.

---

## GitHub webhooks

Ingest URL (public, signature required):

```
POST http://localhost:4000/api/v1/webhooks/github?workspaceId=<uuid>&connectedAccountId=<uuid>
```

Headers:

- `X-GitHub-Event`
- `X-GitHub-Delivery`
- `X-Hub-Signature-256`

Env:

```env
GITHUB_WEBHOOK_SECRET=dev-github-webhook-secret-change-me
```

Monitoring (JWT):

```
GET /api/v1/webhooks/events?workspaceId=<uuid>
GET /api/v1/webhooks/statistics?workspaceId=<uuid>
```

See `docs/backend/webhook-processing.md`.

### ID cheat sheet

| ID                   | From                                      | Used for                           |
| -------------------- | ----------------------------------------- | ---------------------------------- |
| `githubTokenId`      | `GET /github/accounts` → `id`             | Create workspace / OAuth link      |
| `connectedAccountId` | `GET /github/account?workspaceId=` → `id` | Optional sync filter               |
| `workspaceId`        | Workspaces API                            | Almost every workspace-scoped call |
| `repositoryId`       | `GET /repositories` → `id`                | Single-repo sync                   |

---

## Env files

| File                | Role                                    |
| ------------------- | --------------------------------------- |
| `apps/backend/.env` | Primary backend config                  |
| repo root `.env`    | May also load — keep Redis URLs in sync |

Important Redis keys:

```env
REDIS_URL=redis://localhost:6380/0
```

GitHub OAuth keys (examples):

```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:4000/api/v1/github/callback
GITHUB_OAUTH_SUCCESS_REDIRECT=http://localhost:3000/settings/integrations/github
GITHUB_OAUTH_ERROR_REDIRECT=http://localhost:3000/settings/integrations/github
GITHUB_WEBHOOK_SECRET=dev-github-webhook-secret-change-me
OAUTH_TOKEN_ENCRYPTION_KEY=...
```

---

## Related docs

- `docs/backend/README.md` — module index
- `docs/backend/github-integration.md`
- `docs/backend/webhook-processing.md`
- `docs/11-github-integration/README.md`
- `docs/09-api-design/github.md`
- `docs/backend/identity-module.md`
- `docs/backend/workspace-module.md`
- `docs/backend/backend-foundation.md`
