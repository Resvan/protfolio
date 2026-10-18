import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { beforeEach, describe, expect, it } from 'vitest';

type Ctx = ReturnType<typeof makeContext>;
function makeContext() {
  const rows: unknown[][] = [];
  const emails: Record<string, unknown>[] = [];
  const fetches: string[] = [];
  const cache = new Map<string, string>();
  const locks: string[] = [];
  let fetchStatus = 200;
  const range = { setNumberFormat: () => range, setValues: (v: unknown[][]) => { rows.push(...v); return range; } };
  const sheet = {
    getLastRow: () => rows.length,
    getRange: () => range,
    appendRow: (r: unknown[]) => rows.push(r),
  };
  const ss = { getSheetByName: () => sheet, insertSheet: () => sheet };
  const ctx = {
    rows, emails, fetches, cache, locks, setFetchStatus: (s: number) => (fetchStatus = s),
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => ({ CALLMEBOT_PHONE: '+310000', CALLMEBOT_APIKEY: '123', NOTIFY_EMAIL: 'me@x.io' } as Record<string, string>)[k] ?? null }) },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v) }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss },
    MailApp: { sendEmail: (o: Record<string, unknown>) => emails.push(o) },
    UrlFetchApp: { fetch: (u: string) => { fetches.push(u); return { getResponseCode: () => fetchStatus, getContentText: () => '' }; } },
    ContentService: { createTextOutput: (t: string) => ({ text: t, setMimeType() { return this; } }), MimeType: { JSON: 'json' } },
    LockService: { getScriptLock: () => ({ waitLock: (ms: number) => locks.push('wait:' + ms), releaseLock: () => locks.push('release') }) },
    Logger: { log: () => {} },
    Utilities: { formatDate: () => '2026-10-09 10:00' },
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync('apps-script/Code.gs', 'utf8'), ctx);
  return ctx as typeof ctx & { doPost: (e: unknown) => { text: string }; safeCell: (v: unknown) => unknown; validateSubmission: (p: Record<string, string>) => { ok: boolean; error?: string } };
}
const post = (c: Ctx, p: Record<string, string>) => JSON.parse(c.doPost({ parameter: p }).text);
const good = { name: "Zoë O'Brien", email: 'zoe@example.com', phone: '+31 6 1234 5678', message: 'Hello there, I have a project.', website: '', userAgent: 'Mozilla/5.0' };

let c: Ctx;
beforeEach(() => { c = makeContext(); });

describe('safeCell', () => {
  it('prefixes formula-looking values with an apostrophe', () => {
    for (const v of ['=1+1', '+316', '-5', '@me']) expect(c.safeCell(v)).toBe(`'${v}`);
    expect(c.safeCell('plain')).toBe('plain');
    expect(c.safeCell('')).toBe('');
  });
});

describe('validateSubmission', () => {
  it('accepts unicode names and international phones', () => {
    expect(c.validateSubmission(good).ok).toBe(true);
    expect(c.validateSubmission({ ...good, name: 'محمد', phone: '' }).ok).toBe(true);
  });
  it('rejects bad email, short message, short phone', () => {
    expect(c.validateSubmission({ ...good, email: 'nope' }).ok).toBe(false);
    expect(c.validateSubmission({ ...good, message: 'short' }).ok).toBe(false);
    expect(c.validateSubmission({ ...good, phone: '12345' }).ok).toBe(false);
  });
  it('rejects messages containing links', () => {
    for (const m of ['Earn money https://telegra.ph/x today', 'see http://spam.io now', 'visit WWW.spam.io please'])
      expect(c.validateSubmission({ ...good, message: m })).toMatchObject({ ok: false, error: expect.stringMatching(/links/i) });
    expect(c.validateSubmission({ ...good, message: 'I saw your site resvan.in, nice work.' }).ok).toBe(true);
  });
});

describe('doPost', () => {
  it('rejects the honeypot silently with ok:false', () => {
    expect(post(c, { ...good, website: 'spam' })).toEqual({ ok: false, error: 'Rejected' });
    expect(c.emails).toHaveLength(0);
  });
  it('rejects posts without a user agent (bots hitting the endpoint directly)', () => {
    for (const ua of [undefined, '', '   ']) {
      const p: Record<string, string> = { ...good };
      if (ua === undefined) delete p.userAgent; else p.userAgent = ua;
      expect(post(c, p)).toEqual({ ok: false, error: 'Rejected' });
    }
    expect(c.rows).toHaveLength(0);
    expect(c.emails).toHaveLength(0);
  });
  it('appends a row, emails with replyTo and pings CallMeBot', () => {
    expect(post(c, good)).toEqual({ ok: true });
    expect(c.rows).toHaveLength(2); // header row + data row
    expect(c.rows[0][0]).toBe('Timestamp');
    expect(c.rows[1][3]).toBe("'+31 6 1234 5678");
    expect(c.emails[0]).toMatchObject({ to: 'me@x.io', replyTo: 'zoe@example.com' });
    expect(c.fetches[0]).toContain('api.callmebot.com/whatsapp.php');
    expect(c.fetches[0]).toContain('apikey=123');
  });
  it('keeps the timestamp a real Date (sortable in Sheets)', () => {
    post(c, good);
    // Date comes from the vm realm, so instanceof fails across realms; check the tag instead.
    expect(Object.prototype.toString.call(c.rows[1][0])).toBe('[object Date]');
  });
  it('serialises row writes with LockService', () => {
    post(c, good);
    expect(c.locks[0]).toMatch(/^wait:/);
    expect(c.locks).toContain('release');
  });
  it('escapes user input in the HTML email', () => {
    post(c, { ...good, name: 'Eve <script>', message: 'a & b "quoted" <b>bold</b>' });
    const html = String(c.emails[0].htmlBody);
    expect(html).not.toContain('<script>');
    expect(html).toContain('Eve &lt;script&gt;');
    expect(html).toContain('a &amp; b &quot;quoted&quot; &lt;b&gt;bold&lt;/b&gt;');
  });
  it('still succeeds when CallMeBot fails', () => {
    c.setFetchStatus(500);
    expect(post(c, good)).toEqual({ ok: true });
  });
  it('rate limits the 6th submission per email per hour', () => {
    for (let i = 0; i < 5; i++) expect(post(c, good).ok).toBe(true);
    expect(post(c, good)).toMatchObject({ ok: false, error: expect.stringMatching(/too many/i) });
  });
});
