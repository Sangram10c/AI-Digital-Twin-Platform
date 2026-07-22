/**
 * Smoke-test all configured AI providers/models from .env
 * Usage: node scripts/test-all-ai-models.cjs
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim();
}

const PING = {
  system: 'Return valid JSON only.',
  user: '{"ok":true,"ping":"ai-digital-twin"}',
};

function snippet(text, n = 280) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .slice(0, n);
}

async function timed(fn) {
  const started = Date.now();
  try {
    const result = await fn();
    return { ...result, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
      latencyMs: Date.now() - started,
    };
  }
}

async function testGroq() {
  if (!env.GROQ_API_KEY) return { ok: false, skipped: true, reason: 'no key' };
  const model = env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PING.system },
        { role: 'user', content: PING.user },
      ],
    }),
  });
  const body = await r.text();
  return { ok: r.ok, status: r.status, model, body: snippet(body) };
}

async function testOpenRouter() {
  if (!env.OPENROUTER_API_KEY) return { ok: false, skipped: true, reason: 'no key' };
  const model =
    env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: PING.system },
        { role: 'user', content: PING.user },
      ],
    }),
  });
  const body = await r.text();
  return { ok: r.ok, status: r.status, model, body: snippet(body) };
}

async function testHuggingFace() {
  if (!env.HUGGINGFACE_API_KEY)
    return { ok: false, skipped: true, reason: 'no key' };
  const model = env.HUGGINGFACE_MODEL || 'HuggingFaceH4/zephyr-7b-beta';
  const url =
    env.HUGGINGFACE_BASE_URL ||
    'https://router.huggingface.co/v1/chat/completions';
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: PING.system },
        { role: 'user', content: PING.user },
      ],
    }),
  });
  const body = await r.text();
  return { ok: r.ok, status: r.status, model, body: snippet(body) };
}

async function testCloudflare() {
  if (!env.CLOUDFLARE_API_TOKEN)
    return { ok: false, skipped: true, reason: 'no token' };
  if (!env.CLOUDFLARE_ACCOUNT_ID)
    return { ok: false, skipped: true, reason: 'no account id' };
  const model =
    env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/ai/run/${model}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: PING.system },
        { role: 'user', content: PING.user },
      ],
    }),
  });
  const body = await r.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = null;
  }
  const ok = r.ok && parsed?.success !== false;
  return { ok, status: r.status, model, body: snippet(body) };
}

async function testGemini() {
  if (!env.GOOGLE_AI_API_KEY)
    return { ok: false, skipped: true, reason: 'no key' };
  const model = env.GOOGLE_AI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GOOGLE_AI_API_KEY)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PING.user }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    }),
  });
  const body = await r.text();
  return { ok: r.ok, status: r.status, model, body: snippet(body) };
}

async function testOpenAI() {
  if (!env.OPENAI_API_KEY) return { ok: false, skipped: true, reason: 'no key' };
  const model = env.OPENAI_MODEL || 'gpt-4o-mini';
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 40,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PING.system },
        { role: 'user', content: PING.user },
      ],
    }),
  });
  const body = await r.text();
  return { ok: r.ok, status: r.status, model, body: snippet(body), billing: 'paid' };
}

async function testAnthropic() {
  if (!env.ANTHROPIC_API_KEY)
    return { ok: false, skipped: true, reason: 'no key' };
  const model = env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 40,
      temperature: 0,
      messages: [{ role: 'user', content: PING.user }],
    }),
  });
  const body = await r.text();
  return { ok: r.ok, status: r.status, model, body: snippet(body), billing: 'paid' };
}

async function testOllama() {
  if ((env.OLLAMA_ENABLED || '').toLowerCase() !== 'true') {
    return { ok: false, skipped: true, reason: 'OLLAMA_ENABLED!=true' };
  }
  const base =
    env.OLLAMA_URL || env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const model = env.OLLAMA_MODEL || 'llama3.2:1b';
  const r = await fetch(`${base.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      format: 'json',
      messages: [
        { role: 'system', content: PING.system },
        { role: 'user', content: PING.user },
      ],
    }),
  });
  const body = await r.text();
  return { ok: r.ok, status: r.status, model, body: snippet(body), billing: 'local' };
}

(async () => {
  console.log('AI_DEFAULT_PROVIDER=', env.AI_DEFAULT_PROVIDER);
  console.log('AI_BILLING_MODE=', env.AI_BILLING_MODE);
  console.log('');

  const tests = [
    ['groq', 'free', testGroq],
    ['openrouter', 'free', testOpenRouter],
    ['huggingface', 'free', testHuggingFace],
    ['cloudflare', 'free', testCloudflare],
    ['gemini', 'free-tier', testGemini],
    ['openai', 'paid (skipped in free_only)', testOpenAI],
    ['anthropic', 'paid (skipped in free_only)', testAnthropic],
    ['ollama', 'local-dev', testOllama],
  ];

  const results = [];
  for (const [name, tier, fn] of tests) {
    process.stdout.write(`Testing ${name}... `);
    const res = await timed(fn);
    const status = res.skipped
      ? `SKIP (${res.reason})`
      : res.ok
        ? `OK (${res.latencyMs}ms)`
        : `FAIL status=${res.status} (${res.latencyMs}ms)`;
    console.log(status);
    if (!res.ok && !res.skipped) {
      console.log('  ', res.error || res.body);
    }
    results.push({
      provider: name,
      tier,
      model: res.model || env[`${name.toUpperCase()}_MODEL`] || '',
      ok: Boolean(res.ok),
      skipped: Boolean(res.skipped),
      status: res.status ?? null,
      latencyMs: res.latencyMs,
      detail: res.skipped
        ? res.reason
        : res.ok
          ? 'success'
          : res.error || res.body,
    });
  }

  const outPath = path.join(__dirname, '..', 'docs', 'ai-model-test-results.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        billingMode: env.AI_BILLING_MODE || 'free_only',
        defaultProvider: env.AI_DEFAULT_PROVIDER || 'groq',
        results,
      },
      null,
      2,
    ),
  );
  console.log('\nWrote', outPath);
})();
