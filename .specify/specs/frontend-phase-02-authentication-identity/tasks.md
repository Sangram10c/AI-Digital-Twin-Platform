# Tasks: Frontend Phase 02 — Authentication & Identity

- [x] **Task 1: Align Types, API Config, and Services**
  - [x] Update `src/types/auth.types.ts` and `src/types/user.types.ts` to match backend `AuthResponse` and `UserRole`.
  - [x] Update `src/services/auth.service.ts` with complete `/api/v1/auth/*` methods (login, register, logout, refresh, forgot-password, reset-password).
  - [x] Update `src/services/workspace.service.ts` for listing, creating, and fetching workspaces.
  - [x] Implement `src/lib/permissions.ts` with permission matrix and `hasPermission` evaluator.

- [x] **Task 2: State Management & Session Restoration**
  - [x] Update `src/store/auth.store.ts` to handle session tokens, cookies, and user profile state.
  - [x] Update `src/store/workspace.store.ts` for active workspace resolution.
  - [x] Implement `src/components/providers/auth-provider.tsx` to restore session on app mount and prevent UI flashing.
  - [x] Update `src/components/providers/app-providers.tsx` with `AuthProvider`.

- [x] **Task 3: Authentication Pages & Forms**
  - [x] Refactor `src/app/(auth)/layout.tsx` for focused auth styling with official logo.
  - [x] Build `src/app/(auth)/login/page.tsx` with Zod validation, error handling, and GitHub/Google OAuth triggers.
  - [x] Build `src/app/(auth)/register/page.tsx` with name, email, password, and confirm password fields.
  - [x] Build `src/app/(auth)/forgot-password/page.tsx`.
  - [x] Build `src/app/(auth)/callback/github/page.tsx` with multi-state callback handling and redirection.
  - [x] Build `src/app/(auth)/callback/google/page.tsx`.

- [x] **Task 4: Route Protection & Error Pages**
  - [x] Update `src/middleware.ts` to protect `/workspaces`, `/[workspaceSlug]/*`, and `/admin`.
  - [x] Implement `src/app/unauthorized/page.tsx` (401 page).
  - [x] Implement `src/app/forbidden/page.tsx` (403 page).

- [x] **Task 5: Shell & User Menu Integration**
  - [x] Update `src/components/layout/app-header.tsx` with live user avatar, email, workspace role badge, and sign out button.
  - [x] Update `src/components/layout/app-sidebar.tsx` with permission-aware navigation.

- [x] **Task 6: Verification & Quality Gates**
  - [x] Run `npm run typecheck`
  - [x] Run `npm run lint`
  - [x] Run `npm run build`
