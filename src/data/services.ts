export interface Service { title: string; summary: string; youGet: string[]; icon: string }
export const services: Service[] = [
  {
    title: 'Web apps',
    icon: 'lucide:layout-dashboard',
    summary: 'Dashboards, portals and SaaS front ends built with React, Next.js and Node.js.',
    youGet: ['Typed, tested codebase you own', 'Responsive and accessible UI', 'Deployment and handover notes'],
  },
  {
    title: 'Mobile apps',
    icon: 'lucide:smartphone',
    summary: 'Cross-platform iOS and Android apps with React Native or Flutter, backed by your API.',
    youGet: ['One codebase for both stores', 'Offline-friendly data handling', 'Store submission support'],
  },
  {
    title: 'Landing pages & SEO',
    icon: 'lucide:rocket',
    summary: 'Fast static marketing sites that score well on Lighthouse and rank for what you do.',
    youGet: ['Sub-second loads, 95+ Lighthouse', 'Structured data and metadata done right', 'CMS hookup if you need it'],
  },
];
