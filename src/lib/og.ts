import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Resolved from the project root: at build time this module is bundled under dist/.prerender,
// so import.meta.url would not point at src/.
const fontDir = join(process.cwd(), 'src/assets/fonts');
let fonts: { name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[] | null = null;
async function loadFonts() {
  fonts ??= [
    { name: 'Inter', data: await readFile(join(fontDir, 'Inter-Regular.ttf')), weight: 400, style: 'normal' },
    { name: 'Inter', data: await readFile(join(fontDir, 'Inter-Bold.ttf')), weight: 700, style: 'normal' },
  ];
  return fonts;
}

const h = (type: string, props: Record<string, unknown>, ...children: unknown[]) => ({ type, props: { ...props, children } });

export async function renderOg({ title, subtitle }: { title: string; subtitle: string }): Promise<Uint8Array> {
  const svg = await satori(
    h('div', { style: { width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'linear-gradient(135deg,#0a0a0b 0%,#15161a 100%)', color: '#ededf0', fontFamily: 'Inter' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, color: '#7aaaff', fontWeight: 700 } },
        h('div', { style: { width: 44, height: 44, borderRadius: 10, background: '#7aaaff', color: '#0a0a0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 } }, 'R'),
        'resvan.in'),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
        h('div', { style: { fontSize: title.length > 40 ? 56 : 72, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 } }, title),
        h('div', { style: { fontSize: 32, color: '#9a9ba3' } }, subtitle)),
      h('div', { style: { fontSize: 24, color: '#9a9ba3' } }, 'Software Engineer · Kerala, India · open to remote')),
    { width: 1200, height: 630, fonts: await loadFonts() },
  );
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
