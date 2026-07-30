# Roadmap

## AI Digital Twin Platform - Development Roadmap

### Phase 1: Foundation

- [x] Project scaffolding and monorepo setup
- [x] Backend API skeleton (NestJS)
- [x] Frontend application skeleton (Next.js)
- [x] Database schema design (Prisma + PostgreSQL)
- [x] Authentication module (JWT + Passport)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Docker containerization
- [x] Enterprise monorepo restructuring

### Phase 2: Core Features _(current)_

- [x] User management and RBAC (identity module)
- [x] Workspace management
- [x] Knowledge processing (normalize → chunk → queue)
- [x] Repository sync / documentation crawl
- [ ] AI Chat interface (answer generation — next after retrieval)
- [ ] Real-time notifications (Socket.IO) — partial / expand
- [x] Search Engine Design (doc 13) — hybrid vector + keyword shipped
- [ ] Background Job Architecture (doc 14) — documentation & gaps _(in progress)_
- [ ] Security Architecture (doc 15)

### Phase 3: Intelligence

- [x] Embedding generation pipeline
- [x] Vector database integration (pgvector)
- [x] Hybrid / semantic search (pgvector + PostgreSQL FTS + ranking)
- [x] Source-code ingestion for code-aware RAG citations
- [ ] Full RAG answer generation (chat over retrieved chunks)
- [ ] AI memory system
- [ ] Knowledge timeline

### Phase 4: Integrations

- [x] GitHub OAuth + webhooks + sync
- [ ] Google Workspace integration
- [ ] VS Code extension (scaffold exists)
- [x] Webhook system (GitHub)

### Phase 5: Enterprise

- [ ] Multi-tenant architecture hardening
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] Audit logging
- [ ] Rate limiting (expand)
- [ ] Production deployment (Kubernetes)

---

Live tracker: [`CURRENT_STATUS.md`](./CURRENT_STATUS.md) · Product docs: [`docs/`](./docs/README.md)
