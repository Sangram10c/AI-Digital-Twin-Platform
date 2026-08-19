# Documents Module

> **Status:** ✅ Complete  
> **Source Directory:** `apps/backend/src/modules/documents/`

---

## 1. Overview

The `DocumentsModule` manages synced and custom markdown/text documentation entities linked to repositories and workspaces. It handles CRUD operations for architecture decision records (ADRs), wikis, API specifications, and README files that serve as source material for the knowledge ingestion pipeline.

---

## 2. Structure

```text
src/modules/documents/
├── documents.controller.ts  # Document REST endpoints
├── documents.module.ts      # Module definition
├── documents.service.ts     # Document lifecycle and persistence
├── dto/
├── interfaces/
└── types/
```

---

## 3. Database Models

- **`Documentation` (`documentation` table)**:
  - `repositoryId`: Scoped repository FK.
  - `title`, `content`, `filePath`: Content body and repository path.
  - `type`: Enum (`README`, `WIKI`, `MARKDOWN`, `ADR`, `CHANGELOG`, `API_DOC`, `OTHER`).
  - `lastSyncedAt`: Timestamp of last Git sync.

---

## 4. Integration with Knowledge Pipeline

When documentation is created or modified, `DocumentsService` coordinates with `KnowledgeService` to chunk content and enqueue embedding generation jobs.
