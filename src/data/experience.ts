export interface Job {
  company: string;
  url: string | null;
  title: string;
  start: string; // YYYY-MM
  end: string | null; // null = present
  note?: string;
  highlights: string[];
  /** 'training' entries are excluded from the years/companies facts. */
  kind?: 'job' | 'training';
}
export const experience: Job[] = [
  {
    company: 'Salesdock', url: 'https://salesdock.com/', title: 'Software Developer L2', start: '2025-02', end: null,
    highlights: ['TODO: biggest thing you shipped at Salesdock', 'TODO: a measurable improvement you drove', 'TODO: what you own or lead'],
  },
  {
    company: 'CleverPush', url: 'https://cleverpush.com/', title: 'Software Engineer', start: '2024-07', end: '2025-01',
    highlights: ['TODO: what you built on the landing page / product', 'TODO: a result (performance, SEO, conversion)'],
  },
  {
    company: 'Hawr Technologies', url: 'https://www.hawrtechnologies.com/', title: 'Full-stack Developer', start: '2024-01', end: '2024-06',
    highlights: ['TODO: Hawr Learn responsibilities', 'TODO: stack and scale'],
  },
  {
    company: 'Adam Technologies', url: 'https://www.linkedin.com/company/adam-technologies/about/', title: 'MERN Stack Developer', start: '2023-10', end: '2023-12', note: 'Company has since closed',
    highlights: ['TODO: what you worked on', 'TODO: outcome'],
  },
  {
    company: 'Duple IT Solutions', url: 'https://www.dupleit.com/', title: 'Software Development Engineer-1', start: '2023-05', end: '2023-09',
    highlights: ['TODO: first production project', 'TODO: what you learned / delivered'],
  },
  {
    company: 'Brocamp (Brototype)', url: 'https://brototype.in/', title: 'Trainee, self-learning web development programme', start: '2022-08', end: '2023-03', kind: 'training',
    highlights: ['Learned full-stack JavaScript by building and shipping projects', 'TODO: the capstone you built'],
  },
];

export function formatRange(job: Job): string {
  const f = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `${f(job.start)} – ${job.end ? f(job.end) : 'Present'}`;
}
