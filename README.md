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
2. Drop a screenshot at `src/assets/projects/<slug>.png` (or `.webp`, 1280×800 works well). Without one, the placeholder is used.
3. `npm run screenshots` captures live sites listed in `scripts/screenshots.sh`.

## Add a blog post

Create `src/content/blog/my-post.md` with frontmatter; the `/blog` page and sitemap pick it up on the next build. While there are no posts, `/blog` is `noindex` and left out of the sitemap.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds and publishes to GitHub Pages at https://resvan.in (`public/CNAME`).

| Name | Where | Purpose |
|---|---|---|
| `PUBLIC_CONTACT_ENDPOINT` | `.env` locally, Actions **variable** on GitHub | Apps Script web app URL |

## One-time manual checklist

- [ ] Deploy `apps-script/Code.gs` as a web app (see `apps-script/README.md`). Script Properties and CallMeBot are optional.
- [ ] Add `PUBLIC_CONTACT_ENDPOINT` as a GitHub Actions repository **variable** (Settings → Secrets and variables → Actions → Variables).
- [ ] GitHub → Settings → Pages → Source: **GitHub Actions** (currently "Deploy from a branch").
- [ ] Merge `redesign` into `main` and watch the first workflow run.
- [ ] Search Console: submit `https://resvan.in/sitemap-index.xml`.
- [ ] Replace every `TODO:` in `src/data/experience.ts` and `src/data/projects.ts`.
- [ ] Replace placeholder screenshots in `src/assets/projects/` (CleverPush landing, Hawr Learn).
- [ ] Optional: flip `availableForFreelance` in `src/data/site.ts` when that changes.
