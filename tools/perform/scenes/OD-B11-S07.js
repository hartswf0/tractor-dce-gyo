/* Achilles Chooses Life in Retrospect (OD-B11-S07, Odyssey 11): among the dead come Achilles with Patroclus and Antilochus, and
   Ajax standing apart. Odysseus praises Achilles: no man was ever more blessed; alive we honoured you like a god, here you rule
   among the dead; do not grieve at dying. Then he tells him of his son: he brought Neoptolemus from Scyros himself, and the boy was
   first in council and foremost in the fight. Achilles strides off across the asphodel meadow, glad that his son is great. Only Ajax
   stands apart, angry still over the arms of Achilles; Odysseus speaks soft words to him, and the shade answers nothing and goes.

   The chain: the shades come (SCENE, the take's K1 their places) -> Odysseus's praise (DECLARE) -> Achilles answers (DECLARE, K2a:
   rather a hired man alive than king over all the dead; an added turn, odyssey/kits/cut-restore.json) -> the son named (a WORD) -> Achilles's head lifts (REACT) -> the telling (DECLARE) -> his joy (DECIDE) and
   the stride away (K4, APPROACH; his companions follow, caused by his going) -> Odysseus turns to Ajax (the SIGHT of him apart) ->
   soft words (GESTURE open) -> Ajax turns away in silence (K5, APPROACH). */
'use strict';
module.exports = function author(M, X) {
  const O = 'odysseus', AC = 'achilles', AJ = 'ajax', PA = 'patroclus', AL = 'antilochus';
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win || [K(id).t, K(id).t + 0.6], T = M.total, q = t => Math.round(t * 12) / 12;
  const all = M.clips.slice().sort((a, b) => a.at - b.at), cA = all.find(c => c.voice === AC), clips = all.filter(c => c !== cA), cN = clips[0], cP = clips[1], cS = clips[2], cGo = clips[3], cAj = clips[4];
  const VS = X.voiceOf(cS), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); };
  const meadow = [-300, 40, 260];
  stimuli.push({ id: 'sShades', t0: 0.05, t1: 0.4, kind: 'SCENE', label: 'the shade of Achilles, and with him Patroclus and Antilochus; Ajax apart', because: [{ id: 'v' + cN.gi, rel: 'realises' }] });
  H({ id: 'hO0', actor: O, t0: 0.3, t1: q(cP.at - 0.25), reason: 'the greatest of the Achaeans, a shade before him', params: { look: [[AC, 2.6], [AJ, 0.8], [AC, 2.2]], weight: true }, because: [{ id: 'sShades' }] });
  H({ id: 'hAc0', actor: AC, t0: 0.3, t1: q(cA ? cA.at - 0.4 : cS.at + 0.5), reason: 'he knows Odysseus: what brings you living to the dead?', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'sShades' }] });
  [PA, AL].forEach((m, k) => H({ id: 'hC0' + k, actor: m, t0: 0.3 + 0.2 * k, t1: q(W('K4')[0] - 0.1), reason: 'at Achilles\'s side, as in life', params: { look: [[O, 2.0], [AC, 1.4]], weight: true, offset: 0.4 * k }, because: [{ id: 'sShades' }] }));
  H({ id: 'hAj0', actor: AJ, t0: 0.3, t1: q(W('K5')[0] - 0.1), reason: 'apart: still angry over the arms of Achilles', params: { look: [[O, 0.8], [meadow, 2.4], [O, 0.6]], weight: true }, because: [{ id: 'sShades' }] });
  /* ── the praise ── */
  I({ id: 'oPraise', actor: O, kind: 'DECLARE', target: AC, utterance: cP.gi, t0: q(Math.min(cP.at - 0.2, W('K2')[0] - 0.3)), t1: q(cP.at + cP.dur), label: 'no man was ever more blessed: here you rule among the dead; do not grieve at dying', params: { shapes: ['open', 'show', 'open'], side: 'R', maxBeats: 1, amp: 0.8 }, because: [{ id: 'v' + cP.gi, rel: 'realises' }] });
  I({ id: 'oStep', actor: O, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: AC, label: 'the hand out to him', because: [{ id: 'oPraise' }] });
  I({ id: 'acHear', actor: AC, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: O, label: 'a step nearer, listening', because: [{ id: 'oPraise', latency: 0.3 }] });
  /* ── his answer: rather a hired man alive than king over all the dead (an added turn: odyssey/kits/cut-restore.json) ── */
  if (cA) {
    I({ id: 'acAnswer', actor: AC, kind: 'DECLARE', target: O, utterance: cA.gi, t0: q(cA.at - 0.2), t1: q(cA.at + cA.dur), label: 'say not a word in death\'s favour: rather a hired man, alive, than rule over all the dead', params: { shapes: ['dismiss', 'chest', 'open'], side: 'R', maxBeats: 2, amp: 0.85 }, because: [{ id: 'oPraise' }, { id: 'v' + cA.gi, rel: 'realises' }] });
    I({ id: 'acTurn', actor: AC, kind: 'APPROACH', key: 'K2a', t0: W('K2a')[0], t1: W('K2a')[1], target: O, label: 'the head up to him, bitter', because: [{ id: 'acAnswer', rel: 'anticipates' }] });
    I({ id: 'oStill', actor: O, kind: 'APPROACH', key: 'K2a', t0: W('K2a')[0], t1: W('K2a')[1], target: AC, label: 'the hand drops', because: [{ id: 'acAnswer', latency: 0.3 }] });
    H({ id: 'hOA', actor: O, t0: q(W('K2a')[1] + 0.05), t1: q(cA.at + cA.dur + 0.3), reason: 'the greatest of the Achaeans would rather be a hired man, alive', params: { look: [[AC, 3.0]], weight: true }, because: [{ id: 'acAnswer' }] });
    H({ id: 'hAcA', actor: AC, t0: q(cA.at + cA.dur + 0.05), t1: q(cS.at + 0.5), reason: 'he has said it; he waits for news of the living', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'acAnswer' }] });
  }
  /* ── the son ── */
  const tSon = q(w(VS, 'neoptolemus', cS.at + 2.5));
  stimuli.push({ id: 'sSon', t0: tSon, t1: q(tSon + 0.4), kind: 'WORD', label: '"your son Neoptolemus"', actor: O, because: [{ id: 'v' + cS.gi, rel: 'realises' }] });
  I({ id: 'oTell', actor: O, kind: 'DECLARE', target: AC, utterance: cS.gi, t0: q(Math.max(cS.at - 0.2, W('K3')[1] + 0.05)), t1: q(cS.at + cS.dur), label: 'I brought him from Scyros myself: first in council, foremost in the fight', params: { shapes: ['chest', 'point', 'open'], side: 'R', maxBeats: 1, amp: 0.9 }, because: [{ id: cA ? 'acAnswer' : 'oStep' }, { id: 'v' + cS.gi, rel: 'realises' }] });
  I({ id: 'acLift', actor: AC, kind: 'REACT', t0: q(tSon + 0.3), t1: q(tSon + 1.3), label: 'the head lifts at his son\'s name', params: { how: 'turn', lookAt: O }, because: [{ id: 'sSon', latency: 0.3 }] });
  I({ id: 'acListen', actor: AC, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: O, label: 'leans to hear of his son', because: [{ id: 'oPraise' }] });
  H({ id: 'hAc1', actor: AC, t0: q(tSon + 1.35), t1: q(W('K4')[0] - 0.85), reason: 'he hears of his son, the father in him alive', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'acLift' }] });
  H({ id: 'hO1', actor: O, t0: q(cS.at + cS.dur + 0.05), t1: q(W('K4')[0] + 0.3), reason: 'he has given the dead man the one thing he wanted', params: { look: [[AC, 3.0]], weight: true }, because: [{ id: 'oTell' }] });
  /* ── the stride away ── */
  I({ id: 'acJoy', actor: AC, kind: 'DECIDE', t0: q(W('K4')[0] - 0.8), t1: q(W('K4')[0]), label: 'his son is great: he goes rejoicing', because: [{ id: 'oTell' }, { id: 'v' + cGo.gi, rel: 'realises' }] });
  I({ id: 'acGo', actor: AC, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: meadow, label: 'strides away in long steps across the asphodel meadow', because: [{ id: 'acJoy' }] });
  [PA, AL].forEach((m, k) => I({ id: 'cGo' + k, actor: m, kind: 'APPROACH', key: 'K4', t0: q(W('K4')[0] + 0.2 * (k + 1)), t1: W('K4')[1], target: meadow, label: 'after him', because: [{ id: 'acGo', latency: 0.2 * (k + 1) }] }));
  I({ id: 'oWatch', actor: O, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: AC, label: 'turns to watch him go', because: [{ id: 'acGo', latency: 0.3 }] });
  H({ id: 'hAc2', actor: AC, t0: q(W('K4')[1] + 0.05), t1: q(W('K5')[0] - 0.1), reason: 'going, glad', params: { look: [[meadow, 3.0]], weight: false }, because: [{ id: 'acGo' }] });
  [PA, AL].forEach((m, k) => H({ id: 'hC1' + k, actor: m, t0: q(W('K4')[1] + 0.05), t1: q(W('K5')[0] - 0.1), reason: 'with him', params: { look: [[AC, 2.0], [meadow, 1.0]], weight: false }, because: [{ id: 'cGo' + k }] }));
  /* ── Ajax ── */
  stimuli.push({ id: 'sAjax', t0: q(W('K4')[1] + 0.4), t1: q(W('K4')[1] + 0.8), kind: 'SIGHT', label: 'Ajax alone, apart', actor: AJ, because: [{ id: 'oWatch' }] });
  I({ id: 'oSoft', actor: O, kind: 'GESTURE', target: AJ, t0: q(W('K5')[0] - 2.2), t1: q(W('K5')[0] - 0.2), label: 'soft words to him: let the anger go', params: { shape: 'open', at: q(W('K5')[0] - 1.8), side: 'R', amp: 0.9, hold: 1.0 }, because: [{ id: 'sAjax' }] });
  I({ id: 'ajGo', actor: AJ, kind: 'APPROACH', key: 'K5', t0: W('K5')[0], t1: W('K5')[1], target: meadow, label: 'answers nothing, and goes away among the dead', because: [{ id: 'oSoft' }] });
  I({ id: 'oTurn', actor: O, kind: 'APPROACH', key: 'K5', t0: W('K5')[0], t1: W('K5')[1], target: AJ, label: 'a step after him', because: [{ id: 'ajGo', latency: 0.2 }] });
  H({ id: 'hAj1', actor: AJ, t0: q(W('K5')[1] + 0.05), t1: T, reason: 'silent: the arms of Achilles', params: { look: [[meadow, 3.0]], weight: true }, because: [{ id: 'ajGo' }] });
  H({ id: 'hO2', actor: O, t0: q(W('K5')[1] + 0.05), t1: T, reason: 'he watches the one he wronged go into the dark', params: { look: [[AJ, 3.0]], weight: true }, because: [{ id: 'oTurn' }] });
  H({ id: 'hO1b', actor: O, t0: q(W('K4')[1] + 0.05), t1: q(W('K5')[0] - 2.25), reason: 'he watches Achilles go, and sees Ajax', params: { look: [[AC, 1.6], [AJ, 1.6]], weight: true }, because: [{ id: 'oWatch' }] });
  return {
    type: 'revelation', title: 'Achilles Chooses Life in Retrospect: the praise, the son, the stride across the asphodel, Ajax silent',
    actors: { [O]: { role: 'the living man among the dead', body: 'minifig', principal: true }, [AC]: { role: 'the shade of Achilles', body: 'minifig', principal: true }, [AJ]: { role: 'the shade of Ajax', body: 'minifig', principal: true },
      [PA]: { role: 'Patroclus', body: 'minifig' }, [AL]: { role: 'Antilochus', body: 'minifig' } },
    objects: { meadow: { kind: 'meadow', material: 'asphodel', at: meadow, affords: ['go'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'honour the dead; make peace with Ajax', [AC]: 'hear of his son', [AJ]: 'not forgive' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [AC]: [{ a: 'listen', base: 1.0, f: { 'after:acJoy': -3 } }, { a: 'answer bitterly', base: -1.0, f: { 'after:oPraise': 1.5, 'after:acAnswer': -3 } }, { a: 'go rejoicing', base: -2.0, f: { 'after:sSon': 1.5, 'after:acJoy': 4 } }],
        [AJ]: [{ a: 'stand apart', base: 1.0, f: { 'after:oSoft': -1 } }, { a: 'answer', base: -3.0, f: { 'after:oSoft': 0.5 } }, { a: 'go in silence', base: -2.0, f: { 'after:oSoft': 3.0 } }],
        [O]: [{ a: 'praise', base: 1.0, f: { 'after:oTell': -2 } }, { a: 'speak to Ajax', base: -2.0, f: { 'after:sAjax': 3.0 } }] } },
      camera: { follow: true },
    },
  };
};
