# Knowledge Processing

The Knowledge Processing module converts synchronized GitHub repository data into normalized knowledge artifacts that can later be embedded and indexed. It does **not** generate embeddings, call LLMs, or implement RAG.

## Architecture

```
API (KnowledgeController)
  -> KnowledgeProcessingService / KnowledgeQueryService
  -> KnowledgeQueueService (BullMQ)
  -> Processors (repository, commit, PR, issue, readme, chunk)
  -> DocumentBuilderService + ChunkGenerationService
  -> Prisma (KnowledgeSource, Documentation, KnowledgeChunk)
```

### Schema mapping

The product spec refers to **KnowledgeDocument**. In the current Prisma schema that concept maps to:

| Concept                                      | Prisma model      |
| -------------------------------------------- | ----------------- |
| Engineering artifact pointer                 | `KnowledgeSource` |
| File-based docs (README, CHANGELOG, LICENSE) | `Documentation`   |
| Chunked text for future embedding            | `KnowledgeChunk`  |

Processing status, checksum, raw content, and extracted metadata are stored in `KnowledgeSource.metadata` (JSON). Documentation bodies are stored in `Documentation.content`.

## Knowledge pipeline

1. **Trigger** — `POST /api/v1/knowledge/process` or `POST /api/v1/knowledge/repository/:id`
2. **Repository job** — upserts repository metadata as a `KnowledgeSource`, enqueues entity jobs
3. **Entity jobs** — commits, pull requests (including reviews), issues, releases, documentation
4. **Document builder** — upserts `KnowledgeSource` / `Documentation`, stores checksum + status
5. **Chunk job** — cleans content, detects language, splits into ordered chunks
6. **Persist** — soft-deletes prior chunks, bulk inserts new `KnowledgeChunk` rows in a transaction

## Document lifecycle

| Status       | Meaning                                             |
| ------------ | --------------------------------------------------- |
| `PENDING`    | Document upserted, chunk job pending                |
| `PROCESSING` | Chunk generation in progress                        |
| `COMPLETED`  | Chunks persisted successfully                       |
| `SKIPPED`    | Checksum unchanged; existing chunks retained        |
| `FAILED`     | Validation or processing error recorded in metadata |

Incremental processing compares SHA-256 content checksums. When content is unchanged and active chunks exist, chunk generation is skipped.

## Chunking strategy

Chunks are produced by:

1. Markdown heading boundaries
2. Paragraph boundaries within sections
3. Hard splits for oversized paragraphs

Default maximum chunk size: **1800 characters** (`DEFAULT_KNOWLEDGE_LIMITS.maxChunkSize`).

Each chunk stores:

- `chunkIndex` for ordering
- `contentHash` for deduplication
- `tokenCount` (estimated)
- section metadata (heading, level)

## Metadata extraction

Extracted fields include repository language, author, commit SHA, PR/issue numbers, labels, branches, file paths, and source timestamps. These are stored on document metadata and copied onto chunk metadata where relevant.

## Queue architecture

| Queue                        | Job                    | Purpose                                |
| ---------------------------- | ---------------------- | -------------------------------------- |
| `knowledge-repository`       | `process-repository`   | Orchestrate full repository processing |
| `knowledge-commit`           | `process-commit`       | Normalize a commit                     |
| `knowledge-pull-request`     | `process-pull-request` | Normalize PR + reviews                 |
| `knowledge-issue`            | `process-issue`        | Normalize an issue                     |
| `knowledge-readme`           | `process-readme`       | Normalize documentation files          |
| `knowledge-chunk-generation` | `generate-chunks`      | Chunk a document                       |
| `knowledge-dead-letter`      | `dead-letter`          | Record exhausted retries               |

Jobs use exponential backoff with 5 attempts by default. Shared Redis configuration lives in `BullMqCoreModule`.

## Performance optimizations

- Batch entity discovery (default 50 per type) when orchestrating repositories
- Transactional chunk replacement with `createMany`
- Soft-delete previous chunks instead of hard delete + cascade
- Incremental checksum short-circuit
- Configurable worker concurrency (default 3 per queue)

## API endpoints

| Method | Path                               | Description                            |
| ------ | ---------------------------------- | -------------------------------------- |
| POST   | `/api/v1/knowledge/process`        | Enqueue workspace-wide processing      |
| POST   | `/api/v1/knowledge/repository/:id` | Enqueue single repository processing   |
| GET    | `/api/v1/knowledge/documents`      | List knowledge documents               |
| GET    | `/api/v1/knowledge/documents/:id`  | Get document detail                    |
| GET    | `/api/v1/knowledge/chunks`         | List chunks                            |
| GET    | `/api/v1/knowledge/chunks/:id`     | Get chunk detail                       |
| GET    | `/api/v1/knowledge/statistics`     | Totals, status breakdown, queue depths |

All endpoints require JWT authentication and workspace permissions (`READ_WORKSPACE` for queries, `CREATE_REPOSITORIES` for processing triggers).

## Framework & library detection (package.json)

When a repository is processed, the pipeline:

1. Fetches root `package.json` via GitHub Contents API (using the linked OAuth token)
2. Maps known npm packages → frameworks/libraries (NestJS, Prisma, React, BullMQ, …)
3. Scans up to 30 source files for `import` / `require` usage
4. Stores structured profile on `Repository.providerMetadata.stack`
5. Creates an AI-readable knowledge document (`sourceType: CUSTOM`, `externalRefId: stack:package.json`) with frameworks, libraries, and **file + symbol** usage hints

Example shape:

```json
{
  "frameworks": [{ "name": "nestjs", "npmPackage": "@nestjs/core", "version": "11.0.1" }],
  "libraries": [{ "name": "prisma", "npmPackage": "@prisma/client" }],
  "usage": [
    {
      "name": "prisma",
      "npmPackage": "@prisma/client",
      "filePath": "src/database/prisma.service.ts",
      "symbols": ["PrismaService"]
    }
  ]
}
```

**Limits:** Function/symbol detection is best-effort (exports/classes in scanned files), not a full AST. Unknown packages stay under `otherDependencies`. Extend `known-packages.constants.ts` to teach new frameworks.

## Automation pipeline (webhook → knowledge)

```text
Webhook event
  → Repository / entity upsert (webhook workers)
  → Documentation sync (when docs or package.json change)
  → Knowledge processing jobs
  → Chunk generation
  → Status in repository.provider_metadata.pipelineStatus
```

Manual full sync: `POST /api/v1/repositories/:id/sync`

See also [repository-sync.md](./repository-sync.md).

## Future integration points

- **Embedding generation** — consume `KnowledgeChunk` rows where `deletedAt IS NULL`
- **Vector indexing** — attach to `Embedding` model (pgvector) without changing chunk schema
- **Semantic search / RAG** — query embeddings + cite `KnowledgeSource` / `Citation`
- **Repository crawl sync** — populate `Documentation` from GitHub Contents API before README jobs
- **BackgroundJobType.KNOWLEDGE_PROCESSING** — optional schema addition for operational dashboards

## Module layout

```
src/modules/knowledge/
  constants/
  controllers/        (knowledge.controller.ts)
  dto/
  extractors/
  interfaces/
  jobs/
  normalizers/
  parsers/
  processors/
  services/
  validators/
  knowledge.module.ts
```
