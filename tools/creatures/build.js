#!/usr/bin/env node
/* tools/creatures/build.js — the creatures' moving pieces cut from the set pieces' animal parts, written once as LDraw.

   For each kind in film-readymades/creatures.js with `cuts`: every source part is flattened (its sub-files expanded) into the
   creature's frame, and each triangle and edge goes to the region its centre falls in (the kind's `regions`, first match; else the
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
    const region = c => { for (const [name, fn] of K.cuts.regions) if (fn(c[0], c[1], c[2], src.to)) return name; return src.to; };
    /* a triangle whose corners fall in different regions is split (at its edges' midpoints) until each piece is small, so a cut runs
       close along the region's boundary and no long sliver of the body is dragged along by a turning head */
    const put = (a, b, c, col, depth) => {
      const r = [a, b, c].map(region), L = Math.max(dist(a, b), dist(b, c), dist(c, a));
      if ((r[0] !== r[1] || r[1] !== r[2]) && L > 3.5 && depth < 7) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
        put(a, ab, ca, col, depth + 1); put(ab, b, bc, col, depth + 1); put(ca, bc, c, col, depth + 1); put(ab, bc, ca, col, depth + 1); return; }
      const m = [0, 1, 2].map(k => (a[k] + b[k] + c[k]) / 3); add(region(m), `3 ${col} ${[...a, ...b, ...c].map(f3).join(' ')}`); };
    const putL = (a, b, depth) => { if (region(a) !== region(b) && dist(a, b) > 3.5 && depth < 7) { const m = mid(a, b); putL(a, m, depth + 1); putL(m, b, depth + 1); return; }
      add(region(mid(a, b)), `2 24 ${[...a, ...b].map(f3).join(' ')}`); };
    for (let i = 0, j = 0; i < g.tri.length; i += 9, j++) put(P(g.tri, i), P(g.tri, i + 3), P(g.tri, i + 6), g.tc[j] < 0 ? 24 : g.tc[j], 0);
    for (let i = 0; i < g.seg.length; i += 6) putL(P(g.seg, i), P(g.seg, i + 3), 0);
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
