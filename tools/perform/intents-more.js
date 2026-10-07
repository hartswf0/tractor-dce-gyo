/* tools/perform/intents-more.js — the kinds the other voiced scenes ask for (odyssey/perform/needs.json): postures, weeping, tools,
   arming, eating, recognition, sustained contact between two bodies (seize, hold on, embrace, drag, tend), struggle, flight, herding,
   sacrifice, throwing, the blade's attack with its hit or miss, the block. Merged into the intent library by tools/perform/compile.js.

   Contact is one primitive: two bodies coupled at contact points, with an owner and a duration and a release (CONTACT events on the
   score with {owner, points, release}); SEIZE, HOLD_ON, EMBRACE, DRAG and TEND are its kinds. */
'use strict';
const Score = require('./score.js'), I_ = require('./intents.js');
const M_ = {};
const rel = X => X.sheet.rel(0);

/* POSTURE params.to: sit | lie | crouch | cower | slump | kneel | supplicate | stand; entered over params.enter s, held (the breath goes on), left
   at I.t1 over params.leave s unless params.stay */
/* crouch and cower keep the centre of mass over the feet (the legs forward under the lean: tools/perform/metrics.js balance) */
const POSES = { crouch: { 'hips.dy': -6, 'torso.lean': 0.16, 'leg.R.pitch': -0.2, 'leg.L.pitch': -0.2, 'head.pitch': -0.08 }, cower: { 'hips.dy': -7, 'torso.lean': 0.12, 'arm.R.pitch': { abs: -2.4 }, 'arm.L.pitch': { abs: -2.3 }, 'head.pitch': 0.2, 'leg.R.pitch': -0.2, 'leg.L.pitch': -0.2 },
  slump: { 'hips.dy': -2.5, 'torso.lean': 0.28, 'head.pitch': 0.2, 'arm.R.pitch': { abs: 0.15 }, 'arm.L.pitch': { abs: 0.15 } }, kneel: { 'hips.dy': -9, 'leg.R.pitch': -1.4, 'leg.L.pitch': 0.3, 'torso.lean': 0.05 },
  /* supplicate: down on both knees, the shins flat on the floor behind, the body bent forward to the knees it clasps, the face up (Arete's knees) */
  supplicate: { 'hips.dy': -19, 'leg.R.pitch': 1.45, 'leg.L.pitch': 1.45, 'torso.lean': 0.1, 'head.pitch': -0.35 },
  sit: { 'hips.dy': -10, 'leg.R.pitch': -1.5, 'leg.L.pitch': -1.5, 'torso.lean': -0.04 }, lie: { 'root.pitch': -1.45, 'root.y': 6, 'arm.R.pitch': { abs: 0.2 }, 'arm.L.pitch': { abs: 0.2 }, 'head.pitch': 0.1 }, stand: {} };
M_.POSTURE = (X, I, e) => { const id = I.actor, p = I.params || {}, to = POSES[p.to || 'crouch'] || POSES.crouch, en = p.enter || 0.6, lv = p.leave || 0.7;
  const zero = Object.fromEntries(Object.keys(to).map(c => [c, 0])), start = Object.fromEntries(Object.keys(to).map(c => [c, rel(X)]));
  X.move(id, 'act', 'POSTURE ' + (p.to || 'crouch').toUpperCase(), e, k => { k(I.t0, start); k(I.t0 + en * 0.6, Object.fromEntries(Object.entries(to).map(([c, v]) => [c, typeof v === 'number' ? v * 1.08 : v])), 'out'); k(I.t0 + en, to); if (!p.stay) { k(I.t1, to); k(I.t1 + lv, zero); } }, { label: I.label || p.to }); };
/* WEEP: the head down, a hand (or both) to the face, the shoulders shaking at params.rate a second, the breath caught; params.pitch (the
   arm's absolute pitch, default -2.35), params.out, params.head and params.lean shape the hand to the face and the bow (defaults as before) */
M_.WEEP = (X, I, e) => { const id = I.actor, p = I.params || {}, sd = p.side || 'R', rate = p.rate || 3.2, R = X.rng(I.id), ap = p.pitch != null ? p.pitch : -2.35, ao = p.out != null ? p.out : -0.12;
  X.move(id, 'act', 'WEEP', e, k => { k(I.t0, { 'head.pitch': rel(X), 'torso.lean': rel(X), ['arm.' + sd + '.pitch']: rel(X), ['arm.' + sd + '.out']: rel(X), 'torso.roll': rel(X), 'hips.dy': rel(X) });
    k(I.t0 + 0.7, { 'head.pitch': p.head != null ? p.head : 0.2, 'torso.lean': p.lean != null ? p.lean : 0.16, ['arm.' + sd + '.pitch']: { abs: ap }, ['arm.' + sd + '.out']: ao,
      ...(p.twist ? { 'torso.twist': p.twist, 'head.yaw': p.twist } : {}) });   /* params.twist: the body and head turned into the hand (the face into it, not the hand beside it) */
    let t = I.t0 + 0.9, j = 0; while (t < I.t1 - 0.3) { const burst = j % 7 < 4; k(t, { 'torso.roll': (j % 2 ? 1 : -1) * (burst ? 0.05 : 0.015), 'hips.dy': burst ? (j % 2 ? -0.6 : 0.3) : 0 }, 'linear'); t += 1 / rate * (0.8 + 0.4 * R()); j++; }
    k(I.t1 + 0.6, { 'head.pitch': p.stay ? 0.12 : 0, 'torso.lean': 0, ['arm.' + sd + '.pitch']: 0, ['arm.' + sd + '.out']: 0, 'torso.roll': 0, 'hips.dy': 0, ...(p.twist ? { 'torso.twist': 0, 'head.yaw': 0 } : {}) }); }, { label: I.label || 'weeps' }); };
/* TOOL_WORK params.how: chop | carve | bore | dig, params.period; each stroke a CONTACT (the tool on the thing) and, for chop and dig, FX */
M_.TOOL_WORK = (X, I, e) => { const id = I.actor, p = I.params || {}, how = p.how || 'chop', P = p.period || (how === 'carve' ? 0.7 : how === 'bore' ? 0.9 : 1.2); let t = I.t0, j = 0;
  if (p.on) X.look(id, p.on, t - 0.2, e, { label: 'the work', noFeet: true });
  X.move(id, 'act', how.toUpperCase(), e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'torso.lean': rel(X), 'torso.twist': rel(X), 'hand.R.roll': rel(X), 'hips.dy': rel(X) });
    while (t < I.t1 - P * 0.5) {
      if (how === 'chop' || how === 'dig') { k(t + P * 0.35, { 'arm.R.pitch': { abs: -2.6 }, 'arm.L.pitch': { abs: -2.4 }, 'torso.lean': -0.08, 'hips.dy': 0.5 }, 'in'); k(t + P * 0.55, { 'arm.R.pitch': { abs: -0.7 }, 'arm.L.pitch': { abs: -0.8 }, 'torso.lean': 0.3, 'hips.dy': -1.8 }, 'out'); k(t + P * 0.95, { 'arm.R.pitch': { abs: -1.2 }, 'arm.L.pitch': { abs: -1.2 }, 'torso.lean': 0.15, 'hips.dy': -0.6 }); }
      else if (how === 'bore') { const u = j % 2 ? 1 : -1; k(t + P * 0.5, { 'torso.twist': 0.3 * u, 'hand.R.roll': 0.9 * u, 'arm.R.pitch': { abs: -1.0 }, 'arm.L.pitch': { abs: -1.0 }, 'torso.lean': 0.14 }); }
      else { k(t + P * 0.4, { 'arm.R.pitch': { abs: -1.2 }, 'hand.R.roll': 0.5, 'torso.lean': 0.12 }); k(t + P * 0.8, { 'arm.R.pitch': { abs: -0.95 }, 'hand.R.roll': -0.2 }); }
      t += P; j++; }
    k(I.t1 + 0.4, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0, 'torso.twist': 0, 'hand.R.roll': 0, 'hips.dy': 0 }); }, { label: I.label || how, params: { strokes: j } });
  for (let i = 0, tt = I.t0; tt < I.t1 - P * 0.5; tt += P, i++) { X.ev({ lane: 'CONTACT', actor: id, actors: [id], t0: tt + P * 0.55, t1: tt + P * 0.65, kind: 'TOOL', label: how + (p.on ? ' on ' + Score.short(p.on) : ''), because: [{ id: e.id, latency: X.r3(tt + P * 0.55 - e.t0) }], params: { k: 1 } });
    if ((how === 'chop' || how === 'dig') && i % 2 === 0) X.ev({ lane: 'FX', t0: tt + P * 0.55, t1: tt + P * 0.9, kind: how === 'chop' ? 'CHIPS' : 'EARTH', label: 'the stroke lands', because: [{ id: e.id, latency: X.r3(tt + P * 0.55 - e.t0) }] }); } };
/* DUST (Laertes, Homer XXIV): grief's two-handed act with the earth for its prop: params.n handfuls, each the body bowed to the ground
   and both hands filling (a CONTACT TOUCH on the ground), lifted and poured over the head (an FX DUST), the head bowed under it and the
   shoulders caught (a SOUND groan stimulus after each); params.period s a handful, params.stay keeps the hands up at the end */
M_.DUST = (X, I, e) => { const id = I.actor, p = I.params || {}, n = p.n || 2, P = p.period || 2.0; let t = I.t0; const at = [];
  const m = X.move(id, 'act', 'DUST', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'arm.R.out': rel(X), 'arm.L.out': rel(X), 'torso.lean': rel(X), 'head.pitch': rel(X), 'hips.dy': rel(X), 'torso.roll': rel(X) });
    for (let j = 0; j < n; j++) { const u = j % 2 ? 1 : -1;
      k(t + P * 0.3, { 'arm.R.pitch': { abs: -0.7 }, 'arm.L.pitch': { abs: -0.7 }, 'arm.R.out': 0.06, 'arm.L.out': 0.06, 'torso.lean': 0.34, 'head.pitch': 0.22, 'hips.dy': -0.3 }, 'inOut');
      k(t + P * 0.42, { 'torso.lean': 0.36, 'hips.dy': -0.6 });
      k(t + P * 0.68, { 'arm.R.pitch': { abs: -2.8 }, 'arm.L.pitch': { abs: -2.75 }, 'arm.R.out': -0.22, 'arm.L.out': -0.22, 'torso.lean': 0.06, 'head.pitch': 0.3, 'hips.dy': 0.4 }, 'out');
      k(t + P * 0.82, { 'torso.roll': 0.04 * u, 'hips.dy': -0.5, 'head.pitch': 0.34 }); k(t + P * 0.95, { 'torso.roll': -0.03 * u, 'hips.dy': 0.2 });
      at.push(t); t += P; }
    if (!p.stay) k(t + 0.6, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'arm.R.out': 0, 'arm.L.out': 0, 'torso.lean': 0.12, 'head.pitch': 0.2, 'hips.dy': 0, 'torso.roll': 0 }); }, { label: I.label || 'dust over the grey head', params: { handfuls: n } });
  const c = m || e;
  for (const a of at) { X.ev({ lane: 'CONTACT', actor: id, actors: [id], t0: a + P * 0.3, t1: a + P * 0.45, kind: 'TOUCH', label: 'both hands in the dust', because: [{ id: c.id, latency: X.r3(a + P * 0.3 - c.t0) }] });
    X.ev({ lane: 'FX', t0: a + P * 0.68, t1: a + P, kind: 'DUST', label: 'the dust poured over his head', because: [{ id: c.id, latency: X.r3(a + P * 0.68 - c.t0) }] });
    X.ev({ id: (p.groan || 'sGroan') + at.indexOf(a), lane: 'STIMULUS', actor: id, t0: a + P * 0.8, t1: a + P, kind: 'SOUND', label: 'a heavy groan', because: [{ id: c.id, latency: X.r3(a + P * 0.8 - c.t0) }] }); } };
/* ARM: the hand goes to a weapon (params.at: where it lies or hangs, an object id or a point), takes it (a PROP event), brings it up */
M_.ARM = (X, I, e) => { const id = I.actor, p = I.params || {}, t = I.t0, sd = p.side || 'R';
  if (p.at) X.look(id, p.at, t - 0.3, e, { label: 'to the weapon' });
  const a = X.move(id, 'act', 'TAKE UP ARMS', e, k => { k(t, { ['arm.' + sd + '.pitch']: rel(X), 'torso.lean': rel(X), 'hips.dy': rel(X) }); k(t + 0.45, { ['arm.' + sd + '.pitch']: { abs: p.high ? -2.4 : -0.9 }, 'torso.lean': p.high ? -0.04 : 0.22, 'hips.dy': p.high ? 1 : -2 }); k(t + 0.8, { ['arm.' + sd + '.pitch']: { abs: p.high ? -2.2 : -0.8 } }); k(t + 1.4, { ['arm.' + sd + '.pitch']: { abs: -1.3 }, 'torso.lean': 0.05, 'hips.dy': -0.8 }, 'out'); }, { label: I.label || 'takes up ' + (p.what || 'a weapon') });
  X.ev({ lane: 'PROP', actor: id, t0: t + 0.8, t1: t + 0.8, kind: 'TAKES UP', label: p.what || 'a weapon', because: a ? [{ id: a.id, latency: 0.8 }] : [] });
  if (p.show) X.props.push({ t: X.r3(X.q(t + 0.8)), op: 'show', what: id + ':' + sd }); };
/* EAT params.at: [t]: the hand to the mouth, the head dipping to it, chewing (the head's small nods) */
M_.EAT = (X, I, e) => { const id = I.actor, p = I.params || {}, sd = p.side || 'R';
  for (const t of p.at || [I.t0]) X.move(id, 'act', 'EAT', e, k => { k(t, { ['arm.' + sd + '.pitch']: rel(X), 'head.pitch': rel(X), 'torso.lean': rel(X) }); k(t + 0.4, { ['arm.' + sd + '.pitch']: { abs: -2.0 }, 'head.pitch': 0.1, 'torso.lean': 0.08 }); k(t + 0.8, { ['arm.' + sd + '.pitch']: { abs: -0.6 }, 'head.pitch': 0.04 });
    for (let j = 0; j < 4; j++) k(t + 0.95 + j * 0.25, { 'head.pitch': j % 2 ? 0.07 : 0.02 }); k(t + 2.1, { ['arm.' + sd + '.pitch']: 0, 'head.pitch': 0, 'torso.lean': 0 }); }, { label: I.label || 'eats' }); };
/* RECOGNISE {target}: the double take (NOTICE), a held look, the breath, a step in, both hands opening (and params.embrace: an EMBRACE follows) */
M_.RECOGNISE = (X, I, e) => { const id = I.actor, p = I.params || {};
  I_.NOTICE(X, { ...I, params: { gazeHold: p.gazeHold || 1.6 } }, e);
  const t = I.t0 + 1.2 + (p.gazeHold || 1.6);
  I_.STEP(X, { actor: id, t0: t, target: I.target, params: { dist: p.step || 0.25, dur: 0.6 } }, e);
  I_._gesture(X, id, 'offer', t + 0.4, 'R', 1, 0.8, e, 'it is you');
  if (p.embrace) M_.EMBRACE(X, { ...I, t0: t + 1.4, t1: Math.max(I.t1, t + 3.4) }, e); };
/* the contact primitive: two bodies coupled at contact points, an owner, a release */
function contact(X, I, e, kind, points, o = {}) { return X.ev({ lane: 'CONTACT', actor: I.actor, actors: [I.actor, I.target], t0: I.t0 + (o.at || 0), t1: I.t1, kind, label: I.label || kind.toLowerCase() + ' ' + Score.short(I.target), because: [{ id: e.id, latency: o.at || 0 }], params: { owner: I.actor, points, release: X.r3(I.t1), k: o.k || 5 } }); }
/* SEIZE {target}: the reach and the grip on the other (both hands to the shoulders or the arm), held to I.t1; the seized answers
   (params.answer: struggle | freeze | none) */
M_.SEIZE = (X, I, e) => { const id = I.actor, p = I.params || {}, t = I.t0;
  X.look(id, I.target, t - 0.3, e, { label: 'on ' + Score.short(I.target) });
  I_.STEP(X, { actor: id, t0: t - 0.1, target: I.target, params: { dist: 0.3, dur: 0.45 } }, e);
  X.move(id, 'act', 'SEIZE', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'arm.R.out': rel(X), 'arm.L.out': rel(X), 'torso.lean': rel(X) }); k(t + 0.3, { 'arm.R.pitch': { abs: -1.45 }, 'arm.L.pitch': { abs: -1.4 }, 'arm.R.out': -0.1, 'arm.L.out': -0.1, 'torso.lean': 0.15 }, 'back'); k(I.t1, { 'arm.R.pitch': { abs: -1.35 }, 'arm.L.pitch': { abs: -1.3 }, 'torso.lean': 0.1 }, 'linear'); k(I.t1 + 0.5, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'arm.R.out': 0, 'arm.L.out': 0, 'torso.lean': 0 }); }, { label: 'seizes ' + Score.short(I.target) });
  const c = contact(X, I, e, 'SEIZE', ['handR>' + I.target + ':shoulder', 'handL>' + I.target + ':arm'], { at: 0.3, k: 6 });
  if ((p.answer || 'struggle') === 'struggle') M_.STRUGGLE(X, { actor: I.target, t0: I.t0 + 0.3 + X.θ.latency, t1: I.t1, label: 'fights the hands on him' }, c); };
/* HOLD_ON {target}: a held grip or touch with no struggle (a hand on a shoulder, the hand over a mouth: params.at 'mouth') */
M_.HOLD_ON = (X, I, e) => { const id = I.actor, p = I.params || {}, sd = p.side || 'R', t = I.t0;
  X.move(id, 'act', 'HOLD ON', e, k => { k(t, { ['arm.' + sd + '.pitch']: rel(X), 'torso.lean': rel(X) }); k(t + 0.35, { ['arm.' + sd + '.pitch']: { abs: p.at === 'mouth' ? -1.7 : -1.2 }, 'torso.lean': 0.08 }); k(I.t1, { ['arm.' + sd + '.pitch']: { abs: p.at === 'mouth' ? -1.65 : -1.15 } }, 'linear'); k(I.t1 + 0.4, { ['arm.' + sd + '.pitch']: 0, 'torso.lean': 0 }); }, { label: I.label || 'a hand on ' + Score.short(I.target) });
  contact(X, I, e, 'HOLD', ['hand' + sd + '>' + I.target + ':' + (p.at || 'shoulder')], { at: 0.35 }); };
/* EMBRACE {target}: both bodies, arms round each other, leaning in, held (breathing together), released */
M_.EMBRACE = (X, I, e) => { const a = I.actor, b = I.target, t = I.t0;
  for (const [who, other] of [[a, b], [b, a]]) { X.look(who, other, t - 0.3, e, { label: 'to ' + Score.short(other), noFeet: false });
    X.move(who, 'act', 'EMBRACE', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'arm.R.out': rel(X), 'arm.L.out': rel(X), 'torso.lean': rel(X), 'head.pitch': rel(X) }); k(t + 0.5, { 'arm.R.pitch': { abs: -1.35 }, 'arm.L.pitch': { abs: -1.25 }, 'arm.R.out': -0.18, 'arm.L.out': -0.18, 'torso.lean': 0.14, 'head.pitch': 0.08 }, 'out');
      k(I.t1, { 'arm.R.pitch': { abs: -1.3 }, 'arm.L.pitch': { abs: -1.2 }, 'torso.lean': 0.12 }, 'linear'); k(I.t1 + 0.6, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'arm.R.out': 0, 'arm.L.out': 0, 'torso.lean': 0, 'head.pitch': 0 }); }, { label: 'arms round ' + Score.short(other) }); }
  contact(X, I, e, 'EMBRACE', ['arms>' + b + ':back', b + ':arms>' + a + ':back'], { at: 0.5, k: 4 }); };
/* DRAG {target, params.path}: SEIZE, then both go along the path: the dragged a step behind with the legs failing */
M_.DRAG = (X, I, e) => { const p = I.params || {}; M_.SEIZE(X, { ...I, t1: I.t1, params: { answer: 'none' } }, e);
  if (p.path) { const r = I_._walkPath(X, I.actor, I.t0 + 0.6, p.path, p.speed || 0.7, e, { label: 'drags ' + Score.short(I.target) }); if (r) I_._walkPath(X, I.target, I.t0 + 0.9, p.path, (p.speed || 0.7) * 0.97, e, { label: 'dragged' }); } };
/* TEND {target}: down beside the other (crouched), the hands busy at them (short strokes), the head bent to it */
M_.TEND = (X, I, e) => { M_.POSTURE(X, { ...I, params: { to: 'crouch' } }, e); const id = I.actor, R = X.rng(I.id); let t = I.t0 + 0.8;
  X.look(id, I.target, I.t0, e, { label: 'to the one tended', noFeet: true });
  while (t < I.t1 - 0.6) { X.move(id, 'react', 'TEND', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X) }); k(t + 0.35, { 'arm.R.pitch': -0.35, 'arm.L.pitch': -0.2 }); k(t + 0.8, { 'arm.R.pitch': -0.1, 'arm.L.pitch': -0.35 }); k(t + 1.1, { 'arm.R.pitch': 0, 'arm.L.pitch': 0 }); }, { label: 'the hands at the wound' }); t += 1.2 + R() * 0.6; }
  contact(X, I, e, 'TEND', ['hands>' + I.target], { at: 0.8, k: 2 }); };
/* STRUGGLE: jerks and twists against what holds (a grip, a rope): each jerk a short sharp move, the rest a strain */
M_.STRUGGLE = (X, I, e) => { const id = I.actor, R = X.rng(I.id + id), a = X.ampOf(I); let t = I.t0, j = 0;
  X.move(id, 'react', 'STRUGGLE', e, k => { k(t, { 'torso.twist': rel(X), 'torso.lean': rel(X), 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'head.yaw': rel(X), 'hips.dy': rel(X) });
    while (t < I.t1 - 0.3) { const u = j % 2 ? 1 : -1; k(t + 0.18, { 'torso.twist': 0.4 * u * a, 'torso.lean': -0.12 * a, 'arm.R.pitch': -0.7 * (u > 0 ? 1 : 0.4), 'arm.L.pitch': -0.7 * (u < 0 ? 1 : 0.4), 'head.yaw': 0.4 * u, 'hips.dy': 1.2 }, 'back'); k(t + 0.5, { 'torso.twist': 0.15 * u, 'torso.lean': -0.04, 'hips.dy': -0.6 }); t += 0.55 + R() * 0.45; j++; }
    k(I.t1 + 0.4, { 'torso.twist': 0, 'torso.lean': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'head.yaw': 0, 'hips.dy': 0 }); }, { label: I.label || 'struggles' }); };
/* FLEE params.from, path: out of the threat's way at a run (the recoil, then the path at params.speed) */
M_.FLEE = (X, I, e) => { const p = I.params || {}; if (p.from) M_.RECOIL_(X, { ...I, params: { from: p.from } }, e); if (p.path) I_._walkPath(X, I.actor, I.t0 + 0.5, p.path, p.speed || 1.8, e, { label: 'runs', freeArm: 'L' }); };
M_.RECOIL_ = (X, I, e) => require('./intents-action.js').RECOIL(X, I, e);
/* HERD params.path: walking behind the animals, the arms wide, a stick swung now and then */
M_.HERD = (X, I, e) => { const id = I.actor, p = I.params || {}; if (p.path) I_._walkPath(X, id, I.t0, p.path, p.speed || 0.6, e, { label: 'behind the flock', freeArm: 'L' });
  let t = I.t0 + 0.8; while (t < I.t1 - 0.8) { X.move(id, 'act', 'DRIVE ON', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.R.out': rel(X), 'arm.L.out': rel(X) }); k(t + 0.35, { 'arm.R.pitch': { abs: -1.6 }, 'arm.R.out': 0.45, 'arm.L.out': 0.4 }, 'back'); k(t + 0.9, { 'arm.R.pitch': { abs: -0.5 }, 'arm.R.out': 0.25, 'arm.L.out': 0.3 }); }, { label: 'on, on' }); t += 2.2; } };
/* SACRIFICE: the knife raised to the sky (the invocation), the stroke down to the victim, the blood (FX), the offering lifted */
M_.SACRIFICE = (X, I, e) => { const id = I.actor, t = I.t0, p = I.params || {};
  const a = X.move(id, 'act', 'SACRIFICE', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'head.pitch': rel(X), 'torso.lean': rel(X) }); k(t + 0.8, { 'arm.R.pitch': { abs: -3.0 }, 'arm.L.pitch': { abs: -2.4 }, 'head.pitch': -0.2, 'torso.lean': -0.1 }); k(t + 1.8, { 'arm.R.pitch': { abs: -2.9 } }, 'linear');
    k(t + 2.05, { 'arm.R.pitch': { abs: -0.6 }, 'torso.lean': 0.3, 'head.pitch': 0.15 }, 'in'); k(t + 3.0, { 'arm.R.pitch': { abs: -0.7 }, 'torso.lean': 0.25 }); k(t + 3.8, { 'arm.R.pitch': { abs: -2.2 }, 'arm.L.pitch': { abs: -2.2 }, 'torso.lean': 0, 'head.pitch': -0.15 }); k(I.t1 + 0.4, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'head.pitch': 0, 'torso.lean': 0 }); }, { label: I.label || 'the offering' });
  X.ev({ lane: 'FX', t0: t + 2.1, t1: t + 3.0, kind: 'BLOOD', label: 'into the trench' + (p.victim ? ': ' + p.victim : ''), because: a ? [{ id: a.id, latency: 2.1 }] : [] }); };
/* THROW {target}: the wind-up (the arm back, the weight back), the release (a STIMULUS: the thing in the air), the follow-through */
M_.THROW = (X, I, e) => { const id = I.actor, t = I.t0, sd = (I.params || {}).side || 'R', a = X.ampOf(I);
  if (I.target) X.look(id, I.target, t - 0.4, e, { label: 'the aim' });
  const m = X.move(id, 'act', 'THROW', e, k => { k(t, { ['arm.' + sd + '.pitch']: rel(X), 'torso.lean': rel(X), 'torso.twist': rel(X), 'hips.dy': rel(X) }); k(t + 0.45, { ['arm.' + sd + '.pitch']: { abs: -2.8 }, 'torso.lean': -0.14 * a, 'torso.twist': 0.35 * (sd === 'R' ? 1 : -1), 'hips.dy': 1 }); k(t + 0.62, { ['arm.' + sd + '.pitch']: { abs: -1.2 }, 'torso.lean': 0.25 * a, 'torso.twist': -0.25 * (sd === 'R' ? 1 : -1), 'hips.dy': -1.8 }, 'in'); k(t + 0.9, { ['arm.' + sd + '.pitch']: { abs: -0.2 }, 'torso.lean': 0.3 * a }); k(t + 1.6, { ['arm.' + sd + '.pitch']: 0, 'torso.lean': 0, 'torso.twist': 0, 'hips.dy': 0 }); }, { label: 'at ' + Score.short(I.target || 'it') });
  X.ev({ id: (I.params || {}).releaseId, lane: 'STIMULUS', actor: id, t0: t + 0.62, t1: t + 0.9, kind: 'SIGHT', label: 'the thing in the air', because: m ? [{ id: m.id, latency: 0.62 }] : [] });
  /* params.prop: the thing thrown is a staged prop (the take's 'prop:<id>'), carried in the hand through the wind-up and flown on a
     parabola from the release to params.to (an actor's head, a hand 'hand:<id>:R', an anchor '@...', or a point) with params.off,
     arc (rise over the chord, units) and spin (turns); params.fall: [{dt, to, off, arc, spin}] legs after the hit (a stool falling off
     a shoulder to the floor); params.until: when the take's next key re-stages it. A PROP FLIGHT event on the PROP lane and a sheet
     props event {op: 'fly'} that choreo.js plays */
  const p = I.params || {};
  if (p.prop) { const tr = X.r3(X.q(t + 0.62)), fl = p.flight || 0.32, legs = [{ t0: tr, t1: X.r3(tr + fl), to: p.to || I.target, off: p.off || [0, 0, 0], arc: p.arc ?? 14, spin: p.spin ?? 0.75 }];
    let tt = tr + fl; for (const f of p.fall || []) { legs.push({ t0: X.r3(tt), t1: X.r3(tt + f.dt), to: f.to, off: f.off || [0, 0, 0], arc: f.arc ?? 4, spin: f.spin ?? 0.25 }); tt += f.dt; }
    /* params.smear {prop, frames: [k, ...] (drawings after the release, on twelves), span}: smear bricks drawn in its place on those drawings */
    const smear = p.smear ? { what: 'prop:' + p.smear.prop, at: (p.smear.frames || [2, 3]).map(k => X.r3(tr + k / 12)), span: p.smear.span || 2 } : null;
    X.props.push(Object.assign({ t: X.r3(X.q(t)), op: 'fly', by: id, what: 'prop:' + p.prop, from: id + ':' + sd, hand: 'hand:' + id + ':' + sd, grip: p.grip || [0, 0, 0], legs, until: p.until != null ? X.r3(p.until) : null }, smear ? { smear } : {}, p.freeze ? { freeze: true } : {}));
    X.ev({ id: (p.releaseId || I.id) + ':flight', lane: 'PROP', actor: id, t0: tr, t1: X.r3(tt), kind: 'FLIGHT', label: 'the ' + p.prop + ' in the air', params: { prop: p.prop, legs }, because: m ? [{ id: m.id, latency: 0.62 }] : [] }); } };
/* SWING {target, params.hit}: an ATTACK with a blade: the wind-up, the swing across, and then either IMPACT (a CONTACT; the target's
   own IMPACT intent follows it) or a MISS: the blade overtravels (the body turned past, an opening) - a STIMULUS the target can answer
   (the swing -> the duck -> the miss -> the overtravel -> the opening seen -> the advance) */
M_.SWING = (X, I, e) => { const id = I.actor, t = I.t0, p = I.params || {}, a = X.ampOf(I), sd = p.side || 'R';
  X.look(id, I.target, t - 0.3, e, { label: 'on ' + Score.short(I.target) });
  const m = X.move(id, 'act', 'SWING', e, k => { k(t, { ['arm.' + sd + '.pitch']: rel(X), ['arm.' + sd + '.out']: rel(X), 'torso.twist': rel(X), 'torso.lean': rel(X) });
    k(t + 0.35, { ['arm.' + sd + '.pitch']: { abs: -2.2 }, ['arm.' + sd + '.out']: 0.5, 'torso.twist': 0.4 * a, 'torso.lean': -0.06 });
    k(t + 0.55, { ['arm.' + sd + '.pitch']: { abs: -1.3 }, ['arm.' + sd + '.out']: -0.15, 'torso.twist': -0.35 * a, 'torso.lean': 0.12 }, 'in');
    if (!p.hit) k(t + 0.8, { ['arm.' + sd + '.pitch']: { abs: -0.8 }, 'torso.twist': -0.5 * a, 'torso.lean': 0.2 }, 'out');   /* the overtravel */
    k(t + (p.hit ? 1.2 : 1.6), { ['arm.' + sd + '.pitch']: { abs: -1.2 }, ['arm.' + sd + '.out']: 0.1, 'torso.twist': 0, 'torso.lean': 0.04 }); }, { label: 'at ' + Score.short(I.target) + (p.hit ? '' : ' (and misses)') });
  if (p.hit) X.ev({ id: p.impactId, lane: 'CONTACT', actor: id, actors: [id, I.target], t0: t + 0.55, t1: t + 0.7, kind: 'IMPACT', label: 'the blade lands', because: m ? [{ id: m.id, latency: 0.55 }] : [], params: { k: 8 } });
  else { X.ev({ id: p.missId, lane: 'STIMULUS', actor: id, t0: t + 0.6, t1: t + 0.8, kind: 'MISS', label: 'the blade finds nothing', because: m ? [{ id: m.id, latency: 0.6 }] : [] });
    X.ev({ id: p.openingId, lane: 'STIMULUS', actor: id, t0: t + 0.8, t1: t + 1.3, kind: 'OPENING', label: 'overtravelled: his side open', because: m ? [{ id: m.id, latency: 0.8 }] : [] }); } };
/* BLOCK {target}: the arm (a shield) up into the line of the attack at the attack's moment (the reaction latency before it), the
   CONTACT of blade on shield, the weight driven back */
M_.BLOCK = (X, I, e) => { const id = I.actor, t = I.t0, sd = (I.params || {}).side || 'L';
  const m = X.move(id, 'react', 'BLOCK', e, k => { k(t - 0.25, { ['arm.' + sd + '.pitch']: rel(X), 'torso.lean': rel(X), 'hips.dy': rel(X) }); k(t, { ['arm.' + sd + '.pitch']: { abs: -1.9 }, 'torso.lean': 0.06, 'hips.dy': -1.2 }, 'out'); k(t + 0.15, { 'torso.lean': -0.1, 'hips.dy': -2 }, 'out'); k(t + 0.9, { ['arm.' + sd + '.pitch']: { abs: -1.4 }, 'torso.lean': 0, 'hips.dy': -0.6 }); }, { label: 'up into the blow' });
  X.ev({ lane: 'CONTACT', actor: id, actors: [id, I.target], t0: t, t1: t + 0.15, kind: 'BLOCK', label: 'blade on shield', because: m ? [{ id: m.id, latency: 0.25 }] : [], params: { k: 6 } }); };
/* TRANSFORM params.into (a prop kind: 'pig'): the man goes down onto all fours over four drawings on twos (the torso held, as the
   catalogue asks), ending at the key where the take stops drawing him and stages the animal; the swap is the take's, the posture and
   its timing are the engine's. An ACTION event names the prop that takes his place (the nearest of that kind at that key), so his
   identity is kept in the score. */
M_.TRANSFORM = (X, I, e) => { const id = I.actor, into = (I.params && I.params.into) || 'pig';
  const K = X.M.keys.find(k => k.t >= I.t0 - 0.5 && k.t <= I.t1 + 1.5 && k.snap && (!k.snap[id] || !k.snap[id].vis));
  if (!K) { X.notes.push('TRANSFORM ' + id + ': the take does not take him off between ' + I.t0 + ' and ' + I.t1 + ' s (he is not one of the changed)'); return null; }
  const tSwap = X.q(K.win ? (K.win[0] + K.win[1]) / 2 : K.t), t0 = tSwap - 8 / 12, st = X.at(id, Math.max(0, t0 - 0.1));   /* the take stops drawing him at the middle of the key's window */
  if (!st) { X.notes.push('TRANSFORM ' + id + ': not on stage before ' + tSwap); return null; }
  const steps = [[0, 0, -0.6, 0], [1, 0.14, -1.0, -3], [2, 0.26, -1.3, -6], [3, 0.38, -1.5, -9]];
  const ev = X.move(id, 'act', 'TRANSFORM', e, k => { k(t0 - 0.05, { 'torso.lean': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0), 'head.pitch': X.sheet.rel(0) });
    for (const [j, lean, arm, dy] of steps) k(t0 + j * 2 / 12, { 'torso.lean': lean, 'hips.dy': dy, 'arm.R.pitch': { abs: arm }, 'arm.L.pitch': { abs: arm }, 'head.pitch': -0.12 * j / 3 }, 'step'); },
    { label: 'down onto all fours, on twos: ' + into, rigid: true, exact: true, params: { into, swapAt: X.r3(tSwap), key: K ? K.id : null } });
  X.ev({ lane: 'SET/VEHICLE', actor: id, t0: X.r3(tSwap), t1: X.r3(tSwap + 0.2), kind: 'SWAP', label: id + ' becomes a ' + into + ' (the take stages the animal at ' + (K ? K.id : 'the key') + ')', because: [{ id: ev ? ev.id : e.id, latency: 8 / 12 }], params: { into } });
  return ev; };
/* DROWSE {params: period, sway, reach (a target the hand goes out to, slowly), side, nod, layer}: drugged lethargy (the
   Lotus-eaters): never a frozen frame and never a purposeful act; the body sways on a slow clock of its own, the head nods down and
   comes up late, and every few cycles the hand drifts out toward the lotus, half closes and comes back short. A HOLD's stillness
   with the motion of sleep in it. Keys on its own layer (params.layer, default 'drowse') */
M_.DROWSE = (X, I, e) => { const id = I.actor, p = I.params || {}, P = p.period || 3.4, sw = p.sway == null ? 0.07 : p.sway, sd = p.side || 'R', R = X.rng(I.id + id), nod = p.nod == null ? 0.28 : p.nod;
  const L = p.layer || 'drowse', C = ['root.roll', 'torso.roll', 'torso.lean', 'head.pitch', 'head.yaw', 'arm.' + sd + '.pitch', 'arm.' + sd + '.out', 'hand.' + sd + '.roll', 'hips.dy'];
  if (p.reach && p.look) X.look(id, p.reach, I.t0 + 0.4, e, { label: 'the lotus', noFeet: true, speed: 0.4 });
  X.move(id, L, 'DROWSE', e, k => { k(I.t0, Object.fromEntries(C.map(c => [c, rel(X)])));
    let t = I.t0 + 0.3 + R() * 0.8, j = 0; const z = Object.fromEntries(C.map(c => [c, 0]));
    while (t < I.t1 - 1.2) { const u = j % 2 ? 1 : -1, d = P * (0.8 + 0.4 * R()), reach = p.reach && j % 3 === 1;
      k(t + d * 0.45, { 'root.roll': sw * u * 0.6, 'torso.roll': sw * u, 'torso.lean': 0.1 + 0.05 * R(), 'head.pitch': nod * (0.6 + 0.4 * R()), 'head.yaw': 0.15 * u, 'hips.dy': -1.2,
        ['arm.' + sd + '.pitch']: reach ? { abs: -1.15 } : 0, ['arm.' + sd + '.out']: reach ? 0.15 : 0, ['hand.' + sd + '.roll']: reach ? 0.5 : 0 });   /* down and over: the head drops, the hand drifts out */
      k(t + d * 0.8, { 'torso.roll': sw * u * 0.4, 'head.pitch': nod * 0.15, 'torso.lean': 0.03, 'hips.dy': -0.3, ['arm.' + sd + '.pitch']: reach ? { abs: -0.7 } : 0, ['hand.' + sd + '.roll']: 0 });   /* comes up late; the hand back short */
      t += d; j++; }
    k(I.t1, z); }, { label: I.label || 'drugged: swaying, nodding, the hand drifting to the lotus', rigid: true }); };
module.exports = M_;
