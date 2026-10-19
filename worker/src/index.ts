import { buildMessages, detectLanguage, type ChatContext } from './prompt';
import { SAFE_FALLBACK, createBlockedTermFilter } from './filter';
import { validateBody } from './validate';

export interface Env {
  AI: Ai;
  RATE_LIMITER?: RateLimit;
  BLOCKED_TERMS?: string;
  CONTEXT_URL: string;
  MODEL: string;
  MALAYALAM_REPLIES: 'on' | 'off';
  ALLOWED_ORIGINS: string;
}

const CONTEXT_TTL_MS = 10 * 60 * 1000;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_TOKENS = 300;
/** Malayalam script costs several times more tokens for the same answer. */
const MAX_TOKENS_ML = 700;

// Never log request bodies or answers: visitors are told chats are not stored. Only failure reasons are logged.
export function createWorker() {
  let cached: { ctx: ChatContext; at: number } | null = null;
  const hits = new Map<string, number[]>();

  async function loadContext(url: string): Promise<ChatContext | null> {
    if (cached && Date.now() - cached.at < CONTEXT_TTL_MS) return cached.ctx;
    try {
      const res = await fetch(url, { cf: { cacheTtl: 600 } } as RequestInit);
      if (!res.ok) { console.error(`chat-context fetch failed: HTTP ${res.status}`); return null; }
      cached = { ctx: (await res.json()) as ChatContext, at: Date.now() };
      return cached.ctx;
    } catch (err) {
      console.error(`chat-context fetch failed: ${(err as Error).message}`);
      return null;
    }
  }

  /** Per-isolate sliding window; the RATE_LIMITER binding (when configured) is checked too. */
  async function allowed(ip: string, env: Env): Promise<boolean> {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
    if (recent.length >= RATE_LIMIT) return false;
    recent.push(now);
    hits.set(ip, recent);
    if (env.RATE_LIMITER) return (await env.RATE_LIMITER.limit({ key: ip })).success;
    return true;
  }

  return {
    async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
      const origin = req.headers.get('Origin') ?? '';
      const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
      if (!allowedOrigins.includes(origin)) return new Response('Forbidden', { status: 403 });
      const cors = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
      const json = (status: number, error: string) =>
        new Response(JSON.stringify({ error }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

      if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
      }
      if (req.method !== 'POST' || new URL(req.url).pathname !== '/chat') return json(404, 'not_found');

      if (!(await allowed(req.headers.get('CF-Connecting-IP') ?? 'unknown', env))) return json(429, 'rate_limited');

      let body: unknown;
      try { body = await req.json(); } catch { return json(400, 'bad_request'); }
      const valid = validateBody(body);
      if (!valid.ok) return json(400, 'bad_request');

      const context = await loadContext(env.CONTEXT_URL);
      if (!context) return json(503, 'busy');

      const question = valid.messages[valid.messages.length - 1].content;
      const opts = { replyLang: detectLanguage(question), malayalamReplies: env.MALAYALAM_REPLIES === 'on' };
      const messages = buildMessages(context, valid.messages, opts);
      const maxTokens = opts.replyLang === 'ml' && opts.malayalamReplies ? MAX_TOKENS_ML : MAX_TOKENS;
      let stream: ReadableStream<Uint8Array>;
      try {
        stream = (await env.AI.run(env.MODEL as Parameters<Ai['run']>[0], { messages, stream: true, max_tokens: maxTokens } as never)) as unknown as ReadableStream<Uint8Array>;
      } catch (err) {
        console.error(`AI call failed: ${(err as Error).message}`);
        return json(503, 'busy');
      }

      const terms = (env.BLOCKED_TERMS ?? '').split(',');
      return new Response(stream.pipeThrough(answerText(terms)), {
        headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    },
  };
}

/** Workers AI SSE bytes → filtered plain-text bytes. Handles both `response` and OpenAI-style `choices[].delta` chunks. */
function answerText(terms: string[]): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const filter = createBlockedTermFilter(terms);
  let pending = '';
  let sentAny = false;
  const textOf = (line: string): string => {
    if (!line.startsWith('data:')) return '';
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') return '';
    try {
      const j = JSON.parse(data) as { response?: string; choices?: { delta?: { content?: string } }[] };
      return j.response ?? j.choices?.[0]?.delta?.content ?? '';
    } catch {
      return '';
    }
  };
  const emit = (c: TransformStreamDefaultController<Uint8Array>, s: string) => { if (s) { c.enqueue(encoder.encode(s)); sentAny = true; } };
  return new TransformStream({
    transform(chunk, c) {
      pending += decoder.decode(chunk, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) emit(c, filter.push(textOf(line)));
    },
    flush(c) {
      emit(c, filter.push(textOf(pending + decoder.decode())));
      emit(c, filter.end());
      // A blocked term, or a model that produced no answer text at all: never leave the visitor with nothing.
      if (filter.blocked || !sentAny) emit(c, (sentAny ? '\n\n' : '') + SAFE_FALLBACK);
    },
  });
}

export default createWorker();
