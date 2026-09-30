#!/usr/bin/env node
/* odyssey/cascade/tools/extract.cjs — the small JSON the Cascade graphs read, cut from the project's own data (read, never changed).

     node odyssey/cascade/tools/extract.cjs

   assets/gestures.json  two gestures, each one actor's slice of a choreography sheet (odyssey/choreo/<scene>.json, odyssey-choreo/1)
                         and of its marks (odyssey/choreo/marks/<scene>.json): the blocking keys (position, heading, the joints) with
                         their seam windows, and every keyed layer of the channels the hand's kinematics read (root, hips, torso,
                         arms, hands). The graph samples them itself (project.ChoreoHand), the way film-readymades/choreo.js does.
   assets/hall.json      the twelve figures of OD-B01-S03 at their marks, and for each, per drawing (12 a second), how much the
                         choreography moves it with the scene's scripted layers alone (act, work, walk, beat, react, song) and
                         with the life the choreographer invents as well (breath, look, shift, the fill layer's business): the
                         measure the attention knob starts from.
   assets/clashes.json   written by clashes.py (the illegal Odyssey), not here. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..'), OUT = path.join(__dirname, '..', 'assets');
const Choreo = require(path.join(ROOT, 'film-readymades/choreo.js'));
const J = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const r4 = v => Math.round(v * 1e4) / 1e4;
const KEEP = /^(root\.|hips\.dy|torso\.|arm\.|hand\.)/;

function slice(scene, actor, t0, t1, title, caption) {
  const C = J(`odyssey/choreo/${scene}.json`), M = J(`odyssey/choreo/marks/${scene}.json`), A = C.actors[actor];
  const channels = {};
  for (const [k, K] of Object.entries(A.channels)) if (KEEP.test(k)) channels[k] = K.map(q => q.length > 2 ? [r4(q[0]), r4(q[1]), q[2]] : [r4(q[0]), r4(q[1])]);
  const keys = M.keys.map(k => { const s = k.snap[actor];
    return { t: k.t, win: k.win, p: s.p.map(r4), h: r4(s.h), sat: s.sat, j: { armRP: s.j.armRP.map(r4), armLP: s.j.armLP.map(r4), torsoP: s.j.torsoP.map(r4), legRP: s.j.legRP.map(r4), legLP: s.j.legLP.map(r4) } }; });
  return { scene, actor, title, caption, t0, t1, step: C.step, layer: C.layer, scale: M.scale, H: M.H[actor], keys, channels };
}

const gestures = {
  welcome: slice('OD-B01-S03', 'telemachus', 19.5, 44.5, 'Telemachus crosses the hall and welcomes the stranger',
    'He rises from the feast, crosses the hall to the gate and greets her: "Welcome, stranger ... give me your spear."'),
  bow: slice('OD-B22-S01', 'odysseus-revealed', 10.5, 16.5, 'Odysseus draws and looses the first arrow',
    'He shoots Antinous through the throat while the suitor lifts a cup.'),
};
fs.writeFileSync(path.join(OUT, 'gestures.json'), JSON.stringify(gestures));

/* the hall: marks per key, and per drawing each figure's motion as the choreographer measures it (tools/choreograph.js, its last
   pass: the largest channel change times its lever, a fraction of the figure's height; the blocking's travel between marks too),
   once with only the scripted layers (act, work, walk, beat, react, song) and once with the whole sheet, the invented life included
   (breath, look, shift and the fill layer's business) */
const LEVER = { 'arm.R.pitch': 0.3, 'arm.L.pitch': 0.3, 'arm.R.out': 0.3, 'arm.L.out': 0.3, 'torso.lean': 0.5, 'torso.twist': 0.25, 'torso.roll': 0.5, 'head.yaw': 0.12, 'head.pitch': 0.12,
  'root.h': 0.2, 'root.pitch': 0.8, 'root.roll': 0.8, 'leg.R.pitch': 0.3, 'leg.L.pitch': 0.3, 'hand.R.roll': 0.05, 'hand.L.roll': 0.05 };
function hall(scene) {
  const C = J(`odyssey/choreo/${scene}.json`), M = J(`odyssey/choreo/marks/${scene}.json`);
  const n = Math.floor(C.total * 12), figs = [];
  const at = (id, t) => { const K = M.keys; let i = 0; for (let j = 0; j < K.length; j++) if (K[j].t <= t) i = j;
    const w = [K[i + 1], K[i]].find(k => k && k.win && t >= k.win[0] && t <= k.win[1]); if (!w) return K[i].snap[id];
    const j = K.indexOf(w), A = K[j - 1].snap[id], B = w.snap[id], u = Math.max(0, Math.min(1, (t - w.win[0]) / (w.win[1] - w.win[0]))), e = u * u * (3 - 2 * u);
    return { p: A.p.map((v, q) => v + (B.p[q] - v) * e), h: A.h + (B.h - A.h) * e }; };
  for (const id of Object.keys(C.actors)) {
    const H = M.H[id], scale = M.scale, lanes = Object.entries(C.actors[id].channels).map(([k, L]) => [k, k.split('@')[0], L]);
    const LIFE = /@(fill|breath|look|shift)$/;   /* the life the choreographer invents; the rest is scripted by the scene (act, work, walk, beat, react, song) */
    const series = (skipFill) => { const out = []; let prev = null, pb = null;
      for (let i = 0; i <= n; i++) { const t = i / 12, v = {};
        for (const [k, ch, L] of lanes) { if (skipFill && LIFE.test(k)) continue; v[ch] = (v[ch] || 0) + Choreo.sampleKeys(L, t, ch); }
        const b = at(id, t); let d = 0;
        if (prev) { for (const ch in v) d = Math.max(d, Math.abs(v[ch] - (prev[ch] || 0)) * (LEVER[ch] != null ? LEVER[ch] * H : ch === 'hips.dy' ? scale : 1));
          d = Math.max(d, Math.hypot(b.p[0] - pb.p[0], b.p[2] - pb.p[2]), Math.abs(b.p[1] - pb.p[1])); }
        out.push(Math.round(d / H * 10000)); prev = v; pb = b; }
      return out; };
    figs.push({ id, H, base: series(true), fill: series(false) });
  }
  const keys = M.keys.map(k => ({ t: k.t, win: k.win, beat: k.beat, snap: Object.fromEntries(Object.entries(k.snap).map(([id, s]) => [id, { p: [r4(s.p[0]), r4(s.p[2])], h: r4(s.h), sat: s.sat, vis: s.vis }])) }));
  const D = J(`odyssey/choreo/density/${scene}.json`);
  return { scene, total: C.total, drawings: 12, unit: 'ten-thousandths of the figure height per drawing (the choreographer threshold is 50)', thresh: 50,
    keys, figs, density: { rule: D.rule, before: D.before && D.before.mean, after: D.after && D.after.mean },
    pieces: M.pieces.filter(p => /floor|court|feast|gate/.test(p.label)) };
}
fs.writeFileSync(path.join(OUT, 'hall.json'), JSON.stringify(hall('OD-B01-S03')));
for (const f of ['gestures.json', 'hall.json']) console.log(f, fs.statSync(path.join(OUT, f)).size, 'bytes');
