# Hybrid AI Knowledge Pipeline

## Goal

Dramatically reduce cloud AI API usage while keeping repository understanding accurate.

**Principles**

1. Sync everything from GitHub.
2. Never call AI for every commit.
3. Local heuristics extract deterministic facts.
4. AI analyzes compressed digests only.
5. Provider-independent with automatic fallback.
6. Pipeline never fails — falls back to heuristics-only.

## Pipeline

```
GitHub → Repository Sync → Knowledge Processing
  → Heuristics Extraction
  → Digest Builder
  → AI Extraction (one request per digest)
  → Embeddings (stub)
  → Structured Knowledge / RAG (later)
```

## Modes (`AIExtractionMode`)

| Mode              | Behavior                                                     |
| ----------------- | ------------------------------------------------------------ |
| `HEURISTICS_ONLY` | No LLM. Deterministic extraction only.                       |
| `LIGHT` (default) | AI on repository + docs + releases + a few PR batch digests. |
| `FULL`            | AI on all digests including modules and more PR batches.     |

Configure default: `AI_EXTRACTION_MODE=light`

## Modules

- `src/modules/knowledge-heuristics/` — deterministic fact extraction (no AI)
- `src/modules/ai-knowledge/services/digest-builder.service.ts` — compress entities into digests
- `src/modules/ai-knowledge/services/hybrid-ai-pipeline.service.ts` — orchestration
- `src/modules/ai-knowledge/providers/ai-provider-fallback.service.ts` — Gemini → Ollama → OpenAI → Anthropic → OpenRouter
- BullMQ queues: `hybrid-heuristics` → `hybrid-digest-builder` → `hybrid-ai-extraction` → `hybrid-embeddings`

## Database

Prisma models:

- `HeuristicMetadata`
- `RepositoryDigest`, `ModuleDigest`, `PullRequestDigest`, `DocumentationDigest`, `ReleaseDigest`
- `DigestChecksum`
- `AIAnalysis`
- `ProviderExecution`, `ProviderFailure`
- `AIExecutionLog`

Migration SQL: `prisma/migrations/hybrid_ai_digest_pipeline/migration.sql`

## APIs (additive; legacy endpoints still work)

| Method | Path                      | Notes                                                                   |
| ------ | ------------------------- | ----------------------------------------------------------------------- |
| `POST` | `/v1/ai/extract`          | Default **hybrid**. Body: `mode`, `hybrid`, `sync`, `force`, `provider` |
| `POST` | `/v1/ai/repository/:id`   | Same as above for one repo                                              |
| `GET`  | `/v1/ai/providers`        | Provider enablement                                                     |
| `GET`  | `/v1/ai/providers/status` | Providers + monitoring                                                  |
| `GET`  | `/v1/ai/jobs`             | Legacy + hybrid queue counts                                            |
| `GET`  | `/v1/ai/digests`          | List digests                                                            |
| `POST` | `/v1/ai/provider/test`    | Smoke-test a provider                                                   |

Legacy per-source queues remain available with `hybrid: false`.

### Example

```bash
curl -X POST /v1/ai/repository/<repoId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "<workspaceId>",
    "mode": "light",
    "hybrid": true,
    "sync": true
  }'
```

## Configuration

```env
AI_DEFAULT_PROVIDER=groq
AI_EXTRACTION_MODE=light
AI_PROVIDER_FALLBACK=true
GROQ_API_KEY=
OPENROUTER_API_KEY=
HUGGINGFACE_API_KEY=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
OLLAMA_ENABLED=false
DIGEST_BATCH_SIZE=10
PR_BATCH_SIZE=5
MAX_AI_RETRIES=3
```

Cloudflare Workers AI needs both `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Fallback behavior

```
Groq → OpenRouter → HuggingFace → Cloudflare → Gemini → OpenAI → Anthropic
        ↓ (all cloud quotas / errors)
   Deterministic Heuristics
        ↓ (heuristics insufficient AND not production)
   Ollama (DEV only — never production)
```

On `429`, quota/credits exhausted, timeout, or connection errors, the next **cloud** provider is tried.

If **all cloud** providers fail → `HEURISTICS_FALLBACK`.

If heuristics coverage is too thin **and** `NODE_ENV !== production` and `OLLAMA_ENABLED=true` → try Ollama once.

**Ollama is hard-blocked in production.**

## Incremental processing

Unchanged digests (same `contentChecksum`) skip AI re-analysis unless `force: true`.

## Monitoring

Tracked in `AIExecutionLog` / `ProviderFailure` / `ProviderExecution`:

- API calls
- Fallback count
- Digest cache hits
- Heuristic coverage
- Average AI time
- Failed providers

Exposed via `GET /v1/ai/providers/status`.

## Backward compatibility

- Existing `/ai/status`, `/ai/statistics`, and legacy extraction with `hybrid: false` continue to work.
- Knowledge auto-bridge now enqueues the **hybrid** pipeline (repository sources only), not per-commit AI jobs.
