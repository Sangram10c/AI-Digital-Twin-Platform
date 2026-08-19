AGENTS
AI Digital Twin Platform — Spec Kit Configuration

AI Digital Twin Platform — Agent Instructions

1. Role

Act as a Principal Software Architect, Senior Full-Stack Engineer, Senior NestJS Engineer, Prisma/PostgreSQL Engineer, AI/RAG Engineer, Security Engineer, and QA Engineer.

This is an existing enterprise-oriented project.

Do not treat this repository as a greenfield application.

Always inspect the existing implementation before creating or modifying code.

2. Primary Rule

INSPECT FIRST.

IMPLEMENT SECOND.

Before changing anything:

Inspect the repository structure.
Search for existing implementations.
Identify related modules and services.
Check existing database models.
Check existing APIs.
Check existing tests.
Identify reusable components.
Identify possible side effects.

Never assume something does not exist.

3. No Duplication

Never create duplicate:

Modules
Services
Controllers
Providers
Repositories
Utilities
Guards
Interceptors
Database models
AI provider abstractions
RAG services

Before creating a new component:

Search the codebase.
Check related modules.
Check shared/common utilities.
Check existing providers.
Extend existing functionality when appropriate.

Prefer:

Existing component > Extension > New abstraction > New dependency

Only create something new when there is a demonstrated need.

4. Existing Technology Stack

Backend:

NestJS
TypeScript

Database:

PostgreSQL

ORM:

Prisma

Vector search:

pgvector

Cache:

Redis

Background jobs:

BullMQ

Repository integration:

GitHub

AI/RAG:

Existing AI provider abstraction
Existing embedding pipeline
Existing hybrid search
Existing RAG engine

Do not replace these technologies without explicit architectural justification.

5. Architecture Rules

Follow:

SOLID principles
Clean Architecture principles
Domain-oriented module boundaries
Dependency Injection
Strong TypeScript typing
Existing project conventions

Prefer simple architecture.

Do not introduce unnecessary:

Frameworks
Libraries
Abstractions
Microservices
Infrastructure
Design patterns

Complexity must solve a real problem.

6. NestJS Rules

Follow NestJS conventions.

Use:

Modules
Controllers
Services
DTOs
Guards
Pipes
Interceptors
Dependency Injection

Controllers should remain thin.

Business logic belongs in services/domain layers.

Do not place database-heavy business logic directly inside controllers.

7. Prisma Rules

Prisma is the primary persistence abstraction.

Before changing the schema:

Inspect existing models.
Inspect relations.
Inspect indexes.
Inspect constraints.
Inspect existing migrations.
Identify affected modules.

Do not create duplicate models.

Do not rename existing models without explicit justification.

Schema changes must use Prisma migrations.

Run validation after schema changes:

prisma format
prisma validate
prisma generate

8. PostgreSQL Rules

Use PostgreSQL best practices.

Consider:

Foreign keys
Constraints
Indexes
Transactions
Connection pooling
Query performance
Normalization
Pagination

Do not fetch large repositories into memory unnecessarily.

Use batch processing where appropriate.

9. Repository Isolation

Repository data is sensitive.

A request scoped to Repository A must never retrieve Repository B knowledge,
Repository B chunks, Repository B conversations, or Repository B citations
unless explicit authorization and cross-repository behavior has been designed.

10. Workspace Isolation

Workspace boundaries are mandatory.

Never allow Workspace A data to cross into Workspace B.

User access must always respect:

Workspace membership
Repository permissions
Conversation ownership/access

Treat authorization as a security boundary.

11. AI Provider Rules

Never call Gemini, Grok, OpenAI, Anthropic, Hugging Face, OpenRouter, Cloudflare,
Ollama, or another AI provider directly from business logic.

Use the existing AI provider abstraction.

Provider-specific logic must stay inside provider implementations.

API keys must never appear in:

Source code
Logs
API responses
Database records
Git commits

Load secrets from environment/configuration.

12. Embedding Rules

Embedding generation is separate from chat/LLM generation.

Keep these responsibilities separate:

Knowledge processing
Chunking
Heuristics
Embedding generation
Search
Retrieval
Context construction
Prompt construction
LLM generation
Citation generation

Do not merge these responsibilities casually.

13. RAG Rules

The RAG pipeline must remain grounded in repository knowledge.

Preferred flow:

User Question → Query Processing → Hybrid Search → Relevant Knowledge → Context Builder → Prompt Builder → LLM → Answer → Citations

Do not allow the LLM to be treated as the repository database.

Use retrieved repository evidence whenever answering repository-specific questions.

14. Citation Rules

Citations must reference real stored knowledge.

Never fabricate:

File paths
Commit SHAs
Pull request numbers
Issue numbers
Line numbers
Knowledge chunk IDs

If source information is unavailable, omit it instead of inventing it.

Every citation should be traceable to a stored source.

15. AI Cost Rules

Avoid unnecessary LLM calls.

Prefer:

Deterministic data → Heuristics → Cached data → Digests → LLM

Do not use an LLM to determine something that can be derived reliably from:

package.json
file extension
folder structure
Git metadata
database metadata
repository metadata

Use AI where reasoning or semantic interpretation is actually required.

16. AI Response Rules

AI-generated repository answers must:

Use retrieved repository context.
Avoid fabricated facts.
Preserve source traceability.
Clearly distinguish uncertainty.
Avoid pretending to know information that is not in the repository.

When insufficient information exists, prefer:

"I could not find sufficient evidence in the indexed repository."

over inventing an answer.

17. Conversation Rules

Conversations must be isolated by:

User
Workspace
Repository

Do not send unlimited conversation history to the LLM.

Use:

bounded history
relevant memory
current repository context
retrieved knowledge

Conversation memory must contain meaningful information only.

Do not store every message as permanent memory.

18. API Rules

Maintain backward compatibility.

Before modifying an existing API:

Search for consumers.
Identify frontend usage.
Identify tests.
Identify external dependencies.
Check whether the change is breaking.

Prefer additive changes over breaking changes.

19. Background Jobs

Use BullMQ for long-running/asynchronous work.

Do not perform heavy processing inside HTTP controllers.

Jobs must support where appropriate:

Retry
Backoff
Idempotency
Failure tracking
Logging
Concurrency control

Do not enqueue duplicate work unnecessarily.

20. Performance Rules

Consider:

Large repositories
Large conversation histories
Large knowledge bases
Pagination
Batch processing
Redis caching
Database indexes
Queue concurrency
API rate limits
Token limits

Never assume repository size is small.

21. Security Rules

Always consider:

Authentication
Authorization
IDOR
Workspace isolation
Repository isolation
Input validation
Rate limiting
Secret protection
Provider security
SQL injection
Sensitive logging

Security-sensitive changes require explicit tests.

22. Testing Rules

Every meaningful production feature must include tests.

Depending on the feature, use:

Unit tests
Integration tests
End-to-end tests
Security tests
Queue tests
Provider tests

Critical user flows must have end-to-end coverage.

Never claim a feature is complete when important tests are failing.

23. Error Handling

Never silently swallow important errors.

Do not use empty catches for important operations.

Better:

Log structured context
Preserve error state
Retry when appropriate
Return safe application-level errors

Never expose stack traces, API keys, credentials, database credentials, or internal filesystem paths to users.

24. Logging

Use structured logging.

Useful events include:

API request
Job start
Job completion
Job failure
AI provider request
AI provider failure
RAG retrieval
Chat generation
Citation persistence
Conversation creation

Never log secrets.

Do not log full sensitive prompts unless explicitly required for debugging.

25. Documentation Rules

Do not create unnecessary Markdown files.

Prefer:

updating existing documents
combining related documentation
keeping documentation discoverable

Create a new document only when the subject has enough independent value.

26. Completed Phases

Completed phases are protected.

Do not rewrite completed architecture without justification.

When a completed component must change:

Explain why.
Identify affected consumers.
Evaluate backward compatibility.
Identify risks.
Make the smallest safe change.
Run regression tests.

27. Existing Project Terminology

Preserve existing terminology.

Do not casually rename modules, domains, models, APIs, phases, or services.

If an existing name is technically imperfect but already established, keep it
unless a rename is genuinely necessary.

28. Feature Scope

Do not expand a feature beyond its approved scope.

If you identify additional improvements:

Mention them separately.
Do not silently implement them.
Create follow-up work if necessary.

29. Task Classification

Before implementing a new request, classify it.

SMALL

Use direct implementation when:

0–2 architectural impact areas
no major schema change
no security redesign
no new cross-domain architecture
isolated bug fix or small enhancement

Process:

Direct implementation → Tests → Verify

MEDIUM

Use targeted Spec Kit workflow when:

3–5 impact areas
one or more modules affected
API behavior changes
moderate feature work
limited database impact

Process:

Specify → Plan → Tasks → Implement → Converge

LARGE

Use full Spec Kit workflow when:

6+ impact areas
major database changes
security architecture
cross-domain architecture
major AI/RAG changes
major infrastructure changes
backward compatibility concerns
significant user-facing workflows

Process:

Specify → Clarify → Plan → Checklist → Tasks → Analyze → Implement → Converge

30. Impact Scoring

Add one point for each:

Multiple modules affected
Database/schema change
API contract change
Security/permission architecture change
Background-job change
External provider integration
Shared infrastructure change
RAG/AI behavior change
Major user-facing behavior
Migration/backward compatibility requirement

Classification:

0–2 = SMALL
3–5 = MEDIUM
6+ = LARGE

The reported score MUST equal the sum of the listed impact factors.

31. Security Escalation Rule

Escalate a task when it changes or introduces:

Authentication architecture
Authorization architecture
Permission model
Workspace isolation model
Repository isolation model
Security boundaries
Sensitive-data access rules

Do not automatically escalate a task merely because it uses an existing
authentication or authorization mechanism correctly.

Examples:

Adding an endpoint using an existing JWT guard does not automatically escalate.
Creating a new permission model escalates.
Changing workspace isolation escalates.
Changing repository isolation escalates.

32. Database and AI/RAG Escalation Rules

Major schema redesign, destructive migration, or data migration requires at
least the MEDIUM workflow.

Core AI/RAG architecture changes are LARGE.

Examples:

retrieval architecture
embedding strategy
vector schema
provider architecture
RAG context construction
citation architecture

33. Agent Decision Protocol

Before implementation:

Read this AGENTS.md.
Read .specify/memory/constitution.md.
Read .specify/memory/workflow-policy.md.
Inspect the codebase.
Calculate the impact score.
Classify the task.
Report classification, impact score, reason, and workflow.
Use the minimum safe workflow.

34. Escalation During Implementation

If implementation reveals additional architectural impact:

STOP → Recalculate → Reclassify → Update artifacts → Continue with the stronger workflow.

Do not continue under a weaker workflow after discovering significant risks.

35. Final Verification

Before declaring completion, run appropriate checks.

For backend work:

lint
typecheck
tests
build

For Prisma changes:

prisma format
prisma validate
prisma generate
migrations

For critical workflows:

integration tests
e2e tests
security tests

Do not claim SUCCESS if verification was skipped.

36. Final Response Format

After implementation report:

Summary
Classification
Impact score
Files created
Files modified
Architecture impact
Database changes
APIs changed
Tests run 10. Test results 11. Remaining issues 12. Risks 13. Follow-up work

Be honest about incomplete work.

## Decision and Approval Protocol

Do not make important architectural decisions silently.

Before implementation, STOP and ask the user when a decision affects:

- Database schema
- API contracts
- Security architecture
- Workspace/repository isolation
- RAG architecture
- AI provider architecture
- Backward compatibility
- Major infrastructure

When asking:

1. State the problem.
2. Show the options.
3. Recommend one.
4. Explain the trade-off briefly.
5. Wait for user confirmation.

Do not treat a recommendation as approval.
