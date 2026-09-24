#!/usr/bin/env node
/* tools/forage/keyprops.js — the props a keyframe stages beyond the forage's set: assemblies of real parts in LDraw coordinates, each
   with named anchors (the eye, a stake's tip) that a still aims at. Written to odyssey/keyframes/props.json for the keyframe gate.
     polyphemus   the one-eyed troll without its club (asleep, then rising): anchors eye, brow, chest, handR, handL
     stake        the olive beam "as large as the mast of a twenty-oared merchant vessel": the boat mast part, its sharpened end a
                  cone turned point-down in trans orange (fire-hardened, glowing): anchors tip, end, mid
     bowl, wine   the ivy-wood bowl (an inverted 2 x 2 dish) and wine pooled from it (round plates in trans red)
     blood, steam the eye's blood (trans red cones and round bricks) and the hiss of it (trans clear, rising)
     perch        a boulder to stand on */
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./ldraw.js'), B = require('./build.js'), Cy = require('./cyclops.js');
const RX = a => [0, 0, 0, 1, 0, 0, 0, Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a)];
const row = (part, color, m) => ({ part: part + '.dat', color, m: m.map(v => +(+v).toFixed(4)) });
const props = {};
/* the giant in a pose: each arm (and its hand) turned about its shoulder, the arm part's own origin */
const RZ = a => [0, 0, 0, Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a), 0, 0, 0, 1];
function giant(armL, armR) {
  const body = Cy.troll({}), rows = B.rowsOf(body).map(r => ({ ...r })), head = rows.find(r => r.part === '60635').m;
  for (const [arm, hand, R] of [['60672', '60640', armL], ['60673', '60641', armR]]) {
    const a = rows.find(r => r.part === arm), h = rows.find(r => r.part === hand), piv = a.m.slice(0, 3), about = m => L.mul(L.mul(L.T(...piv), R), L.mul(L.T(-piv[0], -piv[1], -piv[2]), m));
    a.m = about(a.m); h.m = about(h.m);
  }
  return { rows, head };
}
for (const [name, armL, armR] of [['polyphemus', L.I12, L.I12], ['polyphemusSprawl', RZ(1.25), RZ(-1.25)], ['polyphemusRoar', L.mul(RX(-2.7), RZ(0.35)), L.mul(RX(-2.5), RZ(-0.35))]]) {
  const { rows, head } = giant(armL, armR);
  const eyeM = L.mul(L.mul(head, L.T(0, 20, -66)), [0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 1, 0]), pupM = L.mul(L.mul(head, L.T(0, 20, -74)), [0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 1, 0]);
  const parts = [...rows.map(r => row(r.part, r.col, r.m)), row('14769', 15, eyeM), row('98138', 0, pupM)];
  const at = (m, v) => L.apply ? L.apply(m, v) : [m[0] + m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[1] + m[6] * v[0] + m[7] * v[1] + m[8] * v[2], m[2] + m[9] * v[0] + m[10] * v[1] + m[11] * v[2]];
  const hr = rows.find(r => r.part === '60641').m, hl = rows.find(r => r.part === '60640').m;
  props[name] = { parts, anchors: { eye: pupM.slice(0, 3).map((v, i) => i === 2 ? v - 4 : v), brow: [head[0], head[1] + 2, head[2] - 60], chest: [head[0], head[1] + 60, head[2] - 50], belly: [head[0], head[1] + 120, head[2] - 45], handR: hr.slice(0, 3), handL: hl.slice(0, 3) } };
}
props.stake = { parts: [row('2537', 70, L.I12), row('4589', 57, L.mul(L.T(0, 342 + 24, 0), RX(Math.PI)))], anchors: { end: [0, 0, 0], mid: [0, 171, 0], tip: [0, 366, 0], g1: [0, 290, 0], g2: [0, 225, 0], g3: [0, 160, 0], g4: [0, 95, 0], g5: [0, 30, 0] } };
props.stakeCold = { parts: [row('2537', 70, L.I12), row('4589', 70, L.mul(L.T(0, 342 + 24, 0), RX(Math.PI)))], anchors: { end: [0, 0, 0], mid: [0, 171, 0], tip: [0, 366, 0], g1: [0, 290, 0], g2: [0, 225, 0], g3: [0, 160, 0], g4: [0, 95, 0], g5: [0, 30, 0] } };
props.stakeBloody = { parts: [row('2537', 70, L.I12), row('4589', 36, L.mul(L.T(0, 342 + 24, 0), RX(Math.PI))), row('3062b', 36, L.T(0, 318, 0))], anchors: { end: [0, 0, 0], mid: [0, 171, 0], tip: [0, 366, 0], g1: [0, 290, 0], g2: [0, 225, 0], g3: [0, 160, 0], g4: [0, 95, 0], g5: [0, 30, 0] } };
props.bowl = { parts: [row('4740', 70, L.I12)], anchors: { rim: [0, -8, 0] } };
props.wine = { parts: [[0, 0], [22, 8], [-14, 18], [36, 26], [8, 34]].map(([x, z], i) => row(i % 2 ? '4073' : '6141', 36, L.T(x, 0, z))), anchors: { centre: [10, 0, 16] } };
props.blood = { parts: [row('4589', 36, L.T(0, 0, 0)), row('4589', 36, L.mul(L.T(14, 6, 6), RX(0.6))), row('4589', 36, L.mul(L.T(-12, 8, -4), RX(-0.7))), row('3062b', 36, L.T(4, 16, 10)), row('6141', 36, L.T(-18, 22, 8))], anchors: { centre: [0, 8, 0] } };
props.steam = { parts: [row('3062b', 47, L.T(0, 0, 0)), row('3062b', 47, L.T(6, -24, 4)), row('3062b', 47, L.T(-4, -48, 8)), row('4589', 47, L.T(2, -72, 10)), row('4589', 15, L.T(10, -18, -8))], anchors: { base: [0, 24, 0] } };
props.perch = { parts: [row('53934p01c01', 72, L.I12)], anchors: { top: [0, -4, 0] } };
const out = path.join(L.ROOT, 'odyssey/keyframes/props.json');
fs.writeFileSync(out, JSON.stringify(props));
console.log('props:', Object.entries(props).map(([k, p]) => `${k} (${p.parts.length} parts)`).join(', '), '->', path.relative(L.ROOT, out));
