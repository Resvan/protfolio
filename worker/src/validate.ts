import type { ChatMessage } from './prompt';

export const MAX_MESSAGE_CHARS = 500;
/** Model answers in the history can be long (Malayalam especially); only visitor turns are capped at 500. */
export const MAX_ASSISTANT_CHARS = 4000;
export const MAX_MESSAGES = 20;

/** The browser owns the history, so treat it as untrusted: only user/assistant turns, bounded sizes. */
export function validateBody(body: unknown): { ok: true; messages: ChatMessage[] } | { ok: false } {
  const list = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_MESSAGES) return { ok: false };
  const messages: ChatMessage[] = [];
  for (const m of list) {
    const { role, content } = (m ?? {}) as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') return { ok: false };
    const max = role === 'user' ? MAX_MESSAGE_CHARS : MAX_ASSISTANT_CHARS;
    if (typeof content !== 'string' || !content.trim() || content.length > max) return { ok: false };
    messages.push({ role, content });
  }
  return messages[messages.length - 1].role === 'user' ? { ok: true, messages } : { ok: false };
}
