/* The making-of, 8: The Bridge (OD-B25-S08, part two). The agent brings the director a halftone drawing from the halfworld (the sheet in
   its hand) and says how the drawings came across: as words for the forage. "Forage" sends it to the horse on the little set (the
   take's walk); the examiner follows with her glass and holds it to the build (the K2 pose): every stud tested. The director, coming
   after, asks if it made all this alone; the agent takes them to the loom of agents (the take's walk, caused by the question) and says
   it sends work out to helpers; the examiner gives the counts. The director states the gate (the contact sheet); the agent answers with
   the rule of takes. The examiner goes back to the ledger (her walk caused by "no take is thrown away") and gives the names. The
   cinematographer turns the camera on them (as in the fourth scene) and the director calls action. */
'use strict';
module.exports = function author(M, X) {
  const G = require('./_making.js')(M, X), { q, T, K, clip, end, say, hear, hold, walk, I, St } = G;
  const D = 'director', A = 'agent', C = 'cinematographer', O = 'odysseus', E = 'examiner';
  const K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5'), K6 = K('K6');
  const c = gi => clip(gi), V0 = X.voiceOf(c(0)), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const s = 0.8918918918918919, P = (x, h, z) => [x * s, (h + 8) * s, (10 - z) * s];
  const horse = P(-100, 40, 205), loom = P(100, 70, -170), book = P(-300, 64, -200), lens = P(-120, 100, -60), keyboard = P(190, 64, 80);
  const tForage = q(w(V0, 'forage', end(c(0)) - 0.5));
  St({ id: 'sSheet', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'the agent at its desk with a halftone drawing from the halfworld; the director by it', actor: A, because: [] });
  hold(D, 0.1, q(c(0).at + 0.2), 'he looks at the drawing it holds', [[A, 2.0], [keyboard, 1.0]], { because: [{ id: 'sSheet' }] });
  hold(E, 0.1, q(K2.win[0] - 0.1), 'she listens', [[A, 3.0], [D, 1.2]], { because: [{ id: 'sSheet' }] });
  hold(C, 0.1, q(K3.win[0] - 0.1), 'at his camera, listening', [[A, 3.0], [O, 1.4]], { because: [{ id: 'sSheet' }] });
  hold(O, 0.1, q(K6.win[0] - 0.1), 'the actor on the little set, by the horse', [[A, 2.4], [horse, 1.6]], { because: [{ id: 'sSheet' }] });
  say(0, { shapes: ['show', 'describe', 'open'], maxBeats: 1, target: D, side: 'L' });
  hear(D, 0, { id: 'dHear0' }); hear(E, 0, { id: 'eHear0', nod: false });
  /* word to world */
  St({ id: 'sForage', t0: tForage, t1: q(tForage + 0.4), kind: 'WORD', label: '"the forage": the builds on the little set', actor: A, because: [{ id: 'say0' }] });
  walk(A, 'K2', horse, 'to the horse on the little set: a word built in bricks', [{ id: 'sForage' }], 'aGo2');
  walk(E, 'K2', horse, 'after it, glass in hand, to check the build', [{ id: 'aGo2' }], 'eGo2');
  walk(D, 'K2', A, 'follows them', [{ id: 'aGo2' }], 'dGo2');
  say(1, { shapes: ['point', 'show', 'describe'], maxBeats: 1, target: E });
  hear(E, 1, { id: 'eHear1', nod: false }); hear(D, 1, { id: 'dHear1', nod: false });
  hold(E, q(K2.win[1] + 0.1), q(c(2).at - 0.2), 'the glass to the horse, stud by stud', [[horse, 3.0]], { because: [{ id: 'eGo2' }] });
  say(2, { shapes: ['point', 'open'], target: A });
  hear(A, 2, { id: 'aHear2' }); hear(D, 2, { id: 'dHear2', nod: false });
  /* the helpers */
  say(3, { shapes: ['open'], target: A });
  hear(A, 3, { id: 'aHear3', nod: false });
  walk(A, 'K3', loom, 'takes them to the loom of agents', [{ id: 'say3' }], 'aGo3');
  for (const who of [D, E, C]) walk(who, 'K3', loom, 'to the loom', [{ id: 'aGo3' }], 'go3' + who.slice(0, 3));
  say(4, { shapes: ['show', 'point', 'describe', 'open'], maxBeats: 1, target: D });
  hear(D, 4, { id: 'dHear4' }); hear(E, 4, { id: 'eHear4', nod: false }); hear(C, 4, { id: 'cHear4', nod: false });
  say(5, { shapes: ['describe', 'chop', 'open'], maxBeats: 1, target: D });
  hear(D, 5, { id: 'dHear5' }); hear(A, 5, { id: 'aHear5', nod: false });
  /* the gate; the takes */
  walk(D, 'K4', A, 'turns to the agent', [{ id: 'say5' }], 'dGo4'); walk(E, 'K4', D, 'turns to the director', [{ id: 'dGo4' }], 'eGo4'); walk(C, 'K4', D, 'turns', [{ id: 'dGo4' }], 'cGo4');
  say(6, { shapes: ['chop', 'point'], target: A });
  hear(A, 6, { id: 'aHear6' });
  say(7, { shapes: ['open', 'show'], target: D });
  hear(D, 7, { id: 'dHear7' });
  /* the names */
  St({ id: 'sTakes', t0: q(end(c(7)) - 0.3), t1: q(end(c(7)) + 0.1), kind: 'WORD', label: '"no take is thrown away": the ledger keeps them', actor: A, because: [{ id: 'say7' }] });
  walk(E, 'K5', book, 'back to the ledger', [{ id: 'sTakes' }], 'eGo5');
  for (const who of [D, A, C]) walk(who, 'K5', E, 'follows her to the ledger', [{ id: 'eGo5' }], 'go5' + who.slice(0, 3));
  say(8, { shapes: ['open', 'point', 'describe'], maxBeats: 1, target: D });
  for (const who of [D, A, C]) hear(who, 8, { id: 'hear8' + who.slice(0, 3), nod: who === D });
  /* action */
  St({ id: 'sDone', t0: q(end(c(8)) - 0.3), t1: q(end(c(8)) + 0.1), kind: 'WORD', label: 'the record read out to the end', actor: E, because: [{ id: 'say8' }] });
  walk(C, 'K6', lens, 'to the camera, and turns it on the crew', [{ id: 'sDone' }], 'cGo6');
  for (const who of [D, A, O, E]) walk(who, 'K6', lens, 'into the camera\'s frame', [{ id: 'sDone' }], 'go6' + who.slice(0, 3));
  St({ id: 'sLens', t0: q(K6.win[1]), t1: q(K6.win[1] + 0.5), kind: 'SIGHT', label: 'the camera turned on them', actor: C, because: [{ id: 'cGo6' }] });
  hold(C, q(K6.win[1] + 0.1), q(c(9).at - 0.3), 'his eye to the camera, on the crew', [[lens, 3.0]], { because: [{ id: 'cGo6' }] });
  say(9, { shapes: ['open'], target: D });
  for (const who of [A, O, E]) I({ id: 'att' + who.slice(0, 3), actor: who, kind: 'ATTEND', target: lens, t0: q(K6.win[1] + 0.3), t1: T, label: 'looks into the lens', because: [{ id: 'sLens' }] });
  hold(D, q(K6.win[1] + 0.1), q(c(10).at - 0.3), 'the camera on him', [[lens, 2.0], [A, 1.0]], { because: [{ id: 'sLens' }] });
  say(10, { shapes: ['open', 'chop'], target: lens, because: [{ id: 'say9' }] });
  hold(D, q(end(c(10)) + 0.2), T, 'action called: he stands in the frame', [[lens, 3.0]], { because: [{ id: 'say10' }] });
  hold(C, q(end(c(9)) + 0.2), T, 'rolling', [[lens, 4.0]], { because: [{ id: 'say9' }] });
  return {
    type: 'revelation', title: 'The making-of, 8: the bridge, the helpers, the names',
    actors: { [A]: { role: 'the agent', body: 'minifig', principal: true }, [D]: { role: 'the director', body: 'minifig', principal: true }, [E]: { role: 'the examiner', body: 'minifig', principal: true },
      [C]: { role: 'the cinematographer', body: 'minifig' }, [O]: { role: 'the actor', body: 'minifig' } },
    objects: { horse: { kind: 'build', material: 'plastic', at: horse, affords: ['inspect'] }, loom: { kind: 'workbench', material: 'plastic', at: loom, affords: ['work'] }, ledger: { kind: 'book', material: 'paper', at: book, affords: ['read'] }, camera: { kind: 'camera', material: 'plastic', at: lens, affords: ['shoot'] } },
    authored: { intents: G.intents, holds: G.holds, stimuli: G.stimuli, goals: { [A]: 'show how the work crossed over and who did it', [D]: 'to see before it goes out', [E]: 'the record as it is' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [A]: [{ a: 'show the drawing', base: 1.0, f: { 'after:sForage': -2.0 } }, { a: 'show the build', base: -1.6, f: { 'after:sForage': 3.0, 'after:say3': -2.6 } }, { a: 'show the helpers', base: -2.4, f: { 'after:say3': 3.6 } }],
        [E]: [{ a: 'listen', base: 1.0, f: { 'after:aGo2': -2.0 } }, { a: 'check the studs', base: -2.0, f: { 'after:aGo2': 3.0, 'after:say3': -2.4 } }, { a: 'read the names', base: -2.6, f: { 'after:sTakes': 3.8 } }],
        [C]: [{ a: 'listen', base: 1.0, f: { 'after:sDone': -3.0 } }, { a: 'turn the camera on the crew', base: -2.4, f: { 'after:sDone': 4.4 } }],
      } },
      camera: { follow: true },
    },
  };
};
