/* Anticleia and the Three Embraces (OD-B11-S04, Odyssey 11): on the Cimmerian shore, by the pit of blood. Odysseus's mother, who
   was alive when he sailed for Troy, comes up among the dead; he bids her drink the blood and know him. She drinks, knows him and
   speaks; he asks of his wife, his son, his father; he learns that no sickness took her: it was longing for him. Three times he
   springs to take her in his arms, and three times she slips from them like a shadow or a dream.

   The chain: the shade at the pit (SCENE) -> his bidding (DECLARE, the voice's turn) -> her coming to the blood (the take's K2, her
   APPROACH, caused by his word) -> her knowing him (RECOGNISE) -> his questions (DECLARE on the narrated turn) -> her answer heard
   (a WORD: "longing for you") -> his grief (WEEP, the head down: the hand to the breast) -> his DECIDE to hold her -> three embraces,
   each caused by the one before it slipping: his spring (APPROACH K4, K4a, K4b) and her drift a step away (APPROACH, caused by his
   reach) -> the arms closed on nothing (a HOLD with its reason) -> "Mother, stay". */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win || [K(id).t, K(id).t + 0.6], T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', A = 'anticleia';
  const clip = gi => M.clips.find(c => c.gi === gi), c2 = clip(2), c3 = clip(3), c4 = clip(4), c5 = clip(5);
  const V4 = X.voiceOf(c4), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); };
  const pit = [30, 20, 105];
  stimuli.push({ id: 'sShade', t0: 0.05, t1: 0.4, kind: 'SCENE', label: 'among the dead at the pit, his mother: alive when he sailed for Troy', because: [{ id: 'v' + c2.gi, rel: 'realises' }] });
  /* ── "drink of the blood and know me" ── */
  H({ id: 'hO0', actor: O, t0: 0.3, t1: q(c2.at - 0.25), reason: 'his mother among the shades: he had not known she was dead', params: { look: [[A, 3.0], [pit, 0.8]], weight: true }, because: [{ id: 'sShade' }] });
  H({ id: 'hA0', actor: A, t0: 0.3, t1: q(W('K2')[0] - 0.1), reason: 'a shade: she does not know him until she drinks', params: { look: [[pit, 2.4], [O, 0.6], [pit, 2.0]], weight: true }, because: [{ id: 'sShade' }] });
  I({ id: 'oBid', actor: O, kind: 'DECLARE', target: A, utterance: c2.gi, t0: q(c2.at - 0.2), t1: q(c2.at + c2.dur), label: 'come, mother: drink of the blood and know me; it is I, alive, your son', params: { shapes: ['open', 'show', 'chest'], side: 'R', maxBeats: 1, amp: 0.8 }, because: [{ id: 'v' + c2.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sCome', t0: q(c2.at + 1.0), t1: q(c2.at + 1.5), kind: 'WORD', label: '"drink of the blood"', actor: O, because: [{ id: 'oBid' }] });
  /* ── she drinks and knows him ── */
  I({ id: 'aCome', actor: A, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: O, label: 'comes to the blood, drinks, and knows him', because: [{ id: 'sCome' }] });
  I({ id: 'aKnow', actor: A, kind: 'RECOGNISE', target: O, t0: q(W('K2')[1] + 0.05), t1: q(W('K2')[1] + 1.8), label: 'my son: how did you come here, alive?', because: [{ id: 'aCome' }] });
  I({ id: 'oAsk', actor: O, kind: 'DECLARE', target: A, utterance: c3.gi, t0: q(Math.max(c3.at - 0.2, W('K2')[1] + 0.3)), t1: q(c3.at + c3.dur), label: 'and my wife, my son, my old father: tell me everything', params: { shapes: ['open', 'open', 'chest'], side: 'R', maxBeats: 1, amp: 0.7 }, because: [{ id: 'aKnow' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  H({ id: 'hO1', actor: O, t0: q(c2.at + c2.dur + 0.05), t1: q(W('K2')[1] + 0.25), reason: 'he watches her drink', params: { look: [[A, 3.0]], weight: true }, because: [{ id: 'oBid' }] });
  H({ id: 'hA1', actor: A, t0: q(W('K2')[1] + 1.85), t1: q(W('K4')[0] - 0.1), reason: 'she answers him: the wife faithful, the son on his lands, the old father grieving in the country', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'aKnow' }] });
  /* ── longing ── */
  const tLong = q(w(V4, 'longing', c4.at + 3.0));
  stimuli.push({ id: 'sLonging', t0: tLong, t1: q(tLong + 0.4), kind: 'WORD', label: '"longing for you": no sickness took her', actor: O, because: [{ id: 'v' + c4.gi, rel: 'realises' }] });
  I({ id: 'oBow', actor: O, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: A, label: 'the head goes down, the hand to his breast', because: [{ id: 'oAsk' }] });
  I({ id: 'oGrief', actor: O, kind: 'DECLARE', target: A, utterance: c4.gi, t0: q(Math.max(c4.at - 0.2, W('K3')[1] + 0.05)), t1: q(c4.at + c4.dur), label: 'it was longing for me that stole the honey of your life: my going killed you, mother', params: { shapes: ['chest', 'open', 'chest'], side: 'R', maxBeats: 1, amp: 0.6 }, because: [{ id: 'sLonging' }] });
  I({ id: 'oWeep', actor: O, kind: 'WEEP', t0: q(tLong + 0.4), t1: q(c4.at + c4.dur - 0.4), label: 'he weeps for her', params: { side: 'L', rate: 2.2, stay: false, pitch: -1.8, out: 0, head: 0.3, lean: 0.12 }, because: [{ id: 'sLonging', latency: 0.4 }] });
  H({ id: 'hO2', actor: O, t0: q(c3.at + c3.dur + 0.05), t1: q(tLong + 0.35), reason: 'he hears it from her own mouth', params: { look: [[A, 3.0]], weight: true }, because: [{ id: 'oAsk' }] });
  /* ── the three embraces ── */
  const E = [['K4', 'the first'], ['K4a', 'the second'], ['K4b', 'the third']];
  I({ id: 'oDecide', actor: O, kind: 'DECIDE', t0: q(W('K4')[0] - 0.7), t1: q(W('K4')[0]), label: 'to hold her once', because: [{ id: 'oGrief' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  E.forEach(([k, l], j) => {
    I({ id: 'oSpring' + j, actor: O, kind: 'APPROACH', key: k, t0: W(k)[0], t1: W(k)[1], target: A, label: l + ' time he springs to take her in his arms', because: [{ id: j ? 'aSlip' + (j - 1) : 'oDecide' }] });
    I({ id: 'aSlip' + j, actor: A, kind: 'APPROACH', key: k, t0: q(W(k)[0] + 0.15), t1: W(k)[1], target: O, label: 'she slips from his arms like a shadow or a dream', because: [{ id: 'oSpring' + j, latency: 0.15 }] });
    stimuli.push({ id: 'sEmpty' + j, t0: q(W(k)[1]), t1: q(W(k)[1] + 0.3), kind: 'SIGHT', label: 'the arms close on nothing', actor: O, because: [{ id: 'aSlip' + j }] });
    const nxt = E[j + 1] ? W(E[j + 1][0])[0] - 0.1 : T;
    H({ id: 'hO3' + j, actor: O, t0: q(W(k)[1] + 0.05), t1: q(nxt), reason: j < 2 ? 'his arms closed on air: she is there, a step away' : 'mother, why do you not stay when I would hold you?', params: { look: [[A, 3.0]], weight: true }, because: [{ id: 'sEmpty' + j }] });
    H({ id: 'hA2' + j, actor: A, t0: q(W(k)[1] + 0.05), t1: q(nxt), reason: 'a shade: she cannot be held, and she looks at her son', params: { look: [[O, 3.0]], weight: false }, because: [{ id: 'aSlip' + j }] }); });
  H({ id: 'hA1b', actor: A, t0: q(c4.at), t1: q(W('K4')[0] - 0.1), reason: 'she hears her son weep for her', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'oGrief' }] });
  return {
    type: 'revelation', title: 'Anticleia and the Three Embraces: the blood, the knowing, the longing, the arms closed on nothing',
    actors: { [O]: { role: 'the son, alive among the dead', body: 'minifig', principal: true, affect: { weight: 0.8 } }, [A]: { role: 'his mother\'s shade', body: 'minifig', principal: true, affect: { weight: 0.5 } } },
    objects: { pit: { kind: 'pit', material: 'blood', at: pit, affords: ['drink', 'know'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'know her; hold her', [A]: 'tell her son the truth' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'ask', base: 0.5, f: { 'after:sLonging': -1.5 } }, { a: 'weep', base: -1.0, f: { 'after:sLonging': 2.5 } }, { a: 'embrace her', base: -2.0, f: { 'after:oDecide': 3.0 } }],
        [A]: [{ a: 'stay a shade', base: 1.0, f: { 'after:sCome': -1.5 } }, { a: 'speak to him', base: -1.0, f: { 'after:aKnow': 2.5 } }, { a: 'slip away', base: -2.0, f: { 'after:oDecide': 3.0 } }] } },
      camera: { follow: true },
    },
  };
};
