# Database Interactions

Project

AI Digital Twin Platform

Version

1.0

Status

Approved

---

# 1. Purpose

This document defines how backend modules interact with the platform's data stores.

The platform uses multiple storage technologies, each with a specific responsibility.

Every module owns its data and interacts only through defined service interfaces.

---

# 2. Data Storage Components

The platform consists of four primary storage systems.

PostgreSQL

↓

Primary Relational Database

Redis

↓

Cache & Queue Storage

pgvector

↓

Vector Embeddings

Object Storage (Future)

↓

Large Files

Each storage system has a dedicated purpose.

---

# 3. Data Ownership

Every business module owns its own data.

Authentication

↓

Users

Sessions

Refresh Tokens

GitHub

↓

Connected Accounts

OAuth Tokens

Repositories

↓

Repository Metadata

Branches

↓

Branch Metadata

Commits

↓

Commit Metadata

Pull Requests

↓

PR Metadata

Reviews

AI

↓

Conversation History

AI Responses

Embeddings

↓

Vector Records

Notifications

↓

Notifications

Audit

↓

Activity Logs

No module should modify another module's data directly.

---

# 4. Storage Responsibilities

## PostgreSQL

Stores

Users

Repositories

Branches

Commits

PRs

Reviews

Issues

Chat

Notifications

Audit Logs

Configuration

---

## Redis

Stores

Cache

Session Cache

Rate Limits

Queue Data

Temporary Tokens

Frequently Used Queries

Redis must never become the source of truth.

---

## pgvector

Stores

Document Embeddings

Commit Embeddings

PR Embeddings

Issue Embeddings

README Embeddings

Conversation Embeddings

---

## Object Storage (Future)

Stores

Images

Documents

Exports

Reports

Attachments

---

# 5. Read Flow

Frontend

↓

Backend

↓

Service

↓

Repository

↓

Database

↓

Response

Only repositories communicate with databases.

---

# 6. Write Flow

Frontend

↓

Controller

↓

Service

↓

Repository

↓

Transaction

↓

Database

↓

Event

↓

Background Jobs

---

# 7. Repository Pattern

Every module has its own repository.

UserRepository

RepositoryRepository

CommitRepository

PullRequestRepository

IssueRepository

ConversationRepository

NotificationRepository

Repositories contain only persistence logic.

Business rules belong to services.

---

# 8. Transactions

Transactions are required when:

Creating Users

Connecting GitHub

Synchronizing Repository Metadata

Saving Conversations

Deleting Connected Accounts

Operations should either succeed completely or roll back.

---

# 9. Read Optimization

Frequently accessed data should use:

Indexes

Caching

Pagination

Filtering

Selective Loading

Avoid unnecessary joins.

---

# 10. Write Optimization

Batch Inserts

Bulk Updates

Background Writes

Queue Processing

Connection Pooling

Long-running writes must not block HTTP requests.

---

# 11. AI Database Interaction

User Question

↓

Conversation Service

↓

Retriever

↓

Keyword Search

↓

Vector Search

↓

Context Builder

↓

LLM

↓

Save Conversation

↓

Return Response

The AI never queries the database directly.

---

# 12. Synchronization Interaction

GitHub

↓

Sync Worker

↓

Repository Service

↓

Repository Repository

↓

PostgreSQL

↓

Embedding Queue

↓

pgvector

↓

Search Ready

---

# 13. Search Interaction

Question

↓

Search Service

↓

PostgreSQL

-

pgvector

↓

Ranking

↓

Results

↓

AI

Hybrid search always combines structured and semantic results.

---

# 14. Caching Interaction

Backend Service

↓

Redis

↓

Cache Hit?

↓

Yes

↓

Return

↓

No

↓

Database

↓

Redis

↓

Return

---

# 15. Data Consistency

The platform follows an Eventually Consistent model for:

Embeddings

Search Indexes

Analytics

Notifications

Critical business data remains strongly consistent in PostgreSQL.

---

# 16. Database Security

All database access requires:

Authentication

Authorization

Parameterized Queries

Encryption

Audit Logging

Direct database access from the frontend is prohibited.

---

# 17. Database Monitoring

Monitor

Query Time

Connection Pool

Slow Queries

Deadlocks

Cache Hit Ratio

Vector Search Performance

Storage Growth

---

# 18. Failure Recovery

If PostgreSQL fails

↓

Reject Write

↓

Retry Background Jobs

↓

Log Error

↓

Notify Administrator

If Redis fails

↓

Fallback To Database

If pgvector fails

↓

Keyword Search Only

↓

Notify User

---

# 19. Future Expansion

Support

Read Replicas

Database Sharding

Vector Database Separation

Object Storage

Data Archiving

Multi-Tenant Databases

---

# 20. Summary

The Database Interaction Architecture defines how every backend module communicates with PostgreSQL, Redis, pgvector, and future storage systems.

It enforces clear ownership, strong consistency for business data, eventual consistency for AI indexing, and a repository-based access pattern to keep the platform scalable, secure, and maintainable.
