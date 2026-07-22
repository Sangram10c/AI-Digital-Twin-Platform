const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim();
}

function mask(k) {
  if (!k) return '(empty)';
  return `${k.slice(0, 7)}...${k.slice(-4)} (len=${k.length})`;
}

console.log('AI_DEFAULT_PROVIDER=', env.AI_DEFAULT_PROVIDER || '(unset)');
console.log('OPENAI set=', Boolean(env.OPENAI_API_KEY), mask(env.OPENAI_API_KEY));
console.log('ANTHROPIC set=', Boolean(env.ANTHROPIC_API_KEY), mask(env.ANTHROPIC_API_KEY));
console.log('GEMINI set=', Boolean(env.GOOGLE_AI_API_KEY), mask(env.GOOGLE_AI_API_KEY));

async function testOpenAI() {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 30,
      messages: [{ role: 'user', content: 'Reply with JSON only: {"ok":true}' }],
      response_format: { type: 'json_object' },
    }),
  });
  const t = await r.text();
  return { ok: r.ok, status: r.status, body: t.slice(0, 400) };
}

async function testAnthropic() {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 40,
      temperature: 0,
      messages: [{ role: 'user', content: 'Reply with JSON only: {"ok":true}' }],
    }),
  });
  const t = await r.text();
  return { ok: r.ok, status: r.status, body: t.slice(0, 400) };
}

async function testGemini() {
  const model = env.GOOGLE_AI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GOOGLE_AI_API_KEY)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Reply with JSON only: {"ok":true}' }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    }),
  });
  const t = await r.text();
  return { ok: r.ok, status: r.status, body: t.slice(0, 400) };
}

(async () => {
  for (const [name, fn] of [
    ['openai', testOpenAI],
    ['anthropic', testAnthropic],
    ['gemini', testGemini],
  ]) {
    try {
      const res = await fn();
      console.log(`\n=== ${name} ===`);
      console.log('ok=', res.ok, 'status=', res.status);
      console.log('snippet=', res.body.replace(/\n/g, ' '));
    } catch (e) {
      console.log(`\n=== ${name} ===`);
      console.log('error=', e instanceof Error ? e.message : String(e));
    }
  }
})();
