import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../src/lib/escape';

describe('escapeHtml', () => {
  it('neutralises markup from untrusted strings', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(escapeHtml('a & "b" \'c\'')).toBe('a &amp; &quot;b&quot; &#39;c&#39;');
    expect(escapeHtml('plain')).toBe('plain');
  });
});
