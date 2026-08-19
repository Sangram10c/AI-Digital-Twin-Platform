# Google Module

> **Status:** 🟡 Scaffolded (Google Workspace Integration planned for Phase 15)  
> **Source Directory:** `apps/backend/src/modules/google/`

---

## 1. Overview

The `GoogleModule` provides Google OAuth authentication integration and scaffolding for future Google Workspace integrations (Google Docs, Google Drive, Gmail sync).

---

## 2. Structure

```text
src/modules/google/
├── google.controller.ts    # Google OAuth / Integration controller
├── google.module.ts        # Module configuration
├── google.service.ts       # Google API client and token management
├── constants/
├── dto/
├── interfaces/
└── types/
```

---

## 3. Current Functionality

- **Google OAuth Login**: Supports user login and registration via Google OAuth 2.0.
- **Token Management**: Persists encrypted access/refresh tokens in `OAuthToken` model.

---

## 4. Planned Capabilities (Phase 15)

- Google Drive folder synchronization as knowledge sources.
- Google Docs ingestion and real-time revision indexing.
- Workspace document citation in RAG conversations.
