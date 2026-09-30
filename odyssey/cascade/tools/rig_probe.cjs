#!/usr/bin/env node
/* odyssey/cascade/tools/rig_probe.cjs — what the rig desk needs from the real take, read once per scene from the film's own page.

     NODE_PATH=<playwright> node odyssey/cascade/tools/rig_probe.cjs OD-B12-S03 [--choreo sheet.json] [--out file.json]

   Opens film-readymades/production/Film-Butter-Odyssey.html headless (as tools/export-odyssey.js does, same size, same mode, the
   scene's choreography sheet played), and for every drawing (12 a second) records the shot camera (position, where it looks, the
   vertical field of view) and the take's own pose of every figure (tools/choreograph.js's seven body points, whether the figure is
   in frame, its joints and root). The cameras go to assets/rig/<scene>/cameras.json (the previz frames the film's shots); the
   poses go to --out (default renders/rig/<scene>.probe.json, not committed): the ground truth the desk's rig and its density are
   checked against. Needs the repository served on :8899. About 10-15 minutes a scene on swiftshader. */
'use strict';
const fs = require('fs'), path = require('path');
const HERE = path.resolve(__dirname, '..'), ROOT = path.resolve(HERE, '..', '..');
const args = process.argv.slice(2), sid = args.find(a => /^OD-B\d\d-S\d\d$/.test(a));
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
if (!sid) { console.log('node tools/rig_probe.cjs OD-Bxx-Syy [--choreo sheet.json] [--out file]'); process.exit(1); }
const out = opt('out', path.join(HERE, 'renders/rig', sid + '.probe.json'));
const choreo = opt('choreo', null) ? JSON.parse(fs.readFileSync(opt('choreo'), 'utf8')) : undefined;
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
  /* the take's camera is not global: every Object3D's updateMatrixWorld is hooked, and pose(t) ends by updating the camera */
  await page.evaluate(() => { const O = Object.getPrototypeOf(Object.getPrototypeOf(ButterCast.cast[0].rig.figure)), f = O.updateMatrixWorld;
    O.updateMatrixWorld = function (force) { if (this.isPerspectiveCamera) window.__rigCam = this; return f.call(this, force); }; });
  /* the camera the page leaves after posing t: the take's own camera object is not global, so it is read from the renderer's last
     scene draw through a hook the probe installs on the camera's matrix update */
  const n = Math.floor(info.total * 12 + 1e-6), P = [], cams = [];
  for (let i = 0; i < n; i++) {
    const r = await page.evaluate(t => { const p = OdysseyTake.pose(t), c = window.__rigCam; if (!c) return { p, c: null };
      const e = c.matrixWorld.elements, f = [-e[8], -e[9], -e[10]], r5 = v => +v.toFixed(4);
      return { p, c: { pos: [e[12], e[13], e[14]].map(r5), dir: f.map(r5), up: [e[4], e[5], e[6]].map(r5), fov: r5(c.fov), aspect: r5(c.aspect) } }; }, i / 12);
    P.push(r.p); cams.push({ i, t: +(i / 12).toFixed(4), shot: r.p.shot, kind: r.p.kind, ...(r.c || {}) });
    if (i % 60 === 0) say('drawing', i, 'of', n);
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ scene: sid, total: info.total, poses: P }));
  say('poses ->', out);
  const cf = path.join(HERE, 'assets/rig', sid, 'cameras.json'); fs.mkdirSync(path.dirname(cf), { recursive: true });
  fs.writeFileSync(cf, JSON.stringify({ scene: sid, fps: 12, size: [1280, 720], note: 'the acted film\'s shot camera at every drawing, read from the take by tools/rig_probe.cjs: pos, dir (unit, where it looks), up, fov (vertical degrees)', cams }));
  say('cameras ->', cf);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
