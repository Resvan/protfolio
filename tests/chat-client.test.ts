import { describe, expect, it, vi } from 'vitest';
import { createChat } from '../src/lib/chat-client';

const enc = new TextEncoder();
/** A streamed text/plain response; `failAfter` errors the stream after that many chunks. */
function streamed(chunks: string[], failAfter?: number): Response {
  let i = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(c) {
      if (failAfter !== undefined && i === failAfter) return c.error(new Error('dropped'));
      if (i < chunks.length) c.enqueue(enc.encode(chunks[i++]));
      else c.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/plain' } });
}
const handlers = () => ({ delta: vi.fn(), done: vi.fn(), error: vi.fn() });

describe('createChat', () => {
  it('streams an answer and stores both turns', async () => {
    const fetchImpl = vi.fn(async () => streamed(['Resvan builds ', 'web apps.']));
    const chat = createChat('https://chat.test', fetchImpl);
    const h = handlers();
    let busyDuring = false;
    h.delta.mockImplementation(() => { busyDuring = chat.busy; });
    await chat.send('What does he build?', h);
    expect(fetchImpl).toHaveBeenCalledWith('https://chat.test/chat', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toEqual({ messages: [{ role: 'user', content: 'What does he build?' }] });
    expect(h.delta.mock.calls.map((c) => c[0]).join('')).toBe('Resvan builds web apps.');
    expect(busyDuring).toBe(true);
    expect(chat.busy).toBe(false);
    expect(h.done).toHaveBeenCalledWith({ contact: false });
    expect(chat.messages).toEqual([{ role: 'user', content: 'What does he build?' }, { role: 'assistant', content: 'Resvan builds web apps.', contact: false }]);
  });

  it('strips the contact marker, even when split across chunks, and never shows it', async () => {
    const chat = createChat('https://chat.test', async () => streamed(['Best discussed directly. [[con', 'tact]]']));
    const h = handlers();
    await chat.send('Salary?', h);
    const shown = h.delta.mock.calls.map((c) => c[0]).join('');
    expect(shown).not.toContain('[[');
    expect(shown.trim()).toBe('Best discussed directly.');
    expect(h.done).toHaveBeenCalledWith({ contact: true });
    expect(chat.messages[1]).toMatchObject({ content: 'Best discussed directly.', contact: true });
  });

  it('sends at most the last 6 turns and truncates long input to 500 characters', async () => {
    const fetchImpl = vi.fn(async () => streamed(['ok']));
    const chat = createChat('https://chat.test', fetchImpl);
    for (let i = 0; i < 4; i++) await chat.send(`q${i}`, handlers());
    await chat.send('x'.repeat(700), handlers());
    const body = JSON.parse((fetchImpl.mock.calls[4] as unknown as [string, RequestInit])[1].body as string);
    expect(body.messages).toHaveLength(6);
    expect(body.messages.at(-1)).toEqual({ role: 'user', content: 'x'.repeat(500) });
  });

  it('ignores a second send while an answer is streaming', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    const fetchImpl = vi.fn(async () => { await gate; return streamed(['done']); });
    const chat = createChat('https://chat.test', fetchImpl);
    const first = chat.send('one', handlers());
    await chat.send('two', handlers());
    release();
    await first;
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('ignores empty input', async () => {
    const fetchImpl = vi.fn(async () => streamed(['x']));
    await createChat('https://chat.test', fetchImpl).send('   ', handlers());
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    [503, 'busy'],
    [429, 'rate_limited'],
    [400, 'bad_request'],
  ])('maps HTTP %i to %s', async (status, kind) => {
    const chat = createChat('https://chat.test', async () => new Response(JSON.stringify({ error: kind }), { status }));
    const h = handlers();
    await chat.send('hi', h);
    expect(h.error).toHaveBeenCalledWith(kind);
    expect(chat.busy).toBe(false);
  });

  it('reports a network error when fetch fails', async () => {
    const chat = createChat('https://chat.test', async () => { throw new TypeError('offline'); });
    const h = handlers();
    await chat.send('hi', h);
    expect(h.error).toHaveBeenCalledWith('network');
    expect(chat.busy).toBe(false);
  });

  it('keeps the partial answer when the stream drops', async () => {
    const chat = createChat('https://chat.test', async () => streamed(['Resvan has ', 'built '], 2));
    const h = handlers();
    await chat.send('hi', h);
    expect(h.error).toHaveBeenCalledWith('network');
    expect(chat.messages[1]).toMatchObject({ role: 'assistant', content: 'Resvan has built', failed: true });
    expect(chat.busy).toBe(false);
  });

  it('notifies subscribers on changes', async () => {
    const chat = createChat('https://chat.test', async () => streamed(['ok']));
    const fn = vi.fn();
    const off = chat.subscribe(fn);
    await chat.send('hi', handlers());
    expect(fn).toHaveBeenCalled();
    off();
    fn.mockClear();
    await chat.send('again', handlers());
    expect(fn).not.toHaveBeenCalled();
  });
});
