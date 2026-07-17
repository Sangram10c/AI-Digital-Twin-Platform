<div align="center">

# AI Digital Twin Platform

**Enterprise AI engineering intelligence — ask natural-language questions about your repositories, commits, PRs, and docs.**

[![CI](https://github.com/Sangram10c/AI-Digital-Twin-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Sangram10c/AI-Digital-Twin-Platform/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)

</div>

---

## Overview

The AI Digital Twin Platform turns engineering history into a searchable, AI-queryable knowledge base.

Instead of hunting across GitHub, docs, pull requests, and commits, developers ask questions such as:

- Which commit introduced JWT authentication?
- Which branch added the payment gateway?
- Who approved this pull request?
- Why was this API changed?
- Summarize everything completed in Sprint 12.

**MVP focus (v1):** GitHub as the primary knowledge source — OAuth, repository sync, webhooks, semantic search, and AI chat over engineering history. Bitbucket, Slack, Jira, and similar sources are planned for later versions.

### Key capabilities

| Capability              | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| Multi-provider AI       | OpenAI, Anthropic, Gemini, and Ollama behind a provider-agnostic layer |
| RAG pipeline            | Chunking, embeddings, retrieval, and grounded answers                  |
| Vector search           | PostgreSQL + pgvector for semantic similarity                          |
| GitHub integration      | OAuth, repo sync, webhooks, incremental updates                        |
| Multi-tenant workspaces | Organizations, workspaces, and RBAC-oriented identity                  |
| Real-time updates       | Socket.IO for sync progress and notifications                          |
| VS Code extension       | IDE surface (scaffolded; deeper integration on the roadmap)            |

---

## How it works

End-to-end product flow from connect → sync → ask:

```text
Developer
    │
    ▼
Next.js Frontend  ── HTTPS / REST / WebSocket ──►  NestJS API
                                                      │
         ┌────────────────┬───────────────────────────┼────────────────┐
         ▼                ▼                           ▼                ▼
   Identity / Auth   GitHub Provider            AI Engine         Search
   (JWT + OAuth)     (REST + GraphQL)           (RAG)             (hybrid)
         │                │                           │                │
         │                ▼                           │                │
         │         Background Workers (BullMQ)        │                │
         │           • repo sync                      │                │
         │           • webhook events                 │                │
         │           • embedding jobs                 │                │
         │                │                           │                │
         └────────────────┴───────────┬───────────────┴────────────────┘
                                      ▼
                              PostgreSQL + pgvector
                                      │
                                      ▼
                                    Redis
                          (cache + BullMQ queues)
                                      │
                                      ▼
                            AI Provider Layer
                     Ollama │ OpenAI │ Gemini │ Anthropic
```

### Typical user journey

1. **Sign up / sign in** — email or OAuth (Google / GitHub).
2. **Create a workspace** — isolate projects and access.
3. **Connect GitHub** — authorize the app; pick repositories to import.
4. **Sync engineering history** — branches, commits, PRs, and docs are ingested via workers.
5. **Build knowledge** — text is chunked, embedded, and stored in pgvector.
6. **Ask the twin** — natural-language chat and semantic search over that knowledge.
7. **Stay current** — GitHub webhooks trigger incremental re-sync.

Live status and task tracking: [`CURRENT_STATUS.md`](./CURRENT_STATUS.md).

---

## Architecture

Modular monolith (microservice-ready): deployable apps share typed packages.

| Layer       | Role                                                             |
| ----------- | ---------------------------------------------------------------- |
| **Clients** | Next.js web app, VS Code extension                               |
| **API**     | NestJS REST API (`/api/v1`), health probes, Swagger in non-prod  |
| **Workers** | BullMQ jobs for sync, webhooks, embeddings                       |
| **Data**    | PostgreSQL 17 + pgvector, Redis 7                                |
| **AI**      | Provider abstraction + RAG (chunk → embed → retrieve → generate) |

Details: [System Architecture](./docs/05-system-architecture/README.md) · [High-level diagram](./docs/05-system-architecture/02-high-level-architecture.md)

---

## Tech stack

| Layer        | Technologies                                                                    |
| ------------ | ------------------------------------------------------------------------------- |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, TanStack Query, Zustand, Zod    |
| **Backend**  | NestJS 11, Prisma, PostgreSQL, pgvector, Redis, BullMQ, Socket.IO, Passport/JWT |
| **AI**       | OpenAI, Anthropic, Google Gemini, Ollama                                        |
| **Monorepo** | npm workspaces (`apps/*`, `packages/*`)                                         |
| **DevOps**   | Docker Compose, GitHub Actions, ESLint, Prettier, Husky, Commitlint             |
| **Testing**  | Jest (backend), Playwright (frontend e2e planned)                               |

Full reference: [Technology Stack](./docs/06-technology-stack/README.md)

---

## Repository structure

```text
AI-Digital-Twin-Platform/
├── apps/
│   ├── frontend/           # Next.js App Router UI
│   ├── backend/            # NestJS API, Prisma, workers
│   └── vscode-extension/   # VS Code extension (scaffold)
├── packages/
│   ├── shared/             # Shared domain utilities
│   ├── types/              # Shared TypeScript types
│   ├── ui/                 # Shared UI primitives
│   ├── utils/              # Cross-cutting helpers
│   └── config/             # Shared config / tooling
├── docs/                   # Numbered product & architecture docs (01–24)
├── infra/                  # Docker, nginx, Kubernetes configs
├── scripts/                # Setup, DB, project-manager, utilities
├── docker-compose.yml      # Local Postgres + Redis
├── CURRENT_STATUS.md       # Live progress dashboard
├── ROADMAP.md              # Development phases
└── CONTRIBUTING.md         # Contributor setup & standards
```

Backend modules already in tree include identity, workspaces, GitHub OAuth, webhooks, and related domains. See [`apps/backend/README.md`](./apps/backend/README.md).

---

## Quick start

### Prerequisites

- **Node.js** ≥ 22 and **npm** ≥ 10
- **Docker** & Docker Compose (Postgres + Redis)
- **Git**

### Setup

```bash
# 1. Clone
git clone https://github.com/Sangram10c/AI-Digital-Twin-Platform.git
cd AI-Digital-Twin-Platform

# 2. Install workspace dependencies
npm install

# 3. Environment files
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
# Fill JWT_SECRET, DATABASE_URL, REDIS_URL, and optional GitHub/AI keys

# 4. Infrastructure
docker-compose up -d
# or: npm run docker:up

# 5. Prisma client (+ migrate when ready)
npm run db:generate
npm run db:migrate

# 6. Development servers
npm run dev
```

| Service            | URL                            |
| ------------------ | ------------------------------ |
| Frontend           | http://localhost:3000          |
| API                | http://localhost:4000/api/v1   |
| Swagger (non-prod) | http://localhost:4000/api/docs |
| Health             | http://localhost:4000/health   |

Backend-specific commands (Redis, OAuth, webhooks): [`apps/backend/COMMANDS.md`](./apps/backend/COMMANDS.md)

---

## Scripts

| Script                                | Description                    |
| ------------------------------------- | ------------------------------ |
| `npm run dev`                         | Frontend + backend in parallel |
| `npm run build`                       | Production build (both apps)   |
| `npm run lint` / `typecheck` / `test` | Quality gates                  |
| `npm run test:e2e`                    | Frontend Playwright e2e        |
| `npm run format`                      | Prettier across the repo       |
| `npm run docker:up` / `docker:down`   | Start / stop Postgres + Redis  |
| `npm run db:generate`                 | Generate Prisma Client         |
| `npm run db:migrate`                  | Run Prisma migrations          |
| `npm run db:seed`                     | Seed reference / dev data      |
| `npm run db:studio`                   | Open Prisma Studio             |
| `npm run project:status`              | Project manager status CLI     |

---

## Docker

**Local development (infrastructure only):**

```bash
docker-compose up -d          # PostgreSQL (pgvector/pg17) + Redis 7
```

**Full stack compose** (app images and related services) lives under [`infra/docker/`](./infra/docker/).

---

## Environment variables

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
```

Root `.env.example` covers app URLs, database, Redis, JWT, OAuth, AI providers, embeddings, storage, queues, and rate limits. Backend overrides and secrets belong in `apps/backend/.env`.

Never commit real secrets. See [Security](./docs/15-security/README.md).

---

## Documentation

Primary index: [`docs/README.md`](./docs/README.md)

| #     | Document                                                                                                                                                                                         | Description                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| 01    | [Project Overview](./docs/01-project-overview/README.md)                                                                                                                                         | Vision and problem statement    |
| 02    | [User Journeys](./docs/02-user-journeys/README.md)                                                                                                                                               | End-to-end user flows           |
| 03    | [Functional Requirements](./docs/03-functional-requirements/README.md)                                                                                                                           | Feature requirements            |
| 04    | [Non-Functional Requirements](./docs/04-non-functional-requirements/README.md)                                                                                                                   | Scale, reliability, DX          |
| 05    | [System Architecture](./docs/05-system-architecture/README.md)                                                                                                                                   | Components and flows            |
| 06    | [Technology Stack](./docs/06-technology-stack/README.md)                                                                                                                                         | Stack choices                   |
| 07    | [Database ERD](./docs/07-database-erd/README.md)                                                                                                                                                 | Entities and relationships      |
| 08    | [Database Design](./docs/08-database-design/README.md)                                                                                                                                           | Schema by domain                |
| 09    | [API Design](./docs/09-api-design/README.md)                                                                                                                                                     | REST conventions and resources  |
| 10    | [Authentication](./docs/10-authentication-design/README.md)                                                                                                                                      | JWT and OAuth                   |
| 11    | [GitHub Integration](./docs/11-github-integration/README.md)                                                                                                                                     | Sync, webhooks, rate limits     |
| 12    | [AI / RAG](./docs/12-ai-rag-architecture/README.md)                                                                                                                                              | Chunking, embeddings, retrieval |
| 13    | [Search Engine](./docs/13-search-engine-design/README.md)                                                                                                                                        | Keyword + semantic search       |
| 14    | [Background Jobs](./docs/14-background-jobs/README.md)                                                                                                                                           | Queues and workers              |
| 15    | [Security](./docs/15-security/README.md)                                                                                                                                                         | AuthZ, secrets, throttling      |
| 16–17 | [Frontend](./docs/16-frontend-architecture/README.md) / [Backend](./docs/17-backend-architecture/README.md)                                                                                      | App architecture                |
| 18–20 | [Folder Structure](./docs/18-folder-structure/README.md) · [Coding Standards](./docs/19-coding-standards/README.md) · [Testing](./docs/20-testing-strategy/README.md)                            | Engineering practices           |
| 21–24 | [Deployment](./docs/21-deployment/README.md) · [Roadmap](./docs/22-development-roadmap/README.md) · [Future](./docs/23-future-enhancements/README.md) · [Glossary](./docs/24-glossary/README.md) | Ops and planning                |

Implementation notes for shipping backend modules: [`docs/backend/`](./docs/backend/README.md)

Agent / contributor rules: [`AGENT.md`](./AGENT.md) · [`CONTRIBUTING.md`](./CONTRIBUTING.md)

---

## Roadmap

Summarized from [`ROADMAP.md`](./ROADMAP.md):

| Phase                | Focus                                                              | Status                            |
| -------------------- | ------------------------------------------------------------------ | --------------------------------- |
| **1 — Foundation**   | Monorepo, Nest/Next skeletons, Prisma, auth, CI, Docker            | Done                              |
| **2 — Core**         | Users/RBAC, workspaces, documents, knowledge CRUD, chat, Socket.IO | In progress                       |
| **3 — Intelligence** | Embeddings, pgvector, semantic search, RAG, memory, timeline       | Planned                           |
| **4 — Integrations** | Deeper GitHub, Google Workspace, VS Code, webhooks                 | Partial (GitHub OAuth + webhooks) |
| **5 — Enterprise**   | Multi-tenant hardening, analytics, admin, audit, K8s               | Planned                           |

Track day-to-day progress in [`CURRENT_STATUS.md`](./CURRENT_STATUS.md).

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

1. Fork and branch from `main` (`feature/…` or `fix/…`).
2. Follow Conventional Commits (`feat:`, `fix:`, `docs:`, …).
3. Pass `npm run lint`, `npm run typecheck`, and `npm run test`.
4. Open a pull request with a clear description.

---

## License

MIT — see [`LICENSE`](./LICENSE).

---

<div align="center">
  <sub>Built for developers who want their engineering history to answer back.</sub>
</div>
