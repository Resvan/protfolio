import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parse } from 'node-html-parser';
import { beforeAll, describe, expect, it } from 'vitest';

// Builds the site twice into scratch folders: with and without a chat endpoint.
const OUT_ON = '.superpowers/test-dist/chat-on';
const OUT_OFF = '.superpowers/test-dist/chat-off';
const build = (outDir: string, endpoint: string) => {
  rmSync(outDir, { recursive: true, force: true });
  execSync(`npx astro build --outDir ${outDir}`, { env: { ...process.env, PUBLIC_CHAT_ENDPOINT: endpoint }, stdio: 'ignore' });
};
const page = (outDir: string, path = 'index.html') => parse(readFileSync(join(outDir, path), 'utf8'));

beforeAll(() => {
  build(OUT_ON, 'https://chat.test');
  build(OUT_OFF, '');
}, 240_000);

describe('chat UI with an endpoint', () => {
  it('renders the ask bar, fab and panel hidden until JS runs', () => {
    const d = page(OUT_ON);
    for (const id of ['chat-askbar', 'chat-fab', 'chat-panel']) {
      const el = d.getElementById(id);
      expect(el, id).not.toBeNull();
      expect(el!.hasAttribute('hidden'), `${id} hidden`).toBe(true);
    }
    expect(d.getElementById('chat-panel')!.getAttribute('data-endpoint')).toBe('https://chat.test');
    expect(d.getElementById('chat-panel')!.getAttribute('role')).toBe('dialog');
  });

  it('ships the fixed copy verbatim', () => {
    const html = readFileSync(join(OUT_ON, 'index.html'), 'utf8');
    expect(html).toContain('Answers are AI-generated from this site. Chats are processed by Cloudflare and not stored or used for training.');
    expect(html).toContain('Chat is busy right now — use the contact form or WhatsApp.');
  });

  it('is only on the home page', () => {
    const others = ['blog/index.html', ...readdirSync(join(OUT_ON, 'projects')).map((s) => `projects/${s}/index.html`)];
    for (const p of others) if (existsSync(join(OUT_ON, p))) expect(page(OUT_ON, p).getElementById('chat-panel'), p).toBeNull();
  });

  it('keeps the chat UI code out of the initial page load', () => {
    const d = page(OUT_ON);
    const srcs = d.querySelectorAll('script[src]').map((s) => s.getAttribute('src')!);
    const external = srcs.map((s) => readFileSync(join(OUT_ON, s)));
    const inline = d.querySelectorAll('script:not([src])').map((s) => Buffer.from(s.text));
    const gz = [...external, ...inline].reduce((n, b) => n + gzipSync(b).length, 0);
    expect(gz).toBeLessThan(30 * 1024);
    for (const b of external) expect(b.toString()).not.toContain('chat-log');
    expect(readdirSync(join(OUT_ON, '_astro')).some((f) => f.startsWith('chat-ui') && f.endsWith('.js'))).toBe(true);
  });
});

describe('chat UI without an endpoint', () => {
  it('renders nothing chat-related', () => {
    const html = readFileSync(join(OUT_OFF, 'index.html'), 'utf8');
    expect(html).not.toMatch(/id="chat-/);
  });
});
