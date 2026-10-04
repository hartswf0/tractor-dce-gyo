/* The making-of, 2: The Camera and the Night (OD-B25-S02, the LEGO film studio).
   The cinematographer has the camera hard against the ram on the little set and calls "rolling"; the director, watching the agent's
   screen, sees nothing but wool (his question is caused by the screen: a HOLD on it); the agent leans to the screen (REACT lean) and
   says what it is. The cinematographer turns from the eyepiece to them (REACT turn, the take's turn his APPROACH): he went where the
   heat was. The agent gives the rule (DECLARE: test every camera against the set), and he moves the camera off the ram and off the
   actor's shoulder (the take's walk to the camera's new place, owned) and reports a clean frame; the director takes it.
   Night (the farm's hum is the stimulus that brings Odysseus over): the director asleep in his chair, the agent at the render farm.
   Odysseus asks how many frames. The power goes (a SOUND, the dark: a SIGHT); Odysseus starts and looks round (REACT startle), the
   agent turns to the towers; the power comes back (the light: a SIGHT), and the agent says what is kept. */
'use strict';
module.exports = function author(M, X) {
  const G = require('./_making.js')(M, X), { q, T, K, clip, end, say, hear, hold, walk, I, St } = G;
  const D = 'director', A = 'agent', C = 'cinematographer', O = 'odysseus';
  const K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5'), K6 = K('K6');
  const c = gi => clip(gi), V2 = X.voiceOf(c(2)), V7 = X.voiceOf(c(7)), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const s = 0.8918918918918919, P = (x, h, z) => [x * s, (h + 8) * s, (10 - z) * s];
  const screen = P(150, 70, 60), keyboard = P(190, 64, 80), ram = P(-170, 40, 125), towers = P(295, 120, 270), lens = P(-170, 100, 72);
  const tRam = q(w(V2, 'ram', c(2).at + c(2).dur - 0.4)), tFrame = q(w(V7, 'frame', c(7).at + 4.6));
  const tDark = K5 ? K5.t : q(c(10).at - 1.9), tLight = K6 ? K6.t : q(c(12).at - 1.7);
  /* ── the camera in the wool ── */
  St({ id: 'sTake', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'a take of Odysseus and the ram, the camera on the ram', because: [] });
  St({ id: 'sWork', t0: 0.05, t1: 0.6, kind: 'SCENE', label: 'the agent at its desk; the director watching the take on its screen', actor: A, because: [] });
  hold(C, 0.1, q(c(0).at - 0.3), 'his eye to the camera, the camera to the ram', [[lens, 3.0]], { because: [{ id: 'sTake' }] });
  say(0, { shapes: ['open'], target: ram, label: 'rolling' });
  hold(C, q(end(c(0)) + 0.1), q(tRam + 0.3), 'rolling: his eye at the camera', [[lens, 4.0]], { because: [{ id: 'say0' }] });
  hold(O, 0, q(K4.win[0] - 0.2), 'on his mark beside the ram: in the shot, waiting for the cut', [[ram, 2.4], [lens, 1.2], [ram, 2.0]], { because: [{ id: 'sTake' }] });
  I({ id: 'aType', actor: A, kind: 'TOOL_WORK', t0: 0.3, t1: q(c(1).at + 0.2), target: keyboard, label: 'types', params: { how: 'carve', period: 0.55, on: keyboard }, because: [{ id: 'sWork' }] });
  hold(D, 0.1, q(c(1).at - 0.3), 'the take on the screen: he cannot make it out', [[screen, 3.0]], { because: [{ id: 'sWork' }] });
  St({ id: 'sWool', t0: 1.8, t1: 2.4, kind: 'SIGHT', label: 'the screen: white wool, nothing else', because: [{ id: 'say0' }] });
  say(1, { shapes: ['open'], target: A, because: [{ id: 'sWool' }] });
  I({ id: 'aLean', actor: A, kind: 'REACT', t0: q(end(c(1)) - 0.2), t1: q(c(2).at + 0.3), label: 'leans to the screen', params: { how: 'lean', lookAt: screen }, because: [{ id: 'say1' }] });
  say(2, { shapes: ['point'], target: D });
  hear(D, 2, { id: 'dHear2' });
  /* ── the cinematographer turns: the heat; the rule ── */
  St({ id: 'sRamW', t0: tRam, t1: q(tRam + 0.3), kind: 'WORD', label: '"inside the ram": heard across the studio', actor: A, because: [{ id: 'say2' }] });
  I({ id: 'cTurn', actor: C, kind: 'REACT', t0: q(tRam + 0.2), t1: q(tRam + 1.1), label: 'looks up from the camera toward the voice', params: { how: 'turn', lookAt: D }, because: [{ id: 'sRamW' }] });
  walk(C, 'K2', D, 'turns from the camera to face the desk', [{ id: 'cTurn' }], 'cGo2');
  walk(A, 'K2', C, 'turns to him', [{ id: 'cTurn' }], 'aGo2'); walk(D, 'K2', C, 'turns to him', [{ id: 'cTurn' }], 'dGo2');
  say(3, { shapes: ['open', 'chest'], target: A });
  hear(A, 3, { id: 'aHear3' }); hear(D, 3, { id: 'dHear3', nod: false });
  say(4, { shapes: ['point', 'describe', 'open', 'show'], maxBeats: 1, target: C });
  hear(C, 4, { id: 'cHear4' });
  hold(D, q(c(4).at + 0.2), q(K3.win[0] - 0.1), 'the rule is the agent\'s to give: he looks from it to the cinematographer', [[A, 2.2], [C, 1.8]], { because: [{ id: 'say4' }] });
  /* ── the clean shot ── */
  walk(C, 'K3', O, 'moves the camera off the ram and off the actor\'s shoulder', [{ id: 'say4' }], 'cGo3');
  walk(D, 'K3', C, 'comes over to see the new frame', [{ id: 'say4' }], 'dGo3'); walk(A, 'K3', C, 'comes with him', [{ id: 'dGo3' }], 'aGo3');
  I({ id: 'cCheck', actor: C, kind: 'GESTURE', target: P(-110, 100, 5), t0: q(K3.win[1] + 0.1), t1: q(c(5).at - 0.1), label: 'his hand on the camera: the lens checked against the set', params: { shape: 'reach', at: q(K3.win[1] + 0.4), side: 'R', amp: 0.8, hold: 0.8 }, because: [{ id: 'cGo3' }] });
  say(5, { shapes: ['show', 'open'], target: D, because: [{ id: 'cCheck' }] });
  hear(D, 5, { id: 'dHear5' }); hear(A, 5, { id: 'aHear5', nod: false });
  say(6, { shapes: ['point'], target: C, kind: 'COMMAND' });
  hold(C, q(end(c(5)) + 0.1), q(K4.win[0] - 0.1), 'the take on: his eye to the camera', [[O, 3.0]], { because: [{ id: 'say6' }] });
  hold(A, q(end(c(5)) + 0.4), q(K4.win[0] - 0.1), 'the shot is clean: it watches the take', [[O, 2.4], [D, 1.2]], { because: [{ id: 'say5' }] });
  /* ── night ── */
  St({ id: 'sNight', t0: q(K4.win[0] - 0.4), t1: q(K4.win[0]), kind: 'SCENE', label: 'night: the studio dark, the render farm running', because: [{ id: 'say6' }] });
  St({ id: 'sHum', t0: q(K4.win[0] - 0.2), t1: q(K4.win[0] + 0.6), kind: 'SOUND', label: 'the render farm\'s hum and fans', actor: A, because: [{ id: 'sNight' }] });
  walk(D, 'K4', P(-230, 60, 160), 'back to his chair: the day is done', [{ id: 'sNight' }], 'dGo4');
  walk(A, 'K4', towers, 'to the render farm, to watch the frames', [{ id: 'sNight' }], 'aGo4');
  walk(O, 'K4', A, 'off the set, toward the hum', [{ id: 'sHum' }], 'oGo4');
  hold(D, q(K4.win[1] + 0.2), T, 'asleep in his chair', [], { weight: true, because: [{ id: 'dGo4' }] });
  hold(A, q(K4.win[1] + 0.1), q(c(7).at - 0.2), 'the towers drawing frames: it watches them work', [[towers, 3.0]], { because: [{ id: 'aGo4' }] });
  say(7, { shapes: ['show', 'describe', 'point', 'open'], maxBeats: 1, target: O });
  St({ id: 'sFrameW', t0: tFrame, t1: q(tFrame + 0.3), kind: 'WORD', label: '"every frame drawn in software, one at a time"', actor: A, because: [{ id: 'say7' }] });
  I({ id: 'oLook', actor: O, kind: 'REACT', t0: q(tFrame + 0.1), t1: q(tFrame + 1.0), label: 'looks up at the towers', params: { how: 'turn', lookAt: towers }, because: [{ id: 'sFrameW' }] });
  hear(O, 7, { id: 'oHear7', nod: false });
  say(8, { shapes: ['open'], target: A });
  hear(A, 8, { id: 'aHear8', nod: false });
  say(9, { shapes: ['describe', 'show'], target: O });
  hear(O, 9, { id: 'oHear9' });
  /* ── the restart ── */
  St({ id: 'sDown', t0: tDark, t1: q(tDark + 0.6), kind: 'SOUND', label: 'the power goes: a falling whine, a clunk, the hum stops', because: [] });
  St({ id: 'sDark', t0: q(tDark + 0.05), t1: q(tDark + 0.6), kind: 'SIGHT', label: 'the lights out: only the red of the emergency lamps', because: [{ id: 'sDown' }] });
  I({ id: 'oStart', actor: O, kind: 'REACT', t0: q(tDark + 0.1), t1: q(tDark + 1.0), label: 'starts at the dark', params: { how: 'startle', lookAt: towers }, because: [{ id: 'sDark' }] });
  I({ id: 'aTurn', actor: A, kind: 'REACT', t0: q(tDark + 0.2), t1: q(tDark + 1.2), label: 'turns to the towers', params: { how: 'turn', lookAt: towers }, because: [{ id: 'sDark' }] });
  walk(A, 'K5', O, 'in the dark: a step toward the actor', [{ id: 'aTurn' }], 'aGo5'); walk(O, 'K5', A, 'in the dark: toward the agent', [{ id: 'oStart' }], 'oGo5');
  say(10, { shapes: ['open'], target: towers, because: [{ id: 'sDark' }] });
  say(11, { shapes: ['open'], target: O });
  hear(O, 11, { id: 'oHear11' });
  St({ id: 'sUp', t0: tLight, t1: q(tLight + 0.6), kind: 'SOUND', label: 'the power back: a click and a rising whine, the hum again', because: [] });
  St({ id: 'sLight', t0: q(tLight + 0.1), t1: q(tLight + 0.8), kind: 'SIGHT', label: 'the farm\'s lights come back on', because: [{ id: 'sUp' }] });
  I({ id: 'aSee', actor: A, kind: 'ATTEND', target: towers, t0: q(tLight + 0.2), t1: q(c(12).at - 0.3), label: 'to the towers: they take up the frames again', because: [{ id: 'sLight' }] });
  I({ id: 'oSee', actor: O, kind: 'REACT', t0: q(tLight + 0.3), t1: q(tLight + 1.2), label: 'looks up as the light comes back', params: { how: 'turn', lookAt: towers }, because: [{ id: 'sLight' }] });
  say(12, { shapes: ['open', 'describe', 'show'], maxBeats: 1, target: O });
  hear(O, 12, { id: 'oHear12' });
  hold(O, q(end(c(12)) + 0.5), T, 'the frames go on: he watches the towers with the agent', [[towers, 2.6], [A, 1.4]], { because: [{ id: 'say12' }] });
  hold(A, q(end(c(12)) + 0.2), T, 'the render resumed: it watches the frames come', [[towers, 3.0], [O, 1.2]], { because: [{ id: 'say12' }] });
  return {
    type: 'dialogue', title: 'The making-of, 2: the camera in the wool, the night, the restart',
    actors: { [D]: { role: 'the director', body: 'minifig', principal: true }, [A]: { role: 'the agent', body: 'minifig', principal: true },
      [C]: { role: 'the cinematographer', body: 'minifig', principal: true }, [O]: { role: 'the actor', body: 'minifig' } },
    objects: { ram: { kind: 'creature', material: 'wool', at: ram, affords: ['look'] }, farm: { kind: 'machine', material: 'plastic', at: towers, affords: ['render'] }, screen: { kind: 'screen', material: 'light', at: screen, affords: ['look'] } },
    authored: { intents: G.intents, holds: G.holds, stimuli: G.stimuli, goals: { [D]: 'a clean shot', [A]: 'every camera tested; every frame kept', [C]: 'the shot where the heat is', [O]: 'to understand the night' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [C]: [{ a: 'roll on the ram', base: 1.0, f: { 'after:sRamW': -2.6 } }, { a: 'answer for the shot', base: -2.0, f: { 'after:sRamW': 3.0, 'after:say4': -2.0 } }, { a: 'move the camera', base: -2.6, f: { 'after:say4': 3.6 } }],
        [O]: [{ a: 'wait in the shot', base: 1.0, f: { 'after:sHum': -2.4 } }, { a: 'go to the hum', base: -2.0, f: { 'after:sHum': 3.0 } }, { a: 'start at the dark', base: -3.0, f: { 'after:sDark': 4.0, 'after:sLight': -3.0 } }],
        [A]: [{ a: 'build at the desk', base: 1.0, f: { 'after:sWool': -1.6 } }, { a: 'explain', base: -1.6, f: { 'after:say1': 2.6 } }, { a: 'tend the render', base: -2.4, f: { 'after:sNight': 3.6 } }],
      } },
      camera: { follow: true },
    },
  };
};
