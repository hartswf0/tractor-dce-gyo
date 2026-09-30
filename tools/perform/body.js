/* tools/perform/body.js — the body the performance engine measures: the take's blocking at any t, the sheet laid over it exactly as
   film-readymades/choreo.js lays it (the additive layer's clamp rule, the ship's riders), and forward kinematics on the film's own
   minifig pivot tree, so every metric, temperature and previz frame is computed on the pose the render will draw.

   The rig (film-readymades/production/Film-Butter-Odyssey.html, world/minifig.js skeleton):
     figure  position p, rotation (pitch, heading, roll) in three's 'YXZ' order, uniform scale s
       flip  a half turn about x: inside it the LDraw frame (y down, the figure faces -z)
         hipsP  (0, hipsY - hips.dy, 0), hipsY = -40 for the film's figures: the soles at the figure's origin
           torsoP (0,-32,0) rot (lean, -twist, -roll)       legRP/legLP (0,12,0) rot (leg pitch, 0, 0)
             armRP (-15.552, 9, 0) / armLP (15.552, 9, 0) rot (arm pitch, y, -out / +out)
             headP (0,-24,0) rot (head pitch, -yaw, z)
   Points (pivot-local, LDraw units; the first seven are tools/choreograph.js's density points):
     face headP(0,-12,-11) crown headP(0,-26,0) chest torsoP(0,10,-10) handR armRP(-8,22,-10) handL armLP(8,22,-10)
     footR legRP(-6,26,-6) footL legLP(6,26,-6); and for the stick figure: hips, neck, shoulders, hip joints, the head's centre,
     the gaze (a unit vector out of the face).
   Works in node (require) and in a page (window.PerformBody). Pure: a pose at t is a function of t. */
(function (root) {
'use strict';
const Choreo = typeof module !== 'undefined' && module.exports ? require('../../film-readymades/choreo.js') : root.OdysseyChoreo;
const JOINTS = ['armRP', 'armLP', 'headP', 'torsoP', 'legRP', 'legLP'];
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }, cl01 = v => Math.max(0, Math.min(1, v)), lerp = (a, b, u) => a + (b - a) * u;
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const angLerp = (a, b, u) => a + wrap(b - a) * u;

/* ═════ the blocking: the take's castAt (film-readymades/odyssey-take.js) on the marks, for one figure at t ═════ */
function Blocking(M) {
  const K = M.keys;
  const keyIndexAt = t => { let i = 0; for (let j = 0; j < K.length; j++) if (K[j].t <= t) i = j; return i; };
  const win = (j, t) => { const k = K[j]; return k && k.win && t >= k.win[0] && t <= k.win[1] ? k : null; };
  const zero = { armRP: [0, 0, 0], armLP: [0, 0, 0], headP: [0, 0, 0], torsoP: [0, 0, 0], legRP: [0, 0, 0], legLP: [0, 0, 0] };
  const cp = j => Object.fromEntries(JOINTS.map(k => [k, (j[k] || [0, 0, 0]).slice()]));
  function at(id, t) {
    const i = keyIndexAt(t), w = win(i + 1, t) || win(i, t);
    if (!w) { const s = K[i].snap[id]; return s ? { ...s, j: cp(s.j), walk: 0, moving: false, key: K[i].id } : null; }
    const j = K.indexOf(w), A = K[j - 1].snap, B = w.snap, u = cl01((t - w.win[0]) / (w.win[1] - w.win[0]));
    const b = B[id]; if (!b) return null; const a = A[id] || b, m = w.moves && w.moves[id];
    if (!m) { const s = u < 0.5 ? a : b; return { ...s, j: cp(s.j), walk: 0, moving: false, key: w.id }; }
    const H = (M.H && M.H[id]) || 60, yS0 = a.sat ? (b.sat ? a.p[1] : b.p[1]) : a.p[1], yS1 = b.sat ? (a.sat ? b.p[1] : yS0) : b.p[1];
    const s = { vis: u < 0.5 ? a.vis : b.vis, sat: false, air: b.air, rot: [lerp(a.rot[0], b.rot[0], u), lerp(a.rot[1], b.rot[1], u)], j: {}, walk: 0, moving: true, key: w.id, u, win: w.win };
    const r0 = a.sat ? 0.22 : 0, s0 = b.sat ? 0.22 : 0, span = Math.max(0.05, 1 - r0 - s0), stand = b.sat ? zero : b.j, from = a.sat ? zero : a.j;
    if (u < r0) { const v = sm(u / r0); s.p = [a.p[0], lerp(a.p[1], yS0, v), a.p[2]]; s.h = a.h; for (const k of JOINTS) s.j[k] = a.j[k].map((x, q) => lerp(x, stand[k][q], v)); s.sat = true; }
    else if (u > 1 - s0) { const v = sm((u - (1 - s0)) / s0); s.p = [b.p[0], lerp(yS1, b.p[1], v), b.p[2]]; s.h = angLerp(m.dir, b.h, v); for (const k of JOINTS) s.j[k] = stand[k].map((x, q) => lerp(x, b.j[k][q], v)); s.sat = v > 0.5; }
    else { const v = (u - r0) / span, e = m.walk ? v * v * (3 - 2 * v) * 0.25 + v * 0.75 : sm(v);
      s.p = [lerp(a.p[0], b.p[0], e), lerp(yS0, yS1, e), lerp(a.p[2], b.p[2], e)];
      if (m.walk) { const turn = sm(cl01(v * 6)), back = sm(cl01((v - 0.82) / 0.18)); s.h = angLerp(angLerp(a.h, m.dir, turn), b.sat ? m.dir : b.h, b.sat ? 0 : back);
        const amt = sm(cl01(v * 8)) * sm(cl01((1 - v) * 8)), ph = e * m.d / (0.42 * H) * Math.PI; s.walk = amt; s.ph = ph;
        for (const k of JOINTS) s.j[k] = (a.sat ? stand : from)[k].map((x, q) => lerp(x, stand[k][q], sm(v)));
        s.j.legRP = [s.j.legRP[0] + 0.62 * amt * Math.sin(ph), 0, 0]; s.j.legLP = [s.j.legLP[0] - 0.62 * amt * Math.sin(ph), 0, 0];
        s.j.armRP = [s.j.armRP[0] - 0.45 * amt * Math.sin(ph), s.j.armRP[1], s.j.armRP[2]]; s.j.armLP = [s.j.armLP[0] + 0.45 * amt * Math.sin(ph), s.j.armLP[1], s.j.armLP[2]]; }
      else { s.h = angLerp(a.h, b.h, sm(v)); for (const k of JOINTS) s.j[k] = from[k].map((x, q) => lerp(x, stand[k][q], sm(v))); } }
    return s;
  }
  const ids = [...new Set(K.flatMap(k => Object.keys(k.snap)))];
  const lying = s => Math.abs(s.rot[0]) > 0.7 || Math.abs(s.rot[1]) > 0.7;
  return { at, ids, lying, keyIndexAt, K };
}

/* ═════ small affine maths: 3x4 row-major [r00 r01 r02 tx, r10 r11 r12 ty, r20 r21 r22 tz] ═════ */
const I = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
function mul(a, b) { const o = new Array(12);
  for (let r = 0; r < 3; r++) { for (let c = 0; c < 3; c++) o[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c];
    o[r * 4 + 3] = a[r * 4] * b[3] + a[r * 4 + 1] * b[7] + a[r * 4 + 2] * b[11] + a[r * 4 + 3]; } return o; }
const ap = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3], m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7], m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11]];
const apR = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[4] * v[0] + m[5] * v[1] + m[6] * v[2], m[8] * v[0] + m[9] * v[1] + m[10] * v[2]];
const Rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0]; };
const Ry = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0]; };
const Rz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0]; };
const T3 = (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z];
const S3 = k => [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0];
const eXYZ = (x, y, z) => mul(mul(Rx(x), Ry(y)), Rz(z));      /* three's default Euler order */
const eYXZ = (x, y, z) => mul(mul(Ry(y), Rx(x)), Rz(z));
/* a rotation matrix back to YXZ Euler (three's setFromRotationMatrix for 'YXZ') */
function toYXZ(m) { const m23 = m[6], x = Math.asin(-Math.max(-1, Math.min(1, m23)));
  if (Math.abs(m23) < 0.9999999) return [x, Math.atan2(m[2], m[10]), Math.atan2(m[4], m[5])]; return [x, Math.atan2(-m[8], m[0]), 0]; }

/* ═════ the pose at t: blocking + sheet (film-readymades/choreo.js applyRig / addRig semantics) ═════ */
const CLAMP = Choreo.CLAMP;
function within(ch, base, v) { const c = CLAMP[ch]; if (!c) return v; const lo = Math.min(c[0], base), hi = Math.max(c[1], base); return Math.max(lo, Math.min(hi, v)); }
/* the figure's joints and root at t: {p, rot:[pitch,h,roll], hipsDy, j:{pivot:[x,y,z]}, vis, sat, walk, lying} */
function poseAt(ctx, id, t, extra) {
  const { B, C, M } = ctx, s = B.at(id, t); if (!s) return null;
  const P = { id, t, vis: !!s.vis, sat: !!s.sat, walk: s.walk || 0, moving: !!s.moving, lying: B.lying(s), p: s.p.slice(), rot: [s.rot[0], s.h, s.rot[1]], hipsDy: 0, j: JSON.parse(JSON.stringify(s.j)), key: s.key };
  const held = (M.held && M.held[id]) || {}; P.hipsY = held.hipsY != null ? held.hipsY : -40; P.scale = held.scale || M.scale || 1;
  let v = C ? Choreo.sampleActor(C, id, t) : null;
  /* extra: channel deltas laid over the sheet's sum (a solver trying a pose: the hand to the spear) */
  if (extra) { v = Object.assign({}, v || {}); for (const [k, d] of Object.entries(extra)) v[k] = (v[k] || 0) + d; }
  if (v && ((C && C.layer) || (extra ? 'add' : 'abs')) === 'add') {
    const g = k => v[k] || 0;
    P.p = [P.p[0] + g('root.x'), P.p[1] + g('root.y'), P.p[2] + g('root.z')];
    if (g('root.h') || g('root.pitch') || g('root.roll')) { const e = toYXZ(eYXZ(P.rot[0], P.rot[1], P.rot[2])); P.rot = [e[0] + g('root.pitch'), e[1] + g('root.h'), e[2] + g('root.roll')]; }
    if (v['hips.dy'] != null) P.hipsDy = v['hips.dy'];
    const T = P.j.torsoP; P.j.torsoP = [within('torso.lean', T[0], T[0] + g('torso.lean')), -within('torso.twist', -T[1], -T[1] + g('torso.twist')), -within('torso.roll', -T[2], -T[2] + g('torso.roll'))];
    const Hd = P.j.headP; P.j.headP = [within('head.pitch', Hd[0], Hd[0] + g('head.pitch')), -within('head.yaw', -Hd[1], -Hd[1] + g('head.yaw')), Hd[2]];
    for (const sd of ['R', 'L']) { const k = 'arm' + sd + 'P', A = P.j[k], sg = sd === 'R' ? -1 : 1, o0 = A[2] * sg;
      P.j[k] = [within('arm.' + sd + '.pitch', A[0], A[0] + g('arm.' + sd + '.pitch')), A[1], sg * within('arm.' + sd + '.out', o0, o0 + g('arm.' + sd + '.out'))];
      const lk = 'leg' + sd + 'P'; if (g('leg.' + sd + '.pitch')) P.j[lk] = [within('leg.' + sd + '.pitch', P.j[lk][0], P.j[lk][0] + g('leg.' + sd + '.pitch')), 0, 0]; }
    P.hand = { R: v['hand.R.roll'] || 0, L: v['hand.L.roll'] || 0 };
  } else if (v) {   /* the absolute layer: the servo's position where the sheet has the channel */
    const o = k => v[k];
    if (o('root.x') != null) P.p = [o('root.x'), o('root.y') ?? P.p[1], o('root.z')]; if (o('root.h') != null) P.rot[1] = o('root.h');
    if (o('root.pitch') != null) P.rot[0] = o('root.pitch'); if (o('root.roll') != null) P.rot[2] = o('root.roll'); if (o('hips.dy') != null) P.hipsDy = o('hips.dy');
    const T = P.j.torsoP; P.j.torsoP = [o('torso.lean') ?? T[0], o('torso.twist') != null ? -o('torso.twist') : T[1], o('torso.roll') != null ? -o('torso.roll') : T[2]];
    const Hd = P.j.headP; P.j.headP = [o('head.pitch') ?? Hd[0], o('head.yaw') != null ? -o('head.yaw') : Hd[1], Hd[2]];
    for (const sd of ['R', 'L']) { const k = 'arm' + sd + 'P', A = P.j[k], out = o('arm.' + sd + '.out'); P.j[k] = [o('arm.' + sd + '.pitch') ?? A[0], A[1], out != null ? (sd === 'R' ? -out : out) : A[2]];
      if (o('leg.' + sd + '.pitch') != null) P.j['leg' + sd + 'P'] = [o('leg.' + sd + '.pitch'), 0, 0]; }
    P.hand = { R: v['hand.R.roll'] || 0, L: v['hand.L.roll'] || 0 };
  } else P.hand = { R: 0, L: 0 };
  /* the ship: its riders turned about the pivot with the hull and lifted with its heave (choreo.js applyShip) */
  if (C && C.rigs) for (const [rid, R] of Object.entries(C.rigs)) { if (!(R.type === 'ship' || rid === 'ship') || !(R.riders || []).includes(id)) continue;
    const sv = Choreo.sampleRig(C, rid, t) || {}, Q = mul(eYXZ(sv.pitch || 0, R.yaw || 0, sv.roll || 0), eYXZ(0, -(R.yaw || 0), 0)), piv = R.pivot, qp = apR(Q, piv);
    const off = [piv[0] - qp[0], piv[1] - qp[1] + (sv.heave || 0), piv[2] - qp[2]], np = apR(Q, P.p); P.p = [np[0] + off[0], np[1] + off[1], np[2] + off[2]];
    const e = toYXZ(mul(Q, eYXZ(P.rot[0], P.rot[1], P.rot[2]))); P.rot = e; P.ship = { pitch: sv.pitch || 0, roll: sv.roll || 0, heave: sv.heave || 0 }; }
  return P;
}

/* ═════ forward kinematics: the pose to world points ═════ */
const LOCAL = { face: ['headP', [0, -12, -11]], crown: ['headP', [0, -26, 0]], head: ['headP', [0, -12, 0]], neck: ['torsoP', [0, 0, 0]], chest: ['torsoP', [0, 10, -10]],
  hips: ['hipsP', [0, 0, 0]], shR: ['armRP', [0, 0, 0]], shL: ['armLP', [0, 0, 0]], elR: ['armRP', [-4, 12, -6]], elL: ['armLP', [4, 12, -6]], handR: ['armRP', [-8, 22, -10]], handL: ['armLP', [8, 22, -10]],
  hipR: ['legRP', [-6, 0, 0]], hipL: ['legLP', [6, 0, 0]], kneeR: ['legRP', [-6, 14, -2]], kneeL: ['legLP', [6, 14, -2]], footR: ['legRP', [-6, 26, -6]], footL: ['legLP', [6, 26, -6]] };
const DENSITY = ['face', 'crown', 'chest', 'handR', 'handL', 'footR', 'footL'];
function frames(P) {
  const F = mul(mul(mul(T3(...P.p), eYXZ(P.rot[0], P.rot[1], P.rot[2])), S3(P.scale)), Rx(Math.PI));
  const hips = mul(F, T3(0, P.hipsY - P.hipsDy, 0)), J = P.j;
  const torso = mul(mul(hips, T3(0, -32, 0)), eXYZ(...J.torsoP));
  return { figure: F, hipsP: hips, torsoP: torso, legRP: mul(mul(hips, T3(0, 12, 0)), eXYZ(...J.legRP)), legLP: mul(mul(hips, T3(0, 12, 0)), eXYZ(...J.legLP)),
    armRP: mul(mul(torso, T3(-15.552, 9, 0)), eXYZ(...J.armRP)), armLP: mul(mul(torso, T3(15.552, 9, 0)), eXYZ(...J.armLP)), headP: mul(mul(torso, T3(0, -24, 0)), eXYZ(...J.headP)) };
}
function points(P) {
  const Fr = frames(P), out = {};
  for (const [k, [pv, l]] of Object.entries(LOCAL)) out[k] = ap(Fr[pv], l);
  const g = apR(Fr.headP, [0, 0, -1]), n = Math.hypot(...g) || 1; out.gaze = g.map(x => x / n);     /* the face looks out along the head's -z (LDraw) */
  const fw = apR(Fr.torsoP, [0, 0, -1]), fn = Math.hypot(...fw) || 1; out.front = fw.map(x => x / fn);
  /* a held long prop (a spear, the stake) along the forearm's grip axis: the hand's local +y/-z blend, a bar rising out of the fist */
  for (const sd of ['R', 'L']) { const d = apR(Fr['arm' + sd + 'P'], [0, -0.35, -1]), dn = Math.hypot(...d) || 1; out['grip' + sd] = d.map(x => x / dn); }
  return out;
}
/* a scene context: marks, the sheet (or null: the blocking alone) */
function context(M, C) { const B = Blocking(M); if (C) Choreo.compile(C); return { M, C, B, ids: B.ids.filter(id => M.keys.some(k => k.snap[id] && k.snap[id].vis)) }; }
function sample(ctx, id, t, extra) { const P = poseAt(ctx, id, t, extra); if (!P) return null; P.pts = points(P); return P; }

/* a world point into a pivot's own frame (the frame's rotation is a uniform scale times a rotation: the inverse is its transpose / s^2) */
function toLocal(m) { const s2 = m[0] * m[0] + m[4] * m[4] + m[8] * m[8];
  return p => { const d = [p[0] - m[3], p[1] - m[7], p[2] - m[11]]; return [(m[0] * d[0] + m[4] * d[1] + m[8] * d[2]) / s2, (m[1] * d[0] + m[5] * d[1] + m[9] * d[2]) / s2, (m[2] * d[0] + m[6] * d[1] + m[10] * d[2]) / s2]; }; }
const API = { toLocal, Blocking, poseAt, points, frames, sample, context, JOINTS, LOCAL, DENSITY, wrap, angLerp, sm, lerp, cl01, eYXZ, eXYZ, mul, ap, apR, toYXZ };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
root.PerformBody = API;
})(typeof window !== 'undefined' ? window : globalThis);
