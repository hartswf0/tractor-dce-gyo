/* tools/perform/intents-action.js — the action vocabulary: labour, force and combat, realised on bodies (merged into the intent
   library by tools/perform/compile.js). Combat is written as relations between bodies, each caused by the one before:
     THREAT   (a body shows it could strike: the weapon raised, the weight gathered; the other's options narrow)
     ATTACK   (the strike: SHOOT for a bow, THRUST for a stake or spear, SWING for a blade; params.target)
     EVADE / DUCK / BLOCK   (the answer to an attack, within the reaction latency; a miss leaves the attacker overtravelled)
     CONTACT / IMPACT       (the blow lands: the struck body jolts, is driven back; heat conducts through the weapon)
     RECOVER  (the body comes back to a guard)          RETARGET (the eyes and the weapon go to the next one)
     PURSUIT  (one follows the one who retreats)         SEPARATION (distance opened: a step back, a scatter)
   and the labour: CARRY (many hands on one thing: the grips share its line), HEAT (a thing turned in the fire), TWIST (an auger's
   turning under the weight), SIGNAL (a command given by the body: hush, go, flee), HIDE (a held crouch: breath held, eyes on the
   danger), CLING (holding on under something), ADVANCE (the blocking's next move started early: root offsets that carry the figure
   to its next mark before the layout pass does, with the legs walking), STRAIN / ROW / BIND / SING / SEAL (tools/perform/machinery.js
   drives the ship's). */
'use strict';
const Score = require('./score.js');
const A_ = {};
const both = (X, id, t, vals) => vals;

/* SIGNAL params.how: hush (a hand flat down, the head shakes), go (the arm swept forward), flee (the arm flung back), beckon;
   params.to: the ones signalled (they answer: REACT turn, with latency) */
A_.SIGNAL = (X, I, e) => { const id = I.actor, p = I.params || {}, t = I.t0, a = X.ampOf(I), how = p.how || 'go', sd = p.side || 'L';
  if (p.lookAt) X.look(id, p.lookAt, t - 0.25, e, { label: 'to the ones he signals', noFeet: true });
  const sig = X.move(id, 'act', 'SIGNAL ' + how.toUpperCase(), e, k => { const A = 'arm.' + sd + '.pitch';
    if (how === 'hush') { k(t, { [A]: X.sheet.rel(0), 'head.yaw': X.sheet.rel(0), 'hand.' + sd + '.roll': X.sheet.rel(0) }); k(t + 0.3, { [A]: { abs: -1.1 }, ['hand.' + sd + '.roll']: -0.9 }); k(t + 0.7, { [A]: { abs: -0.9 } }); k(t + 1.0, { [A]: { abs: -1.05 } }); k(t + 1.6, { [A]: 0, ['hand.' + sd + '.roll']: 0 }); }
    else if (how === 'flee') { k(t, { [A]: X.sheet.rel(0), 'torso.twist': X.sheet.rel(0) }); k(t + 0.18, { [A]: { abs: -2.6 }, 'torso.twist': 0.25 * a }, 'back'); k(t + 0.5, { [A]: { abs: -1.4 }, 'torso.twist': 0.1 * a }); k(t + 0.9, { [A]: 0, 'torso.twist': 0 }); }
    else { k(t, { [A]: X.sheet.rel(0), 'torso.lean': X.sheet.rel(0) }); k(t + 0.2, { [A]: { abs: -0.4 }, 'torso.lean': -0.03 }); k(t + 0.45, { [A]: { abs: -1.6 }, 'torso.lean': 0.1 * a }, 'back'); k(t + 1.1, { [A]: { abs: -1.3 }, 'torso.lean': 0.06 }); k(t + 1.6, { [A]: 0, 'torso.lean': 0 }); } }, { label: how + (p.to ? ' to ' + [].concat(p.to).map(Score.short).join(', ') : '') });
  for (const o of [].concat(p.to || [])) { const R = X.rng(I.id + o); X.move(o, 'react', 'ANSWER', sig || e, k => { const tt = t + 0.4 + X.θ.latency * (0.6 + R() * 0.8); k(tt, { 'head.pitch': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0) }); k(tt + 0.2, { 'head.pitch': 0.08, 'hips.dy': how === 'hush' ? -1.2 : 0.8 }); k(tt + 0.6, { 'head.pitch': 0, 'hips.dy': how === 'hush' ? -0.8 : 0 }); }, { label: 'answers the ' + how }); } };

/* HEAT params.prop: the thing held in the fire and turned (the hands roll it, the body leans back from the heat, the eyes go to its
   tip and to the danger); a STIMULUS 'it glows' at params.glowAt */
A_.HEAT = (X, I, e) => { const id = I.actor, p = I.params || {}, R = X.rng(I.id); let t = I.t0 + 0.3;
  while (t < I.t1 - 0.8) { const u = R() < 0.5 ? 1 : -1; X.move(id, 'act', 'TURN IN THE FIRE', e, k => { k(t, { 'hand.R.roll': X.sheet.rel(0), 'hand.L.roll': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), 'torso.twist': X.sheet.rel(0) }); k(t + 0.45, { 'hand.R.roll': 0.7 * u, 'hand.L.roll': -0.7 * u, 'torso.lean': -0.06, 'torso.twist': 0.08 * u }); k(t + 1.1, { 'hand.R.roll': 0.1 * u, 'hand.L.roll': -0.1 * u, 'torso.lean': -0.04, 'torso.twist': 0.02 * u }); }, { label: 'the stake turned in the fire' }); t += 1.4 + R() * 0.8; }
  if (p.glowAt) X.ev({ id: p.glowId || 'sGlow', lane: 'STIMULUS', actor: null, t0: p.glowAt, t1: p.glowAt + 0.3, kind: 'SIGHT', label: 'the olive-wood stake glows', because: [{ id: e.id, latency: X.r3(p.glowAt - e.t0) }] }); };
/* CARRY params.with: the other bearers (their bodies share the effort: weight down, lean into it, steps together on the blocking's walk) */
A_.CARRY = (X, I, e) => { const id = I.actor, p = I.params || {}, R = X.rng(I.id + id), t0 = I.t0, t1 = I.t1;
  X.move(id, 'weight', 'BEAR THE WEIGHT', e, k => { k(t0, { 'hips.dy': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0) }); k(t0 + 0.4, { 'hips.dy': -1.8, 'torso.lean': 0.1 }); let t = t0 + 0.9; while (t < t1 - 0.3) { k(t, { 'hips.dy': -1.4 - 0.6 * R(), 'torso.lean': 0.08 + 0.05 * R() }); t += 0.6 + 0.3 * R(); } k(t1, { 'hips.dy': -1.2, 'torso.lean': 0.1 }); }, { label: 'many hands on one stake' + (p.with ? ' (with ' + [].concat(p.with).length + ')' : '') }); };
/* THRUST params.target: the drive (the weight thrown forward along the stake: lean, the arms pushing out, the hips dropping) */
A_.THRUST = (X, I, e) => { const id = I.actor, t = I.t0, a = X.ampOf(I), p = I.params || {};
  const th = X.move(id, 'act', 'THRUST', e, k => { k(t - 0.35, { 'torso.lean': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0) });
    k(t - 0.1, { 'torso.lean': -0.08 * a, 'hips.dy': 0.8, 'arm.R.pitch': 0.25 * a, 'arm.L.pitch': 0.25 * a }, 'out');   /* the gather back */
    k(t + 0.12, { 'torso.lean': 0.3 * a, 'hips.dy': -3.0 * a, 'arm.R.pitch': -0.45 * a, 'arm.L.pitch': -0.45 * a }, 'in');   /* the drive */
    k(t + 0.5, { 'torso.lean': 0.26 * a, 'hips.dy': -2.4 * a, 'arm.R.pitch': -0.35 * a, 'arm.L.pitch': -0.35 * a }); }, { label: 'into ' + Score.short(p.target || I.target || 'it') });
  if (p.impact !== false) X.ev({ id: p.impactId || undefined, lane: 'CONTACT', actor: id, actors: [id, ...(p.with || [])], t0: t + 0.12, t1: t + 0.4, kind: 'IMPACT', label: 'the point goes in', because: th ? [{ id: th.id, latency: 0.12 }] : [], params: { k: 8 } }); };
/* TWIST: the auger turned round and round under the weight (the torso twists back and forth, the hands roll, the head down on it) */
A_.TWIST = (X, I, e) => { const id = I.actor, a = X.ampOf(I), p = I.params || {}, per = p.period || 0.9; let t = I.t0, k2 = 0;
  X.move(id, 'act', 'TWIST', e, k => { k(t, { 'torso.twist': X.sheet.rel(0), 'hand.R.roll': X.sheet.rel(0), 'hand.L.roll': X.sheet.rel(0), 'head.pitch': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0) });
    while (t < I.t1 - per / 2) { const u = k2 % 2 ? 1 : -1; k(t + per / 2, { 'torso.twist': 0.34 * u * a, 'hand.R.roll': 0.9 * u, 'hand.L.roll': 0.9 * u, 'head.pitch': 0.1, 'torso.lean': 0.12 * a }); t += per / 2; k2++; }
    k(I.t1 + 0.3, { 'torso.twist': 0, 'hand.R.roll': 0, 'hand.L.roll': 0, 'head.pitch': 0 }); }, { label: 'round and round, as a shipwright bores a plank' });
  const n = Math.max(1, Math.floor((I.t1 - I.t0) / per)); for (let j = 0; j < n; j += 2) X.ev({ lane: 'FX', actor: null, t0: I.t0 + j * per + 0.2, t1: I.t0 + j * per + 0.9, kind: 'STEAM', label: 'the eye hisses: steam and blood', because: [{ id: e.id, latency: X.r3(j * per + 0.2) }] }); };
/* STRAIN: bodies holding against a force (the stake bucking, a rope): short jolts, the weight thrown back */
A_.STRAIN = A_.STRAIN || ((X, I, e) => { const id = I.actor, R = X.rng(I.id + id), a = X.ampOf(I); let t = I.t0;
  X.move(id, 'act', 'STRAIN', e, k => { k(t, { 'torso.lean': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0), 'root.roll': X.sheet.rel(0) }); while (t < I.t1) { const u = R() < 0.5 ? -1 : 1; k(t + 0.25, { 'torso.lean': (0.14 + 0.08 * R()) * a, 'hips.dy': -2.2, 'root.roll': 0.03 * u }, 'out'); k(t + 0.55, { 'torso.lean': 0.09 * a, 'hips.dy': -1.4, 'root.roll': 0.01 * u }); t += 0.55 + 0.35 * R(); } k(I.t1 + 0.3, { 'torso.lean': 0, 'hips.dy': 0, 'root.roll': 0 }); }, { label: I.label || 'hold against it' }); });
/* RECOIL params.from: thrown back by a force or a sight (the arms up, the body back, a step back with the legs) */
A_.RECOIL = (X, I, e) => { const id = I.actor, t = I.t0, a = X.ampOf(I), p = I.params || {}, s = X.at(id, t); const tp = p.from ? X.where(p.from, t) : null;
  let dx = 0, dz = 0; if (s && tp) { const d = Math.atan2(s.p[0] - tp[0], s.p[2] - tp[2]); dx = Math.sin(d) * 0.35 * X.H(id) * a; dz = Math.cos(d) * 0.35 * X.H(id) * a; }
  X.move(id, 'react', 'RECOIL', e, k => { k(t, { 'torso.lean': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0), 'root.x': X.sheet.rel(0), 'root.z': X.sheet.rel(0), 'leg.R.pitch': X.sheet.rel(0), 'leg.L.pitch': X.sheet.rel(0) });
    k(t + 2 / X.F, { 'torso.lean': -0.22 * a, 'arm.R.pitch': -1.2 * a, 'arm.L.pitch': -1.0 * a, 'hips.dy': 1.4, 'leg.R.pitch': 0.3, 'leg.L.pitch': -0.2 }, 'out');
    k(t + 0.45, { 'root.x': X.sheet.rel(dx), 'root.z': X.sheet.rel(dz), 'torso.lean': -0.12 * a, 'arm.R.pitch': -0.8 * a, 'arm.L.pitch': -0.6 * a, 'leg.R.pitch': 0, 'leg.L.pitch': 0, 'hips.dy': -1.0 });
    k(t + 1.3, { 'torso.lean': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'hips.dy': 0 }); }, { label: p.label || 'thrown back' }); };
/* HIDE: a held crouch; the breath held (the weight low, the head down and turned to the danger params.from); a HOLD with a reason */
A_.HIDE = (X, I, e) => { const id = I.actor, p = I.params || {}, R = X.rng(I.id + id), t0 = I.t0;
  X.move(id, 'act', 'CROUCH', e, k => { k(t0, { 'hips.dy': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), 'head.pitch': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0) }); k(t0 + 0.5, { 'hips.dy': -6, 'torso.lean': 0.32, 'head.pitch': -0.12, 'arm.R.pitch': -0.5, 'arm.L.pitch': -0.5 }, 'out'); k(I.t1, { 'hips.dy': -5.5, 'torso.lean': 0.3, 'head.pitch': -0.1, 'arm.R.pitch': -0.5, 'arm.L.pitch': -0.5 }, 'linear'); }, { label: 'down among the animals, the breath held' });
  if (p.from) { let t = t0 + 0.6 + R() * 0.5; while (t < I.t1 - 1) { X.look(id, p.from, t, e, { label: 'the danger', noFeet: true, speed: 1.3 }); t += 2.2 + R() * 2.5; if (p.to && t < I.t1 - 1) { X.look(id, p.to, t, e, { label: 'to his leader', noFeet: true, speed: 1.1 }); t += 1.2 + R(); } } } };
/* CLING: holding on beneath something (the arms locked, small adjustments of the grip, the head turned to listen) */
A_.CLING = (X, I, e) => { const id = I.actor, R = X.rng(I.id); let t = I.t0 + 0.5;
  while (t < I.t1 - 0.6) { X.move(id, 'act', 'GRIP', e, k => { k(t, { 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0), 'head.yaw': X.sheet.rel(0) }); k(t + 0.3, { 'arm.R.pitch': -0.08, 'arm.L.pitch': 0.05, 'head.yaw': (R() - 0.5) * 0.3 }); k(t + 0.9, { 'arm.R.pitch': 0, 'arm.L.pitch': 0 }); }, { label: 'the fleece held' }); t += 1.3 + R() * 1.4; } };
/* ADVANCE params.key: the blocking's move to that key started early, at I.t0, arriving at params.arrive (s): root offsets carry the
   figure from where the blocking has it to where the blocking will put it, the legs walking; the offsets fade as the blocking
   catches up (a retiming of the layout pass by the acting layer, caused by the intent) */
A_.ADVANCE = (X, I, e) => { const id = I.actor, p = I.params || {}, K = X.M.keys.find(k => k.id === p.key); if (!K || !K.snap[id] || !K.win) return;
  const dest = K.snap[id].p, t0 = I.t0, ta = Math.min(p.arrive, K.win[1]), H = X.H(id), stride = 0.42 * H;
  if (ta <= t0 + 0.2) return;
  X.move(id, 'loco', 'ADVANCE', e, k => { k(t0, { 'root.x': X.sheet.rel(0), 'root.z': X.sheet.rel(0), 'leg.R.pitch': X.sheet.rel(0), 'leg.L.pitch': X.sheet.rel(0) });
    let dist = 0, prev = null;
    for (let t = t0 + 1 / X.F; t <= K.win[1] + 0.3; t += 1 / X.F) { const s = X.at(id, t); if (!s) continue; const u = X.sm(Math.min(1, (t - t0) / (ta - t0)));
      const want = [s.p[0] + (dest[0] - s.p[0]) * u, s.p[2] + (dest[2] - s.p[2]) * u], off = [want[0] - s.p[0], want[1] - s.p[2]];
      if (prev) dist += Math.hypot(want[0] - prev[0], want[1] - prev[1]); prev = want; const ph = dist / stride * Math.PI, walking = t < ta ? 1 : 0;
      k(t, { 'root.x': off[0], 'root.z': off[1], 'leg.R.pitch': 0.5 * walking * Math.sin(ph), 'leg.L.pitch': -0.5 * walking * Math.sin(ph) }, 'linear'); }
    k(K.win[1] + 0.6, { 'root.x': 0, 'root.z': 0, 'leg.R.pitch': 0, 'leg.L.pitch': 0 }); }, { label: 'to the ' + p.key + ' mark early (arrives ' + ta.toFixed(2) + ' s, the layout pass at ' + K.win[1].toFixed(2) + ')' }); };
/* HOLD_BACK params.key, until: the blocking's move to that key delayed: the figure kept where it is until params.until */
A_.HOLD_BACK = (X, I, e) => { const id = I.actor, p = I.params || {}, K = X.M.keys.find(k => k.id === p.key); if (!K || !K.win) return; const s0 = X.at(id, K.win[0] - 0.05); if (!s0) return;
  X.move(id, 'loco', 'HOLD BACK', e, k => { k(K.win[0] - 0.05, { 'root.x': X.sheet.rel(0), 'root.z': X.sheet.rel(0) }); for (let t = K.win[0]; t <= Math.min(p.until, K.win[1] + 1); t += 1 / X.F) { const s = X.at(id, t); if (!s) continue; const u = t > p.until - 0.6 ? X.sm((p.until - t) / 0.6) : 1; k(t, { 'root.x': (s0.p[0] - s.p[0]) * u, 'root.z': (s0.p[2] - s.p[2]) * u }, 'linear'); } k(p.until + 0.1, { 'root.x': 0, 'root.z': 0 }); }, { label: 'held at the mark until ' + p.until.toFixed(2) + ' s' }); };

/* ═════ combat relations ═════ */
/* THREAT params.target, weapon side: the weapon raised toward the target, the weight gathered; recorded as a relation */
A_.THREAT = (X, I, e) => { const id = I.actor, t = I.t0, a = X.ampOf(I), p = I.params || {}, sd = p.side || 'R';
  X.look(id, I.target, t - 0.2, e, { label: 'on ' + Score.short(I.target) });
  X.move(id, 'act', 'THREAT', e, k => { k(t, { ['arm.' + sd + '.pitch']: X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0) }); k(t + 0.4, { ['arm.' + sd + '.pitch']: { abs: -1.4 }, 'torso.lean': 0.08 * a, 'hips.dy': -1.5 }); k(I.t1, { ['arm.' + sd + '.pitch']: { abs: -1.3 }, 'torso.lean': 0.06 * a, 'hips.dy': -1.2 }, 'linear'); }, { label: 'at ' + Score.short(I.target) }); };
/* SHOOT (an ATTACK with a bow): the nock, the draw, the hold at full draw trembling, the loose, the recoil; the arrow's flight a
   STIMULUS at the loose; the struck body's IMPACT follows in the target's own intent (caused by the loose) */
A_.SHOOT = (X, I, e) => { const id = I.actor, t = I.t0, p = I.params || {}, a = X.ampOf(I), draw = p.draw || 1.0, hold = p.hold || 0.6, tl = t + draw + hold;
  X.look(id, I.target, t - 0.4, e, { label: 'the aim on ' + Score.short(I.target) });
  const sh = X.move(id, 'act', 'DRAW AND LOOSE', e, k => { k(t - 0.2, { 'arm.L.pitch': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.R.out': X.sheet.rel(0), 'torso.twist': X.sheet.rel(0), 'head.pitch': X.sheet.rel(0) });
    k(t + 0.3, { 'arm.L.pitch': { abs: -1.55 }, 'arm.R.pitch': { abs: -1.4 }, 'torso.twist': -0.25 * a });   /* the bow up, the nock */
    k(t + draw, { 'arm.L.pitch': { abs: -1.6 }, 'arm.R.pitch': { abs: -1.25 }, 'arm.R.out': 0.4 * a, 'torso.twist': -0.35 * a });   /* the draw */
    for (let j = 1; j < hold * 12; j += 2) k(t + draw + j / 12, { 'arm.R.pitch': { abs: -1.25 + (j % 4 === 1 ? 0.03 : -0.03) } }, 'linear');   /* the hold trembles */
    k(tl + 1 / X.F, { 'arm.R.pitch': { abs: -1.05 }, 'arm.R.out': 0.65 * a, 'torso.twist': -0.2 * a, 'head.pitch': -0.04 }, 'out');   /* the loose: the string hand flies back */
    k(tl + 0.8, { 'arm.L.pitch': { abs: -1.45 }, 'arm.R.pitch': { abs: -0.9 }, 'arm.R.out': 0.2, 'torso.twist': -0.15 * a }); k(tl + 1.6, { 'arm.L.pitch': 0, 'arm.R.pitch': 0, 'arm.R.out': 0, 'torso.twist': 0, 'head.pitch': 0 }); }, { label: 'at ' + Score.short(I.target) });
  X.ev({ id: p.looseId || 'sLoose:' + I.id, lane: 'STIMULUS', actor: id, t0: tl, t1: tl + 0.25, kind: 'SOUND', label: 'the bowstring, the arrow away', because: sh ? [{ id: sh.id, latency: X.r3(tl - sh.t0) }] : [] }); };
/* IMPACT params.from (the attack's stimulus id is the cause): the jolt back, the hand to the wound, the stagger; params.fall: the key
   whose window lays the body down (the fall itself is the blocking's; the body goes with it) */
A_.IMPACT = (X, I, e) => { const id = I.actor, t = I.t0, a = X.ampOf(I), p = I.params || {};
  X.move(id, 'act', 'IMPACT', e, k => { k(t, { 'torso.lean': X.sheet.rel(0), 'head.pitch': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0), 'root.pitch': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0) });
    k(t + 2 / X.F, { 'torso.lean': -0.26 * a, 'head.pitch': -0.2, 'arm.R.pitch': 0.6 * a, 'arm.L.pitch': { abs: -2.3 }, 'root.pitch': -0.1, 'hips.dy': 1.2 }, 'out');   /* the jolt: the cup arm drops, the hand to the throat */
    k(t + 0.5, { 'torso.lean': -0.16, 'head.pitch': -0.12, 'arm.R.pitch': 0.5, 'root.pitch': -0.05, 'hips.dy': -1.5 });
    let tt = t + 0.5, j = 0; while (tt < (p.until || t + 2.5) - 0.35) { const u = j % 2 ? 1 : -1; tt += 0.34 + 0.1 * (j % 3); k(tt, { 'root.roll': 0.05 * u, 'torso.roll': -0.07 * u, 'hips.dy': -1.6 - (j % 2), 'head.pitch': -0.08 + 0.07 * (j % 2) }); j++; }
    k((p.until || t + 2.5) + 0.3, { 'torso.lean': 0, 'head.pitch': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'root.pitch': 0, 'root.roll': 0, 'torso.roll': 0, 'hips.dy': 0 }); }, { label: p.label || 'struck' }); };
/* FALL params.key: the blocking lays the body down across its window; the knees go first, the arms fly, the body follows, then a
   stillness that is a HOLD('dead') authored beside it */
A_.FALL = (X, I, e) => { const id = I.actor, K = X.M.keys.find(k => k.id === (I.params || {}).key), w = K && K.win ? K.win : [I.t0, I.t1];
  X.move(id, 'act', 'FALL', e, k => { k(w[0] - 0.1, { 'hips.dy': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), 'head.pitch': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0) });
    k(w[0] + 0.35, { 'hips.dy': -3.5, 'torso.lean': 0.2, 'head.pitch': -0.15, 'arm.R.pitch': -0.6, 'arm.L.pitch': -0.3 }, 'in'); k(X.lerp(w[0], w[1], 0.6), { 'hips.dy': -2, 'torso.lean': 0.3, 'head.pitch': 0.18, 'arm.R.pitch': 0.4, 'arm.L.pitch': 0.5 }, 'out');
    k(w[1] + 0.1, { 'hips.dy': 0, 'torso.lean': 0.06, 'head.pitch': 0.1, 'arm.R.pitch': 0.15, 'arm.L.pitch': 0.1 }, 'back'); k(w[1] + 0.9, { 'torso.lean': 0, 'head.pitch': 0.05, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }); }, { label: I.label || 'the fall' }); };
/* EVADE / DUCK: out of the line of the threat (a step aside and back, the head down) */
A_.DUCK = (X, I, e) => { const id = I.actor, t = I.t0, a = X.ampOf(I); X.move(id, 'react', 'DUCK', e, k => { k(t, { 'hips.dy': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), 'head.pitch': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0) }); k(t + 0.2, { 'hips.dy': -5 * a, 'torso.lean': 0.28 * a, 'head.pitch': 0.15, 'arm.R.pitch': -1.8 * a, 'arm.L.pitch': -1.7 * a }, 'out'); k(t + 0.9, { 'hips.dy': -3.5 * a, 'torso.lean': 0.2 * a, 'arm.R.pitch': -1.3, 'arm.L.pitch': -1.2 }); k(I.t1, { 'hips.dy': 0, 'torso.lean': 0, 'head.pitch': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }); }, { label: I.label || 'under it' }); };
A_.EVADE = (X, I, e) => { const p = I.params || {}; A_.RECOIL(X, { ...I, params: { ...p, label: I.label || 'out of the line' } }, e); };
/* SEARCH: the eyes and hands go along the walls for what is not there (turns, a reach up, the head swinging) */
A_.SEARCH = (X, I, e) => { const id = I.actor, R = X.rng(I.id + id), a = X.ampOf(I), s0 = X.at(id, I.t0); if (!s0 || s0.sat) return; let t = I.t0 + R() * 0.4;
  while (t < I.t1 - 0.6) { const u = R() < 0.5 ? -1 : 1; X.move(id, 'act', 'SEARCH', e, k => { k(t, { 'torso.twist': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0), 'root.h': X.sheet.rel(0), 'head.yaw': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0) });
      k(t + 0.4, { 'torso.twist': 0.3 * u * a, 'arm.R.pitch': { abs: -2.2 }, 'arm.L.pitch': { abs: -0.6 }, 'root.h': 0.7 * u, 'head.yaw': 0.3 * u, 'torso.lean': -0.05 }); k(t + 0.9, { 'arm.R.pitch': { abs: -1.9 }, 'head.yaw': -0.2 * u }); k(t + 1.2, { 'torso.twist': 0.1 * u, 'arm.R.pitch': { abs: -0.4 }, 'arm.L.pitch': { abs: -0.2 }, 'head.yaw': 0 }); }, { label: 'the walls: the weapons are gone' }); t += 1.3 + R() * 0.5; }
  X.move(id, 'act', 'SEARCH', e, k => { k(I.t1 - 0.2, { 'torso.twist': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0), 'root.h': X.sheet.rel(0) }); k(I.t1 + 0.4, { 'torso.twist': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'root.h': 0 }); }, { silent: true }); };
/* LEAP: onto the threshold (the crouch, up, land), the body's weight carried by the legs */
A_.LEAP = (X, I, e) => { const id = I.actor, t = I.t0, a = X.ampOf(I);
  X.move(id, 'act', 'LEAP', e, k => { k(t - 0.1, { 'root.y': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0), 'leg.R.pitch': X.sheet.rel(0), 'leg.L.pitch': X.sheet.rel(0) });
    k(t + 0.35, { 'hips.dy': -3, 'torso.lean': 0.25, 'arm.R.pitch': 0.5, 'arm.L.pitch': 0.5, 'leg.R.pitch': -0.3, 'leg.L.pitch': -0.3 }, 'out');
    k(t + 0.6, { 'hips.dy': 1, 'root.y': 18 * X.scale * a, 'torso.lean': -0.1, 'arm.R.pitch': -2.4 * a, 'arm.L.pitch': -2.2 * a, 'leg.R.pitch': -0.5, 'leg.L.pitch': 0.3 }, 'out');
    k(t + 0.85, { 'root.y': 0, 'hips.dy': -2.5, 'torso.lean': 0.18, 'arm.R.pitch': -1.2, 'arm.L.pitch': -0.9, 'leg.R.pitch': -0.2, 'leg.L.pitch': -0.2 }, 'in');
    k(t + 1.3, { 'hips.dy': 0, 'torso.lean': 0, 'arm.R.pitch': -0.6, 'arm.L.pitch': -0.8, 'leg.R.pitch': 0, 'leg.L.pitch': 0 }, 'out'); k(t + 2.0, { 'arm.R.pitch': 0, 'arm.L.pitch': 0 }); }, { label: I.label || 'onto the threshold' });
  X.ev({ lane: 'STIMULUS', actor: id, t0: t + 0.85, t1: t + 1.0, kind: 'SOUND', label: 'he lands on the threshold stone', id: (I.params || {}).landId, because: [{ id: e.id, latency: 0.85 }] }); };
/* POUR_OUT params: the arrows poured at his feet (the quiver tipped: the body bends, the arm sweeps) */
A_.POUR_OUT = (X, I, e) => { const id = I.actor, t = I.t0; X.move(id, 'act', 'POUR OUT', e, k => { k(t, { 'arm.R.pitch': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), 'head.pitch': X.sheet.rel(0), 'hand.R.roll': X.sheet.rel(0) }); k(t + 0.5, { 'arm.R.pitch': { abs: -1.2 }, 'torso.lean': 0.22, 'head.pitch': 0.12 }); k(t + 1.3, { 'arm.R.pitch': { abs: -0.9 }, 'hand.R.roll': 1.0, 'torso.lean': 0.26 }, 'linear'); k(t + 2.0, { 'arm.R.pitch': 0, 'hand.R.roll': 0, 'torso.lean': 0, 'head.pitch': 0 }); }, { label: 'the arrows before his feet' }); };
/* SEPARATION / RETARGET / RECOVER / PURSUIT: the relations in between (a step back; the aim moved to the next one; back to guard; follow) */
A_.SEPARATION = (X, I, e) => { A_.RECOIL(X, { ...I, params: { ...(I.params || {}), label: I.label || 'the distance opened' } }, e); };
A_.RETARGET = (X, I, e) => { X.look(I.actor, I.target, I.t0, e, { label: 'the aim moves to ' + Score.short(I.target), speed: 0.7 }); };
A_.RECOVER = (X, I, e) => { const id = I.actor, t = I.t0; X.move(id, 'act', 'RECOVER', e, k => { k(t, { 'torso.lean': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0) }); k(t + 0.6, { 'torso.lean': 0.04, 'hips.dy': -0.6, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }); k(t + 1.0, { 'torso.lean': 0, 'hips.dy': 0 }); }, { label: 'back to guard' }); };
A_.PURSUIT = (X, I, e) => { X.track(I.actor, I.target, I.t0, I.t1, e, { every: 0.4 }); };
module.exports = A_;
