/* The making-of, 8: The Bridge (OD-B25-S08; part two). The agent brings the Director a halftone drawing; "Bricks."; the AD translates
   (word to world). At the horse on the little set the examiner holds her glass to the studs. "Who did all this?": the AD answers in
   check-ins. The power goes (a SOUND, the dark) and the speaker says the container was restarted; the agent stands blank in the dark;
   when the light comes back it is a new agent (it looks round, then at the AD) and says which one it is; the AD hands over. The gate;
   the takes. At the ledger, the names. The cinematographer turns the camera on the crew and the Director calls action. */
'use strict';
module.exports = function author(M, X) {
  const D = 'director', A = 'agent', C = 'cinematographer', O = 'odysseus', E = 'examiner', F = 'firstad';
  const s = 0.8918918918918919, P = (x, h, z) => [x * s, (h + 8) * s, (10 - z) * s];
  const horse = P(-100, 40, 205), book = P(-300, 64, -200), lens = P(-120, 100, -60), spk = P(-30, 180, 290);
  const G = require('./_making2.js')(M, X, { present: [D, A, C, O, E, F], speaker: spk, lens,
    shapes: { 0: ['show', 'open'], 1: ['chop'], 4: ['open'], 9: ['chop', 'point'], 13: ['open', 'chop'] }, side: { 0: 'L' },
    walkTo: { K2: { [A]: horse, [E]: horse }, K6: { [E]: book }, K7: { [C]: lens, [D]: lens, [A]: lens, [O]: lens, [E]: lens, [F]: lens } },
    walkLabel: { K2: { [A]: 'to the horse: a word built in bricks', [E]: 'glass in hand, to check the build' }, K6: { [E]: 'back to the ledger' }, K7: { [C]: 'to the camera, and turns it on the crew' } } });
  const { q, T, K, clip, end, hold, I, St } = G, c = clip, K2 = K('K2'), K4 = K('K4'), K4b = K('K4b'), K7 = K('K7');
  St({ id: 'sSheet', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'the agent with a halftone drawing from the halfworld', actor: A, because: [] });
  hold(O, 0.1, q(K7.win[0] - 0.1), 'the actor on the little set, by the horse', [[A, 2.4], [horse, 1.6]], { because: [{ id: 'sSheet' }] });
  hold(E, q(K2.win[1] + 0.1), q(c(3).at - 0.2), 'the glass to the horse, stud by stud', [[horse, 3.0]], { because: [{ id: 'goK2exa' }] });
  const tDown = q(c(6).at - 0.6), tUp = K4b ? q(K4b.t) : q(c(7).at - 1.4);
  St({ id: 'sDark', t0: tDown, t1: q(tDown + 0.5), kind: 'SIGHT', label: 'the power goes: the container restarts', because: [] });
  hold(A, q(tDown + 0.1), q(tUp - 0.1), 'restarted: it stands blank in the dark', [], { still: true, because: [{ id: 'sDark' }] });
  St({ id: 'sLight', t0: tUp, t1: q(tUp + 0.5), kind: 'SIGHT', label: 'the light comes back: a new agent in the same bricks', because: [] });
  I({ id: 'aNew', actor: A, kind: 'REACT', t0: q(tUp + 0.1), t1: q(c(7).at - 0.1), label: 'the new agent looks round, then at the AD', params: { how: 'turn', lookAt: F }, because: [{ id: 'sLight' }] });
  St({ id: 'sLens', t0: q(K7.win[1]), t1: q(K7.win[1] + 0.5), kind: 'SIGHT', label: 'the camera turned on them', actor: C, because: [{ id: 'goK7cin' }] });
  for (const who of [A, O, E, F]) I({ id: 'att' + who.slice(0, 3), actor: who, kind: 'ATTEND', target: lens, t0: q(K7.win[1] + 0.3), t1: T, label: 'looks into the lens', because: [{ id: 'sLens' }] });
  hold(D, q(end(c(13)) + 0.2), T, 'action called: he stands in the frame', [[lens, 3.0]], { because: [{ id: 'say13' }] });
  hold(C, q(end(c(12)) + 0.2), T, 'rolling', [[lens, 4.0]], { because: [{ id: 'say12' }] });
  return {
    type: 'revelation', title: 'The making-of, 8: the bridge, the helpers, the restart, the names',
    actors: { [A]: { role: 'the agent', body: 'minifig', principal: true }, [D]: { role: 'the director', body: 'minifig', principal: true }, [F]: { role: 'the first AD', body: 'minifig', principal: true },
      [E]: { role: 'the examiner', body: 'minifig', principal: true }, [C]: { role: 'the cinematographer', body: 'minifig' }, [O]: { role: 'the actor', body: 'minifig' } },
    objects: { horse: { kind: 'build', material: 'plastic', at: horse, affords: ['inspect'] }, ledger: { kind: 'book', material: 'paper', at: book, affords: ['read'] }, camera: { kind: 'camera', material: 'plastic', at: lens, affords: ['shoot'] }, speaker: { kind: 'loudspeaker', material: 'plastic', at: spk, affords: ['listen'] } },
    authored: { intents: G.intents, holds: G.holds, stimuli: G.stimuli, goals: { [A]: 'show how the work crossed over', [D]: 'to see before it goes out', [F]: 'a check-in at the top of the hour', [E]: 'the record as it is' }, couplings: [],
      causal: { tau: 0.7, actions: { [A]: [{ a: 'work', base: 1.0, f: { 'after:sDark': -4.0 } }, { a: 'stand blank', base: -2.0, f: { 'after:sDark': 4.0, 'after:sLight': -4.0 } }, { a: 'read the handover', base: -2.4, f: { 'after:sLight': 3.6 } }] } },
      camera: { follow: true } },
  };
};
