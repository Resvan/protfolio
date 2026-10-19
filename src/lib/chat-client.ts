export interface ChatTurn { role: 'user' | 'assistant'; content: string; contact?: boolean; failed?: boolean }
export type ChatErrorKind = 'busy' | 'rate_limited' | 'bad_request' | 'network';
export interface SendHandlers {
  delta(text: string): void;
  done(result: { contact: boolean }): void;
  error(kind: ChatErrorKind): void;
}
export interface Chat {
  readonly messages: ChatTurn[];
  readonly busy: boolean;
  send(text: string, on: SendHandlers): Promise<void>;
  subscribe(fn: () => void): () => void;
}

export const MAX_INPUT = 500;
const MAX_TURNS = 6;
const MARKER = '[[contact]]';
const MARKER_RE = /\s*\[\[contact\]\]/g;
/** Hold back enough characters that a half-received marker is never shown. */
const HOLD = MARKER.length - 1;

/** One chat per page view, shared by the hero ask bar and the floating button. */
export function createChat(endpoint: string, fetchImpl: typeof fetch = fetch): Chat {
  const url = `${endpoint.replace(/\/+$/, '')}/chat`;
  const messages: ChatTurn[] = [];
  const listeners = new Set<() => void>();
  let busy = false;
  const notify = () => listeners.forEach((fn) => fn());

  async function send(text: string, on: SendHandlers) {
    const content = text.trim().slice(0, MAX_INPUT);
    if (!content || busy) return;
    busy = true;
    messages.push({ role: 'user', content });
    notify();
    const history = messages.slice(-MAX_TURNS).map(({ role, content }) => ({ role, content }));

    let raw = '';
    let shown = 0;
    const visible = () => raw.replace(MARKER_RE, '');
    try {
      let res: Response;
      try {
        res = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) });
      } catch {
        return on.error('network');
      }
      if (!res.ok || !res.body) {
        return on.error(res.status === 429 ? 'rate_limited' : res.status === 400 ? 'bad_request' : 'busy');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
          const v = visible();
          // Trailing spaces wait for the next character: they may be followed by the marker.
          const cut = v.slice(0, Math.max(0, v.length - HOLD)).trimEnd().length;
          if (cut > shown) { on.delta(v.slice(shown, cut)); shown = cut; }
        }
      } catch {
        messages.push({ role: 'assistant', content: visible().trim(), failed: true });
        return on.error('network');
      }
      raw += decoder.decode();
      const final = visible().trimEnd();
      if (final.length > shown) on.delta(final.slice(shown));
      const contact = raw.includes(MARKER);
      messages.push({ role: 'assistant', content: final.trim(), contact });
      on.done({ contact });
    } finally {
      busy = false;
      notify();
    }
  }

  return {
    get messages() { return messages; },
    get busy() { return busy; },
    send,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
