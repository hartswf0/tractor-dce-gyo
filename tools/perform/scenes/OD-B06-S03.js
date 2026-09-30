/* Nausicaa (OD-B06-S03, Odyssey 6): the shipwrecked man comes out of the thicket with a branch over his nakedness; the maids scatter;
   the princess alone stands her ground; he pleads from a distance on purpose; she answers him as a princess and calls her maids back.

   He wakes in the thicket to the girls' voices and weighs it (a HOLD with its reason: clasp her knees, or speak from a distance?), the
   look going between her face and her knees. He breaks a branch (GESTURE: the arm across the body) and comes out like a mountain lion
   (the take's rise and walk to K5 brought forward by ADVANCE, so it is his decision's doing, with the RISE anticipated). The maids see
   him (a SIGHT) and scatter (their own moves to K5 brought forward, each a startle first: REACT). Nausicaa does not run: Athena puts
   courage in her (a HOLD with that reason, alive: the breath, the eyes on him). He keeps his distance (a STEP back, on purpose, and the
   hands open: GESTURE plead from where he stands). Her answer is carried on its stresses (DECLARE: the open hand, the chest, the
   gesture to her girls at "stand, girls"); the maids turn back to her at it (REACT turn), and he listens with his head bowed (LISTEN). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K5 = K('K5'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', N = 'nausicaa', maids = Object.keys(M.H).filter(i => /maid/.test(i));
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c7 = clip(7);
  const V1 = X.voiceOf(c1), V7 = X.voiceOf(c7), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tKnees = q(w(V1, 'knees', 5.15)), tOut = 2.9, tSeen = 3.6, tStand = q(w(V7, 'stand', 32.3)), tEnemy = q(w(V7, 'enemy', 36.4));
  /* ── the thicket ── */
  stimuli.push({ id: 'sGirls', t0: 0.05, t1: 0.5, kind: 'SOUND', label: 'girls\' voices at their ball game by the river: he wakes in the thicket', because: [] });
  holds.push({ id: 'hO0', actor: O, t0: 0.3, t1: tOut - 0.5, reason: 'naked and salt-caked: clasp her knees, or speak from a distance?', params: { look: [[N, 1.0], [[7, 20, 225], 0.7], [N, 0.8]], still: true }, because: [{ id: 'sGirls' }, { id: 'v' + c1.gi, rel: 'realises' }] });
  [N, ...maids].forEach((m, k) => holds.push({ id: 'hPlay' + k, actor: m, t0: 0.3, t1: tSeen + 0.1, reason: 'the ball game by the river, the washing drying', params: { look: [[[N, ...maids][(k + 1) % (maids.length + 1)], 1.2], [[60, 60, 260], 0.9], [[N, ...maids][(k + 2) % (maids.length + 1)], 1.0]], weight: true, offset: 0.2 * k }, because: [{ id: 'sGirls' }] }));
  I({ id: 'oBranch', actor: O, kind: 'GESTURE', t0: tOut - 0.5, t1: tOut + 0.4, label: 'breaks off a leafy branch to cover himself', params: { shape: 'chest', at: tOut - 0.2, side: 'L', amp: 0.8, hold: 2.0 }, because: [{ id: 'hO0' }] });
  I({ id: 'oRise', actor: O, kind: 'RISE', t0: tOut, t1: tOut + 1.0, label: 'up out of the thicket', because: [{ id: 'oBranch' }] });
  I({ id: 'oOut', actor: O, kind: 'ADVANCE', t0: tOut + 0.3, t1: tOut + 2.4, label: 'comes out like a mountain lion', params: { key: 'K5', arrive: q(tOut + 2.4) }, because: [{ id: 'oRise' }] });
  stimuli.push({ id: 'sWild', t0: tSeen, t1: tSeen + 0.3, kind: 'SIGHT', label: 'a wild man out of the bushes, crusted with brine', actor: O, because: [{ id: 'oOut' }] });
  /* ── the maids scatter; she stands ── */
  maids.forEach((m, k) => { const t = q(tSeen + 0.2 + 0.12 * k);
    I({ id: 'mStart' + k, actor: m, kind: 'REACT', t0: t, t1: t + 0.8, label: 'the wild man', params: { how: 'startle', lookAt: O }, because: [{ id: 'sWild' }] });
    I({ id: 'mRun' + k, actor: m, kind: 'ADVANCE', t0: t + 0.4, t1: t + 2.2, label: 'scatters along the shore', params: { key: 'K5', arrive: q(t + 2.2) }, because: [{ id: 'mStart' + k }] });
    holds.push({ id: 'hM' + k, actor: m, t0: q(t + 2.3), t1: tStand - 0.1, reason: 'at a distance, watching the stranger and the princess', params: { look: [[O, 1.6], [N, 1.4], [maids[(k + 1) % maids.length], 0.8]], weight: true, offset: 0.3 * k }, because: [{ id: 'mRun' + k }] }); });
  I({ id: 'nStart', actor: N, kind: 'REACT', t0: tSeen + 0.25, t1: tSeen + 1.0, label: 'the stranger', params: { how: 'lean', lookAt: O }, because: [{ id: 'sWild' }] });
  holds.push({ id: 'hN0', actor: N, t0: tSeen + 1.1, t1: c7.at + 3.8, reason: 'Athena puts courage in her: she stands her ground, the breath, the eyes on him', params: { look: [[O, 4.0]], weight: true }, because: [{ id: 'nStart' }] });
  /* ── he keeps his distance and pleads ── */
  I({ id: 'oKeep', actor: O, kind: 'STEP', target: N, t0: q(tKnees + 0.2), t1: q(tKnees + 0.8), label: 'a step back from her: he will not touch her knees', params: { dist: -0.2, dur: 0.6 }, because: [{ id: 'hN0' }] });
  I({ id: 'oPlead', actor: O, kind: 'GESTURE', target: N, t0: q(tKnees + 0.9), t1: K5.win[0] - 0.1, label: 'from where he stands: goddess or mortal?', params: { shape: 'plead', at: q(tKnees + 1.3), side: 'R', amp: 0.9, hold: 1.2 }, because: [{ id: 'oKeep' }] });
  /* ── her answer ── */
  I({ id: 'nAnswer', actor: N, kind: 'DECLARE', target: O, utterance: c7.gi, t0: c7.at + 3.6, t1: c7.at + c7.dur, label: 'you shall lack nothing: stand, girls, this man is no enemy', params: { shapes: ['open', 'open', 'chest', 'open', 'point', 'open'], side: 'R' }, because: [{ id: 'v' + c7.gi, rel: 'realises' }, { id: 'oPlead' }] });
  I({ id: 'oListen', actor: O, kind: 'LISTEN', target: N, t0: c7.at + 3.8, t1: c7.at + c7.dur, label: 'hears her, the head bowed', params: { nods: [q(w(V7, 'bear', 23.3) + 0.2), q(w(V7, 'suppliant', 31.7) + 0.3)] }, because: [{ id: 'nAnswer' }] });
  holds.push({ id: 'hO1', actor: O, t0: K5.win[1] + 0.2, t1: T, reason: 'the suppliant at his distance: his eyes on her while she speaks', params: { look: [[N, 3.0], [maids[0], 0.6], [N, 2.4]], weight: true }, because: [{ id: 'oPlead' }] });
  stimuli.push({ id: 'sStand', t0: tStand, t1: tStand + 0.3, kind: 'WORD', label: '"stand, girls"', actor: N, because: [{ id: 'nAnswer' }] });
  maids.forEach((m, k) => { I({ id: 'mTurn' + k, actor: m, kind: 'REACT', t0: q(tStand + 0.25 + 0.1 * k), t1: q(tStand + 1.2 + 0.1 * k), label: 'back to their princess', params: { how: 'turn', lookAt: N }, because: [{ id: 'sStand' }] });
    holds.push({ id: 'hM2' + k, actor: m, t0: q(tStand + 1.3 + 0.1 * k), t1: T, reason: 'no enemy, she says: they look at him again', params: { look: [[N, 1.4], [O, 2.0]], weight: true, offset: 0.25 * k }, because: [{ id: 'mTurn' + k }] }); });
  return {
    type: 'dialogue', title: 'Nausicaa: the branch, the distance, the answer',
    actors: { [O]: { role: 'the shipwrecked man', body: 'minifig', principal: true, affect: { cunning: 0.7, weight: 0.4 } }, [N]: { role: 'the princess', body: 'minifig', principal: true }, ...Object.fromEntries(maids.map(m => [m, { role: 'a maid', body: 'minifig', group: 'maids' }])) },
    objects: { thicket: { kind: 'bushes', material: 'plant', at: [-119, 20, 154], affords: ['hide'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'be helped without frightening her', [N]: 'act as a princess should', [maids[0]]: 'get away' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'stay hidden', base: 1.0, f: { 'after:sGirls': -0.8 } }, { a: 'clasp her knees', base: -2.0, f: { 'after:sWild': 1.4, ['near:' + N + ':1.5']: 1.0 } }, { a: 'speak from a distance', base: -1.8, f: { 'after:sWild': 2.4 } }, { a: 'listen', base: -2.2, f: { 'after:nAnswer': 3.4 } }],
        [N]: [{ a: 'run', base: -1.0, f: { 'after:sWild': 1.2 } }, { a: 'stand her ground', base: 0.2, f: { 'after:sWild': 2.0 } }, { a: 'answer him', base: -2.0, f: { 'after:oPlead': 3.0 } }, { a: 'call the maids', base: -2.8, f: { 'after:oPlead': 1.6, 'after:nAnswer': 1.4 } }],
        ...Object.fromEntries(maids.map(m => [m, [{ a: 'play', base: 1.0, f: { 'after:sWild': -3.0 } }, { a: 'run', base: -1.5, f: { 'after:sWild': 3.2, 'after:sStand': -2.5 } }, { a: 'come back', base: -2.5, f: { 'after:sStand': 3.4 } }]])),
      } },
      camera: { follow: true },
    },
  };
};
