/* Eurymachus Bargains and Attacks (OD-B22-S02, Odyssey 22): Antinous lies dead across his table. Eurymachus comes forward from the
   suitors with open hands: Antinous was the ringleader, he is dead; spare the rest and we will pay you back twenty oxen each, gold
   and bronze. Odysseus on the threshold, the bow drawn on the room, refuses: not for all you have; fight or fly, none of you escapes.
   Eurymachus turns to the suitors, draws his sword: hold up the tables against his arrows, rush him all together; they lift their
   arms; he charges the door with a cry, and the arrow takes him in the chest; the sword falls from his hand and he falls dead.
   Amphinomus runs at Odysseus with his sword to drive him from the door; Telemachus, quicker, spears him from behind, and he falls.

   The chain: the bargain (Eurymachus's PLEAD on the voice's words) -> Odysseus's answer (DECLARE, the bow held on him) -> the refusal
   heard (a WORD) -> Eurymachus's RALLY (he turns to the suitors, the sword up, the ADVANCE of K3) -> the suitors' answer (REACT,
   arms up for the tables: the blocking's pose) -> his CHARGE (K3a) -> Odysseus's SHOOT (draw, hold, loose: a SOUND) -> the IMPACT
   in Eurymachus's chest -> his DIE (K4a) -> the room's flinch -> Amphinomus's CHARGE, caused by the fall (the door is open to a
   rush now: K5) -> Telemachus's STAB from behind, caused by the charge at his father -> Amphinomus's IMPACT -> DIE (K5a). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win, T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', Tm = 'telemachus', E = 'eurymachus', A = 'amphinomus', An = 'antinous', S = ['four-suitors-1', 'four-suitors-2', 'four-suitors-3', 'four-suitors-4'];
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c3 = clip(3), c4 = clip(4), c5 = clip(5), c6 = clip(6);
  const V1 = X.voiceOf(c1), V4 = X.voiceOf(c4), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => holds.push(o);
  const door = [0, 50, 262];
  stimuli.push({ id: 'sHall', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'Antinous dead across his table; the man on the threshold with the bow; the suitors unarmed', because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  H({ id: 'hAn', actor: An, t0: 0.1, t1: T, reason: 'dead across his table, the arrow in his throat', params: { still: true }, because: [{ id: 'sHall' }] });
  /* ── the bargain ── */
  const tBlame = q(w(V1, 'blames', c1.at + 1.2)), tOffer = q(w(V1, 'offers', c1.at + 4.6)), tSpare = q(w(V1, 'spares', c1.at + 8.4));
  I({ id: 'eBlame', actor: E, kind: 'GESTURE', target: An, t0: q(tBlame - 0.3), t1: q(tBlame + 1.6), label: 'Antinous there was the one to blame: he lies where he fell', params: { shape: 'point', at: tBlame, side: 'L', amp: 0.9, hold: 0.7 }, because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  I({ id: 'eOffer', actor: E, kind: 'GESTURE', target: O, t0: q(tOffer - 0.4), t1: q(tOffer + 1.8), label: 'twenty oxen each, gold and bronze', params: { shape: 'offer', at: tOffer, side: 'R', amp: 1.0, hold: 0.9 }, because: [{ id: 'eBlame' }] });
  I({ id: 'ePlead', actor: E, kind: 'GESTURE', target: O, t0: q(tSpare - 0.4), t1: q(tSpare + 1.6), label: 'spare your own people', params: { shape: 'plead', at: tSpare, side: 'R', amp: 1.0, hold: 0.8 }, because: [{ id: 'eOffer' }] });
  H({ id: 'hE0', actor: E, t0: 0.3, t1: q(tBlame - 0.35), reason: 'he comes forward alone to the archer, his hands open', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'sHall' }] });
  H({ id: 'hE1', actor: E, t0: q(tSpare + 1.7), t1: q(W('K2')[0] - 0.1), reason: 'he waits for the answer, watching the arrow', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'ePlead' }] });
  H({ id: 'hO0', actor: O, t0: 0.3, t1: q(c3.at - 0.5), reason: 'in the door with the bow drawn on him: he lets him talk', params: { look: [[E, 2.6], [S[1], 0.8], [E, 2.0], [A, 0.8]], weight: false }, because: [{ id: 'sHall' }] });
  H({ id: 'hT0', actor: Tm, t0: 0.3, t1: q(W('K3')[0] - 0.1), reason: 'beside his father in the doorway, the spear ready', params: { look: [[E, 2.0], [A, 1.6], [O, 1.0]], weight: true }, because: [{ id: 'sHall' }] });
  S.forEach((s, k) => H({ id: 'hS0' + k, actor: s, t0: 0.3, t1: q(W('K3')[0] - 0.1), reason: 'behind Eurymachus, watching the bow: will he take the price?', params: { look: [[O, 1.8], [E, 1.4], [An, 0.8]], weight: true, offset: 0.25 * k }, because: [{ id: 'sHall' }] }));
  H({ id: 'hA0', actor: A, t0: 0.3, t1: q(W('K3')[0] - 0.1), reason: 'Amphinomus among them, his hand on his sword', params: { look: [[O, 2.0], [E, 1.6], [Tm, 1.0]], weight: true }, because: [{ id: 'sHall' }] });
  /* ── the answer ── */
  I({ id: 'oNo', actor: O, kind: 'DECLARE', t0: q(c3.at - 0.4), t1: q(c3.at + c3.dur), target: E, utterance: c3.gi, label: 'not for all you have: none of you escapes', params: { shapes: ['chop', 'point'], side: 'R' }, because: [{ id: 'v' + c3.gi, rel: 'realises' }, { id: 'ePlead' }] });
  I({ id: 'oAim', actor: O, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: E, label: 'the string drawn back again', because: [{ id: 'ePlead', latency: 0.4 }] });
  I({ id: 'eBack', actor: E, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: O, label: 'a step back, the hands dropping', because: [{ id: 'oAim', latency: 0.3 }] });
  stimuli.push({ id: 'sNo', t0: q(c3.at + c3.dur - 0.6), t1: q(c3.at + c3.dur), kind: 'WORD', label: 'none of you shall escape', actor: O, because: [{ id: 'oNo' }] });
  I({ id: 'eShock', actor: E, kind: 'REACT', t0: q(c3.at + c3.dur - 0.3), t1: q(c3.at + c3.dur + 1.0), label: 'no bargain: his knees go', params: { how: 'flinch', lookAt: O }, because: [{ id: 'sNo', latency: 0.3 }] });
  S.forEach((s, k) => I({ id: 'sShock' + k, actor: s, kind: 'REACT', t0: q(c3.at + c3.dur - 0.1 + 0.1 * k), t1: q(c3.at + c3.dur + 1.1 + 0.1 * k), label: 'no quarter', params: { how: 'flinch', lookAt: O }, because: [{ id: 'sNo', latency: 0.5 + 0.1 * k }] }));
  H({ id: 'hO1', actor: O, t0: q(c3.at + c3.dur + 0.1), t1: q(W('K4')[0] - 1.2), reason: 'the bow on Eurymachus: he waits for him to move', params: { look: [[E, 3.0], [A, 0.8]], weight: false }, because: [{ id: 'oNo' }] });
  /* ── the rally ── */
  I({ id: 'eRally', actor: E, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: S[0], label: 'turns on the suitors and draws his sword', because: [{ id: 'sNo', latency: 0.4 }] });
  const tRush = q(w(V4, 'rush', c4.at + 3.6)), tTables = q(w(V4, 'tables', c4.at + 6.8));
  I({ id: 'eCry', actor: E, kind: 'GESTURE', target: S[0], t0: q(Math.max(W('K3')[1] + 0.1, tRush - 0.5)), t1: q(Math.max(W('K3')[1] + 0.1, tRush - 0.5) + 1.6), label: 'draw your swords, hold up the tables: all at him together', params: { shape: 'fist', at: q(Math.max(W('K3')[1] + 0.3, tRush - 0.2)), side: 'R', amp: 1.0, hold: 0.6 }, because: [{ id: 'eRally' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  S.forEach((s, k) => I({ id: 'sUp' + k, actor: s, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: E, label: 'the arms up for the tables', because: [{ id: 'eRally', latency: 0.3 + 0.1 * k }] }));
  I({ id: 'aDraw', actor: A, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: O, label: 'draws his sword', because: [{ id: 'eRally', latency: 0.4 }] });
  I({ id: 'tReady', actor: Tm, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: E, label: 'the spear up: they are coming', because: [{ id: 'eRally', latency: 0.3 }] });
  S.forEach((s, k) => I({ id: 'sCry' + k, actor: s, kind: 'REACT', t0: q(tTables + 0.1 * k), t1: q(tTables + 1.2 + 0.1 * k), label: 'the tables up', params: { how: 'lean', lookAt: O }, because: [{ id: 'eCry', latency: 0.4 + 0.1 * k }] }));
  /* ── the charge, the arrow ── */
  stimuli.push({ id: 'sGo', t0: q(W('K3a')[0] - 0.4), t1: q(W('K3a')[0]), kind: 'SOUND', label: 'his war cry', actor: E, because: [{ id: 'eCry' }] });
  I({ id: 'eCharge', actor: E, kind: 'APPROACH', key: 'K3a', t0: W('K3a')[0], t1: W('K3a')[1], target: O, label: 'springs at the door with a cry, the sword up', because: [{ id: 'sGo' }] });
  S.slice(0, 2).forEach((s, k) => I({ id: 'sFol' + k, actor: s, kind: 'APPROACH', key: 'K3a', t0: W('K3a')[0], t1: W('K3a')[1], target: O, label: 'after him, the arms up', because: [{ id: 'sGo', latency: 0.4 + 0.15 * k }] }));
  I({ id: 'aFol', actor: A, kind: 'APPROACH', key: 'K3a', t0: W('K3a')[0], t1: W('K3a')[1], target: O, label: 'forward with the rush', because: [{ id: 'sGo', latency: 0.5 }] });
  I({ id: 'oTrack', actor: O, kind: 'APPROACH', key: 'K3a', t0: W('K3a')[0], t1: W('K3a')[1], target: E, label: 'the arrow follows him', because: [{ id: 'sGo', latency: 0.2 }] });
  I({ id: 'eClose', actor: E, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: O, label: 'the last strides', because: [{ id: 'eCharge' }] });
  const wE = W('K4a'), tLoose = q(wE[0] - 0.35), tDraw = q(tLoose - 1.4);
  I({ id: 'oShoot', actor: O, kind: 'SHOOT', t0: tDraw, t1: q(tLoose + 1.4), target: E, label: 'into his breast by the nipple', params: { draw: 0.9, hold: 0.5, looseId: 'sLoose' }, because: [{ id: 'eCharge' }] });
  I({ id: 'eHit', actor: E, kind: 'IMPACT', t0: q(tLoose + 0.08), t1: q(wE[0] + 0.3), label: 'the arrow in his chest: the sword falls from his hand', params: { until: q(wE[0] + 0.25) }, because: [{ id: 'sLoose', latency: 0.08 }] });
  I({ id: 'eDie', actor: E, kind: 'DIE', t0: wE[0], t1: wE[1], label: 'falls doubled over, dead', params: { key: 'K4a' }, because: [{ id: 'eHit' }] });
  H({ id: 'hEd', actor: E, t0: q(wE[1] + 1.0), t1: T, reason: 'dead on the floor of the hall', params: { still: true }, because: [{ id: 'eDie' }] });
  [...S.slice(0, 2), A, Tm].forEach((s, k) => I({ id: 'flE' + k, actor: s, kind: 'REACT', t0: q(tLoose + 0.3 + 0.08 * k), t1: q(tLoose + 1.5 + 0.08 * k), label: 'Eurymachus down', params: { how: s === Tm ? 'turn' : 'startle', lookAt: E }, because: [{ id: 'sLoose', latency: 0.3 + 0.08 * k }] }));
  S.slice(2).forEach((s, k) => H({ id: 'hS1' + k, actor: s, t0: q(W('K3')[1] + 0.2), t1: T, reason: 'back by the tables, the arms up: they will not go first', params: { look: [[O, 1.6], [E, 1.2], [A, 1.2]], weight: true, offset: 0.3 * k }, because: [{ id: 'sUp' + (k + 2) }] }));
  S.slice(0, 2).forEach((s, k) => H({ id: 'hS2' + k, actor: s, t0: q(tLoose + 1.6 + 0.1 * k), t1: q(W('K5a')[0] - 0.1), reason: 'stopped short by the dead man, the bow on them', params: { look: [[E, 1.0], [O, 1.6], [A, 1.2]], weight: true, offset: 0.3 * k }, because: [{ id: 'flE' + k }] }));
  /* ── Amphinomus, Telemachus ── */
  I({ id: 'oRe', actor: O, kind: 'RECOVER', t0: q(tLoose + 1.45), t1: q(tLoose + 2.4), label: 'the next arrow to the string', because: [{ id: 'oShoot' }] });
  stimuli.push({ id: 'sOpen', t0: q(wE[1] + 0.2), t1: q(wE[1] + 0.6), kind: 'SIGHT', label: 'the archer reaching for the next arrow: a moment to rush him', actor: O, because: [{ id: 'oRe' }] });
  I({ id: 'aCharge', actor: A, kind: 'APPROACH', key: 'K5', t0: W('K5')[0], t1: W('K5')[1], target: O, label: 'runs at Odysseus with his sword to drive him from the door', because: [{ id: 'sOpen', latency: 0.3 }, { id: 'v' + c6.gi, rel: 'realises' }] });
  I({ id: 'tCut', actor: Tm, kind: 'APPROACH', key: 'K5', t0: W('K5')[0], t1: W('K5')[1], target: A, label: 'quicker: across to take him from behind', because: [{ id: 'aCharge', latency: 0.3 }] });
  I({ id: 'oTurnA', actor: O, kind: 'APPROACH', key: 'K5', t0: W('K5')[0], t1: W('K5')[1], target: A, label: 'turns the bow on him', because: [{ id: 'aCharge', latency: 0.3 }] });
  const wA = W('K5a'), tSt = q(wA[0] - 0.56);
  I({ id: 'tStab', actor: Tm, kind: 'STAB', t0: tSt, t1: q(tSt + 1.3), target: A, label: 'the spear between his shoulders and through his chest', params: { hit: true, impactId: 'hitA' }, because: [{ id: 'tCut' }] });
  I({ id: 'aHit', actor: A, kind: 'IMPACT', t0: q(tSt + 0.53), t1: q(wA[0] + 0.3), label: 'the spear in him', params: { until: q(wA[0] + 0.25) }, because: [{ id: 'hitA', latency: 0.05 }] });
  I({ id: 'aDie', actor: A, kind: 'DIE', t0: wA[0], t1: wA[1], label: 'falls heavily, his forehead to the ground', params: { key: 'K5a' }, because: [{ id: 'aHit' }] });
  H({ id: 'hAd', actor: A, t0: q(wA[1] + 1.0), t1: T, reason: 'dead', params: { still: true }, because: [{ id: 'aDie' }] });
  I({ id: 'tRec', actor: Tm, kind: 'RECOVER', t0: q(tSt + 1.35), t1: q(tSt + 2.3), label: 'leaves the spear: back to his father', because: [{ id: 'tStab' }] });
  H({ id: 'hT2', actor: Tm, t0: q(tSt + 2.35), t1: T, reason: 'over the dead man, watching the rest', params: { look: [[S[0], 1.4], [S[1], 1.4], [O, 1.0]], weight: true }, because: [{ id: 'tRec' }] });
  S.slice(0, 2).forEach((s, k) => { I({ id: 'flA' + k, actor: s, kind: 'REACT', t0: q(tSt + 0.8 + 0.1 * k), t1: q(tSt + 1.9 + 0.1 * k), label: 'Amphinomus down', params: { how: 'flinch', lookAt: A }, because: [{ id: 'hitA', latency: 0.3 + 0.1 * k }] });
    I({ id: 'sBack' + k, actor: s, kind: 'APPROACH', key: 'K5a', t0: wA[0], t1: wA[1], target: O, label: 'backs off from the door', because: [{ id: 'flA' + k }] });
    H({ id: 'hS3' + k, actor: s, t0: q(wA[1] + 0.2), t1: T, reason: 'two more dead between them and the door', params: { look: [[A, 1.0], [O, 1.6], [Tm, 1.2]], weight: true, offset: 0.3 * k }, because: [{ id: 'flA' + k }] }); });
  I({ id: 'oOver', actor: O, kind: 'APPROACH', key: 'K5a', t0: wA[0], t1: wA[1], target: S[0], label: 'the bow back on the room', because: [{ id: 'hitA', latency: 0.4 }] });
  H({ id: 'hO2', actor: O, t0: q(wA[1] + 0.2), t1: T, reason: 'the bow on the room again: who is next?', params: { look: [[S[0], 1.6], [S[1], 1.6], [S[2], 1.4]], weight: false }, because: [{ id: 'oOver' }] });
  H({ id: 'hO3', actor: O, t0: q(tLoose + 2.45), t1: q(W('K5')[0] - 0.1), reason: 'the next arrow nocked: he watches who will come', params: { look: [[A, 1.6], [S[0], 1.2], [E, 0.8]], weight: false }, because: [{ id: 'oRe' }] });
  H({ id: 'hA1', actor: A, t0: q(W('K3a')[1] + 0.1), t1: q(W('K5')[0] - 0.1), reason: 'his sword drawn: waiting his chance at the door', params: { look: [[O, 2.0], [E, 1.0], [Tm, 1.0]], weight: true }, because: [{ id: 'aFol' }] });
  H({ id: 'hT1', actor: Tm, t0: q(W('K3')[1] + 0.1), t1: q(W('K5')[0] - 0.1), reason: 'the spear ready beside his father', params: { look: [[E, 1.6], [A, 1.8], [O, 0.8]], weight: true }, because: [{ id: 'tReady' }] });
  return {
    type: 'fight', title: 'Eurymachus: the bargain refused, the charge, the arrow; Amphinomus and the spear',
    actors: { [O]: { role: 'the king on the threshold', body: 'minifig', principal: true }, [E]: { role: 'the suitors\' spokesman', body: 'minifig', principal: true }, [A]: { role: 'the decent suitor', body: 'minifig', principal: true },
      [Tm]: { role: 'the son', body: 'minifig' }, [An]: { role: 'the first dead', body: 'minifig' }, ...Object.fromEntries(S.map(s => [s, { role: 'a suitor', body: 'minifig', group: 'suitors' }])) },
    objects: { bow: { kind: 'bow', material: 'weapon', holder: O + ':L', affords: ['shoot'] }, sword: { kind: 'sword', material: 'weapon', holder: E + ':R', affords: ['strike'] }, door: { kind: 'door', material: 'door', at: door, exit: true, affords: ['flee'] },
      spear: { kind: 'spear', material: 'weapon', holder: Tm + ':R', affords: ['stab'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'none escapes', [E]: 'buy his life, then take the door', [A]: 'drive him from the door', [Tm]: 'guard his father' },
      couplings: [{ from: O, to: 'bow', via: 'weapon' }, { from: 'bow', to: E, via: 'weapon', t0: tLoose, t1: q(tLoose + 0.6) }, { from: Tm, to: A, via: 'weapon', t0: q(tSt + 0.4), t1: q(tSt + 0.9) }],
      causal: { tau: 0.7, actions: {
        [E]: [{ a: 'bargain', base: 1.0, f: { 'after:sNo': -3 } }, { a: 'rally and charge', base: -1.5, f: { 'after:sNo': 3.0 } }, { a: 'run', base: -2.0, f: { 'after:sNo': 1.0, ['threat:' + O]: -0.8 }, uses: ['door'] }],
        [A]: [{ a: 'wait', base: 0.6, f: { 'after:sOpen': -2 } }, { a: 'charge', base: -1.5, f: { 'after:sOpen': 3.0 } }, { a: 'hide', base: -1.0, f: { ['threat:' + O]: 0.6 } }],
        [O]: [{ a: 'hear him', base: 0.5, f: { 'after:oNo': -2 } }, { a: 'shoot the one who comes', base: -1.0, f: { 'after:sGo': 3.0, 'after:sLoose': -2 } }, { a: 'hold the door', base: 0.0, f: { 'after:sLoose': 1.5 } }],
        [Tm]: [{ a: 'guard', base: 0.8, f: {} }, { a: 'strike', base: -2.0, f: { 'after:aCharge': 3.2 } }],
        ...Object.fromEntries(S.map(s => [s, [{ a: 'wait', base: 0.5, f: { 'after:eCry': -1.5 } }, { a: 'rush with the tables', base: -1.5, f: { 'after:eCry': 2.0, 'after:sLoose': -2.5 } }, { a: 'cower', base: -1.0, f: { 'after:sLoose': 2.0 } }]])) } } },
  };
};
