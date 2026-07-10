# Diagrams

## Purpose

<!-- Describe the purpose of this document. -->

## Scope

<!-- Define the boundaries and context of this document. -->

## Overview

<!-- Provide a high-level summary. -->

## Responsibilities

<!-- List key responsibilities, components, or actors. -->

## Design

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

## Future Improvements

<!-- Note planned enhancements or open questions. -->

## References

<!-- Link to related documents, standards, or external resources. -->
