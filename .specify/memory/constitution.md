constitution
AI Digital Twin Platform — Spec Kit Configuration

AI Digital Twin Platform Constitution

Status

This constitution defines the non-negotiable engineering principles for the
AI Digital Twin Platform.

All feature specifications, plans, tasks, and implementations must respect
these principles.

Principle I — Existing Architecture First

The platform is an existing enterprise-oriented system.

New work MUST reuse existing architecture before introducing new components.

Before creating a new module, service, provider, repository, database model,
or utility, the existing implementation MUST be inspected.

Duplicate functionality MUST NOT be introduced.

Principle II — Clear Domain Boundaries

The system must maintain clear boundaries between:

Identity
Workspace
Git Integration
Repository
Knowledge
Embedding
Search
AI/RAG
Conversations
Notifications
Analytics

Responsibilities MUST NOT be merged merely for convenience.

Principle III — Data and Repository Isolation

Workspace and repository boundaries are security boundaries.

Repository knowledge MUST NOT cross repository boundaries unless explicitly
authorized.

Workspace data MUST NOT cross workspace boundaries.

Conversation access MUST respect user, workspace, and repository authorization.

Principle IV — Database Integrity

PostgreSQL is the system of record.

Prisma is the persistence abstraction.

Persistent schema changes MUST use Prisma migrations.

Database design MUST maintain:

Referential integrity
Appropriate constraints
Appropriate indexes
Transactional consistency
Scalable query patterns

Principle V — AI and RAG Separation

The following responsibilities MUST remain separate:

Knowledge Processing

Embedding Generation

Search

Retrieval

Context Construction

Prompt Construction

LLM Generation

Citation Generation

The LLM MUST NOT be treated as the repository database.

Repository-specific answers should be grounded in retrieved repository knowledge.

Principle VI — Provider Independence

AI and embedding providers MUST be accessed through abstractions.

Provider-specific implementation MUST NOT leak into business logic.

The system must remain capable of switching providers without rewriting core
application behavior.

Principle VII — Deterministic Before Generative

Use deterministic techniques whenever they are sufficient.

Prefer:

Repository metadata
→ deterministic extraction
→ heuristics
→ cached information
→ digests
→ LLM reasoning

LLM calls must be used when they provide meaningful value.

Principle VIII — Security by Default

Authentication, authorization, repository isolation, workspace isolation,
input validation, rate limiting, and secret protection are mandatory.

Security controls MUST NOT be bypassed for convenience.

Principle IX — Testable Software

Production functionality MUST be testable.

Critical workflows MUST have integration or end-to-end coverage.

Security-sensitive behavior MUST have explicit authorization tests.

Principle X — Observable and Recoverable Systems

Asynchronous processing and AI execution MUST be observable.

Important operations should support:

Structured logging
Error tracking
Retry where appropriate
Failure recovery
Idempotency

Important failures MUST NOT be silently swallowed.

Principle XI — Performance and Scale

The system must support large repositories and growing knowledge bases.

Implementation should consider:

Pagination
Batching
Caching
Connection pooling
Queue concurrency
Token limits
Database indexes
Incremental processing

Avoid unnecessary full-repository reprocessing.

Principle XII — Minimal Complexity

Choose the simplest architecture that satisfies the requirement.

Do not introduce:

Unnecessary frameworks
Unnecessary dependencies
Unnecessary services
Unnecessary abstractions
Unnecessary infrastructure

Complexity must have measurable justification.

Principle XIII — Backward Compatibility

Existing APIs and completed phases should remain stable.

Breaking changes require explicit justification, impact analysis, migration
planning, and tests.

Principle XIV — Documentation and Traceability

Significant requirements must be traceable to implementation and tests.

Meaningful architectural decisions should be documented.

Requirements, plans, tasks, implementation, and verification should remain
consistent.

Principle XV — Honest Completion

A feature MUST NOT be declared complete when:

Tests fail
Required functionality is missing
Security requirements are incomplete
Database migrations are invalid
Build/type checks fail

Incomplete work must be reported honestly.

Governance

This constitution takes precedence over convenience.

Changes to these principles require explicit architectural justification.

For feature-level decisions:

Constitution
→ Specification
→ Plan
→ Tasks
→ Implementation
→ Verification

The project should use the minimum workflow necessary for the size and risk of
the change, while respecting mandatory escalation rules.
