/* The Storm and the Raft (OD-B05-S05, Odyssey 5): Poseidon's storm, the raft rolled, the swim back, Ino's veil, the north wind.

   Over the first score's sea and raft (tools/perform/scenes/_auto.js): seventeen days Odysseus steers by the stars; Poseidon, coming
   back from the Ethiopians, sees him, gathers the clouds and stirs the sea with his trident; the four winds; a great wave rolls the raft
   and snaps the mast; he is thrown far off and held under, then swims and drags himself back aboard; Ino rises like a sea-bird, sits on
   the raft and gives him her veil: leave the raft and swim; he ties it on; Athena stills every wind but the north, and he swims.

   The timings are the needles' (tools/perform/machinery.js storm): Poseidon's anger crosses at the sight of him (the strike: the
   trident in the sea), the sea follows, the raft's integrity wears (its uniselector is his steering: with it held, X.frozen, the raft
   breaks up early and he does not regain it), the hero is thrown when the sea is over 0.7 and the raft is failing, and he is back
   aboard when his endurance passes 0.3 two seconds later. */
'use strict';
const Ho = require('../homeostat.js'), Ma = require('../machinery.js');
module.exports = function author(M, X) {
  const N = require('../../../odyssey/perform/needs.json').scenes['OD-B05-S05'], base = require('./_auto.js')(M, X, N), A = base.authored;
  const K = id => M.keys.find(k => k.id === id), T = M.total, q = t => Math.round(t * 12) / 12, frozen = !!X.frozen;
  const K2 = K('K2'), K3 = K('K3'), O = 'odysseus', P = 'poseidon', INO = 'ino-leucothea';
  const clip = gi => M.clips.find(c => c.gi === gi), cSee = clip(2), cRoll = clip(3), cSwept = clip(4), cIno = clip(5), cCalm = clip(6);
  const tSee = cSee ? cSee.at : 11.7, tRoll = cRoll ? cRoll.at : 21.7, tIno = cIno ? cIno.at : 32.8, tCalm = cCalm ? cCalm.at : 37.3;
  const spec = Ma.storm({ total: T, anger: t => (t < tSee - 0.4 ? -0.5 : 1.6), strikeWindow: [tSee - 0.1, K2.t + 2.4], thrownWindow: [K3.win ? K3.win[0] : tRoll - 1, tRoll + 1.8], calm: tCalm, seed: 'OD-B05-S05' });
  const run = Ho.couple(spec, { frozen }), c = run.events, tS = q(c.strike), tT = q(c.thrown || tRoll + 0.5), tR = c.regain ? q(c.regain) : null;
  A.intents = A.intents.filter(I => !(I.actor === O && /FALL|SWIM|STRAIN|CLIMB|ROPE|TAKE|REACT/.test(I.kind)) && I.actor !== P && I.actor !== INO);
  const stim = A.stimuli, I = o => (A.intents.push(o), o.id), S_ = o => (stim.push(o), o.id);
  const needle = (id, t, unit, label, because) => S_({ id, t0: q(t), t1: q(t) + 0.3, kind: 'NEEDLE', label: unit + ': ' + label, because: because || [], params: { unit } });
  for (const st of run.steps) S_({ id: 'sStep' + st.unit + Math.round(st.t * 12), t0: q(st.t), t1: q(st.t) + 0.2, kind: 'UNISELECTOR', label: st.unit + ' out of its limits past its dwell: its uniselector steps to position ' + st.position, because: [] });
  S_({ id: 'sSight', t0: q(tSee - 0.4), t1: q(tSee), kind: 'SIGHT', label: 'Poseidon sees the raft from the Solymi mountains', because: [{ id: 'sC0' }] });
  needle('sTrident', tS, 'GOD', 'over 0.75: the trident in the sea, the four winds', [{ id: 'sSight' }]);
  needle('sThrown', tT, 'HERO', 'the sea over 0.7, the raft failing: thrown far off' + (c.lateThrown ? ' (at the window\'s end)' : ''), [{ id: 'sTrident' }]);
  if (c.breakup) needle('sBreak', c.breakup, 'VESSEL', 'under -0.5: the raft breaks up', [{ id: 'sTrident' }]);
  if (tR) needle('sRegain', tR, 'HERO', 'over 0.3 again: he reaches the raft', [{ id: 'sThrown' }]);
  /* the voyage: the steering oar, the stars */
  I({ id: 'iSteer', actor: O, kind: 'STEER', t0: 0.6, t1: q(tS), label: 'the steering oar, the Pleiades, the Bear', params: {}, because: [{ id: 'sC0' }] });
  I({ id: 'iStars', actor: O, kind: 'ATTEND', t0: 3, t1: 8, target: [0, 400, -200], label: 'up to the stars: the Bear on his left hand', because: [{ id: 'sC0' }] });
  /* Poseidon: the sight, the anger, the trident */
  I({ id: 'iSee', actor: P, kind: 'NOTICE', t0: q(tSee - 0.3), t1: q(tSee + 1.4), target: O, label: 'sees him on the sea', params: { gazeHold: 1.2 }, because: [{ id: 'sSight' }] });
  I({ id: 'iTrident', actor: P, kind: 'GESTURE', t0: q(tS), t1: q(tS + 2.6), label: 'the trident stirs the sea', params: { shape: 'invoke', at: q(tS + 0.1), side: 'R', amp: 1.3, hold: 1.8 }, because: [{ id: 'sTrident' }] });
  /* the storm on the raft: braced, the roll, thrown, swimming, back aboard */
  I({ id: 'iBrace', actor: O, kind: 'STRAIN', t0: q(tS + 1), t1: q(tT - 0.2), label: 'braced on the raft, the knees giving', because: [{ id: 'sTrident' }] });
  I({ id: 'iWhy', actor: O, kind: 'GESTURE', t0: q(tS + 3), t1: q(tS + 5), label: 'three and four times blessed, the ones who died at Troy', params: { shape: 'invoke', at: q(tS + 3.3), side: 'R', hold: 1.0 }, because: [{ id: 'sTrident' }] });
  I({ id: 'iThrownO', actor: O, kind: 'RECOIL', t0: tT, t1: tT + 1.3, label: 'thrown far from the raft, the steering oar torn from his hands', params: { from: [0, 30, 0] }, because: [{ id: 'sThrown' }] });
  if (tR) { I({ id: 'iSwim1', actor: O, kind: 'SWIM', t0: tT + 1.3, t1: q(tR - 1.4), label: 'held under, the clothes dragging; up, spitting the brine', params: { period: 1.3 }, because: [{ id: 'iThrownO' }] });
    I({ id: 'iClimb', actor: O, kind: 'CLIMB', t0: q(tR - 1.4), t1: q(tR + 1.2), label: 'drags himself back aboard', params: { rise: 10, period: 0.8 }, because: [{ id: 'iSwim1' }] });
    I({ id: 'iCrouch', actor: O, kind: 'POSTURE', t0: q(tR + 1.3), t1: q(tIno), label: 'crouched in the middle of the raft, holding on', params: { to: 'crouch' }, because: [{ id: 'iClimb' }] }); }
  else { I({ id: 'iSwim1', actor: O, kind: 'SWIM', t0: tT + 1.3, t1: q(tIno - 0.3), label: 'no raft to reach', params: { period: 1.3 }, because: [{ id: 'iThrownO' }] });
    I({ id: 'iSink', actor: O, kind: 'DROWN', t0: q(tIno - 0.2), t1: q(tIno + 4), label: 'the raft gone: he goes under (the needles held)', params: {}, because: [{ id: 'iSwim1' }] }); }
  /* Ino: out of the sea like a gull, the veil given; he takes it and ties it on */
  if (tR) { I({ id: 'iIno', actor: INO, kind: 'ARRIVE', t0: q(tIno), t1: q(tIno + 1.2), label: 'rises from the sea like a gull, sits on the raft', params: { from: [0.6, -0.4], dur: 1.1 }, because: [{ id: 'sC4' }] });
    I({ id: 'iVeil', actor: INO, kind: 'GESTURE', t0: q(tIno + 1.3), t1: q(tIno + 2.8), label: 'the veil: tie it under your chest', params: { shape: 'offer', at: q(tIno + 1.5), side: 'R', hold: 0.9 }, because: [{ id: 'iIno' }] });
    I({ id: 'iTakeVeil', actor: O, kind: 'REACT', t0: q(tIno + 2.1), t1: q(tIno + 3.2), label: 'takes the veil', params: { how: 'lean', lookAt: INO }, because: [{ id: 'iVeil' }] });
    I({ id: 'iTie', actor: O, kind: 'ROPE', t0: q(tIno + 3.3), t1: q(tCalm - 0.2), label: 'ties it on', params: { how: 'bind' }, because: [{ id: 'iTakeVeil' }] });
    I({ id: 'iSwim2', actor: O, kind: 'SWIM', t0: q(tCalm + 2.6), t1: T, label: 'swims for the land on the north wind', params: { period: 1.4 }, because: [{ id: 'sC5' }] }); }
  for (const m of [].concat(A.machinery || [])) if (m.kind === 'SEA') { m.causes = (m.causes || []).filter(x => x.id !== 'sC1').concat([{ t: tS, id: 'sTrident' }]);
    for (const h of m.hulls || []) { h.impulses = [{ t: tT - 0.3, roll: 0.9, pitch: 0.12, label: 'the great wave rolls the raft', id: 'sTrident' }]; h.riders = [[O, 0, tT], ...(tR ? [[O, tR + 1.2, q(tCalm + 2.4)]] : [])]; }
    m.swimmers = [{ actor: O, t0: tT + 0.2, t1: tR ? tR : q(tIno + 4) }].concat(tR ? [{ actor: O, t0: q(tCalm + 2.6), t1: T }] : []); }
  const coupled = { frozen, units: run.units, hz: run.hz, x: run.x, drives: run.drives, W0: run.W0, W: run.W, steps: run.steps, events: c, model: 'tools/perform/machinery.js storm (Poseidon)' };
  const causal = { tau: 0.7, actions: {
    [O]: [{ a: 'steer by the stars', base: 1, f: { 'after:sTrident': -2 } }, { a: 'brace', base: -2, f: { 'after:sTrident': 2.6, 'after:sThrown': -3 } }, { a: 'swim', base: -3, f: { 'after:sThrown': 3.6, ...(tR ? { 'after:sRegain': -3.6 } : {}) } }, { a: 'hold the raft', base: -3, f: tR ? { 'after:sRegain': 3.4, 'after:sC5': -2 } : {} }, { a: 'take the veil', base: -3.5, f: { 'after:sC4': 3.6 } }],
    [P]: [{ a: 'pass by', base: 0.5, f: { 'after:sSight': -2 } }, { a: 'stir the sea', base: -2, f: { 'after:sSight': 3 } }] } };
  for (const [id, acts] of Object.entries((A.causal || {}).actions || {})) causal.actions[id] = (causal.actions[id] || []).concat(acts.filter(a => !(causal.actions[id] || []).some(b => b.a === a.a)));
  return { ...base, type: 'machinery', title: 'The Storm and the Raft' + (frozen ? ' (uniselectors held)' : ''), authored: { ...A, coupled, causal } };
};
