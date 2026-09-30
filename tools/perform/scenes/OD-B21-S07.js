/* The Bow Sings (OD-B21-S07, Odyssey 21): the beggar strings the bow, the string sings, Zeus thunders, Telemachus arms and comes to
   his side, the arrow goes through the twelve axes, and the king tells his son it is the hour for supper.

   The bow is the actor, and the beggar's stoop falls away as he handles it. Odysseus turns the bow over in his hands (the suitors
   watch him, mocking); he braces the lower horn on his thigh and strings it without effort, as a bard strings a lyre (STRING_BOW: the
   bends, the loop run up to its notch; a STRUNG sight); the suitors go pale at it (REACT). He plucks the string (PLUCK: a SOUND, the
   note like a swallow's); they startle and hold their breath (a HOLD with the reason, frozen); Zeus answers with thunder (a SOUND caused
   by the note: the sign); Odysseus lifts his face to it, glad; the suitors flinch. Telemachus girds on his sword and takes his spear
   (ARM) and crosses to his father's side (the layout's walk at K3), then holds there armed to the end. Odysseus takes an arrow, nocks,
   draws and looses (SHOOT) through the twelve axe-rings; the room is struck dumb (SHAME: the eyes drop). At K5 he steps down from the
   threshold and speaks to his son (DECLARE on the line's stresses); Telemachus listens.

   The beggar's posture: a slump held from the start, left slowly as the stringing goes on (POSTURE slump, left over the bends), so by
   the note he stands as a king. The causal model: each suitor's options (mock, watch, go pale, look to the door, beg) turn on the
   strung bow, the note and the thunder. */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K3 = K('K3'), K5 = K('K5'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', Tm = 'telemachus', S = Object.keys(M.H).filter(i => /suitor/.test(i));
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c3 = clip(3), c5 = clip(5), c6 = clip(6), c7 = clip(7), c8 = clip(8);
  const V1 = X.voiceOf(c1), V3 = X.voiceOf(c3), V5 = X.voiceOf(c5), V7 = X.voiceOf(c7), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tString = q(w(V1, 'strings', 1.5)), tStrung = q(w(V1, 'lyre', 8.1) + 0.6), tPluck = q(w(V3, 'hear', 10.4) - 0.1), tThunder = q(c5.at - 0.1), tSign = q(w(V5, 'sign', 19.1));
  const tNock = q(w(V7, 'nocks', 33.6)), tLoose = q(w(V7, 'shoots', 36.5) - 0.2), axes = [0, 50, -150], sky = [0, 2000, 150];
  /* ── the hall: the suitors watch the beggar with the bow ── */
  stimuli.push({ id: 'sHall', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'the hall: the suitors at their tables, the beggar with the bow no one could string', because: [] });
  S.forEach((s, k) => holds.push({ id: 'hMock' + k, actor: s, t0: 0.3, t1: tStrung - 0.2, reason: 'watching the beggar fumble with the king\'s bow: a joke to them', params: { look: [[O, 2.4], [S[(k + 1) % S.length], 1.0], [O, 1.8]], weight: true, offset: 0.3 * k }, because: [{ id: 'sHall' }] }));
  /* ── Odysseus: the bow in his hands; the stoop falls away ── */
  I({ id: 'oStoop', actor: O, kind: 'POSTURE', t0: 0.2, t1: tString + 2.5, label: 'the beggar\'s stoop, left as the bow comes to his hands', params: { to: 'slump', enter: 0.3, leave: 3.0 }, because: [{ id: 'sHall' }] });
  I({ id: 'oTurnBow', actor: O, kind: 'ATTEND', target: [0, 30, 205], t0: 0.6, t1: tString, label: 'turns the bow over in his hands: the horn, the grip, the worm-holes', params: { track: true }, because: [{ id: 'v1', rel: 'realises' }] });
  I({ id: 'oString', actor: O, kind: 'STRING_BOW', t0: tString, t1: tStrung, label: 'strings it without effort, as a bard strings a lyre', params: { bends: 3, strungId: 'sStrung' }, because: [{ id: 'oTurnBow' }] });
  S.forEach((s, k) => I({ id: 'iPale' + k, actor: s, kind: 'REACT', t0: tStrung + 0.15 + 0.08 * k, t1: tStrung + 1.4, label: 'goes pale: the bow is strung', params: { how: k % 2 ? 'lean' : 'nod', lookAt: O, latencyScale: 1.2 }, because: [{ id: 'sStrung' }] }));
  I({ id: 'oPluck', actor: O, kind: 'PLUCK', t0: tPluck, t1: tPluck + 1.6, label: 'tries the string with his finger', params: { soundId: 'sSing' }, because: [{ id: 'sStrung' }, { id: 'v3', rel: 'realises' }] });
  S.forEach((s, k) => { I({ id: 'iStartle' + k, actor: s, kind: 'REACT', t0: tPluck + 0.2 + 0.05 * k, t1: tPluck + 1.3, label: 'the note', params: { how: 'startle', lookAt: O }, because: [{ id: 'sSing' }] });
    holds.push({ id: 'hBreath' + k, actor: s, t0: tPluck + 1.4, t1: tThunder + 0.1, reason: 'dismay at the note: a held breath', params: { look: [[O, 3.0]], still: true, offset: 0.1 * k }, because: [{ id: 'iStartle' + k }] }); });
  holds.push({ id: 'hO1', actor: O, t0: tPluck + 1.7, t1: tThunder - 0.1, reason: 'listening to the note die away: it still sings', params: { look: [[Tm, 1.4], [S[0], 1.2], [Tm, 1.6]], weight: false }, because: [{ id: 'oPluck' }] });
  /* ── the thunder: Zeus's sign ── */
  stimuli.push({ id: 'sThunder', t0: tThunder, t1: tThunder + 1.4, kind: 'SOUND', label: 'thunder from a clear sky: Zeus\'s sign on the day', because: [{ id: 'sSing', latency: X.r3 ? X.r3(tThunder - tPluck) : tThunder - tPluck }] });
  I({ id: 'oSky', actor: O, kind: 'ATTEND', target: sky, t0: tThunder + 0.25, t1: tSign + 0.4, label: 'the face to the sky, glad of the sign', because: [{ id: 'sThunder' }, { id: 'v5', rel: 'realises' }] });
  S.forEach((s, k) => I({ id: 'iFlinch' + k, actor: s, kind: 'REACT', t0: tThunder + 0.15 + 0.07 * k, t1: tThunder + 1.4, label: 'the thunder', params: { how: 'flinch', lookAt: sky }, because: [{ id: 'sThunder' }] }));
  S.forEach((s, k) => holds.push({ id: 'hDismay' + k, actor: s, t0: tThunder + 1.5, t1: tLoose - 0.1, reason: 'dismayed: the sign is not for them', params: { look: [[O, 2.2], [S[(k + 2) % S.length], 0.9], ['the threshold wall', 1.1]], weight: true, offset: 0.25 * k }, because: [{ id: 'iFlinch' + k }] }));
  holds.push({ id: 'hO2', actor: O, t0: tSign + 0.5, t1: tNock - 0.2, reason: 'the bow in hand, the sign given: he waits for his son', params: { look: [[Tm, 1.8], [axes, 2.4]], weight: false }, because: [{ id: 'oSky' }] });
  /* ── Telemachus arms and comes to his side ── */
  holds.push({ id: 'hTm0', actor: Tm, t0: 0.3, t1: tThunder + 1.2, reason: 'at the far end of the hall, watching his father with the bow', params: { look: [[O, 2.6], [S[2], 1.0]], weight: true }, because: [{ id: 'sHall' }] });
  I({ id: 'tmArm', actor: Tm, kind: 'ARM', t0: tThunder + 1.4, t1: K3.win[0] - 0.1, label: 'girds on his sword, takes up his spear', params: { side: 'R' }, because: [{ id: 'sThunder' }] });
  I({ id: 'tmGo', actor: Tm, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: O, label: 'down the hall to his father\'s side', because: [{ id: 'tmArm' }, { id: 'v6', rel: 'realises' }] });
  S.forEach((s, k) => { if (k % 2 === 0) I({ id: 'iSeeTm' + k, actor: s, kind: 'ATTEND', target: Tm, t0: K3.win[0] + 0.2 * k, t1: K3.win[1], label: 'the son armed, going to the threshold', because: [{ id: 'tmGo' }] }); });
  holds.push({ id: 'hTm1', actor: Tm, t0: K3.win[1] + 0.2, t1: K5.win[0] - 0.1, reason: 'armed at his father\'s side: two men at the threshold', params: { look: [[S[0], 1.8], [S[3], 1.8], [O, 1.2]], weight: true }, because: [{ id: 'tmGo' }] });
  /* ── the shot through the axes ── */
  I({ id: 'oShoot', actor: O, kind: 'SHOOT', target: axes, t0: tNock, t1: tLoose + 1.6, label: 'through all twelve axes', params: { draw: 1.4, hold: Math.max(0.6, tLoose - tNock - 1.4), looseId: 'sLoose' }, because: [{ id: 'v7', rel: 'realises' }, { id: 'tmGo' }] });
  stimuli.push({ id: 'sThrough', t0: tLoose + 0.3, t1: tLoose + 0.9, kind: 'SIGHT', label: 'the arrow through every ring, and out at the far end', because: [{ id: 'sLoose' }] });
  S.forEach((s, k) => I({ id: 'iDumb' + k, actor: s, kind: 'SHAME', t0: tLoose + 0.6 + 0.1 * k, t1: K5.win[0] - 0.1, label: 'struck dumb: the mark is made', params: { lookAt: O, hold: 2.0 }, because: [{ id: 'sThrough' }] }));
  holds.push({ id: 'hO3', actor: O, t0: tLoose + 1.7, t1: K5.win[0] - 0.1, reason: 'the follow-through held: the bow over the room', params: { look: [[axes, 1.6], [S[1], 1.2], [S[4], 1.2]], weight: false }, because: [{ id: 'oShoot' }] });
  /* ── the word to his son ── */
  I({ id: 'oDown', actor: O, kind: 'APPROACH', key: 'K5', t0: K5.win[0], t1: K5.win[1], target: Tm, label: 'turns to his son', because: [{ id: 'hO3' }] });
  I({ id: 'tmCome', actor: Tm, kind: 'APPROACH', key: 'K5', t0: K5.win[0], t1: K5.win[1], target: O, label: 'to his father', because: [{ id: 'oDown' }] });
  I({ id: 'oDecl', actor: O, kind: 'DECLARE', target: Tm, utterance: c8.gi, t0: c8.at - 0.3, t1: c8.at + c8.dur, label: 'the stranger has not disgraced you: now supper, and after supper other sport', params: { shapes: ['open', 'chest', 'point', 'open', 'chop'], side: 'R' }, because: [{ id: 'v' + c8.gi, rel: 'realises' }, { id: 'tmCome' }] });
  I({ id: 'tmListen', actor: Tm, kind: 'LISTEN', target: O, t0: c8.at, t1: c8.at + c8.dur, label: 'hears what his father means by "sport"', params: { nods: [q(c8.at + 3.4), q(c8.at + 6.6)] }, because: [{ id: 'oDecl' }] });
  S.forEach((s, k) => holds.push({ id: 'hEnd' + k, actor: s, t0: K5.win[1] + 0.3, t1: T, reason: 'the bow strung and the mark made: they do not understand yet', params: { look: [[O, 2.4], [S[(k + 1) % S.length], 0.8]], weight: true, offset: 0.2 * k }, because: [{ id: 'iDumb' + k }] }));
  return {
    type: 'revelation', title: 'The Bow Sings: the string, the thunder, the axes',
    actors: { [O]: { role: 'the king as a beggar', body: 'minifig', principal: true, affect: { weight: 0.3, cunning: 0.7 } }, [Tm]: { role: 'the son', body: 'minifig', principal: true }, ...Object.fromEntries(S.map(s => [s, { role: 'a suitor', body: 'minifig', group: 'suitors' }])) },
    objects: { bow: { kind: 'bow', material: 'weapon', holder: O + ':L', affords: ['string', 'pluck', 'shoot'] }, axes: { kind: 'axes', material: 'iron', at: axes, affords: ['mark'] }, sword: { kind: 'sword', material: 'weapon', holder: Tm + ':R', affords: ['arm'] }, door: { kind: 'door', material: 'door', at: [0, 60, 262], exit: true, affords: ['flee'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'string the bow, make the mark, give no sign too soon', [Tm]: 'stand by his father armed', [S[0]]: 'win the queen' },
      couplings: [{ from: O, to: 'bow', via: 'weapon' }, { from: 'bow', to: 'axes', via: 'weapon', t0: tLoose, t1: tLoose + 0.9 }],
      causal: { tau: 0.7, actions: {
        ...Object.fromEntries(S.map((s, k) => [s, [{ a: 'mock the beggar', base: 1.0, f: { 'after:sStrung': -2.6 } }, { a: 'watch the bow', base: -0.4, f: { 'after:sStrung': 1.4, 'after:sSing': 0.6 } },
          { a: 'go pale', base: -2.4, f: { 'after:sStrung': 2.0, 'after:sThunder': 1.0 } }, { a: 'look to the door', base: -2.8, f: { 'after:sThunder': 1.4, 'after:sThrough': 1.2, ['threat:' + O]: 0.6 }, uses: ['door'] },
          { a: 'look to the walls for arms', base: -3.0, f: { 'after:sThrough': 1.6 } }]])),
        [O]: [{ a: 'play the beggar', base: 1.0, f: { 'after:sStrung': -2.4 } }, { a: 'try the string', base: -1.5, f: { 'after:sStrung': 2.6, 'after:sSing': -3 }, uses: ['bow'] }, { a: 'wait for the sign', base: -1.0, f: { 'after:sSing': 2.0, 'after:sThunder': -2.5 } },
          { a: 'shoot the axes', base: -2.5, f: { 'after:sThunder': 1.6, ['near:' + Tm + ':2']: 1.4, 'after:sThrough': -4 }, uses: ['bow', 'axes'] }, { a: 'speak to his son', base: -2.8, f: { 'after:sThrough': 3.0 } }],
        [Tm]: [{ a: 'watch', base: 1.0, f: { 'after:sThunder': -1.5 } }, { a: 'arm', base: -2.0, f: { 'after:sThunder': 2.6, 'intent:ARM': 1.0 }, uses: ['sword'] }, { a: 'go to his father', base: -2.2, f: { 'after:sThunder': 1.8, 'intent:APPROACH': 1.6 } }, { a: 'stand armed', base: -1.5, f: { ['near:' + O + ':2']: 2.6 } }],
      } },
      camera: { follow: true },
    },
  };
};
