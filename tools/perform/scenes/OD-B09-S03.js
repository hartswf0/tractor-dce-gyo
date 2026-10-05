/* The Lotus-Eaters (OD-B09-S03, Odyssey 9): after nine days of the north wind the ships land; three scouts go inland; the
   Lotus-eaters, meaning no harm, give them the lotus; whoever tastes it wants nothing more of home; Odysseus comes and drags them back
   weeping and has them bound under the benches.

   A stillness that must read as bliss, not a dead frame, then a violent rescue. The scouts go up among the Lotus-eaters, wary (a HOLD
   with its reasons, the heads going between the strangers and each other); the Lotus-eaters welcome them (GESTURE offer: the fruit held
   out at "offer lotus"); the scouts take it and eat (EAT, the second after the first, the third after both: each caused by the one
   before). The lotus works (a TASTE stimulus): each goes slack (POSTURE slump, held) and still in a HOLD whose reason is bliss, the
   breath slow and the head turning only to the sky or the flowers (looks held for seconds, not a frozen frame). Odysseus comes up from
   the ship (the take's walk at K4, owned here) and gives his orders on his line's stresses (DECLARE); he seizes the nearest by the
   shoulders (SEIZE, answered by a struggle), and the man weeps as he is taken (WEEP); the others hold on to where they are (a HOLD:
   they do not want to go). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K3 = K('K3'), K4 = K('K4'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', S = ['three-scouts-1', 'three-scouts-2', 'three-scouts-3'], L = ['lotus-eaters-1', 'lotus-eaters-2'], sky = [0, 800, 400], flowers = [60, 20, 200];
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c2 = clip(2), c3 = clip(3), c4 = clip(4), c6 = clip(6);
  const V2 = X.voiceOf(c2), V3 = X.voiceOf(c3), V4 = X.voiceOf(c4), V6 = X.voiceOf(c6), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tOffer = q(w(V3, 'offer', 18.8)), tTaste = q(w(V4, 'taste', 22.4)), tWeep = q(w(V6, 'weep', 30.5)), tBind = q(w(V6, 'bind', 31.5)), tOars = q(w(V6, 'oars', 36.5));
  /* ── the landing; the scouts among the strangers ── */
  stimuli.push({ id: 'sLand', t0: 0.05, t1: 0.4, kind: 'SCENE', label: 'after nine days of the north wind: the land of the Lotus-eaters', because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  holds.push({ id: 'hO0', actor: O, t0: 0.3, t1: q(c2.at + c2.dur), reason: 'aboard: he sends three men inland to learn who lives here', params: { look: [[S[1], 2.0], [[0, 60, 220], 1.6]], weight: true }, because: [{ id: 'sLand' }, { id: 'v' + c2.gi, rel: 'realises' }] });
  S.forEach((s, k) => holds.push({ id: 'hS0' + k, actor: s, t0: 0.3, t1: tOffer - 0.1, reason: 'inland among strangers: wary', params: { look: [[L[k % 2], 1.6], [S[(k + 1) % 3], 0.9], [L[(k + 1) % 2], 1.2]], weight: true, offset: 0.3 * k }, because: [{ id: 'sLand' }] }));
  L.forEach((l, k) => holds.push({ id: 'hL0' + k, actor: l, t0: 0.3, t1: tOffer - 0.5, reason: 'gentle, at ease: strangers are welcome', params: { look: [[S[k], 2.2], [flowers, 1.4]], weight: true, offset: 0.4 * k }, because: [{ id: 'sLand' }] }));
  /* ── the lotus ── */
  L.forEach((l, k) => I({ id: 'lOffer' + k, actor: l, kind: 'GESTURE', target: S[k], t0: q(tOffer - 0.4 + 0.3 * k), t1: q(tOffer + 1.8 + 0.3 * k), label: 'holds out the honey-sweet fruit', params: { shape: 'offer', at: tOffer + 0.3 * k, side: 'R', amp: 0.8, hold: 0.8 }, because: [{ id: 'v' + c3.gi, rel: 'realises' }] }));
  S.forEach((s, k) => I({ id: 'sEat' + k, actor: s, kind: 'EAT', t0: q(K3.win[1] + 0.2 + 0.5 * k), t1: q(tTaste + 1.4 + 0.5 * k), label: k ? 'eats, as the man beside him did' : 'tastes the lotus', params: { at: [q(K3.win[1] + 0.6 + 0.5 * k), q(tTaste + 0.3 * k)] }, because: [{ id: k ? 'sEat' + (k - 1) : 'lOffer0' }] }));
  stimuli.push({ id: 'sTaste', t0: tTaste, t1: q(c4.at + c4.dur), kind: 'TASTE', label: 'those who taste it lose all desire for home', because: [{ id: 'sEat0' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  S.forEach((s, k) => { I({ id: 'sSlack' + k, actor: s, kind: 'POSTURE', t0: q(tTaste + 1.5 + 0.5 * k), t1: K4.win[0], label: 'the body goes slack', params: { to: 'slump', enter: 1.2, leave: 1.0 }, because: [{ id: 'sTaste' }] });
    holds.push({ id: 'hBliss' + k, actor: s, t0: q(tTaste + 2.8 + 0.5 * k), t1: K4.win[0] - 0.1, reason: 'bliss: no movement but breath, and the wish for home gone', params: { look: [[sky, 3.5], [flowers, 3.0]], still: true, offset: 0.7 * k }, because: [{ id: 'sSlack' + k }] }); });
  L.forEach((l, k) => holds.push({ id: 'hL1' + k, actor: l, t0: q(tOffer + 2.0 + 0.3 * k), t1: T, reason: 'content: they meant no harm', params: { look: [[S[k], 2.6], [flowers, 2.0]], weight: true, offset: 0.4 * k }, because: [{ id: 'lOffer' + k }] }));
  /* take 2 (odyssey/experiments/OD-B09-S03.json): the lotus as drugged motion, not a frozen frame: the Lotus-eaters drowse from the
     first drawing (they live on it), each scout from the moment it takes him; the hand drifts to the flowers and comes back short */
  L.forEach((l, k) => I({ id: 'lDrowse' + k, actor: l, kind: 'DROWSE', t0: 0.3 + 0.6 * k, t1: T, label: 'a Lotus-eater: the lotus in him, swaying, the hand to the flowers', params: { period: 3.8 + 0.5 * k, sway: 0.05, side: 'L', reach: flowers, nod: 0.22 }, because: [{ id: 'sLand' }] }));
  S.forEach((s, k) => I({ id: 'sDrowse' + k, actor: s, kind: 'DROWSE', t0: q(tTaste + 2.2 + 0.5 * k), t1: k ? T : q(tWeep - 0.7), label: 'drugged: the body slack and swaying, the head nodding, the hand going out to the lotus', params: { period: 3.0 + 0.4 * k, sway: 0.08, side: k === 1 ? 'L' : 'R', reach: flowers, nod: 0.32 }, because: [{ id: 'sSlack' + k }] }));
  /* ── the rescue ── */
  I({ id: 'oCome', actor: O, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: S[0], label: 'up from the ship for his men', because: [{ id: 'sTaste' }] });
  I({ id: 'oOrder', actor: O, kind: 'DECLARE', target: S[0], utterance: c6.gi, t0: c6.at - 0.2, t1: c6.at + c6.dur, label: 'take them, though they weep; bind them under the benches', params: { shapes: ['point', 'chop', 'fist', 'point', 'chop'], side: 'L' }, because: [{ id: 'v' + c6.gi, rel: 'realises' }, { id: 'oCome' }] });
  I({ id: 'oSeize', actor: O, kind: 'SEIZE', target: S[0], t0: q(tWeep - 0.6), t1: q(tOars + 1.0), label: 'takes him by the shoulders', params: { answer: 'struggle' }, because: [{ id: 'oOrder' }] });
  I({ id: 'sWeep0', actor: S[0], kind: 'WEEP', t0: q(tWeep + 0.2), t1: q(tBind + 3.0), label: 'weeps to be taken from it', params: { side: 'L', rate: 3.0 }, because: [{ id: 'oSeize' }] });
  S.slice(1).forEach((s, k) => { I({ id: 'sSee' + k, actor: s, kind: 'REACT', t0: q(tWeep + 0.4 + 0.3 * k), t1: q(tWeep + 1.6 + 0.3 * k), label: 'the captain: he does not want to go', params: { how: 'turn', lookAt: O, latencyScale: 2.0 }, because: [{ id: 'oSeize' }] });
    holds.push({ id: 'hStay' + k, actor: s, t0: q(tWeep + 1.7 + 0.3 * k), t1: T, reason: 'he holds to where he is: no wish for home', params: { look: [[O, 1.4], [flowers, 2.4]], still: true, offset: 0.5 * k }, because: [{ id: 'sSee' + k }] }); });
  holds.push({ id: 'hO1', actor: O, t0: q(tOars + 1.1), t1: T, reason: 'before another man tastes it: he watches the rest', params: { look: [[S[1], 1.4], [S[2], 1.4], [L[0], 1.0]], weight: true }, because: [{ id: 'oSeize' }] });
  return {
    type: 'revelation', title: 'The Lotus-Eaters: the fruit, the bliss, the rescue',
    actors: { [O]: { role: 'the captain', body: 'minifig', principal: true, affect: { heat: 0.6 } }, ...Object.fromEntries(S.map((s, k) => [s, { role: 'a scout', body: 'minifig', group: 'scouts', principal: !k }])), ...Object.fromEntries(L.map(l => [l, { role: 'a Lotus-eater', body: 'minifig', group: 'lotus' }])) },
    objects: { lotus: { kind: 'fruit', material: 'plant', at: [60, 20, 200], affords: ['eat'] }, ship: { kind: 'ship', material: 'wood', at: [0, 60, -60], exit: true, affords: ['board'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'every man back aboard', [S[0]]: 'stay here forever', [L[0]]: 'share the lotus' },
      couplings: [{ from: O, to: S[0], via: 'flesh', t0: tWeep - 0.6, t1: tOars + 1.0 }],
      causal: { tau: 0.7, actions: {
        ...Object.fromEntries(S.map((s, k) => [s, [{ a: 'look about', base: 1.0, f: { 'after:sTaste': -2.5 } }, { a: 'eat the lotus', base: -2.0, f: { ['after:lOffer' + (k % 2)]: 2.8, 'after:sTaste': -1.0 } }, { a: 'go back to the ship', base: -0.5, f: { 'after:sTaste': -3.0 } },
          { a: 'lie in the flowers', base: -2.5, f: { 'after:sTaste': 4.0 } }, { a: 'fight the captain', base: -3.0, f: { 'after:oSeize': 2.8 } }]])),
        [O]: [{ a: 'wait for the scouts', base: 1.0, f: { 'after:sTaste': -2.0 } }, { a: 'go up for them', base: -2.0, f: { 'after:sTaste': 3.0 } }, { a: 'drag them back', base: -2.5, f: { 'after:oOrder': 3.2 } }],
      } },
      camera: { follow: true },
    },
  };
};
