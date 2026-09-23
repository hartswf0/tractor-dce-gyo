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

/* ── 1. The List: the Simpsons shopping scene, on The Supermarket (world/models/supermarket.js) ──
   A shopping list is a partial future-state language (Hartsoe, 'The Shopping List', working paper, 2026): it says what should become
   true, not how; the store's plan, the shopper and the world supply the rest. Anscombe's pair is in the store: Homer shops by the list
   (a mistake is in the performance), Ned Flanders follows him down the aisles writing down what goes in the cart (a mistake is in the
   record). Two notes ride the frame: the list top left (style 'list': '~' struck, '+' added), Ned's record top right (RECORD: '?' a
   guess where a shelf hid the taking). At the belt the receipt meets both: the flour Ned guessed plain was organic, and the baby scans.
   The same store is the game (world/shop.js, ?film=case-grocery&shop): the five things are where the shopper finds them.
   The store is 124 × 95 studs laid at heading 180, built mirrored so produce is the left wall as you walk in; SM turns a built stud
   (x, z) to scene metres. The door x 57..67 on the front wall z 8..9; the banana stand x 102..116 × z 15..19 (green bananas the west
   half); aisle 3 x 63..69 between gondolas 3 (x 69..74) and 4 (x 58..63), z 32..78, the olive oil on gondola 3's face at z 44..51; the
   frozen doors on x 5, the hash browns at z 40..46; checkout lane 1's counter x 44..46 × z 14..22, its register x 42..44 × z 19..22,
   the customer's side x 46..50. */
const LIST = (...items) => ['the list', ...items].join('\n');
const SM = (x, z) => [Math.round((x - 62) / 2 * 100) / 100, Math.round((z - 47.5) / 2 * 100) / 100];
const STORE = { hemi: 1.05, sun: 1.0, elev: 62, azim: 150, exposure: 1.05 };   /* no ceiling on a film set: the sun stands high so the walls' shadows are short, the fill up so the aisles read like a lit store */
const ALL5 = ['green bananas', 'black berries', 'extra virgin olive oil', 'organic flour', 'southwest style hash browns'];
const STRUCK = n => ALL5.map((x, i) => (i < n ? '~' : '') + x);
Film.SCENES['case-grocery'] = { name: 'The List', time: 'day', weather: 'clear', ground: 'flat', me: 'off', part: 'homer', set: { kind: 'stage', r: 120, seed: 2 }, marksHidden: true,
  story: { title: 'The List', description: 'Homer comes into the supermarket with five things on a list: green bananas, black berries, extra virgin olive oil, organic flour, southwest style hash browns. Maggie rides in the cart. Ned Flanders sees the list and follows him round the store, writing down everything that goes in the cart. The list gets struck through; Ned\'s record fills up, and where a shelf hides the taking he guesses. At the belt the receipt meets both: the flour Ned guessed plain was organic, and the baby scans.', location: 'the Springfield supermarket',
    entities: [{ id: 'homer', type: 'character', name: 'Homer', traits: ['the list', 'the cart', 'the shopper'] }, { id: 'flanders', type: 'character', name: 'Ned Flanders', traits: ['the record', 'the detective', 'the neighbour'] }, { id: 'maggie', type: 'character', name: 'Maggie', traits: ['in the cart', 'on neither'] }, { id: 'bart', type: 'character', name: 'Bart', traits: ['the objection'] }, { id: 'lisa', type: 'character', name: 'Lisa', traits: ['reads the list right'] }, { id: 'clerk', type: 'character', name: 'the clerk', traits: ['the scanner', 'the receipt'] }, { id: 'list', type: 'object', name: 'the list', traits: ALL5 }, { id: 'record', type: 'object', name: 'Ned\'s record', traits: ['what went in the cart'] }],
    goals: ['make the list true', 'keep a true record'], obstacles: ['green bananas', 'a shelf between the detective and the cart', 'a procedure that acquires everything at the belt'], shifts: [{ id: 'store', name: 'The store' }, { id: 'list', name: 'The list' }, { id: 'produce', name: 'Green' }, { id: 'aisle', name: 'Aisle three' }, { id: 'frozen', name: 'Caught' }, { id: 'belt', name: 'The belt' }, { id: 'record', name: 'The record' }], why: 'the list says what should be made true; the record says what was done; the receipt answers to neither', direction: 'deadpan' },
  donors: [{ name: 'the store', set: 'supermarket', x: 0, z: 0, heading: 180, scale: 1, y: -0.18 }],
  marks: {
    street: [...SM(62, 1), null, 180], 'cart-street': [...SM(62, 5.2), null, 180], 'lisa-street': [...SM(59.5, -0.5), null, 180], 'bart-street': [...SM(64.5, -0.5), null, 180],
    in: SM(62, 17), 'ned-desk': [...SM(77, 20), null, 270],
    'prod-in': [...SM(100, 23), null, 90], bananas: [...SM(111.5, 22), null, 0], stand: SM(111.5, 17), 'cart-prod': [...SM(106, 22.5), null, 90], 'bart-prod': [...SM(106.5, 25.5), null, 90], 'lisa-prod': [...SM(103.5, 25), null, 90], 'ned-prod': [...SM(108.5, 32.5), null, 0],
    oil: [...SM(67.3, 47.5), null, 90], shelf3: SM(70, 47.5), 'cart-oil': [...SM(65.4, 43.5), null, 180], 'bart-oil': [...SM(64.6, 40), null, 180], 'lisa-oil': [...SM(66.8, 39.5), null, 180], 'ned-aisle': [...SM(64.2, 80.5), null, 0],
    frozen: [...SM(8.6, 43.5), null, 270], doors: SM(5, 43.5), 'cart-frozen': [...SM(10.8, 39.8), null, 180], 'bart-frozen': [...SM(12.6, 37.5), null, 180], 'lisa-frozen': [...SM(10.2, 36), null, 180], 'ned-frozen': [...SM(9.2, 55), null, 270],
    belt: [...SM(48.4, 19.5), null, 0], 'cart-belt': [...SM(48, 16.2), null, 0], clerk: [...SM(42.8, 16.6), null, 90], 'ned-belt': [...SM(39.6, 16.5), null, 0], 'bart-belt': [...SM(51.5, 22.5), null, 0], 'lisa-belt': [...SM(52.5, 20), null, 0] },
  actors: [
    { name: 'homer', figure: 'homer', label: 'Homer', x: SM(62, 1)[0], z: SM(62, 1)[1], heading: 180 },
    { name: 'cart', kind: 'cart', len: 4, col: 4, rider: 'maggie', label: 'the cart', x: SM(62, 5.2)[0], z: SM(62, 5.2)[1], heading: 180 },   /* Maggie rides in the basket; the cart is kept a step ahead of Homer */
    { name: 'lisa', figure: 'lisa', label: 'Lisa', x: SM(59.5, -0.5)[0], z: SM(59.5, -0.5)[1], heading: 180 },
    { name: 'bart', figure: 'bart', label: 'Bart', x: SM(64.5, -0.5)[0], z: SM(64.5, -0.5)[1], heading: 180 },
    { name: 'flanders', figure: 'flanders', label: 'Ned', x: SM(77, 20)[0], z: SM(77, 20)[1], heading: 270 },
    { name: 'clerk', figure: 'citizen', label: 'the clerk', x: SM(42.8, 16.6)[0], z: SM(42.8, 16.6)[1], heading: 90 }],
  /* Cut to 'Trouttown Working Day' (Silt Wire & Mountain Current, m1; world/music/cues.json): its bars fall at 0.21 s + 1.973 s k, and every cut is on
     one (bars 2, 6, 8, 12, 15, 19, 23, 27, 29); the scanner pings on the beat (0.493 s). Each shot starts its cast on marks (FROM): the film cuts
     from the door to produce to aisle three to frozen to the belt, as the game's player walks it. */
  shots: [
    { score: 'file:../music/m1-trouttown-working-day.ogg', title: 'THE LIST', style: 'card', sec: 4.16, events: [SAY('narrator', 'Five things.', 0.6, 1.2)] },
    { name: 'The store', on: 'homer', title: LIST(...ALL5), style: 'list', pos: [7.2, 2.4, -10.2], pos2: [6.4, 2.3, -10.8], tgt: [0.4, 1.5, -19.5], lens: 40, sec: 7.84, shift: 'store', look: STORE,
      acts: [{ who: 'homer', from: 'street', to: 'in', walk: true, at: 0.4 }, { who: 'cart', from: 'cart-street', lead: 'homer', ahead: 2.2 }, { who: 'lisa', from: 'lisa-street', follow: 'homer', behind: 1.6, walk: true }, { who: 'bart', from: 'bart-street', follow: 'homer', behind: 2.0, walk: true }, { who: 'flanders', from: 'ned-desk', look: 'homer' }, { who: 'clerk', from: 'clerk', look: 'cart-belt' }],
      events: [BEAT('store', 'homer', 0, 7.84, 'five words go into a building the size of a field, and a neighbour sees them', 'neutral'), SND('footstep', 1.2), SND('footstep', 1.7), SND('footstep', 2.2), SND('clatter', 2.6), SAY('flanders', 'Hi-diddly-ho, Homer! Got a list, have we?', 4.3, 2.2), P('flanders', 'joy', 4.2), SAY('homer', 'Flanders.', 6.7, 0.9), P('homer', 'skepticism', 6.5)] },
    { name: 'The list', on: 'homer', title: LIST(...ALL5), style: 'list', record: [], pos: [1.3, 2.3, -12.6], tgt: [0, 2.0, -15.4], lens: 36, sec: 3.95, shift: 'list', look: STORE,
      acts: [{ who: 'homer', from: 'in', look: 'cart' }, { who: 'cart', lead: 'homer', ahead: 2.2 }, { who: 'flanders', look: 'homer' }],
      events: [BEAT('list', 'homer', 0, 3.95, 'the list says what should become true, not how', 'resolve'), P('homer', 'resolve', 0.2), SAY('homer', 'Five things. How hard can it be?', 0.5, 2.6)] },
    { name: 'Green', on: 'homer', title: LIST(...ALL5), style: 'list', record: ['green bananas'], pos: [15.4, 2.4, -11.6], tgt: [26.5, 1.3, -12.4], lens: 40, sec: 7.89, shift: 'produce', look: STORE,
      acts: [{ who: 'homer', from: 'prod-in', to: 'bananas', walk: true, look: 'stand' }, { who: 'cart', from: 'cart-prod', brake: true }, { who: 'bart', from: 'bart-prod', look: 'homer' }, { who: 'lisa', from: 'lisa-prod', look: 'homer' }, { who: 'flanders', from: 'ned-prod', look: 'homer', pose: 'crouch' }],
      events: [BEAT('produce', 'homer', 0, 7.89, 'green is on the list: the list is for a week from now', 'irony'), SND('footstep', 0.5), SND('footstep', 1.0), SND('click', 2.2), SAY('bart', 'Dad! Those bananas are green!', 2.6, 1.6), SAY('homer', 'The list says green.', 4.4, 1.3), P('homer', 'resolve', 4.3), SAY('lisa', 'It\'s a list for next week, Dad.', 5.9, 1.8), P('lisa', 'joy', 5.8)] },
    { name: 'Aisle three', on: 'homer', title: LIST(...STRUCK(2)), style: 'list', record: ['green bananas', 'black berries'], pos: [1.9, 2.3, -5.6], tgt: [3.0, 1.8, 3.0], lens: 36, sec: 5.91, shift: 'aisle', look: STORE,
      acts: [{ who: 'homer', from: 'oil', look: 'shelf3' }, { who: 'cart', from: 'cart-oil', brake: true }, { who: 'bart', from: 'bart-oil', look: 'homer' }, { who: 'lisa', from: 'lisa-oil', look: 'homer' }, { who: 'flanders', from: 'ned-aisle', look: 'homer' }],
      events: [BEAT('aisle', 'homer', 0, 5.91, 'the detective at the end of the aisle writes down what goes in', 'irony'), SAY('homer', 'Extra virgin olive oil.', 0.4, 1.6), SND('click', 1.9), SAY('flanders', 'Extra virgin! Okily-dokily.', 2.5, 1.7), P('flanders', 'joy', 2.4), LOOK('homer', 'flanders', 4.3, true), P('homer', 'skepticism', 4.4)] },
    { name: 'Caught', on: 'homer', title: LIST(...STRUCK(4)), style: 'list', record: ['green bananas', 'black berries', 'extra virgin olive oil', '?plain flour'], pos: [-24.4, 2.3, -9.2], tgt: [-27.2, 1.6, 2.0], lens: 38, sec: 7.89, shift: 'frozen', look: STORE,
      acts: [{ who: 'homer', from: 'frozen', look: 'doors' }, { who: 'cart', from: 'cart-frozen', brake: true }, { who: 'bart', from: 'bart-frozen', look: 'homer' }, { who: 'lisa', from: 'lisa-frozen', look: 'homer' }, { who: 'flanders', from: 'ned-frozen', look: 'doors' }],
      events: [BEAT('frozen', 'homer', 0, 7.89, 'the shopper turns and finds the detective', 'surprise'), SAY('homer', 'Southwest style hash browns.', 0.4, 1.9), SND('click', 2.1), SAY('flanders', 'Southwest style! Not the regular!', 2.6, 1.9), LOOK('homer', 'flanders', 4.5, true), P('homer', 'surprise', 4.5), SAY('homer', 'Flanders?!', 4.8, 0.9), LOOK('flanders', 'doors', 5.6, true), SAY('flanders', 'Just reading the labels-a-diddly-abels!', 5.9, 1.9), P('flanders', 'joy', 5.8)] },
    { name: 'The belt', on: 'cart', title: LIST(...STRUCK(5)), style: 'list', record: ['green bananas', 'black berries', 'extra virgin olive oil', '?plain flour', 'southwest hash browns'], pos: [-3.4, 2.4, -11.4], tgt: [-9.4, 1.2, -15.8], lens: 40, sec: 7.89, shift: 'belt', look: STORE,   /* from the lobby, south-east of lane one: Homer and the cart in front, the belt and the clerk behind, Ned in the next lane with his book */
      acts: [{ who: 'homer', from: 'belt', look: 'clerk' }, { who: 'cart', from: 'cart-belt', brake: true }, { who: 'bart', from: 'bart-belt', look: 'cart' }, { who: 'lisa', from: 'lisa-belt', look: 'homer' }, { who: 'flanders', from: 'ned-belt', look: 'clerk' }, { who: 'clerk', from: 'clerk', look: 'cart' }],
      events: [BEAT('belt', 'clerk', 0, 7.89, 'the receipt reads out what was done; the record checks itself against it', 'deadpan'), SND('servo', 0.3), SND('ping', 0.95), SAY('clerk', 'Green bananas.', 1.0, 1.0), SAY('flanders', 'Check.', 2.1, 0.6), SND('ping', 2.93), SAY('clerk', 'Black berries.', 2.98, 1.0), SAY('flanders', 'Check.', 4.1, 0.6), SND('ping', 4.9), SAY('clerk', 'Extra virgin olive oil.', 4.95, 1.4), SAY('flanders', 'Check-diddly-eck.', 6.5, 1.1), P('flanders', 'joy', 6.4)] },
    { name: 'The record', on: 'flanders', title: LIST(...STRUCK(5), '+Maggie'), style: 'list', record: ['green bananas', 'black berries', 'extra virgin olive oil', '?plain flour', 'southwest hash browns'], pos: [-6.2, 2.2, -11.0], tgt: [-10.4, 1.7, -15.6], lens: 38, sec: 7.89, shift: 'record', look: STORE,
      acts: [{ who: 'homer', look: 'clerk' }, { who: 'cart', brake: true }, { who: 'flanders', look: 'clerk' }, { who: 'clerk', look: 'cart' }],
      events: [BEAT('record', 'flanders', 0, 7.89, 'the mistake in the record is the record\'s; the baby is on neither', 'deadpan'), SND('ping', 0.2), SAY('clerk', 'Organic flour.', 0.25, 1.0), SAY('flanders', 'Organic? I wrote plain.', 1.4, 1.4), P('flanders', 'concern', 1.3), SND('ping', 3.15), SAY('clerk', 'Baby.', 3.2, 0.6), SAY('homer', 'She\'s not on the list!', 3.9, 1.4), P('homer', 'concern', 3.8), SAY('flanders', 'She\'s not in my record either!', 5.3, 1.5), SAY('clerk', 'It scanned.', 6.9, 0.9), P('clerk', 'shrug', 6.7)] },
    { score: null, fade: 3.6, title: 'THE LIST', style: 'card', sec: 3.95, name: 'the card' }] };

/* ── 2. The forest skirmish: Ewoks against robots (ewoks.mpd), the middle of the stage kept clear ── */
Film.SCENES['case-ewoks'] = { name: 'The Forest Skirmish', time: 'day', weather: 'clear', ground: 'flat', me: 'off', part: 'ewok-1', set: { kind: 'stage', r: 120, seed: 1 },   /* a bare stage under the set: the author calls its rim a soundstage horizon; the valley's houses and trees go */
  story: { title: 'The Forest Skirmish', description: 'Two lines in a forest with a fallen log between them: an intrusion, an ambush, a train that both sides take for the enemy, and the reversal when the plane comes over.', location: 'a redwood clearing with a track through it',
    entities: [{ id: 'ewoks', type: 'crowd', name: 'the Ewoks', traits: ['cover', 'spears'] }, { id: 'robots', type: 'crowd', name: 'the robots', traits: ['the line', 'blasters'] }, { id: 'train', type: 'vehicle', name: 'the train', traits: ['the crease', 'the horn'] }, { id: 'plane', type: 'vehicle', name: 'the plane', traits: ['overhead'] }, { id: 'clearing', type: 'location', name: 'the clearing', traits: ['the log', 'the crates'] }],
    goals: ['hold the clearing'], obstacles: ['the wrong enemy'], shifts: [{ id: 'lines', name: 'The lines' }, { id: 'intrusion', name: 'The intrusion' }, { id: 'ambush', name: 'The ambush' }, { id: 'train', name: 'The train' }, { id: 'reversal', name: 'The reversal' }, { id: 'aerial', name: 'From above' }], why: 'a mistaken enemy ends a fight nobody could win', direction: 'confrontation' },
  donors: [{ name: 'the clearing', set: 'forest-clearing', x: 0, z: 0, heading: 180, scale: 1 }],   /* the real model (world/models/forest-clearing.js), at minifig scale */
  marks: { 'ewok-cover': [-10, -3], 'robot-cover': [5, 4], 'middle': [-1, -2], 'ewok-rush': [-5, -1.5], 'robot-rush': [3, -1.5], 'track': [13, -1], 'back': [-12, -1] },   /* stud (x, z) halved and centred: the log at 22..41 × 31..32, the platform at 8..15 × 12..19, the fire at 6..9 × 28..31, the bunker at 44..55 × 36..45 with its door on the west, the track at 61..62 with the locomotive at z 26..33 */
  actors: [
    { name: 'ewok-1', figure: 'ewok', label: 'an Ewok', x: -11, z: -3, heading: 90 }, { name: 'ewok-2', figure: 'ewok', label: 'an Ewok', x: -9.5, z: -1.5, heading: 90 }, { name: 'ewok-3', figure: 'ewok', label: 'an Ewok', x: -11.5, z: -0.5, heading: 90 },
    { name: 'robot-1', figure: 'robot', label: 'a robot', x: 5, z: 3, heading: 270 }, { name: 'robot-2', figure: 'robot', label: 'a robot', x: 5.5, z: 4.5, heading: 270 }, { name: 'robot-3', figure: 'robot', label: 'a robot', x: 4, z: 1.5, heading: 270 }],
  /* The cameras stand where the set is clear: the middle of the stage is empty by design (the author's "keep center clear"), the trees are on the north edge at z -16, the plane hangs at 32 m. The set's own six MENTO cameras are kept in the file's header for reference; four of them stood inside its trunks and canopy at this scale. */
  shots: [
    { score: 'march', title: 'THE FOREST SKIRMISH', style: 'card', sec: 2, events: [SAY('narrator', 'The forest skirmish.', 0.3, 1.4)] },
    { name: 'Skirmish wide', on: 'the clearing', pos: [-6, 7, 14], tgt: [0, 1, -1], lens: 36, sec: 6, shift: 'lines', events: [BEAT('lines', 'ewok-1', 0, 6, 'two lines, a log between them, nobody moving first', 'guarded'), SND('chirp', 1.0), SND('chirp', 2.8), SAY('narrator', 'Two lines. Ewoks by the train to the west, robots by the stumps to the east.', 0.8, 3.6)] },
    { name: 'Ewok line', on: 'ewok-1', pos: [-3, 1.6, -3], tgt: [-10.5, 1, -2], lens: 36, sec: 4, shift: 'lines', events: [P('ewok-1', 'guarded', 0.3), P('ewok-2', 'listen', 0.5), LOOK('ewok-1', 'robot-1', 0.4, true), SAY('ewok-1', 'Yub nub.', 1.6, 1.0), SND('chirp', 2.6)] },
    { name: 'Robot line', on: 'robot-1', pos: [1, 1.6, 3], tgt: [5, 1.2, 3.5], lens: 40, sec: 4, shift: 'intrusion', acts: [{ who: 'robot-1', to: 'robot-rush', walk: true }], events: [BEAT('intrusion', 'robot-1', 0, 4, 'one robot steps over the line', 'resolve'), P('robot-1', 'resolve', 0.3), SND('servo', 0.6), SND('servo', 1.8), SAY('robot-1', 'Advancing.', 1.0, 1.2)] },
    { name: "No man's land", on: 'middle', pos: [-1, 2.4, 2.5], tgt: [-1, 1, -2], lens: 35, sec: 6, shift: 'ambush', handheld: 0.5,
      acts: [{ who: 'ewok-1', to: 'ewok-rush' }, { who: 'ewok-2', to: 'middle' }, { who: 'ewok-3', to: 'ewok-rush' }],
      events: [BEAT('ambush', 'ewok-1', 0, 6, 'the Ewoks rush the one who crossed', 'confrontation'), SND('roar', 0.5), SND('swing', 2.4), SND('clash', 2.9), SND('thud', 3.4), { what: 'SHAKE', at: 3.0 }, P('robot-1', 'panic', 3.2), P('ewok-2', 'angry', 2.8)] },
    { name: 'Train vector', on: 'track', pos: [7, 2.8, -7], tgt: [14.75, 1.2, -2.5], lens: 40, sec: 5, shift: 'train', events: [BEAT('train', 'robot-2', 0, 5, 'the train comes down the crease and both sides take it for the enemy', 'fear'), SND('static', 0.4), SND('clatter', 1.6), SND('clatter', 2.8), P('robot-2', 'fear', 1.2), P('robot-3', 'fear', 1.6), LOOK('robot-2', 'track', 0.6, true), SAY('narrator', 'A train on the west rim. Both lines take it for the enemy.', 1.0, 3.0)] },
    { name: 'The reversal', on: 'the clearing', pos: [0, 6, -12], tgt: [0, 1, 0], lens: 40, sec: 6, shift: 'reversal',
      acts: [{ who: 'robot-1', to: 'robot-cover', walk: true }, { who: 'robot-2', to: 'robot-cover', walk: true }, { who: 'robot-3', to: 'robot-cover', walk: true }, { who: 'ewok-1', to: 'ewok-cover', walk: true }, { who: 'ewok-2', to: 'ewok-cover', walk: true }, { who: 'ewok-3', to: 'ewok-cover', walk: true }],
      events: [BEAT('reversal', 'ewok-1', 0, 6, 'both lines pull back; the log keeps the peace', 'weariness'), P('robot-3', 'panic', 0.3), SND('clatter', 1.0), SAY('narrator', 'Both sides withdrew. The train did not notice.', 2.0, 3.2)] },
    { name: 'Aerial map', on: 'the clearing', pos: [-14, 16, 14], tgt: [1, 0, -1], lens: 42, sec: 5, shift: 'aerial', events: [SND('whoosh', 0.8), SND('whoosh', 2.6), SAY('narrator', 'From above: the whole stage, the train, the stumps, the palms.', 0.8, 2.6)] },
    { score: 'end', title: 'THE FOREST SKIRMISH\nA CASE TO REHEARSE', style: 'card', sec: 3, name: 'the card' }] };

/* ── 3. The cave: Plato's Republic VII on the four-zone construct (platos-cave.mpd) ── */
const CAVE = { hemi: 4, sun: 0, exposure: 1.2 };   /* the cave shots at night: the look's hemi is a multiplier on the night's ambient (four times it reads), no sun, the exposure up; the fire is a lamp close to what it lights */
const FIRE = { at: [-0.25, 2.4, 1.75], color: 0xff7a2a, intensity: 20, distance: 30 };
Film.SCENES['case-plato'] = { name: "The Cave", time: 'night', weather: 'clear', ground: 'flat', me: 'off', part: 'freed', set: { kind: 'hall', r: 60, seed: 1 },   /* a dark hall round the construct: nothing of the valley shows past the cave walls */
  story: { title: 'The Cave', description: 'Captives face a wall of shadows; behind them on the parapet the puppeteers carry shapes before a fire. One captive is loosed, turns, and sees who makes the shadows; the climb to the light; the return to people who prefer the wall.', location: "Plato's cave: the pit, the screen, the parapet, the fire, the ascent",
    entities: [{ id: 'captives', type: 'crowd', name: 'the captives', traits: ['bound', 'facing the wall'] }, { id: 'freed', type: 'character', name: 'the freed one', traits: ['turns', 'climbs'] }, { id: 'puppeteers', type: 'crowd', name: 'the puppeteers', traits: ['the parapet', 'the shapes'] }, { id: 'fire', type: 'location', name: 'the fire', traits: ['the false light'] }, { id: 'sun', type: 'location', name: 'the ascent', traits: ['the true light'] }],
    goals: ['see what makes the shadows'], obstacles: ['the bonds', 'the climb', 'the people who will not turn'], shifts: [{ id: 'shadows', name: 'The shadows' }, { id: 'puppeteers', name: 'The puppeteers' }, { id: 'turn', name: 'The turn' }, { id: 'climb', name: 'The climb' }, { id: 'sun', name: 'The sun' }, { id: 'return', name: 'The return' }], why: 'the one who turns around', direction: 'wonder' },
  donors: [{ name: 'the cave', set: 'cave-of-shadows', x: 0, z: 0, heading: 180, scale: 1 }],   /* the real model (world/models/cave-of-shadows.js), at minifig scale */
  marks: { row: [-0.25, -8], screen: [-0.25, -11.5], parapet: [-0.25, -2.5], fire: [-0.25, 1.75], slope: [7, -1], out: [14.5, 1.5], side: [-2, -8] },
  /* stud (x, z) halved and centred: the wall of shadows at z 0..1, the bench at z 12..13, the parapet at z 18..21 (1.8 m), the fire at 30..33 × 26..29, the stairs at 46..51 × 24..27 rising to the lookout, the way out past them at z 20..23 to the ledge at x 58..63 under the sun on its column at 60..61 × 23..24 */
  actors: [
    { name: 'captive-1', figure: 'shade', label: 'a captive', x: -1.5, z: -8, heading: 0 }, { name: 'captive-2', figure: 'shade', label: 'a captive', x: 1, z: -8, heading: 0 },
    { name: 'freed', figure: 'citizen', label: 'the freed one', x: -0.25, z: -8, heading: 0 },
    { name: 'puppeteer-1', figure: 'hauler', label: 'a puppeteer', x: -6, z: -0.5, heading: 0 }, { name: 'puppeteer-2', figure: 'hauler', label: 'a puppeteer', x: 5, z: -0.5, heading: 0 }],   /* the captives stand before the bench facing the wall; the puppeteers stand behind the parapet by the fire, out of the captives' sight */
  shots: [
    { score: 'dread', title: 'THE CAVE', style: 'card', sec: 2, events: [SAY('narrator', 'The cave. Republic, book seven.', 0.3, 2.0)] },
    { name: 'The shadows', on: 'screen', pos: [-0.25, 2.6, -4], tgt: [-0.25, 2.2, -11.5], lens: 40, sec: 7, shift: 'shadows', look: CAVE, lamp: { at: [-0.25, 3, -6.5], color: 0xff7a2a, intensity: 8, distance: 30 },
      events: [BEAT('shadows', 'freed', 0, 7, 'shapes cross the wall; the captives name them', 'wonder'), SND('static', 0.5), SAY('narrator', 'They have been here since childhood, and see only the shadows.', 1.2, 4.2), P('captive-1', 'listen', 0.4), P('captive-2', 'listen', 0.6), P('freed', 'wonder', 2.0)] },
    { name: 'The puppeteers', on: 'parapet', pos: [6, 1.8, 3.5], tgt: [-0.25, 1.4, -1.5], lens: 38, sec: 6, shift: 'puppeteers', look: CAVE, lamp: FIRE,
      events: [BEAT('puppeteers', 'puppeteer-1', 0, 6, 'behind the wall, the people who carry the shapes', 'deadpan'), SET('puppeteer-1', 'arm.R.pitch', -2.8, 0.6, 0.8), SET('puppeteer-2', 'arm.L.pitch', -2.8, 1.0, 0.8), SND('servo', 1.2), SND('servo', 3.6), SAY('narrator', 'Behind them a fire, and between the fire and the captives a wall, along which men carry figures.', 0.8, 4.6)] },
    { name: 'The turn', on: 'freed', pos: [2, 1.7, -7], tgt: [-0.25, 1.5, -8], lens: 32, sec: 7, shift: 'turn', look: CAVE, lamp: { at: [1, 2.5, -6.5], color: 0xff7a2a, intensity: 6, distance: 30 },
      events: [BEAT('turn', 'freed', 0, 7, 'loosed, he turns his head and sees the fire', 'recognition'), SET('freed', 'head.yaw', 2.4, 1.0, 1.4), SET('freed', 'torso.twist', 0.6, 1.4, 1.2), P('freed', 'wonder', 2.4), LOOK('freed', 'fire', 2.6, true), SND('breath', 3.0), SAY('narrator', 'Suppose one were freed, and made to turn his head.', 1.4, 3.0)] },
    { name: 'The climb', on: 'freed', pos: [4, 2, 5], tgt: [7.5, 1.5, 1], lens: 40, sec: 8, shift: 'climb', look: CAVE, lamp: { at: [6, 3, 3], color: 0xff7a2a, intensity: 6, distance: 30 },
      acts: [{ who: 'freed', to: 'slope', walk: true }],
      events: [BEAT('climb', 'freed', 0, 8, 'the rough ascent toward a light that hurts', 'resolve'), P('freed', 'resolve', 0.4), SND('footstep', 1.0), SND('footstep', 2.0), SND('footstep', 3.0), SND('breath', 5.0), SAY('narrator', 'Dragged up the steep way, he would be pained and dazzled.', 1.0, 3.6)] },
    { name: 'The sun', on: 'out', pos: [20, 1.4, 7], tgt: [14, 5.5, 0], lens: 44, sec: 6, shift: 'sun', set: { kind: 'desert', r: 40, seed: 5, time: 'dawn' }, look: { hemi: 0.5, sun: 1.2, elev: 12, azim: 180, exposure: 1.0 },
      acts: [{ who: 'freed', to: 'out', walk: true }],
      events: [BEAT('sun', 'freed', 0, 6, 'the thing itself, not its shadow', 'wonder'), P('freed', 'wonder', 1.0), { what: 'FLASH', at: 0.4 }, SAY('narrator', 'Last of all he would see the sun, not in the water, but itself, in its own place.', 1.0, 4.4)] },
    { name: 'The return', on: 'row', pos: [-3.5, 2.4, -4.5], tgt: [-0.25, 1.4, -8], lens: 40, sec: 7, shift: 'return', set: { kind: 'hall', r: 60, seed: 1, time: 'night' }, look: CAVE, lamp: { at: [1, 2.5, -6.5], color: 0xff7a2a, intensity: 6, distance: 30 },
      acts: [{ who: 'freed', to: 'side', walk: true }],
      events: [BEAT('return', 'freed', 0, 7, 'he comes back down to tell them, and they laugh at his ruined eyes', 'hurt'), P('freed', 'appeal', 1.0), P('captive-1', 'contempt', 3.0), P('captive-2', 'skepticism', 3.4), SAY('narrator', 'Would they not say his eyes were ruined by the climb, and that it was not worth even trying?', 1.0, 4.6)] },
    { score: 'end', title: 'THE CAVE\nA CASE TO REHEARSE', style: 'card', sec: 3, name: 'the card' }] };

/* ── 4. The Searchers: the homecoming, on The Homestead (world/models/homestead.js) under The Buttes (world/models/buttes.js) ── */
/* Studs to metres: the homestead is 48 × 48 studs laid at heading 180, so world metres = (stud − 24) / 2 on both axes; it is laid a plate down
   (y −0.18) so its floors, porch and path are the ground the figures stand on. The door frame is at studs x 22..25 on the wall line z 19
   (x −1..1, z −2.5..−2); the room x 13..34 × z 5..18 (x −5.5..5.5, z −9.5..−2.5); the porch boards z 20..24 (z −2..0.5), its posts at
   x 12, 18, 28, 34 on z 23 (the gap before the door x −2..2); the table x 15..20 × z 11..14 (x −4.5..−1.5, z −6.5..−4.5); the bed x 29..33 × z 5..7
   (x 2.5..5, z −9.5..−8); the path x 21..26 south from z 25 (x −1.5..1.5, z 0.5..12); the hitching rail and horse at x 4..8, z 3..4.5.
   The buttes (studs 2..87 × 2..29, centre 44.5, 15.5) are laid at x 16.5, z 62: the mitten at (0.25, 61.5), dead south of the door; the spire at (16.25, 57.25); the east butte at (32, 65).
   Every walk into the room starts on the porch and passes the door plane (z −2.25) within half a metre of x 0, and ends out of the inside camera's frame (east of it).
   The sun stands east-south-east at 26 degrees (look.azim 115), so the yard and the buttes are lit and the room under its ceiling is not. */
const SUN = { hemi: 0.75, sun: 1.25, elev: 26, azim: 115, exposure: 1.0 };
const ROOM = { hemi: 0.2, sun: 1.25, elev: 26, azim: 115, exposure: 0.95 };   /* the room: the ceiling keeps the sun off it, and the fill is cut to a fifth, so the door is the one bright thing */
const PORCH = { hemi: 0.3, sun: 1.3, elev: 26, azim: 115, exposure: 0.95 };   /* on the porch looking out: the roof keeps the sun off the family, the fill is low, so they stand dark between the white posts against the lit desert */
const INSIDE = [0.6, 1.9, -9.0], DOOR = [0.1, 1.6, -2.25];   /* the camera by the back wall, and the middle of the door it looks at */
Film.SCENES['case-searchers'] = { name: 'The Searchers', time: 'day', weather: 'clear', ground: 'flat', me: 'off', part: 'ethan',
  set: { kind: 'monument', r: 200, seed: 3, corridor: [[-1, -14], [1, 12], [3, 40], [3, 70]] },   /* red earth, sage and rocks kept off the line from the house to the mitten, mesas round the horizon */
  story: { title: 'The Searchers', description: 'A woman comes out of a dark house into the light and sees a horse coming in from the buttes with two riders: the man who went after the girl the Comanche took, and the girl behind him. He brings her home. The family goes in. He stays on the porch, and walks back into the desert.', location: 'a homestead under the buttes',
    entities: [{ id: 'ethan', type: 'character', name: 'Ethan', traits: ['the hat', 'five years searching', 'the door he does not go through'] }, { id: 'debbie', type: 'character', name: 'Debbie', traits: ['taken', 'brought home'] }, { id: 'martha', type: 'character', name: 'Martha', traits: ['the porch', 'the one who waited'] }, { id: 'aaron', type: 'character', name: 'Aaron', traits: ['the house'] }, { id: 'door', type: 'location', name: 'the door', traits: ['the dark room', 'the bright desert'] }],
    goals: ['bring Debbie home'], obstacles: ['the man who brings her is not a man for houses'], shifts: [{ id: 'door', name: 'The door' }, { id: 'sighting', name: 'Two figures' }, { id: 'recognition', name: 'Martha' }, { id: 'approach', name: 'The approach' }, { id: 'home', name: 'Home' }, { id: 'inside', name: 'Inside' }, { id: 'leaving', name: 'The leaving' }], why: 'the one who brings them home cannot come in', direction: 'restraint' },
  donors: [{ name: 'the homestead', set: 'homestead', x: 0, z: 0, heading: 180, scale: 1, y: -0.18 }, { name: 'the buttes', set: 'buttes', x: 16.5, z: 62, heading: 180, scale: 1 }, { name: 'the waterhole', set: 'waterhole', x: -9, z: 34, heading: 180, scale: 1, y: -0.19 }],   /* the pool at (−9, 32.8), west of the line the horse rides in on */
  marksHidden: true,   /* the path, the porch and the room's floor are in almost every frame: the marks stay places to walk to, not plates on the floor */
  marks: { inside: [0.4, -5.8], step: [-0.5, 1.3], 'porch-a': [-1.9, -1.1], 'yard-e': [1.0, 8.0], 'yard-d': [2.2, 8.4], 'porch-d': [-0.9, -1.3], 'porch-m': [-0.3, -1.0], 'pasture': [-3.8, 6.5], 'ride-in': [1.3, 5.0], 'door-out': [0.1, -1.1], 'room-d': [3.4, -6.4], 'room-m': [1.8, -8.6], 'room-a': [4.8, -7.4], desert: [1.6, 26] },
  actors: [
    { name: 'martha', figure: 'martha', label: 'Martha', x: 0.4, z: -5.8, heading: 180 },
    { name: 'aaron', figure: 'aaron', label: 'Aaron', x: 4.0, z: -6.0, heading: 180 },
    { name: 'ethan', figure: 'ethan', label: 'Ethan', x: 4.6, z: 36, heading: 0 },
    { name: 'debbie', figure: 'debbie', label: 'Debbie', x: 5.8, z: 36.6, heading: 0 },
    { name: 'ethan-horse', kind: 'horse', len: 7, col: 70, label: "Ethan's horse", x: 4.6, z: 38, heading: 0 }],   /* the horse is a ride: Ethan in the saddle, Debbie behind him, walked in by the film */
  /* Cut to 'Weather Ahead for Finley' (Silt Wire & Mountain Current, m0; world/music/cues.json): the dark low chords 0..10.5 s are the card and the
     door; the plucked build 10.5..25.7 the sighting, Martha and the approach; the band comes in at 25.7 on Home; the hit and break at 42.75 is the
     cut to Ethan turning away; the tail to 51.8 is his walk and the card. The shots sum to 51.8 s. */
  shots: [
    { score: 'file:../music/m0-weather-ahead-for-finley.ogg', title: 'THE SEARCHERS', style: 'card', sec: 3, events: [SAY('narrator', 'Five years, he looked for her.', 0.6, 2.0)] },
    { name: 'The door', on: 'martha', pos: INSIDE, tgt: DOOR, lens: 50, sec: 7.5, shift: 'door', look: ROOM,
      acts: [{ who: 'martha', to: 'step', walk: true, at: 1.0 }, { who: 'ethan', ride: 'ethan-horse' }, { who: 'debbie', ride: 'ethan-horse' }],
      events: [BEAT('door', 'martha', 0, 7, 'out of the dark room into the light', 'restraint'), SND('whoosh', 0.4), SND('footstep', 1.3), SND('footstep', 1.8), SND('footstep', 2.3), SND('footstep', 2.8), SND('footstep', 3.3)] },
    { name: 'Two figures', on: 'ethan', pos: [0.6, 2.2, -1.85], tgt: [1.0, 1.5, 20], lens: 42, sec: 6, shift: 'sighting', look: SUN,
      acts: [{ who: 'ethan', ride: 'ethan-horse' }, { who: 'debbie', ride: 'ethan-horse' }, { who: 'ethan-horse', to: 'ride-in', speed: 0.8 }, { who: 'aaron', to: 'porch-a', walk: true, at: 2.0 }, { who: 'martha', look: 'ethan' }],
      events: [BEAT('sighting', 'martha', 0, 6, 'a horse with two riders coming in out of the buttes', 'wonder'), LOOK('martha', 'ethan', 0.3, true), P('martha', 'wonder', 1.0), SND('whoosh', 1.5)] },
    { name: 'Martha', on: 'martha', pos: [0.3, 2.1, 5.9], tgt: [-0.5, 2.05, 1.3], lens: 30, sec: 4, shift: 'recognition', look: SUN,
      acts: [{ who: 'ethan-horse', to: 'ride-in', speed: 0.8 }, { who: 'martha', look: 'ethan' }],
      events: [BEAT('recognition', 'martha', 0, 3.5, 'she knows who it is, and who is with him', 'recognition'), P('martha', 'recognition', 0.4), LOOK('martha', 'ethan', 0.3, true), SND('breath', 1.6)] },
    { name: 'The approach', on: 'ethan', pos: [-3.4, 1.5, 3.4], tgt: [1.6, 2.4, 10.5], lens: 40, sec: 5.2, shift: 'approach', look: SUN,
      acts: [{ who: 'ethan-horse', to: 'ride-in', speed: 0.8 }],
      events: [BEAT('approach', 'ethan', 0, 5.2, 'he brings her the last of the way', 'weariness'), P('ethan', 'weariness', 0.5), SND('clatter', 0.4), SND('clatter', 1.3), SND('clatter', 2.2), P('debbie', 'guarded', 2.4), SAY('ethan', "Let's go home, Debbie.", 2.6, 1.8), SND('clatter', 3.1)] },
    { name: 'Home', on: 'debbie', pos: [1.4, 1.9, -1.6], tgt: [-3.0, 1.6, 6.0], lens: 40,   /* on the porch between the door and the east post: no post in the frame, the family in silhouette in front, the yard and Ethan beyond */ sec: 7.3, shift: 'home', look: PORCH,
      acts: [{ who: 'ethan', leave: true, look: 'martha' }, { who: 'debbie', leave: true, to: 'porch-d', walk: true, at: 0.6 }, { who: 'martha', to: 'porch-m', walk: true, at: 3.4 }, { who: 'aaron', look: 'debbie' }, { who: 'ethan-horse', to: 'pasture', speed: 0.35, at: 2.4 }],
      events: [BEAT('home', 'debbie', 0, 7.3, 'the girl goes up to the porch; the woman who waited turns and takes her in', 'tenderness'), LOOK('ethan', 'martha', 0.3), LOOK('martha', 'debbie', 0.6, true), P('martha', 'tenderness', 1.0), SAY('martha', 'Debbie.', 2.6, 1.0), P('aaron', 'joy', 3.0), P('ethan', 'guarded', 1.0)] },
    { name: 'Inside', on: 'ethan', pos: INSIDE, pos2: [0.35, 1.9, -6.6], tgt: DOOR, lens: 50, lens2: 44, sec: 9.75, shift: 'inside', look: ROOM,
      acts: [{ who: 'debbie', to: 'room-d', walk: true, at: 0.3 }, { who: 'martha', to: 'room-m', walk: true, at: 1.3 }, { who: 'aaron', to: 'room-a', walk: true, at: 2.6 }, { who: 'ethan', to: 'door-out', walk: true, at: 1.5 }],
      events: [BEAT('inside', 'ethan', 0, 9.75, 'they all go in past him; he comes to the door and stops', 'restraint'), SND('footstep', 0.8), SND('footstep', 1.4), SND('footstep', 2.6), SND('footstep', 3.2), LOOK('ethan', 'martha', 6.2), P('ethan', 'weariness', 6.0)] },
    { name: 'The leaving', on: 'ethan', pos: INSIDE, tgt: DOOR, lens: 50, sec: 7.05, shift: 'leaving', look: ROOM,
      acts: [{ who: 'ethan', to: 'desert', walk: true, at: 0.6 }],
      events: [BEAT('leaving', 'ethan', 0, 7.05, 'on the music\'s break he turns, and walks back into the desert', 'restraint'), SET('ethan', 'head.yaw', 0, 0.1, 0.4), SET('ethan', 'torso.twist', 0, 0.15, 0.4), SET('ethan', 'root.yaw', 0, 0.2, 0.4), SND('footstep', 1.0), SND('footstep', 1.5), SND('footstep', 2.0), SND('whoosh', 2.6)] },
    { title: 'THE SEARCHERS', style: 'card', sec: 2.0, name: 'the card' }] };   /* the cue's tail plays out over the card */

/* ── The sheet of nine: every candidate registered with its set, so it can be laid, planned and inspected now. The three with programs stand on real models
   (world/models/*.js, built and audited by tools/model.js: every piece stud-connected, a manual at play/manual.html?model=<model>); the other six still stand on the scene files they came from. ── */
Film.CASES = [
  { key: 'case-grocery', name: 'The List', source: 'world/models/supermarket.js', set: 'supermarket', model: 'supermarket', size: '62 x 47.5 m', cast: ['homer', 'maggie', 'flanders', 'bart', 'lisa', 'citizen'], status: 'program', beats: ['the store', 'the list', 'green', 'aisle three', 'caught', 'the belt', 'the record'], play: 'cinerium.html?film=case-grocery&shop' },
  { key: 'case-ewoks', name: 'The Forest Skirmish', source: 'world/models/forest-clearing.js', set: 'forest-clearing', model: 'forest-clearing', size: '32 x 32 m', cast: ['ewok', 'robot'], status: 'program', beats: ['the lines', 'the intrusion', 'the ambush', 'the train', 'the reversal', 'from above'] },
  { key: 'case-plato', name: 'The Cave', source: 'world/models/cave-of-shadows.js', set: 'cave-of-shadows', model: 'cave-of-shadows', size: '32 x 24 m', cast: ['shade', 'citizen', 'hauler'], status: 'program', beats: ['the shadows', 'the puppeteers', 'the turn', 'the climb', 'the sun', 'the return'] },
  { key: 'case-band', name: 'Band Class', source: 'simpsons_scene_06_band.mpd', set: 'simpsons-band', size: '10 x 5 m', cast: ['lisa', 'bart', 'citizen'], status: 'planned', beats: ['the count-in', 'the wrong tempo', 'the interruption', 'the solo', 'the reaction', 'the downbeat'] },
  { key: 'case-searchers', name: 'The Searchers', source: 'world/models/homestead.js', set: 'homestead', model: 'homestead', models: ['homestead', 'buttes'], size: '24 x 24 m', cast: ['ethan', 'martha', 'aaron', 'debbie'], status: 'program', beats: ['the door', 'two figures', 'Martha', 'the approach', 'home', 'inside', 'the leaving'] },
  { key: 'case-undaunted', name: 'Fort Mandan', source: 'Brickfilm_Studio_Kit/undaunted_scene_2_ohio_fort_mandan.mpd', set: 'undaunted-fort-mandan', size: '13 x 16 m', cast: ['hauler', 'commander', 'rider'], status: 'planned', beats: ['the boats', 'the palisade', 'the winter', 'the guide', 'the map', 'the river again'], note: 'one of seven Undaunted files; the others are the title, Jefferson, Great Falls, the Bitterroot, the Pacific and the credits' },
  { key: 'case-ithaca-cove', name: 'Ithaca Cove', source: 'odyssey-production/locations/ithaca-cove.mpd', set: 'ithaca-cove', size: '70 x 60 m', cast: ['odysseus-wet', 'athena', 'sailor'], status: 'planned', beats: ['the arrival asleep', 'the Phaeacians gone', 'the mist', 'the goddess', 'the concealment of the goods', 'the road up'] },
  { key: 'case-ogygia', name: 'Ogygia Grove', source: 'odyssey-production/locations/ogygia-grove.mpd', set: 'ogygia-grove', size: '70 x 60 m', cast: ['odysseus', 'calypso', 'hermes'], status: 'planned', beats: ['the shore', 'the messenger', 'the order', 'the axe', 'the raft', 'the leaving'], note: 'the raft scene in the play set covers the same beats on the Enchanted Island; this is the authored grove' },
  { key: 'case-rocket', name: 'The Launch', source: 'rocket_launch_scene.ldr', set: 'rocket-launch', size: '13 x 9 m', cast: ['citizen', 'pilot', 'c3po'], status: 'planned', beats: ['the countdown', 'the hold', 'the small problem', 'the fix', 'the launch', 'the unexpectedly small departure'] },
];
Film.PLAY_SCENES = (Film.PLAY_SCENES || []).concat(['case-grocery', 'case-ewoks', 'case-plato', 'case-searchers']);
})();
