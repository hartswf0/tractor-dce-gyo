/* The Suitors Fail the Bow (OD-B21-S03, Odyssey 21): Leiodes, the suitors' priest, is the first: he goes to the threshold and tries
   the bow and cannot bend it; his soft hands are tired; let another try, he says, but this bow will take the life out of the best of
   us. One after another the others take it up and strain at it and set it down. Antinous has Melanthius light a fire and bring a cake
   of tallow, and they warm and grease the bow; Eurymachus warms it by the fire and tries, and cannot: not the marriage, the shame of
   it. Antinous puts it off: it is Apollo's day; pour the wine, and tomorrow.

   The chain: the trial (SCENE) -> Leiodes's STRAIN on the bow (the take's K1) -> his giving up (DECLARE, the voice's turn) -> the next
   man's turn (K2, his APPROACH caused by Leiodes setting it down) and his STRAIN -> Antinous's order for the fire (GESTURE point) ->
   Melanthius at the fire (K3) and Eurymachus warming the bow (TOOL_WORK) -> Eurymachus to the threshold and his STRAIN (K4) -> his
   failure (K4a: the head down; DECLARE the shame) -> Antinous's word (K5, DECLARE: Apollo's day) -> the suitors' relief. */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win || [K(id).t, K(id).t + 0.6], T = M.total, q = t => Math.round(t * 12) / 12;
  const LE = 'leiodes', EU = 'eurymachus', ME = 'melanthius', AN = 'antinous', S = [1, 2, 3, 4, 5].map(i => 'suitor-bow-challengers-' + i), S4 = S[3];
  const clip = gi => M.clips.find(c => c.gi === gi), c2 = clip(2), c3 = clip(3), c4 = clip(4), c5 = clip(5), c6 = clip(6);
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); };
  const th = [-10, 40, 205], fire = [-17, 40, 115];
  stimuli.push({ id: 'sTrial', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'the bow of Odysseus: whoever strings it takes the queen', because: [{ id: 'v' + c2.gi, rel: 'realises' }] });
  /* ── Leiodes ── */
  I({ id: 'leStrain', actor: LE, kind: 'STRAIN', t0: 0.3, t1: q(c2.at + 3.0), label: 'the soft hands on the string: the bow will not bend', because: [{ id: 'sTrial' }] });
  I({ id: 'leSay', actor: LE, kind: 'DECLARE', utterance: c2.gi, t0: q(c2.at + 3.1), t1: q(c2.at + c2.dur), label: 'I cannot bend it; let another try; this bow will take the life out of the best of us', params: { shapes: ['open', 'point', 'chest'], side: 'R', maxBeats: 1, amp: 0.8 }, because: [{ id: 'leStrain' }, { id: 'v' + c2.gi, rel: 'realises' }] });
  S.forEach((s, k) => H({ id: 'hS0' + k, actor: s, t0: 0.3 + 0.1 * k, t1: q(c2.at + c2.dur + 0.4), reason: 'watching the priest at the threshold: he cannot', params: { look: [[LE, 2.4], [S[(k + 1) % 5], 0.6]], weight: true, offset: 0.3 * k }, because: [{ id: 'sTrial' }] }));
  H({ id: 'hEu0', actor: EU, t0: 0.3, t1: q(W('K3')[0] - 0.1), reason: 'the best of them after Antinous: he waits his turn', params: { look: [[LE, 2.2], [AN, 1.0]], weight: true }, because: [{ id: 'sTrial' }] });
  H({ id: 'hAn0', actor: AN, t0: 0.3, t1: q(c3.at + 1.0), reason: 'he lets the others fail first', params: { look: [[LE, 2.0], [EU, 1.0], [S4, 1.0]], weight: true }, because: [{ id: 'sTrial' }] });
  H({ id: 'hMe0', actor: ME, t0: 0.3, t1: q(c3.at + 2.4), reason: 'the goatherd at the suitors\' elbow, waiting to be told', params: { look: [[AN, 2.0], [LE, 1.4]], weight: true }, because: [{ id: 'sTrial' }] });
  /* ── one after another ── */
  stimuli.push({ id: 'sDown', t0: q(W('K2')[0] - 0.4), t1: q(W('K2')[0]), kind: 'SIGHT', label: 'Leiodes sets the bow down against the door', actor: LE, because: [{ id: 'leSay' }] });
  I({ id: 'leBack', actor: LE, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: th, label: 'back from the threshold, the head down', because: [{ id: 'sDown' }] });
  I({ id: 's4Go', actor: S4, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: th, label: 'up to the threshold to take his turn', because: [{ id: 'sDown', latency: 0.2 }, { id: 'v' + c3.gi, rel: 'realises' }] });
  I({ id: 's4Strain', actor: S4, kind: 'STRAIN', t0: q(W('K2')[1] + 0.1), t1: q(W('K3')[0] - 0.2), label: 'braces it and sweats: it does not move', because: [{ id: 's4Go' }] });
  H({ id: 'hLe1', actor: LE, t0: q(W('K2')[1] + 0.05), t1: T, reason: 'he has said it: the bow will take their lives', params: { look: [[S4, 1.4], [EU, 1.4], [th, 1.0]], weight: true }, because: [{ id: 'leBack' }] });
  S.filter(s => s !== S4).forEach((s, k) => H({ id: 'hS1' + k, actor: s, t0: q(c2.at + c2.dur + 0.5), t1: q(W('K5')[0] - 0.1), reason: 'one after another: none of them can', params: { look: [[th, 1.6], [EU, 1.0], [AN, 0.8]], weight: true, offset: 0.3 * k }, because: [{ id: 'sDown' }] }));
  /* ── the fire and the tallow ── */
  I({ id: 'anOrder', actor: AN, kind: 'GESTURE', target: ME, t0: q(c3.at + 1.1), t1: q(c3.at + 2.6), label: 'Melanthius, light a fire, bring a cake of tallow', params: { shape: 'point', at: q(c3.at + 1.5), side: 'R', amp: 1.0, hold: 0.6 }, because: [{ id: 's4Strain' }] });
  I({ id: 'meFire', actor: ME, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: fire, label: 'lights the fire and brings the tallow', because: [{ id: 'anOrder' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  I({ id: 'euWarm', actor: EU, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: fire, label: 'takes the bow to the fire', because: [{ id: 'anOrder', latency: 0.4 }] });
  I({ id: 's4Give', actor: S4, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: fire, label: 'hands it over and steps back', because: [{ id: 'euWarm' }] });
  I({ id: 'euTurn', actor: EU, kind: 'TOOL_WORK', t0: q(W('K3')[1] + 0.2), t1: q(W('K4')[0] - 0.3), label: 'turns the bow in the heat and greases it', params: { how: 'carve', on: 'bow', period: 1.0 }, because: [{ id: 'euWarm' }] });
  H({ id: 'hMe1', actor: ME, t0: q(W('K3')[1] + 0.05), t1: T, reason: 'he feeds the fire and watches the great men fail', params: { look: [[EU, 2.0], [AN, 1.0]], weight: true }, because: [{ id: 'meFire' }] });
  H({ id: 'hS4', actor: S4, t0: q(W('K3')[1] + 0.05), t1: q(W('K5')[0] - 0.1), reason: 'his turn over: he watches Eurymachus', params: { look: [[EU, 2.4]], weight: true }, because: [{ id: 's4Give' }] });
  H({ id: 'hAn1', actor: AN, t0: q(c3.at + 2.7), t1: q(W('K5')[0] - 0.9), reason: 'he watches Eurymachus: if he fails, it is his own turn', params: { look: [[EU, 2.4], [th, 0.8]], weight: true }, because: [{ id: 'anOrder' }] });
  /* ── Eurymachus ── */
  I({ id: 'euGo', actor: EU, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: th, label: 'to the threshold with the warm bow', because: [{ id: 'euTurn' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  I({ id: 'euStrain', actor: EU, kind: 'STRAIN', t0: q(W('K4')[1] + 0.1), t1: q(W('K4a')[0] - 0.1), label: 'heats it, strains: it will not bend', because: [{ id: 'euGo' }] });
  I({ id: 'euFail', actor: EU, kind: 'APPROACH', key: 'K4a', t0: W('K4a')[0], t1: W('K4a')[1], target: th, label: 'the bow lowered, the head down', because: [{ id: 'euStrain' }] });
  I({ id: 'euShame', actor: EU, kind: 'GESTURE', t0: q(W('K4a')[1] + 0.1), t1: q(W('K4a')[1] + 1.7), label: 'it is not the marriage: it is the shame', params: { shape: 'chest', at: q(W('K4a')[1] + 0.5), side: 'R', amp: 0.8, hold: 0.6 }, because: [{ id: 'euFail' }] });
  stimuli.push({ id: 'sShame', t0: q(W('K4a')[1] + 0.4), t1: q(W('K4a')[1] + 0.8), kind: 'WORD', label: '"the shame"', actor: EU, because: [{ id: 'euShame' }] });
  /* ── Apollo's day ── */
  I({ id: 'anStep', actor: AN, kind: 'APPROACH', key: 'K5', t0: W('K5')[0], t1: W('K5')[1], target: EU, label: 'steps out: enough', because: [{ id: 'sShame' }, { id: 'v' + c6.gi, rel: 'realises' }] });
  I({ id: 'anSay', actor: AN, kind: 'DECLARE', target: EU, utterance: c6.gi, t0: q(Math.max(c6.at - 0.2, W('K5')[1] + 0.05)), t1: q(c6.at + c6.dur), label: 'it is Apollo\'s day: pour the wine, and we finish this tomorrow', params: { shapes: ['dismiss', 'open'], side: 'R', maxBeats: 1, amp: 0.9 }, because: [{ id: 'anStep' }] });
  I({ id: 'euLower', actor: EU, kind: 'APPROACH', key: 'K5', t0: W('K5')[0], t1: W('K5')[1], target: AN, label: 'turns to Antinous, the bow hanging', because: [{ id: 'anStep', latency: 0.2 }] });
  H({ id: 'hEu1', actor: EU, t0: q(W('K4a')[1] + 1.75), t1: q(W('K5')[0] - 0.1), reason: 'shamed before them all', params: { look: [[th, 1.4], [AN, 1.2]], weight: true }, because: [{ id: 'euShame' }] });
  H({ id: 'hEu2', actor: EU, t0: q(W('K5')[1] + 0.05), t1: T, reason: 'glad of the excuse', params: { look: [[AN, 3.0]], weight: true }, because: [{ id: 'euLower' }] });
  S.forEach((s, k) => I({ id: 'sRelief' + k, actor: s, kind: 'REACT', t0: q(c6.at + 1.5 + 0.1 * k), t1: q(c6.at + 2.6 + 0.1 * k), label: 'relief: tomorrow', params: { how: 'nod', lookAt: AN }, because: [{ id: 'anSay', latency: 0.5 + 0.1 * k }] }));
  S.forEach((s, k) => H({ id: 'hS2' + k, actor: s, t0: q(c6.at + 2.7 + 0.1 * k), t1: T, reason: 'the wine, and tomorrow', params: { look: [[AN, 1.6], [EU, 1.0]], weight: true, offset: 0.3 * k }, because: [{ id: 'sRelief' + k }] }));
  return {
    type: 'dialogue', title: 'The Suitors Fail the Bow: Leiodes, one after another, the fire and the tallow, Eurymachus, Apollo\'s day',
    actors: { [LE]: { role: 'the suitors\' priest', body: 'minifig', principal: true }, [EU]: { role: 'Eurymachus', body: 'minifig', principal: true }, [AN]: { role: 'Antinous', body: 'minifig', principal: true }, [ME]: { role: 'the goatherd', body: 'minifig' },
      ...Object.fromEntries(S.map(s => [s, { role: 'a suitor', body: 'minifig', group: 'suitors' }])) },
    objects: { bow: { kind: 'bow', material: 'wood', holder: LE + ':L', affords: ['string', 'warm'] }, fire: { kind: 'fire', material: 'fire', at: fire, affords: ['warm the bow'] } },
    authored: { intents, holds, stimuli, goals: { [LE]: 'string the bow', [EU]: 'string the bow; not be shamed', [AN]: 'not fail in front of them' },
      couplings: [{ from: 'fire', to: 'bow', via: 'fire', t0: W('K3')[1], t1: W('K4')[0] }],
      causal: { tau: 0.7, actions: {
        [LE]: [{ a: 'strain', base: 1.0, f: { 'after:leSay': -2 } }, { a: 'give it up', base: -1.0, f: { 'after:leSay': 3 } }],
        [EU]: [{ a: 'wait', base: 1.0, f: { 'after:anOrder': -1.5 } }, { a: 'warm and try', base: -1.0, f: { 'after:anOrder': 2.5 } }, { a: 'give it up', base: -2.0, f: { 'after:sShame': 3.0 } }],
        [AN]: [{ a: 'watch', base: 1.0, f: {} }, { a: 'order the fire', base: -1.0, f: { 'after:sDown': 1.5 } }, { a: 'put it off', base: -2.0, f: { 'after:sShame': 3.5 } }] } },
      camera: { follow: true },
    },
  };
};
