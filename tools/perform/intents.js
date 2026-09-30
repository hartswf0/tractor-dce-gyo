/* tools/perform/intents.js — the performance intents: what each kind of intent does with a body, given its parameters.

   Each realiser (X, I, e) reads the intent I {id, actor, kind, t0, t1, target, params, utterance?} and writes moves through the
   compiler's context X (X.move / X.look / X.track: keys on the sheet, each recorded as an ACTION with its body lanes, caused by e,
   the intent's own event). Parameters are named and documented where they are read; the compiler's global parameters (X.θ: latency,
   amp, separation, pause, ...) scale them, and an actor's affect (X.aff(id): fear, weight, suspicion, cunning) bends them. An intent
   tied to an utterance (I.utterance = a clip's gi) reads its phrases, stresses and words: PRE (before the voice), ON STRESS, AFTER,
   TRANSITION, as a director breaks a line down. */
'use strict';
const Score = require('./score.js');
const I_ = {};
const holdsSide = (X, id) => { const h = (X.M.held || {})[id] || {}; return h.R > 0 && !(h.L > 0) ? 'L' : 'R'; };

/* ═════ attention ═════ */
/* ATTEND: the head (and torso) to a target and kept there; params.track: re-aim as it moves */
I_.ATTEND = (X, I, e) => { X.look(I.actor, I.target, I.t0, e, { label: I.label }); if (I.params && I.params.track) X.track(I.actor, I.target, I.t0 + 0.5, I.t1, e); };
/* NOTICE: the double take. A glance that passes it, a beat, the snap back (overshoot), the gaze held (params.gazeHold s); the torso
   gives a little (surprise), the breath caught (hips up) */
I_.NOTICE = (X, I, e) => {
  const id = I.actor, t = I.t0, s = X.at(id, t); if (!s) return; const p = I.params || {}, a = X.ampOf(I), f = X.aff(id).fear;
  const tp = X.where(I.target, t); if (!tp) return; const rel = X.relBearing(s, tp), base = -(s.j.headP ? s.j.headP[1] : 0);
  const t_ = t; void t_;
  X.move(id, 'gaze', 'GLANCE', e, k => { k(t, { 'head.yaw': X.sheet.rel(0) }); k(t + 0.3, { 'head.yaw': X.cl(rel * 0.45 - base, -0.8, 0.8) }, 'out'); k(t + 0.55, { 'head.yaw': X.cl(rel * 0.3 - base, -0.7, 0.7) }); k(t + 0.72, { 'head.yaw': 0 }, 'in'); }, { label: 'passes over ' + Score.short(I.target) });
  const snap = X.look(id, I.target, t + 0.78, e, { label: 'the double take', speed: 0.6, kind: 'SNAP LOOK' });
  X.move(id, 'act', 'SURPRISE', snap || e, k => { k(t + 0.85, { 'torso.lean': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0) }); k(t + 1.0, { 'torso.lean': -0.07 * a * (1 + f), 'hips.dy': 1.2 * a }, 'out'); k(t + 1.0 + (p.gazeHold || 1.2), { 'torso.lean': -0.04 * a, 'hips.dy': 0.4 }, 'linear'); k(t + 1.5 + (p.gazeHold || 1.2), { 'torso.lean': 0, 'hips.dy': 0 }); }, { label: 'the breath caught' });
};
/* SHAME: the eyes drop from the one he should have seen, the head goes down, the body folds a little; held params.hold s */
I_.SHAME = (X, I, e) => { const id = I.actor, t = I.t0, p = I.params || {}, a = X.ampOf(I);
  if (p.lookAt) X.look(id, p.lookAt, t, e, { label: 'at what shames him' });
  X.move(id, 'act', 'HEAD DOWN', e, k => { k(t + 0.4, { 'head.pitch': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0) }); k(t + 0.9, { 'head.pitch': 0.17 * a, 'torso.lean': 0.07 * a }, 'inOut'); k(t + 0.9 + (p.hold || X.θ.pause * 1.4), { 'head.pitch': 0.12 * a, 'torso.lean': 0.05 * a }, 'linear'); k(I.t1, { 'head.pitch': 0, 'torso.lean': 0 }); }, { label: I.label || 'shame' }); };
/* DECIDE: the resolve before the move: a breath in, the head up, the weight gathered */
I_.DECIDE = (X, I, e) => { const id = I.actor, t = I.t0;
  X.move(id, 'act', 'GATHER', e, k => { k(t, { 'head.pitch': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0) }); k(t + 0.35, { 'head.pitch': -0.06, 'hips.dy': 1.0, 'torso.lean': -0.03 }, 'out'); k(Math.max(t + 0.7, I.t1), { 'head.pitch': 0, 'hips.dy': 0, 'torso.lean': 0 }); }, { label: I.label || 'resolves' }); };

/* ═════ HOLD(reason): an authored stillness. It is alive by what it attends to (params.look: [[target, seconds], ...] cycled), how the
   weight settles (params.weight), what the hand does with what it holds (params.grip: 'R'|'L'); params.still: a stillness that is
   the performance (the dead, the sleeping): nothing moves but the reason holds ═════ */
I_.HOLD = (X, I, e) => {
  const id = I.actor, p = I.params || {}; if (p.still) return;
  const R = X.rng(I.id + id), pause = X.θ.pause, fear = X.aff(id).fear;
  /* fear: the eyes go to the way out first, and come back to it */
  const looks = fear > 0.2 && X.exits().length ? [[X.exits()[0], 1.2]].concat(...(p.look || []).map(l => [l, [X.exits()[0], 0.8]])) : (p.look || []);
  if (looks.length) { let t = I.t0 + (p.offset || 0.2), k = 0;
    while (t < I.t1 - 0.4) { const [tg, dwell] = looks[k % looks.length]; const g = X.look(id, tg, t, e, { label: 'held: ' + (I.reason || ''), speed: 1.2, noFeet: true }); void g;
      t += (dwell || 2) * (0.7 + pause) * (0.85 + 0.3 * R()); k++; } }
  if (p.weight !== false) { let t = I.t0 + 0.8 + R() * 1.5, u = R() < 0.5 ? 1 : -1;
    while (t < I.t1 - 0.8) { const s = X.at(id, t); if (s && !s.sat && !X.B.lying(s) && !(s.moving && s.walk > 0.1)) {
        X.move(id, 'weight', 'WEIGHT SHIFT', e, k => { k(t, { 'root.roll': X.sheet.rel(0), 'torso.roll': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0) }); k(t + 0.45, { 'root.roll': 0.03 * u, 'torso.roll': -0.045 * u, 'hips.dy': -0.8 }, 'inOut'); k(t + 0.9, { 'hips.dy': 0.1 }, 'back'); k(t + 2.0, { 'root.roll': 0.022 * u, 'torso.roll': -0.03 * u, 'hips.dy': 0 }, 'linear'); }, { label: 'the weight moves (' + (I.reason || 'held') + ')' }); }
      u = -u; t += (2.6 + 2.2 * R()) * (0.6 + pause * 0.6); } }
  if (p.grip) { let t = I.t0 + 1.5 + R() * 2; const sd = p.grip;
    while (t < I.t1 - 0.8) { X.move(id, 'act', 'GRIP', e, k => { k(t, { ['hand.' + sd + '.roll']: X.sheet.rel(0), ['arm.' + sd + '.pitch']: X.sheet.rel(0) }); k(t + 0.35, { ['hand.' + sd + '.roll']: 0.25 * (R() < 0.5 ? 1 : -1), ['arm.' + sd + '.pitch']: -0.08 }, 'out'); k(t + 1.2, { ['hand.' + sd + '.roll']: 0, ['arm.' + sd + '.pitch']: 0 }); }, { label: 'the grip on what the hand holds' });
      t += 4 + 3 * R(); } }
};

/* ═════ the body in the room ═════ */
/* STEP: a step to or from a target (params.dist in figure heights, + toward, - away), weight first, the feet after */
I_.STEP = (X, I, e) => { const id = I.actor, t = I.t0, s = X.at(id, t); if (!s) return; const p = I.params || {}, tp = X.where(I.target, t); if (!tp) return;
  const d = Math.atan2(tp[0] - s.p[0], tp[2] - s.p[2]), L = (p.dist || 0.3) * X.H(id) * (p.dist > 0 ? 1 / X.θ.separation : X.θ.separation), dur = p.dur || 0.6;
  const sg = p.dist > 0 ? 1 : -1;
  X.move(id, 'loco', p.dist > 0 ? 'STEP IN' : 'STEP BACK', e, k => { k(t, { 'root.x': X.sheet.rel(0), 'root.z': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0), 'leg.R.pitch': X.sheet.rel(0), 'leg.L.pitch': X.sheet.rel(0) });
    k(t + dur * 0.4, { 'hips.dy': -1.0, 'leg.R.pitch': -0.35 * sg, 'leg.L.pitch': 0.2 * sg, 'root.x': X.sheet.rel(Math.sin(d) * L * 0.45), 'root.z': X.sheet.rel(Math.cos(d) * L * 0.45) }, 'in');
    k(t + dur * 0.75, { 'leg.R.pitch': -0.05 * sg, 'leg.L.pitch': -0.2 * sg }); k(t + dur, { 'root.x': X.sheet.rel(Math.sin(d) * L), 'root.z': X.sheet.rel(Math.cos(d) * L), 'hips.dy': 0, 'leg.R.pitch': 0, 'leg.L.pitch': 0 }, 'out'); }, { label: Score.short(I.target) }); };
/* SET_DOWN: the hand goes down to the table and comes back empty; what it held is set down (hidden) at the contact */
I_.SET_DOWN = (X, I, e) => { const id = I.actor, t = I.t0, sd = (I.params || {}).side || 'R';
  const a = X.move(id, 'act', 'SET DOWN', e, k => { k(t, { ['arm.' + sd + '.pitch']: X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), 'head.pitch': X.sheet.rel(0) }); k(t + 0.4, { ['arm.' + sd + '.pitch']: { abs: -0.75 }, 'torso.lean': 0.12, 'head.pitch': 0.1 }, 'inOut'); k(t + 0.75, { ['arm.' + sd + '.pitch']: { abs: -0.7 }, 'torso.lean': 0.1 }); k(t + 1.15, { ['arm.' + sd + '.pitch']: 0, 'torso.lean': 0, 'head.pitch': 0 }); }, { label: (I.params || {}).what || 'what he holds' });
  X.props.push({ t: X.r3(X.q(t + 0.62)), op: 'hide', what: id + ':' + sd });
  X.ev({ lane: 'PROP', actor: id, t0: t + 0.62, t1: t + 0.62, kind: 'SET DOWN', label: (I.params || {}).what || id + ':' + sd, because: [{ id: a.id, latency: 0.62 }] }); };
/* RISE: the rise the blocking gives (a seat to standing), anticipated: the weight forward, the hands push off */
I_.RISE = (X, I, e) => { const id = I.actor, t = I.t0;
  X.move(id, 'act', 'RISE', e, k => { k(t - 0.35, { 'torso.lean': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0) }); k(t + 0.05, { 'torso.lean': 0.22, 'arm.R.pitch': 0.3, 'arm.L.pitch': 0.3 }, 'out'); k(t + 0.5, { 'torso.lean': 0.05, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }); k(t + 0.9, { 'torso.lean': 0 }); }, { label: 'the weight forward, the hands push off' }); };

/* the walk the blocking gives, with the body in it: the hips drop on each contact, the lean into the step, the head a drawing late;
   the intent that owns the move points the head where it is going (its target), or the walk simply goes (the layout pass) */
I_._walkBlocking = (X, id, K, cause) => {
  const [w0, w1] = K.win; let prev = null; const pts = [];
  /* the walk takes the head, the torso and the feet back to the way it goes: whatever the gaze layer held is released */
  X.move(id, 'gaze', 'FACE THE WAY', cause, k => { k(w0, { 'root.h': X.sheet.rel(0), 'head.yaw': X.sheet.rel(0), 'torso.twist': X.sheet.rel(0) }); k(w0 + 0.35, { 'root.h': 0, 'head.yaw': 0, 'torso.twist': 0 }); }, { silent: true });
  for (let t = w0; t <= w1 + 1e-6; t += 1 / 24) { const s = X.at(id, t); if (!s || s.ph == null) continue; if (prev != null) { const a = Math.floor(prev / (Math.PI / 2)), b = Math.floor(s.ph / (Math.PI / 2)); if (b !== a) pts.push([t, b, s.walk]); } prev = s.ph; }
  X.move(id, 'loco', 'WALK', cause, k => { k(w0, { 'hips.dy': 0, 'torso.lean': 0, 'head.pitch': 0 });
    for (const [t, b, amt] of pts) { const contact = b % 2 === 1; k(t, { 'hips.dy': (contact ? -1.5 : 0.9) * amt, 'torso.lean': 0.06 * amt, 'torso.roll': (contact ? (b % 4 === 1 ? 0.045 : -0.045) : 0) * amt }, contact ? 'in' : 'out'); k(t + 1 / X.F, { 'head.pitch': (contact ? 0.035 : -0.02) * amt }); }
    k(w1 + 0.15, { 'hips.dy': -1.1, 'torso.lean': -0.03 }, 'out'); k(w1 + 0.5, { 'hips.dy': 0, 'torso.lean': 0, 'torso.roll': 0, 'head.pitch': 0 }); }, { label: 'to the ' + K.id + ' mark' });
  const tgt = cause && cause.target; if (tgt) X.track(id, tgt, w0 + 0.1, w1, cause, { every: 0.45 });
};

/* ═════ speech acts: the line broken down (PRE, ON STRESS, AFTER, TRANSITION) ═════
   WELCOME {target} params (the director's knobs):
     approach   the distance he stops at, in figure heights (x separation)       openness  0..1 how far the arm opens, the chest
     headLead   s the head acquires her before the voice                          weight    forward lean on the stress (rad)
     handToSpearDelay  s from "spear" to the hand going out                      gazeHold  s the gaze held on her after a gesture
     backBias   rad the weight held back (guarded)                                maxBeats  gestures per phrase at most
   GUARDED_WELCOME is WELCOME with the guard's defaults: closed, further, slower to the spear, the gaze held long, the weight back,
   the other hand kept at the belt, a look at her spear before he takes it. */
const WELCOME_P = { approach: 0.75, openness: 0.85, headLead: 0.3, weight: 0.08, handToSpearDelay: 0.35, gazeHold: 1.0, backBias: 0, maxBeats: 2, guard: false };
const GUARDED_P = { approach: 1.05, openness: 0.3, headLead: 0.12, weight: 0.02, handToSpearDelay: 0.9, gazeHold: 2.0, backBias: 0.06, maxBeats: 1, guard: true };
function speechAct(X, I, e, P) {
  const id = I.actor, U = X.utter[I.utterance], a = X.ampOf(I), f = X.aff(id).fear; if (!U) return;
  const p = Object.assign({}, P, I.params || {}), V = U.V, t0 = U.c.at, tgt = I.target, sd = p.side || 'R';
  /* fear bends it: the distance up, the weight back, the hand slower */
  p.approach *= 1 + 0.5 * f; p.backBias += 0.06 * f; p.handToSpearDelay += 0.4 * f; p.openness *= 1 - 0.5 * f;
  /* PRE: the head acquires the one addressed before the voice; the torso follows */
  const pre = X.look(id, tgt, t0 - p.headLead, e, { label: 'acquires ' + Score.short(tgt) + ' before speaking', speed: p.guard ? 1.3 : 0.8 });
  /* the approach: the last step to the distance of the welcome (or back from it) */
  const tS = Math.max(X.settled(id, t0 - 0.2), X.settled(tgt, t0 - 0.2)), s = X.at(id, tS), tp = X.where(tgt, tS);
  if (s && tp) { const d = Math.hypot(tp[0] - s.p[0], tp[2] - s.p[2]) / X.H(id), want = p.approach * X.θ.separation, step = X.cl(d - want, -0.45, 0.45);
    if (Math.abs(step) > 0.05) I_.STEP(X, { actor: id, t0: tS, target: tgt, params: { dist: step, dur: 0.55 } }, pre || e); }
  /* ON STRESS: the first stress of each phrase carries the act's gesture (the welcome: the arm opens, the weight goes to her);
     the words that are gestures of their own take theirs; at most maxBeats a phrase */
  const words = V.words, used = [];
  V.phrases.forEach((ph, i) => { const st = V.stresses.filter(x => x.t >= ph.t0 - 0.05 && x.t <= ph.t1 + 0.05).slice(0, Math.max(1, Math.round(p.maxBeats)));
    if (p.beatsOnlyKey && i > 0) st.length = 0;   /* less gesturing: only the line's first phrase carries a gesture; the rest is held */
    const wIn = words.filter(w => w.t >= ph.t0 - 0.05 && w.t <= ph.t1 + 0.05).map(w => w.w).join(' ');
    st.forEach((x, k) => { if (used.some(u => Math.abs(u - x.t) < 0.6)) return; if ((I.busy || []).some(([a0, a1]) => x.t > a0 && x.t < a1)) return; used.push(x.t);
      const big = k === 0 && i === 0, amp = a * (big ? 1 : 0.55) * p.openness;
      if (/spear|give/.test(wIn) || /come|away/.test(wIn)) return;   /* those phrases belong to the handoff and the lead */
      const ph1 = X.move(id, 'act', big ? (p.guard ? 'GUARDED OPEN' : 'OPEN ARM') : 'BEAT', e, kk => {
        kk(x.t - 0.3, { ['arm.' + sd + '.pitch']: X.sheet.rel(0), ['arm.' + sd + '.out']: X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), ['hand.' + sd + '.roll']: X.sheet.rel(0) });
        kk(x.t - 0.12, { ['arm.' + sd + '.pitch']: 0.12 * amp, 'torso.lean': -0.03 * amp }, 'out');   /* anticipation */
        kk(x.t + 0.14, { ['arm.' + sd + '.pitch']: -0.95 * amp, ['arm.' + sd + '.out']: 0.36 * amp, 'torso.lean': p.weight * amp - p.backBias }, 'out');
        kk(x.t + 0.3, { ['hand.' + sd + '.roll']: 0.5 * amp * (sd === 'L' ? -1 : 1) });
        kk(x.t + 0.14 + Math.max(0.35, p.gazeHold * 0.6 * X.θ.pause / 0.7), { ['arm.' + sd + '.pitch']: -0.78 * amp, ['arm.' + sd + '.out']: 0.28 * amp, 'torso.lean': p.weight * 0.6 * amp - p.backBias }, 'linear');
        kk(x.t + 0.6 + Math.max(0.35, p.gazeHold * 0.6 * X.θ.pause / 0.7), { ['arm.' + sd + '.pitch']: 0, ['arm.' + sd + '.out']: 0, ['hand.' + sd + '.roll']: 0, 'torso.lean': -p.backBias });
      }, { label: '"' + wIn.split(' ').slice(0, 4).join(' ') + '"', params: { stress: X.r3(x.t) } });
      if (big && p.guard) X.move(id, 'act', 'GUARD', ph1 || e, kk => { const o = sd === 'R' ? 'L' : 'R'; kk(x.t - 0.2, { ['arm.' + o + '.pitch']: X.sheet.rel(0), ['arm.' + o + '.out']: X.sheet.rel(0) }); kk(x.t + 0.3, { ['arm.' + o + '.pitch']: -0.45, ['arm.' + o + '.out']: -0.1 }); }, { label: 'the other hand to the belt' });
    });
    /* a nod into the phrase (the head with the voice) */
    X.move(id, 'react', 'NOD', e, kk => { kk(ph.t0 - 0.08, { 'head.pitch': X.sheet.rel(0) }); kk(ph.t0 + 0.12, { 'head.pitch': 0.05 * a }, 'out'); kk(ph.t0 + 0.4, { 'head.pitch': 0 }); }, { label: 'into phrase ' + (i + 1) });
  });
  /* AFTER: the gaze held on her (the guard holds it longer and lets it drop to the spear) */
  const tEnd = t0 + U.c.dur;
  if (p.guard && I.params && I.params.spear) X.look(id, I.params.spear, t0 + 1.6, e, { label: 'a look at her spear', noFeet: true });
  if (p.guard) X.look(id, tgt, t0 + 2.4, e, { label: 'back to her face: held', noFeet: true });
  void tEnd;
};
I_.WELCOME = (X, I, e) => speechAct(X, I, e, WELCOME_P);
I_.GUARDED_WELCOME = (X, I, e) => speechAct(X, I, e, GUARDED_P);
I_._WELCOME_P = WELCOME_P; I_._GUARDED_P = GUARDED_P;

/* ═════ the handoff: two bodies, gaze, proximity, arm trajectories, a synchronized grip, ownership that changes and stays changed ═════
   TAKE {actor (receiver), target (giver), params: {prop, from: 'giver:R', to: 'receiver:R', at (the grip instant), reach (s before)}}
   with OFFER on the giver (params.with = the TAKE's id). The grip instant is solved: both right hands are brought to the same point
   (a meeting point between their chests at the hands' height) by forward kinematics on the pose the sheet gives, the arms' pitch
   and roll, a lean and a small step; both hands hold the spear together for three drawings (CONTACT: GRIP SYNC), ownership moves at
   the grip (props give: persistent state at t, so scrubbing back gives it back), the giver's hand opens and returns, the receiver
   carries it. */
/* the grip instant: the word ("spear") + the speech act's handToSpearDelay (its kind's default unless its params say), + fear's delay */
function gripTime(X, T) { const p = T.params || {}; if (!p.word || !p.of) return p.at;
  const sp = (X.A.intents || []).find(x => x.id === p.of), U = sp && X.utter[sp.utterance]; if (!U) return p.at;
  const w = U.V.words.filter(x => x.w === p.word).pop(); if (!w) return p.at;
  const d = ((sp.params || {}).handToSpearDelay != null ? sp.params.handToSpearDelay : (sp.kind === 'GUARDED_WELCOME' ? GUARDED_P : WELCOME_P).handToSpearDelay) + 0.4 * X.aff(sp.actor).fear;
  return X.q(w.t + d); }
I_._gripTime = gripTime;
I_.OFFER = (X, I, e) => { const id = I.actor, p = I.params || {}, T = (X.A.intents || []).find(x => x.id === p.with), tg = T ? gripTime(X, T) : p.at, sd = (p.from || id + ':R').split(':')[1] || 'R';
  X.look(id, I.target, tg - 0.8, e, { label: 'to his hand', noFeet: true });
  X.move(id, 'act', 'OFFER', e, k => { k(tg - 0.8, { 'torso.lean': X.sheet.rel(0) }); k(tg - 0.4, { 'torso.lean': 0.05 }, 'inOut'); k(tg + 0.5, { 'torso.lean': 0.02 }); k(tg + 1.1, { 'torso.lean': 0 }); }, { label: 'the spear held out' }); void sd; };
I_.TAKE = (X, I, e) => {
  const rid = I.actor, gid = I.target, p = I.params || {}, tg = X.q(gripTime(X, I)), [, rs] = (p.to || rid + ':R').split(':'), [, gs] = (p.from || gid + ':R').split(':');
  const reach = p.reach || 0.55, hold = 3 / X.F;
  X.look(rid, p.prop && X.S.objects && X.S.objects[p.prop] ? p.prop : gid, tg - reach - 0.35, e, { label: 'to the spear', noFeet: true });
  X.after((X2, C0) => {
    const Body = require('./body.js'), bctx = Body.context(X.M, C0), ch = (who, s) => ['arm.' + s + '.pitch', 'arm.' + s + '.out', 'torso.lean', 'root.x', 'root.z'];
    const P0r = Body.sample(bctx, rid, tg), P0g = Body.sample(bctx, gid, tg); if (!P0r || !P0g) return;
    const hr = P0r.pts['hand' + rs], hg = P0g.pts['hand' + gs], cr = P0r.pts.chest, cg = P0g.pts.chest;
    /* the meeting point: between the chests, nearer the giver (she holds it out), at the hands' mean height */
    const M = [cr[0] * 0.45 + cg[0] * 0.55, (hr[1] + hg[1]) / 2 + 2, cr[2] * 0.45 + cg[2] * 0.55];
    function solve(who, s, P0) { let best = { d: 1e9, x: {} }; const pts = x => Body.sample(bctx, who, tg, x).pts['hand' + s];
      const dirTo = Math.atan2(M[0] - P0.p[0], M[2] - P0.p[2]), face = X.wrap(dirTo - P0.rot[1]);
      /* the body turned toward the meeting point (the right hand a little across: the shoulder is off the centre line) */
      for (const dh of [face, face + 0.2, face + 0.4, face - 0.2]) for (let ap = -2.2; ap <= 0.6; ap += 0.1) for (let ao = -0.2; ao <= 0.55; ao += 0.075) for (const ln of [0, 0.06, 0.12]) {
        const x = { 'root.h': dh, ['arm.' + s + '.pitch']: ap, ['arm.' + s + '.out']: ao, 'torso.lean': ln }, h = pts(x), d = Math.hypot(h[0] - M[0], h[1] - M[1], h[2] - M[2]); if (d < best.d) best = { d, x }; }
      /* a step if the arm cannot reach */
      /* a step toward it if the arm cannot reach: the shortest step that brings the hand within a unit */
      if (best.d > 1.0) { for (let st = 0.5; st <= 16; st += 0.5) { let got = false;
        for (const dh of [face - 0.3, face - 0.15, face, face + 0.15, face + 0.3, face + 0.45]) for (let ap = -2.2; ap <= 0.6; ap += 0.1) for (let ao = -0.2; ao <= 0.55; ao += 0.075) {
          const x = { 'root.h': dh, ['arm.' + s + '.pitch']: ap, ['arm.' + s + '.out']: ao, 'torso.lean': best.x['torso.lean'] || 0, 'root.x': Math.sin(dirTo) * st, 'root.z': Math.cos(dirTo) * st };
          const h = pts(x), d = Math.hypot(h[0] - M[0], h[1] - M[1], h[2] - M[2]) + st * 0.02; if (d < best.d) { best = { d, x }; got = true; } }
        if (best.d < 1.0 && !got) break; } best.d = (() => { const h = pts(best.x); return Math.hypot(h[0] - M[0], h[1] - M[1], h[2] - M[2]); })(); }
      return best; }
    const R = solve(rid, rs, P0r), G = solve(gid, gs, P0g);
    const gripEv = X.ev({ lane: 'CONTACT', actor: rid, actors: [rid, gid], t0: tg - hold, t1: tg + hold, kind: 'GRIP SYNC', label: 'both hands on ' + (p.prop || 'it') + ': ' + R.d.toFixed(1) + ' / ' + G.d.toFixed(1) + ' units from the meeting point', because: [{ id: e.id, latency: X.r3(tg - hold - e.t0) }], params: { meet: M.map(X.r3), residual: [X.r3(R.d), X.r3(G.d)] } });
    const offer = X.E.list.find(x => x.lane === 'INTENT' && x.kind === 'OFFER' && x.actor === gid);
    /* the arms to the meeting point, held together, released: on the @grip layer, over whatever the sheet already does */
    const write = (who, sol, s, giver) => X.move(who, 'grip', giver ? 'HOLD OUT' : 'REACH', giver ? (offer || e) : e, k => {
      const z = Object.fromEntries(Object.keys(sol.x).map(c => [c, 0]));
      const stp = Math.hypot(sol.x['root.x'] || 0, sol.x['root.z'] || 0), t0r = tg - reach - (giver ? 0.25 : 0);
      k(t0r, { ...z, 'leg.R.pitch': 0, 'leg.L.pitch': 0 });
      if (stp > 0.4) k((t0r + tg - hold) / 2, { 'root.x': (sol.x['root.x'] || 0) * 0.5, 'root.z': (sol.x['root.z'] || 0) * 0.5, 'leg.R.pitch': -0.3, 'leg.L.pitch': 0.15 });   /* the step in: a foot forward */
      k(tg - hold, { ...sol.x, 'leg.R.pitch': 0, 'leg.L.pitch': 0 }, 'out'); k(tg + hold, sol.x);
      if (giver) { k(tg + hold + 0.2, { ...sol.x, ['hand.' + s + '.roll']: 0.35 }); k(tg + hold + 0.9, { ...z, ['hand.' + s + '.roll']: 0 }); }
      else { const carry = { ...sol.x }; carry['arm.' + s + '.pitch'] = sol.x['arm.' + s + '.pitch'] * 0.35 + 0.35; carry['torso.lean'] = 0; k(tg + hold + 0.45, carry); k(tg + hold + 1.2, { ...carry, 'root.x': sol.x['root.x'] || 0, 'root.z': sol.x['root.z'] || 0 }); }
    }, { label: (giver ? 'holds the spear out to ' : 'reaches for the spear, meets ') + Score.short(giver ? rid : gid), params: { residual: X.r3(sol.d) } });
    write(rid, R, rs, false); write(gid, G, gs, true);
    X.props.push({ t: X.r3(tg), op: 'give', from: p.from || gid + ':' + gs, to: p.to || rid + ':' + rs });
    X.ev({ lane: 'PROP', actor: rid, t0: tg, t1: tg, kind: 'OWNERSHIP', label: (p.prop || 'it') + ': ' + Score.short(gid) + ' -> ' + Score.short(rid), because: [{ id: gripEv.id, latency: X.r3(hold) }], params: { from: p.from, to: p.to } });
    X.notes.push('handoff ' + (p.prop || '') + ' at ' + tg.toFixed(2) + ' s: receiver hand ' + R.d.toFixed(2) + ', giver hand ' + G.d.toFixed(2) + ' units from the meeting point');
  });
};

/* ═════ LEAD / FOLLOW: a walk the blocking does not give (root offsets over the last mark): the turn first (the feet), the walk
   cycle (legs, the counter-swing of a free arm, the hips' bob), the path through params.path (world x,z points), speed params.speed
   (figure heights a second); FOLLOW takes the leader's path params.lag seconds behind ═════ */
function walkPath(X, id, t0, pts, speed, cause, o = {}) {
  const s = X.at(id, t0); if (!s) return null; const H = X.H(id), v = speed * H, base = s.p, h0 = s.h;
  const P = [[base[0], base[2]], ...pts], seg = []; let tot = 0; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(d); tot += d; }
  const dir0 = Math.atan2(P[1][0] - P[0][0], P[1][1] - P[0][1]), turn = X.wrap(dir0 - h0), tTurn = 0.25 + Math.abs(turn) * 0.12, tw = t0 + tTurn, dur = tot / v;
  const posAt = u => { let d = u * tot; for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const w = seg[i] ? Math.min(1, d / seg[i]) : 1; return [P[i][0] + (P[i + 1][0] - P[i][0]) * w, P[i][1] + (P[i + 1][1] - P[i][1]) * w, Math.atan2(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1])]; } d -= seg[i]; } return [P[P.length - 1][0], P[P.length - 1][1], dir0]; };
  const free = o.freeArm || 'L', stride = 0.42 * H;
  const turnEv = X.move(id, 'loco', 'TURN', cause, k => { k(t0, { 'root.h': X.sheet.rel(0), 'torso.twist': X.sheet.rel(0) }); k(t0 + tTurn * 0.5, { 'torso.twist': X.cl(turn * 0.2, -0.3, 0.3) }, 'out'); k(tw, { 'root.h': turn, 'torso.twist': 0 }); }, { label: o.turnLabel || 'to the way out' });
  const walkEv = X.move(id, 'loco', 'WALK', turnEv || cause, k => {
    k(tw, { 'root.x': X.sheet.rel(0), 'root.z': X.sheet.rel(0), 'leg.R.pitch': X.sheet.rel(0), 'leg.L.pitch': X.sheet.rel(0), ['arm.' + free + '.pitch']: X.sheet.rel(0), 'hips.dy': X.sheet.rel(0) });
    for (let t = tw + 1 / X.F; t <= tw + dur + 1e-6; t += 1 / X.F) { const u = Math.min(1, (t - tw) / dur), [x, z, hd] = posAt(u * u * (3 - 2 * u) * 0.2 + u * 0.8), ph = (u * tot) / stride * Math.PI, amt = X.sm(Math.min(1, (t - tw) / 0.3)) * X.sm(Math.min(1, (tw + dur - t) / 0.3));
      k(t, { 'root.x': x - base[0], 'root.z': z - base[2], 'root.h': X.wrap(hd - h0), 'leg.R.pitch': 0.55 * amt * Math.sin(ph), 'leg.L.pitch': -0.55 * amt * Math.sin(ph), ['arm.' + free + '.pitch']: 0.35 * amt * Math.sin(ph) * (free === 'L' ? 1 : -1), 'hips.dy': -1.2 * amt * Math.abs(Math.sin(ph)) }, 'linear'); }
    k(tw + dur + 0.3, { 'leg.R.pitch': 0, 'leg.L.pitch': 0, ['arm.' + free + '.pitch']: 0, 'hips.dy': 0 });
  }, { label: o.label || 'through the gate' });
  return { walkEv, tw, dur, end: tw + dur };
}
I_.LEAD = (X, I, e) => { const p = I.params || {}; const r = walkPath(X, I.actor, I.t0, p.path, p.speed || 1.1, e, { freeArm: p.freeArm, label: p.label || 'leads the way' }); if (r) X.leadOf = Object.assign(X.leadOf || {}, { [I.id]: { ...r, path: p.path } }); };
I_.FOLLOW = (X, I, e) => { const p = I.params || {}, L = (X.leadOf || {})[p.leader], s = X.at(I.actor, I.t0);
  const lead = X.E.list.find(x => x.id === p.leader); if (lead && L) e.because.push({ id: L.walkEv.id, latency: X.r3(I.t0 - L.walkEv.t0), rel: 'follows' });
  X.look(I.actor, lead ? lead.actor : null, I.t0 - 0.35, e, { label: 'to the one she follows', noFeet: true });
  if (s) walkPath(X, I.actor, I.t0, p.path, p.speed || 1.1, e, { freeArm: p.freeArm || 'L', label: p.label || 'follows him in' }); };

/* ═════ business with a reason: a game, a cup, a jar ═════ */
/* GAMBLE params.throws: [t...] the dice thrown (each throw a STIMULUS the table answers); DRINK params.at; LAUGH (a reaction) */
I_.GAMBLE = (X, I, e) => { const id = I.actor, p = I.params || {}, sd = holdsSide(X, id) === 'L' ? 'L' : 'R';
  for (const t of p.throws || []) { const a = X.move(id, 'act', 'THROW DICE', e, k => { k(t - 0.5, { ['arm.' + sd + '.pitch']: X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), 'head.pitch': X.sheet.rel(0) }); k(t - 0.15, { ['arm.' + sd + '.pitch']: { abs: -1.25 }, 'torso.lean': 0.12, 'head.pitch': 0.08 }, 'inOut'); k(t + 0.1, { ['arm.' + sd + '.pitch']: { abs: -0.6 }, 'torso.lean': 0.2, 'head.pitch': 0.14 }, 'back'); k(t + 0.9, { ['arm.' + sd + '.pitch']: 0, 'torso.lean': 0.04, 'head.pitch': 0.06 }); k(t + 1.6, { 'torso.lean': 0, 'head.pitch': 0 }); }, { label: 'the dice strike the floor' });
    const k = (p.throws || []).indexOf(t), s = X.ev({ id: 'dice:' + id + ':' + k, lane: 'STIMULUS', actor: id, t0: t + 0.1, t1: t + 0.3, kind: 'SOUND', label: 'the dice land (' + Score.short(id) + ')', because: a ? [{ id: a.id, latency: 0.1 }] : [] }); void s; } };
I_.DRINK = (X, I, e) => { const id = I.actor, sd = (I.params || {}).side || 'R';
  for (const t of (I.params || {}).at || [I.t0]) X.move(id, 'act', 'DRINK', e, k => { k(t, { ['arm.' + sd + '.pitch']: X.sheet.rel(0), 'head.pitch': X.sheet.rel(0) }); k(t + 0.5, { ['arm.' + sd + '.pitch']: { abs: -2.0 }, 'head.pitch': -0.12 }); k(t + 1.0, { ['arm.' + sd + '.pitch']: { abs: -2.2 }, 'head.pitch': -0.18 }, 'linear'); k(t + 1.5, { ['arm.' + sd + '.pitch']: { abs: -0.5 }, 'head.pitch': 0.02 }); k(t + 1.9, { ['arm.' + sd + '.pitch']: 0, 'head.pitch': 0 }); }, { label: 'the cup' }); };
/* REACT params.to: a stimulus id (or ids); params.how: laugh | lean | nod | flinch | startle | turn; latency X.θ.latency scaled */
I_.REACT = (X, I, e) => { const id = I.actor, p = I.params || {}, a = X.ampOf(I), how = p.how || 'nod';
  const t = I.t0; const dl = X.cl(X.θ.latency * (p.latencyScale || 1) * (1 + 0.6 * X.aff(id).fear), 0.04, 1.5), tt = t + dl;
  const lbl = p.label || how;
  if (p.lookAt) X.look(id, p.lookAt, tt - 0.05, e, { label: 'to ' + Score.short(p.lookAt), noFeet: !p.feet });
  X.move(id, 'react', how.toUpperCase(), e, k => {
    if (how === 'laugh') { k(tt, { 'torso.lean': X.sheet.rel(0), 'head.pitch': X.sheet.rel(0) }); k(tt + 0.22, { 'torso.lean': -0.15 * a, 'head.pitch': -0.14 * a }, 'out'); for (let j = 0; j < 3; j++) { k(tt + 0.36 + j * 0.24, { 'torso.lean': -0.06 * a }); k(tt + 0.48 + j * 0.24, { 'torso.lean': -0.13 * a }); } k(tt + 1.3, { 'torso.lean': 0.08 * a, 'head.pitch': 0.05 }); k(tt + 1.8, { 'torso.lean': 0, 'head.pitch': 0 }); }
    else if (how === 'lean') { k(tt, { 'torso.lean': X.sheet.rel(0) }); k(tt + 0.4, { 'torso.lean': 0.1 * a }); k(tt + 0.4 + X.θ.pause * 1.5, { 'torso.lean': 0.07 * a }, 'linear'); k(tt + 0.9 + X.θ.pause * 1.5, { 'torso.lean': 0 }); }
    else if (how === 'flinch' || how === 'startle') { const f = how === 'startle' ? 1.4 : 1; k(tt, { 'torso.lean': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0), 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0) }); k(tt + 2 / X.F, { 'torso.lean': -0.1 * a * f, 'hips.dy': 1.0 * f, 'arm.R.pitch': -0.35 * a * f, 'arm.L.pitch': -0.3 * a * f }, 'out'); k(tt + 1.0, { 'torso.lean': -0.04 * a, 'hips.dy': 0, 'arm.R.pitch': -0.1, 'arm.L.pitch': -0.1 }, 'linear'); k(tt + 1.6, { 'torso.lean': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }); }
    else if (how === 'turn') { k(tt, { 'hips.dy': X.sheet.rel(0) }); k(tt + 0.3, { 'hips.dy': 0.6 }); k(tt + 0.8, { 'hips.dy': 0 }); }
    else { k(tt - 1 / X.F, { 'head.pitch': X.sheet.rel(0) }); k(tt + 2 / X.F, { 'head.pitch': 0.1 * a }, 'out'); k(tt + 5 / X.F, { 'head.pitch': 0 }); }
  }, { label: lbl, lane: 'ACTION' });
};
/* POUR: the jar lifted, poured into a cup (params.cup: the one served), set back; the one served may answer */
I_.POUR = (X, I, e) => { const id = I.actor, p = I.params || {};
  for (const t of p.at || [I.t0]) { if (p.cupOf) X.look(id, p.cupOf, t - 0.2, e, { label: 'to the cup', noFeet: false });
    X.move(id, 'act', 'POUR', e, k => { k(t, { 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), 'hand.R.roll': X.sheet.rel(0) }); k(t + 0.5, { 'arm.R.pitch': { abs: -0.9 }, 'arm.L.pitch': { abs: -0.7 }, 'torso.lean': 0.14 }); k(t + 1.1, { 'arm.R.pitch': { abs: -1.25 }, 'arm.L.pitch': { abs: -0.85 }, 'torso.lean': 0.08, 'hand.R.roll': 0.55 }); k(t + 1.7, { 'arm.R.pitch': { abs: -0.35 }, 'arm.L.pitch': { abs: -0.3 }, 'hand.R.roll': 0, 'torso.lean': 0.02 }); k(t + 2.2, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0 }); }, { label: p.cupOf ? 'wine for ' + Score.short(p.cupOf) : 'the wine' }); } };
/* GESTURE params.shape: open | point | chop | fist | chest | dismiss | plead | recoil, at params.at (s), side, amp, hold */
const SHAPES = { open: { p: -0.95, o: 0.32, lean: 0.05, hp: -0.05, hand: 0.5 }, point: { p: -1.5, o: 0.05, lean: 0.1, hp: -0.07, hand: 0, ease: 'back' }, chop: { p: -1.2, o: 0.08, lean: 0.08, hp: 0.05, hand: -0.2, ease: 'back', down: 0.5 },
  fist: { p: -0.8, o: 0.12, lean: 0.14, hp: 0.08, hand: 0, ease: 'back' }, chest: { p: -1.3, o: -0.04, lean: -0.02, hp: 0.06, hand: -0.4 }, dismiss: { p: -0.65, o: 0.5, lean: -0.06, hp: -0.1, hand: 0.7, ease: 'back' },
  plead: { both: true, p: -1.15, o: 0.08, lean: 0.12, hp: -0.12, hand: 0.7 }, recoil: { both: true, p: -1.4, o: 0.1, lean: -0.16, hp: -0.1, hand: 0.3, ease: 'out' } };
function gesture(X, id, shape, t, side, amp, hold, why, label) { const G = SHAPES[shape]; if (!G) return null; const sides = G.both ? ['R', 'L'] : [side], a = amp * X.θ.amp;
  return X.move(id, 'act', shape.toUpperCase(), why, k => {
    k(t - 0.3, Object.fromEntries(sides.flatMap(s => [['arm.' + s + '.pitch', X.sheet.rel(0)], ['arm.' + s + '.out', X.sheet.rel(0)], ['hand.' + s + '.roll', X.sheet.rel(0)]]).concat([['torso.lean', X.sheet.rel(0)], ['head.pitch', X.sheet.rel(0)]])));
    k(t - 0.14, Object.fromEntries(sides.map(s => ['arm.' + s + '.pitch', 0.15 * a]).concat([['torso.lean', -0.03 * a]])), 'out');
    k(t - 1 / X.F, { 'head.pitch': G.hp * a }, 'out');
    k(t + 0.18, Object.fromEntries(sides.flatMap(s => [['arm.' + s + '.pitch', G.p * a], ['arm.' + s + '.out', G.o * a]]).concat([['torso.lean', G.lean * a]])), G.ease || 'out');
    k(t + 0.32, Object.fromEntries(sides.map(s => ['hand.' + s + '.roll', G.hand * a * (s === 'L' ? -1 : 1)])));
    if (G.down) { k(t + 0.34, Object.fromEntries(sides.map(s => ['arm.' + s + '.pitch', G.p * a + G.down * a])), 'in'); }
    const th = t + 0.18 + Math.max(0.3, hold);
    k(th, Object.fromEntries(sides.flatMap(s => [['arm.' + s + '.pitch', G.p * a * 0.8 + (G.down ? G.down * a * 0.6 : 0)], ['arm.' + s + '.out', G.o * a * 0.75]]).concat([['torso.lean', G.lean * a * 0.7]])), 'linear');
    k(th + 0.5, Object.fromEntries(sides.flatMap(s => [['arm.' + s + '.pitch', 0], ['arm.' + s + '.out', 0], ['hand.' + s + '.roll', 0]]).concat([['torso.lean', 0], ['head.pitch', 0]])));
  }, { label: label || '' }); }
I_.GESTURE = (X, I, e) => { const p = I.params || {}; gesture(X, I.actor, p.shape || 'open', p.at != null ? p.at : I.t0, p.side || 'R', p.amp || 1, p.hold != null ? p.hold : X.θ.pause, e, p.label); };
I_._gesture = gesture; I_._walkPath = walkPath;

/* ARRIVE params.from [dx, dz]: comes in from that offset to the mark (a walk the blocking starts on), then plants what the hand holds */
I_.ARRIVE = (X, I, e) => { const id = I.actor, p = I.params || {}, s = X.at(id, I.t0); if (!s) return; const [dx, dz] = p.from || [0, 40], dur = p.dur || 1.8, H = X.H(id), stride = 0.42 * H, d = Math.hypot(dx, dz);
  const w = X.move(id, 'loco', 'WALK IN', e, k => { k(I.t0, { 'root.x': dx, 'root.z': dz, 'leg.R.pitch': 0, 'leg.L.pitch': 0, 'arm.L.pitch': 0, 'hips.dy': 0 }, 'step');
    for (let t = I.t0 + 1 / X.F; t <= I.t0 + dur + 1e-6; t += 1 / X.F) { const u = (t - I.t0) / dur, e2 = u * u * (3 - 2 * u) * 0.3 + u * 0.7, ph = e2 * d / stride * Math.PI, amt = X.sm(Math.min(1, u * 5)) * X.sm(Math.min(1, (1 - u) * 5));
      k(t, { 'root.x': dx * (1 - e2), 'root.z': dz * (1 - e2), 'leg.R.pitch': 0.55 * amt * Math.sin(ph), 'leg.L.pitch': -0.55 * amt * Math.sin(ph), 'arm.L.pitch': 0.35 * amt * Math.sin(ph), 'hips.dy': -1.2 * amt * Math.abs(Math.sin(ph)) }, 'linear'); }
    k(I.t0 + dur + 0.25, { 'leg.R.pitch': 0, 'leg.L.pitch': 0, 'arm.L.pitch': 0, 'hips.dy': 0 }); }, { label: 'up to the threshold' });
  const sd = p.side || 'R', tp = I.t0 + dur;
  X.move(id, 'act', 'PLANT', w || e, k => { k(tp - 0.2, { ['arm.' + sd + '.pitch']: X.sheet.rel(0), 'hips.dy': X.sheet.rel(0) }); k(tp + 0.15, { ['arm.' + sd + '.pitch']: -0.22, 'hips.dy': 0.6 }, 'out'); k(tp + 0.45, { ['arm.' + sd + '.pitch']: 0.04, 'hips.dy': -0.9 }, 'in'); k(tp + 0.9, { ['arm.' + sd + '.pitch']: 0, 'hips.dy': 0 }); }, { label: 'the spear planted upright' }); };
/* KNOCK: the butt of what the hand holds lifted and brought down on the stone: a sound the room can hear (params.stim: its id) */
I_.KNOCK = (X, I, e) => { const id = I.actor, sd = (I.params || {}).side || 'R', t = I.t0;
  const a = X.move(id, 'act', 'KNOCK', e, k => { k(t, { ['arm.' + sd + '.pitch']: X.sheet.rel(0), 'hips.dy': X.sheet.rel(0), 'head.pitch': X.sheet.rel(0) }); k(t + 0.22, { ['arm.' + sd + '.pitch']: -0.3, 'hips.dy': 0.8, 'head.pitch': -0.04 }, 'out'); k(t + 0.35, { ['arm.' + sd + '.pitch']: 0.06, 'hips.dy': -0.6 }, 'in'); k(t + 0.8, { ['arm.' + sd + '.pitch']: 0, 'hips.dy': 0, 'head.pitch': 0 }); }, { label: I.label || 'the spear on the stone' });
  X.ev({ id: (I.params || {}).stim || 'sKnock', lane: 'STIMULUS', actor: id, t0: t + 0.35, t1: t + 0.5, kind: 'SOUND', label: I.label || 'a knock', because: a ? [{ id: a.id, latency: 0.35 }] : [] }); };
/* APPROACH: the blocking's walk (a key window it owns) with the head on its target (tools/perform/compile.js step 4 writes the walk) */
I_.APPROACH = () => {};
/* LISTEN: the listener's head on the speaker, nods on params.nods (the stresses she answers) */
I_.LISTEN = (X, I, e) => { const id = I.actor, p = I.params || {}; X.look(id, I.target, I.t0 + X.θ.latency, e, { label: 'on the speaker', noFeet: true });
  for (const t of p.nods || []) I_.REACT(X, { actor: id, t0: t, params: { how: 'nod', label: 'nods' } }, e); };

module.exports = I_;
