export function buildWhatsAppUrl(
  number: string,
  fields: { name?: string; email?: string; message?: string },
): string {
  const lines = [`Hi Resvan, I'm ${fields.name?.trim() || '…'}.`];
  if (fields.message?.trim()) lines.push('', fields.message.trim());
  if (fields.email?.trim()) lines.push('', `Email: ${fields.email.trim()}`);
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;
}
