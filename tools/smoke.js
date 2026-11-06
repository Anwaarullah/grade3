#!/usr/bin/env node
/*
 * Smoke test for Interactive Maths activities (development only, not needed on the server).
 *
 *   node tools/smoke.js                       # every registered activity + the map
 *   node tools/smoke.js ruler-lab which-unit  # just these
 *   node tools/smoke.js ruler-lab --out /some/dir --width 1366 --height 900
 *
 * For each activity it opens index.html#play-<id> in headless Chromium, visits every
 * learn screen and every practice question (using the MQ.dev hook), saves a screenshot
 * of each, and reports JavaScript errors and empty screens. Exit code 1 if anything failed.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
function opt(name, def) {
  const i = args.indexOf(name);
  if (i === -1) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}
const outDir = path.resolve(opt('--out', path.join(require('os').tmpdir(), 'maths-mission-smoke')));
const width = parseInt(opt('--width', '1366'), 10);
const height = parseInt(opt('--height', '900'), 10);
const ids = args.filter((a) => !a.startsWith('--'));
const indexUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
  // Block web fonts so tests do not depend on the network.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  let errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + (e.stack || e.message)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push('console.error: ' + m.text());
  });

  await page.goto(indexUrl + '#/', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const registered = await page.evaluate(() => Object.keys(window.MQ.activities));
  const targets = ids.length ? ids : registered;
  if (!ids.length) await page.screenshot({ path: path.join(outDir, '_map.png'), fullPage: true });
  let failed = 0;
  const report = [];

  for (const id of targets) {
    errors = [];
    const shots = [];
    const problems = [];
    if (!registered.includes(id)) {
      report.push(`✗ ${id}: not registered (does js/activities/${id}.js call MQ.register('${id}', ...)?)`);
      failed++;
      continue;
    }
    await page.goto(indexUrl + '#/', { waitUntil: 'load' });
    await page.evaluate(() => {
      try { localStorage.clear(); } catch (e) {}
    });
    await page.goto(indexUrl + '#play-' + id, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const counts = await page.evaluate(() => ({ learn: window.MQ.dev.learnCount, practice: window.MQ.dev.practiceCount }));
    const screens = [];
    for (let i = 0; i < counts.learn; i++) screens.push(['learn', i]);
    for (let i = 0; i < counts.practice; i++) screens.push(['practice', i]);
    for (const [phase, i] of screens) {
      const before = errors.length;
      await page.evaluate(([p, n]) => window.MQ.dev.goto(p, n), [phase, i]);
      await page.waitForTimeout(350);
      const info = await page.evaluate(() => {
        const st = document.querySelector('.stage');
        return { children: st ? st.children.length : 0, text: st ? st.innerText.trim().length : 0, bubble: (document.querySelector('.bubble') || {}).innerText || '' };
      });
      const file = path.join(outDir, `${id}__${phase}-${i + 1}.png`);
      await page.screenshot({ path: file, fullPage: true });
      shots.push(file);
      if (!info.children) problems.push(`${phase} ${i + 1}: stage is empty`);
      if (errors.length > before) problems.push(`${phase} ${i + 1}: ${errors.slice(before).join(' | ')}`);
    }
    const status = problems.length ? '✗' : '✓';
    if (problems.length) failed++;
    report.push(`${status} ${id}: ${counts.learn} learn + ${counts.practice} practice screens${problems.length ? '\n    - ' + problems.join('\n    - ') : ''}`);
  }

  await browser.close();
  console.log(report.join('\n'));
  console.log(`\nScreenshots: ${outDir}`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
