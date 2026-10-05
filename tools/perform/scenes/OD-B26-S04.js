/* Hearts of Plastic, episode 4: The Sea (OD-B26-S04, on the set of OD-B12-S03, the Sirens' black ship at anchor; tools/making/hop_script.py).
   The rowers pull on one clock (the ROWING machinery of OD-B12-S03: period 2.6 s, each man's offset a fraction of the stroke), started
   by the call and shipped on "Print it"; a rower stops his stroke to say how late he is (his strokes are busy while he speaks); the
   helmsman steers the whole time; a Siren on the shore says her clock is her own. Then Calypso, a guest on the deck for her scene: on
   the call Odysseus steps in between her and the lens (the take's walk to K2a, caused by "Action."), and her trees are said behind
   the back of his head; the crew watch take one of the Raft; "Apart.", and he steps aside a man's height (the walk to K3, caused by
   the AD's translation); she says her trees again, seen. Every movement has a cause. */
'use strict';
module.exports = function author(M, X) {
  const D = 'director', F = 'firstad', C = 'cinematographer', O = 'odysseus', CA = 'calypso', sid = 'OD-B26-S04';
  const crew = [1, 2, 3, 4, 5].map(k => 'crew-at-the-oars-' + k), S2 = 'the-sirens-2', S4 = 'the-sirens-4', camAt = [-17, 120, 185];
  const G_ = require('./_making2.js')(M, X, { present: [D, F, C, O, CA, ...crew, S2, S4], speaker: camAt,
    shapes: { 1: ['chop'], 13: ['chop'], 20: ['chop'], 8: ['open'], 24: ['open'], 17: ['chest'], 14: ['open', 'describe'], 22: ['open', 'describe'], 19: ['chest'], 7: ['open'] },
    walkLabel: { K2a: { [O]: 'steps in beside her: in front of her, to the lens' }, K3: { [O]: 'a man\'s height from her' } }, walkTo: { K2a: { [O]: CA }, K3: { [O]: CA } } });
  const { q, T, K, clip, end, hold, I, St, intents } = G_, c = clip;
  const hop = require('./_hop.js')(sid, M, G_, { camAt, watchers: [D, F, C] });
  /* the rowing: one clock from the call to "Print it"; each man's strokes stop while he speaks */
  const r0 = q(end(c(1)) + 0.2), r1 = q(c(8).at + 0.4), spk = gi => [q(c(gi).at - 0.4), q(end(c(gi)) + 0.3)];
  const busy = { 'crew-at-the-oars-2': [spk(4)], 'crew-at-the-oars-3': [spk(5)] };
  const machinery = [{ kind: 'ROWING', id: 'clock:row', clock: { period: 2.6, t0: r0, t1: r1 }, offsets: { 'crew-at-the-oars-1': 0.0, 'crew-at-the-oars-2': 0.04, 'crew-at-the-oars-3': -0.03, 'crew-at-the-oars-4': 0.02 }, amp: 1, busy }];
  I({ id: 'iSteer', actor: crew[4], kind: 'STEER', t0: 0.5, t1: q(c(6).at - 0.3), label: 'at the steering oar', because: [] });
  I({ id: 'iSteer2', actor: crew[4], kind: 'STEER', t0: q(end(c(6)) + 0.3), t1: T, label: 'back to the steering oar', because: [{ id: 'say6' }] });
  crew.slice(0, 4).forEach((r, k) => { hold(r, 0.3, q(r0 - 0.1), 'at the oar, waiting for the call', [[F, 1.6], [camAt, 2.0]], { id: 'hR0' + k, weight: false, because: [] });
    hold(r, q(r1 + 1.0), T, 'oars shipped: the ears full of wax, the scene going on without them', [[CA, 2.4], [S4, 2.0]], { id: 'hR1' + k, weight: false, because: [{ id: 'say8' }] }); });
  for (const s of [S2, S4]) hold(s, 0.3, T, 'on the shore, singing on her own clock', [[O, 3.0], [crew[1], 1.5]], { id: 'hS' + s.slice(-1), weight: false, because: [] });
  hold(CA, 0.3, q(c(12).at), 'a guest on the deck, waiting for her scene', [[O, 2.0], [crew[0], 2.0]], { id: 'hCwait', because: [] });
  hold(O, q(K('K2a').t + 0.2), q(c(17).at - 0.2), 'beside her, as the slate said: his back to her, his face to the lens', [[camAt, 3.0]], { id: 'hOlead', because: [{ id: 'goK2aody' }] });
  return {
    type: 'machinery', title: 'Hearts of Plastic, 4: the Sea',
    actors: Object.assign({ [D]: { role: 'the director', body: 'minifig', principal: true }, [F]: { role: 'the first AD', body: 'minifig', principal: true }, [C]: { role: 'the cinematographer', body: 'minifig', principal: true },
      [O]: { role: 'Odysseus, the lead', body: 'minifig', principal: true }, [CA]: { role: 'Calypso, a guest', body: 'minifig', principal: true }, [S2]: { role: 'a Siren', body: 'minifig' }, [S4]: { role: 'a Siren', body: 'minifig' } },
      Object.fromEntries(crew.map((r, k) => [r, { role: k === 4 ? 'the helmsman' : 'a rower', body: 'minifig', group: 'crew' }]))),
    objects: { ship: { kind: 'ship', material: 'ship', at: [-17, 60, 110], affords: ['row', 'steer'] }, camera: { kind: 'camera', material: 'plastic', at: camAt, affords: ['look'] } },
    authored: { intents, holds: G_.holds, stimuli: G_.stimuli, machinery, goals: { [D]: 'her face', [F]: 'every take slated, the top of the hour', [C]: 'a face with nothing before it', [O]: 'the lead', [CA]: 'her trees, seen' },
      couplings: crew.slice(0, 4).map(r => ({ from: r, to: 'ship', via: 'water', t0: r0, env: true })),
      causal: { tau: 0.7, actions: { [O]: [{ a: 'stand where the slate said', base: 1.0, f: { 'after:say21': -3.0 } }, { a: 'step apart', base: -2.0, f: { 'after:say21': 4.0 } }] } },
      camera: { follow: true } },
  };
};
