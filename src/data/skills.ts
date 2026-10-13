export interface SkillGroup { name: string; items: string[] }
export const skillGroups: SkillGroup[] = [
  { name: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'] },
  { name: 'Mobile', items: ['React Native', 'Flutter'] },
  { name: 'Backend', items: ['Node.js', 'Express', 'WebSockets'] },
  { name: 'Data', items: ['MongoDB', 'ArangoDB', 'Redis'] },
  { name: 'Tools', items: ['Git', 'AWS EC2', 'Vercel'] },
];
