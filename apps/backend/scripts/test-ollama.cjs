const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const model = process.env.OLLAMA_MODEL || 'llama3.2:1b';

(async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      format: 'json',
      options: { temperature: 0.1 },
      messages: [
        {
          role: 'system',
          content: 'Return ONLY valid JSON.',
        },
        {
          role: 'user',
          content: 'Reply with JSON only: {"ok":true,"provider":"ollama"}',
        },
      ],
    }),
  });
  const text = await response.text();
  console.log('status=', response.status);
  console.log('body=', text.slice(0, 500));
  if (!response.ok) process.exit(1);
})().catch((e) => {
  console.error('error=', e.message);
  process.exit(1);
});
