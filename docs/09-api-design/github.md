# GitHub API Design

## Purpose

Catalog platform REST endpoints related to GitHub OAuth and webhooks.

## Scope

Base URL: `/api/v1`  
Format: JSON  
Auth: Bearer JWT unless marked Public

Swagger (non-production): `http://localhost:4000/api/docs` — tags **github**, **webhooks**

## Overview

Two groups:

1. **GitHub OAuth / accounts** — connect identities to the platform
2. **Webhooks** — ingest GitHub events and monitor processing

Repository **read/sync** endpoints (`/repositories/...`) are **not available on the current branch**.

## GitHub OAuth endpoints

| Method | Endpoint                                     | Auth   | Description                                        |
| ------ | -------------------------------------------- | ------ | -------------------------------------------------- |
| GET    | `/github/connect?returnUrl=true`             | JWT    | Returns `{ authorizationUrl }` for Swagger/browser |
| GET    | `/github/connect?workspaceId=`               | JWT    | Connect and link workspace                         |
| GET    | `/github/callback`                           | Public | OAuth callback (302 redirect)                      |
| GET    | `/github/accounts`                           | JWT    | List user GitHub accounts (`id` = `githubTokenId`) |
| DELETE | `/github/accounts/:oauthTokenId`             | JWT    | Remove GitHub from user                            |
| GET    | `/github/account?workspaceId=`               | JWT    | Workspace-linked accounts                          |
| DELETE | `/github/disconnect?workspaceId=&accountId=` | JWT    | Unlink workspace only                              |

Related workspace create:

```http
POST /api/v1/workspaces
{ "name": "...", "githubTokenId": "<from /github/accounts>" }
```

## Webhook endpoints

| Method | Endpoint                            | Auth                           | Description            |
| ------ | ----------------------------------- | ------------------------------ | ---------------------- |
| POST   | `/webhooks/github`                  | Public + `X-Hub-Signature-256` | Ingest delivery (202)  |
| GET    | `/webhooks/events?workspaceId=`     | JWT                            | List stored events     |
| GET    | `/webhooks/events/:id?workspaceId=` | JWT                            | Event detail + payload |
| GET    | `/webhooks/statistics?workspaceId=` | JWT                            | Counts + queue depths  |

### Ingest headers

- `X-GitHub-Event` (required)
- `X-GitHub-Delivery` (required)
- `X-Hub-Signature-256` (required)

Optional query: `workspaceId`, `connectedAccountId`

### Example success (202)

```json
{
  "accepted": true,
  "duplicate": false,
  "ignored": false,
  "webhookEventId": "...",
  "jobId": "...",
  "message": "Webhook accepted and queued"
}
```

## Error codes (common)

| Status | Meaning                                                          |
| ------ | ---------------------------------------------------------------- |
| 401    | Invalid JWT / invalid webhook signature / missing webhook secret |
| 400    | Bad payload / cannot resolve target                              |
| 403    | Missing workspace permission                                     |
| 404    | Account/repo/event not found                                     |

## External GitHub APIs (not our REST, but used by backend)

Free GitHub APIs — see official docs:

- OAuth authorize + token exchange
- `GET /user`, `GET /user/emails`
- Webhook deliveries (GitHub → us)

## Code

- Controllers: `src/modules/github/github.controller.ts`
- Controllers: `src/modules/webhook/controllers/*.ts`

## References

- [Backend GitHub doc](../backend/github-integration.md)
- [Backend Webhook doc](../backend/webhook-processing.md)
- [GitHub Integration design](../11-github-integration/README.md)

Last updated: 2026-07-16
