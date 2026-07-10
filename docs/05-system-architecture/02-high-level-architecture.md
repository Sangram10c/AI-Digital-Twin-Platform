# High Level Architecture

Project

AI Digital Twin Platform

Version

1.0

Status

Approved

---

# 1. Purpose

This document describes the complete high-level architecture of the AI Digital Twin Platform.

It explains the major components, responsibilities, communication flow, and external integrations.

This document intentionally avoids implementation details and focuses on the overall system design.

---

# 2. Architecture Overview

The AI Digital Twin Platform follows a layered Modular Monolith Architecture.

The system is divided into independent business modules that communicate through well-defined interfaces.

The platform consists of:

- Frontend Application
- Backend API
- Database
- Cache
- Background Workers
- AI Engine
- Search Engine
- External Providers

---

# 3. High Level Architecture Diagram

```text

                    ┌─────────────────────────────┐
                    │          Developer          │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │      Next.js Frontend       │
                    └──────────────┬──────────────┘
                                   │
                          HTTPS / REST API
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │      NestJS Backend         │
                    └──────────────┬──────────────┘
                                   │
         ┌──────────────┬──────────┼───────────────┬───────────────┐
         ▼              ▼          ▼               ▼               ▼

 Authentication    Repository     AI Engine     Search        Background Jobs

         │              │          │               │               │
         └──────────────┼──────────┼───────────────┼───────────────┘
                        ▼
                PostgreSQL Database
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼

      pgvector                     Redis

          │                           │
          ▼                           ▼

    Semantic Search              BullMQ Queue

          │                           │
          └──────────────┬────────────┘
                         ▼

                AI Provider Layer

                         │

      ┌──────────────────┼────────────────────┐
      ▼                  ▼                    ▼

    Ollama            OpenAI             Gemini

                         │

                         ▼

                  AI Response

```

---

# 4. System Components

The platform consists of eight primary components.

## Frontend

Responsibilities

- User Interface
- Authentication
- Dashboard
- AI Chat
- Repository Management
- Search
- Settings

The frontend never communicates directly with the database.

---

## Backend

Responsibilities

- Business Logic
- Authentication
- GitHub Integration
- Repository Management
- AI Orchestration
- Search
- Background Jobs

The backend acts as the single entry point for all business operations.

---

## PostgreSQL

Responsibilities

- User Data
- Repository Metadata
- Branch Metadata
- Commit Metadata
- Pull Requests
- Issues
- Conversations
- Audit Logs

The database stores structured engineering information.

---

## pgvector

Responsibilities

Store vector embeddings for:

- Documentation
- Commit Summaries
- Pull Request Summaries
- AI Knowledge

Supports semantic search.

---

## Redis

Responsibilities

- Cache
- Sessions
- Temporary Data
- Queue Storage

Redis should never become the primary database.

---

## BullMQ

Responsibilities

Background Processing

Examples

- Repository Sync
- Embedding Generation
- AI Processing
- Notifications

Long-running tasks should execute asynchronously.

---

## AI Provider Layer

The platform should never depend directly on one AI provider.

The Provider Layer abstracts:

- Ollama
- OpenAI
- Gemini
- Future Providers

Changing providers should require minimal code changes.

---

## External Providers

Examples

GitHub

Future

- Bitbucket
- Gmail
- Jira
- Slack
- Confluence

External services communicate only through integration modules.

---

# 5. Layered Architecture

```

Presentation Layer

↓

Application Layer

↓

Domain Layer

↓

Infrastructure Layer

↓

Database

```

---

## Presentation Layer

Contains

- Next.js
- React Components
- UI
- Forms

Responsibilities

- Display Data
- Collect User Input

---

## Application Layer

Contains

Use Cases

Services

Business Workflows

Responsibilities

Coordinate business operations.

---

## Domain Layer

Contains

Business Rules

Entities

Value Objects

Interfaces

This layer must remain independent from frameworks.

---

## Infrastructure Layer

Contains

Prisma

GitHub API

Redis

BullMQ

AI Providers

Email

Logging

Everything external belongs here.

---

# 6. External Integrations

Version 1

GitHub

Version 2

Bitbucket

Gmail

Jira

Confluence

Slack

VS Code

Future integrations should not require changes to existing modules.

---

# 7. AI Request Flow

```

User

↓

Frontend

↓

Backend

↓

Search Engine

↓

Vector Search

↓

Context Builder

↓

Prompt Builder

↓

AI Provider

↓

Response

↓

Frontend

↓

User

```

---

# 8. Repository Synchronization Flow

```

GitHub

↓

OAuth

↓

Repository Selected

↓

Background Queue

↓

Sync Worker

↓

Repository Metadata

↓

Database

↓

Embedding Generation

↓

Vector Database

↓

Ready For AI

```

---

# 9. Search Flow

```

Question

↓

Keyword Search

↓

Semantic Search

↓

Merge Results

↓

Rank Results

↓

Context Builder

↓

AI

↓

Answer

```

---

# 10. Background Processing

The following operations execute asynchronously.

- Repository Synchronization
- AI Index Generation
- Embedding Generation
- Notification Delivery
- Scheduled Jobs

User requests should never wait for these operations.

---

# 11. Security Layers

Security exists at multiple levels.

Frontend

Authentication

↓

Backend

Authorization

↓

Database

Encryption

↓

AI

Context Validation

↓

Audit Logs

Every request passes through security validation.

---

# 12. Scalability

The architecture supports future growth by allowing:

- Horizontal API Scaling
- Background Worker Scaling
- AI Provider Replacement
- Database Optimization
- Multiple Integrations
- Multiple Organizations

without major redesign.

---

# 13. Future Evolution

Current

Modular Monolith

↓

Future

Microservices

The business modules should already be separated enough to support future extraction into independent services.

---

# 14. Advantages

The selected architecture provides:

- High Maintainability
- Clear Separation of Concerns
- Easy Testing
- Scalability
- Extensibility
- AI Provider Independence
- Future Cloud Readiness

---

# 15. Summary

The AI Digital Twin Platform is built around a modular architecture that separates presentation, business logic, persistence, background processing, and AI services.

This architecture allows the platform to remain maintainable while supporting future integrations and enterprise-scale growth.

Every future design decision should align with this architecture.
