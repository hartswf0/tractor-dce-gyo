/* The Blinding of Polyphemus (OD-B09-S09, Odyssey 9): the four-needle coupled homeostat.

   The giant (a staged prop in the take: sprawled, then standing, then at the door) talks drunkenly from the ground, promises Nobody
   the last death, and sleeps. Odysseus waits for the wine to take him, signals; the four men and he go to the olive stake in the fire;
   it is turned until it glows; he decides; they carry it to the eye; the thrust; he twists it like a shipwright's auger while the men
   hold against it; the eye hisses; the giant wakes with a roar and tears it free; they are thrown back and scatter; the other Cyclopes
   call from outside; the men hide among the animals; Odysseus clings under the ram.

   The timings are not written here: they are the needles' (tools/perform/machinery.js blinding, run by homeostat.couple): the stake
   glows when ENVIRONMENT passes 0.6, Odysseus decides when ODYSSEUS passes 0.62 with the stake glowing, the thrust follows by the
   carry (4.4 s, the layout's own), POLYPHEMUS stirs past 0.2 and wakes past 0.5 (the roar), the CREW scatters past 0.7 after the roar or
   on Odysseus's command 2.5 s after it; before the thrust the CREW must stay under 0.55 (they would drop the stake). A variant
   (X.variant: 'wake-early' disturbs POLYPHEMUS with a bowl knocked over at 33 s; X.frozen: the uniselectors held) re-derives the
   whole scene from the new needles: the regulated re-choreography, or the failure. */
'use strict';
const Ho = require('../homeostat.js'), Ma = require('../machinery.js'), Ic = require('../intents-creature.js');
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5'), T = M.total;
  const variant = X.variant || null, frozen = !!X.frozen;
  const spec = Ma.blinding({ disturb: variant, K3: K3.win, total: T }), run = Ho.couple(spec, { frozen }), c = run.events;
  const O = 'odysseus', men = ['four-stake-bearers-1', 'four-stake-bearers-2', 'four-stake-bearers-3', 'four-stake-bearers-4'], hands = men.slice(0, 3);
  const giant = 'polyphemus', fire = 'fire', stake = 'stake', stone = 'stone';
  const talk = M.clips.find(c => c.gi === 2), outside = M.clips.find(c => c.gi === 7), V2 = X.voiceOf(talk), V7 = X.voiceOf(outside);
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), S_ = o => (stimuli.push(o), o.id);
  const q = t => Math.round(t * 12) / 12;
  /* the needles' crossings, as stimuli the scene answers (their causes: the unit that crossed, and what drove it) */
  const needle = (id, t, unit, label, because) => S_({ id, t0: q(t), t1: q(t) + 0.3, kind: 'NEEDLE', label: unit + ': ' + label, actor: null, because: because || [], params: { unit } });
  S_({ id: 'sTalk', t0: talk.at, t1: talk.at + talk.dur, kind: 'VOICE', label: 'the giant, drunk on the ground: "I eat Nobody last"', because: [{ id: 'v' + talk.gi, rel: 'realises' }] });
  for (const [k, w] of V2.words.filter(w => w.w === 'nobody').entries()) S_({ id: 'sNobody' + k, t0: q(w.t), t1: q(w.t) + 0.3, kind: 'WORD', label: '"Nobody" (the name he gave)', because: [{ id: 'sTalk' }] });
  const lastW = V2.words.find(w => w.w === 'last'); if (lastW) S_({ id: 'sLast', t0: q(lastW.t), t1: q(lastW.t) + 0.3, kind: 'WORD', label: '"I eat Nobody last"', because: [{ id: 'sTalk' }] });
  needle('sSleep', c.asleep, 'POLYPHEMUS', 'under -0.5: the neck hangs back, he sleeps', [{ id: 'sTalk' }]);
  if (variant === 'wake-early') S_({ id: 'sBowl', t0: 33.0, t1: 33.3, kind: 'SOUND', label: 'a bowl knocked over in the dark (the disturbance)', because: [] });
  if (c.stir) needle('sStir', c.stir, 'POLYPHEMUS', 'over 0.2: a groan, the great hand moves', variant === 'wake-early' && c.stir < (c.thrust || 99) ? [{ id: 'sBowl' }] : [{ id: 'iThrust' }]);
  for (const st of run.steps) S_({ id: 'sStep' + st.unit + Math.round(st.t * 12), t0: q(st.t), t1: q(st.t) + 0.2, kind: 'UNISELECTOR', label: st.unit + ' out of its limits ' + JSON.stringify(st.limits) + ' for its dwell: its uniselector steps to position ' + st.position + ' (new wiring ' + JSON.stringify(st.row.map(v => Math.round(v * 100) / 100)) + ')', because: c.stir ? [{ id: 'sStir' }] : [] });
  if (c.roar) needle('sRoar', c.roar, 'POLYPHEMUS', 'over 0.5: the roar, the rocks resound' + (c.failed ? ' (awake, and not blind)' : ''), c.failed ? [{ id: 'iDrop' }] : [{ id: 'iThrust' }]);
  S_({ id: 'sCall', t0: outside.at, t1: outside.at + outside.dur, kind: 'VOICE', label: 'the Cyclopes outside: "What ails you, Polyphemus?"', because: c.roar ? [{ id: 'sRoar' }] : [] });
  for (const [k, w] of V7.words.filter(w => w.w === 'nobody').entries()) S_({ id: 'sNobodyOut' + k, t0: q(w.t), t1: q(w.t) + 0.3, kind: 'WORD', label: '"If Nobody harms you"', because: [{ id: 'sCall' }] });

  /* ── before: the giant talks, they wait ── */
  holds.push({ id: 'hO1', actor: O, t0: 0.6, t1: c.asleep + 0.6, reason: 'waits for the wine to take him', params: { look: [[giant, 3.0], [men[0], 1.2], [giant, 2.4], [men[2], 1.0]], grip: 'R' }, because: [{ id: 'sTalk' }] });
  (V2.words.filter(w => w.w === 'nobody')).forEach((w, k) => I({ id: 'iNod' + k, actor: O, kind: 'REACT', t0: q(w.t) + 0.1, t1: q(w.t) + 1, label: 'the name taken: the smallest nod', params: { how: 'nod' }, because: [{ id: 'sNobody' + k }] }));
  men.forEach((m, k) => { holds.push({ id: 'hM' + k, actor: m, t0: 0.6, t1: K2.win[0] - 0.1, reason: 'by the flock, afraid of him', params: { look: [[giant, 2.6], [O, 1.4]], offset: 0.4 * k }, because: [{ id: 'sTalk' }] });
    if (lastW) I({ id: 'iFl' + k, actor: m, kind: 'REACT', t0: q(lastW.t) + 0.05 * k, t1: q(lastW.t) + 1.6, label: 'flinches at "last"', params: { how: 'flinch', lookAt: giant }, because: [{ id: 'sLast' }] }); });
  /* ── the signal, the stake in the fire ── */
  const tSig = Math.min(K2.win[0] - 0.3, c.asleep + 0.8);
  I({ id: 'iSig', actor: O, kind: 'SIGNAL', t0: tSig, t1: tSig + 1.6, label: 'now: to the stake', params: { how: 'go', to: men, lookAt: men[1], side: 'L' }, because: [{ id: 'sSleep' }] });
  I({ id: 'iGoO', actor: O, kind: 'APPROACH', t0: K2.win[0], t1: K2.win[1], key: 'K2', target: fire, label: 'to the fire', because: [{ id: 'iSig' }] });
  men.forEach((m, k) => I({ id: 'iGo' + k, actor: m, kind: 'APPROACH', t0: K2.win[0], t1: K2.win[1], key: 'K2', target: stake, label: 'to the stake', because: [{ id: 'iSig' }] }));
  const heatEnd = c.decide || c.brokeAt || K3.win[0];
  I({ id: 'iHeat', actor: O, kind: 'HEAT', t0: K2.win[1] + 0.1, t1: heatEnd, label: 'turns the stake in the fire until it glows', params: { glowAt: c.glow, glowId: 'sGlow' }, because: [{ id: 'iGoO' }] });
  holds.push({ id: 'hHeat', actor: O, t0: K2.win[1] + 0.2, t1: heatEnd - 0.05, reason: 'turning the stake in the fire until it glows, an eye on the sleeper', params: { look: [[fire, 1.8], [giant, 1.6], [men[1], 0.9]], weight: false, offset: 0.2 }, because: [{ id: 'iGoO' }] });
  I({ id: 'iSeeGlow', actor: O, kind: 'ATTEND', t0: c.glow + 0.3, t1: c.glow + 2, target: fire, label: 'the point glows', because: [{ id: 'sGlow' }] });
  men.forEach((m, k) => { holds.push({ id: 'hMS' + k, actor: m, t0: K2.win[1] + 0.2, t1: (c.decide || c.brokeAt || K3.win[0]) - 0.05, reason: 'hold the stake in the fire; watch him sleep', params: { look: [[giant, 2.2], [O, 1.3], [fire, 1.0]], offset: 0.3 * k }, because: [{ id: 'iGo' + k }] });
    I({ id: 'iBear' + k, actor: m, kind: 'CARRY', t0: K2.win[1] + 0.2, t1: c.thrust || c.brokeAt || K3.win[1], label: 'many hands on one stake', params: { with: men.filter(x => x !== m) }, because: [{ id: 'iGo' + k }] }); });
  /* ── the disturbance, answered (a variant) ── */
  if (variant === 'wake-early') {
    men.forEach((m, k) => I({ id: 'iFreeze' + k, actor: m, kind: 'REACT', t0: 33.0 + 0.05 * k, t1: 34.6, label: 'freeze at the clatter', params: { how: 'startle', lookAt: giant }, because: [{ id: 'sBowl' }] }));
    if (c.stir) I({ id: 'iHush', actor: O, kind: 'SIGNAL', t0: q(c.stir) + 0.25, t1: q(c.stir) + 1.9, label: 'hush: still', params: { how: 'hush', to: men, lookAt: men[1], side: 'L' }, because: [{ id: 'sStir' }] });
    for (const st of run.steps.filter(s => s.unit === 'CREW')) men.forEach((m, k) => I({ id: 'iSteady' + k + Math.round(st.t * 12), actor: m, kind: 'ATTEND', t0: q(st.t) + 0.1 + 0.08 * k, t1: q(st.t) + 2, target: O, label: 'steadied: they look to him, not to the giant', because: [{ id: 'sStep' + st.unit + Math.round(st.t * 12) }] }));
  }
  /* ── the decision, the carry, the thrust, the twist ── */
  if (c.decide) { I({ id: 'iDecide', actor: O, kind: 'SIGNAL', t0: q(c.decide), t1: q(c.decide) + 1.6, label: 'lift: to the eye', params: { how: 'go', to: men, lookAt: giant, side: 'L' }, because: [{ id: 'sGlow' }].concat(variant === 'wake-early' ? [{ id: 'sBowl' }] : []) });
    needle('sDecide', c.decide, 'ODYSSEUS', 'over 0.62 with the stake glowing: he decides', [{ id: 'sGlow' }]); }
  if (c.thrust) {
    /* the carry is the layout's (K3), retimed to start at the decision: earlier when he hurries, later when he waits */
    const delay = q(c.decide + 0.3 - K3.win[0]);
    for (const who of [O, ...hands]) { if (Math.abs(delay) > 0.1) I({ id: 'iRet' + who.slice(-1), actor: who, kind: 'RETIME', t0: Math.min(K3.win[0], K3.win[0] + delay), t1: Math.max(K3.win[1], K3.win[1] + delay), label: delay < 0 ? 'the carry, hurried' : 'held at the fire until he gives the word', params: { key: 'K3', delay }, because: [{ id: delay < 0 ? 'iDecide' : 'iHeat' }] });
      I({ id: 'iCarry' + who.slice(-1), actor: who, kind: 'APPROACH', t0: K3.win[0] + delay, t1: K3.win[1] + delay, key: 'K3', target: giant, label: 'the carry to the eye', because: [{ id: 'iDecide' }] }); }
    I({ id: 'iThrust', actor: O, kind: 'THRUST', t0: q(c.thrust), t1: q(c.thrust) + 0.6, target: giant, label: 'the point into the eye', params: { with: hands, impactId: 'cImpact' }, because: [{ id: 'iDecide' }] });
    hands.forEach((m, k) => I({ id: 'iThr' + k, actor: m, kind: 'THRUST', t0: q(c.thrust) + 0.04 * k, t1: q(c.thrust) + 0.6, target: giant, label: 'drive', params: { impact: false }, because: [{ id: 'iDecide' }] }));
    I({ id: 'iTwist', actor: O, kind: 'TWIST', t0: q(c.thrust) + 0.5, t1: (c.roar || c.thrust + 6) - 0.2, label: 'round and round', params: { period: 0.9 }, because: [{ id: 'cImpact' }] });
    hands.forEach((m, k) => I({ id: 'iHold' + k, actor: m, kind: 'STRAIN', t0: q(c.thrust) + 0.5, t1: c.roar || c.thrust + 6, label: 'bear on it', because: [{ id: 'cImpact' }] }));
    if (c.stir && c.stir > c.thrust) hands.forEach((m, k) => I({ id: 'iStirR' + k, actor: m, kind: 'REACT', t0: q(c.stir) + 0.05 * k, t1: q(c.stir) + 1.5, label: 'he moves under them', params: { how: 'flinch', lookAt: giant }, because: [{ id: 'sStir' }] }));
  }
  /* ── the failure (the crew broke before the thrust: a variant with the uniselectors held) ── */
  if (c.failed) {
    needle('sBreak', c.brokeAt, 'CREW', 'over 0.55 for 0.8 s before the thrust: they break', [{ id: 'sStir' }]);
    I({ id: 'iDrop', actor: men[0], kind: 'RECOIL', t0: q(c.brokeAt), t1: q(c.brokeAt) + 1.3, label: 'lets go of the stake', params: { from: giant }, because: [{ id: 'sBreak' }] });
    men.slice(1).forEach((m, k) => I({ id: 'iDrop' + k, actor: m, kind: 'RECOIL', t0: q(c.brokeAt) + 0.1 * (k + 1), t1: q(c.brokeAt) + 1.4, label: 'drops it and runs', params: { from: giant }, because: [{ id: 'iDrop' }] }));
    I({ id: 'iAlone', actor: O, kind: 'REACT', t0: q(c.brokeAt) + 0.2, t1: q(c.brokeAt) + 2, label: 'alone at the stake', params: { how: 'startle', lookAt: men[1] }, because: [{ id: 'iDrop' }] });
  }
  /* ── the roar, torn free, the scatter ── */
  if (c.roar) { for (const who of [O, ...men]) I({ id: 'iRec' + who.slice(-1), actor: who, kind: 'RECOIL', t0: q(c.roar) + 0.1, t1: q(c.roar) + 1.4, label: c.failed ? 'the roar' : 'torn free: thrown back', params: { from: giant }, because: [{ id: 'sRoar' }] }); }
  if (c.scatter) {
    const why = /command/.test(c.scatterWhy || '') ? 'iFlee' : c.failed ? 'sBreak' : 'sScatter';
    if (why === 'iFlee') I({ id: 'iFlee', actor: O, kind: 'SIGNAL', t0: q(c.scatter) - 0.3, t1: q(c.scatter) + 1.2, label: 'away, among the flock', params: { how: 'flee', to: men, lookAt: men[2], side: 'R' }, because: [{ id: 'sRoar' }] });
    else if (!c.failed) needle('sScatter', c.scatter, 'CREW', 'over 0.7 after the roar: they scatter', [{ id: 'sRoar' }]);
    const sd = q(c.scatter + 0.2 - K4.win[0]);
    for (const who of [O, ...men]) { const dly = sd + (who === O ? 0.3 : 0.08 * men.indexOf(who));
      if (Math.abs(dly) > 0.1) I({ id: 'iScatR' + who.slice(-1), actor: who, kind: 'RETIME', t0: Math.min(K4.win[0], K4.win[0] + dly), t1: Math.max(K4.win[1], K4.win[1] + dly), label: dly < 0 ? 'the scatter, sooner' : 'the scatter, on the word', params: { key: 'K4', delay: dly }, because: [{ id: why }] });
      I({ id: 'iScat' + who.slice(-1), actor: who, kind: 'APPROACH', t0: K4.win[0] + Math.min(0, dly), t1: K4.win[1] + Math.max(0, dly), key: 'K4', target: giant, label: 'scatter', because: [{ id: why }] }); }
  }
  /* ── hidden while the Cyclopes call; Odysseus under the ram ── */
  men.forEach((m, k) => { I({ id: 'iHide' + k, actor: m, kind: 'HIDE', t0: K4.win[1] + 0.1 + 0.2 * k, t1: (K5.win[0] + K5.win[1]) / 2, label: 'down among the animals', params: { from: giant, to: O }, because: [{ id: c.scatter ? 'iScat' + m.slice(-1) : 'sRoar' }] });
    holds.push({ id: 'hHide' + k, actor: m, t0: K4.win[1] + 0.3 + 0.2 * k, t1: (K5.win[0] + K5.win[1]) / 2,   /* until the layout takes them off (the K5 window's middle) */ reason: 'hidden among the animals, the breath held: the giant is listening', params: { weight: false }, because: [{ id: 'iHide' + k }] }); });
  holds.push({ id: 'hO2', actor: O, t0: K4.win[1] + 0.2, t1: K5.win[0] - 0.1, reason: 'listens at the stone: the Cyclopes outside', params: { look: [[stone, 2.6], [men[1], 1.2], [giant, 2.0]], weight: true }, because: [{ id: 'sCall' }] });
  V7.words.filter(w => w.w === 'nobody').forEach((w, k) => I({ id: 'iKnow' + k, actor: O, kind: 'ATTEND', t0: q(w.t) + 0.2, t1: q(w.t) + 1.8, target: men[1], label: 'a look to his men at "Nobody": the trick has held', because: [{ id: 'sNobodyOut' + k }] }));
  I({ id: 'iRam', actor: O, kind: 'APPROACH', t0: K5.win[0], t1: K5.win[1], key: 'K5', target: 'ram', label: 'under the ram', because: [{ id: 'sCall' }] });
  I({ id: 'iCling', actor: O, kind: 'CLING', t0: K5.win[1] + 0.1, t1: T, label: 'holds on under the ram as the giant\'s hands pass', because: [{ id: 'iRam' }] });
  holds.push({ id: 'hCling', actor: O, t0: K5.win[1] + 0.1, t1: T, reason: 'under the ram, still: the giant\'s hands pass over the fleece', params: { weight: false }, because: [{ id: 'iRam' }] });
  /* the giant as a creature (film-readymades/creatures.js, the polyphemus rig): placed over the take's piece (sprawled), the jaw on
     his own voice, asleep on the needle's crossing, the stir, the eye put out by the thrust, the roar on his feet at the K4 place, the
     heavy walk to the door, sitting there, the blind hands groping the backs of the flock. The take still shows its staged prop until the
     player loads the rig (film-readymades/CREATURES.md); the previz, the metrics and the heat use the rig. The sprawl is placed with its
     eye where the stake is driven (in front of and above Odysseus's perch at the thrust, along the take's aim). */
  const gScale = 1.6, placeK4 = [10, 0, -120, 0.35];   /* 1.6: the sprawled rig's eye at the height the take's stake is driven to (the prop is 1.25; its rams up to 2.6) */
  const placeK5 = Ic.place('polyphemus', gScale, 'sit', { center: [-40, 110], y: 0, h: 2.2 });
  const G = giant, gi = o => (intents.push({ actor: G, ...o }), o.id);
  gi({ id: 'gTalk', kind: 'TALK', t0: talk.at, t1: talk.at + talk.dur, utterance: talk.gi, label: 'the jaw on his drunken words', because: [{ id: 'sTalk' }] });
  gi({ id: 'gSleep', kind: 'SLEEP', t0: q(c.asleep), t1: q(c.roar || c.stir || T), label: 'the wine takes him: the eye shuts, the slow breath', because: [{ id: 'sSleep' }] });
  if (c.stir) gi({ id: 'gStir', kind: 'STIR', t0: q(c.stir), t1: q(c.stir) + 2, label: 'a groan; the great hand moves', because: [{ id: 'sStir' }] });
  if (c.thrust && !c.failed) gi({ id: 'gBlind', kind: 'BLINDED', t0: q(c.thrust) + 0.1, t1: q(c.roar || c.thrust + 4), label: 'the eye put out: the head thrown back, the hands to the face', because: [{ id: 'iThrust' }] });
  if (c.roar) gi({ id: 'gRoar', kind: 'ROAR', t0: q(c.roar), t1: Math.max(q(c.roar) + 3, K4.win[1]), label: c.failed ? 'awake, and seeing: the roar' : 'on his feet, the roar', params: { place: placeK4, rise: 1.4, ...(c.failed ? { eye: 0 } : {}) }, because: [{ id: 'sRoar' }] });
  gi({ id: 'gWalk', kind: 'WALK', t0: K5.win[0], t1: K5.win[1], label: 'the heavy walk to the door', params: { path: [[K5.win[0], placeK4[0], placeK4[2]], [K5.win[1], placeK5[0], placeK5[2]]] }, because: [{ id: c.roar ? 'sRoar' : 'sCall' }] });
  gi({ id: 'gSit', kind: 'POSE', t0: K5.win[1], t1: T, label: 'sits in the doorway', params: { preset: 'sit', fade: 0.8 }, because: [{ id: 'gWalk' }] });
  gi({ id: 'gGrope', kind: 'GROPE', t0: K5.win[1] + 0.6, t1: T, label: 'feels the backs of the rams as they pass', params: { center: [70, 40, 55], width: 110, depth: 30 }, because: [{ id: 'gSit' }] });
  /* the giant's arousal as his heat (he is a prop: his body is the needle) */
  const xs = run.x[1], hz = run.hz, sourceSeries = []; for (let i = 0; i < Math.floor(T * 12); i++) { const v = xs[Math.min(xs.length - 1, Math.round(i / 12 * hz))]; sourceSeries.push(Math.round(Math.max(0, v + 0.2) * 2.5 * 1000) / 1000); }
  const giantTrack = [[0, [-15, 70, -165]], [K4.win[0] + (K4.win[1] - K4.win[0]) / 2, [10, 150, -120]], [K5.win[0] + (K5.win[1] - K5.win[0]) / 2, [-40, 60, 110]]];
  return {
    type: 'revelation', title: 'The Blinding of Polyphemus' + (variant ? ' (' + variant + (frozen ? ', uniselectors held' : ', regulated') + ')' : ''),
    actors: { [O]: { role: 'the leader', body: 'minifig', principal: true }, ...Object.fromEntries(men.map(m => [m, { role: 'a stake-bearer', body: 'minifig', group: 'crew' }])), [giant]: { role: 'the giant (a staged prop: his body is the POLYPHEMUS needle)', body: 'prop' } },
    objects: { [giant]: { kind: 'giant', material: 'flesh', track: giantTrack, sourceSeries, affords: ['wake', 'seize', 'roar'] }, [fire]: { kind: 'fire', material: 'fire', at: [-57, 30, -28], affords: ['heat the stake'] },
      [stake]: { kind: 'stake', material: 'weapon', track: [[0, [60, 10, -205]], [K2.win[0] + 2, [0, 40, -10]], [c.thrust || K3.win[1], [-15, 70, -160]], [K4.win[0] + 2.5, [-150, 5, 40]]], touches: [O, ...men], affords: ['heat', 'carry', 'thrust', 'twist'] },
      [stone]: { kind: 'door', material: 'stone', at: [-10, 60, 125], exit: true, affords: ['block the way out'] }, ram: { kind: 'animal', material: 'flesh', at: [70, 30, 55], affords: ['hide under'] } },
    authored: { intents, holds, stimuli, creatures: { [giant]: { kind: 'polyphemus', scale: gScale, place: { preset: 'sprawl', anchor: 'eye', to: [8, 118, -158], h: 0.15 }, procs: [{ type: 'preset', name: 'sprawl', from: 0, to: c.roar ? q(c.roar) + 0.6 : T, fade: 0.8 }] } }, goals: { [O]: 'blind him without waking him before the point is in', [men[0]]: 'do not let go' },
      couplings: [{ from: O, to: stake, via: 'weapon', t0: K2.win[1], t1: c.roar || c.brokeAt || T }, ...men.map(m => ({ from: m, to: stake, via: 'weapon', t0: K2.win[1], t1: c.roar || c.brokeAt || T })), { from: stake, to: giant, via: 'weapon', t0: c.thrust || T, t1: c.roar || T, env: true }, { from: fire, to: stake, via: 'fire', t0: K2.win[1], t1: c.decide || K3.win[0] }],
      coupled: { variant, frozen, units: run.units, hz: run.hz, x: run.x, drives: run.drives, W0: run.W0, W: run.W, steps: run.steps, events: c, model: 'tools/perform/machinery.js blinding' },
      /* the causal model: each one's reachable actions over the next two seconds; the giant's heat (his arousal needle) is the threat,
         distance and sight are continuous, the scene's phases (after a stimulus) switch actions on and off */
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'wait', base: 1.0, f: { 'after:sSleep': -1.2, 'threat:polyphemus': -0.6 } }, { a: 'heat the stake', base: -1.0, f: { 'after:sSleep': 2.0, 'after:sGlow': -1.5, 'near:fire:1.5': 0.8 }, uses: [stake, fire] },
          { a: 'drive it in', base: -2.5, f: { 'after:sGlow': 2.4, 'near:polyphemus:2': 1.2, 'threat:polyphemus': 0.8 }, uses: [stake] }, { a: 'twist', base: -3, f: { 'after:cImpact': 3.5, 'after:sRoar': -3 }, uses: [stake] },
          { a: 'hush the men', base: -1.5, f: { 'threat:polyphemus': 1.5, 'after:sRoar': -2 } }, { a: 'flee', base: -3, f: { 'after:sRoar': 2.5, 'threat:polyphemus': 1.0 }, uses: [stone] }, { a: 'hide', base: -2.5, f: { 'after:sCall': 3.0, 'sees:polyphemus': -0.5 }, uses: ['ram'] }],
        ...Object.fromEntries(men.map(m => [m, [{ a: 'hold still', base: 0.8, f: { 'threat:polyphemus': -0.8, 'sees:polyphemus': 0.4 } }, { a: 'hold the stake', base: -0.5, f: { ['after:iGo' + men.indexOf(m)]: 1.8, 'after:sRoar': -3, 'near:stake:1.2': 0.8 }, uses: [stake] },
          { a: 'drop it and run', base: -2.5, f: { 'threat:polyphemus': 2.2, 'sees:polyphemus': 0.6 } }, { a: 'drive with him', base: -2.2, f: { 'after:sGlow': 1.8, ['sees:' + O]: 0.8, 'after:sRoar': -3 }, uses: [stake] },
          { a: 'hide among the flock', base: -2.4, f: { 'after:sRoar': 2.0, 'threat:polyphemus': 0.8, 'near:ram:3': 0.6 }, uses: ['ram'] }]])) } } },
  };
};
