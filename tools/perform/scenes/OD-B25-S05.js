/* The making-of, 5: The Card and the Atlas (OD-B25-S05, the LEGO film studio; part two, the origins).
   The examiner at the ledger (a HOLD on the book) tells the director where the halfworld begins: its first commit. The agent, at its
   desk, hears "four hundred and ninety-four files" (a WORD) and comes over with the card held up (the take's walk, owned; the card is
   in its hand from K2); it reads the card out. The director asks what it asks for; the agent gives the phases, then the drawings that
   draw themselves (the halftone sheet on the lectern is the stimulus the examiner turns to). The examiner says what the record does
   not hold. The agent gives the card's rule, fan out, and leads them to the loom of agents (the take's walks, caused by "fan out"). */
'use strict';
module.exports = function author(M, X) {
  const G = require('./_making.js')(M, X), { q, T, K, clip, end, say, hear, hold, walk, I, St } = G;
  const D = 'director', A = 'agent', C = 'cinematographer', O = 'odysseus', E = 'examiner';
  const K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5');
  const c = gi => clip(gi), V2 = X.voiceOf(c(2)), V8 = X.voiceOf(c(8)), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const s = 0.8918918918918919, P = (x, h, z) => [x * s, (h + 8) * s, (10 - z) * s];
  const book = P(-300, 64, -200), sheet = P(-300, 72, -200), screen = P(150, 70, 60), loom = P(100, 70, -170), keyboard = P(190, 64, 80);
  const tFiles = q(w(V2, 'files', end(c(2)) - 0.5)), tFan = q(w(V8, 'fan', end(c(8)) - 0.6));
  St({ id: 'sLedger', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'the examiner at the ledger; the agent at its desk; the actor on the little set', actor: E, because: [] });
  hold(E, 0.1, q(c(0).at - 0.3), 'reading the ledger through the glass', [[book, 3.0]], { because: [{ id: 'sLedger' }] });
  hold(D, 0.1, q(c(0).at + 0.2), 'waiting on the examiner', [[E, 2.4], [book, 1.2]], { because: [{ id: 'sLedger' }] });
  I({ id: 'aType', actor: A, kind: 'TOOL_WORK', t0: 0.3, t1: q(tFiles), target: keyboard, label: 'types', params: { how: 'carve', period: 0.55, on: keyboard }, because: [{ id: 'sLedger' }] });
  hold(C, 0.1, q(K5.win[0] - 0.1), 'he listens from the set', [[E, 3.0], [D, 1.6]], { because: [{ id: 'sLedger' }] });
  hold(O, 0.1, T, 'on the little set, listening', [[E, 3.0], [A, 2.0]], { because: [{ id: 'sLedger' }] });
  say(0, { shapes: ['open', 'describe'], target: D });
  hear(D, 0, { id: 'dHear0' });
  say(1, { shapes: ['open'], target: E });
  hear(E, 1, { id: 'eHear1', nod: false });
  say(2, { shapes: ['point', 'show'], maxBeats: 1, target: D });
  hear(D, 2, { id: 'dHear2' });
  /* the card */
  St({ id: 'sFiles', t0: tFiles, t1: q(tFiles + 0.4), kind: 'WORD', label: '"four hundred and ninety-four files": the agent looks up from the desk', actor: E, because: [{ id: 'say2' }] });
  I({ id: 'aLook', actor: A, kind: 'REACT', t0: q(tFiles + 0.1), t1: q(tFiles + 0.9), label: 'looks up from the screen toward the examiner', params: { how: 'turn', lookAt: E }, because: [{ id: 'sFiles' }] });
  walk(A, 'K2', D, 'comes over from the desk with the card held up', [{ id: 'aLook' }], 'aGo2');
  walk(D, 'K2', A, 'turns to the agent', [{ id: 'aGo2' }], 'dGo2');
  say(3, { shapes: ['show', 'open', 'point'], maxBeats: 1, target: D, side: 'L' });
  hear(D, 3, { id: 'dHear3' }); hear(E, 3, { id: 'eHear3', nod: false });
  say(4, { shapes: ['open'], target: A });
  hear(A, 4, { id: 'aHear4', nod: false });
  /* the phases; the drawings */
  walk(E, 'K3', A, 'steps from the ledger to hear the agent', [{ id: 'say4' }], 'eGo3');
  walk(A, 'K3', D, 'lowers the card', [{ id: 'say4' }], 'aGo3'); walk(D, 'K3', A, 'faces it', [{ id: 'say4' }], 'dGo3');
  say(5, { shapes: ['describe', 'show', 'point', 'open'], maxBeats: 1, target: D });
  hear(D, 5, { id: 'dHear5' }); hear(E, 5, { id: 'eHear5', nod: false });
  St({ id: 'sSheet', t0: q(c(6).at - 0.2), t1: q(c(6).at + 0.4), kind: 'SIGHT', label: 'the halftone sheet on the lectern: a drawing printed as dots', actor: E, because: [{ id: 'say5' }] });
  say(6, { shapes: ['describe', 'open', 'show'], maxBeats: 1, target: D });
  I({ id: 'eSheet', actor: E, kind: 'ATTEND', target: sheet, t0: q(c(6).at + 0.6), t1: q(c(6).at + 3.2), label: 'looks back at the dots on the sheet', because: [{ id: 'sSheet' }] });
  hear(D, 6, { id: 'dHear6' });
  /* what the record does not hold */
  walk(E, 'K4', D, 'turns to the director', [{ id: 'say6' }], 'eGo4');
  walk(A, 'K4', E, 'turns to her', [{ id: 'eGo4' }], 'aGo4'); walk(D, 'K4', E, 'turns to her', [{ id: 'eGo4' }], 'dGo4');
  say(7, { shapes: ['chop', 'open', 'dismiss'], maxBeats: 1, target: D });
  hear(D, 7, { id: 'dHear7' }); hear(A, 7, { id: 'aHear7', nod: false });
  say(8, { shapes: ['open', 'show'], target: D });
  hear(D, 8, { id: 'dHear8', nod: false });
  St({ id: 'sFan', t0: tFan, t1: q(tFan + 0.4), kind: 'WORD', label: '"then fan out"', actor: A, because: [{ id: 'say8' }] });
  say(9, { shapes: ['open'], target: A, because: [{ id: 'sFan' }] });
  /* the loom */
  walk(A, 'K5', loom, 'leads them to the loom of agents', [{ id: 'say9' }], 'aGo5');
  for (const who of [D, E, C]) walk(who, 'K5', loom, 'follows the agent to the loom', [{ id: 'aGo5' }], 'go5' + who.slice(0, 3));
  St({ id: 'sLoom', t0: q(K5.win[1]), t1: q(K5.win[1] + 0.6), kind: 'SIGHT', label: 'the loom: eight agents at one bench, the twenty-four books', because: [{ id: 'aGo5' }] });
  say(10, { shapes: ['show', 'point'], target: loom, because: [{ id: 'sLoom' }] });
  for (const who of [D, E, C]) I({ id: 'att' + who.slice(0, 3), actor: who, kind: 'ATTEND', target: loom, t0: q(K5.win[1] + 0.2), t1: T, label: 'looks at the loom of agents', because: [{ id: 'sLoom' }] });
  hold(A, q(end(c(10)) + 0.2), T, 'it shows them the loom', [[loom, 2.6], [D, 1.2]], { because: [{ id: 'say10' }] });
  return {
    type: 'revelation', title: 'The making-of, 5: the card and the atlas',
    actors: { [E]: { role: 'the examiner', body: 'minifig', principal: true }, [D]: { role: 'the director', body: 'minifig', principal: true }, [A]: { role: 'the agent', body: 'minifig', principal: true },
      [C]: { role: 'the cinematographer', body: 'minifig' }, [O]: { role: 'the actor', body: 'minifig' } },
    objects: { ledger: { kind: 'book', material: 'paper', at: book, affords: ['read'] }, card: { kind: 'card', material: 'paper', holder: 'agent:R', affords: ['read'] }, loom: { kind: 'workbench', material: 'plastic', at: loom, affords: ['work'] } },
    authored: { intents: G.intents, holds: G.holds, stimuli: G.stimuli, goals: { [E]: 'the record as it is', [D]: 'where it began', [A]: 'what the card asked for' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [A]: [{ a: 'build at the desk', base: 1.0, f: { 'after:sFiles': -2.4 } }, { a: 'bring the card', base: -2.0, f: { 'after:sFiles': 3.2 } }, { a: 'lead to the loom', base: -2.6, f: { 'after:sFan': 3.6 } }],
        [E]: [{ a: 'read the ledger', base: 1.0, f: { 'after:say4': -2.0 } }, { a: 'hear the card', base: -1.6, f: { 'after:say4': 2.6 } }],
      } },
      camera: { follow: true },
    },
  };
};
