/* world/scenes-modes.js — one short film for each mode the world has: on foot, at the wheel, in the air, and the build.

   The modes are the world's rule sets (world/kernel.js: walk, ride, fly, and build as a flag on walk). Each film is
   the mode shown whole in under forty seconds, staged wherever the player stands: the player's own figure does the
   acts (walk, run, swing; get in, drive, fire, brake, get out; board, climb, strafe, land) while the camera covers
   them in the semantic frames (wide, medium, close, shoulder, pov, low, aerial), so the same program plays in any
   place and any world. Each is a scene program like the trailers: `?film=mode-walk&theatre` on word-to-momento or
   cinerium plays it; tools/export-film.js renders it. */
(function () {
'use strict';
const SCENES = Film.SCENES;
SCENES['mode-walk'] = { name: 'On foot', as: 'luke', time: 'day',
  story: { title: 'On foot', description: 'The first mode: a figure in a street. It walks, it runs, it turns to look, it swings, it pushes a crowd back.', location: 'wherever the player stands',
    entities: [{ id: 'luke', type: 'figure', name: 'Luke', traits: ['saber', 'runs'] }, { id: 'crowd', type: 'crowd', name: 'People in the street', traits: ['scatter'] }], goals: [{ id: 'g1', name: 'cross the street on foot', owner: 'luke' }] },
  actors: [{ name: 'crowd', crowd: true, kind: 'rebel', n: 8, x: 2, z: -16, r: 5 }],
  shots: [
    { score: 'hero', title: 'On foot', style: 'card', sec: 2, events: [{ what: 'LINE', who: 'narrator', text: 'On foot. The first mode: a figure, a street, a saber.', at: 0.3 }] },
    { name: 'The street', on: 'me', frame: 'wide', from: 's', move: 'push', sec: 5, act: { ahead: 8 }, events: [{ what: 'SOUND', who: 'footstep', at: 0.8 }, { what: 'SOUND', who: 'footstep', at: 1.6 }] },
    { name: 'The run', on: 'me', frame: 'medium', from: 'e', move: 'track', sec: 5, follow: true, act: { run: true, ahead: 30 }, events: [{ what: 'LINE', who: 'narrator', text: 'Push the stick further and it runs.', at: 0.4 }] },
    { name: 'The look', on: 'me', frame: 'shoulder', from: 's', move: 'hold', sec: 3, act: { look: { x: 2, z: -16 } } },
    { name: 'The crowd', on: 'me', frame: 'low', from: 'n', move: 'pull', sec: 4, act: { walk: [2, -13] }, events: [{ what: 'LINE', who: 'narrator', text: 'People in the street step out of the way.', at: 0.5 }] },
    { name: 'The saber', score: 'tension', on: 'me', frame: 'close', from: 'sw', move: 'push', sec: 4, act: { saber: true, ahead: 3 }, events: [{ what: 'SOUND', who: 'swing', at: 1.0 }, { what: 'SOUND', who: 'clash', at: 1.9 }, { what: 'SOUND', who: 'swing', at: 2.7 }] },
    { name: 'The rout', on: 'me', frame: 'wide', from: 'se', move: 'crane', sec: 4, act: { ahead: 4 }, events: [{ what: 'ROUT', who: 'crowd', at: 0.8 }, { what: 'SOUND', who: 'clatter', at: 1.0 }] },
    { score: 'end', title: 'On foot\nword to world: walk', style: 'card', sec: 2 },
  ] };
SCENES['mode-ride'] = { name: 'At the wheel', as: 'han', time: 'day',
  story: { title: 'At the wheel', description: 'The second mode: get into a car, drive, fire from it, brake, get out.', location: 'the road by the player',
    entities: [{ id: 'han', type: 'figure', name: 'Han', traits: ['driver'] }, { id: 'car-1', type: 'vehicle', name: 'A red car', traits: ['six studs', 'wheels'] }], goals: [{ id: 'g1', name: 'take the car down the road and back on foot', owner: 'han' }] },
  actors: [{ name: 'car-1', kind: 'car', len: 6, col: 4, x: 5, z: -4, heading: 180 }],
  shots: [
    { score: 'hero', title: 'At the wheel', style: 'card', sec: 2, events: [{ what: 'LINE', who: 'narrator', text: 'At the wheel. The second mode: a car, a road.', at: 0.3 }] },
    { name: 'The car', on: 'car-1', frame: 'medium', from: 'se', move: 'orbit', sec: 4 },
    { name: 'Get in', on: 'me', frame: 'shoulder', from: 's', move: 'hold', sec: 3, act: { ride: 'car-1' }, events: [{ what: 'SOUND', who: 'thud', at: 1.0 }, { what: 'LINE', who: 'narrator', text: 'Thumb up by the door, or E.', at: 0.3 }] },
    { name: 'The road', score: 'chase', on: 'me', frame: 'medium', from: 'se', move: 'track', sec: 6, follow: true, act: { ahead: 60 }, events: [{ what: 'LINE', who: 'narrator', text: 'Up drives, sideways steers, two fingers boost.', at: 0.6 }] },
    { name: 'Behind the wheel', on: 'me', frame: 'pov', sec: 4, follow: true, act: { ahead: 50 } },
    { name: 'The shot', on: 'me', frame: 'medium', from: 'ne', move: 'hold', sec: 4, follow: true, act: { ahead: 40, fire: true }, events: [{ what: 'SOUND', who: 'blaster', at: 0.8 }, { what: 'SOUND', who: 'blaster', at: 1.6 }] },
    { name: 'The brake', on: 'me', frame: 'medium', from: 'w', move: 'hold', sec: 3, follow: true, act: { brake: true }, events: [{ what: 'SOUND', who: 'skid', at: 0.3 }] },
    { name: 'Get out', on: 'me', frame: 'medium', from: 'sw', move: 'pull', sec: 4, act: { leave: true, ahead: 3 }, events: [{ what: 'LINE', who: 'narrator', text: 'Thumb down gets out.', at: 0.5 }] },
    { score: 'end', title: 'At the wheel\nword to world: ride', style: 'card', sec: 2 },
  ] };
SCENES['mode-fly'] = { name: 'In the air', as: 'vader', time: 'night',
  story: { title: 'In the air', description: 'The third mode: board the TIE, climb, strafe, turn, and land.', location: 'above the place',
    entities: [{ id: 'vader', type: 'figure', name: 'Vader', traits: ['pilot'] }, { id: 'tie', type: 'vehicle', name: 'The TIE', traits: ['climbs', 'fires', 'lands'] }], goals: [{ id: 'g1', name: 'a circuit of the place and back on the ground', owner: 'vader' }] },
  shots: [
    { score: 'dread', title: 'In the air', style: 'card', sec: 2, events: [{ what: 'LINE', who: 'narrator', text: 'In the air. The third mode: the ship.', at: 0.3 }] },
    { name: 'The ship', on: 'tie', frame: 'wide', from: 'sw', move: 'orbit', sec: 4, events: [{ what: 'SOUND', who: 'breath', at: 0.5 }] },
    { name: 'Board', on: 'me', frame: 'medium', from: 's', move: 'hold', sec: 3, act: { tie: true }, events: [{ what: 'SOUND', who: 'servo', at: 1.2 }] },
    { name: 'The climb', score: 'chase', on: 'tie', frame: 'wide', from: 'se', move: 'crane', sec: 6, follow: true, act: { tie: true, fly: true }, events: [{ what: 'LINE', who: 'narrator', text: 'Push up to climb, sideways to turn.', at: 0.5 }] },
    { name: 'The strafe', on: 'tie', frame: 'medium', from: 'n', move: 'track', sec: 5, follow: true, act: { tie: true, fly: true, fire: true }, events: [{ what: 'SOUND', who: 'laser', at: 0.6 }, { what: 'SOUND', who: 'laser', at: 1.1 }, { what: 'SOUND', who: 'laser', at: 1.6 }] },
    { name: 'The turn', on: 'tie', frame: 'aerial', sec: 5, follow: true, act: { tie: true, fly: true } },
    { name: 'The landing', on: 'tie', frame: 'wide', from: 's', move: 'pull', sec: 6, follow: true, act: { leave: true }, events: [{ what: 'LINE', who: 'narrator', text: 'Land brings it down anywhere.', at: 0.5 }, { what: 'SOUND', who: 'thud', at: 4.5 }] },
    { score: 'end', title: 'In the air\nword to world: fly', style: 'card', sec: 2 },
  ] };
SCENES['mode-build'] = { name: 'The build', as: 'c3po', time: 'day', set: { kind: 'desert', r: 80, seed: 3 },   // a cleared ground: the hut stands alone
  story: { title: 'The build', description: 'The fourth mode, a flag on walking: words become bricks. A hut stands where nothing stood; the figure walks around it and through its door.', location: 'a clearing by the player',
    entities: [{ id: 'c3po', type: 'figure', name: 'C-3PO', traits: ['builder'] }, { id: 'hut', type: 'build', name: 'A red hut', traits: ['four walls', 'a door', 'a roof slab'] }], goals: [{ id: 'g1', name: 'walk in through the door', owner: 'c3po' }] },
  builds: [{ name: 'hut', x: 0, z: -12, program: { name: 'hut', ops: [{ op: 'box', x: -4, z: -3, w: 8, d: 6, h: 4, col: 4 }, { op: 'door', x: 0, z: 3, w: 2, h: 3, facing: 's' }, { op: 'slab', x: -5, z: -4, w: 10, d: 8, y: 4, plates: 1, col: 72 }] } }],
  shots: [
    { score: 'springfield', title: 'The build', style: 'card', sec: 2, events: [{ what: 'LINE', who: 'narrator', text: 'The build. Say a red hut, and a red hut stands.', at: 0.3 }] },
    { name: 'The hut', on: 'hut', frame: 'wide', from: 'se', move: 'crane', sec: 5 },
    { name: 'The walk around', on: 'me', frame: 'medium', from: 'e', move: 'orbit', sec: 5, act: { walk: [6, -12] }, events: [{ what: 'SOUND', who: 'footstep', at: 1.0 }, { what: 'SOUND', who: 'footstep', at: 1.9 }] },
    { name: 'The corner', on: 'hut', frame: 'low', from: 'n', move: 'push', sec: 4, act: { walk: [0, -20] } },
    { name: 'The door', on: 'me', frame: 'shoulder', from: 's', move: 'hold', sec: 5, act: { walk: [0, -6] }, events: [{ what: 'LINE', who: 'narrator', text: 'A door is a gap you can walk through.', at: 0.5 }] },
    { name: 'Inside', on: 'me', frame: 'close', from: 's', move: 'pull', sec: 4, act: { walk: [0, -11] }, events: [{ what: 'SOUND', who: 'click', at: 2.0 }] },
    { score: 'end', title: 'The build\nword to world: build', style: 'card', sec: 2 },
  ] };
Film.MODE_FILMS = ['mode-walk', 'mode-ride', 'mode-fly', 'mode-build'];
})();
