# Source Code Knowledge Ingestion

Extends the knowledge pipeline so **`.ts` / `.js` (and related) source files** are stored as `knowledge_chunks` — required for accurate “how is X implemented?” retrieval.

This does **not** implement AI answer generation (next phase).

## Why

Docs + commits alone cannot explain inside logic. Source files are ingested with **symbol-aware chunking** (class / function / exports + file header).

## Free-tier design

| Setting                                | Default                 | Purpose                      |
| -------------------------------------- | ----------------------- | ---------------------------- |
| `KNOWLEDGE_SOURCE_CODE_MAX_FILES`      | `80`                    | Cap GitHub content API calls |
| `KNOWLEDGE_SOURCE_CODE_MAX_FILE_BYTES` | `200KB`                 | Skip huge files              |
| `KNOWLEDGE_SOURCE_CODE_FETCH_GAP_MS`   | `50`                    | Soft rate pacing             |
| Priority order                         | auth/jwt/identity first | Best files within the cap    |

Embeddings can stay **`mock`** locally (keyword/hybrid still search code text). Paid OpenAI embeddings are optional for better semantic rank later.

## Flow

1. `processRepository` (or dedicated API) lists git tree
2. Filters extensions, skips `node_modules` / `dist`
3. Scores paths (JWT/auth first)
4. Fetches up to N files via GitHub Contents API
5. Upserts `knowledge_sources` (`CUSTOM`, `externalRefId=file:<path>`)
6. Chunk generation uses `CodeSymbolChunkerService`
7. Incremental embedding enqueue (mock or real provider)

## API

```http
POST /api/v1/knowledge/repository/:id/source-code
Authorization: Bearer <jwt>
Content-Type: application/json

{ "workspaceId": "<uuid>", "force": true }
```

Also runs automatically during repository knowledge processing.

## Search tip

After ingest:

```json
{
  "workspaceId": "...",
  "query": "How is JWT implemented?",
  "fileExtension": "ts",
  "topK": 10
}
```

You should see `filePath` values like `.../jwt-auth.guard.ts`, not only `.md` docs.
