/* Hearts of Plastic, episode 2: The Hall (OD-B26-S02, on the set of OD-B17-S05, the megaron; tools/making/hop_script.py).
   Casting: the two beggars walk in from the threshold to their marks (the take's walk, owned, caused by the AD's call) and stand side
   by side, the same minifigure part for part (OD-B18-S02's card); nobody can say which is Irus. Then the stool: Antinous, the stool
   in his hand, asks which beggar; on "Action." he throws it as take two had it (THROW, a third of a second in the air), it hits the
   beggar and drops; the crew watch take two on the monitor; the experiment is read out; on the slate and "Action." he throws again,
   six tenths of a second with smear bricks on two drawings (THROW params.flight and params.smear: choreo.js applyFlights), the
   beggar takes it standing (IMPACT, "like a rock"), the crew watch take three. Every movement has a cause: a line, the clap, a key's
   walk owned by the line before it, the stool's hit. */
'use strict';
const fs = require('fs'), path = require('path'), Ground = require('../ground.js');
module.exports = function author(M, X) {
  const D = 'director', F = 'firstad', C = 'cinematographer', B = 'odysseus-as-beggar', IR = 'irus', AN = 'antinous';
  const hop = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../odyssey/take/making/OD-B26-S02.json'), 'utf8')).hop;
  const camAt = [-120, 70, 120], table = [-205, 50, -60];
  const G_ = require('./_making2.js')(M, X, { present: [D, F, C, B, IR, AN], speaker: camAt,
    shapes: { 6: ['chop'], 14: ['chop'], 22: ['chop'], 26: ['open'], 23: ['chest'], 3: ['chest'], 4: ['chest'], 11: ['open'], 13: ['open'], 27: ['open'] },
    walkLabel: { K1a: { [B]: 'in from the threshold to his mark', [IR]: 'in from the threshold to his mark, beside the other beggar' } } });
  const { q, T, K, clip, end, hold, I, St, intents } = G_, c = clip;
  /* the slates */
  hop.clap.forEach((t, j) => { const slate = M.clips.filter(x => x.voice === F && x.at < t).pop();
    I({ id: 'clap' + j, actor: F, kind: 'GESTURE', target: camAt, t0: q(t - 0.5), t1: q(t + 0.5), label: 'the clapperboard, in front of the lens', params: { shape: 'chop', at: q(t - 0.05), side: 'L', amp: 1.0, hold: 0.3 }, because: slate ? [{ id: 'say' + slate.gi }] : [] });
    St({ id: 'sClap' + j, t0: q(t), t1: q(t + 0.3), kind: 'SOUND', label: 'the clap', actor: F, because: [{ id: 'clap' + j }] }); });
  /* the dailies */
  hop.dailies.forEach((d, j) => { const cause = M.clips.filter(x => x.at < d.start).pop();
    St({ id: 'sDaily' + j, t0: q(d.start), t1: q(d.start + 0.5), kind: 'SIGHT', label: 'the dailies on the monitor', because: cause ? [{ id: 'say' + cause.gi }] : [] });
    for (const a of [D, F, C]) hold(a, q(d.start + 0.1), q(d.start + d.dur), 'watching the take on the monitor', [[camAt, d.dur]], { id: 'hD' + j + a.slice(0, 3), because: [{ id: 'sDaily' + j }] }); });
  /* the throws: take two as it was (a third of a second), take three (six tenths, the smear bricks) */
  const b3 = hop.beats.find(b => b.key === 'K3'), b4 = hop.beats.find(b => b.key === 'K4');
  const down = (dx, dz) => { const x = -80 + dx, z = 0 + dz; return [x, Ground.at(M, x, z).y + 4, z]; };   /* from the beggar's mark (hop_keys.py BG) */
  const throwAt = (id, b, FL, extra, cause, until) => {
    const tT = q(b.start + 0.15), tHit = q(tT + 0.62 + FL);
    I({ id, actor: AN, kind: 'THROW', target: B, t0: tT, t1: q(tT + 1.6), label: 'throws the footstool at the beggar', because: [{ id: cause }],
      params: Object.assign({ side: 'R', releaseId: id + 'R', prop: 'stool', to: B, off: [0, -9, 0], flight: FL, arc: 9 + 10 * (FL - 0.33), spin: 0.6, fall: [{ dt: 0.45, to: down(-30, -25), arc: 5, spin: 0.35 }], until }, extra) });
    St({ id: id + 'Hit', t0: tHit, t1: q(tHit + 0.3), kind: 'SOUND', label: 'the stool on the beggar\'s shoulder', actor: B, because: [{ id: id + 'R', latency: FL }] });
    I({ id: id + 'Rock', actor: B, kind: 'IMPACT', t0: q(tHit + 0.04), t1: q(tHit + 0.9), label: 'he stands like a rock', params: { until: q(tHit + 0.8) }, because: [{ id: id + 'Hit', latency: 0.04 }] });
    I({ id: id + 'Irus', actor: IR, kind: 'REACT', t0: q(tHit + 0.2), t1: q(tHit + 1.3), label: 'the stool beside him: not him, this time', params: { how: 'startle', lookAt: B }, because: [{ id: id + 'Hit', latency: 0.2 }] });
    for (const a of [D, C, F]) I({ id: id + a.slice(0, 3), actor: a, kind: 'REACT', t0: q(tHit + 0.25), t1: q(tHit + 1.2), label: 'watches it land', params: { how: 'turn', lookAt: B }, because: [{ id: id + 'Hit', latency: 0.25 }] });
    return tHit; };
  throwAt('th2', b3, 0.33, {}, 'say14', K('K4').t);
  throwAt('th3', b4, 0.6, { smear: { prop: 'stoolSmear', frames: [2, 3], span: 2 } }, 'say22', K('K5').t);
  hold(AN, q(K('K3').t + 0.2), q(b3.start + 0.1), 'the stool in his hand: which beggar?', [[B, 2.0], [IR, 2.0], [F, 1.0]], { id: 'hAn3', because: [] });
  hold(AN, q(end(c(21)) + 0.2), q(b4.start + 0.1), 'take three: the stool in his hand again, the beggar\'s back before him', [[B, 3.0]], { id: 'hAn4', because: [{ id: 'say21' }] });
  hold(B, q(end(c(4)) + 0.3), q(c(23).at - 0.3), 'on his mark, as still as the engine asks: nothing has given him a reason to move', [[camAt, 3.0], [IR, 1.2]], { id: 'hBwait', because: [{ id: 'say4' }] });
  hold(IR, q(end(c(3)) + 0.3), q(c(27).at - 0.3), 'on his mark beside the other beggar, the same in every part', [[camAt, 2.4], [B, 1.4]], { id: 'hIwait', because: [{ id: 'say3' }] });
  return {
    type: 'dialogue', title: 'Hearts of Plastic, 2: the Hall',
    actors: { [D]: { role: 'the director', body: 'minifig', principal: true }, [F]: { role: 'the first AD', body: 'minifig', principal: true }, [C]: { role: 'the cinematographer', body: 'minifig', principal: true },
      [B]: { role: 'Odysseus as the beggar', body: 'minifig', principal: true }, [IR]: { role: 'Irus, the other beggar', body: 'minifig', principal: true }, [AN]: { role: 'Antinous', body: 'minifig', principal: true } },
    objects: { stool: { kind: 'stool', material: 'wood', holder: AN + ':R', affords: ['throw'] }, camera: { kind: 'camera', material: 'plastic', at: camAt, affords: ['look'] }, table: { kind: 'table', material: 'wood', at: table, affords: ['sit'] } },
    authored: { intents, holds: G_.holds, stimuli: G_.stimuli, goals: { [D]: 'a throw he can see', [F]: 'every take slated', [C]: 'the stool in the air, in the frame', [B]: 'to stand like a rock', [IR]: 'to be told apart', [AN]: 'to know which beggar' },
      couplings: [], causal: { tau: 0.7, actions: { [AN]: [{ a: 'wait with the stool', base: 1.0, f: { 'after:say14': -3.0, 'after:say22': -3.0 } }, { a: 'throw', base: -2.0, f: { 'after:say14': 4.0, 'after:say22': 4.0 } }] } },
      camera: { follow: true } },
  };
};
