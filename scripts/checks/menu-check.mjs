import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 360, height: 800 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
const q = (s) => page.evaluate((s) => { const el = document.querySelector(s); return el ? { hidden: el.hidden, exp: el.getAttribute('aria-expanded'), label: el.getAttribute('aria-label'), pressed: el.getAttribute('aria-pressed') } : null; }, s);
const out = {};
out.initialTheme = await page.evaluate(() => document.documentElement.dataset.theme);
out.menuBefore = await q('#mobile-menu');
await page.click('#menu-button');
out.menuAfterClick = await q('#mobile-menu');
out.buttonAfterClick = await q('#menu-button');
out.focusInMenu = await page.evaluate(() => document.activeElement?.closest('#mobile-menu') !== null);
out.mainInert = await page.evaluate(() => document.getElementById('main').hasAttribute('inert'));
// tab 5 times from first link: should wrap within header
for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
out.focusStillInHeader = await page.evaluate(() => document.activeElement?.closest('#site-header') !== null);
await page.keyboard.press('Escape');
out.menuAfterEsc = await q('#mobile-menu');
out.focusOnButtonAfterEsc = await page.evaluate(() => document.activeElement?.id);
out.btnBox = await page.evaluate(() => { const r = document.getElementById('menu-button').getBoundingClientRect(); return [r.x, r.y, r.width, r.height, scrollY]; });
try { await page.click('#menu-button'); } catch (e) { out.clickErr = e.message; }
out.menuReopened = await q('#mobile-menu');
try { await page.click('#mobile-menu a[href="#services"]'); } catch (e) { out.linkClickErr = e.message; }
out.menuAfterLinkClick = await q('#mobile-menu');
await new Promise((r) => setTimeout(r, 800));
out.activeLink = await page.evaluate(() => [...document.querySelectorAll('.js-nav-link[aria-current="true"]')].map((a) => a.dataset.target));
await page.evaluate(() => window.scrollTo(0, 0)); await new Promise((r) => setTimeout(r, 400));
await page.click('#theme-toggle');
out.themeAfterToggle = await page.evaluate(() => document.documentElement.dataset.theme);
out.toggleButton = await q('#theme-toggle');
await page.reload({ waitUntil: 'networkidle0' });
out.themeAfterReload = await page.evaluate(() => document.documentElement.dataset.theme);
// header hide on scroll down / show on scroll up
await page.evaluate(() => window.scrollTo(0, 600)); await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => window.scrollTo(0, 900)); await new Promise((r) => setTimeout(r, 300));
out.headerHiddenOnDown = await page.evaluate(() => document.getElementById('site-header').style.transform);
await page.evaluate(() => window.scrollTo(0, 500)); await new Promise((r) => setTimeout(r, 300));
out.headerShownOnUp = await page.evaluate(() => document.getElementById('site-header').style.transform);
out.scrollWidthOk = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
out.errors = errors;
console.log(JSON.stringify(out, null, 1));
await browser.close();
