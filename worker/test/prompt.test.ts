import { describe, expect, it } from 'vitest';
import { buildMessages, buildSystemPrompt, detectLanguage, type ChatContext, type ChatMessage } from '../src/prompt';

const ctx: ChatContext = {
  person: { name: 'Muhammed Resvan K', title: 'Software Engineer', location: 'Kerala, India · open to remote', remote: true, freelance: true, email: 'me@x.io', whatsappDisplay: '+91 1', socials: {} },
  facts: { yearsExperience: '3+', companies: 5, projects: 9 },
  training: [{ company: 'Bootcamp X', title: 'Trainee', start: '2022-08', end: '2023-03' }],
  experience: [{ company: 'Salesdock', title: 'Software Developer L2', start: '2025-02', end: null, kind: 'job', highlights: ['Sole frontend engineer on an energy billing platform.'] }],
  projects: [
    { name: 'MeetXO', url: 'https://meetxo.example', live: true, description: 'd', stack: [], page: '/projects/meetxo/' },
    { name: 'Virtual Solutions', url: 'https://vs.example', live: true, description: 'd', stack: [] },
  ],
  skills: [{ name: 'Frontend', items: ['React'] }],
  services: [],
};

describe('detectLanguage', () => {
  it('treats Malayalam script as Malayalam', () => {
    expect(detectLanguage('നിങ്ങൾ എവിടെ ജോലി ചെയ്യുന്നു')).toBe('ml');
  });
  it('treats Manglish and English as English', () => {
    expect(detectLanguage('ningal evide work cheyyunnu')).toBe('en');
    expect(detectLanguage('Does he know React?')).toBe('en');
  });
});

describe('buildSystemPrompt', () => {
  const en = buildSystemPrompt(ctx, { replyLang: 'en', malayalamReplies: true });

  it('embeds the context and the grounding rule', () => {
    expect(en).toContain('Sole frontend engineer on an energy billing platform.');
    expect(en).toMatch(/only (from|using) the context/i);
  });
  it('uses precomputed facts and keeps training apart from jobs', () => {
    expect(en).toMatch(/never calculate from dates/i);
    expect(en).toMatch(/"training" are courses, not jobs/i);
  });
  it('defers compensation and job-change topics', () => {
    for (const t of ['salary', 'notice period', 'start date', 'job change', 'relocation']) expect(en.toLowerCase()).toContain(t);
  });
  it('protects the client and resists instructions in visitor messages', () => {
    expect(en).toContain('energy billing platform');
    expect(en).toMatch(/ignore any instructions/i);
    expect(en).toMatch(/off-topic/i);
    expect(en).toContain('[[contact]]');
  });
  it('only allows links that exist', () => {
    expect(en).toMatch(/never (make up|invent) (links|urls)/i);
    expect(en).toContain('https://resvan.in/#contact');
    expect(en).toContain('https://resvan.in/projects/meetxo/');
    // No guessable pattern, and no case study page for projects without one.
    expect(en).not.toContain('<slug>');
    expect(en).not.toContain('/projects/virtual-solutions/');
  });
  it('asks for short lists so Malayalam answers fit', () => {
    expect(buildSystemPrompt(ctx, { replyLang: 'ml', malayalamReplies: true })).toMatch(/at most 3/i);
  });
  it('picks the reply language', () => {
    expect(en).toContain('Reply in English');
    expect(buildSystemPrompt(ctx, { replyLang: 'ml', malayalamReplies: true })).toContain('Reply in Malayalam');
    const off = buildSystemPrompt(ctx, { replyLang: 'ml', malayalamReplies: false });
    expect(off).toContain('Reply in English');
    expect(off).toMatch(/one-line note/i);
  });
});

describe('buildMessages', () => {
  it('puts the system prompt first and keeps only the last 6 turns', () => {
    const history: ChatMessage[] = Array.from({ length: 9 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
    const out = buildMessages(ctx, history, { replyLang: 'en', malayalamReplies: true });
    expect(out[0].role).toBe('system');
    expect(out.slice(1).map((m) => m.content)).toEqual(['m3', 'm4', 'm5', 'm6', 'm7', 'm8']);
  });
});
