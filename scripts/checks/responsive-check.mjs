import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage();
for (const url of ['http://localhost:4173/', 'http://localhost:4173/projects/ayurvedalayam/', 'http://localhost:4173/blog/', 'http://localhost:4173/404.html']) {
  for (const [w, h] of [[360, 800], [768, 1024], [1280, 800], [1920, 1080]]) {
    await page.setViewport({ width: w, height: h });
    await page.goto(url, { waitUntil: 'networkidle0' });
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, h1: document.querySelectorAll('h1').length, land: ['header','main','footer'].map((t) => document.querySelectorAll(t).length).join('/') }));
    console.log(url.replace('http://localhost:4173', ''), w, r.sw <= r.iw ? 'OK' : `HORIZONTAL SCROLL ${r.sw}>${r.iw}`, 'h1=' + r.h1, 'header/main/footer=' + r.land);
  }
}
await browser.close();
