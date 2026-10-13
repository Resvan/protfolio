import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('src/assets/logo.svg');
const out = [
  ['public/favicon-32.png', 32, 0],
  ['public/apple-touch-icon.png', 180, 0],
  ['public/icon-192.png', 192, 0],
  ['public/icon-512.png', 512, 0],
  ['public/icon-maskable-512.png', 512, 0.1], // 10% safe-zone padding on a solid bg
];
for (const [file, size, pad] of out) {
  const inner = Math.round(size * (1 - pad * 2));
  const icon = await sharp(svg).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#0f1113' } })
    .composite([{ input: icon, gravity: 'centre' }])
    .png()
    .toFile(file);
  console.log('wrote', file);
}
