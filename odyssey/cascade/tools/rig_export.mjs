#!/usr/bin/env node
/* odyssey/cascade/tools/rig_export.mjs — the director's layer out of the rig desk graph and into the scene's choreography sheet, as
   the `overrides` that tools/choreograph.js keeps across regeneration and the film's renderer plays (film-readymades/choreo.js).

     node tools/rig_export.mjs OD-B12-S03 [--graph file.cascade] [--dry] [--sheet out.json]

   Every rig node's director props are resolved at every drawing (12 a second) by Cascade's own PropAnimator (tools/rig_graph.mjs):
     an offset prop (armRPitch, ...) that is not zero somewhere  -> overrides[actor]['arm.R.pitch@dir'], a new layer that sums with the
                                                                  generated ones: a key at every drawing of its span (linear, the
                                                                  straight runs thinned), zero at both ends
     a weight prop (wArmR, ...) that is not 1 somewhere          -> for each generated layer of that part of the body, the same lane
                                                                  name in overrides, holding the generated keys times the weight at
                                                                  every drawing from the generated key before the span to the one
                                                                  after it (the first key keeps its ease, so the curve into the span
                                                                  is the choreographer's own); choreo.js drops generated keys inside
                                                                  an override's span and plays these
   The lanes the desk wrote are listed in overrides._desk (ignored by the player and kept by the choreographer, which copies overrides
   verbatim), so the next export replaces them and leaves any other override alone. Nothing to write and nothing written before: the
   sheet is not touched (the round trip import -> export with no edits is a no-op). */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { loadDesk, directorOf, HERE, ROOT } from './rig_graph.mjs';
import { CH, GROUP_OF, GROUPS, PROP_OF, DIR_LAYER, drawT, sampleKeys } from '../lib/rig.ts';

const require = createRequire(import.meta.url), Choreo = require(path.join(ROOT, 'film-readymades/choreo.js'));
const args = process.argv.slice(2), sid = args.find(a => /^OD-B\d\d-S\d\d$/.test(a));
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
if (!sid) { console.log('node tools/rig_export.mjs OD-Bxx-Syy [--graph g.cascade] [--dry] [--sheet out.json]'); process.exit(1); }
const r4 = v => Math.round(v * 1e4) / 1e4, EPS = 1e-6;

export function exportDesk(sid, graphFile) {
  const desk = loadDesk(sid, graphFile), sheetF = path.join(ROOT, `odyssey/choreo/${sid}.json`), C = JSON.parse(fs.readFileSync(sheetF, 'utf8'));
  const N = Math.floor(C.total * 12 + 1e-6), T = i => i / 12;
  /* the director's props at every drawing, per rig */
  const series = new Map(desk.rigs.map(r => [r.actor, { off: Object.fromEntries(CH.map(c => [c, []])), w: Object.fromEntries(GROUPS.map(g => [g, []])) }]));
  for (let i = 0; i <= N; i++) { desk.at(i + 1); for (const r of desk.rigs) { const D = directorOf(r.node), s = series.get(r.actor); for (const c of CH) s.off[c].push(D.offsets[c]); for (const g of GROUPS) s.w[g].push(D.weights[g]); } }
  if (desk.errors.length) throw new Error('expressions failed: ' + [...new Set(desk.errors)].slice(0, 5).join('; '));
  const out = {}, lanesOf = {};
  const thin = K => { /* drop a linear key the straight line through its neighbours already gives */
    const o = [K[0]]; for (let q = 1; q < K.length - 1; q++) { const a = o[o.length - 1], b = K[q], c = K[q + 1]; if (b.length > 2 && b[2] !== 'linear') { o.push(b); continue; }
      const u = (b[0] - a[0]) / (c[0] - a[0]); if (c[2] === 'linear' && Math.abs(a[1] + (c[1] - a[1]) * u - b[1]) < 5e-5) continue; o.push(b); }
    if (K.length > 1) o.push(K[K.length - 1]); return o; };
  for (const r of desk.rigs) {
    const s = series.get(r.actor), lanes = {};
    /* offsets: a new '@dir' layer */
    for (const c of CH) { const v = s.off[c], nz = v.map((x, i) => Math.abs(x) > EPS ? i : -1).filter(i => i >= 0); if (!nz.length) continue;
      const a = Math.max(0, nz[0] - 1), b = Math.min(N, nz[nz.length - 1] + 1), K = [];
      for (let i = a; i <= b; i++) K.push([r4(T(i)), r4(v[i]), 'linear']);
      lanes[c + '@' + DIR_LAYER] = thin(K); }
    /* weights: the generated layers of that part scaled */
    for (const g of GROUPS) { const w = s.w[g], dev = w.map((x, i) => Math.abs(x - 1) > EPS ? i : -1).filter(i => i >= 0); if (!dev.length) continue;
      for (const [lane, K0] of Object.entries(r.S.lanes)) { const ch = lane.split('@')[0]; if (GROUP_OF[ch] !== g || lane.endsWith('@' + DIR_LAYER)) continue;
        const t0 = T(dev[0]), t1 = T(dev[dev.length - 1]);
        const ka = [...K0].reverse().find(k => k[0] <= t0 - 1 / 12 + 1e-6) || null, kb = K0.find(k => k[0] >= t1 + 1 / 12 - 1e-6) || null;
        const ia = ka ? Math.ceil(ka[0] * 12 - 1e-6) : 0, ib = kb ? Math.floor(kb[0] * 12 + 1e-6) : N, K = [];
        if (ka) K.push(ka.slice()); else K.push([0, r4((sampleKeys(K0, 0, lane) ?? 0) * w[0]), 'linear']);
        for (let i = ia + (ka ? (Math.abs(ia / 12 - ka[0]) < 1e-3 ? 1 : 0) : 1); i < (kb ? ib : ib + 1); i++) {
          if (kb && Math.abs(i / 12 - kb[0]) < 1e-3) continue;
          K.push([r4(T(i)), r4((sampleKeys(K0, drawT(T(i), r.S.step), lane) ?? 0) * w[i]), 'linear']); }
        if (kb) K.push([kb[0], r4(kb[1] * w[Math.min(N, Math.round(kb[0] * 12))]), 'linear']);
        lanes[lane] = thin(K); } }
    if (Object.keys(lanes).length) { out[r.actor] = lanes; lanesOf[r.actor] = Object.keys(lanes).sort(); }
  }
  /* into the sheet: the desk's previous lanes replaced, other overrides kept */
  const O = JSON.parse(JSON.stringify(C.overrides || {})), prevDesk = (O._desk && O._desk.lanes) || {};
  for (const [id, L] of Object.entries(prevDesk)) { if (!O[id]) continue; for (const k of L) delete O[id][k]; if (!Object.keys(O[id]).length) delete O[id]; }
  delete O._desk;
  for (const [id, L] of Object.entries(out)) O[id] = Object.assign(O[id] || {}, L);
  if (Object.keys(lanesOf).length) O._desk = { by: 'odyssey/cascade/tools/rig_export.mjs', graph: 'odyssey/cascade/' + path.basename(desk.file), note: 'lanes written by the rig desk from the graph\'s director props; the next export replaces them', lanes: lanesOf };
  const before = JSON.stringify(C.overrides || {}), after = JSON.stringify(O), changed = before !== after;
  return { C, O, changed, lanesOf, sheetF, desk, N };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const t0 = Date.now(), r = exportDesk(sid, opt('graph', null));
  const nkeys = Object.entries(r.O).filter(([k]) => k !== '_desk').reduce((a, [, L]) => a + Object.values(L).reduce((b, K) => b + K.length, 0), 0);
  console.log(`${sid}: ${r.desk.rigs.length} rigs read at ${r.N + 1} drawings in ${Date.now() - t0} ms;`, r.changed ? `overrides changed: ${JSON.stringify(r.lanesOf)} (${nkeys} keys)` : 'nothing changed (the sheet is not touched)');
  if (r.changed && !args.includes('--dry')) {
    const C = r.C; C.overrides = r.O; if (C._compiled) delete C._compiled;
    const dest = opt('sheet', r.sheetF); fs.writeFileSync(dest, JSON.stringify(C)); console.log('wrote', path.relative(ROOT, dest));
  }
}
