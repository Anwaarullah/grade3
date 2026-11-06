#!/usr/bin/env node
/*
 * Renders scenes.html frame by frame (deterministic: time is set, not played).
 *
 *   node build.js --work DIR [--workers 4] [--stills 1.5,10,20]  [--poster OUT.png]
 *
 * Expects clip frames in DIR/clips/<segment>/0001.jpg … (made by build.sh).
 * Writes DIR/frames/000001.jpg … (or only the requested stills to DIR/stills/).
 * Needs Playwright (npm i -g playwright && npx playwright install chromium).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const WORK = path.resolve(opt('work', '/tmp/interactive-maths-video'));
const WORKERS = parseInt(opt('workers', '4'), 10);
const STILLS = opt('stills', null);
const POSTER = opt('poster', null);
const PAGE = 'file://' + path.join(__dirname, 'scenes.html');

function clipMap() {
  const root = path.join(WORK, 'clips');
  const out = {};
  for (const d of fs.readdirSync(root)) {
    const n = fs.readdirSync(path.join(root, d)).filter(f => f.endsWith('.jpg')).length;
    out[d] = { dir: 'file://' + path.join(root, d) + '/', n };
  }
  return out;
}

async function openPage(browser, clips) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(c => { window.CLIPS = c; }, clips);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

(async () => {
  const clips = clipMap();
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  try {
    if (POSTER) {
      const page = await openPage(browser, clips);
      await page.evaluate(() => window.renderPoster());
      await page.screenshot({ path: POSTER, type: 'png' });
      console.log('poster ->', POSTER);
      return;
    }
    const page0 = await openPage(browser, clips);
    const { DURATION, FPS } = await page0.evaluate(() => window.TIMELINE);
    if (STILLS) {
      const dir = path.join(WORK, 'stills'); fs.mkdirSync(dir, { recursive: true });
      for (const s of STILLS.split(',').map(Number)) {
        await page0.evaluate(t => window.renderAt(t), s);
        const f = path.join(dir, `t${s.toFixed(2).padStart(6, '0')}.jpg`);
        await page0.screenshot({ path: f, type: 'jpeg', quality: 90 });
        console.log(f);
      }
      return;
    }
    const total = Math.round(DURATION * FPS);
    const dir = path.join(WORK, 'frames'); fs.mkdirSync(dir, { recursive: true });
    const pages = [page0];
    for (let i = 1; i < WORKERS; i++) pages.push(await openPage(browser, clips));
    let next = 0, done = 0; const t0 = Date.now();
    await Promise.all(pages.map(async page => {
      // each worker takes contiguous chunks so clip frames stay warm in its cache
      while (next < total) {
        const start = next; next = Math.min(total, next + 30);
        for (let f = start; f < Math.min(total, start + 30); f++) {
          await page.evaluate(t => window.renderAt(t), f / FPS);
          await page.screenshot({ path: path.join(dir, String(f + 1).padStart(6, '0') + '.jpg'), type: 'jpeg', quality: 94 });
          if (++done % 150 === 0) console.log(`${done}/${total} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
        }
      }
    }));
    console.log(`rendered ${total} frames (${DURATION}s @ ${FPS}fps) -> ${dir}`);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
