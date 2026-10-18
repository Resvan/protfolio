import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

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

// Chest-up crop shown on the right of every preview card (744x930, 2x the card size).
let photo: string | null = null;
async function loadPhoto() {
  photo ??= `data:image/jpeg;base64,${(await readFile(join(process.cwd(), 'src/assets/resvan-og.jpg'))).toString('base64')}`;
  return photo;
}

const h = (type: string, props: Record<string, unknown>, ...children: unknown[]) => ({ type, props: { ...props, children } });

export async function renderOg({ title, subtitle }: { title: string; subtitle: string }): Promise<Uint8Array> {
  const svg = await satori(
    h('div', { style: { width: 1200, height: 630, display: 'flex', position: 'relative', paddingLeft: 72, alignItems: 'center', background: 'linear-gradient(135deg,#0a0a0b 0%,#15161a 100%)', color: '#ededf0', fontFamily: 'Inter' } },
      h('div', { style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 640, height: 486 } },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, color: '#7aaaff', fontWeight: 700 } },
          h('div', { style: { width: 44, height: 44, borderRadius: 10, background: '#7aaaff', color: '#0a0a0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 } }, 'R'),
          'resvan.in'),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
          h('div', { style: { fontSize: title.length > 20 ? 52 : 60, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 } }, title),
          h('div', { style: { fontSize: 32, color: '#9a9ba3' } }, subtitle)),
        h('div', { style: { fontSize: 24, color: '#9a9ba3' } }, 'React · Next.js · React Native · Node.js')),
      // Satori ignores `right` here, so the card is anchored from the left: 1200 - 72 margin - 372 width.
      h('img', { src: await loadPhoto(), width: 372, height: 465, style: { position: 'absolute', left: 756, top: 82, width: 372, height: 465, borderRadius: 28, border: '1px solid #2a2b31', objectFit: 'cover' } })),
    { width: 1200, height: 630, fonts: await loadFonts() },
  );
  // JPEG keeps the photo card well under WhatsApp's ~300 KB preview limit (the PNG was ~300 KB).
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return sharp(png).flatten({ background: '#0a0a0b' }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
}
