# BullMQ

## Purpose

Document how the backend uses BullMQ + Redis for asynchronous work.

## Scope

Current production use on this branch: **GitHub webhook processing queues**.  
Planned/other: full repository crawl workers when `repository` module is restored.

## Overview

- Library: `bullmq` + `@nestjs/bullmq`
- Config: `apps/backend/src/config/bullmq.config.ts` (`REDIS_URL`, `QUEUE_PREFIX`)
- Redis must be **≥ 5.0**

## Webhook queues (live)

Registered in `src/modules/webhook/webhook.module.ts`:

| Queue                     | Role                     |
| ------------------------- | ------------------------ |
| `webhook-processing`      | Route delivery           |
| `webhook-commit-sync`     | Commits/branches         |
| `webhook-pr-sync`         | Pull requests            |
| `webhook-issue-sync`      | Issues                   |
| `webhook-release-sync`    | Releases                 |
| `webhook-repository-sync` | Repo metadata            |
| `webhook-statistics`      | Stars/watchers           |
| `webhook-dead-letter`     | Failed after max retries |

Defaults: 5 attempts, exponential backoff, concurrency 5 on domain workers.

## Local Redis

See `apps/backend/COMMANDS.md` (often Redis 5 on port **6380** on Windows without Docker).

```env
REDIS_URL=redis://localhost:6380/0
QUEUE_PREFIX=ai-twin
```

## Design

- Controllers enqueue only; workers do DB writes
- Job ids keyed by GitHub delivery id for idempotency
- Dead-letter queue for poison messages

## Future Improvements

- Shared BullMQ root module for repository + webhook
- Metrics exporters (queue depth, failure rate)

## References

- [Webhook processing](../backend/webhook-processing.md)
- [Background jobs index](./README.md)
- https://docs.bullmq.io/
