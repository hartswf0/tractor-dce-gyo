/* The making-of, 7: The Voices (OD-B25-S07; part two). "Voices." The AD translates, and casts Odysseus to read in for a late
   Telemachus. Odysseus reads the turn as the script gave it, a stage direction, then explains he is the unknown beggar. The
   Director's slow turn to the AD (a REACT held for the length of the pause) and his verdict. The agent comes from the desk to say why;
   the examiner gives the count. The AD orders a re-record; the speaker announces the day's limit; the AD re-plans in batches; the
   agent reports the scenes. The examiner corrects the count; "Write it down." Then the music, and who Treblo is. */
'use strict';
module.exports = function author(M, X) {
  const D = 'director', A = 'agent', C = 'cinematographer', O = 'odysseus', E = 'examiner', F = 'firstad';
  const s = 0.8918918918918919, P = (x, h, z) => [x * s, (h + 8) * s, (10 - z) * s];
  const lens = P(-170, 100, 20), keyboard = P(190, 64, 80), spk = P(-30, 180, 290);
  const G = require('./_making2.js')(M, X, { present: [D, A, C, O, E, F], speaker: spk,
    shapes: { 0: ['chop'], 2: ['open', 'describe'], 3: ['chest'], 4: ['dismiss'], 12: ['point'] },
    walkLabel: { K2: { [A]: 'from the desk to the Director: it knows why' } } });
  const { q, T, K, clip, end, hold, I, St } = G, c = clip;
  St({ id: 'sTake', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'a take on the little set: the hut from the radio play, the camera rolling', because: [] });
  hold(C, 0.1, q(c(14).at - 0.6), 'his eye to the camera, on the actor', [[lens, 3.0], [O, 1.4]], { because: [{ id: 'sTake' }] });
  I({ id: 'aType', actor: A, kind: 'TOOL_WORK', t0: 0.3, t1: q(c(4).at + 0.6), target: keyboard, label: 'types', params: { how: 'carve', period: 0.55, on: keyboard }, because: [{ id: 'sTake' }] });
  St({ id: 'sBeggar', t0: q(end(c(3)) - 0.2), t1: q(end(c(3)) + 0.2), kind: 'WORD', label: '"I am the unknown beggar."', actor: O, because: [{ id: 'say3' }] });
  I({ id: 'dSlow', actor: D, kind: 'REACT', t0: q(end(c(3)) + 0.3), t1: q(c(4).at + 0.1), label: 'the slow turn: from the actor to the AD', params: { how: 'turn', lookAt: F }, because: [{ id: 'sBeggar' }] });
  hold(O, q(end(c(4)) + 0.3), T, 'the actor waits for a cause, script in hand', [[D, 2.4], [E, 1.4]], { because: [{ id: 'say4' }] });
  return {
    type: 'dialogue', title: 'The making-of, 7: the voices',
    actors: { [D]: { role: 'the director', body: 'minifig', principal: true }, [F]: { role: 'the first AD', body: 'minifig', principal: true }, [O]: { role: 'the actor', body: 'minifig', principal: true },
      [A]: { role: 'the agent', body: 'minifig', principal: true }, [E]: { role: 'the examiner', body: 'minifig', principal: true }, [C]: { role: 'the cinematographer', body: 'minifig' } },
    objects: { camera: { kind: 'camera', material: 'plastic', at: lens, affords: ['shoot'] }, speaker: { kind: 'loudspeaker', material: 'plastic', at: spk, affords: ['listen'] } },
    authored: { intents: G.intents, holds: G.holds, stimuli: G.stimuli, goals: { [D]: 'lines, not directions', [F]: 'a brief for every word', [O]: 'a cause', [E]: 'the count as it is' }, couplings: [],
      causal: { tau: 0.7, actions: { [D]: [{ a: 'watch the take', base: 1.0, f: { 'after:sBeggar': -2.6 } }, { a: 'turn, slowly', base: -2.0, f: { 'after:sBeggar': 3.4 } }] } },
      camera: { follow: true } },
  };
};
