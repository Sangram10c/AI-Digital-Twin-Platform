# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Enterprise monorepo restructuring with npm workspaces
- `apps/` directory for deployable applications (frontend, backend, vscode-extension)
- `packages/` directory for shared libraries (shared, ui, config, types, utils)
- `infra/` directory for deployment configurations (docker, nginx, kubernetes)
- Organized documentation into categorized subdirectories
- Root-level project governance documents (ROADMAP, CONTRIBUTING, SECURITY, LICENSE)

### Changed

- Migrated `frontend/` to `apps/frontend/`
- Migrated `backend/` to `apps/backend/`
- Migrated `vscode-extension/` to `apps/vscode-extension/`
- Migrated `docker/` to `infra/docker/`
- Reorganized `scripts/` into setup, database, deployment, and utilities
- Reorganized `docs/` into architecture, backend, frontend, database, ai, deployment, api, decisions, and diagrams
- Updated all CI/CD workflows, Dockerfiles, and tooling configurations for new paths

## [0.1.0] - 2026-06-30

### Added

- Initial project scaffolding
- NestJS backend with module-based architecture
- Next.js frontend with App Router
- Prisma database schema with PostgreSQL + pgvector
- JWT authentication with Passport
- GitHub Actions CI/CD pipelines
- Docker development environment
- Husky git hooks with pre-push quality gates
- VS Code extension skeleton
