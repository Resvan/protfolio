export const SAFE_FALLBACK = "I can't help with that one — please use the contact form and Resvan will reply directly. [[contact]]";

/**
 * Streams text through, holding back the last (longest term - 1) characters so a blocked
 * term split across chunks is still caught. Once a term is seen, nothing more is released.
 */
export function createBlockedTermFilter(terms: string[]): { push(chunk: string): string; end(): string; readonly blocked: boolean } {
  const needles = terms.map((t) => t.trim().toLowerCase()).filter(Boolean);
  const hold = needles.length ? Math.max(...needles.map((t) => t.length)) - 1 : 0;
  let buffer = '';
  let blocked = false;
  const check = () => {
    const lower = buffer.toLowerCase();
    if (needles.some((t) => lower.includes(t))) { blocked = true; buffer = ''; }
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
