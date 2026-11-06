// Re-render the flyer: node render.js  (needs Playwright + Chromium)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const u = (f) => 'file://' + path.join(__dirname, f);
  let p = await b.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2480 / 794 });
  await p.goto(u('flyer.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(__dirname, 'flyer.png'), clip: { x: 0, y: 0, width: 794, height: 1123 } });
  await p.pdf({ path: path.join(__dirname, 'flyer.pdf'), format: 'A4', printBackground: true, pageRanges: '1' });
  p = await b.newPage({ viewport: { width: 540, height: 540 }, deviceScaleFactor: 2 });
  await p.goto(u('flyer-square.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(__dirname, 'flyer-square.png'), clip: { x: 0, y: 0, width: 540, height: 540 } });
  await b.close();
})();
