<!-- ============================================= -->
<!-- AI DIGITAL TWIN PLATFORM - AGENT RULES -->
<!-- ============================================= -->

# AI Digital Twin Platform - AI Agent Rules

## Project Context

You are working on an enterprise-grade AI SaaS platform called **AI Digital Twin Platform**.

This is NOT a demo project.

This is NOT a college project.

This repository follows production-grade engineering practices.

Every change must improve the architecture rather than simply making the code "work".

---

# Before Writing Any Code

Always:

1. Read the existing code.
2. Understand the architecture.
3. Search for existing implementations.
4. Reuse existing services.
5. Follow the existing folder structure.
6. Follow the project's coding standards.

Never generate code blindly.

---

# Project Goal

This platform will become an AI-powered Digital Twin capable of:

- Personal Knowledge Management
- AI Memory
- Document Intelligence
- Semantic Search
- RAG
- GitHub Integration
- Google Integration
- VS Code Integration
- AI Chat
- Knowledge Timeline
- Enterprise Authentication
- Multi-Tenant Architecture

Always keep this goal in mind.

---

# Tech Stack

Frontend

- Next.js (Latest)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- Zod

Backend

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- pgvector
- Redis
- BullMQ
- Socket.IO
- JWT
- Passport

AI

- Ollama
- OpenAI
- Gemini

---

# Next.js Rules

This project uses the **latest stable version of Next.js**.

Before modifying any Next.js feature:

- Read the official Next.js documentation.
- Read any framework migration notes if APIs have changed.
- Prefer the newest supported APIs.
- Avoid deprecated APIs.
- Follow App Router conventions.
- Prefer Server Components unless Client Components are required.
- Do not introduce Pages Router unless explicitly requested.

---

# NestJS Rules

Always follow:

- Feature-first architecture
- Dependency Injection
- DTO Pattern
- Repository Pattern
- Service Layer
- SOLID Principles

---

# TypeScript Rules

Never use:

- any
- @ts-ignore
- eslint-disable

unless explicitly instructed.

Always prefer strict typing.

---

# Code Quality

Every implementation must be:

- Readable
- Reusable
- Testable
- Scalable
- Modular

Never duplicate code.

---

# Before Adding Dependencies

Always explain:

- Why it is needed
- Alternatives
- Bundle impact
- Security considerations

Only add dependencies when necessary.

---

# Before Modifying Existing Code

Explain:

- Why changes are needed
- Files affected
- Possible risks
- Whether breaking changes exist

---

# Documentation

Whenever implementing a feature:

Update relevant documentation.

Do not leave documentation outdated.

---

# Testing

Every new feature should include:

- Unit Tests
- Integration Tests (when applicable)

Never leave important business logic untested.

---

# Performance

Always consider:

- Database queries
- React rendering
- Bundle size
- Network requests
- Memory usage
- Caching

Never introduce unnecessary re-renders.

---

# Security

Always validate:

- Inputs
- Authentication
- Authorization
- File uploads
- Environment variables

Never expose secrets.

---

# Git

Always generate Conventional Commit messages.

Example:

feat(auth): implement GitHub OAuth

fix(ai): resolve embedding generation issue

refactor(search): optimize semantic search

---

# Before Finishing Any Task

Verify:

- Project builds successfully.
- ESLint passes.
- Prettier formatting passes.
- TypeScript has no errors.
- Tests pass (if applicable).

Do not consider a task complete if any of these checks fail.

---

# Response Format

For every implementation, always provide:

## Summary

## Files Modified

## Files Created

## Dependencies Added

## Database Changes

## API Changes

## Security Impact

## Performance Impact

## Breaking Changes

## Testing Performed

## Suggested Next Step

---

# Most Important Rule

Do NOT optimize for writing code quickly.

Optimize for writing production-quality code that could realistically be merged into a large enterprise codebase.

If multiple solutions exist, choose the one that is:

- More maintainable
- More scalable
- More secure
- More readable
- Easier to test

Quality is always more important than speed.
