/* film-readymades/choreo.js — the choreography player (window.OdysseyChoreo; also a CommonJS module for node tools and the dope
   sheet). A scene's choreography (odyssey/choreo/<scene>.json, format odyssey-choreo/1) is what a motion-control programmer
   writes for a practical rig: for every actor, every servo (channel) as timed keys on the scene's voice clock, with easing, and
   the scene's own rigs (a ship's pitch, roll and heave) and its props (a spear handed over, an arrow that appears when loosed).

   A key is [t, v] or [t, v, ease]: the channel reaches v at t, eased from the key before by `ease` (inOut when omitted):
     linear in out inOut back (a spring's one overshoot)   step (hold the previous value until t, then jump: a cut in the pose)
   The whole sheet is sampled on twos (the drawing at floor(t*12)/12) unless `step` is 'ones'. Nothing here remembers a frame:
   the pose at t is a pure function of t, so a frame rendered offline at t is the frame the player shows at t, scrubbed either way.

   Channels (radians unless named; limits are the toy's, CLAMP below):
     root.x root.z root.y   world units: where the figure stands (walks, crossings, approaches, a leap's arc)
     root.h                 heading (0 faces +z), root.pitch / root.roll the whole figure tipped (a fall, a weight shift)
     hips.dy                LDU, up: the body's bob and settle on the hips pivot
     torso.lean torso.twist torso.roll      the waist the toy nearly has (forward, toward the figure's left, sideways)
     head.yaw head.pitch    the head turns on its stud (a small nod on the neck's play)
     arm.R.pitch arm.L.pitch  the shoulder (negative raises the arm forward; -1.57 level, -3.14 overhead)
     arm.R.out arm.L.out    the shoulder's roll away from the body
     hand.R.roll hand.L.roll  the wrist's turn (and what the hand holds turns with it)
     leg.R.pitch leg.L.pitch  the hip joints (negative forward: a stride, a sit at -1.57, a kneel)
   Layer: `layer: 'abs'` (the default) writes each channel as the servo's position; `layer: 'add'` (what tools/choreograph.js
   generates) lays each channel over the pose the take has already given the figure this frame (the blocking, its walks between
   the keys, the performance's head and face), as an acting layer over the layout pass: root.* are then offsets from the mark,
   the joints offsets from the blocked pose (hand.*.roll and hips.dy are values either way).
   Layers of keys: a channel may be keyed several times as 'channel@layer' (arm.R.pitch@life, arm.R.pitch@beat, ...): the layers sum.
   Overrides: `overrides[actor][channel]` are a director's hand keys: inside their span they replace the generated keys, which the
   choreographer never rewrites (tools/choreograph.js keeps them across regenerations).
   Props: [{t, op:'give', from:'actor:R', to:'actor:R'} | {t, op:'hide'|'show', what:'actor:R'|'prop:<id>'}], evaluated as state
   at t (the latest event for each thing), so scrubbing back gives the spear back.
   Rigs: {ship: {piece, pivot:[x,y,z], channels: {pitch, roll, heave, dx?, dz?}, riders:[actor id | [actor id, t0, t1]]}}: a set piece turned about its pivot,
   carrying the figures that stand on it (each rider's channels are in the ship's frame at rest). */
(function (root) {
'use strict';
const CH = ['root.x', 'root.z', 'root.y', 'root.h', 'root.pitch', 'root.roll', 'hips.dy', 'torso.lean', 'torso.twist', 'torso.roll', 'head.yaw', 'head.pitch',
  'arm.R.pitch', 'arm.L.pitch', 'arm.R.out', 'arm.L.out', 'hand.R.roll', 'hand.L.roll', 'leg.R.pitch', 'leg.L.pitch'];
/* the minifig's joint limits: an arm swings all the way round but not far back, a leg to a sit forward and a stride back, the
   waist and the neck only a little (the toy has neither; the film allows the play a posed figure has) */
const CLAMP = { 'torso.lean': [-0.3, 0.38], 'torso.twist': [-0.55, 0.55], 'torso.roll': [-0.16, 0.16], 'head.yaw': [-1.45, 1.45], 'head.pitch': [-0.22, 0.22],
  'arm.R.pitch': [-3.2, 1.05], 'arm.L.pitch': [-3.2, 1.05], 'arm.R.out': [-0.2, 0.55], 'arm.L.out': [-0.2, 0.55], 'hand.R.roll': [-1.3, 1.3], 'hand.L.roll': [-1.3, 1.3],
  'leg.R.pitch': [-1.6, 0.95], 'leg.L.pitch': [-1.6, 0.95], 'hips.dy': [-14, 14] };
const cl01 = v => Math.max(0, Math.min(1, v)), sm = u => u * u * (3 - 2 * u);
const EASE = { linear: u => u, in: u => u * u, out: u => 1 - (1 - u) * (1 - u), inOut: sm, step: u => (u >= 1 ? 1 : 0), hold: u => (u >= 1 ? 1 : 0),
  back: u => { const s = 1.4; u -= 1; return u * u * ((s + 1) * u + s) + 1; } };
const isAng = ch => String(ch).split('@')[0] === 'root.h';
function wrapTo(a, ref) { while (a - ref > Math.PI) a -= 2 * Math.PI; while (a - ref < -Math.PI) a += 2 * Math.PI; return a; }
/* the drawing a time falls in: twelve a second on twos */
function drawT(t, step) { const f = step === 'ones' ? 24 : step === 'threes' ? 8 : 12; return Math.floor(t * f + 1e-6) / f; }
/* a channel's keys with a director's overrides laid over them: generated keys inside the override span are dropped */
function merged(gen, ov) {
  if (!ov || !ov.length) return gen || [];
  const a = ov[0][0] - 1e-3, b = ov[ov.length - 1][0] + 1e-3;
  return (gen || []).filter(k => k[0] < a || k[0] > b).concat(ov).sort((x, y) => x[0] - y[0]);
}
/* one channel at t: keys sorted by time */
function sampleKeys(K, t, ch) {
  if (!K || !K.length) return null;
  if (t <= K[0][0]) return K[0][1];
  let lo = 0, hi = K.length - 1; if (t >= K[hi][0]) return K[hi][1];
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (K[m][0] <= t) lo = m; else hi = m; }
  const a = K[lo], b = K[hi], u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]), e = (EASE[b[2] || 'inOut'] || sm)(cl01(u));
  const bv = isAng(ch) ? wrapTo(b[1], a[1]) : b[1];
  return a[1] + (bv - a[1]) * e;
}
function clamp(ch, v) { const c = CLAMP[ch]; return c ? Math.max(c[0], Math.min(c[1], v)) : v; }
/* the sheet prepared once: each actor's channels merged with the overrides */
function compile(C) {
  if (C._compiled) return C._compiled;
  const out = { actors: {}, step: C.step || 'twos' };
  for (const [id, A] of Object.entries(C.actors || {})) { const o = (C.overrides || {})[id] || {}, ch = {};
    for (const k of new Set([...Object.keys(A.channels || {}), ...Object.keys(o)])) ch[k] = merged((A.channels || {})[k], o[k]);
    out.actors[id] = ch; }
  out.rigs = {}; for (const [id, R] of Object.entries(C.rigs || {})) out.rigs[id] = Object.assign({}, R, { ch: R.channels || {} });
  out.props = (C.props || []).slice().sort((a, b) => a.t - b.t);
  Object.defineProperty(C, '_compiled', { value: out, enumerable: false, configurable: true });
  return out;
}
/* every channel of an actor at t (on the sheet's step): {ch: value}; channels without keys are absent */
function sampleActor(C, id, t, { stepped = true } = {}) {
  const X = compile(C), A = X.actors[id]; if (!A) return null; const tq = stepped ? drawT(t, X.step) : t, v = {};
  /* a channel may be keyed on several layers, 'arm.R.pitch@beat', 'arm.R.pitch@life': the layers sum (an acting layer over a
     breathing layer), and the sum is the channel */
  for (const [key, K] of Object.entries(A)) { const x = sampleKeys(K, tq, key); if (x == null) continue; const ch = key.split('@')[0]; v[ch] = (v[ch] || 0) + x; }
  if ((C.layer || 'abs') === 'abs') for (const ch in v) v[ch] = clamp(ch, v[ch]);
  return v;
}
function sampleRig(C, id, t, { stepped = true } = {}) {
  const X = compile(C), R = X.rigs[id]; if (!R) return null; const tq = stepped ? drawT(t, X.step) : t, v = {};
  for (const [ch, K] of Object.entries(R.ch)) { const x = sampleKeys(K, tq, ch); if (x != null) v[ch] = x; }
  return v;
}
/* the props' state at t: for each thing named, the latest event at or before t */
function propsAt(C, t) {
  const X = compile(C), tq = drawT(t, X.step), own = {}, vis = {};
  for (const e of X.props) { if (e.t > tq) break; if (e.op === 'give') own[e.from] = e.to; else if (e.op === 'hide') vis[e.what] = false; else if (e.op === 'show') vis[e.what] = true; }
  return { own, vis };
}

/* ═════════════ in the page: the rigs posed from the sheet ═════════════ */
const hands = new WeakMap();   /* per arm pivot: the base matrices of the hand and what it holds, the wrist's axis */
function heldOf(r, side) { const P = r['arm' + side + 'P']; return P ? P.children.filter(c => c.type === 'Group' && !String(c.name).startsWith('slot')) : []; }
function wristOf(THREE, r, side) {
  const P = r['arm' + side + 'P']; let W = hands.get(P); if (W) return W;
  const g = heldOf(r, side), hand = g[1]; if (!hand) return null;
  P.updateWorldMatrix(true, true); const c = new THREE.Box3().setFromObject(hand).getCenter(new THREE.Vector3()); P.worldToLocal(c);
  W = { c, axis: c.clone().normalize(), base: new Map() }; hands.set(P, W); return W;
}
function rollHand(THREE, r, side, roll) {
  const W = wristOf(THREE, r, side); if (!W) return; const P = r['arm' + side + 'P'];
  const kids = heldOf(r, side).slice(1);   /* the hand and everything it holds (a given spear included: it was reparented here) */
  if (Math.abs(roll) < 1e-4 && !W.rolled) return;
  const M = new THREE.Matrix4().makeTranslation(W.c.x, W.c.y, W.c.z).multiply(new THREE.Matrix4().makeRotationAxis(W.axis, roll)).multiply(new THREE.Matrix4().makeTranslation(-W.c.x, -W.c.y, -W.c.z));
  for (const k of kids) { if (!W.base.has(k)) W.base.set(k, k.matrix.clone()); k.matrixAutoUpdate = false; k.matrix.copy(M).multiply(W.base.get(k)); k.matrixWorldNeedsUpdate = true; }
  W.rolled = Math.abs(roll) >= 1e-4; void P;
}
/* one actor's pose written into its rig: absolute where the sheet has the channel, the blocking's pose where it has not */
function applyRig(THREE, r, v, base) {
  if (!v) return;
  if (base && base.layer === 'add') return addRig(THREE, r, v, base);
  const x = v['root.x'] ?? r.pos.x, y = v['root.y'] ?? r.pos.y, z = v['root.z'] ?? r.pos.z, h = v['root.h'] ?? r.heading;
  r.pos.set(x, y, z); r.heading = h; r.figure.position.copy(r.pos);
  const e = new THREE.Euler().setFromQuaternion(r.figure.quaternion, 'YXZ');
  r.figure.rotation.set(v['root.pitch'] ?? e.x, h, v['root.roll'] ?? e.z, 'YXZ');
  if (v['hips.dy'] != null && base && base.hipsY != null) r.hipsP.position.y = base.hipsY - v['hips.dy'];
  const T = r.torsoP.rotation; T.set(v['torso.lean'] ?? T.x, v['torso.twist'] != null ? -v['torso.twist'] : T.y, v['torso.roll'] != null ? -v['torso.roll'] : T.z);
  const Hd = r.headP.rotation; Hd.set(v['head.pitch'] ?? Hd.x, v['head.yaw'] != null ? -v['head.yaw'] : Hd.y, Hd.z);
  for (const s of ['R', 'L']) { const A = r['arm' + s + 'P'].rotation, out = v['arm.' + s + '.out'];
    A.set(v['arm.' + s + '.pitch'] ?? A.x, A.y, out != null ? (s === 'R' ? -out : out) : A.z);
    const L = r['leg' + s + 'P'].rotation; if (v['leg.' + s + '.pitch'] != null) L.set(v['leg.' + s + '.pitch'], 0, 0); }
  for (const s of ['R', 'L']) if (v['hand.' + s + '.roll'] != null) rollHand(THREE, r, s, v['hand.' + s + '.roll']);
}
/* the additive layer (a sheet's layer 'add', what tools/choreograph.js writes): every channel is an offset laid over the pose the
   take has already given the figure this frame (the blocking eased between its keys, the walk, the performance's head and face),
   as an animator's acting layer sits over the layout pass; the sum is held inside CLAMP, but never pulled back past where the
   blocking itself put the joint. hand.*.roll and hips.dy have no pose under them and are the value itself. */
function within(ch, base, v) { const c = CLAMP[ch]; if (!c) return v; const lo = Math.min(c[0], base), hi = Math.max(c[1], base); return Math.max(lo, Math.min(hi, v)); }
function addRig(THREE, r, v, base) {
  const g = k => v[k] || 0;
  if (g('root.x') || g('root.y') || g('root.z')) { r.pos.set(r.pos.x + g('root.x'), r.pos.y + g('root.y'), r.pos.z + g('root.z')); r.figure.position.copy(r.pos); }
  if (g('root.h') || g('root.pitch') || g('root.roll')) { const e = new THREE.Euler().setFromQuaternion(r.figure.quaternion, 'YXZ'); r.figure.rotation.set(e.x + g('root.pitch'), e.y + g('root.h'), e.z + g('root.roll'), 'YXZ'); }   /* r.heading stays the blocking's: the cameras frame a figure by it, and a turn of the feet in the acting must not swing the camera */
  if (v['hips.dy'] != null && base.hipsY != null) r.hipsP.position.y = base.hipsY - v['hips.dy'];
  const T = r.torsoP.rotation; T.set(within('torso.lean', T.x, T.x + g('torso.lean')), -within('torso.twist', -T.y, -T.y + g('torso.twist')), -within('torso.roll', -T.z, -T.z + g('torso.roll')));
  const Hd = r.headP.rotation; Hd.set(within('head.pitch', Hd.x, Hd.x + g('head.pitch')), -within('head.yaw', -Hd.y, -Hd.y + g('head.yaw')), Hd.z);
  for (const s of ['R', 'L']) { const A = r['arm' + s + 'P'].rotation, sg = s === 'R' ? -1 : 1, o0 = A.z * sg;
    A.set(within('arm.' + s + '.pitch', A.x, A.x + g('arm.' + s + '.pitch')), A.y, sg * within('arm.' + s + '.out', o0, o0 + g('arm.' + s + '.out')));
    const L = r['leg' + s + 'P'].rotation; if (g('leg.' + s + '.pitch')) L.x = within('leg.' + s + '.pitch', L.x, L.x + g('leg.' + s + '.pitch')); }
  for (const s of ['R', 'L']) if (v['hand.' + s + '.roll'] != null) rollHand(THREE, r, s, v['hand.' + s + '.roll']);
}
/* the props at t: held parts moved between hands (their local matrix kept: both are right hands of the same toy), hidden, shown */
function applyProps(THREE, C, t, ctx, S) {
  const { own, vis } = propsAt(C, t);
  if (!S.props) { S.props = new Map();
    for (const e of compile(C).props) { const names = e.op === 'give' ? [e.from] : [e.what]; for (const n of names) { if (S.props.has(n)) continue;
      if (n.startsWith('prop:')) { let o = null; ctx.scene.traverse(q => { if (!o && q.name === n) o = q; }); S.props.set(n, { obj: o, kind: 'prop' }); continue; }
      const [id, side] = n.split(':'), r = ctx.rigOf(id); if (!r) continue; const g = heldOf(r, side || 'R').slice(2);
      S.props.set(n, { kind: 'held', parts: g, home: r['arm' + (side || 'R') + 'P'], vis0: g.map(p => p.visible) }); } } }
  for (const [n, P] of S.props) {
    if (P.kind === 'prop') { if (!P.obj) { let o = null; ctx.scene.traverse(q => { if (!o && q.name === n) o = q; }); P.obj = o; } if (P.obj && vis[n] != null) P.obj.visible = vis[n]; continue; }
    const to = own[n]; let dest = P.home; if (to) { const [id, side] = to.split(':'), r = ctx.rigOf(id); if (r) dest = r['arm' + (side || 'R') + 'P']; }
    P.parts.forEach((p, i) => { if (p.parent !== dest) dest.add(p); p.visible = vis[n] != null ? vis[n] : P.vis0[i]; });
  }
}
/* a prop's flight (the sheet's {op: 'fly'}: THROW with params.prop): from `t` it rides the thrower's live hand (`hand`, its centre on
   the hand plus `grip`), from each leg's t0 to t1 it flies on a parabola (arc: rise over the chord) to the leg's `to` (ctx.point:
   an actor's head, 'hand:<id>:R', '@anchor', [x, y, z]) plus `off`, turning `spin` turns about the level axis across its path, and
   after the last leg it lies where it landed until `until` (the take's next key stages it again). The staged prop object is looked up
   by name each drawing (each key re-stages its props). */
function applyFlights(THREE, C, t, ctx) {
  if (!ctx.point) return;
  for (const e of compile(C).props) { if (e.op !== 'fly' || t < e.t || (e.until != null && t >= e.until)) continue;
    let o = null; ctx.scene.traverse(q => { if (!o && q.name === e.what) o = q; }); if (!o) continue;
    if (!o.userData.fly) { o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(o), c = b.getCenter(new THREE.Vector3());
      o.userData.fly = { d: c.sub(o.position).applyQuaternion(o.quaternion.clone().invert()), q: o.quaternion.clone(), p: o.position.clone() }; }
    const F = o.userData.fly, P = v => v && new THREE.Vector3(...[v.x, v.y, v.z]), pt = (w, off) => { const v = P(ctx.point(w)); return v ? v.add(new THREE.Vector3(...(off || [0, 0, 0]))) : null; };
    let at = pt(e.hand, e.grip), spin = 0, axis = new THREE.Vector3(1, 0, 0);
    if (!at) continue;
    for (const L of e.legs) { if (t < L.t0) break; const to = pt(L.to, L.off); if (!to) break; const u = Math.min(1, (t - L.t0) / Math.max(1e-3, L.t1 - L.t0)), ch = to.clone().sub(at);
      const flat = new THREE.Vector3(ch.x, 0, ch.z); if (flat.lengthSq() > 1e-6) axis = new THREE.Vector3(-flat.z, 0, flat.x).normalize();
      at = at.clone().add(ch.multiplyScalar(u)); at.y += (L.arc || 0) * 4 * u * (1 - u); spin += (L.spin || 0) * u; if (u < 1) break; }
    const q = new THREE.Quaternion().setFromAxisAngle(axis, spin * 2 * Math.PI).multiply(F.q);
    o.quaternion.copy(q); o.position.copy(at.sub(F.d.clone().applyQuaternion(q))); o.updateMatrixWorld(true); }
}
/* a set piece moved (the sheet's {op: 'slide'}: a creature's MOVE_STONE with params.piece): before `t` the piece stands at `from` (an
   offset from where the set has it), from `t` to `t1` it is carried to `to` (default its own place) on an eased path lifted by `arc`
   at the middle, and it stays there after. The piece's meshes are found once by label (ctx.pieceMeshes) at their built place. */
function applySlides(THREE, C, t, ctx, S) {
  if (!ctx.pieceMeshes) return;
  /* a piece slid more than once (a take, back to one, another take): at t only its latest slide begun by t counts (its first before any) */
  const all = compile(C).props.filter(e => e.op === 'slide'), cur = {};
  for (const e of all) { const c = cur[e.what]; if (!c || (e.t <= t && (c.t > t || e.t >= c.t)) || (c.t > t && e.t < c.t)) cur[e.what] = e; }
  for (const e of all) { if (cur[e.what] !== e) continue; S.slides = S.slides || {};
    let st = S.slides[e.what]; if (!st) { const ms = ctx.pieceMeshes(e.what.replace(/^piece:/, '')) || []; st = S.slides[e.what] = ms.map(m => ({ m, p: m.position.clone() })); }
    const a = e.from || [0, 0, 0], b = e.to || [0, 0, 0], u = t <= e.t ? 0 : t >= e.t1 ? 1 : (x => x * x * (3 - 2 * x))((t - e.t) / Math.max(1e-3, e.t1 - e.t));
    const off = new THREE.Vector3(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + (e.arc || 0) * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u);
    for (const s of st) { s.m.position.copy(s.p).add(off); s.m.updateMatrixWorld(true); } }
}
function restoreSlides(S) { if (!S || !S.slides) return; for (const st of Object.values(S.slides)) for (const s of st) { s.m.position.copy(s.p); s.m.updateMatrixWorld(true); } }
function restoreProps(S) { if (!S || !S.props) return; for (const P of S.props.values()) if (P.kind === 'held') P.parts.forEach((p, i) => { if (p.parent !== P.home) P.home.add(p); p.visible = P.vis0[i]; }); }
/* the ship: a set piece turned about its pivot; its riders turned and lifted with it */
function applyShip(THREE, R, v, ctx, S, t) {
  if (!R || !v) return; S.ship = S.ship || {};
  let st = S.ship[R.piece]; if (!st) { const ms = ctx.pieceMeshes ? ctx.pieceMeshes(R.piece) : []; st = S.ship[R.piece] = { ms: ms.map(m => ({ m, p: m.position.clone(), q: m.quaternion.clone() })) }; }
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(v.pitch || 0, R.yaw || 0, v.roll || 0, 'YXZ')), q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R.yaw || 0, 0, 'YXZ'));
  const Q = q.clone().multiply(q0.clone().invert()), piv = new THREE.Vector3(...R.pivot), off = piv.clone().sub(piv.clone().applyQuaternion(Q)); off.y += v.heave || 0; off.x += v.dx || 0; off.z += v.dz || 0;
  for (const s of st.ms) { s.m.quaternion.copy(s.q).premultiply(Q); s.m.position.copy(s.p).applyQuaternion(Q).add(off); s.m.updateMatrixWorld(true); }
  for (const rd of R.riders || []) { const id = Array.isArray(rd) ? rd[0] : rd; if (Array.isArray(rd) && (t < rd[1] || (rd[2] != null && t > rd[2]))) continue; const r = ctx.rigOf(id); if (!r || r.figure.visible === false) continue; const f = r.figure; f.position.applyQuaternion(Q).add(off); f.quaternion.premultiply(Q); r.pos.copy(f.position); }
  S.shipQ = Q; S.shipOff = off;
}
function restoreShip(S) { if (!S || !S.ship) return; for (const st of Object.values(S.ship)) for (const s of st.ms) { s.m.position.copy(s.p); s.m.quaternion.copy(s.q); s.m.updateMatrixWorld(true); } }
/* a player for one take: ctx {THREE, scene, rigOf(id), hipsOf(rig), pieceMeshes(label)} */
function player(C, ctx) {
  const S = {}, X = compile(C), THREE = ctx.THREE;
  return {
    C, has: id => !!X.actors[id],
    /* after the take has posed the blocking and the face: the sheet's servos for every actor it names, then the rigs, the props */
    apply(t) {
      for (const id of Object.keys(X.actors)) { const r = ctx.rigOf(id); if (!r || r.figure.visible === false || r.absent) continue; applyRig(THREE, r, sampleActor(C, id, t), { hipsY: ctx.hipsOf(r), layer: C.layer || 'abs' }); }
      for (const [id, R] of Object.entries(X.rigs)) if (R.type === 'ship' || id === 'ship') applyShip(THREE, R, sampleRig(C, id, t), ctx, S, t);
      applyProps(THREE, C, t, ctx, S);
      applyFlights(THREE, C, t, ctx);
      applySlides(THREE, C, t, ctx, S);
    },
    /* whether an actor is travelling at t (the take's camera tracks a walker) */
    walking(id, t) { if ((C.layer || 'abs') === 'add') return false;   /* an acting layer's root offsets (a step back, a lean) are not walks: the take's own walks are the blocking's */
      const a = sampleActor(C, id, t, { stepped: false }), b = sampleActor(C, id, t + 0.25, { stepped: false }); if (!a || a['root.x'] == null) return false; return Math.hypot(b['root.x'] - a['root.x'], b['root.z'] - a['root.z']) > 2.5; },
    /* the ship's turn and offset at the last apply (the take lays a rope from the mast with it) */
    ship() { return S.shipQ ? { Q: S.shipQ, off: S.shipOff } : null; },
    dispose() { restoreProps(S); restoreShip(S); restoreSlides(S); }
  };
}
const API = { CH, CLAMP, EASE, drawT, sampleKeys, sampleActor, sampleRig, propsAt, compile, merged, player, applyRig, applyFlights, applySlides, version: 1 };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
root.OdysseyChoreo = API;
})(typeof window !== 'undefined' ? window : globalThis);
