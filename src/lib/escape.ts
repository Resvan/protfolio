const MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escape a string for safe interpolation into HTML text or attribute values. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => MAP[c]);
}
