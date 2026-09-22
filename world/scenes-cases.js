/* world/scenes-cases.js — the cases: the repository's own scene builds made into films that can be played, staged,
   rehearsed and inspected on the hand table, each held to the standard of the Odyssey trailer.

   A case is a scene program (world/film.js) standing on one of the repository's builds laid as a donor set
   (world/donors.js: the MPD packed with every part, parsed once, stood on the ground at the figures' scale), with
   marks on the floor, a cast of figure definitions, beats with their reasons and directions, a shot list that mixes
   hand keys on the set with semantic frames on the actors, lines with voices, a score and foley, a part the player
   can take, and a floor plan for the hand table (tools/play-plan.js writes play/<key>.ldr at one stud to the metre).
   `Film.CASES` is the sheet of all nine candidates: three carry programs here (the grocery checkout, the forest
   skirmish, the cave); the other six are registered with their set, size, cast and beat outline so the same
   machinery lays them and draws their plans, and they wait for their shots. */
(function () { if (!window.Film || !Film.SCENES) return;
const SAY = (who, text, at, sec) => ({ what: 'LINE', who, text, at, for: sec });   // spoken by the lines tool's voice in an export, by the browser live
const BEAT = (id, who, from, to, why, direct) => ({ what: 'BEAT', id, who, from, to, why, direct, at: from });
const P = (who, name, at, enter) => ({ what: 'PHRASE', who, name, at, enter: enter || 0.4 });
const FACE = (who, name, at) => ({ what: 'FACE', who, name, at });
const LOOK = (who, target, at, keepGaze) => ({ what: 'PERFORM', who, verb: 'LOOK', target, at, keepGaze: !!keepGaze });
const SET = (who, ch, v, at, over) => ({ what: 'SET', who, ch, v, at, over: over || 0.5 });
const SND = (who, at) => ({ what: 'SOUND', who, at });

/* ── 1. The checkout: the Simpsons grocery store (simpsons_scene_05_grocery.mpd) ── */
Film.SCENES['case-grocery'] = { name: 'The Checkout', time: 'day', weather: 'clear', ground: 'flat', me: 'off', part: 'marge',
  story: { title: 'The Checkout', description: 'A small workplace, an ordinary procedure, one thing processed wrongly, and the reactions that follow: Marge unloads the cart, the belt carries Maggie to the scanner, the register names a price, and the bag is the wrong place for a baby.', location: 'the checkout lane of the Springfield grocery store',
    entities: [{ id: 'marge', type: 'character', name: 'Marge', traits: ['the cart', 'the wide face'] }, { id: 'maggie', type: 'character', name: 'Maggie', traits: ['on the belt', 'the worried face'] }, { id: 'clerk', type: 'character', name: 'the checkout clerk', traits: ['the scanner', 'the procedure'] }, { id: 'homer', type: 'character', name: 'Homer', traits: ['next in line', 'the magazine'] }, { id: 'lane', type: 'location', name: 'the lane', traits: ['the belt', 'the register', 'the bag stand'] }],
    goals: ['get through the lane'], obstacles: ['the procedure does not know a baby from the groceries'], shifts: [{ id: 'queue', name: 'The queue' }, { id: 'belt', name: 'The belt' }, { id: 'scan', name: 'The scan' }, { id: 'price', name: 'The price' }, { id: 'bag', name: 'The bag' }, { id: 'fix', name: 'The fix' }], why: 'a procedure done exactly right on the wrong thing', direction: 'deadpan' },
  donors: [{ name: 'the lane', set: 'simpsons-grocery', x: 0, z: 0, heading: 0, scale: 2.5 }],   /* the counter runs along x; the customers stand on the south side (z > 0), the clerk behind it (z < 0.6) */
  marks: { cart: [-1.5, 2.6, 4], belt: [0, 2.2, 14], register: [2.5, -0.8, 1], bags: [4.2, -0.6, 2], queue: [-4.5, 3.2, 25], door: [7, 4, 15] },
  actors: [
    { name: 'marge', figure: 'marge', label: 'Marge', x: -1.5, z: 2.6, heading: 0 },
    { name: 'maggie', figure: 'maggie', label: 'Maggie', x: 0, z: 2.2, heading: 0 },
    { name: 'clerk', figure: 'citizen', label: 'the clerk', x: 2.5, z: -0.8, heading: 180 },
    { name: 'homer', figure: 'homer', label: 'Homer', x: -4.5, z: 3.2, heading: 60 }],
  shots: [
    { score: 'springfield', title: 'THE CHECKOUT', style: 'card', sec: 2, events: [SAY('narrator', 'The checkout.', 0.3, 1.2)] },
    { name: 'The queue', on: 'the lane', pos: [-9, 3.2, 9], tgt: [0.5, 1.4, 0.8], lens: 40, sec: 6, shift: 'queue', handheld: 0.2,
      events: [BEAT('queue', 'marge', 0, 6, 'an ordinary lane on an ordinary day', 'neutral'), SND('click', 0.8), SAY('clerk', 'Next, please.', 1.0, 1.4), LOOK('marge', 'clerk', 1.2), P('homer', 'listen', 0.5), SAY('homer', 'Mom Monthly. Huh.', 3.6, 1.6)] },
    { name: 'The belt', on: 'maggie', pos: [-4.5, 2.2, 6.4], tgt: [0.2, 1.3, 1.8], lens: 34, sec: 6, shift: 'belt',
      acts: [{ who: 'marge', to: 'belt', walk: true }],
      events: [BEAT('belt', 'marge', 0, 6, 'the groceries go on the belt, and the baby goes on the belt', 'neutral'), SND('servo', 0.6), SND('servo', 2.2), SND('servo', 3.8), FACE('maggie', 'wide', 2.0), SAY('marge', 'Hold still, Maggie.', 2.4, 1.6)] },
    { name: 'The scan', on: 'clerk', pos: [5.6, 2.6, 4.8], tgt: [1.8, 1.5, 0.2], lens: 36, sec: 6, shift: 'scan', handheld: 0.3,
      events: [BEAT('scan', 'clerk', 0, 6, 'the procedure: everything on the belt gets scanned', 'deadpan'), LOOK('clerk', 'maggie', 0.4), SET('clerk', 'arm.R.pitch', -1.6, 1.2, 0.5), SND('ping', 2.2), SND('ping', 3.0), SND('ping', 3.9), P('clerk', 'deadpan', 0.3), FACE('maggie', 'worried', 3.0)] },
    { name: 'The price', on: 'the lane', pos: [0.6, 2.4, 7.5], tgt: [2.2, 1.6, -0.3], lens: 30, sec: 5, shift: 'price',
      events: [BEAT('price', 'clerk', 0, 5, 'the register knows a number for everything', 'deadpan'), SND('ping', 0.6), SAY('clerk', 'That will be eight hundred and forty seven dollars and sixty three cents.', 1.0, 3.6), P('marge', 'skepticism', 1.4)] },
    { name: 'The bag', on: 'marge', pos: [-4.6, 2.0, 5.4], tgt: [-1.2, 1.7, 2.2], lens: 30, sec: 5, shift: 'bag', handheld: 0.4,
      events: [BEAT('bag', 'marge', 0, 5, 'she sees where the baby is going', 'concern'), FACE('marge', 'wide', 0.4), P('marge', 'concern', 0.4), LOOK('marge', 'bags', 0.3, true), SND('clatter', 2.0), SAY('marge', 'That one does not go in the bag.', 2.4, 2.2), SET('marge', 'arm.L.pitch', -2.2, 2.2, 0.5)] },
    { name: 'The fix', on: 'the lane', pos: [-8, 3.0, 8.5], tgt: [0.8, 1.4, 0.6], lens: 38, sec: 7, shift: 'fix',
      acts: [{ who: 'marge', to: 'bags', walk: true }, { who: 'homer', to: 'cart', walk: true }],
      events: [BEAT('fix', 'marge', 0, 7, 'the baby comes out of the bag; the procedure shrugs', 'resolve'), P('marge', 'resolve', 0.3), P('clerk', 'shrug', 3.0), SAY('clerk', 'It scanned.', 3.4, 1.2), FACE('maggie', 'wide', 4.0), SAY('homer', 'Do we still get the stamps?', 5.0, 1.8), P('homer', 'irony', 4.8)] },
    { score: 'end', title: 'THE CHECKOUT\nA CASE TO REHEARSE', style: 'card', sec: 3, name: 'the card' }] };

/* ── 2. The forest skirmish: Ewoks against robots (ewoks.mpd), the middle of the stage kept clear ── */
Film.SCENES['case-ewoks'] = { name: 'The Forest Skirmish', time: 'day', weather: 'clear', ground: 'flat', me: 'off', part: 'ewok-1', set: { kind: 'stage', r: 120, seed: 1 },   /* a bare stage under the set: the author calls its rim a soundstage horizon; the valley's houses and trees go */
  story: { title: 'The Forest Skirmish', description: 'Two lines in a forest with a fallen log between them: an intrusion, an ambush, a train that both sides take for the enemy, and the reversal when the plane comes over.', location: 'a redwood clearing with a track through it',
    entities: [{ id: 'ewoks', type: 'crowd', name: 'the Ewoks', traits: ['cover', 'spears'] }, { id: 'robots', type: 'crowd', name: 'the robots', traits: ['the line', 'blasters'] }, { id: 'train', type: 'vehicle', name: 'the train', traits: ['the crease', 'the horn'] }, { id: 'plane', type: 'vehicle', name: 'the plane', traits: ['overhead'] }, { id: 'clearing', type: 'location', name: 'the clearing', traits: ['the log', 'the crates'] }],
    goals: ['hold the clearing'], obstacles: ['the wrong enemy'], shifts: [{ id: 'lines', name: 'The lines' }, { id: 'intrusion', name: 'The intrusion' }, { id: 'ambush', name: 'The ambush' }, { id: 'train', name: 'The train' }, { id: 'reversal', name: 'The reversal' }, { id: 'aerial', name: 'From above' }], why: 'a mistaken enemy ends a fight nobody could win', direction: 'confrontation' },
  donors: [{ name: 'the clearing', set: 'ewoks-forest', x: 0, z: 0, heading: 0, scale: 2.5 }],
  marks: { 'ewok-cover': [-14, 0], 'robot-cover': [14, 0], middle: [0, 3], 'ewok-rush': [-5, 2], 'robot-rush': [5, 1], track: [41, -2], back: [-18, 25] },   /* metres from the set's origin: the stumps stand at x -14..-16, the robots' cover at x 11..19, the train at x 41 on the east rim */
  actors: [
    { name: 'ewok-1', figure: 'ewok', label: 'an Ewok', x: -14, z: -2, heading: 90 }, { name: 'ewok-2', figure: 'ewok', label: 'an Ewok', x: -15, z: 1, heading: 90 }, { name: 'ewok-3', figure: 'ewok', label: 'an Ewok', x: -13, z: 3, heading: 90 },
    { name: 'robot-1', figure: 'robot', label: 'a robot', x: 14, z: -2, heading: 270 }, { name: 'robot-2', figure: 'robot', label: 'a robot', x: 15, z: 1, heading: 270 }, { name: 'robot-3', figure: 'robot', label: 'a robot', x: 13, z: 3, heading: 270 }],
  /* The cameras stand where the set is clear: the middle of the stage is empty by design (the author's "keep center clear"), the trees are on the north edge at z -16, the plane hangs at 32 m. The set's own six MENTO cameras are kept in the file's header for reference; four of them stood inside its trunks and canopy at this scale. */
  shots: [
    { score: 'march', title: 'THE FOREST SKIRMISH', style: 'card', sec: 2, events: [SAY('narrator', 'The forest skirmish.', 0.3, 1.4)] },
    { name: 'Skirmish wide', on: 'the clearing', pos: [24, 9, 26], tgt: [0, 1.5, 0], lens: 32, sec: 6, shift: 'lines', events: [BEAT('lines', 'ewok-1', 0, 6, 'two lines, a log between them, nobody moving first', 'guarded'), SND('chirp', 1.0), SND('chirp', 2.8), SAY('narrator', 'Two lines. Ewoks in the stumps to the west, robots in the cover to the east.', 0.8, 3.6)] },
    { name: 'Ewok line', on: 'ewok-1', pos: [-5, 1.7, 3], tgt: [-14, 1.2, -1], lens: 40, sec: 4, shift: 'lines', events: [P('ewok-1', 'guarded', 0.3), P('ewok-2', 'listen', 0.5), LOOK('ewok-1', 'robot-1', 0.4, true), SAY('ewok-1', 'Yub nub.', 1.6, 1.0), SND('chirp', 2.6)] },
    { name: 'Robot line', on: 'robot-1', pos: [5, 1.7, -4], tgt: [14, 1.2, 0], lens: 40, sec: 4, shift: 'intrusion', acts: [{ who: 'robot-1', to: 'robot-rush', walk: true }], events: [BEAT('intrusion', 'robot-1', 0, 4, 'one robot steps over the line', 'resolve'), P('robot-1', 'resolve', 0.3), SND('servo', 0.6), SND('servo', 1.8), SAY('robot-1', 'Advancing.', 1.0, 1.2)] },
    { name: "No man's land", on: 'middle', pos: [3, 1.4, 10], tgt: [0, 1.0, 1], lens: 35, sec: 6, shift: 'ambush', handheld: 0.5,
      acts: [{ who: 'ewok-1', to: 'ewok-rush' }, { who: 'ewok-2', to: 'middle' }, { who: 'ewok-3', to: 'ewok-rush' }],
      events: [BEAT('ambush', 'ewok-1', 0, 6, 'the Ewoks rush the one who crossed', 'confrontation'), SND('roar', 0.5), SND('swing', 2.4), SND('clash', 2.9), SND('thud', 3.4), { what: 'SHAKE', at: 3.0 }, P('robot-1', 'panic', 3.2), P('ewok-2', 'angry', 2.8)] },
    { name: 'Train vector', on: 'track', pos: [3, 3, -8], tgt: [41, 4.5, -2], lens: 45, sec: 5, shift: 'train', events: [BEAT('train', 'robot-2', 0, 5, 'the train comes down the crease and both sides take it for the enemy', 'fear'), SND('static', 0.4), SND('clatter', 1.6), SND('clatter', 2.8), P('robot-2', 'fear', 1.2), P('robot-3', 'fear', 1.6), LOOK('robot-2', 'track', 0.6, true), SAY('narrator', 'A train on the east rim. Both lines take it for the enemy.', 1.0, 3.0)] },
    { name: 'The reversal', on: 'the clearing', pos: [-2, 6, 16], tgt: [0, 1.5, -2], lens: 40, sec: 6, shift: 'reversal',
      acts: [{ who: 'robot-1', to: 'robot-cover', walk: true }, { who: 'robot-2', to: 'robot-cover', walk: true }, { who: 'robot-3', to: 'robot-cover', walk: true }, { who: 'ewok-1', to: 'ewok-cover', walk: true }, { who: 'ewok-2', to: 'ewok-cover', walk: true }, { who: 'ewok-3', to: 'ewok-cover', walk: true }],
      events: [BEAT('reversal', 'ewok-1', 0, 6, 'both lines pull back; the log keeps the peace', 'weariness'), P('robot-3', 'panic', 0.3), SND('clatter', 1.0), SAY('narrator', 'Both sides withdrew. The train did not notice.', 2.0, 3.2)] },
    { name: 'Aerial map', on: 'the clearing', pos: [-30, 22, 30], tgt: [0, 0, 0], lens: 40, sec: 5, shift: 'aerial', events: [SND('whoosh', 0.8), SND('whoosh', 2.6), SAY('narrator', 'From the plane: the whole stage, and the plane in it.', 0.8, 2.6)] },
    { score: 'end', title: 'THE FOREST SKIRMISH\nA CASE TO REHEARSE', style: 'card', sec: 3, name: 'the card' }] };

/* ── 3. The cave: Plato's Republic VII on the four-zone construct (platos-cave.mpd) ── */
const CAVE = { hemi: 0.3, sun: 0, exposure: 1.3 };   /* the cave shots: no sun, a little ambient, the exposure up; the fire is a lamp */
const FIRE = { at: [0, 5, 12], color: 0xff7a2a, intensity: 30, distance: 70 };
Film.SCENES['case-plato'] = { name: "The Cave", time: 'night', weather: 'clear', ground: 'flat', me: 'off', part: 'freed', set: { kind: 'hall', r: 60, seed: 1 },   /* a dark hall round the construct: nothing of the valley shows past the cave walls */
  story: { title: 'The Cave', description: 'Captives face a wall of shadows; behind them on the parapet the puppeteers carry shapes before a fire. One captive is loosed, turns, and sees who makes the shadows; the climb to the light; the return to people who prefer the wall.', location: "Plato's cave: the pit, the screen, the parapet, the fire, the ascent",
    entities: [{ id: 'captives', type: 'crowd', name: 'the captives', traits: ['bound', 'facing the wall'] }, { id: 'freed', type: 'character', name: 'the freed one', traits: ['turns', 'climbs'] }, { id: 'puppeteers', type: 'crowd', name: 'the puppeteers', traits: ['the parapet', 'the shapes'] }, { id: 'fire', type: 'location', name: 'the fire', traits: ['the false light'] }, { id: 'sun', type: 'location', name: 'the ascent', traits: ['the true light'] }],
    goals: ['see what makes the shadows'], obstacles: ['the bonds', 'the climb', 'the people who will not turn'], shifts: [{ id: 'shadows', name: 'The shadows' }, { id: 'puppeteers', name: 'The puppeteers' }, { id: 'turn', name: 'The turn' }, { id: 'climb', name: 'The climb' }, { id: 'sun', name: 'The sun' }, { id: 'return', name: 'The return' }], why: 'the one who turns around', direction: 'wonder' },
  donors: [{ name: 'the cave', set: 'platos-cave', x: 0, z: 0, heading: 0, scale: 2.5, y: -7 }],   /* sunk seven metres so the captives' floor is the ground: the row at z -5 faces the screen at z -12.5; the parapet stands above and behind; the boat hull slope at x -10 is the way out */
  marks: { row: [0, -5], screen: [0, -12.5], parapet: [0, 6.2], fire: [0, 12.5], slope: [8, 17], out: [10, 26], side: [4, -3] },   /* metres from the set's origin: the row of captives at z -5 faces the window wall at z -12.5; the parapet track at z 5..7.5; the fire at z 12.5; the wedge slopes of the ascent behind the canyon wall at z 19; the boat hull (the "descent") fills x -17..-3, so every camera and walk keeps to the east of x -2 */
  actors: [
    { name: 'captive-1', figure: 'shade', label: 'a captive', x: -3.5, z: -5, heading: 180 }, { name: 'captive-2', figure: 'shade', label: 'a captive', x: 3.5, z: -5, heading: 180 },
    { name: 'freed', figure: 'citizen', label: 'the freed one', x: 0, z: -5, heading: 180 },
    { name: 'puppeteer-1', figure: 'hauler', label: 'a puppeteer', x: -2, z: 6.2, heading: 180 }, { name: 'puppeteer-2', figure: 'hauler', label: 'a puppeteer', x: 2, z: 6.2, heading: 180 }],   /* the figures stand on the floor behind the row; the parapet is the set's, with its own hooded torsos above them */
  shots: [
    { score: 'dread', title: 'THE CAVE', style: 'card', sec: 2, events: [SAY('narrator', 'The cave. Republic, book seven.', 0.3, 2.0)] },
    { name: 'The shadows', on: 'screen', pos: [0, 2.4, 2], tgt: [0, 2.2, -12.5], lens: 44, sec: 7, shift: 'shadows', look: CAVE, lamp: { at: [0, 4, 3], color: 0xff7a2a, intensity: 30, distance: 70 },
      events: [BEAT('shadows', 'freed', 0, 7, 'shapes cross the wall; the captives name them', 'wonder'), SND('static', 0.5), SAY('narrator', 'They have been here since childhood, and see only the shadows.', 1.2, 4.2), P('captive-1', 'listen', 0.4), P('captive-2', 'listen', 0.6), P('freed', 'wonder', 2.0)] },
    { name: 'The puppeteers', on: 'parapet', pos: [9, 3.2, 10], tgt: [0, 4.5, 6], lens: 35, sec: 6, shift: 'puppeteers', look: CAVE, lamp: FIRE,
      events: [BEAT('puppeteers', 'puppeteer-1', 0, 6, 'behind the wall, the people who carry the shapes', 'deadpan'), SET('puppeteer-1', 'arm.R.pitch', -2.8, 0.6, 0.8), SET('puppeteer-2', 'arm.L.pitch', -2.8, 1.0, 0.8), SND('servo', 1.2), SND('servo', 3.6), SAY('narrator', 'Behind them a fire, and between the fire and the captives a wall, along which men carry figures.', 0.8, 4.6)] },
    { name: 'The turn', on: 'freed', pos: [3.4, 1.9, -2.4], tgt: [0, 1.6, -5], lens: 32, sec: 7, shift: 'turn', look: CAVE, lamp: FIRE,
      events: [BEAT('turn', 'freed', 0, 7, 'loosed, he turns his head and sees the fire', 'recognition'), SET('freed', 'head.yaw', 2.4, 1.0, 1.4), SET('freed', 'torso.twist', 0.6, 1.4, 1.2), P('freed', 'wonder', 2.4), LOOK('freed', 'fire', 2.6, true), SND('breath', 3.0), SAY('narrator', 'Suppose one were freed, and made to turn his head.', 1.4, 3.0)] },
    { name: 'The climb', on: 'freed', pos: [14, 3.5, 3], tgt: [6, 1.6, 12], lens: 40, sec: 8, shift: 'climb', look: CAVE, lamp: FIRE,
      acts: [{ who: 'freed', to: 'slope', walk: true }],
      events: [BEAT('climb', 'freed', 0, 8, 'the rough ascent toward a light that hurts', 'resolve'), P('freed', 'resolve', 0.4), SND('footstep', 1.0), SND('footstep', 2.0), SND('footstep', 3.0), SND('breath', 5.0), SAY('narrator', 'Dragged up the steep way, he would be pained and dazzled.', 1.0, 3.6)] },
    { name: 'The sun', on: 'out', pos: [13, 1.5, 34], tgt: [3, 8, 22], lens: 30, sec: 6, shift: 'sun', set: { kind: 'desert', r: 40, seed: 5, time: 'dawn' }, look: { hemi: 0.5, sun: 1.2, elev: 12, azim: 180, exposure: 1.0 },
      acts: [{ who: 'freed', to: 'out', walk: true }],
      events: [BEAT('sun', 'freed', 0, 6, 'the thing itself, not its shadow', 'wonder'), P('freed', 'wonder', 1.0), { what: 'FLASH', at: 0.4 }, SAY('narrator', 'Last of all he would see the sun, not in the water, but itself, in its own place.', 1.0, 4.4)] },
    { name: 'The return', on: 'row', pos: [5.5, 2.0, -0.5], tgt: [0, 1.5, -5], lens: 36, sec: 7, shift: 'return', set: { kind: 'hall', r: 60, seed: 1, time: 'night' }, look: CAVE, lamp: FIRE,
      acts: [{ who: 'freed', to: 'side', walk: true }],
      events: [BEAT('return', 'freed', 0, 7, 'he comes back down to tell them, and they laugh at his ruined eyes', 'hurt'), P('freed', 'appeal', 1.0), P('captive-1', 'contempt', 3.0), P('captive-2', 'skepticism', 3.4), SAY('narrator', 'Would they not say his eyes were ruined by the climb, and that it was not worth even trying?', 1.0, 4.6)] },
    { score: 'end', title: 'THE CAVE\nA CASE TO REHEARSE', style: 'card', sec: 3, name: 'the card' }] };

/* ── The sheet of nine: every candidate registered with its set, so it can be laid, planned and inspected now ── */
Film.CASES = [
  { key: 'case-grocery', name: 'The Checkout', source: 'simpsons_scene_05_grocery.mpd', set: 'simpsons-grocery', size: '10 x 3 m', cast: ['marge', 'maggie', 'citizen', 'homer'], status: 'program', beats: ['the queue', 'the belt', 'the scan', 'the price', 'the bag', 'the fix'] },
  { key: 'case-ewoks', name: 'The Forest Skirmish', source: 'ewoks.mpd', set: 'ewoks-forest', size: '70 x 46 m', cast: ['ewok', 'robot'], status: 'program', beats: ['the lines', 'the intrusion', 'the ambush', 'the train', 'the reversal', 'from above'] },
  { key: 'case-plato', name: 'The Cave', source: 'platos-cave.mpd', set: 'platos-cave', size: '38 x 40 m', cast: ['shade', 'citizen', 'hauler'], status: 'program', beats: ['the shadows', 'the puppeteers', 'the turn', 'the climb', 'the sun', 'the return'] },
  { key: 'case-band', name: 'Band Class', source: 'simpsons_scene_06_band.mpd', set: 'simpsons-band', size: '10 x 5 m', cast: ['lisa', 'bart', 'citizen'], status: 'planned', beats: ['the count-in', 'the wrong tempo', 'the interruption', 'the solo', 'the reaction', 'the downbeat'] },
  { key: 'case-searchers', name: 'The Searchers', source: 'searchers.mpd', set: 'searchers', size: '17 x 23 m', cast: ['rider', 'citizen', 'homer', 'marge'], status: 'planned', beats: ['the rider outside', 'the family at the television', 'the door', 'nobody turns', 'the long shadow', 'the leaving'], note: 'the set carries five cameras and nine lights of its own; one collapsed transformation to repair' },
  { key: 'case-undaunted', name: 'Fort Mandan', source: 'Brickfilm_Studio_Kit/undaunted_scene_2_ohio_fort_mandan.mpd', set: 'undaunted-fort-mandan', size: '13 x 16 m', cast: ['hauler', 'commander', 'rider'], status: 'planned', beats: ['the boats', 'the palisade', 'the winter', 'the guide', 'the map', 'the river again'], note: 'one of seven Undaunted files; the others are the title, Jefferson, Great Falls, the Bitterroot, the Pacific and the credits' },
  { key: 'case-ithaca-cove', name: 'Ithaca Cove', source: 'odyssey-production/locations/ithaca-cove.mpd', set: 'ithaca-cove', size: '70 x 60 m', cast: ['odysseus-wet', 'athena', 'sailor'], status: 'planned', beats: ['the arrival asleep', 'the Phaeacians gone', 'the mist', 'the goddess', 'the concealment of the goods', 'the road up'] },
  { key: 'case-ogygia', name: 'Ogygia Grove', source: 'odyssey-production/locations/ogygia-grove.mpd', set: 'ogygia-grove', size: '70 x 60 m', cast: ['odysseus', 'calypso', 'hermes'], status: 'planned', beats: ['the shore', 'the messenger', 'the order', 'the axe', 'the raft', 'the leaving'], note: 'the raft scene in the play set covers the same beats on the Enchanted Island; this is the authored grove' },
  { key: 'case-rocket', name: 'The Launch', source: 'rocket_launch_scene.ldr', set: 'rocket-launch', size: '13 x 9 m', cast: ['citizen', 'pilot', 'c3po'], status: 'planned', beats: ['the countdown', 'the hold', 'the small problem', 'the fix', 'the launch', 'the unexpectedly small departure'] },
];
Film.PLAY_SCENES = (Film.PLAY_SCENES || []).concat(['case-grocery', 'case-ewoks', 'case-plato']);
})();
