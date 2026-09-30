/* The Laestrygonian Harbour (OD-B10-S02, Odyssey 10): the town roused, the fleet crushed in the harbour, one cable cut.

   Over the first score's sea, ships and giants (tools/perform/scenes/_auto.js, the creatures from the keyframes): the fleet rows into the
   harbour ringed by cliffs; Odysseus alone moors outside; three scouts meet the king's daughter at the spring, who points them up to her
   father's house; the queen calls Antiphates, who seizes a scout and eats him; the two others run; the giants come down the cliffs in
   thousands and throw rocks a man could hardly lift, the ships smashed and the men speared like fish; Odysseus draws his sword, cuts the
   cable and orders the oars.

   The timings are the needles' (tools/perform/machinery.js harbour): the TOWN's rousing (after the seizure) brings each giant in at its
   threshold, each throws twice, each rock lands (a blow to the FLEET's panic, to the SEA, and through them to ODYSSEUS's alarm); he cuts
   the cable when his needle is over 0.7 and under 0.95 in the take's window (resolve, not panic). Over 0.95 for a second he is frozen
   by it: regulated, his uniselector steps and he acts; held (X.frozen), he cuts only at the window's end. */
'use strict';
const Ho = require('../homeostat.js'), Ma = require('../machinery.js');
module.exports = function author(M, X) {
  const N = require('../../../odyssey/perform/needs.json').scenes['OD-B10-S02'], base = require('./_auto.js')(M, X, N), A = base.authored;
  const K = id => M.keys.find(k => k.id === id), T = M.total, q = t => Math.round(t * 12) / 12, frozen = !!X.frozen;
  const K2 = K('K2'), K3 = K('K3'), K5 = K('K5') || M.keys[M.keys.length - 1], O = 'odysseus', sc = Object.keys(M.H).filter(i => /scout/.test(i));
  const clip = gi => M.clips.find(c => c.gi === gi), cMoor = clip(2), cGirl = clip(3), cSeize = clip(4), cCut = clip(6);
  const tSeize = q(cSeize ? cSeize.at + 0.3 : K3.t), crs = Object.keys(A.creatures || {}), girl = crs.find(c => /girl/.test(c)), anti = crs.find(c => /antiphates/.test(c)), giants = crs.filter(c => /^g\d/.test(c));
  const spec = Ma.harbour({ total: T, seize: tSeize, cutWindow: [q(K5.t - 0.5), q((K5.win ? K5.win[1] : K5.t + 1) + 1)], thresholds: giants.map((_, k) => 0.3 + 0.15 * k) });
  const run = Ho.couple(spec, { frozen }), c = run.events, tCut = q(c.cut);
  A.intents = A.intents.filter(I => !crs.includes(I.actor) && !/THROW|THRUST|SEIZE|FLEE|ARM|TOOL_WORK|ROPE/.test(I.kind));
  const stim = A.stimuli, I = o => (A.intents.push(o), o.id), S_ = o => (stim.push(o), o.id), cr = (id, o) => I({ actor: id, ...o });
  const needle = (id, t, unit, label, because) => S_({ id, t0: q(t), t1: q(t) + 0.3, kind: 'NEEDLE', label: unit + ': ' + label, because: because || [], params: { unit } });
  for (const st of run.steps) S_({ id: 'sStep' + st.unit + Math.round(st.t * 12), t0: q(st.t), t1: q(st.t) + 0.2, kind: 'UNISELECTOR', label: st.unit + ' out of its limits past its dwell: its uniselector steps to position ' + st.position, because: [] });
  /* the mooring, the girl, the seizure */
  I({ id: 'iMoor', actor: O, kind: 'ROPE', t0: q(cMoor ? cMoor.at + 0.3 : 8.5), t1: q(cMoor ? cMoor.at + cMoor.dur - 0.3 : 14), label: 'the cable made fast to a rock outside', params: { how: 'haul' }, because: [{ id: 'sC1' }] });
  if (girl) { cr(girl, { id: 'gPoint', kind: 'REACH', t0: q(cGirl ? cGirl.at : K2.t), t1: q((cGirl ? cGirl.at : K2.t) + 2.2), target: [10, 200, -420], label: 'points them up to her father\'s house', params: { hand: 'R' }, because: [{ id: 'sC2' }] });
    sc.forEach((m, k) => I({ id: 'iMeet' + k, actor: m, kind: 'ATTEND', t0: q(K2.win ? K2.win[1] : K2.t) + 0.2 * k, t1: q(K2.t + 3), target: girl, label: 'up at the girl: a head higher than a house', because: [{ id: 'sC2' }] })); }
  const victim = sc[1] || sc[0];
  if (anti) { cr(anti, { id: 'aEat', kind: 'EAT', t0: tSeize, t1: tSeize + 4.6, target: victim, label: 'seizes a scout and eats him', params: { hand: 'R', reach: 0.9, lift: 110 }, because: [{ id: 'sC3' }] });
    I({ id: 'iKick', actor: victim, kind: 'STRUGGLE', t0: tSeize + 1.0, t1: tSeize + 2.8, label: 'in the fist', because: [{ id: 'aEat' }] }); }
  sc.filter(m => m !== victim).forEach((m, k) => I({ id: 'iRun' + k, actor: m, kind: 'FLEE', t0: q(tSeize + 0.8 + 0.2 * k), t1: q(tSeize + 4), label: 'runs for the ships', params: { from: anti || [10, 100, -325] }, because: [{ id: 'aEat' }] }));
  needle('sRoused', c.joins[0] || tSeize + 1, 'TOWN', 'the shout through the town: the giants come', [{ id: anti ? 'aEat' : 'sC3' }]);
  /* the giants: each joins at its needle, throws twice at the harbour; each landing a stimulus */
  const aims = [[35, -150], [-80, -176], [20, -60], [80, -210]];
  giants.forEach((g, k) => { const j = c.joins[k]; if (j == null) return; needle('sJoin' + k, j, 'TOWN', 'past ' + (0.3 + 0.15 * k).toFixed(2) + ': ' + g + ' at the cliff edge', [{ id: k ? 'sJoin' + (k - 1) : 'sRoused' }]);
    c.throws.filter(x => x.k === k).forEach(x => { const id = 'gT' + k + '_' + x.n, to = aims[(k + x.n) % aims.length];
      cr(g, { id, kind: 'THROW', t0: q(x.t), t1: q(x.t + 4.0), target: 'fleet', label: 'a rock a man could hardly lift, down at the ships', params: { to: [to[0], 0, to[1]], flight: 1.8, prop: 'rock' + k + x.n }, because: [{ id: 'sJoin' + k }] });
      S_({ id: 'sLand' + k + x.n, t0: q(x.t + 4.0), t1: q(x.t + 4.3), kind: 'SOUND', label: 'a ship smashed: the crash, the men crying', because: [{ id }] }); }); });
  /* Odysseus: the harbour watched, frozen or not, the sword, the cable, the oars */
  const lands = c.throws.map(x => 'sLand' + x.k + x.n);
  I({ id: 'iWatch', actor: O, kind: 'ATTEND', t0: q((c.lands[0] || tSeize + 5) + 0.3), t1: q(tCut - 0.8), target: [0, 30, -150], label: 'the ships smashed in the harbour, the men speared like fish', because: [{ id: lands[0] || 'sRoused' }] });
  if (c.frozenAt) needle('sFrozen', c.frozenAt, 'ODYSSEUS', 'over 0.95 for a second: frozen by it', [{ id: lands[Math.min(lands.length - 1, 3)] || 'sRoused' }]);
  needle('sResolve', tCut, 'ODYSSEUS', c.lateCut ? 'at the window\'s end, still over 0.95: the cut comes late' : 'between 0.7 and 0.95: resolve, not panic', [{ id: c.frozenAt ? 'sFrozen' : lands[1] || 'sRoused' }]);
  I({ id: 'iDraw', actor: O, kind: 'ARM', t0: tCut, t1: tCut + 1.2, label: 'the sword from beside his thigh', params: { side: 'R', high: false, what: 'sword', at: null }, because: [{ id: 'sResolve' }] });
  I({ id: 'iCut', actor: O, kind: 'TOOL_WORK', t0: tCut + 1.2, t1: tCut + 2.4, label: 'cuts the cable', params: { how: 'chop', period: 0.6 }, because: [{ id: 'iDraw' }] });
  I({ id: 'iOrder', actor: O, kind: 'GESTURE', t0: tCut + 2.5, t1: tCut + 3.8, label: 'row, for your lives', params: { shape: 'chop', at: tCut + 2.7, side: 'R', amp: 1.3, hold: 0.8 }, because: [{ id: 'iCut' }] });
  sc.filter(m => m !== victim).forEach((m, k) => I({ id: 'iRow' + k, actor: m, kind: 'ROW', t0: q(tCut + 2.9), t1: T, label: 'row: the oars thrash the sea white', params: { clock: 'escape', period: 1.9, amp: 1.2 }, because: [{ id: 'iOrder' }] }));
  for (const m of [].concat(A.machinery || [])) if (m.kind === 'SEA') { m.causes = (m.causes || []).concat(c.lands.map((t, k) => ({ t, id: lands[k] })));
    for (const h of m.hulls || []) h.impulses = c.lands.map((t, k) => ({ t, roll: 0.05, pitch: 0.04, id: lands[k], label: 'the swell from a smashed ship' })).concat(c.lateCut ? [{ t: tCut + 0.4, roll: 0.3, pitch: 0.2, id: 'sResolve', label: 'a rock close under the bow' }] : []); }
  const coupled = { frozen, units: run.units, hz: run.hz, x: run.x, drives: run.drives, W0: run.W0, W: run.W, steps: run.steps, events: c, model: 'tools/perform/machinery.js harbour' };
  const causal = { tau: 0.7, actions: {
    [O]: [{ a: 'moor outside', base: 0.8, f: { 'after:sC3': -1 } }, { a: 'watch the harbour', base: -1, f: { 'after:sRoused': 1.6 } }, { a: 'draw and cut', base: -3, f: { 'after:sResolve': 4 } }, { a: 'stand frozen', base: -2, f: c.frozenAt ? { 'after:sFrozen': 2.6, 'after:sResolve': -3 } : {} }],
    ...Object.fromEntries(sc.map(m => [m, [{ a: 'go to the house', base: 0.4, f: { 'after:sC2': 1, 'after:aEat': -3 } }, { a: 'look up at her', base: -1, f: girl ? { ['sees:' + girl]: 1 } : {} }, { a: 'run', base: -3, f: { 'after:aEat': 4 } }, { a: 'row', base: -3, f: { 'after:iOrder': 5 } }]])) } };
  for (const [id, acts] of Object.entries((A.causal || {}).actions || {})) causal.actions[id] = (causal.actions[id] || []).concat(acts.filter(a => !(causal.actions[id] || []).some(b => b.a === a.a)));
  return { ...base, type: 'fight', title: 'The Laestrygonian Harbour' + (frozen ? ' (uniselectors held)' : ''), authored: { ...A, coupled, causal } };
};
