// the scenes in Hand Butter: the page boots, ?scene= loads the grocery set with its parts and cast, the picker loads the cave and the forest centre
const { chromium } = require('../node_modules/playwright'); const mocks = require('./mocks.js'); const path = require('path');
(async () => {
  const t0 = Date.now(), log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', ...a);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } }); await mocks.routes(ctx); const p = await ctx.newPage(); p.setDefaultTimeout(120000);
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/net::ERR|Failed to load/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.goto('http://localhost:8899/play/hand-butter-scenes.html?scene=case-grocery', { waitUntil: 'load' });
  const waitLoaded = async (tag) => { let st = ''; for (let i = 0; i < 120; i++) { await p.waitForTimeout(1000); st = await p.evaluate(() => (document.getElementById('sceneStatus') || {}).textContent || ''); if (/loaded|Undo restores the previous/i.test(st) || /error|Invalid|Unknown|outside|overlap|Wait|Release/i.test(st)) break; } const n = await p.evaluate(() => window.WagWorkshop ? WagWorkshop.state().parts.length : -1); log(tag, 'status:', JSON.stringify(st.slice(0, 160)), 'parts', n); await p.screenshot({ path: path.join(__dirname, 'butter-' + tag + '.png') }); return { st, n }; };
  const g = await waitLoaded('grocery'); log(g.n >= 60 ? 'PASS' : 'FAIL', 'the grocery set stands in Hand Butter from the link');
  for (const key of ['case-ewoks', 'case-searchers', 'case-undaunted']) { await p.evaluate(k => { const sel = document.getElementById('scenePreset'); sel.value = k; sel.dispatchEvent(new Event('change')); document.getElementById('sceneLoad').click(); }, key); const r = await waitLoaded(key); log(r.n >= 40 ? 'PASS' : 'FAIL', key + ' loads from the picker (' + r.n + ' parts)'); }
  const desc = await p.evaluate(() => document.getElementById('sceneDescription').textContent); log('description', JSON.stringify(desc.slice(0, 200)));
  log('errors', errs.length, JSON.stringify(errs.slice(0, 4))); await b.close();
})().catch(e => { console.log('CRASH', e.stack || e.message); process.exitCode = 1; });
