const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const t0 = Date.now(); const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const A = (c, m) => log(c ? 'PASS' : 'FAIL', m);
module.exports = async function run(query, checks, opts = {}) {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: opts.viewport || { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: !opts.viewport, hasTouch: true });
  if (opts.routes) await opts.routes(ctx);
  const p = await ctx.newPage(); p.setDefaultTimeout(240000);
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 300)));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push('console: ' + m.text().slice(0, 240)); if (opts.log && m.type() !== 'error') log('  >', m.text().slice(0, 160)); });
  await p.goto('http://localhost:' + (process.env.PORT || 8899) + '/' + (opts.page || 'word-to-world.html') + query, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__world && window.__world.ready, null, { timeout: 240000 }).catch(async () => { log('NOT READY; veil:', (await p.locator('#veil').innerText()).replace(/\n/g, ' | ')); });
  const S = () => p.evaluate(() => window.__world.state());
  const STEP = sec => p.evaluate(x => window.__world.step(x), sec);
  const H = (name, ...args) => p.evaluate(([n, a]) => window.__world[n](...a), [name, args]);
  const st = await S(); log('state:', JSON.stringify({ ready: st.ready, place: st.place, baked: st.baked, buildings: st.buildings }));
  await sleep(800); await p.screenshot({ path: path.join(__dirname, (opts.name || 'world') + '-a.png') });
  try { if (checks) await checks({ p, ctx, S, STEP, H, A, log, sleep, shot: n => p.screenshot({ path: path.join(__dirname, (opts.name || 'world') + '-' + n + '.png') }) }); } catch (e) { log('CRASH', e.stack || e.message); errs.push('crash'); }
  log('errors', errs.length, JSON.stringify(errs.slice(0, 5)));
  await b.close(); return errs.length === 0;
};
if (require.main === module) { const q = process.argv[2] || '?noloc'; const mod = process.argv[3] ? require(path.resolve(process.argv[3])) : null; module.exports(q, mod && mod.checks, mod && mod.opts || {}).then(ok => { log('DONE'); process.exitCode = ok ? 0 : 1; }).catch(e => { log('CRASH', e.stack || e.message); process.exitCode = 1; }); }
