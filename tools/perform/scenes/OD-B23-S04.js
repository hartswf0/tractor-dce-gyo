/* The Bed Test (OD-B23-S04, Odyssey 23): Penelope's trick, the eruption, the sign only the two of them know, the run into his arms,
   and the long night Athena holds back the dawn for.

   Penelope, still guarded, tells Eurycleia to carry the great bed out of the chamber for the stranger (DECLARE, her eyes on him, not on
   the nurse: it is a test). The word "bed" lands on Odysseus (a WORD stimulus): he goes still (a startle, then a HOLD with its reason),
   then erupts: who moved my bed? He built it round a living olive, its trunk the bedpost (DECLARE on his line's stresses: the point, the
   chop, then the hands describing the trunk, the frame, the drilling). The secret proves him (sSecret, caused by his telling): her knees
   give (POSTURE crouch, entered fast and left slowly) and she stands still before she can move; then she runs to him (the take's move to
   K3, held back by RETIME until her knees hold her again) and throws her arms round him (EMBRACE: two bodies coupled). At K4 she holds him
   at arm's length and asks him not to be angry (DECLARE, plead); he weeps holding her by the shoulders (HOLD_ON, WEEP). They go to the
   bed together and sit (the take's K5); Athena holds back the dawn (a SCENE stimulus) while they hold each other, rocking, never frozen.

   Eurycleia hears the order (LISTEN), turns to go and stops at the eruption; she sees the embrace and goes out (the take stages her
   out at K4). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5'), T = M.total, q = t => Math.round(t * 12) / 12;
  const P = 'penelope', O = 'odysseus', E = 'eurycleia', bed = 'olive-tree marriage bed';
  const clip = gi => M.clips.find(c => c.gi === gi), c2 = clip(2), c3 = clip(3), c4 = clip(4), c5 = clip(5), c7 = clip(7), c8 = clip(8);
  const V2 = X.voiceOf(c2), V3 = X.voiceOf(c3), V5 = X.voiceOf(c5), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tBed = q(w(V2, 'bed', 1.6)), tErupt = q(w(V3, 'erupts', 7.0)), tSecret = q(c4.at - 0.2), tRun = q(w(V5, 'runs', 25.8) - 1.2), delay = q(tRun - K3.win[0]);
  const tMeet = K3.win[1] + delay;
  /* ── the test ── */
  stimuli.push({ id: 'sRoom', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'the chamber at night: the queen, the stranger who says he is her husband, the old nurse', because: [] });
  I({ id: 'pOrder', actor: P, kind: 'DECLARE', target: E, utterance: c2.gi, t0: c2.at - 0.3, t1: c2.at + c2.dur, label: 'carry the great bed out of the chamber for him', params: { shapes: ['point', 'open', 'dismiss'], side: 'R', lookAt: O }, because: [{ id: 'v' + c2.gi, rel: 'realises' }] });
  holds.push({ id: 'hP0', actor: P, t0: c2.at + c2.dur + 0.1, t1: tErupt - 0.2, reason: 'watching him: the order was a test', params: { look: [[O, 3.0]], weight: true, grip: null }, because: [{ id: 'pOrder' }] });
  I({ id: 'eHears', actor: E, kind: 'LISTEN', target: P, t0: c2.at, t1: c2.at + c2.dur, label: 'the order', params: { nods: [q(w(V2, 'hall', 3.0) + 0.2)] }, because: [{ id: 'pOrder' }] });
  I({ id: 'eGo', actor: E, kind: 'APPROACH', key: 'K2', t0: K2.win[0], t1: K2.win[1], target: bed, label: 'turns to go and fetch it', because: [{ id: 'eHears' }] });
  stimuli.push({ id: 'sBed', t0: tBed, t1: tBed + 0.3, kind: 'WORD', label: '"the great bed ... out of the bridal chamber"', actor: P, because: [{ id: 'v' + c2.gi + 'p1' }] });
  I({ id: 'oStill', actor: O, kind: 'REACT', t0: tBed + 0.25, t1: tBed + 1.4, label: 'his bed moved?', params: { how: 'startle', lookAt: P }, because: [{ id: 'sBed' }] });
  holds.push({ id: 'hO0', actor: O, t0: tBed + 1.5, t1: tErupt - 0.5, reason: 'the post of that bed was a living olive: who has cut it?', params: { look: [[P, 2.0], [bed, 1.2], [P, 1.6]], weight: false, still: true }, because: [{ id: 'oStill' }] });
  /* ── the eruption: anger that turns into exact description ── */
  I({ id: 'oStep', actor: O, kind: 'APPROACH', key: 'K2', t0: K2.win[0], t1: K2.win[1], target: P, label: 'a step at her', because: [{ id: 'hO0', rel: 'anticipates' }] });
  I({ id: 'oErupt', actor: O, kind: 'DECLARE', target: P, utterance: c3.gi, t0: tErupt - 0.4, t1: c3.at + c3.dur, label: 'who moved my bed? I built it round a living olive: its trunk is the post', params: { shapes: ['point', 'chop', 'describe', 'describe', 'mime', 'describe', 'fist'], side: 'R' }, because: [{ id: 'v' + c3.gi, rel: 'realises' }, { id: 'hO0' }] });
  I({ id: 'pListen', actor: P, kind: 'LISTEN', target: O, t0: tErupt - 0.2, t1: c3.at + c3.dur, label: 'hears him tell the bed, piece by piece', params: { nods: [] }, because: [{ id: 'oErupt' }] });
  holds.push({ id: 'hE1', actor: E, t0: Math.max(K2.win[1] + 0.2, tErupt + 0.3), t1: K4.win[0] - 0.1, reason: 'stopped by his anger: she has not moved the bed', params: { look: [[O, 2.2], [P, 1.8]], weight: true, offset: 0.5 }, because: [{ id: 'oErupt' }] });
  /* ── the sign: her knees give; then the run ── */
  stimuli.push({ id: 'sSecret', t0: tSecret, t1: tSecret + 0.4, kind: 'SIGHT', label: 'the sign only the two of them know: it is he', actor: O, because: [{ id: 'oErupt' }] });
  I({ id: 'pKnees', actor: P, kind: 'POSTURE', t0: tSecret + 0.3, t1: tRun - 1.0, label: 'her knees give, her heart melts', params: { to: 'crouch', enter: 0.5, leave: 1.0 }, because: [{ id: 'sSecret' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  holds.push({ id: 'hP1', actor: P, t0: tSecret + 1.0, t1: tRun - 0.1, reason: 'the recognition lands: still, before she can move', params: { look: [[O, 4.0]], still: true }, because: [{ id: 'pKnees' }] });
  holds.push({ id: 'hO1', actor: O, t0: c3.at + c3.dur + 0.1, t1: tRun - 0.1, reason: 'he has said it: he waits for her', params: { look: [[P, 3.2]], weight: true }, because: [{ id: 'oErupt' }] });
  I({ id: 'pRun', actor: P, kind: 'RETIME', t0: tRun, t1: tMeet, label: 'the run to him, when her knees hold her again', params: { key: 'K3', delay }, because: [{ id: 'hP1' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  I({ id: 'oMeet', actor: O, kind: 'RETIME', t0: tRun + 0.1, t1: tMeet, label: 'to meet her', params: { key: 'K3', delay }, because: [{ id: 'pRun' }] });
  I({ id: 'pEmbrace', actor: P, kind: 'EMBRACE', target: O, t0: tMeet - 0.2, t1: K4.win[0] - 0.1, label: 'her arms round his neck', because: [{ id: 'pRun' }] });
  holds.push({ id: 'hE2', actor: E, t0: tMeet, t1: K4.win[0] - 0.1, reason: 'the embrace: the nurse weeps and goes out', params: { look: [[P, 2.0], [O, 1.0]], weight: true }, because: [{ id: 'pEmbrace' }] });
  /* ── at arm's length: her plea; his tears ── */
  I({ id: 'pApart', actor: P, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: O, label: 'back to arm\'s length, to see his face', because: [{ id: 'pEmbrace' }] });
  I({ id: 'oApart', actor: O, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: P, label: 'holds her off to look at her', because: [{ id: 'pApart' }] });
  I({ id: 'pPlea', actor: P, kind: 'DECLARE', target: O, utterance: c7.gi, t0: c7.at - 0.2, t1: c7.at + c7.dur, label: 'do not be angry with me: I was afraid of a smooth story', params: { shapes: ['plead', 'chest', 'open'], side: 'L' }, because: [{ id: 'v' + c7.gi, rel: 'realises' }, { id: 'pApart' }] });
  I({ id: 'oHold', actor: O, kind: 'HOLD_ON', target: P, t0: K4.win[1], t1: K5.win[0] - 0.1, label: 'his hand on her shoulder while she speaks', params: { side: 'R', at: 'shoulder' }, because: [{ id: 'pPlea' }] });
  I({ id: 'oWeep', actor: O, kind: 'WEEP', t0: c7.at + 1.0, t1: K5.win[0] - 0.1, label: 'weeps, holding her', params: { side: 'L', rate: 2.6 }, because: [{ id: 'pPlea' }] });
  /* ── the bed, and the long night ── */
  I({ id: 'pBed', actor: P, kind: 'APPROACH', key: 'K5', t0: K5.win[0], t1: K5.win[1], target: bed, label: 'to the bed together', because: [{ id: 'oWeep' }] });
  I({ id: 'oBed', actor: O, kind: 'APPROACH', key: 'K5', t0: K5.win[0], t1: K5.win[1], target: bed, label: 'to the bed he made', because: [{ id: 'pBed' }] });
  stimuli.push({ id: 'sDawn', t0: c8.at, t1: T, kind: 'SCENE', label: 'Athena holds back the dawn', because: [{ id: 'pBed' }] });
  I({ id: 'bEmbrace', actor: O, kind: 'EMBRACE', target: P, t0: K5.win[1] + 0.3, t1: T - 0.2, label: 'holding each other a long time', because: [{ id: 'sDawn' }, { id: 'v' + c8.gi, rel: 'realises' }] });
  holds.push({ id: 'hNightO', actor: O, t0: K5.win[1] + 1.2, t1: T, reason: 'weeping, holding his wife: rocking, never still', params: { look: [[P, 4.0], [bed, 1.0]], weight: true }, because: [{ id: 'bEmbrace' }] });
  holds.push({ id: 'hNightP', actor: P, t0: K5.win[1] + 1.2, t1: T, reason: 'weeping in his arms: as welcome as land to swimmers', params: { look: [[O, 4.0]], weight: true, offset: 0.6 }, because: [{ id: 'bEmbrace' }] });
  return {
    type: 'revelation', title: 'The Bed Test: the olive-tree bed, the run, the long night',
    actors: { [P]: { role: 'the queen, testing', body: 'minifig', principal: true, affect: { suspicion: 0.8, weight: 0.5 } }, [O]: { role: 'the husband', body: 'minifig', principal: true, affect: { heat: 0.7 } }, [E]: { role: 'the old nurse', body: 'minifig' } },
    objects: { bed: { kind: 'bed', material: 'wood', at: [0, 30, -80], affords: ['sit', 'lie'], note: 'rooted: the trunk of a living olive is its post' } },
    authored: { intents, holds, stimuli, goals: { [P]: 'know him by a sign no stranger could know', [O]: 'be known', [E]: 'serve the queen' },
      couplings: [{ from: P, to: O, via: 'flesh', t0: tMeet - 0.2, t1: K4.win[0] }, { from: O, to: P, via: 'flesh', t0: K5.win[1], t1: T }],
      causal: { tau: 0.7, actions: {
        [P]: [{ a: 'keep him at a distance', base: 1.2, f: { 'after:sSecret': -3.0 } }, { a: 'test him', base: -0.5, f: { 'after:sBed': 0.8, 'after:sSecret': -3 } }, { a: 'go to him', base: -2.6, f: { 'after:sSecret': 3.0, 'near:odysseus:1': -1.5 } },
          { a: 'hold him', base: -2.8, f: { 'after:sSecret': 1.5, 'near:odysseus:1': 3.0 } }, { a: 'ask pardon', base: -2.8, f: { 'after:pEmbrace': 2.8 } }],
        [O]: [{ a: 'wait to be known', base: 1.0, f: { 'after:sBed': -1.5, 'after:sSecret': 0.8 } }, { a: 'rage at the bed moved', base: -2.5, f: { 'after:sBed': 3.0, 'after:sSecret': -3.5 } }, { a: 'tell the bed', base: -2.5, f: { 'after:sBed': 2.4, 'intent:DECLARE': 1.2, 'after:sSecret': -3 } },
          { a: 'hold her', base: -3.0, f: { 'after:sSecret': 1.0, 'near:penelope:1': 3.4 } }, { a: 'weep', base: -3.0, f: { 'after:pPlea': 3.0 } }],
        [E]: [{ a: 'fetch the bed', base: 0.5, f: { 'after:sBed': 1.5, 'after:oErupt': -3 } }, { a: 'stand and watch', base: -0.5, f: { 'after:oErupt': 2.0 } }, { a: 'go out', base: -2.5, f: { 'after:pEmbrace': 3.2 } }],
      } },
      camera: { follow: true },
    },
  };
};
