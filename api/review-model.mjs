import { timingSafeEqual } from 'node:crypto';

const MODEL = 'openai/gpt-4o-mini';
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_RESPONSE_BYTES = 64 * 1024;

export const config = { maxDuration: 60 };

function authorized(request) {
  const secret = process.env.REVIEW_RELAY_SECRET;
  if (!secret || secret.length < 32) return false;
  const received = Buffer.from(request.headers.authorization || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export default async function reviewModel(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'method_not_allowed' });
  }
  if (!authorized(request)) return response.status(401).json({ error: 'unauthorized' });
  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) return response.status(503).json({ error: 'review_unavailable' });
  const body = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES
    || body.model !== MODEL || body.max_completion_tokens !== 3000
    || !Array.isArray(body.messages) || body.messages.length !== 2
    || body.messages[0]?.role !== 'system' || body.messages[1]?.role !== 'user'
    || body.messages.some(message => typeof message.content !== 'string')
    || body.response_format?.type !== 'json_schema'
    || body.response_format?.json_schema?.name !== 'library_review'
    || body.response_format?.json_schema?.strict !== true) {
    return response.status(400).json({ error: 'invalid_review_request' });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40_000);
  try {
    const upstream = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL, max_completion_tokens: 3000,
        messages: body.messages, response_format: body.response_format,
      }),
    });
    if (!upstream.ok) {
      console.warn(JSON.stringify({ event: 'review_model_unavailable', status: upstream.status }));
      return response.status(503).json({ error: 'review_unavailable' });
    }
    // Read a bounded response; neither provider errors nor credentials reach clients.
    const reader = upstream.body?.getReader();
    if (!reader) return response.status(503).json({ error: 'review_unavailable' });
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return response.status(503).json({ error: 'review_unavailable' });
      }
      chunks.push(Buffer.from(value));
    }
    const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const choice = result?.choices?.[0];
    if (!choice || choice.finish_reason !== 'stop' || typeof choice.message?.content !== 'string') {
      return response.status(503).json({ error: 'review_unavailable' });
    }
    console.info(JSON.stringify({
      event: 'review_model_completed', model: MODEL,
      generationId: typeof result.id === 'string' ? result.id.slice(0, 160) : undefined,
      inputTokens: result.usage?.prompt_tokens, outputTokens: result.usage?.completion_tokens,
    }));
    return response.status(200).json({ choices: [choice] });
  } catch {
    return response.status(503).json({ error: 'review_unavailable' });
  } finally {
    clearTimeout(timer);
  }
}
