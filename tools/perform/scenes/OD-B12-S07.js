/* The Thunderbolt (OD-B12-S07, Odyssey 12): the cattle of the Sun, the bolt, the wreck, the keel and the fig tree.

   Over the first score's sea and ship (tools/perform/scenes/_auto.js): Odysseus wakes to the smell of the roasting meat and condemns them
   while they feast on; on the seventh day the wind falls and they raise the mast and sail; Zeus gathers a black cloud and strikes the
   mast with his bolt; the mast falls on the helmsman; the ship fills with sulphur and breaks up; the men are thrown into the sea and
   drown one by one; Odysseus lashes the keel and the mast together and rides them; driven back to Charybdis he leaps to the fig tree and
   hangs there until the timbers come up.

   The timings are the needles' (tools/perform/machinery.js storm, run by homeostat.couple): Zeus's anger rises with the feast and the
   sail and strikes when it passes 0.75 in the take's window; the sea follows; the ship's integrity (VESSEL) wears and breaks under
   -0.5 (its uniselector is the crew's fight to keep her: with it held, X.frozen, she breaks sooner and he is thrown before the wreck);
   the men drown one by one as their share of the endurance runs out. */
'use strict';
const Ho = require('../homeostat.js'), Ma = require('../machinery.js');
module.exports = function author(M, X) {
  const N = require('../../../odyssey/perform/needs.json').scenes['OD-B12-S07'], base = require('./_auto.js')(M, X, N), A = base.authored;
  const K = id => M.keys.find(k => k.id === id), T = M.total, q = t => Math.round(t * 12) / 12, frozen = !!X.frozen;
  const K3 = K('K3'), K4 = K('K4'), K5 = K('K5'), O = 'odysseus', crew = Object.keys(M.H).filter(i => /crew/.test(i)), helm = crew[crew.length - 1];
  const clip = gi => M.clips.find(c => c.gi === gi), cFeast = clip(2), cSail = clip(3), cBolt = clip(4), cWreck = clip(5), cLash = clip(6), cFig = clip(7);
  const sail = cSail ? cSail.at : 18.1;
  const spec = Ma.storm({ total: T, anger: t => (t < sail ? 0.1 + 0.025 * t : 0.6 + 0.08 * (t - sail)), strikeWindow: [K3.win ? K3.win[0] : K3.t - 1, K3.t + 1.5], breakWindow: [cWreck ? cWreck.at - 1 : 33.5, cWreck ? cWreck.at + 1.5 : 36], crew: crew.length, calm: cFig ? cFig.at : 47, seed: 'OD-B12-S07' });
  const run = Ho.couple(spec, { frozen }), c = run.events, tB = q(c.strike), tW = q(c.breakup || (cWreck ? cWreck.at : 34.5));
  A.intents = A.intents.filter(I => !/FALL|SWIM|DROWN|EAT|ROPE|RIDE|LEAP|CLING|SET_DOWN/.test(I.kind) || I.actor === O && /DECLARE/.test(I.kind));
  const stim = A.stimuli, I = o => (A.intents.push(o), o.id), S_ = o => (stim.push(o), o.id);
  const needle = (id, t, unit, label, because) => S_({ id, t0: q(t), t1: q(t) + 0.3, kind: 'NEEDLE', label: unit + ': ' + label, because: because || [], params: { unit } });
  for (const st of run.steps) S_({ id: 'sStep' + st.unit + Math.round(st.t * 12), t0: q(st.t), t1: q(st.t) + 0.2, kind: 'UNISELECTOR', label: st.unit + ' out of its limits past its dwell: its uniselector steps to position ' + st.position, because: [] });
  needle('sBolt', tB, 'GOD', 'over 0.75: the bolt on the mast' + (c.lateStrike ? ' (at the window\'s end)' : ''), [{ id: 'sC1' }]);
  needle('sWreck', tW, 'VESSEL', 'under -0.5: the ship breaks up' + (c.lateBreak ? ' (held to the window\'s end)' : ''), [{ id: 'sBolt' }]);
  if (c.thrown) needle('sThrown', c.thrown, 'HERO', 'the sea over 0.7 with the ship gone under him: thrown', [{ id: c.thrown > tW ? 'sWreck' : 'sBolt' }]);
  A.stimuli.push({ id: 'fxBolt', t0: tB, t1: tB + 0.3, kind: 'SIGHT', label: 'lightning: the mast split, sulphur', because: [{ id: 'sBolt' }] });
  /* the feast: they eat on, he condemns them */
  crew.forEach((m, k) => I({ id: 'iEat' + k, actor: m, kind: 'EAT', t0: 3 + 0.4 * k, t1: (cFeast ? cFeast.at + cFeast.dur : 17), label: 'eats on, not looking at him', params: { at: [3 + 0.4 * k, 7.5 + 0.5 * k, 12 + 0.3 * k].filter(t => t < 16.5), side: 'R' }, because: [{ id: 'sC0' }] }));
  I({ id: 'iWake', actor: O, kind: 'WAKE', t0: 0.6, t1: 2.6, label: 'wakes: the smell of roasting meat', because: [{ id: 'sC0' }] });
  /* the sail: the crew haul up the mast */
  crew.slice(0, 3).forEach((m, k) => I({ id: 'iHaul' + k, actor: m, kind: 'ROPE', t0: q(sail + 0.6 + 0.3 * k), t1: q(sail + 7), label: 'haul up the mast, spread the sail', params: { how: 'haul' }, because: [{ id: 'sC1' }] }));
  /* the bolt: the helmsman struck by the falling mast, everyone thrown about */
  I({ id: 'iHelm', actor: helm, kind: 'FALL', t0: q(tB + 1.5), t1: q(tB + 3.2), label: 'the mast falls on his head: down like a diver', params: {}, because: [{ id: 'fxBolt' }] });
  crew.filter(m => m !== helm).forEach((m, k) => I({ id: 'iBoltR' + k, actor: m, kind: 'REACT', t0: q(tB + 0.15 + 0.06 * k), t1: q(tB + 1.5), label: 'the bolt', params: { how: 'startle', lookAt: [0, 150, 0] }, because: [{ id: 'fxBolt' }] }));
  I({ id: 'iBoltO', actor: O, kind: 'REACT', t0: q(tB + 0.2), t1: q(tB + 1.6), label: 'the bolt', params: { how: 'flinch', lookAt: [0, 150, 0] }, because: [{ id: 'fxBolt' }] });
  /* the wreck: thrown into the sea, they swim, and one by one go down */
  crew.forEach((m, k) => { const tf = q(tW + 0.1 * k), td = q(c.drowned[k] || tW + 3 + k);
    I({ id: 'iThrown' + k, actor: m, kind: 'FALL', t0: tf, t1: tf + 1.2, label: 'thrown into the sea', params: { key: 'K4' }, because: [{ id: 'sWreck' }] });
    I({ id: 'iSwim' + k, actor: m, kind: 'SWIM', t0: tf + 1.2, t1: Math.max(tf + 1.8, td), label: 'swims, bobbing like a sea-crow on the waves', params: { period: 1.4 }, because: [{ id: 'iThrown' + k }] });
    S_({ id: 'sGone' + k, t0: td, t1: td + 0.3, kind: 'NEEDLE', label: 'HERO: ' + m + '\'s share of the endurance runs out', because: [{ id: 'iSwim' + k }], params: { unit: 'HERO' } });
    I({ id: 'iDrown' + k, actor: m, kind: 'DROWN', t0: Math.max(tf + 1.9, td + 0.1), t1: Math.min(T, Math.max(tf + 1.9, td + 0.1) + 2.6), label: 'the god took away their homecoming', because: [{ id: 'sGone' + k }] }); });
  /* Odysseus: the keel and the mast lashed, ridden; the fig tree over Charybdis; the drop when the timbers come up */
  const tL = cLash ? cLash.at : 41.6, tF = cFig ? cFig.at : 47.4;
  /* thrown clear as she breaks up, he swims to the keel and the mast (XII.420-425; on the sea kit the hull is gone at the break and the men are in the water) */
  const tT = c.thrown ? q(c.thrown) : tW + 0.6;
  if (tL - 0.2 > tT + 0.6) I({ id: 'iSwimO', actor: O, kind: 'SWIM', t0: tT, t1: q(tL - 0.1), label: 'swims for the keel and the mast', params: { period: 1.4 }, because: [{ id: c.thrown ? 'sThrown' : 'sWreck' }] });
  I({ id: 'iLash', actor: O, kind: 'ROPE', t0: q(tL), t1: q(tL + 4.2), label: 'lashes keel and mast with the backstay', params: { how: 'bind' }, because: [{ id: 'sWreck' }] });
  I({ id: 'iRide', actor: O, kind: 'RIDE', t0: q(tL + 4.2), t1: q(tF + 2.4), label: 'rides the timbers before the wind', params: { period: 1.0 }, because: [{ id: 'iLash' }] });
  I({ id: 'iLeap', actor: O, kind: 'LEAP', t0: q(tF + 2.6), t1: q(tF + 3.6), label: 'up to the fig tree as the whirlpool sucks the timbers down', params: {}, because: [{ id: 'sC5' }] });
  I({ id: 'iHang', actor: O, kind: 'CLING', t0: q(tF + 3.7), t1: q(T - 2.4), label: 'hangs from the fig tree like a bat', because: [{ id: 'iLeap' }] });
  I({ id: 'iDrop', actor: O, kind: 'POSTURE', t0: q(T - 2.3), t1: T, label: 'drops onto the timbers as they come up', params: { to: 'crouch', stay: true }, because: [{ id: 'iHang' }] });
  for (const m of [].concat(A.machinery || [])) if (m.kind === 'SEA') { m.causes = (m.causes || []).filter(x => x.id !== 'sC2' && x.id !== 'sC3').concat([{ t: tB, id: 'sBolt' }, { t: tW, id: 'sWreck' }]);
    for (const h of m.hulls || []) { h.impulses = [{ t: tB + 0.1, roll: 0.35, pitch: 0.12, label: 'the bolt strikes the mast', id: 'sBolt' }, { t: tB + 1.5, roll: -0.35, pitch: 0.12, label: 'the mast comes down on the helmsman', id: 'iHelm' }, { t: tW, roll: 0.6, pitch: -0.3, label: 'she breaks up', id: 'sWreck' }];
      h.riders = [[O, 0, c.thrown ? q(c.thrown) : tW], ...crew.map((m, k) => [m, 0, q(tW + 0.1 * k)])]; }
    m.swimmers = crew.map((m, k) => ({ actor: m, t0: q(tW + 0.1 * k + 1.2), t1: q((c.drowned[k] || tW + 4) + 2.6) })).concat(c.thrown ? [{ actor: O, t0: q(c.thrown), t1: q(tL - 0.1) }] : []); }
  const coupled = { frozen, units: run.units, hz: run.hz, x: run.x, drives: run.drives, W0: run.W0, W: run.W, steps: run.steps, events: c, model: 'tools/perform/machinery.js storm (Zeus)' };
  const causal = { tau: 0.7, actions: {
    [O]: [{ a: 'condemn them', base: 0.3, f: { 'speaking:odysseus': 1.5, 'after:sC1': -2 } }, { a: 'brace', base: -2, f: { 'after:sBolt': 3 } }, { a: 'lash the timbers', base: -3, f: { 'after:sWreck': 3.6 } }, { a: 'leap for the tree', base: -3, f: { 'after:sC5': 3.6 } }],
    ...Object.fromEntries(crew.map((m, k) => [m, [{ a: 'eat', base: 0.8, f: { 'after:sC1': -2 } }, { a: 'haul the mast', base: -2, f: { 'after:sC1': 2.5, 'after:sBolt': -3 } }, { a: 'swim', base: -3, f: { 'after:sWreck': 3.8, ['after:sGone' + k]: -4 } }, { a: 'go down', base: -4, f: { ['after:sGone' + k]: 6 } }]])) } };
  for (const [id, acts] of Object.entries((A.causal || {}).actions || {})) causal.actions[id] = (causal.actions[id] || []).concat(acts.filter(a => !(causal.actions[id] || []).some(b => b.a === a.a)));
  return { ...base, type: 'machinery', title: 'The Thunderbolt' + (frozen ? ' (uniselectors held)' : ''), authored: { ...A, coupled, causal } };
};
