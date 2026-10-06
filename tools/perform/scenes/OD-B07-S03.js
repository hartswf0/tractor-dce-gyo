/* Supplication at Arete's Knees (OD-B07-S03, Odyssey 7): Odysseus goes through the hall of Alcinous hidden in the mist Athena shed
   about him, past the lords pouring their last cups to Hermes, straight to the queen; he lays his hands on Arete's knees, and the mist
   falls away from him. They are struck dumb at the sight of a man there. He prays her for convoy home, and goes and sits in the ashes
   of the hearth. For a long while no one speaks; then the old lord Echeneus: it is not fitting, Alcinous, that a stranger should sit
   in the ashes; raise him, seat him on a chair. The king takes him by the hand, raises him from the hearth and seats him beside him;
   they bring him food and wine, and he is promised a convoy home.

   The voice: the supplication is an added clip of its spoken line in a man's voice (the recording gives it to Athena's), Echeneus's
   rebuke restored to the cut (odyssey/kits/cut-restore.json).

   The chain: the hall at evening (SCENE) -> the mist carried on him up the hall (FLY: the mist prop rides his head) -> he reaches the
   queen (K1a) and his hands on her knees (CONTACT, a STEP in) -> the mist sinks into the floor (FLY's leg) -> the hall's startle
   (REACT, SIGHT of a stranger there) and silence (HOLDs, still) -> his kneeling (POSTURE kneel) and supplication (DECLARE) -> he
   goes to the hearth and sits in the ashes (K3) -> Echeneus's rebuke (DECLARE) -> the king's decision (DECIDE) -> his walk down
   (K3a) -> the hand (GRIP) and the raising (K4) -> the chair (K4a), the cup -> the promise (GESTURE). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win || [K(id).t, K(id).t + 0.6], T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', AR = 'arete', AL = 'alcinous', EC = 'echeneus', P = ['phaeacian-1', 'phaeacian-2'];
  const clips = M.clips.filter(c => c.kind !== 'SCENE_HEADER' && c.kind !== 'SPEAKER_CUE');
  const cN = clips[0], cO = clips.find(c => c.speaker === O && c.kind === 'DIALOGUE'), cE = clips.find(c => c.speaker === EC), cZ = clips[clips.length - 1];
  const VO = X.voiceOf(cO), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); };
  const K1a = W('K1a'), tReach = q(K1a[1]), tSink = q(tReach + 0.15);
  stimuli.push({ id: 'sHall', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'the hall of Alcinous at evening: the lords pour their last cups', because: [{ id: 'v' + cN.gi, rel: 'realises' }] });
  /* ── the mist ── */
  I({ id: 'oMist', actor: O, kind: 'FLY', t0: 0, t1: q(tSink + 1.1), label: 'Athena\'s mist about him, carried with him up the hall; at the queen\'s knees it sinks away',
    params: { prop: 'mist', from: O, grip: [0, -30, 0], ride: tSink, legs: [{ dt: 1.1, to: [-62, -80, -166] }], until: K('K2').t }, because: [{ id: 'sHall' }] });
  I({ id: 'oWalk', actor: O, kind: 'APPROACH', key: 'K1a', t0: K1a[0], t1: K1a[1], target: AR, label: 'straight up the hall to the queen, unseen', because: [{ id: 'sHall' }] });
  H({ id: 'hO0', actor: O, t0: 0.3, t1: q(K1a[0] - 0.05), reason: 'in the mist at the door: he looks for the queen, as Athena told him', params: { look: [[AR, 2.0], [AL, 0.8], [AR, 2.0]], weight: true }, because: [{ id: 'sHall' }] });
  stimuli.push({ id: 'sSeen', t0: q(tSink + 0.2), t1: q(tSink + 0.6), kind: 'SIGHT', label: 'a stranger at the queen\'s knees, out of nowhere', actor: O, because: [{ id: 'oMist' }] });
  /* the hall before: the lords at their cups, the king and queen */
  H({ id: 'hAR0', actor: AR, t0: 0.3, t1: q(tSink + 0.25), reason: 'the queen on her throne by the king, the evening\'s last cups', params: { look: [[AL, 1.6], [EC, 1.2], [P[0], 1.0]], weight: true }, because: [{ id: 'sHall' }] });
  H({ id: 'hAL0', actor: AL, t0: 0.3, t1: q(tSink + 0.3), reason: 'the king watches his lords pour to Hermes', params: { look: [[EC, 1.8], [P[1], 1.2], [AR, 1.0]], weight: true }, because: [{ id: 'sHall' }] });
  H({ id: 'hEC0', actor: EC, t0: 0.3, t1: q(tSink + 0.35), reason: 'the eldest lord, at his wine', params: { look: [[AL, 2.0], [P[0], 1.2]], weight: true }, because: [{ id: 'sHall' }] });
  P.forEach((p, k) => H({ id: 'hP0' + k, actor: p, t0: 0.3 + 0.1 * k, t1: q(tSink + 0.35 + 0.1 * k), reason: 'pouring the last cup to Hermes before bed', params: { look: [[AL, 1.6], [EC, 1.4]], weight: true, offset: 0.3 * k }, because: [{ id: 'sHall' }] }));
  /* ── the knees, the silence ── */
  I({ id: 'oKneel', actor: O, kind: 'POSTURE', t0: q(tReach - 0.1), t1: 23.0, label: 'down on his knees, his hands on her knees', params: { to: 'kneel', enter: 0.5, leave: 0.4 }, because: [{ id: 'oWalk' }] });
  I({ id: 'arStart', actor: AR, kind: 'REACT', t0: q(tSink + 0.25), t1: q(tSink + 1.4), label: 'a man at her knees', params: { how: 'startle', lookAt: O }, because: [{ id: 'sSeen', latency: 0.25 }] });
  I({ id: 'alStart', actor: AL, kind: 'REACT', t0: q(tSink + 0.35), t1: q(tSink + 1.5), label: 'the king starts', params: { how: 'startle', lookAt: O }, because: [{ id: 'sSeen', latency: 0.35 }] });
  I({ id: 'ecStart', actor: EC, kind: 'REACT', t0: q(tSink + 0.4), t1: q(tSink + 1.5), label: 'the elder turns', params: { how: 'turn', lookAt: O }, because: [{ id: 'sSeen', latency: 0.4 }] });
  P.forEach((p, k) => I({ id: 'pStart' + k, actor: p, kind: 'REACT', t0: q(tSink + 0.45 + 0.1 * k), t1: q(tSink + 1.6 + 0.1 * k), label: 'the cup stops at his lips', params: { how: 'startle', lookAt: O }, because: [{ id: 'sSeen', latency: 0.45 + 0.1 * k }] }));
  /* ── the supplication ── */
  const tConvoy = q(w(VO, 'convoy', cO.at + cO.dur * 0.6));
  I({ id: 'oPray', actor: O, kind: 'DECLARE', target: AR, utterance: cO.gi, t0: q(cO.at - 0.2), t1: q(cO.at + cO.dur), label: 'Arete, I come to your knees: grant me convoy to my own country', params: { shapes: ['plead'], side: 'R', maxBeats: 1, amp: 0.7 }, because: [{ id: 'sSeen' }, { id: 'v' + cO.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sConvoy', t0: tConvoy, t1: q(tConvoy + 0.4), kind: 'WORD', label: '"convoy to my own country"', actor: O, because: [{ id: 'oPray' }] });
  H({ id: 'hAR1', actor: AR, t0: q(tSink + 1.45), t1: q(cE.at + 1.0), reason: 'the stranger at her knees: she does not answer; the hall is silent', params: { look: [[O, 4.0], [AL, 1.0], [O, 3.0]], weight: true, still: true }, because: [{ id: 'arStart' }] });
  H({ id: 'hAL1', actor: AL, t0: q(tSink + 1.55), t1: q(cE.at + 0.3), reason: 'the king says nothing: a suppliant at his hearth', params: { look: [[O, 3.5], [AR, 1.0], [O, 3.0]], weight: true, still: true }, because: [{ id: 'alStart' }] });
  H({ id: 'hEC1', actor: EC, t0: q(tSink + 1.55), t1: q(K('K3').t - 1.2), reason: 'no one speaks', params: { look: [[O, 3.0], [AL, 1.0]], weight: true, still: true }, because: [{ id: 'ecStart' }] });
  P.forEach((p, k) => H({ id: 'hP1' + k, actor: p, t0: q(tSink + 1.65 + 0.1 * k), t1: q(cZ.at - 0.2), reason: 'struck dumb, they look at the man', params: { look: [[O, 3.0], [AL, 1.2], [O, 2.0]], weight: true, still: true, offset: 0.4 * k }, because: [{ id: 'pStart' + k }] }));
  /* ── the ashes ── */
  I({ id: 'oAshes', actor: O, kind: 'DECIDE', t0: q(cO.at + cO.dur - 1.0), t1: q(cO.at + cO.dur - 0.2), label: 'he has asked: he goes and sits in the ashes, a suppliant', because: [{ id: 'oPray' }] });
  I({ id: 'oSit', actor: O, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: AL, label: 'to the hearth, and down in the ashes', because: [{ id: 'oAshes' }] });
  H({ id: 'hO1', actor: O, t0: q(W('K3')[1] + 0.05), t1: q(K('K4').t - 0.3), reason: 'in the ashes by the fire, waiting: the head bowed', params: { look: [[AL, 2.0], [EC, 1.6], [AL, 2.0]], weight: true }, because: [{ id: 'oSit' }] });
  /* ── Echeneus ── */
  I({ id: 'ecStep', actor: EC, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: AL, label: 'the old lord steps out before the king', because: [{ id: 'oSit', latency: 0.3 }] });
  I({ id: 'ecSay', actor: EC, kind: 'DECLARE', target: AL, utterance: cE.gi, t0: q(Math.max(cE.at - 0.2, W('K3')[1] + 0.05)), t1: q(cE.at + cE.dur), label: 'Alcinous, this is not well: raise him, seat him on a chair, let the herald mix wine', params: { shapes: ['open', 'point', 'offer'], side: 'R', maxBeats: 3, amp: 0.9 }, because: [{ id: 'oSit' }, { id: 'v' + cE.gi, rel: 'realises' }] });
  H({ id: 'hEC2', actor: EC, t0: q(cE.at + cE.dur + 0.05), t1: T, reason: 'he has said it: he watches the king do it', params: { look: [[AL, 2.0], [O, 2.0]], weight: true }, because: [{ id: 'ecSay' }] });
  H({ id: 'hAL2', actor: AL, t0: q(cE.at + 0.35), t1: q(K('K3a').t - 2.2), reason: 'the elder speaks: the king listens, his eyes on the man in the ashes', params: { look: [[EC, 2.4], [O, 1.6], [EC, 2.0]], weight: true }, because: [{ id: 'ecStep' }] });
  /* ── the king raises him ── */
  I({ id: 'alRise', actor: AL, kind: 'DECIDE', t0: q(K('K3a').t - 2.15), t1: q(K('K3a').t - 1.5), label: 'the king will do it himself', because: [{ id: 'ecSay' }] });
  I({ id: 'alDown', actor: AL, kind: 'APPROACH', key: 'K3a', t0: W('K3a')[0], t1: W('K3a')[1], target: O, label: 'rises and comes down to the hearth, his hand out', because: [{ id: 'alRise' }] });
  I({ id: 'oUp', actor: O, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: AL, label: 'takes the king\'s hand and is raised', because: [{ id: 'alDown' }, { id: 'v' + cZ.gi, rel: 'realises' }] });
  I({ id: 'alLead', actor: AL, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: O, label: 'raises him by the hand', because: [{ id: 'alDown' }] });
  I({ id: 'alHand', actor: AL, kind: 'GRIP', target: O, t0: q(W('K4')[1] - 0.2), t1: q(K('K4a').t - 0.4), label: 'the king\'s hand in his', params: { point: 'hand', side: 'R', targetSide: 'R' }, because: [{ id: 'alLead' }] });
  I({ id: 'oChair', actor: O, kind: 'APPROACH', key: 'K4a', t0: W('K4a')[0], t1: W('K4a')[1], target: AL, label: 'to the chair beside the king, and seated', because: [{ id: 'alHand' }] });
  I({ id: 'alBeside', actor: AL, kind: 'APPROACH', key: 'K4a', t0: W('K4a')[0], t1: W('K4a')[1], target: O, label: 'beside him', because: [{ id: 'alHand' }] });
  I({ id: 'alPromise', actor: AL, kind: 'GESTURE', target: O, t0: q(W('K4a')[1] + 0.3), t1: q(W('K4a')[1] + 2.0), label: 'a convoy home, tomorrow', params: { shape: 'open', at: q(W('K4a')[1] + 0.8), side: 'L', amp: 1.0, hold: 0.6 }, because: [{ id: 'oChair' }] });
  I({ id: 'oCup', actor: O, kind: 'DRINK', t0: q(W('K4a')[1] + 1.2), t1: q(W('K4a')[1] + 2.6), label: 'the wine they bring him', params: { at: [q(W('K4a')[1] + 1.4)] }, because: [{ id: 'oChair' }] });
  H({ id: 'hO2', actor: O, t0: q(W('K4a')[1] + 2.65), t1: T, reason: 'seated beside the king: home is promised', params: { look: [[AL, 2.0], [AR, 1.4]], weight: true }, because: [{ id: 'alPromise' }] });
  P.forEach((p, k) => I({ id: 'pToast' + k, actor: p, kind: 'GESTURE', target: O, t0: q(W('K4a')[1] + 0.6 + 0.3 * k), t1: q(W('K4a')[1] + 2.2 + 0.3 * k), label: 'a cup raised to the guest', params: { shape: 'offer', at: q(W('K4a')[1] + 1.1 + 0.3 * k), side: 'R', amp: 0.8, hold: 0.5 }, because: [{ id: 'oChair', latency: 0.6 + 0.3 * k }] }));
  P.forEach((p, k) => H({ id: 'hP2' + k, actor: p, t0: q(cZ.at - 0.15), t1: q(W('K4a')[1] + 0.55 + 0.3 * k), reason: 'the king himself raises the stranger', params: { look: [[AL, 1.6], [O, 2.0]], weight: true, offset: 0.3 * k }, because: [{ id: 'alDown' }] }));
  P.forEach((p, k) => H({ id: 'hP3' + k, actor: p, t0: q(W('K4a')[1] + 2.25 + 0.3 * k), t1: T, reason: 'a guest of the house now', params: { look: [[O, 2.0], [AL, 1.4]], weight: true, offset: 0.3 * k }, because: [{ id: 'pToast' + k }] }));
  H({ id: 'hAR2', actor: AR, t0: q(cE.at + 1.05), t1: T, reason: 'she watches the stranger: whose clothes is he wearing?', params: { look: [[O, 3.0], [AL, 1.2]], weight: true }, because: [{ id: 'ecSay' }] });
  H({ id: 'hAL3', actor: AL, t0: q(W('K4a')[1] + 2.05), t1: T, reason: 'the king beside his guest', params: { look: [[O, 2.4], [EC, 1.0]], weight: true }, because: [{ id: 'alPromise' }] });
  return {
    type: 'dialogue', title: 'Supplication at Arete\'s Knees: the mist, the knees, the silence, the ashes, the elder, the king\'s hand',
    actors: { [O]: { role: 'the stranger', body: 'minifig', principal: true, affect: { weight: 0.8, fear: 0.3 } }, [AR]: { role: 'Arete, the queen', body: 'minifig', principal: true },
      [AL]: { role: 'Alcinous, the king', body: 'minifig', principal: true }, [EC]: { role: 'Echeneus, the eldest lord', body: 'minifig' },
      ...Object.fromEntries(P.map(p => [p, { role: 'a Phaeacian lord', body: 'minifig', group: 'lords' }])) },
    objects: { mist: { kind: 'mist', material: 'air', affords: ['hide'] }, hearth: { kind: 'hearth', material: 'stone', at: [-54, 30, 49], affords: ['sit'] }, cup: { kind: 'cup', material: 'gold', affords: ['drink'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'convoy home: the queen first, as Athena said', [AR]: 'know the stranger', [AL]: 'a king\'s duty to a suppliant', [EC]: 'the custom kept' },
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'go unseen', base: 1.0, f: { 'after:sSeen': -3.0 } }, { a: 'clasp her knees', base: -1.0, f: { 'after:oWalk': 3.0, 'after:oAshes': -3.0 } }, { a: 'sit in the ashes', base: -2.0, f: { 'after:oAshes': 4.0, 'after:alHand': -4.0 } }, { a: 'sit by the king', base: -3.0, f: { 'after:alHand': 5.0 } }],
        [AL]: [{ a: 'wait', base: 1.0, f: {} }, { a: 'raise him', base: -2.0, f: { 'after:alRise': 4.0 } }],
        [AR]: [{ a: 'watch the lords', base: 1.0, f: { 'after:sSeen': -2.0 } }, { a: 'look at the stranger', base: -1.0, f: { 'after:sSeen': 3.0 } }] } },
      camera: { follow: true },
    },
  };
};
