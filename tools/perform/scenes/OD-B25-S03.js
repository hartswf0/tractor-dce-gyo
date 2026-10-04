/* The making-of, 3: The Wall and the Takes (OD-B25-S03, the LEGO film studio).
   The agent is pushing the player bundle (a block of yellow bricks: every set, figure and brick of geometry in one file) against the
   95 MB wall; it does not go through the gate (STRAIN, the push against what will not move). The director's question stops it (a
   REACT turn); it says what the block is and, when the cinematographer asks about the wall (pointing at the 95), what the wall is.
   Then it splits the block (TOOL_WORK chop: two strokes, and the block is a heap of small bricks: the key's swap), takes one, carries
   it through the gate (the take's walk) and says where the geometry goes now; it sets the brick down on the stack beyond the wall
   (SET_DOWN). Back at the shelf of reels it holds up a new take of the raft to put it over the old one; the director, back in his
   chair, rises at the sight (NOTICE, RISE: "Stop. Keep both."), crosses to the shelf, and the kept takes are on the shelf below. */
'use strict';
module.exports = function author(M, X) {
  const G = require('./_making.js')(M, X), { q, T, K, clip, end, say, hear, hold, walk, I, St } = G;
  const D = 'director', A = 'agent', C = 'cinematographer', O = 'odysseus';
  const K1b = K('K1b'), K2 = K('K2'), K3 = K('K3'), K4 = K('K4');
  const c = gi => clip(gi), V3 = X.voiceOf(c(3)), V6 = X.voiceOf(c(6)), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const s = 0.8918918918918919, P = (x, h, z) => [x * s, (h + 8) * s, (10 - z) * s];
  const bundle = P(255, 100, -180), wall95 = P(330, 190, -180), gate = P(330, 60, -180), beyond = P(375, 60, -240), shelf = P(90, 90, 290), kept = P(90, 30, 290);
  const tRefused = q(w(V3, 'refused', c(3).at + 2.6)), tOver = q(w(V6, 'over', c(6).at + c(6).dur - 1.2));
  const tSplit = K1b ? K1b.t : q(end(c(3)) + 0.8);
  /* ── the bundle at the wall ── */
  St({ id: 'sWall', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'the player bundle against the 95 MB wall: it will not go through the gate', actor: A, because: [] });
  I({ id: 'aPush', actor: A, kind: 'STRAIN', t0: 0.2, t1: q(end(c(0)) + 0.2), label: 'pushes the block at the gate: it will not go', params: {}, because: [{ id: 'sWall' }] });
  hold(D, 0.1, q(c(0).at - 0.3), 'a block of bricks taller than the gate: he comes to see', [[bundle, 2.4], [A, 1.2]], { because: [{ id: 'sWall' }] });
  hold(C, 0.1, q(c(2).at - 0.3), 'he looks from the block to the wall', [[bundle, 2.0], [wall95, 2.4], [A, 1.6]], { because: [{ id: 'sWall' }] });
  hold(O, 0, T, 'off the take, on the little set: he watches the crew at work across the studio', [[bundle, 3.0], [A, 2.0], [D, 2.6]], { because: [{ id: 'sWall' }] });
  say(0, { shapes: ['point'], target: bundle });
  I({ id: 'aStop', actor: A, kind: 'REACT', t0: q(end(c(0)) + 0.1), t1: q(c(1).at), label: 'stops pushing and turns to the question', params: { how: 'turn', lookAt: D }, because: [{ id: 'say0' }] });
  say(1, { shapes: ['show', 'describe', 'open'], maxBeats: 1, target: D, because: [{ id: 'aStop' }] });
  hear(D, 1, { id: 'dHear1' }); hear(C, 1, { id: 'cHear1', nod: false });
  say(2, { shapes: ['point'], target: wall95 });
  say(3, { shapes: ['point', 'chop', 'open'], maxBeats: 1, target: C });
  hear(C, 3, { id: 'cHear3' }); hear(D, 3, { id: 'dHear3', nod: false });
  /* ── split ── */
  St({ id: 'sRefused', t0: tRefused, t1: q(tRefused + 0.4), kind: 'WORD', label: '"a bigger player is refused"', actor: A, because: [{ id: 'say3' }] });
  I({ id: 'aDecide', actor: A, kind: 'DECIDE', t0: q(Math.min(end(c(3)) + 0.05, tSplit - 1.6)), t1: q(tSplit - 1.2), label: 'it will have to be split', because: [{ id: 'sRefused' }] });
  I({ id: 'aSplit', actor: A, kind: 'TOOL_WORK', t0: q(tSplit - 1.05), t1: q(tSplit + 0.2), target: bundle, label: 'splits the block: two strokes', params: { how: 'chop', period: 0.6, on: bundle }, because: [{ id: 'aDecide' }] });
  St({ id: 'sSplit', t0: tSplit, t1: q(tSplit + 0.4), kind: 'SIGHT', label: 'the block falls into small bricks', actor: A, because: [{ id: 'aSplit' }] });
  I({ id: 'dSee', actor: D, kind: 'NOTICE', target: bundle, t0: q(tSplit + 0.2), t1: q(tSplit + 1.6), label: 'the block in pieces', params: { gazeHold: 0.8 }, because: [{ id: 'sSplit' }] });
  I({ id: 'cSee', actor: C, kind: 'REACT', t0: q(tSplit + 0.3), t1: q(tSplit + 1.2), label: 'looks at the heap', params: { how: 'turn', lookAt: bundle }, because: [{ id: 'sSplit' }] });
  walk(A, 'K2', beyond, 'carries one small brick through the gate', [{ id: 'sSplit' }], 'aGo2');
  walk(D, 'K2', gate, 'to the gate, to watch it pass', [{ id: 'dSee' }], 'dGo2'); walk(C, 'K2', gate, 'after him', [{ id: 'cSee' }], 'cGo2');
  say(4, { shapes: ['show', 'describe', 'point'], maxBeats: 1, target: D });
  hear(D, 4, { id: 'dHear4' }); hear(C, 4, { id: 'cHear4', nod: false });
  say(5, { shapes: ['open'], target: D });
  hear(D, 5, { id: 'dHear5' });
  I({ id: 'aDown', actor: A, kind: 'SET_DOWN', t0: q(Math.min(end(c(5)) + 0.2, K3.win[0] - 1.3)), t1: q(Math.min(end(c(5)) + 1.4, K3.win[0] - 0.1)), label: 'sets the brick on the stack beyond the wall', params: { side: 'R', what: 'the small brick' }, because: [{ id: 'say5' }] });
  hold(C, q(end(c(5)) + 0.2), q(K3.win[0] - 0.1), 'it passed: he looks at the wall, then goes back to his camera', [[wall95, 1.6], [A, 1.8]], { because: [{ id: 'say5' }] });
  /* ── the takes ── */
  St({ id: 'sSolved', t0: q(end(c(5)) - 0.4), t1: q(end(c(5))), kind: 'WORD', label: '"six megabytes now": the wall is behind them', actor: A, because: [{ id: 'say5' }] });
  walk(D, 'K3', P(-40, 40, -60), 'back to his chair', [{ id: 'sSolved' }], 'dGo3');
  walk(C, 'K3', P(-210, 80, -20), 'back to the camera', [{ id: 'sSolved' }], 'cGo3');
  walk(A, 'K3', shelf, 'back through the gate to the shelf of reels, with a new take', [{ id: 'aDown' }], 'aGo3');
  hold(D, q(K3.win[1] + 0.2), q(c(6).at + 1.0), 'in his chair: the agent at the shelf', [[A, 2.4], [shelf, 1.2]], { because: [{ id: 'dGo3' }] });
  hold(C, q(K3.win[1] + 0.1), q(c(10).at - 0.5), 'at the camera: he watches the agent at the shelf', [[A, 2.6], [D, 1.4]], { because: [{ id: 'cGo3' }] });
  say(6, { shapes: ['show', 'point'], target: D });
  St({ id: 'sOver', t0: tOver, t1: q(tOver + 0.4), kind: 'WORD', label: '"over the old one": the old take about to go', actor: A, because: [{ id: 'say6' }] });
  I({ id: 'dNotice', actor: D, kind: 'NOTICE', target: A, t0: q(tOver + 0.1), t1: q(c(7).at - 0.05), label: 'over the old one?', params: { gazeHold: 0.6 }, because: [{ id: 'sOver' }] });
  I({ id: 'dRise', actor: D, kind: 'RISE', t0: q(c(7).at - 0.1), t1: q(c(7).at + 0.8), label: 'up out of the chair', because: [{ id: 'dNotice' }] });
  say(7, { shapes: ['chop', 'point'], target: A, kind: 'COMMAND', because: [{ id: 'dNotice' }] });
  I({ id: 'aFreeze', actor: A, kind: 'REACT', t0: q(c(7).at + 0.2), t1: q(c(7).at + 1.0), label: 'stops, the reel still up', params: { how: 'turn', lookAt: D }, because: [{ id: 'say7' }] });
  hold(A, q(c(7).at + 1.1), q(K4.win[0] - 0.1), 'the reel held: it waits for the director', [[D, 3.0]], { because: [{ id: 'aFreeze' }] });
  walk(D, 'K4', A, 'crosses to the shelf', [{ id: 'dRise' }], 'dGo4');
  walk(A, 'K4', D, 'turns to him, the reel lowered', [{ id: 'dGo4' }], 'aGo4');
  walk(C, 'K4', shelf, 'comes to the shelf', [{ id: 'say7' }], 'cGo4');
  say(8, { shapes: ['chest', 'point'], target: A });
  hear(A, 8, { id: 'aHear8' });
  say(9, { shapes: ['show', 'describe', 'point'], maxBeats: 1, target: D });
  hear(D, 9, { id: 'dHear9' });
  I({ id: 'cCount', actor: C, kind: 'GESTURE', target: kept, t0: q(c(10).at - 0.4), t1: q(c(10).at + 1.4), label: 'a hand along the reels: the takes kept', params: { shape: 'point', at: q(c(10).at), side: 'R', amp: 0.8, hold: 1.0 }, because: [{ id: 'say9' }] });
  say(10, { shapes: ['open'], target: D, because: [{ id: 'cCount' }] });
  hear(D, 10, { id: 'dHear10' }); hear(A, 10, { id: 'aHear10', nod: false });
  hold(D, q(end(c(10)) + 0.5), T, 'every take on the shelf, the old beside the new', [[kept, 2.4], [A, 1.4], [shelf, 2.0]], { because: [{ id: 'say10' }] });
  hold(A, q(end(c(10)) + 0.5), T, 'the shelf: nothing overwritten', [[kept, 2.0], [D, 1.6]], { because: [{ id: 'say10' }] });
  hold(C, q(end(c(10)) + 0.3), T, 'he counts them again', [[kept, 2.4], [shelf, 2.0]], { because: [{ id: 'say10' }] });
  return {
    type: 'dialogue', title: 'The making-of, 3: the 95 MB wall; keep both',
    actors: { [D]: { role: 'the director', body: 'minifig', principal: true }, [A]: { role: 'the agent', body: 'minifig', principal: true },
      [C]: { role: 'the cinematographer', body: 'minifig' }, [O]: { role: 'the actor', body: 'minifig' } },
    objects: { bundle: { kind: 'block', material: 'plastic', at: bundle, affords: ['push', 'split'] }, wall: { kind: 'wall', material: 'plastic', at: wall95, affords: ['refuse'] }, shelf: { kind: 'shelf', material: 'wood', at: shelf, affords: ['keep'] } },
    authored: { intents: G.intents, holds: G.holds, stimuli: G.stimuli, goals: { [D]: 'every take kept', [A]: 'the player through the wall', [C]: 'the takes counted' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [A]: [{ a: 'push the block', base: 1.0, f: { 'after:say0': -2.4 } }, { a: 'explain', base: -1.6, f: { 'after:say0': 2.6, 'after:sRefused': -1.6 } }, { a: 'split it', base: -2.4, f: { 'after:sRefused': 3.6, 'after:sSplit': -2.0 } }, { a: 'put the new take over the old', base: -2.6, f: { 'after:aDown': 3.0, 'after:say7': -4.0 } }],
        [D]: [{ a: 'watch', base: 1.0 }, { a: 'stop the overwrite', base: -3.0, f: { 'after:sOver': 4.6 } }],
      } },
      camera: { follow: true },
    },
  };
};
