import { describe, expect, it } from 'vitest';
import { SAFE_FALLBACK, createBlockedTermFilter } from '../src/filter';

const run = (terms: string[], chunks: string[]) => {
  const f = createBlockedTermFilter(terms);
  const out = chunks.map((c) => f.push(c)).join('') + f.end();
  return { f, out };
};

describe('createBlockedTermFilter', () => {
  it('catches a term split across chunks', () => {
    const { f, out } = run(['Acme Energy'], ['We built ', 'for Acme En', 'ergy today']);
    expect(f.blocked).toBe(true);
    expect(out).not.toMatch(/acme|energy/i);
  });
  it('is case-insensitive', () => {
    expect(run(['Acme Energy'], ['works with acme energy']).f.blocked).toBe(true);
  });
  it('catches spacing, hyphen, zero-width and run-together variants', () => {
    for (const chunks of [['Acme\nEnergy'], ['Acme  ', 'Energy'], ['Acme-Energy'], ['AcmeEnergy'], ['Acme\u200bEnergy'], ['Ａｃｍｅ Energy']]) {
      const { f, out } = run(['Acme Energy'], ['It is for ', ...chunks, ' today.']);
      expect(f.blocked, JSON.stringify(chunks)).toBe(true);
      expect(out).not.toMatch(/acme|ａｃｍｅ/i);
    }
  });
  it('passes clean text through unchanged', () => {
    const { f, out } = run(['Acme Energy'], ['Resvan builds ', 'web and mobile apps.']);
    expect(f.blocked).toBe(false);
    expect(out).toBe('Resvan builds web and mobile apps.');
  });
  it('holds back twice the longest term length', () => {
    const f = createBlockedTermFilter(['abcd']);
    expect(f.push('1234567890')).toBe('12');
    expect(f.end()).toBe('34567890');
  });
  it('does nothing without terms', () => {
    const { out } = run([], ['hello ', 'world']);
    expect(out).toBe('hello world');
  });
  it('exposes a fallback that defers to the contact form', () => {
    expect(SAFE_FALLBACK).toContain('[[contact]]');
  });
});
