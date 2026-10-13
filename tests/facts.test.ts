import { describe, expect, it } from 'vitest';
import { computeFacts } from '../src/lib/facts';
import type { Job } from '../src/data/experience';

const jobs: Job[] = [
  { company: 'A', url: null, title: 'Dev', start: '2025-02', end: null, highlights: [] },
  { company: 'B', url: null, title: 'Dev', start: '2023-05', end: '2023-09', highlights: [] },
  { company: 'School', url: null, title: 'Trainee', start: '2022-08', end: '2023-03', highlights: [], kind: 'training' },
];

describe('computeFacts', () => {
  it('counts whole years of professional work since the first real job', () => {
    expect(computeFacts(jobs, 8, new Date('2026-10-12')).years).toBe(3);
    expect(computeFacts(jobs, 8, new Date('2026-04-30')).years).toBe(2);
  });
  it('counts companies excluding training and passes the project count through', () => {
    const f = computeFacts(jobs, 8, new Date('2026-10-12'));
    expect(f.companies).toBe(2);
    expect(f.projects).toBe(8);
  });
});
