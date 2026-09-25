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
/* Argos (Homer XVII): the old hound, a German shepherd in dark brown, standing (his head up) or laid on his side (dead) */
props.argos = { parts: [row('92586', 308, L.I12)], anchors: { head: [0, -20, -40], back: [0, -24, 0] } };
/* the bow (Homer XXI): twelve axes set in a trench in a straight line, each a twin-bladed axe head (the hole through it along the line)
   on an upright handle; the arrow, a bar with white fletching, to be aimed through the holes */
props.axes = { parts: Array.from({ length: 12 }, (_, i) => [row('3062b', 70, L.T(0, -24, i * 34)), row('3062b', 70, L.T(0, -48, i * 34)), row('11096', 71, L.T(0, -62, i * 34))]).flat(),
  anchors: { first: [0, -62, 0], last: [0, -62, 11 * 34], mid: [0, -62, 5.5 * 34], base: [0, 0, 5.5 * 34] } };
props.arrow = { parts: [row('30374', 71, L.I12), row('64647', 15, L.mul(L.T(0, 78, 0), RX(Math.PI))), row('4589', 72, L.mul(L.T(0, -14, 0), RX(Math.PI)))], anchors: { tip: [0, -18, 0], tail: [0, 80, 0] } };
/* a flash of Zeus's thunder: trans clear and white cones in a jagged fall */
props.bolt = { parts: Array.from({ length: 10 }, (_, i) => row(i % 2 ? '4589' : '3062b', i % 3 ? 47 : 15, L.T((i % 2 ? 12 : -8) + i * 3, i * 24, (i % 3) * 6))), anchors: { top: [0, 0, 0] } };
/* Calypso's isle: a raft afloat (seven logs, a mast, a square sail of white bricks, the steering oar), a felled trunk */
props.raft = { parts: [...Array.from({ length: 7 }, (_, i) => row('30137', 70, L.mul(L.T((i - 3) * 20, 0, 0), L.RY(Math.PI / 2)))), row('3957a', 70, L.T(0, -8, 0)), row('3957a', 70, L.T(0, -96, 0)),
  ...[0, 1, 2].map(k => row('3009', 15, L.T(0, -120 - k * 24, -12))), row('2542', 70, L.mul(L.T(0, -10, 90), RX(0.5)))], anchors: { deck: [0, -8, 0], mast: [0, -190, 0], stern: [0, -8, 60] } };
props.trunk = { parts: Array.from({ length: 9 }, (_, i) => row('3941', i % 4 === 3 ? 308 : 70, L.T(0, i * 24, 0))), anchors: { butt: [0, 216, 0], mid: [0, 108, 0], crown: [0, 0, 0] } };
/* the cattle of the Sun (Homer XII: "broad-faced, horned"): the cow in white with its blaze, and in reddish brown */
props.cow = { parts: [row('64452p01', 15, L.I12)], anchors: { back: [0, -40, 0] } };
props.cowRed = { parts: [row('64452', 70, L.I12)], anchors: { back: [0, -40, 0] } };
/* Helios: the sun's disc, gold dish with a trans yellow face and a ring of trans orange rays */
props.sun = { parts: [row('3960', 297, L.mul(L.I12, RX(Math.PI / 2))), row('4150', 46, L.mul(L.T(0, 0, -16), RX(Math.PI / 2))), ...Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return row('4589', 57, L.mul(L.T(60 * Math.cos(a), 60 * Math.sin(a), 0), [0, 0, 0, -Math.sin(a), Math.cos(a), 0, Math.cos(a), Math.sin(a), 0, 0, 0, 1].map((v, j) => j < 3 ? v : v))); })], anchors: { face: [0, 0, -20] } };
/* the lotus: a flower in white on a green stem, as it is handed over */
props.lotus = { parts: [row('3742', 15, L.I12), row('3742', 13, L.T(0, -2, 0)), row('33291', 2, L.T(0, 6, 0))], anchors: { bloom: [0, -4, 0] } };
props.axe = { parts: [row('3835', 72, L.I12)], anchors: { grip: [0, 26, 0], head: [0, -22, -6] } };
/* the Underworld (Homer XI): the black ram; Tiresias's shade, a ghost shroud in trans clear with a white head and his golden staff */
props.ramBlack = { parts: [row('95341', 0, L.I12)], anchors: { back: [0, -30, 0] } };
props.tiresias = { parts: [row('2588', 47, L.T(0, -32, 0)), row('3626bp01', 15, L.T(0, -56, 0)), row('3957a', 297, L.T(-22, 8, -6)), row('4589', 297, L.mul(L.T(-22, -88, -6), RX(Math.PI)))], anchors: { head: [0, -66, 0] } };
props.shade = { parts: [row('2588', 47, L.T(0, -32, 0)), row('3626bp01', 15, L.T(0, -56, 0))], anchors: { head: [0, -66, 0] } };
/* the foot-bath (Homer XIX): a basin (the 4 x 4 dish turned up) of water; the spill when it tips */
props.basin = { parts: [row('3960', 179, L.mul(L.T(0, 0, 0), RX(Math.PI))), row('4150', 43, L.T(0, 6, 0))], anchors: { rim: [0, -12, 0] } };
props.spill = { parts: [[0, 0], [16, 6], [-12, 14], [26, 18], [6, 26], [-20, 4], [14, -10]].map(([x, z], i) => row(i % 2 ? '6141' : '4073', 43, L.T(x, 0, z))), anchors: { centre: [0, 0, 10] } };
/* Nausicaa (Homer VI): the leafy bough he held before him, the ball the maids threw */
props.branch = { parts: [row('2417', 2, L.mul(L.I12, RX(Math.PI / 2))), row('2423', 288, L.mul(L.T(0, -20, 4), RX(Math.PI / 2)))], anchors: { grip: [0, 0, 30] } };
props.ball = { parts: [row('3062b', 15, L.I12), row('4589', 4, L.T(0, -24, 0))], anchors: {} };
/* Ino's veil: a white flag held out */
props.veil = { parts: [row('2335', 15, L.I12), row('2335', 15, L.T(0, 0, 50))], anchors: { grip: [0, 0, 0] } };
/* the arrows poured before him on the threshold (Homer XXII), and one to aim */
props.arrows = { parts: Array.from({ length: 7 }, (_, i) => [row('30374', 71, L.mul(L.T(i * 7 - 21, -4, (i % 3) * 5), [0, 0, 0, Math.cos(0.1 * i), 0, Math.sin(0.1 * i), 0, 0, -1, -Math.sin(0.1 * i), 1, 0].map((v, j) => j < 3 ? v : v)))]).flat(), anchors: {} };
props.stool = { parts: [row('3941', 70, L.I12), row('4032a', 70, L.T(0, -8, 0))], anchors: { seat: [0, -8, 0] } };
/* the sea batch (Homer X, XII, XIII): the ox-hide bag of the winds tied with a silver cord; the winds bursting out; a whirlpool; the
   fig tree above Charybdis; keel and mast lashed together; the Laestrygonian giants (the troll big figure in three skins, one arm up
   with a boulder); the gift chest */
props.bag = { parts: [row('10169', 28, L.I12), row('3062b', 179, L.T(0, -28, 0))], anchors: { neck: [0, -30, 0] } };
props.winds = { parts: Array.from({ length: 24 }, (_, i) => { const a = i * 1.1, r = 16 + i * 5, y = -10 - i * 8; return row(i % 3 ? '4589' : '3062b', i % 4 ? 47 : 15, L.mul(L.T(r * Math.cos(a), y, r * Math.sin(a)), RX(1.2 + (i % 3) * 0.4))); }), anchors: { base: [0, 0, 0] } };
props.whirl = { parts: [row('3960', 33, [0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 0, -1]), row('4150', 0, L.T(0, -2, 0)), ...[26, 38, 50, 62].flatMap((r, k) => Array.from({ length: 8 + k * 4 }, (_, i) => { const a = k * 0.4 + i * 2 * Math.PI / (8 + k * 4); return row('6141', (i + k) % 2 ? 15 : 47, L.T(r * Math.cos(a), -4, r * Math.sin(a))); }))], anchors: { eye: [0, 0, 0] } };
props.figtree = { parts: [row('3470', 288, L.I12), ...[0, 1, 2].map(k => row('3941', 70, L.T(0, 8 + 24 * k, 0))), row('53934p01c01', 72, L.T(0, 80, 0))], anchors: { bough: [30, -80, 0], crown: [0, -130, 0] } };
props.keel = { parts: [...Array.from({ length: 8 }, (_, i) => row('3941', 0, L.mul(L.T(0, 0, (i - 3.5) * 24), RX(Math.PI / 2)))), ...Array.from({ length: 6 }, (_, i) => row('3941', 70, L.mul(L.T(20, -12, (i - 2.5) * 24), RX(Math.PI / 2)))), row('3062b', 15, L.T(10, -20, 0)), row('3062b', 15, L.T(10, -20, 30))], anchors: { top: [10, -30, 0] } };
props.chest = { parts: [row('4738a', 70, L.I12), row('4739a', 70, L.T(0, -24, 10)), row('3062b', 297, L.T(0, -32, 0)), row('3062b', 179, L.T(12, -32, 0))], anchors: { lid: [0, -30, 0] } };
function laestrygon(skin, armL, armR, rock) { const body = Cy.troll({ skin }), rows = B.rowsOf(body).map(r => ({ ...r }));
  for (const [arm, hand, R] of [['60672', '60640', armL], ['60673', '60641', armR]]) { const a = rows.find(r => r.part === arm), h = rows.find(r => r.part === hand), piv = a.m.slice(0, 3), about = m => L.mul(L.mul(L.T(...piv), R), L.mul(L.T(-piv[0], -piv[1], -piv[2]), m)); a.m = about(a.m); h.m = about(h.m); }
  const hr = rows.find(r => r.part === '60641').m, parts = rows.map(r => row(r.part, r.col, r.m));
  if (rock) parts.push(row('53934p01c01', 72, L.T(hr[0], hr[1] - 90, hr[2])));
  return { parts, anchors: { hand: hr.slice(0, 3), head: [0, -140, 0] } }; }
props.laestrygon = laestrygon(84, L.mul(RX(-0.4), RZ(0.3)), L.mul(RX(-2.9), RZ(-0.2)), true);
props.laestrygonDark = laestrygon(308, L.mul(RX(-2.6), RZ(0.3)), L.mul(RX(-0.6), RZ(-0.3)), false);
props.laestrygonGreen = laestrygon(378, L.mul(RX(-1.6), RZ(0.2)), L.mul(RX(-2.9), RZ(-0.2)), true);
/* the last arc: moly ("the root was black, while the flower was as white as milk"), Hermes's golden wand, Penelope's great loom with the
   shroud on it (and half unravelled), a torch, the spade, a bath for Laertes */
props.moly = { parts: [row('3742', 15, L.T(0, -30, 0)), row('3742', 15, L.T(0, -34, 0)), row('3957a', 0, L.T(0, 58, 0)), row('3062b', 0, L.T(0, 84, 0))], anchors: { grip: [0, 40, 0], bloom: [0, -32, 0] } };
const shroud = (rows) => ({ parts: [...[-240, -120, 0].flatMap(y => [row('2453b', 70, L.T(-70, y, 0)), row('2453b', 70, L.T(70, y, 0))]), row('3008', 70, L.T(0, -268, 0)), row('3008', 70, L.T(0, 96, 0)),
  ...Array.from({ length: rows }, (_, i) => row('3009', i % 3 === 1 ? 297 : 15, L.T(0, -216 + i * 24, 0))),
  ...Array.from({ length: 9 - rows }, (_, i) => [-40, -20, 0, 20, 40].map(x => row('3957a', 15, L.T(x, -216 + (rows + i) * 24 + 8, 0)))).flat()],
  anchors: { web: [0, -140, -10], foot: [0, 30, 0] } });
props.loomFull = shroud(9);
props.loomHalf = shroud(5);
props.torch = { parts: [row('3959', 70, L.I12), row('3062b', 57, L.T(0, -24, 0)), row('4589', 46, L.T(0, -44, 0))], anchors: { grip: [0, 10, 0], flame: [0, -40, 0] } };
props.spade = { parts: [row('3837', 72, L.I12)], anchors: { grip: [0, -20, 0] } };
props.goldWand = { parts: [row('3957a', 297, L.I12), row('3062b', 297, L.T(0, -96, 0))], anchors: { grip: [0, 0, 0] } };
/* the Wooden Horse (Homer IV, VIII): "the horse of wood, which Epeus made with Minerva's help": a brick build on a plank platform; four
   legs of 2 x 2 bricks, a hollow body of bricks on a floor plate, a neck stepping forward, a head with a sloped muzzle and cone ears, a
   tail; a gold hatch in the flank. horseOpen leaves the near flank off, a cutaway to see the men inside */
function horse(open) { const W = 28, M = 70, P = [];
  const RYq = L.RY(Math.PI / 2); P.push(row('3035', 70, L.mul(L.T(0, -8, -40), RYq)), row('3035', 70, L.mul(L.T(0, -8, 40), RYq)));
  for (const x of [-20, 20]) for (const z of [-70, 70]) for (let k = 0; k < 4; k++) P.push(row('3003', W, L.T(x, -32 - 24 * k, z)));
  P.push(row('3035', W, L.mul(L.T(0, -112, -20), RYq)), row('3032', W, L.mul(L.T(0, -112, 40), RYq)));
  for (let c = 0; c < 4; c++) { const y = -128 - 24 * c;
    for (const x of open ? [-30] : [-30, 30]) P.push(row('3009', W, L.mul(L.T(x, y, -40), L.RY(Math.PI / 2))), row('3010', W, L.mul(L.T(x, y, 60), L.RY(Math.PI / 2))));
    P.push(row('3004', W, L.T(0, y, -90)), row('3004', W, L.T(0, y, 90))); }
  if (open) for (let c = 0; c < 4; c++) P.push(row('3004', W, L.mul(L.T(30, -128 - 24 * c, -90), L.RY(Math.PI / 2))), row('3004', W, L.mul(L.T(30, -128 - 24 * c, 90), L.RY(Math.PI / 2))));
  P.push(row('3035', W, L.mul(L.T(0, -208, -20), RYq)), row('3032', W, L.mul(L.T(0, -208, 40), RYq)));
  for (let k = 0; k < 4; k++) P.push(row('3003', W, L.T(0, -232 - 24 * k, 80 + 10 * k)), row('3665', M, L.mul(L.T(0, -232 - 24 * k, 60 + 10 * k), L.RY(Math.PI))));
  P.push(row('3001', W, L.mul(L.T(0, -328, 130), L.RY(Math.PI / 2))), row('3040b', W, L.mul(L.T(0, -304, 180), L.RY(Math.PI))), row('4589', W, L.T(-10, -352, 115)), row('4589', W, L.T(10, -352, 115)),
    row('3070b', 0, L.mul(L.T(-20, -318, 150), [0, 0, 0, 0, 0, 1, 0, 1, 0, -1, 0, 0])), row('3070b', 0, L.mul(L.T(20, -318, 150), [0, 0, 0, 0, 0, -1, 0, 1, 0, 1, 0, 0])));
  for (let k = 0; k < 3; k++) P.push(row('3062b', M, L.T(0, -176 + 24 * k, -110 - 6 * k)));
  if (!open) P.push(row('3069b', 297, L.mul(L.T(40, -170, 0), [0, 0, 0, 0, -1, 0, 1, 0, 0, 0, 0, 1])));
  return { parts: P, anchors: { floor: [0, -112, 0], front: [0, -112, 60], back: [0, -112, -60], head: [0, -330, 150], hatch: [44, -170, 0] } }; }
props.horse = horse(false);
props.horseOpen = horse(true);
/* a seal (Homer IV: "the seals, the brood of the fair sea-nymph, come up from the grey sea"): two curved slopes back to back, a round head */
props.seal = { parts: [...[-10, 10].flatMap(x => [row('3666', 72, L.mul(L.T(x, 0, 0), L.RY(Math.PI / 2))), row('11477', 72, L.T(x, -4.5, -20)), row('11477', 72, L.mul(L.T(x, -4.5, 20), L.RY(Math.PI)))]),
  row('3062b', 72, L.T(0, -24, 44)), row('4073', 72, L.T(0, -32, 44)), row('54200', 72, L.mul(L.T(0, -20, 62), L.RY(Math.PI / 2))),
  row('3023', 71, L.mul(L.T(-30, 0, 26), L.RY(0.5))), row('3023', 71, L.mul(L.T(30, 0, 26), L.RY(-0.5))), row('3023', 71, L.T(0, 0, -66))], anchors: { back: [0, -24, 0] } };
props.sealGrey = { ...props.seal, parts: props.seal.parts.map(r => r.part === '11477.dat' || r.part === '3062b.dat' || r.part === '3666.dat' || r.part === '4073.dat' && r.m[5] === 0 ? { ...r, color: 71 } : r) };
props.snake = { parts: [row('30115', 2, L.I12)], anchors: {} };
props.dog = { parts: [row('92586', 308, L.I12)], anchors: {} };
props.dogBlack = { parts: [row('92586', 0, L.I12)], anchors: {} };
props.dogWhite = { parts: [row('92586', 15, L.I12)], anchors: {} };
props.staff = { parts: [row('3957a', 70, L.I12), row('3957a', 70, L.T(0, -88, 0))], anchors: { grip: [0, -60, 0] } };
props.stone = { parts: [row('3062b', 72, L.I12)], anchors: {} };
const out = path.join(L.ROOT, 'odyssey/keyframes/props.json');
fs.writeFileSync(out, JSON.stringify(props));
console.log('props:', Object.entries(props).map(([k, p]) => `${k} (${p.parts.length} parts)`).join(', '), '->', path.relative(L.ROOT, out));
