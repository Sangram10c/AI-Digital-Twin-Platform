# API Design

## Purpose

Define API conventions, response formats, endpoint overview, and HTTP status codes for the platform.

## Scope

REST API design standards, versioning, authentication headers, and shared response envelopes.

## Content

## Conventions

- **Base URL**: `/api/v1`
- **Format**: JSON
- **Authentication**: Bearer JWT token
- **Versioning**: URI-based (`/api/v1`, `/api/v2`)

## Response Format

### Success Response

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response

```json
{
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

## Endpoints Overview

### Authentication & Identity

| Method | Endpoint         | Description              |
| ------ | ---------------- | ------------------------ |
| POST   | `/auth/login`    | User login               |
| POST   | `/auth/register` | User registration        |
| POST   | `/auth/refresh`  | Refresh JWT access token |
| POST   | `/auth/logout`   | Revoke session           |
| GET    | `/auth/profile`  | Get current user profile |
| PATCH  | `/auth/profile`  | Update profile           |
| GET    | `/auth/google`   | Google OAuth start       |
| GET    | `/auth/github`   | GitHub OAuth start       |

### Workspaces

| Method | Endpoint                          | Description          |
| ------ | --------------------------------- | -------------------- |
| GET    | `/workspaces`                     | List user workspaces |
| POST   | `/workspaces`                     | Create workspace     |
| GET    | `/workspaces/:id`                 | Get workspace        |
| PATCH  | `/workspaces/:id`                 | Update workspace     |
| DELETE | `/workspaces/:id`                 | Archive workspace    |
| GET    | `/workspaces/:id/members`         | List members         |
| POST   | `/workspaces/:id/members`         | Add member           |
| DELETE | `/workspaces/:id/members/:userId` | Remove member        |

### GitHub Integration

| Method | Endpoint                          | Description                    |
| ------ | --------------------------------- | ------------------------------ |
| GET    | `/github/connect`                 | Start GitHub OAuth             |
| GET    | `/github/callback`                | OAuth callback                 |
| GET    | `/github/accounts`                | List connected GitHub accounts |
| DELETE | `/github/accounts/:id`            | Disconnect account             |
| POST   | `/webhooks/github`                | GitHub webhook ingest          |
| GET    | `/workspaces/:id/webhooks/events` | List webhook events            |

### Repositories

| Method | Endpoint                                        | Description        |
| ------ | ----------------------------------------------- | ------------------ |
| GET    | `/workspaces/:id/repositories`                  | List repositories  |
| POST   | `/workspaces/:id/repositories`                  | Import repository  |
| GET    | `/workspaces/:id/repositories/:repoId`          | Get repository     |
| POST   | `/workspaces/:id/repositories/:repoId/sync`     | Trigger sync       |
| GET    | `/workspaces/:id/repositories/:repoId/commits`  | List commits       |
| GET    | `/workspaces/:id/repositories/:repoId/branches` | List branches      |
| GET    | `/workspaces/:id/repositories/:repoId/prs`      | List pull requests |
| GET    | `/workspaces/:id/repositories/:repoId/issues`   | List issues        |

### Knowledge & Search

| Method | Endpoint          | Description                  |
| ------ | ----------------- | ---------------------------- |
| POST   | `/search`         | Hybrid search (vector + FTS) |
| GET    | `/search/history` | Search history for workspace |
| GET    | `/search/saved`   | Saved searches               |
| POST   | `/search/saved`   | Save a search                |

### AI Chat & Conversations

| Method | Endpoint                           | Description                     |
| ------ | ---------------------------------- | ------------------------------- |
| POST   | `/chat`                            | Synchronous chat (RAG)          |
| POST   | `/chat/stream`                     | SSE streaming chat (POST body)  |
| GET    | `/chat/stream`                     | SSE streaming chat (GET params) |
| GET    | `/chat/conversations`              | List conversations (paginated)  |
| GET    | `/chat/conversations/:id`          | Get conversation with messages  |
| GET    | `/chat/conversations/:id/messages` | Get paginated messages          |
| PATCH  | `/chat/conversations/:id`          | Rename conversation             |
| DELETE | `/chat/conversations/:id`          | Soft-delete conversation        |
| POST   | `/chat/conversations/:id/pin`      | Pin conversation                |
| DELETE | `/chat/conversations/:id/pin`      | Unpin conversation              |

### Analytics

| Method | Endpoint                                 | Description                   |
| ------ | ---------------------------------------- | ----------------------------- |
| POST   | `/workspaces/:id/analytics/aggregate`    | Trigger analytics aggregation |
| GET    | `/workspaces/:id/analytics/repository`   | Repository metrics            |
| GET    | `/workspaces/:id/analytics/ai`           | AI usage metrics              |
| GET    | `/workspaces/:id/analytics/search`       | Search metrics                |
| GET    | `/workspaces/:id/analytics/knowledge`    | Knowledge base metrics        |
| GET    | `/workspaces/:id/analytics/conversation` | Conversation metrics          |
| GET    | `/workspaces/:id/analytics/job`          | Background job metrics        |
| GET    | `/workspaces/:id/analytics/rag`          | RAG pipeline metrics          |
| GET    | `/workspaces/:id/analytics/workspace`    | Workspace-level summary       |

### Platform

| Method | Endpoint  | Description  |
| ------ | --------- | ------------ |
| GET    | `/health` | Health check |
| GET    | `/ready`  | Readiness    |
| GET    | `/live`   | Liveness     |

See [github.md](./github.md) and [repositories.md](./repositories.md) for detailed per-resource endpoint tables.

## HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | OK                    |
| 201  | Created               |
| 204  | No Content            |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 422  | Unprocessable Entity  |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |

## Documents Included

- [authentication.md](./authentication.md)
- [github.md](./github.md)
- [repositories.md](./repositories.md)
- [ai.md](./ai.md)
- [search.md](./search.md)
- [notifications.md](./notifications.md)

## Related Documents

- [Database Design](../08-database-design/README.md)
- [Authentication Design](../10-authentication-design/README.md)
- [Backend Architecture](../17-backend-architecture/README.md)

## Current Status

| Field      | Value    |
| ---------- | -------- |
| Status     | Migrated |
| Completion | 100%     |

## Owner

<!-- Team or role responsible for maintaining this section. -->

## Last Updated

2026-08-19

## Next Document

[Authentication Design](../10-authentication-design/README.md)
