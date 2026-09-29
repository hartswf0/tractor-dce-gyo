/* film-readymades/motion.js — the Odyssey's motion machinery (window.OdysseyMotion), for the film (trailer and take modes of the
   Film Butter player) and the hand game. A classic script on the page's global THREE (r128); no imports, no page globals needed
   except where a host adapter says so (stage() takes what it needs in its ctx).

   Everything is brick terms, on twos (odyssey/cineosis/MOTION.md): a drawing is held for 1/12 s, whatever the render rate; sets
   and effects are instanced meshes whose matrices move; nothing is generated per frame. Every drawing is a pure function of the
   shot's clock u (seconds), so a frame rendered offline at u is the frame the player shows at u.

     1. POSE TRACKS   clips {fps:12, len, loop, keys:[{f, pose:{armRP..}, root:{..}, ease, smear}], holds, events, acc} sampled on
                      twos; poses in the gate's own terms (kfBlock: armRP/armLP/headP/torsoP/legRP/legLP radians, [x,y,z] or a number:
                      x for arms, legs and torso, y for the head); root offsets from the staged mark (pitch/roll/yaw radians, fwd/side
                      studs, dy plates, kneel 0..1, pivot heel|toe|knee); accessories named per clip (oar, bow and string, rock,
                      tears, cup and pour, shuttle, a weapon dropped).
     2. REPLACEMENTS  swaps of parts and colours on a rig at drawings: transform (Circe's swine; Athena's hair, torso, prop), glow (the
                      god among men: rim light and a warm grade on the figure alone, glints), sail (brick sail slack/half/full), flames.
     3. BRICK FIELDS  sea (tiles on a sum of travelling waves, calm/swell/storm, white crests, a hull that heaves and pitches), rain
                      (clear round plates in streaks, splashes), smoke (round bricks rising, drifting, thinning), whirlpool (rings on
                      radius-dependent speed, sinking), mist (translucent plates drifting), lightning (two-frame flash and a bolt of
                      clear plates), rocks (ballistic, spinning 30 degrees a drawing, a trail, a splash).
     4. OPTICS        overlay() paints a frame's flash, tint and the marked-past grade; composite() crossfades or double-exposes two
                      rendered frames (the exporters' transition pass); fade to and from black.
   See film-readymades/MOTION-LIBRARY.md. */
(function (root) {
'use strict';
const THREE = root.THREE;
const V3 = THREE.Vector3, Q = THREE.Quaternion, E = THREE.Euler, M4 = THREE.Matrix4, C = THREE.Color;
const JOINTS = ['armRP', 'armLP', 'headP', 'torsoP', 'legRP', 'legLP'];
const ROOTS = ['pitch', 'roll', 'yaw', 'fwd', 'side', 'dy', 'kneel'];
const cl01 = v => Math.max(0, Math.min(1, v)), sm = x => { x = cl01(x); return x * x * (3 - 2 * x); }, lerp = (a, b, u) => a + (b - a) * u;
const DEG = Math.PI / 180;
const v3 = a => (a && a.isVector3 ? a.clone() : Array.isArray(a) ? new V3(a[0], a[1], a[2]) : new V3());
function hash32(s) { s = String(s); let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
/* a stable random in [0,1) from integers: the same drawing every render */
function rnd(a, b = 0, c = 0) { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
const EASE = { linear: u => u, in: u => u * u, out: u => 1 - (1 - u) * (1 - u), inOut: sm, hold: u => (u >= 1 ? 1 : 0), snap: u => (u > 0 ? 1 : 0),
  /* overshoot: past the key and back, a spring's one wobble */ back: u => { const s = 1.6; u -= 1; return u * u * ((s + 1) * u + s) + 1; } };

/* ── the clock: drawings on twos ── */
/* the drawing a clock time falls in: 12 drawings a second (on twos at 24 fps), 24 on ones, 8 on threes */
function drawing(t, fps = 12) { return Math.floor(t * fps + 1e-6); }
function onTwos(t, fps = 12) { return drawing(t, fps) / fps; }

/* ═══════════════════════ 1. POSE TRACKS ═══════════════════════ */
const A = DEG;
/* a pose value in the gate's terms: a number is x for the arms, legs and torso, y (yaw) for the head */
function jv(k, v) { if (v == null) return null; if (Array.isArray(v)) return [v[0] || 0, v[1] || 0, v[2] || 0]; return k === 'headP' ? [0, v, 0] : [v, 0, 0]; }
const G = { /* shorthand poses */
  stand: { armRP: 0, armLP: 0, torsoP: 0, legRP: 0, legLP: 0 },
  guard: { armRP: -0.9, armLP: -0.6, torsoP: 0 },
};
/* The library. f in drawings (12 a second). ease names how a key is reached from the one before. */
const CLIPS = {
  /* rowing: catch, drive, finish, recovery; the torso leaning with the stroke; the oar pivots in its lock and follows the hands */
  row: { len: 14, loop: true, keys: [
    { f: 0, pose: { armRP: -1.65, armLP: -1.65, torsoP: 0.26 }, root: { dy: 0 }, ease: 'inOut' },
    { f: 4, pose: { armRP: -1.25, armLP: -1.25, torsoP: 0.02 }, ease: 'in' },
    { f: 7, pose: { armRP: -0.55, armLP: -0.55, torsoP: -0.24 }, ease: 'out' },
    { f: 11, pose: { armRP: -1.1, armLP: -1.1, torsoP: 0.08 }, ease: 'inOut' },
    { f: 14, pose: { armRP: -1.65, armLP: -1.65, torsoP: 0.26 }, ease: 'inOut' }],
    events: [{ f: 0, ev: 'catch' }], acc: { oar: {} } },
  'pull-oar-heavy': { len: 22, loop: true, keys: [
    { f: 0, pose: { armRP: -1.8, armLP: -1.8, torsoP: 0.34, headP: 0 }, ease: 'inOut' },
    { f: 7, pose: { armRP: -1.3, armLP: -1.3, torsoP: 0.08 }, ease: 'in' },
    { f: 12, pose: { armRP: -0.45, armLP: -0.45, torsoP: -0.32 }, ease: 'out' },
    { f: 14, pose: { armRP: -0.45, armLP: -0.45, torsoP: -0.32 }, ease: 'hold' },
    { f: 18, pose: { armRP: -1.2, armLP: -1.2, torsoP: 0.12 }, ease: 'inOut' },
    { f: 22, pose: { armRP: -1.8, armLP: -1.8, torsoP: 0.34 }, ease: 'inOut' }],
    events: [{ f: 0, ev: 'catch' }], acc: { oar: { heavy: true } } },
  /* single combat: anticipation held, a smear on the strike, a two-drawing impact, recoil, settle */
  strike: { len: 22, keys: [
    { f: 0, pose: { armRP: -0.9, armLP: -0.6, torsoP: 0, legRP: 0, legLP: 0 }, root: { fwd: 0 } },
    { f: 4, pose: { armRP: -2.95, armLP: -0.4, torsoP: -0.14, legRP: 0.25, legLP: -0.15 }, root: { fwd: -0.15 }, ease: 'out' },
    { f: 8, pose: { armRP: -2.95, armLP: -0.4, torsoP: -0.16, legRP: 0.25, legLP: -0.15 }, root: { fwd: -0.15 }, ease: 'hold' },
    { f: 10, pose: { armRP: -0.55, armLP: 0.2, torsoP: 0.22, legRP: -0.5, legLP: 0.35 }, root: { fwd: 0.45 }, ease: 'in', smear: true },
    { f: 12, pose: { armRP: -0.5, armLP: 0.2, torsoP: 0.24, legRP: -0.5, legLP: 0.35 }, root: { fwd: 0.45 }, ease: 'hold' },
    { f: 16, pose: { armRP: -1.15, armLP: -0.3, torsoP: 0.04, legRP: -0.2, legLP: 0.15 }, root: { fwd: 0.3 }, ease: 'out' },
    { f: 22, pose: { armRP: -0.9, armLP: -0.6, torsoP: 0, legRP: 0, legLP: 0 }, root: { fwd: 0.3 }, ease: 'inOut' }],
    events: [{ f: 10, ev: 'impact' }] },
  parry: { len: 18, keys: [
    { f: 0, pose: { armRP: -0.9, armLP: -0.6, torsoP: 0 }, root: { fwd: 0 } },
    { f: 3, pose: { armRP: -2.0, armLP: -1.5, torsoP: -0.1, legRP: -0.3, legLP: 0.2 }, root: { fwd: -0.1 }, ease: 'out' },
    { f: 6, pose: { armRP: -2.15, armLP: -1.6, torsoP: -0.2, legRP: -0.35, legLP: 0.3 }, root: { fwd: -0.45, yaw: -0.12 }, ease: 'in' },
    { f: 8, pose: { armRP: -2.15, armLP: -1.6, torsoP: -0.2, legRP: -0.35, legLP: 0.3 }, root: { fwd: -0.45, yaw: -0.12 }, ease: 'hold' },
    { f: 13, pose: { armRP: -1.2, armLP: -0.8, torsoP: -0.02, legRP: -0.1, legLP: 0.1 }, root: { fwd: -0.35, yaw: 0 }, ease: 'out' },
    { f: 18, pose: { armRP: -0.9, armLP: -0.6, torsoP: 0, legRP: 0, legLP: 0 }, root: { fwd: -0.35 }, ease: 'inOut' }],
    events: [{ f: 6, ev: 'impact' }] },
  'spear-thrust': { len: 20, keys: [
    { f: 0, pose: { armRP: -1.2, armLP: -1.0, torsoP: 0 }, root: { fwd: 0 } },
    { f: 4, pose: { armRP: 0.35, armLP: -0.9, torsoP: -0.14, legRP: 0.3, legLP: -0.2 }, root: { fwd: -0.3 }, ease: 'out' },
    { f: 7, pose: { armRP: 0.35, armLP: -0.9, torsoP: -0.16, legRP: 0.3, legLP: -0.2 }, root: { fwd: -0.3 }, ease: 'hold' },
    { f: 9, pose: { armRP: -1.6, armLP: -1.45, torsoP: 0.24, legRP: -0.55, legLP: 0.4 }, root: { fwd: 0.8 }, ease: 'in', smear: true },
    { f: 12, pose: { armRP: -1.6, armLP: -1.45, torsoP: 0.24, legRP: -0.55, legLP: 0.4 }, root: { fwd: 0.8 }, ease: 'hold' },
    { f: 20, pose: { armRP: -1.2, armLP: -1.0, torsoP: 0, legRP: 0, legLP: 0 }, root: { fwd: 0.35 }, ease: 'inOut' }],
    events: [{ f: 9, ev: 'impact' }] },
  /* archery: the bow arm up, the string drawn to the cheek, held, loosed; the string plucked on ones for six drawings */
  'draw-bow': { len: 30, keys: [
    { f: 0, pose: { armRP: -0.6, armLP: -0.7, headP: 0 }, root: { yaw: 0 } },
    { f: 5, pose: { armRP: -1.45, armLP: -1.57, headP: 0.35 }, root: { yaw: -0.35 }, ease: 'inOut' },
    { f: 12, pose: { armRP: -1.6, armLP: -1.57, headP: 0.5 }, root: { yaw: -0.45 }, ease: 'in' },
    { f: 20, pose: { armRP: -1.6, armLP: -1.57, headP: 0.5 }, root: { yaw: -0.45 }, ease: 'hold' },
    { f: 21, pose: { armRP: -1.2, armLP: -1.6, headP: 0.5 }, root: { yaw: -0.45 }, ease: 'snap' },
    { f: 30, pose: { armRP: -1.0, armLP: -1.5, headP: 0.4 }, root: { yaw: -0.45 }, ease: 'inOut' }],
    events: [{ f: 21, ev: 'release' }], acc: { bow: { draw: [[0, 0], [5, 0.2], [12, 1], [20, 1], [21, 0]], release: 21 } } },
  /* a stiff fall about the heel over four drawings, one bounce of a plate, settle; what he held comes loose */
  fall: { len: 14, keys: [
    { f: 0, pose: { armRP: -0.5, armLP: -0.5 }, root: { pitch: 0, dy: 0, pivot: 'heel' } },
    { f: 2, pose: { armRP: -2.4, armLP: -2.2, torsoP: -0.1 }, root: { pitch: -0.14 }, ease: 'out' },
    { f: 3, root: { pitch: -0.45 }, ease: 'in' },
    { f: 4, root: { pitch: -0.95 }, ease: 'in' },
    { f: 5, root: { pitch: -1.57, dy: 0 }, pose: { armRP: -2.9, armLP: -2.7 }, ease: 'in' },
    { f: 6, root: { pitch: -1.5, dy: 1 }, ease: 'out' },
    { f: 7, root: { pitch: -1.57, dy: 0 }, pose: { armRP: -2.6, armLP: -2.9, torsoP: 0 }, ease: 'in' },
    { f: 14, root: { pitch: -1.57, dy: 0 }, pose: { armRP: -2.7, armLP: -3.0 }, ease: 'hold' }],
    events: [{ f: 5, ev: 'impact' }], acc: { drop: { side: 'R', at: 5 } } },
  'fall-forward': { len: 14, keys: [
    { f: 0, pose: { armRP: -0.5, armLP: -0.5 }, root: { pitch: 0, dy: 0, pivot: 'toe' } },
    { f: 2, pose: { armRP: 0.4, armLP: 0.3, torsoP: 0.1 }, root: { pitch: 0.14 }, ease: 'out' },
    { f: 3, root: { pitch: 0.45 }, ease: 'in' },
    { f: 4, root: { pitch: 0.95 }, ease: 'in' },
    { f: 5, root: { pitch: 1.57, dy: 0 }, pose: { armRP: -2.9, armLP: -2.8 }, ease: 'in' },
    { f: 6, root: { pitch: 1.5, dy: 1 }, ease: 'out' },
    { f: 7, root: { pitch: 1.57, dy: 0 }, ease: 'in' },
    { f: 14, root: { pitch: 1.57 }, ease: 'hold' }],
    events: [{ f: 5, ev: 'impact' }], acc: { drop: { side: 'R', at: 5 } } },
  'die-on-knees': { len: 34, keys: [
    { f: 0, pose: { armRP: -0.4, armLP: -0.4, torsoP: 0 }, root: { kneel: 0, pitch: 0, pivot: 'knee' } },
    { f: 2, pose: { armRP: -1.5, armLP: -1.4, torsoP: -0.22 }, root: { fwd: -0.15 }, ease: 'out' },
    { f: 8, pose: { armRP: -1.5, armLP: -1.4, torsoP: -0.24 }, root: { fwd: -0.15 }, ease: 'hold' },
    { f: 11, pose: { armRP: -0.9, armLP: -0.8, torsoP: 0.14, legRP: 1.57, legLP: 1.57 }, root: { kneel: 1, fwd: -0.15 }, ease: 'in' },
    { f: 12, root: { kneel: 1, dy: 0.5 }, ease: 'out' },
    { f: 13, root: { kneel: 1, dy: 0 }, ease: 'in' },
    { f: 24, pose: { armRP: -0.5, armLP: -0.4, torsoP: 0.22 }, root: { kneel: 1 }, ease: 'inOut' },
    { f: 27, pose: { armRP: -2.6, armLP: -2.4, torsoP: 0 }, root: { kneel: 1, pitch: 0.9 }, ease: 'in' },
    { f: 29, pose: { armRP: -2.8, armLP: -2.6, legRP: 0, legLP: 0 }, root: { kneel: 0, pitch: 1.57, pivot: 'toe' }, ease: 'in' },
    { f: 30, root: { pitch: 1.52, dy: 0.5 }, ease: 'out' },
    { f: 31, root: { pitch: 1.57, dy: 0 }, ease: 'in' },
    { f: 34, root: { pitch: 1.57 }, ease: 'hold' }],
    events: [{ f: 11, ev: 'knees' }, { f: 29, ev: 'impact' }], acc: { drop: { side: 'R', at: 11 } } },
  /* recognition: the two turn to each other, close, the arms up to about sixty degrees, heads together, five degrees of lean;
     eased over eight drawings, then held (the LEGO Movie's sincerity: the joke stops and the hug is held) */
  embrace: { len: 10, relational: true, keys: [
    { f: 0, pose: {}, root: { approach: 0, face: 0, pitch: 0 } },
    { f: 2, pose: { armRP: -0.5, armLP: -0.5, legRP: -0.35, legLP: 0.3 }, root: { face: 1, approach: 0.25 }, ease: 'out' },
    { f: 4, pose: { legRP: 0.3, legLP: -0.35 }, root: { approach: 0.6 }, ease: 'linear' },
    { f: 6, pose: { armRP: [-0.9, 0, -0.18], armLP: [-0.9, 0, 0.18], legRP: -0.15, legLP: 0.1 }, root: { approach: 0.9 }, ease: 'linear' },
    { f: 8, pose: { armRP: [-1.05, 0, -0.22], armLP: [-1.05, 0, 0.22], headP: 0.28, legRP: 0, legLP: 0 }, root: { approach: 1, face: 1, pitch: 0.09 }, ease: 'inOut' },
    { f: 10, pose: { armRP: [-1.05, 0, -0.22], armLP: [-1.05, 0, 0.22], headP: 0.28 }, root: { approach: 1, face: 1, pitch: 0.09 }, ease: 'hold' }] },
  weep: { len: 16, loop: true, keys: [
    { f: 0, pose: { armRP: -2.15, armLP: -2.15, torsoP: 0.24, headP: 0 }, ease: 'inOut' },
    { f: 4, pose: { armRP: -2.2, armLP: -2.1, torsoP: 0.28 }, ease: 'inOut' },
    { f: 8, pose: { armRP: -2.15, armLP: -2.15, torsoP: 0.22 }, ease: 'inOut' },
    { f: 12, pose: { armRP: -2.1, armLP: -2.2, torsoP: 0.28 }, ease: 'inOut' },
    { f: 16, pose: { armRP: -2.15, armLP: -2.15, torsoP: 0.24 }, ease: 'inOut' }],
    intro: 6, acc: { tears: {} } },
  'kneel-supplicate': { len: 12, loop: true, intro: 6, keys: [
    { f: 0, pose: { armRP: -2.0, armLP: -2.0, torsoP: 0.12, legRP: 1.57, legLP: 1.57 }, root: { kneel: 1 }, ease: 'inOut' },
    { f: 6, pose: { armRP: -2.35, armLP: -2.35, torsoP: 0.02, legRP: 1.57, legLP: 1.57 }, root: { kneel: 1 }, ease: 'inOut' },
    { f: 12, pose: { armRP: -2.0, armLP: -2.0, torsoP: 0.12, legRP: 1.57, legLP: 1.57 }, root: { kneel: 1 }, ease: 'inOut' }] },
  'lift-and-throw': { len: 28, keys: [
    { f: 0, pose: { armRP: -0.3, armLP: -0.3, torsoP: 0 }, root: { dy: 0, fwd: 0 } },
    { f: 4, pose: { armRP: -0.7, armLP: -0.7, torsoP: 0.3, legRP: -0.25, legLP: -0.25 }, root: { dy: -0.5 }, ease: 'inOut' },
    { f: 10, pose: { armRP: -3.0, armLP: -3.0, torsoP: -0.16, legRP: 0.1, legLP: -0.1 }, root: { dy: 0 }, ease: 'inOut' },
    { f: 14, pose: { armRP: -3.05, armLP: -3.05, torsoP: -0.2 }, ease: 'hold' },
    { f: 16, pose: { armRP: -1.25, armLP: -1.25, torsoP: 0.26, legRP: -0.45, legLP: 0.35 }, root: { fwd: 0.4 }, ease: 'in', smear: true },
    { f: 18, pose: { armRP: -1.2, armLP: -1.2, torsoP: 0.26, legRP: -0.45, legLP: 0.35 }, root: { fwd: 0.4 }, ease: 'hold' },
    { f: 28, pose: { armRP: -0.5, armLP: -0.5, torsoP: 0, legRP: 0, legLP: 0 }, root: { fwd: 0.4 }, ease: 'inOut' }],
    events: [{ f: 16, ev: 'release' }], acc: { rock: { from: 4, release: 16 } } },
  swim: { len: 12, loop: true, keys: [
    { f: 0, pose: { armRP: -3.0, armLP: -0.2, legRP: -0.3, legLP: 0.3, headP: 0.3 }, root: { pitch: 1.45, dy: -1 }, ease: 'inOut' },
    { f: 3, pose: { armRP: -1.6, armLP: -1.2, legRP: 0.3, legLP: -0.3, headP: 0 }, ease: 'inOut' },
    { f: 6, pose: { armRP: -0.2, armLP: -3.0, legRP: -0.3, legLP: 0.3, headP: -0.3 }, ease: 'inOut' },
    { f: 9, pose: { armRP: -1.2, armLP: -1.6, legRP: 0.3, legLP: -0.3, headP: 0 }, ease: 'inOut' },
    { f: 12, pose: { armRP: -3.0, armLP: -0.2, legRP: -0.3, legLP: 0.3, headP: 0.3 }, ease: 'inOut' }],
    travel: 2.2 /* studs a second */ },
  climb: { len: 12, loop: true, keys: [
    { f: 0, pose: { armRP: -2.9, armLP: -1.7, legRP: -0.7, legLP: 0 }, ease: 'inOut' },
    { f: 6, pose: { armRP: -1.7, armLP: -2.9, legRP: 0, legLP: -0.7 }, ease: 'inOut' },
    { f: 12, pose: { armRP: -2.9, armLP: -1.7, legRP: -0.7, legLP: 0 }, ease: 'inOut' }],
    rise: 1.5 /* plates a cycle */ },
  walk: { procedural: 'walk' }, run: { procedural: 'run' }, carry: { procedural: 'carry', acc: { carried: {} } },
  weave: { len: 24, loop: true, keys: [
    { f: 0, pose: { armRP: -1.25, armLP: -1.45, headP: -0.25 }, root: { side: -0.6 }, ease: 'inOut' },
    { f: 10, pose: { armRP: -1.45, armLP: -1.25, headP: 0.25 }, root: { side: 0.6 }, ease: 'inOut' },
    { f: 12, pose: { armRP: -1.45, armLP: -1.25, headP: 0.25 }, root: { side: 0.6 }, ease: 'hold' },
    { f: 22, pose: { armRP: -1.25, armLP: -1.45, headP: -0.25 }, root: { side: -0.6 }, ease: 'inOut' },
    { f: 24, pose: { armRP: -1.25, armLP: -1.45, headP: -0.25 }, root: { side: -0.6 }, ease: 'hold' }],
    acc: { shuttle: {} } },
  'pour-libation': { len: 40, keys: [
    { f: 0, pose: { armRP: -0.6, armLP: -0.3, torsoP: 0 } },
    { f: 8, pose: { armRP: -1.75, armLP: -0.6, torsoP: -0.06 }, ease: 'inOut' },
    { f: 12, pose: { armRP: -1.75, armLP: -0.6 }, ease: 'hold' },
    { f: 16, pose: { armRP: -1.45, armLP: -0.6, torsoP: 0.12 }, ease: 'inOut' },
    { f: 32, pose: { armRP: -1.45, armLP: -0.6, torsoP: 0.14 }, ease: 'hold' },
    { f: 40, pose: { armRP: -0.7, armLP: -0.3, torsoP: 0 }, ease: 'inOut' }],
    acc: { cup: { tip: [[0, 0], [12, 0], [16, 1], [32, 1], [36, 0]], pour: [16, 34] } } },
  'sleep-breathe': { len: 48, loop: true, keys: [
    { f: 0, root: { dy: 0 }, ease: 'inOut' }, { f: 18, root: { dy: 0.5 }, ease: 'inOut' }, { f: 24, root: { dy: 0.5 }, ease: 'hold' },
    { f: 42, root: { dy: 0 }, ease: 'inOut' }, { f: 48, root: { dy: 0 }, ease: 'hold' }] },
  wake: { len: 28, keys: [
    { f: 0, pose: { armRP: -0.2, armLP: -0.2, legRP: 0, legLP: 0, headP: 0 }, root: { pitch: -1.57, pivot: 'heel' } },
    { f: 6, pose: { armRP: -0.2, armLP: -0.2 }, root: { pitch: -1.57 }, ease: 'hold' },
    { f: 9, pose: { armRP: 0.3, armLP: 0.3, legRP: -1.57, legLP: -1.57, headP: 0 }, root: { pitch: 0, sitGround: 1, pivot: 'heel' }, ease: 'inOut' },
    { f: 14, pose: { armRP: 0.3, armLP: 0.3, legRP: -1.57, legLP: -1.57, headP: 0.5 }, root: { sitGround: 1 }, ease: 'hold' },
    { f: 16, pose: { headP: -0.4 }, root: { sitGround: 1 }, ease: 'inOut' },
    { f: 22, pose: { armRP: -0.3, armLP: -0.3, legRP: 0, legLP: 0, headP: 0 }, root: { sitGround: 0 }, ease: 'inOut' },
    { f: 28, pose: { armRP: 0, armLP: 0 }, root: { sitGround: 0 }, ease: 'inOut' }] },
  'reel-back-in-fear': { len: 16, keys: [
    { f: 0, pose: { armRP: -0.3, armLP: -0.3, torsoP: 0, headP: 0 }, root: { fwd: 0 } },
    { f: 2, pose: { armRP: -0.6, armLP: -0.6, torsoP: 0.08 }, root: { fwd: 0.05 }, ease: 'out' },
    { f: 5, pose: { armRP: -2.2, armLP: -2.0, torsoP: -0.28, headP: 0.35, legRP: -0.45, legLP: 0.25 }, root: { fwd: -0.7 }, ease: 'out' },
    { f: 6, pose: { armRP: -2.25, armLP: -2.05, torsoP: -0.3 }, root: { fwd: -0.75, dy: 0.5 }, ease: 'out' },
    { f: 7, root: { dy: 0 }, ease: 'in' },
    { f: 10, pose: { armRP: -2.15, armLP: -1.95, torsoP: -0.26, legRP: -0.2, legLP: 0.1 }, root: { fwd: -0.8 }, ease: 'inOut' },
    { f: 12, pose: { armRP: -2.2, armLP: -2.0, torsoP: -0.28 }, root: { fwd: -0.8 }, ease: 'inOut' },
    { f: 14, pose: { armRP: -2.15, armLP: -1.95, torsoP: -0.26 }, root: { fwd: -0.8 }, ease: 'inOut' },
    { f: 16, pose: { armRP: -2.2, armLP: -2.0, torsoP: -0.28 }, root: { fwd: -0.8 }, ease: 'inOut' }] },
  point: { len: 8, keys: [
    { f: 0, pose: { armRP: -0.3 }, root: { face: 0 } },
    { f: 3, pose: { armRP: -1.8, headP: 0 }, root: { face: 1 }, ease: 'out' },
    { f: 5, pose: { armRP: -1.57 }, root: { face: 1 }, ease: 'inOut' },
    { f: 8, pose: { armRP: -1.57 }, root: { face: 1 }, ease: 'hold' }] },
  beckon: { len: 8, loop: true, intro: 4, keys: [
    { f: 0, pose: { armRP: -1.7, torsoP: -0.03 }, ease: 'inOut' },
    { f: 4, pose: { armRP: -2.45, torsoP: 0.02 }, ease: 'inOut' },
    { f: 8, pose: { armRP: -1.7, torsoP: -0.03 }, ease: 'inOut' }] },
  stagger: { len: 12, keys: [
    { f: 0, pose: {}, root: { fwd: 0, roll: 0 } },
    { f: 2, pose: { armRP: -1.0, armLP: -1.6, torsoP: -0.2 }, root: { fwd: -0.5, roll: 0.12 }, ease: 'out' },
    { f: 6, pose: { armRP: -0.6, armLP: -0.9, torsoP: -0.05 }, root: { fwd: -0.7, roll: -0.06 }, ease: 'inOut' },
    { f: 12, pose: { armRP: -0.5, armLP: -0.5, torsoP: 0 }, root: { fwd: -0.7, roll: 0 }, ease: 'inOut' }] },
};
/* walk, run, carry: take mode's cycle (legs +-0.62, arms -+0.45 on the stride's sine, a stride of 0.42 of the figure's height a
   half cycle) sampled on twos; the root travels `speed` studs a second along the heading, or to `to` [x,z] */
const GAITS = { walk: { leg: 0.62, arm: 0.45, lean: 0, speed: 5.5 }, run: { leg: 1.0, arm: 0.95, lean: 0.14, speed: 11 }, carry: { leg: 0.5, arm: 0, armHold: -1.2, lean: 0.05, speed: 4 } };
function gaitSample(kind, tc, P) {
  const g = GAITS[kind], H = P.H || 100, sp = (P.speed || g.speed), d = sp * tc, dist = P.dist != null ? Math.min(d, P.dist) : d, moving = P.dist == null || d < P.dist;
  const ph = dist * 20 / (0.42 * H) * Math.PI, amt = moving ? sm(cl01(tc * 4)) : 0, s = Math.sin(ph);
  const pose = { legRP: [g.leg * amt * s, 0, 0], legLP: [-g.leg * amt * s, 0, 0], torsoP: [g.lean * amt, 0, 0] };
  if (g.armHold != null) { pose.armRP = [g.armHold, 0, 0]; pose.armLP = [g.armHold, 0, 0]; }
  else { pose.armRP = [-g.arm * amt * s, 0, 0]; pose.armLP = [g.arm * amt * s, 0, 0]; }
  const bob = moving ? Math.abs(Math.cos(ph)) * 0.5 * amt : 0;   /* the waddle's rise: half a plate at the pass */
  return { pose, root: { fwd: dist, dy: kind === 'run' ? bob : bob * 0.6 }, events: [] };
}
/* a clip resolved against a figure's staged pose: every key carries every channel it or an earlier key names, the first key
   filling what it does not name from the staged pose (so a strike leaves the legs as the gate set them unless it names them) */
function bind(clip, base) {
  const keys = (clip.keys || []).slice().sort((a, b) => a.f - b.f), chans = new Set(), rchans = new Set();
  for (const k of keys) { for (const c in k.pose || {}) chans.add(c); for (const c in k.root || {}) if (c !== 'pivot') rchans.add(c); }
  const out = []; let prev = null;
  for (const k of keys) {
    const p = {}, r = {};
    for (const c of chans) p[c] = k.pose && k.pose[c] != null ? jv(c, k.pose[c]) : prev ? prev.pose[c] : jv(c, base ? base[c] : 0) || [0, 0, 0];
    for (const c of rchans) r[c] = k.root && k.root[c] != null ? k.root[c] : prev ? prev.root[c] : 0;
    const e = { f: k.f, pose: p, root: r, ease: k.ease || 'inOut', smear: !!k.smear, pivot: (k.root && k.root.pivot) || (prev && prev.pivot) || 'heel' };
    out.push(e); prev = e;
  }
  const len = clip.len || (out.length ? out[out.length - 1].f : 1);
  return { clip, keys: out, chans: [...chans], rchans: [...rchans], len, loop: !!clip.loop, fps: clip.fps || 12, holds: clip.holds || [] };
}
/* holds: [{f, n}] hold the pose reached at drawing f for n more drawings (a beat of stillness written into a clip without
   re-timing its keys) */
function warp(F, holds) { let x = F; for (const h of holds) { if (x > h.f + h.n) x -= h.n; else if (x > h.f) x = h.f; } return x; }
/* the pose at clip time tc (seconds, already speed-scaled): {pose, root, F, smear, events} */
function sample(B, tc) {
  if (!B.keys.length) return { pose: {}, root: {}, F: 0 };
  let F = drawing(Math.max(0, tc), B.fps); const intro = B.clip.intro || 0;
  F = warp(F, B.holds);
  let Fc = F;
  if (B.loop) { if (intro && F < intro) Fc = -1; else Fc = ((F - intro) % B.len + B.len) % B.len; }
  else Fc = Math.min(F, B.len);
  if (Fc < 0) { /* the loop's way in: from the staged pose to its first key over `intro` drawings */
    const u = sm(F / intro), k0 = B.keys[0], pose = {}, root = {};
    for (const c of B.chans) pose[c] = B.base && B.base[c] ? B.base[c].map((x, i) => lerp(x, k0.pose[c][i], u)) : k0.pose[c].map(x => x * u);
    for (const c of B.rchans) root[c] = k0.root[c] * u; root.pivot = k0.pivot; return { pose, root, F, events: [] };
  }
  let a = B.keys[0], b = null;
  for (let i = 0; i < B.keys.length; i++) { if (B.keys[i].f <= Fc) { a = B.keys[i]; b = B.keys[i + 1] || null; } }
  let u = 0, smear = false;
  if (b) { u = (EASE[b.ease] || sm)((Fc - a.f) / Math.max(1, b.f - a.f)); if (b.smear && Fc === b.f - 1) smear = true; }
  const pose = {}, root = {};
  for (const c of B.chans) pose[c] = b ? a.pose[c].map((x, i) => lerp(x, b.pose[c][i], u)) : a.pose[c].slice();
  for (const c of B.rchans) root[c] = b ? lerp(a.root[c], b.root[c], u) : a.root[c];
  root.pivot = b && u > 0.5 ? b.pivot : a.pivot;
  const events = (B.clip.events || []).filter(e => e.f === Fc).map(e => e.ev);
  return { pose, root, F, Fc, smear, events, cycle: B.loop ? Math.floor(Math.max(0, F - intro) / B.len) : 0 };
}

/* ── a rig, read and posed in the gate's terms ── */
function readPose(r) { const o = {}; for (const k of JOINTS) o[k] = [r[k].rotation.x, r[k].rotation.y, r[k].rotation.z]; return o; }
/* the minifig rule the gate keeps (kfBlock): arms and legs swing about x, the head turns about y; the torso's x is the lean the
   performance layer already uses, and a small arm z (arm.out) the embrace needs. The head yaw is negated as Perform negates it. */
function applyPose(r, pose) { for (const k in pose) { if (!r[k] || !pose[k]) continue; const v = pose[k]; if (k === 'headP') r.headP.rotation.set(0, v[1], 0); else r[k].rotation.set(v[0], v[1], v[2]); } }
/* the root: offsets from the base mark (studs, plates) and a whole-figure turn about a pivot on the ground (heel, toe, knee) */
function applyRoot(r, base, root, U) {
  const h = base.h + (root.yaw || 0), fw = new V3(Math.sin(h), 0, Math.cos(h)), sd = new V3(Math.cos(h), 0, -Math.sin(h));
  const p = base.p.clone().addScaledVector(fw, (root.fwd || 0) * U.stud).addScaledVector(sd, (root.side || 0) * U.stud);
  p.y += (root.dy || 0) * U.plate - (root.kneel || 0) * U.kneelDrop - (root.sitGround || 0) * U.sitDrop;
  const pitch = (base.rx || 0) + (root.pitch || 0), roll = (base.rz || 0) + (root.roll || 0);
  const q = new Q().setFromEuler(new E(pitch, h, roll, 'YXZ'));
  if (root.pitch) { /* turn about the pivot: the heel falling back, the toe falling forward, the knee from kneeling */
    const pz = root.pivot === 'toe' ? U.toe : root.pivot === 'knee' ? U.knee : U.heel;
    const qh = new Q().setFromEuler(new E(base.rx || 0, h, base.rz || 0, 'YXZ')), off = new V3(0, 0, pz);
    const P = p.clone().add(off.clone().applyQuaternion(qh)); p.copy(P.sub(off.applyQuaternion(q)));
  }
  r.figure.position.copy(p); r.figure.quaternion.copy(q);
}

/* ═══════════════════════ geometry in brick terms ═══════════════════════ */
/* built in LDraw units (a stud 20, a plate 8, a brick 24), origin at the bottom centre, y up; the instance matrix scales by the
   set's world units per LDU */
function merge(list) {
  let n = 0; const P = [], N = [];
  for (const g0 of list) { const g = g0.index ? g0.toNonIndexed() : g0; P.push(g.attributes.position.array); N.push(g.attributes.normal.array); n += g.attributes.position.count; }
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  for (let i = 0; i < P.length; i++) { pos.set(P[i], o); nor.set(N[i], o); o += P[i].length; }
  const G_ = new THREE.BufferGeometry(); G_.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G_.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G_.computeBoundingSphere(); return G_;
}
const box = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z);
const cyl = (r, h, x = 0, y = 0, z = 0, seg = 16) => new THREE.CylinderGeometry(r, r, h, seg).translate(x, y + h / 2, z);
const studs = (w, d, y) => { const out = []; for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push(cyl(6, 4, (i - (w - 1) / 2) * 20, y, (j - (d - 1) / 2) * 20, 10)); return out; };
const GEO = {};
function geo(name) {
  if (GEO[name]) return GEO[name];
  let g;
  switch (name) {
    case 'tile2x2': g = box(39.6, 8, 39.6); break;
    case 'tile1x2': g = box(19.6, 8, 39.6); break;
    case 'tile1x1': g = box(19.6, 8, 19.6); break;
    case 'plate1x2': g = merge([box(19.6, 8, 39.6), ...studs(1, 2, 8)]); break;
    case 'plate2x2': g = merge([box(39.6, 8, 39.6), ...studs(2, 2, 8)]); break;
    case 'plate4x4': g = merge([box(79.6, 8, 79.6), ...studs(4, 4, 8)]); break;
    case 'round1x1': g = merge([cyl(9.8, 8), cyl(6, 4, 0, 8, 0, 10)]); break;
    case 'roundtile1x1': g = cyl(9.8, 8); break;
    case 'roundbrick1x1': g = merge([cyl(9.8, 24), cyl(6, 4, 0, 24, 0, 10)]); break;
    case 'roundbrick2x2': g = merge([cyl(19.8, 24, 0, 0, 0, 20), ...studs(2, 2, 24)]); break;
    case 'brick1x2': g = merge([box(19.6, 24, 39.6), ...studs(1, 2, 24)]); break;
    case 'rock': g = merge([box(39.6, 24, 39.6, 0, 0, 0), box(19.6, 24, 39.6, 22, 4, 6), box(39.6, 16, 19.6, -6, 22, -6), box(19.6, 8, 19.6, -18, 6, 20)]).translate(0, -20, 0); break;
    case 'bar': g = cyl(2, 1, 0, 0, 0, 8); break;   /* a 1-LDU bar, stretched along y */
    case 'blade': g = box(14, 1, 40); break;
    default: throw Error('no geometry ' + name);
  }
  return (GEO[name] = g);
}
/* the part colours, LDraw's (ldconfig) */
const COL = { blue: '#0055bf', 'trans-dark-blue': '#0020a0', 'trans-medium-blue': '#5b9bd5', 'trans-light-blue': '#aeefec', white: '#ffffff', 'trans-clear': '#fcfcfc',
  'light-bluish-grey': '#a0a5a9', 'dark-bluish-grey': '#6c6e68', 'reddish-brown': '#582a12', brown: '#6b3f22', tan: '#e4cd9e', 'trans-orange': '#f08f1c',
  'trans-yellow': '#f5cd2f', 'trans-red': '#c91a09', 'bright-pink': '#e4adc8', pink: '#f6a8bc', pig: '#ec8fb2', black: '#1b2a34', gold: '#dcbc81', 'dark-blue': '#0a3463', 'trans-purple': '#a5a5cb' };
/* colours as the page's parts have them: linear when the renderer writes sRGB (the LDraw loader's vertex colours are linear) */
let LIN = true;
const col = c => { const x = new C(COL[c] || c); return LIN ? x.convertSRGBToLinear() : x; };
function mat(color, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color: col(color), roughness: o.rough ?? 0.32, metalness: 0.0, transparent: o.opacity != null && o.opacity < 1, opacity: o.opacity ?? 1,
    emissive: o.emissive ? col(o.emissive) : new C(0), emissiveIntensity: o.glow ?? 1, depthWrite: o.opacity != null && o.opacity < 1 ? false : true, side: THREE.DoubleSide });
  if (o.fog === false) m.fog = false; return m;
}
const _M = new M4(), _P = new V3(), _S = new V3(), _Q = new Q(), Q0 = new Q();
class Layer {
  constructor(parent, g, m, max, colored) { this.m = new THREE.InstancedMesh(g, m, max); this.m.frustumCulled = false; this.m.receiveShadow = true; this.m.castShadow = !m.transparent; this.max = max; this.n = 0;
    if (colored) for (let i = 0; i < max; i++) this.m.setColorAt(i, new C(1, 1, 1));   /* r128 sizes the colour buffer by count: before count is zeroed */
    this.m.count = 0; parent.add(this.m); }
  begin() { this.n = 0; return this; }
  put(x, y, z, sx, sy, sz, q, c) { if (this.n >= this.max) return; _M.compose(_P.set(x, y, z), q || Q0, _S.set(sx, sy, sz)); this.m.setMatrixAt(this.n, _M); if (c && this.m.instanceColor) this.m.setColorAt(this.n, c); this.n++; }
  end() { this.m.count = this.n; this.m.instanceMatrix.needsUpdate = true; if (this.m.instanceColor) this.m.instanceColor.needsUpdate = true; }
}
/* a bar from a to b (world), r in LDU */
function barBetween(L, a, b, s, r = 1) { const d = b.clone().sub(a), len = d.length(); if (len < 1e-6) return; _Q.setFromUnitVectors(new V3(0, 1, 0), d.normalize()); L.put(a.x, a.y, a.z, r * s, len, r * s, _Q); }
/* a burst of loose plates (a splash, spray, dust): n pieces thrown up and out from c at drawing F0, ballistic, gone after life */
function burst(L, c, F0, F, o) {
  const age = F - F0, life = o.life || 8; if (age < 0 || age >= life) return;
  const n = o.n || 10, U = o.U, sp = (o.speed || 1.6) * U.stud, up = (o.up || 2.2) * U.stud, g = (o.g || 0.55) * U.stud, sc = U.s * (o.scale || 1);
  for (let i = 0; i < n; i++) {
    const a = rnd(o.seed || 1, i, 1) * Math.PI * 2, v = sp * (0.5 + rnd(o.seed || 1, i, 2)), w = up * (0.6 + 0.8 * rnd(o.seed || 1, i, 3));
    const x = c.x + Math.cos(a) * v * age, z = c.z + Math.sin(a) * v * age, y = c.y + w * age - g * age * age;
    if (y < c.y - U.plate) continue; const k = age > life - 3 ? (life - age) / 3 : 1;
    L.put(x, y, z, sc * k, sc * k, sc * k, null, o.color ? col(o.color) : null);
  }
}

/* ═══════════════════════ the stage: a shot's (or a key's) motion, fields and swaps ═══════════════════════ */
/* spec: {motion:[{actor, clip, at, speed, with, target, loop, until, params}], fields:[{type, params}], swaps:[{...}], optical:{grade:'past', hold:3}}
   ctx:  {actorOf(id)->{rig}, scale (world units per LDU), cam:{pos,target,fov} (the shot's start camera), pieces() -> [{label,box}],
          scene, parse(file,color)->Promise<Group> (ButterMovieator.parse), props() -> Promise<props.json>, host} */
function named(sh) { return !!(sh && ((sh.motion && sh.motion.length) || (sh.fields && sh.fields.length) || (sh.swaps && sh.swaps.length) || sh.optical)); }
async function stage(spec, ctx) {
  const scene = ctx.scene || root.scene, s = ctx.scale || 1;
  const rr = ctx.renderer || root.renderer; LIN = !rr || rr.outputEncoding === THREE.sRGBEncoding;
  const U = { s, stud: 20 * s, plate: 8 * s, brick: 24 * s };
  const grp = new THREE.Group(); grp.name = 'odyssey-motion'; scene.add(grp);
  const St = { spec, ctx, U, grp, runs: [], fields: [], swaps: [], restore: [], lights: [], ov: null, pieces: null };
  St.pieceBox = label => { St.pieces = St.pieces || (ctx.pieces ? ctx.pieces() : []); const p = St.pieces.find(q => q.label === label) || St.pieces.find(q => q.label.includes(label)); return p && p.box; };
  St.pieceMeshes = pattern => pieceMeshes(scene, St, pattern);
  /* the actors: their staged marks read now (a host re-poses every frame, so the base is re-read at each drawing too) */
  const actors = new Map();
  const actor = id => { if (actors.has(id)) return actors.get(id); const a = ctx.actorOf(id); if (!a) { console.warn('[motion] no actor', id); actors.set(id, null); return null; } const r = a.rig || a;
    const A_ = { id, r, U: unitsOf(r, U) }; actors.set(id, A_); return A_; };
  St.actor = actor;
  for (const m of spec.motion || []) {
    const A_ = actor(m.actor); if (!A_) continue; const c = typeof m.clip === 'object' ? m.clip : CLIPS[m.clip]; if (!c) { console.warn('[motion] no clip', m.clip); continue; }
    const run = { m, A: A_, clip: c, at: m.at || 0, speed: m.speed || 1, params: Object.assign({}, c.params || {}, m.params || {}) };
    if (!c.procedural) { run.B = bind(c, readPose(A_.r)); run.B.base = readPose(A_.r); if (m.loop != null) run.B.loop = !!m.loop; }
    if (m.with) run.partner = actor(m.with);
    if (m.target) run.target = m.target;
    St.runs.push(run);
  }
  for (const run of St.runs) run.acc = await buildAcc(St, run);
  for (const f of spec.fields || []) { const F = FIELDS[f.type]; if (!F) { console.warn('[motion] no field', f.type); continue; } St.fields.push(await F(St, Object.assign({}, f.params || {}, f))); }
  for (const w of spec.swaps || []) { const S_ = SWAPS[w.type || 'transform']; if (!S_) { console.warn('[motion] no swap', w.type); continue; } St.swaps.push(await S_(St, w)); }
  const opt = spec.optical || null;
  St.time = u => { if (opt && opt.hold) { const per = (opt.hold || 3) / 24; return Math.floor(u / per + 1e-6) * per; } return u; };
  St.frame = u => frame(St, u);
  St.dispose = () => dispose(St);
  St.show = v => { grp.visible = v; };
  return St;
}
function unitsOf(r, U) {
  /* the figure's own measures, taken once with it standing straight: the heel and toe from the feet's box, the kneel's drop
     (legs back ninety degrees, knees on the ground), the sit's drop (legs forward, seat on the ground) */
  const save = { q: r.figure.quaternion.clone(), p: r.figure.position.clone(), j: readPose(r) }, h = r.heading || 0;
  r.figure.quaternion.setFromEuler(new E(0, h, 0, 'YXZ')); for (const k of JOINTS) r[k].rotation.set(0, 0, 0);
  const lo = () => { r.figure.updateMatrixWorld(true); const b = new THREE.Box3(); r.figure.traverse(o => { if (o.isMesh && o.visible !== false) { let vis = true; for (let q = o; q; q = q.parent) if (q.visible === false) vis = false; if (vis) b.union(new THREE.Box3().setFromObject(o)); } }); return b; };
  const b0 = lo(), y0 = r.figure.position.y, H = (b0.max.y - b0.min.y) || 100 * U.s;
  r.legRP.rotation.x = r.legLP.rotation.x = Math.PI / 2; const bk = lo(); const kneelDrop = Math.max(0, bk.min.y - b0.min.y);
  r.legRP.rotation.x = r.legLP.rotation.x = -Math.PI / 2; const bs = lo(); const sitDrop = Math.max(0, bs.min.y - b0.min.y);
  r.figure.quaternion.copy(save.q); r.figure.position.copy(save.p); for (const k of JOINTS) r[k].rotation.set(...save.j[k]); r.figure.updateMatrixWorld(true);
  const s = U.s * (r.figure.scale.x / (U.s || 1) || 1);   /* the figure's LDU in world units */
  return Object.assign({}, U, { H, Hldu: H / (r.figure.scale.x || U.s), fs: r.figure.scale.x, heel: -10 * r.figure.scale.x, toe: 10 * r.figure.scale.x, knee: 8 * r.figure.scale.x, kneelDrop, sitDrop, y0, s2: s });
}
function baseOf(r) { const e = new E().setFromQuaternion(r.figure.quaternion, 'YXZ'); return { p: r.figure.position.clone(), h: r.heading != null ? r.heading : e.y, rx: e.x, rz: e.z }; }

/* one drawing of the stage at u (seconds into the shot): the cast posed, the accessories, the fields, the swaps; returns the
   overlay the host paints over the frame (flash, shake, tint, the marked past) */
function frame(St, u) {
  const ov = { flash: 0, shake: null, tint: null, past: St.spec.optical && St.spec.optical.grade === 'past' ? (St.spec.optical.amount ?? 1) : 0, sky: null, light: 0 };
  St.ov = ov;
  /* staged: each actor's mark as the host posed it; cur: where the runs so far have left him (a later run on the same actor starts
     from there: the travel and the turn chain, the pose is the later run's) */
  const staged = new Map(), cur = new Map(), approached = new Set();
  for (const run of St.runs) { const r = run.A.r; if (!staged.has(r)) { const b = baseOf(r);
    /* mark: a run may re-place its figure for the shot ([x,z] on the same floor height, or [x,y,z]; heading in radians) */
    const mk = St.runs.find(q => q.A.r === r && q.m.mark); if (mk) { const m = mk.m.mark; b.p.set(m[0], m.length === 3 ? m[1] : b.p.y, m.length === 3 ? m[2] : m[1]); if (mk.m.heading != null) b.h = mk.m.heading; applyRoot(r, b, {}, mk.A.U); }
    staged.set(r, b); cur.set(r, Object.assign({}, b, { p: b.p.clone() })); } }
  /* opponents (a clip run `with` another, not an embrace): turned to face each other and stood at fighting range (params.range
     studs, default 2.5) for the whole shot, before and between their runs */
  for (const run of St.runs) { const r = run.A.r, pr = run.partner && run.partner.r; if (!pr || run.clip.relational || approached.has(r)) continue; approached.add(r);
    const s0 = staged.get(r), o = (staged.get(pr) || baseOf(pr)).p, want = Math.atan2(o.x - s0.p.x, o.z - s0.p.z), gap = Math.hypot(o.x - s0.p.x, o.z - s0.p.z);
    const mutual = St.runs.some(q => q.A.r === pr && q.partner && q.partner.r === r), go = (gap - (run.params.range ?? 2.5) * run.A.U.stud) / (mutual ? 2 : 1);
    const c = Object.assign({}, s0, { h: want, p: s0.p.clone().add(new V3(Math.sin(want) * go, 0, Math.cos(want) * go)) }); cur.set(r, c); applyRoot(r, c, {}, run.A.U); }
  for (const run of St.runs) {
    const r = run.A.r, base = cur.get(r), tc = (u - run.at) * run.speed; run.now = null;
    if (tc < 0 || (run.m.until != null && u >= run.m.until)) continue;
    let smp;
    if (run.clip.procedural) { const P = Object.assign({ H: run.A.U.Hldu }, run.params); if (run.m.to) { const to = pointOf(St, run.m.to); if (to) { const d = Math.hypot(to.x - base.p.x, to.z - base.p.z); P.dist = d / run.A.U.stud; run.face = to; } } smp = gaitSample(run.clip.procedural, tc, P); }
    else smp = sample(run.B, tc);
    const root = Object.assign({}, smp.root);
    /* a clip that travels: swim and climb */
    if (run.clip.travel) root.fwd = (root.fwd || 0) + run.clip.travel * onTwos(tc) * (run.params.dir || 1);
    if (run.clip.rise) root.dy = (root.dy || 0) + run.clip.rise * (smp.cycle || 0) + run.clip.rise * ((smp.Fc || 0) / run.B.len);
    /* relational: turn to the partner (or the target) and close the gap: to a hug (embrace), or to fighting range (a clip run
       `with` an opponent: params.range studs, default 2.5) */
    let b = base;
    const pr = run.partner && run.partner.r, other = pr ? (staged.get(pr) || baseOf(pr)).p : run.target ? pointOf(St, run.target) : run.face || null;
    const fight = pr && !run.clip.relational;
    if (other && !fight && (root.face != null || root.approach != null || run.clip.procedural && run.m.to)) {
      const s0 = staged.get(r), want = Math.atan2(other.x - s0.p.x, other.z - s0.p.z), f = root.face != null ? root.face : 1;
      let d = want - base.h; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      b = Object.assign({}, base, { h: base.h + d * f });
      if (root.approach && !approached.has(r)) { approached.add(r); const gap = Math.hypot(other.x - s0.p.x, other.z - s0.p.z), close = (run.params.close ?? 30) * run.A.U.fs;
        const go = (gap - close) / (pr && St.runs.some(q => q.A.r === pr && q.partner && q.partner.r === r) ? 2 : 1); root.fwd = (root.fwd || 0) + root.approach * Math.max(0, go) / run.A.U.stud; }
    }
    /* keep: joints a run leaves as staged (a seated figure reels with her arms and torso, her legs still in the seat) */
    const pose = run.m.keep ? Object.fromEntries(Object.entries(smp.pose).filter(([k]) => !run.m.keep.includes(k))) : smp.pose;
    applyPose(r, pose); applyRoot(r, b, root, run.A.U);
    run.now = { smp, base: b, root, tc };
    /* the chain: the next run on this figure starts where this one has travelled and turned to */
    { const h = b.h + (root.yaw || 0), fw = new V3(Math.sin(b.h), 0, Math.cos(b.h)), sd = new V3(Math.cos(b.h), 0, -Math.sin(b.h));
      cur.set(r, Object.assign({}, b, { h, p: b.p.clone().addScaledVector(fw, (root.fwd || 0) * run.A.U.stud).addScaledVector(sd, (root.side || 0) * run.A.U.stud) })); }
    /* a two-drawing impact: the lens shakes */
    const imp = run.B && (run.B.clip.events || []).some(e => e.ev === 'impact' && (smp.Fc === e.f || smp.Fc === e.f + 1));
    if (imp && run.m.shake !== false) ov.shake = Math.max(ov.shake || 0, (run.m.shake || 1) * run.A.U.stud * 0.12);
  }
  for (const f of St.fields) f.update(u, ov);   /* the fields after the cast: a hull that rides the sea carries its crew */
  scene_(St).updateMatrixWorld(true);
  for (const run of St.runs) { if (run.acc) for (const a of run.acc) a.update(u, run); smearOf(St, run); }
  for (const w of St.swaps) w.update(u, ov);
  return ov;
}
const scene_ = St => St.ctx.scene || root.scene;
/* the smear: on the drawing before a key marked smear, an arc of trans-clear plates along the path the leading hand sweeps from the
   key before to that key (the LEGO Movie's one smear frame of a clear arc plate) */
function smearOf(St, run) {
  if (!run.smearL) { if (!run.B || !run.B.keys.some(k => k.smear)) return; run.smearL = new Layer(St.grp, geo('plate1x2'), mat('trans-clear', { opacity: 0.45, rough: 0.05, emissive: '#dfefff', glow: 0.4 }), 16); }
  const L = run.smearL.begin(), now = run.now; if (!now || !now.smp.smear) { L.end(); return; }
  const r = run.A.r, B = run.B, Fc = now.smp.Fc; let a = B.keys[0], b = null; for (let i = 0; i < B.keys.length; i++) if (B.keys[i].f <= Fc) { a = B.keys[i]; b = B.keys[i + 1]; } if (!b) { L.end(); return; }
  for (const side of ['R', 'L']) { const k = side === 'R' ? 'armRP' : 'armLP'; if (!a.pose[k] || Math.abs(a.pose[k][0] - b.pose[k][0]) < 0.8) continue;
    const save = r[k].rotation.x, tipL = handLocal(side).add(new V3(0, 26, -14));
    for (let i = 0; i <= 7; i++) { r[k].rotation.x = lerp(a.pose[k][0], b.pose[k][0], i / 7); r[k].updateWorldMatrix(true, false); const p = r[k].localToWorld(tipL.clone()), q = r[k].localToWorld(tipL.clone().add(new V3(0, 0, -10)));
      _Q.setFromUnitVectors(new V3(0, 0, 1), q.sub(p).normalize()); L.put(p.x, p.y, p.z, St.U.s * 0.9, St.U.s * 0.5, St.U.s * 0.9, _Q); }
    r[k].rotation.x = save; r[k].updateWorldMatrix(true, false); }
  L.end();
}
function dispose(St) {
  for (const f of St.fields) f.dispose && f.dispose();
  for (const w of St.swaps) w.dispose && w.dispose();
  for (const run of St.runs) if (run.acc) for (const a of run.acc) a.dispose && a.dispose();
  for (const fn of St.restore.reverse()) try { fn(); } catch (e) { console.warn('[motion] restore', e); }
  for (const l of St.lights) l.parent && l.parent.remove(l);
  St.grp.parent && St.grp.parent.remove(St.grp);
  St.grp.traverse(o => { if (o.isInstancedMesh || o.isMesh) { o.material && [].concat(o.material).forEach(m => m.dispose()); } });
}
/* a point named in a spec: [x,y,z], an actor's id (his head), '@anchor', 'piece:label' (its top centre), or 'hand:id:R' */
function pointOf(St, p) {
  if (Array.isArray(p)) return p.length === 2 ? new V3(p[0], 0, p[1]) : new V3(p[0], p[1], p[2]);
  if (typeof p !== 'string') return null;
  if (p.startsWith('piece:')) { const b = St.pieceBox(p.slice(6)); return b ? new V3((b[0] + b[3]) / 2, b[4], (b[2] + b[5]) / 2) : null; }
  if (p.startsWith('@') && root.OdysseyFilm) return OdysseyFilm.anchor(p.slice(1));
  if (p.startsWith('hand:')) { const [, id, side] = p.split(':'); const A_ = St.actor(id); return A_ ? handWorld(A_.r, side || 'R') : null; }
  const A_ = St.actor(p); if (A_) { A_.r.figure.updateMatrixWorld(true); return A_.r.headP.getWorldPosition(new V3()).add(new V3(0, 10 * A_.r.figure.scale.x, 0)); }
  return null;
}
/* where a hand grips, in the world: Movieator's hand offset in the arm pivot (Minifig.HAND_R less the arm slot) */
function handLocal(side) { const MF = root.Minifig; if (MF && MF.HAND_R) { const h = side === 'L' ? MF.HAND_L : MF.HAND_R, sl = MF.SLOTS[side === 'L' ? 'armL' : 'armR']; return new V3(h[0] - sl[1], h[1] - sl[2] + 6, h[2] - sl[3] - 4); } return new V3(side === 'L' ? 8.3 : -8.3, 23.6, -14.3); }
function handWorld(r, side) { const p = side === 'L' ? r.armLP : r.armRP; p.updateWorldMatrix(true, false); return p.localToWorld(handLocal(side)); }
/* the set's pages as meshes, by label (the page mesh whose box is the page's box); '*' in a label is a wildcard */
function pieceMeshes(scene, St, pattern) {
  St.pieces = St.pieces || (St.ctx.pieces ? St.ctx.pieces() : []);
  const re = new RegExp('^' + String(pattern).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i');
  const want = St.pieces.filter(p => re.test(p.label) && p.box); if (!want.length) return [];
  const cands = []; scene.traverse(o => { if (o.isMesh && o.userData && o.userData.partId != null) cands.push(o); });
  const out = [];
  for (const p of want) { let best = null, bd = 1e9; for (const m of cands) { const b = new THREE.Box3().setFromObject(m), d = Math.abs(b.min.x - p.box[0]) + Math.abs(b.min.y - p.box[1]) + Math.abs(b.min.z - p.box[2]) + Math.abs(b.max.x - p.box[3]) + Math.abs(b.max.y - p.box[4]) + Math.abs(b.max.z - p.box[5]); if (d < bd) { bd = d; best = m; } }
    if (best && bd < 12) out.push({ label: p.label, box: p.box, mesh: best }); }
  return out;
}
function hidePieces(St, patterns) { for (const pat of [].concat(patterns || [])) for (const pm of St.pieceMeshes(pat)) { const m = pm.mesh, v = m.visible; m.visible = false; St.restore.push(() => { m.visible = v; }); } }

/* ── accessories: what a clip moves beside the body ── */
async function buildAcc(St, run) {
  const out = [], acc = Object.assign({}, run.clip.acc || {}, run.m.acc || {});
  for (const [name, o0] of Object.entries(acc)) { if (o0 === false) continue; const o = Object.assign({}, o0, (run.m.params || {})[name] || {}); const B_ = ACC[name]; if (!B_) continue; const a = await B_(St, run, o); if (a) out.push(a); }
  return out;
}
const ACC = {
  /* the oar: a shaft through the oarlock and the hands; its blade dips as the hands rise; a splash of white plates at each catch.
     The lock is outboard of the rower (params.oar.side: 1 his right, -1 his left; 'auto' toward the nearer side of the ship) */
  oar(St, run, o) {
    const r = run.A.r, U = St.U, g = new THREE.Group(); St.grp.add(g);
    const wood = mat(o.color || 'reddish-brown'), shaft = new Layer(g, geo('bar'), wood, 1), blade = new Layer(g, geo('blade'), wood, 1), spl = new Layer(g, geo('round1x1'), mat('white', { rough: 0.2 }), 24);
    const base = baseOf(r);
    let side = o.side;
    if (side == null || side === 'auto') { const b = St.pieceBox(o.ship || 'black ship') || St.pieceBox('raft'); side = 1; if (b) { const cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2, h = base.h, right = new V3(-Math.cos(h), 0, Math.sin(h)); const off = (base.p.x - cx) * right.x + (base.p.z - cz) * right.z, halfW = Math.min(b[3] - b[0], b[5] - b[2]) / 2; side = Math.abs(off) > halfW * 0.2 ? (off >= 0 ? 1 : -1) : (hash32(run.A.id) & 1 ? 1 : -1); } }
    const len = (o.length || 9) * U.stud, out = (o.out || 1.6) * U.stud, lockY = (o.lockY ?? 1.8) * U.brick;
    return { update(u, rn) {
      shaft.begin(); blade.begin(); spl.begin();
      if (!rn.now) { shaft.end(); blade.end(); spl.end(); return; }
      const b = rn.now.base, h = b.h, right = new V3(-Math.cos(h), 0, Math.sin(h)).multiplyScalar(side);
      const lock = b.p.clone().addScaledVector(right, out); lock.y += lockY;
      const hands = handWorld(r, 'R').add(handWorld(r, 'L')).multiplyScalar(0.5);
      const dir = lock.clone().sub(hands).normalize(), tip = hands.clone().addScaledVector(dir, len);
      barBetween(shaft, hands.clone().addScaledVector(dir, -0.6 * U.stud), tip, U.s, 2.4);
      _Q.setFromUnitVectors(new V3(0, 0, 1), dir); blade.put(tip.x, tip.y - 0.5 * U.plate, tip.z, U.s, U.s * 1.2, U.s * 1.6, _Q);
      /* the catch: a splash where the blade meets the water */
      const smp = rn.now.smp; if (smp && smp.Fc != null && smp.Fc < 4 && smp.F >= (run.B.clip.intro || 0)) burst(spl, new V3(tip.x, Math.max(tip.y, (o.water ?? tip.y)), tip.z), 0, smp.Fc, { U, n: 8, life: 4, speed: 0.9, up: 1.8, seed: hash32(run.A.id) + (smp.cycle || 0), scale: 0.8 });
      shaft.end(); blade.end(); spl.end();
    }, dispose() { g.parent && g.parent.remove(g); } };
  },
  /* the bow: an arc of five reddish-brown round plates in the left hand, the string from its tips to the right hand while drawn,
     straight and plucked (on ones, six drawings) when loosed; the arrow on the string, then away 40 studs a drawing */
  bow(St, run, o) {
    const r = run.A.r, U = St.U, g = new THREE.Group(); St.grp.add(g);
    const wood = new Layer(g, geo('round1x1'), mat('reddish-brown'), 7), str = new Layer(g, geo('bar'), mat('white', { rough: 0.6 }), 4), arrow = new Layer(g, geo('bar'), mat('tan'), 2), tipL = new Layer(g, geo('round1x1'), mat('dark-bluish-grey'), 1);
    const draw = o.draw || [[0, 0]], rel = o.release ?? 21, speed = (o.arrowSpeed || 40) * U.stud;
    const at = F => { let v = draw[0][1]; for (let i = 0; i < draw.length; i++) { if (draw[i][0] <= F) { v = draw[i][1]; const n = draw[i + 1]; if (n && F < n[0]) v = lerp(draw[i][1], n[1], (F - draw[i][0]) / (n[0] - draw[i][0])); } } return v; };
    return { update(u, rn) {
      wood.begin(); str.begin(); arrow.begin(); tipL.begin();
      if (rn.now) {
        const F = rn.now.smp.F, hL = handWorld(r, 'L'), hR = handWorld(r, 'R'), fw = new V3(Math.sin(rn.now.base.h + (rn.now.root.yaw || 0)), 0, Math.cos(rn.now.base.h + (rn.now.root.yaw || 0)));
        const aim = hL.clone().sub(hR); aim.y = 0; if (aim.lengthSq() < 1e-6) aim.copy(fw); aim.normalize();
        const up = new V3(0, 1, 0), half = 2.4 * U.stud, dr = at(F);
        const top = hL.clone().addScaledVector(up, half).addScaledVector(aim, -0.5 * U.stud), bot = hL.clone().addScaledVector(up, -half).addScaledVector(aim, -0.5 * U.stud);
        for (let i = 0; i <= 6; i++) { const a = (i / 6 - 0.5) * Math.PI * 0.8, p = hL.clone().addScaledVector(up, Math.sin(a) * half * 1.02).addScaledVector(aim, (Math.cos(a) - 0.95) * 0.9 * U.stud); wood.put(p.x, p.y - 4 * U.s, p.z, U.s * 0.45, U.s * 0.9, U.s * 0.45); }
        let nock = top.clone().lerp(bot, 0.5);
        if (dr > 0 && F < rel) nock = hR.clone();
        else if (F >= rel && F < rel + 6) nock.addScaledVector(aim, ((F - rel) % 2 ? -1 : 1) * 0.25 * U.stud * (1 - (F - rel) / 6));   /* the pluck */
        barBetween(str, top, nock, U.s, 0.6); barBetween(str, nock, bot, U.s, 0.6);
        if (F < rel && dr > 0) { const tail = nock.clone(), head = nock.clone().addScaledVector(aim, 4.2 * U.stud); barBetween(arrow, tail, head, U.s, 1.2); tipL.put(head.x, head.y - 3 * U.s, head.z, U.s * 0.35, U.s * 0.6, U.s * 0.35); }
        else if (F >= rel && F < rel + 8) { /* loosed: along the aim, 40 studs a drawing */ const k = (F - rel + 1) * speed / U.stud * U.stud, tail = hL.clone().addScaledVector(aim, k), head = tail.clone().addScaledVector(aim, 4.2 * U.stud); barBetween(arrow, tail, head, U.s, 1.2); }
      }
      wood.end(); str.end(); arrow.end(); tipL.end();
    }, dispose() { g.parent && g.parent.remove(g); } };
  },
  /* the rock: a cluster of grey bricks lifted in both hands, loosed at the release drawing on a ballistic arc to its target
     (params.rock.to: a point, an actor, or {fwd: studs}), spinning 30 degrees a drawing with a trail of three fading copies, a
     splash of white plates (or dust) where it lands */
  rock(St, run, o) {
    const r = run.A.r, U = St.U, g = new THREE.Group(); St.grp.add(g);
    const L = new Layer(g, geo('rock'), mat(o.color || 'dark-bluish-grey'), 1), T = new Layer(g, geo('rock'), mat(o.color || 'dark-bluish-grey', { opacity: 0.3 }), 3), spl = new Layer(g, geo('round1x1'), mat(o.splash === 'dust' ? 'tan' : 'white'), 24);
    const rel = o.release ?? 16, from = o.from ?? 0, sc = (o.size || 1.2) * U.s;
    /* the release point and the flight, baked once: the rig posed at the release drawing, its hands read, restored */
    const save = { q: r.figure.quaternion.clone(), p: r.figure.position.clone(), j: readPose(r) }, base = baseOf(r);
    const smp = sample(run.B, rel / 12); applyPose(r, smp.pose); applyRoot(r, base, smp.root, run.A.U); r.figure.updateMatrixWorld(true);
    const p0 = handWorld(r, 'R').add(handWorld(r, 'L')).multiplyScalar(0.5).add(new V3(0, 1.2 * U.brick, 0));
    r.figure.quaternion.copy(save.q); r.figure.position.copy(save.p); for (const k of JOINTS) r[k].rotation.set(...save.j[k]); r.figure.updateMatrixWorld(true);
    let p1 = o.to ? pointOf(St, o.to) : null; if (!p1) { const d = (o.fwd || 24) * U.stud; p1 = p0.clone().add(new V3(Math.sin(base.h) * d, 0, Math.cos(base.h) * d)); p1.y = o.ground ?? base.p.y; }
    const flight = Math.max(4, o.frames || Math.round(p0.distanceTo(p1) / (4 * U.stud))), apex = (o.apex ?? 6) * U.brick;
    const at = k => { const x = k / flight; const p = p0.clone().lerp(p1, x); p.y += apex * 4 * x * (1 - x); return p; };
    return { update(u, rn) {
      L.begin(); T.begin(); spl.begin();
      const tc = (u - run.at) * run.speed, F = drawing(Math.max(0, tc));
      if (tc >= 0 && rn.now && F >= from && F < rel) { const p = handWorld(r, 'R').add(handWorld(r, 'L')).multiplyScalar(0.5).add(new V3(0, 1.2 * U.brick, 0)); L.put(p.x, p.y, p.z, sc, sc, sc); }
      else if (tc >= 0 && F >= rel) { const k = F - rel;
        if (k <= flight) { const p = at(k); _Q.setFromEuler(new E(k * 30 * DEG, k * 17 * DEG, 0)); L.put(p.x, p.y, p.z, sc, sc, sc, _Q);
          for (let j = 1; j <= 3 && k - j >= 0; j++) { const q = at(k - j); T.put(q.x, q.y, q.z, sc * (1 - j * 0.12), sc * (1 - j * 0.12), sc * (1 - j * 0.12), _Q); } }
        else if (o.keep) { L.put(p1.x, p1.y, p1.z, sc, sc, sc); }
        burst(spl, p1, flight, k, { U, n: 18, life: 10, speed: 1.4, up: 3.2, seed: 7 }); }
      L.end(); T.end(); spl.end();
    }, dispose() { g.parent && g.parent.remove(g); } };
  },
  /* tears: a clear round plate at a third scale sliding down the face over 24 drawings, the next one after it */
  tears(St, run, o) {
    const r = run.A.r, L = new Layer(r.headP, geo('roundtile1x1'), mat('trans-clear', { opacity: 0.75, rough: 0.05, emissive: '#9fc4ff', glow: 0.25 }), 2);
    return { update(u, rn) { L.begin(); if (rn.now) { const F = rn.now.smp.F; for (const [side, off] of [[-1, 0], [1, 12]]) { const k = ((F + off) % 30) / 24; if (k > 1) continue;
      _Q.setFromEuler(new E(Math.PI / 2, 0, 0)); L.put(side * 5.5, -15 + k * 11, -12.4, 0.3, 0.3, 0.3, _Q); } } L.end(); },
      dispose() { L.m.parent && L.m.parent.remove(L.m); } };
  },
  /* the cup and the libation: a gold cup in the right hand, tipped, a stream of dark red round plates falling from its lip */
  cup(St, run, o) {
    const r = run.A.r, U = St.U, g = new THREE.Group(); St.grp.add(g);
    const cupL = new Layer(g, geo('roundbrick1x1'), mat('gold', { rough: 0.25 }), 1), wine = new Layer(g, geo('round1x1'), mat('#5b0f1e', { opacity: 0.85, rough: 0.1 }), 16);
    const tip = o.tip || [[0, 0]], pour = o.pour || [16, 34];
    const at = F => { let v = tip[0][1]; for (let i = 0; i < tip.length; i++) if (tip[i][0] <= F) { v = tip[i][1]; const n = tip[i + 1]; if (n && F < n[0]) v = lerp(tip[i][1], n[1], (F - tip[i][0]) / (n[0] - tip[i][0])); } return v; };
    return { update(u, rn) {
      cupL.begin(); wine.begin();
      if (rn.now) { const F = rn.now.smp.F, h = handWorld(r, 'R'), fw = new V3(Math.sin(rn.now.base.h), 0, Math.cos(rn.now.base.h)), k = at(F);
        _Q.setFromAxisAngle(new V3(fw.z, 0, -fw.x), k * 1.9); cupL.put(h.x, h.y - 2 * U.s, h.z, U.s * 0.9, U.s * 0.7, U.s * 0.9, _Q);
        if (F >= pour[0] && F < pour[1]) { const lip = h.clone().addScaledVector(fw, 0.6 * U.stud).add(new V3(0, 0.5 * U.plate, 0)), ground = o.ground ?? rn.now.base.p.y;
          for (let i = 0; i < 16; i++) { const y = lip.y - ((i * 0.9 + (F % 2) * 0.45) * U.plate * 1.6); if (y < ground) break; wine.put(lip.x + Math.sin(i + F) * 0.6 * U.s, y, lip.z, U.s * 0.35, U.s * 0.9, U.s * 0.35); } } }
      cupL.end(); wine.end();
    }, dispose() { g.parent && g.parent.remove(g); } };
  },
  /* the shuttle: a tan 1x2 plate carried in the right hand across the warp */
  shuttle(St, run, o) {
    const r = run.A.r, U = St.U, g = new THREE.Group(); St.grp.add(g); const L = new Layer(g, geo('plate1x2'), mat('tan'), 1);
    return { update(u, rn) { L.begin(); if (rn.now) { const h = handWorld(r, 'R'); _Q.setFromEuler(new E(0, rn.now.base.h + Math.PI / 2, 0, 'YXZ')); L.put(h.x, h.y - 3 * U.s, h.z, U.s * 0.6, U.s * 0.6, U.s * 0.6, _Q); } L.end(); }, dispose() { g.parent && g.parent.remove(g); } };
  },
  /* the weapon dropped: at the drawing named, what the hand held is hidden and a loose copy of it lies on the ground beside him */
  drop(St, run, o) {
    const r = run.A.r, side = o.side || 'R', piv = side === 'L' ? r.armLP : r.armRP, held = piv.children.filter(c => c.type === 'Group' && !String(c.name).startsWith('slot'))[2];
    if (!held || !held.visible) return null;
    const save = { q: r.figure.quaternion.clone(), p: r.figure.position.clone(), j: readPose(r) }, base = baseOf(r);
    const copy = held.clone(true); copy.matrixAutoUpdate = true;
    /* where it falls: from the hand at the drop drawing to the ground a stud and a half out, turned flat */
    const smp = sample(run.B, (o.at ?? 5) / 12); applyPose(r, smp.pose); applyRoot(r, base, smp.root, run.A.U); r.figure.updateMatrixWorld(true);
    held.updateMatrixWorld(true); const mw = held.matrixWorld.clone();
    r.figure.quaternion.copy(save.q); r.figure.position.copy(save.p); for (const k of JOINTS) r[k].rotation.set(...save.j[k]); r.figure.updateMatrixWorld(true);
    const p = new V3(), q = new Q(), sc = new V3(); mw.decompose(p, q, sc);
    const land = p.clone(); land.y = base.p.y + 1.2 * St.U.plate; const fw = new V3(Math.sin(base.h), 0, Math.cos(base.h)); land.addScaledVector(new V3(-fw.z, 0, fw.x), 1.5 * St.U.stud);
    const qFlat = new Q().setFromUnitVectors(new V3(0, 1, 0).applyQuaternion(q), new V3(-fw.z, 0, fw.x)).multiply(q);
    copy.scale.copy(sc); copy.visible = false; St.grp.add(copy);
    return { update(u, rn) { const tc = (u - run.at) * run.speed, F = drawing(Math.max(0, tc)), k = F - (o.at ?? 5);
      if (tc < 0 || k < 0) { held.visible = true; copy.visible = false; return; }
      held.visible = false; copy.visible = true; const x = Math.min(1, k / 3), bounce = k === 4 ? 0.8 * St.U.plate : 0;
      copy.position.copy(p).lerp(land, x); copy.position.y = lerp(p.y, land.y, x * x) + bounce; copy.quaternion.copy(q).slerp(qFlat, x); },
      dispose() { held.visible = true; copy.parent && copy.parent.remove(copy); } };
  },
  /* carried: a prop from the library, or a rock, held in front at chest height */
  async carried(St, run, o) {
    if (!o.prop) return null; const g = await propGroup(St, o.prop); if (!g) return null; St.grp.add(g); const r = run.A.r;
    return { update(u, rn) { if (!rn.now) { g.visible = false; return; } g.visible = true; const h = handWorld(r, 'R').add(handWorld(r, 'L')).multiplyScalar(0.5); g.position.copy(h).add(new V3(0, (o.lift ?? 0.5) * St.U.brick, 0)); g.rotation.set(0, rn.now.base.h, 0); }, dispose() { g.parent && g.parent.remove(g); } };
  },
};
/* a prop of odyssey/keyframes/props.json built as the runtime builds it (its parts parsed, placed by their matrices) */
let PROPS = null;
async function propsLib(St) { if (PROPS) return PROPS; const url = new URL('../../odyssey/keyframes/props.json', root.location ? location.href : 'http://x/').href; PROPS = St.ctx.props ? await St.ctx.props() : await (await fetch(url)).json(); return PROPS; }
async function propGroup(St, name, { flipScale = true } = {}) {
  const lib = await propsLib(St), P = lib[name], parse = St.ctx.parse || (root.ButterMovieator && root.ButterMovieator.parse); if (!P || !parse) { console.warn('[motion] no prop', name); return null; }
  const inner = new THREE.Group();
  for (const pt of P.parts) { const g = await parse(pt.part, pt.color); const m = pt.m; g.matrixAutoUpdate = false; g.matrix.set(m[3], m[4], m[5], m[0], m[6], m[7], m[8], m[1], m[9], m[10], m[11], m[2], 0, 0, 0, 1); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; for (const mm of [].concat(o.material)) mm.side = THREE.DoubleSide; } }); inner.add(g); }
  if (!flipScale) return inner;
  const s = St.U.s, out = new THREE.Group(); inner.scale.set(s, -s, -s); out.add(inner); return out;
}

/* ═══════════════════════ 2. REPLACEMENT TRACKS ═══════════════════════ */
/* the part groups of a Movieator rig: what the gate hides and swaps (kfBlock's own reading of the pivots' children) */
function partsOf(r, part) {
  const kids = p => p.children.filter(c => c.type === 'Group' && !String(c.name).startsWith('slot') && !/P$/.test(c.name) && c.name !== 'kfmask' && !String(c.name).startsWith('motion:'));
  const armParts = p => { const k = kids(p); return { arm: k[0] ? [k[0]] : [], hand: k[1] ? [k[1]] : [], held: k.slice(2) }; };
  switch (part) {
    case 'head': { const k = kids(r.headP), hat = k.filter(g => !String(g.name).includes('plain-head'))[1]; return k.filter(g => g !== hat); }
    case 'hat': case 'hair': { const k = kids(r.headP).filter(g => !String(g.name).includes('plain-head')); return k[1] ? [k[1]] : []; }
    case 'face': { const out = []; r.headP.traverse(o => { if (o.isMesh && o.parent === r.headP) out.push(o); }); return out; }
    case 'torso': return kids(r.torsoP);
    case 'arms': return [...armParts(r.armRP).arm, ...armParts(r.armLP).arm];
    case 'hands': return [...armParts(r.armRP).hand, ...armParts(r.armLP).hand];
    case 'held': case 'prop': return [...armParts(r.armRP).held, ...armParts(r.armLP).held];
    case 'heldR': return armParts(r.armRP).held; case 'heldL': return armParts(r.armLP).held;
    case 'legs': return [...kids(r.hipsP), ...kids(r.legRP), ...kids(r.legLP)];
    case 'body': return [...partsOf(r, 'torso'), ...partsOf(r, 'arms'), ...partsOf(r, 'legs')];
    default: return [];
  }
}
/* a group recoloured (its materials cloned, so the colour stays on this figure), restorable */
function recolor(St, groups, color, { emissive = null, glow = 0 } = {}) {
  const undo = [];
  for (const g of groups) g.traverse(o => { if (!o.isMesh || !o.material) return; const old = o.material; const arr = [].concat(old).map(m => { const c = m.clone(); if (color && c.color) c.color.copy(col(color)); if (emissive && c.emissive) { c.emissive.copy(col(emissive)); c.emissiveIntensity = glow; } return c; });
    undo.push({ o, old, now: Array.isArray(old) ? arr : arr[0] }); });
  return { on() { for (const x of undo) x.o.material = x.now; }, off() { for (const x of undo) x.o.material = x.old; }, dispose() { for (const x of undo) { x.o.material = x.old; [].concat(x.now).forEach(m => m.dispose()); } } };
}
const PRESETS = {
  /* Circe's swine: the pig's head first (a flash of her wand), then the body pink down to the feet, two drawings a part */
  pig: [{ df: 0, part: 'head', prop: 'pigMask', hide: ['hat'] }, { df: 2, part: 'torso', color: 'pig' }, { df: 2, part: 'hands', color: 'pig' }, { df: 4, part: 'arms', color: 'pig' }, { df: 6, part: 'legs', color: 'pig' }, { df: 6, part: 'held', hide: true }],
  /* Athena ageing Odysseus to the beggar (and back, reversed): grey hair, a torn brown torso, a staff */
  beggar: [{ df: 0, part: 'hair', color: 'light-bluish-grey' }, { df: 3, part: 'torso', color: 'brown' }, { df: 3, part: 'arms', color: 'brown' }, { df: 6, part: 'legs', color: 'dark-bluish-grey' }, { df: 8, part: 'heldR', prop: 'staff', hand: 'R' }],
  /* Odysseus in his youth (the boar hunt on Parnassus): his own hair, a red tunic, a spear */
  young: [{ df: 0, part: 'hat', file: '3901.dat', ldColor: 70 }, { df: 0, part: 'torso', color: '#8a1c1c' }, { df: 0, part: 'arms', color: '#8a1c1c' }, { df: 0, part: 'legs', color: '#6b5436' }, { df: 0, part: 'heldR', file: '4497.dat', ldColor: 70 }],
  restored: [{ df: 0, part: 'hair', color: 'reddish-brown' }, { df: 4, part: 'torso', color: '#7a1f1f' }, { df: 4, part: 'arms', color: '#7a1f1f' }, { df: 8, part: 'legs', color: 'tan' }],
};
const SWAPS = {
  /* transform: a list of (drawing, part, replacement) on one rig: {actor, at, to:'pig'|steps:[{df, part, prop|file|color|hide}], flash, reverse} */
  async transform(St, w) {
    const A_ = St.actor(w.actor); if (!A_) return null; const r = A_.r, steps = [];
    const list = w.steps || PRESETS[w.to] || [];
    for (const st of list) {
      const groups = partsOf(r, st.part), one = { df: st.df || 0, groups, on: null, off: null, added: null };
      if (st.prop || st.file) {
        let g = null;
        if (st.prop) { g = await propGroup(St, st.prop, { flipScale: false }); }
        else { const parse = St.ctx.parse || root.ButterMovieator.parse; g = await parse(st.file, st.ldColor ?? 16); }
        if (g) { g.name = 'motion:' + (st.prop || st.file); g.visible = false; g.traverse(o => { if (o.isMesh) o.castShadow = true; });
          const piv = st.part === 'head' || st.part === 'hat' || st.part === 'hair' ? r.headP : st.part === 'torso' ? r.torsoP : st.part === 'heldL' ? r.armLP : st.part === 'heldR' || st.part === 'held' ? r.armRP : st.part === 'legs' ? r.hipsP : r.headP;
          if (st.part === 'heldR' || st.part === 'heldL' || st.part === 'held') { const MF = root.Minifig; if (MF) { const side = st.part === 'heldL' ? 'L' : 'R', wS = MF.SLOTS['weapon' + side], aS = MF.SLOTS['arm' + side]; g.matrixAutoUpdate = false; g.matrix.set(wS[4], wS[5], wS[6], wS[1] - aS[1], wS[7], wS[8], wS[9], wS[2] - aS[2], wS[10], wS[11], wS[12], wS[3] - aS[3], 0, 0, 0, 1); } }
          piv.add(g); one.added = g; }
        const hideAlso = [].concat(st.hide || []).filter(x => typeof x === 'string').flatMap(p => partsOf(r, p));
        one.hideGroups = st.part === 'head' ? hideAlso : [...groups, ...hideAlso];
      } else if (st.color) one.color = st.color;
      else if (st.hide) one.hideGroups = groups;
      one.vis0 = (one.hideGroups || []).map(g => g.visible);
      steps.push(one);
    }
    /* the materials, mesh by mesh: the original, the step's colour (a private clone) when its step is on, and on the flash drawing
       a white-hot copy of whichever is showing; so the steps and the flash never undo each other */
    const MS = new Map(), clones = [];
    const cloneOf = (m, fn) => { const out = [].concat(m).map(x => { const c = x.clone(); fn(c); clones.push(c); return c; }); return Array.isArray(m) ? out : out[0]; };
    const meshesOf = gs => { const out = []; for (const g of gs) g.traverse(o => { if (o.isMesh && o.material) out.push(o); }); return out; };
    for (const st of steps) if (st.color) for (const o of meshesOf(st.groups)) { const ms = MS.get(o) || { orig: o.material }; ms.colored = { mat: cloneOf(ms.orig, c => c.color && c.color.copy(col(st.color))), st }; MS.set(o, ms); }
    const flashy = new Map(), flashOf = m => { if (!flashy.has(m)) flashy.set(m, cloneOf(m, c => { if (c.emissive) { c.emissive.set('#ffffff'); c.emissiveIntensity = 0.9; } })); return flashy.get(m); };
    const body = meshesOf([...partsOf(r, 'body'), ...partsOf(r, 'head'), ...partsOf(r, 'hat')]); for (const o of body) if (!MS.has(o)) MS.set(o, { orig: o.material });
    const F0 = u => drawing(Math.max(0, u - (w.at || 0)));
    const flash = w.flash !== false && w.flash !== 0;
    const isOn = (st, live, F) => !!(live ? (w.reverse ? F < st.df : F >= st.df) : w.reverse);
    return { update(u, ov) {
      const live = u >= (w.at || 0), F = F0(u), hot = live && flash && F === 0;
      for (const st of steps) { const on = isOn(st, live, F);
        if (st.added) st.added.visible = on; if (st.hideGroups) st.hideGroups.forEach((g, i) => g.visible = on ? false : st.vis0[i]); }
      for (const [o, ms] of MS) { let m = ms.colored && isOn(ms.colored.st, live, F) ? ms.colored.mat : ms.orig; if (hot) m = flashOf(m); o.material = m; }
      if (live && flash && F < 2) ov.flash = Math.max(ov.flash, F === 0 ? (w.flashAmount ?? 0.4) : 0.12);
    }, dispose() { for (const st of steps) { if (st.added) st.added.parent && st.added.parent.remove(st.added); if (st.hideGroups) st.hideGroups.forEach((g, i) => g.visible = st.vis0[i]); } for (const [o, ms] of MS) o.material = ms.orig; clones.forEach(c => c.dispose()); } };
  },
  /* the god among men: a warm rim light behind the figure (the side away from the lens), a warm emissive grade on this figure only,
     and a two-drawing glint when the disguise speaks as a god (params: actor, color, rim, warm, glint:[u...], from, until) */
  async glow(St, w) {
    const A_ = St.actor(w.actor); if (!A_) return null; const r = A_.r, U = A_.U;
    const rc = recolor(St, [...partsOf(r, 'body'), ...partsOf(r, 'head'), ...partsOf(r, 'hat')], null, { emissive: w.color || '#ffcf8a', glow: w.warm ?? 0.12 });
    const glint = recolor(St, [...partsOf(r, 'body'), ...partsOf(r, 'head'), ...partsOf(r, 'hat')], null, { emissive: '#fff2cc', glow: 0.7 });
    const L = new THREE.PointLight(w.color || '#ffc877', 0, U.H * 3.2, 1.6); St.grp.add(L); const cam = St.ctx.cam;
    return { update(u, ov) {
      const on = u >= (w.from ?? 0) && (w.until == null || u < w.until); if (!on) { rc.off(); glint.off(); L.intensity = 0; return; }
      const F = drawing(u), g = (w.glint || []).some(t => F >= drawing(t) && F < drawing(t) + 2);
      (g ? glint : rc).on(); if (g) rc.off(); else glint.off();
      const b = baseOf(r), c = cam ? v3(cam.pos) : b.p.clone().add(new V3(0, 0, 1)), away = b.p.clone().sub(c).setY(0).normalize();
      L.position.copy(b.p).addScaledVector(away, U.H * 0.7).add(new V3(0, U.H * 1.05, 0)); L.intensity = (w.rim ?? 1.6) * (g ? 1.8 : 1);
      if (g) ov.tint = { color: 'rgba(255,230,170,1)', alpha: 0.08 };
    }, dispose() { rc.dispose(); glint.dispose(); L.parent && L.parent.remove(L); } };
  },
  /* the sail: a sheet of 1x2 plates (white, a red band) hung at `at`, facing `heading`, its belly stepped slack / half / full
     (a replacement of three builds, changed on twos): {at:[x,y,z], w (studs), h (plates), heading, fill:[[u,'slack'|'half'|'full'],..]} */
  async sail(St, w) {
    const U = St.U, g = new THREE.Group(); St.grp.add(g);
    const cols = Math.round(w.w || 8), rows = Math.round((w.h || 30) / 2), L = new Layer(g, geo('plate1x2'), mat('white', { rough: 0.6 }), cols * rows, true);
    const at = pointOf(St, w.at) || new V3(), hd = w.heading || 0, depth = { slack: 0.15, half: 0.55, full: 1 }, band = col(COL['trans-red']).lerp(col('#b3121a'), 0.5), white = col('#f4f1e8');
    const stateAt = u => { let s = 'slack'; for (const [t, st] of w.fill || [[0, 'full']]) if (u >= t) s = st; return s; };
    const qh = new Q().setFromEuler(new E(Math.PI / 2, hd, 0, 'YXZ'));
    return { update(u) {
      const st = stateAt(onTwos(u)), prev = stateAt(onTwos(u) - 1 / 12), dp = (st !== prev ? (depth[st] + depth[prev]) / 2 : depth[st]) * (w.belly || 3) * U.stud;   /* one in-between drawing at a change */
      L.begin(); const fw = new V3(Math.sin(hd), 0, Math.cos(hd)), rt = new V3(Math.cos(hd), 0, -Math.sin(hd));
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const x = (i - (cols - 1) / 2) / ((cols - 1) / 2 || 1), y = j / (rows - 1 || 1), bel = dp * (1 - x * x) * (1 - Math.pow(2 * y - 1, 2) * 0.45);
        const p = at.clone().addScaledVector(rt, (i - (cols - 1) / 2) * U.stud).addScaledVector(fw, bel).add(new V3(0, -j * 2 * U.plate, 0));
        L.put(p.x, p.y, p.z, U.s, U.s, U.s * 0.8, qh, j > rows * 0.4 && j < rows * 0.6 ? band : white); }
      L.end(); }, dispose() { g.parent && g.parent.remove(g); } };
  },
  /* flames: cones of trans-orange, trans-yellow and trans-red round plates, three builds cycled on twos, a warm light in phase */
  async flames(St, w) {
    const U = St.U, g = new THREE.Group(); St.grp.add(g); const n = w.count || 1, size = w.size || 1;
    const L = new Layer(g, geo('round1x1'), mat('trans-orange', { emissive: '#ff7a1a', glow: 0.9, rough: 0.2 }), 40 * n, true);
    const light = w.light === false ? null : new THREE.PointLight('#ff8a33', 0, 80 * U.stud * size, 1.6); if (light) g.add(light);
    const places = [].concat(w.at && Array.isArray(w.at[0]) ? w.at : [w.at || [0, 0, 0]]).map(p => pointOf(St, p) || new V3());
    const cY = col(COL['trans-yellow']), cO = col(COL['trans-orange']), cR = col(COL['trans-red']);
    return { update(u) {
      const F = drawing(u), shape = F % 3; L.begin();
      places.forEach((p, pi) => { const lev = Math.round(5 * size);
        for (let k = 0; k < lev; k++) { const w_ = Math.max(1, Math.round((lev - k) * 0.8)), c = k < lev * 0.35 ? cR : k < lev * 0.7 ? cO : cY;
          for (let i = 0; i < w_; i++) { const a = rnd(shape, k, i + pi * 17) * 6.28, rr = (rnd(shape, k, i + 3) * (lev - k) / lev) * 1.2 * size * U.stud;
            L.put(p.x + Math.cos(a) * rr, p.y + k * U.plate * 1.1 + rnd(shape, k, 9) * U.plate * 0.5, p.z + Math.sin(a) * rr, U.s * (1.1 - k / lev * 0.5), U.s, U.s * (1.1 - k / lev * 0.5), null, c); } } });
      L.end(); if (light) { light.position.copy(places[0]).add(new V3(0, 2 * U.brick, 0)); light.intensity = (w.intensity ?? 1.6) * (0.85 + 0.15 * [1, 0.6, 0.85][shape]); } },
      dispose() { g.parent && g.parent.remove(g); } };
  },
};

/* ═══════════════════════ 3. BRICK FIELDS ═══════════════════════ */
/* the sea's h(x,z,t) in plates: a sum of travelling waves, each {dir (deg), len (studs), speed (studs/s), amp (share)} */
const SEA = {
  calm: { amp: 0, waves: [{ dir: 0, len: 48, speed: 3, amp: 1 }], glint: 0.04, crest: 99 },
  swell: { amp: 2, waves: [{ dir: 0, len: 48, speed: 6, amp: 0.7 }, { dir: 35, len: 29, speed: 4.5, amp: 0.2 }, { dir: -50, len: 17, speed: 3.5, amp: 0.1 }], glint: 0.02, crest: 0.8 },
  storm: { amp: 4, crest: 0.72, colors: ['#05183a', '#0b3470', '#255a96', '#b9c9d9'], waves: [{ dir: 0, len: 30, speed: 10, amp: 0.6 }, { dir: 40, len: 19, speed: 8, amp: 0.25 }, { dir: -55, len: 11, speed: 6, amp: 0.15 }], glint: 0 },
};
function seaH(P, x, z, t) { let h = 0; for (const w of P.waves) { const a = (P.dir + w.dir) * DEG, k = 2 * Math.PI / (w.len * P.stud), d = x * Math.sin(a) + z * Math.cos(a); h += w.amp * Math.sin(k * (d - w.speed * P.stud * t) + (w.ph || 0)); } return h * P.amp; }
const FIELDS = {
  /* sea: {page:'the sea'|box, state:'calm'|'swell'|'storm', amp (plates), dir (deg), tile: 2, clear:['black ship'], hide:['swell*'],
          ride:[{page, pitch (deg), heave (share)}], level (plates above the page's top at the mean)} */
  async sea(St, p) {
    const U = St.U, g = new THREE.Group(); St.grp.add(g); const pre = SEA[p.state || 'swell'] || SEA.swell;
    const P = { amp: p.amp ?? pre.amp, waves: p.waves || pre.waves, dir: p.dir || 0, stud: U.stud }, crestAt = p.crest ?? pre.crest;
    const b = p.box || St.pieceBox(p.page || 'the sea') || [-200, 0, -200, 200, 8 * U.s, 200];
    if (p.hide !== false) hidePieces(St, p.hide || ['swell*', 'splash*']);
    const T = (p.tile || 2) * U.stud, nx = Math.floor((b[3] - b[0]) / T), nz = Math.floor((b[5] - b[2]) / T), x0 = b[0] + ((b[3] - b[0]) - nx * T) / 2 + T / 2, z0 = b[2] + ((b[5] - b[2]) - nz * T) / 2 + T / 2;
    const top = b[4], mean = top + (p.level ?? Math.ceil(P.amp * 0.35 + 0.5)) * U.plate;
    const clear = (p.clear || ['black ship', 'raft']).map(l => St.pieceBox(l)).filter(Boolean).map(bb => [bb[0] + (p.clearPad ?? 0.5) * U.stud, bb[2] + (p.clearPad ?? 0.5) * U.stud, bb[3] - (p.clearPad ?? 0.5) * U.stud, bb[5] - (p.clearPad ?? 0.5) * U.stud]);
    const lee = (p.lee ?? 2.5) * U.stud, lees = clear.map(c => [c[0] - lee, c[1] - lee, c[2] + lee, c[3] + lee]);
    const cells = []; for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const x = x0 + i * T, z = z0 + j * T; if (clear.some(c => x > c[0] && x < c[2] && z > c[1] && z < c[3])) continue; cells.push([x, z, i, j, lees.some(c => x > c[0] && x < c[2] && z > c[1] && z < c[3])]); }
    const tiles = new Layer(g, geo(p.tile === 1 ? 'tile1x1' : 'tile2x2'), mat('#ffffff', { rough: p.rough ?? 0.3 }), cells.length, true);
    const crest = new Layer(g, geo('round1x1'), mat('white', { rough: 0.3 }), cells.length * 4), glint = new Layer(g, geo('roundtile1x1'), mat('trans-clear', { rough: 0.02, emissive: '#dff3ff', glow: 0.5 }), Math.max(1, Math.ceil(cells.length * 0.12)));
    const pc = pre.colors || [], deep = col(p.deep || pc[0] || '#0a3a8c'), midC = col(p.mid || pc[1] || '#1560c4'), hiC = col(p.high || pc[2] || '#3d8fdc'), foam = col(p.foam || pc[3] || '#cfe6f2'), cc = new C();
    /* the hull that rides: heave on the sea under its middle, pitch from bow to stern, the figures on it carried */
    const riders = [];
    for (const rd of p.ride || []) { const pm = St.pieceMeshes(rd.page)[0]; if (!pm) continue; const bb = pm.box, m = pm.mesh, c = new V3((bb[0] + bb[3]) / 2, bb[1], (bb[2] + bb[5]) / 2), alongZ = (bb[5] - bb[2]) > (bb[3] - bb[0]), half = (alongZ ? bb[5] - bb[2] : bb[3] - bb[0]) / 2;
      const save = { p: m.position.clone(), q: m.quaternion.clone() }; St.restore.push(() => { m.position.copy(save.p); m.quaternion.copy(save.q); m.updateMatrixWorld(true); });
      const cast = []; if (St.ctx.cast) for (const id of St.ctx.cast()) { const A_ = St.actor(id); if (!A_) continue; const q = A_.r.figure.position; if (q.x > bb[0] - 4 && q.x < bb[3] + 4 && q.z > bb[2] - 4 && q.z < bb[5] + 4 && q.y >= bb[1] - 2) cast.push(A_); }
      riders.push({ m, c, alongZ, half, rd, save, cast }); }
    const tq = u => onTwos(u);
    return { update(u) {
      const t = tq(u), F = drawing(u); tiles.begin(); crest.begin(); glint.begin();
      for (const [x, z, i, j, inLee] of cells) {
        const hr = seaH(P, x, z, t) * (inLee ? 0.35 : 1), hq = Math.round(hr), y = inLee ? Math.min(mean + hq * U.plate, top + U.plate) : mean + hq * U.plate, bot = top - U.plate, sy = Math.max(U.plate, y - bot) / (8 * U.s);
        const k = P.amp ? cl01((hr / P.amp + 1) / 2) : 0.5; cc.copy(deep).lerp(midC, cl01(k * 1.6)).lerp(hiC, cl01(k * 2 - 1)); if (((i + j) & 1) && P.amp) cc.multiplyScalar(0.93);
        const isCrest = P.amp && hr > crestAt * P.amp && seaH(P, x, z, t + 1 / 12) < hr + 0.25 * P.amp;   /* the crest: high and about to fall */
        if (isCrest) cc.lerp(foam, 0.55);
        tiles.put(x, bot, z, U.s, sy * U.s, U.s, null, cc);
        if (isCrest) { const nC = Math.min(4, 1 + Math.floor(rnd(i, j, F >> 1) * 2) + (hr > (crestAt + 0.25) * P.amp ? 2 : 0)); for (let q = 0; q < nC; q++) crest.put(x + ((q & 1) - 0.5) * U.stud * (p.tile === 1 ? 0.5 : 1), y + U.plate, z + ((q >> 1) - 0.5) * U.stud * (p.tile === 1 ? 0.5 : 1), U.s, U.s, U.s); }
        const gl = p.glint ?? pre.glint; if (gl && rnd(i, j, F) < gl) glint.put(x + (rnd(i, j, 5) - 0.5) * U.stud, y + U.plate, z + (rnd(i, j, 6) - 0.5) * U.stud, U.s, U.s * 0.5, U.s);
      }
      tiles.end(); crest.end(); glint.end();
      for (const R of riders) {
        const along = R.alongZ ? new V3(0, 0, 1) : new V3(1, 0, 0), a = R.c.clone().addScaledVector(along, -R.half * 0.8), bq = R.c.clone().addScaledVector(along, R.half * 0.8);
        const ha = seaH(P, a.x, a.z, t), hb = seaH(P, bq.x, bq.z, t), hc = seaH(P, R.c.x, R.c.z, t);
        const heave = Math.round(hc * (R.rd.heave ?? 0.5)) * U.plate + (R.rd.float !== false ? (R.rd.lift ?? 1) * U.plate : 0), lim = (R.rd.pitch ?? 4) * DEG, pitch = Math.max(-lim, Math.min(lim, Math.atan2((hb - ha) * U.plate * 0.5, R.half * 1.6)));
        const q = new Q().setFromAxisAngle(R.alongZ ? new V3(1, 0, 0) : new V3(0, 0, -1), -pitch), piv = R.c;
        const off = piv.clone().sub(piv.clone().applyQuaternion(q)); off.y += heave;
        R.m.quaternion.copy(R.save.q).premultiply(q); R.m.position.copy(R.save.p).applyQuaternion(q).add(off); R.m.updateMatrixWorld(true);
        for (const A_ of R.cast) { const f = A_.r.figure; f.position.applyQuaternion(q).add(off); f.quaternion.premultiply(q); f.updateMatrixWorld(true); }
      }
    }, dispose() { g.parent && g.parent.remove(g); }, height: (x, z, u) => mean + Math.round(seaH(P, x, z, tq(u))) * U.plate };
  },
  /* rain: clear round plates falling in streaks through the view (or a box), splashing at the ground or on the sea:
     {count, speed (studs/s), len (plates), wind:[x,z] (studs/s), box, ground (y), color, opacity} */
  async rain(St, p) {
    const U = St.U, g = new THREE.Group(), n = p.count || 420; St.grp.add(g);
    const L = new Layer(g, geo('roundtile1x1'), mat(p.color || '#e4eeff', { opacity: p.opacity ?? 0.5, rough: 0.05, emissive: p.glowColor || '#b4c8e8', glow: p.glow ?? 0.6, fog: false }), n);
    const Sp = new Layer(g, geo('round1x1'), mat('#e6f1ff', { opacity: 0.55, rough: 0.1 }), n * 2);
    const cam = St.ctx.cam, cp = cam ? v3(cam.pos) : new V3(0, 200, 400), ct = cam ? v3(cam.target) : new V3(), D = cp.distanceTo(ct), fwd = ct.clone().sub(cp).normalize(), rt = new V3(-fwd.z, 0, fwd.x).normalize(), tanH = Math.tan(((cam && cam.fov) || 45) * DEG / 2) * 1.9;
    const sea = () => St.fields.find(f => f.height);
    const drops = []; for (let i = 0; i < n; i++) { let x, z, top, ground;
      if (p.box) { x = lerp(p.box[0], p.box[3], rnd(i, 1)); z = lerp(p.box[2], p.box[5], rnd(i, 2)); top = p.box[4]; ground = p.box[1]; }
      else { const d = D * lerp(p.near ?? 0.35, p.far ?? 1.5, Math.pow(rnd(i, 3), 0.8)), lat = (rnd(i, 4) * 2 - 1) * d * tanH, q = cp.clone().addScaledVector(fwd, d).addScaledVector(rt, lat); x = q.x; z = q.z; top = cp.y + d * tanH * 0.75 + 20 * U.stud * 0.2; ground = p.ground ?? (St.pieceBox('the sea') || St.pieceBox('floor') || [0, 0, 0, 0, 0])[4]; }
      drops.push({ x, z, top, ground, ph: rnd(i, 5) }); }
    const sp = (p.speed || 90) * U.stud, len = (p.len || 3.5), wid = p.width || 0.2, wind = p.wind || [6, 0];
    return { update(u) {
      const t = onTwos(u), F = drawing(u); L.begin(); Sp.begin(); const S = sea();
      const tilt = new Q().setFromUnitVectors(new V3(0, 1, 0), new V3(wind[0] * U.stud, sp, wind[1] * U.stud).normalize());
      for (let i = 0; i < drops.length; i++) { const d = drops[i]; const gy = S ? S.height(d.x, d.z, u) + U.plate : d.ground, H = Math.max(1, d.top - gy), T_ = H / sp, x = ((t / T_) + d.ph), k = x - Math.floor(x), cyc = Math.floor(x);
        const y = d.top - k * H, dx = wind[0] * U.stud * k * T_, dz = wind[1] * U.stud * k * T_, jx = (rnd(i, cyc, 7) - 0.5) * 2 * U.stud, jz = (rnd(i, cyc, 8) - 0.5) * 2 * U.stud;
        if (y > gy + U.plate) L.put(d.x + dx + jx, y, d.z + dz + jz, U.s * wid, U.s * len, U.s * wid, tilt);
        const kN = ((t + 1 / 12) / T_ + d.ph); if (Math.floor(kN) !== cyc || k > 1 - (1 / 12) / T_ * 1.01) { /* the drawing it lands: a splash, two plates out */
          const bx = d.x + wind[0] * U.stud * T_ + jx, bz = d.z + wind[1] * U.stud * T_ + jz; if (rnd(i, cyc, 4) < (p.splash ?? 0.5)) for (let q = 0; q < 2; q++) { const a = rnd(i, cyc, q) * 6.28; Sp.put(bx + Math.cos(a) * U.stud * 0.4, gy + U.plate * (q ? 0.5 : 0), bz + Math.sin(a) * U.stud * 0.4, U.s * 0.28, U.s * 0.28, U.s * 0.28); } } }
      L.end(); Sp.end(); }, dispose() { g.parent && g.parent.remove(g); } };
  },
  /* smoke (and steam): round bricks spawned at the source every `every` drawings, rising a plate a drawing, drifting with the
     wind, swelling then thinning, gone after `life`: {at, every:4, life:36, rise:1, wind:[x,z] studs/drawing, size, color, steam} */
  async smoke(St, p) {
    const U = St.U, g = new THREE.Group(); St.grp.add(g); const life = p.life || 36, every = p.every || 4, per = Math.ceil(life / every) + 1, n = (p.sources || 1);
    const src = [].concat(p.at && Array.isArray(p.at[0]) ? p.at : [p.at || [0, 0, 0]]).map(q => pointOf(St, q) || new V3());
    const steam = !!p.steam, L2 = new Layer(g, geo('roundbrick2x2'), mat(steam ? '#f4f6f8' : '#9aa0a4', { rough: 0.9, opacity: p.opacity ?? (steam ? 0.8 : 0.92) }), per * 2 * src.length, true), L1 = new Layer(g, geo('roundbrick1x1'), mat(steam ? '#ffffff' : '#b9bdc0', { rough: 0.9, opacity: p.opacity ?? 0.9 }), per * 2 * src.length, true);
    const dark = col(p.dark || (steam ? '#e8ecef' : '#4d5256')), light = col(p.light || (steam ? '#ffffff' : '#c9cdd0')), cc = new C(), wind = p.wind || [0.35, 0.1], rise = (p.rise || (steam ? 1.6 : 1)) * U.plate, size = p.size || 1;
    return { update(u) {
      const F = drawing(u); L1.begin(); L2.begin();
      src.forEach((s0, si) => { const k0 = Math.floor(F / every);
        for (let k = k0; k > k0 - per; k--) { const age = F - k * every; if (age < 0 || age >= life || k < -per * 4) continue;
          for (let q = 0; q < 2; q++) { if (rnd(k, q, si) < (age / life) * 0.55) continue;   /* thinning: puffs drop out as they age */
            const x = s0.x + wind[0] * U.stud * age + (rnd(k, q, 3) - 0.5) * U.stud * (1 + age / 12), z = s0.z + wind[1] * U.stud * age + (rnd(k, q, 4) - 0.5) * U.stud * (1 + age / 12), y = s0.y + rise * age;
            const a = age / life, sc = size * (a < 0.3 ? lerp(0.6, 1.6, a / 0.3) : lerp(1.6, 0.35, (a - 0.3) / 0.7)); cc.copy(dark).lerp(light, a);
            (q ? L1 : L2).put(x, y, z, U.s * sc, U.s * sc * 0.8, U.s * sc, null, cc); } } });
      L1.end(); L2.end(); }, dispose() { g.parent && g.parent.remove(g); } };
  },
  /* the whirlpool: rings of tiles about a centre, the inner turning faster (radius-dependent speed), sinking toward the middle,
     foam on spiral arms: {page:'the whirlpool'|at:[x,z], radius (studs), rings, depth (plates), speed (rad/s at the rim), hide} */
  async whirlpool(St, p) {
    const U = St.U, g = new THREE.Group(); St.grp.add(g);
    const bb = p.page !== false ? St.pieceBox(p.page || 'the whirlpool') : null; if (bb && p.hide !== false) hidePieces(St, [p.page || 'the whirlpool']);
    const c = p.at ? pointOf(St, p.at) : bb ? new V3((bb[0] + bb[3]) / 2, bb[1], (bb[2] + bb[5]) / 2) : new V3(), R = (p.radius || (bb ? Math.min(bb[3] - bb[0], bb[5] - bb[2]) / 2 / U.stud : 8)) * U.stud;
    const rings = p.rings || Math.round(R / U.stud), top = c.y + (p.level ?? 1) * U.plate, depth = (p.depth || 8) * U.plate, w0 = p.speed || 0.9;
    const slots = []; for (let i = 0; i < rings; i++) { const r = (i + 0.6) / rings * R, n = Math.max(4, Math.round(2 * Math.PI * r / U.stud)); for (let j = 0; j < n; j++) slots.push([i, j, r, n]); }
    const L = new Layer(g, geo('tile1x2'), mat('#ffffff', { rough: 0.15 }), slots.length, true), foamL = new Layer(g, geo('round1x1'), mat('white'), slots.length);
    const deep = col('#06224f'), mid = col('#1257b0'), hi = col('#5aa9e6'), fc = col('#e8f6ff'), cc = new C();
    return { update(u) {
      const t = onTwos(u); L.begin(); foamL.begin();
      for (const [i, j, r, n] of slots) { const x = r / R, om = w0 * Math.pow(1 / Math.max(0.15, x), 1.1), th = j / n * 2 * Math.PI + om * t, y = top - depth * Math.pow(1 - x, 2);
        const px = c.x + Math.cos(th) * r, pz = c.z + Math.sin(th) * r; _Q.setFromEuler(new E(Math.atan2(depth * 2 * (1 - x), R) * 0.9, -th, 0, 'YXZ'));
        cc.copy(deep).lerp(mid, cl01(x * 1.4)).lerp(hi, cl01(x * 2 - 1.1)); const arm = ((th - 2.2 * Math.log(x + 0.05)) % (2 * Math.PI / 3) + 2 * Math.PI) % (2 * Math.PI / 3) < 0.3 && x > 0.25;
        if (arm) cc.lerp(fc, 0.6); L.put(px, y - U.plate, pz, U.s, U.s * 2, U.s * 0.95, _Q, cc); if (arm && (j + i) % 2 === 0) foamL.put(px, y + U.plate, pz, U.s * 0.8, U.s * 0.8, U.s * 0.8); }
      L.end(); foamL.end(); }, dispose() { g.parent && g.parent.remove(g); } };
  },
  /* mist: large translucent plates drifting at low heights, swelling in and out: {box|page, count, height (plates), drift:[x,z] studs/s, opacity, color} */
  async mist(St, p) {
    const U = St.U, g = new THREE.Group(); St.grp.add(g); const n = p.count || 36;
    const b = p.box || St.pieceBox(p.page || 'floor') || St.pieceBox('the sea') || St.pieceBox('stage plate') || [-200, 0, -200, 200, 0, 200];
    const layers = [0.18, 0.28].map(o => new Layer(g, geo('plate4x4'), mat(p.color || '#e9eef1', { opacity: (p.opacity ?? 1) * o, rough: 1 }), n));
    const drift = p.drift || [2.5, 0.8], hgt = (p.height || 6) * U.plate, W_ = b[3] - b[0], D_ = b[5] - b[2];
    return { update(u) { const t = onTwos(u); layers.forEach(L => L.begin());
      for (let i = 0; i < n; i++) { const x = b[0] + (((rnd(i, 1) * W_ + drift[0] * U.stud * t * (0.6 + rnd(i, 2) * 0.8)) % W_) + W_) % W_, z = b[2] + (((rnd(i, 3) * D_ + drift[1] * U.stud * t) % D_) + D_) % D_, y = b[4] + rnd(i, 4) * hgt;
        const sw = 0.6 + 0.4 * Math.sin(t * 0.5 + i), sc = (p.size || 1.6) * (0.7 + rnd(i, 5)) * sw; layers[i & 1].put(x, y, z, U.s * sc, U.s * 0.5, U.s * sc); }
      layers.forEach(L => L.end()); }, dispose() { g.parent && g.parent.remove(g); } };
  },
  /* lightning: at each `at` (seconds) the sky and the fill spike for two drawings (a third at a third), and a bolt of emissive clear
     plates zigzags from the cloud to the sea at `where` ([x,z], or placed across the frame by the camera): {at:[..], where, color} */
  async lightning(St, p) {
    const U = St.U, g = new THREE.Group(), sceneR = scene_(St); St.grp.add(g);
    const L = new Layer(g, geo('plate1x2'), mat('#ffffff', { emissive: '#f4f8ff', glow: 3, rough: 0.1, fog: false }), 64);
    const hemi = new THREE.HemisphereLight('#dfe8ff', '#445066', 0); g.add(hemi); const dl = new THREE.DirectionalLight('#e6eeff', 0); dl.position.set(0, 800, 0); g.add(dl);
    const cam = St.ctx.cam, cp = cam ? v3(cam.pos) : new V3(0, 200, 400), ct = cam ? v3(cam.target) : new V3();
    const strikes = (p.at || [1]).map((t, si) => { let w = p.where && (Array.isArray(p.where[0]) ? p.where[si % p.where.length] : p.where);
      if (!w) { const f = ct.clone().sub(cp).setY(0).normalize(), r = new V3(-f.z, 0, f.x), q = ct.clone().addScaledVector(f, cp.distanceTo(ct) * (p.depth ?? 0.45)).addScaledVector(r, (si % 2 ? 1 : -1) * (0.25 + rnd(si, 9) * 0.3) * cp.distanceTo(ct)); w = [q.x, q.z]; }
      const gy = p.ground ?? ((St.pieceBox('the sea') || [0, 0, 0, 0, 0])[4]), topY = gy + (p.height || 26) * U.brick, pts = []; let x = w[0], z = w[1];
      const segs = 18; for (let k = 0; k <= segs; k++) { pts.push(new V3(x, lerp(topY, gy, k / segs), z)); x += (rnd(si, k, 1) - 0.5) * 3 * U.stud; z += (rnd(si, k, 2) - 0.5) * 3 * U.stud; }
      return { F: drawing(t), pts, dir: new V3(w[0], 0, w[1]).sub(ct).setY(0) }; });
    return { update(u, ov) {
      const F = drawing(u); L.begin(); let k = 0;
      for (const s of strikes) { const a = F - s.F; if (a < 0 || a > 2) continue; k = Math.max(k, a < 2 ? 1 : 0.35);
        if (a < 2) for (let i = 0; i + 1 < s.pts.length; i++) { const p0 = s.pts[i], p1 = s.pts[i + 1], d = p1.clone().sub(p0), len = d.length(); _Q.setFromUnitVectors(new V3(0, 0, 1), d.normalize()); L.put((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2, U.s * (p.thick ?? 1.6), U.s * (p.thick ?? 1.6), len / 40, _Q); }
        dl.position.set(s.pts[0].x, s.pts[0].y, s.pts[0].z); }
      L.end(); hemi.intensity = k * (p.fill ?? 2.2); dl.intensity = k * (p.key ?? 2.6);
      if (k > 0) { ov.flash = Math.max(ov.flash, k * (p.flash ?? 0.12)); ov.sky = { color: p.sky || '#6f7fa6', k }; sceneR.background = col(p.sky || '#6f7fa6').multiplyScalar(k < 1 ? 0.55 : 1); if (sceneR.fog) { const f = sceneR.fog; f.userData = f.userData || {}; } } },
      dispose() { g.parent && g.parent.remove(g); } };
  },
  /* falling rocks: {rocks:[{from, to, at (s), frames, apex (bricks), size}], splash:'water'|'dust'}; each a cluster of grey
     bricks on a ballistic arc sampled on twos, turning 30 degrees a drawing, a trail of three fading copies, a burst where it lands */
  async rocks(St, p) {
    const U = St.U, g = new THREE.Group(); St.grp.add(g); const list = p.rocks || [p];
    const L = new Layer(g, geo('rock'), mat(p.color || 'dark-bluish-grey'), list.length), T = new Layer(g, geo('rock'), mat(p.color || 'dark-bluish-grey', { opacity: 0.3 }), list.length * 3), S = new Layer(g, geo('round1x1'), mat(p.splash === 'dust' ? 'tan' : 'white'), list.length * 20);
    const R = list.map((r, i) => { const a = pointOf(St, r.from) || new V3(0, 200, 0), b = pointOf(St, r.to) || new V3(0, 0, 0); const fr = r.frames || Math.max(4, Math.round(a.distanceTo(b) / (5 * U.stud))), apex = (r.apex ?? 3) * U.brick;
      return { a, b, fr, apex, F0: drawing(r.at || 0), sc: (r.size || 1.4) * U.s, i }; });
    const at = (r, k) => { const x = k / r.fr, q = r.a.clone().lerp(r.b, x); q.y += r.apex * 4 * x * (1 - x) - 0 * x; return q; };
    return { update(u) { const F = drawing(u); L.begin(); T.begin(); S.begin();
      for (const r of R) { const k = F - r.F0; if (k < 0) continue; if (k <= r.fr) { const q = at(r, k); _Q.setFromEuler(new E(k * 30 * DEG, k * 13 * DEG, 0)); L.put(q.x, q.y, q.z, r.sc, r.sc, r.sc, _Q); for (let j = 1; j <= 3 && k - j >= 0; j++) { const w = at(r, k - j); T.put(w.x, w.y, w.z, r.sc, r.sc, r.sc, _Q); } }
        burst(S, r.b, r.fr, k, { U, n: 18, life: 10, speed: 1.3, up: 3, seed: 11 + r.i }); }
      L.end(); T.end(); S.end(); }, dispose() { g.parent && g.parent.remove(g); } };
  },
};

/* ═══════════════════════ 4. OPTICS ═══════════════════════ */
/* the overlay a stage asks for, painted over the rendered frame on the host's 2D canvas: the marked past (desaturated, warm, a
   vignette), a tint, a white flash */
function overlay(g, W, H, ov) {
  if (!ov) return;
  if (ov.past) { const k = ov.past, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(g.canvas, 0, 0);
    g.save(); g.filter = `saturate(${lerp(1, 0.55, k)}) sepia(${0.32 * k}) contrast(${lerp(1, 1.06, k)}) brightness(${lerp(1, 1.04, k)})`; g.drawImage(c, 0, 0); g.restore();
    g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.28 * k; g.fillStyle = '#e0a060'; g.fillRect(0, 0, W, H); g.restore();
    const r = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95); r.addColorStop(0, 'rgba(40,20,5,0)'); r.addColorStop(1, `rgba(40,20,5,${0.55 * k})`); g.fillStyle = r; g.fillRect(0, 0, W, H); }
  if (ov.tint) { g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = ov.tint.alpha ?? 0.2; g.fillStyle = ov.tint.color; g.fillRect(0, 0, W, H); g.restore(); }
  if (ov.flash) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = cl01(ov.flash); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.restore(); }
}
/* the exporters' compositor: two rendered frames (base64 JPEG) laid together.
     dissolve  a crossfade: (1-w) a + w b
     double    a double exposure: b added over a at 40% x w (additive)
     fade      a to black (w: the share of black); b unused
     past      a in the marked past's grade (w its strength) */
function loadImg(b64) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = 'data:image/jpeg;base64,' + b64; }); }
async function composite(o) {
  const a = await loadImg(o.a), b = o.b ? await loadImg(o.b) : null, W = a.width, H = a.height, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), w = cl01(o.w ?? 0.5);
  g.drawImage(a, 0, 0);
  if (o.op === 'dissolve' && b) { g.globalAlpha = w; g.drawImage(b, 0, 0, W, H); g.globalAlpha = 1; }
  else if (o.op === 'double' && b) { /* the incoming laid over the outgoing at 40% (additive), rising over the first half; then, unless
       resolve is false, the double exposure resolves into the incoming */
    const k = o.resolve === false ? 1 : Math.min(1, w * 2); g.globalCompositeOperation = 'lighter'; g.globalAlpha = (o.strength ?? 0.4) * k; g.drawImage(b, 0, 0, W, H); g.globalCompositeOperation = 'source-over';
    if (o.resolve !== false && w > 0.5) { g.globalAlpha = (w - 0.5) * 2; g.drawImage(b, 0, 0, W, H); } g.globalAlpha = 1; }
  else if (o.op === 'fade') { g.fillStyle = o.color || '#000'; g.globalAlpha = w; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  else if (o.op === 'past') overlay(g, W, H, { past: w });
  return c.toDataURL('image/jpeg', o.quality || 0.92).split(',')[1];
}
/* a transition's weight at a frame of its overlap (n frames): stepped on twos, so a dissolve at 12 fps changes every frame and at
   24 every other; `ease` inOut by default */
function transitionWeight(k, n, ease = 'inOut') { return (EASE[ease] || sm)((k + 0.5) / Math.max(1, n)); }

/* ── the take's hook: a stage per key that names motion (the key's own spec, or the plan's keys[id]) ── */
async function takeStage(T, plan, ctx) {
  const byKey = new Map(), P = (plan && plan.keys) || {};
  for (const K of T.keys) { const spec = Object.assign({}, K.k.motion || K.k.fields || K.k.swaps || K.k.optical ? { motion: K.k.motion, fields: K.k.fields, swaps: K.k.swaps, optical: K.k.optical } : {}, P[K.id] || {});
    if (!named(spec)) continue; const St = await stage(spec, ctx); St.show(false); byKey.set(K.id, St); }
  if (!byKey.size) return null;
  const H = { ov: null, byKey, frame(t, key) { H.ov = null; for (const [id, St] of byKey) { const on = key && key.id === id; St.show(on); if (on) H.ov = St.frame(t - (key.t || 0)); } return H.ov; },
    dispose() { for (const St of byKey.values()) St.dispose(); byKey.clear(); } };
  return H;
}

root.OdysseyMotion = { CLIPS, GAITS, PRESETS, SEA, EASE, JOINTS, drawing, onTwos, bind, sample, gaitSample, readPose, applyPose, applyRoot, named, stage, takeStage,
  FIELDS, SWAPS, ACC, geo, mat, Layer, burst, seaH, partsOf, overlay, composite, transitionWeight, handWorld, rnd, version: 1 };
})(typeof window !== 'undefined' ? window : globalThis);
