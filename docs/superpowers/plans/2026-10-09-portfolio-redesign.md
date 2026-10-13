# resvan.in Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the jQuery static site with an Astro 7 + Tailwind 4 static portfolio deployed to GitHub Pages at https://resvan.in, with a free email + WhatsApp + Sheet contact pipeline.

**Architecture:** Astro static output, all content in typed `src/data/*.ts`, three tiny vanilla scripts (header, theme, contact form) plus a reveal observer. Build-time OG PNGs via satori + resvg. Backend is one Google Apps Script web app.

**Tech Stack:** Astro ^7.3.8, @astrojs/sitemap ^3.7.4, Tailwind ^4.3.3 via @tailwindcss/vite, Astro Fonts API (fontsource provider), astro-icon ^1.2.0 + @iconify-json/lucide + @iconify-json/simple-icons, satori ^0.44.3, @resvg/resvg-js ^2.6.2, sharp ^0.35.5, vitest ^5, node-html-parser ^9, TypeScript ^5.9.3. Node ≥ 22.12 (local is 26.7).

**Spec:** `docs/superpowers/specs/2026-10-09-portfolio-redesign-design.md`

## Global Constraints

- Branch `redesign`. Never push or deploy. One commit per task, message style `type: summary`, trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Site URL `https://resvan.in`. Title `Muhammed Resvan K — Software Engineer | Kerala, India` (≤60). Description `Software Engineer in Kerala, India building fast, accessible web and mobile apps with React, Next.js, React Native and Node.js. Open to remote work.` (≤155).
- Identity strings come only from `src/data/site.ts`. No other file hard-codes name, title, email, phone, socials, or GA id.
- Never invent achievements, metrics, clients. Placeholder text must start with `TODO:`.
- No client-side framework. First-party JS on `/` < 30 KB gzipped. No loader. No content hidden without JS.
- Every external link: `target="_blank" rel="noopener noreferrer"` and a text or `aria-label` name.
- Astro 7 Rust compiler: every non-void tag must be closed; no `<div>` inside `<p>`. `compressHTML: true` is set to keep inline whitespace.
- Keep `public/googledef350d25cac39af.html` and the `google-site-verification` meta tag.
- Tailwind color utilities use the token names defined in Task 1 (`bg-bg`, `bg-surface`, `bg-surface-2`, `text-fg`, `text-muted`, `text-accent`, `text-accent-fg`, `border-line`). Do not use raw hex in components.

## Review Focus

Inputs the spec implies but doesn't spell out; each has a test in the owning task.

1. Name with non-Latin letters or an apostrophe ("Zoë O'Brien", "محمد") must pass client and server validation → Task 2 + Task 9 tests.
2. Phone `+31 6 1234 5678` (spaces, plus) passes; `12345` (6 digits) fails; empty passes → Task 2 + Task 9 tests.
3. A Sheet cell starting with `=`, `+`, `-`, `@` is stored as text, never a formula → Task 9 test on `safeCell`.
4. Apps Script response that is not JSON (HTML error page from a redirect) must produce the error state, not success → Task 8 test on `parseEndpointResponse`.
5. Zero blog posts: `/blog` builds, has `noindex`, and is absent from `sitemap-0.xml` → Task 10 dist test.

---

### Task 1: Scaffold Astro project, tokens, public files

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.env.example`, `src/styles/global.css`, `src/layouts/BaseLayout.astro` (minimal, replaced in Task 3), `src/pages/index.astro` (placeholder, replaced in Task 5), `src/env.d.ts`
- Move: `CNAME` → `public/CNAME`; `googledef350d25cac39af.html` → `public/googledef350d25cac39af.html`; `robots.txt` → `public/robots.txt`; `Images/resvan.JPG` → `src/assets/resvan.jpg`; `Images/avatar.png` → `src/assets/avatar.png`
- Delete: `sitemap.xml`, `manifest.json` (replaced in Task 3), `Images/`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: CSS token names (`--bg`, `--surface`, `--surface-2`, `--text`, `--muted`, `--accent`, `--accent-fg`, `--border`), Tailwind color names listed in Global Constraints, font variables `--font-inter-tight` / `--font-inter`, Tailwind `font-display` / `font-body`, the `.container` and `.reveal` classes, and `import.meta.env.PUBLIC_CONTACT_ENDPOINT`.

- [ ] **Step 1: Write package.json**

```json
{
  "name": "resvan.in",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "icons": "node scripts/generate-icons.mjs",
    "screenshots": "bash scripts/screenshots.sh"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.7.4",
    "astro": "^7.3.8",
    "astro-icon": "^1.2.0",
    "sharp": "^0.35.5"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.10",
    "@iconify-json/lucide": "^1.2.142",
    "@iconify-json/simple-icons": "^1.2.99",
    "@resvg/resvg-js": "^2.6.2",
    "@tailwindcss/vite": "^4.3.3",
    "node-html-parser": "^9.0.4",
    "satori": "^0.44.3",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.9.3",
    "vitest": "^5.0.3"
  }
}
```

- [ ] **Step 2: Write config files**

`astro.config.mjs`:
```js
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';
import { existsSync, readdirSync } from 'node:fs';

const blogDir = 'src/content/blog';
const hasPosts =
  existsSync(blogDir) && readdirSync(blogDir).some((f) => /\.(md|mdx)$/.test(f));
const buildDate = new Date().toISOString();

export default defineConfig({
  site: 'https://resvan.in',
  output: 'static',
  trailingSlash: 'ignore',
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
  vite: { plugins: [tailwindcss()] },
  fonts: [
    {
      name: 'Inter Tight',
      cssVariable: '--font-inter-tight',
      provider: fontProviders.fontsource(),
      weights: ['500 800'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.fontsource(),
      weights: ['400 600'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
  ],
  integrations: [
    icon({ include: { lucide: ['*'], 'simple-icons': ['github', 'linkedin', 'instagram', 'whatsapp'] } }),
    sitemap({
      filter: (page) => (hasPosts || !page.includes('/blog')) && !page.includes('/404'),
      serialize: (item) => ({ ...item, lastmod: buildDate }),
    }),
  ],
});
```
If the build fails resolving a fontsource font, switch that entry's provider to `fontProviders.google()` and keep everything else.

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } });
```

`src/env.d.ts`:
```ts
interface ImportMetaEnv {
  readonly PUBLIC_CONTACT_ENDPOINT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

`.gitignore`:
```
node_modules
dist
.astro
.env
.env.*
!.env.example
.DS_Store
```

`.env.example`:
```
# Google Apps Script web app URL (see apps-script/README.md). Leave empty locally to test the fallback state.
PUBLIC_CONTACT_ENDPOINT=
```

- [ ] **Step 3: Write global.css with tokens**

`src/styles/global.css`:
```css
@import 'tailwindcss';

:root {
  --bg: #0f1113;
  --surface: #181a1b;
  --surface-2: #22262a;
  --text: #e6ecf7;
  --muted: #9aa5c0;
  --accent: #5d9ce2;
  --accent-fg: #0b1220;
  --border: #2b3036;
  --step--1: clamp(0.83rem, 0.8rem + 0.15vw, 0.94rem);
  --step-0: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --step-1: clamp(1.2rem, 1.1rem + 0.5vw, 1.4rem);
  --step-2: clamp(1.44rem, 1.25rem + 0.9vw, 1.9rem);
  --step-3: clamp(1.73rem, 1.4rem + 1.6vw, 2.6rem);
  --step-4: clamp(2.07rem, 1.5rem + 2.8vw, 3.6rem);
  --step-5: clamp(2.5rem, 1.6rem + 4.5vw, 5rem);
  color-scheme: dark;
}
:root[data-theme='light'] {
  --bg: #f7f8fa;
  --surface: #ffffff;
  --surface-2: #eef1f5;
  --text: #171a21;
  --muted: #4f5a73;
  --accent: #2667c9;
  --accent-fg: #ffffff;
  --border: #d9dee7;
  color-scheme: light;
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-fg: var(--text);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-accent-fg: var(--accent-fg);
  --color-line: var(--border);
  --font-display: var(--font-inter-tight);
  --font-body: var(--font-inter);
  --text-step--1: var(--step--1);
  --text-step-0: var(--step-0);
  --text-step-1: var(--step-1);
  --text-step-2: var(--step-2);
  --text-step-3: var(--step-3);
  --text-step-4: var(--step-4);
  --text-step-5: var(--step-5);
}

@layer base {
  html { scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    font-size: var(--step-0);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    overflow-x: clip;
  }
  h1, h2, h3 {
    font-family: var(--font-display);
    line-height: 1.15;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }
  ::selection { background: var(--accent); color: var(--accent-fg); }
  [hidden] { display: none !important; }
}

@utility container {
  width: 100%;
  max-width: 72rem;
  margin-inline: auto;
  padding-inline: 1rem;
  @media (min-width: 640px) { padding-inline: 1.5rem; }
}

/* Reveal: visible by default. reveal.ts adds .reveal-ready to <html> only when
   IntersectionObserver exists and prefers-reduced-motion is not "reduce". */
.reveal-ready .reveal {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.reveal-ready .reveal.in-view { opacity: 1; transform: none; }
```

- [ ] **Step 4: Minimal layout and page**

`src/layouts/BaseLayout.astro` (temporary; Task 3 replaces it):
```astro
---
import '../styles/global.css';
import { Font } from 'astro:assets';
---
<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Scaffold</title>
    <Font cssVariable="--font-inter-tight" preload />
    <Font cssVariable="--font-inter" preload />
  </head>
  <body class="bg-bg text-fg font-body"><slot /></body>
</html>
```

`src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout><main class="container"><h1 class="font-display text-step-4">Scaffold</h1></main></BaseLayout>
```

- [ ] **Step 5: Move public files and assets**

```bash
mkdir -p public src/assets
git mv CNAME public/CNAME
git mv googledef350d25cac39af.html public/googledef350d25cac39af.html
git mv robots.txt public/robots.txt
git mv Images/resvan.JPG src/assets/resvan-original.jpg
git mv Images/avatar.png src/assets/avatar.png
git rm -q sitemap.xml manifest.json
npm install
node -e "require('sharp')('src/assets/resvan-original.jpg').rotate().resize({width:1600,withoutEnlargement:true}).jpeg({quality:88,mozjpeg:true}).toFile('src/assets/resvan.jpg').then(()=>console.log('ok'))"
git rm -q --cached src/assets/resvan-original.jpg && rm src/assets/resvan-original.jpg
```
`public/robots.txt` content:
```
User-agent: *
Allow: /

Sitemap: https://resvan.in/sitemap-index.xml
```

- [ ] **Step 6: Write the smoke test**

`tests/smoke.test.ts`:
```ts
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
  it('has no root-level jQuery files once migrated (Task 11 flips this)', () => {
    expect(existsSync('Validate-Form.js')).toBe(true);
  });
});
```

- [ ] **Step 7: Run build and tests**

Run: `npm run build && npm test`
Expected: `dist/index.html` exists, `dist/CNAME` exists, `dist/_astro/fonts/` contains woff2 files, tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro 7 + Tailwind 4 with design tokens and public files"
```

---

### Task 2: Typed data and pure logic libraries

**Files:**
- Create: `src/data/site.ts`, `src/data/skills.ts`, `src/data/services.ts`, `src/data/experience.ts`, `src/data/projects.ts`, `src/lib/validation.ts`, `src/lib/whatsapp.ts`, `src/lib/project-images.ts`
- Test: `tests/data.test.ts`, `tests/validation.test.ts`, `tests/whatsapp.test.ts`

**Interfaces:**
- Produces: `site` object; `skillGroups: SkillGroup[]`; `services: Service[]`; `experience: Job[]`; `projects: Project[]`; `validateName/validateEmail/validatePhone/validateMessage(value: string): string | null` (null = valid); `buildWhatsAppUrl(number: string, fields: { name?: string; email?: string; message?: string }): string`; `getProjectImage(slug: string): ImageMetadata`.

- [ ] **Step 1: Write failing tests**

`tests/validation.test.ts`:
```ts
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
});
```

`tests/whatsapp.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { buildWhatsAppUrl } from '../src/lib/whatsapp';

describe('buildWhatsAppUrl', () => {
  it('builds a wa.me link with an encoded prefill', () => {
    const url = buildWhatsAppUrl('916238577673', { name: 'Ali', email: 'ali@x.io', message: 'Hi & hello' });
    expect(url.startsWith('https://wa.me/916238577673?text=')).toBe(true);
    const text = decodeURIComponent(url.split('text=')[1]);
    expect(text).toContain('Ali');
    expect(text).toContain('ali@x.io');
    expect(text).toContain('Hi & hello');
  });
  it('still works with empty fields', () => {
    const url = buildWhatsAppUrl('916238577673', {});
    expect(url).toMatch(/^https:\/\/wa\.me\/916238577673\?text=.+/);
  });
});
```

`tests/data.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { site } from '../src/data/site';
import { projects } from '../src/data/projects';
import { experience } from '../src/data/experience';
import { skillGroups } from '../src/data/skills';
import { services } from '../src/data/services';

describe('site identity', () => {
  it('fits SEO length limits', () => {
    expect(site.title.length).toBeLessThanOrEqual(60);
    expect(site.description.length).toBeLessThanOrEqual(155);
    expect(site.url).toBe('https://resvan.in');
  });
});

describe('projects', () => {
  it('has 8 projects, 3 featured, unique slugs, https links', () => {
    expect(projects).toHaveLength(8);
    expect(projects.filter((p) => p.featured)).toHaveLength(3);
    expect(new Set(projects.map((p) => p.slug)).size).toBe(8);
    for (const p of projects) expect(p.url).toMatch(/^https:\/\//);
  });
  it('fixes the Xylothia link', () => {
    expect(projects.find((p) => p.slug === 'xylothia')?.url).toBe('https://xylothia.vercel.app/');
  });
});

describe('experience', () => {
  it('is newest first with Salesdock current', () => {
    expect(experience[0].company).toBe('Salesdock');
    expect(experience[0].end).toBeNull();
    expect(experience.map((j) => j.company)).toEqual([
      'Salesdock', 'CleverPush', 'Hawr Technologies', 'Adam Technologies', 'Duple IT Solutions', 'Brocamp (Brototype)',
    ]);
  });
  it('has 2-3 highlights per job', () => {
    for (const j of experience) expect(j.highlights.length).toBeGreaterThanOrEqual(2);
  });
});

describe('skills and services', () => {
  it('has the five groups and three services', () => {
    expect(skillGroups.map((g) => g.name)).toEqual(['Frontend', 'Mobile', 'Backend', 'Data', 'Tools']);
    expect(services).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write the libraries**

`src/lib/validation.ts`:
```ts
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
```

`src/lib/whatsapp.ts`:
```ts
export function buildWhatsAppUrl(
  number: string,
  fields: { name?: string; email?: string; message?: string },
): string {
  const lines = [`Hi Resvan, I'm ${fields.name?.trim() || '…'}.`];
  if (fields.message?.trim()) lines.push('', fields.message.trim());
  if (fields.email?.trim()) lines.push('', `Email: ${fields.email.trim()}`);
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;
}
```

`src/lib/project-images.ts`:
```ts
import type { ImageMetadata } from 'astro';
import placeholder from '../assets/projects/placeholder.svg';

const images = import.meta.glob<{ default: ImageMetadata }>('../assets/projects/*.{png,jpg,jpeg,webp}', {
  eager: true,
});

/** Convention: drop `src/assets/projects/<slug>.png` to replace the placeholder. */
export function getProjectImage(slug: string): ImageMetadata {
  for (const [path, mod] of Object.entries(images)) {
    if (path.replace(/^.*\//, '').replace(/\.[^.]+$/, '') === slug) return mod.default;
  }
  return placeholder;
}
```

Create `src/assets/projects/placeholder.svg` (1200×750):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750" role="img" aria-label="Screenshot placeholder">
  <rect width="1200" height="750" fill="#181a1b"/>
  <rect x="40" y="40" width="1120" height="670" rx="24" fill="#22262a" stroke="#2b3036" stroke-width="2"/>
  <circle cx="84" cy="84" r="8" fill="#5d9ce2"/><circle cx="112" cy="84" r="8" fill="#2b3036"/><circle cx="140" cy="84" r="8" fill="#2b3036"/>
  <text x="600" y="395" text-anchor="middle" font-family="sans-serif" font-size="36" fill="#9aa5c0">Screenshot coming soon</text>
</svg>
```

- [ ] **Step 4: Write the data files**

`src/data/site.ts`:
```ts
export const site = {
  url: 'https://resvan.in',
  name: 'Muhammed Resvan K',
  alternateName: 'Resvan',
  jobTitle: 'Software Engineer',
  title: 'Muhammed Resvan K — Software Engineer | Kerala, India',
  description:
    'Software Engineer in Kerala, India building fast, accessible web and mobile apps with React, Next.js, React Native and Node.js. Open to remote work.',
  tagline: 'Software Engineer building fast, accessible web & mobile products — currently at Salesdock.',
  locationLine: 'Kerala, India · open to remote',
  availableForFreelance: true,
  employer: { name: 'Salesdock', url: 'https://salesdock.com/' },
  address: { locality: 'Malappuram', region: 'Kerala', country: 'IN' },
  email: 'muhammedresvan@gmail.com',
  whatsapp: '916238577673',
  whatsappDisplay: '+91 62385 77673',
  socials: {
    github: 'https://github.com/Resvan',
    linkedin: 'https://www.linkedin.com/in/muhammed-resvan-k/',
    instagram: 'https://www.instagram.com/rsv_n.__k/',
  },
  analyticsId: 'G-SMPFVLGNW2',
  themeColor: { dark: '#0f1113', light: '#f7f8fa' },
} as const;
```

`src/data/skills.ts`:
```ts
export interface SkillGroup { name: string; items: string[] }
export const skillGroups: SkillGroup[] = [
  { name: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'] },
  { name: 'Mobile', items: ['React Native', 'Flutter'] },
  { name: 'Backend', items: ['Node.js', 'Express', 'WebSockets'] },
  { name: 'Data', items: ['MongoDB', 'ArangoDB', 'Redis'] },
  { name: 'Tools', items: ['Git', 'AWS EC2', 'Vercel'] },
];
```

`src/data/services.ts`:
```ts
export interface Service { title: string; summary: string; youGet: string[]; icon: string }
export const services: Service[] = [
  {
    title: 'Web apps',
    icon: 'lucide:layout-dashboard',
    summary: 'Dashboards, portals and SaaS front ends built with React, Next.js and Node.js.',
    youGet: ['Typed, tested codebase you own', 'Responsive and accessible UI', 'Deployment and handover notes'],
  },
  {
    title: 'Mobile apps',
    icon: 'lucide:smartphone',
    summary: 'Cross-platform iOS and Android apps with React Native or Flutter, backed by your API.',
    youGet: ['One codebase for both stores', 'Offline-friendly data handling', 'Store submission support'],
  },
  {
    title: 'Landing pages & SEO',
    icon: 'lucide:rocket',
    summary: 'Fast static marketing sites that score well on Lighthouse and rank for what you do.',
    youGet: ['Sub-second loads, 95+ Lighthouse', 'Structured data and metadata done right', 'CMS hookup if you need it'],
  },
];
```

`src/data/experience.ts`:
```ts
export interface Job {
  company: string;
  url: string | null;
  title: string;
  start: string; // YYYY-MM
  end: string | null; // null = present
  note?: string;
  highlights: string[];
}
export const experience: Job[] = [
  {
    company: 'Salesdock', url: 'https://salesdock.com/', title: 'Software Developer L2', start: '2025-02', end: null,
    highlights: ['TODO: biggest thing you shipped at Salesdock', 'TODO: a measurable improvement you drove', 'TODO: what you own or lead'],
  },
  {
    company: 'CleverPush', url: 'https://cleverpush.com/', title: 'Software Engineer', start: '2024-07', end: '2025-01',
    highlights: ['TODO: what you built on the landing page / product', 'TODO: a result (performance, SEO, conversion)'],
  },
  {
    company: 'Hawr Technologies', url: 'https://www.hawrtechnologies.com/', title: 'Full-stack Developer', start: '2024-01', end: '2024-06',
    highlights: ['TODO: Hawr Learn responsibilities', 'TODO: stack and scale'],
  },
  {
    company: 'Adam Technologies', url: 'https://www.linkedin.com/company/adam-technologies/about/', title: 'MERN Stack Developer', start: '2023-10', end: '2023-12', note: 'Company has since closed',
    highlights: ['TODO: what you worked on', 'TODO: outcome'],
  },
  {
    company: 'Duple IT Solutions', url: 'https://www.dupleit.com/', title: 'Software Development Engineer-1', start: '2023-05', end: '2023-09',
    highlights: ['TODO: first production project', 'TODO: what you learned / delivered'],
  },
  {
    company: 'Brocamp (Brototype)', url: 'https://brototype.in/', title: 'Trainee, self-learning web development programme', start: '2022-08', end: '2023-03',
    highlights: ['Learned full-stack JavaScript by building and shipping projects', 'TODO: the capstone you built'],
  },
];

export function formatRange(job: Job): string {
  const f = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `${f(job.start)} – ${job.end ? f(job.end) : 'Present'}`;
}
```

`src/data/projects.ts` (descriptions and stacks copied verbatim from the old site):
```ts
export interface Project {
  slug: string;
  name: string;
  url: string;
  description: string;
  stack: string[];
  featured: boolean;
  /** Case-study copy; only used when featured. */
  caseStudy?: { problem: string; built: string };
}
export const projects: Project[] = [
  {
    slug: 'cleverpush-landing',
    name: 'CleverPush Landing Page',
    url: 'https://landing.cleverpush.com/',
    description:
      'Designed and developed a responsive landing page for CleverPush using Next.js, Sanity.io, Tailwind CSS, and Framer Motion to enhance user experience and performance.',
    stack: ['Next.js', 'Sanity.io', 'Tailwind CSS', 'Framer Motion', 'Responsive Design', 'SEO Optimization'],
    featured: true,
    caseStudy: {
      problem: 'TODO: what the old CleverPush landing page was missing (speed, editing workflow, conversions?).',
      built: 'TODO: what you built and how (Sanity content model, Next.js pages, animation approach, SEO setup).',
    },
  },
  {
    slug: 'rentdigicare',
    name: 'Rentdigicare',
    url: 'https://rentdigicare.com/',
    description: 'A comprehensive real estate platform developed to streamline the rental property management process.',
    stack: ['Node JS', 'React JS', 'Express Js', 'Redux', 'Socket.io', 'Mongodb', 'Hosting - Aws Ec2'],
    featured: true,
    caseStudy: {
      problem: 'TODO: the rental management pain this solved for landlords/tenants.',
      built: 'TODO: modules you built (listings, applications, realtime chat via Socket.io, deployment on EC2).',
    },
  },
  {
    slug: 'ayurvedalayam',
    name: 'Ayurvedalayam',
    url: 'https://www.ayurvedalayam.com/home',
    description:
      'A comprehensive platform for doctor appointments and e-commerce, offering seamless scheduling, product purchasing, and PayPal payment integration.',
    stack: ['React', 'Vite', 'MUI', 'Express', 'MongoDB', 'PayPal Integration'],
    featured: true,
    caseStudy: {
      problem: 'TODO: how the clinic handled appointments and orders before.',
      built: 'TODO: scheduling flow, product catalogue, PayPal checkout, admin tooling.',
    },
  },
  {
    slug: 'xylothia',
    name: 'Xylothia',
    url: 'https://xylothia.vercel.app/',
    description: 'Xylothia revolutionizes banking by seamlessly integrating traditional finance with the dynamic world of cryptocurrencies.',
    stack: ['Next Js', 'Tailwind Css', 'Css', 'Framer motion', 'Hosting - Vercel'],
    featured: false,
  },
  {
    slug: 'basekamp',
    name: 'BaseKamp',
    url: 'https://basekamp.co.uk/',
    description: 'A comprehensive saloon booking and e-commerce system.',
    stack: ['Node JS', 'React JS', 'Express JS', 'Mongodb', 'Socket.io', 'Redis', 'EJS', 'Hosting - Aws Ec2'],
    featured: false,
  },
  {
    slug: 'virtual-solutions',
    name: 'Virtual Solutions',
    url: 'https://www.virtualksa.com/',
    description:
      'Designed and developed a modern, responsive website for Virtual Solutions, a logistics service provider, with a focus on delivering a dynamic and engaging user experience.',
    stack: ['Next.js', 'Framer Motion', 'Tailwind CSS', 'Responsive Design', 'SEO'],
    featured: false,
  },
  {
    slug: 'ecommerce-ui-template',
    name: 'E-commerce UI Template',
    url: 'https://3legant-ecru.vercel.app',
    description:
      'A modern and responsive e-commerce UI template built with React, Vite, Tailwind CSS, Swiper, and TypeScript, designed to provide a scalable foundation for e-commerce applications.',
    stack: ['React', 'Vite', 'Tailwind CSS', 'Swiper', 'TypeScript', 'Responsive Design'],
    featured: false,
  },
  {
    slug: 'hawr-learn',
    name: 'Hawr Learn',
    url: 'https://www.hawrlearn.com',
    description:
      'Hawr Learn embodies the pinnacle of modern education, seamlessly integrating innovation with the latest advancements in learning technology.',
    stack: ['Node JS', 'Express JS', 'React JS', 'Mongodb', 'Hosting - Vercel'],
    featured: false,
  },
];
export const featuredProjects = projects.filter((p) => p.featured);
export const otherProjects = projects.filter((p) => !p.featured);
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all pass. (`project-images.ts` is not imported by tests because it uses `import.meta.glob`.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: typed site data, validation and WhatsApp helpers"
```

---

### Task 3: Layout, SEO head, JSON-LD, theme bootstrap, analytics, favicons, 404

**Files:**
- Create: `src/assets/logo.svg`, `scripts/generate-icons.mjs`, `public/favicon.svg`, `public/favicon-32.png`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/manifest.webmanifest`, `src/components/Seo.astro`, `src/components/JsonLd.astro`, `src/components/Analytics.astro`, `src/components/SkipLink.astro`, `src/pages/404.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Test: `tests/dist.test.ts`

**Interfaces:**
- Consumes: `site` from Task 2.
- Produces: `BaseLayout` props `{ title?: string; description?: string; ogImage?: string; noindex?: boolean; path?: string }` (title defaults to `site.title`, ogImage defaults to `/og/home.png`), slot `head` for extra head tags, default slot for body. `JsonLd` props `{ graph: object[] }`.

- [ ] **Step 1: Monogram and icon generation**

`src/assets/logo.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#0f1113"/>
  <path d="M20 46V18h14.5c6.6 0 10.5 3.6 10.5 9 0 4-2.2 6.9-5.8 8.1L46 46h-7.4l-6-10h-6.2v10H20zm6.4-15.4h7.5c3.3 0 5.1-1.5 5.1-3.9s-1.8-3.9-5.1-3.9h-7.5v7.8z" fill="#5d9ce2"/>
</svg>
```
Copy the same file to `public/favicon.svg`.

`scripts/generate-icons.mjs`:
```js
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('src/assets/logo.svg');
const out = [
  ['public/favicon-32.png', 32, 0],
  ['public/apple-touch-icon.png', 180, 0],
  ['public/icon-192.png', 192, 0],
  ['public/icon-512.png', 512, 0],
  ['public/icon-maskable-512.png', 512, 0.1], // 10% safe-zone padding on a solid bg
];
for (const [file, size, pad] of out) {
  const inner = Math.round(size * (1 - pad * 2));
  const icon = await sharp(svg).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#0f1113' } })
    .composite([{ input: icon, gravity: 'centre' }])
    .png()
    .toFile(file);
  console.log('wrote', file);
}
```
Run: `npm run icons`.

`public/manifest.webmanifest`:
```json
{
  "name": "Muhammed Resvan K — Software Engineer",
  "short_name": "Resvan",
  "description": "Software Engineer in Kerala, India building fast, accessible web and mobile apps with React, Next.js, React Native and Node.js. Open to remote work.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#0f1113",
  "background_color": "#0f1113",
  "lang": "en",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 2: Seo, JsonLd, Analytics, SkipLink components**

`src/components/Seo.astro`:
```astro
---
import { site } from '../data/site';
interface Props { title: string; description: string; path: string; ogImage: string; noindex?: boolean }
const { title, description, path, ogImage, noindex = false } = Astro.props;
const canonical = new URL(path, site.url).href;
const ogUrl = new URL(ogImage, site.url).href;
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
{noindex && <meta name="robots" content="noindex, follow" />}
<meta name="author" content={site.name} />
<meta name="google-site-verification" content="_fLcHiG0g5VxqX7UWz6gD9HKPqJ5C1ekgJRkys6fb9I" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content={site.themeColor.dark} />
<meta name="theme-color" media="(prefers-color-scheme: light)" content={site.themeColor.light} />
<meta property="og:type" content="website" />
<meta property="og:site_name" content={site.name} />
<meta property="og:url" content={canonical} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogUrl} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content={title} />
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogUrl} />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="sitemap" href="/sitemap-index.xml" />
```

`src/components/JsonLd.astro`:
```astro
---
interface Props { graph: object[] }
const { graph } = Astro.props;
const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
---
<script type="application/ld+json" set:html={json} is:inline></script>
```

`src/components/Analytics.astro` (loads gtag after `load`, on idle, so it never competes with LCP):
```astro
---
import { site } from '../data/site';
const id = site.analyticsId;
---
<script is:inline define:vars={{ id }}>
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', id, { send_page_view: true });
  function loadGtag() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
  }
  window.addEventListener('load', function () {
    (window.requestIdleCallback || function (cb) { setTimeout(cb, 1500); })(loadGtag);
  });
</script>
```

`src/components/SkipLink.astro`:
```astro
<a
  href="#main"
  class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
>Skip to content</a>
```

- [ ] **Step 3: BaseLayout**

Replace `src/layouts/BaseLayout.astro`:
```astro
---
import '../styles/global.css';
import { Font } from 'astro:assets';
import Seo from '../components/Seo.astro';
import Analytics from '../components/Analytics.astro';
import SkipLink from '../components/SkipLink.astro';
import { site } from '../data/site';

interface Props {
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
  path?: string;
}
const {
  title = site.title,
  description = site.description,
  ogImage = '/og/home.png',
  noindex = false,
  path = Astro.url.pathname,
} = Astro.props;
---
<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script is:inline>
      (function () {
        try {
          var s = localStorage.getItem('theme');
          var t = s === 'light' || s === 'dark' ? s : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
          document.documentElement.dataset.theme = t;
        } catch (e) {}
      })();
    </script>
    <Seo {title} {description} {path} {ogImage} {noindex} />
    <Font cssVariable="--font-inter-tight" preload />
    <Font cssVariable="--font-inter" preload />
    <slot name="head" />
    {import.meta.env.PROD && <Analytics />}
  </head>
  <body class="bg-bg text-fg font-body min-h-dvh flex flex-col">
    <SkipLink />
    <slot />
  </body>
</html>
```

- [ ] **Step 4: 404 page**

`src/pages/404.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { site } from '../data/site';
---
<BaseLayout title={`Page not found | ${site.alternateName}`} description="That page doesn't exist." noindex path="/404">
  <main id="main" class="container flex flex-1 flex-col items-center justify-center py-24 text-center">
    <p class="font-display text-step-5 text-accent">404</p>
    <h1 class="mt-2 text-step-3">Page not found</h1>
    <p class="mt-4 max-w-prose text-muted">The link may be old or mistyped. Everything about me lives on the home page.</p>
    <a href="/" class="mt-8 inline-flex rounded-md bg-accent px-5 py-3 font-medium text-accent-fg">Back to home</a>
  </main>
</BaseLayout>
```

- [ ] **Step 5: Write the dist test**

`tests/dist.test.ts` (skips until a build exists; later tasks extend it):
```ts
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
    expect(d.querySelector('meta[property="og:image"]')!.getAttribute('content')).toMatch(/\.png$/);
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
  it('parses the JSON-LD graph', () => {
    const scripts = html().querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThanOrEqual(1);
    const data = JSON.parse(scripts[0].text);
    const types = data['@graph'].map((n: { '@type': string }) => n['@type']);
    expect(types).toEqual(expect.arrayContaining(['Person', 'WebSite', 'ProfilePage']));
  });
});

describe.skipIf(!built)('other output', () => {
  it('ships 404, manifest, CNAME and sitemap', () => {
    for (const f of ['dist/404.html', 'dist/manifest.webmanifest', 'dist/CNAME', 'dist/sitemap-index.xml', 'dist/sitemap-0.xml', 'dist/og/home.png']) {
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
```
The JSON-LD, OG and blog assertions pass only after Tasks 5 and 10. That's expected; run `npm test` after each build and watch the count of failures drop.

- [ ] **Step 6: Build, run tests**

Run: `npm run build && npm test`
Expected: build OK; dist tests: identity, h1/loader, links pass; JSON-LD, og/home.png, blog fail (later tasks).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: base layout with SEO head, theme bootstrap, deferred analytics, icons and 404"
```

---

### Task 4: Header, mobile menu, theme toggle

**Files:**
- Create: `src/components/Header.astro`, `src/components/ThemeToggle.astro`, `src/scripts/header.ts`, `src/scripts/theme.ts`, `src/lib/nav.ts`
- Test: `tests/nav.test.ts`

**Interfaces:**
- Produces: `navItems: { href: string; label: string }[]` in `src/lib/nav.ts`. `Header.astro` renders `<header id="site-header">`. Sections must use `id` values `about`, `experience`, `services`, `work`, `contact` and class `js-section` for active highlighting.

- [ ] **Step 1: Nav data + test**

`src/lib/nav.ts`:
```ts
export const navItems = [
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#services', label: 'Services' },
  { href: '#work', label: 'Work' },
  { href: '#contact', label: 'Contact' },
] as const;
```
`tests/nav.test.ts`:
```ts
import { expect, it } from 'vitest';
import { navItems } from '../src/lib/nav';
it('nav links are in-page anchors in section order', () => {
  expect(navItems.map((n) => n.href)).toEqual(['#about', '#experience', '#services', '#work', '#contact']);
});
```

- [ ] **Step 2: ThemeToggle**

`src/components/ThemeToggle.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
---
<button
  type="button"
  id="theme-toggle"
  class="inline-flex size-10 items-center justify-center rounded-md border border-line bg-surface text-fg hover:border-accent"
  aria-label="Switch to light theme"
  aria-pressed="false"
  data-label-dark="Switch to light theme"
  data-label-light="Switch to dark theme"
>
  <Icon name="lucide:sun" class="size-5 hidden [[data-theme=dark]_&]:block" aria-hidden="true" />
  <Icon name="lucide:moon" class="size-5 hidden [[data-theme=light]_&]:block" aria-hidden="true" />
</button>
<script src="../scripts/theme.ts"></script>
```

`src/scripts/theme.ts`:
```ts
const btn = document.getElementById('theme-toggle') as HTMLButtonElement | null;
const root = document.documentElement;

function sync() {
  if (!btn) return;
  const light = root.dataset.theme === 'light';
  btn.setAttribute('aria-pressed', String(light));
  btn.setAttribute('aria-label', light ? btn.dataset.labelLight! : btn.dataset.labelDark!);
}
btn?.addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch {}
  sync();
});
sync();
```

- [ ] **Step 3: Header with mobile menu**

`src/components/Header.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import ThemeToggle from './ThemeToggle.astro';
import { navItems } from '../lib/nav';
import { site } from '../data/site';
import logo from '../assets/logo.svg?raw';
---
<header
  id="site-header"
  class="sticky top-0 z-50 border-b border-line/60 bg-bg/80 backdrop-blur transition-transform duration-300 motion-reduce:transition-none"
>
  <div class="container flex h-16 items-center justify-between gap-4">
    <a href="/" class="flex items-center gap-2 font-display text-step-0 font-semibold" aria-label={`${site.alternateName} home`}>
      <span class="size-8 [&>svg]:size-8" set:html={logo} />
      <span>{site.alternateName}</span>
    </a>

    <nav aria-label="Primary" class="hidden md:block">
      <ul class="flex items-center gap-6 text-step--1 font-medium text-muted">
        {navItems.map((n) => (
          <li><a href={n.href} class="js-nav-link hover:text-fg aria-[current=true]:text-accent" data-target={n.href.slice(1)}>{n.label}</a></li>
        ))}
      </ul>
    </nav>

    <div class="flex items-center gap-2">
      <ThemeToggle />
      <button
        type="button"
        id="menu-button"
        class="inline-flex size-10 items-center justify-center rounded-md border border-line bg-surface md:hidden"
        aria-expanded="false"
        aria-controls="mobile-menu"
        aria-label="Open menu"
      >
        <Icon name="lucide:menu" class="size-5 [[aria-expanded=true]_&]:hidden" aria-hidden="true" />
        <Icon name="lucide:x" class="size-5 hidden [[aria-expanded=true]_&]:block" aria-hidden="true" />
      </button>
    </div>
  </div>

  <div id="mobile-menu" class="border-t border-line bg-bg md:hidden" hidden>
    <nav aria-label="Mobile">
      <ul class="container flex flex-col py-2">
        {navItems.map((n) => (
          <li><a href={n.href} class="js-nav-link block py-3 text-step-0 font-medium text-muted hover:text-fg aria-[current=true]:text-accent" data-target={n.href.slice(1)}>{n.label}</a></li>
        ))}
      </ul>
    </nav>
  </div>
</header>
<script src="../scripts/header.ts"></script>
```
Note: `logo.svg?raw` inlines the SVG. Make sure `src/assets/logo.svg` has no `width`/`height` conflicts with the `size-8` class; the class on the wrapper handles sizing.

`src/scripts/header.ts`:
```ts
const header = document.getElementById('site-header')!;
const menuBtn = document.getElementById('menu-button') as HTMLButtonElement | null;
const menu = document.getElementById('mobile-menu')!;
const main = document.getElementById('main');
const footer = document.querySelector('footer');

/* Hide on scroll down, show on scroll up */
let lastY = window.scrollY;
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    const menuOpen = menuBtn?.getAttribute('aria-expanded') === 'true';
    if (!menuOpen && y > lastY && y > 80) header.style.transform = 'translateY(-100%)';
    else header.style.transform = '';
    lastY = y;
    ticking = false;
  });
}, { passive: true });

/* Mobile menu */
const FOCUSABLE = 'a[href], button:not([disabled])';
function setOpen(open: boolean) {
  if (!menuBtn) return;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  main?.toggleAttribute('inert', open);
  footer?.toggleAttribute('inert', open);
  if (open) (menu.querySelector(FOCUSABLE) as HTMLElement | null)?.focus();
  else menuBtn.focus();
}
menuBtn?.addEventListener('click', () => setOpen(menuBtn.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) setOpen(false); });
header.addEventListener('keydown', (e) => {
  if (menuBtn?.getAttribute('aria-expanded') !== 'true') return;
  if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
  if (e.key !== 'Tab') return;
  const items = [...header.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });

/* Active section highlight */
const links = [...document.querySelectorAll<HTMLAnchorElement>('.js-nav-link')];
const sections = [...document.querySelectorAll<HTMLElement>('.js-section')];
if ('IntersectionObserver' in window && sections.length) {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      for (const l of links) {
        if (l.dataset.target === en.target.id) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((s) => io.observe(s));
}
```
- [ ] **Step 4: Wire into index.astro temporarily**

Update `src/pages/index.astro` to render `<Header />` above a `<main id="main">` with five empty `<section class="js-section" id="...">` placeholders so the menu can be tried in `npm run dev`. Task 5 replaces this.

- [ ] **Step 5: Verify**

Run: `npm test && npm run check && npm run build`
Manual: `npm run dev`, at 360px width open the menu, Tab cycles inside it, Esc closes, link closes; theme toggle flips and persists on reload.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: sticky header with accessible mobile menu and theme toggle"
```

---

### Task 5: Hero, About, Skills, Footer, reveal script, home page assembly

**Files:**
- Create: `src/components/Hero.astro`, `src/components/About.astro`, `src/components/SkillGroups.astro`, `src/components/Footer.astro`, `src/components/SectionHeading.astro`, `src/scripts/reveal.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Produces: `SectionHeading` props `{ id: string; eyebrow: string; title: string }` renders `<h2 id="{id}-title">`; sections use `aria-labelledby="{id}-title"`.

- [ ] **Step 1: SectionHeading + reveal**

`src/components/SectionHeading.astro`:
```astro
---
interface Props { id: string; eyebrow: string; title: string }
const { id, eyebrow, title } = Astro.props;
---
<div class="mb-10">
  <p class="font-mono text-step--1 font-medium uppercase tracking-widest text-accent">{eyebrow}</p>
  <h2 id={`${id}-title`} class="mt-2 text-step-3 font-semibold">{title}</h2>
</div>
```

`src/scripts/reveal.ts`:
```ts
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !reduce) {
  document.documentElement.classList.add('reveal-ready');
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); }
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}
```

- [ ] **Step 2: Hero**

`src/components/Hero.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import { site } from '../data/site';
---
<section id="hero" class="container py-20 md:py-28" aria-labelledby="hero-title">
  {site.availableForFreelance && (
    <p class="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-step--1 text-muted">
      <span class="size-2 rounded-full bg-emerald-400" aria-hidden="true"></span>
      Available for freelance
    </p>
  )}
  <h1 id="hero-title" class="max-w-4xl text-step-5 font-bold">{site.name}</h1>
  <p class="mt-5 max-w-2xl text-step-1 text-muted">{site.tagline}</p>
  <p class="mt-3 inline-flex items-center gap-2 text-step--1 text-muted">
    <Icon name="lucide:map-pin" class="size-4 text-accent" aria-hidden="true" />
    {site.locationLine}
  </p>
  <div class="mt-8 flex flex-wrap gap-3">
    <a href="#work" class="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 font-medium text-accent-fg hover:opacity-90">
      View work <Icon name="lucide:arrow-down" class="size-4" aria-hidden="true" />
    </a>
    <a href="#contact" class="inline-flex items-center rounded-md border border-line bg-surface px-5 py-3 font-medium hover:border-accent">Contact me</a>
  </div>
</section>
```

- [ ] **Step 3: About + skills**

`src/components/SkillGroups.astro`:
```astro
---
import { skillGroups } from '../data/skills';
---
<dl class="grid gap-4 sm:grid-cols-2">
  {skillGroups.map((g) => (
    <div>
      <dt class="text-step--1 font-medium uppercase tracking-wider text-muted">{g.name}</dt>
      <dd class="mt-2 flex flex-wrap gap-2">
        {g.items.map((s) => <span class="rounded-full border border-line bg-surface px-3 py-1 text-step--1">{s}</span>)}
      </dd>
    </div>
  ))}
</dl>
```

`src/components/About.astro`:
```astro
---
import { Picture } from 'astro:assets';
import SectionHeading from './SectionHeading.astro';
import SkillGroups from './SkillGroups.astro';
import { site } from '../data/site';
import photo from '../assets/resvan.jpg';
---
<section id="about" class="js-section reveal container py-16 md:py-24" aria-labelledby="about-title">
  <SectionHeading id="about" eyebrow="About" title="A builder who cares about the details." />
  <div class="grid items-start gap-10 md:grid-cols-[1.4fr_1fr]">
    <div class="space-y-5 text-muted">
      <p>
        I'm {site.alternateName}, a software engineer from Kerala who enjoys turning rough ideas into products people
        actually use. I've shipped marketing sites, SaaS dashboards, booking systems and mobile apps, mostly on the
        React and Node.js stack.
      </p>
      <p>
        Right now I work at <a href={site.employer.url} target="_blank" rel="noopener noreferrer" class="text-accent underline-offset-4 hover:underline">{site.employer.name}</a>,
        a Dutch sales software company, where I build the front end. Outside work I take on a small number of freelance projects.
      </p>
      <SkillGroups />
    </div>
    <Picture
      src={photo}
      formats={['avif', 'webp']}
      widths={[320, 480, 640, 960]}
      sizes="(min-width: 768px) 320px, 80vw"
      alt="Muhammed Resvan K, smiling, outdoors"
      class="mx-auto w-full max-w-xs rounded-2xl border border-line object-cover md:max-w-sm"
      loading="lazy"
    />
  </div>
</section>
```

- [ ] **Step 4: Footer**

`src/components/Footer.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import { site } from '../data/site';
const year = new Date().getFullYear();
const links = [
  { href: site.socials.github, label: 'GitHub', icon: 'simple-icons:github' },
  { href: site.socials.linkedin, label: 'LinkedIn', icon: 'simple-icons:linkedin' },
  { href: site.socials.instagram, label: 'Instagram', icon: 'simple-icons:instagram' },
  { href: `https://wa.me/${site.whatsapp}`, label: 'WhatsApp', icon: 'simple-icons:whatsapp' },
];
---
<footer class="border-t border-line py-10">
  <div class="container flex flex-col items-center gap-4 text-step--1 text-muted sm:flex-row sm:justify-between">
    <p>© {year} {site.name}</p>
    <ul class="flex gap-4">
      {links.map((l) => (
        <li>
          <a href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} class="inline-flex size-10 items-center justify-center rounded-md hover:bg-surface hover:text-fg">
            <Icon name={l.icon} class="size-5" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  </div>
</footer>
```

- [ ] **Step 5: Assemble index.astro with JSON-LD**

`src/pages/index.astro` (sections for Tasks 6-8 are added as those tasks land; keep placeholder `<section>`s with the right ids until then):
```astro
---
import { getImage } from 'astro:assets';
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Hero from '../components/Hero.astro';
import About from '../components/About.astro';
import Footer from '../components/Footer.astro';
import JsonLd from '../components/JsonLd.astro';
import { site } from '../data/site';
import { projects } from '../data/projects';
import photo from '../assets/resvan.jpg';

const img = await getImage({ src: photo, width: 800, format: 'jpg' });
const imageUrl = new URL(img.src, site.url).href;
const graph = [
  {
    '@type': 'Person', '@id': `${site.url}/#person`,
    name: site.name, alternateName: site.alternateName, jobTitle: site.jobTitle, url: site.url, image: imageUrl, email: `mailto:${site.email}`,
    worksFor: { '@type': 'Organization', name: site.employer.name, url: site.employer.url },
    address: { '@type': 'PostalAddress', addressLocality: site.address.locality, addressRegion: site.address.region, addressCountry: site.address.country },
    sameAs: Object.values(site.socials),
  },
  { '@type': 'WebSite', '@id': `${site.url}/#website`, url: site.url, name: site.name, publisher: { '@id': `${site.url}/#person` } },
  { '@type': 'ProfilePage', '@id': `${site.url}/#profile`, url: site.url, name: site.title, description: site.description, mainEntity: { '@id': `${site.url}/#person` }, isPartOf: { '@id': `${site.url}/#website` } },
  {
    '@type': 'ItemList', name: 'Projects',
    itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: p.url })),
  },
];
---
<BaseLayout path="/">
  <JsonLd slot="head" graph={graph} />
  <Header />
  <main id="main" class="flex-1">
    <Hero />
    <About />
    <section id="experience" class="js-section container py-16" aria-label="Experience"></section>
    <section id="services" class="js-section container py-16" aria-label="Services"></section>
    <section id="work" class="js-section container py-16" aria-label="Work"></section>
    <section id="contact" class="js-section container py-16" aria-label="Contact"></section>
  </main>
  <Footer />
  <script src="../scripts/reveal.ts"></script>
</BaseLayout>
```

- [ ] **Step 6: Build + tests**

Run: `npm run build && npm test`
Expected: dist JSON-LD test now passes. `dist/_astro/` contains avif/webp variants of the photo.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: hero, about with skill chips, footer and reveal motion"
```

---

### Task 6: Experience timeline

**Files:**
- Create: `src/components/Experience.astro`
- Modify: `src/pages/index.astro` (replace the experience placeholder)
- Test: extend `tests/data.test.ts` for `formatRange`

- [ ] **Step 1: Test `formatRange`**

Append to `tests/data.test.ts`:
```ts
import { formatRange } from '../src/data/experience';
describe('formatRange', () => {
  it('formats month ranges and present', () => {
    expect(formatRange({ company: '', url: null, title: '', start: '2024-07', end: '2025-01', highlights: [] })).toBe('Jul 2024 – Jan 2025');
    expect(formatRange({ company: '', url: null, title: '', start: '2025-02', end: null, highlights: [] })).toBe('Feb 2025 – Present');
  });
});
```
Run `npm test` — passes already (function written in Task 2); keep it as a regression guard.

- [ ] **Step 2: Component**

`src/components/Experience.astro`:
```astro
---
import SectionHeading from './SectionHeading.astro';
import { experience, formatRange } from '../data/experience';
---
<section id="experience" class="js-section reveal container py-16 md:py-24" aria-labelledby="experience-title">
  <SectionHeading id="experience" eyebrow="Experience" title="Where I've worked." />
  <ol class="relative ml-3 border-l border-line pl-8">
    {experience.map((job) => (
      <li class="relative pb-10 last:pb-0">
        <span class="absolute -left-[2.3rem] top-1.5 size-3 rounded-full border-2 border-accent bg-bg" aria-hidden="true"></span>
        <h3 class="text-step-1 font-semibold">{job.title}</h3>
        <p class="mt-1 text-muted">
          {job.url ? (
            <a href={job.url} target="_blank" rel="noopener noreferrer" class="text-accent underline-offset-4 hover:underline">{job.company}</a>
          ) : (
            <span>{job.company}</span>
          )}
          {job.note && <span class="text-step--1"> · {job.note}</span>}
        </p>
        <p class="mt-1 text-step--1 text-muted"><time datetime={job.start}>{formatRange(job)}</time></p>
        <ul class="mt-3 list-disc space-y-1 pl-5 text-muted">
          {job.highlights.map((h) => <li>{h}</li>)}
        </ul>
      </li>
    ))}
  </ol>
  <p class="mt-10 text-step--1 text-muted">Footnote: landed on Earth in March 2000.</p>
</section>
```
Replace the `<section id="experience">` placeholder in `index.astro` with `<Experience />` and add the import.

- [ ] **Step 3: Build + commit**

Run: `npm run build && npm test`
```bash
git add -A
git commit -m "feat: semantic experience timeline"
```

---

### Task 7: Services, Work (featured + grid), screenshots

**Files:**
- Create: `src/components/Services.astro`, `src/components/Work.astro`, `src/components/FeaturedProject.astro`, `src/components/ProjectCard.astro`, `scripts/screenshots.sh`, `src/assets/projects/*.png`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Capture screenshots**

`scripts/screenshots.sh`:
```bash
#!/usr/bin/env bash
# Captures 1280x800 screenshots of live project sites into src/assets/projects/<slug>.png.
# Sites that fail or return an error page are skipped; the placeholder is used instead.
set -u
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
command -v google-chrome >/dev/null && CHROME=google-chrome
OUT=src/assets/projects
mkdir -p "$OUT"
while IFS='|' read -r slug url; do
  tmp="$(mktemp -d)"
  if "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,800 --virtual-time-budget=8000 \
      --screenshot="$tmp/shot.png" "$url" >/dev/null 2>&1 && [ -s "$tmp/shot.png" ]; then
    mv "$tmp/shot.png" "$OUT/$slug.png" && echo "ok   $slug"
  else
    echo "skip $slug ($url)"
  fi
  rm -rf "$tmp"
done <<'LIST'
cleverpush-landing|https://landing.cleverpush.com/
rentdigicare|https://rentdigicare.com/
ayurvedalayam|https://www.ayurvedalayam.com/home
xylothia|https://xylothia.vercel.app/
basekamp|https://basekamp.co.uk/
virtual-solutions|https://www.virtualksa.com/
ecommerce-ui-template|https://3legant-ecru.vercel.app
hawr-learn|https://www.hawrlearn.com
LIST
```
Run `npm run screenshots`, then open each PNG. Delete any that show an error page, parked domain, cookie wall only, or blank render so the placeholder is used. Record which were kept in the commit message.

- [ ] **Step 2: Components**

`src/components/Services.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import SectionHeading from './SectionHeading.astro';
import { services } from '../data/services';
---
<section id="services" class="js-section reveal container py-16 md:py-24" aria-labelledby="services-title">
  <SectionHeading id="services" eyebrow="Services" title="What I can do for you." />
  <ul class="grid gap-6 md:grid-cols-3">
    {services.map((s) => (
      <li class="flex flex-col rounded-2xl border border-line bg-surface p-6">
        <Icon name={s.icon} class="size-8 text-accent" aria-hidden="true" />
        <h3 class="mt-4 text-step-1 font-semibold">{s.title}</h3>
        <p class="mt-2 text-muted">{s.summary}</p>
        <ul class="mt-4 space-y-2 text-step--1 text-muted">
          {s.youGet.map((y) => (
            <li class="flex gap-2"><Icon name="lucide:check" class="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" /><span>{y}</span></li>
          ))}
        </ul>
        <a href="#contact" class="mt-auto pt-6 font-medium text-accent underline-offset-4 hover:underline">Contact me about {s.title.toLowerCase()}</a>
      </li>
    ))}
  </ul>
</section>
```

`src/components/FeaturedProject.astro`:
```astro
---
import { Image } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import type { Project } from '../data/projects';
import { getProjectImage } from '../lib/project-images';
interface Props { project: Project; index: number }
const { project, index } = Astro.props;
const image = getProjectImage(project.slug);
const flip = index % 2 === 1;
---
<article class={`grid items-center gap-8 md:grid-cols-2 ${flip ? 'md:[&>div:first-child]:order-2' : ''}`}>
  <div class="overflow-hidden rounded-2xl border border-line bg-surface">
    <Image src={image} alt={`Screenshot of ${project.name}`} widths={[480, 768, 1200]} sizes="(min-width: 768px) 50vw, 100vw" class="aspect-[16/10] w-full object-cover object-top" loading="lazy" />
  </div>
  <div>
    <p class="text-step--1 font-medium uppercase tracking-wider text-accent">Featured</p>
    <h3 class="mt-2 text-step-2 font-semibold">{project.name}</h3>
    <p class="mt-3 text-muted">{project.description}</p>
    <ul class="mt-4 flex flex-wrap gap-2" aria-label="Stack">
      {project.stack.map((s) => <li class="rounded-full border border-line px-3 py-1 text-step--1 text-muted">{s}</li>)}
    </ul>
    <div class="mt-6 flex flex-wrap gap-4">
      <a href={`/projects/${project.slug}/`} class="inline-flex items-center gap-1 font-medium text-accent underline-offset-4 hover:underline">Read the case study <Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" /></a>
      <a href={project.url} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-medium text-muted hover:text-fg">Visit {project.name} <Icon name="lucide:external-link" class="size-4" aria-hidden="true" /></a>
    </div>
  </div>
</article>
```

`src/components/ProjectCard.astro`:
```astro
---
import { Image } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import type { Project } from '../data/projects';
import { getProjectImage } from '../lib/project-images';
interface Props { project: Project }
const { project } = Astro.props;
const image = getProjectImage(project.slug);
---
<li class="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
  <Image src={image} alt={`Screenshot of ${project.name}`} widths={[400, 800]} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" class="aspect-[16/10] w-full object-cover object-top" loading="lazy" />
  <div class="flex flex-1 flex-col p-5">
    <h3 class="text-step-1 font-semibold">{project.name}</h3>
    <p class="mt-2 text-step--1 text-muted">{project.description}</p>
    <ul class="mt-3 flex flex-wrap gap-1.5" aria-label="Stack">
      {project.stack.map((s) => <li class="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">{s}</li>)}
    </ul>
    <a href={project.url} target="_blank" rel="noopener noreferrer" class="mt-auto inline-flex items-center gap-1 pt-4 text-step--1 font-medium text-accent underline-offset-4 hover:underline">
      Visit {project.name} <Icon name="lucide:external-link" class="size-4" aria-hidden="true" />
    </a>
  </div>
</li>
```

`src/components/Work.astro`:
```astro
---
import SectionHeading from './SectionHeading.astro';
import FeaturedProject from './FeaturedProject.astro';
import ProjectCard from './ProjectCard.astro';
import { featuredProjects, otherProjects } from '../data/projects';
import { site } from '../data/site';
---
<section id="work" class="js-section reveal container py-16 md:py-24" aria-labelledby="work-title">
  <SectionHeading id="work" eyebrow="Work" title="Things I've built." />
  <div class="space-y-16">
    {featuredProjects.map((p, i) => <FeaturedProject project={p} index={i} />)}
  </div>
  <h3 class="mt-20 text-step-2 font-semibold">More projects</h3>
  <ul class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {otherProjects.map((p) => <ProjectCard project={p} />)}
  </ul>
  <p class="mt-8 text-muted">
    More on <a href={site.socials.github} target="_blank" rel="noopener noreferrer" class="text-accent underline-offset-4 hover:underline">my GitHub profile</a>.
  </p>
</section>
```
Replace the services and work placeholders in `index.astro` with `<Services />` and `<Work />`.

- [ ] **Step 3: Build, test, commit**

Run: `npm run build && npm test`
Expected: pass; `dist/index.html` has `/projects/cleverpush-landing/` links (the pages come in Task 10, so they 404 in preview until then).
```bash
git add -A
git commit -m "feat: services cards, featured projects and project grid with screenshots"
```

---

### Task 8: Contact section, form script, WhatsApp FAB

**Files:**
- Create: `src/components/Contact.astro`, `src/components/ContactForm.astro`, `src/components/WhatsAppFab.astro`, `src/scripts/contact-form.ts`, `src/lib/contact-response.ts`
- Modify: `src/pages/index.astro`
- Test: `tests/contact-response.test.ts`

**Interfaces:**
- Consumes: `validate*` and `MESSAGE_MAX` from `src/lib/validation.ts`, `buildWhatsAppUrl` from `src/lib/whatsapp.ts`.
- Produces: `parseEndpointResponse(ok: boolean, text: string): { ok: true } | { ok: false; error: string }`.

- [ ] **Step 1: Failing test for response parsing**

`tests/contact-response.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseEndpointResponse } from '../src/lib/contact-response';

describe('parseEndpointResponse', () => {
  it('succeeds only on HTTP ok + JSON ok:true', () => {
    expect(parseEndpointResponse(true, '{"ok":true}')).toEqual({ ok: true });
  });
  it('fails on server-side error JSON', () => {
    expect(parseEndpointResponse(true, '{"ok":false,"error":"Too many requests"}')).toEqual({ ok: false, error: 'Too many requests' });
  });
  it('fails on HTML or non-JSON bodies (Apps Script error page)', () => {
    expect(parseEndpointResponse(true, '<!doctype html><title>Error</title>').ok).toBe(false);
  });
  it('fails on non-2xx', () => {
    expect(parseEndpointResponse(false, '{"ok":true}').ok).toBe(false);
  });
});
```
Run: `npm test` → FAIL (module missing).

- [ ] **Step 2: Implement**

`src/lib/contact-response.ts`:
```ts
export type EndpointResult = { ok: true } | { ok: false; error: string };
export function parseEndpointResponse(httpOk: boolean, text: string): EndpointResult {
  if (!httpOk) return { ok: false, error: 'The server returned an error.' };
  try {
    const data = JSON.parse(text) as { ok?: unknown; error?: unknown };
    if (data.ok === true) return { ok: true };
    return { ok: false, error: typeof data.error === 'string' ? data.error : 'The server rejected the message.' };
  } catch {
    return { ok: false, error: 'Unexpected response from the server.' };
  }
}
```
Run: `npm test` → PASS.

- [ ] **Step 3: Form markup**

`src/components/ContactForm.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import { site } from '../data/site';
import { MESSAGE_MAX } from '../lib/validation';
const endpoint = import.meta.env.PUBLIC_CONTACT_ENDPOINT ?? '';
const field = 'w-full rounded-md border border-line bg-surface px-3 py-2.5 text-fg placeholder:text-muted/60 focus:border-accent aria-[invalid=true]:border-red-500';
const label = 'block text-step--1 font-medium';
const err = 'mt-1 text-step--1 text-red-500';
---
<form id="contact-form" class="space-y-5" novalidate data-endpoint={endpoint} data-whatsapp={site.whatsapp} data-email={site.email}>
  <p class="hidden" aria-hidden="true">
    <label>Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
  </p>
  <div>
    <label for="cf-name" class={label}>Name</label>
    <input id="cf-name" name="name" type="text" class={`mt-1 ${field}`} required minlength="2" maxlength="60" autocomplete="name" aria-describedby="cf-name-error" />
    <p id="cf-name-error" class={err} aria-live="polite"></p>
  </div>
  <div>
    <label for="cf-email" class={label}>Email</label>
    <input id="cf-email" name="email" type="email" class={`mt-1 ${field}`} required autocomplete="email" inputmode="email" aria-describedby="cf-email-error" />
    <p id="cf-email-error" class={err} aria-live="polite"></p>
  </div>
  <div>
    <label for="cf-phone" class={label}>Phone <span class="font-normal text-muted">(optional, any country)</span></label>
    <input id="cf-phone" name="phone" type="tel" class={`mt-1 ${field}`} autocomplete="tel" inputmode="tel" placeholder="+31 6 1234 5678" aria-describedby="cf-phone-error" />
    <p id="cf-phone-error" class={err} aria-live="polite"></p>
  </div>
  <div>
    <label for="cf-message" class={label}>Message</label>
    <textarea id="cf-message" name="message" rows="6" class={`mt-1 ${field}`} required minlength="10" maxlength={MESSAGE_MAX} aria-describedby="cf-message-error cf-message-count"></textarea>
    <div class="flex justify-between gap-4">
      <p id="cf-message-error" class={err} aria-live="polite"></p>
      <p id="cf-message-count" class="mt-1 text-step--1 text-muted" aria-live="polite">0 / {MESSAGE_MAX}</p>
    </div>
  </div>
  <div class="flex flex-wrap gap-3">
    <button type="submit" id="cf-submit" class="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 font-medium text-accent-fg hover:opacity-90 disabled:cursor-wait disabled:opacity-60">
      <span data-idle>Send message</span><span data-busy hidden>Sending…</span>
    </button>
    <button type="button" id="cf-whatsapp" class="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-5 py-3 font-medium hover:border-accent">
      <Icon name="simple-icons:whatsapp" class="size-4" aria-hidden="true" /> Message on WhatsApp
    </button>
  </div>
  <p id="cf-status" role="status" aria-live="polite" class="rounded-md border border-line bg-surface px-4 py-3 text-step--1" hidden></p>
</form>
<script src="../scripts/contact-form.ts"></script>
```

- [ ] **Step 4: Form script**

`src/scripts/contact-form.ts`:
```ts
import { MESSAGE_MAX, validateEmail, validateMessage, validateName, validatePhone } from '../lib/validation';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { parseEndpointResponse } from '../lib/contact-response';

const form = document.getElementById('contact-form') as HTMLFormElement | null;
if (form) {
  const endpoint = form.dataset.endpoint ?? '';
  const whatsapp = form.dataset.whatsapp ?? '';
  const email = form.dataset.email ?? '';
  const submit = form.querySelector<HTMLButtonElement>('#cf-submit')!;
  const status = form.querySelector<HTMLElement>('#cf-status')!;
  const count = form.querySelector<HTMLElement>('#cf-message-count')!;
  const fields = {
    name: { el: form.elements.namedItem('name') as HTMLInputElement, check: validateName },
    email: { el: form.elements.namedItem('email') as HTMLInputElement, check: validateEmail },
    phone: { el: form.elements.namedItem('phone') as HTMLInputElement, check: validatePhone },
    message: { el: form.elements.namedItem('message') as HTMLTextAreaElement, check: validateMessage },
  };

  function showError(key: keyof typeof fields, msg: string | null) {
    const { el } = fields[key];
    const out = document.getElementById(`cf-${key}-error`)!;
    out.textContent = msg ?? '';
    el.setAttribute('aria-invalid', String(msg !== null));
  }
  function validateAll(): boolean {
    let first: HTMLElement | null = null;
    for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
      const msg = fields[key].check(fields[key].el.value);
      showError(key, msg);
      if (msg && !first) first = fields[key].el;
    }
    first?.focus();
    return first === null;
  }
  function fallbackHtml(prefix: string) {
    const wa = buildWhatsAppUrl(whatsapp, { name: fields.name.el.value, email: fields.email.el.value, message: fields.message.el.value });
    const mail = `mailto:${email}?subject=${encodeURIComponent('Hello from resvan.in')}&body=${encodeURIComponent(fields.message.el.value)}`;
    return `${prefix} You can <a class="text-accent underline" href="${wa}" target="_blank" rel="noopener noreferrer">message me on WhatsApp</a> or <a class="text-accent underline" href="${mail}">email me</a> instead.`;
  }
  function setStatus(html: string, kind: 'ok' | 'error') {
    status.innerHTML = html;
    status.hidden = false;
    status.classList.toggle('border-emerald-500', kind === 'ok');
    status.classList.toggle('border-red-500', kind === 'error');
  }
  function setBusy(busy: boolean) {
    submit.disabled = busy;
    submit.querySelector<HTMLElement>('[data-idle]')!.hidden = busy;
    submit.querySelector<HTMLElement>('[data-busy]')!.hidden = !busy;
  }

  for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
    fields[key].el.addEventListener('blur', () => showError(key, fields[key].check(fields[key].el.value)));
    fields[key].el.addEventListener('input', () => { if (fields[key].el.getAttribute('aria-invalid') === 'true') showError(key, fields[key].check(fields[key].el.value)); });
  }
  fields.message.el.addEventListener('input', () => { count.textContent = `${fields.message.el.value.length} / ${MESSAGE_MAX}`; });

  form.querySelector('#cf-whatsapp')?.addEventListener('click', () => {
    window.open(buildWhatsAppUrl(whatsapp, { name: fields.name.el.value, email: fields.email.el.value, message: fields.message.el.value }), '_blank', 'noopener');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.hidden = true;
    if (!validateAll()) return;
    if (!endpoint) { setStatus(fallbackHtml('The contact form is not connected yet.'), 'error'); return; }
    setBusy(true);
    try {
      const body = new URLSearchParams(new FormData(form) as unknown as Record<string, string>);
      body.set('userAgent', navigator.userAgent);
      const res = await fetch(endpoint, { method: 'POST', body, redirect: 'follow' });
      const result = parseEndpointResponse(res.ok, await res.text());
      if (result.ok) {
        form.reset();
        count.textContent = `0 / ${MESSAGE_MAX}`;
        setStatus('Thanks, your message is on its way. I usually reply within a day.', 'ok');
      } else {
        setStatus(fallbackHtml(`Sorry, that didn't go through (${result.error})`), 'error');
      }
    } catch {
      setStatus(fallbackHtml("Sorry, that didn't go through."), 'error');
    } finally {
      setBusy(false);
    }
  });
}
```

- [ ] **Step 5: Contact section + FAB**

`src/components/Contact.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import SectionHeading from './SectionHeading.astro';
import ContactForm from './ContactForm.astro';
import { site } from '../data/site';
const direct = [
  { href: `mailto:${site.email}`, label: site.email, icon: 'lucide:mail', external: false },
  { href: `https://wa.me/${site.whatsapp}`, label: site.whatsappDisplay, icon: 'simple-icons:whatsapp', external: true },
  { href: site.socials.linkedin, label: 'LinkedIn', icon: 'simple-icons:linkedin', external: true },
  { href: site.socials.github, label: 'GitHub', icon: 'simple-icons:github', external: true },
];
---
<section id="contact" class="js-section reveal container py-16 md:py-24" aria-labelledby="contact-title">
  <SectionHeading id="contact" eyebrow="Contact" title="Let's build something." />
  <div class="grid gap-10 md:grid-cols-[1fr_1.3fr]">
    <div>
      <p class="text-muted">Have a project, a role, or just a question? Send a message and I'll get back to you, usually within a day.</p>
      <ul class="mt-6 space-y-3">
        {direct.map((d) => (
          <li>
            <a href={d.href} class="inline-flex items-center gap-3 text-fg hover:text-accent" {...(d.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              <Icon name={d.icon} class="size-5 text-accent" aria-hidden="true" /><span>{d.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
    <ContactForm />
  </div>
</section>
```

`src/components/WhatsAppFab.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import { site } from '../data/site';
---
<a
  id="whatsapp-fab"
  href={`https://wa.me/${site.whatsapp}`}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Chat on WhatsApp"
  class="fixed bottom-5 right-5 z-40 inline-flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 motion-reduce:hover:scale-100"
>
  <Icon name="simple-icons:whatsapp" class="size-6" aria-hidden="true" />
</a>
<script>
  const fab = document.getElementById('whatsapp-fab');
  const contact = document.getElementById('contact');
  if (fab && contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { fab.hidden = en.isIntersecting; }, { threshold: 0.2 }).observe(contact);
  }
</script>
```
In `index.astro`: replace the contact placeholder with `<Contact />`, add `<WhatsAppFab />` after `<Footer />`.

- [ ] **Step 6: Verify manually with a mock endpoint**

Create `scripts/mock-endpoint.mjs` (dev only):
```js
import { createServer } from 'node:http';
createServer((req, res) => {
  let b = ''; req.on('data', (c) => (b += c));
  req.on('end', () => {
    console.log('received', b);
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify(b.includes('fail') ? { ok: false, error: 'Mock failure' } : { ok: true }));
  });
}).listen(8787, () => console.log('mock on :8787'));
```
Run `node scripts/mock-endpoint.mjs` in one shell and `PUBLIC_CONTACT_ENDPOINT=http://localhost:8787 npm run dev` in another. Check: invalid fields show messages and focus the first one; counter updates; submit disables and shows "Sending…"; success resets form; message containing "fail" shows error with WhatsApp/mailto links; WhatsApp button opens wa.me with prefilled text; FAB hides while contact is on screen.

- [ ] **Step 7: Build, test, commit**

Run: `npm run build && npm test && npm run check`
```bash
git add -A
git commit -m "feat: contact form with fetch delivery, WhatsApp click-to-chat and floating button"
```

---

### Task 9: Google Apps Script backend

**Files:**
- Create: `apps-script/Code.gs`, `apps-script/README.md`
- Test: `tests/apps-script.test.ts`

**Interfaces:**
- Produces (inside Code.gs, global functions): `safeCell(value)`, `validateSubmission(p)` → `{ ok: true, data } | { ok: false, error }`, `doPost(e)`.

- [ ] **Step 1: Failing test harness (runs Code.gs in a VM with stubbed Google services)**

`tests/apps-script.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { beforeEach, describe, expect, it } from 'vitest';

type Ctx = ReturnType<typeof makeContext>;
function makeContext() {
  const rows: unknown[][] = [];
  const emails: Record<string, unknown>[] = [];
  const fetches: string[] = [];
  const cache = new Map<string, string>();
  let fetchStatus = 200;
  const range = { setNumberFormat: () => range, setValues: (v: unknown[][]) => { rows.push(...v); return range; } };
  const sheet = {
    getLastRow: () => rows.length,
    getRange: () => range,
    appendRow: (r: unknown[]) => rows.push(r),
  };
  const ss = { getSheetByName: () => sheet, insertSheet: () => sheet };
  const ctx = {
    rows, emails, fetches, cache, setFetchStatus: (s: number) => (fetchStatus = s),
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => ({ CALLMEBOT_PHONE: '+310000', CALLMEBOT_APIKEY: '123', NOTIFY_EMAIL: 'me@x.io' }[k] ?? null) }) },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v) }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss },
    MailApp: { sendEmail: (o: Record<string, unknown>) => emails.push(o) },
    UrlFetchApp: { fetch: (u: string) => { fetches.push(u); return { getResponseCode: () => fetchStatus, getContentText: () => '' }; } },
    ContentService: { createTextOutput: (t: string) => ({ text: t, setMimeType() { return this; } }), MimeType: { JSON: 'json' } },
    Logger: { log: () => {} },
    Utilities: { formatDate: () => '2026-10-09 10:00' },
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync('apps-script/Code.gs', 'utf8'), ctx);
  return ctx as typeof ctx & { doPost: (e: unknown) => { text: string }; safeCell: (v: unknown) => unknown; validateSubmission: (p: Record<string, string>) => { ok: boolean; error?: string } };
}
const post = (c: Ctx, p: Record<string, string>) => JSON.parse(c.doPost({ parameter: p }).text);
const good = { name: 'Zoë O\'Brien', email: 'zoe@example.com', phone: '+31 6 1234 5678', message: 'Hello there, I have a project.', website: '' };

let c: Ctx;
beforeEach(() => { c = makeContext(); });

describe('safeCell', () => {
  it('prefixes formula-looking values with an apostrophe', () => {
    for (const v of ['=1+1', '+316', '-5', '@me']) expect(c.safeCell(v)).toBe(`'${v}`);
    expect(c.safeCell('plain')).toBe('plain');
    expect(c.safeCell('')).toBe('');
  });
});

describe('validateSubmission', () => {
  it('accepts unicode names and international phones', () => {
    expect(c.validateSubmission(good).ok).toBe(true);
    expect(c.validateSubmission({ ...good, name: 'محمد', phone: '' }).ok).toBe(true);
  });
  it('rejects bad email, short message, short phone', () => {
    expect(c.validateSubmission({ ...good, email: 'nope' }).ok).toBe(false);
    expect(c.validateSubmission({ ...good, message: 'short' }).ok).toBe(false);
    expect(c.validateSubmission({ ...good, phone: '12345' }).ok).toBe(false);
  });
});

describe('doPost', () => {
  it('rejects the honeypot silently with ok:false', () => {
    expect(post(c, { ...good, website: 'spam' })).toEqual({ ok: false, error: 'Rejected' });
    expect(c.emails).toHaveLength(0);
  });
  it('appends a row, emails with replyTo and pings CallMeBot', () => {
    expect(post(c, good)).toEqual({ ok: true });
    expect(c.rows).toHaveLength(1);
    expect(c.rows[0][3]).toBe("'+31 6 1234 5678");
    expect(c.emails[0]).toMatchObject({ to: 'me@x.io', replyTo: 'zoe@example.com' });
    expect(c.fetches[0]).toContain('api.callmebot.com/whatsapp.php');
    expect(c.fetches[0]).toContain('apikey=123');
  });
  it('still succeeds when CallMeBot fails', () => {
    c.setFetchStatus(500);
    expect(post(c, good)).toEqual({ ok: true });
  });
  it('rate limits the 6th submission per email per hour', () => {
    for (let i = 0; i < 5; i++) expect(post(c, good).ok).toBe(true);
    expect(post(c, good)).toMatchObject({ ok: false, error: expect.stringMatching(/too many/i) });
  });
});
```
Run: `npm test` → FAIL (file missing).

- [ ] **Step 2: Write Code.gs**

`apps-script/Code.gs`:
```js
/**
 * resvan.in contact form backend.
 * Deploy as Web App: Execute as "Me", Who has access "Anyone".
 * Script Properties (Project Settings → Script Properties):
 *   NOTIFY_EMAIL      where to send notifications (default muhammedresvan@gmail.com)
 *   CALLMEBOT_PHONE   your WhatsApp number with country code, e.g. +916238577673
 *   CALLMEBOT_APIKEY  key CallMeBot sent you
 *   SHEET_ID          optional; defaults to the spreadsheet this script is bound to
 */
var SHEET_NAME = 'responses';
var RATE_LIMIT = 5;          // submissions per email
var RATE_WINDOW_SEC = 3600;  // per hour

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.website) return json_({ ok: false, error: 'Rejected' });

    var v = validateSubmission(p);
    if (!v.ok) return json_({ ok: false, error: v.error });
    var d = v.data;

    if (isRateLimited_(d.email)) return json_({ ok: false, error: 'Too many messages from this email. Please try again later.' });

    appendRow_(d, p.userAgent || '');
    sendEmail_(d);
    notifyWhatsApp_(d); // best effort
    return json_({ ok: true });
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return json_({ ok: false, error: 'Something went wrong on the server.' });
  }
}

function validateSubmission(p) {
  var name = String(p.name || '').trim();
  var email = String(p.email || '').trim();
  var phone = String(p.phone || '').trim();
  var message = String(p.message || '').trim();
  if (name.length < 2 || name.length > 60) return { ok: false, error: 'Name must be 2–60 characters.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'Invalid email address.' };
  if (phone) {
    if (!/^\+?[\d\s().-]+$/.test(phone)) return { ok: false, error: 'Invalid phone number.' };
    var digits = phone.replace(/\D/g, '').length;
    if (digits < 7 || digits > 15) return { ok: false, error: 'Phone must have 7–15 digits.' };
  }
  if (message.length < 10 || message.length > 2000) return { ok: false, error: 'Message must be 10–2000 characters.' };
  return { ok: true, data: { name: name, email: email, phone: phone, message: message } };
}

/** Prevent formula injection: Sheets treats leading = + - @ as formulas. */
function safeCell(value) {
  var s = value === null || value === undefined ? '' : String(value);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function isRateLimited_(email) {
  var cache = CacheService.getScriptCache();
  var key = 'rl:' + email.toLowerCase();
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), RATE_WINDOW_SEC);
  return n > RATE_LIMIT;
}

function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Message', 'User agent']);
  return sheet;
}

function appendRow_(d, ua) {
  var sheet = getSheet_();
  var row = [new Date(), d.name, d.email, d.phone, d.message, ua].map(safeCell);
  var r = sheet.getLastRow() + 1;
  var range = sheet.getRange(r, 1, 1, row.length);
  range.setNumberFormat('@');
  range.setValues([row]);
}

function sendEmail_(d) {
  var to = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL') || 'muhammedresvan@gmail.com';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var html =
    '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#171a21">' +
    '<h2 style="margin:0 0 16px">New message from resvan.in</h2>' +
    '<table style="border-collapse:collapse;width:100%">' +
    '<tr><td style="padding:6px 0;color:#4f5a73;width:90px">Name</td><td style="padding:6px 0">' + esc(d.name) + '</td></tr>' +
    '<tr><td style="padding:6px 0;color:#4f5a73">Email</td><td style="padding:6px 0"><a href="mailto:' + esc(d.email) + '">' + esc(d.email) + '</a></td></tr>' +
    '<tr><td style="padding:6px 0;color:#4f5a73">Phone</td><td style="padding:6px 0">' + (d.phone ? esc(d.phone) : '—') + '</td></tr>' +
    '</table>' +
    '<p style="white-space:pre-wrap;background:#eef1f5;padding:16px;border-radius:8px">' + esc(d.message) + '</p>' +
    '<p style="color:#4f5a73;font-size:12px">Reply to this email to answer ' + esc(d.name) + ' directly.</p></div>';
  MailApp.sendEmail({
    to: to,
    replyTo: d.email,
    subject: 'Portfolio contact: ' + d.name,
    htmlBody: html,
    body: 'Name: ' + d.name + '\nEmail: ' + d.email + '\nPhone: ' + (d.phone || '-') + '\n\n' + d.message,
  });
}

function notifyWhatsApp_(d) {
  try {
    var props = PropertiesService.getScriptProperties();
    var phone = props.getProperty('CALLMEBOT_PHONE');
    var key = props.getProperty('CALLMEBOT_APIKEY');
    if (!phone || !key) { Logger.log('CallMeBot not configured'); return; }
    var text = 'New portfolio message from ' + d.name + ' <' + d.email + '>' + (d.phone ? ' ' + d.phone : '') + ':\n' + d.message.slice(0, 500);
    var url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(phone) +
      '&text=' + encodeURIComponent(text) + '&apikey=' + encodeURIComponent(key);
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() >= 300) Logger.log('CallMeBot failed: ' + res.getResponseCode() + ' ' + res.getContentText());
  } catch (err) {
    Logger.log('CallMeBot error: ' + err);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
```
Run: `npm test` → PASS.

- [ ] **Step 3: README**

`apps-script/README.md`:
```markdown
# Contact form backend (Google Apps Script)

Free pipeline: form → Google Sheet row → email to you → WhatsApp ping via CallMeBot.

## 1. Create the sheet and script
1. Go to https://sheets.new and name the spreadsheet "resvan.in contact".
2. Extensions → Apps Script. Delete the default code, paste `Code.gs`, save (Ctrl/Cmd+S).
   A sheet tab named `responses` is created on the first submission.

## 2. Get a CallMeBot API key (WhatsApp)
1. Save +34 644 71 81 99 in your phone contacts as "CallMeBot".
2. From WhatsApp send it: `I allow callmebot to send me messages`
3. Within a couple of minutes it replies with your API key. Keep it private.
   (Current instructions: https://www.callmebot.com/blog/free-api-whatsapp-messages/)

## 3. Set Script Properties
In the Apps Script editor: gear icon (Project Settings) → scroll to **Script Properties** → **Add script property**.

| Property | Value |
|---|---|
| `NOTIFY_EMAIL` | `muhammedresvan@gmail.com` |
| `CALLMEBOT_PHONE` | `+916238577673` |
| `CALLMEBOT_APIKEY` | the key from step 2 |
| `SHEET_ID` | leave unset (script is bound to the sheet) |

Save. Nothing here is ever sent to the browser.

## 4. Deploy as a web app
1. Deploy → New deployment → gear → **Web app**.
2. Description: `contact v1`. Execute as: **Me**. Who has access: **Anyone**.
3. Deploy → authorise with your Google account (Advanced → Go to project if warned) → copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`).

## 5. Test it
```bash
curl -L -X POST "<WEB_APP_URL>" \
  -d name="Test Person" -d email="you@example.com" -d phone="+31 6 1234 5678" \
  -d message="Hello from curl, this is a test." -d website=""
# → {"ok":true}
```
Check: a row in `responses`, an email in your inbox, a WhatsApp message.

## 6. Connect the site
- Local: put the URL in `.env` as `PUBLIC_CONTACT_ENDPOINT=…`.
- GitHub: repo Settings → Secrets and variables → Actions → **Variables** → New repository variable `PUBLIC_CONTACT_ENDPOINT` = the URL.

## Changing the script later
Edit `Code.gs` in the editor, then Deploy → **Manage deployments** → pencil → Version: **New version** → Deploy. The URL stays the same.

## Limits
MailApp: ~100 emails/day on a free account. CacheService rate limit: 5 messages per email address per hour.
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Apps Script backend with sheet, email, CallMeBot and tests"
```

---

### Task 10: Case-study pages, blog scaffold, OG images

**Files:**
- Create: `src/pages/projects/[slug].astro`, `src/content.config.ts`, `src/content/blog/.gitkeep`, `src/pages/blog/index.astro`, `src/pages/blog/[id].astro`, `src/lib/og.ts`, `src/pages/og/[...slug].png.ts`, `src/assets/fonts/Inter-Regular.ttf`, `src/assets/fonts/Inter-Bold.ttf`
- Test: `tests/og.test.ts`; `tests/dist.test.ts` already covers blog/sitemap/og output.

- [ ] **Step 1: Vendor Inter TTF for satori** (satori needs TTF/OTF, not woff2)

```bash
mkdir -p src/assets/fonts /tmp/inter && cd /tmp/inter
curl -sL -o inter.zip https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip
unzip -q -o inter.zip
find . -iname 'Inter-Regular.ttf' -o -iname 'Inter-Bold.ttf' | head
cd - && cp "$(find /tmp/inter -iname 'Inter-Regular.ttf' | head -1)" src/assets/fonts/Inter-Regular.ttf
cp "$(find /tmp/inter -iname 'Inter-Bold.ttf' | head -1)" src/assets/fonts/Inter-Bold.ttf
cp "$(find /tmp/inter -iname 'LICENSE*' | head -1)" src/assets/fonts/LICENSE.txt
```

- [ ] **Step 2: OG renderer + test**

`tests/og.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { renderOg } from '../src/lib/og';

describe('renderOg', () => {
  it('renders a 1200x630 PNG', async () => {
    const png = await renderOg({ title: 'Muhammed Resvan K', subtitle: 'Software Engineer | Kerala, India' });
    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  }, 20000);
});
```

`src/lib/og.ts`:
```ts
import { readFile } from 'node:fs/promises';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const fontDir = new URL('../assets/fonts/', import.meta.url);
let fonts: { name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[] | null = null;
async function loadFonts() {
  fonts ??= [
    { name: 'Inter', data: await readFile(new URL('Inter-Regular.ttf', fontDir)), weight: 400, style: 'normal' },
    { name: 'Inter', data: await readFile(new URL('Inter-Bold.ttf', fontDir)), weight: 700, style: 'normal' },
  ];
  return fonts;
}

const h = (type: string, props: Record<string, unknown>, ...children: unknown[]) => ({ type, props: { ...props, children } });

export async function renderOg({ title, subtitle }: { title: string; subtitle: string }): Promise<Buffer> {
  const svg = await satori(
    h('div', { style: { width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'linear-gradient(135deg,#0f1113 0%,#181a1b 100%)', color: '#e6ecf7', fontFamily: 'Inter' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, color: '#5d9ce2', fontWeight: 700 } },
        h('div', { style: { width: 44, height: 44, borderRadius: 10, background: '#5d9ce2', color: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 } }, 'R'),
        'resvan.in'),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
        h('div', { style: { fontSize: title.length > 40 ? 56 : 72, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 } }, title),
        h('div', { style: { fontSize: 32, color: '#9aa5c0' } }, subtitle)),
      h('div', { style: { fontSize: 24, color: '#9aa5c0' } }, 'Software Engineer · Kerala, India · open to remote')),
    { width: 1200, height: 630, fonts: await loadFonts() },
  );
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
}
```
Run: `npm test` → og test passes.

- [ ] **Step 3: OG endpoint**

`src/pages/og/[...slug].png.ts`:
```ts
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOg } from '../../lib/og';
import { site } from '../../data/site';
import { featuredProjects } from '../../data/projects';

export const getStaticPaths = (() => [
  { params: { slug: 'home' }, props: { title: site.name, subtitle: `${site.jobTitle} | ${site.address.region}, India` } },
  { params: { slug: 'blog' }, props: { title: 'Blog', subtitle: `Notes by ${site.name}` } },
  ...featuredProjects.map((p) => ({ params: { slug: `projects/${p.slug}` }, props: { title: p.name, subtitle: `Case study by ${site.name}` } })),
]) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as { title: string; subtitle: string });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
```

- [ ] **Step 4: Case-study page**

`src/pages/projects/[slug].astro`:
```astro
---
import { Image } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import JsonLd from '../../components/JsonLd.astro';
import { featuredProjects, type Project } from '../../data/projects';
import { getProjectImage } from '../../lib/project-images';
import { site } from '../../data/site';

export function getStaticPaths() {
  return featuredProjects.map((project) => ({ params: { slug: project.slug }, props: { project } }));
}
const { project } = Astro.props as { project: Project };
const image = getProjectImage(project.slug);
const path = `/projects/${project.slug}/`;
const graph = [
  { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: site.url },
    { '@type': 'ListItem', position: 2, name: 'Work', item: `${site.url}/#work` },
    { '@type': 'ListItem', position: 3, name: project.name, item: `${site.url}${path}` },
  ] },
];
---
<BaseLayout title={`${project.name} case study | ${site.alternateName}`} description={project.description.slice(0, 155)} ogImage={`/og${path.replace(/\/$/, '')}.png`} {path}>
  <JsonLd slot="head" graph={graph} />
  <Header />
  <main id="main" class="container flex-1 py-12 md:py-20">
    <a href="/#work" class="inline-flex items-center gap-1 text-step--1 text-muted hover:text-fg"><Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" /> All work</a>
    <h1 class="mt-6 text-step-4 font-bold">{project.name}</h1>
    <p class="mt-4 max-w-prose text-step-1 text-muted">{project.description}</p>
    <Image src={image} alt={`Screenshot of ${project.name}`} widths={[640, 960, 1280]} sizes="(min-width: 1152px) 1152px, 100vw" class="mt-10 w-full rounded-2xl border border-line" loading="eager" />
    <div class="mt-12 grid gap-10 md:grid-cols-[2fr_1fr]">
      <div class="space-y-10">
        <section aria-labelledby="problem"><h2 id="problem" class="text-step-2 font-semibold">The problem</h2><p class="mt-3 text-muted">{project.caseStudy?.problem}</p></section>
        <section aria-labelledby="built"><h2 id="built" class="text-step-2 font-semibold">What I built</h2><p class="mt-3 text-muted">{project.caseStudy?.built}</p></section>
      </div>
      <aside class="h-fit rounded-2xl border border-line bg-surface p-6">
        <h2 class="text-step-0 font-semibold">Stack</h2>
        <ul class="mt-3 flex flex-wrap gap-2">{project.stack.map((s) => <li class="rounded-full border border-line px-3 py-1 text-step--1 text-muted">{s}</li>)}</ul>
        <a href={project.url} target="_blank" rel="noopener noreferrer" class="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 font-medium text-accent-fg">Visit {project.name} <Icon name="lucide:external-link" class="size-4" aria-hidden="true" /></a>
      </aside>
    </div>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 5: Blog scaffold**

`src/content.config.ts`:
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().max(60),
    description: z.string().max(155),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});
export const collections = { blog };
```
Create empty `src/content/blog/.gitkeep`.

`src/pages/blog/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import { site } from '../../data/site';
const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---
<BaseLayout title={`Blog | ${site.alternateName}`} description={`Notes on web and mobile engineering by ${site.name}.`} ogImage="/og/blog.png" path="/blog/" noindex={posts.length === 0}>
  <Header />
  <main id="main" class="container flex-1 py-12 md:py-20">
    <h1 class="text-step-4 font-bold">Blog</h1>
    {posts.length === 0 ? (
      <p class="mt-4 text-muted">No posts yet. Meanwhile, see <a href="/#work" class="text-accent underline-offset-4 hover:underline">my work</a>.</p>
    ) : (
      <ul class="mt-8 space-y-6">
        {posts.map((p) => (
          <li><a href={`/blog/${p.id}/`} class="text-step-1 font-semibold text-accent underline-offset-4 hover:underline">{p.data.title}</a>
            <p class="text-step--1 text-muted"><time datetime={p.data.pubDate.toISOString()}>{p.data.pubDate.toDateString()}</time></p>
            <p class="mt-1 text-muted">{p.data.description}</p></li>
        ))}
      </ul>
    )}
  </main>
  <Footer />
</BaseLayout>
```

`src/pages/blog/[id].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import { site } from '../../data/site';
export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}
const { post } = Astro.props;
const { Content } = await render(post);
---
<BaseLayout title={`${post.data.title} | ${site.alternateName}`} description={post.data.description} ogImage="/og/blog.png" path={`/blog/${post.id}/`}>
  <Header />
  <main id="main" class="container flex-1 py-12 md:py-20">
    <article class="prose-custom max-w-prose">
      <h1 class="text-step-4 font-bold">{post.data.title}</h1>
      <p class="mt-2 text-step--1 text-muted"><time datetime={post.data.pubDate.toISOString()}>{post.data.pubDate.toDateString()}</time></p>
      <div class="mt-8 space-y-4 text-muted [&_a]:text-accent [&_h2]:mt-8 [&_h2]:text-step-2 [&_h2]:font-semibold [&_h2]:text-fg [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-surface [&_pre]:p-4"><Content /></div>
    </article>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 6: Build and run every test**

Run: `npm run build && npm test && npm run check`
Expected: `dist/og/home.png`, `dist/og/blog.png`, `dist/og/projects/<slug>.png` exist; `dist/projects/<slug>/index.html` ×3; `dist/blog/index.html` with noindex; sitemap without `/blog`; all dist tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: case-study pages, blog collection scaffold and build-time OG images"
```

---

### Task 11: Deploy workflow, README, cleanup of old files

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`, `tests/smoke.test.ts`
- Delete: `index.html`, `style.css`, `script.js`, `Validate-Form.js`, `logo.svg`, `resvan-logo.png`

- [ ] **Step 1: Workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          PUBLIC_CONTACT_ENDPOINT: ${{ vars.PUBLIC_CONTACT_ENDPOINT }}
      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```
Check the latest majors with `gh api repos/actions/setup-node/releases/latest --jq .tag_name` and `gh api repos/actions/upload-pages-artifact/releases/latest --jq .tag_name`; adjust if newer.

- [ ] **Step 2: Delete old files and flip the smoke test**

```bash
git rm -q index.html style.css script.js Validate-Form.js logo.svg resvan-logo.png
```
In `tests/smoke.test.ts` change the last test to:
```ts
  it('old jQuery-era files are gone', () => {
    for (const f of ['index.html', 'style.css', 'script.js', 'Validate-Form.js']) expect(existsSync(f), f).toBe(false);
  });
```

- [ ] **Step 3: README**

`README.md`:
```markdown
# resvan.in

Personal portfolio of Muhammed Resvan K. Astro 7 + Tailwind 4, static output, deployed to GitHub Pages.

## Local development
```bash
npm install
cp .env.example .env        # optional: set PUBLIC_CONTACT_ENDPOINT
npm run dev                 # http://localhost:4321
npm run build && npm run preview
npm test                    # unit tests + dist checks (dist checks need a build first)
npm run check               # astro check (types)
```
Node 22.12+ required.

## Where things live
- `src/data/site.ts` — name, title, description, email, WhatsApp, socials, GA id. Change identity here only.
- `src/data/projects.ts`, `experience.ts`, `skills.ts`, `services.ts` — content.
- `src/components/` — one component per section. `src/scripts/` — the only client JS.
- `src/content/blog/` — markdown posts (`title`, `description`, `pubDate`, optional `updatedDate`, `draft`).
- `apps-script/` — the contact form backend and its setup guide.

## Add a project
1. Add an object to `src/data/projects.ts`. Set `featured: true` and a `caseStudy` to get a `/projects/<slug>/` page.
2. Drop a screenshot at `src/assets/projects/<slug>.png` (1280×800 works well). Without one, the placeholder is used.
3. `npm run screenshots` captures live sites listed in `scripts/screenshots.sh`.

## Add a blog post
Create `src/content/blog/my-post.md` with frontmatter; the `/blog` page and sitemap pick it up on the next build.

## Deploy
Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages at https://resvan.in (`public/CNAME`).

Env/variables:
| Name | Where | Purpose |
|---|---|---|
| `PUBLIC_CONTACT_ENDPOINT` | `.env` locally, Actions **variable** on GitHub | Apps Script web app URL |

## One-time manual checklist
- [ ] Deploy `apps-script/Code.gs` as a web app and set its Script Properties (see `apps-script/README.md`).
- [ ] Add `PUBLIC_CONTACT_ENDPOINT` as a GitHub Actions repository **variable**.
- [ ] GitHub → Settings → Pages → Source: **GitHub Actions** (currently "Deploy from a branch").
- [ ] Merge `redesign` into `main` and watch the first workflow run.
- [ ] Search Console: submit `https://resvan.in/sitemap-index.xml`.
- [ ] Replace every `TODO:` in `src/data/experience.ts` and `src/data/projects.ts`.
- [ ] Replace placeholder screenshots in `src/assets/projects/`.
- [ ] Optional: set `availableForFreelance` in `src/data/site.ts` when that changes.
```

- [ ] **Step 4: Verify and commit**

Run: `npm run build && npm test && npm run check`
```bash
git add -A
git commit -m "chore: GitHub Pages workflow, README and removal of legacy site files"
```

---

### Task 12: Verification pass (responsive, Lighthouse, budgets)

**Files:** none new unless fixes are needed.

- [ ] **Step 1: Serve the build**

Run: `npm run build && npx serve dist -l 4173 &` (or `npm run preview`).

- [ ] **Step 2: Responsive check with headless Chrome**

`scripts/responsive-check.mjs` (dev only, run with `npx -y puppeteer-core@24 node scripts/responsive-check.mjs` is not needed; just `npm i -D puppeteer-core` then `node scripts/responsive-check.mjs`):
```js
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage();
for (const [w, h] of [[360, 800], [768, 1024], [1280, 800], [1920, 1080]]) {
  await page.setViewport({ width: w, height: h });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  const r = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: innerWidth, h1: document.querySelectorAll('h1').length }));
  await page.screenshot({ path: `/tmp/shot-${w}.png`, fullPage: true });
  console.log(w, r, r.scrollWidth <= r.innerWidth ? 'OK' : 'HORIZONTAL SCROLL');
}
await browser.close();
```
Expected: `OK` at all four widths. Open the screenshots and check both themes (add `?` free: toggle by `page.evaluate(() => document.documentElement.dataset.theme = 'light')` before a second screenshot) for readability, the menu at 360, and the FAB hidden at `#contact` (`page.evaluate(() => document.getElementById('whatsapp-fab').hidden)` after scrolling to `#contact`).

- [ ] **Step 3: Lighthouse**

Run:
```bash
npx -y lighthouse http://localhost:4173 --preset=perf --form-factor=mobile --screenEmulation.mobile --output=json --output-path=/tmp/lh.json --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo
node -e "const r=require('/tmp/lh.json');for(const c of Object.values(r.categories))console.log(c.id,Math.round(c.score*100));for(const a of ['largest-contentful-paint','cumulative-layout-shift','total-blocking-time'])console.log(a,r.audits[a].displayValue)"
```
JS budget: `gzip -c dist/_astro/*.js | wc -c` for first-party scripts.

- [ ] **Step 4: Fix anything below target**, re-run, record the final numbers in the final report. Commit fixes as `fix: …`.

- [ ] **Step 5: Final report to the user** with scores, JS size, what was captured for screenshots, and the manual checklist.
