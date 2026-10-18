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
  it('passes clean text through unchanged', () => {
    const { f, out } = run(['Acme Energy'], ['Resvan builds ', 'web and mobile apps.']);
    expect(f.blocked).toBe(false);
    expect(out).toBe('Resvan builds web and mobile apps.');
  });
  it('holds back only the last (longest term - 1) characters', () => {
    const f = createBlockedTermFilter(['abcd']);
    expect(f.push('123456')).toBe('123');
    expect(f.end()).toBe('456');
  });
  it('does nothing without terms', () => {
    const { out } = run([], ['hello ', 'world']);
    expect(out).toBe('hello world');
  });
  it('exposes a fallback that defers to the contact form', () => {
    expect(SAFE_FALLBACK).toContain('[[contact]]');
  });
});
