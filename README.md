<div align="center">

# 🤖 AI Digital Twin Platform

**Enterprise-grade AI Digital Twin Platform for building intelligent knowledge assistants.**

[![CI](https://github.com/your-org/ai-digital-twin/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/ai-digital-twin/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-Latest-black.svg)](https://nextjs.org/)

</div>

---

## 📋 Overview

The AI Digital Twin Platform enables organizations to create intelligent digital twins that learn from documents, code, and knowledge bases. Powered by a multi-provider AI architecture supporting OpenAI, Anthropic, Google Gemini, and Ollama.

### Key Features

- 🧠 **Multi-Provider AI** — Switch between OpenAI, Anthropic, Gemini, and Ollama
- 📄 **RAG Pipeline** — Retrieval-Augmented Generation for accurate AI responses
- 🔍 **Vector Search** — pgvector-powered semantic search
- 🏢 **Multi-Tenant** — Organizations, workspaces, and RBAC
- 🔐 **Enterprise Auth** — JWT + Google OAuth + GitHub OAuth
- ⚡ **Real-Time** — WebSocket-powered live updates
- 🖥️ **VS Code Extension** — Deep IDE integration
- 📊 **Analytics** — Usage tracking and insights

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Next.js    │  │  VS Code     │  │  Mobile   │ │
│  │   Frontend   │  │  Extension   │  │  (Future) │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
└─────────┼──────────────────┼───────────────┼────────┘
          │                  │               │
┌─────────┼──────────────────┼───────────────┼────────┐
│         ▼                  ▼               ▼        │
│  ┌─────────────────────────────────────────────┐    │
│  │           NestJS API + WebSocket            │    │
│  └─────────────────────┬───────────────────────┘    │
│                        │                             │
│  ┌──────────┐ ┌────────┴──┐ ┌──────────┐ ┌───────┐ │
│  │PostgreSQL│ │   Redis   │ │  BullMQ  │ │Storage│ │
│  │+pgvector │ │           │ │  Queues  │ │       │ │
│  └──────────┘ └───────────┘ └──────────┘ └───────┘ │
│                    Data Layer                        │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer        | Technologies                                                                 |
| ------------ | ---------------------------------------------------------------------------- |
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query |
| **Backend**  | NestJS, TypeScript, Prisma, PostgreSQL, pgvector, Redis, BullMQ              |
| **AI**       | OpenAI, Anthropic, Google Gemini, Ollama                                     |
| **DevOps**   | Docker, GitHub Actions, ESLint, Prettier, Husky                              |
| **Testing**  | Jest, Supertest, Playwright                                                  |

---

## 📁 Project Structure

```
ai-digital-twin-platform/
├── frontend/           # Next.js frontend (App Router)
├── backend/            # NestJS backend (Clean Architecture)
├── vscode-extension/   # VS Code extension
├── docs/               # 20 documentation files
├── docker/             # Dockerfiles & Compose
├── scripts/            # Utility scripts
├── .github/            # CI/CD, templates, dependabot
└── .vscode/            # Editor settings
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 22.0.0
- **npm** >= 10.0.0
- **Docker** & Docker Compose
- **Git**

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/ai-digital-twin.git
cd ai-digital-twin

# 2. Run the setup script
bash scripts/setup.sh

# 3. Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# 4. Run database migrations
npm run db:migrate

# 5. Start development servers
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:4000`.

---

## 📦 Available Scripts

| Script                | Description                             |
| --------------------- | --------------------------------------- |
| `npm run dev`         | Start frontend + backend in development |
| `npm run build`       | Build both projects for production      |
| `npm run lint`        | Lint both projects                      |
| `npm run test`        | Run all tests                           |
| `npm run test:e2e`    | Run Playwright E2E tests                |
| `npm run format`      | Format code with Prettier               |
| `npm run docker:up`   | Start Docker services                   |
| `npm run docker:down` | Stop Docker services                    |
| `npm run db:migrate`  | Run Prisma migrations                   |
| `npm run db:studio`   | Open Prisma Studio                      |
| `npm run db:seed`     | Seed the database                       |

---

## 🐳 Docker

### Development (Infrastructure only)

```bash
docker-compose up -d          # PostgreSQL + Redis
```

### Full Stack

```bash
docker-compose -f docker/docker-compose.yml up -d
```

---

## 🔧 Environment Variables

Copy the example files and configure:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

See [Environment Variables Documentation](docs/17-environment-variables.md) for the complete reference.

---

## 📚 Documentation

| Document                                                  | Description                    |
| --------------------------------------------------------- | ------------------------------ |
| [Project Overview](docs/01-project-overview.md)           | Vision and goals               |
| [System Architecture](docs/02-system-architecture.md)     | Architecture diagrams          |
| [Tech Stack](docs/03-tech-stack.md)                       | Technology choices             |
| [Folder Structure](docs/04-folder-structure.md)           | Directory layout               |
| [Database Design](docs/05-database-design.md)             | ER diagrams, pgvector          |
| [API Design](docs/06-api-design.md)                       | REST conventions               |
| [Authentication](docs/07-authentication.md)               | JWT, OAuth flows               |
| [AI Architecture](docs/08-ai-architecture.md)             | Provider pattern               |
| [RAG Pipeline](docs/09-rag-pipeline.md)                   | Retrieval-Augmented Generation |
| [Vector Database](docs/10-vector-database.md)             | pgvector setup                 |
| [Integrations](docs/11-integrations.md)                   | GitHub, Google                 |
| [Security](docs/12-security.md)                           | OWASP, rate limiting           |
| [Coding Standards](docs/13-coding-standards.md)           | Naming, patterns               |
| [Development Roadmap](docs/14-development-roadmap.md)     | Phased plan                    |
| [Deployment](docs/15-deployment.md)                       | Docker, CI/CD                  |
| [Testing Strategy](docs/16-testing-strategy.md)           | Jest, Playwright               |
| [Environment Variables](docs/17-environment-variables.md) | Variable reference             |
| [Feature Roadmap](docs/18-feature-roadmap.md)             | Feature backlog                |
| [Contributing](docs/19-contributing.md)                   | Contribution guide             |
| [License](docs/20-license.md)                             | MIT License                    |

---

## 🗺️ Roadmap

- [x] **Phase 1**: Project architecture & scaffolding
- [ ] **Phase 2**: Core backend (auth, users, workspaces)
- [ ] **Phase 3**: Frontend foundation (design system, layouts)
- [ ] **Phase 4**: Document management
- [ ] **Phase 5**: AI integration & RAG
- [ ] **Phase 6**: Real-time features
- [ ] **Phase 7**: Advanced features (analytics, admin, extension)
- [ ] **Phase 8**: Production readiness

---

## 🤝 Contributing

We welcome contributions! See [Contributing Guide](docs/19-contributing.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](docs/20-license.md) for details.

---

<div align="center">
  <sub>Built with ❤️ by the AI Digital Twin Team</sub>
</div>
