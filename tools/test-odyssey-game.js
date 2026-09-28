#!/usr/bin/env node
/* tools/test-odyssey-game.js — Nobody's Hands, played headless.

   LEVELS  each trial of the hand played to its win twice: with synthetic hands (21 MediaPipe landmarks per hand, built by
           play/odyssey-game/synth-hand.js and fed to Hand Butter's own WagWorkshop.processHands, so tracking, pinch
           hysteresis and gestureOf are Butter's), and with the mouse/keyboard; then once to its loss. Asserts the phase,
           the win/loss, and screenshots the key moments into play/odyssey-game/shots/.
   SPINE   the whole poem on the Regulars' Cut, book I to book XXIV, in fast mode: chapter cards and cinematics skipped
           (each book's first scene staged on its Butter card and photographed first), every trial solved with synthetic
           hands, bridges passed; asserts every book is reached and marked sailed.
   Usage: node tools/test-odyssey-game.js [--levels] [--spine] [--only 03-cyclops,04-bow] [--mode hand|mouse|both] [--no-loss]
          [--books 1-24] [--speed 3]
   Needs: the http server on :8899 serving this repository; chromium at /opt/pw-browsers/chromium-1194; playwright (NODE_PATH). */
'use strict';
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), SHOTS = path.join(ROOT, 'play/odyssey-game/shots');
const A = process.argv.slice(2), opt = (k, d) => { const i = A.indexOf('--' + k); return i >= 0 ? A[i + 1] : d; }, has = k => A.includes('--' + k);
const LEVELS = ['01-opening', '02-raft', '03-cyclops', '04-bow', '05-winds', '06-sirens', '07-scylla', '08-bed'];
const only = opt('only') ? opt('only').split(',') : LEVELS, MODE = opt('mode', 'both'), SPEED = +opt('speed', 1);
const doLevels = has('levels') || (!has('spine') && !has('frames')), doSpine = has('spine') || (!has('levels') && !has('frames'));
const [B0, B1] = (opt('books', '1-24')).split('-').map(Number);
const W = 960, VH = 600;
fs.mkdirSync(SHOTS, { recursive: true });
const t0 = Date.now(), log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(5) + 's', ...a);
const results = []; let failures = 0;
const check = (ok, what, detail = '') => { results.push({ ok, what, detail }); if (!ok) failures++; log(ok ? 'PASS' : 'FAIL', what, detail); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: VH } });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const page = await ctx.newPage(); page.setDefaultTimeout(600000);
  const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 240))); page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 240)); });
  const dbg = () => page.evaluate(() => OdysseyGame.debug());
  const until = async (pred, { timeout = 240000, every = 400, what = 'condition' } = {}) => { const end = Date.now() + timeout; let d; while (Date.now() < end) { d = await dbg(); if (pred(d)) return d; await sleep(every); } throw new Error('timed out waiting for ' + what + ' · ' + JSON.stringify(d).slice(0, 400)); };
  const shot = async name => { await page.evaluate(() => new Promise(r => { window.OdysseyRenderNow = 2; requestAnimationFrame(() => requestAnimationFrame(r)); })).catch(() => {}); await page.screenshot({ path: path.join(SHOTS, name + '.png') }); };
  /* synthetic hands: a key-framed performance fed to Hand Butter's processHands in the page, at the tracker's rate */
  const perform = keys => page.evaluate(k => OdysseySynth.play(k), keys);
  const hold = (hands, sec) => perform([{ t: 0, hands }, { t: sec, hands }]);
  const move = (from, to, sec) => perform([{ t: 0, hands: from }, { t: sec, hands: to }]);
  const HD = (pose, p, o = {}) => ({ pose, x: p.x, y: p.y, anchor: 'tip', ...o });
  /* a feeder that runs in the page: every 33 ms it asks fn(debug) for the hands to show; stops when fn returns null */
  const feed = (src, sec) => page.evaluate(async ({ src, sec }) => { const fn = eval(src); const t0 = performance.now(); while (performance.now() - t0 < sec * 1000) { const d = OdysseyGame.debug(); const hands = fn(d, (performance.now() - t0) / 1000); if (!hands) return true; WagWorkshop.processHands(hands.map(h => OdysseySynth.hand(h)), performance.now()); await new Promise(r => setTimeout(r, 33)); } return false; }, { src, sec });
  const mouse = { at: async p => page.mouse.move(p.x * W, p.y * VH, { steps: 3 }), down: () => page.mouse.down(), up: () => page.mouse.up(),
    drag: async (a, b, { hold = 800, steps = 12 } = {}) => { await page.mouse.move(a.x * W, a.y * VH, { steps: 4 }); await sleep(400); await page.mouse.down(); await sleep(500); await page.mouse.move(b.x * W, b.y * VH, { steps }); await sleep(hold); await page.mouse.up(); } };
  const key = { press: k => page.keyboard.press(k), down: k => page.keyboard.down(k), up: k => page.keyboard.up(k) };

  log('booting play/odyssey-game.html (Hand Butter engine, 29 MB)…');
  await page.goto(`http://localhost:8899/play/odyssey-game.html?lite&speed=${SPEED}&render=${opt('render', 700)}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.OdysseyGame && OdysseyGame.G.ready, null, { timeout: 300000 });
  const api = await page.evaluate(() => ({ processHands: typeof WagWorkshop.processHands, gesture: typeof WagWorkshop.gesture, handState: typeof WagWorkshop.handState, tracker: typeof WagWorkshop.tracker, hook: typeof OdysseyHands.take, books: OG.ST.story.books.length, levels: OG.G.order.length }));
  check(api.processHands === 'function' && api.gesture === 'function' && api.hook === 'function', 'Hand Butter API: processHands, gesture, handState, tracker; the game hook on the tracks', JSON.stringify(api));
  check(api.books === 24 && api.levels === 8, 'the spine has 24 books and 8 trials', `${api.books} books, ${api.levels} trials`);
  const poses = await page.evaluate(() => ['open', 'point', 'pinch', 'fist', 'V'].map(p => { const m = OdysseySynth.hand({ pose: p, x: .4, y: .5 }); return WagWorkshop.gesture({ marks: m, closed: pinchRatio(m) < .56 }); }));
  check(poses.join() === 'open,point,pinch,fist,V', 'synthetic poses read by Butter\'s own gestureOf', poses.join());
  await shot('chart');

  /* ─────────────── the trials ─────────────── */
  const start = async id => { await page.evaluate(id => { OdysseyGame.chart(); OdysseyGame.start(id); }, id); await until(d => d.phase === 'intro' && d.level === id, { what: id + ' intro' }); };
  const begin = async () => { await page.evaluate(() => OdysseyGame.play()); await until(d => d.phase === 'play', { what: 'play' }); };
  const ended = async (what, timeout = 400000) => until(d => d.phase === 'end', { timeout, what: what + ' end', every: 800 });
  const HAND = {}, MOUSE = {}, LOSE = {};

  HAND['01-opening'] = async () => { for (let k = 0; k < 20; k++) { const d = await dbg(); if (d.phase !== 'play' || d.info.stage !== undefined && d.stage !== 'guide') break; if (d.stage !== 'guide') break; const w = d.info.waymarks[d.info.next]; const p = hold([HD('point', w)], 2.5); if (k === 1) { await sleep(1200); await shot('01-opening-hand-guide'); } await p; } };
  MOUSE['01-opening'] = async () => { for (let k = 0; k < 20; k++) { const d = await dbg(); if (d.phase !== 'play' || d.stage !== 'guide') break; const w = d.info.waymarks[d.info.next]; await mouse.at(w); await mouse.down(); await sleep(2500); await mouse.up(); } };
  LOSE['01-opening'] = async () => { await page.evaluate(() => OG.E.timeScale = 10); };

  const raftHand = async () => { for (let k = 0; k < 14; k++) { const d = await dbg(); if (d.stage !== 'build') break; const id = d.info.next; if (!id) { await sleep(800); continue; } const pc = d.info.pieces.find(p => p.id === id), part = id === 'step' ? '3003' : '3009'; const sl = d.info.slots.find(s => s.part === part && !d.info.filled.includes(s.id)); if (!pc || !sl) break;
      await hold([HD('open', pc)], .5); await hold([HD('pinch', pc)], .7); await move([HD('pinch', pc)], [HD('pinch', sl)], 1.6); { const pr = hold([HD('pinch', sl)], 2.2); if (k === 1) { await sleep(1300); await shot('02-raft-hand-carry'); } await pr; } await hold([HD('open', sl)], 1.2); await sleep(600); } };
  HAND['02-raft'] = async () => { await raftHand(); await until(d => d.stage === 'launch', { what: 'launch' }); await shot('02-raft-hand-built'); const k = (await dbg()).info.keel; for (let i = 0; i < 4 && (await dbg()).stage === 'launch' && !(await dbg()).info.launching; i++) { await move([HD('open', { x: k.x - .15, y: k.y }, { anchor: 'palm' })], [HD('open', { x: k.x + .2, y: k.y }, { anchor: 'palm' })], .8); await hold([HD('open', { x: k.x + .2, y: k.y }, { anchor: 'palm' })], 1.2); } };
  MOUSE['02-raft'] = async () => { for (let k = 0; k < 14; k++) { const d = await dbg(); if (d.stage !== 'build') break; const id = d.info.next; if (!id) { await sleep(800); continue; } const pc = d.info.pieces.find(p => p.id === id), part = id === 'step' ? '3003' : '3009'; const sl = d.info.slots.find(s => s.part === part && !d.info.filled.includes(s.id)); if (!pc || !sl) break; await mouse.drag(pc, sl, { hold: 2000 }); await sleep(900); }
    await until(d => d.stage === 'launch', { what: 'launch' }); const k = (await dbg()).info.keel; await mouse.drag(k, { x: k.x + .25, y: k.y }, { hold: 300 }); };
  LOSE['02-raft'] = async () => { await page.evaluate(() => OG.E.timeScale = 12); };

  HAND['03-cyclops'] = async () => {
    let d = await dbg(); const st = d.info.stake, fire = d.info.fire;
    await hold([HD('open', st)], .5); await hold([HD('pinch', st)], .8); await move([HD('pinch', st)], [HD('pinch', fire)], 1.5);
    for (let i = 0; i < 40; i++) { const pr = hold([HD('pinch', fire)], 1.0); if (i === 1) { await sleep(500); await shot('03-cyclops-hand-fire'); } await pr; d = await dbg(); if (d.stage !== 'fire') break; }
    await until(d => d.stage === 'eye', { what: 'eye stage' }); await sleep(2500); d = await dbg(); const eye = d.info.eye;
    { const pr = hold([HD('pinch', eye, { scale: .12 })], 1.2); await sleep(700); await shot('03-cyclops-hand-eye'); await pr; } await move([HD('pinch', eye, { scale: .12 })], [HD('pinch', eye, { scale: .2 })], .25); await hold([HD('pinch', eye, { scale: .2 })], .8);
    await until(d => d.stage === 'rams' || d.stage === 'blinded', { what: 'blinded' }); await until(d => d.stage === 'rams', { what: 'rams' }); await sleep(2000);
    for (let k = 0; k < 16; k++) { d = await dbg(); if (d.stage !== 'rams') break; const m = d.info.men.find(m => m.state === 'free'), r = d.info.rams.find(r => !r.taken); if (!m || !r) { await sleep(600); continue; }
      await hold([HD('open', m)], .4); await hold([HD('pinch', m)], .7); await move([HD('pinch', m)], [HD('pinch', r)], 1.0); { const pr = hold([HD('pinch', r)], 1.2); if (k === 1) { await sleep(600); await shot('03-cyclops-hand-rams'); } await pr; } await hold([HD('open', r)], .8); } };
  MOUSE['03-cyclops'] = async () => {
    let d = await dbg(); await mouse.at(d.info.stake); await sleep(300); await mouse.down(); await sleep(400); await page.mouse.move(d.info.fire.x * W, d.info.fire.y * VH, { steps: 10 });
    await until(d => d.stage !== 'fire', { what: 'glow' }); await mouse.up(); await sleep(2500); d = await dbg(); const eye = d.info.eye;
    await mouse.at({ x: eye.x, y: eye.y + .16 }); await mouse.down();   // a flick of at least 0.12 of the screen (R.thrust)
     await sleep(300); await page.mouse.move(eye.x * W, eye.y * VH, { steps: 2 }); await until(d => d.stage !== 'eye', { what: 'thrust read', timeout: 6000, every: 200 }).catch(() => null); await mouse.up();
    await until(d => d.stage === 'rams', { what: 'rams' }); await sleep(1500);
    for (let k = 0; k < 16; k++) { d = await dbg(); if (d.stage !== 'rams') break; const m = d.info.men.find(m => m.state === 'free'), r = d.info.rams.find(r => !r.taken); if (!m || !r) { await sleep(600); continue; } await mouse.drag(m, r, { hold: 900, steps: 6 }); } };
  LOSE['03-cyclops'] = async () => { // keys: take the stake to the fire, then thrust wide of the eye three times
    await key.press('Tab'); await sleep(300); await key.press('Space'); await sleep(300); await key.press('Tab'); await until(d => d.stage === 'eye', { what: 'eye (keys)' }); await sleep(1500);
    for (let i = 0; i < 3; i++) { await key.press('Space'); await sleep(1800); } };

  HAND['04-bow'] = async () => {
    const a = { x: .44, y: .62 }, b = { x: .56, y: .62 };
    await hold([HD('pinch', a), HD('pinch', b)], .8); await move([HD('pinch', a), HD('pinch', b)], [HD('pinch', { x: .2, y: .62 }), HD('pinch', { x: .8, y: .62 })], 1.2); { const pr = hold([HD('pinch', { x: .2, y: .62 }), HD('pinch', { x: .8, y: .62 })], 1.5); await sleep(700); await shot('04-bow-hand-string'); await pr; }
    await until(d => d.stage === 'aim', { what: 'strung' });
    for (let arrow = 0; arrow < 3; arrow++) { await until(d => d.stage === 'aim', { what: 'aim' });
      const shotP = arrow === 0 ? sleep(2500).then(() => shot('04-bow-hand-aim')) : null;
      await feed(`(() => { let on = 0, open = 0; return (d, t) => { const p = d.info.aimAt; if (d.info.stage !== 'aim') return null; if (d.info.aligned && d.info.drawn) on++; else on = 0; if (on >= 3 || open) { open++; return open > 12 ? null : [{ pose: 'open', x: p.x, y: p.y, anchor: 'tip' }]; } return [{ pose: 'pinch', x: p.x, y: p.y, anchor: 'tip' }]; }; })()`, 25); if (shotP) await shotP;
      const d = await until(x => x.stage !== 'aim' || x.phase !== 'play', { what: 'loosed', timeout: 30000 }).catch(() => null); if (!d) continue; await sleep(1500); if ((await dbg()).phase === 'end') break; } };
  MOUSE['04-bow'] = async () => { await mouse.drag({ x: .5, y: .6 }, { x: .85, y: .6 }, { hold: 1500 }); await until(d => d.stage === 'aim', { what: 'strung' });
    for (let arrow = 0; arrow < 3; arrow++) { if ((await until(d => d.stage === 'aim' || d.phase !== 'play', { what: 'aim' })).phase !== 'play') break; let d = await dbg(); await mouse.at(d.info.aimAt); await mouse.down(); let on = 0;
      for (let i = 0; i < 80; i++) { d = await dbg(); await page.mouse.move(d.info.aimAt.x * W, d.info.aimAt.y * VH); if (d.info.aligned && d.info.drawn) { if (++on >= 2) break; } else on = 0; await sleep(120); }
      await mouse.up(); await sleep(2500); if ((await dbg()).phase === 'end') break; } };
  LOSE['04-bow'] = async () => { await key.down('Space'); await sleep(3500); await key.up('Space'); await until(d => d.stage === 'aim', { what: 'strung (keys)' });
    for (let i = 0; i < 3; i++) { await key.down('Space'); await sleep(900); await key.up('Space'); await sleep(3500); } };

  HAND['05-winds'] = async () => { const sp = until(d => d.info && d.info.reaching && d.info.holding, { what: 'a held reach', timeout: 300000 }).then(() => shot('05-winds-hand-fist')).catch(() => {}); await feed(`(d, t) => { if (d.phase !== 'play') return null; const b = d.info.bag; return d.info.reaching ? [{ pose: 'fist', x: b.x, y: b.y, anchor: 'palm' }] : [{ pose: 'open', x: b.x + .25, y: b.y, anchor: 'palm' }]; }`, 400); };
  MOUSE['05-winds'] = async () => { let down = false; for (let i = 0; i < 2000; i++) { const d = await dbg(); if (d.phase !== 'play') break; if (d.info.reaching && !down) { await key.down('Space'); down = true; } if (!d.info.reaching && down) { await key.up('Space'); down = false; } await sleep(150); } if (down) await key.up('Space'); };
  LOSE['05-winds'] = async () => { };

  HAND['06-sirens'] = async () => { let d = await dbg(); const m = d.info.mast, R = .09, keys = [];
    for (let i = 0; i <= 96; i++) { const a = i / 24 * Math.PI * 2; keys.push({ t: i * .07, hands: [HD('point', { x: m.x + Math.cos(a) * R * .6, y: m.y + Math.sin(a) * R })] }); } await perform(keys);
    await until(d => d.stage === 'row', { what: 'bound' }); await shot('06-sirens-hand-bound');
    const sp = sleep(9000).then(() => shot('06-sirens-hand-row')); await feed(`(d, t) => d.phase !== 'play' ? null : [{ pose: 'open', x: .62, y: .5 + .14 * Math.sin(t * 7), anchor: 'palm' }]`, 500); await sp; };
  MOUSE['06-sirens'] = async () => { for (let i = 0; i < 14; i++) { await key.press('KeyC'); await sleep(150); } await until(d => d.stage === 'row', { what: 'bound (keys)' });
    for (let i = 0; i < 3000; i++) { await key.press(i % 2 ? 'ArrowUp' : 'ArrowDown'); await sleep(220); if (i % 10 === 0 && (await dbg()).phase !== 'play') break; } };
  LOSE['06-sirens'] = async () => { for (let i = 0; i < 14; i++) { await key.press('KeyC'); await sleep(150); } };

  HAND['07-scylla'] = async () => { const sp = until(d => d.info && d.info.rearing, { what: 'a head rears', timeout: 300000 }).then(() => shot('07-scylla-hand-heads')).catch(() => {}); await feed(`(d, t) => d.phase !== 'play' ? null : [{ pose: 'open', x: .49, y: .55, anchor: 'palm' }]`, 900); };
  MOUSE['07-scylla'] = async () => { await page.mouse.move(W * .49, VH * .55); for (let i = 0; i < 900; i++) { await sleep(700); await page.mouse.move(W * (.49 + (i % 2) * .002), VH * .55); if ((await dbg()).phase !== 'play') break; } };
  LOSE['07-scylla'] = async () => { await key.down('ArrowRight'); await until(d => d.phase === 'end', { what: 'whirlpool', timeout: 300000 }); await key.up('ArrowRight'); };

  HAND['08-bed'] = async () => {
    for (let k = 0; k < 6; k++) { const d = await dbg(); if (d.stage !== 'lift') break; const b = d.info.bed; await hold([HD('open', b)], .4); await hold([HD('pinch', b)], .6); await move([HD('pinch', b)], [HD('pinch', { x: b.x, y: b.y - .18 })], .6); { const pr = hold([HD('pinch', { x: b.x, y: b.y - .18 })], 2.0); if (k === 0) { await sleep(900); await shot('08-bed-hand-lift'); } await pr; } await hold([HD('open', { x: b.x, y: b.y - .18 })], .6); }
    await until(d => d.stage === 'root', { what: 'root' }); await sleep(2500); let d = await dbg();
    for (let i = 0; i < 12; i++) { d = await dbg(); if (d.stage !== 'root') break; { const pr = hold([HD('point', d.info.root)], 1.2); if (i === 0) { await sleep(700); await shot('08-bed-hand-root'); } await pr; } }
    await until(d => d.stage === 'embrace', { what: 'embrace' }); await sleep(2000);
    await hold([HD('open', { x: .25, y: .5 }, { anchor: 'palm' }), HD('open', { x: .75, y: .5 }, { anchor: 'palm' })], .8); await move([HD('open', { x: .25, y: .5 }, { anchor: 'palm' }), HD('open', { x: .75, y: .5 }, { anchor: 'palm' })], [HD('open', { x: .47, y: .5 }, { anchor: 'palm' }), HD('open', { x: .53, y: .5 }, { anchor: 'palm' })], 1.2); await hold([HD('open', { x: .47, y: .5 }, { anchor: 'palm' }), HD('open', { x: .53, y: .5 }, { anchor: 'palm' })], .8); };
  MOUSE['08-bed'] = async () => { await key.press('Tab'); await sleep(200); await key.down('Space'); for (let k = 0; k < 2; k++) { for (let i = 0; i < 4; i++) { await key.press('ArrowUp'); await sleep(150); } await sleep(2500); } await key.up('Space');
    await until(d => d.stage === 'root', { what: 'root (keys)' }); await sleep(2500); await key.press('Tab'); await sleep(200); await key.down('Space'); await until(d => d.stage !== 'root', { what: 'pointed (keys)' }); await key.up('Space');
    await until(d => d.stage === 'embrace', { what: 'embrace (keys)' }); await sleep(1000); const d = await dbg(); await mouse.drag(d.info.pen, d.info.odys, { hold: 1500, steps: 10 }); };
  LOSE['08-bed'] = async () => { await page.evaluate(() => OG.E.timeScale = 12); };

  const playLevel = async (id, mode) => {
    await start(id); if (mode === 'hand') await shot(id + '-intro'); await begin(); await sleep(800);
    try { await (mode === 'hand' ? HAND : mode === 'mouse' ? MOUSE : LOSE)[id](); } catch (e) { log('solver', id, mode, e.message.slice(0, 300)); }
    let d; try { d = await ended(id + ' ' + mode, mode === 'lose' ? 500000 : 400000); } catch (e) { d = await dbg(); }
    await sleep(2200); await shot(`${id}-${mode}-${mode === 'lose' ? 'lost' : 'end'}`);
    const r = d.result || {}; await page.evaluate(() => { OG.E.timeScale = +(new URLSearchParams(location.search).get('speed') || 1); });
    if (mode === 'lose') check(d.phase === 'end' && r.won === false, `${id} loss (${mode})`, r.reason ? r.reason.slice(0, 90) : JSON.stringify(d).slice(0, 200));
    else check(d.phase === 'end' && r.won === true, `${id} won with ${mode === 'hand' ? 'synthetic hands' : 'mouse/keyboard'}`, `kleos ${r.kleos} ${'★'.repeat(r.stars || 0)} t=${r.time}s acc=${r.accuracy}`);
    if (errors.length) { log('page errors:', errors.splice(0).join(' | ').slice(0, 600)); }
  };
  if (doLevels) for (const id of only) { for (const m of MODE === 'both' ? ['hand', 'mouse'] : [MODE]) await playLevel(id, m); if (!has('no-loss')) await playLevel(id, 'lose'); }

  /* ─────────────── the cinematics' frames: every shot of the keyframed scenes and of each book's first scene ─────────────── */
  if ((has('frames') || doSpine) && !has('no-frames')) {
    const ids = await page.evaluate(() => { const out = []; for (const b of OG.ST.story.books) { const sc = b.items.flatMap(i => i.type === 'scene' ? [i] : i.type === 'level' ? i.covers : []); sc.forEach((it, k) => { if (k === 0 || it.keyframes) out.push(it.id); }); } return [...new Set(out)]; });
    let flat = 0, shots = 0, faces = 0; const bad = [], faceBad = [];
    const list = opt('frame-scenes') ? opt('frame-scenes').split(',') : ids;
    let curId = ''; if (has('frame-shots')) await page.exposeFunction('__shotEach', i => shot('frame-' + curId + '-' + i));
    for (const id of list) { curId = id;
      const r = await page.evaluate(async id => { window.OdysseyRenderGate = null; OdysseyGame.chart(); OG.M.hide(); OG.G.phase = 'probe'; const item = OG.ST.story.books.flatMap(b => b.items.flatMap(i => i.type === 'scene' ? [i] : i.type === 'level' ? i.covers : [])).find(i => i.id === id);
        const st = await OG.C.load(item); OG.C.st = st; const plan = OG.C.plan(item, st), out = []; const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        for (const sh of plan) { OG.E.setCamera(sh.from.pos.toArray(), sh.from.look.toArray(), { fov: sh.from.fov }); await frame(); await frame(); if (window.__shotEach) await window.__shotEach(out.length); const hs = sh.head ? OG.E.toScreen(sh.head) : null; out.push({ kind: sh.kind, u: +OG.C.uniformity().toFixed(3), finite: Number.isFinite(sh.from.pos.x + sh.from.look.y), head: hs ? [+hs.x.toFixed(2), +hs.y.toFixed(2), hs.behind] : null }); }
        return out; }, id);
      shots += r.length; for (const [i, x] of r.entries()) { if (x.u > .9 || !x.finite) { flat++; bad.push(`${id}#${i}(${x.kind} ${x.u})`); await shot('flat-' + id + '-' + i); }
        if (x.head) { faces++; const [hx, hy, behind] = x.head; if (behind || hx < 0 || hx > 1 || hy < 0 || hy > .5) { faceBad.push(`${id}#${i}(${x.kind} head ${hx},${hy})`); } } }
    }
    check(faceBad.length === 0, `cinema: in every shot on a person (${faces}) the head is on screen and in the upper half`, faceBad.slice(0, 12).join(' '));
    check(flat === 0, `cinema: no near-uniform frame across ${shots} shots of ${list.length} scenes (>90% of pixels one colour)`, bad.slice(0, 12).join(' '));
    await page.evaluate(() => OdysseyGame.chart());
  }

  /* ─────────────── the whole poem ─────────────── */
  if (doSpine) {
    await page.evaluate(() => { OdysseyGame.chart(); OG.ST.noStage = false; OG.E.timeScale = 6; });   // every scene staged (a book can begin without its card, so its first scene must already be on its set)
    await page.evaluate(b => OdysseyGame.book(b), B0);
    const seenBooks = new Set(), shotBooks = new Set(), levelsSolved = []; let lastKey = '';
    for (let guard = 0; guard < 4000; guard++) {
      const d = await dbg(); const s = d.story; if (s.book) seenBooks.add(s.book);
      if (!s.playing && d.phase !== 'intro' && d.phase !== 'play' && d.phase !== 'end' && d.phase !== 'loading') { if (s.done.includes(B1) || (s.book === B1 && !s.playing)) break; }
      if (d.phase === 'intro' && d.level) { log('spine: trial', d.level, 'in book', s.book); await page.evaluate(sp => { OG.E.timeScale = sp; }, SPEED); await begin();   /* the trial at the trials' speed (the fast clock is for the cinematics) */ await sleep(800); try { await HAND[d.level](); } catch (e) { log('solver', d.level, e.message.slice(0, 200)); } const e = await ended(d.level + ' (spine)').catch(() => null); const r = e && e.result; levelsSolved.push([d.level, r && r.won]); check(!!(r && r.won), `spine: ${d.level} solved by hand inside book ${s.book}`, r ? `kleos ${r.kleos}` : ''); await page.evaluate(() => { OG.E.timeScale = 6; }); await sleep(1800); await key.press('KeyN'); await sleep(1500); continue; }
      if (d.phase === 'end' && d.level) { await key.press(d.result && d.result.won ? 'KeyN' : 'KeyW'); await sleep(1200); continue; }
      if (s.card) { if (!shotBooks.has(s.book)) await page.evaluate(() => { OG.ST.noStage = false; }); await key.press('Space'); await sleep(500); continue; }
      if (s.scene) {
        const k = s.book + ':' + s.scene; if (k !== lastKey) { lastKey = k; if (!shotBooks.has(s.book) && !(await page.evaluate(() => OG.ST.noStage))) { await sleep(2500); await shot('book-' + String(s.book).padStart(2, '0')); shotBooks.add(s.book); log('spine: book', s.book, s.scene, 'photographed'); } }
        await page.evaluate(() => { if (OG.G.phase === 'story') OdysseyGame.skip(); }); await sleep(300); continue; }   // only a scene: a skip that lands on a trial's card would watch the scene instead of playing it
      if (s.book > B1) break;
      await sleep(400);
    }
    const fin = await dbg(); const done = fin.story.done; const want = []; for (let b = B0; b <= B1; b++) want.push(b);
    check(want.every(b => seenBooks.has(b)), `spine: every book ${B0}–${B1} reached`, [...seenBooks].sort((a, b) => a - b).join(' '));
    check(want.every(b => done.includes(b)), `spine: every book ${B0}–${B1} completes (marked sailed)`, done.join(' '));
    check(want.every(b => shotBooks.has(b)), `spine: a cinematic frame photographed from each book`, [...shotBooks].sort((a, b) => a - b).join(' '));
  }
  if (errors.length) log('page errors:', errors.join(' | ').slice(0, 1500));
  fs.writeFileSync(path.join(SHOTS, 'results.json'), JSON.stringify({ when: new Date().toISOString(), results }, null, 1));
  log(`${results.filter(r => r.ok).length} passed, ${failures} failed`);
  await browser.close(); process.exitCode = failures ? 1 : 0;
})().catch(e => { console.error('CRASH', e.stack || e.message); process.exit(2); });   // exit: an open browser would keep the process alive
