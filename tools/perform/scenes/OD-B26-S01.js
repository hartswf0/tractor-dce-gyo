/* Hearts of Plastic, episode 1: The Cave (OD-B26-S01, on the set of OD-B09-S06; odyssey/writers-room/BIBLE.md, tools/making/hop_script.py).
   The crew on the Cyclops's real set: the Director in his chair, the First AD with the clapperboard, the Cinematographer at the camera
   on its tripod, whose lens is buried in a ram's flank. Each experiment is a take: the AD slates it (a chop of the clapper on the clap,
   every head to the sound), the Director calls it in one word, the crew watch the dailies (a HOLD on the camera, the real take cut in
   over the picture by tools/making/hop_film.py), and the result is said.
   The ram in the lens is freed by the rule ("no lens inside an animal") and walks off to the pen; the giant at his mark answers his
   close-up in his own voice (a creature TALK) and asks to be shot from below; then he crosses to the great stone (a WALK caused by the
   AD's slate), reaches, and the stone is in the door after a cut (a MOVE_STONE of 0.6 s, the shot on the Director while it happens:
   take one as it was); "Back to one" slides it back while the AD speaks; take two carries it in, seen (MOVE_STONE over four seconds).
   Then the giant goes to the pen to milk (WALK, CARESS), lit, the background black. Every movement has a cause: a line, the clap, a
   key's walk owned by the line before it, or another body's act. */
'use strict';
const fs = require('fs'), path = require('path');
const Ic = require('../intents-creature.js'), Ground = require('../ground.js');
module.exports = function author(M, X) {
  const D = 'director', F = 'firstad', C = 'cinematographer', O = 'odysseus', G = 'polyphemus';
  const hop = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../odyssey/take/making/OD-B26-S01.json'), 'utf8')).hop;
  const camAt = [0, 70, 125], door = [-10, 60, 215], side = [100, 60, 175], G0 = [-30, -150], GS = [40, 135], RAM = [0, 60];
  const G_ = require('./_making2.js')(M, X, { present: [D, F, C, O], speaker: camAt, talk: [G],
    shapes: { 1: ['chop'], 6: ['dismiss'], 23: ['chop'], 32: ['chop'], 33: ['open'], 36: ['open'], 27: ['chest'], 29: ['chest'] },
    walkTo: {}, walkLabel: {} });
  const { q, T, K, clip, end, hold, I, St, intents } = G_, c = clip, sc = M.scale || 1, fl = (x, z) => Ground.at(M, x, z).y;
  const W = id => K(id).win || [K(id).t, K(id).t + 0.6];
  /* the creatures: the giant at his mark, three rams (the first with the camera in its flank) */
  const gs = 1.4 * sc, pl = (x, z, h) => Ic.placeAt('polyphemus', gs, 'stand', { center: [x, z], y: fl(x, z), h });
  const g0 = pl(G0[0], G0[1], 0), gS = pl(GS[0], GS[1], 0), gP = pl(40, 0, 2.2);
  const creatures = { [G]: { kind: 'polyphemus', scale: gs, at: g0.at, floor: g0.floor, present: [[0, T + 1]], procs: [], channels: {} } };
  const rams = { ram1: [RAM[0], RAM[1], Math.PI / 2, 'white'], ram2: [110, -60, 0.6, 'white'], ram3: [150, -105, 1.2, 'black'] };
  for (const [r, [x, z, h, col]] of Object.entries(rams)) { const y = fl(x, z); creatures[r] = { kind: 'ram', scale: 1.5 * sc, colour: col, at: [x, y, z, h], floor: y, present: [[0, T + 1]], procs: [], channels: {} }; }
  const gi = o => I(Object.assign({ actor: G }, o));
  /* ── the slates: the clapper chopped on the clap (the AD's act, caused by her own slate line), a SOUND every head turns to ── */
  const claps = hop.clap.map(t => q(t));
  claps.forEach((t, j) => {
    const slate = M.clips.filter(x => x.voice === F && x.at < t).pop();
    I({ id: 'clap' + j, actor: F, kind: 'GESTURE', target: camAt, t0: q(t - 0.5), t1: q(t + 0.5), label: 'the clapperboard, in front of the lens', params: { shape: 'chop', at: q(t - 0.05), side: 'L', amp: 1.0, hold: 0.3 }, because: slate ? [{ id: 'say' + slate.gi }] : [] });
    St({ id: 'sClap' + j, t0: t, t1: q(t + 0.3), kind: 'SOUND', label: 'the clap', actor: F, because: [{ id: 'clap' + j }] });
  });
  /* ── the dailies: the crew turn to the camera's monitor while a real take plays ── */
  hop.dailies.forEach((d, j) => {
    const cause = M.clips.filter(x => x.at < d.start).pop();
    St({ id: 'sDaily' + j, t0: q(d.start), t1: q(d.start + 0.5), kind: 'SIGHT', label: 'the dailies on the monitor: ' + d.caption.slice(10, 70), because: cause ? [{ id: 'say' + cause.gi }] : [] });
    for (const a of [D, F, C]) hold(a, q(d.start + 0.1), q(d.start + d.dur), 'watching the take on the monitor', [[camAt, d.dur]], { id: 'hD' + j + a.slice(0, 3), because: [{ id: 'sDaily' + j }] });
  });
  /* ── K1-K2: the camera in the ram ── */
  hold(C, 0.2, q(c(3).at - 0.3), 'at the eyepiece: rolling, the lens deep in the wool', [[[RAM[0], 40, RAM[1]], 6]], { id: 'hCeye', because: [] });
  for (const r of ['ram1', 'ram2', 'ram3']) I({ id: 'graze' + r, actor: r, kind: 'GRAZE', t0: 0.3, t1: r === 'ram1' ? q(c(9).at + 1.2) : T, label: 'grazing', because: [] });
  St({ id: 'sFree', t0: q(end(c(9))), t1: q(end(c(9)) + 0.4), kind: 'SIGHT', label: '"or a face": the camera pulled out of the wool', actor: C, because: [{ id: 'say9' }] });
  const tR0 = q(end(c(9)) + 0.6), tR1 = q(tR0 + 4.0);
  I({ id: 'ramOut', actor: 'ram1', kind: 'WALK', t0: tR0, t1: tR1, label: 'freed of the lens, the ram goes back to the pen', params: { path: [[tR0, RAM[0], RAM[1]], [q(tR0 + 2), 50, 50], [tR1, 100, 30]], gait: 'walk' }, because: [{ id: 'sFree' }] });
  I({ id: 'ramGraze', actor: 'ram1', kind: 'GRAZE', t0: q(tR1 + 0.3), t1: T, label: 'in the pen', because: [{ id: 'ramOut' }] });
  /* ── K4: the giant's close-up; he looks at whoever speaks to him ── */
  gi({ id: 'gWait', kind: 'ATTEND', t0: 0.3, t1: q(c(15).at - 0.2), target: C, label: 'at his mark, waiting for his close-up', because: [] });
  gi({ id: 'gHearAD', kind: 'ATTEND', t0: q(c(15).at + 0.2), t1: q(c(19).at - 0.2), target: F, label: '"your close-up": to the AD', because: [{ id: 'say15' }] });
  gi({ id: 'gHearD', kind: 'ATTEND', t0: q(c(20).at + 0.2), t1: q(end(c(21)) + 0.4), target: D, label: '"half your face is in shadow": to the Director', because: [{ id: 'say20' }] });
  /* ── K5: to the stone; take one: the stone is in the door after a cut ── */
  const tW0 = q(end(c(22)) + 0.2), tW1 = q(tW0 + 4.2);
  gi({ id: 'gToStone', kind: 'WALK', t0: q(end(c(21)) + 1.0), t1: q(c(22).at + 1.6), label: 'off his mark, to the great stone', params: { path: [[q(end(c(21)) + 1.0), g0.at[0], g0.at[2]], [q(end(c(21)) + 3.0), 35, -100], [q(c(22).at + 0.2), 35, 60], [q(c(22).at + 1.6), gS.at[0], gS.at[2]]], y: gS.at[1] }, because: [{ id: 'say21' }] });
  const b5 = hop.beats.find(b => b.key === 'K5'), b6 = hop.beats.find(b => b.key === 'K6');
  gi({ id: 'gReach1', kind: 'REACH', t0: q(b5.start), t1: q(b5.start + 1.4), target: side, label: 'take one: he reaches for the stone', params: { hand: 'R' }, because: [{ id: 'say23' }] });
  gi({ id: 'gPop', kind: 'MOVE_STONE', t0: q(b5.start + 1.1), t1: q(b5.start + 2.7), target: side, label: 'take one: the stone in the door, not seen to move (as take one was)', params: { to: [door[0], door[2]], object: 'door-stone', piece: 'the great stone', lift: 0 }, because: [{ id: 'gReach1' }] });
  St({ id: 'sIn', t0: q(b5.start + 2.8), t1: q(b5.start + 3.2), kind: 'SIGHT', label: 'the stone is in the door', because: [{ id: 'gPop' }] });
  gi({ id: 'gBack', kind: 'MOVE_STONE', t0: q(c(30).at), t1: q(c(30).at + 1.8), target: door, label: '"back to one": the stone back beside the door', params: { to: [side[0], side[2]], home: [door[0], door[2]], object: 'door-stone', piece: 'the great stone', lift: 0 }, because: [{ id: 'say30' }] });
  gi({ id: 'gCarry', kind: 'MOVE_STONE', t0: q(b6.start - 0.2), t1: q(b6.start + b6.dur), target: side, label: 'take two: he carries it into the door', params: { to: [door[0], door[2]], object: 'door-stone', piece: 'the great stone', lift: 8 }, because: [{ id: 'say32' }] });
  St({ id: 'sCarried', t0: q(b6.start + b6.dur - 0.3), t1: q(b6.start + b6.dur + 0.2), kind: 'SIGHT', label: 'the stone set in the door, carried', because: [{ id: 'gCarry' }] });
  /* ── K7: the milking ── */
  const tM0 = q(end(c(33)) + 0.4), tM1 = q(tM0 + 3.6);
  gi({ id: 'gToPen', kind: 'WALK', t0: tM0, t1: tM1, label: 'to the pen, to milk', params: { path: [[tM0, gS.at[0], gS.at[2]], [q(tM0 + 1.8), 35, 70], [tM1, gP.at[0], gP.at[2]]], y: gP.at[1] }, because: [{ id: 'say33' }] });
  gi({ id: 'gTurnPen', kind: 'TURN', t0: q(tM1), t1: q(tM1 + 0.8), target: 'ram1', label: 'to the ewe', params: { h: 2.2 }, because: [{ id: 'gToPen' }] });
  gi({ id: 'gMilk', kind: 'CARESS', t0: q(tM1 + 0.9), t1: q(T - 0.3), target: 'ram1', label: 'milks the ewe, in the light they made for it', params: { strokes: 4 }, because: [{ id: 'gTurnPen' }] });
  /* the director in his chair watches the takes; Odysseus waits for his cue, and is still when nothing is asked of him */
  hold(D, q(end(c(1)) + 0.1), q(c(2).at - 0.2), 'action called: he watches the take', [[[RAM[0], 40, RAM[1]], 2.0]], { id: 'hDwatch1', because: [{ id: 'say1' }] });
  hold(D, q(end(c(23)) + 0.1), q(c(24).at - 0.2), 'take one rolling: on the giant', [[G, 3.0]], { id: 'hDwatch5', because: [{ id: 'say23' }] });
  hold(D, q(end(c(32)) + 0.1), q(c(33).at - 0.2), 'take two rolling: the stone', [[side, 1.6], [door, 3.4]], { id: 'hDwatch6', because: [{ id: 'say32' }] });
  hold(O, 0.2, q(c(26).at - 0.2), 'waits for his cue, as the engine asks: nothing has given him a reason to move', [[C, 3.0], [G, 2.0]], { id: 'hOwait', because: [] });
  hold(O, q(end(c(29)) + 0.3), T, 'his one line said: he waits again', [[D, 2.0], [G, 2.0]], { id: 'hOafter', because: [{ id: 'say29' }] });
  return {
    type: 'dialogue', title: 'Hearts of Plastic, 1: the Cave',
    actors: { [D]: { role: 'the director', body: 'minifig', principal: true }, [F]: { role: 'the first AD', body: 'minifig', principal: true },
      [C]: { role: 'the cinematographer', body: 'minifig', principal: true }, [O]: { role: 'Odysseus, a method actor', body: 'minifig' }, [G]: { role: 'Polyphemus (the rig)', body: 'prop', principal: true } },
    objects: { [G]: { kind: 'giant', material: 'flesh', at: [gS.at[0], 120 * sc, gS.at[2]], affords: ['act'] }, camera: { kind: 'camera', material: 'plastic', at: camAt, affords: ['look'] },
      'door-stone': { kind: 'door', material: 'stone', at: side, exit: true, affords: ['seal the cave'] } },
    authored: { intents, holds: G_.holds, stimuli: G_.stimuli, creatures, goals: { [D]: 'the take he can print', [F]: 'every take slated, the day on schedule', [C]: 'the hottest thing in the frame', [O]: 'a reason to move', [G]: 'his close-up, from below' },
      couplings: [{ from: G, to: 'door-stone', via: 'stone', t0: q(b6.start - 0.2), t1: q(b6.start + b6.dur) }],
      causal: { tau: 0.7, actions: { [O]: [{ a: 'wait for a cue', base: 1.2, f: { 'after:say26': -2.0 } }, { a: 'answer', base: -2.0, f: { 'after:say26': 3.0 } }] } },
      camera: { follow: true } },
  };
};
