/* The Raft (OD-B05-S04, Odyssey 5): Calypso leads Odysseus to the tall trees at the island's edge and gives him the tools; he fells,
   trims, bores, joins, decks and fences the timbers over four days, rigs mast, yard, sail and steering oar; she bathes and clothes him,
   loads the raft and sends a warm wind behind it.

   Four days of carpentry in a minute, as labour on one clock. Calypso's instructions are carried on her line's stresses (DECLARE: the
   trees shown, the axe held out); she gives him the axe at "axe" (OFFER, TAKE: the hands solved to one meeting point, the axe changing
   hands). He goes to the trees (the take's walk at K2) and works: each stage a TOOL_WORK of its own kind and period, caused by the
   stage before it, on the voice's words (fell: chop; trim: carve with the adze; bore: the auger; join and deck: the mallet, chop at a
   short period; fence: carve), the weight and heat of each in the score; the raft grows (a SIGHT stimulus per stage). He rigs it (the
   take's move to K3; STRAIN at the mast and the yard, TOOL_WORK at the steering oar), then she comes with food and water (the take's
   K4) and he pushes off with the warm wind at his back (a SOUND of the wind; a HOLD with his reason: home). Calypso watches him from the
   shore to the end (a HOLD, alive). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', C = 'calypso', trees = [-65, 40, 195], raft = [-40, 20, -62];
  const clip = gi => M.clips.find(c => c.gi === gi), c2 = clip(2), c3 = clip(3), c4 = clip(4), c5 = clip(5);
  const V2 = X.voiceOf(c2), V3 = X.voiceOf(c3), V4 = X.voiceOf(c4), V5 = X.voiceOf(c5), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tAxe = q(w(V2, 'axe', 15.5)), tWind = q(w(V5, 'wind', 58.0));
  const stages = [['fells', 29.6, 'chop', 1.1, 'fells the trees, twenty of them'], ['trims', 30.6, 'carve', 0.7, 'trims them with the adze'], ['bores', 32.6, 'bore', 0.9, 'bores them with the auger'],
    ['joins', 33.9, 'chop', 0.6, 'joins them with pegs and cramps'], ['decks', 34.6, 'chop', 0.5, 'decks her over'], ['fences', 35.8, 'carve', 0.8, 'fences her with willow against the sea']].map(([word, d, how, P, label], k) => ({ k, t: q(w(V3, word, d)), how, P, label }));
  /* ── the trees, the tools ── */
  stimuli.push({ id: 'sEdge', t0: 0.05, t1: 0.4, kind: 'SCENE', label: 'the island\'s edge: alder, poplar and fir, long dry', because: [] });
  I({ id: 'cShow', actor: C, kind: 'DECLARE', target: O, utterance: c2.gi, t0: c2.at - 0.2, t1: c2.at + c2.dur, label: 'here the tall trees stand: take the great bronze axe', params: { shapes: ['point', 'show', 'describe', 'offer', 'show', 'open'], side: 'R', lookAt: O }, because: [{ id: 'v' + c2.gi, rel: 'realises' }, { id: 'sEdge' }] });
  I({ id: 'oHear', actor: O, kind: 'LISTEN', target: C, t0: c2.at + 0.3, t1: q(tAxe - 1.0), label: 'hears how it is to be done', params: { nods: [q(w(V2, 'water', 12.0) + 0.2)] }, because: [{ id: 'cShow' }] });
  I({ id: 'oNear', actor: O, kind: 'STEP', target: C, t0: q(tAxe - 1.6), t1: q(tAxe - 1.0), label: 'a step to her for it', params: { dist: 0.2, dur: 0.6 }, because: [{ id: 'oHear' }] });
  I({ id: 'cNear', actor: C, kind: 'STEP', target: O, t0: q(tAxe - 1.5), t1: q(tAxe - 0.9), label: 'a step to him with it', params: { dist: 0.2, dur: 0.6 }, because: [{ id: 'oNear' }] });
  I({ id: 'cGive', actor: C, kind: 'OFFER', target: O, t0: q(tAxe - 0.9), t1: q(tAxe + 1.2), label: 'the great bronze axe, sharp on both edges', params: { with: 'oTake' }, because: [{ id: 'oNear' }] });
  I({ id: 'oTake', actor: O, kind: 'TAKE', target: C, t0: q(tAxe - 0.9), t1: q(tAxe + 1.2), label: 'takes the axe', params: { at: q(tAxe + 0.2), prop: 'axe', reach: 0.6, from: 'calypso:L' }, because: [{ id: 'cGive' }] });
  I({ id: 'oBack', actor: O, kind: 'STEP', target: C, t0: q(tAxe + 1.3), t1: q(tAxe + 2.1), label: 'steps back with it, to look at the trees', params: { dist: -0.4, dur: 0.8 }, because: [{ id: 'oTake' }] });
  holds.push({ id: 'hO0', actor: O, t0: q(tAxe + 2.2), t1: K2.win[0] - 0.1, reason: 'the axe in his hand: the way home is in these trees', params: { look: [[trees, 1.8], [C, 1.2]], weight: true, grip: 'R' }, because: [{ id: 'oBack' }] });
  holds.push({ id: 'hC0', actor: C, t0: q(tAxe + 1.3), t1: K2.win[0] - 0.1, reason: 'she has given him the means to leave her', params: { look: [[O, 2.6]], weight: true }, because: [{ id: 'cGive' }] });
  /* ── the four days ── */
  I({ id: 'oGo', actor: O, kind: 'APPROACH', key: 'K2', t0: K2.win[0], t1: K2.win[1], target: trees, label: 'to the trees', because: [{ id: 'hO0' }] });
  stages.forEach((S, j) => { const t1 = j + 1 < stages.length ? stages[j + 1].t - 0.05 : q(K3.win[0] - 0.1);
    I({ id: 'work' + j, actor: O, kind: 'TOOL_WORK', t0: S.t, t1, label: S.label, params: { how: S.how, period: S.P }, because: [{ id: j ? 'work' + (j - 1) : 'oGo' }, ...(j ? [] : [{ id: 'v' + c3.gi, rel: 'realises' }])] });
    stimuli.push({ id: 'sStage' + j, t0: q(t1 - 0.2), t1, kind: 'SIGHT', label: ['twenty trees down', 'trimmed true to the line', 'bored', 'joined', 'decked', 'fenced: a raft'][j], actor: O, because: [{ id: 'work' + j }] }); });
  holds.push({ id: 'hDays', actor: O, t0: K2.win[1] + 0.1, t1: stages[0].t - 0.1, reason: 'the first tree: he sizes it', params: { look: [[trees, 1.6]], weight: true, grip: 'R' }, because: [{ id: 'oGo' }] });
  /* ── the rigging ── */
  I({ id: 'oRaft', actor: O, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: raft, label: 'down to the raft at the water', because: [{ id: 'sStage5' }] });
  I({ id: 'cCome', actor: C, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: O, label: 'down to the shore with the cloth', because: [{ id: 'sStage5' }] });
  I({ id: 'oMast', actor: O, kind: 'STRAIN', t0: q(w(V4, 'mast', 42.2)), t1: q(w(V4, 'sail', 43.9) - 0.1), label: 'steps the mast and the yard', because: [{ id: 'oRaft' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  I({ id: 'oSail', actor: O, kind: 'ROPE', t0: q(w(V4, 'sail', 43.9)), t1: q(w(V4, 'steering', 45.0) - 0.1), label: 'bends on the sail she wove', params: { how: 'haul' }, because: [{ id: 'oMast' }] });
  I({ id: 'oOar', actor: O, kind: 'TOOL_WORK', t0: q(w(V4, 'steering', 45.0)), t1: K4.win[0] - 0.1, label: 'the steering oar, and ballast', params: { how: 'carve', period: 0.9 }, because: [{ id: 'oSail' }] });
  holds.push({ id: 'hC1', actor: C, t0: K3.win[1] + 0.2, t1: K4.win[0] - 0.1, reason: 'watching the raft that will take him', params: { look: [[O, 2.0], [raft, 1.4]], weight: true }, because: [{ id: 'cCome' }] });
  /* ── the leaving ── */
  I({ id: 'cLoad', actor: C, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: O, label: 'bathes him, clothes him, loads food and water', because: [{ id: 'oOar' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  I({ id: 'oPush', actor: O, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: [-40, 20, -330], label: 'pushes off', because: [{ id: 'cLoad' }] });
  stimuli.push({ id: 'sWind', t0: tWind, t1: T, kind: 'SOUND', label: 'a warm wind behind the raft', actor: C, because: [{ id: 'cLoad' }] });
  holds.push({ id: 'hO9', actor: O, t0: K4.win[1] + 0.2, t1: T, reason: 'the steering oar in his hands: home', params: { look: [[[-40, 60, -400], 2.8], [C, 0.8]], weight: true }, because: [{ id: 'oPush' }] });
  holds.push({ id: 'hC9', actor: C, t0: K4.win[1] + 0.2, t1: T, reason: 'on the shore, watching him go', params: { look: [[O, 3.2]], weight: true }, because: [{ id: 'cLoad' }] });
  return {
    type: 'machinery', title: 'The Raft: the trees, the four days, the wind',
    actors: { [O]: { role: 'the builder', body: 'minifig', principal: true }, [C]: { role: 'the goddess who lets him go', body: 'minifig', principal: true, affect: { weight: 0.6 } } },
    objects: { axe: { kind: 'axe', material: 'weapon', holder: C + ':R', affords: ['fell'] }, trees: { kind: 'trees', material: 'wood', at: trees, affords: ['fell'] }, raft: { kind: 'raft', material: 'wood', at: raft, affords: ['sail'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'build the raft and go home', [C]: 'let him go as the gods command' },
      couplings: [{ from: O, to: 'axe', via: 'weapon', t0: tAxe, t1: K3.win[0] }, { from: 'axe', to: 'trees', via: 'wood', t0: stages[0].t, t1: K3.win[0] }],
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'listen', base: 1.0, f: { 'after:oTake': -2.0 } }, { a: 'work the timber', base: -1.5, f: { 'after:oTake': 3.2, 'after:sStage5': -3 }, uses: ['axe', 'trees'] }, { a: 'rig her', base: -2.5, f: { 'after:sStage5': 3.4 } }, { a: 'sail', base: -3.0, f: { 'after:sWind': 4.0 } }],
        [C]: [{ a: 'show him the trees', base: 1.0, f: { 'after:oTake': -2 } }, { a: 'watch him work', base: -1.0, f: { 'after:oTake': 2.4 } }, { a: 'load the raft', base: -2.8, f: { 'after:oOar': 3.4 } }, { a: 'keep him', base: -3.5, f: {} }],
      } },
      camera: { follow: true },
    },
  };
};
