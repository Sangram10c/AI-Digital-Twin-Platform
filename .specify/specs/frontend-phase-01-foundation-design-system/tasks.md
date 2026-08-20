# Implementation Tasks: Frontend Phase 01 — Foundation & Design System

**Feature ID:** `frontend-phase-01-foundation-design-system`  
**Status:** COMPLETED  
**Target Directory:** `apps/frontend/`

---

## Task Breakdown

### Group 0: Architecture & Configuration Cleanup (Prerequisite)

- [x] **Task 0.1:** Unify route constants into `src/config/routes.config.ts` and eliminate duplication in `src/constants/routes.ts`.
- [x] **Task 0.2:** Unify API endpoints into `src/config/api.config.ts` matching backend `/api/v1` routes and eliminate duplication in `src/constants/api-endpoints.ts`.
- [x] **Task 0.3:** Standardize navigation schemas in `src/config/nav.config.ts` with role-aware checks (`UserRole`, `WorkspaceRole`).

### Group 1: Design Tokens & CSS Foundation

- [x] **Task 1.1:** Configure HSL design tokens, CSS variables, dark/light theme definitions, and chart palettes in `src/app/globals.css` with Tailwind CSS v4.
- [x] **Task 1.2:** Add subtle glassmorphism and developer-focused high-density utility classes.

### Group 2: Providers & Global State Setup

- [x] **Task 2.1:** Implement `src/components/providers/theme-provider.tsx` with light/dark/system support and class switching.
- [x] **Task 2.2:** Implement `src/components/providers/auth-provider.tsx` for session hydration from `localStorage`, profile synchronization, and UX redirection.
- [x] **Task 2.3:** Consolidate providers in `src/components/providers/app-providers.tsx` and wire into `src/app/layout.tsx`.
- [x] **Task 2.4:** Implement `src/middleware.ts` for server-side route validation.

### Group 3: Core UI Primitives (`src/components/ui/`)

- [x] **Task 3.1:** Implement `button.tsx` (variants: default, secondary, outline, ghost, destructive, link, ai-gradient; sizes: sm, md, lg, icon; loading state).
- [x] **Task 3.2:** Implement `input.tsx` & `textarea.tsx` (text, password toggle, search icon, error states).
- [x] **Task 3.3:** Implement `select.tsx` (custom styled native/accessible dropdown selector).
- [x] **Task 3.4:** Implement `card.tsx` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
- [x] **Task 3.5:** Implement `badge.tsx` (status variants: default, secondary, success, warning, destructive, ai/indigo; dot indicator).
- [x] **Task 3.6:** Implement `avatar.tsx` (fallback initials, status dot).
- [x] **Task 3.7:** Implement `dialog.tsx` (accessible modal, backdrop blur, ESC dismiss).
- [x] **Task 3.8:** Implement `sheet.tsx` (accessible side drawer for mobile navigation and detail panels).
- [x] **Task 3.9:** Implement `dropdown-menu.tsx` (keyboard navigable popover).
- [x] **Task 3.10:** Implement `tabs.tsx` (accessible tab switcher with smooth indicator).
- [x] **Task 3.11:** Implement `tooltip.tsx`, `skeleton.tsx` (shimmer loading pulse), and `table.tsx` (striped/hoverable data table).
- [x] **Task 3.12:** Export all primitives via `src/components/ui/index.ts`.

### Group 4: Developer & Engineering Shared Components (`src/components/shared/`)

- [x] **Task 4.1:** Implement `command-palette.tsx` (`Ctrl+K` global search & quick actions modal).
- [x] **Task 4.2:** Implement `breadcrumbs.tsx` (hierarchical path navigation).
- [x] **Task 4.3:** Implement `code-block.tsx` (syntax-highlighted code container with copy button).
- [x] **Task 4.4:** Implement `markdown-renderer.tsx` (RAG answer markdown parser with citation support).
- [x] **Task 4.5:** Implement `citation-badge.tsx` (interactive citation pill linking to source chunks/commits/PRs).
- [x] **Task 4.6:** Implement `empty-state.tsx` and `error-state.tsx` (reusable feedback blocks).
- [x] **Task 4.7:** Export all shared components via `src/components/shared/index.ts`.

### Group 5: Layout Shells & Navigation Components (`src/components/layout/`)

- [x] **Task 5.1:** Implement `public-header.tsx` & `public-footer.tsx` for the marketing website.
- [x] **Task 5.2:** Implement `app-sidebar.tsx` with collapsible sections (Core, Intelligence, Engineering, Settings).
- [x] **Task 5.3:** Implement `app-header.tsx` with breadcrumbs, command palette trigger, and notification bell.
- [x] **Task 5.4:** Implement `workspace-switcher.tsx` with active workspace dropdown and "Create Workspace" modal trigger.
- [x] **Task 5.5:** Implement `user-nav.tsx` with profile menu, theme toggle, and logout trigger.
- [x] **Task 5.6:** Export layout components via `src/components/layout/index.ts`.

### Group 6: App Router Group Assembly

- [x] **Task 6.1:** Assemble `src/app/(public)/layout.tsx` and high-impact landing page in `src/app/(public)/page.tsx`.
- [x] **Task 6.2:** Assemble `src/app/(auth)/layout.tsx`, `login/page.tsx`, `register/page.tsx`, and `callback/page.tsx`.
- [x] **Task 6.3:** Assemble `src/app/(app)/layout.tsx` connecting App Shell with workspace routing.
- [x] **Task 6.4:** Assemble `src/app/(admin)/layout.tsx` with `UserRole.ADMIN` verification.
- [x] **Task 6.5:** Create workspace selector in `src/app/(app)/workspaces/page.tsx` and dashboard skeleton in `src/app/(app)/[workspaceSlug]/dashboard/page.tsx`.

### Group 7: Verification & Automated Quality Gates

- [x] **Task 7.1:** Run TypeScript typecheck (`npm run typecheck` in `apps/frontend`).
- [x] **Task 7.2:** Run ESLint and Prettier check (`npm run lint` in `apps/frontend`).
- [x] **Task 7.3:** Verify Next.js dev server rendering and Playwright smoke tests.
