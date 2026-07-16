# Repositories API

## Purpose

Document REST APIs for listing and syncing GitHub repositories stored in the platform database.

## Scope / Status

**Not implemented on the current branch.**  
`apps/backend/src/modules/repository/` is missing. Prisma models exist; webhook workers can upsert commits/PRs/etc. when a matching `Repository` row exists.

## Planned endpoints (target)

| Method | Endpoint                          | Description               |
| ------ | --------------------------------- | ------------------------- |
| POST   | `/repositories/sync?workspaceId=` | Queue full workspace sync |
| POST   | `/repositories/:id/sync`          | Sync one repository       |
| GET    | `/repositories?workspaceId=`      | List repos                |
| GET    | `/repositories/:id`               | Repo detail               |
| GET    | `/repositories/:id/branches`      | Branches                  |
| GET    | `/repositories/:id/commits`       | Commits                   |
| GET    | `/repositories/:id/pull-requests` | PRs                       |
| GET    | `/repositories/:id/issues`        | Issues                    |
| GET    | `/repositories/:id/releases`      | Releases                  |
| GET    | `/repositories/:id/tags`          | Tags                      |
| GET    | `/repositories/:id/contributors`  | Contributors              |
| GET    | `/repositories/:id/statistics`    | Stats                     |

## What works today instead

- Connect GitHub: [github.md](./github.md)
- Near real-time updates: `POST /webhooks/github` — [webhook processing](../backend/webhook-processing.md)

## References

- [Repository sync design](../11-github-integration/repository-sync.md)
- Prisma `Repository` domain in `apps/backend/prisma/schema.prisma`

Last updated: 2026-07-16
