/* Athena Reveals Herself at Pylos (OD-B03-S05, Odyssey 3): the sun is down; Nestor will not hear of his guests sleeping on the ship.
   Mentor answers: go with him, Telemachus, and sleep in the king's house; I go back to the ship to hearten the crew, and at dawn on
   to the Cauconians. And with that, grey-eyed Athena flew away in the form of a sea-eagle, and all who saw it were amazed. The old
   king took Telemachus by the hand: no fear you will prove base, when the gods walk with you so young; that was Zeus's daughter
   herself. Be gracious, Queen: and I will sacrifice to you a yearling heifer, unbroken, her horns sheathed in gold.

   The change is not shown as a change: the take stops drawing Mentor at a key (K1a, `absent`) and a sea-eagle prop rises from where he
   stood (FLY, its wings up and level on alternate pairs of drawings by the smear mechanism), on a cut. As the poem tells it: she is
   there, and then she is a bird.

   The chain: the evening (SCENE) -> Mentor's refusal (DECLARE, to Nestor; "Telemachus" a WORD to the boy) -> she is gone (K1a) ->
   the eagle (FLY, a SIGHT) -> the two men's startle (REACT) and their eyes on the bird (HOLD, looking along its path) -> Nestor's
   understanding (DECIDE) -> he takes the boy's hand (K2, GRIP) and speaks (DECLARE) -> "be gracious" (a WORD) -> the prayer, the arms
   up (K2a, GESTURE invoke) -> the vow of the heifer (GESTURE point at the heifer in the court) -> the boy's look to the sky. */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win || [K(id).t, K(id).t + 0.6], T = M.total, q = t => Math.round(t * 12) / 12;
  const A = 'athena-as-mentor', N = 'nestor', TE = 'telemachus';
  const clips = M.clips.filter(c => c.kind !== 'SCENE_HEADER' && c.kind !== 'SPEAKER_CUE');
  const cA = clips.find(c => c.speaker === A) || clips[0], cN = clips.find(c => c.speaker === N) || clips[1];
  const VA = X.voiceOf(cA), VN = X.voiceOf(cN), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); };
  const tGone = q(K('K1a').t), P0 = [62, 95, 138], P1 = [72, 165, 160], P2 = [125, 255, 260], P3 = [300, 380, 520]   /* take 2: the eagle climbs first, straight up out of where he stood, then away over the sea */, HEIFER = [0, 30, -20];
  const D = 2.2, W2 = [W('K2')[0] + D, W('K2')[1] + D];   /* take 2: the move into K2 held by D seconds */
  stimuli.push({ id: 'sEve', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'evening at Pylos: Nestor will not have his guests sleep on the ship', because: [{ id: 'v' + cA.gi, rel: 'realises' }] });
  /* ── Mentor's refusal ── */
  I({ id: 'aSay', actor: A, kind: 'DECLARE', target: N, utterance: cA.gi, t0: q(cA.at - 0.2), t1: q(cA.at + cA.dur), label: 'go with him, Telemachus; I go back to the ship, and at dawn to the Cauconians', params: { shapes: ['open', 'point', 'dismiss', 'chest'], side: 'R', maxBeats: 3, amp: 0.8 }, because: [{ id: 'sEve' }, { id: 'v' + cA.gi, rel: 'realises' }] });
  const tTel = q(w(VA, 'telemachus', cA.at + 1.2));
  stimuli.push({ id: 'sTel', t0: tTel, t1: q(tTel + 0.4), kind: 'WORD', label: '"Telemachus": go with him', actor: A, because: [{ id: 'aSay' }] });
  I({ id: 'aTurn', actor: A, kind: 'ATTEND', target: TE, t0: q(tTel - 0.1), t1: q(tTel + 2.4), label: 'to the boy: go with him', params: { track: true }, because: [{ id: 'sTel' }] });
  H({ id: 'hN0', actor: N, t0: 0.3, t1: q(tGone + 0.25), reason: 'the old king hears his guest refuse his house', params: { look: [[A, 3.0], [TE, 1.0], [A, 3.0]], weight: true }, because: [{ id: 'sEve' }] });
  H({ id: 'hT0', actor: TE, t0: 0.3, t1: q(tGone + 0.3), reason: 'Mentor sends him on without him', params: { look: [[A, 2.6], [N, 1.2], [A, 2.4]], weight: true }, because: [{ id: 'sEve' }] });
  /* ── the eagle ── */
  I({ id: 'aEagle', actor: A, kind: 'FLY', t0: tGone, t1: q(tGone + 4.4), label: 'a sea-eagle rises from where Mentor stood and flies out over the sea',
    params: { prop: 'seaEagle', from: P0, legs: [{ dt: 1.2, to: P1, arc: 4 }, { dt: 1.4, to: P2, arc: 12 }, { dt: 1.8, to: P3, arc: 14 }], until: K('K2a').t,
      smear: { prop: 'seaEagleSmear', frames: [...Array(14).keys()].flatMap(n => [4 * n + 2, 4 * n + 3]), span: 2 } }, because: [{ id: 'aSay' }] });
  stimuli.push({ id: 'sEagle', t0: q(tGone + 0.1), t1: q(tGone + 0.6), kind: 'SIGHT', label: 'Mentor is not there: an eagle goes up where he stood', actor: A, because: [{ id: 'aEagle' }] });
  I({ id: 'nStart', actor: N, kind: 'REACT', t0: q(tGone + 0.3), t1: q(tGone + 1.4), label: 'the old man starts back', params: { how: 'startle', lookAt: P1 }, because: [{ id: 'sEagle', latency: 0.3 }] });
  I({ id: 'tStart', actor: TE, kind: 'REACT', t0: q(tGone + 0.25), t1: q(tGone + 1.3), label: 'the boy starts', params: { how: 'startle', lookAt: P1 }, because: [{ id: 'sEagle', latency: 0.25 }] });
  H({ id: 'hN1', actor: N, t0: q(tGone + 1.45), t1: q(W2[0] - 0.1), reason: 'he follows the bird out over the sea', params: { look: [[P2, 1.2], [P3, 2.0]], weight: true }, because: [{ id: 'nStart' }] });
  H({ id: 'hT1', actor: TE, t0: q(tGone + 1.35), t1: q(W2[1] + 0.6), reason: 'his eyes on the bird until it is gone', params: { look: [[P2, 1.2], [P3, 3.0]], weight: true, still: true }, because: [{ id: 'tStart' }] });
  /* take 2: the two men watch the bird go before the old king turns to the boy (their move into K2 held by D seconds) */
  [N, TE].forEach(x => I({ id: 'ret' + x.slice(0, 2), actor: x, kind: 'RETIME', t0: W('K2')[0], t1: W2[1], label: 'they stand and watch the bird out of sight first', params: { key: 'K2', delay: D }, because: [{ id: 'sEagle' }] }));
  /* ── Nestor ── */
  I({ id: 'nKnow', actor: N, kind: 'DECIDE', t0: q(tGone + 0.45), t1: q(Math.max(tGone + 0.6, W2[0])), label: 'he knows her: the daughter of Zeus', because: [{ id: 'sEagle' }, { id: 'v' + cN.gi, rel: 'realises' }] });
  I({ id: 'nTurn', actor: N, kind: 'APPROACH', key: 'K2', t0: W2[0], t1: W2[1], target: TE, label: 'turns to the boy and takes his hand', because: [{ id: 'nKnow' }] });
  I({ id: 'nHand', actor: N, kind: 'GRIP', target: TE, t0: q(W2[1] + 0.1), t1: q(cN.at + 13.0), label: 'the boy\'s hand in the old king\'s', params: { point: 'hand', side: 'R', targetSide: 'R' }, because: [{ id: 'nTurn' }] });
  I({ id: 'nSay', actor: N, kind: 'DECLARE', target: TE, utterance: cN.gi, t0: q(Math.max(cN.at - 0.2, W2[1] + 0.05)), t1: q(K('K2a').t - 1.0), label: 'no fear you will prove base, when the gods walk with you so young: that was Zeus\'s daughter', params: { shapes: ['open', 'chest', 'point'], side: 'L', maxBeats: 3, amp: 0.8 }, because: [{ id: 'nTurn' }, { id: 'v' + cN.gi, rel: 'realises' }] });
  const tZeus = q(w(VN, 'zeus', cN.at + 9.0));
  H({ id: 'tTurn', actor: TE, t0: q(W2[1] + 0.65), t1: q(W('K2a')[0] - 0.1), reason: 'the old king\'s hand on his: the goddess was with him all the way', params: { look: [[N, 2.6], [P3, 0.9], [N, 2.2], [HEIFER, 0.8], [N, 2.4]], weight: true }, because: [{ id: 'nTurn', latency: 0.6 }] });
  [q(tZeus + 0.3), q(cN.at + 13.5)].forEach((t, k) => I({ id: 'tNod' + k, actor: TE, kind: 'REACT', t0: t, t1: q(t + 0.9), label: 'he nods: he knows it now', params: { how: 'nod', lookAt: N }, because: [{ id: 'nSay' }] }));
  I({ id: 'tSky', actor: TE, kind: 'REACT', t0: q(tZeus + 1.4), t1: q(tZeus + 2.4), label: '"the daughter of Zeus": he looks up where the bird went', params: { how: 'turn', lookAt: P3 }, because: [{ id: 'nSay' }] });
  const tGrac = q(w(VN, 'gracious', K('K2a').t + 0.4));
  stimuli.push({ id: 'sPray', t0: q(W('K2a')[0] - 0.4), t1: q(W('K2a')[0]), kind: 'WORD', label: '"be gracious, mistress": he turns to the sky', actor: N, because: [{ id: 'nSay' }] });
  I({ id: 'nUp', actor: N, kind: 'APPROACH', key: 'K2a', t0: W('K2a')[0], t1: W('K2a')[1], target: P3, label: 'the arms up to the goddess', because: [{ id: 'sPray' }] });
  I({ id: 'nInvoke', actor: N, kind: 'GESTURE', target: P3, t0: q(tGrac - 0.3), t1: q(tGrac + 3.4), label: 'be gracious, mistress: grant fair fame', params: { shape: 'invoke', at: q(tGrac + 0.2), side: 'R', amp: 0.75, hold: 2.6 }, because: [{ id: 'sPray' }] });
  const tHeifer = q(w(VN, 'heifer', cN.at + cN.dur * 0.82));
  I({ id: 'nVow', actor: N, kind: 'GESTURE', target: HEIFER, t0: q(tHeifer - 0.4), t1: q(tHeifer + 1.4), label: 'a yearling heifer, her horns sheathed in gold', params: { shape: 'point', at: q(tHeifer), side: 'R', amp: 1.0, hold: 0.6 }, because: [{ id: 'nInvoke' }] });
  H({ id: 'hN2', actor: N, t0: q(tGrac + 3.45), t1: q(tHeifer - 0.45), reason: 'praying with his eyes on the sky she went into', params: { look: [[P3, 3.0], [TE, 0.8]], weight: true }, because: [{ id: 'nInvoke' }] });
  H({ id: 'hN3', actor: N, t0: q(tHeifer + 1.45), t1: T, reason: 'the vow made', params: { look: [[P3, 2.0], [TE, 1.6]], weight: true }, because: [{ id: 'nVow' }] });
  I({ id: 'tLook', actor: TE, kind: 'APPROACH', key: 'K2a', t0: W('K2a')[0], t1: W('K2a')[1], target: P3, label: 'the boy looks where she went', because: [{ id: 'sPray', latency: 0.4 }] });
  H({ id: 'hT2', actor: TE, t0: q(W('K2a')[1] + 0.05), t1: T, reason: 'the goddess walked beside him as Mentor', params: { look: [[P3, 3.0], [N, 1.4], [P3, 2.0]], weight: true }, because: [{ id: 'tLook' }] });
  return {
    type: 'revelation', title: 'Athena Reveals Herself at Pylos: the refusal, the eagle, the old king\'s hand, the prayer',
    actors: { [A]: { role: 'Athena as Mentor', body: 'minifig', principal: true }, [N]: { role: 'Nestor', body: 'minifig', principal: true, affect: { weight: 0.7 } },
      [TE]: { role: 'Telemachus', body: 'minifig', principal: true } },
    objects: { seaEagle: { kind: 'bird', material: 'feather', affords: ['fly'] }, heifer: { kind: 'altar', material: 'stone', at: HEIFER, affords: ['sacrifice'] } },
    authored: { intents, holds, stimuli, goals: { [A]: 'send the boy on with the king, and go', [N]: 'honour his guests, then the goddess', [TE]: 'learn of his father' },
      causal: { tau: 0.7, actions: {
        [N]: [{ a: 'press his house on them', base: 1.0, f: { 'after:sEagle': -3.0 } }, { a: 'stare after the bird', base: -2.0, f: { 'after:sEagle': 4.0, 'after:nKnow': -3.0 } }, { a: 'pray', base: -2.5, f: { 'after:nKnow': 3.5 } }],
        [TE]: [{ a: 'listen to Mentor', base: 1.0, f: { 'after:sEagle': -3.0 } }, { a: 'stare after the bird', base: -2.0, f: { 'after:sEagle': 4.0 } }] } },
      camera: { follow: true },
    },
  };
};
