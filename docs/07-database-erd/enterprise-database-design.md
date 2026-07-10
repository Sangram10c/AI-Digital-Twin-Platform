# Enterprise Database Design

**Project:** AI Digital Twin Platform
**Version:** 1.0
**Status:** Approved
**Document Type:** Database Design
**Author:** Sangram Chougule

---

# Table of Contents

1. Introduction
2. Database Goals
3. Database Design Principles
4. Storage Architecture
5. Business Domains
6. High-Level Data Flow
7. Database Architecture
8. Enterprise ERD Overview
9. Complete Enterprise ER Diagram
10. Identity Domain
11. Workspace Domain
12. Git Integration Domain
13. Repository Domain
14. Engineering History Domain
15. Knowledge Domain
16. AI Domain
17. Search Domain
18. Notification Domain
19. Analytics Domain
20. Audit Domain
21. Background Jobs Domain
22. Complete Relationship Matrix
23. Complete Table Design
24. Constraints
25. Foreign Keys
26. Cascade Rules
27. Soft Delete Strategy
28. UUID Strategy
29. JSON Strategy
30. Enum Strategy
31. Timestamp Strategy
32. Versioning Strategy
33. Multi-Tenant Strategy
34. Security Strategy
35. Scalability Strategy
36. Backup Strategy
37. Future Database Expansion
38. Database Review
39. Appendix

---

# 1. Introduction

## Purpose

The Enterprise Database Design document defines the complete logical and physical database architecture of the AI Digital Twin Platform.

It serves as the single source of truth for every database-related decision, including entity relationships, table structures, constraints, indexing strategies, security considerations, scalability plans, and future expansion.

This document is intended for developers, architects, DevOps engineers, and future contributors.

---

## Scope

This document covers:

- Business entities
- Entity relationships
- Database architecture
- Table design
- Constraints
- Primary and Foreign Keys
- Indexing
- Performance
- Security
- Scalability
- Future enhancements

---

# 2. Database Goals

The database is designed to support:

- Millions of users
- Millions of repositories
- Billions of commits
- Large AI conversations
- Semantic search
- Hybrid search
- Retrieval-Augmented Generation (RAG)
- Multiple Git providers
- Multi-workspace architecture
- Future enterprise features

---

# 3. Database Design Principles

The database follows these principles:

- Single Source of Truth
- Third Normal Form (3NF)
- Referential Integrity
- UUID Primary Keys
- Immutable Engineering History
- Soft Deletes
- Strong Auditing
- High Performance
- Scalability
- Security by Design
- Provider Independence
- Future Compatibility

---

# 4. Storage Architecture

```text
Frontend

↓

Backend (NestJS)

↓

Prisma ORM

↓

PostgreSQL

↓

pgvector

↓

Redis

↓

BullMQ
```

## Responsibilities

### PostgreSQL

Stores all business data.

### pgvector

Stores AI embeddings for semantic search.

### Redis

Stores cache, sessions, temporary data, and rate limits.

### BullMQ

Processes background jobs.

---

# 5. Business Domains

The database is divided into the following domains:

- Identity
- Workspace
- Git Integration
- Repository
- Engineering History
- Knowledge
- AI
- Search
- Notification
- Analytics
- Audit
- Background Jobs

Each domain owns its own entities and business rules.

---

# 6. High-Level Data Flow

```text
GitHub

↓

Repository

↓

Engineering History

↓

Knowledge Chunks

↓

Embeddings

↓

Hybrid Search

↓

AI Context Builder

↓

Large Language Model

↓

Conversation

↓

Analytics
```

---

# 7. Database Architecture

## Primary Database

PostgreSQL

Purpose:

- Business Data
- Relationships
- Transactions

---

## Vector Database

pgvector

Purpose:

- Semantic Search
- AI Embeddings

---

## Cache

Redis

Purpose:

- Sessions
- API Cache
- Search Cache
- Rate Limiting

---

## Queue

BullMQ

Purpose:

- Repository Sync
- Embedding Generation
- Notification Processing
- Analytics Jobs

---

# 8. Enterprise ERD Overview

The Enterprise ERD models every major business entity in the platform before physical implementation.

It establishes:

- Ownership
- Relationships
- Cardinality
- Dependencies

without focusing on implementation details.

---

# 9. Complete Enterprise ER Diagram

> This section will contain the complete Mermaid ER diagram after all entities are finalized.

---

# 10. Identity Domain

This section will define:

- Developer
- Session
- RefreshToken
- OAuthToken

For each entity:

- Purpose
- Attributes
- Relationships
- Constraints
- Indexes
- Cascade Rules

---

# 11. Workspace Domain

Contains:

- Workspace
- Workspace Settings
- Future Organization Support

---

# 12. Git Integration Domain

Contains:

- Git Provider
- Connected Account
- OAuth Tokens
- Webhook Events
- Sync History

---

# 13. Repository Domain

Contains:

- Repository
- Branch
- Commit
- Pull Request
- Review
- Issue
- Release
- Tag
- Contributors
- Repository Statistics

---

# 14. Engineering History Domain

This domain stores the complete engineering history extracted from repositories.

Includes:

- Commits
- Pull Requests
- Reviews
- Issues
- Documentation
- Discussions

---

# 15. Knowledge Domain

Contains:

- Knowledge Chunks
- Embeddings
- Citations
- Knowledge Sources

This domain powers the AI search engine.

---

# 16. AI Domain

Contains:

- Conversations
- Messages
- AI Responses
- Prompt History
- Model Usage
- Conversation Memory
- Pinned Conversations

---

# 17. Search Domain

Contains:

- Search History
- Saved Searches
- Search Cache
- Search Ranking

Supports:

- Keyword Search
- Semantic Search
- Hybrid Search

---

# 18. Notification Domain

Contains:

- Notifications
- Notification Preferences
- Email Queue
- Push Notifications

---

# 19. Analytics Domain

Contains:

- Repository Analytics
- Developer Analytics
- AI Analytics
- Search Analytics
- Usage Metrics

---

# 20. Audit Domain

Contains:

- Audit Logs
- Security Events
- Activity Logs

All audit records are immutable.

---

# 21. Background Jobs Domain

Contains:

- Repository Sync Jobs
- Embedding Jobs
- Notification Jobs
- Analytics Jobs
- Cleanup Jobs

---

# 22. Complete Relationship Matrix

This section will contain every relationship in the system.

Example:

| Parent       | Child      | Relationship |
| ------------ | ---------- | ------------ |
| Developer    | Workspace  | 1:N          |
| Workspace    | Repository | 1:N          |
| Repository   | Branch     | 1:N          |
| Branch       | Commit     | 1:N          |
| Pull Request | Review     | 1:N          |
| Conversation | Message    | 1:N          |

---

# 23. Complete Table Design

Every table will include:

- Purpose
- Columns
- Data Types
- Default Values
- Constraints
- Foreign Keys
- Indexes
- Example Records

---

# 24. Constraints

This section documents:

- Primary Keys
- Foreign Keys
- Unique Constraints
- Check Constraints
- Not Null Constraints

---

# 25. Foreign Keys

Every foreign key in the database will be documented with its relationship and cascade behavior.

---

# 26. Cascade Rules

Defines delete and update behavior.

Examples:

- CASCADE
- RESTRICT
- SET NULL
- NO ACTION

---

# 27. Soft Delete Strategy

Defines:

- Which tables support soft delete
- Why soft delete is used
- Recovery strategy

---

# 28. UUID Strategy

All primary keys use UUID v7.

Benefits:

- Globally unique
- Better scalability
- Distributed system support

---

# 29. JSON Strategy

JSONB is used for:

- Provider Metadata
- AI Metadata
- Search Filters
- Dynamic Settings

---

# 30. Enum Strategy

Examples:

- UserRole
- ProviderType
- RepositoryStatus
- JobStatus
- NotificationType

---

# 31. Timestamp Strategy

Every major table includes:

- created_at
- updated_at
- deleted_at
- last_synced_at
- last_login_at
- expires_at

where applicable.

---

# 32. Versioning Strategy

Tracks:

- Database Schema Version
- Migration Version
- API Compatibility

---

# 33. Multi-Tenant Strategy

Future support for:

- Organizations
- Teams
- Enterprise Customers

while maintaining strict data isolation.

---

# 34. Security Strategy

Includes:

- Password Hashing
- OAuth Token Encryption
- Least Privilege Access
- Audit Logging
- Secure Connections

---

# 35. Scalability Strategy

Supports:

- Read Replicas
- Partitioning
- Connection Pooling
- Horizontal Scaling
- Billions of Records

---

# 36. Backup Strategy

Includes:

- Daily Backups
- Incremental WAL
- Point-in-Time Recovery
- Disaster Recovery Plan

---

# 37. Future Database Expansion

Future modules include:

- Organizations
- Teams
- Billing
- Marketplace
- Plugin System
- AI Agents
- Browser Extension
- VS Code Extension
- Mobile Application

---

# 38. Database Review

This section includes:

- Architecture Review
- Performance Review
- Security Review
- Scalability Review
- Future Recommendations

---

# 39. Appendix

Contains:

- Naming Conventions
- Abbreviations
- References
- ERD Diagrams
- Example Queries
- Migration Notes
