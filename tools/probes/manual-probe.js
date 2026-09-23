// the manual page loads a model, pages through it, and its piece count matches the sheet
const { chromium } = require('playwright'); const mocks = require('./mocks.js');
(async () => {
  const name = process.argv[2] || 'grocery-store';
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1100, height: 700 } }); await mocks.routes(ctx); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/net::ERR|Failed to load/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const t0 = Date.now(); await p.goto('http://localhost:' + (process.env.PORT || 8899) + '/play/manual.html?model=' + name, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__manual, null, { timeout: 240000 }).catch(async () => { console.log('NOT READY veil:', await p.locator('#veil').textContent().catch(() => '-'), 'errors', JSON.stringify(errs.slice(0, 4))); process.exit(1); });
  const info = await p.evaluate(() => ({ pieces: __manual.pieces.length, steps: __manual.steps.length, nSteps: __manual.nSteps, sheet: document.querySelector('#sheet').textContent }));
  console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', JSON.stringify(info));
  const mid = Math.floor(info.steps / 2);
  for (const pg of [0, 12, mid, info.steps]) { await p.evaluate(n => __manual.show(n), pg); await p.waitForTimeout(600); await p.screenshot({ path: __dirname + '/manual-' + name + '-p' + pg + '.png' }); console.log('page', pg, await p.evaluate(() => document.querySelector('#where').textContent + ' | ' + (document.querySelector('#stepTitle').textContent || '') + ' | ' + document.querySelector('#stepParts').textContent.slice(0, 120))); }
  console.log('errors', errs.length, JSON.stringify(errs.slice(0, 3))); await b.close();
})();
