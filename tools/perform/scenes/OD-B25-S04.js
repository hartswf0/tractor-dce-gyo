/* The making-of, 4: The Ledger (OD-B25-S04, the LEGO film studio). The examiner states the record; the director asks for a film.
   The examiner reads the ledger on its stand through her glass (a HOLD on the book) and says what it holds: the commits, who made
   them, the snapshots. The crew stand round to hear it (LISTEN, HOLDs with their reasons). She walks to the render farm (the take's
   walk) and gives its hours; the others follow her (their walks caused by hers). At the shelf she holds the glass to the reels (the
   K3 pose) and gives the hashes. Then she turns to the director (the one gap: the music); he answers, and remembers the first film
   (a slide show); the agent says what it was; the director asks for a film, with them in it. The cinematographer goes to the camera
   and turns it on the crew (the take's walk; the camera stands turned in the last key); they turn to it (ATTEND), and the director
   calls action on themselves. */
'use strict';
module.exports = function author(M, X) {
  const G = require('./_making.js')(M, X), { q, T, K, clip, end, say, hear, hold, walk, I, St } = G;
  const D = 'director', A = 'agent', C = 'cinematographer', O = 'odysseus', E = 'examiner';
  const K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5'), K6 = K('K6');
  const c = gi => clip(gi), V1 = X.voiceOf(c(1)), V5 = X.voiceOf(c(5)), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const s = 0.8918918918918919, P = (x, h, z) => [x * s, (h + 8) * s, (10 - z) * s];
  const book = P(-300, 64, -200), towers = P(295, 120, 270), reels = P(90, 120, 290), kept = P(90, 40, 290), lens = P(-120, 100, -60);
  const tAgent = q(w(V1, 'agent', c(1).at + c(1).dur - 0.6)), tTreblo = q(w(V5, 'treblo', c(5).at + 3.2));
  /* ── the ledger ── */
  St({ id: 'sLedger', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'the examiner at the ledger, the glass over its pages; the crew round her', actor: E, because: [] });
  hold(E, 0.1, q(c(0).at - 0.3), 'reading the ledger through the glass', [[book, 3.0]], { because: [{ id: 'sLedger' }] });
  say(0, { shapes: ['open'], target: D });
  say(1, { shapes: ['describe', 'point', 'open'], maxBeats: 1, target: D });
  say(2, { shapes: ['show', 'point'], maxBeats: 1, target: A });
  hold(E, q(end(c(0)) + 0.1), q(c(1).at - 0.3), 'back to the page', [[book, 1.0]], { because: [{ id: 'say0' }] });
  hold(E, q(end(c(1)) + 0.1), q(c(2).at - 0.3), 'the next column of the ledger', [[book, 1.0]], { because: [{ id: 'say1' }] });
  for (const [who, gi] of [[D, 0], [D, 1], [C, 1], [O, 1], [D, 2], [A, 2], [C, 2], [O, 2]]) hear(who, gi, { id: 'hear' + gi + who.slice(0, 3), nod: who === D || who === A });
  hold(A, 0.1, q(c(2).at + 0.1), 'it listens to its own record being read', [[E, 2.6], [book, 1.4]], { because: [{ id: 'sLedger' }] });
  hold(C, 0.1, q(c(1).at + 0.1), 'he listens', [[E, 3.0]], { because: [{ id: 'sLedger' }] });
  hold(O, 0.1, q(c(1).at + 0.1), 'the actor has come to hear the record', [[E, 3.0], [book, 1.4]], { because: [{ id: 'sLedger' }] });
  St({ id: 'sAgentW', t0: tAgent, t1: q(tAgent + 0.3), kind: 'WORD', label: '"by the agent"', actor: E, because: [{ id: 'say1' }] });
  I({ id: 'dToA', actor: D, kind: 'REACT', t0: q(tAgent + 0.15), t1: q(tAgent + 1.0), label: 'a look at the agent', params: { how: 'turn', lookAt: A }, because: [{ id: 'sAgentW' }] });
  /* ── the farm ── */
  St({ id: 'sTurn', t0: q(Math.min(end(c(2)) - 0.3, K2.win[0] - 0.5)), t1: q(Math.min(end(c(2)), K2.win[0] - 0.1)), kind: 'WORD', label: 'the ledger read: the render logs next', actor: E, because: [{ id: 'say2' }] });
  walk(E, 'K2', towers, 'to the render farm: the logs', [{ id: 'sTurn' }], 'eGo2');
  for (const who of [D, A, C, O]) walk(who, 'K2', E, 'follows the examiner to the farm', [{ id: 'eGo2' }], 'go2' + who.slice(0, 3));
  say(3, { shapes: ['show', 'describe', 'point', 'open'], maxBeats: 1, target: D });
  for (const who of [D, A, C, O]) hear(who, 3, { id: 'hear3' + who.slice(0, 3), nod: who === A });
  /* ── the shelf ── */
  walk(E, 'K3', reels, 'to the shelf of reels', [{ id: 'say3' }], 'eGo3');
  for (const who of [D, A, C, O]) walk(who, 'K3', E, 'after her, to the shelf', [{ id: 'eGo3' }], 'go3' + who.slice(0, 3));
  hold(E, q(K3.win[1] + 0.1), q(c(4).at - 0.3), 'the glass held to the reels', [[reels, 1.6], [kept, 1.2]], { because: [{ id: 'eGo3' }] });
  say(4, { shapes: ['point', 'open'], target: D });
  for (const who of [D, A, C, O]) hear(who, 4, { id: 'hear4' + who.slice(0, 3), nod: who === D });
  /* ── the gap ── */
  walk(E, 'K4', D, 'turns from the shelf to the director', [{ id: 'say4' }], 'eGo4');
  for (const who of [D, A, C, O]) walk(who, 'K4', E, 'turns with her', [{ id: 'eGo4' }], 'go4' + who.slice(0, 3));
  say(5, { shapes: ['chop', 'open', 'dismiss'], maxBeats: 1, target: D });
  St({ id: 'sGap', t0: tTreblo, t1: q(tTreblo + 0.4), kind: 'WORD', label: '"credited only as Treblo": no maker, no licence', actor: E, because: [{ id: 'say5' }] });
  I({ id: 'dHearGap', actor: D, kind: 'LISTEN', target: E, t0: q(c(5).at + 0.1), t1: q(c(6).at - 0.2), label: 'the gap: he hears it out', params: { nods: [q(end(c(5)) - 0.2)] }, because: [{ id: 'v5' }] });
  for (const who of [A, C, O]) hear(who, 5, { id: 'hear5' + who.slice(0, 3), nod: false });
  say(6, { shapes: ['point'], target: E, because: [{ id: 'sGap' }] });
  hear(E, 6, { id: 'eHear6' });
  hold(E, q(end(c(6)) + 0.5), q(K6.win[0] - 0.1), 'it is in the report: she listens to the rest', [[D, 2.6], [A, 1.8]], { because: [{ id: 'say6' }] });
  /* ── make it a film ── */
  walk(D, 'K5', A, 'turns to the agent', [{ id: 'say6' }], 'dGo5'); walk(A, 'K5', D, 'to the director', [{ id: 'dGo5' }], 'aGo5');
  walk(C, 'K5', D, 'closer', [{ id: 'dGo5' }], 'cGo5'); walk(O, 'K5', D, 'closer', [{ id: 'dGo5' }], 'oGo5');
  say(7, { shapes: ['open', 'dismiss'], target: A });
  hear(A, 7, { id: 'aHear7' });
  say(8, { shapes: ['describe', 'open'], target: D });
  hear(D, 8, { id: 'dHear8' });
  say(9, { shapes: ['chop', 'show', 'point', 'chest'], maxBeats: 1, target: A });
  for (const who of [A, C, O]) hear(who, 9, { id: 'hear9' + who.slice(0, 3), nod: who !== O });
  hold(C, q(K5.win[1] + 0.1), q(c(9).at - 0.2), 'he waits to hear what the film will be', [[D, 2.6], [A, 1.4]], { because: [{ id: 'cGo5' }] });
  hold(O, q(K5.win[1] + 0.1), q(c(9).at - 0.2), 'the actor waits for direction', [[D, 2.6], [E, 1.4]], { because: [{ id: 'oGo5' }] });
  St({ id: 'sUs', t0: q(end(c(9)) - 0.6), t1: q(end(c(9))), kind: 'WORD', label: '"with us in it"', actor: D, because: [{ id: 'say9' }] });
  walk(C, 'K6', lens, 'to the camera, and turns it on the crew', [{ id: 'sUs' }], 'cGo6');
  for (const who of [D, A, O, E]) walk(who, 'K6', lens, 'into the camera\'s frame', [{ id: 'sUs' }], 'go6' + who.slice(0, 3));
  St({ id: 'sLens', t0: q(K6.win[1]), t1: q(K6.win[1] + 0.5), kind: 'SIGHT', label: 'the camera turned on them', actor: C, because: [{ id: 'cGo6' }] });
  hold(C, q(K6.win[1] + 0.1), q(c(10).at - 0.3), 'his eye to the camera, on the crew', [[lens, 3.0]], { because: [{ id: 'cGo6' }] });
  say(10, { shapes: ['open'], target: D });
  for (const who of [A, O, E]) I({ id: 'att' + who.slice(0, 3), actor: who, kind: 'ATTEND', target: lens, t0: q(K6.win[1] + 0.3), t1: T, label: 'looks into the lens: in the film now', because: [{ id: 'sLens' }] });
  hold(D, q(K6.win[1] + 0.1), q(c(11).at - 0.3), 'the camera on him for once', [[lens, 2.0], [A, 1.0]], { because: [{ id: 'sLens' }] });
  say(11, { shapes: ['open', 'chop'], target: lens, because: [{ id: 'say10' }] });
  hold(D, q(end(c(11)) + 0.2), T, 'action called on himself: he stands in the frame', [[lens, 3.0]], { because: [{ id: 'say11' }] });
  hold(C, q(end(c(10)) + 0.2), T, 'rolling', [[lens, 4.0]], { because: [{ id: 'say10' }] });
  return {
    type: 'revelation', title: 'The making-of, 4: the ledger; make it a film',
    actors: { [E]: { role: 'the examiner', body: 'minifig', principal: true }, [D]: { role: 'the director', body: 'minifig', principal: true }, [A]: { role: 'the agent', body: 'minifig', principal: true },
      [C]: { role: 'the cinematographer', body: 'minifig' }, [O]: { role: 'the actor', body: 'minifig' } },
    objects: { ledger: { kind: 'book', material: 'paper', at: book, affords: ['read'] }, farm: { kind: 'machine', material: 'plastic', at: towers, affords: ['render'] }, camera: { kind: 'camera', material: 'plastic', at: lens, affords: ['shoot'] } },
    authored: { intents: G.intents, holds: G.holds, stimuli: G.stimuli, goals: { [E]: 'the record as it is', [D]: 'a film, not a slide show', [A]: 'answer for the work', [C]: 'the shot' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [E]: [{ a: 'read the ledger', base: 1.2, f: { 'after:sTurn': -2.4 } }, { a: 'go to the evidence', base: -2.0, f: { 'after:sTurn': 3.0 } }, { a: 'name the gap', base: -2.6, f: { 'after:say4': 3.6 } }],
        [D]: [{ a: 'hear the record', base: 1.0, f: { 'after:sGap': -1.6 } }, { a: 'answer the gap', base: -2.0, f: { 'after:sGap': 3.0 } }, { a: 'ask for a film', base: -2.6, f: { 'after:say6': 3.4 } }],
        [C]: [{ a: 'listen', base: 1.0, f: { 'after:sUs': -3.0 } }, { a: 'turn the camera on the crew', base: -2.4, f: { 'after:sUs': 4.4 } }],
      } },
      camera: { follow: true },
    },
  };
};
