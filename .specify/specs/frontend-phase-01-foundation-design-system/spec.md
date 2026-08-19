# Feature Specification: Frontend Phase 01 — Foundation & Design System

**Feature ID:** `frontend-phase-01-foundation-design-system`  
**Classification:** MEDIUM (Impact Score: 4)  
**Status:** DRAFT (Updated with User Corrections)  
**Target:** `apps/frontend/`

---

## 1. Executive Summary

Frontend Phase 01 establishes the enterprise-grade foundation, developer-centric design system, robust application shells, and routing/authorization boundaries for the AI Digital Twin Platform. It transforms the initial scaffold into a unified, high-density architecture supporting:

1. **Public Website (`(public)`):** High-conversion landing page, live architecture preview, features, and public documentation entry points.
2. **Authentication Experience (`(auth)`):** Dedicated, focused authentication layout (`login`, `register`, `callback`) isolated from the public marketing shell.
3. **Authenticated Workspace App (`(app)`):** Workspace-scoped application shell, responsive multi-tier sidebar, header with workspace switcher, breadcrumbs, search quick-trigger (`Ctrl+K`), real-time notification indicator, and AI Chat / Search / Analytics entry points.
4. **Admin Experience (`(admin)`):** Elevated administration layout with system health, user oversight, and BullMQ queue metrics (restricted to `UserRole.ADMIN`).

---

## 2. Problem Statement & Constraints

### 2.1 Problems to Solve

- The existing scaffold has placeholder pages with duplicate configurations (`constants/routes.ts` vs `config/nav.config.ts`, `constants/api-endpoints.ts` vs `config/api.config.ts`).
- UI primitives are absent in `components/ui/` (empty `.gitkeep`).
- Root `layout.tsx` is not wrapping `{children}` in global providers (`QueryProvider`, `AuthProvider`, `ThemeProvider`), causing data hydration and theme failure.
- The application lacks rich, high-density developer components (`CommandPalette`, `CodeBlock`, `MarkdownRenderer`, `CitationBadge`, `Sheet`, `Toast`, `Table`, `Breadcrumbs`, `EmptyState`, `ErrorState`).

### 2.2 Non-Negotiable Constraints & Rules

- **No Greenfield Rewrites:** Existing stores (`auth.store.ts`, `workspace.store.ts`, `ui.store.ts`), services (`api.service.ts`, `socket.service.ts`), and utils (`cn.ts`, `format.ts`, `storage.ts`) MUST be preserved and extended.
- **Security & Authorization Boundary:** Client-side guards are strictly for UX routing and smooth redirection. The true security boundaries are **server-side route protection (Next.js middleware / server layout token validation)** and **backend NestJS guards (`JwtAuthGuard`, `RolesGuard`, `WorkspaceGuard`)** via Bearer tokens.
- **Role Alignment:** Do not invent non-existent roles (e.g. `SUPER_ADMIN`). Use ONLY backend Prisma roles:
  - Platform Roles: `UserRole.ADMIN`, `UserRole.USER`, `UserRole.VIEWER`
  - Workspace Roles: `WorkspaceRole.OWNER`, `WorkspaceRole.ADMIN`, `WorkspaceRole.MEMBER`, `WorkspaceRole.VIEWER`
- **Design Philosophy:** Prioritize developer-focused information density, crisp typography, and high contrast. Keep glassmorphism and animations subtle, fast, and purposeful (no distracting float animations).

---

## 3. Scope & User Personas

### 3.1 Target Personas

1. **Anonymous Visitors:** View product features, review architecture, and initiate OAuth / Registration.
2. **Workspace Members / Developers (`WorkspaceRole.MEMBER` / `VIEWER`):** Navigate workspace repositories, interact with AI chat sessions, search code history, view analytics, inspect citations and files.
3. **Workspace Admins (`WorkspaceRole.OWNER` / `ADMIN`):** Manage workspace settings, configure AI model providers, manage integrations.
4. **Platform Administrators (`UserRole.ADMIN`):** Access `/admin` overview, inspect global BullMQ queues, monitor token consumption and API health.

---

## 4. Route Group Architecture

```text
                                  ┌────────────────────────┐
                                  │   Root Layout / HTML   │
                                  │  (Query/Auth/Theme)    │
                                  └───────────┬────────────┘
                                              │
         ┌───────────────────┬────────────────┴──────────────────┬───────────────────┐
         ▼                   ▼                                   ▼                   ▼
┌──────────────────┐┌──────────────────┐               ┌──────────────────┐┌──────────────────┐
│ (public) Group   ││ (auth) Group     │               │ (app) Group      ││ (admin) Group    │
│                  ││ (Isolated Shell) │               │                  ││                  │
│ • Landing Page   ││ • Login Form     │               │ • Workspace Shell││ • Admin Shell    │
│ • Features Page  ││ • Register Form  │               │ • [wsSlug] Routes││ • System Health  │
│ • Public Header  ││ • OAuth Callback │               │ • Search/Chat/RAG││ • Queue Monitor  │
│ • Public Footer  ││ • Reset Password │               │ • Analytics/Docs ││ • User Oversight │
└──────────────────┘└──────────────────┘               └──────────────────┘└──────────────────┘
```

---

## 5. Functional Requirements

### 5.1 Design System & Theme Engine

- **FR-01:** Implement a CSS variable-based design token palette in `globals.css` compatible with Tailwind CSS v4 supporting dark and light modes.
- **FR-02:** Provide semantic tokens (`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`).
- **FR-03:** Provide data visualization color tokens (`chart-1` through `chart-8`) for the Analytics domain.
- **FR-04:** Provide subtle, performance-optimized surface styling (minimal blur, crisp 1px borders).

### 5.2 UI Primitives & Developer Component Library

- **FR-05:** Implement comprehensive, accessible UI primitives:
  - `Button`, `Input`, `Textarea`, `Select`, `Card`, `Badge`, `Avatar`, `Dialog` / `Modal`, `Sheet` (Side drawer), `DropdownMenu`, `Tabs`, `Tooltip`, `Skeleton`, `Table`
  - `CommandPalette` (`Ctrl+K` global search & quick actions)
  - `Breadcrumbs` (Hierarchical navigation path)
  - `Toast` / Notification alert system
  - `CodeBlock` (Syntax-highlighted code container with copy button and language tag)
  - `MarkdownRenderer` (RAG markdown parser with sanitized HTML and embedded citations)
  - `CitationBadge` (Interactive source citation pill linking to file/commit/PR)
  - `EmptyState` & `ErrorState` (Reusable feedback cards with action buttons)

### 5.3 Application Shell & Navigation

- **FR-06:** **App Shell:** Collapsible sidebar with navigation groups (Core, Intelligence, Engineering, Settings), workspace switcher header with avatar, breadcrumb path, and notification center button.
- **FR-07:** **Public Shell:** Clean marketing header with logo, navigation links, theme toggle, and Sign In / Get Started CTA buttons.
- **FR-08:** **Auth Shell:** Focused, distraction-free centered card layout with brand header and security guarantee.
- **FR-09:** **Admin Shell:** Elevated admin layout with `UserRole.ADMIN` verification, distinct badge ("Admin Panel"), and queue/system navigation.

### 5.4 Routing & Security

- **FR-10:** Clean up duplicate configurations into canonical single sources of truth (`src/config/routes.config.ts`, `src/config/api.config.ts`, `src/config/nav.config.ts`).
- **FR-11:** Implement server-side middleware route validation backed by backend Bearer token verification.
- **FR-12:** Handle OAuth callback tokens from `/auth/github` and `/auth/google` with automatic Zustand store hydration.

---

## 6. Non-Functional Requirements

- **Performance:** Lighthouse Performance score ≥ 90; First Contentful Paint (FCP) < 1.2s; Zero Layout Shift (CLS < 0.1).
- **Accessibility:** WCAG 2.1 AA compliance; full keyboard navigation for dialogs, dropdowns, sheets, and command palette.
- **Responsiveness:** Fluid scaling across Mobile (<640px), Tablet (640px–1024px), Desktop (1024px–1440px), and Large Displays (>1440px).
- **Type Safety:** 100% strict TypeScript typing without `any` overrides, matching backend DTO schemas.
