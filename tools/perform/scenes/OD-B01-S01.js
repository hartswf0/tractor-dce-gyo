/* The Council of the Gods (OD-B01-S01, Odyssey 1): the gods take their places on Olympus; Poseidon's throne is empty; Athena rises and
   petitions her father for Odysseus; Zeus answers: Poseidon rages for his son, but let us shape the man's return.

   A council of seated gods and two long speeches: the ring must listen, and turn. The gods settle (their holds, the looks going round
   the ring); the empty throne is the most important object (a SIGHT stimulus at "empty": each god's look goes to it in turn, and comes
   back). Athena rises and comes to the centre (the take's walk at K3, owned here). She petitions, not commands (DECLARE with the plea,
   the open hands, the hand on her heart at "my heart breaks", the point off toward the sea at "Calypso's island"); Zeus LISTENs with
   nods; the ring turns from Zeus to her as she begins and back to Zeus as he answers (ATTEND, each god a little after the one beside
   him: the turn passes round the ring). Zeus answers with his authority (DECLARE: the open hand to his child, the point to the empty
   throne at "Poseidon", the fist at "cannot hold out"); Athena listens and at "shape his return" knows she has won (a REACT nod). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K3 = K('K3'), T = M.total, q = t => Math.round(t * 12) / 12;
  const Z = 'zeus', A = 'athena', G = Object.keys(M.H).filter(i => /assembly/.test(i)), throne = [-268, 60, -61];
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c5 = clip(5), c6 = clip(6);
  const V1 = X.voiceOf(c1), V5 = X.voiceOf(c5), V6 = X.voiceOf(c6), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tEmpty = q(w(V1, 'empty', 8.0)), tPos = q(w(V6, 'poseidon', 46.9)), tShape = q(w(V6, 'shape', 64.1));
  /* ── the ring ── */
  stimuli.push({ id: 'sRing', t0: 0.05, t1: 0.4, kind: 'SCENE', label: 'the gods take their places in the halls of Olympus', because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sEmpty', t0: tEmpty - 0.2, t1: tEmpty + 0.4, kind: 'SIGHT', label: 'Poseidon\'s throne is empty: he is away among the Ethiopians', because: [{ id: 'sRing' }] });
  [Z, A, ...G].forEach((g, k) => { holds.push({ id: 'hSet' + k, actor: g, t0: 0.3, t1: q(tEmpty + 0.1 + 0.2 * k), reason: 'settling into the council', params: { look: [[k ? Z : A, 1.6], [[Z, A, ...G][(k + 2) % (G.length + 2)], 1.1]], weight: true, offset: 0.3 * k }, because: [{ id: 'sRing' }] });
    I({ id: 'iThrone' + k, actor: g, kind: 'ATTEND', target: throne, t0: q(tEmpty + 0.2 + 0.2 * k), t1: q(tEmpty + 1.8 + 0.2 * k), label: 'to the empty throne', because: [{ id: 'sEmpty' }] }); });
  /* ── Athena rises and petitions ── */
  I({ id: 'aRise', actor: A, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: Z, label: 'rises and comes to the centre of the ring', because: [{ id: 'iThrone1' }] });
  I({ id: 'aPlea', actor: A, kind: 'DECLARE', target: Z, utterance: c5.gi, t0: c5.at - 0.2, t1: c5.at + c5.dur, label: 'it is Odysseus my heart breaks for', params: { shapes: ['open', 'dismiss', 'chest', 'plead', 'point', 'plead', 'open'], side: 'R' }, because: [{ id: 'v' + c5.gi, rel: 'realises' }, { id: 'aRise' }] });
  I({ id: 'zHear', actor: Z, kind: 'LISTEN', target: A, t0: c5.at, t1: c5.at + c5.dur, label: 'hears his child out', params: { nods: [q(w(V5, 'earned', 16.6) + 0.3), q(w(V5, 'troy', 37.7) + 0.3)] }, because: [{ id: 'aPlea' }] });
  G.forEach((g, k) => { I({ id: 'gToA' + k, actor: g, kind: 'ATTEND', target: A, t0: q(c5.at + 0.2 + 0.25 * k), t1: q(c6.at - 0.3), label: 'the ring turns to Athena', because: [{ id: k ? 'gToA' + (k - 1) : 'aPlea' }] }); });
  /* ── Zeus answers ── */
  I({ id: 'zAnswer', actor: Z, kind: 'DECLARE', target: A, utterance: c6.gi, t0: c6.at - 0.2, t1: c6.at + c6.dur, label: 'how could I forget him? Poseidon rages; but let us shape his return', params: { shapes: ['open', 'open', 'point', 'chop', 'open', 'fist'], side: 'R' }, because: [{ id: 'v' + c6.gi, rel: 'realises' }, { id: 'aPlea' }] });
  G.forEach((g, k) => I({ id: 'gToZ' + k, actor: g, kind: 'ATTEND', target: Z, t0: q(c6.at + 0.1 + 0.25 * k), t1: T, label: 'the ring turns back to Zeus', because: [{ id: k ? 'gToZ' + (k - 1) : 'zAnswer' }] }));
  stimuli.push({ id: 'sPoseidon', t0: tPos, t1: tPos + 0.4, kind: 'WORD', label: '"Poseidon": the empty throne named', actor: Z, because: [{ id: 'zAnswer' }] });
  G.forEach((g, k) => { if (k % 2 === 0) I({ id: 'gGlance' + k, actor: g, kind: 'REACT', t0: q(tPos + 0.3 + 0.1 * k), t1: q(tPos + 1.4 + 0.1 * k), label: 'a glance at the empty throne', params: { how: 'turn', lookAt: throne }, because: [{ id: 'sPoseidon' }] }); });
  I({ id: 'aHear', actor: A, kind: 'LISTEN', target: Z, t0: c6.at, t1: q(tShape - 0.2), label: 'hears her father', params: { nods: [] }, because: [{ id: 'zAnswer' }] });
  I({ id: 'aWon', actor: A, kind: 'REACT', t0: q(tShape + 0.2), t1: q(tShape + 1.4), label: '"let us shape his return": she has won', params: { how: 'nod', lookAt: Z }, because: [{ id: 'zAnswer' }] });
  G.forEach((g, k) => { holds.push({ id: 'hHearA' + k, actor: g, t0: q(c5.at + 1.8 + 0.25 * k), t1: c6.at - 0.3, reason: 'the council hears the goddess plead', params: { look: [[A, 3.0], [Z, 1.0]], weight: true, offset: 0.35 * k }, because: [{ id: 'gToA' + k }] });
    holds.push({ id: 'hHearZ' + k, actor: g, t0: q(c6.at + 1.6 + 0.25 * k), t1: T, reason: 'the council hears the father answer', params: { look: [[Z, 3.0], [A, 1.0]], weight: true, offset: 0.35 * k }, because: [{ id: 'gToZ' + k }] }); });
  holds.push({ id: 'hA8', actor: A, t0: c6.at + 0.2, t1: q(tShape - 0.2), reason: 'standing before her father while he answers', params: { look: [[Z, 3.2], [throne, 0.7]], weight: true }, because: [{ id: 'zAnswer' }] });
  holds.push({ id: 'hA9', actor: A, t0: q(tShape + 1.5), t1: T, reason: 'her petition granted: already planning', params: { look: [[Z, 2.0], [throne, 0.8], [Z, 1.4]], weight: true }, because: [{ id: 'aWon' }] });
  holds.push({ id: 'hZ0', actor: Z, t0: q(tEmpty + 1.9), t1: c5.at - 0.1, reason: 'the father of gods and men, waiting for the council to begin', params: { look: [[A, 1.8], [G[1], 1.0], [throne, 0.9]], weight: true }, because: [{ id: 'iThrone0' }] });
  return {
    type: 'dialogue', title: 'The Council of the Gods: the empty throne, the petition, the answer',
    actors: { [Z]: { role: 'the father of gods and men', body: 'minifig', principal: true }, [A]: { role: 'the grey-eyed goddess', body: 'minifig', principal: true, affect: { cunning: 0.6 } }, ...Object.fromEntries(G.map(g => [g, { role: 'a god of the council', body: 'minifig', group: 'gods' }])) },
    objects: { throne: { kind: 'throne', material: 'stone', at: throne, affords: ['sit'], note: 'Poseidon\'s, empty' } },
    authored: { intents, holds, stimuli, goals: { [A]: 'win Odysseus his homecoming', [Z]: 'keep the council\'s peace' },
      couplings: [],
      causal: { tau: 0.8, actions: {
        [A]: [{ a: 'wait her turn', base: 1.0, f: { 'after:sEmpty': -1.5 } }, { a: 'petition her father', base: -1.5, f: { 'after:sEmpty': 2.6, 'after:zAnswer': -3 } }, { a: 'demand', base: -3.0, f: { 'after:aPlea': 0.5 } }, { a: 'accept his word', base: -2.8, f: { 'after:zAnswer': 3.4 } }],
        [Z]: [{ a: 'preside', base: 1.0, f: {} }, { a: 'answer her', base: -2.2, f: { 'after:aPlea': 3.2 } }, { a: 'refuse her', base: -3.2, f: { 'after:sPoseidon': 0.6 } }],
        ...Object.fromEntries(G.map(g => [g, [{ a: 'watch the speaker', base: 1.0, f: { 'after:aPlea': 0.4 } }, { a: 'look at the empty throne', base: -1.5, f: { 'after:sEmpty': 2.0, 'after:sPoseidon': 1.6 } }]])),
      } },
      camera: { follow: true },
    },
  };
};
