# Contributing to AI Digital Twin Platform

Thank you for your interest in contributing to the AI Digital Twin Platform.

## Development Setup

### Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0
- PostgreSQL 17 with pgvector
- Redis 7+
- Docker (optional, for infrastructure services)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/Sangram10c/AI-Digital-Twin-Platform.git
cd AI-Digital-Twin-Platform

# Install all dependencies (workspaces)
npm install

# Copy environment files
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env

# Start infrastructure services
docker-compose up -d

# Generate Prisma client
npm run db:generate

# Start development servers
npm run dev
```

## Code Standards

- Follow TypeScript strict mode
- Use Conventional Commits for all commit messages
- Ensure all linting passes before committing
- Write tests for new business logic
- Keep documentation up to date

## Commit Convention

```
feat(scope): description     # New feature
fix(scope): description      # Bug fix
refactor(scope): description # Code refactoring
docs(scope): description     # Documentation
test(scope): description     # Tests
chore(scope): description    # Maintenance
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the code standards
3. Ensure all quality gates pass (`npm run lint`, `npm run typecheck`, `npm run test`)
4. Submit a pull request with a clear description
5. Address review feedback

## Project Structure

```
apps/           # Deployable applications
packages/       # Shared libraries
infra/          # Deployment configurations
docs/           # Documentation
scripts/        # Development and CI/CD scripts
```

## Questions?

Open a GitHub issue for discussion.
