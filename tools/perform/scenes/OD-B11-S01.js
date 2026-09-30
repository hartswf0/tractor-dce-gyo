/* The Rite at the Edge of Ocean (OD-B11-S01, Odyssey 11): the ship comes to the land of the Cimmerians; Odysseus digs the pit, pours
   the three libations, cuts the throats of the black ram and ewe over it; the dead gather crying round the blood; he sits by the pit
   with his sword drawn and keeps them all back until Tiresias comes.

   A rite as repeated gesture: the trench dug (TOOL_WORK dig), three libations (POUR, three pours: milk and honey, wine, water), the
   stroke at each victim (SACRIFICE); the black ram and ewe (the ram rig, held over the pit by two of the crew) die in turn (DIE on the
   rig: the head down, the body over onto its side), each caused by its stroke. The blood runs (a SIGHT); the sword is drawn (ARM) and
   held over the pit against what is coming (THREAT). The dead come up in multitudes, crying (a SOUND; the take stages the shades as its
   own figures): the crew fall back from them (RECOIL) and crouch in terror (POSTURE cower, held); Odysseus goes down on one knee by the
   pit with the sword out (POSTURE kneel), his head going from shade to shade (a HOLD with its reason and its looks), until the one he
   waits for: Tiresias (a SIGHT), to whom he opens the way to the blood. */
'use strict';
module.exports = function author(M, X) {
  const N = require('../../../odyssey/perform/needs.json').scenes['OD-B11-S01'], base = require('./_auto.js')(M, X, N), A = base.authored;
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', crew = Object.keys(M.H).filter(i => /crew/.test(i)), pit = [-12, 10, 165], shades = [[-60, 40, 215], [20, 40, 220], [-100, 40, 250], [70, 40, 250], [-30, 40, 300], [40, 40, 300]], tiresias = [-17, 60, 240];
  const beasts = ['ram', 'ewe'].filter(b => A.creatures && A.creatures[b]);
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c2 = clip(2), c3 = clip(3), c4 = clip(4);
  const V2 = X.voiceOf(c2), V3 = X.voiceOf(c3), V4 = X.voiceOf(c4), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const walks = A.intents.filter(I => I.kind === 'APPROACH' && I.key);
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tDig = q(w(V2, 'digs', 10.3)), tPour = q(w(V2, 'pours', 11.6)), tSac = q(w(V2, 'sacrifices', 13.8)), tHolds = q(w(V2, 'holds', 16.8)), tDead = q(w(V3, 'dead', 24.6)), tCry = q(w(V3, 'crying', 27.5)), tTir = q(w(V4, 'tiresias', 34.3)), tDrink = q(w(V4, 'drink', 38.5));
  /* ── the landing ── */
  stimuli.push({ id: 'sMist', t0: 0.05, t1: 0.4, kind: 'SCENE', label: 'the misty land of the Cimmerians at Ocean\'s edge: no sun ever', because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  holds.push({ id: 'hO0', actor: O, t0: 0.3, t1: K2.win[0] - 0.1, reason: 'on the dark shore where Circe sent him', params: { look: [[pit, 2.0], [crew[0], 1.0], [[0, 60, 320], 1.6]], weight: true }, because: [{ id: 'sMist' }] });
  crew.forEach((c, k) => holds.push({ id: 'hC0' + k, actor: c, t0: 0.3, t1: K2.win[0] - 0.1, reason: 'afraid of the mist and the dark shore', params: { look: [[O, 1.6], [[0, 60, 320], 1.4]], weight: true, offset: 0.3 * k }, because: [{ id: 'sMist' }] }));
  for (const W of walks) intents.push({ ...W, because: [{ id: 'sMist' }] });
  /* ── the rite ── */
  I({ id: 'oDig', actor: O, kind: 'TOOL_WORK', t0: q(K2.win[1] + 0.1), t1: q(tPour - 0.1), label: 'digs the pit, a forearm each way', params: { how: 'dig', period: 0.7 }, because: [{ id: 'v' + c2.gi, rel: 'realises' }] });
  I({ id: 'oPour', actor: O, kind: 'POUR', t0: tPour, t1: q(tSac - 0.1), label: 'three libations for the dead: milk and honey, wine, water', params: { at: [q(tPour + 0.3), q(tPour + 0.95), q(tPour + 1.6)] }, because: [{ id: 'oDig' }] });
  beasts.forEach((b, k) => { const h = crew[k] || crew[0], t = q(tSac + 0.4 + 1.1 * k);
    holds.push({ id: 'hHold' + k, actor: h, t0: K2.win[1] + 0.2, t1: t + 0.8, reason: 'holding the black ' + b + ' over the pit', params: { look: [[b, 2.2], [O, 1.2]], weight: true }, because: [{ id: 'oDig' }] });
    I({ id: 'oCut' + k, actor: O, kind: 'SACRIFICE', target: b, t0: t - 0.6, t1: t + 0.7, label: 'the knife across the ' + b + '\'s throat over the pit', because: [{ id: k ? 'oCut0' : 'oPour' }] });
    I({ id: 'bDie' + k, actor: b, kind: 'DIE', t0: t + 0.1, t1: t + 2.0, label: 'the ' + b + ' dies over the pit', params: { roll: 1.2, sink: 0.5 }, because: [{ id: 'oCut' + k }] }); });
  crew.forEach((c, k) => { const t0 = k < beasts.length ? q(tSac + 0.4 + 1.1 * k + 0.9) : K2.win[1] + 0.2;
    holds.push({ id: 'hRite' + k, actor: c, t0, t1: tDead + 0.2, reason: 'watching the rite, the blood running into the pit', params: { look: [[pit, 1.8], [O, 1.4], [[0, 60, 320], 0.9]], weight: true, offset: 0.25 * k }, because: [{ id: k < beasts.length ? 'oCut' + k : 'oDig' }] }); });
  stimuli.push({ id: 'sBlood', t0: q(tSac + 0.6), t1: q(tSac + 3.0), kind: 'SIGHT', label: 'the dark blood runs into the pit', because: [{ id: 'oCut0' }] });
  I({ id: 'oDraw', actor: O, kind: 'ARM', t0: q(tHolds - 0.4), t1: q(tHolds + 1.0), label: 'draws the sword', params: { side: 'R' }, because: [{ id: 'sBlood' }] });
  I({ id: 'oGuard', actor: O, kind: 'THREAT', target: shades[1], t0: q(tHolds + 1.1), t1: K3.win[0] + 1.0, label: 'the sword over the pit against what is coming', params: { side: 'R' }, because: [{ id: 'oDraw' }] });
  /* ── the dead ── */
  stimuli.push({ id: 'sShades', t0: tDead, t1: T, kind: 'SOUND', label: 'the dead gather in multitudes out of Erebus, crying round the blood', because: [{ id: 'sBlood' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  crew.forEach((c, k) => { I({ id: 'cBack' + k, actor: c, kind: 'RECOIL', t0: q(tDead + 0.3 + 0.12 * k), t1: q(tDead + 1.6 + 0.12 * k), label: 'back from the dead', params: { from: shades[k % shades.length] }, because: [{ id: 'sShades' }] });
    I({ id: 'cCower' + k, actor: c, kind: 'POSTURE', t0: q(tCry + 0.2 + 0.15 * k), t1: T, label: 'crouched in green terror', params: { to: 'cower', enter: 0.6, stay: true }, because: [{ id: 'cBack' + k }] });
    holds.push({ id: 'hC1' + k, actor: c, t0: q(tCry + 1.0 + 0.15 * k), t1: T, reason: 'terror: the dead of every age crowding in', params: { look: [[shades[(k + 2) % shades.length], 1.2], [O, 1.0], [shades[k % shades.length], 1.4]], still: true }, because: [{ id: 'cCower' + k }] }); });
  holds.push({ id: 'hO1', actor: O, t0: K3.win[0] + 1.1, t1: K4.win[0] - 0.1, reason: 'the sword out: none of them drinks before Tiresias', params: { look: [[shades[0], 1.0], [shades[3], 1.0], [shades[2], 0.8], [shades[1], 1.1]], weight: false }, because: [{ id: 'oGuard' }] });
  I({ id: 'oKneel', actor: O, kind: 'POSTURE', t0: K4.win[1] + 0.1, t1: T, label: 'down on one knee by the pit, the sword held out', params: { to: 'kneel', enter: 0.6, stay: true }, because: [{ id: 'hO1' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  holds.push({ id: 'hO2', actor: O, t0: K4.win[1] + 0.8, t1: tTir - 0.1, reason: 'guarding the blood, still, the head going from shade to shade', params: { look: [[shades[0], 0.9], [shades[3], 0.9], [shades[1], 0.8], [shades[2], 0.9]], still: true }, because: [{ id: 'oKneel' }] });
  stimuli.push({ id: 'sTiresias', t0: tTir, t1: tTir + 0.4, kind: 'SIGHT', label: 'Tiresias the Theban with his golden staff', because: [{ id: 'sShades' }] });
  I({ id: 'oSees', actor: O, kind: 'NOTICE', target: tiresias, t0: q(tTir + 0.2), t1: q(tTir + 2.2), label: 'the one he waits for', params: { gazeHold: 1.2 }, because: [{ id: 'sTiresias' }] });
  I({ id: 'oLets', actor: O, kind: 'GESTURE', target: tiresias, t0: q(tDrink - 0.6), t1: q(tDrink + 1.4), label: 'the sword drawn back: drink', params: { shape: 'open', at: tDrink, side: 'L', amp: 0.8, hold: 0.8 }, because: [{ id: 'oSees' }] });
  holds.push({ id: 'hO3', actor: O, t0: q(tDrink + 1.5), t1: T, reason: 'the prophet at the blood: he listens', params: { look: [[tiresias, 3.0]], still: true }, because: [{ id: 'oLets' }] });
  A.intents = intents; A.holds = holds; A.stimuli = stimuli; A.goals = { [O]: 'let Tiresias drink first', [crew[0]]: 'live through it' }; A.camera = { follow: true };
  A.couplings = [{ from: O, to: 'pit', via: 'blood', t0: tSac, t1: T }];
  base.objects = Object.assign({}, base.objects || {}, { pit: { kind: 'pit', material: 'blood', at: pit, affords: ['drink'] } });
  return { ...base, type: 'revelation', title: 'The Rite at the Edge of Ocean: the pit, the blood, the dead', authored: A };
};
