/* play/odyssey-game/synth-hand.js — synthetic hands: 21 MediaPipe landmarks per hand, posed and placed, fed to Hand Butter.

   A hand is built in its own frame (palm length 1, wrist at the origin, fingers up), from the joint layout of the MediaPipe
   hand model (0 wrist; 1-4 thumb; 5-8 index; 9-12 middle; 13-16 ring; 17-20 pinky), then scaled and placed in the camera
   image's normalised coordinates (x right, y down), where the tracker's landmarks live. Hand Butter mirrors the image onto the
   stage (imagePoint: x .85→.08, .15→.92; y .12→.08, .88→.92), so a hand placed at a stage point lands its index tip there.
   The poses are the ones Hand Butter's own classifier (gestureOf, pinchRatio) reads: open, point, pinch (thumb and index tips
   touching, the other three fingers up — a pinch with a curled hand reads as a fist, as it does for a real hand), fist, V.
   `scale` is the palm length in image heights: a hand pushed toward the camera grows (the thrust).
   OdysseySynth.play(keys) feeds a key-framed performance to WagWorkshop.processHands every ~33 ms of real time, the tracker's rate.
   Used by the tests; also by the attract demo on the voyage chart. */
(function () {
'use strict';
const ASPECT = 4 / 3;                               // Butter's metric() uses videoWidth/videoHeight, 4:3 when no video runs
const MCP = { 5: [-0.32, 0.92], 9: [-0.08, 1.0], 13: [0.15, 0.95], 17: [0.36, 0.84] };
const DIR = { 5: [-0.12, 1], 9: [0, 1], 13: [0.1, 1], 17: [0.2, 1] };
const LEN = { 5: [0.42, 0.26, 0.22], 9: [0.46, 0.28, 0.22], 13: [0.42, 0.26, 0.2], 17: [0.33, 0.2, 0.18] };
const norm = ([x, y]) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
function finger(base, up) {                          // [mcp, pip, dip, tip] in the hand frame
  const m = MCP[base], d = norm(DIR[base]), L = LEN[base];
  if (up) { const p = add(m, d, L[0]), q = add(p, d, L[1]); return [m, p, q, add(q, d, L[2])]; }
  const p = add(m, d, 0.3), q = add(p, [0, -0.06]); return [m, p, add(q, [0.02, -0.02]), add(m, [0.02, 0.06])];   // curled into the palm
}
const THUMB = { out: [[-0.22, 0.18], [-0.42, 0.38], [-0.62, 0.56], [-0.8, 0.72]], tuck: [[-0.22, 0.18], [-0.36, 0.34], [-0.3, 0.47], [-0.12, 0.62]],
  pinch: [[-0.22, 0.18], [-0.42, 0.38], [-0.58, 0.72], [-0.62, 1.08]] };
const POSES = {
  open: { thumb: 'out', up: [1, 1, 1, 1] }, point: { thumb: 'tuck', up: [1, 0, 0, 0] }, V: { thumb: 'tuck', up: [1, 1, 0, 0] },
  fist: { thumb: 'tuck', up: [0, 0, 0, 0] }, pinch: { thumb: 'pinch', up: [0, 1, 1, 1], pinchIndex: true },
};
/** The 21 landmarks of a hand in its own frame. */
function local(pose) {
  const P = POSES[pose] || POSES.open, pts = new Array(21);
  pts[0] = [0, 0]; THUMB[P.thumb].forEach((p, i) => pts[1 + i] = p);
  [5, 9, 13, 17].forEach((b, i) => finger(b, !!P.up[i]).forEach((p, j) => pts[b + j] = p));
  if (P.pinchIndex) { pts[6] = [-0.44, 1.27]; pts[7] = [-0.55, 1.3]; pts[8] = [-0.6, 1.12]; }   // the index bent onto the thumb's tip
  return pts;
}
/** stage point (0..1, as Butter's cursors) -> camera image point (the inverse of Butter's imagePoint) */
function toImage(sx, sy) { return { x: 0.85 - (sx - 0.08) / 0.84 * 0.70, y: 0.12 + (sy - 0.08) / 0.84 * 0.76 }; }
function toStage(m) { return { x: .08 + .84 * ((.85 - m.x) / .70), y: .08 + .84 * ((m.y - .12) / .76) }; }
/** A posed hand: { pose, x, y (stage 0..1, where the anchor lands), scale (palm length, image heights), rot (radians), anchor: 'tip'|'palm' } */
function hand(o = {}) {
  const pose = o.pose || 'open', s = o.scale || 0.14, rot = o.rot || 0, pts = local(pose), c = Math.cos(rot), sn = Math.sin(rot);
  const anchorIdx = (o.anchor || (pose === 'point' ? 'tip' : 'palm')) === 'tip' ? [8] : [0, 5, 9, 17];
  const img = toImage(o.x == null ? 0.5 : o.x, o.y == null ? 0.5 : o.y);
  // hand frame -> image: x mirrored (the stage mirrors the image back), y flipped (image y runs down), x in width units
  const place = ([u, v]) => { const ru = u * c - v * sn, rv = u * sn + v * c; return [-ru * s / ASPECT, -rv * s]; };
  const placed = pts.map(place), ax = anchorIdx.reduce((a, i) => a + placed[i][0], 0) / anchorIdx.length, ay = anchorIdx.reduce((a, i) => a + placed[i][1], 0) / anchorIdx.length;
  return placed.map(([x, y], i) => ({ x: img.x + x - ax, y: img.y + y - ay, z: o.z || 0 }));
}
const lerp = (a, b, u) => a + (b - a) * u;
/** A key-framed performance: keys [{t (s), hands: [{pose,x,y,scale,rot}, …]}]; positions ease between keys, the pose of a
    hand is the pose of the last key passed. Feeds Hand Butter's processHands every `every` ms; resolves when the last key is passed. */
function play(keys, { every = 33, feed } = {}) {
  const send = feed || ((marks, now) => window.WagWorkshop.processHands(marks, now));
  const t0 = performance.now(), end = keys[keys.length - 1].t;
  return new Promise(resolve => {
    const tick = () => {
      const t = (performance.now() - t0) / 1000; let i = 0; while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
      const a = keys[i], b = keys[Math.min(keys.length - 1, i + 1)], u = b.t > a.t ? Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))) : 1;
      const marks = (a.hands || []).map((h, k) => { const g = (b.hands || [])[k] || h; return hand({ ...h, x: lerp(h.x ?? .5, g.x ?? .5, u), y: lerp(h.y ?? .5, g.y ?? .5, u), scale: lerp(h.scale || .14, g.scale || .14, u), rot: lerp(h.rot || 0, g.rot || 0, u) }); });
      try { send(marks, performance.now()); } catch (e) { console.error('[synth-hand]', e); }
      if (t >= end) resolve(t); else setTimeout(tick, every);
    };
    tick();
  });
}
/** One hand held in one pose for `sec` seconds (a convenience for key lists). */
const hold = (t, sec, h) => [{ t, hands: [h] }, { t: t + sec, hands: [h] }];
window.OdysseySynth = { hand, local, play, hold, toImage, toStage, POSES };
})();
