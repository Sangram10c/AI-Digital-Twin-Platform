# Settings Module

> **Status:** ✅ Complete  
> **Source Directory:** `apps/backend/src/modules/settings/`

---

## 1. Overview

The `SettingsModule` manages user, workspace, and global configuration preferences, including default AI provider selection, embedding model configurations, automated sync schedules, and UI theme preferences.

---

## 2. Structure

```text
src/modules/settings/
├── settings.controller.ts   # Configuration REST endpoints
├── settings.module.ts       # Module definition
├── settings.service.ts      # Settings persistence & validation
├── constants/
├── dto/
├── interfaces/
└── types/
```

---

## 3. Database Models

- **`WorkspaceSettings` (`workspace_settings`)**:
  - `workspaceId`: 1:1 relationship with `Workspace`.
  - `defaultAiProvider`: Active LLM provider (`gemini`, `groq`, `openai`, `anthropic`, `ollama`).
  - `defaultAiModel`: Model identifier.
  - `defaultEmbeddingModel`: Vector model identifier.
  - `autoSyncEnabled`: Automatic webhook/scheduled sync toggle.
  - `preferences`: JSONB metadata for custom workspace toggles.
