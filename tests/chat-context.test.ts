import { describe, expect, it } from 'vitest';
import { buildChatContext } from '../src/lib/chat-context';
import { experience } from '../src/data/experience';
import { projects } from '../src/data/projects';
import { computeFacts } from '../src/lib/facts';

describe('buildChatContext', () => {
  const ctx = buildChatContext();

  it('describes the person from site data', () => {
    expect(ctx.person.name).toBe('Muhammed Resvan K');
    expect(ctx.person.freelance).toBe(true);
    expect(ctx.person.location).toBe('Kerala, India · open to remote');
  });

  it('keeps every job in order', () => {
    const jobs = experience.filter((e) => e.kind !== 'training');
    expect(ctx.experience.map((e) => `${e.company}|${e.title}`)).toEqual(jobs.map((e) => `${e.company}|${e.title}`));
  });

  it('links featured projects to their case study page only', () => {
    for (const p of projects) {
      const c = ctx.projects.find((x) => x.name === p.name)!;
      if (p.featured) expect(c.page).toBe(`/projects/${p.slug}/`);
      else expect(c.page).toBeUndefined();
    }
  });

  it('includes the same headline facts as the About section', () => {
    const f = computeFacts(experience, projects.length);
    expect(ctx.facts).toEqual({ yearsExperience: `${f.years}+`, companies: f.companies, projects: f.projects });
  });

  it('leaves training out entirely, so it can never be listed as an employer', () => {
    const json = JSON.stringify(ctx);
    for (const t of experience.filter((e) => e.kind === 'training')) expect(json).not.toContain(t.company);
    expect(ctx).not.toHaveProperty('training');
  });

  it('leaves out site plumbing', () => {
    const json = JSON.stringify(ctx);
    for (const s of ['analyticsId', 'G-SMPFVLGNW2', 'themeColor', 'lucide:']) expect(json).not.toContain(s);
  });
});
