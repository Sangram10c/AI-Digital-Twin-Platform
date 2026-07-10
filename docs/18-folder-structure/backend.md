# Backend

## Purpose

<!-- Describe the purpose of this document. -->

## Scope

<!-- Define the boundaries and context of this document. -->

## Overview

<!-- Provide a high-level summary. -->

## Responsibilities

<!-- List key responsibilities, components, or actors. -->

## Design

```
backend/src/
├── modules/                   # Feature modules
│   ├── auth/                  # Authentication & authorization
│   ├── users/                 # User management
│   ├── organizations/         # Organization management
│   ├── workspaces/            # Workspace management
│   ├── documents/             # Document management
│   ├── ai/                    # AI service orchestration
│   ├── embeddings/            # Vector embeddings
│   ├── search/                # Search functionality
│   ├── knowledge/             # Knowledge base
│   ├── notifications/         # Notification system
│   └── health/                # Health checks
├── common/                    # Shared utilities
│   ├── guards/                # Auth guards
│   ├── decorators/            # Custom decorators
│   ├── pipes/                 # Validation pipes
│   ├── filters/               # Exception filters
│   ├── middleware/             # HTTP middleware
│   ├── interceptors/          # Response interceptors
│   └── dto/                   # Shared DTOs
├── config/                    # Configuration files
├── database/                  # Prisma module & service
├── jobs/                      # BullMQ job processing
├── storage/                   # File storage service
└── gateway/                   # WebSocket gateway
```

## Future Improvements

<!-- Note planned enhancements or open questions. -->

## References

<!-- Link to related documents, standards, or external resources. -->
