# AI Module

> **Status:** ✅ Complete  
> **Source Directory:** `apps/backend/src/modules/ai/`

---

## 1. Overview

The `AIModule` provides the core AI provider orchestration layer across Google Gemini, Groq, OpenAI, Anthropic, and Ollama. It encapsulates model calling logic, token tracking, fallback resolution, and standardized interfaces for the platform's RAG and extraction pipelines.

---

## 2. Structure

```text
src/modules/ai/
├── ai.controller.ts        # AI orchestration / inspection controller
├── ai.module.ts            # NestJS module
├── ai.service.ts           # Provider orchestration service
├── constants/
├── dto/
├── interfaces/
└── types/
```

---

## 3. Key Components

- **`AIService`**: Directs requests to active AI providers with automatic fallback logic.
- **Provider Abstraction**: Implements standard contracts for completion, streaming, and embedding generation.
- **Cost & Token Estimation**: Formats usage metrics into `ModelUsage` records.

---

## 4. Related Modules

- [`ai-knowledge`](./ai-knowledge-extraction.md): Repository digest and structured entity extraction.
- [`chat`](./ai-chat.md): 10-step RAG conversational engine with SSE streaming.
- [`embeddings`](./embedding-pipeline.md): pgvector embedding vector generation.
