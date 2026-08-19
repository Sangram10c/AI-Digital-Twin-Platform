# Memory Module

> **Status:** ✅ Complete  
> **Source Directory:** `apps/backend/src/modules/memory/`

---

## 1. Overview

The `MemoryModule` provides long-term conversational memory management for the AI Digital Twin Platform. It stores key user preferences, architectural decisions, and conversation facts across chat sessions to maintain context continuity.

---

## 2. Structure

```text
src/modules/memory/
├── memory.controller.ts    # Memory inspection & management endpoints
├── memory.module.ts        # Module definition
├── memory.service.ts       # Memory extraction, retrieval, and expiration logic
├── dto/
├── interfaces/
└── types/
```

---

## 3. Database Models

- **`ConversationMemory` (`conversation_memories`)**:
  - `conversationId`: Scoped conversation FK.
  - `content`: Memory snippet text.
  - `importance`: Float importance score (0.0 to 1.0) used for context prioritization.
  - `expiresAt`: Optional TTL expiration timestamp for ephemeral context.

---

## 4. Chat Integration

During the RAG prompt assembly phase in `ChatService`, relevant memories are retrieved from `MemoryService` based on relevance and importance, and injected into the system prompt context.
