# AI Knowledge Extraction

> **Preferred path:** the [Hybrid AI Pipeline](./hybrid-ai-pipeline.md) (heuristics → digests → AI).  
> This document covers the original per-source extraction module, which remains available with `hybrid: false`.

## Objective

The AI Knowledge Extraction pipeline analyzes already-synchronized engineering artifacts once, then stores structured engineering knowledge back into existing backend metadata fields for later embedding and indexing phases.

This phase does **not** implement:

- embeddings
- vector search
- RAG
- chat
- memory
- frontend

## Architecture

Code lives in `apps/backend/src/modules/ai-knowledge/`.

Main parts:

- `controllers/ai-knowledge.controller.ts`
  Exposes hybrid + legacy AI APIs (`POST /ai/extract`, digests, providers, jobs, status).
- `services/hybrid-ai-pipeline.service.ts` / `hybrid-ai-orchestration.service.ts`
  Digest-based extraction (default).
- `services/ai-knowledge-orchestration.service.ts`
  Legacy discovery + enqueue by artifact type (`hybrid: false`).
- `services/ai-knowledge-extraction.service.ts`
  Loads normalized content, applies checksum/prompt-version skip rules, calls the selected AI provider, merges heuristic extraction, and persists the result.
- `services/ai-knowledge-storage.service.ts`
  Reuses existing `KnowledgeSource.metadata` and `Repository.providerMetadata` fields instead of requiring schema changes.
- `providers/ai-providers.service.ts`
  Provider abstraction for OpenAI, Anthropic, Gemini, OpenRouter, and Ollama.
- `providers/ai-provider-fallback.service.ts`
  Ordered failover across providers.
- `extractors/ai-heuristics-extractor.service.ts`
  Adds deterministic signals such as topic detection, module detection, technology detection, and relationship hints.
- `jobs/ai-knowledge-queue.service.ts` / `jobs/hybrid-pipeline-queue.service.ts`
  Centralizes BullMQ enqueueing and queue metrics.
- `processors/ai-knowledge.processors.ts` / `processors/hybrid-pipeline.processors.ts`
  Worker processors for legacy and hybrid flows.

## Storage Strategy

No Prisma schema redesign is required.

Structured AI output is stored in:

- `KnowledgeSource.metadata.aiExtraction`
- `Repository.providerMetadata.aiRepositoryInsights`

For repository documentation rows, the pipeline upserts a matching `KnowledgeSource` record of type `DOCUMENTATION` and stores extraction output there as well.

Each extraction record stores:

- status
- content checksum
- prompt version
- provider
- model
- extraction timestamp
- latency
- last error
- structured result
- raw provider JSON text

## Prompt Pipeline

Prompts are stored separately in `prompts/ai-knowledge.prompts.ts`.

The pipeline builds two prompt layers:

1. System prompt
   Forces JSON-only engineering extraction behavior.
2. User prompt
   Injects prompt version, artifact type, title, metadata, and truncated normalized content.

Prompt versioning is explicit through `AI_PROMPT_VERSION`.
If the prompt version changes, unchanged content can still be re-analyzed intentionally because the cached version no longer matches.

## Provider Abstraction

Supported providers:

- OpenAI
- Anthropic
- Gemini
- OpenRouter
- **Ollama (local, free)**

Provider selection comes from `ai.defaultProvider` and may be overridden per request payload.

Relevant environment variables:

- `AI_DEFAULT_PROVIDER` (set to `ollama` for free local AI)
- `OLLAMA_BASE_URL` (default `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (default `llama3.2:1b`)
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `GOOGLE_AI_API_KEY`
- `GOOGLE_AI_MODEL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

### Local Ollama setup

1. Install Ollama
2. Start server (`ollama serve` or the Ollama app)
3. Pull a model: `ollama pull llama3.2:1b`
4. Set in `.env`:

```env
AI_DEFAULT_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:1b
```

5. Restart backend and call `/ai/repository/:id` with `scope: "light"`.

## Extracted Knowledge

The pipeline targets these artifact classes:

- repository
- commit
- pull request
- issue
- documentation

Structured output can include:

- summary
- purpose
- architecture style
- domain
- main modules
- external integrations
- feature and bug-fix indicators
- refactor and breaking-change indicators
- technical and business impact
- repository health
- development activity summary
- milestones and timeline notes
- root cause
- severity
- suggested resolution
- files changed
- APIs
- components
- dependencies
- configuration
- concepts
- topics
- technologies
- keywords
- relationships
- insights

## Deterministic Enrichment

AI output is enriched with backend heuristics before persistence:

- topic extraction from engineering keywords such as OAuth, JWT, BullMQ, Prisma, PostgreSQL, testing, and CI/CD
- module detection from source paths and `src/modules/*`
- technology detection from repository stack metadata and content keywords
- relationship hints from `#123` references and existing issue/PR records

This keeps extraction useful even when provider output is conservative.

## Incremental Analysis

To reduce cost and duplicate calls, the extraction service skips work when all of the following match:

- prior status is `COMPLETED`
- content checksum is unchanged
- prompt version is unchanged
- caller did not force re-analysis

When skipped, metadata is updated to `SKIPPED` with a timestamp instead of making a new provider call.

## Cost Optimization

Cost controls currently implemented:

- checksum-based deduplication
- prompt version cache invalidation
- per-artifact reprocessing only when content changed
- provider override only when needed
- truncated prompt input for large content
- queue retries instead of immediate duplicate API calls
- **extraction scopes** (`light` default, `recent`, `full`) so free-tier Gemini is not flooded
- **global provider rate limiter** (min gap between LLM calls)
- **auto-bridge only for repository sources** — commits/PRs/issues/docs are NOT auto-analyzed

### Important: `/ai/status` does not call Gemini

`GET /api/v1/ai/status` only reads Postgres metadata + Redis queue counters.
The 13k+ Gemini requests came from **AI analysis jobs** (each commit/PR/doc = 1+ Gemini call, multiplied by retries), not from status polling.

### Recommended usage on free tier

```json
{
  "workspaceId": "...",
  "provider": "gemini",
  "scope": "light",
  "force": false
}
```

Use `scope: "full"` only with paid quota or a small repository.

## Queues

BullMQ queues:

- `ai-repository-analysis`
- `ai-commit-analysis`
- `ai-pr-analysis`
- `ai-issue-analysis`
- `ai-document-analysis`
- `ai-retry`
- `ai-dead-letter`

Retry behavior:

- normal BullMQ retry/backoff for transient failures
- retry queue for follow-up recovery attempts
- dead-letter queue for terminal failures

## API

### `POST /api/v1/ai/extract`

Enqueue AI extraction for every repository in a workspace.

Body:

- `workspaceId`
- `provider` optional
- `force` optional

### `POST /api/v1/ai/repository/:id`

Enqueue AI extraction for one repository and its current knowledge sources/docs.

Body:

- `workspaceId`
- `provider` optional
- `force` optional

### `GET /api/v1/ai/status`

Returns:

- extraction status counts
- queue counts

### `GET /api/v1/ai/statistics`

Returns:

- repository/document/source/chunk totals
- completed/skipped/failed counts
- average latency
- queue counts

### `GET /api/v1/ai/jobs`

Returns live BullMQ job counters for all AI extraction queues.

## Performance Notes

Current performance controls:

- per-queue concurrency
- exponential backoff
- content truncation for prompt safety
- queue separation by artifact type
- provider abstraction ready for failover strategy growth

## Testing

Added focused tests for:

- provider selection/failover list behavior
- incremental skip behavior
- successful extraction merge behavior

Recommended next tests:

- mocked provider HTTP response parsing by provider
- retry queue failover behavior
- controller authorization coverage
- repository-wide orchestration integration test

## Future Embedding Integration

This phase intentionally stops at structured extraction.

A later embedding phase can consume `metadata.aiExtraction.result` and:

- choose the best fields for embeddings
- create retrieval-friendly summaries
- link relationships during search
- embed only completed outputs

## Operational Notes

- Extraction requires at least one provider API key to be configured.
- Documentation analysis depends on documentation already being synchronized.
- This pipeline assumes knowledge processing already populated repository sources and raw content metadata.
- **Automated chaining:** After knowledge chunk generation completes, `KnowledgeAiBridgeService` automatically enqueues the matching AI analysis job. After repository-level knowledge processing completes, a repository AI analysis job is enqueued as well.
