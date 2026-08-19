# Development Roadmap — Phases

> **Canonical roadmap:** [`ROADMAP.md`](../../ROADMAP.md)
>
> This document provides additional detail on each phase. The phase structure and names in this file match `ROADMAP.md` exactly.

---

## Phase 1 — Foundation ✅ Complete

**Goal:** Establish the monorepo, infrastructure, and development toolchain.

| Deliverable                                    | Status |
| ---------------------------------------------- | ------ |
| npm workspaces monorepo (`apps/`, `packages/`) | ✅     |
| NestJS backend skeleton                        | ✅     |
| Next.js 16 App Router frontend skeleton        | ✅     |
| Prisma + PostgreSQL database setup             | ✅     |
| JWT + Passport authentication                  | ✅     |
| GitHub Actions CI/CD                           | ✅     |
| Docker Compose (Postgres + Redis)              | ✅     |
| ESLint, Prettier, Husky, Commitlint            | ✅     |
| pgvector + pg_trgm extension setup             | ✅     |

---

## Phase 2 — Core Features ✅ Complete

**Goal:** Implement identity, workspace, GitHub integration, repository sync, and knowledge pipeline.

| Deliverable                                                                                           | Status |
| ----------------------------------------------------------------------------------------------------- | ------ |
| Identity module (users, sessions, refresh tokens, OAuth tokens)                                       | ✅     |
| Auth module (JWT login, register, token refresh)                                                      | ✅     |
| Workspace management + RBAC                                                                           | ✅     |
| GitHub OAuth + multi-account support                                                                  | ✅     |
| Webhook ingestion (GitHub events → BullMQ)                                                            | ✅     |
| Repository sync (branches, commits, PRs, issues, releases, tags)                                      | ✅     |
| Knowledge processing (normalize → chunk → BullMQ queue)                                               | ✅     |
| Documents and uploads management                                                                      | ✅     |
| Notifications foundation                                                                              | ✅     |
| Background job architecture (BullMQ queues: embedding, notification, email, ai-processing, analytics) | ✅     |

---

## Phase 3 — Intelligence ✅ Complete

**Goal:** Implement the complete AI knowledge extraction → embedding → search → chat pipeline.

| Deliverable                                                                    | Status |
| ------------------------------------------------------------------------------ | ------ |
| Heuristic extraction (deterministic metadata without LLM)                      | ✅     |
| AI knowledge extraction digest pipeline                                        | ✅     |
| Hybrid AI pipeline (heuristics → digests → AI → embeddings)                    | ✅     |
| Embedding generation (pgvector, multi-provider, BullMQ, checksum skip)         | ✅     |
| Source-code ingestion (`.ts`/`.js` symbol chunks for code-aware RAG)           | ✅     |
| Hybrid Search Engine (vector + FTS + RRF ranking, Redis cache, metrics)        | ✅     |
| AI Chat — 10-step RAG pipeline (retrieve → prompt → generate → cite)           | ✅     |
| SSE streaming chat                                                             | ✅     |
| Conversation management (history, pin, archive, soft-delete)                   | ✅     |
| Conversation Memory (selective long-term memory with TTL + importance scoring) | ✅     |
| Timeline                                                                       | ✅     |
| Analytics & Insights (8 metric domains, BullMQ aggregation, Redis caching)     | ✅     |

---

## Phase 4 — Frontend Dashboard ➡️ Current

**Goal:** Build the user-facing frontend for all implemented backend capabilities.

| Deliverable                                        | Status |
| -------------------------------------------------- | ------ |
| Authentication UI (sign in, register, OAuth flows) | ⬜     |
| Workspace management UI                            | ⬜     |
| GitHub connection and repository browser           | ⬜     |
| AI Chat interface with SSE streaming               | ⬜     |
| Hybrid search interface                            | ⬜     |
| Analytics dashboard (8 metric domains)             | ⬜     |
| Conversation history and management UI             | ⬜     |
| Notifications UI                                   | ⬜     |
| Settings management                                | ⬜     |
| Real-time sync progress indicator                  | ⬜     |

---

## Phase 5 — Production Deployment ⬜ Planned

**Goal:** Harden the platform for production-grade deployment.

| Deliverable                                         | Status |
| --------------------------------------------------- | ------ |
| Kubernetes manifests (infra/kubernetes/)            | ⬜     |
| Production Docker images                            | ⬜     |
| CI/CD pipeline hardening                            | ⬜     |
| Monitoring and alerting (Prometheus / Grafana)      | ⬜     |
| Production secrets management                       | ⬜     |
| Admin panel (user management, workspace management) | ⬜     |
| Audit logging UI                                    | ⬜     |
| Rate limiting hardening                             | ⬜     |
| Google Workspace integration                        | ⬜     |
| VS Code extension deepening                         | ⬜     |
| Multi-region / high-availability configuration      | ⬜     |

---

## References

- Canonical roadmap: [`ROADMAP.md`](../../ROADMAP.md)
- Live progress: [`CURRENT_STATUS.md`](../../CURRENT_STATUS.md)
- Backend module docs: [`docs/backend/README.md`](../backend/README.md)
