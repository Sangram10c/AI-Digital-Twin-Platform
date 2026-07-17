# 🚀 AI Engineering Intelligence Platform

> **Project Status Dashboard**
>
> This document is the single source of truth for the project's current progress.
>
> **Rule:**
> Before starting any new task, both developers and AI assistants must review this file to understand the current project state.

---

# 📌 Project Information

| Property           | Value                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| Project Name       | AI Engineering Intelligence Platform                                          |
| Project Type       | Enterprise Full Stack SaaS                                                    |
| Current Version    | v1.0.0 (Active Development)                                                   |
| Repository Status  | Active Development                                                            |
| Development Method | Documentation First                                                           |
| Architecture Style | Modular Monolith (Future Microservice Ready)                                  |
| Primary Goal       | Build an AI-powered Engineering Intelligence Platform for Software Developers |

---

# 🎯 Project Vision

Build an AI platform that understands engineering history from GitHub, Bitbucket, technical documentation, pull requests, commits, branches, issues and future integrations.

Instead of searching manually across multiple engineering platforms, developers should be able to ask natural language questions such as:

- Which commit introduced JWT Authentication?
- Which branch added Payment Gateway?
- Who approved this Pull Request?
- Why was this API changed?
- Show every discussion related to authentication.
- Summarize everything completed in Sprint 12.

The platform should become an AI Engineering Assistant capable of understanding software projects like a senior developer.

---

# 📍 Current Phase

**Phase 2 — Core Features & Integrations**

Current Focus:

GitHub Integration — OAuth and webhooks are implemented; finish full repository sync / crawl APIs and complete doc 11.

---

# 📄 Current Document

**12 - AI / RAG Architecture**

Status:

🟡 In Progress

Progress:

- ✅ GitHub OAuth (multi-account)
- ✅ Workspace linking
- ✅ Webhooks + BullMQ incremental sync
- ⬜ Full repository crawl / read REST APIs

---

# 📚 Documentation Progress

| #   | Document                    | Status         |
| --- | --------------------------- | -------------- |
| 01  | Project Overview            | ✅ Completed   |
| 02  | User Journeys               | ✅ Completed   |
| 03  | Functional Requirements     | ✅ Completed   |
| 04  | Non-Functional Requirements | ✅ Completed   |
| 05  | System Architecture         | ✅ Completed   |
| 06  | Technology Stack            | ✅ Completed   |
| 07  | Database ERD                | ✅ Completed   |
| 08  | Database Design             | ✅ Completed   |
| 09  | API Design                  | ✅ Completed   |
| 10  | Authentication Design       | ✅ Completed   |
| 11  | GitHub Integration          | ✅ Completed   |
| 12  | AI / RAG Architecture       | 🟡 In Progress |
| 13  | Search Engine Design        | 🟡 In Progress |
| 14  | Background Job Architecture | ⬜ Not Started |
| 15  | Security Architecture       | ⬜ Not Started |
| 16  | Frontend Architecture       | ⬜ Not Started |
| 17  | Backend Architecture        | ⬜ Not Started |
| 18  | Folder Structure            | ⬜ Not Started |
| 19  | Coding Standards            | ⬜ Not Started |
| 20  | Testing Strategy            | ⬜ Not Started |
| 21  | Deployment Architecture     | ⬜ Not Started |
| 22  | Development Roadmap         | ⬜ Not Started |
| 23  | Future Enhancements         | ⬜ Not Started |
| 24  | Glossary                    | ⬜ Not Started |

---

# 📊 Overall Progress

| Phase        | Progress |
| ------------ | -------- |
| Planning     | 100%     |
| Architecture | 73%      |
| Backend      | 0%       |
| Frontend     | 0%       |
| AI           | 0%       |
| Testing      | 0%       |
| Deployment   | 0%       |

---

# 🏗 Current Architecture

```
Next.js (Frontend)
        │
        ▼
NestJS Backend
        │
        ▼
PostgreSQL
        │
        ▼
Redis
        │
        ▼
BullMQ
        │
        ▼
pgvector
        │
        ▼
Ollama / OpenAI
```

---

# 🛠 Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand

---

## Backend

- NestJS
- TypeScript
- Prisma

---

## Database

- PostgreSQL
- pgvector

---

## Queue

- BullMQ

---

## Cache

- Redis

---

## AI

Development

- Ollama

Production

- OpenAI
- Gemini
- Anthropic

---

# 🧠 Product Scope (MVP)

Version 1 includes:

- User Authentication
- GitHub Integration
- Repository Synchronization
- Branch History
- Commit History
- Pull Request Analysis
- AI Chat
- Semantic Search
- Documentation Search
- Repository Intelligence

---

# 🚫 Not Included in MVP

These features are planned for future versions:

- Bitbucket
- Gmail
- Jira
- Confluence
- Slack
- Google Drive
- VS Code Extension
- Team Collaboration
- Organization Dashboard

---

# 📌 Current Task

Complete:

12-ai-/-rag-architecture.md

Remaining:

- Full repository crawl / read REST APIs (`apps/backend/src/modules/repository/`)
- Finalize [docs/11-github-integration](./docs/11-github-integration/README.md) (sync strategy docs)

---

# 📌 Next Task

After GitHub Integration:

12 — AI / RAG Architecture

---

# 🚨 Development Rules

Before implementing any feature:

- Read CURRENT_STATUS.md
- Read AGENT.md
- Read the relevant architecture documents.
- Understand the feature requirements.
- Never skip documentation.
- Never generate code without understanding the architecture.
- Never modify unrelated modules.
- Always maintain backward compatibility.
- Follow project coding standards.
- Update documentation after implementation.

---

# 🚫 Things NOT To Do

Do NOT:

- Write Prisma schema before Database Design is completed.
- Build APIs before API Design is approved.
- Build UI before API contracts exist.
- Store entire Git repositories.
- Store binary files.
- Store node_modules.
- Store build folders.
- Skip architecture review.

---

# 📝 Recent Decisions

## Decision #001

Store engineering metadata instead of entire repositories.

Status:

✅ Approved

---

## Decision #002

GitHub is the first supported integration.

Status:

✅ Approved

---

## Decision #003

AI answers will use RAG with PostgreSQL + pgvector.

Status:

✅ Approved

---

## Decision #004

Ollama will be used during development.

Status:

✅ Approved

---

# ⚠ Pending Decisions

- Full repository synchronization / crawl strategy (final details)
- Embedding model selection
- Search ranking algorithm
- AI provider abstraction details
- Multi-tenant support hardening

Resolved recently:

- ✅ Webhook architecture (BullMQ ingest + workers)
- ✅ GitHub OAuth + token encryption at rest

---

# 🎯 Long-Term Goal

Deliver an enterprise-grade AI Engineering Intelligence Platform demonstrating:

- System Design
- Enterprise Backend Architecture
- AI/RAG
- PostgreSQL Design
- Authentication
- GitHub Integration
- Scalable APIs
- Modern Frontend
- Production Deployment

This project should be portfolio-quality and demonstrate senior-level engineering practices.

---

# 📅 Last Updated

Update this section after every completed milestone.

**Date:** 2026-07-17

Current Milestone:

✅ AI / RAG Architecture Documentation

Current Focus:

🟡 AI / RAG Architecture Documentation

Next Milestone:

Search Engine Design Approved

---

# 📢 Reminder

**Do not rush into coding.**

A strong architecture saves weeks of rework.

Every implementation must follow this sequence:

Requirement

↓

Discussion

↓

Architecture

↓

Documentation

↓

Review

↓

Database Design

↓

API Design

↓

Backend

↓

Frontend

↓

Testing

↓

Deployment
