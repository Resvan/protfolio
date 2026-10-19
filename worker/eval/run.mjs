// Runs worker/eval/questions.json against a deployed chat Worker and prints a markdown table for manual scoring.
// usage: node worker/eval/run.mjs <workerUrl> [--model <label>] [--only id,id] [--delay ms]
// The Worker allows 20 requests per 10 minutes per IP, so the default pace is one question every 31 s.
import { readFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const url = args[0];
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i > -1 ? args[i + 1] : fallback; };
if (!url) { console.error('usage: node worker/eval/run.mjs <workerUrl> [--model label] [--only ids] [--delay ms]'); process.exit(1); }
const only = opt('only', '').split(',').filter(Boolean);
const delay = Number(opt('delay', '31000'));
const questions = JSON.parse(await readFile(new URL('./questions.json', import.meta.url), 'utf8')).filter((q) => !only.length || only.includes(q.id));
const cell = (s) => s.replace(/\|/g, '\\|').replace(/\n+/g, '<br>');

console.log(`## Model: ${opt('model', '(as deployed)')}\n`);
console.log('| id | category | question | answer | expected | pass |');
console.log('|---|---|---|---|---|---|');
for (const [i, q] of questions.entries()) {
  if (i) await new Promise((r) => setTimeout(r, delay));
  const started = Date.now();
  let answer;
  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/chat`, {
      method: 'POST',
      headers: { Origin: 'https://resvan.in', 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: q.q }] }),
    });
    answer = res.ok ? await res.text() : `HTTP ${res.status} ${await res.text()}`;
  } catch (err) {
    answer = `ERROR ${err.message}`;
  }
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`| ${q.id} | ${q.category}/${q.lang} | ${cell(q.q)} | ${cell(answer)} (${secs}s) | ${cell(q.expect)} | |`);
}
