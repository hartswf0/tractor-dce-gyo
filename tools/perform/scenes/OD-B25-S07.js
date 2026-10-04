/* The making-of, 7: The Voices (OD-B25-S07, part two). The director calls a scene from the halfworld's radio play; Odysseus, on the
   little set, reads Telemachus's turn as the script gave it, a stage direction; the director stops him (his line caused by what he
   heard). The agent, at its desk, hears the stop (a WORD) and comes over (the take's walk) to say why; the examiner gives the date and
   the count. The agent says how they were recorded again; the cinematographer, at the camera, turns to ask about the scenes (REACT,
   caused by "a book at a time"); the agent answers. The examiner corrects the count (her walk to the director, caused by "a hundred and
   fifty-two"); the director says to write it down. Then the music, and its credit. */
'use strict';
module.exports = function author(M, X) {
  const G = require('./_making.js')(M, X), { q, T, K, clip, end, say, hear, hold, walk, I, St } = G;
  const D = 'director', A = 'agent', C = 'cinematographer', O = 'odysseus', E = 'examiner';
  const K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5');
  const c = gi => clip(gi), V5 = X.voiceOf(c(5)), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const s = 0.8918918918918919, P = (x, h, z) => [x * s, (h + 8) * s, (10 - z) * s];
  const lens = P(-170, 100, 20), set = P(-230, 60, 200), keyboard = P(190, 64, 80), farm = P(295, 120, 270);
  const tTime = q(w(V5, 'time', end(c(5)) - 0.4));
  St({ id: 'sTake', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'a take on the little set: the hut from the radio play, the camera rolling', because: [] });
  hold(C, 0.1, q(c(6).at - 1.0), 'his eye to the camera, on the actor', [[lens, 3.0], [O, 1.4]], { because: [{ id: 'sTake' }] });
  hold(E, 0.1, q(c(4).at - 0.3), 'she watches the take', [[O, 3.0], [D, 1.2]], { because: [{ id: 'sTake' }] });
  I({ id: 'aType', actor: A, kind: 'TOOL_WORK', t0: 0.3, t1: q(c(2).at + 0.4), target: keyboard, label: 'types', params: { how: 'carve', period: 0.55, on: keyboard }, because: [{ id: 'sTake' }] });
  say(0, { shapes: ['point', 'open'], target: O });
  hear(O, 0, { id: 'oHear0' });
  say(1, { shapes: ['open', 'describe'], target: D, amp: 0.6 });
  hear(D, 1, { id: 'dHear1', nod: false });
  St({ id: 'sWrong', t0: q(end(c(1)) - 0.2), t1: q(end(c(1)) + 0.3), kind: 'WORD', label: 'a stage direction, read as a line', actor: O, because: [{ id: 'say1' }] });
  say(2, { shapes: ['chop', 'dismiss'], target: O, because: [{ id: 'sWrong' }] });
  hear(O, 2, { id: 'oHear2', nod: false });
  hold(O, q(end(c(2)) + 0.3), q(K5.win ? K5.win[0] - 0.1 : T), 'the actor waits, script in hand', [[D, 2.4], [A, 1.4]], { because: [{ id: 'say2' }] });
  /* why */
  St({ id: 'sStop', t0: q(end(c(2)) - 0.4), t1: q(end(c(2))), kind: 'WORD', label: '"a stage direction": heard at the desk', actor: D, because: [{ id: 'say2' }] });
  walk(A, 'K2', D, 'from the desk to the director: it knows why', [{ id: 'sStop' }], 'aGo2');
  walk(D, 'K2', A, 'turns to the agent', [{ id: 'aGo2' }], 'dGo2');
  say(3, { shapes: ['describe', 'open'], target: D });
  hear(D, 3, { id: 'dHear3' }); hear(E, 3, { id: 'eHear3', nod: false });
  say(4, { shapes: ['show', 'point', 'open'], maxBeats: 1, target: D });
  hear(D, 4, { id: 'dHear4' }); hear(A, 4, { id: 'aHear4' });
  /* again, in batches */
  say(5, { shapes: ['describe', 'show', 'open'], maxBeats: 1, target: D });
  hear(D, 5, { id: 'dHear5' });
  St({ id: 'sBatch', t0: tTime, t1: q(tTime + 0.4), kind: 'WORD', label: '"a book at a time"', actor: A, because: [{ id: 'say5' }] });
  I({ id: 'cTurn', actor: C, kind: 'REACT', t0: q(tTime + 0.1), t1: q(tTime + 1.0), label: 'looks up from the camera', params: { how: 'turn', lookAt: A }, because: [{ id: 'sBatch' }] });
  walk(C, 'K3', A, 'a step from the camera toward the talk: the take is stopped', [{ id: 'say4' }], 'cGo3');
  say(6, { shapes: ['open'], target: A });
  hear(A, 6, { id: 'aHear6', nod: false });
  say(7, { shapes: ['show', 'open'], target: C });
  hear(C, 7, { id: 'cHear7' }); hear(D, 7, { id: 'dHear7', nod: false });
  /* not every line */
  St({ id: 'sAll', t0: q(end(c(7)) - 0.4), t1: q(end(c(7))), kind: 'WORD', label: '"a hundred and fifty-two": she knows a count that disagrees', actor: A, because: [{ id: 'say7' }] });
  walk(E, 'K4', D, 'to the director', [{ id: 'sAll' }], 'eGo4');
  for (const who of [A, D, C]) walk(who, 'K4', E, 'turns to her', [{ id: 'eGo4' }], 'go4' + who.slice(0, 3));
  say(8, { shapes: ['chop', 'open'], target: D });
  hear(D, 8, { id: 'dHear8' }); hear(A, 8, { id: 'aHear8', nod: false }); hear(C, 8, { id: 'cHear8', nod: false });
  say(9, { shapes: ['point'], target: E, kind: 'COMMAND' });
  hear(E, 9, { id: 'eHear9' });
  /* the music */
  walk(O, 'K5', E, 'off the set to hear', [{ id: 'say9' }], 'oGo5');
  for (const who of [A, D, C]) walk(who, 'K5', E, 'to her', [{ id: 'say9' }], 'go5' + who.slice(0, 3));
  say(10, { shapes: ['describe', 'show', 'chop'], maxBeats: 1, target: D });
  for (const who of [D, A, C, O]) hear(who, 10, { id: 'hear10' + who.slice(0, 3), nod: who === D });
  hold(E, q(end(c(10)) + 0.3), T, 'the gap stated: she waits for the director', [[D, 3.0]], { because: [{ id: 'say10' }] });
  hold(D, q(end(c(10)) + 0.5), T, 'he takes it in', [[E, 2.4], [farm, 1.2]], { because: [{ id: 'say10' }] });
  return {
    type: 'dialogue', title: 'The making-of, 7: the voices',
    actors: { [D]: { role: 'the director', body: 'minifig', principal: true }, [A]: { role: 'the agent', body: 'minifig', principal: true },
      [O]: { role: 'the actor', body: 'minifig', principal: true }, [E]: { role: 'the examiner', body: 'minifig', principal: true }, [C]: { role: 'the cinematographer', body: 'minifig' } },
    objects: { camera: { kind: 'camera', material: 'plastic', at: lens, affords: ['shoot'] }, set: { kind: 'set', material: 'plastic', at: set, affords: ['act'] } },
    authored: { intents: G.intents, holds: G.holds, stimuli: G.stimuli, goals: { [D]: 'lines, not directions', [A]: 'every turn spoken in its own words', [E]: 'the count as it is', [O]: 'his line' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [D]: [{ a: 'watch the take', base: 1.0, f: { 'after:sWrong': -2.6 } }, { a: 'stop it', base: -2.0, f: { 'after:sWrong': 3.4 } }],
        [A]: [{ a: 'build at the desk', base: 1.0, f: { 'after:sStop': -2.4 } }, { a: 'explain', base: -2.0, f: { 'after:sStop': 3.2 } }],
        [E]: [{ a: 'watch', base: 1.0, f: { 'after:sAll': -2.4 } }, { a: 'correct the count', base: -2.0, f: { 'after:sAll': 3.2 } }],
      } },
      camera: { follow: true },
    },
  };
};
