import type { Job } from '../data/experience';

export interface Facts { years: number; companies: number; projects: number }

/** Whole years since the first non-training role, companies worked for, projects shipped. */
export function computeFacts(jobs: Job[], projectCount: number, now = new Date()): Facts {
  const real = jobs.filter((j) => j.kind !== 'training');
  const starts = real.map((j) => new Date(`${j.start}-01T00:00:00Z`).getTime());
  const first = Math.min(...starts);
  const years = Math.max(0, Math.floor((now.getTime() - first) / (365.25 * 24 * 3600 * 1000)));
  return { years, companies: real.length, projects: projectCount };
}
