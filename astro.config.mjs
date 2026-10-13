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
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
  fonts: [
    {
      name: 'Instrument Serif',
      cssVariable: '--font-instrument-serif',
      provider: fontProviders.google(),
      weights: [400],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
      display: 'swap',
    },
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.fontsource(),
      weights: ['400 600'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
      display: 'swap',
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
