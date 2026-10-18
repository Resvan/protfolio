import { describe, expect, it } from 'vitest';
import { buildChatContext } from '../src/lib/chat-context';
import { experience } from '../src/data/experience';
import { projects } from '../src/data/projects';

describe('buildChatContext', () => {
  const ctx = buildChatContext();

  it('describes the person from site data', () => {
    expect(ctx.person.name).toBe('Muhammed Resvan K');
    expect(ctx.person.freelance).toBe(true);
    expect(ctx.person.location).toBe('Kerala, India · open to remote');
  });

  it('keeps every experience entry in order', () => {
    expect(ctx.experience.map((e) => `${e.company}|${e.title}`)).toEqual(experience.map((e) => `${e.company}|${e.title}`));
  });

  it('links featured projects to their case study page only', () => {
    for (const p of projects) {
      const c = ctx.projects.find((x) => x.name === p.name)!;
      if (p.featured) expect(c.page).toBe(`/projects/${p.slug}/`);
      else expect(c.page).toBeUndefined();
    }
  });

  it('leaves out site plumbing', () => {
    const json = JSON.stringify(ctx);
    for (const s of ['analyticsId', 'G-SMPFVLGNW2', 'themeColor', 'lucide:']) expect(json).not.toContain(s);
  });
});
