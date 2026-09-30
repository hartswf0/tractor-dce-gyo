/* tools/perform/intents-creature.js — intents for creatures (film-readymades/creatures.js rigs: a giant, a ram, a dog, Scylla).

   A scene declares its creatures in `authored.creatures: {id: {kind, scale, at: [x, y, z, h] | place: {preset, box | at, h}}}`; an
   intent whose actor is a creature is realised here (compile.js dispatches on the actor). Each writes procedures or keys on the
   sheet's `creatures[id]` through X.cmove, which records an ACTION event with its causes and body lanes, as a figure's moves do.

   POSE     {preset, fade}                      a preset (sprawl, sit, stand, roar, crouch; graze, lie; bark) held over t0..t1
   SLEEP    {breath}                            the eye shut, the head fallen, a slow heavy breath (body.dy)
   TALK     {utterance: gi}                     the jaw on the voice's phrases, the head rolling with the stresses (a drunk giant)
   STIR     {hand}                              a groan: the hand moves, the head turns, the eye does not open
   BLINDED  {}                                  the eye put out: the head thrown back, both hands to the face, the jaw open
   ROAR     {preset: 'roar', place}             rises into the roar (preset faded in), moved to `place` [x, y, z, h] if given
   WALK     {path: [[t, x, z]...], gait}        a heavy giant's walk (heavy) or a quadruped's gait along a path
   GROPE    {center, width, depth, hand}        a blind hand searching a lane (grope)
   REACH    {hand, target | at}                 a hand to a figure (its position at t0) or a point (reach, IK)
   SEIZE    {hand, target, lift}                reach to a man, close the hand, carry him: the man is a rider on grip.R from the grip
   EAT      {hand, target}                      SEIZE, then the hand to the mouth; the man leaves the scene there
   THROW    {hand, from, to, flight}            a rock torn up and lifted overhead, the throw, and the rock's arc (a PROP track the
                                                previz draws and the take can follow)
   HERD     {path, n, index}                    one animal of a flock (herd): its place in the file, separation, the leader's path
   STRIKE   {targets: [actor ids], lift}        Scylla's heads: coil, strike at the rowers, seize, lift (riders on the jaws) */
'use strict';
const Cr = require('../../film-readymades/creatures.js');
const r3 = v => Math.round(v * 1000) / 1000;
const rigOf = (X, id) => { const A = X.creatures[id]; return Cr.define(A.kind, { id, scale: A.scale }); };
/* where a creature is, and its pose, at t (the sheet as written so far) */
const cstate = (X, id, t) => Cr.sample({ creatures: X.creatures, step: 'twos' }, id, t, { stepped: false });
const figPoint = (X, target, t, y) => { if (Array.isArray(target)) return target; const s = X.at(target, t); return s ? [s.p[0], (s.p[1] || 0) + (y != null ? y : X.H(target) * 0.5), s.p[2]] : null; };
/* the place for a creature in a preset so that its body covers a box (the take's set piece) or sits at a point, heading h */
function place(kind, scale, preset, o) {
  const rig = Cr.define(kind, { scale }), K = Cr.kinds().find(k => k.kind === kind), h = o.h || 0;
  const v = Object.assign(rig.rest(), rig.preset(preset) || {}, { 'root.x': 0, 'root.y': 0, 'root.z': 0, 'root.h': h }), P = rig.pose(v);
  let lo = [1e9, 1e9], hi = [-1e9, -1e9], ylo = 1e9; for (const n of K.nodes) { const M = P.nodes[n.id]; if (!M) continue; const p = Cr.m.ap(M, n.p); lo = [Math.min(lo[0], p[0]), Math.min(lo[1], p[2])]; hi = [Math.max(hi[0], p[0]), Math.max(hi[1], p[2])]; if (!/^(arm|elbow|hand)/.test(n.id)) ylo = Math.min(ylo, p[1]); }   /* the trunk and legs rest on the floor; an arm may hang lower */
  const c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2];
  if (o.box) { const b = o.box, bc = [(b[0] + b[3]) / 2, (b[2] + b[5]) / 2]; return [r3(bc[0] - c[0]), r3(b[1] - ylo), r3(bc[1] - c[1]), h]; }
  if (o.center) return [r3(o.center[0] - c[0]), r3((o.y || 0) - ylo), r3(o.center[1] - c[1]), h];
  return [o.at[0], o.at[1] || 0, o.at[2], h];
}
const rootKeys = (a, b, t0, t1) => ({ 'root.x': [[t0, a[0]], [t1, b[0]]], 'root.y': [[t0, a[1]], [t1, b[1]]], 'root.z': [[t0, a[2]], [t1, b[2]]], 'root.h': [[t0, a[3]], [t1, b[3]]] });
const K = {};
K.POSE = (X, I, e) => X.cmove(I.actor, 'POSE', e, { proc: { type: 'preset', name: I.params.preset, from: I.t0, to: I.t1, fade: I.params.fade != null ? I.params.fade : 0.6 } }, { label: I.params.preset });
K.SLEEP = (X, I, e) => { const keys = { eye: [[I.t0, 0], [I.t0 + 1.2, 2, 'in']], 'head.pitch@sleep': [[I.t0, 0], [I.t0 + 2, -0.12]], 'body.dy@breath': [] };
  const P = (I.params && I.params.breath) || 4.2; for (let t = I.t0, up = 0; t <= I.t1; t += P / 2, up ^= 1) keys['body.dy@breath'].push([r3(t), up ? 4 * (X.creatures[I.actor].scale || 1) : 0]);
  keys['body.dy@breath'].push([I.t1 + 0.4, 0]); keys['head.pitch@sleep'].push([I.t1, -0.12], [I.t1 + 0.5, 0]);
  return X.cmove(I.actor, 'SLEEP', e, { keys }, { label: I.label || 'asleep: the eye shut, the slow breath' }); };
K.TALK = (X, I, e) => { const c = X.M.clips.find(c => c.gi === I.utterance); if (!c) return null; const V = X.voiceOf(c), jaw = [[c.at - 0.1, 0]], yaw = [[c.at, 0]];
  for (const p of V.phrases) { jaw.push([r3(p.t0), 0.05], [r3(p.t0 + 0.12), 0.35], [r3((p.t0 + p.t1) / 2), 0.15], [r3(p.t1 - 0.1), 0.3], [r3(p.t1), 0.02]); }
  (V.stresses || []).forEach((s, k) => yaw.push([r3(s.t != null ? s.t : s), (k % 2 ? -1 : 1) * 0.14]));
  yaw.push([c.at + c.dur + 0.3, 0]); jaw.push([c.at + c.dur + 0.2, 0]);
  return X.cmove(I.actor, 'TALK', e, { keys: { 'jaw@voice': jaw.sort((a, b) => a[0] - b[0]), 'head.yaw@voice': yaw.sort((a, b) => a[0] - b[0]) } }, { label: I.label || 'the jaw on the voice' }); };
K.STIR = (X, I, e) => { const h = (I.params && I.params.hand) || 'R', t = I.t0;
  return X.cmove(I.actor, 'STIR', e, { keys: { ['arm.' + h + '.out@stir']: [[t, 0], [t + 0.5, 0.35], [t + 1.6, 0.1]], 'head.yaw@stir': [[t, 0], [t + 0.7, 0.3], [t + 2, 0.12]], 'jaw@stir': [[t, 0], [t + 0.3, 0.3], [t + 1.1, 0]] } }, { label: I.label || 'a groan: the hand moves' }); };
K.BLINDED = (X, I, e) => { const t = I.t0;
  return X.cmove(I.actor, 'BLINDED', e, { keys: { eye: [[t, 2]], 'head.pitch@blind': [[t, 0], [t + 0.25, 0.45], [t + 1.4, 0.25], [I.t1, 0.1]], 'jaw@blind': [[t, 0], [t + 0.2, 0.8], [I.t1, 0.4]],
    'arm.R.pitch@blind': [[t + 0.2, 0], [t + 0.8, -1.9], [I.t1, -1.6]], 'arm.L.pitch@blind': [[t + 0.25, 0], [t + 0.85, -1.8], [I.t1, -1.5]], 'elbow.R@blind': [[t + 0.2, 0], [t + 0.8, -1.2]], 'elbow.L@blind': [[t + 0.25, 0], [t + 0.85, -1.2]] } }, { label: I.label || 'the eye put out: hands to the face' }); };
K.ROAR = (X, I, e) => { const A = X.creatures[I.actor], out = [];
  if (I.params && I.params.place) { const s = cstate(X, I.actor, I.t0).v, a = [s['root.x'], s['root.y'], s['root.z'], s['root.h']]; out.push(X.cmove(I.actor, 'RISE', e, { keys: rootKeys(a, I.params.place, I.t0, I.t0 + (I.params.rise || 1.4)) }, { label: 'rises to his feet' })); }
  out.push(X.cmove(I.actor, 'ROAR', e, { proc: { type: 'preset', name: (I.params && I.params.preset) || 'roar', from: I.t0, to: I.t1, fade: 0.8 }, keys: { 'jaw@roar': [[I.t0, 0], [I.t0 + 0.4, 1], [I.t1 - 0.3, 0.8], [I.t1, 0.2]] } }, { label: I.label || 'the roar' }));
  void A; return out[out.length - 1]; };
K.WALK = (X, I, e) => { const A = X.creatures[I.actor], giant = Cr.KINDS[A.kind].family === 'giant', p = I.params;
  /* creatures.js heavy() tabulates its lag from t = 0 on a function path: a path that starts later is held at its first place from 0 */
  const path = p.path[0][0] > 0 ? [[0, p.path[0][1], p.path[0][2]], ...p.path] : p.path;
  return X.cmove(I.actor, 'WALK', e, { proc: giant ? { type: 'heavy', path, from: I.t0, to: I.t1, fade: 0.5, y: p.y || 0, base: p.base } : { type: 'gait', path, gait: p.gait || 'walk', from: I.t0, to: I.t1, fade: 0.3, y: p.y || 0 } }, { label: I.label || (giant ? 'the heavy walk' : (p.gait || 'walk')) }); };
K.GROPE = (X, I, e) => { const p = I.params; return X.cmove(I.actor, 'GROPE', e, { proc: { type: 'grope', center: p.center, width: p.width || 80, depth: p.depth || 30, period: p.period || 3.2, hand: p.hand, from: I.t0, to: I.t1, fade: 0.8, seed: p.seed || 1 } }, { label: I.label || 'the blind hands search' }); };
K.REACH = (X, I, e) => { const p = I.params || {}, tgt = (X.ids.includes(p.at || I.target) ? figPoint(X, p.at || I.target, I.t0, p.y) : pointOf(X, p.at || I.target, I.t0)); if (!tgt) return null;
  return X.cmove(I.actor, 'REACH', e, { proc: { type: 'reach', hand: p.hand || 'R', target: tgt, from: I.t0, to: I.t1, fade: p.fade || 0.7 } }, { label: I.label || 'reaches' }); };
K.SEIZE = (X, I, e, eat) => { const p = I.params || {}, hand = p.hand || 'R', tg = I.target, tgrip = I.t0 + (p.reach || 1.0), tgt = figPoint(X, tg, tgrip, X.H(tg) * 0.55); if (!tgt) return null;
  const up = [tgt[0], tgt[1] + (p.lift || 120), tgt[2]];
  const ev1 = X.cmove(I.actor, 'SEIZE', e, { proc: { type: 'reach', hand, target: tgt, from: I.t0, to: tgrip + 0.3, fade: 0.6 }, keys: { ['hand.' + hand + '.roll@grip']: [[tgrip - 0.1, 0], [tgrip + 0.1, 0.9]] } }, { label: I.label || 'seizes ' + tg });
  X.cmove(I.actor, 'LIFT', ev1, { proc: { type: 'reach', hand, target: up, from: tgrip + 0.3, to: eat ? tgrip + 1.6 : I.t1, fade: 0.5 }, riders: [{ actor: tg, at: 'grip.' + hand, from: r3(tgrip), to: r3(eat ? tgrip + 2.8 : I.t1), offset: [0, 0, 0] }] }, { label: 'lifts ' + tg });
  X.ev({ lane: 'CONTACT', actor: I.actor, actors: [I.actor, tg], t0: r3(tgrip), t1: r3(eat ? tgrip + 2.8 : I.t1), kind: 'GRIP', label: I.actor + ' holds ' + tg + ' in his fist (a rider on grip.' + hand + ')', because: [{ id: ev1.id, latency: 0 }], params: { k: 6 } });
  return { ev1, tgrip }; };
K.EAT = (X, I, e) => { const r = K.SEIZE(X, I, e, true); if (!r) return null; const hand = (I.params && I.params.hand) || 'R', rig = rigOf(X, I.actor), t = r.tgrip + 1.6;
  const s = cstate(X, I.actor, t), m = rig.anchor('mouth', s.v); if (!m) return null;
  X.cmove(I.actor, 'EAT', r.ev1, { proc: { type: 'reach', hand, target: m.slice(0, 3), from: t, to: t + 1.4, fade: 0.4 }, keys: { 'jaw@eat': [[t + 0.6, 0], [t + 0.9, 0.9], [t + 1.3, 0.1], [t + 1.6, 0.7], [t + 2.2, 0]] } }, { label: 'to the mouth' });
  X.ev({ lane: 'STIMULUS', actor: I.actor, t0: r3(t + 1.2), t1: r3(t + 1.5), kind: 'DEVOURED', label: I.target + ' eaten', because: [{ id: r.ev1.id, latency: r3(t + 1.2 - I.t0) }] });
  return r.ev1; };
K.THROW = (X, I, e) => { const p = I.params || {}, hand = p.hand || 'R', lift = I.t0 + (p.lift || 1.4), rel = lift + (p.wind || 0.8), rig = rigOf(X, I.actor);
  const s0 = cstate(X, I.actor, I.t0).v, grip0 = rig.anchor('grip.' + hand, s0), from = p.from || (grip0 ? grip0.slice(0, 3) : [s0['root.x'], 100, s0['root.z']]);
  const hr = rig.anchor('head', s0), over = hr ? [hr[0], hr[1] + 60 * (X.creatures[I.actor].scale || 1), hr[2]] : [from[0], from[1] + 200, from[2]];
  const ev1 = X.cmove(I.actor, 'TEAR UP', e, { proc: { type: 'reach', hand, target: from, from: I.t0, to: I.t0 + 0.6, fade: 0.5 }, keys: { 'torso.lean@throw': [[I.t0, 0], [I.t0 + 0.5, 0.35], [lift, -0.2], [rel, 0.4, 'in'], [rel + 0.6, 0.15]] } }, { label: 'tears up the rock' });
  X.cmove(I.actor, 'THROW', ev1, { proc: { type: 'reach', hand, target: over, from: I.t0 + 0.6, to: rel, fade: 0.4 }, keys: { ['arm.' + hand + '.pitch@throw']: [[rel - 0.05, 0], [rel + 0.25, 1.4, 'in'], [rel + 0.9, 0.5]], 'jaw@throw': [[rel - 0.2, 0], [rel, 0.9], [rel + 1.2, 0.2]] } }, { label: 'hurls it' });
  const tp = p.to || pointOf(X, I.target, rel), to = tp && !p.to && p.short != null ? [over[0] + (tp[0] - over[0]) * p.short, 0, over[2] + (tp[2] - over[2]) * p.short] : tp ? [tp[0], 0, tp[2]] : null, fl = p.flight || 2.2, track = []; if (to) for (let t = rel; t <= rel + fl + 1e-6; t += 1 / 12) track.push([r3(t), Cr.throwArc(t, { from: over, to, t0: rel, t1: rel + fl, g: p.g || 300 }).map(r3)]);
  const flight = X.ev({ lane: 'PROP', actor: I.actor, t0: r3(rel), t1: r3(rel + fl), kind: 'FLIGHT', label: (p.prop || 'the rock') + ' in the air (a parabola)', because: [{ id: ev1.id, latency: r3(rel - I.t0) }], params: { prop: p.prop || 'rock', track } });
  X.ev({ lane: 'FX', t0: r3(rel + fl), t1: r3(rel + fl + 0.8), kind: 'SPLASH', label: 'the rock lands', because: [{ id: flight.id, latency: fl }], params: { at: to } });
  X.S.objects = X.S.objects || {}; X.S.objects[p.prop || 'rock'] = { kind: 'rock', material: 'stone', track: [[0, over], ...track], affords: [] };
  return flight; };
K.HERD = (X, I, e) => { const p = I.params; return X.cmove(I.actor, 'HERD', e, { proc: { type: 'herd', path: p.path, n: p.n || 4, index: p.index || 0, gait: p.gait || 'walk', spacing: p.spacing || 60, seed: p.seed || 3, from: I.t0, to: I.t1, fade: 0.3 } }, { label: I.label || 'with the flock' }); };
K.STRIKE = (X, I, e) => { const p = I.params || {}, tg = (p.targets || []).map(id => figPoint(X, id, I.t0 + 0.3, X.H(id) * 0.6)).filter(Boolean);
  const ev1 = X.cmove(I.actor, 'STRIKE', e, { proc: { type: 'strike', targets: tg, t0: I.t0, lift: p.lift || 4, from: I.t0 - 1, to: I.t1, fade: 0.5 } }, { label: I.label || 'the six heads strike' });
  (p.targets || []).forEach((id, k) => { X.cmove(I.actor, 'SEIZED', ev1, { riders: [{ actor: id, at: 'jaw' + (k + 1), from: r3(I.t0 + 0.4), to: r3(I.t1) }], from: I.t0 + 0.4, to: I.t1 }, { label: id + ' in jaw ' + (k + 1) });
    X.ev({ lane: 'CONTACT', actor: I.actor, actors: [I.actor, id], t0: r3(I.t0 + 0.4), t1: r3(I.t1), kind: 'GRIP', label: 'jaw ' + (k + 1) + ' holds ' + id, because: [{ id: ev1.id, latency: 0.4 }], params: { k: 6 } }); });
  return ev1; };
/* the bearing of a target (a figure, a piece, a point) from a creature's root at t, in its own heading's frame */
function bearing(X, id, target, t) { const v = cstate(X, id, t).v, p = pointOf(X, target, t); if (!p) return null; const dx = p[0] - (v['root.x'] || 0), dz = p[2] - (v['root.z'] || 0);
  const a = Math.atan2(dx, dz) - (v['root.h'] || 0); return { yaw: Math.atan2(Math.sin(a), Math.cos(a)), pitch: Math.atan2(p[1] - 200 * (X.creatures[id].scale || 1), Math.hypot(dx, dz)), p }; }
/* a target: a figure's id, a set piece's label (its box centre), a word for up ('sky'), or a point */
function pointOf(X, target, t) { if (Array.isArray(target)) return target; if (!target) return null; if (/^(sky|heaven|the gods|zeus|father)/i.test(target)) { const v = cstate(X, Object.keys(X.creatures)[0], t).v; return [v['root.x'] || 0, 2000, (v['root.z'] || 0) + 300]; }
  const f = figPoint(X, target, t); if (f && X.ids.includes(target)) return f; if (X.creatures[target]) { const v = cstate(X, target, t).v; return [v['root.x'], 100, v['root.z']]; }
  const pc = (X.M.pieces || []).find(p => p.label === target) || (X.M.pieces || []).find(p => p.label.includes(String(target).replace(/-/g, ' '))); if (pc) { const b = pc.box; return [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2]; } return null; }
K.ATTEND = (X, I, e) => { const b = bearing(X, I.actor, I.target, I.t0); if (!b) return null; const yaw = Math.max(-0.9, Math.min(0.9, b.yaw)), tw = Math.max(-0.4, Math.min(0.4, b.yaw - yaw)), t0 = I.t0, t1 = I.t1;
  return X.cmove(I.actor, 'ATTEND', e, { keys: { 'head.yaw@att': [[t0, 0], [t0 + 0.8, yaw], [t1, yaw * 0.9], [t1 + 0.8, 0]], 'torso.twist@att': [[t0, 0], [t0 + 1.2, tw], [t1, tw], [t1 + 1, 0]], 'head.pitch@att': [[t0, 0], [t0 + 0.8, Math.max(-0.3, Math.min(0.3, b.pitch))], [t1, 0.1], [t1 + 0.8, 0]] } }, { label: I.label || 'turns his head to ' + I.target }); };
K.LISTEN = K.ATTEND;
K.RECOGNISE = (X, I, e) => { const t0 = I.t0, t1 = I.t1;   /* the name lands: still, the head drops, the jaw hangs, then he lifts his face */
  return X.cmove(I.actor, 'RECOGNISE', e, { keys: { 'head.pitch@rec': [[t0, 0], [t0 + 0.5, -0.35, 'out'], [t0 + 3, -0.3], [t1 - 1, 0.1], [t1, 0]], 'jaw@rec': [[t0, 0], [t0 + 0.6, 0.5], [t0 + 3.5, 0.3], [t1, 0]], 'torso.lean@rec': [[t0, 0], [t0 + 0.8, 0.25], [t1, 0.05], [t1 + 0.6, 0]], 'body.dy@rec': [[t0, 0], [t0 + 1, -6], [t1, 0]] } }, { label: I.label || 'the prophecy remembered' }); };
K.INVOKE = (X, I, e) => { const t0 = I.t0, t1 = I.t1, sw = []; for (let t = t0 + 2; t < t1 - 1; t += 2.4) sw.push([r3(t), -2.7], [r3(t + 1.2), -2.4]);
  return X.cmove(I.actor, 'INVOKE', e, { keys: { 'arm.R.pitch@inv': [[t0, 0], [t0 + 1.4, -2.7], ...sw, [t1, -2.5], [t1 + 1, 0]], 'arm.L.pitch@inv': [[t0 + 0.1, 0], [t0 + 1.5, -2.6], ...sw.map(([t, v]) => [r3(t + 0.2), v + 0.1]), [t1, -2.4], [t1 + 1, 0]],
    'arm.R.out@inv': [[t0, 0], [t0 + 1.4, 0.4], [t1, 0.4], [t1 + 1, 0]], 'arm.L.out@inv': [[t0, 0], [t0 + 1.4, 0.4], [t1, 0.4], [t1 + 1, 0]], 'head.pitch@inv': [[t0, 0], [t0 + 1.2, 0.45], [t1, 0.4], [t1 + 1, 0]], 'jaw@inv': [[t0, 0], [t0 + 1.5, 0.5], [t1, 0.4], [t1 + 0.5, 0]] } }, { label: I.label || 'hands to the sky: the prayer' }); };
K.GESTURE = (X, I, e) => (I.params && /invoke|pray|oath/.test(I.params.shape || '') ? K.INVOKE : K.ATTEND)(X, I, e);
module.exports = Object.assign(K, { place, cstate, pointOf });
