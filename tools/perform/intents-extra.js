/* tools/perform/intents-extra.js — the kinds the catalogue (odyssey/perform/needs.json) still asked for after intents-more.js, and the
   fighting and contact kinds a tangled scene needs. Merged into the intent library by tools/perform/compile.js.

   ROW          {params: clock (a name: one clock per name), period, origin, offset, amp}   a rower on a shared phase clock: every
                ROW of one clock strokes on the same period from the same origin, each body at its own offset (a fraction of the
                stroke), so rowers who join late still pull together; each stroke an ACTION caused by the CLOCK
   GRIP         {target, params: point (shoulder | arm | wrist | hand | waist | neck | head | back), side, reach}   a held grip: the
                hand solved to the point on the other body at every drawing on twos (forward kinematics on the sheet as written), a
                CONTACT GRIP from the take hold to the release with the residual (units) of each drawing
   ATTACK       {target, params: kind (swing | stab | club | shove | punch), hit}     DEFEND {target, params: kind (block | parry |
                dodge | catch | duck), at}: the attack and defence kinds; STAB, CLUB, SHOVE, PUNCH, PARRY, DODGE, CATCH directly
                (SWING and BLOCK are intents-more.js's). A miss is a MISS and an OPENING stimulus; a parry a DEFLECTED stimulus; a
                catch a GRIP on the attacker's wrist; a shove a CONTACT PUSH and the pushed one's stagger
   LOCOMOTE     {params: path [[x, z]...], speed}     a walk the blocking does not give (intents.js walkPath)
   LEAVE        {params: to (an exit object, a point), speed}   the turn and the walk out
   CIRCLE       {target, params: radius (heights), turn (radians round), speed}   a walk round the target at a distance, the head on it
   RIDE         {target (a creature), params.period}   sitting a moving animal: the hands in the wool, the balance against its gait
   CLIMB        {params: rise (units), period}    hand over hand, a foot up at each pull (the body lifted by root.y)
   SWIM         {params: period}   the arms alternate over the head, the body along the water, the head turned to breathe
   DROWN        {params: sink (units)}   the struggle as he goes down: the arms up, the body sinking; the breath stops at the end
   WEAVE        {params: period, at}   the shuttle passed from hand to hand across the loom, the beater pulled, the head on the work
   MOVE_STONE   {target}   the shoulder to a weight: both arms level, the body driven at it, the legs back (a CONTACT with it)
   CARESS       {target, params: side, strokes}   a hand laid on and drawn along (a ram's back, a dog's head, a face)
   WAKE         {}   the head lifts, the body stirs, the eyes to the room (the start of a RISE when params.rise)
   DIE          {params.key}   the fall and then no breath (the compiler's breath stops from the end of the fall) */
'use strict';
const Score = require('./score.js'), I_ = require('./intents.js'), A_ = require('./intents-action.js'), M_ = require('./intents-more.js'), Mach = require('./machinery.js');
const E_ = {};
const rel = X => X.sheet.rel(0);

/* ═════ ROW: the shared phase clock ═════ */
E_.ROW = (X, I, e) => { const id = I.actor, p = I.params || {}, name = p.clock || 'row', C = (X.clocks = X.clocks || {});
  if (!C[name]) { const P = p.period || 2.6, origin = p.origin != null ? p.origin : I.t0; C[name] = { P, origin, n: 0, ev: X.ev({ id: 'clock:' + name, lane: 'STIMULUS', t0: origin, t1: X.T, kind: 'CLOCK', label: 'the stroke: one clock (' + name + '), period ' + P + ' s', params: { period: P, origin } }) }; }
  const c = C[name], P = c.P, seat = c.n++, off = p.offset != null ? p.offset : ((seat % 2 ? 1 : -1) * 0.02 * Math.ceil(seat / 2)), a = p.amp || 1;
  let n = Math.ceil((I.t0 - c.origin) / P - off); if (n < 0) n = 0;
  for (let tc = c.origin + (n + off) * P; tc + P <= I.t1 + 1e-6; tc += P, n++) Mach.stroke(X, id, tc, P, a, { id: c.ev.id, latency: X.r3(tc - c.origin), rel: 'on the clock' }, 'stroke ' + (n + 1) + ' (' + name + ', offset ' + (off >= 0 ? '+' : '') + X.r3(off) + ')', off);
  X.move(id, 'mech', 'SHIP OARS', e, k => { k(I.t1, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'torso.lean': rel(X), 'hips.dy': rel(X) }); k(I.t1 + 0.8, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0, 'hips.dy': 0 }); }, { silent: true }); };

/* ═════ GRIP: a held grip, solved every drawing on twos ═════ */
const POINT = { shoulder: s => 'sh' + s, arm: s => 'el' + s, wrist: s => 'hand' + s, hand: s => 'hand' + s, waist: () => 'hips', neck: () => 'neck', head: () => 'head', back: () => 'chest', chest: () => 'chest' };
E_.GRIP = (X, I, e) => { const id = I.actor, tg = I.target, p = I.params || {}, sd = p.side || 'R', far = p.targetSide || (sd === 'R' ? 'L' : 'R'), reach = p.reach || 0.45, pt = (POINT[p.point || 'shoulder'] || POINT.shoulder)(far);
  X.look(id, tg, I.t0 - 0.3, e, { label: 'on ' + Score.short(tg), noFeet: true });
  X.after((X2, C0) => { const Body = require('./body.js'), bctx = Body.context(X.M, C0), out = [], res = [];
    const hand = (t, x) => { const P = Body.sample(bctx, id, t, x); return P ? P.pts['hand' + sd] : null; };
    let prev = { ap: -1.2, ao: 0.1, ln: 0.05 };
    for (let t = I.t0 + reach; t <= I.t1 + 1e-6; t += 1 / 6) { const T = Body.sample(bctx, tg, t); if (!T || !T.pts[pt]) continue; const M = T.pts[pt];
      let best = { d: 1e9 }; const tryX = (ap, ao, ln) => { const h = hand(t, { ['arm.' + sd + '.pitch']: ap, ['arm.' + sd + '.out']: ao, 'torso.lean': ln }); if (!h) return; const d = Math.hypot(h[0] - M[0], h[1] - M[1], h[2] - M[2]) + 0.3 * Math.abs(ap - prev.ap); if (d < best.d) best = { d, ap, ao, ln }; };
      for (let ap = -2.6; ap <= 0.6; ap += 0.2) for (let ao = -0.2; ao <= 0.55; ao += 0.15) for (const ln of [0, 0.15]) tryX(ap, ao, ln);   /* coarse, then fine about the best */
      const c0 = { ...best }; for (let ap = c0.ap - 0.2; ap <= c0.ap + 0.2; ap += 0.05) for (let ao = c0.ao - 0.15; ao <= c0.ao + 0.15; ao += 0.05) for (const ln of [c0.ln - 0.05, c0.ln, c0.ln + 0.05]) tryX(ap, ao, Math.max(-0.1, Math.min(0.35, ln)));
      if (best.d > 1e8) continue; prev = best; const h = hand(t, { ['arm.' + sd + '.pitch']: best.ap, ['arm.' + sd + '.out']: best.ao, 'torso.lean': best.ln });
      out.push([t, best]); res.push([X.r3(t), X.r3(Math.hypot(h[0] - M[0], h[1] - M[1], h[2] - M[2]))]); }
    if (!out.length) { X.notes.push('GRIP ' + id + ' on ' + tg + ': no pose of the other to hold'); return; }
    const mv = X.move(id, 'grip', 'GRIP', e, k => { k(I.t0, { ['arm.' + sd + '.pitch']: 0, ['arm.' + sd + '.out']: 0, 'torso.lean': 0, ['hand.' + sd + '.roll']: 0 });
      for (const [t, b] of out) k(t, { ['arm.' + sd + '.pitch']: b.ap, ['arm.' + sd + '.out']: b.ao, 'torso.lean': b.ln, ['hand.' + sd + '.roll']: 0.4 }, 'linear');
      k(I.t1 + 0.5, { ['arm.' + sd + '.pitch']: 0, ['arm.' + sd + '.out']: 0, 'torso.lean': 0, ['hand.' + sd + '.roll']: 0 }); }, { label: 'holds ' + Score.short(tg) + ' by the ' + (p.point || 'shoulder'), rigid: true });
    const mean = res.reduce((a, r) => a + r[1], 0) / res.length, worst = Math.max(...res.map(r => r[1]));
    X.ev({ lane: 'CONTACT', actor: id, actors: [id, tg], t0: X.r3(I.t0 + reach), t1: X.r3(I.t1), kind: 'GRIP', label: 'a held grip on ' + Score.short(tg) + "'s " + (p.point || 'shoulder') + ' (mean ' + mean.toFixed(1) + ', worst ' + worst.toFixed(1) + ' units off)', because: mv ? [{ id: mv.id, latency: reach }] : [{ id: e.id, latency: reach }], params: { owner: id, points: ['hand' + sd + '>' + tg + ':' + (p.point || 'shoulder')], release: X.r3(I.t1), k: 6, residual: res.filter((_, i) => i % 2 === 0), mean: X.r3(mean), worst: X.r3(worst) } });
    if (p.answer === 'struggle') M_.STRUGGLE(X, { actor: tg, id: I.id + ':s', t0: I.t0 + reach + X.θ.latency, t1: I.t1, label: 'twists in the grip' }, e); }); };

/* ═════ attacks ═════ */
function outcome(X, I, e, m, t, what, o = {}) { const p = I.params || {}, id = I.actor;
  if (p.hit) return X.ev({ id: p.impactId, lane: 'CONTACT', actor: id, actors: [id, I.target], t0: X.r3(t), t1: X.r3(t + 0.15), kind: o.kind || 'IMPACT', label: what + ' lands', because: m ? [{ id: m.id, latency: X.r3(t - m.t0) }] : [], params: { k: o.k || 8 } });
  X.ev({ id: p.missId, lane: 'STIMULUS', actor: id, t0: X.r3(t + 0.05), t1: X.r3(t + 0.25), kind: 'MISS', label: what + ' finds nothing', because: m ? [{ id: m.id, latency: X.r3(t + 0.05 - m.t0) }] : [] });
  return X.ev({ id: p.openingId, lane: 'STIMULUS', actor: id, t0: X.r3(t + 0.25), t1: X.r3(t + 0.8), kind: 'OPENING', label: 'overreached: open', because: m ? [{ id: m.id, latency: X.r3(t + 0.25 - m.t0) }] : [] }); }
/* STAB: the point driven straight at the body: the weight onto the front foot, the arm level and through */
E_.STAB = (X, I, e) => { const id = I.actor, t = I.t0, a = X.ampOf(I), sd = (I.params || {}).side || 'R';
  X.look(id, I.target, t - 0.3, e, { label: 'on ' + Score.short(I.target) });
  const m = X.move(id, 'act', 'STAB', e, k => { k(t, { ['arm.' + sd + '.pitch']: rel(X), 'torso.lean': rel(X), 'leg.R.pitch': rel(X), 'leg.L.pitch': rel(X), 'hips.dy': rel(X), 'torso.twist': rel(X) });
    k(t + 0.3, { ['arm.' + sd + '.pitch']: { abs: -1.0 }, 'torso.lean': -0.08, 'torso.twist': 0.25 * (sd === 'R' ? 1 : -1), 'hips.dy': 0.6 });   /* drawn back */
    k(t + 0.48, { ['arm.' + sd + '.pitch']: { abs: -1.62 }, 'torso.lean': 0.3 * a, 'torso.twist': -0.2 * (sd === 'R' ? 1 : -1), 'leg.R.pitch': -0.55, 'leg.L.pitch': 0.35, 'hips.dy': -2.2 }, 'in');   /* the lunge */
    k(t + 1.2, { ['arm.' + sd + '.pitch']: { abs: -1.2 }, 'torso.lean': 0.05, 'torso.twist': 0, 'leg.R.pitch': 0, 'leg.L.pitch': 0, 'hips.dy': 0 }); }, { label: 'the point at ' + Score.short(I.target) });
  return outcome(X, I, e, m, t + 0.48, 'the point'); };
/* CLUB: both hands over the head, the blow down */
E_.CLUB = (X, I, e) => { const id = I.actor, t = I.t0, a = X.ampOf(I);
  X.look(id, I.target, t - 0.3, e, { label: 'on ' + Score.short(I.target) });
  const m = X.move(id, 'act', 'CLUB', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'torso.lean': rel(X), 'hips.dy': rel(X) });
    k(t + 0.45, { 'arm.R.pitch': { abs: -3.0 }, 'arm.L.pitch': { abs: -2.9 }, 'torso.lean': -0.18, 'hips.dy': 1.2 }, 'out'); k(t + 0.62, { 'arm.R.pitch': { abs: -0.9 }, 'arm.L.pitch': { abs: -0.95 }, 'torso.lean': 0.35 * a, 'hips.dy': -2.5 }, 'in');
    k(t + 1.4, { 'arm.R.pitch': { abs: -0.6 }, 'arm.L.pitch': { abs: -0.6 }, 'torso.lean': 0.08, 'hips.dy': 0 }); }, { label: 'the blow down on ' + Score.short(I.target) });
  return outcome(X, I, e, m, t + 0.62, 'the blow', { k: 9 }); };
/* PUNCH: the jab (the shoulder turned into it) */
E_.PUNCH = (X, I, e) => { const id = I.actor, t = I.t0, sd = (I.params || {}).side || 'R';
  const m = X.move(id, 'act', 'PUNCH', e, k => { k(t, { ['arm.' + sd + '.pitch']: rel(X), 'torso.twist': rel(X), 'torso.lean': rel(X) }); k(t + 0.12, { ['arm.' + sd + '.pitch']: { abs: -1.0 }, 'torso.twist': 0.2 * (sd === 'R' ? 1 : -1) }); k(t + 0.24, { ['arm.' + sd + '.pitch']: { abs: -1.6 }, 'torso.twist': -0.3 * (sd === 'R' ? 1 : -1), 'torso.lean': 0.15 }, 'in'); k(t + 0.7, { ['arm.' + sd + '.pitch']: { abs: -1.1 }, 'torso.twist': 0, 'torso.lean': 0.03 }); }, { label: 'a fist at ' + Score.short(I.target) });
  return outcome(X, I, e, m, t + 0.24, 'the fist', { k: 5 }); };
/* SHOVE: both hands into the chest; the pushed one staggers back (caused by the push) */
E_.SHOVE = (X, I, e) => { const id = I.actor, t = I.t0, a = X.ampOf(I);
  X.look(id, I.target, t - 0.3, e, { label: 'on ' + Score.short(I.target) });
  const m = X.move(id, 'act', 'SHOVE', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'torso.lean': rel(X), 'leg.R.pitch': rel(X), 'hips.dy': rel(X) }); k(t + 0.25, { 'arm.R.pitch': { abs: -1.1 }, 'arm.L.pitch': { abs: -1.1 }, 'torso.lean': 0.05, 'hips.dy': -1 }); k(t + 0.42, { 'arm.R.pitch': { abs: -1.55 }, 'arm.L.pitch': { abs: -1.55 }, 'torso.lean': 0.3 * a, 'leg.R.pitch': -0.4, 'hips.dy': -2 }, 'in'); k(t + 1.1, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0, 'leg.R.pitch': 0, 'hips.dy': 0 }); }, { label: 'shoves ' + Score.short(I.target) });
  const c = X.ev({ lane: 'CONTACT', actor: id, actors: [id, I.target], t0: X.r3(t + 0.42), t1: X.r3(t + 0.55), kind: 'PUSH', label: 'hands to the chest', because: m ? [{ id: m.id, latency: 0.42 }] : [], params: { k: 7 } });
  const s = X.at(I.target, t + 0.42), sa = X.at(id, t + 0.42); if (!s || !sa) return c; const dx = s.p[0] - sa.p[0], dz = s.p[2] - sa.p[2], L = Math.hypot(dx, dz) || 1, d = 0.35 * X.H(I.target) * a;   /* root.x, root.z: world offsets */
  X.move(I.target, 'react', 'STAGGER', c, k => { const t1 = t + 0.42 + X.θ.latency * 0.3; k(t1, { 'root.x': rel(X), 'root.z': rel(X), 'torso.lean': rel(X), 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X) }); k(t1 + 0.35, { 'root.x': dx / L * d, 'root.z': dz / L * d, 'torso.lean': -0.22, 'arm.R.pitch': -0.9, 'arm.L.pitch': -0.8 }, 'out'); k(t1 + 1.2, { 'root.x': dx / L * d, 'root.z': dz / L * d, 'torso.lean': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }); }, { label: 'thrown back a step' });
  return c; };
/* PARRY: the blade across the line of the attack at its moment, the attacker's blade turned aside (DEFLECTED) */
E_.PARRY = (X, I, e) => { const id = I.actor, t = I.t0, sd = (I.params || {}).side || 'R';
  const m = X.move(id, 'react', 'PARRY', e, k => { k(t - 0.25, { ['arm.' + sd + '.pitch']: rel(X), ['arm.' + sd + '.out']: rel(X), 'torso.twist': rel(X) }); k(t, { ['arm.' + sd + '.pitch']: { abs: -1.7 }, ['arm.' + sd + '.out']: -0.15, 'torso.twist': 0.2 * (sd === 'R' ? -1 : 1) }, 'out'); k(t + 0.18, { ['arm.' + sd + '.out']: 0.35, 'torso.twist': 0.1 }, 'out'); k(t + 0.9, { ['arm.' + sd + '.pitch']: { abs: -1.2 }, ['arm.' + sd + '.out']: 0.05, 'torso.twist': 0 }); }, { label: 'turns the blade of ' + Score.short(I.target) });
  const c = X.ev({ lane: 'CONTACT', actor: id, actors: [id, I.target], t0: X.r3(t), t1: X.r3(t + 0.12), kind: 'PARRY', label: 'blade on blade', because: m ? [{ id: m.id, latency: 0.25 }] : [], params: { k: 6 } });
  X.ev({ id: (I.params || {}).deflectId, lane: 'STIMULUS', actor: I.target, t0: X.r3(t + 0.12), t1: X.r3(t + 0.5), kind: 'DEFLECTED', label: Score.short(I.target) + "'s blade turned aside: his guard wide", because: [{ id: c.id, latency: 0.12 }] }); return c; };
/* DODGE: out of the line: a step to the side and the body leaned away, back when it has passed */
E_.DODGE = (X, I, e) => { const id = I.actor, t = I.t0, s = X.at(id, t), a = X.ampOf(I), H = X.H(id), side = ((I.params || {}).to === 'L' ? 1 : -1); if (!s) return null;
  const dx = Math.cos(s.h) * side * 0.4 * H, dz = -Math.sin(s.h) * side * 0.4 * H;
  return X.move(id, 'react', 'DODGE', e, k => { k(t - 0.2, { 'root.x': rel(X), 'root.z': rel(X), 'torso.roll': rel(X), 'hips.dy': rel(X), 'leg.R.pitch': rel(X) }); k(t + 0.05, { 'root.x': dx * a, 'root.z': dz * a, 'torso.roll': -0.14 * side, 'hips.dy': -2.5, 'leg.R.pitch': -0.3 }, 'out'); k(t + 0.7, { 'root.x': dx * a, 'root.z': dz * a, 'torso.roll': -0.05 * side, 'hips.dy': -1, 'leg.R.pitch': 0 }); k(t + 1.4, { 'root.x': (I.params || {}).stay ? dx * a : 0, 'root.z': (I.params || {}).stay ? dz * a : 0, 'torso.roll': 0, 'hips.dy': 0 }); }, { label: 'out of the line of ' + Score.short(I.target) }); };
/* CATCH: the attacking arm caught at the wrist and held (a GRIP on it), the catcher's weight set against it */
E_.CATCH = (X, I, e) => { const p = I.params || {}; X.move(I.actor, 'react', 'SET', e, k => { k(I.t0 - 0.2, { 'hips.dy': rel(X), 'torso.lean': rel(X) }); k(I.t0 + 0.1, { 'hips.dy': -2, 'torso.lean': -0.1 }, 'out'); k(I.t1 + 0.3, { 'hips.dy': 0, 'torso.lean': 0 }); }, { label: 'the weight set against the arm' });
  return E_.GRIP(X, { ...I, t0: I.t0 - 0.2, params: { point: 'wrist', side: p.side || 'L', targetSide: p.attackSide || 'R', reach: 0.2, answer: p.answer || 'struggle' } }, e); };
E_.ATTACK = (X, I, e) => { const k = ((I.params || {}).kind || 'swing').toUpperCase(); return (k === 'SWING' ? M_.SWING : E_[k] || M_.SWING)(X, I, e); };
E_.DEFEND = (X, I, e) => { const k = ((I.params || {}).kind || 'block').toUpperCase(); return (k === 'BLOCK' ? M_.BLOCK : k === 'DUCK' ? A_.DUCK : E_[k] || M_.BLOCK)(X, I, e); };

/* ═════ ways of going ═════ */
E_.LOCOMOTE = (X, I, e) => { const p = I.params || {}; if (!p.path) { X.notes.push('LOCOMOTE ' + I.actor + ': no path'); return null; } return I_._walkPath(X, I.actor, I.t0, p.path, p.speed || 1.0, e, { label: I.label || 'goes', freeArm: p.freeArm }); };
E_.LEAVE = (X, I, e) => { const p = I.params || {}, to = p.to || (X.exits()[0] || null), pt = to ? X.where(to, I.t0) : null; if (!pt) { X.notes.push('LEAVE ' + I.actor + ': nowhere to go'); return null; }
  return I_._walkPath(X, I.actor, I.t0, [[pt[0], pt[2]]], p.speed || 1.1, e, { label: I.label || 'away', freeArm: 'L', turnLabel: 'turns to go' }); };
E_.CIRCLE = (X, I, e) => { const id = I.actor, p = I.params || {}, s = X.at(id, I.t0), c = X.where(I.target, I.t0); if (!s || !c) return null; const R = (p.radius || 1.2) * X.H(id), a0 = Math.atan2(s.p[0] - c[0], s.p[2] - c[2]), turn = p.turn || Math.PI * 0.75, n = 8, path = [];
  for (let i = 1; i <= n; i++) { const a = a0 + turn * i / n; path.push([c[0] + Math.sin(a) * R, c[2] + Math.cos(a) * R]); }
  const r = I_._walkPath(X, id, I.t0, path, p.speed || 0.8, e, { label: I.label || 'circles ' + Score.short(I.target), freeArm: 'L' }); if (r) X.track(id, I.target, r.tw, r.end, e, { every: 0.5 }); return r; };
E_.RIDE = (X, I, e) => { const id = I.actor, p = I.params || {}, P = p.period || 0.8, R = X.rng(I.id); let t = I.t0;
  return X.move(id, 'act', 'RIDE', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'torso.lean': rel(X), 'torso.roll': rel(X), 'head.pitch': rel(X) }); k(t + 0.4, { 'arm.R.pitch': { abs: -0.9 }, 'arm.L.pitch': { abs: -0.9 }, 'torso.lean': 0.2 });
    for (let j = 0; t < I.t1 - P * 0.5; j++) { t += P * (0.9 + 0.2 * R()); k(t, { 'torso.roll': (j % 2 ? 0.06 : -0.06), 'torso.lean': 0.18 + (j % 2 ? 0.04 : 0), 'head.pitch': j % 2 ? 0.05 : -0.02 }, 'inOut'); }
    k(I.t1 + 0.5, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0, 'torso.roll': 0, 'head.pitch': 0 }); }, { label: I.label || 'rides ' + (I.target ? Score.short(I.target) : 'it') }); };
E_.CLIMB = (X, I, e) => { const id = I.actor, p = I.params || {}, P = p.period || 0.9, rise = p.rise != null ? p.rise : 0.8 * X.H(id), n = Math.max(1, Math.floor((I.t1 - I.t0) / P)); let t = I.t0;
  return X.move(id, 'act', 'CLIMB', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'leg.R.pitch': rel(X), 'leg.L.pitch': rel(X), 'root.y': rel(X), 'torso.lean': rel(X) });
    for (let j = 0; j < n; j++) { const u = j % 2 ? 1 : -1; t += P; k(t - P * 0.5, { 'arm.R.pitch': { abs: u > 0 ? -2.9 : -2.2 }, 'arm.L.pitch': { abs: u > 0 ? -2.2 : -2.9 }, 'leg.R.pitch': u > 0 ? -0.9 : -0.2, 'leg.L.pitch': u > 0 ? -0.2 : -0.9, 'torso.lean': 0.12 }); k(t, { 'root.y': rise * (j + 1) / n }, 'out'); }
    if (!p.stay) k(I.t1 + 0.5, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'leg.R.pitch': 0, 'leg.L.pitch': 0, 'torso.lean': 0 }); }, { label: I.label || 'climbs', rigid: true }); };
E_.SWIM = (X, I, e) => { const id = I.actor, p = I.params || {}, P = p.period || 1.3; let t = I.t0;
  return X.move(id, 'act', 'SWIM', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'torso.lean': rel(X), 'head.yaw': rel(X), 'leg.R.pitch': rel(X), 'leg.L.pitch': rel(X) }); k(t + 0.3, { 'torso.lean': 0.38 });
    for (let j = 0; t < I.t1 - P * 0.5; j++) { const u = j % 2 ? 1 : -1; t += P / 2; k(t, { 'arm.R.pitch': { abs: u > 0 ? -3.0 : -0.3 }, 'arm.L.pitch': { abs: u > 0 ? -0.3 : -3.0 }, 'head.yaw': j % 4 === 1 ? 0.6 : 0, 'leg.R.pitch': 0.25 * u, 'leg.L.pitch': -0.25 * u }, 'linear'); }
    k(I.t1 + 0.5, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0, 'head.yaw': 0, 'leg.R.pitch': 0, 'leg.L.pitch': 0 }); }, { label: I.label || 'swims' }); };
E_.DROWN = (X, I, e) => { const id = I.actor, p = I.params || {}, sink = p.sink != null ? p.sink : 0.7 * X.H(id);
  M_.STRUGGLE(X, { ...I, label: 'fights the water' }, e);
  const m = X.move(id, 'mech', 'GOES DOWN', e, k => { k(I.t0, { 'root.y': rel(X), 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X) }); k(I.t0 + (I.t1 - I.t0) * 0.5, { 'root.y': -sink * 0.3, 'arm.R.pitch': { abs: -2.8 }, 'arm.L.pitch': { abs: -2.6 } }); k(I.t1, { 'root.y': -sink, 'arm.R.pitch': { abs: -3.0 }, 'arm.L.pitch': { abs: -2.9 } }, 'in'); }, { label: 'the sea takes him', rigid: true });
  (X.dead = X.dead || []).push({ actor: id, t0: I.t1 }); return m; };
E_.WEAVE = (X, I, e) => { const id = I.actor, p = I.params || {}, P = p.period || 1.6; let t = I.t0, j = 0;
  if (p.at) X.look(id, p.at, t - 0.2, e, { label: 'the web', noFeet: true });
  X.move(id, 'act', 'WEAVE', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'arm.R.out': rel(X), 'arm.L.out': rel(X), 'torso.twist': rel(X), 'head.yaw': rel(X), 'torso.lean': rel(X) });
    for (; t < I.t1 - P * 0.5; j++) { const u = j % 2 ? 1 : -1; t += P / 2; k(t - P * 0.2, { 'arm.R.pitch': { abs: -1.3 }, 'arm.L.pitch': { abs: -1.3 }, 'arm.R.out': u > 0 ? 0.45 : -0.05, 'arm.L.out': u > 0 ? -0.05 : 0.45, 'torso.twist': 0.12 * u, 'head.yaw': 0.18 * u, 'torso.lean': 0.08 });
      k(t, { 'arm.R.pitch': { abs: -1.0 }, 'arm.L.pitch': { abs: -1.0 }, 'torso.lean': -0.02 }, 'back'); }   /* the pass, then the beater pulled home */
    k(I.t1 + 0.5, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'arm.R.out': 0, 'arm.L.out': 0, 'torso.twist': 0, 'head.yaw': 0, 'torso.lean': 0 }); }, { label: I.label || 'at the loom', params: { passes: j } });
  for (let i = 0, tt = I.t0 + P / 2; tt < I.t1 - P * 0.5; tt += P / 2, i++) X.ev({ lane: 'CONTACT', actor: id, actors: [id], t0: X.r3(tt - 0.05), t1: X.r3(tt + 0.1), kind: 'TOOL', label: 'the beater home (pass ' + (i + 1) + ')', because: [{ id: e.id, latency: X.r3(tt - e.t0) }], params: { k: 1 } }); };
E_.MOVE_STONE = (X, I, e) => { const id = I.actor, t = I.t0, R = X.rng(I.id); if (I.target) X.look(id, I.target, t - 0.3, e, { label: 'the weight' });
  const m = X.move(id, 'act', 'PUSH', e, k => { k(t, { 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'torso.lean': rel(X), 'leg.R.pitch': rel(X), 'leg.L.pitch': rel(X), 'hips.dy': rel(X), 'head.pitch': rel(X) }); k(t + 0.5, { 'arm.R.pitch': { abs: -1.55 }, 'arm.L.pitch': { abs: -1.55 }, 'torso.lean': 0.36, 'leg.R.pitch': -0.5, 'leg.L.pitch': 0.55, 'hips.dy': -2.5, 'head.pitch': -0.1 });
    for (let tt = t + 0.9; tt < I.t1 - 0.4; tt += 0.5 + R() * 0.4) k(tt, { 'torso.lean': 0.3 + R() * 0.08, 'hips.dy': -2.2 - R(), 'head.pitch': -0.15 + R() * 0.1 });
    k(I.t1 + 0.6, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0, 'leg.R.pitch': 0, 'leg.L.pitch': 0, 'hips.dy': 0, 'head.pitch': 0 }); }, { label: I.label || 'the shoulder to ' + (I.target ? Score.short(I.target) : 'the stone') });
  if (I.target) X.ev({ lane: 'CONTACT', actor: id, actors: [id, I.target], t0: X.r3(t + 0.5), t1: X.r3(I.t1), kind: 'PUSH', label: 'hands on ' + Score.short(I.target), because: m ? [{ id: m.id, latency: 0.5 }] : [], params: { k: 4 } }); return m; };
E_.CARESS = (X, I, e) => { const id = I.actor, p = I.params || {}, sd = p.side || 'R', n = p.strokes || Math.max(2, Math.floor((I.t1 - I.t0) / 1.6)); if (I.target) X.look(id, I.target, I.t0 - 0.2, e, { label: 'on ' + Score.short(I.target), noFeet: true });
  const m = X.move(id, 'act', 'CARESS', e, k => { k(I.t0, { ['arm.' + sd + '.pitch']: rel(X), ['arm.' + sd + '.out']: rel(X), 'torso.lean': rel(X), 'head.pitch': rel(X) }); k(I.t0 + 0.5, { ['arm.' + sd + '.pitch']: { abs: -1.0 }, 'torso.lean': 0.12, 'head.pitch': 0.08 });
    const d = (I.t1 - I.t0 - 0.8) / n; for (let j = 0; j < n; j++) { const t = I.t0 + 0.6 + j * d; k(t + d * 0.6, { ['arm.' + sd + '.pitch']: { abs: -0.7 }, ['arm.' + sd + '.out']: 0.12 }, 'inOut'); k(t + d, { ['arm.' + sd + '.pitch']: { abs: -1.0 }, ['arm.' + sd + '.out']: 0.02 }); }
    k(I.t1 + 0.5, { ['arm.' + sd + '.pitch']: 0, ['arm.' + sd + '.out']: 0, 'torso.lean': 0, 'head.pitch': 0 }); }, { label: I.label || 'strokes ' + (I.target ? Score.short(I.target) : '') });
  if (I.target) X.ev({ lane: 'CONTACT', actor: id, actors: [id, I.target], t0: X.r3(I.t0 + 0.5), t1: X.r3(I.t1), kind: 'TOUCH', label: 'the hand along ' + Score.short(I.target), because: m ? [{ id: m.id, latency: 0.5 }] : [], params: { k: 1 } }); return m; };
E_.WAKE = (X, I, e) => { const id = I.actor, t = I.t0, s = X.at(id, t);
  const m = X.move(id, 'act', 'WAKE', e, k => { k(t, { 'head.pitch': rel(X), 'head.yaw': rel(X), 'torso.lean': rel(X), 'arm.R.pitch': rel(X) }); k(t + 0.6, { 'head.pitch': -0.12 }); k(t + 1.2, { 'head.yaw': 0.4, 'head.pitch': -0.05 }); k(t + 2.0, { 'head.yaw': -0.3, 'arm.R.pitch': -0.3 }); k(t + 2.8, { 'head.yaw': 0, 'head.pitch': 0, 'arm.R.pitch': 0, 'torso.lean': 0 }); }, { label: I.label || 'wakes' });
  if ((I.params || {}).rise && s && (s.sat || X.B.lying(s))) I_.RISE(X, { ...I, t0: t + 1.6 }, e); return m; };
E_.DIE = (X, I, e) => { const r = A_.FALL(X, I, e); const K = X.M.keys.find(k => k.id === (I.params || {}).key), w = K && K.win ? K.win : [I.t0, I.t1]; (X.dead = X.dead || []).push({ actor: I.actor, t0: w[1] + 0.2 }); return r; };
/* ═════ the bow (OD-B21-S07): STRING_BOW and PLUCK ═════ */
/* STRING_BOW {params: bends (the pulses of the bend), side}: the lower horn braced against the left thigh, the left hand bearing the upper
   horn down, the right hand running the string's loop up to its notch; each bend a short push of the weight into it; a CONTACT BOW (the
   horn on the thigh) while it lasts and a STRUNG stimulus at its end */
E_.STRING_BOW = (X, I, e) => { const id = I.actor, p = I.params || {}, n = p.bends || 3, t0 = I.t0, t1 = I.t1, d = (t1 - t0 - 0.8) / n, a = X.ampOf(I);
  X.move(id, 'act', 'STRING THE BOW', e, k => { k(t0, { 'arm.L.pitch': rel(X), 'arm.R.pitch': rel(X), 'arm.R.out': rel(X), 'torso.lean': rel(X), 'torso.twist': rel(X), 'head.pitch': rel(X), 'leg.L.pitch': rel(X) });
    k(t0 + 0.5, { 'arm.L.pitch': { abs: -0.9 }, 'arm.R.pitch': { abs: -0.55 }, 'arm.R.out': -0.1, 'torso.lean': 0.12 * a, 'torso.twist': 0.12, 'head.pitch': 0.18, 'leg.L.pitch': -0.35 });
    for (let j = 0; j < n; j++) { const t = t0 + 0.6 + j * d, u = (j + 1) / n;
      k(t + d * 0.45, { 'arm.L.pitch': { abs: -0.7 }, 'torso.lean': 0.2 * a, 'arm.R.pitch': { abs: -0.6 - 0.55 * u } }, 'out');   /* the weight into the bend; the loop runs up */
      k(t + d * 0.9, { 'arm.L.pitch': { abs: -0.85 }, 'torso.lean': 0.13 * a }); }
    k(t1, { 'arm.L.pitch': { abs: -1.0 }, 'arm.R.pitch': { abs: -1.2 }, 'arm.R.out': 0.05, 'torso.lean': 0.03, 'torso.twist': 0.05, 'head.pitch': 0.08, 'leg.L.pitch': 0 }); }, { label: I.label || 'strings the bow, as a bard strings a lyre' });
  X.ev({ lane: 'CONTACT', actor: id, actors: [id], t0: t0 + 0.5, t1: t1, kind: 'BOW', label: 'the horn braced on the thigh, the string run up to its notch', because: [{ id: e.id, latency: 0.5 }], params: { k: 3 } });
  X.ev({ id: p.strungId || ('strung:' + id), lane: 'STIMULUS', t0: t1 - 0.1, t1: t1 + 0.2, kind: 'SIGHT', label: 'the bow strung, without effort', actor: id, because: [{ id: e.id, latency: X.r3(t1 - t0) }] }); };
/* PLUCK {params: soundId, side}: the string drawn a little and let go by one finger; the head tilted to it; a SOUND stimulus (the note) */
E_.PLUCK = (X, I, e) => { const id = I.actor, p = I.params || {}, t = I.t0, a = X.ampOf(I);
  X.move(id, 'act', 'PLUCK', e, k => { k(t - 0.3, { 'arm.R.pitch': rel(X), 'arm.R.out': rel(X), 'torso.roll': rel(X), 'head.pitch': rel(X) }); k(t, { 'arm.R.pitch': { abs: -1.3 }, 'arm.R.out': 0.12, 'torso.roll': 0.06, 'head.pitch': 0.12 }); k(t + 1 / X.F, { 'arm.R.out': 0.3 * a }, 'out');
    k(t + 0.6, { 'arm.R.out': 0.2, 'torso.roll': 0.09 }); k(I.t1, { 'arm.R.pitch': { abs: -1.2 }, 'arm.R.out': 0.05, 'torso.roll': 0, 'head.pitch': 0.05 }); }, { label: I.label || 'plucks the string' });
  X.ev({ id: p.soundId || ('pluck:' + id), lane: 'STIMULUS', t0: t + 0.05, t1: t + 1.2, kind: 'SOUND', label: 'the string sings like a swallow', actor: id, because: [{ id: e.id, latency: 0.05 }] }); };
/* FASTEN {params: strokes}: seated, the body bent to the feet, both hands at the ankle binding a sandal (short crossing strokes), the
   head bent to the work; one foot then the other (params.strokes each) */
E_.FASTEN = (X, I, e) => { const id = I.actor, p = I.params || {}, n = p.strokes || 3, t0 = I.t0, t1 = I.t1, half = (t1 - t0 - 0.8) / 2;
  X.move(id, 'act', 'FASTEN', e, k => { k(t0, { 'torso.lean': rel(X), 'head.pitch': rel(X), 'arm.R.pitch': rel(X), 'arm.L.pitch': rel(X), 'arm.R.out': rel(X), 'arm.L.out': rel(X) });
    k(t0 + 0.5, { 'torso.lean': 0.34, 'head.pitch': 0.2, 'arm.R.pitch': { abs: -0.55 }, 'arm.L.pitch': { abs: -0.5 }, 'arm.R.out': -0.05, 'arm.L.out': -0.05 }, 'out');
    for (let side = 0; side < 2; side++) for (let j = 0; j < n; j++) { const t = t0 + 0.6 + side * half + (j + 0.5) * half / n, u = j % 2 ? 1 : -1;
      k(t, { 'arm.R.out': (side ? 0.12 : -0.12) + 0.06 * u, 'arm.L.out': (side ? 0.1 : -0.1) - 0.06 * u, 'arm.R.pitch': { abs: -0.5 + 0.06 * u } }, 'linear'); }
    k(t1, { 'torso.lean': 0.3, 'arm.R.out': 0, 'arm.L.out': 0 }); k(t1 + 0.6, { 'torso.lean': 0, 'head.pitch': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }); }, { label: I.label || 'binds on the sandals' }); };
module.exports = E_;
