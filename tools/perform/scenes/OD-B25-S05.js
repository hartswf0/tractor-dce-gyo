/* The making-of, 5: The Card and the Atlas (OD-B25-S05; part two, "Hearts of Plastic"). The examiner at the ledger gives the date
   the halfworld's record begins. The Director calls one word ("Odyssey."); the First AD translates it into a brief and hands the card
   on. The agent, at its desk until the brief reaches it (its typing stops on the AD's line), comes over and reads the card out. The
   examiner says what the first commit holds and what it does not; the agent says how a figure draws itself. "Continue." is translated
   too ("build a few, verify, then fan out"), and the AD answers "to whom?" by walking them all to the loom of agents. */
'use strict';
module.exports = function author(M, X) {
  const D = 'director', A = 'agent', C = 'cinematographer', O = 'odysseus', E = 'examiner', F = 'firstad';
  const s = 0.8918918918918919, P = (x, h, z) => [x * s, (h + 8) * s, (10 - z) * s];
  const book = P(-300, 64, -200), loom = P(100, 70, -170), keyboard = P(190, 64, 80), spk = P(-30, 180, 290);
  const G = require('./_making2.js')(M, X, { present: [D, A, C, O, E, F], speaker: spk,
    shapes: { 1: ['chop'], 3: ['show', 'open'], 7: ['chop'], 10: ['point', 'show'] }, side: { 3: 'L', 4: 'L' },
    walkTo: { K5: { [A]: loom, [D]: loom, [E]: loom, [C]: loom, [F]: A } }, walkLabel: { K2: { [A]: 'from the desk to the AD, the card held up' }, K5: { [F]: 'leads them to the loom', [A]: 'to the loom of agents' } } });
  const { q, T, K, clip, end, hold, I, St } = G, c = clip;
  St({ id: 'sLedger', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'the examiner at the ledger; the agent at its desk; the crew round them', actor: E, because: [] });
  hold(E, 0.1, q(c(0).at - 0.3), 'reading the ledger through the glass', [[book, 3.0]], { because: [{ id: 'sLedger' }] });
  I({ id: 'aType', actor: A, kind: 'TOOL_WORK', t0: 0.3, t1: q(c(2).at + 1.0), target: keyboard, label: 'types', params: { how: 'carve', period: 0.55, on: keyboard }, because: [{ id: 'sLedger' }] });
  hold(O, 0.1, T, 'on the little set, in costume, waiting for a cause', [[E, 3.0], [D, 2.0]], { because: [{ id: 'sLedger' }] });
  const K5_ = K('K5');
  for (const who of [D, E, C]) I({ id: 'att5' + who.slice(0, 3), actor: who, kind: 'ATTEND', target: loom, t0: q(end(c(10)) + 0.2), t1: T, label: 'looks at the loom: eight agents at one bench', because: [{ id: 'say10' }] });
  hold(A, q(end(c(10)) + 0.3), T, 'one of many: it looks along the bench', [[loom, 3.0]], { because: [{ id: 'say10' }] });
  hold(F, q(end(c(10)) + 0.3), T, 'the brief delivered: he checks his clipboard', [[A, 2.0], [D, 1.4]], { because: [{ id: 'say10' }] });
  return {
    type: 'dialogue', title: 'The making-of, 5: the card and the atlas',
    actors: { [E]: { role: 'the examiner', body: 'minifig', principal: true }, [D]: { role: 'the director', body: 'minifig', principal: true }, [F]: { role: 'the first AD', body: 'minifig', principal: true },
      [A]: { role: 'the agent', body: 'minifig', principal: true }, [C]: { role: 'the cinematographer', body: 'minifig' }, [O]: { role: 'the actor', body: 'minifig' } },
    objects: { ledger: { kind: 'book', material: 'paper', at: book, affords: ['read'] }, card: { kind: 'card', material: 'paper', holder: 'agent:R', affords: ['read'] }, loom: { kind: 'workbench', material: 'plastic', at: loom, affords: ['work'] } },
    authored: { intents: G.intents, holds: G.holds, stimuli: G.stimuli, goals: { [E]: 'the record as it is', [D]: 'the Odyssey', [F]: 'a brief for every word', [A]: 'what the card asks' }, couplings: [],
      causal: { tau: 0.7, actions: { [A]: [{ a: 'build at the desk', base: 1.0, f: { 'after:say2': -2.4 } }, { a: 'read the card', base: -2.0, f: { 'after:say2': 3.2 } }] } },
      camera: { follow: true } },
  };
};
