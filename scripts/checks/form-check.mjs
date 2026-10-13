import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.setViewport({ width: 1280, height: 900 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
const out = {};
const txt = (s) => page.evaluate((s) => document.querySelector(s)?.textContent.trim(), s);
const status = () => page.evaluate(() => { const s = document.getElementById('cf-status'); return { hidden: s.hidden, html: s.innerHTML.slice(0, 160), links: [...s.querySelectorAll('a')].map((a) => a.href.slice(0, 40)) }; });
// FAB visible at top
out.fabVisibleTop = await page.evaluate(() => !document.getElementById('whatsapp-fab').hidden);
// empty submit
await page.click('#cf-submit');
out.nameErr = await txt('#cf-name-error');
out.focusedId = await page.evaluate(() => document.activeElement.id);
out.nameInvalid = await page.evaluate(() => document.getElementById('cf-name').getAttribute('aria-invalid'));
// fill valid data
await page.type('#cf-name', "Zoë O'Brien");
await page.type('#cf-email', 'zoe@example.com');
await page.type('#cf-phone', '+31 6 1234 5678');
await page.type('#cf-message', 'Hello there, I have a project for you.');
out.counter = await txt('#cf-message-count');
out.nameErrCleared = await txt('#cf-name-error');
// scroll into contact -> FAB hidden
await page.evaluate(() => document.getElementById('contact').scrollIntoView());
await new Promise((r) => setTimeout(r, 500));
out.fabHiddenAtContact = await page.evaluate(() => document.getElementById('whatsapp-fab').hidden);
// whatsapp button
await page.click('#cf-whatsapp');
out.waOpened = await page.evaluate(() => window.__opened.map((u) => decodeURIComponent(u)));
// submit ok
await page.click('#cf-submit');
await new Promise((r) => setTimeout(r, 1200));
out.okStatus = await status();
out.formResetName = await page.evaluate(() => document.getElementById('cf-name').value);
out.counterAfterReset = await txt('#cf-message-count');
out.submitEnabled = await page.evaluate(() => !document.getElementById('cf-submit').disabled);
// submit fail
await page.type('#cf-name', 'Ali');
await page.type('#cf-email', 'ali@example.com');
await page.type('#cf-message', 'please fail this one thanks');
await page.click('#cf-submit');
await new Promise((r) => setTimeout(r, 1200));
out.failStatus = await status();
out.errors = errors;
console.log(JSON.stringify(out, null, 1));
await browser.close();
