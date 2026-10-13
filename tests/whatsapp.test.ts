import { describe, expect, it } from 'vitest';
import { buildWhatsAppUrl } from '../src/lib/whatsapp';

describe('buildWhatsAppUrl', () => {
  it('builds a wa.me link with an encoded prefill', () => {
    const url = buildWhatsAppUrl('916238577673', { name: 'Ali', email: 'ali@x.io', message: 'Hi & hello' });
    expect(url.startsWith('https://wa.me/916238577673?text=')).toBe(true);
    const text = decodeURIComponent(url.split('text=')[1]);
    expect(text).toContain('Ali');
    expect(text).toContain('ali@x.io');
    expect(text).toContain('Hi & hello');
  });
  it('still works with empty fields', () => {
    const url = buildWhatsAppUrl('916238577673', {});
    expect(url).toMatch(/^https:\/\/wa\.me\/916238577673\?text=.+/);
  });
});
