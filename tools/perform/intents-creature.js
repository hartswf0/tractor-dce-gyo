/* tools/perform/intents-creature.js — intents for creatures (film-readymades/creatures.js rigs: a giant, a ram, a dog, Scylla).

   A scene declares its creatures in `authored.creatures: {id: {kind, scale, at: [x, y, z, h] | place: {preset, box | at, h}}}`; an
   intent whose actor is a creature is realised here (compile.js dispatches on the actor). Each writes procedures or keys on the
   sheet's `creatures[id]` through X.cmove, which records an ACTION event with its causes and body lanes, as a figure's moves do.

   POSE     {preset, fade}                      a preset (sprawl, sit, stand, roar, crouch; graze, lie; bark) held over t0..t1
   SLEEP    {breath}                            the eye shut, the head fallen, a slow heavy breath (body.dy)
   TALK     {utterance: gi}                     the jaw on the voice's phrases, the head rolling with the stresses (a drunk giant)
   STIR     {hand}                              a groan: the hand moves, the head turns, the eye does not open
   BLINDED  {}                                  the eye put out (eye 3, the replacement part): the head thrown back, both hands to the face, the jaw open
   ROAR     {preset: 'roar', place}             rises into the roar (preset faded in), moved to `place` [x, y, z, h] if given
   WALK     {path: [[t, x, z]...], gait}        a heavy giant's walk (heavy) or a quadruped's gait along a path
   GROPE    {center, width, depth, hand}        a blind hand searching a lane (grope)
   REACH    {hand, target | at}                 a hand to a figure (its position at t0) or a point (reach, IK)
   SEIZE    {hand, target, lift}                reach to a man, close the hand, carry him: the man is a rider on grip.R from the grip
   EAT      {hand, target}                      SEIZE, then the hand to the mouth; the man leaves the scene there
   THROW    {hand, from, to, flight}            a rock torn up and lifted overhead, the throw, and the rock's arc (a PROP track the
                                                previz draws and the take can follow)
   HERD     {path, n, index}                    one animal of a flock (herd): its place in the file, separation, the leader's path
   STRIKE   {targets: [actor ids], lift, delays} Scylla's heads: coil, strike at the rowers, seize, lift (riders on the jaws)
   MOVE_STONE {target, to}                      the door stone rolled aside by both hands (a PROP track)
   DRINK    {gulps}                             the bowl to the mouth, the head back, a gulp at a time
   CARESS   {target, anchor, strokes}           the hand drawn along a ram's back (reach procedures along the back)
   FAWN     {target, path}                      a beast fawning (head low, tail going, a nuzzle)
   GRAZE    {}                                  the head to the ground and up
   CARRY    {riders: [{actor, at, lie}]}        men under a ram's belly or across a back (CONTACT RIDER)
   TURN     {target | h}                        the whole body turned where it stands to face a figure or a point
   CHANGE   {man, at}                           the beast's half of TRANSFORM: the face on the man for one drawing, then the beast */
'use strict';
const Cr = require('../../film-readymades/creatures.js'), Ground = require('./ground.js');
const r3 = v => Math.round(v * 1000) / 1000;
const rigOf = (X, id) => { const A = X.creatures[id]; return Cr.define(A.kind, { id, scale: A.scale }); };
/* where a creature is, and its pose, at t (the sheet as written so far) */
const cstate = (X, id, t) => Cr.sample({ creatures: X.creatures, step: 'twos' }, id, t, { stepped: false, ctx: Ground.ctxFor(X.sid) });
const figPoint = (X, target, t, y) => { if (Array.isArray(target)) return target; const s = X.at(target, t); return s ? [s.p[0], (s.p[1] || 0) + (y != null ? y : X.H(target) * 0.5), s.p[2]] : null; };
/* the place for a creature in a preset so that its body covers a box (the take's set piece) or sits at a point, heading h: {at: [x, y,
   z, h], floor} where floor is the ground it was stood on. With o.M (the marks) and no height given, that ground is the take's own
   (tools/perform/ground.js: the probed ray, else the piece boxes); the player casts the same ray under the rig as it moves and lifts
   or lowers it by the difference (film-readymades/creatures.js sample, ctx.ground) */
function placeAt(kind, scale, preset, o) {
  const rig = Cr.define(kind, { scale }), K = Cr.kinds().find(k => k.kind === kind), h = o.h || 0;
  const v = Object.assign(rig.rest(), rig.preset(preset) || {}, { 'root.x': 0, 'root.y': 0, 'root.z': 0, 'root.h': h }), P = rig.pose(v);
  let lo = [1e9, 1e9], hi = [-1e9, -1e9], ylo = 1e9, yall = 1e9; for (const n of K.nodes) { const M = P.nodes[n.id]; if (!M) continue; const p = Cr.m.ap(M, n.p); lo = [Math.min(lo[0], p[0]), Math.min(lo[1], p[2])]; hi = [Math.max(hi[0], p[0]), Math.max(hi[1], p[2])]; yall = Math.min(yall, p[1]); if (!/^(arm|elbow|hand)/.test(n.id)) ylo = Math.min(ylo, p[1]); }   /* the trunk and legs rest on the floor; an arm may hang lower */
  if (ylo > 1e8) ylo = 0; if (yall > 1e8) yall = 0;
  const c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2], ground = (x, z, near) => (o.M && o.ground !== false ? Ground.at(o.M, x, z, near).y : near != null ? near : 0);
  if (o.floor != null && o.at) return { at: [o.at[0], r3(o.floor - yall), o.at[2], h], floor: o.floor };   /* as the take sets a floor prop: its lowest point on the ground under it */
  if (o.anchor && o.to) { const A = rig.anchor(o.anchor, v); if (A) { const x = r3(o.to[0] - A[0]), z = r3(o.to[2] - A[2]), f = o.y != null ? o.y + ylo : ground(x + c[0], z + c[1], 0); return { at: [x, r3(f - ylo), z, h], floor: r3(f) }; } }   /* an anchor (the eye) on a point; the trunk on the floor */
  if (o.box) { const b = o.box, bc = [(b[0] + b[3]) / 2, (b[2] + b[5]) / 2], f = ground(bc[0], bc[1], b[1]); return { at: [r3(bc[0] - c[0]), r3(f - ylo), r3(bc[1] - c[1]), h], floor: r3(f) }; }
  if (o.center) { const f = o.y != null ? o.y : ground(o.center[0], o.center[1], 0); return { at: [r3(o.center[0] - c[0]), r3(f - ylo), r3(o.center[1] - c[1]), h], floor: r3(f) }; }
  return { at: [o.at[0], o.at[1] || 0, o.at[2], h], floor: null };
}
const place = (kind, scale, preset, o) => placeAt(kind, scale, preset, o).at;
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
  return X.cmove(I.actor, 'BLINDED', e, { keys: { eye: [[t - 0.05, 2], [t, 3]], 'head.pitch@blind': [[t, 0], [t + 0.25, 0.45], [t + 1.4, 0.25], [I.t1, 0.1]], 'jaw@blind': [[t, 0], [t + 0.2, 0.8], [I.t1, 0.4]],
    'arm.R.pitch@blind': [[t + 0.2, 0], [t + 0.8, -1.9], [I.t1, -1.6]], 'arm.L.pitch@blind': [[t + 0.25, 0], [t + 0.85, -1.8], [I.t1, -1.5]], 'elbow.R@blind': [[t + 0.2, 0], [t + 0.8, -1.2]], 'elbow.L@blind': [[t + 0.25, 0], [t + 0.85, -1.2]] } }, { label: I.label || 'the eye put out: hands to the face' }); };
K.ROAR = (X, I, e) => { const A = X.creatures[I.actor], out = [];
  if (I.params && I.params.place) { const s = cstate(X, I.actor, I.t0).v, a = [s['root.x'], s['root.y'], s['root.z'], s['root.h']]; out.push(X.cmove(I.actor, 'RISE', e, { proc: { type: 'place', a, b: I.params.place.slice(0, 4), from: I.t0, to: I.t0 + (I.params.rise || 1.4) } }, { label: 'rises to his feet' })); }
  out.push(X.cmove(I.actor, 'ROAR', e, { proc: { type: 'preset', name: (I.params && I.params.preset) || 'roar', from: I.t0, to: I.t1, fade: 0.8 }, keys: Object.assign({ 'jaw@roar': [[I.t0, 0], [I.t0 + 0.4, 1], [I.t1 - 0.3, 0.8], [I.t1, 0.2]] }, I.params && I.params.eye != null ? { eye: [[I.t0 - 0.05, 2], [I.t0 + 0.1, I.params.eye]] } : {}) }, { label: I.label || 'the roar' }));
  void A; return out[out.length - 1]; };
K.WALK = (X, I, e) => { const A = X.creatures[I.actor], giant = Cr.KINDS[A.kind].family === 'giant', p = I.params;
  const path = p.path;   /* heavy() holds a path that starts after 0 at its first place (creatures.js follow) */
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
K.HERD = (X, I, e) => { const p = I.params; return X.cmove(I.actor, 'HERD', e, { proc: Object.assign({ type: 'herd', path: p.path, n: p.n || 4, index: p.index || 0, gait: p.gait || 'walk', spacing: p.spacing || 60, seed: p.seed || 3, from: I.t0, to: I.t1, fade: 0.3 },
  ...['abreast', 'gap', 'spread', 'speed', 'separation', 'y'].filter(k => p[k] != null).map(k => ({ [k]: p[k] }))) }, { label: I.label || 'with the flock' }); };   /* a formation: rows abreast, gap, spread */
K.STRIKE = (X, I, e) => { const p = I.params || {}, tg = (p.targets || []).map(id => figPoint(X, id, I.t0 + 0.3, X.H(id) * 0.6)).filter(Boolean);
  /* strike() starts from the pose sampled so far (creatures.js runProc passes it): the targets are read in Scylla's own frame */
  const ev1 = X.cmove(I.actor, 'STRIKE', e, { proc: { type: 'strike', targets: tg, t0: I.t0, lift: p.lift || 4, delays: p.delays, spread: p.spread, rise: p.rise, from: I.t0 - 1, to: p.keep === false ? I.t1 : X.T, fade: 0.5 } }, { label: I.label || 'the six heads strike' });
  /* each head reaches its man at t0 + its stagger + the strike (0.35 s); he rides that jaw from then to the end: taken */
  const D = p.delays || [0, 0.08, 0.03, 0.12, 0.05, 0.1];   /* params.delays: each head's own moment (six abductions, one after another) */
  (p.targets || []).forEach((id, k) => { const tg = r3(I.t0 + D[k % 6] + 0.36); X.cmove(I.actor, 'SEIZED', ev1, { riders: [{ actor: id, at: 'jaw' + (k + 1), from: tg, to: r3(p.keep === false ? I.t1 : X.T) }], from: tg, to: I.t1 }, { label: id + ' in jaw ' + (k + 1) });
    X.ev({ lane: 'CONTACT', actor: I.actor, actors: [I.actor, id], t0: tg, t1: r3(I.t1), kind: 'GRIP', label: 'jaw ' + (k + 1) + ' holds ' + id, because: [{ id: ev1.id, latency: 0.4 }], params: { k: 6 } }); });
  return ev1; };
/* the bearing of a target (a figure, a piece, a point) from a creature's root at t, in its own heading's frame */
function bearing(X, id, target, t) { const v = cstate(X, id, t).v, p = pointOf(X, target, t); if (!p) return null; const dx = p[0] - (v['root.x'] || 0), dz = p[2] - (v['root.z'] || 0);
  const a = Math.atan2(dx, dz) - (v['root.h'] || 0); return { yaw: Math.atan2(Math.sin(a), Math.cos(a)), pitch: Math.atan2(p[1] - 200 * (X.creatures[id].scale || 1), Math.hypot(dx, dz)), p }; }
/* a target: a figure's id, a set piece's label (its box centre), a word for up ('sky'), or a point */
function pointOf(X, target, t) { if (Array.isArray(target)) return target; if (!target) return null; if (/^(sky|heaven|the gods|zeus|father)/i.test(target)) { const v = cstate(X, Object.keys(X.creatures)[0], t).v; return [v['root.x'] || 0, 2000, (v['root.z'] || 0) + 300]; }
  const f = figPoint(X, target, t); if (f && X.ids.includes(target)) return f; if (X.creatures[target]) { const v = cstate(X, target, t).v; return [v['root.x'], 100, v['root.z']]; }
  const pc = (X.M.pieces || []).find(p => p.label === target) || (X.M.pieces || []).find(p => p.label.includes(String(target).replace(/-/g, ' '))); if (pc) { const b = pc.box; return [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2]; } return null; }
/* TURN {target | h}: the whole body turned where it stands to face a figure or a point (a place procedure: root kept, heading
   turned the short way round), held after; a giant come to his seat with his back to the men turns to them */
K.TURN = (X, I, e) => { const p = I.params || {}, s = Cr.sample({ creatures: X.creatures, step: 'twos' }, I.actor, I.t0, { stepped: false }).v, a = [s['root.x'], s['root.y'], s['root.z'], s['root.h']];
  let h = p.h; if (h == null) { const tg = figPoint(X, I.target, I.t0); if (!tg) return null; h = Math.atan2(tg[0] - a[0], tg[2] - a[2]); }
  return X.cmove(I.actor, 'TURN', e, { proc: { type: 'place', a, b: [a[0], a[1], a[2], r3(h)], from: I.t0, to: I.t1 } }, { label: I.label || 'turns to ' + I.target }); };
K.ATTEND = (X, I, e) => { const b = bearing(X, I.actor, I.target, I.t0); if (!b) return null; const yaw = Math.max(-0.9, Math.min(0.9, b.yaw)), tw = Math.max(-0.4, Math.min(0.4, b.yaw - yaw)), t0 = I.t0, t1 = I.t1;
  return X.cmove(I.actor, 'ATTEND', e, { keys: { 'head.yaw@att': [[t0, 0], [t0 + 0.8, yaw], [t1, yaw * 0.9], [t1 + 0.8, 0]], 'torso.twist@att': [[t0, 0], [t0 + 1.2, tw], [t1, tw], [t1 + 1, 0]], 'head.pitch@att': [[t0, 0], [t0 + 0.8, Math.max(-0.3, Math.min(0.3, b.pitch))], [t1, 0.1], [t1 + 0.8, 0]] } }, { label: I.label || 'turns his head to ' + I.target }); };
K.LISTEN = K.ATTEND;
K.RECOGNISE = (X, I, e) => { const t0 = I.t0, t1 = I.t1;   /* the name lands: still, the head drops, the jaw hangs, then he lifts his face */
  return X.cmove(I.actor, 'RECOGNISE', e, { keys: { 'head.pitch@rec': [[t0, 0], [t0 + 0.5, -0.35, 'out'], [t0 + 3, -0.3], [t1 - 1, 0.1], [t1, 0]], 'jaw@rec': [[t0, 0], [t0 + 0.6, 0.5], [t0 + 3.5, 0.3], [t1, 0]], 'torso.lean@rec': [[t0, 0], [t0 + 0.8, 0.25], [t1, 0.05], [t1 + 0.6, 0]], 'body.dy@rec': [[t0, 0], [t0 + 1, -6], [t1, 0]] } }, { label: I.label || 'the prophecy remembered' }); };
K.INVOKE = (X, I, e) => { const t0 = I.t0, t1 = I.t1, sw = []; for (let t = t0 + 2; t < t1 - 1; t += 2.4) sw.push([r3(t), -2.7], [r3(t + 1.2), -2.4]);
  return X.cmove(I.actor, 'INVOKE', e, { keys: { 'arm.R.pitch@inv': [[t0, 0], [t0 + 1.4, -2.7], ...sw, [t1, -2.5], [t1 + 1, 0]], 'arm.L.pitch@inv': [[t0 + 0.1, 0], [t0 + 1.5, -2.6], ...sw.map(([t, v]) => [r3(t + 0.2), v + 0.1]), [t1, -2.4], [t1 + 1, 0]],
    'arm.R.out@inv': [[t0, 0], [t0 + 1.4, 0.4], [t1, 0.4], [t1 + 1, 0]], 'arm.L.out@inv': [[t0, 0], [t0 + 1.4, 0.4], [t1, 0.4], [t1 + 1, 0]], 'head.pitch@inv': [[t0, 0], [t0 + 1.2, 0.45], [t1, 0.4], [t1 + 1, 0]], 'jaw@inv': [[t0, 0], [t0 + 1.5, 0.5], [t1, 0.4], [t1 + 0.5, 0]] } }, { label: I.label || 'hands to the sky: the prayer' }); };
K.GESTURE = (X, I, e) => (I.params && /invoke|pray|oath/.test(I.params.shape || '') ? K.INVOKE : K.ATTEND)(X, I, e);
/* ═════ more creature kinds: the giant's household work, a beast's manner, riders carried, the change of a man into a beast ═════ */
/* MOVE_STONE {target (a piece or a point), params: to [x, z] (where it goes), dur}: both hands to the stone, the weight into it, the
   stone carried along (a PROP event with its track, an object with that track for the previz and the heat) */
K.MOVE_STONE = (X, I, e) => { const p = I.params || {}, from = pointOf(X, I.target || 'the great stone', I.t0) || [0, 60, 0], to = p.to ? [p.to[0], from[1], p.to[1]] : [from[0] + 60, from[1], from[2]], t0 = I.t0, t1 = I.t1, d = Math.max(0.6, t1 - t0 - 1.0);
  const sc = X.creatures[I.actor].scale || 1, hands = (a) => [['R', [a[0] - 14 * sc, a[1], a[2]]], ['L', [a[0] + 14 * sc, a[1], a[2]]]];
  const ev1 = X.cmove(I.actor, 'MOVE STONE', e, { proc: { type: 'reach', hand: hands(from), from: t0, to: t0 + 1.0, fade: 0.5 }, keys: { 'torso.lean@stone': [[t0, 0], [t0 + 0.8, 0.5], [t1, 0.45], [t1 + 0.8, 0]], 'hips.dy@stone': [[t0, 0], [t0 + 0.8, -10 * sc], [t1, -8 * sc], [t1 + 0.8, 0]] } }, { label: I.label || 'the stone rolled aside' });
  const track = []; for (let t = t0 + 1.0; t <= t0 + 1.0 + d + 1e-6; t += 1 / 12) { const u = X.sm((t - t0 - 1.0) / d); track.push([X.r3(t), [X.r3(X.lerp(from[0], to[0], u)), from[1], X.r3(X.lerp(from[2], to[2], u))]]); }
  X.cmove(I.actor, 'PUSH', ev1, { proc: { type: 'reach', hand: [['R', [to[0] - 14 * sc, to[1], to[2]]], ['L', [to[0] + 14 * sc, to[1], to[2]]]], from: t0 + 1.0, to: t1, fade: 0.6 } }, { label: 'the weight carried round' });
  /* params.piece: the stone is a set piece the take draws (its label): the sheet carries it from `from` to `to` as an offset from its
     built place (params.home: where the set has it, [x, z]; default `to`), lifted by params.lift at the middle (choreo.js applySlides) */
  if (p.piece) { const home = p.home || [to[0], to[2]], o = v => [X.r3(v[0] - home[0]), 0, X.r3(v[2] - home[1])];
    X.props.push({ t: X.r3(t0 + 1.0), t1: X.r3(t0 + 1.0 + d), op: 'slide', by: I.actor, what: 'piece:' + p.piece, from: o(from), to: o(to), arc: p.lift || 0 }); }
  const mv = X.ev({ lane: 'PROP', actor: I.actor, t0: X.r3(t0 + 1.0), t1: X.r3(t0 + 1.0 + d), kind: 'MOVED', label: (I.target || 'the stone') + ' rolled from the door', because: [{ id: ev1.id, latency: 1.0 }], params: { prop: I.target || 'stone', track: track.filter((_, i) => i % 3 === 0) } });
  X.ev({ lane: 'CONTACT', actor: I.actor, actors: [I.actor], t0: X.r3(t0 + 0.9), t1: X.r3(t1), kind: 'PUSH', label: 'both hands on the stone', because: [{ id: ev1.id, latency: 0.9 }], params: { k: 5 } });
  X.S.objects = X.S.objects || {}; const oid = p.object || 'door-stone'; X.S.objects[oid] = Object.assign({ kind: 'door', material: 'stone', affords: ['block the way out'] }, X.S.objects[oid] || {}, { track: [[0, from], ...track] });
  return mv; };
/* DRINK {params: gulps}: the bowl in the right hand to the mouth, the head back, the jaw working; a STIMULUS at each gulp */
K.DRINK = (X, I, e) => { const p = I.params || {}, rig = rigOf(X, I.actor), t0 = I.t0, s = cstate(X, I.actor, t0), m = rig.anchor('mouth', s.v); if (!m) return null; const sc = X.creatures[I.actor].scale || 1;
  const at = [m[0], m[1] - 6 * sc, m[2]], n = p.gulps || Math.max(1, Math.floor((I.t1 - t0 - 1.2) / 1.1)), jaw = [[t0, 0]], hp = [[t0, 0], [t0 + 0.9, 0.3]];
  for (let j = 0; j < n; j++) { const t = t0 + 1.0 + j * 1.1; jaw.push([X.r3(t), 0.35], [X.r3(t + 0.45), 0.05]); hp.push([X.r3(t + 0.5), 0.36], [X.r3(t + 1.0), 0.3]); }
  jaw.push([I.t1 + 0.3, 0]); hp.push([I.t1, 0.25], [I.t1 + 0.8, 0]);
  const ev1 = X.cmove(I.actor, 'DRINK', e, { proc: { type: 'reach', hand: 'R', target: at, from: t0, to: I.t1, fade: 0.7 }, keys: { 'jaw@drink': jaw, 'head.pitch@drink': hp } }, { label: I.label || 'drains the bowl' });
  for (let j = 0; j < n; j++) X.ev({ lane: 'STIMULUS', actor: I.actor, t0: X.r3(t0 + 1.0 + j * 1.1), t1: X.r3(t0 + 1.3 + j * 1.1), kind: 'SOUND', label: 'a gulp', because: [{ id: ev1.id, latency: X.r3(1.0 + j * 1.1) }] });
  return ev1; };
/* CARESS {target (a creature or a figure), params: anchor ('back'), hand, strokes}: the hand laid on the target's back and drawn along
   it, stroke after stroke (reach procedures to points along the back, each a little further), a CONTACT TOUCH over the span */
K.CARESS = (X, I, e) => { const p = I.params || {}, hand = p.hand || 'R', tg = I.target, n = p.strokes || Math.max(2, Math.floor((I.t1 - I.t0 - 0.8) / 1.8));
  const backAt = t => { if (X.creatures[tg]) { const st = cstate(X, tg, t), r = rigOf(X, tg), a = r.anchor(p.anchor || 'back', st.v); return a ? { p: [a[0], a[1], a[2]], h: st.v['root.h'] || 0 } : null; } const f = figPoint(X, tg, t, X.H(tg) * 0.9); return f ? { p: f, h: (X.at(tg, t) || { h: 0 }).h } : null; };
  const sc = X.creatures[tg] ? (X.creatures[tg].scale || 1) : 1, d = (I.t1 - I.t0 - 0.6) / n; let first = null;
  for (let j = 0; j < n; j++) { const t = I.t0 + 0.6 + j * d, B = backAt(t); if (!B) continue; const fw = [Math.sin(B.h), Math.cos(B.h)], L = 14 * sc;
    const a = [B.p[0] + fw[0] * L, B.p[1] + 4, B.p[2] + fw[1] * L], b = [B.p[0] - fw[0] * L, B.p[1] + 2, B.p[2] - fw[1] * L];
    const ev1 = X.cmove(I.actor, j ? 'STROKE' : 'CARESS', j ? first : e, { proc: { type: 'reach', hand, target: a, from: X.r3(t), to: X.r3(t + d * 0.35), fade: j ? 0.2 : 0.6 } }, { label: j ? 'the hand along the back (' + (j + 1) + ')' : I.label || 'the hand on ' + tg });
    X.cmove(I.actor, 'STROKE', ev1, { proc: { type: 'reach', hand, target: b, from: X.r3(t + d * 0.35), to: X.r3(t + d * (j === n - 1 ? 1.2 : 0.95)), fade: 0.25 } }, { label: 'drawn along' });
    if (!first) first = ev1; }
  if (first) X.ev({ lane: 'CONTACT', actor: I.actor, actors: [I.actor, tg], t0: X.r3(I.t0 + 0.6), t1: X.r3(I.t1), kind: 'TOUCH', label: 'the hand on ' + tg + "'s " + (p.anchor || 'back') + ', ' + n + ' strokes', because: [{ id: first.id, latency: 0 }], params: { k: 2, strokes: n } });
  return first; };
/* FAWN {target, params: path}: a beast come to the men like a dog to its master: the head low, the tail going, the body swinging, a
   nuzzle at the one it comes to (the gait along the path if given) */
K.FAWN = (X, I, e) => { const p = I.params || {}, t0 = I.t0, t1 = I.t1, R = X.rng(I.id), wag = [[t0, 0]], hy = [[t0, 0]];
  for (let t = t0 + 0.3, j = 0; t < t1; t += 0.28 + R() * 0.1, j++) wag.push([X.r3(t), (j % 2 ? 1 : -1) * 0.6]);
  wag.push([t1 + 0.3, 0]); if (p.path) X.cmove(I.actor, 'WALK', e, { proc: { type: 'gait', path: p.path, gait: p.gait || 'walk', from: t0, to: t1, fade: 0.3 } }, { label: 'comes to ' + (I.target || 'them') });
  const b = I.target ? bearing(X, I.actor, I.target, t1 - 1) : null; if (b) hy.push([t1 - 1.2, Math.max(-0.8, Math.min(0.8, b.yaw))], [t1 + 0.6, 0]);
  return X.cmove(I.actor, 'FAWN', e, { proc: { type: 'preset', name: 'fawn', from: t0, to: t1, fade: 0.5 }, keys: { 'tail.yaw@fawn': wag, 'head.yaw@fawn': hy, 'body.roll@fawn': wag.map(([t, v]) => [t, v * 0.08]) } }, { label: I.label || 'fawns on ' + (I.target || 'them') }); };
/* GRAZE: the head down to the ground and up, in no hurry (the pigs at the acorns, the flock) */
K.GRAZE = (X, I, e) => { const R = X.rng(I.id), hp = [[I.t0, 0]]; for (let t = I.t0 + 0.6; t < I.t1; t += 1.4 + R()) hp.push([X.r3(t), -0.6 - 0.2 * R()], [X.r3(t + 0.7), -0.35]); hp.push([I.t1 + 0.5, 0]);
  return X.cmove(I.actor, 'GRAZE', e, { keys: { 'head.pitch@graze': hp } }, { label: I.label || 'roots at the ground' }); };
/* CARRY {params: riders [{actor, at: 'belly' | 'back', lie: 'under' | 'across' | 'upright', from, to, offset}]}: men carried (under a
   ram, across a back); each a CONTACT RIDER for its span */
K.CARRY = (X, I, e) => { const rs = ((I.params || {}).riders || []).map(r => ({ at: 'belly', lie: 'under', from: I.t0, to: I.t1, ...r, from: X.r3(r.from != null ? r.from : I.t0), to: X.r3(r.to != null ? r.to : I.t1) }));
  const ev1 = X.cmove(I.actor, 'CARRY', e, { riders: rs, from: I.t0, to: I.t1 }, { label: I.label || 'carries ' + rs.map(r => r.actor).join(', ') });
  for (const r of rs) X.ev({ lane: 'CONTACT', actor: I.actor, actors: [I.actor, r.actor], t0: r.from, t1: r.to, kind: 'RIDER', label: r.actor + ' ' + (r.lie === 'under' ? 'under the ' : 'on the ') + (r.at || 'belly') + ' of ' + I.actor, because: [{ id: ev1.id, latency: 0 }], params: { k: 5, at: r.at, lie: r.lie } });
  return ev1; };
/* CHANGE {params: man (the figure changed into this beast), at (the swap: the key where the take stages the beast)}: the beast's half of
   TRANSFORM, a part-swap sequence on twos: not drawn until the in-between; the drawing before the swap its head (the pig's face, the
   headdress) set on the man's head as he goes down, the man still drawn; at the swap the beast in its own place (the take hides the
   man there). The head's place comes from the man's pose as the sheet has him (a solver, after his TRANSFORM is written) */
K.CHANGE = (X, I, e) => { const p = I.params || {}, man = p.man, tS = X.q(p.at != null ? p.at : I.t1), tA = X.q(tS - 2 / 12), A = X.creatures[I.actor];
  A.present = [[X.r3(tA), X.T + 1]];
  const ev1 = X.cmove(I.actor, 'CHANGE', e, { keys: { 'morph@span': [[tA, 2, 'step'], [tS, 0, 'step']] } }, { label: I.label || man + ' into ' + I.actor + ': the face first, then the beast' });
  X.after((X2, C0) => { const Body = require('./body.js'), bctx = Body.context(X.M, C0), P = Body.sample(bctx, man, tA); if (!P) { X.notes.push('CHANGE ' + I.actor + ': ' + man + ' not drawn at ' + tA); return; }
    const hd = P.pts.headTop || P.pts.head, sm = X.at(man, tA), h = sm ? sm.h : 0, sc = A.scale || 1, kind = Cr.KINDS[A.kind];
    /* the pig's headdress sits on the head as a minifig's hat does: the root there, its heading his (the wolf's and lion's head node: the root put so that the head pivot is on his) */
    const at = kind.morphShows && kind.morphShows[0] === 'morph' ? hd : (() => { const r = rigOf(X, I.actor), v = Object.assign(r.rest(), { 'root.x': 0, 'root.y': 0, 'root.z': 0, 'root.h': h }), a = r.anchor('head', v); return [hd[0] - a[0], hd[1] - a[1], hd[2] - a[2]]; })();
    for (const [c, v] of [['root.x', at[0]], ['root.y', at[1]], ['root.z', at[2]], ['root.h', h]]) A.channels[c + '@span'] = [[X.r3(tA), X.r3(v), 'step'], [X.r3(tS), X.r3(v), 'step']];
    X.ev({ lane: 'SET/VEHICLE', actor: I.actor, t0: X.r3(tA), t1: X.r3(tS), kind: 'IN-BETWEEN', label: 'the ' + A.kind + "'s face on " + man + ' (one drawing on twos before the swap)', because: [{ id: ev1.id, latency: 0 }], params: { man, at: at.map(X.r3), scale: sc } }); });
  return ev1; };
/* ═════ a beast's small acts (Argos, and any quadruped with ears and a tail): almost no motion, all of it meant ═════ */
/* WATCH {target, params: every}: the head kept on a figure as it moves (re-aimed every half second), the ears pricked at the start */
K.WATCH = (X, I, e) => { const p = I.params || {}, dt = p.every || 0.5, t0 = I.t0, t1 = I.t1, yaw = [[t0, 0]], pit = [[t0, 0]];
  for (let t = t0 + 0.8; t <= t1 + 1e-6; t += dt) { const b = bearing(X, I.actor, I.target, t); if (!b) continue; yaw.push([r3(t), Math.max(-1.1, Math.min(1.1, b.yaw))]); pit.push([r3(t), p.lift != null ? p.lift : 0.35]); }
  const back = p.hold ? [] : [[r3(t1 + (p.release || 1.2)), 0]];
  return X.cmove(I.actor, 'WATCH', e, { keys: { 'head.yaw@watch': yaw.concat(back), 'head.pitch@watch': pit.concat(back), 'ear.L@watch': [[t0, 0], [t0 + 0.5, -0.35], [t1, -0.25]].concat(back), 'ear.R@watch': [[t0 + 0.05, 0], [t0 + 0.55, -0.35], [t1, -0.25]].concat(back) } }, { label: I.label || 'the head lifted to ' + I.target }); };
/* EARS {params: how drop|prick, dur}: both ears laid back (the fawning of a dog that cannot rise) or pricked */
K.EARS = (X, I, e) => { const v = (I.params || {}).how === 'prick' ? -0.35 : 1.05, t0 = I.t0, t1 = I.t1;
  return X.cmove(I.actor, 'EARS', e, { keys: { 'ear.L@ears': [[t0, 0], [t0 + 0.4, v, 'out'], [t1, v * 0.9]], 'ear.R@ears': [[t0 + 0.08, 0], [t0 + 0.5, v, 'out'], [t1, v * 0.9]] } }, { label: I.label || 'the ears ' + ((I.params || {}).how || 'dropped') }); };
/* WAG {params: period, amp, fade (0..1: how much of the swing is left at the end), lift}: the tail beating from side to side */
K.WAG = (X, I, e) => { const p = I.params || {}, P = p.period || 0.5, A0 = p.amp || 0.45, f = p.fade != null ? p.fade : 0.4, t0 = I.t0, t1 = I.t1, yaw = [[t0, 0]];
  for (let t = t0 + P / 4, k = 0; t < t1; t += P / 2, k++) { const u = (t - t0) / Math.max(0.1, t1 - t0), a = A0 * (1 - (1 - f) * u); yaw.push([r3(t), (k % 2 ? -1 : 1) * a]); }
  yaw.push([r3(t1 + 0.3), 0]);
  return X.cmove(I.actor, 'WAG', e, { keys: { 'tail.yaw@wag': yaw, 'tail.pitch@wag': [[t0, 0], [t0 + 0.4, p.lift != null ? p.lift : 0.25], [t1, (p.lift != null ? p.lift : 0.25) * f], [t1 + 0.4, 0]] } }, { label: I.label || 'the tail wags' }); };
/* BREATHE {params: period, depth}: the slow breath of a beast lying down (stopped by a DIE after it) */
K.BREATHE = (X, I, e) => { const p = I.params || {}, P = p.period || 2.4, d = (p.depth || 2.5) * (X.creatures[I.actor].scale || 1), k = [[I.t0, 0]];
  for (let t = I.t0 + P / 2, up = 1; t <= I.t1; t += P / 2, up ^= 1) k.push([r3(t), up ? d : 0]); k.push([r3(I.t1 + 0.3), 0]);
  return X.cmove(I.actor, 'BREATHE', e, { keys: { 'body.dy@breath': k } }, { label: I.label || 'the slow breath' }); };
/* DIE (a beast) {params: roll, sink}: the head goes down to the ground, the ears and the tail slacken, the body rolls onto its side; no
   breath after (a HOLD with the reason 'dead' keeps it) */
K.DIE = (X, I, e) => { const p = I.params || {}, t0 = I.t0, t1 = Math.max(I.t1, t0 + 2.2), r = p.roll != null ? p.roll : 1.2;
  return X.cmove(I.actor, 'DIE', e, { keys: { 'head.pitch@die': [[t0, 0], [t0 + 1.4, -(p.sink || 0.55), 'in']], 'head.yaw@die': [[t0, 0], [t1, -0.15]], 'ear.L@die': [[t0, 0], [t0 + 1, 0.5]], 'ear.R@die': [[t0, 0], [t0 + 1.1, 0.5]],
    'tail.pitch@die': [[t0, 0], [t0 + 1.2, -0.3]], 'root.roll@die': [[t0 + 0.6, 0], [t1, r, 'in']], 'body.dy@die': [[t0 + 0.6, 0], [t1, -4 * (X.creatures[I.actor].scale || 1)]] } }, { label: I.label || 'dies' }); };
/* CRAWL {params: bellow (a time: the dead meat lows), period}: the omen on a slain beast: the flayed hide creeps (the legs paddle a little
   out of step, the body shivers), and at the bellow the head jerks up and the jaw (if any) opens */
K.CRAWL = (X, I, e) => { const p = I.params || {}, P = p.period || 0.7, t0 = I.t0, t1 = I.t1, ch = {}, R = X.rng(I.id);
  for (const L of ['FL', 'FR', 'HL', 'HR']) { const k = [[t0, 0]]; let j = 0; for (let t = t0 + P * R(); t < t1; t += P * (0.7 + 0.6 * R()), j++) k.push([r3(t), (j % 2 ? -1 : 1) * (0.12 + 0.1 * R())]); k.push([r3(t1 + 0.4), 0]); ch['leg.' + L + '@crawl'] = k; }
  const sh = [[t0, 0]]; for (let t = t0 + 0.1, j = 0; t < t1; t += 1 / 6, j++) sh.push([r3(t), (j % 2 ? -1 : 1) * 0.025]); sh.push([r3(t1 + 0.2), 0]); ch['body.roll@crawl'] = sh;
  if (p.bellow) { const b = p.bellow; ch['head.pitch@bellow'] = [[b - 0.15, 0], [b, 0.35, 'out'], [b + 1.2, 0.25], [b + 2.0, 0]]; ch['head.yaw@bellow'] = [[b - 0.1, 0], [b + 0.3, 0.2], [b + 1.8, 0]]; }
  return X.cmove(I.actor, 'CRAWL', e, { keys: ch }, { label: I.label || 'the hide creeps' }); };
/* BARK {target, params: period}: the head thrown up and forward with each bark, the forelegs braced, the ears pricked, the tail up; the
   head kept on the target between barks */
K.BARK = (X, I, e) => { const p = I.params || {}, P = p.period || 0.45, t0 = I.t0, t1 = I.t1, R = X.rng(I.id), hp = [[t0, 0]], bp = [[t0, 0]];
  for (let t = t0 + 0.1; t < t1; t += P * (0.8 + 0.4 * R())) { hp.push([r3(t), 0.3], [r3(t + 0.12), 0.05]); bp.push([r3(t), -0.06], [r3(t + 0.15), 0]); }
  hp.push([r3(t1 + 0.2), 0]); bp.push([r3(t1 + 0.2), 0]); const b = I.target ? bearing(X, I.actor, I.target, t0) : null, y = b ? Math.max(-1, Math.min(1, b.yaw)) : 0;
  return X.cmove(I.actor, 'BARK', e, { keys: { 'head.pitch@bark': hp, 'body.pitch@bark': bp, 'head.yaw@bark': [[t0, 0], [t0 + 0.3, y], [t1, y], [t1 + 0.4, 0]], 'ear.L@bark': [[t0, 0], [t0 + 0.2, -0.3], [t1, -0.3], [t1 + 0.4, 0]], 'ear.R@bark': [[t0, 0], [t0 + 0.2, -0.3], [t1, -0.3], [t1 + 0.4, 0]],
    'tail.pitch@bark': [[t0, 0], [t0 + 0.3, 0.6], [t1, 0.6], [t1 + 0.5, 0]], 'leg.FL@bark': [[t0, 0], [t0 + 0.2, -0.25], [t1, -0.25], [t1 + 0.4, 0]], 'leg.FR@bark': [[t0, 0], [t0 + 0.2, -0.25], [t1, -0.25], [t1 + 0.4, 0]] } }, { label: I.label || 'barks' }); };
module.exports = Object.assign(K, { place, placeAt, cstate, pointOf });
