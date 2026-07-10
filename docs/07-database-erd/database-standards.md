# Database Standards

**Project:** AI Digital Twin Platform
**Version:** 1.0
**Status:** Approved
**Document Type:** Database Standards & Best Practices

---

# Table of Contents

1. Purpose
2. Design Philosophy
3. Naming Standards
4. Table Standards
5. Column Standards
6. Primary Key Standards
7. Foreign Key Standards
8. UUID Strategy
9. Timestamp Strategy
10. Soft Delete Strategy
11. Enum Standards
12. JSON Standards
13. Relationship Standards
14. Index Standards
15. Constraint Standards
16. Prisma Standards
17. Migration Standards
18. Security Standards
19. Performance Standards
20. Backup Standards
21. Documentation Standards
22. Code Review Checklist
23. Future Guidelines

---

# 1. Purpose

This document defines the database development standards used throughout the AI Digital Twin Platform.

Every database object must follow these standards to ensure consistency, maintainability, scalability, and long-term reliability.

---

# 2. Design Philosophy

The database follows these principles:

- Simplicity
- Consistency
- Scalability
- Security
- Performance
- Maintainability
- Auditability
- Future Compatibility

---

# 3. Naming Standards

## Tables

Use:

Plural

Snake Case

Examples

developers

repositories

branches

commits

pull_requests

conversation_messages

background_jobs

---

## Columns

Use

Snake Case

Examples

created_at

updated_at

deleted_at

workspace_id

repository_id

provider_type

last_synced_at

Never abbreviate names unnecessarily.

---

## Primary Keys

Always use

id

Never

developer_id as PK

repository_id as PK

---

## Foreign Keys

Always use

entity_id

Examples

developer_id

workspace_id

repository_id

branch_id

conversation_id

message_id

---

## Index Names

Pattern

idx_<table>_<column>

Examples

idx_repository_name

idx_commit_sha

idx_message_created_at

---

## Unique Index

Pattern

uq_<table>_<column>

Example

uq_developer_email

---

## Foreign Key Constraint

Pattern

fk_<table>_<referenced_table>

Example

fk_repository_workspace

---

# 4. Table Standards

Every table must contain

id

created_at

updated_at

If required

deleted_at

Never create tables without timestamps.

---

# 5. Column Standards

Use descriptive names.

Good

repository_name

provider_repository_id

Bad

name

repo

pid

---

# 6. Primary Key Standards

Always

UUID v7

Never

Auto Increment Integer

Reason

Better distributed scalability

---

# 7. Foreign Key Standards

Every relationship uses FK constraints.

Never store IDs without relationships.

Always enforce referential integrity.

---

# 8. UUID Strategy

Every entity

UUID v7

Benefits

Globally Unique

Better Index Locality

Future Distributed Systems

---

# 9. Timestamp Strategy

Standard timestamps

created_at

updated_at

deleted_at

expires_at

last_synced_at

last_login_at

processed_at

Only include timestamps that are relevant to the entity.

---

# 10. Soft Delete Strategy

Supported Tables

developers

workspaces

repositories

conversations

notifications

Not Supported

commits

pull_requests

reviews

issues

audit_logs

Engineering history remains immutable.

---

# 11. Enum Standards

Every enum should be centralized.

Examples

UserStatus

ProviderType

RepositoryStatus

JobStatus

ConversationStatus

NotificationType

SyncStatus

Avoid storing status as plain text.

---

# 12. JSON Standards

Use JSONB only when structure is dynamic.

Examples

provider_metadata

ai_metadata

search_filters

webhook_payload

Avoid storing relational data inside JSON.

---

# 13. Relationship Standards

Prefer

One-to-Many

Avoid

Many-to-Many

Unless necessary.

If needed

Always use junction tables.

Example

workspace_members

repository_labels

---

# 14. Index Standards

Always index

Primary Keys

Foreign Keys

Unique Columns

Frequently Filtered Columns

Frequently Sorted Columns

Avoid indexing

Large text columns

Rarely queried fields

---

# 15. Constraint Standards

Always use

NOT NULL

UNIQUE

CHECK

FOREIGN KEY

DEFAULT

when appropriate.

Never rely only on application validation.

---

# 16. Prisma Standards

One model per entity.

Always define

Relations

Indexes

Unique Constraints

Enums

Use Prisma Migrations.

Never modify production schema manually.

---

# 17. Migration Standards

Every schema change

↓

Migration

↓

Review

↓

Testing

↓

Deployment

Never edit old migrations.

Never skip migrations.

---

# 18. Security Standards

Passwords

Argon2id

OAuth Tokens

Encrypted

Refresh Tokens

Hashed

Database Connections

TLS

Least Privilege

Mandatory

Never expose database directly to frontend.

---

# 19. Performance Standards

Always

Use Pagination

Use Composite Indexes

Use Prepared Statements

Batch Inserts

Limit SELECT *

Review EXPLAIN ANALYZE

Monitor Slow Queries

---

# 20. Backup Standards

Daily Full Backup

Hourly WAL

30-Day Retention

Point-in-Time Recovery

Regular Restore Testing

---

# 21. Documentation Standards

Every table must document

Purpose

Columns

Relationships

Indexes

Constraints

Cascade Rules

Examples

---

# 22. Code Review Checklist

Before merging database changes verify:

✓ Naming standards

✓ Relationships

✓ Constraints

✓ Indexes

✓ Prisma migration

✓ Performance

✓ Security

✓ Documentation updated

---

# 23. Future Guidelines

Future database improvements include

- Multi-Tenant Architecture
- Read Replicas
- Table Partitioning
- Dedicated Vector Database
- Data Archiving
- Automatic Index Recommendations
- AI Query Optimization
- Cross-Region Replication

---

# Summary

These standards ensure every database object in the AI Digital Twin Platform is designed consistently, performs efficiently, remains secure, and is easy to maintain as the platform evolves.

Following these rules keeps the schema predictable, scalable, and enterprise-ready.
