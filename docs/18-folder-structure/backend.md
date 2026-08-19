# Backend Folder Structure

## Purpose

Documents the physical layout of the `apps/backend/` NestJS application.

## Scope

Source directory structure as of Phase 13 (Analytics & Insights complete).

## Overview

The backend is a NestJS modular monolith. Each feature lives in its own module under `src/modules/`. Shared infrastructure lives in `src/common/`, `src/database/`, `src/jobs/`, and `src/config/`.

## Design

```
backend/src/
├── app.module.ts              # Root module — wires all feature modules
├── main.ts                    # Bootstrap, Swagger, global pipes/filters
│
├── config/                    # Configuration factory (NestJS ConfigModule)
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── jwt.config.ts
│   └── ai.config.ts
│
├── common/                    # Shared utilities (no business logic)
│   ├── guards/                # JwtAuthGuard, GithubWorkspaceGuard, etc.
│   ├── decorators/            # @CurrentUser, @WorkspaceId, etc.
│   ├── pipes/                 # ValidationPipe
│   ├── filters/               # AllExceptionsFilter
│   ├── middleware/            # RequestId, logging middleware
│   ├── interceptors/          # ResponseTransformInterceptor
│   └── dto/                   # Shared DTOs (pagination, response envelope)
│
├── database/                  # Prisma module & service
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── jobs/                      # BullMQ queue definitions and processors
│   ├── jobs.module.ts
│   ├── queues/
│   │   └── index.ts           # QUEUES constant (embedding, notification, email, ai-processing, analytics)
│   └── processors/
│       └── index.ts
│
├── modules/                   # Feature modules (26 implemented)
│   │
│   ├── admin/                 # Admin scaffolding (Phase 15 expansion)
│   ├── ai/                    # AI provider orchestration layer
│   ├── ai-knowledge/          # AI knowledge extraction digest pipeline
│   ├── analytics/             # Analytics & Insights (Phase 13)
│   ├── auth/                  # JWT authentication, login, register
│   ├── chat/                  # AI Chat: orchestrator, SSE streaming, conversation mgmt
│   ├── documents/             # Document management
│   ├── embeddings/            # pgvector embedding generation (BullMQ)
│   ├── github/                # GitHub OAuth + API client
│   ├── google/                # Google integration scaffolding
│   ├── health/                # /health, /ready, /live endpoints
│   ├── identity/              # Identity provider abstraction
│   ├── integrations/          # Third-party integration management
│   ├── knowledge/             # Knowledge processing: normalize, chunk, queue
│   ├── knowledge-heuristics/  # Deterministic heuristic metadata extraction
│   ├── memory/                # Conversation memory (ConversationMemory model)
│   ├── notifications/         # In-app notification management
│   ├── organizations/         # Organization management
│   ├── repository/            # Repository sync: branches, commits, PRs, issues
│   ├── search/                # Hybrid search engine (vector + FTS + RRF)
│   ├── settings/              # Workspace settings management
│   ├── timeline/              # Knowledge timeline
│   ├── uploads/               # File upload handling
│   ├── users/                 # User management
│   ├── webhook/               # GitHub webhook ingestion and processing
│   └── workspaces/            # Workspace management and RBAC
│
└── gateway/                   # Socket.IO WebSocket gateway (real-time)
    └── events.gateway.ts
```

## Future Improvements

- Frontend architecture documentation (Phase 14)
- Admin panel module expansion (Phase 15)
- Google Workspace integration (Phase 15)
- VS Code extension deepening (Phase 15)

## References

- [Backend Module Index](../../docs/backend/README.md)
- [apps/backend/README.md](../../apps/backend/README.md)
