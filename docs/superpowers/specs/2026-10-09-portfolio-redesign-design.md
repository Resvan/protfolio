# resvan.in redesign — design spec

Date: 2026-10-09. Branch: `redesign`. Status: approved.

## 1. Goal

Replace the hand-written static site (`index.html`, `style.css`, jQuery) with an
Astro + Tailwind static site that is fast, accessible, SEO-consistent and easy to
extend, deployed to GitHub Pages at `https://resvan.in` through GitHub Actions.
Keep the identity (dark-first, blue accent) but make it read as a senior
engineer's 2026 portfolio.

Success criteria

- Lighthouse mobile ≥ 95 on Performance, Accessibility, Best Practices, SEO.
- LCP < 2.0 s, CLS < 0.05, first-party JS on `/` < 30 KB.
- No content hidden without JS. No horizontal scroll at 360 / 768 / 1280 / 1920.
- Contact form delivers to email + Google Sheet + WhatsApp (CallMeBot) with
  honest success/error states, and a wa.me fallback that needs no backend.
- Title, description, OG, Twitter, JSON-LD and manifest all say the same thing.

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | Astro (latest stable), `output: 'static'` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, design tokens as CSS variables in `src/styles/global.css` |
| Fonts | Astro Fonts API: Instrument Serif (display, regular + italic, Google latin subsets, preloaded) + Inter variable (body, fontsource, not preloaded), `font-display: swap`. Labels use a system mono stack. |
| Icons | Inline SVG components in `src/components/icons/` (hand-picked, ~10 icons). No icon font. |
| Images | `astro:assets` `<Image>` / `<Picture>`: AVIF + WebP, explicit dimensions, `loading="lazy"` below the fold |
| Sitemap | `@astrojs/sitemap` |
| OG images | Build-time endpoint `src/pages/og/[...slug].png.ts` using `satori` + `@resvg/resvg-js`, 1200×630 PNG per page |
| Analytics | gtag `G-SMPFVLGNW2` injected after `load` on `requestIdleCallback`. Not Partytown. |
| Client JS | Three small vanilla modules: header/menu, theme toggle, contact form. No framework islands. |
| Hosting | GitHub Pages, workflow `.github/workflows/deploy.yml`, custom domain via `public/CNAME` |

## 3. Repository layout

```
.
├── .github/workflows/deploy.yml
├── apps-script/
│   ├── Code.gs
│   └── README.md
├── public/
│   ├── CNAME
│   ├── googledef350d25cac39af.html      (Search Console — keep)
│   ├── robots.txt
│   ├── manifest.webmanifest
│   ├── favicon.svg  favicon-32.png  apple-touch-icon.png
│   ├── icon-192.png  icon-512.png  icon-maskable-512.png
│   └── 404 handled by src/pages/404.astro
├── src/
│   ├── assets/
│   │   ├── resvan.jpg                   (photo, processed by astro:assets)
│   │   ├── logo.svg                     (R monogram, source for all icons)
│   │   └── projects/<slug>.png          (screenshots; placeholder.svg fallback)
│   ├── components/
│   │   ├── Header.astro  MobileMenu (inside Header)  ThemeToggle.astro  SkipLink.astro
│   │   ├── Hero.astro  About.astro  SkillGroups.astro  Experience.astro
│   │   ├── Services.astro  Work.astro  FeaturedProject.astro  ProjectCard.astro
│   │   ├── Contact.astro  ContactForm.astro  WhatsAppFab.astro  Footer.astro
│   │   ├── Seo.astro  JsonLd.astro  Analytics.astro
│   │   └── icons/*.astro
│   ├── content.config.ts                (blog collection, 0 posts)
│   ├── content/blog/.gitkeep
│   ├── data/
│   │   ├── site.ts        identity: name, alternateName, jobTitle, employer, location,
│   │   │                  email, whatsapp, socials, availableForFreelance, analyticsId
│   │   ├── skills.ts      grouped chips
│   │   ├── experience.ts  timeline entries
│   │   ├── services.ts    3 cards
│   │   └── projects.ts    8 projects, `featured: boolean`, image slot
│   ├── layouts/BaseLayout.astro
│   ├── lib/
│   │   ├── og.ts          satori template shared by all OG routes
│   │   └── validation.ts  shared client-side rules (also documented in Code.gs)
│   ├── pages/
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   ├── projects/[slug].astro        featured projects only
│   │   ├── blog/index.astro  blog/[slug].astro
│   │   └── og/[...slug].png.ts
│   ├── scripts/
│   │   ├── header.ts  theme.ts  contact-form.ts  reveal.ts
│   └── styles/global.css
├── astro.config.mjs  tsconfig.json  package.json  .env.example
└── README.md
```

Deleted: `index.html`, `style.css`, `script.js`, `Validate-Form.js`, `logo.svg`
(PNG-in-SVG), `resvan-logo.png`, `Images/`, `sitemap.xml` (generated), root
`manifest.json`, `CNAME`/`robots.txt`/verification file (moved to `public/`).

## 4. Content & data

### 4.1 Identity (`site.ts`)

- name "Muhammed Resvan K", alternateName "Resvan", jobTitle "Software Engineer",
  worksFor Salesdock (https://salesdock.com), location Malappuram, Kerala, IN.
- Tagline: "Software Engineer building fast, accessible web & mobile products —
  currently at Salesdock". Location line: "Kerala, India · open to remote".
- Title (≤60): `Muhammed Resvan K — Software Engineer | Kerala, India`
- Description (≤155): `Software Engineer in Kerala, India building fast, accessible web and mobile apps with React, Next.js, React Native and Node.js. Open to remote work.`
- email muhammedresvan@gmail.com, WhatsApp +91 6238577673,
  socials: LinkedIn, GitHub (Resvan), Instagram (rsv_n.__k).
- `availableForFreelance: true` drives the hero status pill.

### 4.2 Skills (chips, grouped)

Frontend: React, Next.js, TypeScript, Tailwind CSS · Mobile: React Native, Flutter ·
Backend: Node.js, Express, WebSockets · Data: MongoDB, ArangoDB, Redis ·
Tools: Git, AWS EC2, Vercel.

### 4.3 Experience (newest first)

| Company | Title | Dates | Link |
|---|---|---|---|
| Salesdock | Software Developer L2 | Feb 2025 – present | salesdock.com |
| CleverPush | Software Engineer | Jul 2024 – Jan 2025 | cleverpush.com |
| Hawr Technologies | Full-stack Developer | Jan 2024 – Jun 2024 | hawrtechnologies.com |
| Adam Technologies | MERN Stack Developer | Oct 2023 – Dec 2023 | linkedin.com/company/adam-technologies (company closed; shown with a "company closed" note) |
| Duple IT Solutions | Software Development Engineer-1 | May 2023 – Sep 2023 | dupleit.com |
| Brocamp (Brototype) | Trainee, self-learning web development programme | Aug 2022 – Mar 2023 | brototype.in |

Each entry has `highlights: string[]` seeded with 2–3 `TODO:` bullets. No invented
metrics. Rendered as `<ol>` timeline. Footnote under the timeline: "Landed on
Earth, March 2000." (small, muted).

### 4.4 Services

Web apps · Mobile apps · Landing pages & SEO. Each: title, one-line promise,
3 "what you get" bullets, CTA "Contact me" → `#contact`.

### 4.5 Projects

Existing eight, descriptions and tech lists copied verbatim, Xylothia link fixed to
`https://xylothia.vercel.app/`. `featured: true` for CleverPush landing page,
Rentdigicare, Ayurvedalayam. Featured entries add `problem`, `built`
(TODO placeholders) used by the case-study page. Each has `image` pointing at
`src/assets/projects/<slug>.png`; real screenshots captured from live sites where
reachable, `placeholder.svg` otherwise. All external links
`target="_blank" rel="noopener noreferrer"` with text or `aria-label` names.

## 5. Pages & SEO

- `/` — all sections. One `<h1>` (name in hero). Landmarks: header, nav, main,
  footer. Headings h2 per section, h3 inside.
- `/projects/<slug>` — featured case studies: hero image, problem → what I built →
  stack, live link, back link. Own title/description/OG. `BreadcrumbList` JSON-LD.
- `/blog` — index lists posts from the `blog` content collection (frontmatter:
  title, description, pubDate, updatedDate?, draft?). With zero posts the index
  renders a short "No posts yet" message, carries `noindex`, and is filtered out
  of the sitemap. `/blog/<slug>` renders markdown.
- `/404` — friendly message + links home.
- `Seo.astro`: title, description, canonical (`https://resvan.in` + path),
  `theme-color` (both schemes), OG (type, url, title, description, 1200×630 image,
  alt), Twitter `summary_large_image`, manifest link, icons.
- `JsonLd.astro` on `/`: `@graph` of `Person` (name, alternateName, jobTitle,
  worksFor, address, image, email, sameAs), `WebSite`, `ProfilePage`, and an
  `ItemList` of projects. Project pages: `Article`-less; just `BreadcrumbList`.
- `robots.txt`: allow all, sitemap URL. `@astrojs/sitemap` with `lastmod` set to the
  build time for every page via the `serialize` hook (each deploy regenerates
  every page).

## 6. Design system

Direction (revised 2026-10-12 after the first build read as generic): editorial
dark, one restrained accent, serif headlines with italic emphasis, hairlines
instead of boxed cards, film-grain texture, glass header, bento About,
browser-frame project shots, oversized "Let's talk." contact panel.

Tokens in `global.css` as CSS variables, mapped into Tailwind `@theme`.

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#0a0a0b` | `#f6f4ef` (warm paper) |
| `--surface` | `#111214` | `#fffdf9` |
| `--surface-2` | `#18191c` | `#eeebe3` |
| `--text` | `#ededf0` | `#151518` |
| `--muted` | `#9a9ba3` | `#5a5a64` |
| `--accent` | `#7aaaff` | `#1f5fd0` |
| `--accent-fg` | `#0a0a0b` | `#ffffff` |
| `--border` | `rgba(255,255,255,.09)` | `rgba(20,20,24,.11)` |

All text/background pairs meet WCAG AA. Fluid type `--step--1 … --step-5`
via `clamp()` (step-5 up to 6.5rem for serif display). Headings are
Instrument Serif 400; `<em>` inside headings renders italic in the accent.
Utilities: `label` (mono uppercase eyebrow), `hairline`, `hairline-t/b`,
`glow` (radial accent glow), `.grain` (tiled 96px noise PNG at 7% opacity;
an SVG feTurbulence filter was measured and rejected). Max content width
76rem, 20px side gutters at phone width.

Hero: split layout at `lg`; the framed portrait shows only from `lg` up,
phones get a 48px avatar beside the name so the LCP element stays the h1.
About: bento grid with three fact tiles computed from data
(`src/lib/facts.ts`: whole years since the first non-training role,
companies excluding training, project count). Experience: sticky left
heading, year numerals. Services: numbered list with hairlines. Work:
`BrowserFrame` around each shot; missing shots render a themed
"Screenshot coming soon" block (`ProjectShot.astro`), not an image.

Theme: inline `<script>` in `<head>` reads `localStorage.theme` →
`prefers-color-scheme` → dark, sets `data-theme` on `<html>` before paint.
Toggle button updates `data-theme` + storage, `aria-pressed`, labelled.

Motion: `.reveal` elements start **visible**; `reveal.ts` adds `reveal-ready`
only when `IntersectionObserver` exists and `prefers-reduced-motion` is not
`reduce`, then toggles `in-view` for a 450 ms fade/10px rise. No loader.

## 7. Navigation

Sticky header, translucent surface. `header.ts`: hides on scroll down past 80px,
shows on scroll up (transform, not display). Active section via
`IntersectionObserver` sets `aria-current="true"` on the matching nav link.
Mobile menu: `<button aria-expanded aria-controls>`, panel with focus trap, Esc
closes, link click closes, `inert` on the rest of the page while open, body
scroll locked. Skip-to-content link first in `<body>`.

## 8. Contact

### 8.1 Front end (`ContactForm.astro` + `contact-form.ts`)

Fields (all with `<label>`): name (`autocomplete="name"`, 2–60 chars, Unicode
letters/marks/spaces/'-.), email (`type="email"`, `autocomplete="email"`), phone
optional (`type="tel"`, `autocomplete="tel"`, `+`, spaces, dashes, 7–15 digits),
message (10–2000, live counter `aria-live="polite"`), honeypot `website`
(visually hidden, `tabindex=-1`, `autocomplete="off"`). No hidden recipient
field.

Native validation attributes (`required`, `minlength`, `maxlength`, `pattern`)
plus JS messages rendered under each field (`aria-describedby`,
`aria-invalid`). Submit: disable button, show "Sending…", `fetch(endpoint,
{ method:'POST', body: new URLSearchParams(formData) })` (simple request, no
preflight). Success only when `response.ok` and JSON `ok === true`; then reset
form and show success in a `role="status"` region. Any other outcome → error
state in the same region with WhatsApp and mailto fallbacks. Endpoint from
`import.meta.env.PUBLIC_CONTACT_ENDPOINT`; if unset at build, the form still
renders but submit shows the fallback message.

Buttons: primary "Send message"; secondary "Message on WhatsApp" builds
`https://wa.me/916238577673?text=` + encoded prefill from current field values
and opens a new tab. Direct links row: email (mailto), WhatsApp, LinkedIn, GitHub.

`WhatsAppFab.astro`: fixed bottom-right, 48px, `aria-label="Chat on WhatsApp"`,
hidden (`hidden` attribute) while `#contact` intersects the viewport.

### 8.2 Backend (`apps-script/Code.gs`)

`doPost(e)` → parse `e.parameter`; reject honeypot; validate (name 2–60, email
regex, phone optional 7–15 digits, message 10–2000); rate-limit via
`CacheService.getScriptCache()` key `rl:<email lowercase>` max 5/hour; append
row [timestamp, name, email, phone, message, userAgent] to sheet `responses`
(created if missing) with every cell written through `safeCell()` which prefixes
`'` when value starts with `=`, `+`, `-`, `@`, and sets number format `@` on the
range; `MailApp.sendEmail({ to: NOTIFY_EMAIL, replyTo: email, subject, htmlBody,
body })`; then `UrlFetchApp.fetch(callmebot, { muteHttpExceptions: true })` in a
try/catch — failure logged, not fatal. Returns
`ContentService.createTextOutput(JSON.stringify({ok:true}))` with
`MimeType.JSON`. Script Properties: `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`,
`NOTIFY_EMAIL` (default muhammedresvan@gmail.com), `SHEET_ID` (optional; else
bound sheet). README covers deployment, properties, CallMeBot activation, test
curl, and re-deploy notes.

## 9. Build & deploy

`deploy.yml`: on push to `main` (and `workflow_dispatch`), Node 22, `npm ci`,
`npm run build` with `PUBLIC_CONTACT_ENDPOINT: ${{ vars.PUBLIC_CONTACT_ENDPOINT }}`,
`actions/upload-pages-artifact` from `dist/`, `actions/deploy-pages`.
Permissions `pages: write`, `id-token: write`. Concurrency group `pages`.

`astro.config.mjs`: `site: 'https://resvan.in'`, integrations sitemap, vite
plugin tailwind, `build.inlineStylesheets: 'auto'`.

## 10. Verification

- `npm run build` clean, `astro check` clean.
- Chrome at 360/768/1280/1920: no horizontal scroll, menu + theme toggle work,
  form validation and states work against a mock endpoint.
- Lighthouse mobile on built output served locally; report four scores + LCP,
  CLS, JS bytes.
- Manual checklist delivered in README.

## 11. Out of scope

Blog posts, real achievement bullets, real case-study copy, CMS, i18n, PWA
offline support, comments, dark/light image variants.
