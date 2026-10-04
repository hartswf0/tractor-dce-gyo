/* The making-of, 1: The Characters Do Nothing (OD-B25-S01, the LEGO film studio). The animatic, then the engine.
   The director calls action from his chair and Odysseus stands on the little set as the first animatic left him: a figure with a
   voice and a face and no reason to move (a HOLD that is still: nothing moves him, not even breath). The director cuts and says what
   is wrong; the cinematographer, at the camera, agrees. The agent works at its desk the whole time (TOOL_WORK at the keyboard) until
   the director rises and comes to it (RISE, the take's walk his APPROACH): can you make them act? The agent turns from the screen to
   him (REACT turn), answers (every movement needs a cause), and goes to the little set (APPROACH) to wire the actor: the voice, the
   intent, the body. Odysseus's first movement is caused by those words: his head comes round to the voice (LISTEN), and when he is
   told a stillness needs a reason he is given one (a HOLD that breathes: he waits for his cue). Again, action: Odysseus says the
   Odyssey's first sentence (DECLARE, the arms on the stresses: the Muse invoked with both hands), and on "Troy" turns to the wooden
   horse and points (ADVANCE of his move to K5, GESTURE point). The director sees the turn (NOTICE) and asks why; the agent answers. */
'use strict';
module.exports = function author(M, X) {
  const G = require('./_making.js')(M, X), { q, T, K, clip, end, say, hear, hold, walk, I, St } = G;
  const D = 'director', A = 'agent', C = 'cinematographer', O = 'odysseus';
  const K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5');
  const c0 = clip(0), c1 = clip(1), c2 = clip(2), c3 = clip(3), c4 = clip(4), c5 = clip(5), c6 = clip(6), c7 = clip(7), c8 = clip(8), c9 = clip(9), c10 = clip(10);
  const V8 = X.voiceOf(c8), V1 = X.voiceOf(c1), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const keyboard = [170, 64, -62], horse = [-85, 40, -174];
  const tNothing = q(w(V1, 'nothing', c1.at + 6.8)), tMuse = q(w(V8, 'muse', c8.at + 0.8)), tTroy = q(w(V8, 'troy', c8.at + c8.dur - 0.5)), tFar = q(w(V8, 'far', c8.at + 3.2));
  /* ── the animatic ── */
  St({ id: 'sTake', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'a take on the little set: the camera rolling on Odysseus', because: [] });
  St({ id: 'sWork', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'the agent at its desk, building', actor: A, because: [] });
  hold(O, 0, q(K3.win[1] + 1.0), 'the animatic: a set of real bricks, a voice, a face that moves its lips, and nothing that gives him a reason to move', [], { still: true, weight: false, because: [{ id: 'sTake' }] });
  hold(C, 0.2, q(c2.at - 0.5), 'rolling: an eye on the actor through the camera', [[O, 4.0]], { because: [{ id: 'sTake' }] });
  I({ id: 'aType', actor: A, kind: 'TOOL_WORK', t0: 0.3, t1: q(K2.win[0] + 0.4), target: keyboard, label: 'types: the engine under its hands', params: { how: 'carve', period: 0.55, on: keyboard }, because: [{ id: 'sWork' }] });
  say(0, { shapes: ['open'], target: O, label: 'quiet on the set, and action' });
  hold(D, end(c0) + 0.1, q(c1.at - 0.35), 'action called: he waits for the figure to do something', [[O, 4.5]], { because: [{ id: 'say0' }] });
  St({ id: 'sNothing', t0: q(end(c0) + 0.4), t1: q(c1.at - 0.4), kind: 'SIGHT', label: 'nobody on the little set moves', actor: O, because: [{ id: 'say0' }] });
  say(1, { shapes: ['chop', 'describe', 'open', 'dismiss'], maxBeats: 1, target: C, because: [{ id: 'sNothing' }] });
  say(2, { shapes: ['open'], target: D });
  hear(C, 1, { id: 'cHear1' }); hear(D, 2, { id: 'dHear2' });
  St({ id: 'sNothingW', t0: tNothing, t1: q(tNothing + 0.4), kind: 'WORD', label: '"the characters do nothing"', actor: D, because: [{ id: 'say1' }] });
  I({ id: 'aGlance', actor: A, kind: 'REACT', t0: q(tNothing + 0.2), t1: q(tNothing + 1.2), label: 'looks up from the keys at the words', params: { how: 'turn', lookAt: D }, because: [{ id: 'sNothingW' }] });
  /* ── the director goes to the agent ── */
  I({ id: 'dDecide', actor: D, kind: 'DECIDE', t0: q(end(c2) + 0.1), t1: q(K2.win[0] - 0.1), label: 'the one who builds it: he will ask', because: [{ id: 'say2' }] });
  I({ id: 'dRise', actor: D, kind: 'RISE', t0: q(K2.win[0] - 0.1), t1: q(K2.win[0] + 0.8), label: 'out of the chair', because: [{ id: 'dDecide' }] });
  walk(D, 'K2', A, 'crosses the studio to the agent\'s desk', [{ id: 'dRise' }], 'dGo2');
  St({ id: 'sComes', t0: q(K2.win[0] + 0.5), t1: q(K2.win[0] + 1.0), kind: 'SIGHT', label: 'the director coming to the desk', actor: D, because: [{ id: 'dGo2' }] });
  I({ id: 'aTurn', actor: A, kind: 'REACT', t0: q(K2.win[0] + 0.7), t1: q(K2.win[0] + 1.6), label: 'turns from the screen to him', params: { how: 'turn', lookAt: D }, because: [{ id: 'sComes' }] });
  say(3, { shapes: ['open'], target: A, kind: 'COMMAND' });
  hear(A, 3, { id: 'aHear3' });
  say(4, { shapes: ['dismiss', 'point'], target: D });
  hear(D, 4, { id: 'dHear4' });
  hold(C, q(end(c2) + 0.3), q(K4.win[0]), 'the take is cut: he watches the two of them, the camera idle', [[D, 2.4], [A, 2.0], [O, 1.4]], { because: [{ id: 'say2' }] });
  /* ── the agent wires the actor ── */
  walk(A, 'K3', O, 'goes to the little set, to the actor', [{ id: 'say4' }], 'aGo3');
  walk(D, 'K3', O, 'follows it halfway, to watch', [{ id: 'aGo3' }], 'dGo3');
  say(5, { shapes: ['point', 'describe', 'chest', 'show'], maxBeats: 1, target: O });
  St({ id: 'sVoice', t0: q(c5.at + 0.6), t1: q(c5.at + 1.2), kind: 'WORD', label: '"first the voice": words addressed to him', actor: A, because: [{ id: 'say5' }] });
  I({ id: 'oFirst', actor: O, kind: 'LISTEN', target: A, t0: q(K3.win[1] + 1.1), t1: q(end(c6) + 0.4), label: 'his first movement: the head comes round to the voice', params: { nods: [q(end(c6) - 0.2)] }, because: [{ id: 'sVoice' }] });
  say(6, { shapes: ['open'], target: D });
  hold(D, q(K3.win[1] + 0.1), q(K4.win[0] - 0.1), 'he watches the actor turn his head for the first time', [[O, 2.6], [A, 1.6]], { because: [{ id: 'dGo3' }] });
  St({ id: 'sReason', t0: q(end(c6) - 0.4), t1: q(end(c6)), kind: 'WORD', label: '"he stands still for a reason"', actor: A, because: [{ id: 'say6' }] });
  hold(O, q(end(c6) + 0.5), q(c7.at + 0.6), 'given a reason to be still: he waits for his cue', [[A, 1.2], [D, 2.4]], { because: [{ id: 'sReason' }] });
  /* ── again: the actor acts ── */
  walk(A, 'K4', D, 'steps off the set, out of the shot', [{ id: 'say6' }], 'aGo4');
  walk(D, 'K4', O, 'back toward his chair, to watch the take', [{ id: 'say6' }], 'dGo4');
  say(7, { shapes: ['chop'], target: O, kind: 'COMMAND', label: 'again: action' });
  St({ id: 'sAction', t0: q(end(c7) - 0.3), t1: q(end(c7)), kind: 'WORD', label: '"action"', actor: D, because: [{ id: 'say7' }] });
  hold(A, q(K4.win[1] + 0.1), q(c10.at - 0.4), 'it watches what it wired: the voice, the intent, the body', [[O, 3.0], [D, 1.0]], { because: [{ id: 'aGo4' }] });
  hold(C, q(K4.win[0] + 0.1), T, 'rolling again: on the actor', [[O, 4.0], [D, 1.2]], { because: [{ id: 'sAction' }] });
  I({ id: 'oCue', actor: O, kind: 'DECIDE', t0: q(end(c7)), t1: q(c8.at - 0.1), label: 'his cue: he begins', because: [{ id: 'sAction' }] });
  say(8, { shapes: ['invoke', 'describe', 'open'], maxBeats: 1, target: null, label: 'the Odyssey\'s first sentence', because: [{ id: 'oCue' }] });
  St({ id: 'sTroy', t0: tTroy, t1: q(tTroy + 0.4), kind: 'WORD', label: '"the famous town of Troy": the horse that took it stands beside him', actor: O, because: [{ id: 'say8' }] });
  const dT = q(tTroy + 0.15 - K5.win[0]);   /* his move to K5 (the step and the turn to the horse) taken as a whole, earlier: on the word */
  I({ id: 'oTurn', actor: O, kind: 'RETIME', t0: q(K5.win[0] + dT), t1: q(K5.win[1] + dT), label: 'turns to the wooden horse, a step toward it', params: { key: 'K5', delay: dT }, because: [{ id: 'sTroy' }] });
  I({ id: 'oPoint', actor: O, kind: 'GESTURE', target: horse, t0: q(tTroy + 0.3), t1: q(tTroy + 2.4), label: 'points at it: Troy', params: { shape: 'point', at: q(tTroy + 0.6), side: 'R', amp: 1.0, hold: 1.6 }, because: [{ id: 'sTroy' }] });
  hold(O, q(tTroy + 2.5), T, 'the line has named Troy: he keeps his eyes on the horse', [[horse, 3.0], [D, 1.0], [horse, 3.0]], { because: [{ id: 'oPoint' }] });
  hear(D, 8, { id: 'dHear8', nod: false });
  St({ id: 'sTurned', t0: q(tTroy + 0.4), t1: q(tTroy + 0.9), kind: 'SIGHT', label: 'the actor turns of his own accord', actor: O, because: [{ id: 'oTurn' }] });
  I({ id: 'dSee', actor: D, kind: 'NOTICE', target: O, t0: q(tTroy + 0.7), t1: q(c9.at - 0.1), label: 'he turned: why?', params: { gazeHold: 0.8 }, because: [{ id: 'sTurned' }] });
  walk(D, 'K5', A, 'a step toward the agent, to ask', [{ id: 'dSee' }], 'dGo5');
  walk(A, 'K5', D, 'turns to him', [{ id: 'dGo5' }], 'aGo5');
  say(9, { shapes: ['point', 'open'], target: A });
  hear(A, 9, { id: 'aHear9' });
  say(10, { shapes: ['open', 'describe', 'point'], maxBeats: 1, target: D });
  hear(D, 10, { id: 'dHear10' });
  return {
    type: 'dialogue', title: 'The making-of, 1: the characters do nothing',
    actors: { [D]: { role: 'the director', body: 'minifig', principal: true }, [A]: { role: 'the agent, the builder', body: 'minifig', principal: true },
      [C]: { role: 'the cinematographer', body: 'minifig' }, [O]: { role: 'the actor in costume', body: 'minifig', principal: true } },
    objects: { horse: { kind: 'set piece', material: 'wood', at: horse, affords: ['look'] }, desk: { kind: 'desk', material: 'plastic', at: keyboard, affords: ['work'] } },
    authored: { intents: G.intents, holds: G.holds, stimuli: G.stimuli, goals: { [D]: 'a film in which the figures act', [A]: 'every movement with a cause', [C]: 'the take on the actor', [O]: 'a reason to move' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'stand as the animatic left him', base: 1.4, f: { 'after:sVoice': -3.0 } }, { a: 'listen to the agent', base: -2.0, f: { 'after:sVoice': 3.0, 'after:sAction': -2.0 } }, { a: 'act the line', base: -2.5, f: { 'after:sAction': 4.0 } }],
        [D]: [{ a: 'watch the take', base: 1.0, f: { 'after:sNothing': -1.0 } }, { a: 'ask the agent', base: -2.0, f: { 'after:sNothing': 2.6, 'after:say4': -1.0 } }, { a: 'ask why he turned', base: -2.5, f: { 'after:sTurned': 3.6 } }],
        [A]: [{ a: 'build at the desk', base: 1.2, f: { 'after:sComes': -2.4 } }, { a: 'wire the actor', base: -2.2, f: { 'after:say4': 3.2, 'after:sAction': -2.0 } }, { a: 'explain the cause', base: -2.5, f: { 'after:dSee': 3.4 } }],
      } },
      camera: { follow: true },
    },
  };
};
