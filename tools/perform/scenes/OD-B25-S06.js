/* The making-of, 6: The Loom at Night (OD-B25-S06, part two). At the loom, at night (the farm's hum is the run), the agent tells the
   director how the last eight books were built at once in one tree. The power goes (a SOUND, the dark: a SIGHT): the cap; the agent
   turns to the bench and says so. The light comes back with the next run (the stimulus that moves the sweeper): the sweeper, broom in
   hand, crosses to the bench (the take's walk, owned) and says his orders; the swept heap is there at his feet (K3). The examiner, who
   has been at the ledger, comes over (her walk caused by his line) and says what his commit holds. He answers. The agent goes to him
   (its walk caused by her finding), says what Book 18's sweeper did and, when the director asks, gives the new rule to the sweeper. Then
   the skip list, to the director. */
'use strict';
module.exports = function author(M, X) {
  const G = require('./_making.js')(M, X), { q, T, K, clip, end, say, hear, hold, walk, I, St } = G;
  const D = 'director', A = 'agent', E = 'examiner', W = 'sweeper';
  const K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5');
  const c = gi => clip(gi);
  const s = 0.8918918918918919, P = (x, h, z) => [x * s, (h + 8) * s, (10 - z) * s];
  const loom = P(100, 70, -170), heap = P(175, 20, -275), book = P(-300, 64, -200), towers = P(295, 120, 270);
  const tDark = K2 ? q(K2.t) : q(c(3).at - 1.2), tUp = K3 ? q(K3.win ? K3.win[0] : K3.t) : q(c(4).at - 1.6);
  St({ id: 'sNight', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'night at the loom: the agents at the bench, the farm humming', because: [] });
  hold(E, 0.1, q(c(4).at + 0.2), 'at the ledger: she reads the night\'s commits', [[book, 3.0], [loom, 1.4]], { because: [{ id: 'sNight' }] });
  hold(W, 0.1, q(tDark - 0.2), 'by the wall with his broom, waiting for a book to finish', [[loom, 3.0]], { because: [{ id: 'sNight' }] });
  say(0, { shapes: ['show', 'point', 'describe', 'open'], maxBeats: 1, target: D });
  hear(D, 0, { id: 'dHear0' });
  say(1, { shapes: ['open'], target: A });
  hear(A, 1, { id: 'aHear1', nod: false });
  say(2, { shapes: ['describe', 'show', 'open'], maxBeats: 1, target: D });
  hear(D, 2, { id: 'dHear2' });
  /* the cap */
  St({ id: 'sDown', t0: q(c(3).at - 1.2), t1: q(c(3).at - 0.6), kind: 'SOUND', label: 'the run stops: a falling whine, the hum gone', because: [] });
  St({ id: 'sDark', t0: q(c(3).at - 1.1), t1: q(c(3).at - 0.5), kind: 'SIGHT', label: 'the loom goes dark: only the red lamps', because: [{ id: 'sDown' }] });
  I({ id: 'aTurn', actor: A, kind: 'REACT', t0: q(c(3).at - 1.0), t1: q(c(3).at - 0.1), label: 'turns to the stopped bench', params: { how: 'turn', lookAt: loom }, because: [{ id: 'sDark' }] });
  I({ id: 'dTurn', actor: D, kind: 'REACT', t0: q(c(3).at - 0.9), t1: q(c(3).at), label: 'looks to the bench', params: { how: 'startle', lookAt: loom }, because: [{ id: 'sDark' }] });
  walk(A, 'K2', loom, 'to the bench', [{ id: 'aTurn' }], 'aGo2'); walk(D, 'K2', loom, 'to the bench', [{ id: 'dTurn' }], 'dGo2');
  say(3, { shapes: ['open', 'dismiss'], target: D, because: [{ id: 'sDark' }] });
  hear(D, 3, { id: 'dHear3', nod: false });
  hold(W, q(tDark), q(c(4).at - 2.6), 'the dark: he waits', [[loom, 3.0]], { because: [{ id: 'sDark' }] });
  /* the sweeper */
  St({ id: 'sUp', t0: q(c(4).at - 1.6), t1: q(c(4).at - 1.0), kind: 'SOUND', label: 'the next run starts: the hum again, the lights', because: [] });
  walk(W, 'K3', heap, 'crosses to the bench with his broom: his book is done, the run is over', [{ id: 'say3' }], 'wGo3');
  walk(A, 'K3', W, 'turns to see him', [{ id: 'wGo3' }], 'aGo3'); walk(D, 'K3', W, 'turns to see him', [{ id: 'wGo3' }], 'dGo3');
  say(4, { shapes: ['chest', 'open'], target: A });
  I({ id: 'wSweep', actor: W, kind: 'TOOL_WORK', t0: q(end(c(4)) + 0.1), t1: q(c(6).at - 0.3), target: heap, label: 'sweeps everything on the floor into one heap', params: { how: 'dig', period: 0.9, on: heap }, because: [{ id: 'say4' }] });
  walk(E, 'K3', W, 'from the ledger after the sweeper: what will he commit?', [{ id: 'wGo3' }], 'eGo3');
  say(5, { shapes: ['point', 'chop', 'open'], maxBeats: 1, target: W });
  for (const who of [A, D]) hear(who, 5, { id: 'hear5' + who.slice(0, 3), nod: false });
  say(6, { shapes: ['open'], target: E });
  hear(E, 6, { id: 'eHear6', nod: false });
  /* the fix */
  walk(A, 'K4', W, 'goes to the sweeper', [{ id: 'say6' }], 'aGo4'); walk(D, 'K4', A, 'turns with it', [{ id: 'aGo4' }], 'dGo4');
  say(7, { shapes: ['describe', 'open', 'chop'], maxBeats: 1, target: D });
  hear(D, 7, { id: 'dHear7' }); hear(W, 7, { id: 'wHear7', nod: false }); hear(E, 7, { id: 'eHear7' });
  say(8, { shapes: ['point'], target: A, kind: 'COMMAND' });
  hear(A, 8, { id: 'aHear8' });
  say(9, { shapes: ['chop', 'point'], target: W });
  hear(W, 9, { id: 'wHear9' });
  hold(W, q(end(c(9)) + 0.3), T, 'the broom still: he will stage only his own paths', [[A, 2.0], [heap, 1.6]], { because: [{ id: 'say9' }] });
  hold(E, q(end(c(7)) + 0.4), T, 'she notes the fix', [[A, 2.0], [W, 1.6]], { because: [{ id: 'say7' }] });
  walk(A, 'K5', D, 'back to the director', [{ id: 'say9' }], 'aGo5'); walk(D, 'K5', A, 'a step to it', [{ id: 'aGo5' }], 'dGo5');
  say(10, { shapes: ['describe', 'show', 'open'], maxBeats: 1, target: D });
  hear(D, 10, { id: 'dHear10' });
  hold(A, q(end(c(10)) + 0.2), T, 'the loom running again', [[loom, 2.6], [D, 1.2]], { because: [{ id: 'say10' }] });
  hold(D, q(end(c(10)) + 0.4), T, 'he watches the bench work', [[loom, 3.0]], { because: [{ id: 'say10' }] });
  return {
    type: 'dialogue', title: 'The making-of, 6: the loom at night, the cap, the sweep',
    actors: { [A]: { role: 'the agent', body: 'minifig', principal: true }, [D]: { role: 'the director', body: 'minifig', principal: true },
      [W]: { role: 'the sweeper', body: 'minifig', principal: true }, [E]: { role: 'the examiner', body: 'minifig' } },
    objects: { loom: { kind: 'workbench', material: 'plastic', at: loom, affords: ['work'] }, heap: { kind: 'heap', material: 'plastic', at: heap, affords: ['sweep'] }, farm: { kind: 'machine', material: 'plastic', at: towers, affords: ['render'] } },
    authored: { intents: G.intents, holds: G.holds, stimuli: G.stimuli, goals: { [A]: 'every book built and checked', [D]: 'to understand the night', [W]: 'his book committed', [E]: 'what each commit holds' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [W]: [{ a: 'wait', base: 1.0, f: { 'after:say3': -2.6 } }, { a: 'sweep and commit', base: -2.0, f: { 'after:say3': 3.4, 'after:say9': -3.0 } }],
        [E]: [{ a: 'read the ledger', base: 1.0, f: { 'after:say4': -2.4 } }, { a: 'check the commit', base: -2.0, f: { 'after:say4': 3.2 } }],
        [A]: [{ a: 'explain the run', base: 1.0, f: { 'after:sDark': -1.0 } }, { a: 'fix the instruction', base: -2.0, f: { 'after:say6': 3.2 } }],
      } },
      camera: { follow: true },
    },
  };
};
