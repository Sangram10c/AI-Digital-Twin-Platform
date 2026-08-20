# Feature Specification: Frontend Phase 08 — AI Chat & Conversations

## 1. Objectives & Overview

Replace the basic AI Chat placeholder with a complete conversational workspace connected to the live NestJS RAG Chat backend.

Key Capabilities:

1. **Conversation History & Sidebar:** Multi-conversation listing grouped chronologically (Today, Yesterday, Previous 7 Days, Older), with real-time title updates, search filter, pinning, and deletion.
2. **New Chat & Repository Scope:** "+ New Chat" flow allowing users to choose/search workspace repositories to ground the RAG search.
3. **SSE Streaming AI Responses:** Reusable streaming client consuming `POST /api/v1/chat/stream` or `POST /api/v1/chat` fallback with token deltas, citations events, and abort control (`AbortController`).
4. **Rich Citations & Source Drawer:** Visual citation badges in markdown answers, opening a detailed source preview drawer with file paths, excerpts, and relevance scores.
5. **Model/Provider Selector:** Dynamic provider dropdown (`Gemini`, `Groq`, `OpenAI`, `Anthropic`, `Ollama`, etc.) integrated into the message composer.
6. **Deep Linking & Persistence:** Workspace-scoped URL routing (`/[workspaceSlug]/chat` and `/[workspaceSlug]/chat/[conversationId]`) restoring conversation state, messages, and repository context on reload.
7. **Responsive Layout:** Sidebar collapsible on tablet, drawer-based on mobile, split-view on desktop.

---

## 2. Backend API Mapping

- `POST /api/v1/chat/stream`: SSE streaming endpoint emitting `delta`, `citations`, `done`, `error`.
- `POST /api/v1/chat`: Synchronous full RAG response.
- `GET /api/v1/chat/conversations?workspaceId=...`: Paginated user conversations.
- `GET /api/v1/chat/conversations/:id`: Full conversation detail with chronological message history.
- `PATCH /api/v1/chat/conversations/:id`: Update title.
- `DELETE /api/v1/chat/conversations/:id`: Soft delete conversation.
- `POST /api/v1/chat/conversations/:id/pin`: Pin conversation.
- `DELETE /api/v1/chat/conversations/:id/pin`: Unpin conversation.
