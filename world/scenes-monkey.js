/* world/scenes-monkey.js — the monkey data center as a film: Film.SCENES['monkey-data-center'].

   The room is the repository's own build (monkey-data-center-modular.mpd, the 4X container-first control room:
   four textured wall panels, floor tiles, three capuchin monkeys) stood as a donor set at the figures' scale.
   The LEGOS narrative in the model's header is the film: three monkeys run the infrastructure, hide from an
   inspection, and their random typing turns out to have optimised everything, so the humans make them staff.
   Nine shots: a card, the room on a slow push, Alpha typing (keyed arms, clicks and pings), Beta up the rack on a
   crane, Gamma and the banana, the inspector on a handheld track, the hide, the shift (the screens go green, the
   music turns), the badges and the billing. Marks on the floor, beats with their reasons, Alpha the part to take:
   it rehearses like the Odyssey scenes (Perform panel, or ?film=monkey-data-center&rehearse). */
(function () { if (!window.Film || !Film.SCENES) return;
const SAY = (who, text, at, sec) => ({ what: 'SPEAK', who, text, at, for: sec });
const BEAT = (id, who, from, to, why, direct) => ({ what: 'BEAT', id, who, from, to, why, direct, at: from });
const P = (who, name, at, enter) => ({ what: 'PHRASE', who, name, at, enter: enter || 0.4 });
const LOOK = (who, target, at, keepGaze) => ({ what: 'PERFORM', who, verb: 'LOOK', target, at, keepGaze: !!keepGaze });
const SET = (who, ch, v, at, over) => ({ what: 'SET', who, ch, v, at, over: over || 0.4 });
const SND = (who, at, k) => ({ what: 'SOUND', who, at, k });
const ldr = (col, x, y, z, part, m) => `1 ${col} ${x} ${y} ${z} ${m || '1 0 0 0 1 0 0 0 1'} ${part}.dat`;
const mpd = (name, lines, x, z, w, d, facing) => ({ op: 'mpd', name, mpd: `0 FILE ${name}.ldr\n0 !LDRAW_ORG Unofficial_Model\n${lines.join('\n')}`, x, z, w: w || 1, d: d || 1, facing: facing || 's' });
/* typing: the two arms alternate a short pitch over the keys, on twos */
const typing = (who, from, to) => { const ev = []; for (let t = from, i = 0; t < to; t += 0.34, i++) { ev.push(SET(who, i % 2 ? 'arm.L.pitch' : 'arm.R.pitch', -1.35, t, 0.12)); ev.push(SET(who, i % 2 ? 'arm.L.pitch' : 'arm.R.pitch', -1.1, t + 0.17, 0.12)); if (i % 3 === 0) ev.push(SND('click', t)); } return ev; };
const peels = { name: 'banana peels', ops: [mpd('peel1', [ldr(14, 0, 0, 0, '33085', '0 0 1 0 1 0 -1 0 0')], 0, 0), mpd('peel2', [ldr(14, 0, 0, 0, '33085')], 5, 2), mpd('peel3', [ldr(14, 0, 0, 0, '33085', '-1 0 0 0 1 0 0 0 -1')], 2, 6)] };

Film.SCENES['monkey-data-center'] = { name: 'Monkey Data Center', time: 'night', weather: 'clear', ground: 'flat', me: 'off', part: 'alpha',
  set: { kind: 'chamber', r: 40, seed: 4, relief: null },
  story: { title: 'Monkey Data Center', description: 'Three capuchin monkeys run an underground data centre; an inspection comes; their random typing turns out to have optimised everything; the humans make them official staff. From the model’s own LEGOS narrative.', location: 'an underground data centre control room',
    entities: [{ id: 'alpha', type: 'character', name: 'Alpha', traits: ['the console', 'types'] }, { id: 'beta', type: 'character', name: 'Beta', traits: ['the rack', 'climbs'] }, { id: 'gamma', type: 'character', name: 'Gamma', traits: ['the banana'] }, { id: 'inspector', type: 'character', name: 'the inspector', traits: ['a clipboard', 'a badge'] }, { id: 'room', type: 'location', name: 'the control room', traits: ['four textured walls', 'monkey-data-center-modular.mpd'] }],
    goals: ['maintain the systems while hiding from the inspection'], obstacles: ['evidence everywhere: banana peels, modified stations'], shifts: [{ id: 'room', name: 'The room' }, { id: 'work', name: 'The work' }, { id: 'inspection', name: 'The inspection' }, { id: 'shift', name: 'The shift' }, { id: 'staff', name: 'Official staff' }], why: 'their random typing actually optimised everything', direction: 'deadpan' },
  donors: [{ name: 'the room', set: 'monkey', x: 0, z: 0, heading: 0, scale: 2.5 }],
  marks: { console: [-3, -6, 4], rack: [7, -2, 14], banana: [2, 4, 1], door: [0, 8.5, 2], 'hide-1': [-6, 5, 25], 'hide-2': [6, 5, 25], 'hide-3': [-7, -5, 25], centre: [0, 0, 15] },
  actors: [
    { name: 'alpha', figure: 'monkey', label: 'Alpha', x: -3, z: -5, heading: 0 },
    { name: 'beta', figure: 'monkey', label: 'Beta', x: 6, z: -2, heading: 270 },
    { name: 'gamma', figure: 'monkey-banana', label: 'Gamma', x: 2, z: 4, heading: 200 },
    { name: 'inspector', figure: 'citizen', label: 'the inspector', x: 0, z: 8.5, heading: 0 }],
  builds: [{ name: 'peels', x: 1, z: 2, program: peels }, { name: 'console', x: -5, z: -8, program: { name: 'a console', ops: [{ op: 'box', x: 0, z: 0, w: 8, d: 2, y: 0, h: 3, col: 72 }, { op: 'slab', x: 0, z: 0, w: 8, d: 2, y: 3, plates: 1, col: 1 }, { op: 'part', part: '3941', col: 46, x: 1, z: 1, y: 3, rot: 0 }, { op: 'part', part: '3941', col: 46, x: 6, z: 1, y: 3, rot: 0 }] } }],
  shots: [
    { title: 'MONKEY DATA CENTER', style: 'card', sec: 4, name: 'the card', score: 'fanfare', shift: 'room', events: [SAY('narrator', 'An underground data centre control room. Three capuchin monkeys running the infrastructure.', 0.6, 5)] },
    { name: 'The room', on: 'the room', pos: [-9, 4.5, 12], tgt: [0, 2.2, -2], pos2: [-4, 2.6, 6], tgt2: [-1, 1.8, -3], lens: 46, sec: 9, shift: 'room', score: 'camp', fade: 2, look: { hemi: 0.45, sun: 0, exposure: 1.0 }, lamp: { at: [0, 5, 0], color: 0x9ad0ff, intensity: 5, distance: 40 },
      events: [BEAT('room', 'alpha', 0, 9, 'the room breathes: four walls of panels, three monkeys at their stations', 'deadpan'), SND('static', 0.4), SND('servo', 2.2), SND('ping', 4.0), ...typing('alpha', 0.5, 8.5), P('beta', 'listen', 0.5), P('gamma', 'deadpan', 0.5)] },
    { name: 'Alpha types', on: 'alpha', pos: [-1.2, 2.2, -3.2], tgt: [-3, 1.9, -5.2], lens: 34, sec: 8, shift: 'work', look: { hemi: 0.45, sun: 0, exposure: 1.05 }, lamp: { at: [-0.6, 2.6, -3.0], color: 0x9fd4ff, intensity: 4, distance: 14 },
      events: [BEAT('typing', 'alpha', 0, 8, 'random typing, with total confidence', 'deadpan'), ...typing('alpha', 0.2, 7.6), SND('ping', 2.6), SND('ping', 5.3), SET('alpha', 'head.yaw', 0.35, 3.0, 0.4), SET('alpha', 'head.yaw', -0.3, 5.0, 0.4), SAY('narrator', 'Goal: maintain the systems. Method: press the keys.', 1.0, 4)] },
    { name: 'Beta up the rack', on: 'beta', pos: [3, 1.6, 2], tgt: [7, 1.6, -2], pos2: [2.5, 3.6, 2.5], tgt2: [7, 3.2, -2], lens: 44, sec: 8, shift: 'work', look: { hemi: 0.45, sun: 0, exposure: 1.0 }, lamp: { at: [3.5, 3, 1.5], color: 0x9ad0ff, intensity: 4, distance: 20 },
      acts: [{ who: 'beta', to: 'rack', walk: true }], events: [BEAT('rack', 'beta', 0, 8, 'the vent grille is loose again; up the rack', 'resolve'), SND('chirp', 0.8), SND('chirp', 1.4), SET('beta', 'arm.L.pitch', -2.8, 3.4, 0.5), SET('beta', 'arm.R.pitch', -2.8, 3.9, 0.5), SET('beta', 'hips.drop', -12, 4.2, 0.6), SET('beta', 'torso.lean', 0.25, 4.2, 0.5), SND('servo', 5.0), SND('clatter', 6.2), P('beta', 'joy', 6.4)] },
    { name: 'Gamma and the banana', on: 'gamma', pos: [4.6, 1.7, 6.2], tgt: [2, 1.6, 4], lens: 32, sec: 7, shift: 'work', look: { hemi: 0.45, sun: 0, exposure: 1.05 }, lamp: { at: [4.2, 2.6, 6], color: 0xffc070, intensity: 3.5, distance: 12 },
      events: [BEAT('banana', 'gamma', 0, 7, 'evidence, eaten', 'deadpan'), SET('gamma', 'arm.R.pitch', -2.4, 0.6, 0.6), SET('gamma', 'head.yaw', 0.2, 0.9, 0.3), SET('gamma', 'torso.lean', 0.15, 1.0, 0.4), SET('gamma', 'arm.R.pitch', -1.6, 2.4, 0.5), SET('gamma', 'arm.R.pitch', -2.4, 3.6, 0.5), SND('crunch', 1.4), SND('crunch', 4.2), SAY('narrator', 'Obstacle: evidence everywhere. Banana peels. Modified stations.', 2.0, 4.5), LOOK('gamma', 'door', 5.6, true), P('gamma', 'guarded', 5.8)] },
    { name: 'The inspector', on: 'inspector', frame: 'medium', from: 'n', move: 'track', lens: 40, sec: 8, shift: 'inspection', score: 'tension', fade: 1, follow: true, handheld: 0.7, look: { hemi: 0.45, sun: 0, exposure: 1.0 }, lamp: 'warm',
      acts: [{ who: 'inspector', to: 'centre', walk: true }, { who: 'alpha', to: 'hide-1', run: true }, { who: 'beta', to: 'hide-2', run: true }, { who: 'gamma', to: 'hide-3', run: true }],
      events: [BEAT('inspection', 'inspector', 0, 8, 'a human with a clipboard; the monkeys go to ground', 'skepticism'), SND('footstep', 0.6), SND('footstep', 1.4), SND('footstep', 2.2), SND('footstep', 3.0), P('inspector', 'skepticism', 1.0), SAY('inspector', 'Facility inspection. Who is running this room?', 2.4, 3.6), LOOK('inspector', 'console', 4.5, true), SND('static', 6.0)] },
    { name: 'The hide', on: 'alpha', pos: [-0.5, 1.6, 8.2], tgt: [-6, 1.0, 5], lens: 40, sec: 6, shift: 'inspection', look: { hemi: 0.35, sun: 0, exposure: 1.0 }, lamp: { at: [-3, 2.2, 8], color: 0x9ad0ff, intensity: 3, distance: 12 },
      acts: [{ who: 'alpha', pose: 'crouch' }, { who: 'beta', pose: 'crouch' }, { who: 'gamma', pose: 'crouch' }, { who: 'inspector', to: 'console', walk: true }],
      events: [BEAT('hide', 'alpha', 0, 6, 'behind the rack, holding still', 'fear'), P('alpha', 'fear', 0.4), LOOK('alpha', 'inspector', 0.8, true), SND('breath', 1.5), SND('breath', 3.5), SAY('narrator', 'The evidence was everywhere. The inspector went to the console.', 1.2, 4)] },
    { name: 'The shift', on: 'inspector', pos: [1.8, 2.7, -7.0], tgt: [-3.2, 1.9, -5.6], lens: 34, sec: 9, shift: 'shift', score: 'hero', fade: 1.5, look: { hemi: 0.4, sun: 0, exposure: 1.1 }, lamp: { at: [-4, 2.4, -7.6], color: 0x60ff90, intensity: 5, distance: 16 },
      events: [BEAT('shift', 'inspector', 0, 9, 'the screens: every system running better than it ever has', 'wonder'), SND('ping', 0.8), { what: 'FLASH', at: 0.8 }, SND('ping', 1.6), { what: 'FLASH', at: 1.6 }, SND('ping', 2.4), { what: 'FLASH', at: 2.4 }, P('inspector', 'wonder', 1.8, 0.8), SET('inspector', 'torso.lean', 0.2, 2.0, 0.6), SAY('narrator', 'The shift: their random typing had optimised everything. Latency down. Throughput up. Nothing on fire.', 3.0, 5.5), SET('inspector', 'head.yaw', 0.5, 6.5, 0.5), LOOK('inspector', 'hide-1', 7.0, true)] },
    { name: 'Official staff', on: 'centre', pos: [0, 2.4, 8.6], tgt: [0, 1.5, 1], pos2: [0, 3.8, 9.0], tgt2: [0, 1.6, 0], lens: 44, sec: 9, shift: 'staff', score: 'fanfare', fade: 1, look: { hemi: 0.5, sun: 0, exposure: 1.05 }, lamp: { at: [0, 5, 0], color: 0xfff0c0, intensity: 5, distance: 40 },
      acts: [{ who: 'alpha', pose: 'stand', to: [-2, 1], walk: true }, { who: 'beta', pose: 'stand', to: [2, 1], walk: true }, { who: 'gamma', pose: 'stand', to: [0, 2], walk: true }, { who: 'inspector', to: [0, -1.5], walk: true }],
      events: [BEAT('staff', 'inspector', 0, 9, 'the solution: the humans make them official staff', 'joy'), SAY('inspector', 'By the authority of the facility: you three are official staff. Badges.', 3.0, 4.5), SET('inspector', 'arm.R.pitch', -1.5, 3.2, 0.6), P('alpha', 'joy', 5.2), P('beta', 'joy', 5.5), P('gamma', 'joy', 5.8), SND('chirp', 5.4), SND('chirp', 5.9), SND('chirp', 6.3), SET('alpha', 'arm.L.pitch', -3.0, 6.0, 0.6), SET('beta', 'arm.R.pitch', -3.0, 6.2, 0.6)] },
    { title: 'MONKEY DATA CENTER\nOFFICIAL STAFF SINCE TODAY', style: 'card', sec: 4, name: 'the billing', score: 'end', shift: 'staff' }] };
Film.PLAY_SCENES = (Film.PLAY_SCENES || []).concat(['monkey-data-center']);
})();
