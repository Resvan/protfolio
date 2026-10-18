import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { describe, expect, it } from 'vitest';

const built = existsSync('dist/index.html');
const html = () => parse(readFileSync('dist/index.html', 'utf8'));

describe.skipIf(!built)('dist/index.html', () => {
  it('has consistent identity metadata', () => {
    const d = html();
    const title = d.querySelector('title')!.text;
    expect(title.length).toBeLessThanOrEqual(60);
    expect(d.querySelector('meta[property="og:title"]')!.getAttribute('content')).toBe(title);
    expect(d.querySelector('meta[name="twitter:title"]')!.getAttribute('content')).toBe(title);
    expect(d.querySelector('link[rel="canonical"]')!.getAttribute('href')).toBe('https://resvan.in/');
    expect(d.querySelector('meta[property="og:image"]')!.getAttribute('content')).toMatch(/\.jpg$/);
    expect(d.querySelector('meta[name="google-site-verification"]')).not.toBeNull();
  });
  it('has exactly one h1 and no loader', () => {
    const d = html();
    expect(d.querySelectorAll('h1')).toHaveLength(1);
    expect(d.querySelector('#loader')).toBeNull();
    expect(d.toString()).not.toMatch(/jquery/i);
  });
  it('gives every target=_blank link rel noopener noreferrer and a name', () => {
    for (const a of html().querySelectorAll('a[target="_blank"]')) {
      expect(a.getAttribute('rel')).toContain('noopener');
      expect(a.getAttribute('rel')).toContain('noreferrer');
      expect((a.getAttribute('aria-label') ?? a.text).trim().length).toBeGreaterThan(0);
    }
  });
  it('posts the contact form even without JS (never GET with the message in the URL)', () => {
    const form = html().querySelector('form#contact-form')!;
    expect(form.getAttribute('method')?.toLowerCase()).toBe('post');
  });
  it('parses the JSON-LD graph', () => {
    const scripts = html().querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThanOrEqual(1);
    const data = JSON.parse(scripts[0].text);
    const types = data['@graph'].map((n: { '@type': string }) => n['@type']);
    expect(types).toEqual(expect.arrayContaining(['Person', 'WebSite', 'ProfilePage']));
  });
});

describe.skipIf(!built)('other output', () => {
  it('never links to a retired project site', () => {
    const home = readFileSync('dist/index.html', 'utf8');
    expect(home).not.toContain('href="https://landing.cleverpush.com/"');
    expect(home).toContain('No longer live');
  });
  it('builds a case study for every featured project', () => {
    for (const slug of ['meetxo', 'rentdigicare', 'ayurvedalayam']) expect(existsSync(`dist/projects/${slug}/index.html`)).toBe(true);
  });
  it('ships 404, manifest, CNAME and sitemap', () => {
    for (const f of ['dist/404.html', 'dist/manifest.webmanifest', 'dist/CNAME', 'dist/sitemap-index.xml', 'dist/sitemap-0.xml', 'dist/og/home.jpg']) {
      expect(existsSync(f), f).toBe(true);
    }
  });
  it('excludes /blog from the sitemap while there are no posts and sets lastmod', () => {
    const xml = readFileSync('dist/sitemap-0.xml', 'utf8');
    expect(xml).not.toContain('/blog');
    expect(xml).not.toContain('/404');
    expect(xml).toMatch(/<lastmod>20\d\d-/);
  });
  it('marks the empty blog index noindex', () => {
    const d = parse(readFileSync('dist/blog/index.html', 'utf8'));
    expect(d.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain('noindex');
  });
});
