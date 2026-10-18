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
  // Uint8Array.from yields Uint8Array<ArrayBuffer>, which BodyInit accepts (ts 5.9 lib typing).
  return new Response(Uint8Array.from(png), { headers: { 'Content-Type': 'image/jpeg' } });
};
