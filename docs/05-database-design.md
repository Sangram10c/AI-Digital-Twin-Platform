# Database Design

## Overview

The platform uses PostgreSQL with the pgvector extension for vector similarity search.

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ WorkspaceMember : belongs_to
    User ||--o{ Workspace : owns
    User ||--o{ Document : authors
    User ||--o{ Notification : receives

    Organization ||--o{ Workspace : contains

    Workspace ||--o{ WorkspaceMember : has
    Workspace ||--o{ Document : contains

    Document ||--o{ Embedding : has

    User {
        string id PK
        string email UK
        string name
        string passwordHash
        string avatar
        enum role
        boolean emailVerified
        datetime createdAt
        datetime updatedAt
    }

    Account {
        string id PK
        string userId FK
        string provider
        string providerAccountId
        string accessToken
        string refreshToken
    }

    Organization {
        string id PK
        string name
        string slug UK
        enum plan
    }

    Workspace {
        string id PK
        string name
        string slug UK
        string ownerId FK
        string organizationId FK
    }

    Document {
        string id PK
        string title
        string content
        enum type
        string workspaceId FK
        string authorId FK
    }

    Embedding {
        string id PK
        string documentId FK
        string content
        vector vector
        json metadata
    }
```

## pgvector Usage

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
