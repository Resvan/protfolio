import { describe, expect, it } from 'vitest';
import { renderOg } from '../src/lib/og';

describe('renderOg', () => {
  it('renders a 1200x630 PNG', async () => {
    const png = Buffer.from(await renderOg({ title: 'Muhammed Resvan K', subtitle: 'Software Engineer | Kerala, India' }));
    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  }, 20000);
});
