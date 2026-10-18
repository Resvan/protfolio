import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COUNTRIES, SUGGESTED, countryFromTimeZone, findCountry, formatPhone, orderedCountries, searchCountries } from '../src/lib/phone';

describe('country data', () => {
  it('has unique ISO codes, numeric dial codes and a flag for every country', () => {
    const isos = COUNTRIES.map((c) => c.iso);
    expect(new Set(isos).size).toBe(isos.length);
    for (const c of COUNTRIES) {
      expect(c.dial).toMatch(/^\d{1,3}( \d{3})?$/);
      expect(existsSync(`node_modules/flag-icons/flags/4x3/${c.iso.toLowerCase()}.svg`), c.iso).toBe(true);
    }
  });
  it('knows the priority countries', () => {
    expect(findCountry('IN')).toMatchObject({ dial: '91', name: 'India' });
    expect(findCountry('AE')).toMatchObject({ dial: '971', name: 'United Arab Emirates' });
    expect(SUGGESTED.slice(0, 7)).toEqual(['IN', 'AE', 'SA', 'QA', 'KW', 'OM', 'BH']);
  });
});

describe('countryFromTimeZone', () => {
  it('maps common zones to countries', () => {
    expect(countryFromTimeZone('Asia/Kolkata')).toBe('IN');
    expect(countryFromTimeZone('Asia/Calcutta')).toBe('IN');
    expect(countryFromTimeZone('Asia/Dubai')).toBe('AE');
    expect(countryFromTimeZone('Asia/Riyadh')).toBe('SA');
    expect(countryFromTimeZone('Europe/Amsterdam')).toBe('NL');
    expect(countryFromTimeZone('America/New_York')).toBe('US');
  });
  it('falls back to India for unknown or missing zones', () => {
    expect(countryFromTimeZone('Mars/Olympus')).toBe('IN');
    expect(countryFromTimeZone(undefined)).toBe('IN');
  });
});

describe('orderedCountries', () => {
  it('puts suggested first, then everything else A to Z without duplicates', () => {
    const { suggested, rest } = orderedCountries();
    expect(suggested.map((c) => c.iso)).toEqual(SUGGESTED);
    expect(rest.some((c) => SUGGESTED.includes(c.iso))).toBe(false);
    const names = rest.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(suggested.length + rest.length).toBe(COUNTRIES.length);
  });
});

describe('searchCountries', () => {
  it('matches by name, ISO code and dial code', () => {
    expect(searchCountries('qat').map((c) => c.iso)).toEqual(['QA']);
    expect(searchCountries('974').map((c) => c.iso)).toEqual(['QA']);
    expect(searchCountries('+971').map((c) => c.iso)).toEqual(['AE']);
    expect(searchCountries('qa').map((c) => c.iso)).toContain('QA');
  });
  it('puts name-prefix matches first', () => {
    expect(searchCountries('ind')[0].iso).toBe('IN');
  });
  it('returns everything for an empty query', () => {
    expect(searchCountries('  ')).toHaveLength(COUNTRIES.length);
  });
});

describe('formatPhone', () => {
  it('prefixes the dial code and drops a leading trunk 0', () => {
    expect(formatPhone('IN', '98765 43210')).toBe('+91 98765 43210');
    expect(formatPhone('AE', '050 123 4567')).toBe('+971 50 123 4567');
    expect(formatPhone('JM', '555 1234')).toBe('+1 876 555 1234');
  });
  it('keeps the leading 0 where it is part of the number (Italy)', () => {
    expect(formatPhone('IT', '06 1234 5678')).toBe('+39 06 1234 5678');
  });
  it('is empty when no number was typed', () => {
    expect(formatPhone('IN', '   ')).toBe('');
  });
  it('keeps a pasted international number as typed', () => {
    expect(formatPhone('IN', '+31 6 1234 5678')).toBe('+31 6 1234 5678');
  });
});
