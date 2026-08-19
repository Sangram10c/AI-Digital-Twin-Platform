# Roadmap

## AI Digital Twin Platform — Development Roadmap

### Phase 1: Foundation ✅

- [x] Project scaffolding and monorepo setup
- [x] Backend API skeleton (NestJS)
- [x] Frontend application skeleton (Next.js)
- [x] Database schema design (Prisma + PostgreSQL)
- [x] Authentication module (JWT + Passport)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Docker containerization
- [x] Enterprise monorepo restructuring

### Phase 2: Core Features ✅

- [x] User management and RBAC (identity module)
- [x] Workspace management
- [x] GitHub OAuth + webhooks + repository sync
- [x] Knowledge processing (normalize → chunk → queue)
- [x] Repository sync / documentation crawl
- [x] Background Job Architecture (BullMQ — queues, workers, processors)

### Phase 3: Intelligence ✅

- [x] Embedding generation pipeline (pgvector, multi-provider, BullMQ queue)
- [x] Vector database integration (pgvector + HNSW index)
- [x] Hybrid / semantic search (pgvector + PostgreSQL FTS + RRF ranking)
- [x] Source-code ingestion for code-aware RAG citations
- [x] Heuristic extraction (deterministic metadata without LLM)
- [x] AI knowledge extraction (digest pipeline with provider fallback chain)
- [x] Hybrid AI pipeline (heuristics + LLM digest + embedding in sequence)
- [x] AI Chat — 10-step RAG pipeline (retrieve → prompt → generate → cite)
- [x] SSE streaming chat
- [x] Conversation management (history, pin, archive)
- [x] AI memory system (selective long-term memory with importance scoring)
- [x] Knowledge timeline
- [x] Notifications
- [x] Analytics & Insights (8 metric domains, BullMQ aggregation, Redis caching)

### Phase 4: Frontend Dashboard ➡️ (current)

- [ ] Analytics dashboard UI
- [ ] Chat interface with SSE streaming
- [ ] Repository overview and search UI
- [ ] Workspace management UI
- [ ] Authentication flows (sign in, OAuth, profile)
- [ ] Real-time notifications UI

### Phase 5: Production Deployment ⬜

- [ ] Multi-tenant architecture hardening
- [ ] Admin panel
- [ ] Audit logging UI
- [ ] Rate limiting (expand and surface)
- [ ] Kubernetes deployment configuration
- [ ] Production monitoring and alerting
- [ ] Multi-region / HA setup
- [ ] Google Workspace integration
- [ ] VS Code extension deepening

---

Live tracker: [`CURRENT_STATUS.md`](./CURRENT_STATUS.md) · Product docs: [`docs/`](./docs/README.md)
