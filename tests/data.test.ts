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
  it('has 9 projects, 3 featured, unique slugs, https links', () => {
    expect(projects).toHaveLength(9);
    expect(projects.filter((p) => p.featured)).toHaveLength(3);
    expect(new Set(projects.map((p) => p.slug)).size).toBe(9);
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
      'Salesdock', 'Freelance', 'CleverPush', 'Hawr Technologies', 'Adam Technologies', 'Duple IT Solutions', 'Brocamp (Brototype)',
    ]);
  });
  it('lists jobs by start date, newest first', () => {
    const starts = experience.map((j) => j.start);
    expect(starts).toEqual([...starts].sort().reverse());
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

import { formatRange } from '../src/data/experience';
describe('formatRange', () => {
  it('formats month ranges and present', () => {
    expect(formatRange({ company: '', url: null, title: '', start: '2024-07', end: '2025-01', highlights: [] })).toBe('Jul 2024 – Jan 2025');
    expect(formatRange({ company: '', url: null, title: '', start: '2025-02', end: null, highlights: [] })).toBe('Feb 2025 – Present');
  });
});
