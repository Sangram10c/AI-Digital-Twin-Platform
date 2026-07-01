# Folder Structure

## Repository Root

```
ai-digital-twin-platform/
├── frontend/                  # Next.js frontend application
├── backend/                   # NestJS backend application
├── vscode-extension/          # VS Code extension
├── docs/                      # Project documentation
├── docker/                    # Docker configurations
├── scripts/                   # Utility scripts
├── .github/                   # GitHub configuration
├── .vscode/                   # VS Code workspace settings
├── docker-compose.yml         # Development infrastructure
├── package.json               # Root package with monorepo scripts
├── .env.example               # Environment variables template
├── .editorconfig              # Editor configuration
├── .prettierrc                # Prettier configuration
├── .commitlintrc.json         # Commit lint configuration
└── .lintstagedrc.json         # Lint-staged configuration
```

## Frontend Structure

```
frontend/src/
├── app/                       # Next.js App Router pages
│   ├── (auth)/                # Authentication route group
│   ├── (dashboard)/           # Dashboard route group
│   └── api/                   # API routes
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/                # Layout components (Header, Sidebar, Footer)
│   ├── shared/                # Reusable components
│   └── providers/             # Context providers
├── features/                  # Feature-first modules
│   ├── auth/
│   ├── dashboard/
│   ├── workspaces/
│   ├── documents/
│   ├── ai/
│   ├── knowledge/
│   ├── analytics/
│   ├── settings/
│   └── admin/
├── hooks/                     # Custom React hooks
├── services/                  # API service layer
├── store/                     # Zustand state stores
├── lib/                       # Utilities (cn, validators)
├── config/                    # App configuration
├── types/                     # TypeScript type definitions
├── utils/                     # Utility functions
├── constants/                 # Application constants
├── assets/                    # Static assets
└── styles/                    # Global styles
```

## Backend Structure

```
backend/src/
├── modules/                   # Feature modules
│   ├── auth/                  # Authentication & authorization
│   ├── users/                 # User management
│   ├── organizations/         # Organization management
│   ├── workspaces/            # Workspace management
│   ├── documents/             # Document management
│   ├── ai/                    # AI service orchestration
│   ├── embeddings/            # Vector embeddings
│   ├── search/                # Search functionality
│   ├── knowledge/             # Knowledge base
│   ├── notifications/         # Notification system
│   └── health/                # Health checks
├── common/                    # Shared utilities
│   ├── guards/                # Auth guards
│   ├── decorators/            # Custom decorators
│   ├── pipes/                 # Validation pipes
│   ├── filters/               # Exception filters
│   ├── middleware/             # HTTP middleware
│   ├── interceptors/          # Response interceptors
│   └── dto/                   # Shared DTOs
├── config/                    # Configuration files
├── database/                  # Prisma module & service
├── jobs/                      # BullMQ job processing
├── storage/                   # File storage service
└── gateway/                   # WebSocket gateway
```
