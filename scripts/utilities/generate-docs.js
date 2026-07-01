/**
 * Generate documentation files for the AI Digital Twin Platform.
 */
const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

const docs = {
  '04-folder-structure.md': `# Folder Structure

## Repository Root

\`\`\`
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
\`\`\`

## Frontend Structure

\`\`\`
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
\`\`\`

## Backend Structure

\`\`\`
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
\`\`\`
`,

  '05-database-design.md': `# Database Design

## Overview

The platform uses PostgreSQL with the pgvector extension for vector similarity search.

## Entity Relationship Diagram

\`\`\`mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ WorkspaceMember : belongs_to
    User ||--o{ Workspace : owns
    User ||--o{ Document : authors
    User ||--o{ Notification : receives

    Organization ||--o{ Workspace : contains

    Workspace ||--o{ WorkspaceMember : has
    Workspace ||--o{ Document : contains

    Document ||--o{ Embedding : has

    User {
        string id PK
        string email UK
        string name
        string passwordHash
        string avatar
        enum role
        boolean emailVerified
        datetime createdAt
        datetime updatedAt
    }

    Account {
        string id PK
        string userId FK
        string provider
        string providerAccountId
        string accessToken
        string refreshToken
    }

    Organization {
        string id PK
        string name
        string slug UK
        enum plan
    }

    Workspace {
        string id PK
        string name
        string slug UK
        string ownerId FK
        string organizationId FK
    }

    Document {
        string id PK
        string title
        string content
        enum type
        string workspaceId FK
        string authorId FK
    }

    Embedding {
        string id PK
        string documentId FK
        string content
        vector vector
        json metadata
    }
\`\`\`

## pgvector Usage

Vector embeddings are stored using the \`vector\` type with 1536 dimensions (OpenAI default).

### Creating HNSW Index

\`\`\`sql
CREATE INDEX ON embeddings USING hnsw (vector vector_cosine_ops);
\`\`\`

### Similarity Search

\`\`\`sql
SELECT content, 1 - (vector <=> $1) AS similarity
FROM embeddings
ORDER BY vector <=> $1
LIMIT 10;
\`\`\`
`,

  '06-api-design.md': `# API Design

## Conventions

- **Base URL**: \`/api/v1\`
- **Format**: JSON
- **Authentication**: Bearer JWT token
- **Versioning**: URI-based (\`/api/v1\`, \`/api/v2\`)

## Response Format

### Success Response
\`\`\`json
{
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

### Error Response
\`\`\`json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

### Paginated Response
\`\`\`json
{
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
\`\`\`

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | User login |
| POST | /auth/register | User registration |
| GET | /auth/profile | Get current user |
| GET | /users | List users |
| GET | /workspaces | List workspaces |
| POST | /documents | Create document |
| POST | /ai/chat | AI chat completion |
| GET | /health | Health check |

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
`,

  '07-authentication.md': `# Authentication

## Overview

The platform uses JWT-based authentication with OAuth 2.0 social login support.

## Authentication Flow

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant OAuth

    Client->>API: POST /auth/login
    API->>DB: Validate credentials
    DB-->>API: User data
    API-->>Client: { accessToken, refreshToken }

    Client->>API: GET /api/resource (Bearer token)
    API->>API: Validate JWT
    API-->>Client: Resource data

    Client->>API: POST /auth/refresh
    API->>DB: Validate refresh token
    API-->>Client: { newAccessToken }
\`\`\`

## Supported Providers

- **Email/Password**: Traditional authentication
- **Google OAuth**: Sign in with Google
- **GitHub OAuth**: Sign in with GitHub

## JWT Structure

### Access Token (15 min expiry)
\`\`\`json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234568790
}
\`\`\`

## RBAC (Role-Based Access Control)

| Role | Permissions |
|------|------------|
| ADMIN | Full access |
| USER | CRUD own resources |
| VIEWER | Read-only access |
`,

  '08-ai-architecture.md': `# AI Architecture

## Provider-Based Design

The AI module uses a provider pattern allowing seamless switching between AI providers.

\`\`\`mermaid
graph LR
    AI["AI Service"] --> IF["AI Provider Interface"]
    IF --> OAI["OpenAI Provider"]
    IF --> ANT["Anthropic Provider"]
    IF --> GEM["Gemini Provider"]
    IF --> OLL["Ollama Provider"]
\`\`\`

## Provider Interface

\`\`\`typescript
interface AIProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  embed(text: string): Promise<number[]>;
}
\`\`\`

## Supported Providers

| Provider | Models | Use Case |
|----------|--------|----------|
| OpenAI | GPT-4o, GPT-4o-mini | General purpose |
| Anthropic | Claude Sonnet, Opus | Complex reasoning |
| Google Gemini | Gemini 2.0 Flash | Fast responses |
| Ollama | Llama 3, Mistral | Local/private |

## Configuration

Provider selection is configuration-driven via environment variables:
\`\`\`
AI_DEFAULT_PROVIDER=openai
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
\`\`\`
`,

  '09-rag-pipeline.md': `# RAG Pipeline

## Overview

Retrieval-Augmented Generation (RAG) enhances AI responses with relevant context from the knowledge base.

## Pipeline Flow

\`\`\`mermaid
graph TB
    Q["User Query"] --> EMB["Generate Embedding"]
    EMB --> SEARCH["Vector Similarity Search"]
    SEARCH --> RANK["Re-ranking"]
    RANK --> CTX["Build Context"]
    CTX --> LLM["LLM Generation"]
    LLM --> RES["Response"]

    subgraph Ingestion
        DOC["Document Upload"] --> CHUNK["Chunking"]
        CHUNK --> EMBED["Embedding"]
        EMBED --> STORE["Store in pgvector"]
    end
\`\`\`

## Ingestion Pipeline

1. **Document Upload**: Accept documents (PDF, Markdown, Code)
2. **Chunking**: Split into semantic chunks (512-1024 tokens)
3. **Embedding**: Generate vector embeddings
4. **Storage**: Store in PostgreSQL with pgvector

## Retrieval Pipeline

1. **Query Embedding**: Convert user query to vector
2. **Similarity Search**: Find top-K similar chunks
3. **Re-ranking**: Score and filter results
4. **Context Building**: Assemble context window
5. **Generation**: Send to LLM with context
`,

  '10-vector-database.md': `# Vector Database

## pgvector

The platform uses PostgreSQL's pgvector extension for vector similarity search.

## Setup

\`\`\`sql
CREATE EXTENSION IF NOT EXISTS vector;
\`\`\`

## Schema

\`\`\`sql
CREATE TABLE embeddings (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id),
  content TEXT NOT NULL,
  vector vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

## Indexing Strategies

### HNSW (Recommended)
\`\`\`sql
CREATE INDEX ON embeddings
USING hnsw (vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
\`\`\`

### IVFFlat (Alternative)
\`\`\`sql
CREATE INDEX ON embeddings
USING ivfflat (vector vector_cosine_ops)
WITH (lists = 100);
\`\`\`

## Distance Functions

| Function | Operator | Use Case |
|----------|----------|----------|
| Cosine | \`<=>\` | Text similarity (recommended) |
| L2 | \`<->\` | Image similarity |
| Inner Product | \`<#>\` | Dot product similarity |
`,

  '11-integrations.md': `# Integrations

## GitHub Integration

- Repository access
- Code file indexing
- Webhook events (push, PR, issues)
- OAuth authentication

## Google Integration

- Google Drive document sync
- Google OAuth authentication
- Calendar integration (future)

## Webhook Architecture

\`\`\`mermaid
graph LR
    EXT["External Service"] -->|Webhook| API["Webhook Endpoint"]
    API --> VALIDATE["Signature Validation"]
    VALIDATE --> QUEUE["Job Queue"]
    QUEUE --> PROCESS["Event Processor"]
\`\`\`

## Adding New Integrations

1. Create a new module in \`backend/src/modules/\`
2. Implement the integration service
3. Register webhook endpoints
4. Add OAuth flow if needed
5. Document in this file
`,

  '12-security.md': `# Security

## OWASP Top 10 Mitigations

| Threat | Mitigation |
|--------|-----------|
| Injection | Parameterized queries via Prisma ORM |
| Broken Auth | JWT + refresh tokens, rate limiting |
| Sensitive Data Exposure | HTTPS, encrypted secrets, env variables |
| XXE | JSON-only API, no XML parsing |
| Broken Access Control | RBAC guards, resource ownership checks |
| Security Misconfiguration | Helmet headers, CORS policy |
| XSS | React auto-escaping, CSP headers |
| Insecure Deserialization | class-validator, whitelist DTOs |
| Known Vulnerabilities | Dependabot, npm audit |
| Insufficient Logging | Pino structured logging |

## Security Headers

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: (configured per environment)

## Rate Limiting

- Global: 100 requests per 60 seconds
- Auth endpoints: 5 requests per 60 seconds
- AI endpoints: 20 requests per 60 seconds

## Data Encryption

- Passwords: bcrypt (12 rounds)
- Tokens: JWT with RS256
- Secrets: Environment variables (never committed)
`,

  '13-coding-standards.md': `# Coding Standards

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | \`user-service.ts\` |
| Classes | PascalCase | \`UserService\` |
| Interfaces | PascalCase (no I prefix) | \`UserResponse\` |
| Functions | camelCase | \`getUserById\` |
| Constants | UPPER_SNAKE_CASE | \`MAX_PAGE_SIZE\` |
| Enums | PascalCase | \`UserRole\` |
| DTOs | PascalCase + Dto | \`CreateUserDto\` |
| Components | PascalCase | \`UserProfile\` |
| Hooks | camelCase (use prefix) | \`useAuth\` |
| Stores | camelCase (use suffix) | \`useAuthStore\` |

## Architecture Patterns

- **Clean Architecture**: Separate concerns into layers
- **SOLID Principles**: Single responsibility, open-closed, etc.
- **Feature-First**: Group by feature, not by type
- **Repository Pattern**: Abstract data access
- **Service Layer**: Business logic in services
- **DTO Pattern**: Validate and transform input/output

## TypeScript Rules

- **Strict mode**: Always enabled
- **No \`any\`**: Use \`unknown\` or proper types
- **No unused imports**: ESLint enforced
- **Explicit return types**: On public methods
- **Readonly**: Use where appropriate

## Git Conventions

- **Commits**: Conventional Commits format
- **Branches**: \`feature/\`, \`bugfix/\`, \`hotfix/\`, \`chore/\`
- **PRs**: Use the PR template, require reviews
`,

  '14-development-roadmap.md': `# Development Roadmap

## Phase 1: Foundation (Current)
- [x] Project architecture
- [x] Monorepo setup
- [x] Docker infrastructure
- [x] CI/CD pipelines
- [x] Documentation

## Phase 2: Core Backend
- [ ] Database schema & migrations
- [ ] Authentication (JWT + OAuth)
- [ ] User management
- [ ] Organization & workspace CRUD
- [ ] Health check endpoints

## Phase 3: Frontend Foundation
- [ ] Design system (shadcn/ui)
- [ ] Authentication UI
- [ ] Dashboard layout
- [ ] Navigation & routing

## Phase 4: Document Management
- [ ] Document upload & storage
- [ ] Document CRUD
- [ ] File type support (PDF, Markdown, Code)

## Phase 5: AI Integration
- [ ] AI provider abstraction
- [ ] Chat interface
- [ ] Document embedding pipeline
- [ ] RAG implementation
- [ ] Vector search

## Phase 6: Real-time Features
- [ ] WebSocket integration
- [ ] Live notifications
- [ ] Collaborative features

## Phase 7: Advanced Features
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] VS Code extension
- [ ] Knowledge graph

## Phase 8: Production Readiness
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Monitoring & alerting
- [ ] Load testing
`,

  '15-deployment.md': `# Deployment

## Docker Deployment

### Build Images
\`\`\`bash
docker-compose -f docker/docker-compose.yml build
\`\`\`

### Start Services
\`\`\`bash
docker-compose -f docker/docker-compose.yml up -d
\`\`\`

## CI/CD Pipeline

\`\`\`mermaid
graph LR
    PUSH["Git Push"] --> LINT["Lint"]
    LINT --> TYPE["Type Check"]
    TYPE --> TEST["Test"]
    TEST --> BUILD["Build"]
    BUILD --> DOCKER["Docker Build"]
    DOCKER --> DEPLOY["Deploy"]
\`\`\`

## Environment Strategy

| Environment | Purpose | Database |
|------------|---------|----------|
| Development | Local development | Local PostgreSQL |
| Staging | Pre-production testing | Staging database |
| Production | Live application | Production database |

## Infrastructure Requirements

- **CPU**: 2+ cores per service
- **Memory**: 4GB+ per service
- **Storage**: 100GB+ for database
- **Network**: HTTPS with valid SSL certificate
`,

  '16-testing-strategy.md': `# Testing Strategy

## Testing Pyramid

\`\`\`
        /  E2E  \\
       / Integration \\
      /    Unit Tests   \\
\`\`\`

## Unit Tests (Jest)

- **Target**: 80%+ code coverage
- **Location**: Co-located with source files
- **Naming**: \`*.spec.ts\`

## Integration Tests (Supertest)

- **Target**: All API endpoints
- **Location**: \`backend/test/\`
- **Naming**: \`*.e2e-spec.ts\`

## E2E Tests (Playwright)

- **Target**: Critical user flows
- **Location**: \`frontend/tests/e2e/\`
- **Browsers**: Chromium, Firefox, WebKit

## Running Tests

\`\`\`bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test -- --coverage
\`\`\`
`,

  '17-environment-variables.md': `# Environment Variables

## Complete Reference

See \`.env.example\` at the root of the repository for all variables.

### Application
| Variable | Default | Description |
|----------|---------|-------------|
| NODE_ENV | development | Environment |
| BACKEND_PORT | 4000 | API port |
| API_PREFIX | api | API prefix |

### Database
| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |

### Redis
| Variable | Default | Description |
|----------|---------|-------------|
| REDIS_URL | redis://localhost:6379/0 | Redis connection |

### JWT
| Variable | Required | Description |
|----------|----------|-------------|
| JWT_SECRET | Yes | JWT signing secret |
| JWT_ACCESS_EXPIRATION | 15m | Access token TTL |
| JWT_REFRESH_EXPIRATION | 7d | Refresh token TTL |

### AI Providers
| Variable | Required | Description |
|----------|----------|-------------|
| AI_DEFAULT_PROVIDER | No | Default AI provider |
| OPENAI_API_KEY | No | OpenAI API key |
| ANTHROPIC_API_KEY | No | Anthropic API key |
| GOOGLE_AI_API_KEY | No | Gemini API key |
| OLLAMA_BASE_URL | No | Ollama server URL |
`,

  '18-feature-roadmap.md': `# Feature Roadmap

## Priority Matrix

### P0 - Must Have
- [ ] User authentication (email, Google, GitHub)
- [ ] Workspace management
- [ ] Document upload & processing
- [ ] AI chat interface
- [ ] RAG pipeline
- [ ] Real-time notifications

### P1 - Should Have
- [ ] Analytics dashboard
- [ ] Knowledge graph visualization
- [ ] Admin panel
- [ ] Team collaboration
- [ ] VS Code extension

### P2 - Nice to Have
- [ ] Custom AI fine-tuning
- [ ] API marketplace
- [ ] Mobile application
- [ ] Slack/Discord integration
- [ ] Calendar integration

### P3 - Future
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Plugin system
- [ ] White-label support
`,

  '19-contributing.md': `# Contributing

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Development Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/your-org/ai-digital-twin.git
cd ai-digital-twin

# Run setup script
bash scripts/setup.sh

# Start infrastructure
docker-compose up -d

# Start development servers
npm run dev
\`\`\`

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

\`\`\`
feat: add user authentication
fix: resolve login redirect issue
docs: update API documentation
chore: upgrade dependencies
\`\`\`

## Pull Request Process

1. Update documentation for any changed functionality
2. Add tests for new features
3. Ensure CI passes
4. Get at least one code review approval
5. Squash and merge

## Code Review Guidelines

- Be constructive and kind
- Focus on logic, not style (automated by Prettier)
- Check for security implications
- Verify test coverage
`,

  '20-license.md': `# License

MIT License

Copyright (c) 2024 AI Digital Twin Platform

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
};

console.log('📝 Generating documentation...\n');

for (const [fileName, content] of Object.entries(docs)) {
  const filePath = path.join(DOCS_DIR, fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log(`  ✅ ${fileName}`);
}

console.log(`\n✅ Generated ${Object.keys(docs).length} documentation files`);
