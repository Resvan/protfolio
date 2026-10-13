import type { ImageMetadata } from 'astro';

const images = import.meta.glob<{ default: ImageMetadata }>('../assets/projects/*.{png,jpg,jpeg,webp}', {
  eager: true,
});

/** Convention: drop `src/assets/projects/<slug>.png` (or .webp) to replace the placeholder. Returns null when none exists. */
export function getProjectImage(slug: string): ImageMetadata | null {
  for (const [path, mod] of Object.entries(images)) {
    if (path.replace(/^.*\//, '').replace(/\.[^.]+$/, '') === slug) return mod.default;
  }
  return null;
}
