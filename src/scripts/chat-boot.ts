// Always loaded, kept tiny: shows the ask bar, manages the fab, and loads chat-ui only on first use.
const askbar = document.getElementById('chat-askbar') as HTMLFormElement | null;
const fab = document.getElementById('chat-fab') as HTMLButtonElement | null;

if (askbar && fab) {
  askbar.hidden = false;
  const input = askbar.querySelector<HTMLInputElement>('#chat-askbar-input')!;
  const mic = askbar.querySelector<HTMLButtonElement>('#chat-askbar-mic')!;
  mic.hidden = !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  if (matchMedia('(max-width: 480px)').matches) input.placeholder = 'Ask about my work…';

  let ui: Promise<typeof import('./chat-ui')> | null = null;
  const load = () => (ui ??= import('./chat-ui'));

  input.addEventListener('focus', () => void load(), { once: true });
  askbar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    input.value = '';
    (await load()).open(input, q); // focus returns to the text box when the panel closes
  });
  mic.addEventListener('click', async () => (await load()).open(mic, '', { listen: true }));
  fab.addEventListener('click', async () => (await load()).open(fab));

  // The fab only shows once the hero ask bar has scrolled away, and hides at the contact section like the WhatsApp fab.
  const contact = document.getElementById('contact');
  let askbarVisible = true;
  let contactVisible = false;
  const update = () => { fab.hidden = askbarVisible || contactVisible; };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { askbarVisible = en.isIntersecting; update(); }).observe(askbar);
    if (contact) new IntersectionObserver(([en]) => { contactVisible = en.isIntersecting; update(); }, { threshold: 0.2 }).observe(contact);
  } else {
    fab.hidden = false;
  }
}
