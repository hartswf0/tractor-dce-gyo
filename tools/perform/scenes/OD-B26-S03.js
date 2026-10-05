/* Hearts of Plastic, episode 3: The Underworld (OD-B26-S03, on the set of OD-B11-S04, the shore of the dead; tools/making/hop_script.py).
   Three embraces, each slated: on the call Odysseus springs to his mother with his arms out (the take's walk into the embrace key,
   owned, caused by the call or the slate) and they close through her (she is a shade: the take's spec.shades; the keys allow the
   touch); he steps back; she, patient, says so. The crew watch take one, where she was drawn solid. Then Achilles, called, comes up
   the shore in the visored gladiator helmet he insists on (the walk caused by "you're on"); the cinematographer cannot find his
   face; he has no lines; the crew watch the answer they made for him, in a voice the actor beside him recognises as his own (REACT:
   Odysseus turns to the monitor, then to Achilles). Every movement has a cause. */
'use strict';
module.exports = function author(M, X) {
  const D = 'director', F = 'firstad', C = 'cinematographer', O = 'odysseus', A = 'anticleia', H = 'achilles', sid = 'OD-B26-S03';
  const camAt = [-30, 70, 240];
  const G_ = require('./_making2.js')(M, X, { present: [D, F, C, O, A, H], speaker: camAt,
    shapes: { 1: ['chop'], 3: ['chop'], 17: ['chop'], 26: ['open'], 19: ['chest'], 21: ['chest', 'fist'], 25: ['chest'], 23: ['chest'], 2: ['open'], 13: ['open'], 15: ['open'] },
    walkLabel: { K2: { [O]: 'springs to hold his mother' }, K3: { [O]: 'springs to hold her again' }, K4: { [O]: 'the third time he springs to her' },
      K2s: { [O]: 'steps back: his arms closed on nothing' }, K3s: { [O]: 'steps back' }, K4s: { [O]: 'steps back' }, K5a: { [H]: 'up the shore in his helmet, to the AD' } },
    walkTo: { K2: { [O]: A }, K3: { [O]: A }, K4: { [O]: A }, K2s: { [O]: A }, K3s: { [O]: A }, K4s: { [O]: A }, K5a: { [H]: F } } });
  const { q, T, K, clip, end, hold, I, St, intents } = G_, c = clip;
  const hop = require('./_hop.js')(sid, M, G_, { camAt, watchers: [D, F, C, O, A] });
  /* the embraces: his arms through her (a SIGHT each), her patience */
  ['K2', 'K3', 'K4'].forEach((k, j) => { const t = K(k).t;
    St({ id: 'sThrough' + j, t0: q(t - 0.2), t1: q(t + 0.3), kind: 'SIGHT', label: 'his arms pass through her', actor: O, because: [{ id: 'go' + k + 'ody' }] });
    hold(A, q(t - 0.1), q(t + 1.0), 'his arms are through her: she feels nothing of them, and waits', [[O, 1.2]], { id: 'hAemb' + j, weight: false, because: [{ id: 'sThrough' + j }] }); });
  hold(A, q(K('K4s').t + 1.0), q(c(14).at), 'she waits by the pit, patient: she has eternity', [[O, 3.0], [D, 1.5]], { id: 'hApat', weight: false, because: [{ id: 'say10' }] });
  /* Achilles: off up the shore until he is called; the helmet stays on */
  hold(H, 0.2, q(K('K5a').win ? K('K5a').win[0] : c(14).at + 1.0), 'up the shore in the visored helmet, waiting to be called', [[camAt, 4.0], [A, 2.0]], { id: 'hHwait', because: [] });
  /* "That's my voice": Odysseus turns from the monitor to Achilles */
  const dl = hop.dailies[1];
  I({ id: 'oVoice', actor: O, kind: 'REACT', t0: q(dl.start + 0.8), t1: q(dl.start + 2.0), label: 'he hears his own voice on the monitor', params: { how: 'turn', lookAt: H }, because: [{ id: 'sDaily1' }] });
  return {
    type: 'dialogue', title: 'Hearts of Plastic, 3: the Underworld',
    actors: { [D]: { role: 'the director', body: 'minifig', principal: true }, [F]: { role: 'the first AD', body: 'minifig', principal: true }, [C]: { role: 'the cinematographer', body: 'minifig', principal: true },
      [O]: { role: 'Odysseus', body: 'minifig', principal: true }, [A]: { role: 'Anticleia, a shade', body: 'minifig', principal: true }, [H]: { role: 'Achilles, a shade in a helmet', body: 'minifig', principal: true } },
    objects: { camera: { kind: 'camera', material: 'plastic', at: camAt, affords: ['look'] } },
    authored: { intents, holds: G_.holds, stimuli: G_.stimuli, goals: { [D]: 'three embraces, a face', [F]: 'every take slated', [C]: 'a face he can find', [O]: 'to hold his mother', [A]: 'to be patient', [H]: 'the helmet' },
      couplings: [], causal: { tau: 0.7, actions: { [O]: [{ a: 'wait', base: 1.0, f: { 'after:say1': -3.0 } }, { a: 'embrace', base: -2.0, f: { 'after:say1': 4.0 } }] } },
      camera: { follow: true } },
  };
};
