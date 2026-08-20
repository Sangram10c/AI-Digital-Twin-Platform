# Feature Specification: Frontend Phase 02 — Authentication & Identity

## 1. Context & Objectives

Implement the complete frontend authentication and identity experience using the existing NestJS backend authentication system.

The frontend must allow users to:

- Register with email, name, and password
- Sign in with email and password
- Sign out and invalidate session
- Restore existing session on page load / app startup without UI flash
- Connect and authenticate via GitHub OAuth
- Handle Google OAuth if configured
- Handle OAuth callbacks cleanly with multi-state support (loading, success, error, invalid/cancelled)
- Load authenticated user profile
- Resolve active workspace and user membership
- Resolve platform roles (`ADMIN`, `USER`, `VIEWER`) and workspace roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`)
- Evaluate fine-grained permissions via permission evaluation layer (`permission.can(...)`)
- Protect authenticated and admin application routes
- Display helpful unauthorized (401) and forbidden (403) states
- Map backend errors into human-friendly messages
- Connect application header and user menu with live authentication data

---

## 2. Architectural Principles

1. **Backend Authority:** The NestJS backend is the sole authoritative security boundary (`JwtAuthGuard`, `RolesGuard`, `WorkspaceGuard`). Frontend authorization is strictly for navigation, route UX, and conditional UI.
2. **Role Model:** Only use backend-defined roles:
   - Platform roles: `ADMIN`, `USER`, `VIEWER`
   - Workspace roles: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`
   - No invented roles (`SUPER_ADMIN`, `MODERATOR`, etc.).
3. **No Testing in this Phase:** Testing is explicitly deferred to the dedicated hardening phase. No test files created or modified.
4. **No Backend Modifications:** Work exclusively within `apps/frontend`.
5. **Clean Route Boundaries:** Dedicated `(auth)` layout with focused styling, separate from public marketing layout and authenticated application shell.

---

## 3. Scope & Requirements

### 3.1 Authentication Pages & UX

- `src/app/(auth)/layout.tsx`: Focused, centered auth card with subtle ambient background and official logo.
- `src/app/(auth)/login/page.tsx`: Email, Password, GitHub OAuth button, Google OAuth button, link to register, link to forgot password.
- `src/app/(auth)/register/page.tsx`: Full Name, Email, Password, Confirm Password, link to login.
- `src/app/(auth)/forgot-password/page.tsx`: Email input, submit reset request, success state.
- `src/app/(auth)/callback/github/page.tsx`: GitHub OAuth callback receiver handling tokens/code, loading spinner, error feedback, and redirection to active workspace or `/workspaces`.
- `src/app/(auth)/callback/google/page.tsx`: Google OAuth callback receiver.

### 3.2 State Management & Services

- `src/store/auth.store.ts`: Store client auth state (user, tokens in memory/storage, isAuthenticated, isLoading).
- `src/store/workspace.store.ts`: Store current active workspace and workspace list.
- `src/services/auth.service.ts`: Connect to `/api/v1/auth/login`, `/register`, `/logout`, `/refresh`, `/forgot-password`, `/reset-password`.
- `src/services/workspace.service.ts`: Connect to `/api/v1/workspaces`.
- `src/services/api.service.ts`: Maintain JWT bearer injection, 401 handling, and safe token clearing.

### 3.3 Permissions & Route Protection

- `src/lib/permissions.ts`: Single permission evaluation layer (`hasPermission`, `can`, permission definitions mapped to roles).
- `src/middleware.ts`: Next.js middleware for server-side route protection (redirecting unauthenticated users to `/login`, redirecting authenticated users from `/login` to `/workspaces`, protecting `/admin` routes).
- `src/components/auth/auth-guard.tsx` & `admin-guard.tsx`: Client-side UX wrappers preventing UI flash during session checks.
- `src/app/unauthorized/page.tsx` & `src/app/forbidden/page.tsx`: Dedicated 401 & 403 error screens.

### 3.4 Shell Integration

- `src/components/layout/app-header.tsx`: Connect live user profile, workspace switcher, and logout menu.
