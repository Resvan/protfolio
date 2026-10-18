import { MESSAGE_MAX, validateEmail, validateMessage, validateName, validatePhone } from '../lib/validation';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { parseEndpointResponse } from '../lib/contact-response';
import { escapeHtml } from '../lib/escape';
import { formatPhone } from '../lib/phone';
import { initPhonePicker } from './phone-picker';

const form = document.getElementById('contact-form') as HTMLFormElement | null;
if (form) {
  const endpoint = form.dataset.endpoint ?? '';
  const whatsapp = form.dataset.whatsapp ?? '';
  const email = form.dataset.email ?? '';
  const submit = form.querySelector<HTMLButtonElement>('#cf-submit')!;
  const status = form.querySelector<HTMLElement>('#cf-status')!;
  const count = form.querySelector<HTMLElement>('#cf-message-count')!;
  const picker = initPhonePicker();
  const fullPhone = (local: string) => formatPhone(picker.iso(), local);
  const fields = {
    name: { el: form.elements.namedItem('name') as HTMLInputElement, check: validateName },
    email: { el: form.elements.namedItem('email') as HTMLInputElement, check: validateEmail },
    phone: { el: form.elements.namedItem('phone') as HTMLInputElement, check: (v: string) => validatePhone(fullPhone(v)) },
    message: { el: form.elements.namedItem('message') as HTMLTextAreaElement, check: validateMessage },
  };
  type Key = keyof typeof fields;
  const keys = Object.keys(fields) as Key[];

  function showError(key: Key, msg: string | null) {
    const { el } = fields[key];
    const out = document.getElementById(`cf-${key}-error`)!;
    out.textContent = msg ?? '';
    el.setAttribute('aria-invalid', String(msg !== null));
  }
  function validateAll(): boolean {
    let first: HTMLElement | null = null;
    for (const key of keys) {
      const msg = fields[key].check(fields[key].el.value);
      showError(key, msg);
      if (msg && !first) first = fields[key].el;
    }
    first?.focus();
    return first === null;
  }
  function currentWhatsAppUrl() {
    return buildWhatsAppUrl(whatsapp, { name: fields.name.el.value, email: fields.email.el.value, message: fields.message.el.value });
  }
  /** `prefix` may contain a server-provided string, so it is escaped; the hrefs are URL-encoded. */
  function fallbackHtml(prefix: string) {
    const mail = `mailto:${email}?subject=${encodeURIComponent('Hello from resvan.in')}&body=${encodeURIComponent(fields.message.el.value)}`;
    return `${escapeHtml(prefix)} You can <a class="text-accent underline" href="${currentWhatsAppUrl()}" target="_blank" rel="noopener noreferrer">message me on WhatsApp</a> or <a class="text-accent underline" href="${mail}">email me</a> instead.`;
  }
  function setStatus(html: string, kind: 'ok' | 'error') {
    status.innerHTML = html;
    status.hidden = false;
    status.classList.toggle('border-emerald-500', kind === 'ok');
    status.classList.toggle('border-red-500', kind === 'error');
  }
  function setBusy(busy: boolean) {
    submit.disabled = busy;
    submit.querySelector<HTMLElement>('[data-idle]')!.hidden = busy;
    submit.querySelector<HTMLElement>('[data-busy]')!.hidden = !busy;
  }

  for (const key of keys) {
    fields[key].el.addEventListener('blur', () => showError(key, fields[key].check(fields[key].el.value)));
    fields[key].el.addEventListener('input', () => {
      if (fields[key].el.getAttribute('aria-invalid') === 'true') showError(key, fields[key].check(fields[key].el.value));
    });
  }
  fields.message.el.addEventListener('input', () => { count.textContent = `${fields.message.el.value.length} / ${MESSAGE_MAX}`; });

  form.querySelector('#cf-whatsapp')?.addEventListener('click', () => {
    window.open(currentWhatsAppUrl(), '_blank', 'noopener');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.hidden = true;
    if (!validateAll()) return;
    if (!endpoint) { setStatus(fallbackHtml('The contact form is not connected yet.'), 'error'); return; }
    setBusy(true);
    try {
      const body = new URLSearchParams();
      for (const [k, v] of new FormData(form)) if (typeof v === 'string') body.set(k, v);
      body.set('phone', fullPhone(fields.phone.el.value));
      body.set('userAgent', navigator.userAgent);
      const res = await fetch(endpoint, { method: 'POST', body, redirect: 'follow' });
      const result = parseEndpointResponse(res.ok, await res.text());
      if (result.ok) {
        form.reset();
        count.textContent = `0 / ${MESSAGE_MAX}`;
        setStatus('Thanks, your message is on its way. I usually reply within a day.', 'ok');
      } else {
        setStatus(fallbackHtml(`Sorry, that didn't go through (${result.error}).`), 'error');
      }
    } catch {
      setStatus(fallbackHtml("Sorry, that didn't go through."), 'error');
    } finally {
      setBusy(false);
    }
  });
}
