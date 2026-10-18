import { countryFromTimeZone, findCountry, orderedCountries, searchCountries, type Country } from '../lib/phone';

// ?no-inline keeps each flag a separate file, so only the flags actually shown get downloaded.
const flagUrls = import.meta.glob<string>('../../node_modules/flag-icons/flags/4x3/*.svg', { query: '?url&no-inline', import: 'default', eager: true });
const flagUrl = (iso: string) => flagUrls[`../../node_modules/flag-icons/flags/4x3/${iso.toLowerCase()}.svg`] ?? '';

/** Country-code dropdown next to the phone input. Returns the selected ISO code on demand. */
export function initPhonePicker(): { iso: () => string } {
  const button = document.getElementById('cf-cc') as HTMLButtonElement;
  const flag = document.getElementById('cf-cc-flag') as HTMLImageElement;
  const dial = document.getElementById('cf-cc-dial')!;
  const menu = document.getElementById('cf-cc-menu')!;
  const search = document.getElementById('cf-cc-search') as HTMLInputElement;
  const list = document.getElementById('cf-cc-list')!;
  const phone = document.getElementById('cf-phone') as HTMLInputElement;

  let selected = findCountry(countryFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone))!;
  let options: HTMLElement[] = [];
  let active = -1;

  function select(c: Country) {
    selected = c;
    flag.src = flagUrl(c.iso);
    dial.textContent = `+${c.dial}`;
    button.setAttribute('aria-label', `Country code: ${c.name} +${c.dial}`);
  }

  function option(c: Country): HTMLElement {
    const li = document.createElement('li');
    li.id = `cf-cc-${c.iso}`;
    li.role = 'option';
    li.dataset.iso = c.iso;
    li.setAttribute('aria-selected', String(c.iso === selected.iso));
    li.className = 'flex cursor-pointer items-center gap-3 px-4 py-2 text-step--1 text-fg aria-selected:font-semibold data-[active]:bg-bg';
    const img = document.createElement('img');
    Object.assign(img, { src: flagUrl(c.iso), alt: '', width: 20, height: 15, loading: 'lazy', decoding: 'async' });
    img.className = 'h-[15px] w-5 shrink-0 rounded-[2px] object-cover';
    const name = document.createElement('span');
    name.className = 'truncate';
    name.textContent = c.name;
    const code = document.createElement('span');
    code.className = 'ml-auto shrink-0 text-muted';
    code.textContent = `+${c.dial}`;
    li.append(img, name, code);
    return li;
  }

  function heading(text: string): HTMLElement {
    const li = document.createElement('li');
    li.role = 'presentation';
    li.className = 'label px-4 pb-1 pt-3';
    li.textContent = text;
    return li;
  }

  function render() {
    const q = search.value;
    list.replaceChildren();
    if (q.trim()) {
      options = searchCountries(q).map(option);
      if (options.length) list.append(...options);
      else list.append(Object.assign(heading('No matches'), { className: 'px-4 py-3 text-step--1 text-muted' }));
    } else {
      const { suggested, rest } = orderedCountries();
      const s = suggested.map(option);
      const r = rest.map(option);
      options = [...s, ...r];
      list.append(heading('Suggested'), ...s, heading('All countries'), ...r);
    }
    setActive(q.trim() ? 0 : Math.max(0, options.findIndex((o) => o.dataset.iso === selected.iso)));
  }

  function setActive(i: number) {
    options[active]?.removeAttribute('data-active');
    active = options.length ? Math.max(0, Math.min(i, options.length - 1)) : -1;
    const o = options[active];
    if (!o) { search.removeAttribute('aria-activedescendant'); return; }
    o.setAttribute('data-active', '');
    search.setAttribute('aria-activedescendant', o.id);
    o.scrollIntoView({ block: 'nearest' });
  }

  function open() {
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    search.value = '';
    render();
    search.focus();
  }

  function close(focus: HTMLElement | null) {
    if (menu.hidden) return;
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    focus?.focus();
  }

  function choose(iso: string | undefined) {
    const c = iso && findCountry(iso);
    if (c) select(c);
    close(phone);
  }

  button.addEventListener('click', () => (menu.hidden ? open() : close(button)));
  search.addEventListener('input', render);
  search.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(options[active]?.dataset.iso); }
    else if (e.key === 'Escape') { e.preventDefault(); close(button); }
    else if (e.key === 'Tab') close(null);
  });
  list.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the search box
  list.addEventListener('click', (e) => choose((e.target as HTMLElement).closest<HTMLElement>('[role=option]')?.dataset.iso));
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target as Node) && !button.contains(e.target as Node)) close(null);
  });

  select(selected);
  return { iso: () => selected.iso };
}
