/* lib/choreo.ts — a choreography sheet (odyssey-choreo/1) sampled, and a minifigure's forward kinematics, for the project's nodes.

   Pure functions of their arguments: no module state, no clock. The sampling follows film-readymades/choreo.js (keys [t, v, ease],
   the layers of a channel summed, the sheet drawn on twos); the blocking follows film-readymades/odyssey-take.js castAt in a reduced
   form (each key's snapshot held, eased across its seam window, with a walk's arm swing where the marks are apart; the rise from a
   seat and the sit are folded into the ease). The kinematics use the minifigure's own pivots (world/minifig.js): the arm pivots at
   (+-15.552, 9, 0) below the neck, the hand's grip at (-9.40, 23.91, -17.90) from the right arm's pivot (the hand part 3820 and its
   grip centre), the hips at 32, the feet at 76, all in LDraw units, y down, facing -z. The waist turns at the hips (the toy has no
   waist; the film allows the play a posed figure has). */

export type Key = [number, number] | [number, number, string];
export interface Snap { t: number; win: [number, number] | null; p: number[]; h: number; sat: boolean; j: Record<string, number[]> }
export interface Gesture {
  scene: string; actor: string; title: string; caption: string; t0: number; t1: number; step: string; layer: string;
  scale: number; H: number; keys: Snap[]; channels: Record<string, Key[]>;
}

const sm = (u: number) => u * u * (3 - 2 * u);
const cl01 = (v: number) => Math.max(0, Math.min(1, v));
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
function wrapTo(a: number, ref: number): number { while (a - ref > Math.PI) a -= 2 * Math.PI; while (a - ref < -Math.PI) a += 2 * Math.PI; return a; }
export function drawT(t: number, step: string): number { const f = step === 'ones' ? 24 : step === 'threes' ? 8 : 12; return Math.floor(t * f + 1e-6) / f; }

export function sampleKeys(K: Key[], t: number, angular = false): number {
  if (!K || !K.length) return 0;
  if (t <= K[0][0]) return K[0][1];
  let lo = 0, hi = K.length - 1;
  if (t >= K[hi][0]) return K[hi][1];
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (K[m][0] <= t) lo = m; else hi = m; }
  const a = K[lo], b = K[hi], u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
  const bv = angular ? wrapTo(b[1], a[1]) : b[1];
  return a[1] + (bv - a[1]) * ease(b[2] as string | undefined, cl01(u));
}

/** every channel of the sheet at t, its layers summed ('arm.R.pitch@beat' + 'arm.R.pitch@fill' = arm.R.pitch); `skip` drops layers */
export function channelsAt(g: Gesture, t: number, skip: readonly string[] = []): Record<string, number> {
  const tq = drawT(t, g.step), v: Record<string, number> = {};
  for (const [key, K] of Object.entries(g.channels)) {
    const [ch, layer] = key.split('@');
    if (layer && skip.includes(layer)) continue;
    v[ch] = (v[ch] || 0) + sampleKeys(K, tq, ch === 'root.h');
  }
  return v;
}

export interface Pose { p: number[]; h: number; sat: boolean; j: Record<string, number[]>; walk: number }
const JOINTS = ['armRP', 'armLP', 'torsoP', 'legRP', 'legLP'];
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const angLerp = (a: number, b: number, u: number) => a + wrapTo(b - a, 0) * u;

/** the blocking at t: the key's snapshot, eased across a seam; walking where the marks are apart */
export function blockingAt(g: Gesture, t: number): Pose {
  const K = g.keys; let i = 0;
  for (let q = 0; q < K.length; q++) if (K[q].t <= t) i = q;
  const inWin = (q: number) => { const k = K[q]; return k && k.win && q > 0 && t >= k.win[0] && t <= k.win[1] ? q : -1; };
  const w = inWin(i + 1) >= 0 ? i + 1 : inWin(i);
  const copy = (s: Snap): Pose => ({ p: s.p.slice(), h: s.h, sat: s.sat, j: Object.fromEntries(JOINTS.map(n => [n, (s.j[n] || [0, 0, 0]).slice()])), walk: 0 });
  if (w < 0) return copy(K[i]);
  const A = K[w - 1], B = K[w], win = B.win as [number, number], u = cl01((t - win[0]) / Math.max(1e-6, win[1] - win[0]));
  const dx = B.p[0] - A.p[0], dz = B.p[2] - A.p[2], d = Math.hypot(dx, dz);
  if (d < 0.05 * g.H) {   /* no travel: the pose eases from one key to the next */
    const e = sm(u), out = copy(A);
    out.p = A.p.map((v, q) => lerp(v, B.p[q], e)); out.h = angLerp(A.h, B.h, e); out.sat = e < 0.5 ? A.sat : B.sat;
    for (const n of JOINTS) out.j[n] = out.j[n].map((v, q) => lerp(v, (B.j[n] || [0, 0, 0])[q], e));
    return out;
  }
  /* a walk: rise (if seated), travel at pace facing the way, turn to the new heading, sit (if seating) */
  const dir = Math.atan2(dx, dz), stand = (s: Snap) => s.sat ? { armRP: [0, 0, 0], armLP: [0, 0, 0], torsoP: [0, 0, 0], legRP: [0, 0, 0], legLP: [0, 0, 0] } as Record<string, number[]> : s.j;
  const standY = A.sat ? (B.sat ? A.p[1] + 20.25 : B.p[1]) : A.p[1], standY1 = B.sat ? standY : B.p[1];
  const r0 = A.sat ? 0.22 : 0, s0 = B.sat ? 0.22 : 0, span = Math.max(0.05, 1 - r0 - s0);
  const out: Pose = { p: [0, 0, 0], h: A.h, sat: false, j: {}, walk: 0 };
  if (u < r0) { const v = sm(u / r0); out.p = [A.p[0], lerp(A.p[1], standY, v), A.p[2]]; for (const n of JOINTS) out.j[n] = (A.j[n] || [0, 0, 0]).map((x, q) => lerp(x, stand(B)[n][q], v)); out.sat = true; return out; }
  if (u > 1 - s0) { const v = sm((u - (1 - s0)) / s0); out.p = [B.p[0], lerp(standY1, B.p[1], v), B.p[2]]; out.h = angLerp(dir, B.h, v); for (const n of JOINTS) out.j[n] = stand(B)[n].map((x, q) => lerp(x, (B.j[n] || [0, 0, 0])[q], v)); out.sat = v > 0.5; return out; }
  const v = (u - r0) / span, e = sm(v) * 0.25 + v * 0.75;
  out.p = [lerp(A.p[0], B.p[0], e), lerp(standY, standY1, e), lerp(A.p[2], B.p[2], e)];
  const turn = sm(cl01(v * 6)), back = sm(cl01((v - 0.82) / 0.18));
  out.h = angLerp(angLerp(A.h, dir, turn), B.sat ? dir : B.h, B.sat ? 0 : back);
  const amt = sm(cl01(v * 8)) * sm(cl01((1 - v) * 8)), ph = e * d / (0.42 * g.H) * Math.PI;
  out.walk = amt;
  const from = A.sat ? stand(B) : A.j;
  for (const n of JOINTS) out.j[n] = (from[n] || [0, 0, 0]).map((x, q) => lerp(x, stand(B)[n][q], sm(v)));
  out.j.legRP = [out.j.legRP[0] + 0.62 * amt * Math.sin(ph), 0, 0]; out.j.legLP = [out.j.legLP[0] - 0.62 * amt * Math.sin(ph), 0, 0];
  out.j.armRP = [out.j.armRP[0] - 0.45 * amt * Math.sin(ph), out.j.armRP[1], out.j.armRP[2]];
  out.j.armLP = [out.j.armLP[0] + 0.45 * amt * Math.sin(ph), out.j.armLP[1], out.j.armLP[2]];
  return out;
}

/* ── the kinematics ── */
type V3 = [number, number, number];
const rx = (v: V3, a: number): V3 => { const c = Math.cos(a), s = Math.sin(a); return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c]; };
const ry = (v: V3, a: number): V3 => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]; };
const rz = (v: V3, a: number): V3 => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; };
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export interface Skeleton {
  /** named points in LDU, y UP, the figure's frame chosen by `frame` */
  feet: V3; hips: V3; neck: V3; head: V3; shoulderR: V3; shoulderL: V3; handR: V3; handL: V3; kneeR: V3; kneeL: V3; footR: V3; footL: V3;
}

/**
 * The figure at t. `frame`: 'world' (LDU in the set, y up from the floor the actor stands on, x and z from the set's origin) or
 * 'body' (LDU from the feet, facing +z, the heading and the travel taken out: the gesture alone).
 */
export function skeletonAt(g: Gesture, t: number, frame: 'world' | 'body', floorY: number): Skeleton {
  const b = blockingAt(g, t), c = channelsAt(g, t), abs = g.layer !== 'add';
  const j = (n: string, q: number) => (b.j[n] || [0, 0, 0])[q];
  const armPitch = (s: 'R' | 'L') => (abs ? 0 : j('arm' + s + 'P', 0)) + (c['arm.' + s + '.pitch'] || 0);
  const armOut = (s: 'R' | 'L') => (abs ? 0 : (s === 'R' ? 1 : -1) * j('arm' + s + 'P', 2)) + (c['arm.' + s + '.out'] || 0);
  const lean = j('torsoP', 0) + (c['torso.lean'] || 0), twist = j('torsoP', 1) + (c['torso.twist'] || 0), roll = j('torsoP', 2) + (c['torso.roll'] || 0);
  const hipsDy = c['hips.dy'] || 0;
  /* LDraw frame: y down, origin at the neck of an upright figure, facing -z */
  const HIP: V3 = [0, 32 - hipsDy, 0];
  const upper = (v: V3): V3 => add(HIP, rx(ry(rz(sub(v, HIP), roll), twist), lean));
  const arm = (s: 'R' | 'L'): V3 => {
    const sx = s === 'R' ? -1 : 1, pivot: V3 = [15.552 * sx, 9 - hipsDy, 0], grip: V3 = [9.40 * sx, 23.91, -17.90];
    const out = armOut(s) * (s === 'R' ? 1 : -1);
    return upper(add(pivot, rx(rz(grip, out), armPitch(s))));
  };
  const leg = (s: 'R' | 'L', len: number): V3 => { const p = j('leg' + s + 'P', 0) + (c['leg.' + s + '.pitch'] || 0); return add([s === 'R' ? -6 : 6, 44 - hipsDy, 0], rx([0, len, 0], p)); };
  const L: Record<string, V3> = {
    feet: [0, 76, 0], hips: HIP, neck: upper([0, -hipsDy, 0]), head: upper([0, -24 - hipsDy, 0]),
    shoulderR: upper([-15.552, 9 - hipsDy, 0]), shoulderL: upper([15.552, 9 - hipsDy, 0]), handR: arm('R'), handL: arm('L'),
    kneeR: leg('R', 16), kneeL: leg('L', 16), footR: leg('R', 32), footL: leg('L', 32),
  };
  /* the whole figure tipped about the feet (a fall), then into y-up facing +z with the feet at the origin */
  const pitch = c['root.pitch'] || 0, rl = c['root.roll'] || 0, FEET: V3 = [0, 76, 0];
  const up = (v: V3): V3 => { const w = add(FEET, rx(rz(sub(v, FEET), rl), pitch)); return [w[0], 76 - w[1], -w[2]]; };
  const out: Record<string, V3> = {};
  if (frame === 'body') { for (const k in L) out[k] = up(L[k]); return out as unknown as Skeleton; }
  const h = b.h + (c['root.h'] || 0), s = 1 / g.scale;
  const origin: V3 = [(b.p[0] + (c['root.x'] || 0)) * s, (b.p[1] + (c['root.y'] || 0) - floorY) * s, (b.p[2] + (c['root.z'] || 0)) * s];
  for (const k in L) out[k] = add(origin, ry(up(L[k]), h));
  return out as unknown as Skeleton;
}

/** the floor the actor stands on: its lowest standing mark (world units) */
export function floorOf(g: Gesture): number {
  const ys = g.keys.filter(k => !k.sat).map(k => k.p[1]);
  return ys.length ? Math.min(...ys) : g.keys[0].p[1];
}

/** the bones of a stick minifigure, as pairs of skeleton point names */
export const BONES: readonly [keyof Skeleton, keyof Skeleton][] = [
  ['hips', 'neck'], ['neck', 'head'], ['shoulderR', 'shoulderL'], ['shoulderR', 'handR'], ['shoulderL', 'handL'],
  ['hips', 'kneeR'], ['kneeR', 'footR'], ['hips', 'kneeL'], ['kneeL', 'footL'],
];

/** a ramp through LDraw colours, early to late: [LDraw code, r, g, b] */
export const RAMP: readonly [number, number, number, number][] = [
  [272, 0.051, 0.196, 0.357], [1, 0.0, 0.341, 0.651], [73, 0.353, 0.576, 0.859], [3, 0.0, 0.561, 0.608], [2, 0.0, 0.522, 0.169],
  [27, 0.651, 0.792, 0.333], [14, 0.949, 0.804, 0.216], [25, 0.855, 0.459, 0.106], [4, 0.788, 0.102, 0.035], [320, 0.447, 0.055, 0.059],
];
export function rampAt(u: number): [number, number, number, number] {
  const i = Math.max(0, Math.min(RAMP.length - 1, Math.round(u * (RAMP.length - 1))));
  return RAMP[i];
}

/** the JSON of an asset, decoded without TextDecoder (the portable lib is ES2022 only) */
export function decodeJson<T>(bytes: Uint8Array): T {
  let s = '';
  for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 8192)));
  return JSON.parse(decodeURIComponent(escape(s))) as T;
}
export function encodeJson(value: unknown): Uint8Array {
  const s = unescape(encodeURIComponent(JSON.stringify(value)));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
