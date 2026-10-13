import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('scaffold', () => {
  it('keeps the Search Console file and CNAME in public/', () => {
    expect(readFileSync('public/CNAME', 'utf8').trim()).toBe('resvan.in');
    expect(readFileSync('public/googledef350d25cac39af.html', 'utf8')).toContain('google-site-verification');
  });
  it('defines every design token for both themes', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    for (const t of ['--bg', '--surface', '--surface-2', '--text', '--muted', '--accent', '--accent-fg', '--border']) {
      expect(css.match(new RegExp(`${t}:`, 'g'))?.length).toBe(2);
    }
  });
  it('old jQuery-era files are gone', () => {
    for (const f of ['index.html', 'style.css', 'script.js', 'Validate-Form.js']) expect(existsSync(f), f).toBe(false);
  });
});

describe('deploy workflow', () => {
  it('builds before running tests so the dist assertions execute in CI', () => {
    const yml = readFileSync('.github/workflows/deploy.yml', 'utf8');
    const build = yml.indexOf('npm run build');
    const test = yml.indexOf('npm test');
    expect(build).toBeGreaterThan(-1);
    expect(test).toBeGreaterThan(build);
  });
});
