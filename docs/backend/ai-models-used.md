# AI Models Used in AI Digital Twin Platform

Last smoke-tested: **2026-07-22**  
Billing mode: `AI_BILLING_MODE=free_only`  
Default provider: `groq`  
Test script: `node apps/backend/scripts/test-all-ai-models.cjs`  
Raw JSON: `apps/backend/docs/ai-model-test-results.json`

> **Note (Swagger `provider/test`):** Hugging Face may return HTML (`<!DOCTYPE...`) after long waits when Inference Providers credits/permissions are missing. Prefer testing `groq` or `openrouter`. The backend now fails fast (~45s) with a clear error instead of a JSON parse crash.

---

## Working now (green)

| Provider         | Model                      | Latency | Role                 |
| ---------------- | -------------------------- | ------- | -------------------- |
| **Groq**         | `llama-3.1-8b-instant`     | ~527 ms | Primary cloud        |
| **OpenRouter**   | `openrouter/free`          | ~7 s    | Free auto-router     |
| **Hugging Face** | `Qwen/Qwen2.5-7B-Instruct` | ~621 ms | Free Inference       |
| **Ollama**       | `llama3.2:1b`              | ~6.5 s  | Dev last resort only |
| **Heuristics**   | (deterministic, no LLM)    | n/a     | Always available     |

---

## Full free cloud chain

Tried one-by-one until one succeeds:

| Order | Provider     | Model (`.env`)                   | Billing         | Test   | Status             |
| ----: | ------------ | -------------------------------- | --------------- | ------ | ------------------ |
|     1 | Groq         | `llama-3.1-8b-instant`           | Free tier       | ✅ OK  | Active             |
|     2 | OpenRouter   | `openrouter/free`                | Free router     | ✅ OK  | Active             |
|     3 | Hugging Face | `Qwen/Qwen2.5-7B-Instruct`       | Free Inference  | ✅ OK  | Active             |
|     4 | Cloudflare   | `@cf/meta/llama-3.1-8b-instruct` | Workers AI free | ❌ 401 | Auth token invalid |
|     5 | Gemini       | `gemini-2.0-flash`               | Free tier       | ❌ 429 | Quota exhausted    |

Then:

```
Heuristics (no AI)
  ↓ if heuristics too thin AND not production
Ollama (dev only — blocked in production)
```

---

## Paid providers (skipped when `AI_BILLING_MODE=free_only`)

| Provider  | Model                      | Test           | Used in free_only? |
| --------- | -------------------------- | -------------- | ------------------ |
| OpenAI    | `gpt-4o-mini`              | ❌ 429 quota   | **No**             |
| Anthropic | `claude-sonnet-4-20250514` | ❌ credits low | **No**             |

Set `AI_BILLING_MODE=mixed` to include them after free providers.

---

## Smoke-test results (2026-07-22)

| Provider    | OK  | HTTP | Latency | Detail                                          |
| ----------- | --- | ---- | ------- | ----------------------------------------------- |
| groq        | ✅  | 200  | 527 ms  | success                                         |
| openrouter  | ✅  | 200  | 6981 ms | success (`openrouter/free`)                     |
| huggingface | ✅  | 200  | 621 ms  | success                                         |
| cloudflare  | ❌  | 401  | 166 ms  | Authentication error                            |
| gemini      | ❌  | 429  | 338 ms  | quota exceeded                                  |
| openai      | ❌  | 429  | 1224 ms | insufficient_quota (paid; skipped in free_only) |
| anthropic   | ❌  | 400  | 433 ms  | credit balance too low (paid; skipped)          |
| ollama      | ✅  | 200  | 6562 ms | success (local dev)                             |

**Pipeline can run on free APIs today via:** Groq → OpenRouter → HuggingFace → Heuristics → Ollama (dev).

---

## Env vars (current free setup)

```env
AI_DEFAULT_PROVIDER=groq
AI_BILLING_MODE=free_only

GROQ_MODEL=llama-3.1-8b-instant
OPENROUTER_MODEL=openrouter/free
HUGGINGFACE_MODEL=Qwen/Qwen2.5-7B-Instruct
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-8b-instruct
GOOGLE_AI_MODEL=gemini-2.0-flash
OLLAMA_MODEL=llama3.2:1b

# Paid — ignored in free_only
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

---

## Fix remaining failures

1. **Cloudflare 401** — create an API token with **Workers AI** permission; keep `CLOUDFLARE_ACCOUNT_ID` correct.
2. **Gemini 429** — wait for free quota reset or new Google AI key.
3. **OpenAI / Anthropic** — need billing credits (optional; not used in `free_only`).

Re-run:

```bash
cd apps/backend
node scripts/test-all-ai-models.cjs
```
