import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderOg } from '../src/lib/og';

describe('renderOg', () => {
  it('renders a 1200x630 JPEG small enough for WhatsApp previews (<300 KB)', async () => {
    const jpg = Buffer.from(await renderOg({ title: 'Muhammed Resvan K', subtitle: 'Software Engineer | Kerala, India' }));
    const meta = await sharp(jpg).metadata();
    expect(meta).toMatchObject({ format: 'jpeg', width: 1200, height: 630 });
    expect(jpg.length).toBeLessThan(300 * 1024);
  }, 20000);
  it('includes the profile photo on the right', async () => {
    const img = Buffer.from(await renderOg({ title: 'Muhammed Resvan K', subtitle: 'Software Engineer | Kerala, India' }));
    // Shirt area of the photo card is bright; the plain background there would be near-black.
    const { data } = await sharp(img).extract({ left: 900, top: 470, width: 60, height: 40 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    expect(mean).toBeGreaterThan(150);
  }, 20000);
});
