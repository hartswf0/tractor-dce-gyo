/* The making-of, 6: The Loom at Night (OD-B25-S06; part two). The AD reads the night's plan; the Director: "Push it."; the AD
   translates. The agent at the bench, working, reports its drawing and is cut off mid-word: the power goes (the cap), and the speaker
   says so, calmly. The examiner gives the count. The run comes back; the sweeper crosses to the bench (his walk caused by the light),
   reads his orders and sweeps everything on the floor into one heap with one stroke of the broom (a TOOL_WORK dig: the dust is the
   FX), and reports Book 17 committed. The examiner, who followed him, says what the commit holds; he answers. The AD gives the fix to
   the Director and, on "Fix it.", to the sweeper, who repeats it. The agent comes back as its successor and reads the handover. */
'use strict';
module.exports = function author(M, X) {
  const D = 'director', A = 'agent', E = 'examiner', W = 'sweeper', F = 'firstad';
  const s = 0.8918918918918919, P = (x, h, z) => [x * s, (h + 8) * s, (10 - z) * s];
  const loom = P(100, 70, -170), heap = P(185, 20, -262), book = P(-300, 64, -200), spk = P(-30, 180, 290);
  const G = require('./_making2.js')(M, X, { present: [D, A, E, W, F], speaker: spk,
    shapes: { 1: ['chop'], 11: ['chop'], 12: ['point', 'chop'], 13: ['open'] }, deaf: { 3: [W] },
    walkTo: { K3: { [W]: heap, [E]: W } }, walkLabel: { K3: { [W]: 'to the bench with his broom: his book is done', [E]: 'after the sweeper: what will he commit?' } } });
  const { q, T, K, clip, end, hold, I, St } = G, c = clip, K2 = K('K2');
  St({ id: 'sNight', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'night at the loom: the agents at the bench, the farm humming', because: [] });
  I({ id: 'aWork', actor: A, kind: 'TOOL_WORK', t0: 0.3, t1: q(c(3).at - 0.2), target: loom, label: 'works at the bench', params: { how: 'carve', period: 0.6, on: loom }, because: [{ id: 'sNight' }] });
  St({ id: 'sCap', t0: q(end(c(3)) - 0.05), t1: q(end(c(3)) + 0.4), kind: 'SIGHT', label: 'the power goes mid-word: the cap', because: [] });
  hold(A, q(end(c(3))), q(c(14).at - 1.6), 'cut off by the cap: it stops where it stood, mid-gesture', [], { still: true, because: [{ id: 'sCap' }] });
  hold(E, 0.1, q(c(5).at - 0.3), 'at the ledger: the night\'s commits', [[book, 3.0], [loom, 1.4]], { because: [{ id: 'sNight' }] });
  hold(W, 0.1, q(c(6).at - 2.6), 'by the wall with his broom, waiting for his book', [[loom, 3.0]], { because: [{ id: 'sNight' }] });
  I({ id: 'wSweep', actor: W, kind: 'TOOL_WORK', t0: q(end(c(6)) + 0.1), t1: q(c(7).at - 0.1), target: heap, label: 'one stroke of the broom: everything on the floor into one heap', params: { how: 'dig', period: 0.9, on: heap }, because: [{ id: 'say6' }] });
  St({ id: 'sNext', t0: q(c(14).at - 1.4), t1: q(c(14).at - 0.8), kind: 'SCENE', label: 'the next run: a successor at the same bench, reading the handover', because: [{ id: 'say13' }] });
  I({ id: 'aRead', actor: A, kind: 'REACT', t0: q(c(14).at - 1.2), t1: q(c(14).at - 0.2), label: 'the successor looks up from the handover', params: { how: 'turn', lookAt: F }, because: [{ id: 'sNext' }] });
  hold(W, q(end(c(13)) + 0.3), T, 'the broom still: only his own paths now', [[F, 2.0], [heap, 1.6]], { because: [{ id: 'say13' }] });
  hold(A, q(end(c(14)) + 0.2), T, 'back to the bench', [[loom, 3.0]], { because: [{ id: 'say14' }] });
  return {
    type: 'dialogue', title: 'The making-of, 6: the loom at night, the cap, the sweep',
    actors: { [F]: { role: 'the first AD', body: 'minifig', principal: true }, [A]: { role: 'the agent', body: 'minifig', principal: true }, [D]: { role: 'the director', body: 'minifig', principal: true },
      [W]: { role: 'the sweeper', body: 'minifig', principal: true }, [E]: { role: 'the examiner', body: 'minifig' } },
    objects: { loom: { kind: 'workbench', material: 'plastic', at: loom, affords: ['work'] }, heap: { kind: 'heap', material: 'plastic', at: heap, affords: ['sweep'] }, speaker: { kind: 'loudspeaker', material: 'plastic', at: spk, affords: ['listen'] } },
    authored: { intents: G.intents, holds: G.holds, stimuli: G.stimuli, goals: { [F]: 'every book built and checked', [D]: 'push it', [W]: 'his book committed', [E]: 'what each commit holds', [A]: 'its drawing' }, couplings: [],
      causal: { tau: 0.7, actions: { [W]: [{ a: 'wait', base: 1.0, f: { 'after:say5': -2.6 } }, { a: 'sweep and commit', base: -2.0, f: { 'after:say5': 3.4, 'after:say12': -3.0 } }],
        [A]: [{ a: 'work', base: 1.0, f: { 'after:sCap': -4.0 } }, { a: 'stop', base: -2.0, f: { 'after:sCap': 4.0, 'after:sNext': -4.0 } }] } },
      camera: { follow: true } },
  };
};
