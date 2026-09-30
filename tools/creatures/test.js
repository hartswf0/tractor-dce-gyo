#!/usr/bin/env node
/* tools/creatures/test.js — the creature rigs held to account (node tools/creatures/test.js; exits 1 on a failure):
     every kind defines, its channels have limits, its rest pose is the identity on every node, its cut pieces exist in its MPD;
     a pose is a pure function of its channels and a gait / herd / heavy walk / strike of t (the same t in any order, the same numbers);
     planted feet do not slide (walk, trot, run, a gait schedule with a stop and a turn), and stay on the ground;
     the clamp holds every channel inside its limits; a sheet's creature actor samples on twos, keys over procedures, riders on anchors. */
'use strict';
const fs = require('fs'), path = require('path');
const C = require('../../film-readymades/creatures.js'), ld = require('./ld');
const { ap } = C.m;
let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.log('FAIL', msg); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

/* the kinds */
for (const k of C.kinds()) {
  const rig = C.define(k.kind), K = rig.K, v = rig.rest();
  ok(K.channels.length > 0 && K.channels.every(c => c.min < c.max && isFinite(c.min) && isFinite(c.max)), `${k.kind}: channels with limits`);
  ok(K.channels.every(c => c.rest >= c.min && c.rest <= c.max), `${k.kind}: rest values inside the limits`);
  if (k.kind !== 'scylla') { const L = rig.local(v); ok(Object.values(L).every(M => M.every((x, i) => near(x, C.m.I12[i], 1e-9))), `${k.kind}: rest pose is the identity`); }
  const files = K.cuts || K.cutFrom ? ld.mpdFiles(fs.readFileSync(path.join(ld.ROOT, 'odyssey/creatures/parts', (K.cutFrom || k.kind) + '.mpd'), 'utf8')) : new Map();
  const missing = K.nodes.flatMap(n => (n.mesh || []).filter(m => m.file && !files.has(m.file.toLowerCase()))).map(m => m.file);
  ok(missing.length === 0, `${k.kind}: every cut piece in its MPD (${missing.join(' ')})`);
  const parts = [...new Set(K.nodes.flatMap(n => (n.mesh || []).filter(m => m.part).map(m => m.part).concat(n.swap ? n.swap.parts.flatMap(p => Array.isArray(p) ? [p[0]].concat((p[2] || []).map(m => m.part)) : [p]) : [])))];
  ok(parts.every(p => ld.libLines(p)), `${k.kind}: every part in the library (${parts.filter(p => !ld.libLines(p)).join(' ')})`);
  /* the clamp */
  const wild = {}; for (const c of K.channels) wild[c.name] = c.max * 3 + 7; const cv = rig.clamp(wild);
  ok(K.channels.every(c => cv[c.name] <= c.max), `${k.kind}: clamp holds the limits`);
  /* a pose is a function of its channels */
  const q = {}; K.channels.forEach((c, i) => { q[c.name] = c.min + (c.max - c.min) * ((i * 0.37) % 1); });
  ok(JSON.stringify(rig.rows(q)) === JSON.stringify(rig.rows(Object.assign({}, q))), `${k.kind}: the same channels, the same pose`);
  ok(typeof rig.ldr(q) === 'string' && rig.ldr(q).split('\n').length > 3, `${k.kind}: an LDraw frame`);
  for (const a of Object.keys(K.anchors || {})) ok(rig.anchor(a, q).every(isFinite), `${k.kind}: anchor ${a}`);
}

/* gaits: the same t in any order gives the same numbers; planted feet stay put and on the ground */
function footRun(kind, gaitSpec, pathKeys, scale, label, frames = 240, tol = 0.35) {
  const rig = C.define(kind, { scale }), prev = {}; let slide = 0, below = 0;
  for (let f = 0; f < frames; f++) { const t = f / 24, v = C.gait(rig, t, { path: pathKeys, gait: gaitSpec, blend: 0.4 }), P = rig.pose(v);
    for (const [leg, F] of Object.entries(rig.K.feet)) { const p = ap(P.nodes[F.knee], F.foot), ft = v._feet[leg], m = prev[leg];
      if (ft.planted && m && m.planted && m.cyc === ft.cyc) slide = Math.max(slide, Math.hypot(p[0] - m.p[0], p[2] - m.p[2]) / scale);
      if (ft.planted) below = Math.max(below, -p[1] / scale); prev[leg] = { p, planted: ft.planted, cyc: ft.cyc }; } }
  ok(slide < tol, `${label}: planted feet slide ${slide.toFixed(3)} LDU a frame (< ${tol})`);
  ok(below < 0.5, `${label}: planted feet ${below.toFixed(2)} LDU below the ground`);
  return { slide, below };
}
const straight = sp => [[0, 0, 0], [1, 0, 0], [9, 0, sp * 8], [10, 0, sp * 8]];
const summary = {};
for (const kind of ['ram', 'dog', 'cattle']) for (const g of ['walk', 'trot', 'run']) summary[`${kind} ${g}`] = footRun(kind, g, straight({ walk: 22, trot: 50, run: 110 }[g]), 1, `${kind} ${g}`);
summary['ram walk at scale 2.4'] = footRun('ram', 'walk', [[0, -260, 0, 'linear'], [0.8, -260, 0, 'linear'], [7.2, 220, 0, 'linear'], [8, 220, 0, 'linear']], 2.4, 'ram walk at scale 2.4');
summary['dog: run, trot, walk, a stop, a turn, run'] = footRun('dog', [[0, 'run'], [3.0, 'trot'], [3.6, 'walk'], [6.3, 'run']], [[0, -300, -500], [0.3, -300, -500], [3.2, -90, -10], [6.4, -90, -10], [8.6, -420, -200]], 1.1, 'dog schedule with a stop and a turn', 216, 6.0);
{ const rig = C.define('dog'), p = straight(24), ts = [3.3, 0.5, 7.9, 3.3, 2.2, 0.5];
  const a = ts.map(t => JSON.stringify(C.gait(rig, t, { path: p, gait: 'walk' })));
  ok(a[0] === a[3] && a[1] === a[5], 'gait: the same t in any order, the same numbers');
  const fresh = JSON.stringify(C.gait(C.define('dog'), 3.3, { path: straight(24), gait: 'walk' })); ok(fresh === a[0], 'gait: a fresh rig and path, the same numbers'); }
{ const mk = () => C.herd({ n: 5, path: [[0, 0, -300], [6, 0, 200]], seed: 4 }), A = mk(), B = mk();
  const x1 = JSON.stringify(A.at(3, 4.2)), _ = A.at(1, 1.0), x2 = JSON.stringify(B.at(1, 1.0)) && JSON.stringify(B.at(3, 4.2)); void _;
  ok(x1 === x2, 'herd: the same t in any order, the same place');
  let dmin = 1e9; for (let t = 0; t < 6; t += 0.25) for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) { const p = A.at(i, t), q = A.at(j, t); dmin = Math.min(dmin, Math.hypot(p.x - q.x, p.z - q.z)); }
  ok(dmin > 20, `herd: separation (closest ${dmin.toFixed(1)})`); }
{ const rig = C.define('laestrygon', { scale: 1.5 }), P = { path: [[0, 0, 0], [1, 0, 0], [7, 0, 400], [9, 0, 400]] }, prev = {}; let slide = 0;
  const a = JSON.stringify(C.heavy(rig, 5.1, P)), b = JSON.stringify(C.heavy(rig, 2.0, P)) && JSON.stringify(C.heavy(rig, 5.1, P)); ok(a === b, 'heavy: the same t in any order, the same numbers');
  for (let f = 0; f < 240; f++) { const t = f / 24, v = C.heavy(rig, t, P), Q = rig.pose(v);
    for (const id of ['leg.R', 'leg.L']) { const F = rig.K.feet[id], p = ap(Q.nodes[F.knee], F.foot), ft = v._feet[id], m = prev[id]; if (ft.planted && m && m.pl) slide = Math.max(slide, Math.hypot(p[0] - m.p[0], p[2] - m.p[2]) / 1.5); prev[id] = { p, pl: ft.planted }; } }
  ok(slide < 1.0, `heavy: planted feet slide ${slide.toFixed(2)} LDU a frame (< 1)`); summary['giant heavy walk'] = { slide };
  let shake = 0; for (let t = 1; t < 7; t += 0.05) shake = Math.max(shake, Math.abs(C.heavy(rig, t, P)._fx.shake)); ok(shake > 0.5, `heavy: the ground shakes (${shake.toFixed(2)})`); }
{ const G = C.define('polyphemus', { scale: 1.4 }), base = Object.assign(G.rest(), G.preset('sit'), { 'root.x': -110, 'root.h': Math.PI / 2 });
  const v = C.reach(G, base, 'R', [0, 60, 30]), g = G.point('grip.R', v); ok(Math.hypot(g[0], g[1] - 60, g[2] - 30) < 3, `reach: the hand on its target (${Math.hypot(g[0], g[1] - 60, g[2] - 30).toFixed(2)})`);
  const w = C.grope(G, 2.5, { center: [0, 90, 0], width: 160, base }); ok(w._target.R && w._target.L, 'grope: both hands sent'); }
{ const S = C.define('scylla'), base = { 'root.y': 250, 'root.z': -50 }, tg = [-100, -60, -20, 20, 60, 100].map(x => [x, 76, 170]);
  const v = C.strike(S, 4.9, { t0: 4.2, targets: tg, strike: 0.6, hold: 0.9, base }); let far = 0;
  for (let N = 1; N <= 6; N++) { const j = S.point('jaw' + N, v); far = Math.max(far, Math.hypot(j[0] - tg[N - 1][0], j[1] - tg[N - 1][1], j[2] - tg[N - 1][2])); }
  ok(far < 60, `strike: every jaw at its rower (farthest ${far.toFixed(1)})`);
  const L = S.local(v); let gap = 0; for (let N = 1; N <= 6; N++) for (let i = 1; i < 40; i++) { const a = S.K.nodes.find(n => n.id === `n${N}.${i - 1}`), b = S.K.nodes.find(n => n.id === `n${N}.${i}`); const pa = ap(L[a.id], a.p), pb = ap(L[b.id], b.p); gap = Math.max(gap, Math.abs(Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]) - 6.2)); }
  ok(gap < 0.8, `strike: the neck's segments keep their spacing (off by ${gap.toFixed(2)})`); }

/* a sheet's creature actor */
{ const sheet = { format: 'odyssey-choreo/1', step: 'twos', creatures: C.fragment('argos', 'dog', { scale: 1.3, procs: [{ type: 'preset', name: 'lie' }], layer: 'add', channels: { 'head.pitch': [[0, 0], [2, 0.5]] }, riders: [] }) };
  const a = C.sample(sheet, 'argos', 1.04), b = C.sample(sheet, 'argos', 1.0); ok(JSON.stringify(a.v) === JSON.stringify(b.v), 'sample: on twos (1.04 s draws the 1.0 s drawing)');
  ok(near(a.v['body.dy'], -24) && near(a.v['head.pitch'], -0.35 + 0.25, 1e-6), 'sample: keys laid over the preset (add layer)');
  const s2 = { creatures: C.fragment('lead', 'ram', { scale: 2.4, procs: [{ type: 'gait', path: [[0, 0, 0], [4, 0, 100]], gait: 'walk' }], riders: [{ actor: 'odysseus', at: 'belly', from: 0, to: 9 }] }) };
  const r = C.sample(s2, 'lead', 2); ok(r.riders.length === 1 && r.riders[0].m.every(isFinite), 'sample: a rider on the belly anchor');
  ok(near(Math.hypot(r.riders[0].m[3], r.riders[0].m[6], r.riders[0].m[9]), 1, 1e-6), 'sample: a rider\'s frame is at world scale'); }

/* three.js: attach and apply put every node where pose() says (when three is to hand: NODE_PATH with three@0.128) */
{ let THREE = null; try { THREE = require('three'); } catch (e) { console.log('(three not found: the attach check skipped)'); }
  if (THREE) { const rig = C.define('ram', { scale: 2 }), g = new THREE.Group(); rig.attach(THREE, g, () => new THREE.Group());
    const v = C.gait(rig, 2.3, { path: [[0, 0, 0], [4, 0, 100]], gait: 'walk' }); rig.apply(v); g.updateMatrixWorld(true); let err = 0;
    for (const n of rig.nodes) { const p = new THREE.Vector3(...n.p).applyMatrix4(rig.three.objs[n.id].matrixWorld), q = ap(rig.pose(v).nodes[n.id], n.p); err = Math.max(err, Math.hypot(p.x - q[0], p.y - q[1], p.z - q[2])); }
    ok(err < 1e-6, `attach: three's nodes where pose() puts them (${err.toExponential(1)})`);
    const P = C.define('polyphemus'); P.attach(THREE, new THREE.Group(), () => new THREE.Group()); P.apply(Object.assign(P.rest(), { eye: 2 }));
    ok(P.three.objs.eye.userData.swap.map(o => o.visible).join() === 'false,false,true,false', 'attach: the replacement eye swapped'); } }

console.log(`${passes} passed, ${fails} failed`);
for (const [k, s] of Object.entries(summary)) console.log(`  ${k}: slide ${s.slide.toFixed(3)} LDU/frame${s.below != null ? ', below ground ' + s.below.toFixed(2) : ''}`);
process.exit(fails ? 1 : 0);
