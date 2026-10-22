import { site } from '../data/site';
import { experience } from '../data/experience';
import { projects } from '../data/projects';
import { skillGroups } from '../data/skills';
import { services } from '../data/services';
import { computeFacts } from './facts';

/** Everything the chatbot may say about Resvan. Served as /chat-context.json for the Worker. */
export interface ChatContext {
  person: { name: string; title: string; location: string; remote: boolean; freelance: boolean; email: string; whatsappDisplay: string; socials: Record<string, string> };
  /** Precomputed so the model never does date arithmetic; same numbers as the About section. */
  facts: { yearsExperience: string; companies: number; projects: number };
  /** Jobs only: training entries are left out so the model can never present them as employers. */
  experience: { company: string; title: string; start: string; end: string | null; kind: 'job'; highlights: string[] }[];
  projects: { name: string; url: string; live: boolean; playStoreUrl?: string; description: string; stack: string[]; caseStudy?: { problem: string; built: string }; page?: string }[];
  skills: { name: string; items: string[] }[];
  services: { title: string; summary: string }[];
}

export function buildChatContext(): ChatContext {
  const facts = computeFacts(experience, projects.length);
  return {
    person: {
      name: site.name,
      title: site.jobTitle,
      location: site.locationLine,
      remote: site.locationLine.includes('remote'),
      freelance: site.availableForFreelance,
      email: site.email,
      whatsappDisplay: site.whatsappDisplay,
      socials: { ...site.socials },
    },
    facts: { yearsExperience: `${facts.years}+`, companies: facts.companies, projects: facts.projects },
    experience: experience.filter((j) => j.kind !== 'training').map((j) => ({ company: j.company, title: j.title, start: j.start, end: j.end, kind: 'job' as const, highlights: j.highlights })),
    projects: projects.map((p) => ({
      name: p.name,
      url: p.url,
      live: p.live ?? true,
      ...(p.playStoreUrl ? { playStoreUrl: p.playStoreUrl } : {}),
      description: p.description,
      stack: p.stack,
      ...(p.featured ? { caseStudy: p.caseStudy, page: `/projects/${p.slug}/` } : {}),
    })),
    skills: skillGroups.map((g) => ({ name: g.name, items: g.items })),
    services: services.map((s) => ({ title: s.title, summary: s.summary })),
  };
}
