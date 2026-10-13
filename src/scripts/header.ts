const header = document.getElementById('site-header')!;
const menuBtn = document.getElementById('menu-button') as HTMLButtonElement | null;
const menu = document.getElementById('mobile-menu')!;
const main = document.getElementById('main');
const footer = document.querySelector('footer');

/* Hide on scroll down, show on scroll up */
let lastY = window.scrollY;
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    const menuOpen = menuBtn?.getAttribute('aria-expanded') === 'true';
    if (!menuOpen && y > lastY && y > 80) header.style.transform = 'translateY(-100%)';
    else header.style.transform = '';
    lastY = y;
    ticking = false;
  });
}, { passive: true });

/* Mobile menu */
const FOCUSABLE = 'a[href], button:not([disabled])';
function setOpen(open: boolean) {
  if (!menuBtn) return;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  main?.toggleAttribute('inert', open);
  footer?.toggleAttribute('inert', open);
  if (open) (menu.querySelector(FOCUSABLE) as HTMLElement | null)?.focus();
  else menuBtn.focus();
}
menuBtn?.addEventListener('click', () => setOpen(menuBtn.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) setOpen(false); });
header.addEventListener('keydown', (e) => {
  if (menuBtn?.getAttribute('aria-expanded') !== 'true') return;
  if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
  if (e.key !== 'Tab') return;
  const items = [...header.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });

/* Active section highlight */
const links = [...document.querySelectorAll<HTMLAnchorElement>('.js-nav-link')];
const sections = [...document.querySelectorAll<HTMLElement>('.js-section')];
if ('IntersectionObserver' in window && sections.length) {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      for (const l of links) {
        if (l.dataset.target === en.target.id) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((s) => io.observe(s));
}
