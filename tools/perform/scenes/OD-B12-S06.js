/* The Cattle Are Slaughtered (OD-B12-S06, Odyssey 12): Eurylochus persuades the starving crew, they kill Helios's cattle with oak leaves
   for barley and water for wine, and the omen: the hides crawl, the meat lows on the spits. Odysseus sleeps inland through all of it.

   Over the first score's creatures (tools/perform/scenes/_auto.js: the herd on the shore while the take stages it, the slain beast after)
   and walks. A persuader working a crowd: Eurylochus's line carried on its stresses (DECLARE: the open hand, the chest, the plea, the
   point at the cattle, the fist), his head going from man to man; the crew yield one by one (a nod each, the next caused by the one
   before: the crowd tipping), the last looking first toward where Odysseus sleeps (he forbade it). The cattle graze, unknowing. They go
   down to the herd (the take's walk at K3). The sacrifice: the knife to the sky and the stroke (SACRIFICE), the water poured for wine
   (POUR), the butchery (TOOL_WORK chop), the spits turned (TOOL_WORK bore, on one clock). The omen: the slain beast's hide creeps
   (CRAWL on the rig) and the meat lows (a SOUND); the crew startle and hold in dread; then hunger wins and they eat (EAT). Lampetie runs
   to Helios (a SCENE stimulus: the next scene's bolt); they eat on. */
'use strict';
module.exports = function author(M, X) {
  const N = require('../../../odyssey/perform/needs.json').scenes['OD-B12-S06'], base = require('./_auto.js')(M, X, N), A = base.authored;
  const K = id => M.keys.find(k => k.id === id), K3 = K('K3'), K4 = K('K4'), K5 = K('K5'), T = M.total, q = t => Math.round(t * 12) / 12;
  const Eu = 'eurylochus', Od = 'sleeping-odysseus', crew = Object.keys(M.H).filter(i => /crew/.test(i)), cows = Object.keys(A.creatures || {}).filter(c => /^cow/.test(c)), slain = (A.creatures || {}).slain ? 'slain' : null;
  const clip = gi => M.clips.find(c => c.gi === gi), c2 = clip(2), c3 = clip(3), c4 = clip(4), c5 = clip(5);
  const V2 = X.voiceOf(c2), V3 = X.voiceOf(c3), V4 = X.voiceOf(c4), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  /* keep the first score's walks (the layout's moves) and its stimuli of the chain; the rest is directed here */
  const walks = A.intents.filter(I => I.kind === 'APPROACH' && I.key);
  const intents = [], holds = [], stimuli = A.stimuli.filter(s => /^sC/.test(s.id)), I = o => (intents.push(o), o.id);
  const tCattle = q(w(V2, 'cattle', 5.4)), tStarve = q(w(V2, 'starve', 8.1)), tOak = q(w(V3, 'oak', 12.6)), tWater = q(w(V3, 'water', 15.5)), tKill = q(w(V3, 'kill', 17.2)), tRoast = q(w(V3, 'roast', 20.3));
  const tCrawl = q(w(V4, 'crawl', 24.1)), tBellow = q(w(V4, 'bellows', 26.8)), herd = 'sacred cattle';
  /* ── Odysseus asleep inland; the herd grazing ── */
  holds.push({ id: 'hSleep', actor: Od, t0: 0.2, t1: T, reason: 'asleep inland, where he went to pray: he does not see it', params: { look: [], still: true }, because: [{ id: 'sC0' }] });
  cows.forEach((c, k) => I({ id: 'cGraze' + k, actor: c, kind: 'GRAZE', t0: 0.2 + 0.3 * k, t1: K3.win[0], label: 'Helios\'s cattle graze, unknowing', because: [{ id: 'sC0' }] }));
  /* ── the persuasion: the crowd tipping one by one ── */
  I({ id: 'euPersuade', actor: Eu, kind: 'DECLARE', target: crew[0], utterance: c2.gi, t0: c2.at - 0.3, t1: c2.at + c2.dur, label: 'every death is hateful, but hunger is the worst: take the best of the cattle', params: { shapes: ['open', 'chest', 'plead', 'point', 'fist'], side: 'R', lookAt: crew[2] }, because: [{ id: 'v' + c2.gi, rel: 'realises' }, { id: 'sC0' }] });
  const order = [crew[2], crew[0], crew[3], crew[1], crew[4]].filter(Boolean);
  order.forEach((c, k) => { const t = q(tCattle + 0.3 + 0.55 * k);
    holds.push({ id: 'hHunger' + k, actor: c, t0: 0.4, t1: t - 0.1, reason: 'starving, listening: the cattle are there', params: { look: [[Eu, 2.2], [herd, 1.3], [k ? order[k - 1] : Eu, 0.9]], weight: true, offset: 0.25 * k }, because: [{ id: 'euPersuade' }] });
    if (k === order.length - 1) I({ id: 'iDoubt', actor: c, kind: 'ATTEND', target: Od, t0: t - 1.6, t1: t - 0.2, label: 'a look toward where Odysseus sleeps: he forbade it', because: [{ id: 'hHunger' + (k - 1) }] });
    I({ id: 'iYield' + k, actor: c, kind: 'REACT', t0: t, t1: t + 1.1, label: k ? 'yields, as the man beside him did' : 'the first to yield', params: { how: 'nod', lookAt: Eu }, because: [k ? { id: 'iYield' + (k - 1) } : { id: 'euPersuade' }] }); });
  if (c2.at + c2.dur + 0.6 < K3.win[0]) holds.push({ id: 'hEu1', actor: Eu, t0: c2.at + c2.dur + 0.1, t1: K3.win[0] - 0.1, reason: 'he has them: he waits for the last', params: { look: [[order[order.length - 1], 1.4], [herd, 1.4]], weight: true }, because: [{ id: 'euPersuade' }] });
  stimuli.push({ id: 'sAgreed', t0: tStarve + 0.4, t1: tStarve + 0.7, kind: 'SIGHT', label: 'every man has nodded: they go for the cattle', because: [{ id: 'iYield' + (order.length - 1) }] });
  for (const W of walks) intents.push({ ...W, because: W.key === 'K3' ? [{ id: 'sAgreed' }] : W.because });
  /* ── the sacrifice with substitutes ── */
  I({ id: 'euSac', actor: Eu, kind: 'SACRIFICE', target: slain || herd, t0: K3.win[1] + 0.2, t1: tWater - 0.3, label: 'oak leaves for barley: the knife to the sky, the stroke', because: [{ id: 'v' + c3.gi, rel: 'realises' }] });
  I({ id: 'euPour', actor: Eu, kind: 'POUR', t0: tWater - 0.2, t1: tWater + 1.3, label: 'water for wine on the victims', params: { at: [tWater + 0.3] }, because: [{ id: 'euSac' }] });
  crew.slice(0, 3).forEach((c, k) => I({ id: 'iButcher' + k, actor: c, kind: 'TOOL_WORK', t0: q(tKill + 0.2 * k), t1: tRoast + 0.4, label: 'they kill and butcher', params: { how: 'chop', period: 1.1 + 0.1 * k }, because: [{ id: 'euPour' }] }));
  crew.slice(3).forEach((c, k) => holds.push({ id: 'hWait' + k, actor: c, t0: K3.win[1] + 0.2, t1: tKill - 0.1, reason: 'at the victims, watching the rite', params: { look: [[Eu, 1.6], [slain || herd, 1.8]], weight: true, offset: 0.4 * k }, because: [{ id: 'euSac' }] }));
  crew.slice(3).forEach((c, k) => I({ id: 'iSpit' + k, actor: c, kind: 'TOOL_WORK', t0: q(tKill + 0.4), t1: K4.win[0] - 0.1, label: 'the meat on the spits, turned over the fire', params: { how: 'bore', period: 1.4 }, because: [{ id: 'euPour' }] }));
  holds.push({ id: 'hEu2', actor: Eu, t0: tWater + 1.4, t1: K4.win[0] - 0.1, reason: 'the rite done: he watches the fire', params: { look: [[crew[3] || crew[0], 1.8], [slain || herd, 1.4]], weight: true }, because: [{ id: 'euPour' }] });
  /* ── the omen ── */
  if (slain) I({ id: 'sCrawlI', actor: slain, kind: 'CRAWL', t0: tCrawl - 0.4, t1: tBellow + 2.0, label: 'the flayed hides creep; the meat lows on the spits', params: { bellow: tBellow, period: 0.8 }, because: [{ id: 'v' + c4.gi, rel: 'realises' }, { id: 'iSpit0' }] });
  stimuli.push({ id: 'sCrawl', t0: tCrawl, t1: tCrawl + 0.4, kind: 'SIGHT', label: 'the hides crawl on the ground', actor: slain || null, because: [{ id: slain ? 'sCrawlI' : 'iSpit0' }] });
  stimuli.push({ id: 'sBellow', t0: tBellow, t1: tBellow + 1.2, kind: 'SOUND', label: 'the meat bellows on the spits, raw and roasted', actor: slain || null, because: [{ id: 'sCrawl' }] });
  [Eu, ...crew].forEach((c, k) => { I({ id: 'iOmen' + k, actor: c, kind: 'REACT', t0: q(tCrawl + 0.25 + 0.07 * k), t1: tCrawl + 1.5, label: 'the hides move', params: { how: 'startle', lookAt: slain || herd }, because: [{ id: 'sCrawl' }] });
    I({ id: 'iLow' + k, actor: c, kind: 'REACT', t0: q(tBellow + 0.2 + 0.06 * k), t1: tBellow + 1.4, label: 'the lowing', params: { how: 'flinch', lookAt: slain || herd }, because: [{ id: 'sBellow' }] });
    holds.push({ id: 'hDread' + k, actor: c, t0: tBellow + 1.5, t1: q(tBellow + 3.0 + 0.3 * k), reason: 'dread at the omen, before hunger wins', params: { look: [[slain || herd, 1.4], [Eu, 0.8]], still: true }, because: [{ id: 'iLow' + k }] }); });
  crew.forEach((c, k) => I({ id: 'iEat' + k, actor: c, kind: 'EAT', t0: q(tBellow + 3.1 + 0.3 * k), t1: T, label: 'hunger wins: they eat', params: { at: [0, 1, 2, 3, 4, 5].map(j => q(tBellow + 3.6 + 0.3 * k + j * 1.7)).filter(t => t < T - 0.5) }, because: [{ id: 'hDread' + (k + 1) }] }));
  holds.push({ id: 'hEu3', actor: Eu, t0: q(tBellow + 3.0), t1: T, reason: 'the first to eat, as he was the first to speak', params: { look: [[crew[0], 1.6], [slain || herd, 1.0]], weight: true }, because: [{ id: 'hDread0' }] });
  stimuli.push({ id: 'sHelios', t0: c5.at, t1: c5.at + 1.0, kind: 'SCENE', label: 'Lampetie runs to Helios: he will have Zeus punish them', because: [{ id: 'sBellow' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  A.intents = intents; A.holds = holds; A.stimuli = stimuli;
  A.goals = { [Eu]: 'eat, and let the gods take what they will', [crew[0]]: 'not starve', [Od]: 'sleep' };
  A.camera = { follow: true };
  return { ...base, type: 'machinery', title: 'The Cattle of the Sun: the persuasion, the rite, the omen', authored: A };
};
