export const SAFE_FALLBACK = "I can't help with that one — please use the contact form and Resvan will reply directly. [[contact]]";

/** Case, width, whitespace, hyphens, dots and zero-width characters don't count when matching. */
const canonical = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[\s\u200b-\u200d\u2060\ufeff._-]+/g, '');

/**
 * Streams text through, holding back enough characters (twice the longest term, to allow for
 * separators inside it) that a blocked term split across chunks is still caught.
 * Once a term is seen, nothing more is released.
 */
export function createBlockedTermFilter(terms: string[]): { push(chunk: string): string; end(): string; readonly blocked: boolean } {
  const needles = terms.map(canonical).filter(Boolean);
  const hold = needles.length ? 2 * Math.max(...terms.map((t) => t.trim().length)) : 0;
  let buffer = '';
  let blocked = false;
  const check = () => {
    const flat = canonical(buffer);
    if (needles.some((t) => flat.includes(t))) { blocked = true; buffer = ''; }
  };
  return {
    push(chunk) {
      if (blocked) return '';
      buffer += chunk;
      check();
      if (blocked || buffer.length <= hold) return '';
      const out = buffer.slice(0, buffer.length - hold);
      buffer = buffer.slice(buffer.length - hold);
      return out;
    },
    end() {
      if (blocked) return '';
      const out = buffer;
      buffer = '';
      return out;
    },
    get blocked() { return blocked; },
  };
}
