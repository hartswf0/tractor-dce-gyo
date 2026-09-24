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
/* the stake's point: a 2 x 2 cone the full width of the beam, turned point-down past the beam's end (glowing; cold; bloodied) */
/* the olive beam: a trunk of fourteen 2 x 2 round bricks (as sets build a trunk or a club), its point a 2 x 2 cone turned point-down */
const stake = (tipCol, extra = []) => ({ parts: [...Array.from({ length: 14 }, (_, i) => row('3941', i % 5 === 2 ? 308 : 70, L.T(0, i * 24, 0))), row('3942', tipCol, L.mul(L.T(0, 336 + 48, 0), RX(Math.PI))), ...extra], anchors: { end: [0, 0, 0], mid: [0, 168, 0], tip: [0, 382, 0], g1: [0, 290, 0], g2: [0, 225, 0], g3: [0, 160, 0], g4: [0, 95, 0], g5: [0, 30, 0] } });
props.stake = stake(57);
props.stakeCold = stake(70);
props.stakeBloody = stake(36, [row('3062b', 36, L.T(0, 318, 0))]);
props.bowl = { parts: [row('4740', 70, L.I12)], anchors: { rim: [0, -8, 0] } };
props.wine = { parts: [[0, 0], [22, 8], [-14, 18], [36, 26], [8, 34]].map(([x, z], i) => row(i % 2 ? '4073' : '6141', 36, L.T(x, 0, z))), anchors: { centre: [10, 0, 16] } };
props.blood = { parts: [row('4589', 36, L.T(0, 0, 0)), row('4589', 36, L.mul(L.T(14, 6, 6), RX(0.6))), row('4589', 36, L.mul(L.T(-12, 8, -4), RX(-0.7))), row('3062b', 36, L.T(4, 16, 10)), row('6141', 36, L.T(-18, 22, 8))], anchors: { centre: [0, 8, 0] } };
props.steam = { parts: [row('3062b', 47, L.T(0, 0, 0)), row('3062b', 47, L.T(6, -24, 4)), row('3062b', 47, L.T(-4, -48, 8)), row('4589', 47, L.T(2, -72, 10)), row('4589', 15, L.T(10, -18, -8))], anchors: { base: [0, 24, 0] } };
props.ember = { parts: [row('3062b', 57, L.T(0, 0, 0)), row('4589', 46, L.T(6, -22, 4)), row('4589', 57, L.T(-6, -18, -4)), row('3024', 46, L.T(0, 8, 10)), row('4589', 46, L.mul(L.T(10, 4, -8), RX(0.8)))], anchors: { heart: [0, -8, 0] } };
props.ram = { parts: [row('95341', 15, L.I12)], anchors: { back: [0, -30, 0] } };
props.boulder = { parts: [row('53934p01c01', 71, L.I12), row('53934p01c01', 71, L.T(50, 0, 20)), row('42291', 71, L.T(20, -72, 10)), row('42284', 71, L.T(20, -104, 10))], anchors: { top: [20, -110, 10] } };
props.perch = { parts: [row('53934p01c01', 72, L.I12)], anchors: { top: [0, -4, 0] } };
/* Circe's hall (Homer X): the men as swine, the beasts she tamed, the acorns she threw them */
const RY = a => [0, 0, 0, Math.cos(a), 0, Math.sin(a), 0, 1, 0, -Math.sin(a), 0, Math.cos(a)];
props.pig = { parts: [row('87621p01', 29, L.I12)], anchors: { back: [0, -20, 0], snout: [0, -12, -30] } };
props.pigMask = { parts: [row('17351p01', 29, L.I12)], anchors: {} };
props.wolf = { parts: [row('48812', 72, L.I12)], anchors: { back: [0, -30, 0] } };
props.wolfGrey = { parts: [row('48812', 71, L.I12)], anchors: { back: [0, -30, 0] } };
props.lion = { parts: [row('14734', 191, L.I12)], anchors: { back: [0, -24, 0] } };
props.acorns = { parts: [[0, 0, 0], [9, -14, 5], [-8, -26, -3], [4, -40, 8], [-5, -52, 2], [12, -6, -9]].map(([x, y, z], i) => row('98138p86', 19, L.mul(L.T(x, y, z), L.mul(RX(0.5 + i * 0.9), RY(i * 1.3))))), anchors: { base: [0, 0, 0] } };
props.acornPile = { parts: [[0, 0], [10, 3], [-9, 5], [4, -8], [-4, 10], [14, -6], [-13, -4]].map(([x, z], i) => row('98138p86', 19, L.mul(L.T(x, 0, z), RY(i)))), anchors: { centre: [0, 0, 0] } };
props.basket = { parts: [row('4523', 70, L.I12), row('98138p86', 19, L.T(-3, -2, 0)), row('98138p86', 19, L.T(4, -3, 2))], anchors: { rim: [0, -4, 0] } };
props.cup = { parts: [row('2343', 297, L.I12)], anchors: { rim: [0, -12, 0] } };
/* Scylla (Homer XII: "twelve feet all dangling; six necks of prodigious length; and at the end of each neck a frightful head with three rows
   of teeth"): six necks out of her cavern, each a ribbed hose laid segment by segment (6.25 LDU apart, as the hose part lays them) along a
   curve, each ending in a dragon's head turned along the neck. Built in the strait's own frame: CAVE is the cavern mouth in Film Butter
   units and SC the set's scale, so a pose names the six jaws' points in the world (the men they seize). */
const CAVE = [178, 150, -133], SC = 0.702;
const toLocal = w => [(w[0] - CAVE[0]) / SC, -(w[1] - CAVE[1]) / SC, -(w[2] - CAVE[2]) / SC];
const v3 = { add: (a, b) => a.map((x, i) => x + b[i]), sub: (a, b) => a.map((x, i) => x - b[i]), mul: (a, k) => a.map(x => x * k), len: a => Math.hypot(...a), norm: a => { const l = Math.hypot(...a) || 1; return a.map(x => x / l); },
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]] };
/* a rotation whose columns are the images of the part's x, y and z */
const cols = (x, y, z) => [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
function scylla(pose) {
  const parts = [], anchors = {}, col = 288;
  pose.forEach(([Tw, fl], i) => {
    const T = toLocal(Tw), f = v3.norm(fl), H = v3.sub(T, v3.mul(f, 34)), E = v3.sub(H, v3.mul(f, 4));
    const S = [30, -10 + (i % 3) * 30, -60 + i * 24], P1 = v3.add(S, [-170, -150 + (i % 2) * 60, (E[2] - S[2]) * 0.25]), P2 = v3.sub(E, v3.mul(f, 170));
    const bez = t => { const u = 1 - t; return [0, 1, 2].map(k => u * u * u * S[k] + 3 * u * u * t * P1[k] + 3 * u * t * t * P2[k] + t * t * t * E[k]); };
    const pts = []; for (let k = 0; k <= 400; k++) pts.push(bez(k / 400));
    let acc = 0, next = 0;
    for (let k = 1; k < pts.length; k++) { const d = v3.len(v3.sub(pts[k], pts[k - 1])); acc += d;
      while (acc >= next) { const t = v3.norm(v3.sub(pts[k], pts[k - 1])), u = v3.norm(v3.cross(t, Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0])), z = v3.cross(u, t);
        parts.push(row('71944k02', col, [...pts[k], ...cols(u, t, z)])); next += 6.25; } }
    /* the head: its snout (the part's -z) along f, the top of its head (the part's -y) turned up */
    const up = v3.norm(v3.sub([0, -1, 0], v3.mul(f, -f[1]))), zi = v3.mul(f, -1), yi = v3.mul(up, -1), xi = v3.cross(yi, zi);
    parts.push(row('6027', col, [...H, ...cols(xi, yi, zi)]));
    anchors['jaw' + (i + 1)] = T; anchors['head' + (i + 1)] = H;
  });
  anchors.cave = [0, 0, 0];
  return { parts, anchors };
}
/* the strike: the six heads come down over the gunwale on the six men ("pounced down suddenly upon us") */
const STRIKE = [[[62, 112, -118], [-0.35, 0.9, 0.1]], [[40, 110, -78], [-0.5, 0.8, -0.1]], [[66, 114, -38], [-0.3, 0.9, 0.2]], [[42, 110, 2], [-0.5, 0.8, 0]], [[64, 112, 42], [-0.35, 0.9, -0.2]], [[44, 110, 82], [-0.45, 0.85, -0.25]]];
/* the lift: "their hands and feet ever so high above me, struggling in the air as Scylla was carrying them off" */
const LIFT = [[[118, 330, -250], [0.1, 0.9, 0.2]], [[92, 300, -190], [-0.2, 0.9, 0.1]], [[128, 360, -130], [0, 1, 0]], [[84, 280, -70], [-0.3, 0.85, -0.1]], [[120, 320, -10], [0.1, 0.9, -0.2]], [[98, 250, 40], [-0.2, 0.9, -0.3]]];
props.scyllaStrike = scylla(STRIKE);
props.scyllaLift = scylla(LIFT);
/* Charybdis spouting: "as she vomited it up, it was like the water in a caldron when it is boiling over... the spray reached the top of the rocks" */
props.spout = (() => { const parts = [];
  /* the column: 2 x 2 round bricks, clear and white, wandering as it rises and thinning; a crown of cones thrown out at its head; a skirt of foam */
  for (let i = 0; i < 18; i++) { const w = 1 - i / 24, a = i * 0.7, r = 8 * Math.sin(i * 0.5); parts.push(row('3941', i % 3 === 1 ? 15 : 47, L.T(r * Math.cos(a), -i * 24, r * Math.sin(a))));
    for (let k = 0; k < 3; k++) { const b = a + k * 2.1, rr = 30 * w + (k % 2) * 8; parts.push(row(k % 2 ? '3062b' : '4589', (i + k) % 3 ? 47 : 15, L.T(rr * Math.cos(b), -i * 24 - 10 * k, rr * Math.sin(b)))); } }
  for (let k = 0; k < 16; k++) { const b = k * 0.4, rr = 30 + (k % 4) * 14; parts.push(row('4589', k % 2 ? 15 : 47, L.mul(L.T(rr * Math.cos(b), -400 - (k % 5) * 18 + rr * 0.6, rr * Math.sin(b)), RX(Math.PI - 0.5 - (k % 3) * 0.3)))); }
  for (let k = 0; k < 20; k++) { const b = k * 0.31, rr = 44 + (k % 3) * 16; parts.push(row(k % 2 ? '6141' : '3062b', k % 3 ? 15 : 47, L.T(rr * Math.cos(b), (k % 2) * -12, rr * Math.sin(b)))); }
  return { parts, anchors: { crest: [0, -440, 0], base: [0, 0, 0] } }; })();
const out = path.join(L.ROOT, 'odyssey/keyframes/props.json');
fs.writeFileSync(out, JSON.stringify(props));
console.log('props:', Object.entries(props).map(([k, p]) => `${k} (${p.parts.length} parts)`).join(', '), '->', path.relative(L.ROOT, out));
