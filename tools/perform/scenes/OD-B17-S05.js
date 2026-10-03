/* Antinous Throws the Stool (OD-B17-S05, Odyssey 17): the beggar goes round the suitors' tables with his hand out, as a beggar does,
   and comes to Antinous: give, he says; I was rich once and gave to beggars, until Egypt swallowed it all. Antinous rails at him:
   what god sent this plague to our dinner? Off from my table! The beggar does not go, and answers: your looks are better than your understanding; you would not give a grain of salt from
   another man's table. Antinous seizes the footstool and throws it; it hits the beggar on the
   back of the right shoulder as he turns, and he stands like a rock, shakes his head in silence, goes to the threshold, sits, and
   calls on the gods and the avengers of beggars: let Antinous die before his wedding. The other suitors rebuke Antinous: what if he
   is a god?

   The chain: the begging (DECLARE, the hand held out) -> Antinous's anger (a WORD: Egypt) -> his railing (DECLARE, the arm out) ->
   the beggar's retort (DECLARE, K3; restored to the cut: odyssey/kits/cut-restore.json) -> the insult heard (a WORD: salt) -> his fury
   (DECIDE, the stool seized: K4) -> the throw (THROW: the stool carried in the hand through the wind-up and flown to the beggar's
   shoulder, then off it to the floor, a PROP FLIGHT the take plays; a CONTACT IMPACT) -> the beggar's IMPACT, unmoved (K4a: a HOLD, like a rock; the head shaken) -> his walk to the threshold
   (K5, caused by his decision) -> the curse (DECLARE) -> the suitors' rebuke (K6, caused by the blow and the curse). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win || [K(id).t, K(id).t + 0.6], T = M.total, q = t => Math.round(t * 12) / 12;
  const B = 'odysseus-as-beggar', AN = 'antinous', R = [1, 2, 3, 4, 5].map(i => 'suitor-reaction-' + i);
  const clip = gi => M.clips.find(c => c.gi === gi), c2 = clip(2), c4 = clip(4), c6 = clip(6), c7 = clip(7), c8 = clip(8), c9 = clip(9);
  const G = require('../ground.js'), DOWN = [-128, -40];
  const V2 = X.voiceOf(c2), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); };
  const door = [-20, 40, 250];
  stimuli.push({ id: 'sHall', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'the beggar going round the tables, his hand out to each man', because: [{ id: 'v' + c2.gi, rel: 'realises' }] });
  /* ── the begging ── */
  I({ id: 'bBeg', actor: B, kind: 'DECLARE', target: AN, utterance: c2.gi, t0: q(c2.at - 0.2), t1: q(c2.at + c2.dur), label: 'I had a house once and gave to beggars; then Egypt swallowed it', params: { shapes: ['offer', 'chest', 'open', 'describe'], side: 'R', maxBeats: 1, amp: 0.8 }, because: [{ id: 'v' + c2.gi, rel: 'realises' }] });
  H({ id: 'hAn0', actor: AN, t0: 0.3, t1: q(c4.at - 0.6), reason: 'the beggar at his elbow at dinner: his lip curls', params: { look: [[B, 2.4], [R[0], 0.8], [B, 2.0]], weight: true }, because: [{ id: 'sHall' }] });
  R.forEach((r, k) => H({ id: 'hR0' + k, actor: r, t0: 0.3 + 0.1 * k, t1: q(W('K4')[0] - 0.1), reason: 'they have given him a little each: now Antinous', params: { look: [[B, 1.6], [AN, 1.6]], weight: true, offset: 0.3 * k }, because: [{ id: 'sHall' }] }));
  const tEgypt = q(w(V2, 'egypt', c2.at + c2.dur * 0.6));
  stimuli.push({ id: 'sEgypt', t0: tEgypt, t1: q(tEgypt + 0.4), kind: 'WORD', label: '"Egypt": a long beggar\'s tale at his table', actor: B, because: [{ id: 'bBeg' }] });
  /* ── the railing ── */
  I({ id: 'anRail', actor: AN, kind: 'DECLARE', target: B, utterance: c4.gi, t0: q(Math.min(c4.at - 0.4, W('K2')[0] - 0.2)), t1: q(c4.at + c4.dur), label: 'what god dumped this plague on our dinner? back from the table', params: { shapes: ['point', 'dismiss', 'point'], side: 'R', maxBeats: 1, amp: 1.0 }, because: [{ id: 'sEgypt' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  I({ id: 'anPoint', actor: AN, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: B, label: 'the arm out at him', because: [{ id: 'anRail' }] });
  H({ id: 'hB0', actor: B, t0: q(c2.at + c2.dur + 0.05), t1: q((c6 ? W('K3')[0] : W('K4')[0]) - 0.1), reason: 'he takes the abuse and does not go', params: { look: [[AN, 3.0]], weight: true }, because: [{ id: 'anRail' }] });
  /* ── the retort ── */
  const V6 = c6 ? X.voiceOf(c6) : null, tSalt = c6 ? q(w(V6, 'salt', c6.at + c6.dur * 0.75)) : null;
  if (c6) {
    I({ id: 'bRetort', actor: B, kind: 'DECLARE', target: AN, utterance: c6.gi, t0: q(Math.max(c6.at - 0.2, W('K3')[1] + 0.05)), t1: q(c6.at + c6.dur), label: 'your body is handsome, but there is no mind inside it: not a grain of salt from a table not yours', params: { shapes: ['open', 'point', 'dismiss'], side: 'R', maxBeats: 1, amp: 0.9 }, because: [{ id: 'anRail' }, { id: 'v' + c6.gi, rel: 'realises' }] });
    I({ id: 'bStep', actor: B, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: AN, label: 'a step back to the table: he does not go', because: [{ id: 'anRail' }] });
    I({ id: 'anLean', actor: AN, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: B, label: 'sits back, staring', because: [{ id: 'bStep', latency: 0.3 }] });
    stimuli.push({ id: 'sSalt', t0: tSalt, t1: q(tSalt + 0.4), kind: 'WORD', label: '"not a grain of salt": a beggar shaming him at his own table', actor: B, because: [{ id: 'bRetort' }] });
    H({ id: 'hAn1', actor: AN, t0: q(c4.at + c4.dur + 0.05), t1: q(tSalt + 0.3), reason: 'his face darkening: the beggar answers him', params: { look: [[B, 3.0]], weight: true }, because: [{ id: 'anRail' }] });
  } else {
    const tS = q(W('K4')[0] - 1.6);
    stimuli.push({ id: 'sSalt', t0: tS, t1: q(tS + 0.4), kind: 'SIGHT', label: 'the beggar stands there still, and looks at him: he will not go', actor: B, because: [{ id: 'hB0' }] });
    H({ id: 'hAn1', actor: AN, t0: q(c4.at + c4.dur + 0.05), t1: q(tS + 0.3), reason: 'his face darkening: the beggar has not moved', params: { look: [[B, 3.0]], weight: true }, because: [{ id: 'anRail' }] });
  }
  const tStay = c6 ? q(Math.max(tSalt + 0.35, W('K4')[0] - 1.6)) : q(W('K4')[0] - 1.6 + 0.35);
  /* ── the stool ── */
  I({ id: 'anFury', actor: AN, kind: 'DECIDE', t0: q(tStay), t1: q(Math.max(tStay + 0.3, W('K4')[0])), label: 'the footstool: he seizes it', because: [{ id: 'sSalt' }] });
  I({ id: 'bTurn', actor: B, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: door, label: 'turns away to the door', because: [{ id: 'anFury', latency: 0.2 }] });
  I({ id: 'anRaise', actor: AN, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: B, label: 'the stool up', because: [{ id: 'anFury' }, { id: 'v' + c7.gi, rel: 'realises' }] });
  const wH = W('K4a'), FL = 0.33, tHit = q(wH[0] - 0.08), tT = q(tHit - FL - 0.62), gy = G.at(M, DOWN[0], DOWN[1]).y;
  I({ id: 'anThrow', actor: AN, kind: 'THROW', target: B, t0: tT, t1: q(tT + 1.6), label: 'throws the footstool at his back', because: [{ id: 'anRaise' }],
    params: { side: 'R', releaseId: 'sStool', prop: 'stool', to: B, off: [0, -9, 0], flight: FL, arc: 9, spin: 0.6, fall: [{ dt: 0.45, to: [DOWN[0], gy + 4, DOWN[1]], arc: 5, spin: 0.35 }], until: K('K4a').t } });
  stimuli.push({ id: 'sHit', t0: tHit, t1: q(tHit + 0.3), kind: 'SOUND', label: 'the stool on the back of his right shoulder', actor: B, because: [{ id: 'sStool', latency: FL }] });
  I({ id: 'bHit', actor: B, kind: 'IMPACT', t0: q(tHit + 0.04), t1: q(wH[0] + 0.5), label: 'the blow does not even stagger him', params: { until: q(wH[0] + 0.4) }, because: [{ id: 'sHit', latency: 0.04 }] });
  I({ id: 'bRock', actor: B, kind: 'APPROACH', key: 'K4a', t0: wH[0], t1: wH[1], target: AN, label: 'he turns back and looks at him: shakes his head in silence', because: [{ id: 'bHit' }] });
  R.forEach((r, k) => I({ id: 'rStart' + k, actor: r, kind: 'REACT', t0: q(tHit + 0.2 + 0.08 * k), t1: q(tHit + 1.3 + 0.08 * k), label: 'the stool thrown at a beggar', params: { how: 'startle', lookAt: B }, because: [{ id: 'sHit', latency: 0.2 + 0.08 * k }] }));
  H({ id: 'hB1', actor: B, t0: q(wH[1] + 0.05), t1: q(W('K5')[0] - 0.85), reason: 'standing like a rock: he broods on evil in his heart', params: { look: [[AN, 3.0]], weight: true, still: true }, because: [{ id: 'bRock' }] });
  H({ id: 'hAn2', actor: AN, t0: q(tT + 1.65), t1: q(W('K6')[0] - 0.1), reason: 'the beggar did not fall', params: { look: [[B, 2.6], [R[0], 0.8]], weight: true }, because: [{ id: 'anThrow' }] });
  /* ── the threshold, the curse ── */
  I({ id: 'bGo', actor: B, kind: 'DECIDE', t0: q(W('K5')[0] - 0.8), t1: q(W('K5')[0]), label: 'back to the threshold, the wallet down; he turns there to face the hall', because: [{ id: 'hB1' }, { id: 'v' + c8.gi, rel: 'realises' }] });
  I({ id: 'bSit', actor: B, kind: 'APPROACH', key: 'K5', t0: W('K5')[0], t1: W('K5')[1], target: door, label: 'goes back to the threshold and turns to face him', because: [{ id: 'bGo' }] });
  I({ id: 'bCurse', actor: B, kind: 'DECLARE', target: AN, utterance: c8.gi, t0: q(Math.max(c8.at - 0.2, W('K5')[1] + 0.05)), t1: q(c8.at + c8.dur), label: 'gods, avengers of the poor: let Antinous die before his wedding', params: { shapes: ['invoke', 'point'], side: 'R', maxBeats: 1, amp: 1.0 }, because: [{ id: 'bSit' }] });
  R.forEach((r, k) => H({ id: 'hR1' + k, actor: r, t0: q(tHit + 1.4 + 0.08 * k), t1: q(W('K6')[0] - 0.1), reason: 'they watch the beggar to the door, and hear the curse', params: { look: [[B, 2.0], [AN, 1.0]], weight: true, offset: 0.3 * k }, because: [{ id: 'rStart' + k }] }));
  /* ── the rebuke ── */
  stimuli.push({ id: 'sCursed', t0: q(c8.at + c8.dur - 0.6), t1: q(c8.at + c8.dur), kind: 'WORD', label: '"before his wedding day"', actor: B, because: [{ id: 'bCurse' }] });
  I({ id: 'rRebuke', actor: R[0], kind: 'APPROACH', key: 'K6', t0: W('K6')[0], t1: W('K6')[1], target: AN, label: 'turns on Antinous: you did ill to strike him', because: [{ id: 'sCursed' }, { id: 'v' + c9.gi, rel: 'realises' }] });
  R.slice(1).forEach((r, k) => I({ id: 'rTurn' + k, actor: r, kind: 'APPROACH', key: 'K6', t0: W('K6')[0], t1: W('K6')[1], target: AN, label: 'they look at Antinous: what if he is a god?', because: [{ id: 'rRebuke', latency: 0.2 + 0.1 * k }] }));
  I({ id: 'rSay', actor: R[0], kind: 'GESTURE', target: AN, t0: q(W('K6')[1] + 0.1), t1: q(W('K6')[1] + 1.8), label: 'it may be a god you have struck', params: { shape: 'point', at: q(W('K6')[1] + 0.5), side: 'R', amp: 1.0, hold: 0.8 }, because: [{ id: 'rRebuke' }] });
  I({ id: 'anShrug', actor: AN, kind: 'APPROACH', key: 'K6', t0: W('K6')[0], t1: W('K6')[1], target: R[0], label: 'he shrugs them off', because: [{ id: 'rRebuke', latency: 0.3 }] });
  H({ id: 'hAn3', actor: AN, t0: q(W('K6')[1] + 0.1), t1: T, reason: 'he cares nothing for what they say', params: { look: [[R[0], 1.6], [B, 1.6]], weight: true }, because: [{ id: 'anShrug' }] });
  R.forEach((r, k) => H({ id: 'hR2' + k, actor: r, t0: q(W('K6')[1] + 0.1 + (k ? 0 : 1.8)), t1: T, reason: 'uneasy: the gods go about in the shapes of strangers', params: { look: [[AN, 1.6], [B, 1.4]], weight: true, offset: 0.3 * k }, because: [{ id: k ? 'rTurn' + (k - 1) : 'rSay' }] }));
  H({ id: 'hB2', actor: B, t0: q(c8.at + c8.dur + 0.05), t1: T, reason: 'on the threshold, he watches them turn on Antinous', params: { look: [[AN, 2.0], [R[0], 1.0]], weight: true }, because: [{ id: 'bCurse' }] });
  return {
    type: 'fight', title: 'Antinous Throws the Stool: the begging, the railing, the retort, the stool in the air, the blow taken standing, the curse',
    actors: { [B]: { role: 'the beggar, the king', body: 'minifig', principal: true, affect: { cunning: 0.8, weight: 0.8 } }, [AN]: { role: 'Antinous', body: 'minifig', principal: true, affect: { heat: 0.8 } },
      ...Object.fromEntries(R.map(r => [r, { role: 'a suitor', body: 'minifig', group: 'suitors' }])) },
    objects: { stool: { kind: 'stool', material: 'wood', holder: AN + ':R', affords: ['throw'] }, door: { kind: 'door', material: 'door', at: door, affords: ['sit'] } },
    authored: { intents, holds, stimuli, goals: { [B]: 'test them: who will give, who will strike', [AN]: 'be rid of him' },
      couplings: [{ from: AN, to: B, via: 'wood', t0: q(tHit - 0.3), t1: q(tHit + 0.3) }],
      causal: { tau: 0.7, actions: {
        [B]: [{ a: 'beg', base: 1.0, f: { 'after:anRail': -1.0 } }, { a: 'answer him', base: -1.0, f: { 'after:anRail': 2.0 } }, { a: 'stand like a rock', base: -2.0, f: { 'after:sHit': 4.0 } }, { a: 'curse him', base: -2.5, f: { 'after:bGo': 3.5 } }],
        [AN]: [{ a: 'ignore him', base: 0.5, f: { 'after:sEgypt': -1.5 } }, { a: 'rail', base: -1.0, f: { 'after:sEgypt': 2.5 } }, { a: 'throw', base: -2.5, f: { 'after:sSalt': 3.5 } }] } },
      camera: { follow: true },
    },
  };
};
