const btn = document.getElementById('theme-toggle') as HTMLButtonElement | null;
const root = document.documentElement;

function sync() {
  if (!btn) return;
  const light = root.dataset.theme === 'light';
  btn.setAttribute('aria-pressed', String(light));
  btn.setAttribute('aria-label', light ? btn.dataset.labelLight! : btn.dataset.labelDark!);
}
btn?.addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch {}
  sync();
});
sync();
