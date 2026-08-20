# Implementation Plan: Frontend Phase 01 — Foundation & Design System

**Feature ID:** `frontend-phase-01-foundation-design-system`  
**Target:** `apps/frontend/`

---

## 1. Technical Architecture & File Layout

### 1.1 Complete Folder Layout

```text
apps/frontend/src/
├── app/
│   ├── (public)/                           # 1. Public Marketing Website
│   │   ├── layout.tsx                      # Public header & footer
│   │   ├── page.tsx                        # High-conversion Landing page
│   │   ├── features/page.tsx               # Feature highlights & architecture
│   │   └── pricing/page.tsx                # Pricing & tiers
│   │
│   ├── (auth)/                             # 2. Dedicated Auth Route Group (Isolated)
│   │   ├── layout.tsx                      # Focused centered auth card layout
│   │   ├── login/page.tsx                  # Sign In form
│   │   ├── register/page.tsx               # Sign Up form
│   │   └── callback/page.tsx               # OAuth redirect handler (GitHub / Google)
│   │
│   ├── (app)/                              # 3. Authenticated Workspace App
│   │   ├── layout.tsx                      # App Shell (Sidebar, Header, Auth Guard)
│   │   ├── workspaces/page.tsx             # Workspace picker / creation
│   │   └── [workspaceSlug]/                # Workspace-scoped routes
│   │       ├── dashboard/page.tsx          # Workspace dashboard overview
│   │       ├── chat/page.tsx               # AI Chat & RAG interface
│   │       ├── search/page.tsx             # Hybrid search explorer
│   │       ├── repositories/page.tsx       # Repositories & Sync status
│   │       ├── analytics/page.tsx          # 8-domain analytics visualizations
│   │       ├── knowledge/page.tsx          # Knowledge chunks & Docs
│   │       ├── timeline/page.tsx           # History timeline
│   │       └── settings/page.tsx           # Workspace settings (WorkspaceRole.OWNER/ADMIN)
│   │
│   ├── (admin)/                            # 4. Elevated Admin Experience (UserRole.ADMIN)
│   │   ├── layout.tsx                      # Admin navigation shell
│   │   └── admin/page.tsx                  # Platform overview, BullMQ queues, provider usage
│   │
│   ├── layout.tsx                          # Root Layout with Global AppProviders
│   ├── globals.css                         # Tailwind CSS v4 Design Tokens & CSS Variables
│   └── middleware.ts                       # Server-side route validation & cookie check
│
├── components/
│   ├── ui/                                 # UI Primitives & Elements
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx                       # Side drawer / mobile sidebar
│   │   ├── dropdown-menu.tsx
│   │   ├── tabs.tsx
│   │   ├── tooltip.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx
│   │   └── index.ts
│   │
│   ├── layout/                             # Shell layouts & Navigation components
│   │   ├── app-header.tsx
│   │   ├── app-sidebar.tsx
│   │   ├── public-header.tsx
│   │   ├── public-footer.tsx
│   │   ├── workspace-switcher.tsx
│   │   ├── user-nav.tsx
│   │   ├── breadcrumbs.tsx
│   │   └── index.ts
│   │
│   ├── providers/                          # Application Providers
│   │   ├── app-providers.tsx               # Consolidated provider wrapper
│   │   ├── query-provider.tsx              # TanStack Query (reused)
│   │   ├── theme-provider.tsx              # Dark/Light mode theme
│   │   └── auth-provider.tsx               # Session hydration & client guard
│   │
│   └── shared/                             # Developer & Engineering Components
│       ├── command-palette.tsx             # Global Ctrl+K command bar
│       ├── code-block.tsx                  # Syntax-highlighted code container
│       ├── markdown-renderer.tsx           # RAG answer renderer with math/code/tables
│       ├── citation-badge.tsx              # Traceable chunk/commit/PR citation pill
│       ├── empty-state.tsx                 # Clean zero-data feedback block
│       ├── error-state.tsx                 # Error recovery block (with retry button)
│       ├── error-boundary.tsx              # Class-based error boundary (reused)
│       ├── loading-spinner.tsx             # Spinner animation (reused)
│       └── index.ts
│
├── config/                                 # Canonical Configuration (Unified)
│   ├── routes.config.ts                    # All application route constants
│   ├── api.config.ts                       # Unified API endpoints matching NestJS backend
│   ├── nav.config.ts                       # Navigation schemas for Public, App, and Admin
│   └── site.config.ts                      # Metadata & branding
│
├── hooks/                                  # Reused and extended hooks
│   ├── use-auth.ts                         # Auth state & actions
│   ├── use-workspace.ts                    # Active workspace actions
│   ├── use-theme.ts                        # Dark/Light toggle
│   ├── use-media-query.ts                  # Responsive breakpoints (reused)
│   ├── use-debounce.ts                     # Debounced search/inputs (reused)
│   └── use-socket.ts                       # Real-time WebSocket connection (reused)
│
├── store/                                  # Reused Zustand stores
│   ├── auth.store.ts
│   ├── workspace.store.ts
│   ├── ui.store.ts
│   └── index.ts
│
├── services/                               # HTTP API & Real-time
│   ├── api.service.ts                      # Reused Axios instance with Bearer interceptor
│   ├── socket.service.ts                   # Reused Socket.IO client
│   └── api/                                # Domain API methods (Auth, Workspaces, Repos, Chat, etc.)
│
├── types/                                  # TypeScript interfaces (mirrored from backend DTOs & Enums)
│   ├── auth.types.ts
│   ├── user.types.ts
│   ├── workspace.types.ts
│   ├── nav.types.ts
│   └── api.types.ts
│
└── utils/                                  # Reused utilities
    ├── cn.ts                               # Classname merger (clsx + twMerge)
    ├── format.ts                           # Number, date, byte formatters
    └── storage.ts                          # Safe localStorage wrapper
```

---

## 2. Design System Architecture

### 2.1 Color Palette & Theme Tokens

HSL-tailored dark/light design token scheme in `globals.css` matching modern developer tools (Vercel/Linear/GitHub aesthetic):

- **Dark Theme (Default):**
  - Canvas: `hsl(224, 71%, 4%)` (Deep slate night)
  - High-Contrast Text: `hsl(210, 40%, 98%)`
  - Surface / Card: `hsl(222, 47%, 8%)`
  - Border / Line: `hsl(217, 33%, 17%)`
  - Primary Action: `hsl(217, 91%, 60%)` (Electric Sapphire)
  - AI Accent: `hsl(263, 70%, 66%)` (Deep Indigo / Violet)
  - Success: `hsl(142, 71%, 45%)` (Emerald Green)
  - Warning: `hsl(38, 92%, 50%)` (Amber)
  - Destructive: `hsl(0, 84%, 60%)` (Crimson Rose)
  - Charts: 8 distinct gradients for analytics data

### 2.2 Aesthetics & Motion Guidelines

- Subtle 1px borders with crisp hover highlights (`hover:border-primary/50 transition-colors`).
- Subdued glassmorphism on headers (`bg-background/80 backdrop-blur-md`).
- Fast, purposeful animations (150ms–200ms ease-out transitions); no heavy floating elements.

---

## 3. Server & Client Route Protection Strategy

1. **Server-Side Validation (`src/middleware.ts`):**
   - Inspects `access_token` in cookies/headers for `/(app)/*` and `/(admin)/*`.
   - Forwards unauthenticated requests to `/login?redirect=...`.
2. **Backend Security Boundary:**
   - All data requests are authorized via Bearer JWT tokens evaluated by NestJS `JwtAuthGuard`, `RolesGuard`, and `WorkspaceGuard`.
3. **Client-Side UX Redirection (`AuthProvider`):**
   - If token is expired or revoked (HTTP 401), clears local storage and routes to `/login`.
   - Evaluates `user.role === 'ADMIN'` for `/(admin)` pages. If not admin, displays 403 Forbidden state.
   - Evaluates `workspace.role === 'OWNER' || 'ADMIN'` for `/[workspaceSlug]/settings`.

---

## 4. Architecture Cleanup Plan (Step 1)

Before building UI components:

- Consolidate `constants/routes.ts` into `config/routes.config.ts`.
- Consolidate `constants/api-endpoints.ts` and `config/api.config.ts` into a single canonical API endpoint map matching backend NestJS controllers.
- Clean up unused placeholders in `src/features/` while maintaining exports.
