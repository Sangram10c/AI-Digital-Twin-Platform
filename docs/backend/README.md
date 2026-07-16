# Backend module documentation

Implementation docs for completed NestJS backend phases (`apps/backend`).

| Document                                         | Status   | Description                                       |
| ------------------------------------------------ | -------- | ------------------------------------------------- |
| [backend-foundation.md](./backend-foundation.md) | Complete | Config, health, security, logging                 |
| [identity-module.md](./identity-module.md)       | Complete | Auth, JWT, users                                  |
| [workspace-module.md](./workspace-module.md)     | Complete | Workspaces, members, permissions                  |
| [github-integration.md](./github-integration.md) | Complete | GitHub OAuth, multi-account, workspace link       |
| [webhook-processing.md](./webhook-processing.md) | Complete | GitHub webhooks, BullMQ routing, incremental sync |

## Related (design / planning tree)

- [GitHub Integration (11)](../11-github-integration/README.md)
- [API Design — GitHub](../09-api-design/github.md)
- [Background Jobs (14)](../14-background-jobs/README.md)

## Local commands

See [`apps/backend/COMMANDS.md`](../../apps/backend/COMMANDS.md) for Redis, Prisma, Swagger, and webhook testing.

## Current implementation notes

| Module                     | Path                      | Notes                                                                                     |
| -------------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| GitHub OAuth               | `src/modules/github/`     | Live                                                                                      |
| Webhooks                   | `src/modules/webhook/`    | Live — payload upserts via BullMQ                                                         |
| Repository crawl/sync APIs | `src/modules/repository/` | **Not present on this branch** — schema + webhook upserts exist; full crawl/read APIs TBD |

## Free GitHub APIs (official)

OAuth, REST, and webhooks used by this platform are **GitHub’s free public APIs** (rate-limited). Sources:

- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- https://docs.github.com/en/rest
- https://docs.github.com/en/webhooks
- https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api

Last updated: 2026-07-16
