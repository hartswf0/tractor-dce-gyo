/* world/scenes-odyssey-play.js — six Odyssey scenes to play, stage and rehearse, each standing on a real LEGO set
   from the forage (world/donors.js): Polyphemus's cave on Skull Island, the Sirens off the Black Seas Barracuda,
   the bow in the King's Castle hall, Circe's wood at the Forestmen's Crossing, Calypso's grove on the Enchanted Island
   with the Island Catamaran for a raft, the swineherd's yard at the Medieval Blacksmith.

   Each scene has marks (coloured plates on the floor a figure stands on, walks to or looks at), beats with their
   reasons, a part the player can take (`part`), and shots that can be run again from the marks (the Perform panel's
   Rehearse, or ?film=<key>&rehearse&part=<actor>). The recorded voice is the halfworld's where a take says what
   the beat needs; the rest is spoken by the browser in live play and stays a caption in an export. */
(function () { if (!window.Film || !Film.SCENES) return;
const T = 'file:odyssey/music/', L = 'odyssey/';
const N = (text, file, from, sec, at) => ({ what: 'SPEAK', who: 'narrator', text, at, for: sec, file: L + file, from });
const SAY = (who, text, at, sec) => ({ what: 'SPEAK', who, text, at, for: sec });
const BEAT = (id, who, from, to, why, direct) => ({ what: 'BEAT', id, who, from, to, why, direct, at: from });
const P = (who, name, at, enter) => ({ what: 'PHRASE', who, name, at, enter: enter || 0.4 });
const LOOK = (who, target, at, keepGaze) => ({ what: 'PERFORM', who, verb: 'LOOK', target, at, keepGaze: !!keepGaze });
const SET = (who, ch, v, at, over) => ({ what: 'SET', who, ch, v, at, over: over || 0.5 });
const ldr = (col, x, y, z, part, m) => `1 ${col} ${x} ${y} ${z} ${m || '1 0 0 0 1 0 0 0 1'} ${part}.dat`;
const mpd = (name, lines, x, z, w, d, facing) => ({ op: 'mpd', name, mpd: `0 FILE ${name}.ldr\n0 !LDRAW_ORG Unofficial_Model\n${lines.join('\n')}`, x, z, w: w || 1, d: d || 1, facing: facing || 's' });
const pigs = (n, ox, oz) => ({ name: 'the pigs', ops: Array.from({ length: n }, (_, i) => mpd('pig' + i, [ldr(84, 0, 0, 0, '87621')], ox + (i % 3) * 3, oz + Math.floor(i / 3) * 3, 2, 3, i % 2 ? 'e' : 's')) });
const fire = { name: 'a fire', ops: [{ op: 'part', part: '3941', col: 0, x: 0, z: 0, y: 0, rot: 0 }, mpd('flames', [ldr(4, 0, -8, 0, '3941'), ldr(191, 0, -22, 0, '6126b')], 0, 0)] };

/* ── 1. Nobody: Polyphemus's cave, Skull Island for the rock ── */
Film.SCENES['odyssey-cave'] = { name: 'The Odyssey: Nobody', time: 'night', weather: 'clear', ground: 'flat', me: 'off', part: 'odysseus',
  set: { kind: 'cave', r: 60, seed: 3, relief: null },
  story: { title: 'Nobody', description: 'In the cave of the Cyclops: the wine, the name, the stake, the way out under the rams. A scene to rehearse: four marks, four beats, one part to take.', location: "Polyphemus's cave, the island of the Cyclopes",
    entities: [{ id: 'odysseus', type: 'character', name: 'Odysseus', traits: ['the sword', 'the name Nobody'] }, { id: 'men', type: 'crowd', name: 'the four men', traits: ['the stake'] }, { id: 'polyphemus', type: 'shadow', name: 'Polyphemus', traits: ['one eye', 'the rams'] }, { id: 'cave', type: 'location', name: 'the cave', traits: ['Skull Island, set 6279'] }],
    goals: ['get out alive'], obstacles: ['the stone at the mouth'], shifts: [{ id: 'wine', name: 'The wine' }, { id: 'nobody', name: 'The name' }, { id: 'stake', name: 'The stake' }, { id: 'rams', name: 'Under the rams' }], why: 'the cunning that names itself nothing', direction: 'guarded' },
  donors: [{ name: 'the cave', set: '6279', x: 0, z: -34, heading: 180, scale: 2.5 }],   /* the island's front edge stands ten metres north of the fire; the marks lie on the plain before it */
  marks: { fire: [0, 0, 4], wall: [0, -8, 14], mouth: [0, 12, 1], 'hide-l': [-5, 3, 2], 'hide-r': [5, 3, 2] },
  actors: [
    { name: 'odysseus', figure: 'odysseus-sword', label: 'Odysseus', x: 0.6, z: 1.4, heading: 0 },
    { name: 'man-1', figure: 'hoplite', label: 'a man', x: -5, z: 3, heading: 30 }, { name: 'man-2', figure: 'hoplite', label: 'a man', x: 5, z: 3, heading: 330 },
    { name: 'man-3', figure: 'hauler', label: 'a man', x: -4, z: 5, heading: 20 }, { name: 'man-4', figure: 'hauler', label: 'a man', x: 4, z: 5, heading: 340 },
    { name: 'polyphemus', figure: 'polyphemus', label: 'Polyphemus', x: 0, z: -9, heading: 180 }],
  builds: [{ name: 'fire', x: 0, z: 0, program: fire }, { name: 'stake', x: -1, z: -2, program: { name: 'the stake', ops: [mpd('stake', [ldr(308, 0, 0, 0, '4497', '0 0 1 0 1 0 -1 0 0')], 0, 0, 4, 1)] } }],
  shots: [
    { name: 'The cave', on: 'the cave', pos: [0, 2.4, 16], tgt: [0, 1.4, -4], lens: 42, sec: 7, shift: 'wine', score: T + 'cyclopean-pulse.ogg', fade: 2, look: { hemi: 0.16, sun: 0, exposure: 1.0 }, lamp: { at: [0, 1.6, 2.4], color: 0xff7a2a, intensity: 9, distance: 30 }, handheld: 0.4,
      events: [BEAT('cave', 'odysseus', 0, 7, 'the men see the giant before he sees them', 'fear'), N('The Cyclops seizes two men, smashes them on the floor, and devours them raw.', 'OD-B09-S07.mp3', 73.04, 8.76, 0.4), P('man-1', 'fear', 0.5), P('man-2', 'fear', 0.7), LOOK('odysseus', 'polyphemus', 0.3, true)] },
    { name: 'Nobody', on: 'odysseus', pos: [3.4, 2.1, 4.2], tgt: [0.6, 1.8, 1.4], lens: 32, sec: 7, shift: 'nobody', look: { hemi: 0.14, sun: 0, exposure: 1.0 }, lamp: { at: [2.2, 1.6, 2.2], color: 0xff8a3a, intensity: 5, distance: 14 },
      events: [BEAT('nobody', 'odysseus', 0, 7, 'he gives the giant a name that will save him', 'guarded'), LOOK('odysseus', 'polyphemus', 0.2, true), P('odysseus', 'guarded', 0.3), SAY('odysseus', 'Cyclops, you ask my name. Nobody is my name. Nobody is what my mother and father call me.', 1.0, 5.2), P('odysseus', 'irony', 4.5)] },
    { name: 'The stake', on: 'wall', pos: [6.5, 2.0, -2], tgt: [0, 1.6, -7], lens: 40, sec: 8, shift: 'stake', look: { hemi: 0.14, sun: 0, exposure: 0.95 }, lamp: { at: [4, 2.0, 0.5], color: 0xff5a1a, intensity: 7, distance: 22 }, handheld: 0.9,
      acts: [{ who: 'man-1', to: 'wall', walk: true }, { who: 'man-2', to: 'wall', walk: true }, { who: 'man-3', to: 'wall', walk: true }, { who: 'man-4', to: 'wall', walk: true }, { who: 'odysseus', to: 'wall', walk: true }],
      events: [BEAT('stake', 'odysseus', 0, 8, 'the four drive the stake, he turns it', 'resolve'), P('odysseus', 'resolve', 0.2), SET('odysseus', 'arm.R.pitch', -2.6, 3.2, 0.8), SET('odysseus', 'torso.lean', 0.3, 3.4, 0.6), { what: 'SHAKE', at: 5.0 }, { what: 'FLASH', at: 5.0 }, SAY('polyphemus', 'Nobody is killing me by force and by guile.', 5.4, 3.0)] },
    { name: 'Under the rams', on: 'mouth', pos: [0, 1.3, 18], tgt: [0, 1.4, 4], lens: 38, sec: 9, shift: 'rams', set: { kind: 'cave', r: 60, seed: 3, relief: null, time: 'dawn' }, look: { hemi: 0.35, sun: 0.9, elev: 6, azim: 180, exposure: 0.9 },
      acts: [{ who: 'man-1', to: 'mouth', walk: true }, { who: 'man-2', to: 'mouth', walk: true }, { who: 'man-3', to: 'mouth', walk: true }, { who: 'man-4', to: 'mouth', walk: true }, { who: 'odysseus', to: 'mouth', walk: true }],
      events: [BEAT('rams', 'odysseus', 0, 9, 'out under the bellies of the rams, then the taunt from the ship', 'confrontation'), { what: 'SPEAK', who: 'odysseus', text: 'Hear me now, Polyphemus:', at: 4.6, for: 4.5, file: L + 'OD-B09-S11.mp3', from: 9.22 }, P('odysseus', 'confrontation', 4.6)] },
    { title: 'NOBODY\nA SCENE TO REHEARSE', style: 'card', sec: 3, name: 'the card' }] };

/* ── 2. The Sirens: the Black Seas Barracuda, sunk to its deck line so the deck is the ground ── */
Film.SCENES['odyssey-sirens'] = { name: 'The Odyssey: the Sirens', time: 'dusk', weather: 'clear', ground: 'flat', me: 'off', part: 'odysseus',
  set: { kind: 'sea', r: 120, seed: 5, relief: null },
  story: { title: 'The Sirens', description: 'Bound to the mast on the black ship: the wax, the ropes, the song, the storm that follows. Four marks on the deck, one part to take.', location: 'the black ship, off the Sirens’ island',
    entities: [{ id: 'odysseus', type: 'character', name: 'Odysseus', traits: ['bound to the mast'] }, { id: 'rowers', type: 'crowd', name: 'the rowers', traits: ['wax in their ears'] }, { id: 'ship', type: 'location', name: 'the black ship', traits: ['Black Seas Barracuda, set 6285'] }],
    goals: ['hear the song and live'], obstacles: ['the ropes', 'the storm'], shifts: [{ id: 'wax', name: 'The wax' }, { id: 'mast', name: 'The mast' }, { id: 'song', name: 'The song' }, { id: 'storm', name: 'The storm' }], why: 'to hear what no one hears and live', direction: 'desperation' },
  donors: [{ name: 'the ship', set: '6285', x: 0, z: 0, heading: 0, scale: 2.5, y: -8.5 }],
  marks: { mast: [0, -1.5, 4], bow: [0, -13, 14], stern: [0, 12, 1], helm: [0, 9, 2] },
  actors: [
    { name: 'odysseus', figure: 'odysseus-wet', label: 'Odysseus', x: 0, z: 6, heading: 0 },
    { name: 'helmsman', figure: 'sailor', label: 'the helmsman', x: 0, z: 9.5, heading: 0 }],
  builds: [],
  shots: [
    { name: 'The black ship', on: 'the ship', pos: [-14, 5, -26], tgt: [0, 3, 2], lens: 44, sec: 7, shift: 'wax', score: T + 'hammer-and-lightning.ogg', fade: 3, look: { hemi: 0.5, sun: 0.5, elev: 4, azim: 250, exposure: 0.8 },
      events: [BEAT('wax', 'odysseus', 0, 7, 'he stops the men’s ears with wax; his own he leaves open', 'resolve'), SAY('narrator', 'I stopped the ears of my men with wax, and they bound me hand and foot to the mast.', 0.6, 6), ...Array.from({ length: 8 }, (_, i) => P('rower-' + (i + 1), 'hold', 0.2 + i * 0.05))] },
    { name: 'To the mast', on: 'odysseus', pos: [1.6, 2.4, -7.5], tgt: [0, 1.7, -1], lens: 40, sec: 7, shift: 'mast', look: { hemi: 0.5, sun: 0.5, elev: 4, azim: 250, exposure: 0.8 },
      acts: [{ who: 'odysseus', to: 'mast', walk: true }], events: [BEAT('mast', 'odysseus', 0, 7, 'he walks to the mast and gives them his wrists', 'resolve'), P('odysseus', 'resolve', 0.3), SET('odysseus', 'arm.L.pitch', -1.4, 4.8, 0.8), SET('odysseus', 'arm.R.pitch', -1.4, 4.8, 0.8)] },
    { name: 'The song', on: 'odysseus', pos: [1.8, 2.0, -4.2], tgt: [0, 2.0, -1.5], lens: 30, sec: 9, shift: 'song', look: { hemi: 0.45, sun: 0.6, elev: 3, azim: 250, exposure: 0.85 }, handheld: 0.5,
      events: [BEAT('song', 'odysseus', 0, 9, 'the song reaches him; he begs to be untied and the men row harder', 'desperation'), P('odysseus', 'desperation', 0.6, 0.8), SET('odysseus', 'torso.lean', 0.34, 1.0, 0.8), SET('odysseus', 'torso.twist', 0.5, 2.0, 0.6), SET('odysseus', 'torso.twist', -0.5, 4.0, 0.8), SAY('odysseus', 'Untie me. Untie me now, I command you.', 2.4, 4), P('helmsman', 'deadpan', 1.0), LOOK('helmsman', 'bow', 0.5, true)] },
    { name: 'The storm', on: 'odysseus', pos: [-3.2, 3.4, 6.5], tgt: [0, 1.8, -1.5], lens: 44, sec: 8, shift: 'storm', roll: 9, handheld: 1.4, set: { kind: 'sea', r: 120, seed: 5, relief: null, time: 'day', weather: 'storm' }, look: { hemi: 0.5, sun: 0.15, elev: 20, azim: 30, exposure: 0.85 },
      events: [BEAT('storm', 'odysseus', 0, 8, 'past the island, the god’s answer', 'fear'), { what: 'SHAKE', at: 0.5 }, { what: 'SHAKE', at: 2.8 }, { what: 'SHAKE', at: 5.1 }, N('Poseidon sees him, gathers clouds, and strikes the sea with a four-wind storm.', 'OD-B05-S05.mp3', 18.12, 7, 0.4), P('odysseus', 'fear', 1.0), P('helmsman', 'panic', 1.5)] },
    { title: 'THE SIRENS\nA SCENE TO REHEARSE', style: 'card', sec: 3, name: 'the card' }] };
for (let i = 0; i < 8; i++) Film.SCENES['odyssey-sirens'].actors.push({ name: 'rower-' + (i + 1), figure: 'sailor', label: 'a rower', x: i < 4 ? -4.2 : 4.2, z: -9 + (i % 4) * 3.4, heading: i < 4 ? 270 : 90 });

/* ── 3. The bow: the hall at Ithaca in the King's Castle ── */
Film.SCENES['odyssey-bow'] = { name: 'The Odyssey: the bow', time: 'dusk', weather: 'clear', ground: 'flat', me: 'off', part: 'odysseus',
  set: { kind: 'hall', r: 60, seed: 2, relief: null },
  story: { title: 'The bow', description: 'The beggar strings the bow no suitor could bend, sends the arrow through the twelve axes, and the doors are shut. Five marks, five beats, a crowd that routs.', location: 'the hall of the palace at Ithaca',
    entities: [{ id: 'odysseus', type: 'character', name: 'Odysseus', traits: ['the beggar', 'the bow'] }, { id: 'penelope', type: 'character', name: 'Penelope', traits: ['on the stair'] }, { id: 'telemachus', type: 'character', name: 'Telemachus', traits: ['at the doors'] }, { id: 'suitors', type: 'crowd', name: 'the suitors', traits: ['at the benches'] }, { id: 'hall', type: 'location', name: 'the hall', traits: ["King's Castle, set 6080"] }],
    goals: ['the bow strung, the axes passed, the doors shut'], obstacles: ['the suitors'], shifts: [{ id: 'bow', name: 'The bow is brought' }, { id: 'string', name: 'The string' }, { id: 'axes', name: 'Through the axes' }, { id: 'doors', name: 'The doors' }, { id: 'stair', name: 'The stair' }], why: 'the contest that is a trap', direction: 'command' },
  donors: [{ name: 'the hall', set: '6080', x: 0, z: -12, heading: 180, scale: 2.5 }],
  marks: { threshold: [0, 8, 4], hearth: [0, 0, 14], stair: [7, -6, 1], doors: [-3, 9, 2], axes: [0, -4, 25] },
  actors: [
    { name: 'odysseus', figure: 'odysseus-wet', label: 'Odysseus', x: 0, z: 8, heading: 0 },
    { name: 'penelope', figure: 'penelope-ithaca', label: 'Penelope', x: 7, z: -6, heading: 90 },
    { name: 'telemachus', figure: 'telemachus-ithaca', label: 'Telemachus', x: 3, z: 2, heading: 0 },
    { name: 'eumaeus', figure: 'eumaeus', label: 'Eumaeus', x: -4, z: 6, heading: 0 },
    { name: 'suitors', crowd: true, kind: 'suitor', n: 0, x: -5, z: -2, r: 4 }].concat(Array.from({ length: 8 }, (_, i) => ({ name: 'suitor-' + (i + 1), figure: 'suitor', label: 'a suitor', x: -8 + (i % 4) * 2.2, z: -3 + Math.floor(i / 4) * 2.4, heading: 250 + (i % 3) * 20 }))),
  builds: [{ name: 'the axes', x: -6, z: -4, program: { name: 'twelve axes', ops: Array.from({ length: 12 }, (_, i) => mpd('axe' + i, [ldr(308, 0, 0, 0, '4497')], i * 2, 0, 1, 1)) } }],
  shots: [
    { name: 'The bow is brought', on: 'the hall', pos: [-10, 3.2, 14], tgt: [0, 1.5, -2], lens: 42, sec: 7, shift: 'bow', score: T + 'bronze-armor-clash.ogg', fade: 2, look: { hemi: 0.25, sun: 0.6, elev: 12, azim: 120, exposure: 0.9 }, lamp: { at: [0, 1.2, 0], color: 0xff9a40, intensity: 4, distance: 24 },
      acts: [{ who: 'eumaeus', to: 'threshold', walk: true }], events: [BEAT('bow', 'eumaeus', 0, 7, 'the swineherd carries the great bow down the hall', 'concern'), SAY('narrator', 'The swineherd took the bow and carried it down the hall, and the suitors shouted at him.', 0.5, 6), P('penelope', 'guarded', 0.4)] },
    { name: 'The string', on: 'odysseus', pos: [2.2, 1.9, 10.6], tgt: [0, 1.9, 8], lens: 32, sec: 8, shift: 'string', look: { hemi: 0.25, sun: 0.6, elev: 12, azim: 120, exposure: 1.0 }, lamp: { at: [0, 1.2, 0], color: 0xff9a40, intensity: 4, distance: 24 },
      events: [BEAT('string', 'odysseus', 0, 8, 'as easily as a singer strings a lyre', 'resolve'), P('odysseus', 'resolve', 0.3), SET('odysseus', 'arm.L.pitch', -1.2, 1.0, 0.6), SET('odysseus', 'arm.R.pitch', -1.6, 1.4, 0.8), SET('odysseus', 'torso.twist', 0.3, 1.5, 0.6), SAY('odysseus', 'Now for another mark, one no man has hit yet.', 3.6, 4), LOOK('telemachus', 'odysseus', 0.4, true), LOOK('penelope', 'odysseus', 0.6, true)] },
    { name: 'Through the axes', on: 'axes', pos: [-2, 3.2, 3.5], tgt: [1, 0.8, -4.2], lens: 40, sec: 6, shift: 'axes', look: { hemi: 0.22, sun: 0.7, elev: 10, azim: 120, exposure: 0.95 }, lamp: { at: [0, 1.2, 0], color: 0xff9a40, intensity: 4, distance: 24 },
      events: [BEAT('axes', 'odysseus', 0, 6, 'the arrow through the twelve helves', 'command'), { what: 'FLASH', at: 2.2 }, { what: 'SOUND', who: 'crunch', at: 2.2 }, SAY('narrator', 'The arrow went clean through the twelve axes and out the other side.', 2.6, 3.4)] },
    { name: 'The doors', on: 'telemachus', pos: [4, 2.6, 12], tgt: [-2, 1.5, 4], lens: 44, sec: 8, shift: 'doors', look: { hemi: 0.22, sun: 0.7, elev: 10, azim: 120, exposure: 0.95 }, lamp: { at: [0, 1.2, 0], color: 0xff9a40, intensity: 4, distance: 24 }, handheld: 0.6,
      acts: [{ who: 'telemachus', to: 'doors', run: true }, { who: 'odysseus', to: 'hearth', walk: true }].concat(Array.from({ length: 8 }, (_, i) => ({ who: 'suitor-' + (i + 1), to: [-9 + (i % 4) * 1.5, 7 + (i % 2) * 1.2], run: true, at: 3.2 + i * 0.15 }))), events: [BEAT('doors', 'telemachus', 0, 8, 'the son bars the doors; the suitors see the beggar for what he is', 'confrontation'), P('odysseus', 'command', 0.5), SAY('odysseus', 'The contest is over. Now I will try another mark.', 1.0, 4.5), ...Array.from({ length: 8 }, (_, i) => P('suitor-' + (i + 1), 'panic', 3.2 + i * 0.1, 0.3)), P('telemachus', 'resolve', 0.3)] },
    { name: 'The stair', on: 'penelope', pos: [5.4, 2.2, -4.0], tgt: [7, 2.0, -6], lens: 32, sec: 6, shift: 'stair', score: T + 'lament-of-penelope.ogg', fade: 2, look: { hemi: 0.2, sun: 0.4, elev: 8, azim: 120, exposure: 1.0 }, lamp: { at: [7.5, 1.6, -4.5], color: 0xffb060, intensity: 3, distance: 10 },
      events: [BEAT('stair', 'penelope', 0, 6, 'she has watched from the stair; she does not yet believe it', 'recognition'), P('penelope', 'skepticism', 0.4), LOOK('penelope', 'odysseus', 0.6, true), { what: 'SPEAK', who: 'penelope', text: 'Odysseus.', at: 2.6, for: 2.2, file: L + 'OD-B23-S04.mp3', from: 30.5 }] },
    { title: 'THE BOW\nA SCENE TO REHEARSE', style: 'card', sec: 3, name: 'the card' }] };

/* ── 4. Circe's wood: the Forestmen's Crossing and the Camouflaged Outpost ── */
Film.SCENES['odyssey-circe'] = { name: "The Odyssey: Circe's wood", time: 'day', weather: 'cloudy', ground: 'flat', me: 'off', part: 'odysseus',
  set: { kind: 'forest', r: 70, seed: 7, corridor: [[0, 18], [0, -14], [0, 4], [14, 4]] },   /* the path to the door, and a branch to the sty so no log lies across it */
  story: { title: "Circe's wood", description: 'The men drink at her door and become pigs; Odysseus comes with the herb Hermes gave him and the sword drawn. Four marks, four beats.', location: 'Aeaea, the wood before Circe’s house',
    entities: [{ id: 'odysseus', type: 'character', name: 'Odysseus', traits: ['the moly', 'the sword'] }, { id: 'circe', type: 'character', name: 'Circe', traits: ['the cup', 'the wand'] }, { id: 'men', type: 'crowd', name: 'the men', traits: ['pigs by the sty'] }, { id: 'wood', type: 'location', name: 'the wood', traits: ["Forestmen's Crossing, set 6071", 'Camouflaged Outpost, set 6066'] }],
    goals: ['the men turned back'], obstacles: ['the cup'], shifts: [{ id: 'wood', name: 'The wood' }, { id: 'door', name: 'The door' }, { id: 'sty', name: 'The sty' }, { id: 'sword', name: 'The sword' }], why: 'the drink he does not drink', direction: 'confrontation' },
  donors: [{ name: 'the house', set: '6071', x: 0, z: -12, heading: 180, scale: 2.5 }, { name: 'the outpost', set: '6066', x: 24, z: -4, heading: 90, scale: 2.5 }],
  marks: { door: [0, -4, 4], table: [0, 1, 14], sty: [9, 5, 1], path: [0, 14, 2] },
  actors: [
    { name: 'odysseus', figure: 'odysseus-sword', label: 'Odysseus', x: 0, z: 14, heading: 0 },
    { name: 'circe', figure: 'circe', label: 'Circe', x: 0, z: -4, heading: 180 },
    { name: 'eurylochus', figure: 'commander', label: 'Eurylochus', x: -2, z: 10, heading: 0 },
    { name: 'man-1', figure: 'hauler', label: 'a man', x: 1.5, z: 3, heading: 0 }, { name: 'man-2', figure: 'hauler', label: 'a man', x: -1.5, z: 3.5, heading: 0 }, { name: 'man-3', figure: 'hauler', label: 'a man', x: 0.4, z: 5, heading: 0 }],
  builds: [{ name: 'the sty', x: 7, z: 3, program: pigs(6, 0, 0) }, { name: 'the table', x: -1, z: 0, program: { name: 'a table', ops: [{ op: 'box', x: 0, z: 0, w: 4, d: 2, y: 0, h: 2, col: 70 }, { op: 'part', part: '3941', col: 297, x: 1, z: 0, y: 2, rot: 0 }, { op: 'part', part: '3941', col: 297, x: 3, z: 1, y: 2, rot: 0 }] } }],
  shots: [
    { name: 'The wood', on: 'path', pos: [-6, 2.4, 22], tgt: [0, 1.6, 4], lens: 42, sec: 7, shift: 'wood', score: T + 'underworld-descent.ogg', fade: 2, look: { hemi: 0.7, sun: 0.9, elev: 22, azim: 200, exposure: 0.95 },
      acts: [{ who: 'man-1', to: 'door', walk: true }, { who: 'man-2', to: 'door', walk: true }, { who: 'man-3', to: 'door', walk: true }], events: [BEAT('wood', 'eurylochus', 0, 7, 'smoke through the trees; the men go in, Eurylochus stays', 'concern'), SAY('narrator', 'They found her house in a clearing, and wolves and lions fawned on them like dogs.', 0.5, 6), P('eurylochus', 'guarded', 0.5), LOOK('eurylochus', 'door', 0.8, true)] },
    { name: 'The door', on: 'circe', pos: [3.2, 1.9, -1], tgt: [0, 1.8, -4], lens: 34, sec: 7, shift: 'door', look: { hemi: 0.6, sun: 0.8, elev: 22, azim: 200, exposure: 1.0 },
      events: [BEAT('door', 'circe', 0, 7, 'she offers the cup; the men drink', 'tenderness'), P('circe', 'tenderness', 0.3), SET('circe', 'arm.R.pitch', -1.3, 0.8, 0.6), SAY('circe', 'Come in, come in. Drink, you have walked far.', 1.0, 4.4), P('man-1', 'joy', 3.5), P('man-2', 'joy', 3.8), SET('circe', 'arm.L.pitch', -2.2, 5.4, 0.5)] },
    { name: 'The sty', on: 'sty', pos: [5, 3.4, 9.5], tgt: [8.5, 0.4, 4], lens: 40, sec: 5, shift: 'sty', look: { hemi: 0.6, sun: 0.8, elev: 22, azim: 200, exposure: 1.0 },
      events: [BEAT('sty', 'eurylochus', 0, 5, 'pigs with the minds of men', 'anguish'), SAY('narrator', 'She struck them with her wand and shut them in the sties, and they had the heads and bristles of pigs, but their minds were as before.', 0.3, 4.6)] },
    { name: 'The sword', on: 'odysseus', pos: [-3.8, 2.0, 3.5], tgt: [0, 1.6, 0.2], lens: 36, sec: 8, shift: 'sword', look: { hemi: 0.55, sun: 0.9, elev: 20, azim: 200, exposure: 1.0 }, handheld: 0.5,
      acts: [{ who: 'odysseus', to: 'table', walk: true }, { who: 'eurylochus', to: 'path', walk: true }], events: [BEAT('sword', 'odysseus', 0, 8, 'he drinks and is not changed; the sword comes out', 'confrontation'), LOOK('circe', 'odysseus', 0.5, true), P('circe', 'wonder', 3.6), SET('odysseus', 'arm.R.pitch', -2.4, 4.4, 0.5), P('odysseus', 'confrontation', 4.4), SAY('circe', 'Who are you? No man has ever drunk this and stood.', 4.8, 3.0), P('circe', 'fear', 5.2)] },
    { title: "CIRCE'S WOOD\nA SCENE TO REHEARSE", style: 'card', sec: 3, name: 'the card' }] };

/* ── 5. The raft: Calypso's grove on the Enchanted Island, the catamaran at the water ── */
Film.SCENES['odyssey-raft'] = { name: 'The Odyssey: the raft', time: 'day', weather: 'clear', ground: 'flat', me: 'off', part: 'odysseus',
  set: { kind: 'shore', r: 80, seed: 9, centre: [0, 0] },
  story: { title: 'The raft', description: 'Seven years on Ogygia: Odysseus weeping on the shore, Hermes with the order, Calypso who lets him go, the raft. Four marks, four beats.', location: 'Ogygia, Calypso’s island',
    entities: [{ id: 'odysseus', type: 'character', name: 'Odysseus', traits: ['on the shore', 'the raft'] }, { id: 'calypso', type: 'character', name: 'Calypso', traits: ['the cave', 'the grove'] }, { id: 'hermes', type: 'character', name: 'Hermes', traits: ['the order from Zeus'] }, { id: 'grove', type: 'location', name: 'the grove', traits: ['Enchanted Island, set 6278', 'Island Catamaran, set 6256'] }],
    goals: ['off the island'], obstacles: ['seven years', 'the sea'], shifts: [{ id: 'shore', name: 'The shore' }, { id: 'hermes', name: 'Hermes' }, { id: 'calypso', name: 'Calypso' }, { id: 'raft', name: 'The raft' }], why: 'home over immortality', direction: 'grief' },
  donors: [{ name: 'the grove', set: '6278', x: -58, z: 10, heading: 180, scale: 2.5 }, { name: 'the raft', set: '6256', x: 14, z: -14, heading: 90, scale: 2.5, y: -0.6 }],
  marks: { shore: [0, -3, 4], cave: [-14, 4, 14], landing: [14, 2, 1], raft: [8, -9, 2] },
  actors: [
    { name: 'odysseus', figure: 'odysseus', label: 'Odysseus', x: 0, z: -3, heading: 0, pose: 'crouch' },
    { name: 'calypso', figure: 'calypso', label: 'Calypso', x: -14, z: 4, heading: 270 },
    { name: 'hermes', figure: 'hermes', label: 'Hermes', x: 16, z: 2, heading: 90 }],
  builds: [],
  shots: [
    { name: 'The shore', on: 'odysseus', pos: [4.4, 1.8, 0.5], tgt: [0, 1.0, -4], lens: 40, sec: 9, shift: 'shore', score: T + 'lament-of-penelope.ogg', fade: 3, look: { hemi: 0.55, sun: 1.3, elev: 16, azim: 300, exposure: 0.9 },
      events: [BEAT('shore', 'odysseus', 0, 9, 'he sits where he has sat for seven years and looks at the sea', 'grief'), P('odysseus', 'grief', 0.5, 1.0), LOOK('odysseus', 'raft', 0.3, true), N('Odysseus describes Ithaca’s rugged beauty and his longing to return.', 'OD-B09-S01.mp3', 57.1, 8.04, 0.5)] },
    { name: 'Hermes', on: 'calypso', pos: [-9, 2.2, 9.5], tgt: [-14, 1.7, 4], lens: 36, sec: 8, shift: 'hermes', look: { hemi: 0.55, sun: 1.3, elev: 16, azim: 300, exposure: 0.95 },
      acts: [{ who: 'hermes', to: 'cave', walk: true }], events: [BEAT('hermes', 'hermes', 0, 8, 'the messenger lands on the shore and walks up to the cave', 'command'), LOOK('calypso', 'hermes', 1.0, true), P('calypso', 'guarded', 1.5), SAY('hermes', 'Zeus commands it. Let him go, he is not fated to die here.', 3.4, 4.2), P('calypso', 'hurt', 6.5)] },
    { name: 'Calypso', on: 'odysseus', pos: [-3.2, 1.9, -0.4], tgt: [0, 1.5, -3], lens: 34, sec: 8, shift: 'calypso', look: { hemi: 0.5, sun: 1.2, elev: 12, azim: 300, exposure: 0.95 },
      acts: [{ who: 'calypso', to: 'shore', walk: true }, { who: 'odysseus', pose: 'stand' }], events: [BEAT('calypso', 'calypso', 0, 8, 'she tells him he may go, and asks why', 'tenderness'), LOOK('odysseus', 'calypso', 2.0, true), P('calypso', 'tenderness', 3.0), SAY('calypso', 'Go, then. Cut your timbers. But she is mortal, and I am not.', 3.2, 4.4), P('odysseus', 'appeal', 5.0), SAY('odysseus', 'I know. I want to go home.', 6.4, 1.6)] },
    { name: 'The raft', on: 'the raft', pos: [-2, 2.6, 0], tgt: [9, 1.2, -10], lens: 44, sec: 8, shift: 'raft', look: { hemi: 0.55, sun: 1.3, elev: 10, azim: 300, exposure: 0.9 }, set: { kind: 'shore', r: 80, seed: 9, centre: [0, 0], time: 'dusk' },
      acts: [{ who: 'odysseus', to: 'raft', walk: true }], events: [BEAT('raft', 'odysseus', 0, 8, 'the raft is ready; he walks down to it', 'resolve'), P('odysseus', 'resolve', 0.3), LOOK('calypso', 'odysseus', 0.5, true), P('calypso', 'grief', 2.0)] },
    { title: 'THE RAFT\nA SCENE TO REHEARSE', style: 'card', sec: 3, name: 'the card' }] };

/* ── 6. The swineherd: Eumaeus's yard at the Medieval Blacksmith ── */
Film.SCENES['odyssey-swineherd'] = { name: 'The Odyssey: the swineherd', time: 'day', weather: 'clear', ground: 'flat', me: 'off', part: 'telemachus',
  set: { kind: 'ridge', r: 70, seed: 11, relief: null, centre: [0, -30] },   /* the ridge kind: a dark floor with the sea far to the south, and no trunks or logs across the yard */
  story: { title: 'The swineherd', description: 'The beggar at the gate of the pig farm, the meal by the fire, Telemachus home from Pylos, and the father who shows himself to the son. Four marks, four beats, Telemachus the part to take.', location: 'Eumaeus’s farm on Ithaca',
    entities: [{ id: 'odysseus', type: 'character', name: 'Odysseus', traits: ['the beggar'] }, { id: 'eumaeus', type: 'character', name: 'Eumaeus', traits: ['the swineherd', 'the fire'] }, { id: 'telemachus', type: 'character', name: 'Telemachus', traits: ['home from Pylos'] }, { id: 'farm', type: 'location', name: 'the farm', traits: ['Medieval Blacksmith, set 21325', 'the pigs, part 87621'] }],
    goals: ['the son knows the father'], obstacles: ['the disguise'], shifts: [{ id: 'gate', name: 'The gate' }, { id: 'fire', name: 'The fire' }, { id: 'son', name: 'The son' }, { id: 'father', name: 'The father' }], why: 'recognition earned before the return', direction: 'recognition' },
  donors: [{ name: 'the farm', set: '21325', x: 0, z: -10, heading: 180, scale: 2.5 }],
  marks: { gate: [0, 12, 4], fire: [0, -1, 14], bench: [3, 1, 1], sty: [-8, 4, 2] },
  actors: [
    { name: 'odysseus', figure: 'odysseus-wet', label: 'Odysseus', x: 0, z: 16, heading: 0 },
    { name: 'eumaeus', figure: 'eumaeus', label: 'Eumaeus', x: 1.2, z: -1, heading: 180 },
    { name: 'telemachus', figure: 'telemachus-ithaca', label: 'Telemachus', x: 0, z: 22, heading: 0 }],
  builds: [{ name: 'the sty', x: -10, z: 2, program: pigs(6, 0, 0) }, { name: 'fire', x: 0, z: -1, program: fire }],
  shots: [
    { name: 'The gate', on: 'odysseus', pos: [-6, 2.2, 18], tgt: [0, 1.5, 10], lens: 42, sec: 8, shift: 'gate', look: { hemi: 0.7, sun: 1.1, elev: 30, azim: 210, exposure: 0.95 },
      acts: [{ who: 'odysseus', to: 'gate', walk: true }, { who: 'eumaeus', to: 'bench', walk: true }], events: [BEAT('gate', 'eumaeus', 0, 8, 'a beggar at the gate, and the dogs; the swineherd calls them off', 'concern'), SAY('eumaeus', 'Old man, the dogs nearly had you. Come in, eat, and then tell me your troubles.', 3.0, 5)] },
    { name: 'The fire', on: 'eumaeus', pos: [5.2, 2.0, 5.5], tgt: [1, 1.5, -1], lens: 34, sec: 8, shift: 'fire', look: { hemi: 0.6, sun: 0.9, elev: 24, azim: 210, exposure: 0.95 }, lamp: { at: [0, 0.8, -1], color: 0xff8a30, intensity: 2.5, distance: 9 },
      acts: [{ who: 'odysseus', to: 'bench', walk: true }, { who: 'eumaeus', to: 'fire', walk: true }], events: [BEAT('fire', 'eumaeus', 0, 8, 'he speaks of the master he lost as if to a stranger', 'weariness'), P('eumaeus', 'weariness', 0.5), LOOK('eumaeus', 'odysseus', 1.5, true), N('My child, how could I forget godlike Odysseus?', 'OD-B01-S01.mp3', 83.24, 4, 2.0), P('odysseus', 'listen', 1.0), P('odysseus', 'hurt', 5.5)] },
    { name: 'The son', on: 'telemachus', pos: [4, 2.0, 14], tgt: [0, 1.6, 8], lens: 40, sec: 8, shift: 'son', look: { hemi: 0.7, sun: 1.1, elev: 30, azim: 210, exposure: 0.95 },
      acts: [{ who: 'telemachus', to: 'gate', walk: true }, { who: 'eumaeus', to: 'gate', run: true }], events: [BEAT('son', 'telemachus', 0, 8, 'the son home from Pylos; the swineherd runs to him like a father', 'joy'), P('eumaeus', 'joy', 3.0), SET('eumaeus', 'arm.L.pitch', -1.6, 4.0, 0.6), SET('eumaeus', 'arm.R.pitch', -1.6, 4.0, 0.6), SAY('telemachus', 'Father Eumaeus. Is my mother still in the house?', 3.4, 3.4), LOOK('odysseus', 'telemachus', 2.0, true)] },
    { name: 'The father', on: 'odysseus', pos: [2.4, 1.9, 5.4], tgt: [0, 1.8, 3], lens: 32, sec: 9, shift: 'father', score: T + 'lament-of-penelope.ogg', fade: 2, look: { hemi: 0.55, sun: 0.9, elev: 20, azim: 210, exposure: 1.0 },
      acts: [{ who: 'odysseus', to: [0, 3], walk: true }, { who: 'telemachus', to: [0, 6], walk: true }, { who: 'eumaeus', to: 'sty', walk: true }], events: [BEAT('father', 'odysseus', 0, 9, 'Athena has made him himself again; the son does not believe it', 'recognition'), LOOK('telemachus', 'odysseus', 1.0, true), LOOK('odysseus', 'telemachus', 0.5, true), P('telemachus', 'skepticism', 2.5), SAY('odysseus', 'I am your father, for whom you have grieved.', 3.0, 3.6), P('telemachus', 'wonder', 5.5), P('odysseus', 'tenderness', 4.0), SAY('telemachus', 'You are not my father. Some god is tricking me.', 6.8, 2.2)] },
    { title: 'THE SWINEHERD\nA SCENE TO REHEARSE', style: 'card', sec: 3, name: 'the card' }] };

Film.PLAY_SCENES = ['odyssey-cave', 'odyssey-sirens', 'odyssey-bow', 'odyssey-circe', 'odyssey-raft', 'odyssey-swineherd'];
})();
