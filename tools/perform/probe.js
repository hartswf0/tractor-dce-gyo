#!/usr/bin/env node
/* tools/perform/probe.js — what the performance engine needs from the real take, read once per scene from the film's own page.

     NODE_PATH=<playwright> node tools/perform/probe.js OD-B09-S09 [--choreo sheet.json|off] [--poses]

   Opens film-readymades/production/Film-Butter-Odyssey.html headless (as tools/export-odyssey.js does: 1280x720, the cut clock) and
   writes, in one session:
     odyssey/choreo/marks/<scene>.json    the take as tools/choreograph.js reads it (keys, snapshots, clips, envelope, cut)
     odyssey/score/cameras/<scene>.json   the shot camera at every drawing (12 a second), stored as runs: a camera is written only
                                          when it changes (pos, dir, up, fov), so the previz frames the film's own shots
     --poses: the page's own seven body points per figure per drawing to <scratch>/<scene>.poses.json (a check on the engine's
              forward kinematics; not committed)
   The take is prepared without a sheet unless --choreo names one (the cameras do not depend on the sheet except where a walker is
   tracked; the blocking's walks are the take's own). Needs the repository served on :8899. About 12-15 minutes on swiftshader. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2), sid = args.find(a => /^OD-B\d\d-S\d\d$/.test(a));
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
if (!sid) { console.log('node tools/perform/probe.js OD-Bxx-Syy [--choreo sheet.json|off] [--poses]'); process.exit(1); }
const co = opt('choreo', 'off'), choreo = co === 'off' ? false : JSON.parse(fs.readFileSync(co, 'utf8'));
const t0 = Date.now(), say = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(5) + 's', ...a);
(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); page.setDefaultTimeout(1800000);
  page.on('pageerror', e => say('page error', e.message));
  await page.goto('http://localhost:' + (process.env.PORT || 8899) + '/film-readymades/production/Film-Butter-Odyssey.html', { timeout: 1800000 });
  await page.waitForFunction(() => window.ButterLocation && window.ButterFilms?.current && !ButterFilms.busy && ButterCast.cast.length, null, { timeout: 1800000 });
  const loc = 'odyssey-' + sid.toLowerCase();
  if ((await page.evaluate(() => ButterFilms.current.sourceId)) !== loc) {
    await page.evaluate(l => { const t = ButterFilms.records.find(r => r.id === l).title, o = [...document.querySelectorAll('#versionSelect option')].find(o => o.textContent.trim() === t); return ButterFilms.switchTo(o.value); }, loc);
    await page.waitForFunction(l => ButterFilms.current?.sourceId === l && !ButterFilms.busy && ButterCast.cast.length, loc, { timeout: 900000 }); }
  say('location', loc, 'loaded; preparing the take');
  const info = await page.evaluate(o => OdysseyTake.exportStart(o), { mode: 'cut', w: 1280, h: 720, choreo });
  say('take', info.total, 's');
  const M = await page.evaluate(() => OdysseyTake.marks());
  const mf = path.join(ROOT, 'odyssey/choreo/marks', sid + '.json'); fs.mkdirSync(path.dirname(mf), { recursive: true }); fs.writeFileSync(mf, JSON.stringify(M)); say('marks ->', path.relative(ROOT, mf));
  /* the take's camera is not global: the camera object is caught on its matrix update */
  await page.evaluate(() => { const O = Object.getPrototypeOf(Object.getPrototypeOf(ButterCast.cast[0].rig.figure)), f = O.updateMatrixWorld;
    O.updateMatrixWorld = function (force) { if (this.isPerspectiveCamera) window.__perfCam = this; return f.call(this, force); }; });
  const n = Math.floor(info.total * 12 + 1e-6), P = [], runs = []; let last = '';
  for (let i = 0; i < n; i++) {
    const r = await page.evaluate(t => { const p = OdysseyTake.pose(t), c = window.__perfCam; if (!c) return { p, c: null };
      const e = c.matrixWorld.elements, r4 = v => +v.toFixed(3);
      return { p, c: { pos: [e[12], e[13], e[14]].map(r4), dir: [-e[8], -e[9], -e[10]].map(r4), up: [e[4], e[5], e[6]].map(r4), fov: r4(c.fov) } }; }, i / 12);
    if (args.includes('--poses')) P.push(r.p);
    const c = r.c || {}, sig = JSON.stringify([c.pos, c.dir, c.up, c.fov, r.p.shot]);
    if (sig !== last) { last = sig; runs.push({ i, t: +(i / 12).toFixed(4), shot: r.p.shot, kind: r.p.kind, ...c }); }
    if (i % 60 === 0) say('drawing', i, 'of', n);
  }
  const cf = path.join(ROOT, 'odyssey/score/cameras', sid + '.json'); fs.mkdirSync(path.dirname(cf), { recursive: true });
  fs.writeFileSync(cf, JSON.stringify({ scene: sid, fps: 12, size: [1280, 720], aspect: 1280 / 720, drawings: n, note: 'the take\'s shot camera, read by tools/perform/probe.js: a run starts at drawing i and holds until the next; pos, dir (unit), up, fov (vertical degrees)', runs }));
  say('cameras ->', path.relative(ROOT, cf), runs.length, 'runs');
  if (P.length) { const pf = opt('poses-out', path.join('/tmp/claude-0/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/scratchpad', sid + '.poses.json')); fs.writeFileSync(pf, JSON.stringify({ scene: sid, total: info.total, poses: P })); say('poses ->', pf); }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
