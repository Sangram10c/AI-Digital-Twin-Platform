# GitHub Webhooks

## Purpose

Document near real-time GitHub event ingestion: verify, store, queue, and apply incremental updates.

## Scope

- Ingest endpoint (public + signature)
- BullMQ routing and domain workers
- Monitoring APIs (events list/statistics)
- Payload-based upserts into repository domain tables

Out of scope for this doc: AI, embeddings, search, notifications.

## Overview

GitHub sends HTTP POSTs when repositories change. The backend never processes heavy work in the controller — it enqueues BullMQ jobs. Workers upsert from the webhook JSON payload (fast path).

## Responsibilities

| Component                   | Responsibility                           |
| --------------------------- | ---------------------------------------- |
| `GithubWebhookController`   | Accept delivery, return 202              |
| `WebhookIngestionService`   | Signature, idempotency, persist, enqueue |
| `WebhookEventRouterService` | Map event → domain queue                 |
| Domain processors           | Apply upserts                            |
| `WebhookPayloadSyncService` | Prisma writes                            |
| `WebhookEventsController`   | Operator/debug APIs                      |

## Design

### Ingest URL

```
POST /api/v1/webhooks/github?workspaceId=<uuid>&connectedAccountId=<uuid>
```

Headers: `X-GitHub-Event`, `X-GitHub-Delivery`, `X-Hub-Signature-256`

### Event routing (summary)

| Event                             | Queue effect        |
| --------------------------------- | ------------------- |
| push / create / delete            | commits & branches  |
| pull_request*                     | pull requests       |
| issues*                           | issues              |
| release                           | releases & tags     |
| repository / installation* / fork | repo metadata       |
| star / watch                      | statistics          |
| ping                              | ignored after store |

### Queues

`webhook-processing`, `webhook-commit-sync`, `webhook-pr-sync`, `webhook-issue-sync`, `webhook-release-sync`, `webhook-repository-sync`, `webhook-statistics`, `webhook-dead-letter`

### Security

HMAC SHA-256 signature, replay cache, encrypted secret in env (`GITHUB_WEBHOOK_SECRET`).

## Code locations

`apps/backend/src/modules/webhook/`

## Future Improvements

- Unique DB constraint on delivery id
- Wire full crawl sync for installation/repository events
- Optional GitHub IP allow-list

## References

- [Backend webhook doc](../backend/webhook-processing.md)
- [GitHub webhooks](https://docs.github.com/en/webhooks)
- [Validating deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
