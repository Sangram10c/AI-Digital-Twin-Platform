# Vector Search

## Purpose

<!-- Describe the purpose of this document. -->

## Scope

<!-- Define the boundaries and context of this document. -->

## Overview

<!-- Provide a high-level summary. -->

## Responsibilities

<!-- List key responsibilities, components, or actors. -->

## Design

# Vector Database

## pgvector

The platform uses PostgreSQL's pgvector extension for vector similarity search.

## Setup

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Schema

```sql
CREATE TABLE embeddings (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id),
  content TEXT NOT NULL,
  vector vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Indexing Strategies

### HNSW (Recommended)

```sql
CREATE INDEX ON embeddings
USING hnsw (vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### IVFFlat (Alternative)

```sql
CREATE INDEX ON embeddings
USING ivfflat (vector vector_cosine_ops)
WITH (lists = 100);
```

## Distance Functions

| Function      | Operator | Use Case                      |
| ------------- | -------- | ----------------------------- |
| Cosine        | `<=>`    | Text similarity (recommended) |
| L2            | `<->`    | Image similarity              |
| Inner Product | `<#>`    | Dot product similarity        |

## Future Improvements

<!-- Note planned enhancements or open questions. -->

## References

<!-- Link to related documents, standards, or external resources. -->
