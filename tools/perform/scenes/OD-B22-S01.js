/* The Hall (OD-B22-S01, Odyssey 22): choreography by causal chain, with the combat vocabulary. Odysseus strips off the rags, leaps
   onto the threshold and pours out the arrows; Antinous lifts his cup; the bow is drawn and loosed; the arrow takes him in the throat;
   he staggers and falls across his table; the table goes over and the food and wine spill; the suitor beside it recoils from the spill
   and runs; the room turns; they tell each other it was an accident; they search the walls for the weapons Telemachus took down; they
   turn back to the man on the threshold, whose bow is over the room and who stands in the only door; he names himself.

   The chain across bodies (each caused by the one before, with its latency): LOOSE (Odysseus) -> IMPACT (Antinous) -> FALL
   (Antinous) -> TABLE OVER (the set) -> RECOIL (suitor 4) -> FLIGHT (suitor 4, the layout's run) -> the room's STARTLE -> SEARCH ->
   RETARGET (every suitor back to the threshold) -> DECLARE (Odysseus) -> SEPARATION (they back away as he names himself). The door
   is blocked by his body (a SET event): every suitor's options narrow (their causal entropy falls): causal constriction. */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5'), T = M.total;
  const O = 'odysseus-revealed', A = 'antinous', Tm = 'telemachus', S = ['suitors-1', 'suitors-2', 'suitors-3', 'suitors-4', 'suitors-5'];
  const c1 = M.clips.find(c => c.gi === 1), c2 = M.clips.find(c => c.gi === 2), c3 = M.clips.find(c => c.gi === 3), c4 = M.clips.find(c => c.gi === 4), line = M.clips.find(c => c.gi === 6);
  const V1 = X.voiceOf(c1), V2 = X.voiceOf(c2), V3 = X.voiceOf(c3), V4 = X.voiceOf(c4), VL = X.voiceOf(line), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const q = t => Math.round(t * 12) / 12;
  const door = [0, 60, 262];
  /* ── the threshold ── */
  stimuli.push({ id: 'sFeast', t0: 0.05, t1: 0.2, kind: 'SCENE', label: 'the suitors at their feast in Odysseus\'s hall', because: [] });
  I({ id: 'iStrip', actor: O, kind: 'STRIP', t0: q(w(V1, 'strips', 1.5)) - 0.2, t1: q(w(V1, 'strips', 1.5)) + 1.8, label: 'strips off the rags', because: [{ id: 'v1', rel: 'realises' }] });
  I({ id: 'iLeap', actor: O, kind: 'LEAP', t0: q(w(V1, 'leaps', 3.4)), t1: q(w(V1, 'leaps', 3.4)) + 2.0, label: 'onto the threshold', params: { landId: 'sLand' }, because: [{ id: 'iStrip' }] });
  stimuli.push({ id: 'sDoor', t0: q(w(V1, 'leaps', 3.4)) + 0.9, t1: T, kind: 'SET', label: 'the only door: he stands in it', actor: O, because: [{ id: 'iLeap' }] });
  I({ id: 'iPour', actor: O, kind: 'POUR_OUT', t0: q(w(V1, 'pours', 6.6)), t1: q(w(V1, 'pours', 6.6)) + 2.2, label: 'the arrows before his feet', because: [{ id: 'iLeap' }] });
  /* the room hears him land; most do not look (a feast); the near ones glance */
  S.forEach((s, k) => { if (k === 3 || k === 4) I({ id: 'iGl' + k, actor: s, kind: 'REACT', t0: q(w(V1, 'leaps', 3.4)) + 0.9, t1: q(w(V1, 'leaps', 3.4)) + 2.5, label: 'a glance at the beggar on the threshold', params: { how: 'turn', lookAt: O }, because: [{ id: 'sLand' }] }); });
  S.forEach((s, k) => holds.push({ id: 'hFeast' + k, actor: s, t0: 0.3, t1: 15.2, reason: 'feasting: the beggar is nothing to them', params: { look: [[S[(k + 1) % 5], 2.2], [A, 1.8], [S[(k + 4) % 5], 1.6]], weight: true, offset: 0.35 * k }, because: [{ id: 'sFeast' }] }));
  holds.push({ id: 'hTm1', actor: Tm, t0: 0.3, t1: K2.win[0] - 0.1, reason: 'beside his father at the door, the spear ready', params: { look: [[O, 1.6], [A, 2.2], [S[3], 1.4]], weight: true }, because: [{ id: 'sFeast' }] });
  /* ── the cup, the draw, the loose ── */
  const tDraw = q(w(V2, 'shoots', 13.0)) - 0.5, tLoose = q(w(V2, 'throat', 15.1)) - 0.1;
  holds.push({ id: 'hA1', actor: A, t0: 0.3, t1: tLoose, reason: 'at ease at his table, the cup in his hand', params: { look: [[S[4], 2.4], [S[3], 2.0]], weight: true, grip: 'R' }, because: [{ id: 'sFeast' }] });
  I({ id: 'iCup', actor: A, kind: 'DRINK', t0: tLoose - 2.2, t1: tLoose + 0.2, label: 'lifts the golden cup to drink', params: { at: [tLoose - 1.4] }, because: [{ id: 'hA1' }] });
  I({ id: 'iAim', actor: O, kind: 'SHOOT', t0: tDraw, t1: tLoose + 1.6, target: A, label: 'at Antinous', params: { draw: 1.0, hold: tLoose - tDraw - 1.0, looseId: 'sLoose' }, because: [{ id: 'iPour' }] });
  I({ id: 'iHit', actor: A, kind: 'IMPACT', t0: tLoose + 0.1, t1: K3.win[0], label: 'the arrow through the throat: the cup falls, the hand to the wound', params: { until: K3.win[0] }, because: [{ id: 'sLoose' }] });
  stimuli.push({ id: 'sCupFalls', t0: tLoose + 0.3, t1: tLoose + 0.6, kind: 'SOUND', label: 'the cup rings on the floor', actor: A, because: [{ id: 'iHit' }] });
  I({ id: 'iFall', actor: A, kind: 'FALL', t0: K3.win[0], t1: K3.win[1], label: 'falls across the table', params: { key: 'K3' }, because: [{ id: 'iHit' }] });
  holds.push({ id: 'hDead', actor: A, t0: K3.win[1] + 1.0, t1: T, reason: 'dead across his table', params: { still: true }, because: [{ id: 'iFall' }] });
  stimuli.push({ id: 'sTable', t0: q(X.lerp ? K3.win[0] + 1.8 : K3.win[0] + 1.8), t1: K3.win[0] + 2.2, kind: 'SET', label: 'the table goes over: food and wine across the floor', actor: A, because: [{ id: 'iFall' }] });
  /* ── the room: startle, the spill, the flight ── */
  S.forEach((s, k) => I({ id: 'iSt' + k, actor: s, kind: 'REACT', t0: tLoose + 0.2 + 0.06 * k, t1: tLoose + 2.2, label: 'the bowstring, a man down', params: { how: 'startle', lookAt: A }, because: [{ id: 'sLoose' }] }));
  I({ id: 'iSpill', actor: S[3], kind: 'RECOIL', t0: K3.win[0] + 2.0, t1: K3.win[0] + 3.3, label: 'back from the spill', params: { from: A }, because: [{ id: 'sTable' }] });
  I({ id: 'iRun4', actor: S[3], kind: 'APPROACH', t0: K3.win[0], t1: K3.win[1], key: 'K3', target: [-251, 40, 28], label: 'runs from it, across the hall', because: [{ id: 'iSpill', rel: 'anticipates' }] });
  for (const k of [2, 4]) I({ id: 'iMv' + k, actor: S[k], kind: 'APPROACH', t0: K3.win[0], t1: K3.win[1], key: 'K3', target: A, label: 'away from the dying man', because: [{ id: 'iSt' + k }] });
  /* the room erupts: they stare at the dead man and at each other: who shot? (a hold with its reason, until they turn to each other) */
  S.forEach((s, k) => holds.push({ id: 'hErupt' + k, actor: s, t0: tLoose + 2.3, t1: K4.win[0] - 1.1, reason: 'the room erupts: who shot him?', params: { look: [[A, 1.4], [S[(k + 1) % 5], 1.0], [O, 1.2], [S[(k + 3) % 5], 0.9]], weight: true, offset: 0.2 * k }, because: [{ id: 'iSt' + k }] }));
  /* ── "an accident": they turn to each other; the search; back to him ── */
  /* the voice tells it after the fact (31.4 s); in the room the turn to each other comes before the search the layout starts at K4 */
  const tAcc = q(K4.win[0] - 1.0);
  S.forEach((s, k) => I({ id: 'iAcc' + k, actor: s, kind: 'GESTURE', t0: tAcc - 1.2 + 0.25 * k, t1: tAcc + 1.2, label: 'it was a mistake: the open hand', params: { shape: k % 2 ? 'open' : 'dismiss', at: tAcc - 0.9 + 0.25 * k, side: 'R', amp: 0.9, hold: 0.6 }, because: [{ id: 'sTable' }] }));
  S.forEach((s, k) => { I({ id: 'iWall' + k, actor: s, kind: 'APPROACH', t0: K4.win[0], t1: K4.win[1], key: 'K4', target: [s === S[2] || s === S[3] ? 300 : -330, 80, 0], label: 'to the walls where the arms hung', because: [{ id: 'iAcc' + k }] });
    I({ id: 'iSearch' + k, actor: s, kind: 'SEARCH', t0: K4.win[1] + 0.1, t1: K5.win[0] - 0.1, label: 'no shield, no spear on the walls', because: [{ id: 'iWall' + k }] });
    stimuli.push({ id: 'sEmpty' + k, t0: K4.win[1] + 1.4 + 0.3 * k, t1: K4.win[1] + 1.7 + 0.3 * k, kind: 'SIGHT', label: 'the pegs are bare', actor: s, because: [{ id: 'iSearch' + k }] });
    I({ id: 'iRet' + k, actor: s, kind: 'RETARGET', t0: K5.win[0] - 0.9 + 0.12 * k, t1: K5.win[0] + 1.2, target: O, label: 'back to the man on the threshold', because: [{ id: 'sEmpty' + k }] });
    I({ id: 'iBack' + k, actor: s, kind: 'APPROACH', t0: K5.win[0], t1: K5.win[1], key: 'K5', target: O, label: 'toward the door, and stop', because: [{ id: 'iRet' + k }] }); });
  /* ── Odysseus: the bow over the room; Telemachus to his side ── */
  I({ id: 'iRec', actor: O, kind: 'RECOVER', t0: tLoose + 1.7, t1: tLoose + 2.8, label: 'the next arrow', because: [{ id: 'sLoose' }] });
  I({ id: 'iThreat', actor: O, kind: 'THREAT', t0: tLoose + 2.8, t1: line.at - 0.4, target: S[2], label: 'the bow over the room', params: { side: 'L' }, because: [{ id: 'iRec' }] });
  holds.push({ id: 'hBow', actor: O, t0: tLoose + 3.0, t1: line.at - 0.3, reason: 'in the door with the bow: he lets them see it', params: { look: [[S[3], 1.8], [S[0], 1.6], [S[2], 1.6], [A, 1.2]], weight: false }, because: [{ id: 'iThreat' }] });
  I({ id: 'iTmGo', actor: Tm, kind: 'APPROACH', t0: K2.win[0], t1: K2.win[1], key: 'K2', target: S[0], label: 'to cover the left of the hall', because: [{ id: 'iAim', rel: 'anticipates' }] });
  holds.push({ id: 'hTm2', actor: Tm, t0: K2.win[1] + 0.2, t1: K5.win[0] - 0.1, reason: 'guards the left of the hall, the spear low', params: { look: [[S[0], 1.8], [S[1], 1.8], [O, 1.2]], weight: true }, because: [{ id: 'iTmGo' }] });
  I({ id: 'iTmBack', actor: Tm, kind: 'APPROACH', t0: K5.win[0], t1: K5.win[1], key: 'K5', target: O, label: 'back to his father\'s side', because: [{ id: 'iBack0' }] });
  /* ── the declaration, and the room backing from it ── */
  I({ id: 'iDecl', actor: O, kind: 'DECLARE', t0: line.at - 0.4, t1: line.at + line.dur, target: S[2], utterance: line.gi, label: 'you dogs', params: { shapes: ['point', 'chop', 'fist', 'point', 'chop'], side: 'R' }, because: [{ id: 'v' + line.gi, rel: 'realises' }, { id: 'iBack2' }] });
  const tDogs = q(w(VL, 'dogs', 38.6)), tTroy = q(w(VL, 'troy', 44.4));
  S.forEach((s, k) => { I({ id: 'iSep' + k, actor: s, kind: 'SEPARATION', t0: tDogs + 0.3 + 0.12 * k, t1: tDogs + 1.6, label: 'back a step at "dogs"', params: { from: O }, because: [{ id: 'v' + line.gi + 'p1' }] });
    holds.push({ id: 'hKnow' + k, actor: s, t0: K5.win[1] + 0.3, t1: T, reason: 'the name: they know him now, and there is no way out', params: { look: [[O, 3.0], [S[(k + 2) % 5], 0.8]], weight: true, offset: 0.2 * k }, because: [{ id: 'iDecl' }] });
    if (k % 2 === 0) I({ id: 'iTroy' + k, actor: s, kind: 'REACT', t0: tTroy + 0.1, t1: tTroy + 1.5, label: '"Troy": he is Odysseus', params: { how: 'flinch', lookAt: O }, because: [{ id: 'v' + line.gi + 'p3' }] }); });
  holds.push({ id: 'hTm3', actor: Tm, t0: K5.win[1] + 0.3, t1: T, reason: 'at his father\'s side while he speaks', params: { look: [[S[2], 2.0], [O, 1.4], [S[0], 1.8]], weight: true }, because: [{ id: 'iTmBack' }] });
  return {
    type: 'fight', title: 'The Hall: the bow, the fall, the name',
    actors: { [O]: { role: 'the king, revealed', body: 'minifig', principal: true }, [A]: { role: 'the first suitor', body: 'minifig', principal: true }, [Tm]: { role: 'the son', body: 'minifig' }, ...Object.fromEntries(S.map(s => [s, { role: 'a suitor', body: 'minifig', group: 'suitors' }])) },
    objects: { bow: { kind: 'bow', material: 'weapon', holder: O + ':L', affords: ['shoot'] }, table: { kind: 'table', material: 'wood', at: [200, 45, -75], affords: ['overturn', 'shield'] }, door: { kind: 'door', material: 'door', at: door, exit: true, affords: ['flee'] }, walls: { kind: 'armoury', material: 'stone', at: [-330, 80, 0], affords: ['arm'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'kill them all; let none out of the door', [A]: 'drink', [S[0]]: 'live' },
      couplings: [{ from: O, to: 'bow', via: 'weapon' }, { from: 'bow', to: A, via: 'weapon', t0: tLoose, t1: tLoose + 0.6 }, { from: A, to: 'table', via: 'wood', t0: K3.win[0], t1: K3.win[1] + 1 }],
      causal: { tau: 0.7, actions: {
        ...Object.fromEntries(S.map(s => [s, [{ a: 'feast', base: 1.2, f: { 'after:sLoose': -2.5 } }, { a: 'flee by the door', base: -1.5, f: { 'after:sLoose': 1.5, 'near:door:3': 0.5, ['threat:' + O]: -0.6, 'after:sDoor': -1.2 }, uses: ['door'] },
          { a: 'arm from the walls', base: -2.0, f: { 'after:sLoose': 2.0, ['after:sEmpty' + S.indexOf(s)]: -3.5 }, uses: ['walls'] }, { a: 'hide behind a table', base: -2.2, f: { 'after:sLoose': 1.4, ['threat:' + O]: 0.8 }, uses: ['table'] },
          { a: 'rush him together', base: -2.8, f: { 'after:sLoose': 1.0, ['after:sEmpty' + S.indexOf(s)]: 0.8 } }, { a: 'beg', base: -3.0, f: { 'after:v6p1': 2.2, ['threat:' + O]: 0.6 } }]])),
        [O]: [{ a: 'wait in rags', base: 1.0, f: { 'after:sLand': -3 } }, { a: 'shoot Antinous', base: -1.0, f: { 'after:sLand': 2.2, 'after:sLoose': -4 }, uses: ['bow'] }, { a: 'shoot the next', base: -2.0, f: { 'after:sLoose': 2.4 }, uses: ['bow'] }, { a: 'hold the door', base: -0.5, f: { 'after:sDoor': 1.8 }, uses: ['door'] }, { a: 'name himself', base: -2.5, f: { 'after:iBack2': 3.0 } }],
        [Tm]: [{ a: 'stand by', base: 1.0, f: {} }, { a: 'guard the left', base: -0.8, f: { 'after:sLoose': 1.6 } }, { a: 'strike', base: -2.5, f: { 'after:sLoose': 0.8, ['threat:' + S[0]]: 1.0 } }] } } },
  };
};
