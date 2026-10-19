import { createChat, type ChatErrorKind } from '../lib/chat-client';
import { canListen, listen, speak } from '../lib/voice';

const panel = document.getElementById('chat-panel') as HTMLElement;
const log = panel.querySelector<HTMLElement>('#chat-log')!;
const chips = panel.querySelector<HTMLElement>('#chat-chips')!;
const form = panel.querySelector<HTMLFormElement>('#chat-form')!;
const input = panel.querySelector<HTMLInputElement>('#chat-input')!;
const send = panel.querySelector<HTMLButtonElement>('#chat-send')!;
const mic = panel.querySelector<HTMLButtonElement>('#chat-mic')!;
const langBtn = panel.querySelector<HTMLButtonElement>('#chat-lang')!;
const speaker = panel.querySelector<HTMLButtonElement>('#chat-speaker')!;
const busyTpl = panel.querySelector<HTMLTemplateElement>('#chat-busy-tpl')!;
const contactTpl = panel.querySelector<HTMLTemplateElement>('#chat-contact-tpl')!;

const chat = createChat(panel.dataset.endpoint ?? '');
const isMalayalam = (s: string) => /[ഀ-ൿ]/.test(s);
let opener: HTMLElement | null = null;
let voiceLang: 'en-IN' | 'ml-IN' = 'en-IN';
/** null = automatic (read aloud only answers to spoken questions); true/false = the visitor's choice. */
let readAloud: boolean | null = null;
let stopListening: (() => void) | null = null;

mic.hidden = langBtn.hidden = !canListen();

function bubble(role: 'user' | 'bot', text = ''): HTMLElement {
  const el = document.createElement('p');
  el.className = role === 'user'
    ? 'ml-auto max-w-[85%] w-fit rounded-2xl rounded-br-md bg-fg px-3.5 py-2.5 text-bg'
    : 'chat-bot max-w-[85%] rounded-2xl rounded-bl-md bg-bg px-3.5 py-2.5 text-fg whitespace-pre-wrap';
  el.textContent = text;
  log.append(el);
  log.scrollTop = log.scrollHeight;
  return el;
}

/** Turns plain URLs into links (text only, never HTML from the model) and drops markdown bold markers. */
function linkify(el: HTMLElement) {
  const text = (el.textContent ?? '').replace(/\*\*/g, '');
  el.textContent = '';
  for (const part of text.split(/(https?:\/\/[^\s)<>\]]+[^\s)<>\].,;:!?])/)) {
    if (/^https?:\/\//.test(part)) {
      const a = document.createElement('a');
      a.href = part;
      a.textContent = part.replace(/^https:\/\/(www\.)?/, '');
      a.className = 'text-accent underline';
      if (!part.startsWith('https://resvan.in/')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      el.append(a);
    } else if (part) {
      el.append(part);
    }
  }
}

// Read-only rather than disabled: disabling the focused input would push focus out of the dialog
// (breaking Esc and the focus trap). Extra sends are blocked by chat.busy in ask().
function setBusy(busy: boolean) {
  input.readOnly = busy;
  input.setAttribute('aria-disabled', String(busy));
  send.setAttribute('aria-disabled', String(busy));
  send.classList.toggle('opacity-50', busy);
}

async function ask(text: string, viaMic = false) {
  const q = text.trim();
  if (!q || chat.busy) return;
  input.focus(); // a clicked chip is about to be hidden; keep focus inside the dialog
  chips.hidden = true;
  bubble('user', q.slice(0, 500));
  const answer = bubble('bot');
  answer.setAttribute('aria-busy', 'true');
  answer.textContent = '…';
  let started = false;
  setBusy(true);
  await chat.send(q, {
    delta(t) {
      if (!started) { answer.textContent = ''; started = true; }
      answer.textContent += t;
      log.scrollTop = log.scrollHeight;
    },
    done({ contact }) {
      answer.removeAttribute('aria-busy');
      linkify(answer);
      if (contact) answer.append(contactTpl.content.cloneNode(true));
      log.scrollTop = log.scrollHeight; // linkify and the button change the height
      const spoken = answer.textContent ?? '';
      if (readAloud === true || (readAloud === null && viaMic)) speak(spoken.replace(/Contact form$/, ''), isMalayalam(spoken) ? 'ml' : 'en');
    },
    error(_kind: ChatErrorKind) {
      answer.removeAttribute('aria-busy');
      if (!started) answer.remove();
      else linkify(answer);
      log.append(busyTpl.content.cloneNode(true));
      log.scrollTop = log.scrollHeight;
    },
  });
  setBusy(false);
}

async function startListening() {
  if (stopListening) { stopListening(); return; }
  const session = listen(voiceLang);
  stopListening = session.stop;
  mic.setAttribute('aria-pressed', 'true');
  mic.classList.add('animate-pulse');
  try {
    const heard = await session.result;
    if (heard) await ask(heard, true);
  } catch {
    // Permission denied or nothing heard: the visitor can still type.
  } finally {
    stopListening = null;
    mic.setAttribute('aria-pressed', 'false');
    mic.classList.remove('animate-pulse');
  }
}

function close() {
  stopListening?.();
  window.speechSynthesis?.cancel();
  panel.hidden = true;
  opener?.focus();
}

function goToContact() {
  close();
  document.getElementById('contact')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  document.getElementById('cf-name')?.focus({ preventScroll: true });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = input.value;
  input.value = '';
  void ask(q);
});
chips.addEventListener('click', (e) => {
  const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-chat-chip]');
  if (chip) void ask(chip.textContent ?? '');
});
log.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-chat-contact]')) goToContact();
});
mic.addEventListener('click', () => void startListening());
langBtn.addEventListener('click', () => {
  voiceLang = voiceLang === 'en-IN' ? 'ml-IN' : 'en-IN';
  langBtn.textContent = voiceLang === 'en-IN' ? 'EN' : 'മ';
  langBtn.setAttribute('aria-label', `Voice language: ${voiceLang === 'en-IN' ? 'English' : 'Malayalam'}`);
});
speaker.addEventListener('click', () => {
  readAloud = speaker.getAttribute('aria-pressed') !== 'true';
  speaker.setAttribute('aria-pressed', String(readAloud));
  if (!readAloud) window.speechSynthesis?.cancel();
});
panel.querySelector('#chat-close')!.addEventListener('click', close);

// Keep focus inside the dialog; Esc closes it.
panel.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); close(); return; }
  if (e.key !== 'Tab') return;
  const focusable = [...panel.querySelectorAll<HTMLElement>('button, input, a[href]')].filter((el) => !el.hidden && !(el as HTMLButtonElement).disabled && el.offsetParent !== null);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/** Opens the shared chat panel; optionally sends a question or starts listening right away. */
export function open(from: HTMLElement, question = '', opts: { listen?: boolean } = {}) {
  opener = from;
  panel.hidden = false;
  window.speechSynthesis?.getVoices(); // Chrome fills the voice list asynchronously; ask early.
  input.focus();
  if (question) void ask(question);
  else if (opts.listen) void startListening();
}
