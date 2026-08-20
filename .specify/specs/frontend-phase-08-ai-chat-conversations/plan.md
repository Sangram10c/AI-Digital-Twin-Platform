# Implementation Plan: Frontend Phase 08 — AI Chat & Conversations

## 1. Technical Strategy

### 1.1 Chat API & Streaming Service

- Build `src/services/chat.service.ts` to manage conversation CRUD and SSE streaming.
- Implement `streamChat(payload, onDelta, onCitations, onDone, onError, signal)` via `fetch()` with `ReadableStream` reader parsing SSE lines (`event: delta\ndata: ...`).
- Provide non-streaming fallback using `api.post('/chat', payload)`.

### 1.2 Conversation State & TanStack Query

- `useConversations(workspaceId)`: Query for conversation list with search filter.
- `useConversation(conversationId)`: Query for message history.
- `useChatStream()`: Hook for managing message dispatch, streaming tokens, active abort controller, and message optimistic updates.

### 1.3 UI Component Hierarchy

```
ChatShell
├── ConversationSidebar
│   ├── SearchInput
│   ├── NewChatButton
│   └── TimeGroupedList (Today, Yesterday, 7 Days, Older)
│       └── ConversationItem
├── ChatArea
│   ├── ChatHeader (Repo pill, title, rename, pin)
│   ├── MessageList
│   │   ├── ChatEmptyState (Prompt suggestions)
│   │   └── ChatMessage (MarkdownRenderer, citations)
│   └── MessageComposer (Textarea, ModelSelector, Stop/Send buttons)
├── NewChatModal (RepositorySelector)
└── CitationDrawer (File path, score, code excerpt)
```

---

## 2. Verification Plan

- `npm run typecheck`: 0 errors
- `npm run lint`: 0 errors, 0 warnings
- `npm run build`: 100% routes compiled
