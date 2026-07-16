# Repository Sync

## Purpose

Describe how repository data enters the platform database: initial/full sync vs webhook incremental sync.

## Scope

| Mode                                                   | Status on current branch                                             |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| Webhook incremental upsert                             | **Implemented** (`webhook` module)                                   |
| Full GitHub crawl (list repos, pages of commits, etc.) | **Not present** — `src/modules/repository/` missing from this branch |
| Read APIs (`GET /repositories`, commits, PRs, …)       | **Not present** on this branch                                       |

Schema tables already exist in Prisma: `repositories`, `branches`, `commits`, `pull_requests`, `issues`, `releases`, `tags`, `repository_contributors`, `repository_statistics`, `sync_histories`.

## Overview

**Ideal production pattern**

1. **Initial / manual sync** — crawl GitHub REST with the user’s OAuth token; upsert all (or capped) history.
2. **Ongoing sync** — GitHub webhooks keep the twin updated in seconds.
3. **UI** — frontend reads platform REST APIs (not GitHub directly).

**Current branch**

- Step 2 works (webhooks).
- Steps 1 and 3 need the repository module restored/rebuilt.

## Responsibilities (target)

| Component               | Responsibility                             |
| ----------------------- | ------------------------------------------ |
| Repository sync service | Discover + upsert repos from `/user/repos` |
| BullMQ workers          | Parallel per-repo jobs                     |
| Webhook payload sync    | Incremental updates                        |
| Query controllers       | Serve data to UI                           |

## Design

### Webhook path (live)

Event → queue → `WebhookPayloadSyncService` → upsert entity from payload → `SyncHistory` with `trigger=WEBHOOK`.

### Full crawl path (planned / other branch)

- Queue: repository-sync (workspace discover + fan-out)
- GitHub REST pagination with retries and rate-limit handling
- Caps (e.g. max commit pages) to stay within rate limits

### Database

- `SyncHistory.trigger`: `MANUAL` | `SCHEDULED` | `WEBHOOK` | `INITIAL`
- `ConnectedAccount.status` must be `ACTIVE`

## Future Improvements

1. Restore `apps/backend/src/modules/repository/` on this branch
2. Expose Swagger APIs for list/get repos, commits, branches, PRs, issues
3. Have webhook `repository` / `installation` events trigger full discover when needed

## References

- [Webhook processing](../backend/webhook-processing.md)
- [GitHub OAuth](../backend/github-integration.md)
- [Prisma schema](../../apps/backend/prisma/schema.prisma) — Repository domain section
- [GitHub REST](https://docs.github.com/en/rest)
