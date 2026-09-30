/* lib/rig.ts — the rig desk's minifigure: one actor's choreography (odyssey-choreo/1, layer 'add') over the take's blocking, posed by
   forward kinematics on the film's own skeleton, with a director's layer on top. Pure functions of their arguments; no module state,
   no clock, no imports: the nodes (project.MinifigRig, project.RigDensity) and the desk's tools (tools/rig_*.mjs) run the same code.

   What it follows, line for line where it can:
     sampling      film-readymades/choreo.js (keys [t, v, ease]; layers 'channel@layer' summed; the sheet drawn on twos)
     blocking      film-readymades/odyssey-take.js castAt (each key's snapshot held, a seam's window eased: rise, walk, sit)
     acting layer  film-readymades/choreo.js addRig (every channel an offset over the blocked pose, held inside the toy's limits but
                   never pulled back past where the blocking put the joint; hand roll and hips.dy are the value itself)
     skeleton      world/minifig.js (figure -> flip (x half turn) -> hipsP -> torsoP -> headP, armRP, armLP; hipsP -> legRP, legLP;
                   LDraw units inside the flip, y down, the figure facing -z there and +z in the world)
     density       tools/choreograph.js density (seven points on the body, moving if one moved more than 0.5% of the figure's height
                   since the drawing before; a figure counts while its head or hips is in frame)
   The take's performance layer (a speaker's face, a listener's carriage) is not here: it moves the head a little more than the rig. */

export type Key = [number, number] | [number, number, string];
export type V3 = [number, number, number];
export type M34 = number[];   /* a rigid transform: rotation rows r00 r01 r02 r10 .. r22, then translation tx ty tz (12 numbers) */

export interface Snap { vis: boolean; p: number[]; h: number; rot: number[]; sat: boolean; j: Record<string, number[]> }
export interface BKey { t: number; win: [number, number] | null; snap: Snap | null; move: { d: number; walk: boolean; dir: number } | null; prev: Snap | null }
export interface Ship { pivot: number[]; yaw: number; channels: Record<string, Key[]> }
export interface ActorSheet {
  scene: string; actor: string; step: string; layer: string; total: number; H: number; hipsY: number; scale: number;
  held: { R: number; L: number }; colour: number[]; keys: BKey[]; lanes: Record<string, Key[]>; ship: Ship | null;
  holds: { t0: number; t1: number; why: string }[];
}

export const CH = ['root.x', 'root.z', 'root.y', 'root.h', 'root.pitch', 'root.roll', 'hips.dy', 'torso.lean', 'torso.twist', 'torso.roll', 'head.yaw', 'head.pitch',
  'arm.R.pitch', 'arm.L.pitch', 'arm.R.out', 'arm.L.out', 'hand.R.roll', 'hand.L.roll', 'leg.R.pitch', 'leg.L.pitch'];
/** the director's props on project.MinifigRig: one per channel (an offset, the '@dir' layer) */
export const PROP_OF: Record<string, string> = {
  'root.x': 'rootX', 'root.z': 'rootZ', 'root.y': 'rootY', 'root.h': 'rootH', 'root.pitch': 'rootPitch', 'root.roll': 'rootRoll', 'hips.dy': 'hipsDy',
  'torso.lean': 'torsoLean', 'torso.twist': 'torsoTwist', 'torso.roll': 'torsoRoll', 'head.yaw': 'headYaw', 'head.pitch': 'headPitch',
  'arm.R.pitch': 'armRPitch', 'arm.L.pitch': 'armLPitch', 'arm.R.out': 'armROut', 'arm.L.out': 'armLOut', 'hand.R.roll': 'handRRoll', 'hand.L.roll': 'handLRoll',
  'leg.R.pitch': 'legRPitch', 'leg.L.pitch': 'legLPitch' };
/** ...and a weight per part of the body on the generated layers (1 keeps the choreographer's pass, 0 mutes it there) */
export const GROUP_OF: Record<string, string> = {
  'root.x': 'wRoot', 'root.z': 'wRoot', 'root.y': 'wRoot', 'root.h': 'wRoot', 'root.pitch': 'wRoot', 'root.roll': 'wRoot', 'hips.dy': 'wTorso',
  'torso.lean': 'wTorso', 'torso.twist': 'wTorso', 'torso.roll': 'wTorso', 'head.yaw': 'wHead', 'head.pitch': 'wHead',
  'arm.R.pitch': 'wArmR', 'arm.R.out': 'wArmR', 'hand.R.roll': 'wArmR', 'arm.L.pitch': 'wArmL', 'arm.L.out': 'wArmL', 'hand.L.roll': 'wArmL',
  'leg.R.pitch': 'wLegs', 'leg.L.pitch': 'wLegs' };
export const GROUPS = ['wRoot', 'wTorso', 'wHead', 'wArmR', 'wArmL', 'wLegs'];
export const DIR_LAYER = 'dir';
const CLAMP: Record<string, [number, number]> = { 'torso.lean': [-0.3, 0.38], 'torso.twist': [-0.55, 0.55], 'torso.roll': [-0.16, 0.16], 'head.yaw': [-1.45, 1.45], 'head.pitch': [-0.22, 0.22],
  'arm.R.pitch': [-3.2, 1.05], 'arm.L.pitch': [-3.2, 1.05], 'arm.R.out': [-0.2, 0.55], 'arm.L.out': [-0.2, 0.55], 'hand.R.roll': [-1.3, 1.3], 'hand.L.roll': [-1.3, 1.3],
  'leg.R.pitch': [-1.6, 0.95], 'leg.L.pitch': [-1.6, 0.95], 'hips.dy': [-14, 14] };
const JOINTS = ['armRP', 'armLP', 'headP', 'torsoP', 'legRP', 'legLP'];

/* ── sampling ── */
function cl01(v: number): number { return Math.max(0, Math.min(1, v)); }
function sm(u: number): number { return u * u * (3 - 2 * u); }
function lerp(a: number, b: number, u: number): number { return a + (b - a) * u; }
function wrapTo(a: number, ref: number): number { while (a - ref > Math.PI) a -= 2 * Math.PI; while (a - ref < -Math.PI) a += 2 * Math.PI; return a; }
function wrap(a: number): number { return wrapTo(a, 0); }
function angLerp(a: number, b: number, u: number): number { return a + wrap(b - a) * u; }
function ease(name: string | undefined, u: number): number {
  switch (name) {
    case 'linear': return u;
    case 'in': return u * u;
    case 'out': return 1 - (1 - u) * (1 - u);
    case 'step': case 'hold': return u >= 1 ? 1 : 0;
    case 'back': { const s = 1.4, v = u - 1; return v * v * ((s + 1) * v + s) + 1; }
    default: return sm(u);
  }
}
export function drawT(t: number, step: string): number { const f = step === 'ones' ? 24 : step === 'threes' ? 8 : 12; return Math.floor(t * f + 1e-6) / f; }
export function sampleKeys(K: Key[], t: number, ch: string): number | null {
  if (!K || !K.length) return null;
  if (t <= K[0][0]) return K[0][1];
  let lo = 0, hi = K.length - 1;
  if (t >= K[hi][0]) return K[hi][1];
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (K[m][0] <= t) lo = m; else hi = m; }
  const a = K[lo], b = K[hi], u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
  const bv = ch.split('@')[0] === 'root.h' ? wrapTo(b[1], a[1]) : b[1];
  return a[1] + (bv - a[1]) * ease(b[2] as string | undefined, cl01(u));
}
export interface Director { offsets: Record<string, number>; weights: Record<string, number> }
/** the actor's channels at t: the generated layers (each part of the body weighted) plus the director's offsets; absent if unkeyed */
export function channelsAt(S: ActorSheet, t: number, D: Director | null): Record<string, number> {
  const tq = drawT(t, S.step), v: Record<string, number> = {};
  for (const [key, K] of Object.entries(S.lanes)) {
    const x = sampleKeys(K, tq, key); if (x == null) continue;
    const ch = key.split('@')[0], w = D ? (D.weights[GROUP_OF[ch]] ?? 1) : 1;
    v[ch] = (v[ch] || 0) + x * w;
  }
  if (D) for (const [ch, o] of Object.entries(D.offsets)) if (o) v[ch] = (v[ch] || 0) + o;
  return v;
}

/* ── the blocking: castAt for one figure ── */
export interface Blocked { vis: boolean; p: number[]; h: number; rot: number[]; sat: boolean; j: Record<string, number[]>; walk: number }
function zeroJ(): Record<string, number[]> { const o: Record<string, number[]> = {}; for (const k of JOINTS) o[k] = [0, 0, 0]; return o; }
function copySnap(s: Snap): Blocked { const j: Record<string, number[]> = {}; for (const k of JOINTS) j[k] = (s.j[k] || [0, 0, 0]).slice(); return { vis: s.vis, p: s.p.slice(), h: s.h, rot: (s.rot || [0, 0]).slice(), sat: s.sat, j, walk: 0 }; }
export function blockingAt(S: ActorSheet, t: number): Blocked | null {
  const K = S.keys; let i = 0;
  for (let q = 0; q < K.length; q++) if (K[q].t <= t) i = q;
  const inWin = (q: number) => { const k = K[q]; return k && k.win && t >= k.win[0] && t <= k.win[1] ? q : -1; };
  const w = inWin(i + 1) >= 0 ? i + 1 : inWin(i);
  if (w < 0) return K[i].snap ? copySnap(K[i].snap as Snap) : null;
  const W = K[w], b = W.snap; if (!b) return null;
  const a = W.prev || b, m = W.move, win = W.win as [number, number], u = cl01((t - win[0]) / (win[1] - win[0]));
  if (!m) return copySnap(u < 0.5 ? a : b);
  const s: Blocked = { vis: u < 0.5 ? a.vis : b.vis, p: [0, 0, 0], h: 0, rot: [lerp((a.rot || [0, 0])[0], (b.rot || [0, 0])[0], u), lerp((a.rot || [0, 0])[1], (b.rot || [0, 0])[1], u)], sat: false, j: {}, walk: 0 };
  const yS0 = a.sat ? (b.sat ? a.p[1] : b.p[1]) : a.p[1], yS1 = b.sat ? (a.sat ? b.p[1] : yS0) : b.p[1];
  const r0 = a.sat ? 0.22 : 0, s0 = b.sat ? 0.22 : 0, span = Math.max(0.05, 1 - r0 - s0);
  const stand = b.sat ? zeroJ() : b.j, from = a.sat ? zeroJ() : a.j, H = S.H;
  if (u < r0) { const v = sm(u / r0); s.p = [a.p[0], lerp(a.p[1], yS0, v), a.p[2]]; s.h = a.h; for (const k of JOINTS) s.j[k] = a.j[k].map((x, q) => lerp(x, stand[k][q], v)); s.sat = true; }
  else if (u > 1 - s0) { const v = sm((u - (1 - s0)) / s0); s.p = [b.p[0], lerp(yS1, b.p[1], v), b.p[2]]; s.h = angLerp(m.dir, b.h, v); for (const k of JOINTS) s.j[k] = stand[k].map((x, q) => lerp(x, b.j[k][q], v)); s.sat = v > 0.5; }
  else {
    const v = (u - r0) / span, e = m.walk ? v * v * (3 - 2 * v) * 0.25 + v * 0.75 : sm(v);
    s.p = [lerp(a.p[0], b.p[0], e), lerp(yS0, yS1, e), lerp(a.p[2], b.p[2], e)];
    if (m.walk) {
      const turn = sm(cl01(v * 6)), back = sm(cl01((v - 0.82) / 0.18));
      s.h = angLerp(angLerp(a.h, m.dir, turn), b.sat ? m.dir : b.h, b.sat ? 0 : back);
      const amt = sm(cl01(v * 8)) * sm(cl01((1 - v) * 8)), ph = e * m.d / (0.42 * H) * Math.PI; s.walk = amt;
      for (const k of JOINTS) s.j[k] = (a.sat ? stand : from)[k].map((x, q) => lerp(x, stand[k][q], sm(v)));
      s.j.legRP = [s.j.legRP[0] + 0.62 * amt * Math.sin(ph), 0, 0]; s.j.legLP = [s.j.legLP[0] - 0.62 * amt * Math.sin(ph), 0, 0];
      s.j.armRP = [s.j.armRP[0] - 0.45 * amt * Math.sin(ph), s.j.armRP[1], s.j.armRP[2]]; s.j.armLP = [s.j.armLP[0] + 0.45 * amt * Math.sin(ph), s.j.armLP[1], s.j.armLP[2]];
    } else { s.h = angLerp(a.h, b.h, sm(v)); for (const k of JOINTS) s.j[k] = from[k].map((x, q) => lerp(x, stand[k][q], sm(v))); }
  }
  return s;
}

/* ── transforms ── */
function mul(A: M34, B: M34): M34 {
  const r: number[] = new Array(12);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
  for (let i = 0; i < 3; i++) r[9 + i] = A[i * 3] * B[9] + A[i * 3 + 1] * B[10] + A[i * 3 + 2] * B[11] + A[9 + i];
  return r;
}
export function apply(M: M34, v: number[]): V3 { return [M[0] * v[0] + M[1] * v[1] + M[2] * v[2] + M[9], M[3] * v[0] + M[4] * v[1] + M[5] * v[2] + M[10], M[6] * v[0] + M[7] * v[1] + M[8] * v[2] + M[11]]; }
function T(x: number, y: number, z: number): M34 { return [1, 0, 0, 0, 1, 0, 0, 0, 1, x, y, z]; }
function Rx(a: number): M34 { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c, 0, 0, 0]; }
function Ry(a: number): M34 { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c, 0, 0, 0]; }
function Rz(a: number): M34 { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1, 0, 0, 0]; }
function scaleM(k: number): M34 { return [k, 0, 0, 0, k, 0, 0, 0, k, 0, 0, 0]; }
/** three.js Euler 'XYZ' (a joint's rotation) and 'YXZ' (the figure's) */
function eXYZ(e: number[]): M34 { return mul(mul(Rx(e[0]), Ry(e[1])), Rz(e[2])); }
function eYXZ(x: number, y: number, z: number): M34 { return mul(mul(Ry(y), Rx(x)), Rz(z)); }
function axisAngle(ax: number[], a: number): M34 {
  const [x, y, z] = ax, c = Math.cos(a), s = Math.sin(a), C = 1 - c;
  return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C, 0, 0, 0];
}

/* the hand (world/minifig.js HAND_R/L and the tool mount of 3820's grip): where a held thing sits in the arm's frame, and its axis */
function gripOf(side: 'R' | 'L'): { at: V3; axis: V3 } {
  const sx = side === 'R' ? 1 : -1;
  const R = [0.985, -0.12019 * sx, 0.12019 * sx, 0.17 * sx, 0.696395, -0.696395, 0, 0.707, 0.707];
  const g = [0, -0.8229, -9.8948], hand = [-23.8634 * sx, 26.5956, -10.321], piv = [-15.552 * sx, 9, 0];
  const Rg = [R[0] * g[0] + R[1] * g[1] + R[2] * g[2], R[3] * g[0] + R[4] * g[1] + R[5] * g[2], R[6] * g[0] + R[7] * g[1] + R[8] * g[2]];
  const c = Math.cos(14.5 * Math.PI / 180), s = Math.sin(14.5 * Math.PI / 180), h = [0, c, s];
  const ax: V3 = [R[0] * h[0] + R[1] * h[1] + R[2] * h[2], R[3] * h[0] + R[4] * h[1] + R[5] * h[2], R[6] * h[0] + R[7] * h[1] + R[8] * h[2]];
  return { at: [hand[0] + Rg[0] - piv[0], hand[1] + Rg[1] - piv[1], hand[2] + Rg[2] - piv[2]], axis: ax };
}

export interface Posed {
  vis: boolean; t: number;
  /** world transforms of the skeleton's groups (M34) */
  M: Record<string, M34>;
  /** the seven density points (tools/choreograph.js): face, crown, chest, hand R, hand L, foot R, foot L */
  pts: V3[];
  /** head and hips pivots in the world (the frame test) */
  head: V3; hips: V3;
  /** the held props as lines in the world (a hand that holds something) */
  props: V3[][];
  ch: Record<string, number>;
  /** the joints (armRP armLP headP torsoP legRP legLP, Euler XYZ) and the root [x y z pitch heading roll], for checking against the take */
  J?: Record<string, number[]>; root?: number[];
}
function within(ch: string, base: number, v: number): number { const c = CLAMP[ch]; if (!c) return v; const lo = Math.min(c[0], base), hi = Math.max(c[1], base); return Math.max(lo, Math.min(hi, v)); }

/** the figure at t, with the director's layer */
export function poseAt(S: ActorSheet, t: number, D: Director | null): Posed | null {
  const b = blockingAt(S, t); if (!b) return null;
  if (!b.vis) return { vis: false, t, M: {}, pts: [], head: [0, 0, 0], hips: [0, 0, 0], props: [], ch: {} };
  const v = channelsAt(S, t, D), g = (k: string) => v[k] || 0;
  /* the joints: the blocking's, then the acting layer (choreo.js addRig) */
  const J: Record<string, number[]> = {}; for (const k of JOINTS) J[k] = (b.j[k] || [0, 0, 0]).slice();
  const Tj = J.torsoP; J.torsoP = [within('torso.lean', Tj[0], Tj[0] + g('torso.lean')), -within('torso.twist', -Tj[1], -Tj[1] + g('torso.twist')), -within('torso.roll', -Tj[2], -Tj[2] + g('torso.roll'))];
  const Hd = J.headP; J.headP = [within('head.pitch', Hd[0], Hd[0] + g('head.pitch')), -within('head.yaw', -Hd[1], -Hd[1] + g('head.yaw')), Hd[2]];
  for (const s of ['R', 'L']) {
    const A = J['arm' + s + 'P'], sg = s === 'R' ? -1 : 1, o0 = A[2] * sg;
    J['arm' + s + 'P'] = [within('arm.' + s + '.pitch', A[0], A[0] + g('arm.' + s + '.pitch')), A[1], sg * within('arm.' + s + '.out', o0, o0 + g('arm.' + s + '.out'))];
    const L = J['leg' + s + 'P']; if (g('leg.' + s + '.pitch')) J['leg' + s + 'P'] = [within('leg.' + s + '.pitch', L[0], L[0] + g('leg.' + s + '.pitch')), L[1], L[2]];
  }
  const pos = [b.p[0] + g('root.x'), b.p[1] + g('root.y'), b.p[2] + g('root.z')];
  const hipsY = v['hips.dy'] != null ? S.hipsY - v['hips.dy'] : S.hipsY;
  let Mfig = mul(mul(T(pos[0], pos[1], pos[2]), eYXZ(b.rot[0] + g('root.pitch'), b.h + g('root.h'), b.rot[1] + g('root.roll'))), scaleM(S.scale));
  /* the ship: a rider turned and lifted with the deck (choreo.js applyShip) */
  if (S.ship) {
    const tq = drawT(t, S.step), c = (k: string) => { const x = sampleKeys(S.ship!.channels[k], tq, k); return x == null ? 0 : x; };
    const q = eYXZ(c('pitch'), S.ship.yaw || 0, c('roll')), q0i = Ry(-(S.ship.yaw || 0)), Q = mul(q, q0i), P = S.ship.pivot, QP = apply(Q, P);
    Mfig = mul([...Q.slice(0, 9), P[0] - QP[0], P[1] - QP[1] + c('heave'), P[2] - QP[2]], Mfig);
  }
  const flip = mul(Mfig, Rx(Math.PI)), hips = mul(flip, T(0, hipsY, 0)), torso = mul(mul(hips, T(0, -32, 0)), eXYZ(J.torsoP));
  const M: Record<string, M34> = {
    figure: Mfig, flip, hipsP: hips, torsoP: torso,
    headP: mul(mul(torso, T(0, -24, 0)), eXYZ(J.headP)),
    armRP: mul(mul(torso, T(-15.552, 9, 0)), eXYZ(J.armRP)), armLP: mul(mul(torso, T(15.552, 9, 0)), eXYZ(J.armLP)),
    legRP: mul(mul(hips, T(0, 12, 0)), eXYZ(J.legRP)), legLP: mul(mul(hips, T(0, 12, 0)), eXYZ(J.legLP)),
  };
  const pts: V3[] = [apply(M.headP, [0, -12, -11]), apply(M.headP, [0, -26, 0]), apply(M.torsoP, [0, 10, -10]), apply(M.armRP, [-8, 22, -10]), apply(M.armLP, [8, 22, -10]), apply(M.legRP, [-6, 26, -6]), apply(M.legLP, [6, 26, -6])];
  const props: V3[][] = [];
  for (const s of ['R', 'L'] as const) {
    if (!(S.held[s] > 0)) continue;
    const G = gripOf(s), roll = v['hand.' + s + '.roll'] || 0, n = Math.hypot(...G.at), ax = [G.at[0] / n, G.at[1] / n, G.at[2] / n];
    const R = axisAngle(ax, -roll), a = apply(R, G.axis), A = M['arm' + s + 'P'], len = s === 'R' ? [14, -44] : [26, -26];
    props.push([apply(A, [G.at[0] + a[0] * len[0], G.at[1] + a[1] * len[0], G.at[2] + a[2] * len[0]]), apply(A, [G.at[0] + a[0] * len[1], G.at[1] + a[1] * len[1], G.at[2] + a[2] * len[1]])]);
  }
  return { vis: true, t, M, pts, head: apply(M.headP, [0, 0, 0]), hips: apply(M.hipsP, [0, 0, 0]), props, ch: v, J, root: [pos[0], pos[1], pos[2], b.rot[0] + g('root.pitch'), b.h + g('root.h'), b.rot[1] + g('root.roll')] };
}

/* ── the figure as boxes (the silhouette the previz draws and Studio's viewer shows) ── */
export interface Face { p: V3[]; part: string }
function box(M: M34, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, part: string, taper = 0): Face[] {
  /* LDraw frame of the group: y down. taper narrows the top (y0) in x by that much each side */
  const c = (x: number, y: number, z: number): V3 => apply(M, [x, y, z]);
  const tx0 = x0 + taper, tx1 = x1 - taper;
  const v = [c(tx0, y0, z0), c(tx1, y0, z0), c(tx1, y0, z1), c(tx0, y0, z1), c(x0, y1, z0), c(x1, y1, z0), c(x1, y1, z1), c(x0, y1, z1)];
  return [[0, 1, 2, 3], [7, 6, 5, 4], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]].map(f => ({ p: f.map(i => v[i]), part }));
}
export function figureFaces(P: Posed): Face[] {
  if (!P.vis) return [];
  const M = P.M, F: Face[] = [];
  F.push(...box(M.legRP, -19, -1, -2, 26, -10, 8, 'legR'), ...box(M.legRP, -19, -1, 26, 32, -14, 8, 'footR'));
  F.push(...box(M.legLP, 1, 19, -2, 26, -10, 8, 'legL'), ...box(M.legLP, 1, 19, 26, 32, -14, 8, 'footL'));
  F.push(...box(M.hipsP, -20, 20, 0, 12, -10, 10, 'hips'));
  F.push(...box(M.torsoP, -20, 20, 0, 32, -10, 10, 'torso', 7));
  F.push(...box(M.headP, -10, 10, 0, 22, -10, 10, 'head'), ...box(M.headP, -6, 6, -4, 0, -6, 6, 'head'), ...box(M.headP, -5, 5, 22, 25, -5, 5, 'head'), ...box(M.headP, -7, 7, 7, 13, -11, -10, 'face'));
  for (const s of ['R', 'L'] as const) {
    const A = M['arm' + s + 'P'], sx = s === 'R' ? -1 : 1, G = gripOf(s).at;
    F.push(...box(A, Math.min(sx * 1, sx * 9), Math.max(sx * 1, sx * 9), -4, 14, -5, 5, 'arm' + s));
    /* the forearm to the hand, and the hand */
    const e: V3 = [sx * 5, 12, -2], h: V3 = G, d = [h[0] - e[0], h[1] - e[1], h[2] - e[2]];
    for (let k = 0; k < 1; k++) F.push(...box(mul(A, [1, 0, 0, 0, 1, 0, 0, 0, 1, e[0] + d[0] * 0.45, e[1] + d[1] * 0.45, e[2] + d[2] * 0.45]), -4, 4, -5, 5, -6, 6, 'arm' + s));
    F.push(...box(mul(A, [1, 0, 0, 0, 1, 0, 0, 0, 1, h[0], h[1], h[2]]), -3.5, 3.5, -3.5, 3.5, -3.5, 3.5, 'hand' + s));
  }
  return F;
}

/* ── the camera: a perspective view from pos toward dir (vertical fov in degrees) ── */
export interface Cam { pos: number[]; dir: number[]; up?: number[]; fov: number; aspect: number }
/** world -> [ndc x, ndc y, depth]; depth > 0 in front of the camera */
export function project(C: Cam, p: number[]): V3 {
  const f = norm(C.dir), upw = C.up ? norm(C.up) : [0, 1, 0];
  let r = cross(f, upw); if (Math.hypot(...r) < 1e-6) r = cross(f, [0, 0, 1]); r = norm(r); const u = cross(r, f);
  const d = [p[0] - C.pos[0], p[1] - C.pos[1], p[2] - C.pos[2]], z = dot(d, f), x = dot(d, r), y = dot(d, u);
  const k = 1 / Math.tan(C.fov * Math.PI / 360);
  return [x * k / (C.aspect * Math.max(1e-6, z)), y * k / Math.max(1e-6, z), z];
}
export function inFrame(C: Cam, p: number[]): boolean { const q = project(C, p); return q[2] > 0 && Math.abs(q[0]) <= 1 && Math.abs(q[1]) <= 1; }
function dot(a: number[], b: number[]): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a: number[], b: number[]): number[] { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm(a: number[]): number[] { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; }

/* ── the acting density (tools/choreograph.js density), from poses ── */
export interface DensityFrame { t: number; actors: Record<string, { on: boolean; H: number; p: number[][] }> }
export function density(P: DensityFrame[], holds: { actor: string; t0: number; t1: number }[], thresh = 0.005) {
  const per: Record<string, { on: number; moving: number; run: number; frozen: number; frozenAt: number | null; runStart: number | null }> = {};
  const prev: Record<string, { on: boolean; H: number; p: number[][] }> = {}, held = (id: string, t: number) => (holds || []).some(h => h.actor === id && t >= h.t0 && t <= h.t1);
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  for (const p of P) {
    for (const [id, a] of Object.entries(p.actors)) {
      if (held(id, p.t)) { delete prev[id]; continue; }
      const e = per[id] || (per[id] = { on: 0, moving: 0, run: 0, frozen: 0, frozenAt: null, runStart: null });
      const b = prev[id]; prev[id] = a; if (!a.on || !b) { e.run = 0; continue; }
      e.on++; const d = Math.max(...a.p.map((x, i) => Math.hypot(x[0] - b.p[i][0], x[1] - b.p[i][1], x[2] - b.p[i][2]))) / a.H;
      if (d > thresh) { e.moving++; e.run = 0; } else { if (!e.run) e.runStart = p.t; e.run++; if (e.run > e.frozen) { e.frozen = e.run; e.frozenAt = e.runStart; } }
    }
    for (const id in prev) if (!p.actors[id]) delete prev[id];
  }
  const out: Record<string, { frames: number; moving: number; longestFrozen: number; frozenAt: number | null }> = {};
  for (const [id, e] of Object.entries(per)) if (e.on) out[id] = { frames: e.on, moving: r3(e.moving / e.on), longestFrozen: r3(e.frozen / 12), frozenAt: e.frozenAt != null ? r3(e.frozenAt) : null };
  const L = Object.values(out);
  return { threshold: thresh, actors: out, mean: L.length ? r3(L.reduce((a, b) => a + b.moving, 0) / L.length) : 0, worstFrozen: L.length ? Math.max(...L.map(x => x.longestFrozen)) : 0, over80: L.filter(x => x.moving > 0.8).length, count: L.length };
}

/** a JSON asset's bytes (ASCII: the desk's tools write ASCII) */
export function readJson<T>(bytes: Uint8Array): T {
  let s = '';
  for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 8192)));
  return JSON.parse(s) as T;
}
