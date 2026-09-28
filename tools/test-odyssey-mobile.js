#!/usr/bin/env node
/* tools/test-odyssey-mobile.js — the one-file mobile build (play/odyssey-mobile.html) on emulated phones, by touch.

   For each device (Playwright's 'Pixel 7' and 'iPhone 13' descriptors: viewport, device scale, touch, mobile UA; run in
   chromium, the only browser here) and each orientation: load the single file over http and measure the load (to the
   chart), the JS heap and the frame time; screenshot the chart, a cinematic and every trial into
   play/odyssey-game/shots/mobile/. Then, on Pixel 7 portrait, the whole spine in fast mode by TOUCH (Chrome DevTools
   touch events: one finger is the pointer, two fingers the two hands): every book's card tapped through, every cinematic
   skipped (each book's first scene photographed), every trial solved with fingers; asserts every book completes.
   TRIALS  on every device and orientation, each of the eight trials played by touch to its win and again to its loss.
   FRAMES  (--frames) every shot of EVERY kept scene of the cut (102), each camera set and rendered on the phone build:
           fails on a near-uniform frame, a non-finite camera, or a shot on a person whose head is off screen or low.
   Usage: node tools/test-odyssey-mobile.js [--devices "Pixel 7,iPhone 13"] [--orient portrait,landscape] [--no-spine]
          [--no-trials] [--only 03-cyclops,04-bow] [--frames] [--frame-configs pixel7-portrait,...] [--books 1-24] [--speed 4]
          [--render 1500]  (render at most every N ms: the game's logic keeps its pace on a starved software-GL CPU;
                            frame time, the cinematic check and the frames test always render every frame) */
'use strict';
const path = require('path'), fs = require('fs');
const { chromium, devices } = require('playwright');
const ROOT = path.join(__dirname, '..'), SHOTS = path.join(ROOT, 'play/odyssey-game/shots/mobile');
const A = process.argv.slice(2), opt = (k, d) => { const i = A.indexOf('--' + k); return i >= 0 ? A[i + 1] : d; }, has = k => A.includes('--' + k);
const RENDER = +opt('render', 0), DEVS = opt('devices', 'Pixel 7,iPhone 13').split(','), ORIENT = opt('orient', 'portrait,landscape').split(','), ONLY = opt('only') ? opt('only').split(',') : null,
  FRAME_CFG = opt('frame-configs', 'pixel7-portrait,pixel7-landscape,iphone13-portrait,iphone13-landscape').split(','), SPEED = +opt('speed', 4), [B0, B1] = opt('books', '1-24').split('-').map(Number);
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
  const tl = Date.now(); await page.goto('http://localhost:8899/play/' + opt('file', 'odyssey-mobile.html') + q, { waitUntil: 'load' });
  await page.waitForFunction(() => window.OdysseyGame && OdysseyGame.G.ready, null, { timeout: 300000 }); const loadMs = Date.now() - tl;
  const cdp = await ctx.newCDPSession(page); const W = vp.width, H = vp.height;
  const T = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: Math.round(p.x * W), y: Math.round(p.y * H), id: i + 1, radiusX: 4, radiusY: 4, force: 1 })) });
  const touch = {
    tap: async p => { await T('touchStart', [p]); await sleep(120); await T('touchEnd', []); },
    down: p => T('touchStart', [p]), move: pts => T('touchMove', Array.isArray(pts) ? pts : [pts]), up: () => T('touchEnd', []),
    drag: async (a, b, { hold = 700, steps = 10, pre = 350 } = {}) => { await T('touchStart', [a]); await sleep(pre); for (let i = 1; i <= steps; i++) { await T('touchMove', [{ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps }]); await sleep(60); } await sleep(hold); await T('touchEnd', []); },
    two: async (a0, b0, a1, b1, { hold = 800, steps = 10 } = {}) => { await T('touchStart', [a0, b0]); await sleep(300); for (let i = 1; i <= steps; i++) { const u = i / steps; await T('touchMove', [{ x: a0.x + (a1.x - a0.x) * u, y: a0.y + (a1.y - a0.y) * u }, { x: b0.x + (b1.x - b0.x) * u, y: b0.y + (b1.y - b0.y) * u }]); await sleep(80); } await sleep(hold); await T('touchEnd', []); },
  };
  const metrics = async () => page.evaluate(() => new Promise(res => { const gate = window.OdysseyRenderGate; window.OdysseyRenderGate = null; const done = x => { window.OdysseyRenderGate = gate; res(x); }; const ts = []; let last = performance.now(); const f = now => { ts.push(now - last); last = now; if (ts.length < 90 && performance.now() - ts0 < 4000) requestAnimationFrame(f); else { ts.sort((a, b) => a - b); done({ frameMs: Math.round(ts[Math.floor(ts.length / 2)]), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null }); } }; const ts0 = performance.now(); requestAnimationFrame(f); }));
  const snap = () => page.evaluate(() => new Promise(r => { window.OdysseyRenderNow = 2; requestAnimationFrame(() => requestAnimationFrame(r)); })).catch(() => {});
  return { ctx, page, errors, loadMs, touch, metrics, snap, W, H, dbg: () => page.evaluate(() => OdysseyGame.debug()) };
}
const until = async (S, pred, { timeout = 240000, every = 500, what = 'condition' } = {}) => { const end = Date.now() + timeout; let d; while (Date.now() < end) { d = await S.dbg(); if (pred(d)) return d; await sleep(every); } throw new Error('timed out waiting for ' + what + ' · ' + JSON.stringify(d).slice(0, 300)); };

/* a slow software-GL frame can land long after the finger lifted: wait until the game has let go of what it carried */
const settle = async (S, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await S.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(!OG.E.carry.id)))))) break; await sleep(200); } await sleep(300); };
/* an element's box, read in the page (a handle can go stale when the HUD redraws its card) */
const rectOf = async (S, sel) => { for (let i = 0; i < 10; i++) { const r = await S.page.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return b.width && b.height ? { x: b.x, y: b.y, width: b.width, height: b.height } : null; }, sel); if (r) return r; await sleep(300); } return null; };
/* ── the trials by touch ── */
const TOUCH = {
  '01-opening': async S => { for (let k = 0; k < 20; k++) { const d = await S.dbg(); if (d.phase !== 'play' || d.stage !== 'guide') break; const w = d.info.waymarks[d.info.next]; await S.touch.down(w); await sleep(2600); await S.touch.up(); } },
  '02-raft': async S => { for (let k = 0; k < 14; k++) { const d = await S.dbg(); if (d.stage !== 'build') break; const id = d.info.next; if (!id) { await sleep(700); continue; } const pc = d.info.pieces.find(p => p.id === id), part = id === 'step' ? '3003' : '3009', sl = d.info.slots.find(s => s.part === part && !d.info.filled.includes(s.id)); if (!pc || !sl) break; await S.touch.drag(pc, sl, { hold: 1800 }); await settle(S); if (process.env.DBG) log('raft drop', JSON.stringify(pc), JSON.stringify(sl), JSON.stringify(await S.page.evaluate(() => ({ drop: OG.G.ctx.s.lastDrop, t: [...OG.In.touches.values()], src: OG.In.source, parts: S.parts.filter(p => /^log|^step/.test(p.id)).map(p => [p.id, p.x, p.y, p.z]) })))); }
    await until(S, d => d.stage === 'launch', { what: 'launch' }); const k = (await S.dbg()).info.keel; await S.touch.drag(k, { x: Math.min(.95, k.x + .3), y: k.y }, { hold: 400 }); },
  '03-cyclops': async S => { let d = await S.dbg(); await S.touch.down(d.info.stake); await sleep(500); for (let i = 1; i <= 8; i++) { const u = i / 8; await S.touch.move({ x: d.info.stake.x + (d.info.fire.x - d.info.stake.x) * u, y: d.info.stake.y + (d.info.fire.y - d.info.stake.y) * u }); await sleep(80); }
    await until(S, x => x.stage !== 'fire', { what: 'glow' }); await S.touch.up(); await sleep(2500);
    for (let k = 0; k < 4; k++) { d = await S.dbg(); if (d.stage !== 'eye') break; const e = d.info.eye;   // a flick the recogniser did not read costs nothing: try again
      await S.touch.down({ x: e.x, y: Math.min(.97, e.y + .16) }); await sleep(300); await S.touch.move({ x: e.x, y: e.y + .06 }); await sleep(40); await S.touch.move(e); await until(S, x => x.stage !== 'eye', { what: 'thrust read', timeout: 4000, every: 200 }).catch(() => null); await S.touch.up(); await sleep(1200);
      if (process.env.DBG || k === 3) log('cyclops eye try', k, JSON.stringify((await S.dbg()).info).slice(0, 300)); }
    await until(S, x => x.stage === 'rams', { what: 'rams' }); await sleep(1500);
    for (let k = 0; k < 16; k++) { d = await S.dbg(); if (d.stage !== 'rams') break; const m = d.info.men.find(m => m.state === 'free'), r = d.info.rams.find(r => !r.taken); if (!m || !r) { await sleep(600); continue; } await S.touch.drag(m, r, { hold: 900, steps: 6 }); } },
  '04-bow': async S => { await S.touch.two({ x: .45, y: .6 }, { x: .55, y: .6 }, { x: .15, y: .6 }, { x: .85, y: .6 }, { hold: 1500 }); await until(S, d => d.stage === 'aim', { what: 'strung (two fingers)' });
    for (let arrow = 0; arrow < 3; arrow++) { if ((await until(S, d => d.stage === 'aim' || d.phase !== 'play', { what: 'aim' })).phase !== 'play') break; let d = await S.dbg(); await S.touch.down(d.info.aimAt); let on = 0;
      for (let i = 0; i < 80; i++) { d = await S.dbg(); await S.touch.move(d.info.aimAt); if (d.info.aligned && d.info.drawn) { if (++on >= 2) break; } else on = 0; await sleep(120); }
      await S.touch.up(); await sleep(2500); if ((await S.dbg()).phase === 'end') break; } },
  '05-winds': async S => { await S.page.evaluate(() => { OG.E.timeScale = Math.min(OG.E.timeScale, 1); });   /* a reach lasts a second or two of game time: a finger polled over CDP needs the clock at 1 */ let down = false; for (let i = 0; i < 3000; i++) { const d = await S.dbg(); if (d.phase !== 'play') break; if (d.info.reaching && !down) { await S.touch.down(d.info.bag); down = true; } if (!d.info.reaching && down) { await S.touch.up(); down = false; } await sleep(150); } if (down) await S.touch.up(); await S.page.evaluate(() => { OG.E.timeScale = +(new URLSearchParams(location.search).get('speed') || 1); }); },
  '06-sirens': async S => { const m = (await S.dbg()).info.mast; await S.touch.down({ x: m.x + .1, y: m.y }); for (let i = 1; i <= 100; i++) { const a = i / 24 * Math.PI * 2; await S.touch.move({ x: m.x + Math.cos(a) * .1, y: m.y + Math.sin(a) * .07 }); await sleep(50); if (i % 25 === 0 && (await S.dbg()).stage !== 'bind') break; } await S.touch.up();
    await until(S, d => d.stage === 'row', { what: 'bound (circle drag)' });
    for (let i = 0; i < 400; i++) { await S.touch.drag({ x: .5, y: .45 }, { x: .5, y: .72 }, { hold: 50, steps: 3, pre: 50 }); if (i % 4 === 0 && (await S.dbg()).phase !== 'play') break; } },
  '07-scylla': async S => { await S.touch.down({ x: .49, y: .6 }); for (let i = 0; i < 900; i++) { await sleep(600); await S.touch.move({ x: .49 + (i % 2) * .003, y: .6 }); if ((await S.dbg()).phase !== 'play') break; } await S.touch.up(); },
  '08-bed': async S => { for (let k = 0; k < 6; k++) { const d = await S.dbg(); if (d.stage !== 'lift') break; const b = d.info.bed; await S.touch.drag(b, { x: b.x, y: b.y - .2 }, { hold: 1800, steps: 6 }); await sleep(500); }
    await until(S, d => d.stage === 'root', { what: 'root' }); await sleep(2500); const r = (await S.dbg()).info.root; await S.touch.down(r); await until(S, d => d.stage !== 'root', { what: 'root touched' }); await S.touch.up();
    await until(S, d => d.stage === 'embrace', { what: 'embrace' }); await sleep(1500); const d = await S.dbg(); await S.touch.drag(d.info.pen, d.info.odys, { hold: 1500, steps: 10 }); },
};

/* ── the trials lost by touch: idle past the clock, or the wrong move ── */
const LOSE = {
  '01-opening': async S => { await S.page.evaluate(() => OG.E.timeScale = 10); },
  '02-raft': async S => { await S.page.evaluate(() => OG.E.timeScale = 12); },
  '03-cyclops': async S => { let d = await S.dbg(); await S.touch.down(d.info.stake); await sleep(500); for (let i = 1; i <= 8; i++) { const u = i / 8; await S.touch.move({ x: d.info.stake.x + (d.info.fire.x - d.info.stake.x) * u, y: d.info.stake.y + (d.info.fire.y - d.info.stake.y) * u }); await sleep(80); }
    await until(S, x => x.stage !== 'fire', { what: 'glow' }); await S.touch.up(); await sleep(2500);
    for (let i = 0; i < 6 && (await S.dbg()).phase === 'play'; i++) { d = await S.dbg(); const e = d.info.eye, w = { x: e.x > .5 ? e.x - .3 : e.x + .3, y: e.y }; await S.touch.down({ x: w.x, y: w.y + .16 }); await sleep(300); await S.touch.move({ x: w.x, y: w.y + .06 }); await S.touch.move(w); await sleep(900); await S.touch.up(); await sleep(1400); } },
  '04-bow': async S => { await S.touch.two({ x: .45, y: .6 }, { x: .55, y: .6 }, { x: .15, y: .6 }, { x: .85, y: .6 }, { hold: 1500 }); await until(S, d => d.stage === 'aim', { what: 'strung (two fingers)' });
    for (let arrow = 0; arrow < 4; arrow++) { const d = await until(S, d => d.stage === 'aim' || d.phase !== 'play', { what: 'aim' }); if (d.phase !== 'play') break; const a = d.info.aimAt, w = { x: a.x > .5 ? a.x - .3 : a.x + .3, y: Math.min(.9, a.y + .15) }; await S.touch.down(w); await sleep(900); await S.touch.up(); await sleep(3500); } },
  '05-winds': async S => { },
  '06-sirens': async S => { const m = (await S.dbg()).info.mast; await S.touch.down({ x: m.x + .1, y: m.y }); for (let i = 1; i <= 100; i++) { const a = i / 24 * Math.PI * 2; await S.touch.move({ x: m.x + Math.cos(a) * .1, y: m.y + Math.sin(a) * .07 }); await sleep(50); if (i % 25 === 0 && (await S.dbg()).stage !== 'bind') break; } await S.touch.up(); },
  '07-scylla': async S => { await S.touch.down({ x: .97, y: .6 }); await until(S, d => d.phase !== 'play', { what: 'whirlpool', timeout: 400000 }).catch(() => null); await S.touch.up(); },
  '08-bed': async S => { await S.page.evaluate(() => OG.E.timeScale = 12); },
};

/* ── every shot of every kept scene, on the phone build ── */
async function frames(S, tag) {
  const ids = await S.page.evaluate(() => [...new Set(OG.ST.story.books.flatMap(b => b.items.flatMap(i => i.type === 'scene' ? [i] : i.type === 'level' ? i.covers : [])).map(i => i.id))]);
  check(ids.length === 102, `${tag} frames: the cut has 102 kept scenes`, ids.length + ' scenes');
  let flat = 0, shots = 0, faces = 0; const bad = [], faceBad = [], errs = [];
  for (const id of ids) {
    let r; try { r = await S.page.evaluate(async id => { window.OdysseyRenderGate = null; OdysseyGame.chart(); OG.M.hide(); OG.G.phase = 'probe'; const item = OG.ST.story.books.flatMap(b => b.items.flatMap(i => i.type === 'scene' ? [i] : i.type === 'level' ? i.covers : [])).find(i => i.id === id);
      const st = await OG.C.load(item); OG.C.st = st; const plan = OG.C.plan(item, st), out = []; const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      for (const sh of plan) { OG.E.setCamera(sh.from.pos.toArray(), sh.from.look.toArray(), { fov: sh.from.fov }); await frame(); await frame(); const hs = sh.head ? OG.E.toScreen(sh.head) : null; out.push({ kind: sh.kind, u: +OG.C.uniformity().toFixed(3), finite: Number.isFinite(sh.from.pos.x + sh.from.pos.y + sh.from.pos.z + sh.from.look.x + sh.from.look.y + sh.from.look.z), head: hs ? [+hs.x.toFixed(2), +hs.y.toFixed(2), hs.behind] : null }); }
      return out; }, id); } catch (e) { errs.push(id + ': ' + e.message.slice(0, 120)); continue; }
    if (!r.length) errs.push(id + ': no shots');
    shots += r.length; for (const [i, x] of r.entries()) { let why = null;
      if (x.u > .9 || !x.finite) { flat++; bad.push(`${id}#${i}(${x.kind} ${x.u})`); why = 'flat'; }
      if (x.head) { faces++; const [hx, hy, behind] = x.head; if (behind || hx < 0 || hx > 1 || hy < 0 || hy > .5) { faceBad.push(`${id}#${i}(${x.kind} head ${hx},${hy})`); why = 'face'; } }
      if (why || (has('frame-shots') && i === 0)) { await S.page.evaluate(async ({ id, i }) => { const item = OG.ST.story.books.flatMap(b => b.items.flatMap(i => i.type === 'scene' ? [i] : i.type === 'level' ? i.covers : [])).find(x => x.id === id); const sh = OG.C.plan(item, OG.C.st)[i]; OG.E.setCamera(sh.from.pos.toArray(), sh.from.look.toArray(), { fov: sh.from.fov }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))); }, { id, i }); await S.snap(); await S.page.screenshot({ path: path.join(SHOTS, `frames-${tag}-${why || 'ok'}-${id}-${i}.png`) }); } }
  }
  log(tag, 'frames:', ids.length, 'scenes', shots, 'shots', faces, 'on a person');
  check(!errs.length, `${tag} frames: every one of the ${ids.length} scenes loads and plans`, errs.slice(0, 6).join(' | '));
  check(faceBad.length === 0, `${tag} frames: in every shot on a person (${faces}) the head is on screen and in the upper half`, faceBad.slice(0, 16).join(' '));
  check(flat === 0, `${tag} frames: no near-uniform frame or broken camera across ${shots} shots of ${ids.length} scenes`, bad.slice(0, 16).join(' '));
  await S.page.evaluate(() => OdysseyGame.chart());
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const size = fs.statSync(path.join(ROOT, 'play/odyssey-mobile.html')).size; check(size < 95e6, 'play/odyssey-mobile.html is one file under the 95 MB limit', (size / 1e6).toFixed(1) + ' MB');
  /* ── each device, each orientation: load, metrics, the chart, a cinematic, every trial ── */
  for (const dev of DEVS) for (const land of ORIENT.map(o => o === 'landscape')) {
    const tag = dev.replace(/\s+/g, '').toLowerCase() + '-' + (land ? 'landscape' : 'portrait');
    const S = await open(browser, dev, land, '?speed=' + SPEED + (RENDER ? '&render=' + RENDER : ''));
    const net = []; S.page.on('request', r => { const u = r.url(); if (!/odyssey-mobile\.html|^blob:|^data:/.test(u)) net.push(u.replace('http://localhost:8899/', '')); });
    const m = await S.metrics(); check(S.loadMs < 60000, `${tag}: loads to the chart`, `${(S.loadMs / 1000).toFixed(1)} s, heap ${m.heapMB} MB, frame ${m.frameMs} ms (headless software GL on a shared CPU)`);
    await S.snap(); await S.page.screenshot({ path: path.join(SHOTS, tag + '-chart.png') });
    const overflow = await S.page.evaluate(() => { const bad = []; for (const el of document.querySelectorAll('#og-root button, #og-mapinfo, #og-top')) { const r = el.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1 || r.bottom > innerHeight + 1)) bad.push((el.id || el.textContent).slice(0, 24)); } return bad; });
    check(!overflow.length, `${tag}: nothing on the chart runs off the screen`, overflow.join(', '));
    await S.page.evaluate(() => { OdysseyGame.book(9, 2); }); await until(S, d => d.story.card || d.story.scene, { what: 'card' }); await S.snap(); await S.page.screenshot({ path: path.join(SHOTS, tag + '-book-card.png') });
    const bb = await rectOf(S, '#og-bookgo'); if (bb) await S.touch.tap({ x: (bb.x + bb.width / 2) / S.W, y: (bb.y + bb.height / 2) / S.H });
    check(!!bb, `${tag}: the book card's Play button is on screen and tapped`);
    await until(S, d => d.story.scene, { what: 'scene', timeout: 20000 }).catch(() => S.page.evaluate(() => { const b = document.querySelector('#og-bookgo'); if (b) b.click(); })); await until(S, d => d.story.scene, { what: 'scene' }); await sleep(5000); await S.snap(); await S.page.screenshot({ path: path.join(SHOTS, tag + '-cinema.png') });
    const u = await S.page.evaluate(() => new Promise(r => { const gate = window.OdysseyRenderGate; window.OdysseyRenderGate = null; requestAnimationFrame(() => requestAnimationFrame(() => { const u = OG.C.uniformity(); window.OdysseyRenderGate = gate; r(u); })); }));   // read inside a frame: the WebGL buffer is cleared once composited
    check(u < .9, `${tag}: the cinematic frame is not one flat colour`, 'uniformity ' + u.toFixed(2));
    const mm = await S.metrics(); log(tag, 'cinema frame', mm.frameMs, 'ms, heap', mm.heapMB, 'MB');
    const trialFrames = [];
    for (const id of (ONLY || LEVELS)) for (const mode of has('no-trials') ? ['look'] : ['win', 'lose']) {
      await S.page.evaluate(id => { OG.E.timeScale = +(new URLSearchParams(location.search).get('speed') || 1); OdysseyGame.chart(); OdysseyGame.start(id); }, id); await until(S, d => d.phase === 'intro' && d.level === id, { what: id });
      if (mode !== 'lose') await S.snap(); await S.page.screenshot({ path: path.join(SHOTS, `${tag}-${id}-intro.png`) });
      if (mode === 'win') trialFrames.push(id.slice(3) + ' ' + (await S.metrics()).frameMs);   // the level's staged scene, rendered every frame (before play: the game clock is not starved)
      const go = await S.page.$('#og-go'); if (go && await go.isVisible()) { const bb = await go.boundingBox(); await S.touch.tap({ x: (bb.x + bb.width / 2) / S.W, y: (bb.y + bb.height / 2) / S.H }); } else await S.page.evaluate(() => OdysseyGame.play());
      await until(S, d => d.phase === 'play', { what: id + ' play (tap GO)', timeout: 30000 }).catch(() => S.page.evaluate(() => OdysseyGame.play()));
      await sleep(1500); if (mode !== 'lose') await S.snap(); await S.page.screenshot({ path: path.join(SHOTS, `${tag}-${id}.png`) });
      if (mode === 'look') continue;
      const tt = Date.now(); let shotMid = false; const mid = mode === 'win' ? sleep(9000).then(async () => { if ((await S.dbg()).phase === 'play') { shotMid = true; await S.snap(); await S.page.screenshot({ path: path.join(SHOTS, `${tag}-${id}-mid.png`) }); } }).catch(() => {}) : null;
      try { await (mode === 'win' ? TOUCH : LOSE)[id](S); } catch (e) { log('solver', tag, id, mode, e.message.slice(0, 200)); }
      const e = await until(S, x => x.phase === 'end', { what: id + ' end', timeout: 480000, every: 800 }).catch(() => null); if (mid) await mid;
      await sleep(1500); await S.snap(); await S.page.screenshot({ path: path.join(SHOTS, `${tag}-${id}-${mode === 'win' ? 'won' : 'lost'}.png`) });
      const r = e && e.result; const secs = ((Date.now() - tt) / 1000).toFixed(0) + ' s';
      if (mode === 'win') check(!!(r && r.won === true), `${tag}: ${id} won by touch`, r ? `kleos ${r.kleos} ${'*'.repeat(r.stars || 0)} ${secs}` : 'no end · ' + JSON.stringify(await S.dbg().catch(() => ({}))).slice(0, 200));
      else check(!!(r && r.won === false), `${tag}: ${id} lost by touch`, r ? `${(r.reason || '').slice(0, 70)} ${secs}` : 'no end');
    }
    if (trialFrames.length) log(tag, 'trial frame ms', trialFrames.join(', '));
    if (has('frames') && FRAME_CFG.includes(tag)) await frames(S, tag);
    check(!S.errors.length, `${tag}: no page errors`, S.errors.slice(0, 3).join(' | '));
    check(new Set(net).size === 0 || [...new Set(net)].every(u => /^odyssey\/take\/bed\//.test(u)), `${tag}: only the music beds come over the network`, [...new Set(net)].slice(0, 6).join(' '));
    await S.ctx.close();
  }
  /* ── the whole poem by touch, Pixel 7 portrait ── */
  if (!has('no-spine')) {
    const S = await open(browser, 'Pixel 7', false, '?speed=' + SPEED + (RENDER ? '&render=' + RENDER : ''));   // the trials at the trials' speed; the cinematics are skipped
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
      if (s.scene) { const k = s.book + ':' + s.scene; if (k !== lastKey) { lastKey = k; if (!shot.has(s.book) && !(await S.page.evaluate(() => OG.ST.noStage))) { await sleep(2500); await S.snap(); await S.page.screenshot({ path: path.join(SHOTS, 'spine-book-' + String(s.book).padStart(2, '0') + '.png') }); shot.add(s.book); await S.page.evaluate(() => { OG.ST.noStage = true; }); } }
        const sk = await S.page.$('#og-skip'), bb = sk && await sk.isVisible() && await sk.boundingBox(); if (!(await S.page.evaluate(() => OG.G.phase === 'story'))) continue;   /* a skip that lands on a trial's card would watch the scene instead */
        if (bb) await S.touch.tap({ x: (bb.x + bb.width / 2) / S.W, y: (bb.y + bb.height / 2) / S.H }); else await S.page.evaluate(() => { if (OG.G.phase === 'story') OdysseyGame.skip(); }); await sleep(300); continue; }
      await sleep(400);
    }
    const fin = await S.dbg(), want = []; for (let b = B0; b <= B1; b++) want.push(b);
    check(want.every(b => seen.has(b)), `spine (touch): every book ${B0}–${B1} reached`, [...seen].sort((a, b) => a - b).join(' '));
    check(want.every(b => fin.story.done.includes(b)), `spine (touch): every book ${B0}–${B1} completes`, fin.story.done.join(' '));
    check(!S.errors.length, 'spine (touch): no page errors', S.errors.slice(0, 3).join(' | '));
    await S.ctx.close();
  }
  fs.writeFileSync(path.join(SHOTS, opt('results', 'results') + '.json'), JSON.stringify({ when: new Date().toISOString(), results }, null, 1));
  log(`${results.filter(r => r.ok).length} passed, ${failures} failed`); await browser.close(); process.exitCode = failures ? 1 : 0;
})().catch(e => { console.error('CRASH', e.stack || e.message); process.exit(2); });   // exit: an open browser would keep the process alive
