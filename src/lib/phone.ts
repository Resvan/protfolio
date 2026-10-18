import { COUNTRY_CODES, KEEP_LEADING_ZERO, SUGGESTED, TIME_ZONES } from '../data/countries';

export { SUGGESTED };
export interface Country { iso: string; dial: string; name: string }

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
export const COUNTRIES: Country[] = COUNTRY_CODES.map(([iso, dial]) => ({ iso, dial, name: regionNames.of(iso) ?? iso }));
const byIso = new Map(COUNTRIES.map((c) => [c.iso, c]));

export const DEFAULT_COUNTRY = 'IN';

export function findCountry(iso: string): Country | undefined {
  return byIso.get(iso);
}

export function countryFromTimeZone(tz: string | undefined): string {
  return (tz && TIME_ZONES[tz]) || DEFAULT_COUNTRY;
}

const byName = (a: Country, b: Country) => a.name.localeCompare(b.name);

/** Suggested countries in priority order, then the rest A–Z. */
export function orderedCountries(): { suggested: Country[]; rest: Country[] } {
  return {
    suggested: SUGGESTED.map((iso) => byIso.get(iso)!),
    rest: COUNTRIES.filter((c) => !SUGGESTED.includes(c.iso)).sort(byName),
  };
}

/** Name prefix, word prefix, ISO code or dial-code prefix; name-prefix matches first. */
export function searchCountries(query: string): Country[] {
  const q = query.trim().toLowerCase().replace(/^\+/, '');
  if (!q) return [...COUNTRIES];
  const digits = /^[\d ]+$/.test(q);
  const score = (c: Country) => {
    if (digits) return c.dial.replace(' ', '').startsWith(q.replace(/ /g, '')) ? (c.dial === q ? 0 : 1) : -1;
    const name = c.name.toLowerCase();
    if (name.startsWith(q)) return 0;
    if (c.iso.toLowerCase() === q) return 1;
    if (name.split(/[\s-]+/).some((w) => w.startsWith(q))) return 2;
    return -1;
  };
  return COUNTRIES.map((c) => ({ c, s: score(c) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s || byName(a.c, b.c))
    .map((x) => x.c);
}

/** "+<dial> <number>", dropping a trunk 0. Empty when nothing was typed; a pasted "+…" number is kept as is. */
export function formatPhone(iso: string, local: string): string {
  const v = local.trim();
  if (!v) return '';
  if (v.startsWith('+')) return v;
  const country = byIso.get(iso) ?? byIso.get(DEFAULT_COUNTRY)!;
  const number = KEEP_LEADING_ZERO.includes(country.iso) ? v : v.replace(/^0+\s*/, '');
  return `+${country.dial} ${number}`;
}
