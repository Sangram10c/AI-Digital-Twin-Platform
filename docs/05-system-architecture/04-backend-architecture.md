# Backend Architecture

Project

AI Digital Twin Platform

Version

1.0

Status

Approved

---

# 1. Purpose

This document defines the backend architecture of the AI Digital Twin Platform.

It explains the overall backend structure, business modules, communication patterns, background processing, AI orchestration, and integration strategy.

The backend follows a modular architecture that prioritizes scalability, maintainability, and testability.

---

# 2. Technology Stack

Framework

NestJS

Language

TypeScript

ORM

Prisma

Database

PostgreSQL

Cache

Redis

Queue

BullMQ

Authentication

JWT + Refresh Token

Validation

Zod

Documentation

Swagger / OpenAPI

Logging

Pino

AI

Provider Layer

---

# 3. Architecture Style

The backend follows a Modular Monolith Architecture.

Each module owns:

- Controller
- Service
- Repository
- DTO
- Entity
- Interfaces
- Validation
- Business Rules

Modules communicate only through service interfaces.

No module should directly access another module's database logic.

---

# 4. Backend Layers

Client

↓

Controller Layer

↓

Application Layer

↓

Domain Layer

↓

Infrastructure Layer

↓

Database

---

## Controller Layer

Responsibilities

- Receive HTTP Requests
- Validate Input
- Authenticate Requests
- Return HTTP Responses

Controllers must never contain business logic.

---

## Application Layer

Responsibilities

- Execute use cases
- Coordinate modules
- Manage workflows
- Handle transactions

---

## Domain Layer

Contains

- Business Rules
- Entities
- Interfaces
- Domain Services
- Policies

This layer must remain independent of frameworks.

---

## Infrastructure Layer

Contains

- Prisma
- GitHub SDK
- Redis
- BullMQ
- AI Providers
- Email Services
- External APIs

Only this layer communicates with external systems.

---

# 5. Core Modules

The backend is divided into the following modules.

Authentication

User

GitHub

Repository

Branch

Commit

Pull Request

Documentation

Search

AI

Conversation

Notification

Background Jobs

Audit

Settings

Health

Each module is independent.

---

# 6. Module Responsibilities

## Authentication Module

Responsibilities

- Register
- Login
- Logout
- Refresh Token
- Password Reset
- Email Verification

---

## User Module

Responsibilities

- Profile
- Preferences
- Settings

---

## GitHub Module

Responsibilities

- OAuth
- Repository Discovery
- Webhooks
- Synchronization
- API Communication

---

## Repository Module

Responsibilities

- Repository Metadata
- Repository Details
- Repository Status
- Repository Statistics

---

## Branch Module

Responsibilities

- Branch Metadata
- Branch History
- Default Branch

---

## Commit Module

Responsibilities

- Commit History
- Commit Details
- Commit Statistics

---

## Pull Request Module

Responsibilities

- PR Details
- Reviews
- Comments
- Merge History

---

## Documentation Module

Responsibilities

- Repository Documentation
- Markdown Processing
- AI Knowledge Preparation

---

## Search Module

Responsibilities

- Keyword Search
- Semantic Search
- Ranking
- Filtering

---

## AI Module

Responsibilities

- Context Retrieval
- Prompt Building
- AI Provider Selection
- Response Generation
- Citation Generation

---

## Conversation Module

Responsibilities

- Chat History
- Conversation Management
- Pinned Conversations

---

## Notification Module

Responsibilities

- Email Notifications
- In-App Notifications
- Sync Notifications

---

## Background Job Module

Responsibilities

- Repository Sync
- Embedding Generation
- Scheduled Tasks
- Retry Jobs

---

## Audit Module

Responsibilities

- Activity Logs
- Security Logs
- Sync Logs

---

# 7. Request Flow

Client

↓

Controller

↓

Validation

↓

Authentication

↓

Service

↓

Repository

↓

Database

↓

Response

Every request follows this lifecycle.

---

# 8. AI Request Flow

Client

↓

AI Controller

↓

AI Service

↓

Retriever

↓

Search

↓

Prompt Builder

↓

AI Provider

↓

Citation Builder

↓

Formatter

↓

Client

AI responses must always include supporting references whenever possible.

---

# 9. Repository Synchronization Flow

GitHub

↓

OAuth

↓

Webhook / Manual Sync

↓

Queue

↓

Sync Worker

↓

Repository Module

↓

Branch Module

↓

Commit Module

↓

Pull Request Module

↓

Documentation Module

↓

Embedding Worker

↓

Database

↓

Ready For Search

---

# 10. Background Processing

Background workers process:

Repository Sync

Embedding Generation

AI Index Updates

Notification Delivery

Cleanup Jobs

Workers execute independently of HTTP requests.

---

# 11. Queue Architecture

BullMQ Queues

Repository Queue

Embedding Queue

Notification Queue

Cleanup Queue

Analytics Queue

Queues improve scalability and responsiveness.

---

# 12. Caching Strategy

Redis caches:

User Sessions

Repository Metadata

Frequently Accessed Conversations

Search Results

AI Responses (Short-Term)

Rate Limit Counters

---

# 13. Error Handling

The backend shall implement:

Global Exception Filter

Validation Errors

Authentication Errors

Authorization Errors

External API Errors

Database Errors

Queue Errors

AI Provider Errors

All errors shall be logged with sufficient context.

---

# 14. Logging

The backend logs:

Authentication Events

Repository Sync

Webhook Events

AI Requests

Search Requests

System Errors

Audit Events

Structured logging shall be used throughout the application.

---

# 15. Security

JWT Authentication

Refresh Tokens

OAuth

Role-Based Access Control

Input Validation

Rate Limiting

Encryption

Secure Secrets Management

Every endpoint must enforce authorization rules.

---

# 16. Health Monitoring

Health endpoints shall expose:

API Status

Database Status

Redis Status

Queue Status

AI Provider Status

GitHub API Status

Used for monitoring and deployments.

---

# 17. Extensibility

The architecture must support:

Bitbucket

GitLab

Gmail

Jira

Confluence

Slack

VS Code

without requiring major architectural changes.

---

# 18. Folder Organization

The backend should be organized by feature modules rather than technical layers.

Example

src/

modules/

shared/

common/

config/

database/

providers/

jobs/

This keeps features self-contained and maintainable.

---

# 19. Advantages

The architecture provides:

High Maintainability

Clear Module Boundaries

Scalability

Easy Testing

Independent Features

Future Provider Support

Strong Separation of Concerns

---

# 20. Summary

The backend architecture is designed around independent business modules communicating through clearly defined interfaces.

This design allows the platform to scale while remaining easy to maintain, extend, and test.

Every future backend implementation must follow this architecture.
