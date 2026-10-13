const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateName(value: string): string | null {
  const v = value.trim();
  if (v.length < 2) return 'Please enter at least 2 characters.';
  if (v.length > 60) return 'Please keep your name under 60 characters.';
  if (!NAME_RE.test(v)) return 'Please use letters only.';
  return null;
}

export function validateEmail(value: string): string | null {
  return EMAIL_RE.test(value.trim()) ? null : 'Please enter a valid email address.';
}

export function validatePhone(value: string): string | null {
  const v = value.trim();
  if (v === '') return null;
  if (!/^\+?[\d\s().-]+$/.test(v)) return 'Please use digits, spaces, +, ( ) or -.';
  const digits = v.replace(/\D/g, '').length;
  if (digits < 7 || digits > 15) return 'Please enter 7 to 15 digits.';
  return null;
}

export function validateMessage(value: string): string | null {
  const len = value.trim().length;
  if (len < 10) return 'Please write at least 10 characters.';
  if (len > 2000) return 'Please keep it under 2000 characters.';
  return null;
}

export const MESSAGE_MAX = 2000;
