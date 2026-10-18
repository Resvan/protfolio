import { describe, expect, it } from 'vitest';
import { validateEmail, validateMessage, validateName, validatePhone } from '../src/lib/validation';

describe('validateName', () => {
  it('accepts short, accented, apostrophe and non-Latin names', () => {
    for (const n of ['Ali', "Zoë O'Brien", 'محمد رضوان', 'Jean-Luc', '李雷']) expect(validateName(n)).toBeNull();
  });
  it('rejects empty, 1 char, >60 chars, digits', () => {
    expect(validateName('')).not.toBeNull();
    expect(validateName('A')).not.toBeNull();
    expect(validateName('a'.repeat(61))).not.toBeNull();
    expect(validateName('R2D2')).not.toBeNull();
  });
});

describe('validateEmail', () => {
  it('accepts normal addresses and rejects junk', () => {
    expect(validateEmail('a@b.co')).toBeNull();
    expect(validateEmail('first.last+tag@sub.example.org')).toBeNull();
    expect(validateEmail('nope')).not.toBeNull();
    expect(validateEmail('a@b')).not.toBeNull();
  });
});

describe('validatePhone', () => {
  it('is optional and international friendly', () => {
    expect(validatePhone('')).toBeNull();
    expect(validatePhone('+31 6 1234 5678')).toBeNull();
    expect(validatePhone('+91 62385 77673')).toBeNull();
    expect(validatePhone('(020) 123-4567')).toBeNull();
    expect(validatePhone('12345')).not.toBeNull();
    expect(validatePhone('1234567890123456')).not.toBeNull();
    expect(validatePhone('abc')).not.toBeNull();
  });
});

describe('validateMessage', () => {
  it('enforces 10 to 2000 chars after trimming', () => {
    expect(validateMessage('short')).not.toBeNull();
    expect(validateMessage('this is ok ')).toBeNull();
    expect(validateMessage('x'.repeat(2001))).not.toBeNull();
  });
  it('rejects links but allows bare domain mentions', () => {
    expect(validateMessage('Earn money https://telegra.ph/x today')).toMatch(/links/i);
    expect(validateMessage('visit www.spam.io please')).toMatch(/links/i);
    expect(validateMessage('I saw your site resvan.in, nice work.')).toBeNull();
  });
});
