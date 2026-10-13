import puppeteer from 'puppeteer-core';
const [,, url = 'http://localhost:4173/', theme = 'dark', ...widths] = process.argv;
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage();
for (const w of (widths.length ? widths : ['1280', '360']).map(Number)) {
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; document.documentElement.classList.remove('reveal-ready'); }, theme);
  await page.evaluate(() => { for (const i of document.images) i.loading = 'eager'; });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } scrollTo(0, 0); });
  await new Promise((r) => setTimeout(r, 1200));
  await new Promise((r) => setTimeout(r, 300));
  const sw = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  const file = `${process.env.OUT ?? '/tmp'}/shot-${theme}-${w}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(file, 'scrollWidth/innerWidth', sw.join('/'));
}
await browser.close();
