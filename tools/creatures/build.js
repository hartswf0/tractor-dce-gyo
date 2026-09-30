#!/usr/bin/env node
/* tools/creatures/build.js — the creatures' moving pieces cut from the set pieces' animal parts, written once as LDraw.

   For each kind in film-readymades/creatures.js with `cuts`: every source part is flattened (its sub-files expanded) into the
   creature's frame, and each triangle and edge is clipped against the kind's `regions` (boxes, first match; what none takes is the
   source's own node). Each region becomes one sub-file of odyssey/creatures/parts/<kind>.mpd (cr-<kind>-<region>.ldr, colour 16
   kept where the part had it, so a rig recolours its animal), and the MPD's main model is the creature at rest.
     node tools/creatures/build.js            (all kinds)      node tools/creatures/build.js ram dog */
'use strict';
const fs = require('fs'), path = require('path');
const ld = require('./ld'), C = require('../../film-readymades/creatures.js');
const OUT = path.join(ld.ROOT, 'odyssey/creatures/parts');
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const f3 = x => { const r = Math.round(x * 10) / 10; return (Object.is(r, -0) ? 0 : r).toString(); };
function cutKind(K) {
  const buckets = new Map(), add = (reg, line) => { if (!buckets.has(reg)) buckets.set(reg, []); buckets.get(reg).push(line); };
  for (const src of K.cuts.from) {
    const g = ld.flat(src.part, src.col), M = src.m, P = (a, i) => ld.mul(M, [a[i], a[i + 1], a[i + 2], 1, 0, 0, 0, 1, 0, 0, 0, 1]).slice(0, 3);
    /* each triangle clipped exactly against the region boxes in order (Sutherland-Hodgman, one plane at a time): what lies inside a
       box is that region's, what lies outside goes on to the next box, and what no box takes is the source's own node. The seams
       are straight cuts along the boxes' faces, as a saw would leave them. */
    const regs = K.cuts.regions.filter(([, b]) => !b.src || b.src === src.to);
    const planes = b => { const out = []; ['x', 'y', 'z'].forEach((ax, k) => { if (b[ax]) { out.push([k, 1, b[ax][0]]); out.push([k, -1, b[ax][1]]); } }); return out; };   // inside: s*(p[k]-v) >= 0
    const split = (poly, [k, sg, v]) => { const inn = [], out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], da = sg * (a[k] - v), db = sg * (b[k] - v);
        if (da >= 0) inn.push(a); else out.push(a);
        if ((da >= 0) !== (db >= 0)) { const u = da / (da - db), q = [0, 1, 2].map(m => a[m] + (b[m] - a[m]) * u); inn.push(q); out.push(q); } }
      return [inn.length >= 3 ? inn : null, out.length >= 3 ? out : null]; };
    const splitL = (seg, [k, sg, v]) => { const [a, b] = seg, da = sg * (a[k] - v), db = sg * (b[k] - v); if (da >= 0 && db >= 0) return [seg, null]; if (da < 0 && db < 0) return [null, seg];
      const u = da / (da - db), q = [0, 1, 2].map(m => a[m] + (b[m] - a[m]) * u); return da >= 0 ? [[a, q], [q, b]] : [[q, b], [a, q]]; };
    const emit = (poly, reg, col) => { for (let i = 1; i + 1 < poly.length; i++) add(reg, `3 ${col} ${[...poly[0], ...poly[i], ...poly[i + 1]].map(f3).join(' ')}`); };
    const place = (poly, r, col, line) => {
      if (r >= regs.length) { if (line) add(src.to, `2 24 ${[...poly[0], ...poly[1]].map(f3).join(' ')}`); else emit(poly, src.to, col); return; }
      let inside = poly; const rest = [];
      for (const pl of planes(regs[r][1])) { if (!inside) break; const [a, b] = line ? splitL(inside, pl) : split(inside, pl); if (b) rest.push(b); inside = a; }
      if (inside) { if (line) add(regs[r][0], `2 24 ${[...inside[0], ...inside[1]].map(f3).join(' ')}`); else emit(inside, regs[r][0], col); }
      for (const q of rest) place(q, r + 1, col, line);
    };
    for (let i = 0, j = 0; i < g.tri.length; i += 9, j++) place([P(g.tri, i), P(g.tri, i + 3), P(g.tri, i + 6)], 0, g.tc[j] < 0 ? 24 : g.tc[j], false);
    for (let i = 0; i < g.seg.length; i += 6) place([P(g.seg, i), P(g.seg, i + 3)], 0, 0, true);
  }
  const name = K.kind, rig = C.define(name), lines = [`0 FILE ${name}.ldr`, `0 ${K.title} (rest pose): the moving pieces of film-readymades/creatures.js`, `0 Name: ${name}.ldr`, '0 Author: tools/creatures/build.js (cut from LDraw library parts: see each FILE)', '0 !LICENSE Redistributable under CCAL version 2.0 : see CAreadme.txt', ''];
  for (const r of rig.rows(rig.rest(), { frame: 'ldraw' })) lines.push(`1 ${r.file ? 16 : r.col} ${r.m.map(f3).join(' ')} ${r.file || r.part + '.dat'}`);
  const src = K.cuts.from.map(s => s.part).join(', ');
  for (const [reg, body] of [...buckets.entries()].sort()) lines.push('', `0 FILE cr-${name}-${reg}.ldr`, `0 ${K.title}: ${reg} (cut from ${src})`, `0 Name: cr-${name}-${reg}.ldr`, '0 !LDRAW_ORG Unofficial_Part', ...body);
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, name + '.mpd'); fs.writeFileSync(file, lines.join('\n') + '\n');
  return { file, regions: [...buckets.keys()].map(k => `${k}:${buckets.get(k).filter(l => l[0] === '3').length}`) };
}
const want = process.argv.slice(2);
for (const K of Object.values(C.KINDS)) { if (!K.cuts || K.cutFrom || (want.length && !want.includes(K.kind))) continue;
  const r = cutKind(K); console.log(path.relative(ld.ROOT, r.file), (fs.statSync(r.file).size / 1024).toFixed(0) + ' KB', r.regions.join(' ')); }
