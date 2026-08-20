# Implementation Plan: Frontend Phase 02 — Authentication & Identity

## 1. Technical Strategy

### 1.1 Auth Services & Token Strategy

- Use `apps/frontend/src/services/auth.service.ts` to call backend `/api/v1/auth/*` endpoints.
- Store `access_token` and `refresh_token` in `localStorage` & cookies for Next.js middleware sync.
- Inject `Authorization: Bearer <access_token>` in `api.service.ts`.
- When 401 occurs, attempt refresh or gracefully redirect to `/login?redirect=...`.

### 1.2 Session Restoration Flow

1. App mounts `AuthProvider`.
2. Check `access_token` in `localStorage`/cookie.
3. If token exists, fetch current user workspaces via `GET /api/v1/workspaces`.
4. If valid, set user and workspace state in Zustand and TanStack Query.
5. If invalid/expired, call `/api/v1/auth/refresh` with `refreshToken`.
6. If refresh fails, clear tokens and set unauthenticated state.
7. Only reveal application content once session resolution completes (no UI flash).

### 1.3 Workspace Resolution Flow

- After login or session restore:
  - If user has 1 workspace: Auto-select it and navigate to `/[workspaceSlug]/dashboard`.
  - If user has multiple workspaces: Navigate to `/workspaces` or preserve active workspace from URL.
  - If user has 0 workspaces: Navigate to `/workspaces` (with prompt to create first workspace).

### 1.4 Role & Permission Engine

- Platform roles: `ADMIN`, `USER`, `VIEWER`
- Workspace roles: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`
- Create `src/lib/permissions.ts` with typed permission matrix:
  - `repository.read`, `repository.write`, `search.use`, `chat.use`, `analytics.read`, `workspace.manage`, `users.manage`, `audit.read`
- Expose `usePermissions()` hook for conditional UI.

---

## 2. File Implementation Order

### Group 1: Types, Services & Permission Layer

- `src/types/auth.types.ts` & `user.types.ts`: Align with backend DTOs.
- `src/services/auth.service.ts`: Implement login, register, logout, refresh, forgot-password, reset-password.
- `src/services/workspace.service.ts`: Implement list workspaces, get workspace by ID, create workspace.
- `src/lib/permissions.ts`: Role-to-permission mapping and `can()` evaluator.

### Group 2: Stores & Providers

- `src/store/auth.store.ts`: Enhanced Zustand store with token sync and session restoration actions.
- `src/store/workspace.store.ts`: Enhanced workspace store with auto-selection logic.
- `src/components/providers/auth-provider.tsx`: Session restoration lifecycle without hydration mismatch.

### Group 3: Auth Pages & OAuth Callbacks

- `src/app/(auth)/layout.tsx`: Centered auth container with logo and plain dark aesthetic.
- `src/app/(auth)/login/page.tsx`: React Hook Form + Zod login form with error feedback and OAuth buttons.
- `src/app/(auth)/register/page.tsx`: Registration form with full name, email, password strength check.
- `src/app/(auth)/forgot-password/page.tsx`: Password recovery request form.
- `src/app/(auth)/callback/github/page.tsx`: Multi-state GitHub OAuth callback processor.
- `src/app/(auth)/callback/google/page.tsx`: Google OAuth callback processor.

### Group 4: Route Protection & Error States

- `src/middleware.ts`: Edge middleware protecting `/[workspaceSlug]/*`, `/workspaces`, and `/admin`.
- `src/app/unauthorized/page.tsx`: 401 session expired page.
- `src/app/forbidden/page.tsx`: 403 access denied page.

### Group 5: Shell & Header Integration

- `src/components/layout/app-header.tsx`: Connect live user profile, workspace switcher, and logout trigger.
- `src/components/layout/app-sidebar.tsx`: Dynamic role-aware navigation using `usePermissions()`.

---

## 3. Verification Plan

- `npm run typecheck`: 0 errors
- `npm run lint`: 0 errors, 0 warnings
- `npm run build`: 100% pages compiled and statically optimized
