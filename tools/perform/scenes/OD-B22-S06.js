/* The Hall Is Cleared (OD-B22-S06, Odyssey 22): Athena holds up the aegis before the high seat and the suitors break like cattle
   maddened by the gadfly; Odysseus, Telemachus, Eumaeus and Philoetius come up the hall from the threshold and each strikes one man
   down; Leiodes runs to Odysseus's knees and begs, and is killed; Phemius the bard and Medon the herald kneel, Telemachus speaks for
   them, Odysseus spares them and sends them out of the door; the living search the hall.

   The chain, one link at a time, each caused by the one before it (with its latency): the AEGIS (Athena's raised arm, a SIGHT) ->
   the suitors' STARTLE and panic (they look from the goddess to the men coming up the hall) -> the four ADVANCE (the blocking's
   walks, each owned by an APPROACH caused by the panic: the opening) -> for each man in turn: the striker comes to him (his key), the
   STAB lands as the next key's window opens (a CONTACT IMPACT) -> the struck man's IMPACT -> his DIE (the blocking lays him down in
   that window) -> the others FLINCH at it. A man only moves when something has moved him: the walks are the keys', every key's
   mover is named here with what moved him. The last suitor down is what Leiodes sees (a SIGHT): nobody left to hide behind, so he
   runs to the knees (K2); his PLEA is on the voice's words; Odysseus hears him out (a HOLD with its reason) and then cuts him down
   (SWING, IMPACT, DIE: K2a). The bard sees the priest killed at the king's knees and decides (DECIDE) to go to them himself (K3);
   seeing the bard go, Medon crawls out to Telemachus's knees; both PLEAD; Telemachus's word for them ("confirms") is caused by the
   pleas; Odysseus's line (DECLARE) by his son's word; the two rise at the order and go out (K4, K4a); the four SEARCH the hall (K5),
   caused by the voice that tells it and by the door shutting behind the spared. Athena lowers the aegis when the last suitor is down. */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', Tm = 'telemachus', Eu = 'eumaeus', Ph = 'philoetius', Le = 'leiodes', At = 'athena', Pm = 'phemius', Md = 'medon';
  const S = ['four-suitors-1', 'four-suitors-2', 'four-suitors-3', 'four-suitors-4'], [S1, S2, S3, S4] = S;
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c2 = clip(2), c3 = clip(3), c5 = clip(5), c6 = clip(6);
  const V2 = X.voiceOf(c2), V3 = X.voiceOf(c3), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => holds.push(o);
  const W = id => K(id).win, door = [0, 50, 262], aegis = [-14, 120, -165];
  /* ── the aegis ── */
  stimuli.push({ id: 'sHall', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'the hall in uproar: Antinous and Eurymachus dead, the suitors without arms', because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  I({ id: 'aRaise', actor: At, kind: 'GESTURE', t0: 0.2, t1: 1.6, label: 'holds up the aegis over the hall', params: { shape: 'invoke', at: 0.6, side: 'L', amp: 1.0, hold: 0.8 }, because: [{ id: 'sHall' }] });
  stimuli.push({ id: 'sAegis', t0: 0.75, t1: 1.4, kind: 'SIGHT', label: 'the aegis: the suitors\' wits are turned', actor: At, because: [{ id: 'aRaise' }] });
  /* the suitors: the startle at the aegis, then panic (a hold with its reason: the goddess behind them, the men in front) */
  S.forEach((s, k) => I({ id: 'pan' + k, actor: s, kind: 'REACT', t0: q(0.95 + 0.12 * k), t1: q(2.2 + 0.1 * k), label: 'the aegis: terror', params: { how: 'startle', lookAt: At }, because: [{ id: 'sAegis', latency: 0.2 + 0.12 * k }] }));
  /* ── the four come up the hall; each strikes one man down (the striker's key, then the victim's) ── */
  const kills = [
    { by: O, v: S2, come: 'K1a', fall: 'K1b', how: 'STAB', what: 'Odysseus\'s sword' },
    { by: Tm, v: S1, come: 'K1b', fall: 'K1c', how: 'STAB', what: 'Telemachus\'s spear' },
    { by: Eu, v: S3, come: 'K1c', fall: 'K1d', how: 'STAB', what: 'the swineherd\'s spear' },
    { by: Ph, v: S4, come: 'K1c', fall: 'K1e', how: 'STAB', what: 'the stockman\'s spear' }];
  /* the advance: every man of the four is moved by the panic he sees (the suitors scatter: the opening) */
  stimuli.push({ id: 'sOpen', t0: q(1.3), t1: q(1.8), kind: 'SIGHT', label: 'the suitors scatter: the four go in like falcons on small birds', actor: S2, because: [{ id: 'pan1' }] });
  I({ id: 'oCome', actor: O, kind: 'APPROACH', key: 'K1a', t0: W('K1a')[0], t1: W('K1a')[1], target: S2, label: 'up the hall at the nearest', because: [{ id: 'sOpen' }] });
  I({ id: 'tAdv', actor: Tm, kind: 'APPROACH', key: 'K1a', t0: W('K1a')[0], t1: W('K1a')[1], target: S1, label: 'after his father, to the left', because: [{ id: 'sOpen' }] });
  I({ id: 'eAdv', actor: Eu, kind: 'APPROACH', key: 'K1a', t0: W('K1a')[0], t1: W('K1a')[1], target: S3, label: 'to the right of the hall', because: [{ id: 'sOpen' }] });
  I({ id: 'pAdv', actor: Ph, kind: 'APPROACH', key: 'K1a', t0: W('K1a')[0], t1: W('K1a')[1], target: S4, label: 'up the middle after the one who runs', because: [{ id: 'sOpen' }] });
  /* the suitors turn to the men coming at them, and the fourth runs */
  I({ id: 's1Turn', actor: S1, kind: 'APPROACH', key: 'K1a', t0: W('K1a')[0], t1: W('K1a')[1], target: Tm, label: 'turns to the spear coming at him', because: [{ id: 'tAdv', latency: 0.3 }] });
  I({ id: 's2Turn', actor: S2, kind: 'APPROACH', key: 'K1a', t0: W('K1a')[0], t1: W('K1a')[1], target: O, label: 'turns to the king coming at him', because: [{ id: 'oCome', latency: 0.3 }] });
  I({ id: 's3Turn', actor: S3, kind: 'APPROACH', key: 'K1a', t0: W('K1a')[0], t1: W('K1a')[1], target: Eu, label: 'turns to the swineherd', because: [{ id: 'eAdv', latency: 0.3 }] });
  I({ id: 's4Run', actor: S4, kind: 'APPROACH', key: 'K1a', t0: W('K1a')[0], t1: W('K1a')[1], target: [195, 40, 0], label: 'runs for the tables', because: [{ id: 'pAdv', latency: 0.25 }] });
  I({ id: 's4Run2', actor: S4, kind: 'APPROACH', key: 'K1b', t0: W('K1b')[0], t1: W('K1b')[1], target: [195, 40, 0], label: 'into the corner by the tables: cornered', because: [{ id: 's4Run' }] });
  I({ id: 'tCome', actor: Tm, kind: 'APPROACH', key: 'K1b', t0: W('K1b')[0], t1: W('K1b')[1], target: S1, label: 'at his man', because: [{ id: 'tAdv' }] });
  I({ id: 'pCome1', actor: Ph, kind: 'APPROACH', key: 'K1b', t0: W('K1b')[0], t1: W('K1b')[1], target: S4, label: 'after the runner', because: [{ id: 's4Run' }] });
  I({ id: 'eCome', actor: Eu, kind: 'APPROACH', key: 'K1c', t0: W('K1c')[0], t1: W('K1c')[1], target: S3, label: 'at his man', because: [{ id: 'eAdv' }] });
  I({ id: 'pCome', actor: Ph, kind: 'APPROACH', key: 'K1c', t0: W('K1c')[0], t1: W('K1c')[1], target: S4, label: 'corners him', because: [{ id: 's4Run2' }] });
  I({ id: 's1Face', actor: S1, kind: 'APPROACH', key: 'K1b', t0: W('K1b')[0], t1: W('K1b')[1], target: Tm, label: 'backs from the spear', because: [{ id: 'tCome', latency: 0.2 }] });
  I({ id: 's3Face', actor: S3, kind: 'APPROACH', key: 'K1c', t0: W('K1c')[0], t1: W('K1c')[1], target: Eu, label: 'backs from the swineherd', because: [{ id: 'eCome', latency: 0.2 }] });
  I({ id: 's4Face', actor: S4, kind: 'APPROACH', key: 'K1c', t0: W('K1c')[0], t1: W('K1c')[1], target: Ph, label: 'turns at bay', because: [{ id: 'pCome', latency: 0.2 }] });
  const prevKill = {};
  kills.forEach((k, n) => {
    const w = W(k.fall), tHit = q(w[0] - 0.08), tA = q(tHit - 0.48), hitId = 'hit' + n;
    I({ id: 'atk' + n, actor: k.by, kind: k.how, t0: tA, t1: q(tA + 1.3), target: k.v, label: k.what + ' at ' + k.v.replace('four-', ''), params: { hit: true, impactId: hitId }, because: [{ id: { [O]: 'oCome', [Tm]: 'tCome', [Eu]: 'eCome', [Ph]: 'pCome' }[k.by] }] });
    I({ id: 'imp' + n, actor: k.v, kind: 'IMPACT', t0: q(tHit + 0.05), t1: q(w[0] + 0.4), label: 'struck: the hands to the wound', params: { until: q(w[0] + 0.35), label: 'the blow goes in' }, because: [{ id: hitId, latency: 0.05 }] });
    I({ id: 'die' + n, actor: k.v, kind: 'DIE', t0: w[0], t1: w[1], label: 'falls dead', params: { key: k.fall }, because: [{ id: 'imp' + n }] });
    H({ id: 'dead' + n, actor: k.v, t0: q(w[1] + 1.0), t1: T, reason: 'dead on the floor of the hall', params: { still: true }, because: [{ id: 'die' + n }] });
    prevKill[k.v] = 'die' + n;
    /* the man left standing over him: the weapon back to guard */
    I({ id: 'rec' + n, actor: k.by, kind: 'RECOVER', t0: q(tA + 1.35), t1: q(tA + 2.4), label: 'back to guard over him', because: [{ id: 'atk' + n }] });
    /* the living flinch at it (each suitor still standing, and Leiodes by the hearth) */
    [...S.filter(s => s !== k.v && !kills.slice(0, n).some(x => x.v === s)), Le].forEach((s, j) => I({ id: 'fl' + n + '_' + j, actor: s, kind: 'REACT', t0: q(tHit + 0.25 + 0.08 * j), t1: q(tHit + 1.3 + 0.08 * j), label: 'a man down beside him', params: { how: 'flinch', lookAt: k.v }, because: [{ id: hitId, latency: 0.25 + 0.08 * j }] }));
  });
  /* the panic between the blows: a hold with its reason, the looks between the goddess, the man coming and the dying */
  S.forEach((s, n) => { const k = kills.find(x => x.v === s), w = W(k.fall);
    H({ id: 'hPan' + n, actor: s, t0: q(2.25 + 0.1 * n), t1: q(w[0] - 0.75), reason: 'nowhere to run: the goddess behind, the spears in front', params: { look: [[k.by, 1.0], [At, 0.7], [S[(n + 1) % 4], 0.6]], weight: true, offset: 0.2 * n }, because: [{ id: 'pan' + n }] }); });
  /* the four, between their blows: each watches his own man and the room */
  H({ id: 'hO1', actor: O, t0: q(tOf('atk0') + 2.45), t1: q(W('K1e')[1] + 0.2), reason: 'over the dead man, the sword ready: he watches the others finish theirs', params: { look: [[S1, 1.2], [S3, 1.2], [S4, 1.2], [Le, 1.0]], weight: true }, because: [{ id: 'rec0' }] });
  function tOf(id) { return intents.find(x => x.id === id).t0; }
  H({ id: 'hT1', actor: Tm, t0: q(tOf('rec1') + 1.1), t1: q(W('K2')[0] - 0.1), reason: 'his man down: he looks for the next', params: { look: [[Le, 1.4], [O, 1.0], [S4, 1.2]], weight: true }, because: [{ id: 'rec1' }] });
  H({ id: 'hE1', actor: Eu, t0: q(tOf('rec2') + 1.1), t1: q(W('K2')[0] - 0.1), reason: 'his man down: he looks round the hall', params: { look: [[S4, 1.2], [O, 1.0], [Le, 1.4]], weight: true }, because: [{ id: 'rec2' }] });
  H({ id: 'hP1', actor: Ph, t0: q(tOf('rec3') + 1.1), t1: q(W('K2')[0] - 0.1), reason: 'the last of the four down at his feet', params: { look: [[S4, 1.2], [O, 1.2]], weight: true }, because: [{ id: 'rec3' }] });
  /* Telemachus, Eumaeus and Philoetius keep the hall while it is settled: a guard each, until the search */
  I({ id: 'tGuard', actor: Tm, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: Le, label: 'back to cover his father\'s left', because: [{ id: 'sAlone' }] });
  I({ id: 'eTurn', actor: Eu, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: Le, label: 'turns to the man running at the king', because: [{ id: 'leRun', latency: 0.3 }] });
  I({ id: 'pTurn', actor: Ph, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: Le, label: 'turns to the man running at the king', because: [{ id: 'leRun', latency: 0.4 }] });
  /* Athena: the aegis held over the slaughter, lowered when the last is down */
  H({ id: 'hAt1', actor: At, t0: 1.7, t1: q(W('K1e')[1] + 0.4), reason: 'the aegis held up over the hall while they fall', params: { look: [[S2, 1.4], [S1, 1.4], [S3, 1.4], [S4, 1.4]], weight: false }, because: [{ id: 'aRaise' }] });
  I({ id: 'aLower', actor: At, kind: 'GESTURE', t0: q(W('K1e')[1] + 0.5), t1: q(W('K1e')[1] + 1.9), label: 'the aegis lowered: the work is done', params: { shape: 'dismiss', at: q(W('K1e')[1] + 0.9), side: 'L', amp: 0.6, hold: 0.4 }, because: [{ id: 'die3', latency: 0.5 }] });
  H({ id: 'hAt2', actor: At, t0: q(W('K1e')[1] + 2.0), t1: T, reason: 'the goddess watches her man settle his house', params: { look: [[O, 3.0], [Le, 1.5], [Pm, 1.5]], weight: false }, because: [{ id: 'aLower' }] });
  /* ── Leiodes ── */
  H({ id: 'hLe0', actor: Le, t0: 0.3, t1: q(W('K2')[0] - 0.1), reason: 'the priest of the suitors cowers by the hearth: no sword, nowhere to run', params: { look: [[At, 0.8], [O, 1.2], [S2, 0.9], [Ph, 0.9]], weight: true }, because: [{ id: 'sHall' }] });
  stimuli.push({ id: 'sAlone', t0: q(W('K1e')[1] + 0.1), t1: q(W('K1e')[1] + 0.5), kind: 'SIGHT', label: 'the last suitor down: nobody left to hide behind', actor: S4, because: [{ id: 'die3' }] });
  I({ id: 'leRun', actor: Le, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: O, label: 'runs to the king and drops at his knees', because: [{ id: 'sAlone' }] });
  I({ id: 'oTurnLe', actor: O, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: Le, label: 'turns to the man at his knees', because: [{ id: 'leRun', latency: 0.3 }] });
  const tClasp = q(Math.max(W('K2')[1] + 0.1, w(V2, 'clasps', c2.at + 1.4))), tInno = q(Math.max(tClasp + 2.4, w(V2, 'innocence', c2.at + 7.5)));
  I({ id: 'lePlead', actor: Le, kind: 'GESTURE', target: O, t0: q(tClasp), t1: q(tClasp + 2.2), label: 'I never did wrong in your house: I stopped the others', params: { shape: 'plead', at: q(tClasp + 0.4), side: 'R', amp: 1.0, hold: 1.2 }, because: [{ id: 'leRun' }, { id: 'v' + c2.gi, rel: 'realises' }] });
  I({ id: 'lePlead2', actor: Le, kind: 'GESTURE', target: O, t0: q(tInno - 0.6), t1: q(tInno + 1.4), label: 'only the priest who read the omens: spare me', params: { shape: 'plead', at: q(tInno - 0.2), side: 'L', amp: 1.0, hold: 0.8 }, because: [{ id: 'lePlead' }] });
  H({ id: 'hLe1', actor: Le, t0: q(tClasp + 2.3), t1: q(tInno - 0.7), reason: 'on his knees, holding the king\'s knees, looking up at him', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'lePlead' }] });
  H({ id: 'hO2', actor: O, t0: q(W('K2')[1] + 0.1), t1: q(W('K2a')[0] - 0.75), reason: 'he hears him out, the sword low: the priest who prayed for his death', params: { look: [[Le, 3.0], [Tm, 0.6], [Le, 2.0]], weight: true }, because: [{ id: 'lePlead' }] });
  stimuli.push({ id: 'sPriest', t0: q(tInno + 1.5), t1: q(tInno + 1.9), kind: 'WORD', label: 'you prayed that I should never come home: you die', actor: O, because: [{ id: 'lePlead2' }] });
  const wL = W('K2a'), tCut = q(wL[0] - 0.62);
  I({ id: 'oCut', actor: O, kind: 'SWING', target: Le, t0: tCut, t1: q(tCut + 1.3), label: 'the sword Agelaus dropped, through the middle of his neck', params: { hit: true, impactId: 'hitLe', side: 'R' }, because: [{ id: 'sPriest' }] });
  I({ id: 'leImp', actor: Le, kind: 'IMPACT', t0: q(tCut + 0.6), t1: q(wL[0] + 0.4), label: 'the blow: his head falls in the dust while he is yet speaking', params: { until: q(wL[0] + 0.3) }, because: [{ id: 'hitLe', latency: 0.05 }] });
  I({ id: 'leDie', actor: Le, kind: 'DIE', t0: wL[0], t1: wL[1], label: 'falls dead at the king\'s feet', params: { key: 'K2a' }, because: [{ id: 'leImp' }] });
  H({ id: 'deadLe', actor: Le, t0: q(wL[1] + 1.0), t1: T, reason: 'dead at the king\'s feet', params: { still: true }, because: [{ id: 'leDie' }] });
  I({ id: 'oRec', actor: O, kind: 'RECOVER', t0: q(tCut + 1.35), t1: q(tCut + 2.4), label: 'back to guard', because: [{ id: 'oCut' }] });
  [Tm, Eu, Ph, Pm, Md].forEach((s, j) => I({ id: 'flLe' + j, actor: s, kind: 'REACT', t0: q(tCut + 0.85 + 0.1 * j), t1: q(tCut + 1.9 + 0.1 * j), label: 'the priest killed at the knees', params: { how: s === Pm || s === Md ? 'flinch' : 'turn', lookAt: Le }, because: [{ id: 'hitLe', latency: 0.3 + 0.1 * j }] }));
  /* the three hold the hall while the king deals with the priest */
  H({ id: 'hT2', actor: Tm, t0: q(W('K2')[1] + 0.1), t1: q(tCut + 0.8), reason: 'beside his father, the spear down: the priest is no danger', params: { look: [[Le, 2.0], [O, 1.2], [Md, 1.0]], weight: true }, because: [{ id: 'tGuard' }] });
  H({ id: 'hE2', actor: Eu, t0: q(W('K2')[1] + 0.1), t1: q(tCut + 0.85), reason: 'he watches the priest beg', params: { look: [[Le, 2.4], [O, 1.4]], weight: true }, because: [{ id: 'eTurn' }] });
  H({ id: 'hP2', actor: Ph, t0: q(W('K2')[1] + 0.1), t1: q(tCut + 0.95), reason: 'he watches the priest beg', params: { look: [[Le, 2.2], [O, 1.4], [At, 0.8]], weight: true }, because: [{ id: 'pTurn' }] });
  /* ── Phemius and Medon ── */
  H({ id: 'hPm0', actor: Pm, t0: 0.3, t1: q(W('K2')[0] - 0.1), reason: 'the bard by the high seat, the lyre in his hands: whether to run for the courtyard altar or to the king', params: { look: [[At, 1.2], [O, 1.6], [S2, 0.8]], weight: true, grip: 'R' }, because: [{ id: 'sHall' }] });
  I({ id: 'pmEdge', actor: Pm, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: O, label: 'edges down from the high seat, the lyre held to him', because: [{ id: 'sAlone' }] });
  H({ id: 'hPm1', actor: Pm, t0: q(W('K2')[1] + 0.1), t1: q(tCut + 0.8), reason: 'the lyre held to his chest: he watches what the king does with a man who begs', params: { look: [[O, 2.0], [Le, 1.6]], weight: true, grip: 'R' }, because: [{ id: 'pmEdge' }] });
  H({ id: 'hMd0', actor: Md, t0: 0.3, t1: q(W('K3')[0] - 0.1), reason: 'the herald hidden under a fresh ox hide by the wall, not breathing', params: { look: [[O, 1.6], [Tm, 1.6], [At, 0.6]], weight: true, offset: 0.4 }, because: [{ id: 'sHall' }] });
  I({ id: 'mdTurn', actor: Md, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: O, label: 'pulls the hide closer, eyes on the king', because: [{ id: 'sAlone', latency: 0.4 }] });
  I({ id: 'pmDecide', actor: Pm, kind: 'DECIDE', t0: q(tCut + 1.95), t1: q(tCut + 2.6), label: 'to the king\'s knees, and lay the lyre down', because: [{ id: 'flLe3' }] });
  I({ id: 'pmGo', actor: Pm, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: O, label: 'down the hall to kneel at his knees', because: [{ id: 'pmDecide' }] });
  stimuli.push({ id: 'sBardGoes', t0: q(W('K3')[0] + 0.3), t1: q(W('K3')[0] + 0.7), kind: 'SIGHT', label: 'the bard goes to the king\'s knees', actor: Pm, because: [{ id: 'pmGo' }] });
  I({ id: 'mdGo', actor: Md, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: Tm, label: 'crawls out from under the hide to Telemachus\'s knees', because: [{ id: 'sBardGoes', latency: 0.3 }] });
  I({ id: 'oTurnPm', actor: O, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: Pm, label: 'turns to the bard', because: [{ id: 'sBardGoes', latency: 0.3 }] });
  I({ id: 'tTurnMd', actor: Tm, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: Md, label: 'turns to the herald at his knees', because: [{ id: 'mdGo', latency: 0.3 }] });
  const tMercy = q(Math.max(W('K3')[1] + 0.1, w(V3, 'mercy', c3.at + 3.0))), tConf = q(Math.max(tMercy + 2.4, w(V3, 'confirms', c3.at + 6.4)));
  I({ id: 'pmPlead', actor: Pm, kind: 'GESTURE', target: O, t0: q(tMercy - 0.4), t1: q(tMercy + 1.8), label: 'I sing to gods and men: you will be sorry if you kill me', params: { shape: 'plead', at: tMercy, side: 'R', amp: 1.0, hold: 1.0 }, because: [{ id: 'pmGo' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  I({ id: 'mdPlead', actor: Md, kind: 'GESTURE', target: Tm, t0: q(tMercy + 0.2), t1: q(tMercy + 2.3), label: 'here I am: speak for me to your father', params: { shape: 'plead', at: q(tMercy + 0.6), side: 'L', amp: 1.0, hold: 1.0 }, because: [{ id: 'mdGo' }] });
  I({ id: 'tSpeak', actor: Tm, kind: 'GESTURE', target: O, t0: q(tConf - 0.4), t1: q(tConf + 1.8), label: 'hold your hand: these two are innocent; the herald looked after me', params: { shape: 'open', at: tConf, side: 'R', amp: 1.0, hold: 1.0 }, because: [{ id: 'pmPlead' }, { id: 'mdPlead' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sSon', t0: q(tConf + 0.3), t1: q(tConf + 0.8), kind: 'WORD', label: 'his son\'s word for them', actor: Tm, because: [{ id: 'tSpeak' }] });
  I({ id: 'oListen', actor: O, kind: 'NOTICE', target: Tm, t0: q(tConf + 0.6), t1: q(tConf + 2.0), label: 'to his son', params: { gazeHold: 1.0 }, because: [{ id: 'sSon' }] });
  H({ id: 'hO3', actor: O, t0: q(tCut + 2.45), t1: q(tConf + 0.5), reason: 'the bard at his knees: he looks down at him, the sword still in his hand', params: { look: [[Pm, 2.4], [Md, 0.8], [Pm, 2.0]], weight: true }, because: [{ id: 'oRec' }] });
  H({ id: 'hO4', actor: O, t0: q(tConf + 2.1), t1: q(c5.at - 0.5), reason: 'he weighs them: the bard, the herald, his son', params: { look: [[Pm, 1.6], [Md, 1.4], [Tm, 1.0]], weight: true }, because: [{ id: 'oListen' }] });
  H({ id: 'hPm2', actor: Pm, t0: q(tMercy + 1.9), t1: q(K('K4').win[0] - 0.1), reason: 'on his knees, the lyre laid down: he waits for the word', params: { look: [[O, 3.0], [Tm, 1.0]], weight: true }, because: [{ id: 'pmPlead' }] });
  H({ id: 'hMd1', actor: Md, t0: q(tMercy + 2.4), t1: q(K('K4').win[0] - 0.1), reason: 'holding the son\'s knees: he waits for the word', params: { look: [[Tm, 2.0], [O, 1.6]], weight: true }, because: [{ id: 'mdPlead' }] });
  H({ id: 'hT3', actor: Tm, t0: q(tConf + 1.9), t1: q(K('K4').win[0] - 0.1), reason: 'he has spoken for them: he looks to his father', params: { look: [[O, 2.4], [Md, 1.2]], weight: true }, because: [{ id: 'tSpeak' }] });
  H({ id: 'hE3', actor: Eu, t0: q(tCut + 2.0), t1: q(K('K5').win[0] - 0.1), reason: 'he keeps the right of the hall', params: { look: [[Pm, 1.6], [O, 1.4], [S3, 1.0], [Md, 1.2]], weight: true, offset: 0.3 }, because: [{ id: 'flLe1' }] });
  H({ id: 'hP3', actor: Ph, t0: q(tCut + 2.1), t1: q(K('K5').win[0] - 0.1), reason: 'he keeps the middle of the hall', params: { look: [[O, 1.6], [Pm, 1.4], [S4, 1.0]], weight: true, offset: 0.6 }, because: [{ id: 'flLe2' }] });
  /* ── the order, and out ── */
  I({ id: 'oOrder', actor: O, kind: 'DECLARE', t0: q(c5.at - 0.4), t1: q(c5.at + c5.dur), target: Pm, utterance: c5.gi, label: 'mark the order: out into the courtyard', params: { shapes: ['point', 'point'], side: 'R' }, because: [{ id: 'v' + c5.gi, rel: 'realises' }, { id: 'oListen' }] });
  I({ id: 'oPoint', actor: O, kind: 'APPROACH', key: 'K4', t0: K('K4').win[0], t1: K('K4').win[1], target: door, label: 'turns to the door and points them to it', because: [{ id: 'oOrder' }] });
  for (const [s, j] of [[Pm, 0], [Md, 1]]) {
    I({ id: 'up' + j, actor: s, kind: 'APPROACH', key: 'K4', t0: K('K4').win[0], t1: K('K4').win[1], target: door, label: 'gets up off his knees', because: [{ id: 'oOrder', latency: 0.3 + 0.15 * j }] });
    I({ id: 'out' + j, actor: s, kind: 'APPROACH', key: 'K4a', t0: K('K4a').win[0], t1: K('K4a').win[1], target: door, label: 'out of the door into the courtyard', because: [{ id: 'up' + j }] });
    I({ id: 'gone' + j, actor: s, kind: 'APPROACH', key: 'K5', t0: K('K5').win[0], t1: K('K5').win[1], target: door, label: 'gone out', because: [{ id: 'out' + j }] });
    H({ id: 'hOut' + j, actor: s, t0: q(K('K4').win[1] + 0.05), t1: q(K('K4a').win[0] - 0.05), reason: 'looking back at the king as he goes, still afraid', params: { look: [[O, 1.0], [door, 1.0]], weight: true }, because: [{ id: 'up' + j }] });
    H({ id: 'hDoor' + j, actor: s, t0: q(K('K4a').win[1] + 0.05), t1: q(K('K5').win[0] - 0.05), reason: 'at the door, a last look back', params: { look: [[O, 1.4]], weight: true }, because: [{ id: 'out' + j }] }); }
  I({ id: 'tStep', actor: Tm, kind: 'APPROACH', key: 'K4', t0: K('K4').win[0], t1: K('K4').win[1], target: O, label: 'steps aside to let the herald by', because: [{ id: 'up1', latency: 0.2 }] });
  H({ id: 'hT4', actor: Tm, t0: q(K('K4').win[1] + 0.1), t1: q(K('K5').win[0] - 0.1), reason: 'he watches the two go out', params: { look: [[Md, 1.6], [Pm, 1.2], [O, 1.0]], weight: true }, because: [{ id: 'tStep' }] });
  I({ id: 'oDoor', actor: O, kind: 'APPROACH', key: 'K4a', t0: K('K4a').win[0], t1: K('K4a').win[1], target: door, label: 'the sword down: he watches them out', because: [{ id: 'out0' }] });
  H({ id: 'hO5', actor: O, t0: q(c5.at + c5.dur + 0.1), t1: q(K('K5').win[0] - 0.1), reason: 'he watches them out of the door', params: { look: [[Pm, 1.4], [Md, 1.4]], weight: true }, because: [{ id: 'oOrder' }] });
  /* ── the search ── */
  stimuli.push({ id: 'sClear', t0: q(K('K5').win[0]), t1: q(K('K5').win[0] + 0.4), kind: 'SIGHT', label: 'the spared are out: the hall is theirs', actor: O, because: [{ id: 'gone0' }, { id: 'v' + c6.gi, rel: 'realises' }] });
  for (const [s, j, tg] of [[O, 0, [0, 40, -150]], [Tm, 1, [-280, 40, -160]], [Eu, 2, [300, 40, 120]], [Ph, 3, [200, 40, -150]]]) {
    I({ id: 'srGo' + j, actor: s, kind: 'APPROACH', key: 'K5', t0: K('K5').win[0], t1: K('K5').win[1], target: tg, label: 'into the hall to search it', because: [{ id: 'sClear', latency: 0.2 + 0.15 * j }] });
    I({ id: 'sr' + j, actor: s, kind: 'SEARCH', t0: q(K('K5').win[1] + 0.1 + 0.2 * j), t1: T, label: 'any man still hiding, still alive?', because: [{ id: 'srGo' + j }] }); }
  return {
    type: 'fight', title: 'The Hall Is Cleared: the aegis, four blows, the priest, the bard and the herald spared',
    actors: { [O]: { role: 'the king', body: 'minifig', principal: true }, [Tm]: { role: 'the son', body: 'minifig', principal: true }, [Eu]: { role: 'the swineherd', body: 'minifig' }, [Ph]: { role: 'the stockman', body: 'minifig' },
      [Le]: { role: 'the suitors\' priest', body: 'minifig', principal: true }, [At]: { role: 'the goddess with the aegis', body: 'minifig' }, [Pm]: { role: 'the bard', body: 'minifig' }, [Md]: { role: 'the herald', body: 'minifig' },
      ...Object.fromEntries(S.map(s => [s, { role: 'a suitor', body: 'minifig', group: 'suitors' }])) },
    objects: { aegis: { kind: 'aegis', material: 'divine', holder: At + ':L', affords: ['terrify'] }, sword: { kind: 'sword', material: 'weapon', holder: O + ':R', affords: ['strike'] }, door: { kind: 'door', material: 'door', at: door, exit: true, affords: ['flee', 'leave'] }, lyre: { kind: 'lyre', material: 'wood', holder: Pm + ':R', affords: ['plead'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'clear the hall: none of them leaves alive who wronged the house', [At]: 'break their courage', [Le]: 'live', [Pm]: 'live', [Md]: 'live', [S1]: 'live' },
      couplings: [{ from: At, to: 'aegis', via: 'divine' }, ...kills.map((k, n) => ({ from: k.by, to: k.v, via: 'weapon', t0: q(W(k.fall)[0] - 0.6), t1: q(W(k.fall)[0] + 0.3) })), { from: O, to: Le, via: 'weapon', t0: tCut, t1: q(tCut + 0.9) }],
      causal: { tau: 0.7, actions: {
        ...Object.fromEntries(S.map((s, n) => [s, [{ a: 'stand and feast', base: -1.0, f: { 'after:sAegis': -3 } }, { a: 'run for the door', base: -1.2, f: { 'after:sAegis': 1.6, 'near:door:3': 0.5, ['threat:' + O]: -0.8 }, uses: ['door'] },
          { a: 'cower', base: -0.5, f: { 'after:sAegis': 1.8, ['threat:' + kills.find(k => k.v === s).by]: 0.6 } }, { a: 'beg', base: -2.0, f: { 'after:hit0': 1.2 } }, { a: 'fight bare-handed', base: -2.5, f: { 'after:sAegis': -1.0 } }]])),
        [Le]: [{ a: 'cower', base: 0.5, f: { 'after:sAegis': 1.0, 'after:sAlone': -2.5 } }, { a: 'beg at the knees', base: -1.5, f: { 'after:sAlone': 3.0 } }, { a: 'run', base: -2.0, f: { 'after:sAegis': 0.6, ['threat:' + O]: -1.0 } }],
        [Pm]: [{ a: 'wait by the high seat', base: 0.8, f: { 'after:hitLe': -1.5 } }, { a: 'run for the altar in the court', base: -1.0, f: { 'after:sAegis': 0.5, 'after:hitLe': 0.6 } }, { a: 'kneel to the king', base: -1.6, f: { 'after:hitLe': 2.6, 'after:oOrder': -3 } }, { a: 'go out', base: -3, f: { 'after:oOrder': 5 } }],
        [Md]: [{ a: 'lie hidden', base: 1.0, f: { 'after:sBardGoes': -2.0 } }, { a: 'crawl to the son', base: -2.0, f: { 'after:sBardGoes': 3.2 } }, { a: 'go out', base: -3, f: { 'after:oOrder': 5 } }],
        [O]: [{ a: 'strike the nearest', base: 0.5, f: { 'after:sOpen': 1.5, 'after:die0': -1.5 } }, { a: 'kill the priest', base: -1.5, f: { 'after:lePlead': 1.2, 'after:sPriest': 2.5, 'after:hitLe': -4 } }, { a: 'spare', base: -1.5, f: { 'after:sSon': 3.0 } }, { a: 'search', base: -2.5, f: { 'after:sClear': 4 } }],
        [Tm]: [{ a: 'strike', base: 0.0, f: { 'after:sOpen': 1.4, 'after:die1': -2 } }, { a: 'guard', base: 0.0, f: { 'after:die1': 1.5 } }, { a: 'speak for them', base: -2.0, f: { 'after:mdPlead': 3.0 } }, { a: 'search', base: -2.5, f: { 'after:sClear': 4 } }] } } },
  };
};
