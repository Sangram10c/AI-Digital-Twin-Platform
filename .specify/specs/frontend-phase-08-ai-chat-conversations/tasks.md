# Tasks: Frontend Phase 08 — AI Chat & Conversations

- [ ] **Task 1: Chat Types & API Service**
  - [ ] Create `src/types/chat.types.ts` defining conversations, messages, citations, streaming events, and providers.
  - [ ] Implement `src/services/chat.service.ts` with streaming reader and REST endpoints.
  - [ ] Update `src/services/repository.service.ts` for listing workspace repositories.

- [ ] **Task 2: Hooks & State Management**
  - [ ] Create `src/features/chat/hooks/use-conversations.ts` for conversation list and mutations.
  - [ ] Create `src/features/chat/hooks/use-chat-stream.ts` for streaming execution and abort control.

- [ ] **Task 3: Chat Workspace Components**
  - [ ] Build `src/features/chat/components/conversation-sidebar.tsx` and `conversation-item.tsx`.
  - [ ] Build `src/features/chat/components/repository-selector.tsx` and `new-chat-modal.tsx`.
  - [ ] Build `src/features/chat/components/chat-header.tsx`.
  - [ ] Build `src/features/chat/components/chat-message.tsx` and `message-list.tsx`.
  - [ ] Build `src/features/chat/components/model-selector.tsx`.
  - [ ] Build `src/features/chat/components/message-composer.tsx`.
  - [ ] Build `src/features/chat/components/citation-drawer.tsx`.
  - [ ] Build `src/features/chat/components/chat-empty-state.tsx`.
  - [ ] Build `src/features/chat/components/chat-shell.tsx`.

- [ ] **Task 4: Routing & Deep Linking**
  - [ ] Implement `src/app/(app)/[workspaceSlug]/chat/page.tsx` integrating ChatShell.
  - [ ] Implement `src/app/(app)/[workspaceSlug]/chat/[conversationId]/page.tsx` for deep linking.

- [ ] **Task 5: Quality Gates & Verification**
  - [ ] Run `npm run typecheck`
  - [ ] Run `npm run lint`
  - [ ] Run `npm run build`
