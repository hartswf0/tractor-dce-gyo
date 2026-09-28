#!/usr/bin/env node
/* tools/test-odyssey-mobile.js — the one-file mobile build (play/odyssey-mobile.html) on emulated phones, by touch.

   For each device (Playwright's 'Pixel 7' and 'iPhone 13' descriptors: viewport, device scale, touch, mobile UA; run in
   chromium, the only browser here) and each orientation: load the single file over http and measure the load (to the
   chart), the JS heap and the frame time; screenshot the chart, a cinematic and every trial into
   play/odyssey-game/shots/mobile/. Then, on Pixel 7 portrait, the whole spine in fast mode by TOUCH (Chrome DevTools
   touch events: one finger is the pointer, two fingers the two hands): every book's card tapped through, every cinematic
   skipped (each book's first scene photographed), every trial solved with fingers; asserts every book completes.
   Usage: node tools/test-odyssey-mobile.js [--devices "Pixel 7,iPhone 13"] [--no-spine] [--books 1-24] [--speed 4] */
'use strict';
const path = require('path'), fs = require('fs');
const { chromium, devices } = require('playwright');
const ROOT = path.join(__dirname, '..'), SHOTS = path.join(ROOT, 'play/odyssey-game/shots/mobile');
const A = process.argv.slice(2), opt = (k, d) => { const i = A.indexOf('--' + k); return i >= 0 ? A[i + 1] : d; }, has = k => A.includes('--' + k);
const DEVS = opt('devices', 'Pixel 7,iPhone 13').split(','), SPEED = +opt('speed', 4), [B0, B1] = opt('books', '1-24').split('-').map(Number);
fs.mkdirSync(SHOTS, { recursive: true });
const t0 = Date.now(), log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(5) + 's', ...a);
const results = []; let failures = 0; const check = (ok, what, detail = '') => { results.push({ ok, what, detail }); if (!ok) failures++; log(ok ? 'PASS' : 'FAIL', what, detail); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LEVELS = ['01-opening', '02-raft', '03-cyclops', '04-bow', '05-winds', '06-sirens', '07-scylla', '08-bed'];

async function open(browser, name, landscape, q = '') {
  const d = devices[name], vp = landscape ? { width: d.viewport.height, height: d.viewport.width } : d.viewport;
  const ctx = await browser.newContext({ ...d, viewport: vp, screen: landscape ? { width: d.screen.height, height: d.screen.width } : d.screen });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const page = await ctx.newPage(); page.setDefaultTimeout(600000);
  const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 200))); page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  const tl = Date.now(); await page.goto('http://localhost:8899/play/odyssey-mobile.html' + q, { waitUntil: 'load' });
  await page.waitForFunction(() => window.OdysseyGame && OdysseyGame.G.ready, null, { timeout: 300000 }); const loadMs = Date.now() - tl;
  const cdp = await ctx.newCDPSession(page); const W = vp.width, H = vp.height;
  const T = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: Math.round(p.x * W), y: Math.round(p.y * H), id: i + 1, radiusX: 4, radiusY: 4, force: 1 })) });
  const touch = {
    tap: async p => { await T('touchStart', [p]); await sleep(120); await T('touchEnd', []); },
    down: p => T('touchStart', [p]), move: pts => T('touchMove', Array.isArray(pts) ? pts : [pts]), up: () => T('touchEnd', []),
    drag: async (a, b, { hold = 700, steps = 10, pre = 350 } = {}) => { await T('touchStart', [a]); await sleep(pre); for (let i = 1; i <= steps; i++) { await T('touchMove', [{ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps }]); await sleep(60); } await sleep(hold); await T('touchEnd', []); },
    two: async (a0, b0, a1, b1, { hold = 800, steps = 10 } = {}) => { await T('touchStart', [a0, b0]); await sleep(300); for (let i = 1; i <= steps; i++) { const u = i / steps; await T('touchMove', [{ x: a0.x + (a1.x - a0.x) * u, y: a0.y + (a1.y - a0.y) * u }, { x: b0.x + (b1.x - b0.x) * u, y: b0.y + (b1.y - b0.y) * u }]); await sleep(80); } await sleep(hold); await T('touchEnd', []); },
  };
  const metrics = async () => page.evaluate(() => new Promise(res => { const ts = []; let last = performance.now(); const f = now => { ts.push(now - last); last = now; if (ts.length < 90 && performance.now() - ts0 < 4000) requestAnimationFrame(f); else { ts.sort((a, b) => a - b); res({ frameMs: Math.round(ts[Math.floor(ts.length / 2)]), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null }); } }; const ts0 = performance.now(); requestAnimationFrame(f); }));
  return { ctx, page, errors, loadMs, touch, metrics, W, H, dbg: () => page.evaluate(() => OdysseyGame.debug()) };
}
const until = async (S, pred, { timeout = 240000, every = 500, what = 'condition' } = {}) => { const end = Date.now() + timeout; let d; while (Date.now() < end) { d = await S.dbg(); if (pred(d)) return d; await sleep(every); } throw new Error('timed out waiting for ' + what + ' · ' + JSON.stringify(d).slice(0, 300)); };

/* ── the trials by touch ── */
const TOUCH = {
  '01-opening': async S => { for (let k = 0; k < 20; k++) { const d = await S.dbg(); if (d.phase !== 'play' || d.stage !== 'guide') break; const w = d.info.waymarks[d.info.next]; await S.touch.down(w); await sleep(2600); await S.touch.up(); } },
  '02-raft': async S => { for (let k = 0; k < 14; k++) { const d = await S.dbg(); if (d.stage !== 'build') break; const id = d.info.next; if (!id) { await sleep(700); continue; } const pc = d.info.pieces.find(p => p.id === id), part = id === 'step' ? '3003' : '3009', sl = d.info.slots.find(s => s.part === part && !d.info.filled.includes(s.id)); if (!pc || !sl) break; await S.touch.drag(pc, sl, { hold: 1800 }); await sleep(800); }
    await until(S, d => d.stage === 'launch', { what: 'launch' }); const k = (await S.dbg()).info.keel; await S.touch.drag(k, { x: Math.min(.95, k.x + .3), y: k.y }, { hold: 400 }); },
  '03-cyclops': async S => { let d = await S.dbg(); await S.touch.down(d.info.stake); await sleep(500); for (let i = 1; i <= 8; i++) { const u = i / 8; await S.touch.move({ x: d.info.stake.x + (d.info.fire.x - d.info.stake.x) * u, y: d.info.stake.y + (d.info.fire.y - d.info.stake.y) * u }); await sleep(80); }
    await until(S, x => x.stage !== 'fire', { what: 'glow' }); await S.touch.up(); await sleep(2500); d = await S.dbg(); const e = d.info.eye;
    await S.touch.down({ x: e.x, y: e.y + .16 }); await sleep(300); await S.touch.move({ x: e.x, y: e.y + .06 }); await S.touch.move(e); await sleep(900); await S.touch.up();
    await until(S, x => x.stage === 'rams', { what: 'rams' }); await sleep(1500);
    for (let k = 0; k < 16; k++) { d = await S.dbg(); if (d.stage !== 'rams') break; const m = d.info.men.find(m => m.state === 'free'), r = d.info.rams.find(r => !r.taken); if (!m || !r) { await sleep(600); continue; } await S.touch.drag(m, r, { hold: 900, steps: 6 }); } },
  '04-bow': async S => { await S.touch.two({ x: .45, y: .6 }, { x: .55, y: .6 }, { x: .15, y: .6 }, { x: .85, y: .6 }, { hold: 1500 }); await until(S, d => d.stage === 'aim', { what: 'strung (two fingers)' });
    for (let arrow = 0; arrow < 3; arrow++) { await until(S, d => d.stage === 'aim', { what: 'aim' }); let d = await S.dbg(); await S.touch.down(d.info.aimAt); let on = 0;
      for (let i = 0; i < 80; i++) { d = await S.dbg(); await S.touch.move(d.info.aimAt); if (d.info.aligned && d.info.drawn) { if (++on >= 2) break; } else on = 0; await sleep(120); }
      await S.touch.up(); await sleep(2500); if ((await S.dbg()).phase === 'end') break; } },
  '05-winds': async S => { let down = false; for (let i = 0; i < 3000; i++) { const d = await S.dbg(); if (d.phase !== 'play') break; if (d.info.reaching && !down) { await S.touch.down(d.info.bag); down = true; } if (!d.info.reaching && down) { await S.touch.up(); down = false; } await sleep(150); } if (down) await S.touch.up(); },
  '06-sirens': async S => { const m = (await S.dbg()).info.mast; await S.touch.down({ x: m.x + .1, y: m.y }); for (let i = 1; i <= 100; i++) { const a = i / 24 * Math.PI * 2; await S.touch.move({ x: m.x + Math.cos(a) * .1, y: m.y + Math.sin(a) * .07 }); await sleep(50); if (i % 25 === 0 && (await S.dbg()).stage !== 'bind') break; } await S.touch.up();
    await until(S, d => d.stage === 'row', { what: 'bound (circle drag)' });
    for (let i = 0; i < 400; i++) { await S.touch.drag({ x: .5, y: .45 }, { x: .5, y: .72 }, { hold: 50, steps: 3, pre: 50 }); if (i % 4 === 0 && (await S.dbg()).phase !== 'play') break; } },
  '07-scylla': async S => { await S.touch.down({ x: .49, y: .6 }); for (let i = 0; i < 900; i++) { await sleep(600); await S.touch.move({ x: .49 + (i % 2) * .003, y: .6 }); if ((await S.dbg()).phase !== 'play') break; } await S.touch.up(); },
  '08-bed': async S => { for (let k = 0; k < 6; k++) { const d = await S.dbg(); if (d.stage !== 'lift') break; const b = d.info.bed; await S.touch.drag(b, { x: b.x, y: b.y - .2 }, { hold: 1800, steps: 6 }); await sleep(500); }
    await until(S, d => d.stage === 'root', { what: 'root' }); await sleep(2500); const r = (await S.dbg()).info.root; await S.touch.down(r); await until(S, d => d.stage !== 'root', { what: 'root touched' }); await S.touch.up();
    await until(S, d => d.stage === 'embrace', { what: 'embrace' }); await sleep(1500); const d = await S.dbg(); await S.touch.drag(d.info.pen, d.info.odys, { hold: 1500, steps: 10 }); },
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const size = fs.statSync(path.join(ROOT, 'play/odyssey-mobile.html')).size; check(size < 95e6, 'play/odyssey-mobile.html is one file under the 95 MB limit', (size / 1e6).toFixed(1) + ' MB');
  /* ── each device, each orientation: load, metrics, the chart, a cinematic, every trial ── */
  for (const dev of DEVS) for (const land of [false, true]) {
    const tag = dev.replace(/\s+/g, '').toLowerCase() + '-' + (land ? 'landscape' : 'portrait');
    const S = await open(browser, dev, land, '?speed=' + SPEED);
    const net = []; S.page.on('request', r => { const u = r.url(); if (!/odyssey-mobile\.html|^blob:|^data:/.test(u)) net.push(u.replace('http://localhost:8899/', '')); });
    const m = await S.metrics(); check(S.loadMs < 60000, `${tag}: loads to the chart`, `${(S.loadMs / 1000).toFixed(1)} s, heap ${m.heapMB} MB, frame ${m.frameMs} ms (headless software GL on a shared CPU)`);
    await S.page.screenshot({ path: path.join(SHOTS, tag + '-chart.png') });
    const overflow = await S.page.evaluate(() => { const bad = []; for (const el of document.querySelectorAll('#og-root button, #og-mapinfo, #og-top')) { const r = el.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1 || r.bottom > innerHeight + 1)) bad.push((el.id || el.textContent).slice(0, 24)); } return bad; });
    check(!overflow.length, `${tag}: nothing on the chart runs off the screen`, overflow.join(', '));
    await S.page.evaluate(() => { OdysseyGame.book(9, 2); }); await until(S, d => d.story.card || d.story.scene, { what: 'card' }); await S.page.screenshot({ path: path.join(SHOTS, tag + '-book-card.png') });
    const begin = await S.page.$('#og-bookgo'); if (begin) { const bb = await begin.boundingBox(); await S.touch.tap({ x: (bb.x + bb.width / 2) / S.W, y: (bb.y + bb.height / 2) / S.H }); }
    await until(S, d => d.story.scene, { what: 'scene' }); await sleep(5000); await S.page.screenshot({ path: path.join(SHOTS, tag + '-cinema.png') });
    const u = await S.page.evaluate(() => OG.C.uniformity()); check(u < .9, `${tag}: the cinematic frame is not one flat colour`, 'uniformity ' + u.toFixed(2));
    const mm = await S.metrics(); log(tag, 'cinema frame', mm.frameMs, 'ms, heap', mm.heapMB, 'MB');
    for (const id of LEVELS) { await S.page.evaluate(id => { OdysseyGame.chart(); OdysseyGame.start(id); }, id); await until(S, d => d.phase === 'intro' && d.level === id, { what: id }); await S.page.screenshot({ path: path.join(SHOTS, `${tag}-${id}-intro.png`) });
      await S.page.evaluate(() => OdysseyGame.play()); await sleep(2500); await S.page.screenshot({ path: path.join(SHOTS, `${tag}-${id}.png`) }); }
    check(!S.errors.length, `${tag}: no page errors`, S.errors.slice(0, 3).join(' | '));
    check(new Set(net).size === 0 || [...new Set(net)].every(u => /^odyssey\/take\/bed\//.test(u)), `${tag}: only the music beds come over the network`, [...new Set(net)].slice(0, 6).join(' '));
    await S.ctx.close();
  }
  /* ── the whole poem by touch, Pixel 7 portrait ── */
  if (!has('no-spine')) {
    const S = await open(browser, 'Pixel 7', false, '?speed=' + Math.max(SPEED, 6));
    await S.page.evaluate(b => { OG.ST.noStage = true; OdysseyGame.book(b); }, B0);
    const seen = new Set(), shot = new Set(); let lastKey = '';
    for (let guard = 0; guard < 5000; guard++) {
      const d = await S.dbg(), s = d.story; if (s.book) seen.add(s.book);
      if (s.done.includes(B1)) break;
      if (d.phase === 'intro' && d.level) { log('spine: trial', d.level, 'book', s.book); const go = await S.page.$('#og-go'); if (go) { const bb = await go.boundingBox(); await S.touch.tap({ x: (bb.x + bb.width / 2) / S.W, y: (bb.y + bb.height / 2) / S.H }); } await until(S, x => x.phase === 'play', { what: 'play' }); await sleep(600);
        try { await TOUCH[d.level](S); } catch (e) { log('solver', d.level, e.message.slice(0, 160)); } const e = await until(S, x => x.phase === 'end', { what: d.level + ' end', timeout: 420000 }).catch(() => null);
        check(!!(e && e.result && e.result.won), `spine (touch): ${d.level} solved with fingers in book ${s.book}`, e && e.result ? `kleos ${e.result.kleos}` : ''); await sleep(1800);
        const nx = await S.page.$('#og-next') || await S.page.$('#og-watch2'); if (nx) { const bb = await nx.boundingBox(); await S.touch.tap({ x: (bb.x + bb.width / 2) / S.W, y: (bb.y + bb.height / 2) / S.H }); } await sleep(1500); continue; }
      if (s.card) { if (!shot.has(s.book)) await S.page.evaluate(() => { OG.ST.noStage = false; }); const b = await S.page.$('#og-bookgo'); if (b) { const bb = await b.boundingBox(); await S.touch.tap({ x: (bb.x + bb.width / 2) / S.W, y: (bb.y + bb.height / 2) / S.H }); } await sleep(500); continue; }
      if (s.scene) { const k = s.book + ':' + s.scene; if (k !== lastKey) { lastKey = k; if (!shot.has(s.book) && !(await S.page.evaluate(() => OG.ST.noStage))) { await sleep(2500); await S.page.screenshot({ path: path.join(SHOTS, 'spine-book-' + String(s.book).padStart(2, '0') + '.png') }); shot.add(s.book); await S.page.evaluate(() => { OG.ST.noStage = true; }); } }
        const sk = await S.page.$('#og-skip'); if (sk && await sk.isVisible()) { const bb = await sk.boundingBox(); await S.touch.tap({ x: (bb.x + bb.width / 2) / S.W, y: (bb.y + bb.height / 2) / S.H }); } else await S.page.evaluate(() => OdysseyGame.skip()); await sleep(300); continue; }
      await sleep(400);
    }
    const fin = await S.dbg(), want = []; for (let b = B0; b <= B1; b++) want.push(b);
    check(want.every(b => seen.has(b)), `spine (touch): every book ${B0}–${B1} reached`, [...seen].sort((a, b) => a - b).join(' '));
    check(want.every(b => fin.story.done.includes(b)), `spine (touch): every book ${B0}–${B1} completes`, fin.story.done.join(' '));
    check(!S.errors.length, 'spine (touch): no page errors', S.errors.slice(0, 3).join(' | '));
    await S.ctx.close();
  }
  fs.writeFileSync(path.join(SHOTS, 'results.json'), JSON.stringify({ when: new Date().toISOString(), results }, null, 1));
  log(`${results.filter(r => r.ok).length} passed, ${failures} failed`); await browser.close(); process.exitCode = failures ? 1 : 0;
})().catch(e => { console.error('CRASH', e.stack || e.message); process.exitCode = 2; });
