# Relationships

## Purpose

<!-- Describe the purpose of this document. -->

## Scope

<!-- Define the boundaries and context of this document. -->

## Overview

<!-- Provide a high-level summary. -->

## Responsibilities

<!-- List key responsibilities, components, or actors. -->

## Design

Vector embeddings are stored using the `vector` type with 1536 dimensions (OpenAI default).

### Creating HNSW Index

```sql
CREATE INDEX ON embeddings USING hnsw (vector vector_cosine_ops);
```

### Similarity Search

```sql
SELECT content, 1 - (vector <=> $1) AS similarity
FROM embeddings
ORDER BY vector <=> $1
LIMIT 10;
```

## Future Improvements

<!-- Note planned enhancements or open questions. -->

## References

<!-- Link to related documents, standards, or external resources. -->
