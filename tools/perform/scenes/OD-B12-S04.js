/* Scylla (OD-B12-S04, Odyssey 12): the stroke held under two monsters, and the six taken.

   The first score's sea, ship and rowers (tools/perform/scenes/_auto.js from the needs catalogue) are kept; the direction is laid over
   them. Charybdis roars and the oars falter; Odysseus: "Row, friends... Helmsman, hold her off that smoke"; he keeps Scylla from them;
   he arms against Circe's word and goes to the bow, searching the rock face (the wrong place: she is above the smoke-line); the six
   heads strike together and lift six rowers screaming his name; he weeps at the most pitiful thing he saw.

   The timings are the needles' (tools/perform/machinery.js strait, run by homeostat.couple): the CREW's fear loses strokes (each lost
   stroke is skipped on the rowing clock, and the ship's way through the strait is the strokes kept); SCYLLA's hunger rises as the ship
   comes under her rock (the way), and she strikes when it passes 0.7 inside the take's window; with the uniselectors held (X.frozen) the
   fear loses more strokes, the ship comes under her later, and the strike falls after the take's cut to it. */
'use strict';
const Ho = require('../homeostat.js'), Ma = require('../machinery.js');
module.exports = function author(M, X) {
  const N = require('../../../odyssey/perform/needs.json').scenes['OD-B12-S04'], base = require('./_auto.js')(M, X, N);
  const K = id => M.keys.find(k => k.id === id), T = M.total, q = t => Math.round(t * 12) / 12, frozen = !!X.frozen;
  const K4 = K('K4'), K5 = K('K5'), O = 'odysseus', crew = Object.keys(M.H).filter(i => /sailor/.test(i)), S = 'scylla';
  const clip = gi => M.clips.find(c => c.gi === gi), cWords = clip(3), cArm = clip(4), cStrike = clip(5), cAfter = clip(6);
  const spec = Ma.strait({ total: T, row: [0.6, T], words: cWords ? [cWords.at, cWords.at + cWords.dur] : [10.9, 25.3], arm: cArm ? cArm.at : 25.7, under: K4.t, window: [K4.win ? K4.win[0] : K4.t - 1, K4.t + 1.8] });
  const run = Ho.couple(spec, { frozen }), c = run.events, tS = q(c.strike);
  const A = base.authored;
  /* the first score's generic strike and struggle are replaced; the rowers' clock loses the needle's strokes; the ship carries the six
     until the heads take them */
  const drop = new Set(['STRIKE', 'STRUGGLE']); A.intents = A.intents.filter(I => !(drop.has(I.kind) || (I.actor === S)));
  A.holds = A.holds.filter(h => !crew.includes(h.actor) || h.t1 < tS - 0.5);
  for (const m of [].concat(A.machinery || [])) {
    if (m.kind === 'ROWING') { m.clock.t1 = tS; m.busy = Object.fromEntries(crew.map(id => [id, c.lost.map(([a, b]) => [a, b])])); }
    if (m.kind === 'SEA') { for (const h of m.hulls || []) h.riders = [[O, 0, T], ...crew.map((id, k) => [id, 0, q(tS + [0, 0.08, 0.03, 0.12, 0.05, 0.1][k % 6] + 0.36)])]; m.causes = (m.causes || []).concat([{ t: tS, id: 'sStrike' }]); } }
  const stim = A.stimuli, I = o => (A.intents.push(o), o.id), S_ = o => (stim.push(o), o.id);
  const needle = (id, t, unit, label, because) => S_({ id, t0: q(t), t1: q(t) + 0.3, kind: 'NEEDLE', label: unit + ': ' + label, because: because || [], params: { unit } });
  c.lost.forEach(([a], k) => needle('sLost' + k, a, 'CREW', 'over 0.55 while they row: a stroke lost', [{ id: a < 5 ? 'sC0' : 'sC1' }]));
  for (const st of run.steps) S_({ id: 'sStep' + st.unit + Math.round(st.t * 12), t0: q(st.t), t1: q(st.t) + 0.2, kind: 'UNISELECTOR', label: st.unit + ' out of its limits past its dwell: the uniselector steps to position ' + st.position, because: [] });
  needle('sStrike', tS, 'SCYLLA', 'over 0.7 with the ship under her rock: the six heads strike' + (c.strike > (K4.t + 1.8) ? ' (late: past the take\'s cut to it)' : ''), [{ id: 'sC3' }]);
  /* the lost strokes answered: he steadies them */
  c.lost.filter(([a]) => a > 3.5 && a < tS).forEach(([a], k) => I({ id: 'iSteady' + k, actor: O, kind: 'SIGNAL', t0: q(a) + 0.3, t1: q(a) + 1.8, label: 'pull: together', params: { how: 'go', to: crew, lookAt: crew[0], side: 'L' }, because: [{ id: 'sLost' + c.lost.findIndex(x => x[0] === a) }] }));
  /* Scylla: coiled on her rock, the strike, the six lifted (riders on the jaws), held while the ship goes on */
  I({ id: 'iStrike', actor: S, kind: 'STRIKE', t0: tS, t1: T, label: 'six heads at once, down onto the benches', params: { targets: crew.slice(0, 6), lift: 5 }, because: [{ id: 'sStrike' }] });
  crew.forEach((m, k) => { const tg = q(tS + [0, 0.08, 0.03, 0.12, 0.05, 0.1][k % 6] + 0.36);
    I({ id: 'iTaken' + k, actor: m, kind: 'STRUGGLE', t0: tg + 0.1, t1: Math.min(T, tg + 9), label: 'hands and feet in the air, calling his name', because: [{ id: 'iStrike' }] }); });
  I({ id: 'iSee', actor: O, kind: 'REACT', t0: tS + 0.2, t1: tS + 1.6, label: 'the heads come from above, not from the rock face', params: { how: 'startle', lookAt: S }, because: [{ id: 'sStrike' }] });
  I({ id: 'iThreat', actor: O, kind: 'THREAT', t0: q(tS + 1.8), t1: q(tS + 4), target: S, label: 'the spear up at her: too high', params: { side: 'R' }, because: [{ id: 'iSee' }] });
  I({ id: 'iLook', actor: O, kind: 'ATTEND', t0: q(tS + 4.2), t1: q((cAfter ? cAfter.at : tS + 8) - 0.2), target: crew[0], label: 'watches them lifted, calling to him', because: [{ id: 'iStrike' }] });
  const coupled = { frozen, units: run.units, hz: run.hz, x: run.x, drives: run.drives, W0: run.W0, W: run.W, steps: run.steps, events: { strike: c.strike, lost: c.lost }, model: 'tools/perform/machinery.js strait' };
  const causal = { tau: 0.7, actions: {
    [O]: [{ a: 'steady the crew', base: 0.2, f: { 'after:sC0': 1.2, 'after:sC2': -1 } }, { a: 'arm and search the rock', base: -2, f: { 'after:sC2': 3.0, 'after:sStrike': -3 } }, { a: 'strike back', base: -3, f: { 'after:sStrike': 2.6 } }, { a: 'weep', base: -3.4, f: { 'after:sC4': 4 } }],
    ...Object.fromEntries(crew.map(m => [m, [{ a: 'row', base: 1.0, f: { 'after:sStrike': -4 } }, { a: 'look to the whirlpool', base: -1.2, f: { 'threat:odysseus': 0, 'after:sC0': 1.2 } }, { a: 'struggle in the jaws', base: -4, f: { 'after:sStrike': 6 } }]])) } };
  return { ...base, type: 'fight', title: 'Scylla' + (frozen ? ' (uniselectors held)' : ''), authored: { ...A, coupled, causal } };
};
