#!/usr/bin/env node
/* tools/odyssey-wired.js — the sign score wired into the game's cinema, shown: before (the old GRAMMAR coverage, one shot per
   segment, the fixed 1.04 → 0.96 drift) and after (C.planDirected: the direction block of odyssey/cineosis/score.json).

   Opens the one-file phone build (play/odyssey-mobile.html) in Playwright's Pixel 7 emulation, and for each scene plans both
   cuts on the scene's own card, renders every shot at its start, middle and end (the move played), and writes into
   odyssey/cineosis/wired/:
     <scene>.json          both shot lists (t0, t1, kind, move, why) and each frame's checks (uniformity, the head's place)
     <scene>-before.jpg    the contact sheet of the old cut (one frame per shot, at its middle)
     <scene>-after.jpg     the contact sheet of the directed cut (start | end of each moving shot)
   Usage: node tools/odyssey-wired.js [--scenes OD-B12-S03,...] [--device "Pixel 7"] [--file odyssey-mobile.html]
   Needs the http server on :8899, chromium at /opt/pw-browsers/chromium-1194, playwright on NODE_PATH, python3 with PIL. */
'use strict';
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const { chromium, devices } = require('playwright');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'odyssey/cineosis/wired');
const A = process.argv.slice(2), opt = (k, d) => { const i = A.indexOf('--' + k); return i >= 0 ? A[i + 1] : d; };
const SCENES = opt('scenes', 'OD-B12-S03,OD-B11-S01,OD-B09-S10,OD-B23-S04,OD-B05-S01,OD-B20-S05').split(',');
const TMP = path.join(require('os').tmpdir(), 'odyssey-wired'); fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const d = devices[opt('device', 'Pixel 7')], ctx = await browser.newContext({ ...d });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const page = await ctx.newPage(); page.setDefaultTimeout(600000); page.on('pageerror', e => log('page error', e.message.slice(0, 200)));
  await page.goto('http://localhost:8899/play/' + opt('file', 'odyssey-mobile.html') + '?mute', { waitUntil: 'load' });
  await page.waitForFunction(() => window.OdysseyGame && OdysseyGame.G.ready, null, { timeout: 300000 });
  for (const id of SCENES) {
    const plans = await page.evaluate(async id => { window.OdysseyRenderGate = null; OdysseyGame.chart(); OG.M.hide(); OG.G.phase = 'probe';
      const item = OG.ST.story.books.flatMap(b => b.items.flatMap(i => i.type === 'scene' ? [i] : i.type === 'level' ? i.covers : [])).find(i => i.id === id);
      const st = await OG.C.load(item); OG.C.st = st; window.__wired = { item, before: OG.C.planGrammar(item, st), after: OG.C.plan(item, st) };
      const row = s => ({ t0: +s.t0.toFixed(2), t1: +Math.min(item.seconds, s.t1).toFixed(2), dur: +(Math.min(item.seconds, s.t1) - s.t0).toFixed(2), kind: s.kind, key: !!s.key || s.kind === 'key', move: s.move || (s.kind === 'key' ? 'push 5%' : 'drift 1.04→0.96'), why: s.why || null, edge: s.edge || null, what: s.what || null, seg: s.seg ?? null });
      return { title: item.title, seconds: item.seconds, segs: item.segs.map(g => ({ at: g.at, dur: g.dur, speaker: g.speaker, isLine: g.isLine })), dir: OG.DIR[id], before: window.__wired.before.map(row), after: window.__wired.after.map(row) }; }, id);
    const frames = { before: [], after: [] };
    for (const which of ['before', 'after']) for (let i = 0; i < plans[which].length; i++) for (const u of which === 'before' || plans[which][i].move === 'hold' ? [.5] : [0, 1]) {
      const r = await page.evaluate(async ({ which, i, u }) => { const s = window.__wired[which][i], E = OG.E, sm = E.smooth(u);
        const pos = s.from.pos.clone().lerp(s.to.pos, sm), look = s.from.look.clone().lerp((s.to.look || s.from.look), sm);
        E.setCamera(pos.toArray(), look.toArray(), { fov: s.from.fov }); for (let k = 0; k < 3; k++) await new Promise(r => requestAnimationFrame(r)); window.OdysseyRenderNow = 2; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const hs = s.head ? E.toScreen(s.head) : null; return { flat: +OG.C.uniformity().toFixed(3), head: hs ? [+hs.x.toFixed(2), +hs.y.toFixed(2), hs.behind] : null }; }, { which, i, u });
      const f = path.join(TMP, `${id}-${which}-${i}-${u}.png`); await page.screenshot({ path: f, scale: 'css' });
      frames[which].push({ i, u, file: f, ...r });
    }
    const bad = frames.after.filter(f => f.flat > .9 || (f.head && (f.head[2] || f.head[0] < 0 || f.head[0] > 1 || f.head[1] < 0 || f.head[1] > .5)));
    fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify({ scene: id, title: plans.title, seconds: plans.seconds, device: opt('device', 'Pixel 7'), direction: plans.dir, segments: plans.segs, before: plans.before, after: plans.after,
      checks: { before: frames.before.map(({ file, ...x }) => x), after: frames.after.map(({ file, ...x }) => x), afterBad: bad.map(({ file, ...x }) => x) } }, null, 1));
    const sheet = which => ({ out: path.join(OUT, `${id}-${which}.jpg`), title: `${id} ${plans.title} — ${which === 'before' ? 'BEFORE: GRAMMAR coverage, one shot per segment, 4% drift' : 'AFTER: the sign score (' + plans.dir.pn + ' · ' + [plans.dir.p, ...plans.dir.s].join(' ') + ')'}`,
      cells: plans[which].map((s, i) => ({ files: frames[which].filter(f => f.i === i).map(f => f.file),
        label: `${i + 1}. ${s.kind}${s.key ? '·key' : ''} ${s.dur.toFixed(1)}s`, sub: `${s.t0.toFixed(1)}–${s.t1.toFixed(1)} ${s.move}${s.why ? ' · ' + s.why : ''}${s.edge ? ' · edge ' + s.edge : ''}` })) });
    fs.writeFileSync(path.join(TMP, id + '-sheets.json'), JSON.stringify([sheet('before'), sheet('after')]));
    execFileSync('python3', [path.join(__dirname, 'odyssey-wired-sheet.py'), path.join(TMP, id + '-sheets.json')], { stdio: 'inherit' });
    log(id, plans.title, '· before', plans.before.length, 'shots · after', plans.after.length, 'shots', bad.length ? '· ' + bad.length + ' frames off' : '· all frames clear');
  }
  await browser.close();
})().catch(e => { console.error('CRASH', e.stack || e.message); process.exit(2); });
