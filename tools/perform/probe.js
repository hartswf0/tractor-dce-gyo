#!/usr/bin/env node
/* tools/perform/probe.js — what the performance engine needs from the real take, read once per scene from the film's own page.

     NODE_PATH=<playwright> node tools/perform/probe.js OD-B09-S09 [--choreo sheet.json|off] [--poses]

   Opens film-readymades/production/Film-Butter-Odyssey.html headless (as tools/export-odyssey.js does: 1280x720, the cut clock) and
   writes, in one session:
     odyssey/choreo/marks/<scene>.json    the take as tools/choreograph.js reads it (keys, snapshots, clips, envelope, cut)
     odyssey/score/cameras/<scene>.json   the shot camera at every drawing (12 a second), stored as runs: a camera is written only
                                          when it changes (pos, dir, up, fov), so the previz frames the film's own shots
     odyssey/choreo/ground/<scene>.json   the take's ground (its own downward ray) on a grid over the stage, for creature placement
     --ground-only: the ground alone (the marks and cameras kept)
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
const GROUND_ONLY = args.includes('--ground-only');   /* only the ground grid (marks and cameras kept) */
const co = opt('choreo', 'off'), choreo = co === 'off' ? false : JSON.parse(fs.readFileSync(co, 'utf8'));
const t0 = Date.now(), say = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(5) + 's', ...a);
(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); page.setDefaultTimeout(1800000);
  page.on('pageerror', e => say('page error', e.message));
  if (args.includes('--verbose')) page.on('console', m => { const x = m.text(); if (/take|creature|choreo|cine|plan/i.test(x)) say('console', x.slice(0, 200)); });
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
  const mf = path.join(ROOT, 'odyssey/choreo/marks', sid + '.json');
  if (!GROUND_ONLY) { fs.mkdirSync(path.dirname(mf), { recursive: true }); fs.writeFileSync(mf, JSON.stringify(M)); say('marks ->', path.relative(ROOT, mf)); }
  /* the ground: the take's own ray (as OdysseyFilm.ground, straight down onto the set) on a grid over the stage, with the props and the
     creatures' staged pieces out of the way (a giant's piece is not a floor). A cave has a roof: each cell keeps every surface that
     faces up with a figure's clearance of air over it (up to four, highest first), and the engine takes the one under its creature */
  { const G = await page.evaluate(({ M }) => { const CRE = /polyphem|laestryg|antiphat|giant|scylla|\bram|rams|flock|dog|argos|cow|cattle|splash|swell|spray/i;
      const plate = M.pieces.find(p => /stage plate/.test(p.label)) || M.pieces[0], b = plate.box, sc = M.scale || 1, cell = Math.max(4, 8 * sc), air = 20 * sc;
      const boxes = M.pieces.filter(p => CRE.test(p.label)).map(p => p.box), hid = [], V = (o, v) => { hid.push([o, o.visible]); o.visible = v; };
      const scene = (() => { let o = ButterCast.cast[0].rig.figure; while (o.parent) o = o.parent; return o; })(), figs = new Set(); ButterCast.cast.forEach(a => a.rig.figure.traverse(o => figs.add(o)));
      scene.traverse(o => { if (/^prop:/.test(o.name || '') || /^creatures?$|^creature:/.test(o.name || '')) V(o, false); });
      const B3 = new THREE.Box3(); if (boxes.length) scene.traverse(o => { if (!o.isMesh || !o.visible || figs.has(o)) return; B3.setFromObject(o); const c = [(B3.min.x + B3.max.x) / 2, (B3.min.y + B3.max.y) / 2, (B3.min.z + B3.max.z) / 2];
        if (boxes.some(q => c[0] >= q[0] - 2 && c[0] <= q[3] + 2 && c[1] >= q[1] - 2 && c[1] <= q[4] + 2 && c[2] >= q[2] - 2 && c[2] <= q[5] + 2)) V(o, false); });
      const shown = o => { for (let p = o; p; p = p.parent) if (p.visible === false) return false; return true; }, meshes = []; scene.traverse(o => { if (o.isMesh && !figs.has(o) && shown(o) && o.geometry) meshes.push(o); });
      const nx = Math.min(100, Math.ceil((b[3] - b[0]) / cell) + 1), nz = Math.min(100, Math.ceil((b[5] - b[2]) / cell) + 1), cx = (b[3] - b[0]) / (nx - 1), cz = (b[5] - b[2]) / (nz - 1), y = [];
      const ray = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), o3 = new THREE.Vector3(), nm = new THREE.Vector3(), N3 = new THREE.Matrix3();
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { o3.set(b[0] + i * cx, 3000, b[2] + j * cz); ray.set(o3, dn); const hs = ray.intersectObjects(meshes, false), out = []; let above = Infinity;
        for (const h of hs) { const yy = h.point.y; if (h.face) { N3.getNormalMatrix(h.object.matrixWorld); nm.copy(h.face.normal).applyMatrix3(N3).normalize(); } const up = !h.face || Math.abs(nm.y) > 0.5;
          if (up && above - yy >= air && (!out.length || out[out.length - 1] - yy > 1)) out.push(+yy.toFixed(2)); above = Math.min(above, yy); if (out.length >= 4) break; }
        y.push(out.length ? out : [0]); }
      for (const [o, v] of hid.reverse()) o.visible = v;
      return { x0: b[0], z0: b[2], dx: cx, dz: cz, nx, nz, y, hidden: hid.length, meshes: meshes.length }; }, { M });
    const gf = path.join(ROOT, 'odyssey/choreo/ground', sid + '.json'); fs.mkdirSync(path.dirname(gf), { recursive: true });
    fs.writeFileSync(gf, JSON.stringify({ scene: sid, note: 'the take\'s ground: rays down onto the set on a grid over the stage plate (props and creature pieces hidden); each cell lists the surfaces facing up with clearance above them, highest first; read by tools/perform/ground.js', ...G }));
    say('ground ->', path.relative(ROOT, gf), G.nx + 'x' + G.nz, 'meshes', G.meshes, 'hidden', G.hidden); }
  if (GROUND_ONLY) { await browser.close(); return; }
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
