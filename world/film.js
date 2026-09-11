/* world/film.js — the world as a film space: shots in the MENTO grammar, a camera that follows their keys, the reel, the take.

   A shot is one or more keys (POS, TGT, LENS) and a length in seconds: one key holds, two or more move the camera
   along a centripetal Catmull-Rom path the way mento-373 does, with the target and the field of view blended per
   segment. The reel is the shots in order; playing it cuts from one to the next. A take draws every rendered frame
   into a canvas of the chosen aspect and size and hands it to a MediaRecorder while the world is stepped exactly
   1/fps per frame, so the film has the right length however slow the phone is. Words become shots through the
   model (FILM_SPEC) or, without a key, through a small parser of the same words; either way a semantic shot (a
   subject, a frame, a bearing, a move) is staged into keys from what stands in the world.

   The text form is the MENTO grammar in the LDraw frame (y down, z flipped: world (x, y, z) is LDraw (x, -y, -z)):
     0 !MENTO SHOT "name" POS x y z TGT x y z LENS f [SEC s]      a shot and its first key
     0 !MENTO KEY POS x y z TGT x y z LENS f                        a further key of the shot above (a move)
     0 !MENTO LIGHT "name" TYPE SUN|POINT|AREA POS … [TGT …] COLOR #hex INTENSITY n [DECAY n] [SHADOWS TRUE]
     0 !MENTO ACT "me" WALK x z | DRIVE x z | AHEAD m | RIDE word | TIE | FLY | FIRE | SABER | LEAVE   what the player does during the shot
     0 !MENTO SET WORLD tatooine AS luke TIME dusk WEATHER clear      applied when the next shot starts (a planet, a character, a sky)
     0 !MENTO TITLE "text" STYLE card|logo SEC 3                       a title card: black, the words centred
     0 !MENTO PLAN {json}                                              the shot's words (subject, frame, bearing, move): staged again when it starts, so it follows a new planet or character
     0 !MENTO TIME day|dawn|dusk|night                               the sky for the film
     0 !MENTO ASPECT 16:9 FPS 24                                     the frame
     0 !MENTO ACTOR "atat-1" KIT atat AT x z HEADING deg              something the film drives: a kit or a KIND vehicle, or CROWD rebel N 20 R m
     0 !MENTO BUILD "trench" AT x z {program}                          a DSL program laid at a point for the scene
     0 !MENTO ACT "atat-1" MARCH deg speed FIRE HEAVY EVERY s AIM "trench"   an actor's act for the shot (also TO x z, ORBIT "who" R m, PASS "who", HALT, LAND, ALT m)
     0 !MENTO EVENT TRIP "atat-1" AT sec OVER s                        what happens at a second of the shot: CABLE, TRIP, BLAST, TOPPLE, HANG, DROP, STRIKE, ROUT, CRASH, SHAKE, FLASH
   A SHOT line can end with FOLLOW: its keys are re-staged around the subject every step, so a flying TIE stays in the frame.
   Frames: wide, medium, close, low, aerial, shoulder, pov (from the subject's seat, looking ahead), under (beneath a walker, looking up at its head).
   LENS is the vertical field of view in degrees, as mento-373 reads it. */
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ASPECTS = { '16:9': 16 / 9, '2.39': 2.39, '4:3': 4 / 3, '9:16': 9 / 16 };
  const SIZES = { '720p': 720, '1080p': 1080 };
  const BEAR = { n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315 };            // where the camera stands, seen from the subject: north is -z, east is +x
  const FRAMES = { wide: 3, medium: 1.5, close: 0.8, aerial: 2.2, low: 1.6, shoulder: 0 };      // the camera's distance as a multiple of the subject's size
  const LENS = { wide: 60, medium: 45, close: 35, aerial: 50, low: 55, shoulder: 50 };
  const MOVES = ['hold', 'push', 'pull', 'orbit', 'crane', 'track'];
  const num = s => { const v = parseFloat(s); return Number.isFinite(v) ? v : 0; };
  const fmt = v => String(+v.toFixed(2));
  const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

  const FILM_SPEC = `You are a film director working inside a LEGO world. You answer ONLY with a JSON object {"name": string, "set": null|"forest"|"snowfield"|"desert", "story": {...}, "shots": [...]}: a shot list that a camera compiler stages into real camera keys.
"set" names a built set that replaces the place when the brief needs one (a redwood forest, a snowfield, a desert); null keeps the place as it is. "story" is a LEGOS block: {"title", "description", "location", "entities": [{"id", "type", "name", "traits": [], "location"}], "goals": [{"id", "name", "owner"}], "obstacles": [{"id", "name", "affects"}], "shifts": [{"id", "name", "causes", "results_in"}], "relations": ["[morphism] a -> b"], "timeline": [{"id", "description", "scenes": [{"id", "description", "entities": []}]}]}; every shot names its "shift" (the id of the shift it shows).
Each shot is {"name": string, "on": subject, "frame": "wide|medium|close|aerial|low|shoulder", "from": "n|ne|e|se|s|sw|w|nw", "lens": 20-90, "sec": 1-30, "move": "hold|push|pull|orbit|crane|track", "act": null | {"who": "me", "walk": [x, z]} | {"who": "me", "drive": [x, z]}}.
The subject "on" is "me" (the player's figure), a landmark id from the scene list, a building name from the scene list, a kit or vehicle word (atat, atst, xwing, shuttle, speeder, car, truck, bus) or [x, z] in metres (x east, z south, north is negative z).
"frame" is how big the subject is in the frame; "from" is where the camera stands seen from the subject; "lens" is the vertical field of view in degrees (wide 60, normal 45, long 30); "move" adds a second key: push halves the distance, pull doubles it, orbit turns a quarter around the subject, crane rises to an aerial view, track slides sideways.
An act makes the player's figure walk (or the ride drive) to a point during the shot. Keep the film to 2-8 shots, name each like a storyboard, vary frames and bearings, and answer with the JSON only.`;

  /** The trailer of the first film, as words the world stages where it stands: the droids in the desert, the twin suns, a landspeeder, the smuggler and the Wookiee, the princess, the troopers, the Dark Lord, a TIE, the run on the station. */
  const TRAILERS = {
    'a-new-hope': { name: 'A New Hope', shots: [
      { score: 'dread', title: 'A long time ago in a galaxy far,\nfar away....', style: 'card', sec: 4, world: 'tatooine', as: 'c3po', time: 'day', events: [{ what: 'LINE', who: 'narrator', text: 'A long time ago, in a galaxy far, far away.', at: 0.3 }] },
      { score: 'fanfare', title: 'STAR WARS', style: 'logo', sec: 3 },
      { name: 'The droid in the desert', score: 'hero', on: 'me', frame: 'wide', from: 'e', move: 'push', sec: 5, act: { ahead: 24 }, events: [{ what: 'LINE', who: 'narrator', text: 'A droid carries a message across the sand.', at: 0.6 }, { what: 'SOUND', who: 'ping', at: 3.5 }] },
      { name: 'A farm boy', as: 'luke', time: 'dusk', on: 'me', frame: 'shoulder', from: 's', move: 'hold', sec: 4, act: { ahead: 6 }, events: [{ what: 'LINE', who: 'narrator', text: 'A farm boy looks to the horizon.', at: 0.5 }] },
      { name: 'The twin suns', on: 'me', frame: 'low', from: 'w', move: 'crane', sec: 4 },
      { name: 'The landspeeder', score: 'chase', time: 'day', on: 'me', frame: 'medium', from: 'e', move: 'track', sec: 5, follow: true, act: { ride: 'speeder', ahead: 80, fly: true } },
      { name: 'The smuggler', score: 'hero', as: 'han', on: 'me', frame: 'close', from: 'sw', move: 'push', sec: 3, act: { leave: true, ahead: 3 }, events: [{ what: 'LINE', who: 'han', text: 'You need a ship? I have a ship.', at: 0.4 }] },
      { name: 'The Wookiee', as: 'chewbacca', on: 'me', frame: 'medium', from: 's', move: 'orbit', sec: 3, events: [{ what: 'LINE', who: 'chewbacca', text: 'Rrraaarrgh.', at: 0.3 }] },
      { name: 'The princess', as: 'leia', on: 'me', frame: 'close', from: 'n', move: 'pull', sec: 3, events: [{ what: 'LINE', who: 'leia', text: 'Help us. You are our only hope.', at: 0.3 }] },
      { name: 'Stormtroopers', score: 'march', as: 'stormtrooper', on: 'me', frame: 'wide', from: 'n', move: 'push', sec: 4, act: { ahead: 10, fire: true }, events: [{ what: 'LINE', who: 'trooper', text: 'Halt. Search every ship.', at: 0.5 }] },
      { score: 'dread', title: 'The Empire', style: 'card', sec: 2, world: 'deathstar', as: 'vader', time: 'night', events: [{ what: 'LINE', who: 'narrator', text: 'And an empire that rules by fear.', at: 0.3 }] },
      { name: 'The Dark Lord', on: 'me', frame: 'medium', from: 's', move: 'push', sec: 4, act: { saber: true, ahead: 4 }, events: [{ what: 'SOUND', who: 'breath', at: 0.2 }, { what: 'LINE', who: 'vader', text: 'I find your lack of faith disturbing.', at: 1.6 }] },
      { name: 'The TIE', score: 'chase', on: 'tie', frame: 'wide', from: 'sw', move: 'hold', sec: 6, follow: true, act: { tie: true, fly: true, fire: true } },
      { name: 'The run', as: 'luke', on: 'me', frame: 'wide', from: 's', move: 'hold', sec: 6, follow: true, act: { leave: true, ride: 'xwing', ahead: 120, fly: true, fire: true }, events: [{ what: 'LINE', who: 'luke', text: 'Stay on target.', at: 1.0 }] },
      { title: 'STAR WARS', style: 'logo', sec: 2 },
      { score: 'end', title: 'A New Hope\nmade with word to momento', style: 'card', sec: 3, events: [{ what: 'LINE', who: 'narrator', text: 'A new hope.', at: 0.4 }] },
    ] },
  };

  /** The walker assault on Hoth from the storymap: eleven patches, four walkers marching on the trench, two snowspeeders, a cable, a trip, a hatch charge, a topple, the trench overrun. Metres from the player's spawn; z south. */
  const SCENES = {
    'hoth-atat': { name: 'Hoth: the walker assault', world: 'hoth', as: 'pilot', ground: 'flat', weather: 'snow', time: 'day',
      actors: [
        { name: 'atat-1', kit: 'atat', x: -45, z: -290, heading: 180 }, { name: 'atat-2', kit: 'atat', x: 10, z: -335, heading: 180 }, { name: 'atat-3', kit: 'atat', x: 70, z: -290, heading: 180 }, { name: 'atat-4', kit: 'atat', x: 130, z: -350, heading: 180 },
        { name: 'speeder-1', kind: 'speeder', len: 7, col: 71, x: -45, z: -170, heading: 0, alt: 6 }, { name: 'speeder-2', kind: 'speeder', len: 7, col: 71, x: 90, z: -240, heading: 270, alt: 8 },
        { name: 'rebels', crowd: true, kind: 'rebel', n: 20, x: 0, z: -62, r: 25 },
      ],
      set: { kind: 'snowfield', r: 320, seed: 3 },
      builds: [{ name: 'bunker-1', x: -48, z: -66, program: { name: 'bunker', ops: [{ op: 'tower', x: 0, z: 0, r: 4, h: 3, col: 15, round: true, crenels: false }, { op: 'slab', x: 0, z: 0, w: 9, d: 9, y: 3, plates: 1, col: 15 }, { op: 'box', x: 0, z: -5, w: 3, d: 2, h: 2, col: 72 }] } }, { name: 'bunker-2', x: 58, z: -70, program: { name: 'bunker', ops: [{ op: 'tower', x: 0, z: 0, r: 4, h: 3, col: 15, round: true, crenels: false }, { op: 'slab', x: 0, z: 0, w: 9, d: 9, y: 3, plates: 1, col: 15 }, { op: 'box', x: 0, z: -5, w: 3, d: 2, h: 2, col: 72 }] } },
        { name: 'trench', x: -12, z: -75, program: { name: 'trench', ops: [{ op: 'wall', from: [0, 0], to: [60, 0], y: 0, h: 3, col: 15, thick: 2 }, { op: 'wall', from: [0, 5], to: [60, 5], y: 0, h: 2, col: 15 }, { op: 'tower', x: 30, z: -7, r: 2, h: 5, col: 71, round: true, crenels: false }, { op: 'slab', x: 27, z: -10, w: 6, d: 6, y: 5, plates: 1, col: 72 }, { op: 'box', x: 8, z: -4, w: 1, d: 1, y: 0, h: 8, col: 72 }, { op: 'box', x: 52, z: -4, w: 1, d: 1, y: 0, h: 8, col: 72 }] } }],
      shots: [
        { name: 'P001 Target sensor to horizon phalanx', score: 'dread', title: 'Target sensor to horizon phalanx', style: 'hud', on: 'atat-2', frame: 'wide', from: 's', lens: 40, sec: 4, acts: [{ who: 'atat-1', march: 180, speed: 0.6 }, { who: 'atat-2', march: 180, speed: 0.6 }, { who: 'atat-3', march: 180, speed: 0.6 }, { who: 'atat-4', march: 180, speed: 0.6 }], events: [{ what: 'LINE', who: 'rogue', text: 'Echo Station Five Seven. Walkers on the north ridge. Four of them.', at: 0.6 }] },
        { name: 'P001 The phalanx on the ridge', score: 'march', on: 'atat-2', frame: 'wide', from: 'sw', lens: 40, sec: 6, events: [{ what: 'LINE', who: 'comms', text: 'Copy, Rogue Leader. Hold them off the shield generator as long as you can.', at: 0.5 }] },
        { name: 'P002 Speeder windshield', score: 'chase', on: 'me', frame: 'pov', sec: 4, act: { ride: 'speeder-1', ahead: 140, fly: true }, acts: [{ who: 'atat-1', march: 180, speed: 0.6, fire: true, heavy: true, every: 1.2, aim: 'trench' }], events: [{ what: 'LINE', who: 'rogue', text: 'Rogue Group, form up on me. Attack pattern delta. Go now.', at: 0.3 }] },
        { name: 'P002 Heavy volley', score: 'march', on: 'atat-1', frame: 'low', from: 'n', sec: 5 },
        { name: 'P003 Head traverse', on: 'atat-1', frame: 'under', sec: 4, events: [{ what: 'LINE', who: 'rogue', text: 'That armour is too strong for blasters. Go for the legs.', at: 0.4 }] },
        { name: 'P003 Aerial survey', score: 'tension', on: 'atat-1', frame: 'aerial', from: 'n', sec: 5, acts: [{ who: 'speeder-2', pass: 'atat-1', alt: 12, speed: 1 }], events: [{ what: 'LINE', who: 'rogue', text: 'Rogue Three, set your harpoon. I will cover you.', at: 0.5 }] },
        { name: 'P004 Speed harpoon', on: 'speeder-2', frame: 'wide', from: 'e', sec: 4, follow: true, acts: [{ who: 'speeder-2', orbit: 'atat-1', r: 22, alt: 6, speed: 0.9 }], events: [{ what: 'LINE', who: 'rogue', text: 'Coming round. Cable out.', at: 0.6 }] },
        { name: 'P004 Leg binding', on: 'atat-1:leg-rl', frame: 'close', from: 'e', sec: 5, events: [{ what: 'LINE', who: 'rogue', text: 'The cable is holding. Once more round.', at: 1.0 }, { what: 'CABLE', who: 'speeder-2', who2: 'atat-1', at: 0, turns: 3, over: 4 }] },
        { name: 'P005 Joint entanglement to catastrophic crash', score: 'march', on: 'atat-1', frame: 'wide', from: 'e', sec: 12, follow: true, events: [{ what: 'LINE', who: 'rogue', text: 'Pull up. Pull up now.', at: 0.5 }, { what: 'LINE', who: 'comms', text: 'One walker down.', at: 6.5 }, { what: 'TRIP', who: 'atat-1', at: 2, over: 1.6 }, { what: 'CRASH', who: 'speeder-1', at: 0 }], acts: [{ who: 'speeder-2', pass: 'atat-1', alt: 10, speed: 1 }] },
        { name: 'P006 Advancing battery', score: 'dread', on: 'atat-2', frame: 'wide', from: 'sw', sec: 4 },
        { name: 'P006 Chin cannon barrage', on: 'atat-2', frame: 'low', from: 'front', sec: 5, acts: [{ who: 'atat-2', march: 180, speed: 0.6, fire: true, heavy: true, every: 0.8, aim: 'trench' }], events: [{ what: 'LINE', who: 'rogue', text: 'Rogue Two, I am hit. I am going in.', at: 1.2 }] },
        { name: 'P007 Wreckage stomp', score: 'tension', on: 'speeder-1', frame: 'low', from: 'w', sec: 4 },
        { name: 'P007 Pilot cable egress', on: 'atat-2', frame: 'under', sec: 5, events: [{ what: 'LINE', who: 'luke', text: 'Grab the line. I am going under it.', at: 0.4 }, { what: 'HANG', who: 'me', who2: 'atat-2', at: 0, over: 0.3 }, { what: 'DROP', who: 'me', at: 1.5 }] },
        { name: 'P008 Phalanx advance to infantry rout', score: 'march', on: 'atat-3', frame: 'wide', from: 's', lens: 24, sec: 5, events: [{ what: 'LINE', who: 'comms', text: 'The trench is lost. Fall back to the transports.', at: 0.8 }, { what: 'ROUT', who: 'rebels', who2: 'atat-3', at: 0 }] },
        { name: 'P008 Luke sprints', on: 'me', frame: 'low', from: 'e', sec: 4, follow: true, act: { ahead: 15 } },
        { name: 'P009 Ventral ascension', score: 'tension', on: 'me', frame: 'wide', from: 'e', sec: 4, follow: true, events: [{ what: 'HANG', who: 'me', who2: 'atat-3', at: 0, over: 3 }] },
        { name: 'P009 Thermal detonation', on: 'atat-3', frame: 'under', sec: 5, events: [{ what: 'SOUND', who: 'zip', at: 0.2 }, { what: 'DROP', who: 'me', at: 2.5 }, { what: 'BLAST', who: 'atat-3', part: 'belly', at: 3, scale: 1.5 }] },
        { name: 'P010 Neck combustion to flank topple', score: 'march', on: 'atat-3', frame: 'wide', from: 'e', sec: 9, follow: true, events: [{ what: 'BLAST', who: 'atat-3', part: 'neck', at: 2 }, { what: 'TOPPLE', who: 'atat-3', at: 3, over: 2 }] },
        { name: 'P011 Trench bombardment', score: 'dread', on: 'trench', frame: 'medium', from: 's', lens: 40, sec: 4, weather: 'blizzard', events: [{ what: 'LINE', who: 'comms', text: 'Echo Base, they have broken through. Begin the evacuation.', at: 0.5 }, { what: 'STRIKE', who: 'trench', at: 0, every: 0.7 }] },
        { name: 'P011 Base overrun', score: 'march', on: 'atat-4', frame: 'low', from: 'front', move: 'push', sec: 4, acts: [{ who: 'atat-4', march: 180, speed: 0.6, fire: true, heavy: true, every: 1, aim: 'trench' }] },
      ] },
    'endor-bikes': { name: 'Endor: the speeder chase', world: 'endor', as: 'leia', ground: 'flat', time: 'day',
      set: { kind: 'forest', r: 200, seed: 11, corridor: [[0, 0], [6, -40], [-4, -85], [8, -130], [-6, -175], [4, -215], [30, -250], [70, -240], [86, -200], [76, -150], [86, -100], [70, -50], [40, -16], [0, 0]] },
      story: { title: 'The speeder chase', description: 'Two scouts spot the strike team. Leia and Luke take a bike after them so the outpost is not warned; the chase splits, the forest wins.', location: 'Endor: a redwood corridor from the outpost basin to the staging trunk',
        entities: [{ id: 'leia', type: 'figure', name: 'Leia', traits: ['rider', 'calm'] }, { id: 'luke', type: 'figure', name: 'Luke', traits: ['rider', 'saber'] }, { id: 'han', type: 'figure', name: 'Han', traits: ['tackle'] }, { id: 'scouts', type: 'crowd', name: 'Scout troopers', traits: ['74-Z bikes', 'blasters'] }, { id: 'forest', type: 'location', name: 'Redwood corridor', traits: ['trunks', 'logs', 'ferns'] }, { id: 'camp', type: 'location', name: 'Staging trunk', traits: ['Chewbacca', 'C-3PO', 'R2-D2', 'commandos'] }],
        goals: [{ id: 'g1', name: 'stop the scouts warning the outpost', owner: 'leia' }, { id: 'g2', name: 'stay on the bike', owner: 'luke' }, { id: 'g3', name: 'reach the outpost', owner: 'scouts' }],
        obstacles: [{ id: 'o1', name: 'trunks and logs at speed', affects: ['leia', 'luke', 'scouts'] }, { id: 'o2', name: 'blaster fire from behind', affects: ['leia'] }, { id: 'o3', name: 'a scout on the handlebars', affects: ['luke'] }],
        shifts: [{ id: 'sighting', name: 'The sighting', causes: 'two scouts see the team', results_in: 'the pursuit' }, { id: 'pursuit', name: 'Into the trees', causes: 'Leia takes a bike', results_in: 'the chase' }, { id: 'first-kill', name: 'The first scout goes down', causes: 'a shove', results_in: 'a tree' }, { id: 'split', name: 'The split', causes: 'two more scouts', results_in: 'Luke takes the second bike' }, { id: 'cannon', name: 'The cannon', causes: 'Luke closes on a scout', results_in: 'a fireball' }, { id: 'leia-down', name: 'Leia goes down', causes: 'a scout at her side', results_in: 'the log' }, { id: 'brawl', name: 'The handlebar brawl', causes: 'a scout alongside Luke', results_in: 'the trunk ahead' }, { id: 'somersault', name: 'The somersault', causes: 'a trunk dead ahead', results_in: 'Luke on foot' }, { id: 'saber', name: 'The saber', causes: 'a turnabout and a charge', results_in: 'a severed bike' }, { id: 'camp', name: 'The camp', causes: 'the corridor walked back', results_in: 'the plan' }],
        relations: ['[pursues] leia -> scouts', '[rides with] luke -> leia', '[tackles] han -> scout', '[splits from] luke -> leia', '[shoves] luke -> scouts', '[fires at] scouts -> leia', '[deflects] luke -> scouts', '[gathers] camp -> luke'],
        timeline: [{ id: 't1', description: 'the basin: sighting, mount, tackle', scenes: [{ id: 'P001', description: 'two scouts in the ferns', entities: ['leia', 'luke', 'scouts'] }, { id: 'P002', description: 'Han tackles the third scout', entities: ['han', 'scouts'] }] }, { id: 't2', description: 'the corridor: the chase and the split', scenes: [{ id: 'P003-P007', description: 'the first scout shoved into a tree', entities: ['leia', 'luke', 'scouts'] }, { id: 'P008-P011', description: 'Luke takes the second bike and the cannon', entities: ['luke', 'scouts'] }] }, { id: 't3', description: 'the log and the trunk', scenes: [{ id: 'P012-P016', description: 'Leia and the scout at the log', entities: ['leia', 'scouts'] }, { id: 'P017-P022', description: 'the brawl, the somersault, the saber', entities: ['luke', 'scouts'] }] }, { id: 't4', description: 'the camp', scenes: [{ id: 'P023-P027', description: 'the staging trunk and the plan', entities: ['luke', 'leia', 'han', 'camp'] }] }] },
      actors: [
        { name: 'bike-1', kind: 'speeder', len: 7, col: 71, x: -6, z: 5, heading: 0, alt: 2.5 }, { name: 'bike-2', kind: 'speeder', len: 7, col: 71, x: 8, z: 7, heading: 0, alt: 2.5 },
        { name: 'scout-1', kind: 'speeder', len: 7, col: 15, x: 4, z: -22, heading: 0, alt: 2.5, rider: 'trooper' }, { name: 'scout-2', kind: 'speeder', len: 7, col: 15, x: -3, z: -30, heading: 0, alt: 2.5, rider: 'trooper' },
        { name: 'scout-3', kind: 'speeder', len: 7, col: 15, x: 3, z: -120, heading: 0, alt: 2.5, rider: 'trooper' }, { name: 'scout-4', kind: 'speeder', len: 7, col: 15, x: -5, z: -160, heading: 0, alt: 2.5, rider: 'trooper' },
        { name: 'scout-g', figure: 'trooper', x: 15, z: -7, heading: 200 }, { name: 'luke', figure: 'luke', x: -3, z: 3, heading: 0 }, { name: 'han', figure: 'han', x: 9, z: 1, heading: 20 },
        { name: 'chewbacca', figure: 'chewbacca', x: -30, z: -34, heading: 120, pose: 'crouch' }, { name: 'c3po', figure: 'c3po', x: -24, z: -27, heading: 150 }, { name: 'commandos', crowd: true, kind: 'rebel', n: 6, x: -30, z: -30, r: 5 },
      ],
      builds: [{ name: 'r2', x: -21, z: -29, program: { name: 'r2', ops: [{ op: 'tower', x: 0, z: 0, r: 1, h: 2, col: 15, round: true, crenels: false }, { op: 'slab', x: 0, z: 0, w: 2, d: 2, y: 2, plates: 1, col: 1 }] } }],
      shots: [
        { name: 'P001 Over there', score: 'tension', on: 'me', frame: 'medium', from: 'n', lens: 40, sec: 4, shift: 'sighting', events: [{ what: 'LINE', who: 'leia', text: 'Over there. Two more of them.', at: 0.6, for: 3 }] },
        { name: 'P001 Two scouts go', score: 'chase', on: 'scout-1', frame: 'wide', from: 's', lens: 45, sec: 4, follow: true, shift: 'sighting', acts: [{ who: 'scout-1', route: 'corridor', speed: 0.55 }, { who: 'scout-2', route: 'corridor', speed: 0.55 }], events: [{ what: 'LINE', who: 'luke', text: 'I see them. Wait, Leia.', at: 0.5, for: 3 }] },
        { name: 'P001 Leia mounts', on: 'bike-1', frame: 'medium', from: 'e', lens: 40, sec: 3, shift: 'pursuit', act: { ride: 'bike-1' }, acts: [{ who: 'luke', ride: 'bike-1' }] },
        { name: 'P002 Into the trees', on: 'me', frame: 'wide', from: 's', lens: 50, sec: 5, follow: true, shift: 'pursuit', act: { route: 'corridor', speed: 0.6 }, acts: [{ who: 'han', to: [13, -5], run: true }] },
        { name: 'P002 Han tackles the scout', on: 'scout-g', frame: 'medium', from: 'w', lens: 40, sec: 4, shift: 'pursuit', acts: [{ who: 'han', to: [14, -6], run: true }], events: [{ what: 'LINE', who: 'han', text: 'Hey. Over here.', at: 0.3 }, { what: 'TACKLE', who: 'han', who2: 'scout-g', at: 1.3 }] },
        { name: 'P003 Hang on', on: 'me', frame: 'close', from: 'front', lens: 35, sec: 4, follow: true, shift: 'pursuit', act: { route: 'corridor', speed: 0.6 }, events: [{ what: 'LINE', who: 'leia', text: 'Hang on.', at: 0.4, for: 2 }] },
        { name: 'P003 Through the trunks', on: 'me', frame: 'pov', sec: 5, follow: true, shift: 'pursuit', act: { route: 'corridor', speed: 0.9 } },
        { name: 'P003 Frontal tracking', on: 'me', frame: 'medium', from: 'front', lens: 40, sec: 4, follow: true, shift: 'pursuit', act: { route: 'corridor', speed: 0.7 } },
        { name: 'P004 Over the log', on: 'me', frame: 'pov', sec: 4, follow: true, shift: 'pursuit', act: { route: 'corridor', speed: 0.9 } },
        { name: 'P004 Lateral', on: 'me', frame: 'wide', from: 'e', lens: 45, sec: 4, follow: true, shift: 'pursuit', act: { route: 'corridor', speed: 0.7 } },
        { name: 'P004 On the scout', on: 'scout-1', frame: 'medium', from: 'behind', lens: 40, sec: 4, follow: true, shift: 'pursuit', act: { chase: 'scout-1', behind: 10 } },
        { name: 'P005 Keep on that one', on: 'me', frame: 'medium', from: 'ne', lens: 40, sec: 4, follow: true, shift: 'pursuit', act: { chase: 'scout-1', behind: 8 }, events: [{ what: 'LINE', who: 'luke', text: 'Keep on that one. I will take these two.', at: 0.5, for: 3 }] },
        { name: 'P005 Weaving', on: 'me', frame: 'wide', from: 'nw', lens: 50, sec: 4, follow: true, shift: 'pursuit', act: { alongside: 'scout-2', side: 3 } },
        { name: 'P005 The vanes', on: 'bike-1', frame: 'close', from: 'e', lens: 35, sec: 3, follow: true, shift: 'pursuit', act: { alongside: 'scout-1', side: 3 } },
        { name: 'P006 Side by side', on: 'scout-1', frame: 'medium', from: 'front', lens: 40, sec: 4, follow: true, shift: 'first-kill', act: { alongside: 'scout-1', side: 2.5 }, events: [{ what: 'SHOVE', who: 'scout-1', at: 2.2 }] },
        { name: 'P007 Into the tree', on: 'scout-1', frame: 'wide', from: 'e', lens: 45, sec: 5, follow: true, shift: 'first-kill', act: { route: 'corridor', speed: 0.6 }, events: [{ what: 'SOUND', who: 'whoosh', at: 0.2, k: 1.2 }, { what: 'CRASH', who: 'scout-1', into: 'tree', at: 0.3 }, { what: 'EXPLODE', who: 'scout-1', at: 3.2 }] },
        { name: 'P007 Luke looks back', on: 'luke', frame: 'close', from: 'w', lens: 35, sec: 3, follow: true, shift: 'first-kill', act: { route: 'corridor', speed: 0.6 } },
        { name: 'P007 Under the log', on: 'me', frame: 'pov', sec: 4, follow: true, shift: 'first-kill', act: { route: 'corridor', speed: 0.9 } },
        { name: 'P008 Two more', on: 'me', frame: 'wide', from: 's', lens: 50, sec: 4, follow: true, shift: 'split', act: { route: 'corridor', speed: 0.6 }, acts: [{ who: 'scout-3', route: 'corridor', speed: 0.5 }, { who: 'scout-4', route: 'corridor', speed: 0.5 }, { who: 'han', to: [-26, -31], run: true }] },
        { name: 'P008 The split', on: 'bike-2', frame: 'medium', from: 'e', lens: 40, sec: 5, follow: true, shift: 'split', act: { route: 'corridor', speed: 0.6 }, acts: [{ who: 'luke', leave: true, ride: 'bike-2' }, { who: 'bike-2', route: 'corridor', speed: 0.6 }] },
        { name: 'P009 Luke banks right', on: 'luke', frame: 'medium', from: 'w', lens: 40, sec: 4, follow: true, shift: 'cannon', acts: [{ who: 'bike-2', chase: 'scout-3', behind: 9 }], events: [{ what: 'LINE', who: 'luke', text: 'Take the one on the left.', at: 0.4, for: 2.5 }] },
        { name: 'P010 The cannon', on: 'bike-2', frame: 'close', from: 'behind', lens: 35, sec: 3, follow: true, shift: 'cannon', acts: [{ who: 'bike-2', chase: 'scout-3', behind: 8, fire: true, aim: 'scout-3', every: 0.5 }] },
        { name: 'P010 Fireball', on: 'scout-3', frame: 'wide', from: 'behind', lens: 45, sec: 5, follow: true, shift: 'cannon', acts: [{ who: 'bike-2', chase: 'scout-3', behind: 8, fire: true, aim: 'scout-3', every: 0.5 }], events: [{ what: 'EXPLODE', who: 'scout-3', at: 1.6 }] },
        { name: 'P011 Under the raised log', on: 'bike-2', frame: 'low', from: 'front', lens: 50, sec: 4, follow: true, shift: 'cannon', acts: [{ who: 'bike-2', route: 'corridor', speed: 0.6 }] },
        { name: 'P011 Leia alone', score: 'tension', on: 'me', frame: 'medium', from: 'ne', lens: 40, sec: 4, follow: true, shift: 'leia-down', act: { route: 'corridor', speed: 0.6 } },
        { name: 'P012 A scout behind her', score: 'chase', on: 'me', frame: 'wide', from: 'e', lens: 45, sec: 4, follow: true, shift: 'leia-down', act: { route: 'corridor', speed: 0.55 }, acts: [{ who: 'scout-4', chase: 'me', behind: 7 }] },
        { name: 'P012 The scout closes', on: 'scout-4', frame: 'close', from: 'w', lens: 35, sec: 3, follow: true, shift: 'leia-down', act: { route: 'corridor', speed: 0.55 } },
        { name: 'P013 From above', on: 'scout-4', frame: 'aerial', lens: 50, sec: 4, follow: true, shift: 'leia-down', act: { route: 'corridor', speed: 0.55 } },
        { name: 'P013 The visor', on: 'scout-4', frame: 'close', from: 'front', lens: 35, sec: 3, follow: true, shift: 'leia-down', act: { route: 'corridor', speed: 0.55 } },
        { name: 'P014 Alongside', on: 'me', frame: 'medium', from: 'front', lens: 40, sec: 4, follow: true, shift: 'leia-down', act: { route: 'corridor', speed: 0.55 }, acts: [{ who: 'scout-4', alongside: 'me', side: 3, fire: true, aim: 'me', every: 0.8 }] },
        { name: 'P015 Shots', on: 'me', frame: 'close', from: 'e', lens: 35, sec: 3, follow: true, shift: 'leia-down', act: { route: 'corridor', speed: 0.55 } },
        { name: 'P015 The brake', on: 'me', frame: 'wide', from: 'w', lens: 45, sec: 4, follow: true, shift: 'leia-down', act: { brake: true }, acts: [{ who: 'scout-4', route: 'corridor', speed: 0.8 }] },
        { name: 'P016 The log', on: 'scout-4', frame: 'wide', from: 'e', lens: 45, sec: 5, follow: true, shift: 'leia-down', act: { brake: true }, events: [{ what: 'CRASH', who: 'scout-4', into: 'log', at: 0.2 }, { what: 'EXPLODE', who: 'scout-4', at: 3.5 }] },
        { name: 'P016 Into the ferns', score: 'dread', on: 'me', frame: 'medium', from: 'n', lens: 40, sec: 4, follow: true, shift: 'leia-down', events: [{ what: 'EJECT', who: 'me', at: 0.4 }] },
        { name: 'P017 Two bikes from above', score: 'chase', on: 'bike-2', frame: 'aerial', lens: 55, sec: 4, follow: true, shift: 'brawl', act: { walk: [-24, -28] }, acts: [{ who: 'bike-2', route: 'corridor', speed: 0.55 }, { who: 'scout-2', alongside: 'bike-2', side: 3 }] },
        { name: 'P017 Shoving', on: 'bike-2', frame: 'medium', from: 'front', lens: 40, sec: 4, follow: true, shift: 'brawl', act: { walk: [-24, -28] }, events: [{ what: 'SHOVE', who: 'scout-2', who2: 'bike-2', at: 1.2 }, { what: 'SHOVE', who: 'scout-2', at: 2.8 }] },
        { name: 'P018 Between the trunks', on: 'luke', frame: 'pov', sec: 4, follow: true, shift: 'brawl', act: { walk: [-24, -28] }, acts: [{ who: 'bike-2', route: 'corridor', speed: 0.7 }, { who: 'scout-2', alongside: 'bike-2', side: 2.5 }] },
        { name: 'P019 The hands', on: 'bike-2', frame: 'close', from: 'e', lens: 35, sec: 3, follow: true, shift: 'brawl', act: { walk: [-24, -28] } },
        { name: 'P019 The trunk ahead', on: 'luke', frame: 'pov', sec: 3, follow: true, shift: 'somersault', act: { walk: [-24, -28] }, acts: [{ who: 'bike-2', route: 'corridor', speed: 0.7 }] },
        { name: 'P020 The somersault', score: 'dread', on: 'luke', frame: 'wide', from: 'e', lens: 45, sec: 6, follow: true, shift: 'somersault', act: { walk: [-24, -28] }, events: [{ what: 'EJECT', who: 'luke', at: 0.6 }, { what: 'CRASH', who: 'bike-2', into: 'tree', at: 0.7 }, { what: 'EXPLODE', who: 'bike-2', at: 3.4 }] },
        { name: 'P021 Turnabout', score: 'chase', on: 'scout-2', frame: 'wide', from: 'n', lens: 50, sec: 5, follow: true, shift: 'saber', act: { walk: [-24, -28] }, acts: [{ who: 'scout-2', turnabout: true, charge: 'luke', fire: true, aim: 'luke', every: 0.6 }, { who: 'luke', pose: 'stand', look: 'scout-2' }] },
        { name: 'P021 The saber', on: 'luke', frame: 'medium', from: 'front', lens: 40, sec: 3, shift: 'saber', act: { walk: [-24, -28] }, acts: [{ who: 'luke', saber: true, look: 'scout-2' }] },
        { name: 'P022 Deflected', on: 'luke', frame: 'medium', from: 'front', lens: 40, sec: 4, shift: 'saber', act: { walk: [-24, -28] }, acts: [{ who: 'luke', saber: true, look: 'scout-2' }, { who: 'scout-2', charge: 'luke', fire: true, aim: 'luke', every: 0.5 }], events: [{ what: 'DEFLECT', who: 'luke', at: 0, for: 4 }] },
        { name: 'P022 Severed', on: 'scout-2', frame: 'wide', from: 'e', lens: 45, sec: 5, follow: true, shift: 'saber', act: { walk: [-24, -28] }, acts: [{ who: 'luke', saber: true }], events: [{ what: 'SEVER', who: 'scout-2', at: 0.8 }, { what: 'EXPLODE', who: 'scout-2', at: 3.6 }] },
        { name: 'P023 The wreck', score: null, on: 'luke', frame: 'medium', from: 'w', lens: 40, sec: 4, shift: 'camp', act: { walk: [-24, -28] }, acts: [{ who: 'luke', look: 'scout-2' }] },
        { name: 'P023 Back down the corridor', on: 'luke', frame: 'wide', from: 'n', lens: 50, sec: 5, follow: true, shift: 'camp', act: { walk: [-24, -28] }, acts: [{ who: 'luke', to: [-22, -26], run: true }] },
        { name: 'P024 The staging trunk', score: 'camp', on: 'chewbacca', frame: 'wide', from: 'se', lens: 50, sec: 4, shift: 'camp', act: { walk: [-24, -28] }, acts: [{ who: 'chewbacca', pose: 'crouch' }, { who: 'han', to: [-27, -33], pose: 'aim' }], events: [{ what: 'LINE', who: 'chewbacca', text: 'Rrraaawwrr.', at: 1.5 }] },
        { name: 'P024 The droids', on: 'c3po', frame: 'close', from: 'e', lens: 35, sec: 4, shift: 'camp', act: { walk: [-24, -28] }, events: [{ what: 'LINE', who: 'c3po', text: 'Oh dear. They have been gone a long time.', at: 0.5, for: 3 }] },
        { name: 'P024 Han behind the root', on: 'han', frame: 'medium', from: 'e', lens: 40, sec: 3, shift: 'camp', act: { walk: [-24, -28] }, acts: [{ who: 'han', pose: 'aim', look: 'luke' }] },
        { name: 'P025 Luke arrives', on: 'luke', frame: 'wide', from: 's', lens: 50, sec: 4, follow: true, shift: 'camp', act: { walk: [-24, -28] }, acts: [{ who: 'luke', to: [-24, -30], run: true }, { who: 'han', pose: 'stand', look: 'luke' }], events: [{ what: 'LINE', who: 'chewbacca', text: 'Rrraawr.', at: 2.5 }] },
        { name: 'P025 Where is Leia', on: 'han', frame: 'medium', from: 'n', lens: 40, sec: 4, shift: 'camp', act: { walk: [-24, -28] }, acts: [{ who: 'luke', look: 'han' }, { who: 'han', look: 'luke' }], events: [{ what: 'LINE', who: 'han', text: 'Where is Leia?', at: 0.4, for: 2 }, { what: 'LINE', who: 'luke', text: 'She did not come back?', at: 2.4, for: 1.5 }] },
        { name: 'P026 The plan', on: 'luke', frame: 'medium', from: 'e', lens: 40, sec: 4, shift: 'camp', act: { walk: [-24, -28] }, acts: [{ who: 'han', pose: 'point', look: 'luke' }], events: [{ what: 'LINE', who: 'han', text: 'We have to find her.', at: 0.5, for: 3 }] },
        { name: 'P027 Into the trees', score: 'hero', on: 'han', frame: 'wide', from: 'e', lens: 50, sec: 6, follow: true, shift: 'camp', act: { walk: [-40, -50] }, acts: [{ who: 'han', to: [-62, -66], pose: 'stand' }, { who: 'chewbacca', to: [-58, -70], pose: 'stand' }, { who: 'c3po', to: [-55, -62] }, { who: 'luke', to: [-60, -63], run: true }], events: [{ what: 'LINE', who: 'han', text: 'Let us go.', at: 0.5, for: 2 }] },
      ] },
  };

  function create({ W, M }) {
    const F = {
      shots: [], sel: -1, mode: 'view', play: { on: false, i: 0, t: 0, all: false }, rec: null, aspect: '16:9', fps: 24, size: '720p', sec: 4,
      lights: [], extra: [], time: null, sun: null, blob: null, url: null, take: null, steps: 0, running: false, onChange: null, local: false, busy: false, status: '',
      free: { pos: new THREE.Vector3(), yaw: 0, pitch: 0, fov: 50 }, viewT: 0, log: [], story: null, loose: [], lights2: [], caption: null, deflect: null, deflectN: 0, flip: 0, proneUntil: 0,
      actors: new Map(), builds: new Map(), scene: null, cable: null, hang: null, prone: false, rout: null, strikes: null, pending: [], meshes: [], fired: 0,
    };
    const DEG = Math.PI / 180, headingOf = deg => Math.PI - deg * DEG, degOf = h => ((180 - h / DEG) % 360 + 360) % 360, UP = new THREE.Vector3(0, 1, 0);
    const V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
    const gameFov = () => innerHeight > innerWidth ? 55 : 50;
    const groundH = (x, z) => W.G ? W.G.h(x, z) + (window.Ground ? Ground.layerAt(W.G, x, z) : 0) : 0;
    const changed = what => { for (const s of F.shots) if (s.keys.length > 1 && (!s.curve || s.curveN !== s.keys.length)) s.curve = null; F.save(); if (F.onChange) { try { F.onChange(what); } catch (e) { } } };
    const say = (text, cls) => { F.status = text; F.statusCls = cls || ''; if (F.onStatus) { try { F.onStatus(text, cls); } catch (e) { } } };

    /* ── the grammar ── */
    const keyOf = m => ({ pos: new THREE.Vector3(+m[1], -m[2], -m[3]), tgt: new THREE.Vector3(+m[4], -m[5], -m[6]), fov: clamp(+m[7] || 50, 5, 150) });
    const KEY_RE = /POS\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+TGT\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+LENS\s+([\d.]+)/;
    /** SCORE "cue" on a SHOT or TITLE line names the music from there on; SCORE none ends it. */
    const scoreOf = (line, cur) => { const m = line.match(/\bSCORE\s+(?:"([^"]*)"|(none))/); if (m) cur.score = m[2] ? null : m[1]; };
    const scoreText = s => s.score === undefined ? '' : s.score === null ? ' SCORE none' : ` SCORE "${s.score}"`;
    F.parse = (text, keepOld) => {
      const shots = keepOld ? F.shots.slice() : [], lights = keepOld ? F.lights.slice() : [], actors = [], builds = []; let cur = null, n = 0, pendingSet = null, stage = null, story = null;
      for (const raw of String(text || '').split(/\r?\n/)) {
        const line = raw.trim(); if (!/!MENTO/.test(line)) continue;
        const name = (line.match(/"([^"]*)"/) || [])[1];
        if (/!MENTO\s+SHOT/.test(line)) { const m = line.match(KEY_RE); if (!m) continue; const sec = line.match(/\bSEC\s+([\d.]+)/); cur = { name: name || `Shot ${shots.length + 1}`, keys: [keyOf(m)], sec: sec ? clamp(num(sec[1]), 0.5, 120) : F.sec, act: null, set: pendingSet, follow: /\bFOLLOW\b/.test(line), lamp: /\bLAMP\b/.test(line) }; const spd = line.match(/\bSPEED\s+([\d.]+)/); if (spd) cur.speed = clamp(+spd[1], 0.05, 4); const shf = line.match(/\bSHIFT\s+"([^"]*)"/); if (shf) cur.shift = shf[1]; scoreOf(line, cur); pendingSet = null; shots.push(cur); n++; }
        else if (/!MENTO\s+STORY\b/.test(line)) { const m = line.match(/STORY\s+(\{[\s\S]*\})\s*$/); if (m) { try { story = JSON.parse(m[1]); } catch (e) { } } }
        else if (/!MENTO\s+TITLE/.test(line)) { const sec = line.match(/\bSEC\s+([\d.]+)/), st = line.match(/\bSTYLE\s+(\w+)/), words = (name || '').replace(/\\n/g, '\n'); cur = { name: words.split('\n')[0] || 'Title', title: words, style: st ? st[1].toLowerCase() : 'card', keys: [], sec: sec ? clamp(num(sec[1]), 0.5, 120) : 3, act: null, set: pendingSet }; scoreOf(line, cur); pendingSet = null; shots.push(cur); n++; }
        else if (window.Perform && /!MENTO\s+(BEAT|SET\s+"|PHRASE|PERFORM|SPEAK|FACE|ASSERT|STEP|LIFE|INCREASE|REDUCE|EARLIER|LATER|KEEP)\b/.test(line)) { const ev = Perform.parseLine(line); if (ev && cur) (cur.events = cur.events || []).push(ev); }
        else if (/!MENTO\s+SET\b/.test(line)) { const w = line.match(/\bWORLD\s+(\w+)/), a = line.match(/\bAS\s+(\w+)/), t = line.match(/\bTIME\s+(\w+)/), we = line.match(/\bWEATHER\s+(\w+)/); pendingSet = { world: w ? w[1].toLowerCase() : null, as: a ? a[1].toLowerCase() : null, time: t ? t[1].toLowerCase() : null, weather: we ? we[1].toLowerCase() : null }; }
        else if (/!MENTO\s+PLAN\b/.test(line)) { const m = line.match(/PLAN\s+(\{[\s\S]*\})\s*$/); if (m && cur) { try { cur.plan = JSON.parse(m[1]); } catch (e) { } } }
        else if (/!MENTO\s+KEY/.test(line)) { const m = line.match(KEY_RE); if (m && cur) cur.keys.push(keyOf(m)); }
        else if (/!MENTO\s+LIGHT/.test(line)) { const L = parseLight(line); if (L) lights.push(L); }
        else if (/!MENTO\s+STAGE\b/.test(line)) { const m = line.match(/STAGE\s+(\w+)/), r = line.match(/\bR\s+([\d.]+)/), sd = line.match(/\bSEED\s+(\d+)/), at = line.match(/\bAT\s+(-?[\d.]+)\s+(-?[\d.]+)/), cor = line.match(/CORRIDOR\s+([-\d.\s]+)$/); if (m) { const nums = cor ? cor[1].trim().split(/\s+/).map(Number) : []; const path = []; for (let i = 0; i + 1 < nums.length; i += 2) path.push([nums[i], -nums[i + 1]]); stage = { kind: m[1].toLowerCase(), r: r ? +r[1] : 180, seed: sd ? +sd[1] : 1, centre: at ? { x: +at[1], z: -at[2] } : null, corridor: path.length > 1 ? path : null, abs: true }; } }
        else if (/!MENTO\s+ACTOR\b/.test(line)) { const a = parseActor(line); if (a) actors.push(a); }
        else if (/!MENTO\s+BUILD\b/.test(line)) { const b = parseBuild(line); if (b) builds.push(b); }
        else if (/!MENTO\s+EVENT\b/.test(line)) { const ev = parseEvent(line); if (ev && cur) (cur.events = cur.events || []).push(ev); }
        else if (/!MENTO\s+ACT\b/.test(line)) { if (!cur) continue; const a = parseAct(line.replace(/^.*!MENTO\s+ACT\s*("[^"]*")?/, ''), name || 'me'); if (!a) continue; if (a.who === 'me') cur.act = a; else (cur.acts = cur.acts || []).push(a); }
        else if (/!MENTO\s+TIME/.test(line)) { const m = line.match(/TIME\s+(day|dawn|dusk|night|auto)/i); if (m) F.time = m[1].toLowerCase(); }
        else if (/!MENTO\s+ASPECT/.test(line)) { const a = line.match(/ASPECT\s+([\d.:]+)/), f = line.match(/FPS\s+(\d+)/); if (a && ASPECTS[a[1]]) F.aspect = a[1]; if (f) F.fps = clamp(+f[1], 6, 60); }
      }
      F.shots = shots; F.lights = lights; if (F.sel >= shots.length) F.sel = shots.length - 1; if (F.sel < 0 && shots.length) F.sel = 0; if (story || !keepOld) F.story = story;
      if (actors.length || builds.length || stage) { if (!keepOld) F.teardown(!!stage); F.scene = { name: F.name || 'scene', actors, builds, set: stage, abs: true }; F.setup(); } else if (!keepOld && F.scene) F.teardown();
      if (F.prepareEnvs) F.prepareEnvs(); applyLights(); if (F.time && W.setSky) W.setSky(F.time); changed('parse'); return { shots: n, lights: lights.length, actors: actors.length, builds: builds.length };
    };
    const quoted = t => [...String(t).matchAll(/"([^"]*)"/g)].map(m => m[1]);
    function parseActor(line) {
      const q = quoted(line); if (!q.length) return null; const t = line.replace(/"[^"]*"/g, '""');
      const at = t.match(/\bAT\s+(-?[\d.]+)\s+(-?[\d.]+)/), hd = t.match(/\bHEADING\s+(-?[\d.]+)/), kit = t.match(/\bKIT\s+(\w+)/), kind = t.match(/\bKIND\s+(\w+)/), crowd = t.match(/\bCROWD\s+(\w+)/), n = t.match(/\bN\s+(\d+)/), r = t.match(/\bR\s+([\d.]+)/), len = t.match(/\bLEN\s+(\d+)/), col = t.match(/\bCOL\s+(\d+)/), fig = t.match(/\bFIGURE\s+(\w+)/), rider = t.match(/\bRIDER\s+(\w+)/), pose = t.match(/\bPOSE\s+(\w+)/);
      const a = { name: q[0], x: at ? +at[1] : 0, z: at ? -at[2] : 0, heading: hd ? +hd[1] : 0 };
      if (crowd) { a.crowd = true; a.kind = crowd[1].toLowerCase(); a.n = n ? +n[1] : 12; a.r = r ? +r[1] * M : 20 * M; } else if (fig) a.figure = fig[1].toLowerCase(); else if (kit) a.kit = kit[1].toLowerCase(); else if (kind) { a.kind = kind[1].toLowerCase(); if (len) a.len = +len[1]; if (col) a.col = +col[1]; } else return null;
      if (rider) a.rider = rider[1].toLowerCase(); if (pose) a.pose = pose[1].toLowerCase();
      return a;
    }
    function parseBuild(line) { const q = quoted(line); const at = line.match(/\bAT\s+(-?[\d.]+)\s+(-?[\d.]+)/), m = line.match(/(\{[\s\S]*\})\s*$/); if (!q.length || !m) return null; let prog = null; try { prog = JSON.parse(m[1]); } catch (e) { return null; } return { name: q[0], x: at ? +at[1] : 0, z: at ? -at[2] : 0, program: prog }; }
    function parseEvent(line) {
      const t = line.replace(/^.*!MENTO\s+EVENT\s*/, ''), what = (t.match(/^(\w+)/) || [])[1]; if (!what) return null; const q = quoted(t), tt = t.replace(/"[^"]*"/g, '""');
      const num = (re, d) => { const m = tt.match(re); return m ? +m[1] : d; };
      const ev = { what: what.toUpperCase(), who: q[0] || null, who2: q[1] || null, at: num(/\bAT\s+([\d.]+)/, 0), over: num(/\bOVER\s+([\d.]+)/, undefined), turns: num(/\bTURNS\s+([\d.]+)/, undefined), scale: num(/\bSCALE\s+([\d.]+)/, undefined), every: num(/\bEVERY\s+([\d.]+)/, undefined), r: num(/\bR\s+([\d.]+)/, undefined), k: num(/\bK\s+([\d.]+)/, undefined), for: num(/\bFOR\s+([\d.]+)/, undefined) };
      const part = tt.match(/\b(belly|neck|head)\b/i); if (part) ev.part = part[1].toLowerCase();
      const into = tt.match(/\bINTO\s+(tree|log)\b/i); if (into) ev.into = into[1].toLowerCase();
      if (ev.what === 'CAPTION') { ev.text = q[0] || ''; ev.who = null; ev.who2 = null; }
      if (ev.what === 'LINE') { ev.who = q[0] || 'narrator'; ev.text = q[1] || ''; ev.who2 = null; }
      const xz = tt.replace(/^\w+\s*/, '').replace(/\b(AT|OVER|TURNS|SCALE|EVERY|R|K)\s+[\d.]+/g, '').match(/(-?[\d.]+)\s+(-?[\d.]+)/); if (xz && ev.what === 'STRIKE') { ev.x = +xz[1]; ev.z = -xz[2]; }
      return ev;
    }
    const eventText = ev => { const t = [`${ev.what}`]; if (ev.what === 'CAPTION') t.push(`"${String(ev.text || '').replace(/"/g, "'")}"`); if (ev.who) t.push(`"${ev.who}"`); if (ev.what === 'LINE') t.push(`"${String(ev.text || '').replace(/"/g, "'")}"`); if (ev.who2) t.push(`"${ev.who2}"`); if (ev.into) t.push('INTO ' + ev.into); if (ev.what === 'STRIKE' && ev.x != null) t.push(`${fmt(ev.x)} ${fmt(-ev.z)}`); if (ev.part) t.push(ev.part); t.push(`AT ${fmt(ev.at || 0)}`); if (ev.turns != null) t.push(`TURNS ${fmt(ev.turns)}`); if (ev.over != null) t.push(`OVER ${fmt(ev.over)}`); if (ev.scale != null) t.push(`SCALE ${fmt(ev.scale)}`); if (ev.every != null) t.push(`EVERY ${fmt(ev.every)}`); if (ev.r != null) t.push(`R ${fmt(ev.r)}`); if (ev.k != null) t.push(`K ${fmt(ev.k)}`); if (ev.for != null) t.push(`FOR ${fmt(ev.for)}`); return t.join(' '); };
    /** An event's line: a performance directive stands on its own, the rest are EVENTs. */
    const evLine = ev => { if (window.Perform && Perform.PERF_EVENTS.has(ev.what)) { const t = Perform.eventText(ev); if (t) return `0 !MENTO ${t}`; } return `0 !MENTO EVENT ${eventText(ev)}`; };
    const actorText = a => a.crowd ? `0 !MENTO ACTOR "${a.name}" CROWD ${a.kind} N ${a.n} AT ${fmt(a.x)} ${fmt(-a.z)} R ${fmt(a.r / M)}` : `0 !MENTO ACTOR "${a.name}" ${a.figure ? 'FIGURE ' + a.figure : a.kit ? 'KIT ' + a.kit : 'KIND ' + a.kind + (a.len ? ' LEN ' + a.len : '') + (a.col != null ? ' COL ' + a.col : '')} AT ${fmt(a.x)} ${fmt(-a.z)} HEADING ${fmt(a.heading || 0)}${a.rider ? ' RIDER ' + a.rider : ''}${a.pose ? ' POSE ' + a.pose : ''}`;
    /** The act tokens: WALK x z, DRIVE x z, AHEAD m, RIDE word, TIE, FLY, FIRE, SABER, LEAVE, LOOK x z; for an actor also MARCH deg speed, TO x z, ORBIT "who" R m, PASS "who", HEAVY, EVERY s, AIM "who"|x z, HALT, LAND, ALT m. */
    function parseAct(text, who) {
      const a = { who: who || 'me' }, t = String(text || '').trim(); if (!t) return null;
      const march = t.match(/\bMARCH\s+(-?[\d.]+)(?:\s+([\d.]+))?/); if (march) { a.march = +march[1]; if (march[2]) a.speed = +march[2]; }
      const to = t.match(/\bTO\s+(-?[\d.]+)\s+(-?[\d.]+)/); if (to) a.to = { x: +to[1], z: -to[2] };
      const orbit = t.match(/\bORBIT\s+"([^"]*)"(?:\s+R\s+([\d.]+))?/); if (orbit) { a.orbit = orbit[1]; if (orbit[2]) a.r = +orbit[2]; }
      const pass = t.match(/\bPASS\s+"([^"]*)"/); if (pass) a.pass = pass[1];
      const aimQ = t.match(/\bAIM\s+"([^"]*)"/), aimXZ = t.match(/\bAIM\s+(-?[\d.]+)\s+(-?[\d.]+)/); if (aimQ) a.aim = aimQ[1]; else if (aimXZ) a.aim = { x: +aimXZ[1], z: -aimXZ[2] };
      const every = t.match(/\bEVERY\s+([\d.]+)/); if (every) a.every = +every[1]; const alt = t.match(/\bALT\s+([\d.]+)/); if (alt) a.alt = +alt[1]; const sp = t.match(/\bSPEED\s+([\d.]+)/); if (sp) a.speed = +sp[1];
      if (/\bHEAVY\b/.test(t)) a.heavy = true; if (/\bHALT\b/.test(t)) a.halt = true; if (/\bLAND\b/.test(t)) a.land = true;
      const route = t.match(/\bROUTE\b(?:\s+"([^"]*)")?/); if (route) a.route = route[1] || 'corridor';
      const chase = t.match(/\bCHASE\s+"([^"]*)"(?:\s+BEHIND\s+([\d.]+))?/); if (chase) { a.chase = chase[1]; if (chase[2]) a.behind = +chase[2]; }
      const along = t.match(/\bALONGSIDE\s+"([^"]*)"(?:\s+SIDE\s+(-?[\d.]+))?/); if (along) { a.alongside = along[1]; if (along[2]) a.side = +along[2]; }
      const charge = t.match(/\bCHARGE\s+"([^"]*)"/); if (charge) a.charge = charge[1];
      const follow = t.match(/\bFOLLOW\s+"([^"]*)"/); if (follow) a.follow = follow[1];
      const pose = t.match(/\bPOSE\s+(\w+)/); if (pose) a.pose = pose[1].toLowerCase();
      if (/\bBRAKE\b/.test(t)) a.brake = true; if (/\bTURNABOUT\b/.test(t)) a.turnabout = true; if (/\bRUN\b/.test(t)) a.run = true;
      const xy = (re) => { const m = t.match(re); return m ? { x: +m[1], z: -m[2] } : null; };
      const walk = xy(/\bWALK\s+(-?[\d.]+)\s+(-?[\d.]+)/), drive = xy(/\bDRIVE\s+(-?[\d.]+)\s+(-?[\d.]+)/), look = xy(/\bLOOK\s+(-?[\d.]+)\s+(-?[\d.]+)/);
      if (walk) { a.kind = 'walk'; a.x = walk.x; a.z = walk.z; } else if (drive) { a.kind = 'drive'; a.x = drive.x; a.z = drive.z; }
      const ahead = t.match(/\bAHEAD\s+(-?[\d.]+)/); if (ahead) a.ahead = +ahead[1];
      const ride = t.match(/\bRIDE\s+(?:"([^"]*)"|([\w-]+))/); if (ride) a.ride = (ride[1] || ride[2]).toLowerCase();
      if (/\bTIE\b/.test(t)) a.tie = true; if (/\bFLY\b/.test(t)) a.fly = true; if (/\bFIRE\b/.test(t)) a.fire = true; if (/\bSABER\b/.test(t)) a.saber = true; if (/\bLEAVE\b/.test(t)) a.leave = true; if (look) a.look = look; else { const lq = t.match(/\bLOOK\s+"([^"]*)"/); if (lq) a.look = lq[1]; }
      return Object.keys(a).length > 1 ? a : null;
    }
    const actText = a => { const t = []; if (a.leave) t.push('LEAVE'); if (a.ride) t.push('RIDE ' + a.ride); if (a.tie) t.push('TIE'); if (a.kind === 'walk') t.push(`WALK ${fmt(a.x)} ${fmt(-a.z)}`); if (a.kind === 'drive' && a.x != null) t.push(`DRIVE ${fmt(a.x)} ${fmt(-a.z)}`); if (a.ahead) t.push('AHEAD ' + fmt(a.ahead)); if (a.look) t.push(typeof a.look === 'string' ? `LOOK "${a.look}"` : `LOOK ${fmt(a.look.x)} ${fmt(-a.look.z)}`);
      if (a.march != null) t.push(`MARCH ${fmt(a.march)}${a.speed != null ? ' ' + fmt(a.speed) : ''}`); if (a.to) t.push(`TO ${fmt(a.to.x)} ${fmt(-a.to.z)}`); if (a.orbit) t.push(`ORBIT "${a.orbit}"${a.r ? ' R ' + fmt(a.r) : ''}`); if (a.pass) t.push(`PASS "${a.pass}"`); if (a.alt) t.push('ALT ' + fmt(a.alt)); if (a.halt) t.push('HALT'); if (a.land) t.push('LAND');
      if (a.fly) t.push('FLY'); if (a.fire) t.push('FIRE'); if (a.heavy) t.push('HEAVY'); if (a.every) t.push('EVERY ' + fmt(a.every)); if (a.speed != null && a.march == null) t.push('SPEED ' + fmt(a.speed)); if (a.alt != null) t.push('ALT ' + fmt(a.alt)); if (a.aim) t.push(typeof a.aim === 'string' ? `AIM "${a.aim}"` : `AIM ${fmt(a.aim.x)} ${fmt(-a.aim.z)}`); if (a.saber) t.push('SABER'); if (a.route) t.push(`ROUTE "${a.route}"`); if (a.chase) t.push(`CHASE "${a.chase}"` + (a.behind != null ? ' BEHIND ' + fmt(a.behind) : '')); if (a.alongside) t.push(`ALONGSIDE "${a.alongside}"` + (a.side != null ? ' SIDE ' + fmt(a.side) : '')); if (a.charge) t.push(`CHARGE "${a.charge}"`); if (a.follow) t.push(`FOLLOW "${a.follow}"`); if (a.pose) t.push('POSE ' + a.pose); if (a.brake) t.push('BRAKE'); if (a.turnabout) t.push('TURNABOUT'); if (a.run) t.push('RUN'); return t.join(' '); };
    function parseLight(line) {
      const name = (line.match(/"([^"]*)"/) || [])[1] || 'light', type = (line.match(/TYPE\s+(\w+)/) || [])[1] || 'POINT', p = line.match(/POS\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/); if (!p) return null;
      const t = line.match(/TGT\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/), c = line.match(/COLOR\s+(#[0-9a-fA-F]{6})/), i = line.match(/INTENSITY\s+([\d.]+)/), d = line.match(/DECAY\s+([\d.]+)/);
      return { name, type: type.toUpperCase(), pos: new THREE.Vector3(+p[1], -p[2], -p[3]), tgt: t ? new THREE.Vector3(+t[1], -t[2], -t[3]) : null, color: c ? c[1] : '#ffffff', intensity: i ? num(i[1]) : 1, decay: d ? num(d[1]) : 0, shadows: /SHADOWS\s+TRUE/i.test(line), line };
    }
    const ld = v => `${fmt(v.x)} ${fmt(-v.y)} ${fmt(-v.z)}`;
    const keyLine = k => `POS ${ld(k.pos)} TGT ${ld(k.tgt)} LENS ${fmt(k.fov)}`;
    F.text = () => {
      const out = [`0 // MENTO film · ${W.place && W.place.name ? W.place.name : 'the world'} · word to momento`, `0 !MENTO ASPECT ${F.aspect} FPS ${F.fps}`];
      if (F.time) out.push(`0 !MENTO TIME ${F.time}`);
      if (F.story) out.push(`0 !MENTO STORY ${JSON.stringify(F.story)}`);
      for (const L of F.lights) out.push(L.line);
      if (F.scene && F.scene.set) { const st = F.scene.set; out.push(`0 !MENTO STAGE ${st.kind} R ${fmt(st.r)} SEED ${st.seed || 1}${st.centre ? ` AT ${fmt(st.centre.x)} ${fmt(-st.centre.z)}` : ''}${st.corridor ? ' CORRIDOR ' + st.corridor.map(p => `${fmt(p[0])} ${fmt(-p[1])}`).join(' ') : ''}`); }
      for (const a of F.actors.values()) out.push(actorText(a));
      for (const b of F.builds.values()) out.push(`0 !MENTO BUILD "${b.name}" AT ${fmt(b.ax)} ${fmt(-b.az)} ${JSON.stringify(b.program)}`);
      F.shots.forEach((s, i) => {
        out.push(`0 // SHOT ${i + 1}: ${s.name.toUpperCase()}`);
        if (s.set && (s.set.world || s.set.as || s.set.time || s.set.weather)) out.push(`0 !MENTO SET${s.set.world ? ' WORLD ' + s.set.world : ''}${s.set.as ? ' AS ' + s.set.as : ''}${s.set.time ? ' TIME ' + s.set.time : ''}${s.set.weather ? ' WEATHER ' + s.set.weather : ''}`);
        if (s.title != null) { out.push(`0 !MENTO TITLE "${s.title.replace(/"/g, "'").replace(/\n/g, '\\n')}" STYLE ${s.style || 'card'} SEC ${fmt(s.sec)}${scoreText(s)}`); for (const ev of s.events || []) out.push(evLine(ev)); return; }
        const k0 = s.keys[0] || { pos: new THREE.Vector3(), tgt: new THREE.Vector3(0, 0, -1), fov: 50 };
        out.push(`0 !MENTO SHOT "${s.name.replace(/"/g, "'")}" ${keyLine(k0)} SEC ${fmt(s.sec)}${s.follow ? ' FOLLOW' : ''}${s.lamp ? ' LAMP' : ''}${s.speed != null ? ' SPEED ' + fmt(s.speed) : ''}${s.shift ? ` SHIFT "${String(s.shift).replace(/"/g, "'")}"` : ''}${scoreText(s)}`);
        if (s.plan) out.push(`0 !MENTO PLAN ${JSON.stringify(s.plan)}`);
        for (const k of s.keys.slice(1)) out.push(`0 !MENTO KEY ${keyLine(k)}`);
        if (s.act) { const t = actText(s.act); if (t) out.push(`0 !MENTO ACT "${s.act.who || 'me'}" ${t}`); }
        for (const a of s.acts || []) { const t = actText(a); if (t) out.push(`0 !MENTO ACT "${a.who}" ${t}`); }
        for (const ev of s.events || []) out.push(evLine(ev));
      });
      return out.join('\n') + '\n';
    };

    /* ── the lights ── */
    function applyLights() {
      for (const l of F.extra) W.scene.remove(l); F.extra = []; F.sun = null;
      for (const L of F.lights) {
        if (L.type === 'SUN') { F.sun = { color: new THREE.Color(L.color), intensity: L.intensity }; continue; }
        let light;
        if (L.type === 'AREA' || L.type === 'SPOT') { light = new THREE.SpotLight(L.color, L.intensity, L.decay || 0, 0.7, 0.4, 1); light.position.copy(L.pos); light.target.position.copy(L.tgt || new THREE.Vector3(L.pos.x, L.pos.y - 100, L.pos.z)); W.scene.add(light.target); F.extra.push(light.target); }
        else { light = new THREE.PointLight(L.color, L.intensity, L.decay || 0, 1); light.position.copy(L.pos); }
        W.scene.add(light); F.extra.push(light);
      }
    }
    const applySun = () => { const s = F.sun, d = window.Ground && Ground.daylight.lights; if (!s || !d) return; d.sun.color.copy(s.color); d.sun.intensity = s.intensity / Math.PI; };

    /* ── the camera ── */
    F.owns = () => F.play.on || !!F.rec || F.mode !== 'view';
    F.holds = () => F.mode === 'free' && !F.play.on;
    function poseAt(cam, s, t) {
      if (s.title != null && s.style !== 'hud') return;                               // a title card: the camera stays where it is, the card covers the frame
      if (s.title != null && !s.keys.length) return;                                  // a hud title over the live camera
      if (s.follow && s.plan) { const st = F.stage(s.bearKeep != null ? { ...s.plan, bearKeep: s.bearKeep } : s.plan); s.keys = st.keys; s.curve = null; s.readout = st.readout; if (s.bearKeep == null) s.bearKeep = st.bearKeep; }   // the subject moves: the keys move with it, on the bearing the first frame found
      const n = s.keys.length; let pos, tgt, fov;
      if (n === 1) { pos = s.keys[0].pos; tgt = s.keys[0].tgt; fov = s.keys[0].fov; }
      else {
        const u = clamp(t / s.sec, 0, 1); if (!s.curve || s.curveN !== n) { s.curve = new THREE.CatmullRomCurve3(s.keys.map(k => k.pos), false, 'centripetal'); s.curveN = n; }
        pos = s.curve.getPointAt(u); const seg = n - 1, raw = u * seg, i = Math.min(Math.floor(raw), seg - 1), a = raw - i;
        tgt = V1.lerpVectors(s.keys[i].tgt, s.keys[i + 1].tgt, a); fov = s.keys[i].fov + (s.keys[i + 1].fov - s.keys[i].fov) * a;
      }
      cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(tgt); if (Math.abs(cam.fov - fov) > 1e-3) { cam.fov = fov; cam.updateProjectionMatrix(); }
    }
    function poseFree(cam) {
      const f = F.free; cam.position.copy(f.pos); V1.set(-Math.sin(f.yaw) * Math.cos(f.pitch), Math.sin(f.pitch), -Math.cos(f.yaw) * Math.cos(f.pitch)).add(f.pos);
      cam.up.set(0, 1, 0); cam.lookAt(V1); if (Math.abs(cam.fov - f.fov) > 1e-3) { cam.fov = f.fov; cam.updateProjectionMatrix(); }
    }
    F.camera = (cam, dt) => {
      if (F.play.on) { const s = F.shots[F.play.i]; if (s) { poseAt(cam, s, F.play.t); return; } }
      if (F.mode === 'shot') { const s = F.shots[F.sel]; if (s) { poseAt(cam, s, F.viewT); return; } }
      poseFree(cam);
    };
    F.setMode = m => {
      if (!['view', 'shot', 'free'].includes(m)) return F.mode; if (m === 'shot' && !F.shots.length) m = 'free';
      if (m === 'free' && F.mode !== 'free') { const c = W.camera; F.free.pos.copy(c.position); c.getWorldDirection(V1); F.free.yaw = Math.atan2(-V1.x, -V1.z); F.free.pitch = Math.asin(clamp(V1.y, -1, 1)); F.free.fov = c.fov; }
      F.mode = m; F.viewT = 0;
      if (m === 'view') { W.camera.fov = gameFov(); W.camera.updateProjectionMatrix(); if (W.rig) W.rig.cam.set = false; }
      if (F.onChange) F.onChange('mode'); return m;
    };
    F.look = (dx, dy) => { F.free.yaw -= dx; F.free.pitch = clamp(F.free.pitch - dy, -1.45, 1.45); };
    F.zoom = k => { F.free.fov = clamp(F.free.fov * k, 12, 110); };
    F.setLens = fov => { fov = clamp(+fov || 50, 12, 110); if (F.mode === 'free' || !F.shots[F.sel]) F.free.fov = fov; else { for (const k of F.shots[F.sel].keys) k.fov = fov; changed('lens'); } };
    F.setSec = sec => { sec = clamp(+sec || 4, 0.5, 120); F.sec = sec; const s = F.shots[F.sel]; if (s) { s.sec = sec; changed('sec'); } };
    F.setAspect = a => { if (ASPECTS[a]) { F.aspect = a; changed('aspect'); } return F.aspect; };
    F.setFps = f => { F.fps = clamp(+f || 24, 6, 60); changed('fps'); };
    F.setSize = s => { if (SIZES[s]) { F.size = s; changed('size'); } };
    F.setTime = t => { F.time = t; if (W.setSky) W.setSky(t); changed('time'); };

    /* ── the reel ── */
    F.select = i => { F.sel = clamp(i | 0, -1, F.shots.length - 1); F.viewT = 0; if (F.onChange) F.onChange('select'); return F.sel; };
    F.view = i => { F.select(i); F.stop(); if (F.shots[F.sel]) F.setMode('shot'); return F.sel; };
    F.here = asKey => {
      const c = W.camera, k = { pos: c.position.clone(), tgt: c.getWorldDirection(V1).multiplyScalar(20 * M).add(c.position).clone(), fov: c.fov };
      const s = asKey && F.shots[F.sel];
      if (s) { s.keys.push(k); s.curve = null; changed('key'); return { shot: F.sel, keys: s.keys.length }; }
      F.shots.push({ name: `Shot ${F.shots.length + 1}`, keys: [k], sec: F.sec, act: null }); F.sel = F.shots.length - 1; changed('shot'); return { shot: F.sel, keys: 1 };
    };
    F.remove = i => { if (i == null) i = F.sel; if (!F.shots[i]) return; F.shots.splice(i, 1); F.sel = Math.min(F.sel, F.shots.length - 1); if (!F.shots.length && F.mode === 'shot') F.setMode('view'); changed('remove'); };
    F.moveShot = (i, dir) => { const j = i + dir; if (!F.shots[i] || !F.shots[j]) return; const t = F.shots[i]; F.shots[i] = F.shots[j]; F.shots[j] = t; if (F.sel === i) F.sel = j; changed('order'); };
    F.rename = (i, name) => { const s = F.shots[i]; if (!s) return; s.name = String(name || '').trim() || s.name; changed('name'); };
    const truce = on => { if (on) { if (F.truceWas == null) F.truceWas = !!W.truce; W.truce = true; } else if (F.truceWas != null) { W.truce = F.truceWas; F.truceWas = null; } };   // nobody shoots the actors while the film plays
    F.reelOffset = i => { let t = 0; for (let k = 0; k < i && k < F.shots.length; k++) t += F.shots[k].sec; return t; };
    const soundOn = () => { if (window.Sound) Sound.arm(true, () => F.reelOffset(F.play.i) + F.play.t); };
    F.playShot = i => { if (!F.shots[i]) return false; F.play = { on: true, i, t: 0, all: false }; F.sel = i; truce(true); soundOn(); enter(i); if (F.onChange) F.onChange('play'); return true; };
    F.playAll = () => { if (!F.shots.length) return false; F.play = { on: true, i: 0, t: 0, all: true }; F.sel = 0; truce(true); soundOn(); enter(0); if (F.onChange) F.onChange('play'); return true; };
    F.stop = () => { const was = F.play.on; truce(false); if (window.Sound && was) { closeFoley(); Sound.arm(false); } if (F.lampLight) setLamp(false); F.play = { on: false, i: F.play.i, t: 0, all: false }; F.running = false; F.hold = null; F.actState = null; showTitle(null); if (was && F.onChange) F.onChange('stop'); if (F.mode === 'view' && W.rig) { W.camera.fov = gameFov(); W.camera.updateProjectionMatrix(); W.rig.cam.set = false; } return was; };
    F.total = () => F.shots.reduce((s, x) => s + x.sec, 0);
    /** A shot starts: its SET lines change the planet, the character or the sky; the clock holds until the world has laid what it lays; a planned shot is staged again; its act begins. */
    function enter(i) {
      const s = F.shots[i]; F.running = false; F.actState = null; F.hold = null; if (F.caption) { F.caption = null; showCaption(null); } if (!s) return;
      let changed = false; const set = setFor(i);
      if (set) {
        if (set.as && W.setCharacter && W.character !== set.as) { F.ground(); W.setCharacter(set.as); changed = true; }
        if (set.world && W.setWorld && W.world !== set.world) { F.ground(); W.setWorld(set.world); changed = true; }
      }
      if (s.set) { if (s.set.time && W.setSky) W.setSky(s.set.time); if (s.set.weather && W.setWeather) W.setWeather(s.set.weather); }
      if (s.act && s.act.leave) F.ground();
      if (changed) F.hold = { until: performance.now() + 8000, least: performance.now() + 400, why: 'the world is laying' };
      if (!F.hold) settle(s);
      showTitle(s.title != null ? s : null);
      if (window.Sound && F.play.on) { const cue = scoreFor(i); if (cue !== undefined) Sound.cue(cue, s.fade); Sound.setBed(bedFor(s)); }
      setLamp(!!s.lamp || (s.title == null && !!(window.Worlds && Worlds.PRESETS[W.world] && Worlds.PRESETS[W.world].space)));
    }
    /** A lamp at the camera: a station's halls are dark by design, so a shot there carries its own light. */
    function setLamp(on) { if (on && !F.lampLight) { F.lampLight = new THREE.PointLight(0xdfe8ff, 1.6, 45 * M, 1.4); F.lampLight.name = 'film-lamp'; W.scene.add(F.lampLight); } if (F.lampLight) { F.lampLight.visible = !!on; F.lampOn = !!on; } }
    /** The cue a shot plays: its own `score`, or the last one named before it (null ends the music). */
    function scoreFor(i) { for (let k = i; k >= 0; k--) { const s = F.shots[k]; if (s && s.score !== undefined) return s.score; } return undefined; }
    /** The bed under a shot: the set's kind, the weather, the planet. */
    function bedFor(s) { const kind = F.scene && F.scene.set && F.scene.set.kind, we = (s && s.set && s.set.weather) || W.weather, world = W.world; if (kind === 'forest') return 'forest'; if (kind === 'snowfield' || we === 'snow' || we === 'blizzard' || world === 'hoth') return we === 'blizzard' ? 'blizzard' : 'snow'; if (kind === 'desert' || world === 'tatooine') return 'desert'; if (world === 'deathstar') return 'space'; return 'city'; }
    /** The hold is over: a planned shot is staged where things now stand, the act's first moves happen. */
    function settle(s) {
      if (s.plan) { try { s.bearKeep = null; const st = F.stage(s.plan); s.keys = st.keys; s.curve = null; s.name = s.name || st.name; s.readout = st.readout; if (s.follow) s.bearKeep = st.bearKeep; } catch (e) { F.log.push('stage: ' + (e.message || e)); } }
      for (const ac of s.acts || []) { const A = F.actors.get(ac.who); if (A) { A.act = { ...ac }; A.fireT = 0; delete A.act._end; } }
      F.pending = (s.events || []).map(ev => ({ ...ev, done: false })); F.rout = null; F.strikes = null;
      const a = s.act; if (!a) return; const st = F.actState = { fireT: 0, saberT: 0, started: true, boarded: false, aimed: false };
      if (a.kind === 'walk' || a.ahead || a.ride || a.tie) F.prone = false;
      if (a.look && W.rig) { W.rig.heading = Math.atan2(a.look.x - W.rig.pos.x, a.look.z - W.rig.pos.z); W.rig.figure.rotation.y = W.rig.heading; }
      if (!a.ride && !a.tie) { board(a, st); aimAhead(a, st); }
    }
    /** Into the named ride or the TIE; tried every step until it works, since a planet's vehicles come a moment after the planet. */
    function board(a, st) {
      if (st.boarded) return; if (a.ride && W.mode === 'walk') { const A = F.actors.get(a.ride), S = F.subject(a.ride), it = A && A.it ? A.it : W.props && W.props.items.get(S.what); if (it && it.ready && W.teleport && W.boardVehicle) { W.teleport(S.x + S.r + 1.2 * M, S.z); W.rig.heading = it.yaw * Math.PI / 2; W.boardVehicle(it.id); if (W.mode === 'ride') st.boarded = true; } return; }
      if (a.tie && W.mode === 'walk' && W.board && W.ship) { W.teleport(W.ship.position.x + 3 * M, W.ship.position.z); W.board(); if (W.mode === 'fly') st.boarded = true; return; }
      st.boarded = true;
    }
    /** AHEAD m: the point that far along the clearest of eight headings (the figure's own first), so a walk does not start into a wall. */
    function aimAhead(a, st) {
      if (st.aimed || !a.ahead) return; st.aimed = true;
      const ride = W.mode === 'ride' && W.veh, p = ride ? W.veh.pos : W.rig.pos, h0 = ride ? W.veh.heading : W.rig.heading, d = a.ahead * M;
      const shipR = 7 * M, ship = W.ship && W.mode !== 'fly' ? W.ship.position : null;
      const blocked = h => { let n = 0; for (let t = 0.12; t <= 1; t += 0.11) { const x = p.x + Math.sin(h) * d * t, z = p.z + Math.cos(h) * d * t; let hit = false;
        if (W.city && window.Bricks) for (const b of W.city.near(x, z, 2 * M)) if (Bricks.pointInRing(x / M, z / M, b.ring)) { hit = true; break; }
        if (!hit && W.props) for (const it of W.props.near(x, z, 2 * M)) { const b = it.box; if (b && x > b.min.x - M && x < b.max.x + M && z > b.min.z - M && z < b.max.z + M && !(ride && W.veh.prop === it)) { hit = true; break; } }
        if (!hit && ship && Math.hypot(ship.x - x, ship.z - z) < shipR) hit = true;
        if (hit) n++; } return n; };
      let best = h0, bn = blocked(h0); if (bn) for (let k = 1; k < 8 && bn; k++) { const h = h0 + k * Math.PI / 4 * (k % 2 ? 1 : -1); const n = blocked(h); if (n < bn) { bn = n; best = h; } }
      a.kind = ride ? 'drive' : 'walk'; a.x = p.x + Math.sin(best) * d; a.z = p.z + Math.cos(best) * d;
      if (!ride && W.rig) { W.rig.heading = best; W.rig.figure.rotation.y = best; }
    }
    const laidAll = () => { if (!W.vehicles) return true; const l = W.vehicles.list(); return l.every(v => v.ready); };
    /** The planet and the character a shot plays in: its own SET, or the last one before it, so a shot played on its own starts where the reel would have it. */
    function setFor(i) { const out = { world: null, as: null }; for (let k = i; k >= 0; k--) { const st = F.shots[k].set; if (!st) continue; if (!out.world && st.world) out.world = st.world; if (!out.as && st.as) out.as = st.as; if (out.world && out.as) break; } return out.world || out.as ? out : null; }
    F.ground = () => { if (W.filmGround) W.filmGround(); };
    /** The title card on the page while a title shot plays (the take draws its own). */
    function showTitle(s) {
      let el = document.getElementById('title'); if (!el) { el = document.createElement('div'); el.id = 'title'; el.innerHTML = '<span></span>'; document.body.appendChild(el); }
      el.hidden = !s; if (s) { el.dataset.style = s.style || 'card'; el.querySelector('span').textContent = s.title; if (s.style === 'hud') paintHud(s, 0); }
    }
    /** The hud overlay on the page, drawn over the band. */
    function paintHud(s, t) {
      const el = document.getElementById('title'); if (!el) return; let c = el.querySelector('canvas'); if (!c) { c = document.createElement('canvas'); el.appendChild(c); }
      const pr = Math.min(devicePixelRatio || 1, 2), b = F.band(); if (c.width !== Math.round(b.W * pr) || c.height !== Math.round(b.H * pr)) { c.width = Math.round(b.W * pr); c.height = Math.round(b.H * pr); }
      const ctx = c.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.setTransform(pr, 0, 0, pr, 0, 0); ctx.translate(b.x, b.H - b.y - b.h); drawHud(ctx, b.w, b.h, s, t);
    }

    /* ── the step: the reel's clock, the free camera's dolly, the sun ── */
    F.step = dt => {
      if (F.hold) { const s = F.shots[F.play.i], now = performance.now(); if (window.Sound) Sound.held = true; if (now > F.hold.until || (now > F.hold.least && laidAll())) { F.hold = null; if (s) settle(s); } else return; }   // the clock waits for the planet's things
      if (window.Sound) { Sound.held = false; if (F.play.on) Sound.tick(); }
      if (F.rec) F.rec.t += dt; if (F.caption && F.play.on && F.play.t >= F.caption.until) { F.caption = null; showCaption(null); }
      if (F.play.on && F.actState) stepAct(dt);
      if (F.play.on) {
        F.play.t += dt; const s = F.shots[F.play.i];
        if (s) { for (const ev of F.pending) if (!ev.done && F.play.t >= ev.at) { ev.done = true; fireEvent(ev, s); } if (s.title != null && s.style === 'hud' && (F.hudAcc = (F.hudAcc || 0) + dt) > 0.08) { F.hudAcc = 0; paintHud(s, F.play.t); } }
        if (!s || F.play.t >= s.sec - 1e-9) {
          if (F.play.all && F.play.i + 1 < F.shots.length) { F.play.i++; F.play.t = 0; F.sel = F.play.i; enter(F.play.i); if (F.onChange) F.onChange('cut'); }
          else { F.stop(); if (F.rec && F.rec.until == null) F.rec.done = true; }
        }
      } else if (F.mode === 'shot') { const s = F.shots[F.sel]; if (s && s.keys.length > 1) F.viewT = Math.min(F.viewT + dt, s.sec); }   // a move is previewed once, then holds its last key
      if (F.mode === 'free' && !F.play.on) {
        const I = W.input, f = F.free, run = I.run || I.boost || I.runHook, v = (run ? 18 : 6) * M * dt;
        if (I.look) { F.look(I.look.dx, I.look.dy); I.look.dx = I.look.dy = 0; }
        if (I.L && I.L.mag) { const fx = -Math.sin(f.yaw), fz = -Math.cos(f.yaw), rx = Math.cos(f.yaw), rz = -Math.sin(f.yaw); f.pos.x += (fx * I.L.y + rx * I.L.x) * v; f.pos.z += (fz * I.L.y + rz * I.L.x) * v; f.pos.y += Math.sin(f.pitch) * I.L.y * v; }
        const g = groundH(f.pos.x, f.pos.z) + 0.4 * M; if (f.pos.y < g) f.pos.y = g;
      }
      if (F.sun) applySun();
    };

    /* ── direction: the figure or the ride goes where the shot says ── */
    const act = () => F.play.on && F.shots[F.play.i] && F.shots[F.play.i].act;
    /** The act's running parts: the throttle of a flight, the trigger, the saber. */
    function stepAct(dt) {
      const a = act(), st = F.actState, I = W.input; if (!a || !st) return;
      if (!st.boarded) { board(a, st); if (!st.boarded) return; } aimAhead(a, st);
      if (a.fly && W.mode === 'fly') { I.fly.x = 0; I.fly.y = 0.35; I.fly.mag = 0.6; I.fly.held = true; }   // a ride's flight is steered from the ride branch (F.steer)
      if (a.fire) { st.fireT += dt; if (st.fireT > 0.45) { st.fireT = 0; if (W.mode === 'fly' || W.mode === 'ride') I.fireOnce = true; else I.saber = true; } }
      if (a.saber) { st.saberT += dt; if (st.saberT > 1.1) { st.saberT = 0; if (W.mode === 'walk') I.saber = true; } }
    }
    F.acting = () => { const a = act(); return !!a && !F.hold && ((a.kind === 'walk' && W.mode === 'walk') || (W.mode === 'ride' && (a.kind === 'drive' || a.fly || a.route || a.chase || a.alongside || a.charge || a.brake || a.turnabout))); };
    F.move = out => {
      const a = act(), p = W.rig.pos; if (!a) { out.x = out.z = out.mag = 0; return out; }
      const dx = a.x - p.x, dz = a.z - p.z, d = Math.hypot(dx, dz);
      if (d < 1 * M) { out.x = out.z = out.mag = 0; F.running = false; return out; }
      out.x = dx / d; out.z = dz / d; out.mag = 1; F.running = d > 8 * M; return out;
    };
    F.steer = V => {
      const a = act(); if (!a) return; V.input.boost = false;
      const alt = V.pos.y - groundH(V.pos.x, V.pos.z), hover = V.K.stall === 0;
      const lift = !a.fly ? 0 : hover ? (alt < 2.5 * M ? 0.5 : alt > 4 * M ? -0.3 : 0) : (!V.airborne || alt < 12 * M ? 1 : 0.1);   // a hover skims two and a half metres up; a plane climbs to twelve, then levels
      if (a.route || a.chase || a.alongside || a.charge || a.brake || a.turnabout) { const st = F.actState || (F.actState = {}), g = guide(a, st, V.pos, V.heading), h = hover ? (alt < (g.alt || 2.5) * M - 0.5 * M ? 0.5 : alt > (g.alt || 2.5) * M + 0.5 * M ? -0.3 : 0) : lift; if (g.want != null) { const err = wrap(g.want - V.heading); V.input.x = clamp(-err * 1.6, -1, 1); } else V.input.x = 0; V.input.y = V.fly ? h : g.speed; V.input.mag = g.speed; V.input.boost = !!a.charge || g.speed > 1; if (a.brake) { V.input.mag = 0; if (!V.fly) V.input.y = -0.5; } return; }
      if (a.kind !== 'drive') { V.input.x = 0; V.input.y = lift; V.input.mag = a.fly ? 1 : 0; return; }   // a flight with no point: straight on
      const dx = a.x - V.pos.x, dz = a.z - V.pos.z, d = Math.hypot(dx, dz), err = wrap(Math.atan2(dx, dz) - V.heading);
      V.input.x = clamp(-err * 1.5, -1, 1); V.input.y = a.fly ? lift : d > 3 * M ? (Math.abs(err) > 1.2 ? 0.35 : 1) : 0; V.input.mag = a.fly ? 1 : Math.min(1, Math.hypot(V.input.x, V.input.y));
    };

    /* ── actors: props the film drives, crowds it routs, builds it lays ── */
    function legPoint(a, part) {
      if (!a.it || !a.it.group) return null; const g = a.it.group.getObjectByName(part); const P = new THREE.Vector3();
      if (g) { g.getWorldPosition(P); return { x: P.x, z: P.z, top: P.y, bottom: groundH(P.x, P.z) }; }
      const V = a.V, sx = Math.sin(V.heading), cx = Math.cos(V.heading), back = /r/.test(part.slice(4)) ? -1 : 1, left = /l$/.test(part) ? 1 : -1;   // leg-rl: rear left
      const x = V.pos.x + sx * V.hz * 0.6 * back + cx * V.hx * 0.6 * left, z = V.pos.z + cx * V.hz * 0.6 * back - sx * V.hx * 0.6 * left, b = a.it.box; return { x, z, top: b.min.y + (b.max.y - b.min.y) * 0.45, bottom: groundH(x, z) };
    }
    /** A minifig the film owns: built by the page's rig maker, walked by Minifig.step against the world's floor and walls. */
    const figWorld = { groundH, pushOut: (pos, r) => { if (W.filmPush) W.filmPush(pos, r); } };
    const fwdOf = h => new THREE.Vector3(Math.sin(h), 0, Math.cos(h));
    function layFigure(a) {
      if (!W.filmRig) return; const rig = W.filmRig(a.figure); if (!rig) return;
      rig.pos.set(a.x, groundH(a.x, a.z), a.z); rig.heading = headingOf(a.heading || 0); rig.figure.rotation.y = rig.heading; rig.figure.visible = true; rig.def = rig.def || Minifig.DEFS[a.figure];
      a.rig = rig; a.poseNow = a.pose || 'stand'; a.ready = true; applyPose(a);
      if (window.Perform) { a.perf = Perform.attach(a, rig); const def = rig.def || {}; if (window.Face && !def.bare && !def.sculpt) a.perf.face = Face.attach(rig, def.face || 'lego'); if (a.pose && Perform.PHRASES[a.pose]) Perform.phrase(a.perf, a.pose, 0, { enter: 0.01 }); }
    }
    function seatRider(a) {
      if (!a.rider || !W.filmRig || !W.filmSeat || !a.V || !a.it || !a.it.box) return; const rr = W.filmRig(a.rider); if (!rr) return;
      rr.def = rr.def || Minifig.DEFS[a.rider]; W.filmSeat(rr, a.V); a.riderRig = rr;
    }
    async function layActor(a) {
      if (a.figure) { layFigure(a); return; }
      if (a.crowd) { a.npcs = []; if (!W.crowd) return; for (let i = 0; i < a.n; i++) { const ang = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * a.r, n = W.crowd.spawn(a.kind === 'rebels' ? 'rebel' : a.kind, a.x + Math.cos(ang) * rr, a.z + Math.sin(ang) * rr, i); if (n) { n.film = a.name; a.npcs.push(n); } } return; }
      const mpd = a.kit ? `0 KIT ${a.kit}` : Dsl.vehicleMPD({ kind: a.kind, len: a.len || (a.kind === 'speeder' ? 7 : 8), col: a.col == null ? 71 : a.col }).mpd;
      const it = await W.props.place(mpd, a.x, groundH(a.x, a.z), a.z, 0, true, { op: a.kit ? 'kit' : 'vehicle', kit: a.kit || undefined, kind: a.kit || a.kind, len: a.len, col: a.col, film: a.name });
      if (!it || !F.actors.has(a.name)) { if (it) W.props.remove(it.id, true); return; }
      a.it = it; a.V = Drive.create({ prop: it, M, groundH, aabbs: (x, z, r) => (W.props ? W.props.aabbs(x, z, r).filter(b => b !== it.box) : []) }); a.V.heading = headingOf(a.heading || 0);
      if (a.V.fly && a.alt) { a.V.pos.y += a.alt * M; a.V.airborne = true; }
      Drive.step(a.V, 0, W.filmCtx(a.V)); if (W.props.moved) W.props.moved(it); syncProp(a); seatRider(a);
    }
    function layBuild(b) {
      if (!window.Dsl || !W.build) return; const res = Dsl.compile(b.program); const ay = groundH(b.x, b.z); const rows = Dsl.toRows(res, { ax: b.x, ay, az: b.z, prefix: 'film-' + b.name });
      const pieces = W.build.addRows(rows, true, true); let lo = [Infinity, Infinity], hi = [-Infinity, -Infinity], top = ay;
      for (const r of rows) { lo[0] = Math.min(lo[0], r[3]); hi[0] = Math.max(hi[0], r[3]); lo[1] = Math.min(lo[1], r[5]); hi[1] = Math.max(hi[1], r[5]); top = Math.max(top, r[4] + 24); }
      F.builds.set(b.name, { name: b.name, program: b.program, ax: b.x, az: b.z, ids: pieces.map(p => p.id), x: (lo[0] + hi[0]) / 2, z: (lo[1] + hi[1]) / 2, y0: ay, h: Math.max(top - ay, M), r: Math.max(hi[0] - lo[0], hi[1] - lo[1]) / 2 + M, w: hi[0] - lo[0], d: hi[1] - lo[1] });
    }
    /** The scene's actors and builds stand; the planet, the character and the ground it asked for are set first. */
    F.setup = async () => {
      const sc = F.scene; if (!sc || sc.up) return; sc.up = true; if (F.kept) { if (!sc.groundWas && F.kept.groundWas) sc.groundWas = F.kept.groundWas; F.kept = null; }
      if (sc.world && W.setWorld && W.world !== sc.world) W.setWorld(sc.world);
      if (sc.ground && W.setGround && W.G && W.G.mode !== sc.ground) { sc.groundWas = W.G.mode; W.setGround(sc.ground); for (let i = 0; i < 150 && !(W.G && W.G.mode === sc.ground && W.ready && !W.relanding); i++) await new Promise(r => setTimeout(r, 100)); }   // the ground is laid again first, on its own: a character's kits would block the page while its tiles load
      if (sc.as && W.setCharacter && W.character !== sc.as) { F.ground(); W.setCharacter(sc.as); }
      if (sc.weather && W.setWeather) W.setWeather(sc.weather); if (sc.time && W.setSky) W.setSky(sc.time);
      if (sc.me === 'off' && W.rig) { sc.meWas = W.rig.figure.visible; W.rig.figure.visible = false; sc.hid = []; if (W.ship && W.ship.visible) { W.ship.visible = false; sc.hid.push(W.ship); } if (W.props) for (const it of W.props.items.values()) if (it.src && it.src.me && it.group && it.group.visible) { it.group.visible = false; sc.hid.push(it.group); } }   // a scene with no part for the player keeps them, and their ride, out of the frame
      const sp = W.spawn || (W.rig && W.rig.pos) || new THREE.Vector3();
      if (sc.set && W.filmSet) { const st = sc.set; if (!st.abs) { st.centre = st.centre ? { x: sp.x + st.centre.x * M, z: sp.z + st.centre.z * M } : { x: sp.x, z: sp.z }; if (st.corridor) st.corridor = st.corridor.map(p => [sp.x / M + p[0], sp.z / M + p[1]]); st.abs = true; }
        if (sc.routes && !sc.routesAbs) { for (const k of Object.keys(sc.routes)) sc.routes[k] = sc.routes[k].map(p => [sp.x / M + p[0], sp.z / M + p[1]]); sc.routesAbs = true; }
        W.filmSet(st.kind, { centre: st.centre, r: st.r, seed: st.seed, corridor: st.corridor ? st.corridor.map(p => [p[0], p[1]]) : null }); }   // the corridor is in metres, absolute
      if (!sc.abs) { for (const a of sc.actors) { a.x = sp.x + a.x * M; a.z = sp.z + a.z * M; if (a.r) a.r *= 1; } for (const b of sc.builds) { b.x = sp.x + b.x * M; b.z = sp.z + b.z * M; } for (const s of F.shots) { if (s.act && s.act.rel) { s.act.x += sp.x; s.act.z += sp.z; delete s.act.rel; } for (const a of s.acts || []) { if (a.to && a.rel) { a.to.x = sp.x + a.to.x * M; a.to.z = sp.z + a.to.z * M; delete a.rel; } if (a.aim && typeof a.aim === 'object' && a.rel !== false) { a.aim.x = sp.x + a.aim.x * M; a.aim.z = sp.z + a.aim.z * M; } if (a.look && typeof a.look === 'object' && a.look.rel) { a.look.x = sp.x + a.look.x * M; a.look.z = sp.z + a.look.z * M; delete a.look.rel; } } for (const ev of s.events || []) if (ev.x != null && ev.rel) { ev.x = sp.x + ev.x * M; ev.z = sp.z + ev.z * M; delete ev.rel; } } sc.abs = true; }
      if (sc.actors.some(a => a.crowd) && W.crowd) for (const n of W.crowd.npcs.slice()) W.crowd.remove(n);   // the place's own crowd makes room for the scene's
      for (const a of sc.actors) F.actors.set(a.name, a); for (const b of sc.builds) layBuild(b);
      await Promise.all(sc.actors.map(a => layActor(a).catch(e => F.log.push('actor ' + a.name + ': ' + (e.message || e)))));
      sc.ready = true; if (F.onChange) F.onChange('scene');
    };
    F.teardown = keepSet => {
      const sc = F.scene; if (W.mode === 'ride' && W.veh && W.veh.prop && W.veh.prop.src && W.veh.prop.src.film) F.ground();   // off a ride the film laid before it goes
      if (sc && sc.set && keepSet) F.kept = { groundWas: sc.groundWas }; for (const a of F.actors.values()) { if (a.it) W.props.remove(a.it.id, true); if (a.npcs && W.crowd) for (const n of a.npcs) W.crowd.remove(n); if (a.perf && a.perf.face && window.Face) Face.detach(a.perf.face); if (a.rig) dropRig(a.rig); if (a.riderRig) dropRig(a.riderRig); }
      for (const L of F.loose) dropRig(L.rig); F.loose = []; for (const L of F.lights2) W.scene.remove(L.L); F.lights2 = []; F.caption = null; showCaption(null); F.deflect = null; F.flip = 0; F.proneUntil = 0;
      for (const b of F.builds.values()) for (const id of b.ids) W.build.take(id, true);
      if (W.props) for (const it of [...W.props.items.values()]) if (it.src && it.src.film) W.props.remove(it.id, true);   // whatever a film laid and lost track of
      if (W.crowd) for (const n of W.crowd.npcs.slice()) if (n.film) W.crowd.remove(n);
      for (const m of F.meshes) { W.scene.remove(m); if (m.geometry) m.geometry.dispose(); } F.meshes = []; F.actors.clear(); F.builds.clear(); F.cable = null; F.hang = null; F.prone = false; F.rout = null; F.strikes = null; F.pending = [];
      if (W.rig) W.rig.figure.rotation.x = 0; if (sc && sc.me === 'off' && W.rig && sc.meWas != null) { W.rig.figure.visible = sc.meWas; for (const o of sc.hid || []) o.visible = true; } if (sc && sc.set && W.filmSet) { if (!keepSet) W.filmSet(null, { ground: sc.groundWas || null }); } else if (sc && sc.groundWas && W.setGround) W.setGround(sc.groundWas); F.scene = null; return true;
    };
    const aimPoint = aim => { if (!aim) return null; if (typeof aim === 'object') return new THREE.Vector3(aim.x, groundH(aim.x, aim.z) + 0.5 * M, aim.z); const S = F.subject(aim); return new THREE.Vector3(S.x, S.y0 + S.h * 0.4, S.z); };
    /** The scene's routes: a named polyline (the set's corridor by default), in LDU. */
    const routeOf = name => { const sc = F.scene; if (!sc) return null; const r = sc.routes && sc.routes[name]; const path = r || (sc.set && sc.set.corridor); if (!path || path.length < 2) return null; return path.map(p => ({ x: p[0] * M, z: p[1] * M })); };
    /** Where a guided act wants to go: the next waypoint of a route, a point behind or beside another actor, straight at one, a half turn, a stop. */
    function guide(act, st, pos, heading) {
      let want = null, speed = act.speed != null ? act.speed : 1, alt = act.alt;
      if (act.turnabout && !st._turned) { if (st._turn == null) st._turn = wrap(heading + Math.PI); const err = wrap(st._turn - heading); if (Math.abs(err) < 0.3) st._turned = true; else return { want: st._turn, speed: 0.4, alt }; }
      if (act.route) { const path = routeOf(act.route); if (path) { if (st._wp == null) { let bi = 0, bd = Infinity; path.forEach((p, i) => { const d = Math.hypot(p.x - pos.x, p.z - pos.z); if (d < bd) { bd = d; bi = i; } }); st._wp = bi; } let wp = path[Math.min(st._wp, path.length - 1)]; while (st._wp < path.length - 1 && Math.hypot(wp.x - pos.x, wp.z - pos.z) < 7 * M) { st._wp++; wp = path[st._wp]; } const dx = wp.x - pos.x, dz = wp.z - pos.z, d = Math.hypot(dx, dz); if (st._wp >= path.length - 1 && d < 3 * M) speed = 0; else { const nx = path[Math.min(st._wp + 1, path.length - 1)], bias = d < 18 * M ? 0.35 : 0; want = Math.atan2(dx + (nx.x - wp.x) * bias, dz + (nx.z - wp.z) * bias); } } }
      else if (act.chase) { const T = F.subject(act.chase), back = (act.behind || 8) * M, hT = T.heading || 0, tx = T.x - Math.sin(hT) * back, tz = T.z - Math.cos(hT) * back, dx = tx - pos.x, dz = tz - pos.z, d = Math.hypot(dx, dz); want = d > 2 * M ? Math.atan2(dx, dz) : hT; if (act.speed == null) speed = d > back * 3 ? 1.2 : d > back * 0.6 ? 1 : 0.7; }   // far behind: the boost
      else if (act.alongside) { const T = F.subject(act.alongside), side = (act.side || 3) * M, hT = T.heading || 0, tx = T.x + Math.cos(hT) * side, tz = T.z - Math.sin(hT) * side, dx = tx - pos.x, dz = tz - pos.z, d = Math.hypot(dx, dz); want = d > 3 * M ? Math.atan2(dx, dz) : hT; if (act.speed == null) speed = d > 8 * M ? 1 : 0.75; }
      else if (act.charge) { const T = typeof act.charge === 'object' ? act.charge : F.subject(act.charge), dx = T.x - pos.x, dz = T.z - pos.z; want = Math.atan2(dx, dz); speed = 1.2; }
      if (act.brake) speed = 0;
      return { want, speed, alt };
    }
    const guided = act => !!(act.route || act.chase || act.alongside || act.charge || act.brake || act.turnabout);
    function driveActor(a, act, dt) {
      const V = a.V; let want = null, speed = act.speed != null ? act.speed : 0.6;
      if (guided(act)) { const g = guide(act, act, V.pos, V.heading); want = g.want; speed = g.speed; if (g.alt) act.alt = g.alt; V.input.boost = speed > 1; }
      else if (act.march != null) want = headingOf(act.march);
      else if (act.to) { const dx = act.to.x - V.pos.x, dz = act.to.z - V.pos.z; if (Math.hypot(dx, dz) < 3 * M) speed = 0; else want = Math.atan2(dx, dz); }
      else if (act.orbit) { const T = F.subject(act.orbit), R = (act.r || 20) * M, ang = Math.atan2(V.pos.x - T.x, V.pos.z - T.z), nx = T.x + Math.sin(ang + 0.55) * R, nz = T.z + Math.cos(ang + 0.55) * R; want = Math.atan2(nx - V.pos.x, nz - V.pos.z); speed = act.speed != null ? act.speed : 1; }
      else if (act.pass) { if (!act._end) { const T = F.subject(act.pass), dx = T.x - V.pos.x, dz = T.z - V.pos.z, d = Math.hypot(dx, dz) || 1; act._end = { x: T.x + dx / d * 110 * M, z: T.z + dz / d * 110 * M }; } const dx = act._end.x - V.pos.x, dz = act._end.z - V.pos.z; if (Math.hypot(dx, dz) > 4 * M) want = Math.atan2(dx, dz); speed = act.speed != null ? act.speed : 1; }
      else if (act.halt) speed = 0;
      if (want != null) { const err = wrap(want - V.heading); V.input.x = clamp(-err * 1.5, -1, 1); }
      V.input.y = speed; V.input.mag = speed;
      if (V.fly) { const alt = V.pos.y - groundH(V.pos.x, V.pos.z), wantAlt = (act.alt || (V.K.stall === 0 ? 2.5 : 8)) * M, tol = V.K.stall === 0 ? 0.4 * M : M; V.input.y = act.land ? -0.5 : alt < wantAlt - tol ? 0.6 : alt > wantAlt + tol ? -0.35 : 0; V.input.mag = speed === 0 ? 0 : Math.max(Math.min(speed, 1), 0.3); }
      else if (act.brake) V.input.y = -0.5;
    }
    function stepActors(dt) {
      for (const a of F.actors.values()) {
        if (a.rig) { stepFigure(a, dt); continue; }
        if (!a.V || a.crowd) continue;
        if (a.fall) { stepFall(a, dt); continue; } if (a.down) continue;
        const V = a.V, act = a.act; V.input.x = 0; V.input.y = 0; V.input.mag = 0; V.input.boost = false;
        if (act && F.play.on) { driveActor(a, act, dt); if (act.fire && (a.fireT = (a.fireT || 0) + dt) > (act.every || 1.5)) { a.fireT = 0; W.filmFx.fire(V, !!act.heavy, 'film', aimPoint(act.aim)); if (a.riderRig) { a.riderRig.aim = 1; a.riderRig.aimUntil = a.riderRig.t + 1; Minifig.pose(a.riderRig, { phase: 0, gait: 0, t: 0, swing: null, aim: 1, sit: true }); } } }
        if (a.shove) { const sh = a.shove; sh.t += dt; const u = clamp(sh.t / sh.over, 0, 1); if (a.riderRig) a.riderRig.torsoP.rotation.x = -0.75 * Math.sin(u * Math.PI); V.heading += sh.side * 0.9 * dt; if (u >= 1) { a.shove = null; if (a.riderRig) a.riderRig.torsoP.rotation.x = 0; } }   // the rider tips back, the bike veers
        if (a.crashInto && W.sets) { const hit = W.sets.hitTrunk(V.pos, Math.max(V.hx || M, 0.8 * M)), ok = hit && (a.crashInto === 'log' ? !!hit.log : !hit.log), T = a.crashAt, near = T && Math.hypot(T.x - V.pos.x, T.z - V.pos.z) < 2.6 * M; if (ok || near) { explode(a, { scale: 1 }); continue; } }
        Drive.step(V, dt, W.filmCtx(V));
        if ((a.syncAcc = (a.syncAcc || 0) + dt) > 0.2 || Math.abs(V.speed) > 0.5 * M) { a.syncAcc = 0; syncProp(a); }   // a moving actor's box follows it every step, so a follow shot stays on it   // the prop's place and box follow the drive, so subjects and the clear line see where it is
      }
    }
    /** The prop record catches up with its group: position, yaw, box. */
    function syncProp(a) { const it = a.it, V = a.V; if (!it || !V || !it.group) return; it.x = V.pos.x; it.y = V.pos.y - (V.K.hover || 0) * M; it.z = V.pos.z; it.yaw = V.heading / (Math.PI / 2); it.group.updateMatrixWorld(true); it.box.setFromObject(it.group); }
    const dropRig = rig => { const f = rig.figure; if (f && f.parent) f.parent.remove(f); };
    /** A figure's pose after its step: stand, crouch (knees bent, low), prone (flat on the floor), aim and point (the arm up), sit (on a ride). */
    function applyPose(a) {
      const rig = a.rig, p = a.poseNow || 'stand'; if (!rig || rig.seated) return;
      if (p === 'prone') { rig.figure.rotation.x = -Math.PI / 2; rig.torsoP.rotation.x = 0; if (!rig.air) rig.pos.y = groundH(rig.pos.x, rig.pos.z) + 0.15 * M; return; }
      if (!rig.air) rig.figure.rotation.x = 0;
      if (p === 'crouch') { rig.hipsP.position.y -= 14; rig.legRP.rotation.x = -75 * DEG; rig.legLP.rotation.x = -30 * DEG; rig.torsoP.rotation.x = 0.3; } else rig.torsoP.rotation.x = 0;
    }
    function fireFrom(a, act) {
      const rig = a.rig, bolts = W.filmFx.bolts && W.filmFx.bolts(); if (!bolts) return; const at = aimPoint(act.aim), o = rig.pos.clone(); o.y += 1.3 * M; o.addScaledVector(fwdOf(rig.heading), 0.7 * M);
      const dir = at ? at.clone().sub(o).normalize() : fwdOf(rig.heading); bolts.fire(o, dir, 'film', 1200); if (Fx.Sfx.blaster) Fx.Sfx.blaster();
    }
    function mount(a, B) { if (!W.filmSeat) return; const taken = (W.mode === 'ride' && W.veh && W.veh.prop === B.it) || B.riderRig || [...F.actors.values()].some(o => o !== a && o.riding === B.name); W.filmSeat(a.rig, B.V); if (taken) a.rig.figure.position.z -= 0.62 * M; a.riding = B.name; a.rig.figure.rotation.x = 0; }
    function dismount(a) { const B = F.actors.get(a.riding); if (W.filmUnseat) W.filmUnseat(a.rig); if (B && B.V) { a.rig.pos.copy(B.V.pos); a.rig.heading = B.V.heading; } a.rig.pos.y = groundH(a.rig.pos.x, a.rig.pos.z); a.rig.figure.rotation.y = a.rig.heading; a.riding = null; }
    /** A figure actor's frame: the act's target (a point, a distance ahead, another actor to follow), its pose, its trigger; then the minifig walks. */
    function stepFigure(a, dt) {
      const rig = a.rig, act = a.act; if (!rig) return;
      if (a.riding) { const B = F.actors.get(a.riding); if (!B || !B.V || B.down) { if (B && B.down) dismount(a); else a.riding = null; } else { if (act && act.leave && F.play.on) dismount(a); else return; } }
      const ctl = { move: { x: 0, z: 0, mag: 0 }, run: false, saber: false, aim: false }; let target = null;
      if (act && F.play.on && !a.down) {
        if (act.ride) { const B = F.actors.get(act.ride); if (B && B.V && B.it && B.it.ready && !B.down) { mount(a, B); return; } }
        if (act.to) target = act.to; else if (act.ahead) { if (!act._pt) act._pt = { x: rig.pos.x + Math.sin(rig.heading) * act.ahead * M, z: rig.pos.z + Math.cos(rig.heading) * act.ahead * M }; target = act._pt; }
        else if (act.follow) { const T = F.subject(act.follow); if (Math.hypot(T.x - rig.pos.x, T.z - rig.pos.z) > (act.behind || 3) * M) target = { x: T.x, z: T.z }; }
        if (act.pose && a.poseNow !== act.pose && !a.poseUntil) a.poseNow = act.pose;
        if (act.look && (!target || Math.hypot(target.x - rig.pos.x, target.z - rig.pos.z) <= 0.9 * M)) { const L = typeof act.look === 'string' ? F.subject(act.look) : act.look; rig.heading = Math.atan2(L.x - rig.pos.x, L.z - rig.pos.z); }
        if (act.saber && (a.saberT = (a.saberT || 0) + dt) > 1.1) { a.saberT = 0; ctl.saber = true; }
        if (act.fire && (a.fireT = (a.fireT || 0) + dt) > (act.every || 1.2)) { a.fireT = 0; fireFrom(a, act); ctl.aim = true; if (act.aim) { const at = aimPoint(act.aim); rig.heading = Math.atan2(at.x - rig.pos.x, at.z - rig.pos.z); } }
      }
      if (target && !a.down && a.poseNow !== 'prone') { const dx = target.x - rig.pos.x, dz = target.z - rig.pos.z, d = Math.hypot(dx, dz); if (d > 0.9 * M) { ctl.move.x = dx / d; ctl.move.z = dz / d; ctl.move.mag = 1; ctl.run = d > 6 * M || !!(act && act.run); } }
      if (a.poseNow === 'aim' || a.poseNow === 'point') ctl.aim = true;
      if (a.poseNow === 'prone' || a.poseNow === 'crouch') ctl.move.mag = 0;
      Minifig.step(rig, dt, ctl, figWorld);
      if (a.flip) { if (rig.air) rig.figure.rotation.x = -((rig.t - a.flip) / 0.9) * Math.PI * 2; else { a.flip = 0; a.poseNow = 'prone'; a.poseUntil = rig.t + 1.2; } }
      if (a.poseUntil && rig.t > a.poseUntil && !a.down) { a.poseUntil = 0; a.poseNow = 'stand'; }
      applyPose(a);
      if (a.perf && window.Perform) Perform.apply(a.perf, F.reelOffset(F.play.i) + F.play.t, { speed: (F.shots[F.play.i] || {}).speed });
    }
    /** Figures the film threw clear (a rider off an exploding bike): they fly, land, and lie there. */
    function stepLoose(dt) { for (const L of F.loose) { const rig = L.rig; if (!rig.air && L.landed) continue; Minifig.step(rig, dt, { move: { x: 0, z: 0, mag: 0 } }, figWorld); if (rig.air) rig.figure.rotation.x = -((rig.t - L.t0) / 0.9) * Math.PI * 2; else { L.landed = true; rig.figure.rotation.x = -Math.PI / 2; rig.pos.y = groundH(rig.pos.x, rig.pos.z) + 0.15 * M; } } }
    function stepLights(dt) { for (const L of F.lights2) { L.t += dt; L.L.intensity = L.i0 * Math.max(0, 1 - L.t / L.over); } F.lights2 = F.lights2.filter(L => { if (L.t < L.over) return true; W.scene.remove(L.L); return false; }); }
    function throwFigure(rig, V, k) { rig.heading = V.heading; const v = new THREE.Vector3(Math.sin(V.heading) * 5 * M * k + (Math.random() - 0.5) * 3 * M, 6.5 * M * k, Math.cos(V.heading) * 5 * M * k + (Math.random() - 0.5) * 3 * M); rig.pos.copy(V.pos); rig.pos.y += 0.5 * M; Minifig.throwRig(rig, v); }
    /** A bike goes up: a fireball, a burst of light, its bricks fly, the rider is thrown, a column of smoke marks the tree. */
    function explode(A, ev) {
      if (!A || !A.V || A.down) return; const V = A.V, p = V.pos.clone(), k = (ev && ev.scale) || 1; p.y += 0.5 * M; A.last = { x: p.x, z: p.z, y: p.y - 0.5 * M, heading: V.heading }; A.wreck = true;
      W.filmFx.blast(p, 3 * M * k, new THREE.Vector3(0, 3 * M, 0), 'torp'); W.filmFx.flash(); W.filmFx.shake(0.45 * k); const sm = W.filmFx.smoke(); sm.puff(p, 28, 2.8 * M * k, 0.1); sm.puff(p, 14, 1.8 * M * k, 0.85); sm.column(p, 30, 10); const sp = F.spatial(p); Fx.Sfx.torpedo(sp); Fx.Sfx.crunch(sp); Fx.Sfx.boom(1.25 * k, sp); for (let q = 0; q < 6; q++) Fx.Sfx.clatter(0.6, { ...sp, dt: 0.12 + q * 0.09 });
      const L = new THREE.PointLight(0xff8a2a, 5 * k, 45 * M * k, 2); L.position.copy(p); L.position.y += M; W.scene.add(L); F.lights2.push({ L, t: 0, over: 0.45, i0: 5 * k });
      if (W.props.fling && !A.it.kit && A.it.meshes) { const V = new THREE.Vector3(); for (const m of A.it.meshes.slice()) { const away = m.getWorldPosition(V).clone().sub(p); away.y += 10; if (away.lengthSq() < 1) away.set(Math.random() - 0.5, 1, Math.random() - 0.5); away.normalize().multiplyScalar((2 + Math.random() * 5) * M); away.y += 5 * M; W.props.fling(m, away); } A.it.meshes = []; }   // its own bricks fly; nothing else near it comes apart
      if (A.riderRig) { const rr = A.riderRig; if (W.filmUnseat) W.filmUnseat(rr); throwFigure(rr, V, 1); F.loose.push({ rig: rr, t0: rr.t }); A.riderRig = null; }
      for (const X of F.actors.values()) if (X.rig && X.riding === A.name) { dismount(X); throwFigure(X.rig, V, 1); X.flip = X.rig.t; }
      if (W.mode === 'ride' && W.veh && W.veh.prop === A.it) ejectMe(V);
      A.down = true; A.fall = null; A.crashInto = null; A.act = null; W.props.remove(A.it.id, true);
    }
    /** The player thrown from the ride: a somersault, a landing, a moment on the ground, then up. */
    function ejectMe(V) { if (!W.filmEject) return; const vel = new THREE.Vector3(Math.sin(V.heading) * 6 * M, 7 * M, Math.cos(V.heading) * 6 * M); W.filmEject(vel); F.flip = W.rig.t; F.prone = false; F.proneUntil = 0; }
    /** Which trunk or log an actor crashes into: the nearest one ahead of it, off the corridor. */
    function aimAtObstacle(A, into) {
      const V = A.V; if (!W.sets) { A.crashAt = { x: V.pos.x + Math.sin(V.heading) * 12 * M, z: V.pos.z + Math.cos(V.heading) * 12 * M }; A.act = { who: A.name, charge: A.crashAt }; return; }
      const f = fwdOf(V.heading); let best = null, bd = Infinity;
      if (into === 'log') { for (const L of W.sets.logs) { const x = (L.ax + L.bx) / 2, z = (L.az + L.bz) / 2, dx = x - V.pos.x, dz = z - V.pos.z, d = Math.hypot(dx, dz); if (d < 200 * M && dx * f.x + dz * f.z > -0.2 * d && d < bd) { bd = d; best = { x, z }; } } }
      else { for (const t of W.sets.trunks) { const dx = t.x - V.pos.x, dz = t.z - V.pos.z, d = Math.hypot(dx, dz); if (d > 6 * M && d < 70 * M && dx * f.x + dz * f.z > 0.3 * d && d < bd) { bd = d; best = { x: t.x, z: t.z }; } } }
      A.crashAt = best || { x: V.pos.x + Math.sin(V.heading) * 15 * M, z: V.pos.z + Math.cos(V.heading) * 15 * M }; A.act = { who: A.name, charge: A.crashAt }; A.crashInto = into;
    }
    /** A line of dialogue at the foot of the band, on the page and in the take. */
    function showCaption(text) { const el = document.getElementById('caption'); if (!el) return; el.hidden = !text; if (text) el.querySelector('span').textContent = text; }
    function drawCaption(ctx, w, h, text) { ctx.save(); const fs = Math.round(h * 0.052); ctx.font = `${fs}px Helvetica, Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = Math.max(2, fs / 8); ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.fillStyle = '#f4f4f0'; ctx.strokeText(text, w / 2, h * 0.94, w * 0.9); ctx.fillText(text, w / 2, h * 0.94, w * 0.9); ctx.restore(); }
    /** Film bolts that come at a figure with a saber go back the way they came. */
    function stepDeflect() {
      const d = F.deflect; if (!d) return; const A = d.who !== 'me' && F.actors.get(d.who), rig = A ? A.rig : W.mode === 'walk' ? W.rig : null; if (!rig) return; const bolts = W.filmFx.bolts && W.filmFx.bolts(); if (!bolts) return; const c = rig.pos.clone(); c.y += 1.2 * M;
      for (const b of bolts.live()) { if (b.owner !== 'film' && b.owner !== 'npc') continue; if (b.mesh.position.distanceTo(c) > 2.2 * M) continue; b.vel.multiplyScalar(-1); b.prev.copy(b.mesh.position); b.owner = 'player'; if (bolts.mats && bolts.mats.green) b.mesh.material = bolts.mats.green; d.n++; if (A) { if (!rig.swing) rig.swing = { t0: rig.t, struck: false }; } else if (W.input) W.input.saber = true; Fx.Sfx.clash(F.spatial(c)); W.filmFx.flash(); }
    }
    /** A walker comes down: nose first about its front feet (trip), or onto its flank after a stumble (topple). */
    function startFall(a, kind, over) { if (!a.V || a.fall || a.down) return; a.fall = { kind, t: 0, over: over || (kind === 'topple' ? 2 : 1.6), pitch: 0, roll: 0, base: a.V.pos.clone(), heading: a.V.heading, done: false }; a.V.speed = 0; a.V.input.mag = 0; a.V.input.y = 0; }
    function stepFall(a, dt) {
      const f = a.fall, V = a.V, g = a.it.group, hz = V.hz, hx = V.hx; f.t += dt; const u = clamp(f.t / f.over, 0, 1), e = u * u;
      const fwd = V1.set(Math.sin(f.heading), 0, Math.cos(f.heading)), side = V2.set(Math.cos(f.heading), 0, -Math.sin(f.heading));
      if (f.kind === 'trip') { f.pitch = -85 * DEG * e; g.position.copy(f.base).addScaledVector(fwd, hz * 0.5 * e); g.rotation.set(0, f.heading, 0, 'YXZ'); g.rotateX(-f.pitch); }
      else { const st = clamp(f.t / 0.5, 0, 1); f.pitch = -10 * DEG * st; f.roll = 85 * DEG * clamp((f.t - 0.5) / Math.max(0.3, f.over - 0.5), 0, 1) ** 2; g.position.copy(f.base).addScaledVector(side, hx * 0.5 * (f.roll / (85 * DEG))); g.rotation.set(0, f.heading, 0, 'YXZ'); g.rotateX(-f.pitch); g.rotateZ(f.roll); }
      if ((f.boxAcc = (f.boxAcc || 0) + dt) > 0.25) { f.boxAcc = 0; syncProp(a); }
      if (u >= 1 && !f.done) {
        f.done = true; a.down = true; const smoke = W.filmFx.smoke(), b = a.it.box, len = hz * 2, H = b.max.y - b.min.y;
        const head = f.kind === 'trip' ? f.base.clone().addScaledVector(fwd, hz + H * 0.6) : f.base.clone().addScaledVector(side, hx + H * 0.5); head.y = groundH(head.x, head.z) + 0.6 * M;
        for (let k = 0; k < 3; k++) { const p = f.base.clone().lerp(head, k / 2); p.y = groundH(p.x, p.z) + 0.4 * M; smoke.puff(p, 18, 3 * M, 0.92); }
        W.filmFx.crater(head, 2.5 * M, 0.6 * M); W.filmFx.shake(0.9); { const sp = F.spatial(head); Fx.Sfx.crunch(sp); Fx.Sfx.thud(1, sp); Fx.Sfx.boom(1, sp); Fx.Sfx.stomp(1.4, sp); } if (f.kind === 'topple') { W.filmFx.blast(head, 4 * M, new THREE.Vector3(0, 3 * M, 0), 'torp'); W.filmFx.flash(); smoke.column(head, 40, 10); }
        if (W.props.moved) W.props.moved(a.it);
      }
    }
    /** The tow cable: from the speeder to the walker's rear leg, wrapped round it turn by turn. */
    function stepCable(dt) {
      const c = F.cable; if (!c || c.frozen) return; c.t += dt; const u = clamp(c.t / c.over, 0, 1), to = F.actors.get(c.to), from = F.actors.get(c.from); if (!to || !to.V) return;
      const L = legPoint(to, c.leg || 'leg-rl'); if (!L) return; const r = Math.max(0.9 * M, to.V.hx * 0.35), turns = c.turns * u, n = Math.max(3, Math.ceil(turns * 14)), pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n, ang = t * turns * Math.PI * 2, y = L.bottom + 0.4 * M + (L.top - L.bottom - 0.8 * M) * (1 - t); pts.push(new THREE.Vector3(L.x + Math.cos(ang) * r, y, L.z + Math.sin(ang) * r)); }
      if (from && from.V && u < 1) pts.push(from.V.pos.clone().addScaledVector(UP, 0.4 * M)); else if (u >= 1) { pts.push(pts[pts.length - 1].clone().addScaledVector(UP, -0.3 * M).add(new THREE.Vector3(r * 2, 0, 0))); c.frozen = true; }
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 3), 0.07 * M, 5, false);
      if (!c.mesh) { c.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.6, metalness: 0.5 })); c.mesh.name = 'cable'; W.scene.add(c.mesh); F.meshes.push(c.mesh); } else { c.mesh.geometry.dispose(); c.mesh.geometry = geo; }
    }
    /** The ascension line: the figure hangs under a walker's belly, drawn up over seconds, then dropped. */
    function stepHang(dt) {
      const h = F.hang; if (!h || !W.rig) return; const a = F.actors.get(h.actor); if (!a || !a.V) { F.hang = null; return; }
      h.t += dt; const u = clamp(h.t / h.over, 0, 1), b = a.it.box, belly = a.V.pos.clone(); belly.y = b.min.y + (b.max.y - b.min.y) * 0.42;
      const g = groundH(belly.x, belly.z), len0 = belly.y - g, len1 = 3.4 * M, len = len0 + (len1 - len0) * u, rig = W.rig;
      if (!rig.airVel) rig.airVel = new THREE.Vector3(); rig.pos.set(belly.x, belly.y - len, belly.z); rig.air = true; rig.vy = 0; rig.airVel.set(0, 0, 0); rig.figure.rotation.x = 0; rig.figure.visible = true;
      const pts = [belly, rig.pos.clone().addScaledVector(UP, 2.5 * M)], geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 2, 0.04 * M, 4, false);
      if (!h.mesh) { h.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2a2d34, roughness: 0.7 })); h.mesh.name = 'line'; W.scene.add(h.mesh); F.meshes.push(h.mesh); } else { h.mesh.geometry.dispose(); h.mesh.geometry = geo; }
    }
    function stepStrikes(dt) {
      const st = F.strikes; if (!st) return; st.acc += dt; if (st.acc < st.every) return; st.acc = 0;
      const p = st.point(); W.filmFx.blast(p, 2.2 * M, new THREE.Vector3((Math.random() - 0.5) * 3 * M, 4 * M, (Math.random() - 0.5) * 3 * M), 'bolt'); W.filmFx.crater(p, 1.3 * M, 0.4 * M); W.filmFx.smoke().puff(p, 16, 2.5 * M, 0.9); W.filmFx.shake(0.2); { const sp = F.spatial(p); Fx.Sfx.crunch(sp); Fx.Sfx.boom(0.6, sp); }
    }
    function stepRout() { const r = F.rout; if (!r) return; const a = F.actors.get(r.crowd), from = F.actors.get(r.from); if (!a || !a.npcs) return; const p = from && from.V ? from.V.pos : null; for (const n of a.npcs) if (n.alive) { n.flee = 2; n.fleeFrom = p; } }
    function fireEvent(ev, s) {
      if (window.Perform && Perform.PERF_EVENTS.has(ev.what)) { Perform.fire(ev, perfCtx()); return; }
      F.fired++; const who = ev.who, A = F.actors.get(who);
      switch (ev.what) {
        case 'CABLE': F.cable = { from: who, to: ev.who2, turns: ev.turns || 3, over: ev.over || 4, t: 0, leg: 'leg-rl', frozen: false }; Fx.Sfx.zip(); break;
        case 'TRIP': if (A) { startFall(A, 'trip', ev.over); if (F.cable && F.cable.to === who) F.cable.frozen = true; } break;
        case 'TOPPLE': if (A) startFall(A, 'topple', ev.over); break;
        case 'BLAST': if (A && A.V) { const V = A.V, b = A.it.box, H = b.max.y - b.min.y, fwd = new THREE.Vector3(Math.sin(V.heading), 0, Math.cos(V.heading)), p = V.pos.clone(); if (ev.part === 'neck') { p.addScaledVector(fwd, V.hz * 0.45); p.y = b.min.y + H * 0.85; } else if (ev.part === 'head') { p.addScaledVector(fwd, V.hz * 0.8); p.y = b.min.y + H * 0.9; } else { p.y = b.min.y + H * 0.42; }
          W.filmFx.blast(p, 3 * M * (ev.scale || 1), new THREE.Vector3(0, 2 * M, 0), 'torp'); W.filmFx.flash(); W.filmFx.shake(0.5 * (ev.scale || 1)); W.filmFx.smoke().puff(p, 30, 3 * M * (ev.scale || 1), 0.15); W.filmFx.smoke().column(p, 30, 12); Fx.Sfx.torpedo(); Fx.Sfx.crunch(); Fx.Sfx.boom(1.1 * (ev.scale || 1), F.spatial(p)); } break;
        case 'HANG': if (F.actors.get(ev.who2)) { F.prone = false; if (W.rig) W.rig.figure.rotation.x = 0; F.hang = { actor: ev.who2, t: 0, over: ev.over || 3 }; } break;
        case 'DROP': Fx.Sfx.whoosh({ size: 0.6 }); if (F.hang) { if (F.hang.mesh) { W.scene.remove(F.hang.mesh); } F.hang = null; } if (W.rig) { if (!W.rig.airVel) W.rig.airVel = new THREE.Vector3(); W.rig.airVel.set(0, 0, 0); W.rig.air = true; W.rig.vy = -1 * M; F.prone = true; } break;
        case 'STRIKE': { const b = F.builds.get(who), every = ev.every; const point = b ? () => new THREE.Vector3(b.x + (Math.random() - 0.5) * b.w, groundH(b.x, b.z), b.z + (Math.random() - 0.5) * b.d) : () => new THREE.Vector3(ev.x + (Math.random() - 0.5) * (ev.r || 4) * M, groundH(ev.x, ev.z), ev.z + (Math.random() - 0.5) * (ev.r || 4) * M);
          if (every) F.strikes = { every, acc: every, point }; else { F.strikes = { every: 9e9, acc: 0, point }; stepStrikes(9e9); F.strikes = null; } break; }
        case 'ROUT': F.rout = { crowd: who, from: ev.who2 }; break;
        case 'CRASH': if (ev.into && A && A.V) { aimAtObstacle(A, ev.into); break; } if (A && A.V) { A.down = true; A.fall = null; const g = A.it.group, p = A.V.pos; p.y = groundH(p.x, p.z) + 0.3 * M; g.position.copy(p); g.rotation.set(0, A.V.heading, 0, 'YXZ'); g.rotateZ(0.35); g.rotateX(0.12); W.filmFx.smoke().column(p.clone().addScaledVector(UP, M), 60, 8); W.filmFx.smoke().puff(p, 20, 3 * M, 0.9); if (W.props.moved) W.props.moved(A.it); if (W.mode === 'ride' && W.veh && W.veh.prop === A.it) { F.ground(); F.prone = true; } } break;
        case 'CAPTION': F.caption = { text: ev.text || '', until: F.play.t + (ev.for || 3) }; showCaption(F.caption.text); break;
        case 'LINE': { const key = window.Sound ? Sound.lineKey(who, ev.text) : null, sec = window.Sound ? Sound.lineSec(key, ev.text) : 2; F.caption = { text: ev.text || '', until: F.play.t + (ev.for || sec + 0.5) }; showCaption(F.caption.text); if (window.Sound) Sound.fire('line', { key, who, text: ev.text, sec }); break; }
        case 'SCORE': if (window.Sound) Sound.cue(who && who !== 'none' ? who : null, ev.over); break;
        case 'SOUND': if (window.Sound && who) Sound.fire(who, { size: ev.k != null ? ev.k : undefined }); break;
        case 'SHOVE': if (A && A.V) A.shove = { t: 0, over: ev.over || 0.9, side: ev.k != null ? ev.k : 1 }; if (ev.who2) { const B = F.actors.get(ev.who2); if (B && B.V) B.shove = { t: 0, over: ev.over || 0.9, side: -1 }; } break;
        case 'EJECT': if (/^(me|myself)$/i.test(who || '')) { if (W.mode === 'ride' && W.veh) ejectMe(W.veh); }
          else if (A && A.rig) { if (A.riding) { const B = F.actors.get(A.riding); dismount(A); if (B && B.V) throwFigure(A.rig, B.V, 0.8); else Minifig.throwRig(A.rig, new THREE.Vector3(0, 5 * M, 0)); A.flip = A.rig.t; } }
          else if (A && A.riderRig) { const rr = A.riderRig; if (W.filmUnseat) W.filmUnseat(rr); throwFigure(rr, A.V, 0.8); F.loose.push({ rig: rr, t0: rr.t }); A.riderRig = null; } break;
        case 'EXPLODE': explode(A, ev); break;
        case 'SEVER': if (A && A.V) { aimAtObstacle(A, 'tree'); A.shove = { t: 0, over: 0.4, side: 1.2 }; W.filmFx.flash(); Fx.Sfx.clash(F.spatial(A.V.pos)); if (W.input) W.input.saber = true; } break;
        case 'DEFLECT': F.deflect = { who: A && A.rig ? who : 'me', until: F.play.t + (ev.for || 3), n: 0 }; break;
        case 'TACKLE': { const B = F.actors.get(ev.who2); if (A && A.rig) { Fx.Sfx.thud(0.7, F.spatial(A.rig.pos)); A.poseNow = 'prone'; A.poseUntil = A.rig.t + (ev.for || 1.8); W.filmFx.smoke().puff(A.rig.pos.clone().addScaledVector(UP, 0.3 * M), 8, 1.2 * M, 0.85); if (B && B.rig) B.rig.pos.copy(A.rig.pos).addScaledVector(fwdOf(A.rig.heading), 0.9 * M); }
          if (B && B.rig) { B.poseNow = 'prone'; B.poseUntil = 0; B.down = true; } break; }
        case 'SHAKE': W.filmFx.shake(ev.k || 0.5); break;
        case 'FLASH': W.filmFx.flash(); break;
      }
    }
    /* ── foley: where a sound stands relative to the camera, and the continuous sources sampled every step ── */
    const SP = { right: new THREE.Vector3(), dir: new THREE.Vector3(), dist: {}, camPrev: null, whooshed: null, phase: {} };
    /** A point's gain, its place in the stereo field and its doppler, seen from the film camera. */
    F.spatial = (pos, id, dt) => {
      const cam = W.camera; if (!cam || !pos) return { gain: 1, pan: 0 }; const d = cam.position.distanceTo(pos), gain = clamp(1 / (1 + d / (18 * M)), 0.03, 1);
      SP.right.set(1, 0, 0).applyQuaternion(cam.quaternion); SP.dir.copy(pos).sub(cam.position); const L = SP.dir.length() || 1; const pan = clamp(SP.dir.dot(SP.right) / L, -1, 1);
      let dop = 1; if (id && dt) { const prev = SP.dist[id]; if (prev != null) { const v = (prev - d) / dt / M; dop = clamp(1 + v / 340 * 4, 0.75, 1.35); } SP.dist[id] = d; }
      return { gain: +gain.toFixed(3), pan: +pan.toFixed(2), dop };
    };
    function stepFoley(dt) {
      const S = window.Sound; if (!S || !F.actors) return;
      for (const a of F.actors.values()) {
        if (a.V && !a.crowd) {
          const V = a.V, sp = F.spatial(V.pos, a.name, dt), s01 = clamp(Math.abs(V.speed) / (V.K.cruise * M), 0, 1.4);
          if (V.fly && V.K.stall === 0) { if (a.down || a.wreck) S.loop('hover:' + a.name, 'hover', null); else S.loop('hover:' + a.name, 'hover', { gain: +(sp.gain * (0.12 + 0.3 * Math.min(1, s01))).toFixed(3), pitch: +((110 + 150 * Math.min(1.2, s01)) * sp.dop).toFixed(1), cutoff: +(500 + 1600 * Math.min(1, s01)).toFixed(0), pan: sp.pan }); }
          else if (V.K.walker) { const on = !a.down && !a.fall && Math.abs(V.speed) > 0.3 * M; S.loop('servo:' + a.name, 'servo', on ? { gain: +(sp.gain * 0.1).toFixed(3), pitch: +(140 + 60 * Math.min(1, s01)).toFixed(1), cutoff: 600, pan: sp.pan } : null); }
        }
        if (a.rig && !a.riding) {
          const rig = a.rig, sp = F.spatial(rig.pos, a.name, dt), ph = SP.phase[a.name] == null ? rig.phase : SP.phase[a.name];
          if (rig.gait > 0.5 && !rig.air && Math.floor(rig.phase / Math.PI) !== Math.floor(ph / Math.PI)) Fx.Sfx.footstep({ size: rig.speed > 5 * M ? 0.7 : 0.4, gain: sp.gain, pan: sp.pan }); SP.phase[a.name] = rig.phase;
          const hum = !!(rig.def && rig.def.saber) && ((a.act && a.act.saber) || (F.deflect && F.deflect.who === a.name) || a.saberOn); Fx.Sfx.saber(hum, 'saber:' + a.name);
          if (rig.swing && !a.swingWas) Fx.Sfx.swing({ id: 'saber:' + a.name, gain: sp.gain, pan: sp.pan }); a.swingWas = !!rig.swing;
        }
      }
      const cam = W.camera; if (cam && W.sets && W.sets.nearestTrunk) { if (SP.camPrev) { const v = cam.position.distanceTo(SP.camPrev) / dt / M; if (v > 6) { const t = W.sets.nearestTrunk(cam.position.x, cam.position.z, 4.5 * M); if (t && t !== SP.whooshed) { SP.whooshed = t; const sp = F.spatial(new THREE.Vector3(t.x, cam.position.y, t.z)); Fx.Sfx.whoosh({ size: +Math.min(1.5, v / 12).toFixed(2), pan: sp.pan }); } } } SP.camPrev = SP.camPrev || new THREE.Vector3(); SP.camPrev.copy(cam.position); }
      S.setBed(bedFor(F.shots[F.play.i]));
    }
    function closeFoley() { const S = window.Sound; if (!S) return; for (const id of Object.keys(S.open)) if (/^(hover|servo|saber):/.test(id) || id === 'bed') S.loop(id, null, null); S.bed = null; SP.dist = {}; SP.camPrev = null; SP.whooshed = null; }
    /** After the world has moved: the actors, the cable, the line, a prone figure, the strikes, the rout. */
    F.late = dt => {
      if (!F.scene) return;
      stepActors(dt); stepCable(dt); stepHang(dt); stepLoose(dt); stepLights(dt); if (F.play.on && window.Sound) stepFoley(dt); if (F.play.on) { stepStrikes(dt); stepRout(); if (F.deflect) { if (F.play.t < F.deflect.until) stepDeflect(); else { F.deflectN = F.deflect.n; F.deflect = null; } } }
      if (F.flip && W.rig) { if (W.rig.air) W.rig.figure.rotation.x = -((W.rig.t - F.flip) / 0.9) * Math.PI * 2; else { F.flip = 0; F.prone = true; F.proneUntil = F.play.t + 1.2; } }
      if (F.proneUntil && F.play.t > F.proneUntil) { F.proneUntil = 0; F.prone = false; if (W.rig) W.rig.figure.rotation.x = 0; }
      if (F.prone && W.rig && W.mode === 'walk' && !W.rig.air) { W.rig.figure.rotation.x = -Math.PI / 2; W.rig.pos.y = groundH(W.rig.pos.x, W.rig.pos.z) + 0.15 * M; }
    };
    /* ── the performance register: beats, envelopes, the close-ups kept for the word they should read as ── */
    F.beats = []; F.asserts = []; F.beat = null; F.envs = {};
    const perfCtx = () => ({ t: F.reelOffset(F.play.i) + F.play.t, perf: who => { const a = F.actors.get(who); return a && a.perf || null; }, subject: who => { try { const S = F.subject(who); return S && (S.x != null) ? { x: S.x, y: S.y, z: S.z } : null; } catch (e) { return null; } }, beat: b => { F.beat = b; F.beats.push(b); if (F.onChange) F.onChange('beat'); }, assert: rec => { F.asserts.push(rec); if (F.onChange) F.onChange('assert'); } });
    /** The envelopes SPEAK lines need, fetched once per program: a file's sidecar (<file>.env.json) or a synthesized line's entry in the manifest. */
    F.prepareEnvs = () => { const want = new Set(); for (const s of F.shots) for (const ev of s.events || []) if (ev.what === 'SPEAK' && ev.file) want.add(ev.file); for (const f of want) if (!F.envs[f]) { F.envs[f] = { hz: 50, env: null }; fetch('./world/lines/' + f.replace(/\.[^.]+$/, '') + '.env.json').then(r => r.ok ? r.json() : null).then(j => { if (j && j.env) F.envs[f] = { hz: j.hz || 50, env: j.env }; }).catch(() => { }); } if (window.Sound && Sound.loadManifest) Sound.loadManifest(); };
    if (window.Perform) {
      Perform.hooks.log = m => F.log.push(m);
      Perform.hooks.line = { sec: ev => (window.Sound ? Sound.lineSec(Sound.lineKey(ev.who, ev.text), ev.text) : 0.3 + String(ev.text || '').split(/\s+/).length * 0.36), play: (ev, sec) => { F.caption = { text: ev.text || '', until: F.play.t + sec + 0.4 }; showCaption(F.caption.text); if (window.Sound) Sound.fire('line', { key: ev.file ? null : Sound.lineKey(ev.who, ev.text), who: ev.who, text: ev.text, sec, file: ev.file || null, from: ev.from || 0, voice: ev.voice || null }); } };
      Perform.hooks.env = ev => { if (ev.file) { const e = F.envs[ev.file]; if (!e || !e.env) return null; const hz = e.hz || 50, a = Math.floor((ev.from || 0) * hz), b = ev.for != null ? Math.ceil((ev.from + ev.for) * hz) : e.env.length; return { hz, env: e.env.slice(a, b) }; } if (window.Sound && Sound.lineEnv) { const env = Sound.lineEnv(Sound.lineKey(ev.who, ev.text)); return env ? { hz: 50, env } : null; } return null; };
      Perform.hooks.face = (P, name) => (W.filmFace ? W.filmFace(P.rig, name) : false);
      Perform.hooks.snapshot = P => (W.filmCloseup ? W.filmCloseup(P.rig) : null);
    }
    F.sceneState = () => ({ perform: [...F.actors.values()].filter(a => a.perf).map(a => (window.Perform ? Perform.stats(a.perf) : null)), beat: F.beat, beats: F.beats.length, asserts: F.asserts.length, name: F.scene ? F.scene.name : null, up: !!(F.scene && F.scene.up), ready: !!(F.scene && F.scene.ready), actors: [...F.actors.keys()], builds: [...F.builds.values()].map(b => ({ name: b.name, pieces: b.ids.length, x: +(b.x / M).toFixed(1), z: +(b.z / M).toFixed(1), w: +(b.w / M).toFixed(1), h: +(b.h / M).toFixed(1) })), cable: F.cable ? { t: +F.cable.t.toFixed(2), turns: +(F.cable.turns * clamp(F.cable.t / F.cable.over, 0, 1)).toFixed(2), frozen: F.cable.frozen, points: F.cable.mesh ? F.cable.mesh.geometry.parameters.path.points.length : 0 } : null, hang: F.hang ? { t: +F.hang.t.toFixed(2), actor: F.hang.actor } : null, prone: F.prone, rout: F.rout, strikes: !!F.strikes, pending: F.pending.map(e => ({ what: e.what, at: e.at, done: e.done })), fired: F.fired, sound: window.Sound ? Sound.stats() : null, caption: F.caption ? F.caption.text : null, deflected: F.deflect ? F.deflect.n : (F.deflectN || 0), loose: F.loose.length, flip: !!F.flip, weather: W.weather, ground: W.G && W.G.mode, snow: !!(W.sky && W.sky.stats && W.sky.stats().snow) });

    /* ── the band: the film frame is the render frame while the film owns the camera ── */
    const SZ = new THREE.Vector2();
    /** The band: the film's aspect fitted into what the page leaves free (`F.avail`: below the panel, above the word bar; the whole canvas in the theatre); y from the top. */
    F.band = () => { const r = W.renderer; r.getSize(SZ); const A = ASPECTS[F.aspect], av = (F.avail && F.avail(SZ.x, SZ.y)) || { x: 0, y: 0, w: SZ.x, h: SZ.y }; let w = av.w, h = av.w / A; if (h > av.h) { h = av.h; w = av.h * A; } return { x: av.x + (av.w - w) / 2, y: av.y + (av.h - h) / 2, w, h, W: SZ.x, H: SZ.y, A }; };
    F.bandOn = false;
    /** One frame through the band: black outside it, the camera's aspect the film's, the scene drawn inside the scissor. */
    F.renderBand = (scene, cam, real) => {
      const r = W.renderer, b = F.band();
      r.setScissorTest(false); r.setViewport(0, 0, b.W, b.H); r.setClearColor(0x000000, 1); r.clear();
      const gy = b.H - b.y - b.h; r.setViewport(b.x, gy, b.w, b.h); r.setScissor(b.x, gy, b.w, b.h); r.setScissorTest(true);   // GL counts from the bottom
      if (Math.abs(cam.aspect - b.A) > 1e-4) { cam.aspect = b.A; cam.updateProjectionMatrix(); }
      if (F.lampLight && F.lampOn) { F.lampLight.position.copy(cam.position); F.lampLight.position.y += 0.6 * M; }
      real(scene, cam); F.bandOn = true; F.lastBand = b;
    };
    F.bandOff = () => { const r = W.renderer; r.getSize(SZ); r.setScissorTest(false); r.setViewport(0, 0, SZ.x, SZ.y); const cam = W.camera; if (cam && Math.abs(cam.aspect - SZ.x / SZ.y) > 1e-4) { cam.aspect = SZ.x / SZ.y; cam.updateProjectionMatrix(); } F.bandOn = false; };
    /** The band's pixels into a canvas (the whole canvas when the band is off, letterboxed). */
    function drawBand(src, ctx, dw, dh) {
      const b = F.bandOn && F.lastBand; if (!b) return drawWithAspect(src, ctx, dw, dh);
      const pr = W.renderer.getPixelRatio(), sx = b.x * pr, sy = (b.H - b.y - b.h) * pr, sw = b.w * pr, sh = b.h * pr, k = Math.min(dw / sw, dh / sh), w = sw * k, h = sh * k;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, dw, dh); try { ctx.drawImage(src, sx, sy, sw, sh, (dw - w) / 2, (dh - h) / 2, w, h); } catch (e) { }
    }

    /* ── the take ── */
    const MIMES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    F.canRecord = () => typeof MediaRecorder !== 'undefined' && !!document.createElement('canvas').captureStream;
    F.record = sec => {
      if (F.rec) return F.stopRec();
      if (!F.canRecord()) { say('this browser cannot record a canvas', 'warn'); return false; }
      const src = W.renderer.domElement, A = ASPECTS[F.aspect], H = SIZES[F.size], w = A >= 1 ? Math.round(H * A / 2) * 2 : Math.round(H * A / 2) * 2, h = H;
      const cap = document.createElement('canvas'); cap.width = w; cap.height = h; const ctx = cap.getContext('2d');
      const mime = MIMES.find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } });
      if (!mime) { say('no video format to record with', 'warn'); return false; }
      const video = cap.captureStream(F.fps), audio = window.Sound && Sound.stream(); const stream = audio && audio.getAudioTracks().length ? new MediaStream([...video.getVideoTracks(), ...audio.getAudioTracks()]) : video; let rec;
      try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: H >= 1080 ? 12e6 : 6e6 }); } catch (e) { say('could not start the recorder: ' + (e.message || e), 'warn'); return false; }
      const chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      const R = { rec, cap, ctx, src, frames: 0, t: 0, until: sec ? +sec : null, done: false, mime, started: performance.now() };
      rec.onstop = () => { F.blob = new Blob(chunks, { type: mime.split(';')[0] }); if (F.url) { try { URL.revokeObjectURL(F.url); } catch (e) { } } F.url = URL.createObjectURL(F.blob); F.take = { size: F.blob.size, type: F.blob.type, frames: R.frames, sec: +R.t.toFixed(3), fps: F.fps, w, h, ms: Math.round(performance.now() - R.started), audio: stream !== video, mime }; if (F.rec === R) F.rec = null; say(`take done · ${R.frames} frames · ${(F.blob.size / 1024).toFixed(0)} KB · save it`, 'ok'); if (F.onChange) F.onChange('take'); };
      F.rec = R; F.blob = null; F.steps = 0;
      if (R.until == null) { if (!F.shots.length) { R.until = F.sec; } else if (F.mode === 'shot' && F.shots[F.sel] && !F.playAllWanted) F.playShot(F.sel); else F.playAll(); }
      rec.start(); say(R.until != null ? `recording ${R.until} s of the live view` : `recording the reel · ${F.total().toFixed(1)} s`, 'busy'); if (F.onChange) F.onChange('rec'); return true;
    };
    F.stopRec = () => { const R = F.rec; if (!R) return false; if (F.play.on) F.stop(); try { R.rec.state !== 'inactive' && R.rec.stop(); } catch (e) { F.rec = null; } return true; };
    /** The band as it stands, with the playing shot's title and caption over it: the take's frame, and the export's. */
    F.drawFrame = (ctx, w, h) => { drawBand(W.renderer.domElement, ctx, w, h); const s = F.play.on && F.shots[F.play.i]; if (s && s.title != null) drawTitle(ctx, w, h, s, F.play.t); if (F.caption && F.play.on) drawCaption(ctx, w, h, F.caption.text); };
    F.afterRender = () => {
      const R = F.rec; if (!R) return;
      if (F.hold) return;                                                          // the world is still laying a planet: no frame goes into the take
      F.drawFrame(R.ctx, R.cap.width, R.cap.height); R.frames++;
      if (R.done || (R.until != null && R.t >= R.until - 1e-6)) F.stopRec();
    };
    /** The targeting overlay: cobalt scanlines, a reticle, a range that counts down, the words at the foot. Drawn over the frame, never black. */
    function drawHud(ctx, w, h, s, t) {
      ctx.save(); ctx.fillStyle = 'rgba(40,110,255,0.10)'; for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
      ctx.strokeStyle = '#4bd5ee'; ctx.lineWidth = Math.max(1, h / 240); const bw = w * 0.34, bh = h * 0.5, x0 = (w - bw) / 2, y0 = (h - bh) / 2, c = Math.min(bw, bh) * 0.16;
      for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x0 + bw, y0, -1, 1], [x0, y0 + bh, 1, -1], [x0 + bw, y0 + bh, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * c); ctx.lineTo(x, y); ctx.lineTo(x + sx * c, y); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(w / 2 - c, h / 2); ctx.lineTo(w / 2 + c, h / 2); ctx.moveTo(w / 2, h / 2 - c); ctx.lineTo(w / 2, h / 2 + c); ctx.stroke();
      const fs = Math.round(h * 0.045); ctx.font = `${fs}px ui-monospace, Menlo, Consolas, monospace`; ctx.fillStyle = '#4bd5ee'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      const rng = Math.max(120, Math.round(812 - t * 46)), brg = (182 + Math.round(Math.sin(t * 0.8) * 3)) % 360;
      ctx.fillText(`TGT LOCK  WALKER 0${1 + (Math.floor(t * 1.5) % 4)}`, w * 0.04, h * 0.05); ctx.fillText(`RNG ${rng} m   BRG ${String(brg).padStart(3, '0')}   ELV +0${(0.3 + t * 0.02).toFixed(1)}`, w * 0.04, h * 0.05 + fs * 1.4);
      ctx.textAlign = 'right'; ctx.fillText(`${(t * 24 | 0).toString().padStart(4, '0')}  SCAN`, w * 0.96, h * 0.05);
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.font = `${Math.round(h * 0.055)}px Helvetica, Arial, sans-serif`; ctx.fillStyle = '#dff6ff'; ctx.fillText(String(s.title).split('\n')[0], w / 2, h * 0.93, w * 0.9); ctx.restore();
    }
    function drawTitle(ctx, w, h, s, t) {
      if (s.style === 'hud') return drawHud(ctx, w, h, s, t || 0);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); const logo = s.style === 'logo';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = logo ? '#ffe81f' : '#4bd5ee';
      const lines = String(s.title).split('\n'), size = logo ? Math.round(h * 0.17) : Math.round(h * 0.06); ctx.font = `${logo ? '900' : '400'} ${size}px ${logo ? 'Impact, "Arial Black", Helvetica, sans-serif' : 'Helvetica, Arial, sans-serif'}`;
      lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.3, w * 0.9));
    }
    function drawWithAspect(src, ctx, dw, dh) {
      const sw = src.width || dw, sh = src.height || dh, k = Math.min(dw / sw, dh / sh), w = sw * k, h = sh * k;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, dw, dh); try { ctx.drawImage(src, (dw - w) / 2, (dh - h) / 2, w, h); } catch (e) { }
    }
    F.download = () => { if (!F.url) return false; const a = document.createElement('a'); a.href = F.url; a.download = `momento-${((W.place && W.place.name) || 'world').replace(/[^\w]+/g, '-').toLowerCase()}.${/mp4/.test(F.blob.type) ? 'mp4' : 'webm'}`; document.body.appendChild(a); a.click(); a.remove(); return true; };
    /** A still of a shot's first key for its card: one extra render, then a copy into the small canvas. */
    F.thumb = (i, canvas) => {
      const s = F.shots[i], cam = W.camera, real = W.renderReal; if (!s || !cam || !real) return false;
      if (s.title != null) { drawTitle(canvas.getContext('2d'), canvas.width, canvas.height, s); return true; }
      const pos = cam.position.clone(), q = cam.quaternion.clone(), fov = cam.fov, asp = cam.aspect, was = F.bandOn;
      poseAt(cam, s, 0); F.renderBand(W.scene, cam, real);
      const ctx = canvas.getContext('2d'); drawBand(W.renderer.domElement, ctx, canvas.width, canvas.height);
      if (!was) F.bandOff(); cam.position.copy(pos); cam.quaternion.copy(q); cam.fov = fov; cam.aspect = asp; cam.updateProjectionMatrix(); return true;
    };

    /* ── memory ── */
    const key = () => 'world.film.' + (W.placeKey ? W.placeKey() : 'here');
    F.save = () => { try { if (F.shots.length || F.lights.length) localStorage.setItem(key(), F.text()); else localStorage.removeItem(key()); } catch (e) { } };
    F.load = () => { let t = null; try { t = localStorage.getItem(key()); } catch (e) { } if (!t) return 0; const r = F.parse(t); return r.shots; };

    /* ── words → shots ── */
    /** What the world has to point a camera at: the player, the landmarks, the named buildings, the kits. */
    F.scene = () => {
      const p = W.rig ? W.rig.pos : new THREE.Vector3(), out = { me: { x: +(p.x / M).toFixed(1), z: +(p.z / M).toFixed(1), mode: W.mode, character: W.character }, landmarks: [], buildings: [], sun: W.sky ? W.sky.stats() : null };
      if (W.props) for (const it of W.props.items.values()) if (it.src && (it.src.landmark || it.kit)) out.landmarks.push({ id: it.id, kind: it.kit || it.src.kind || it.src.op, x: +(it.x / M).toFixed(1), z: +(it.z / M).toFixed(1) });
      if (W.city) for (const b of W.city.buildings) { if (!b.name) continue; const d = Math.hypot(b.cx * M - p.x, b.cz * M - p.z); if (d > 400 * M) continue; out.buildings.push({ name: b.name, kind: b.kind || 'building', x: +b.cx.toFixed(1), z: +b.cz.toFixed(1), h: +((b.yTop - b.y0) / M).toFixed(1), d: +(d / M).toFixed(0) }); }
      out.buildings.sort((a, b) => a.d - b.d); out.buildings = out.buildings.slice(0, 24); return out;
    };
    const KIT_WORDS = { atat: /\bat-?at\b|walker/i, atst: /\bat-?st\b|scout walker/i, xwing: /\bx-?wing\b/i, shuttle: /\bshuttle\b/i, speeder: /\bspeeder\b/i, car: /\bcar\b/i, truck: /\btruck\b/i, bus: /\bbus\b/i, tie: /\btie\b/i };
    /** A subject from a word, an id, a name, or a point: its centre, its footprint, its height. */
    F.subject = on => {
      const p = W.rig ? W.rig.pos : new THREE.Vector3();
      const me = () => { const c = W.mode === 'ride' && W.veh ? W.veh.pos : W.mode === 'fly' ? W.tie.pos : p; const b = W.mode === 'ride' && W.veh && W.veh.prop && W.veh.prop.box; if (b && !b.isEmpty()) { const hh = Math.max(1.5 * M, b.max.y - b.min.y + 1.6 * M), rr = Math.max(1.2 * M, Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2); return { x: c.x, z: c.z, y0: c.y - (W.veh.K.hover || 0) * M, h: hh, r: rr, what: 'me' }; }   // on a ride: the ride and the rider on it
        return { x: c.x, z: c.z, y0: groundH(c.x, c.z), h: (W.mode === 'walk' ? 2.5 : 4) * M, r: (W.mode === 'walk' ? 0.5 : 2) * M, what: 'me' }; };
      const prop = it => { const b = it.box; if (!b) return null; return { x: (b.min.x + b.max.x) / 2, z: (b.min.z + b.max.z) / 2, y0: b.min.y, h: b.max.y - b.min.y, r: Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2, what: it.id, id: it.id, kind: 'prop' }; };
      const bld = b => ({ x: b.cx * M, z: b.cz * M, y0: b.y0, h: b.yTop - b.y0, r: (b.r || 5) * M, what: b.name || b.kind || b.id, id: b.id, kind: 'building' });
      if (Array.isArray(on) && on.length >= 2) { const x = +on[0] * M, z = +on[1] * M; return { x, z, y0: groundH(x, z), h: 2 * M, r: 1 * M, what: `${on[0]}, ${on[1]}` }; }
      const s = String(on == null ? 'me' : on).trim(); if (!s || /^(me|myself|i|the (player|hero|figure)|vader|us)$/i.test(s)) { const m = me(); m.heading = W.mode === 'ride' && W.veh ? W.veh.heading : W.mode === 'fly' && W.tie ? W.tie.yaw : W.rig ? W.rig.heading : 0; return m; }
      { const [an, part] = s.split(':'); const a = F.actors.get(an); if (a) { if (a.rig) { const P = new THREE.Vector3(); a.rig.figure.getWorldPosition(P); const flat = a.poseNow === 'prone' && !a.riding; return { x: P.x, z: P.z, y0: a.riding ? P.y - 0.4 * M : groundH(P.x, P.z), h: flat ? 0.9 * M : a.poseNow === 'crouch' ? 1.9 * M : 2.6 * M, r: flat ? 1.2 * M : 0.55 * M, what: a.name, id: a.name, kind: 'figure', heading: a.rig.heading }; }
        if (a.wreck && a.last) return { x: a.last.x, z: a.last.z, y0: a.last.y, h: 2.5 * M, r: 2.5 * M, what: a.name + ' wreck', id: null, kind: 'wreck', heading: a.last.heading }; if (a.crowd) return { x: a.x, z: a.z, y0: groundH(a.x, a.z), h: 2.5 * M, r: a.r, what: a.name, id: null, kind: 'crowd' }; if (a.V && a.it && (!a.it.box || a.it.box.isEmpty() || a.it.box.max.y - a.it.box.min.y > 25 * M)) return { x: a.V.pos.x, z: a.V.pos.z, y0: a.V.pos.y - M, h: 2.5 * M, r: 2 * M, what: a.name, id: a.it.id, kind: 'prop', heading: a.V.heading }; const P = a.it && prop(a.it); if (P) { P.what = a.name; P.heading = a.V ? a.V.heading : 0; if (part && /^leg/.test(part)) { const L = legPoint(a, part); if (L) return { x: L.x, z: L.z, y0: L.bottom, h: L.top - L.bottom, r: Math.max(1.2 * M, a.V.hx * 0.5), what: `${a.name} ${part}`, id: a.it.id, kind: 'prop', heading: P.heading }; } return P; } } }
      { const b = F.builds.get(s); if (b) return { x: b.x, z: b.z, y0: b.y0, h: b.h, r: b.r, what: b.name, id: null, kind: 'build', heading: Math.PI }; }
      if (W.props) { const it = W.props.items.get(s); if (it) { const P = prop(it) || me(); if (W.mode === 'ride' && W.veh && W.veh.prop === it) P.heading = W.veh.heading; else P.heading = it.yaw * Math.PI / 2; return P; } }
      if (W.tie && /^(tie|the tie|ship)$/i.test(s)) { const c = W.tie.flying ? W.tie.pos : W.ship.position; return { x: c.x, z: c.z, y0: c.y, h: 4 * M, r: 4 * M, what: 'the TIE' }; }
      for (const [k, re] of Object.entries(KIT_WORDS)) if (re.test(s) && W.props) { let best = null, bd = Infinity; for (const it of W.props.items.values()) { if (!(it.kit === k || (it.src && (it.src.kind === k || it.src.kit === k)))) continue; const d = Math.hypot(it.x - p.x, it.z - p.z); if (d < bd) { bd = d; best = it; } } if (best) return prop(best) || me(); if (k === 'tie' && W.ship) { const c = W.ship.position; return { x: c.x, z: c.z, y0: c.y, h: 4 * M, r: 4 * M, what: 'the TIE' }; } }
      if (W.city) {
        const words = s.toLowerCase().replace(/^the\s+/, ''); let best = null, bd = Infinity;
        for (const b of W.city.buildings) { const name = (b.name || '').toLowerCase(), kind = (b.kind || '').toLowerCase(); const hit = (name && (name === words || name.includes(words) || words.includes(name))) || (kind && (kind === words || (/tower|church|stadium|cathedral|school|station|hall|hotel|museum|library|bridge|temple|mosque|castle|shop|house/.test(words) && kind.includes(words.split(/\s+/).pop())))); if (!hit) continue; const d = Math.hypot(b.cx * M - p.x, b.cz * M - p.z); if (d < bd) { bd = d; best = b; } }
        if (!best && /tower|tallest|highest|skyscraper/.test(words)) { let hh = 0; for (const b of W.city.buildings) { const d = Math.hypot(b.cx * M - p.x, b.cz * M - p.z), h = b.yTop - b.y0; if (d < 300 * M && h > hh) { hh = h; best = b; } } }
        if (!best && /house|building|the nearest|nearby/.test(words)) { for (const b of W.city.buildings) { const d = Math.hypot(b.cx * M - p.x, b.cz * M - p.z); if (d < bd) { bd = d; best = b; } } }
        if (best) return bld(best);
      }
      return me();
    };
    /** A semantic shot staged into keys: the subject's size sets the distance, the bearing the side, the move the second key. */
    /** Is a point inside something the camera should not be in: the ground, a building (not the subject's), a prop (not the subject's), the parked TIE. */
    F.inside = (p, skipId) => {
      if (p.y < groundH(p.x, p.z) + 0.5 * M) return 'ground';
      if (W.sets) { const hit = W.sets.inside(p, 1.6 * M); if (hit) return hit; }   // a camera never hugs a trunk: bark would fill the frame
      if (W.crowd) for (const n of W.crowd.npcs) if (n.alive && Math.hypot(p.x - n.pos.x, p.z - n.pos.z) < 0.7 * M && p.y > n.pos.y - 0.2 * M && p.y < n.pos.y + 2.2 * M) return 'a figure';
      for (const a of F.actors.values()) if (a.rig && a.name !== skipId && !a.riding && Math.hypot(p.x - a.rig.pos.x, p.z - a.rig.pos.z) < 0.7 * M && p.y > a.rig.pos.y - 0.2 * M && p.y < a.rig.pos.y + 2.2 * M) return a.name;
      if (W.city && window.Bricks) for (const b of W.city.near(p.x, p.z, 1.5 * M)) if (b.id !== skipId && p.y < b.yTop + 0.5 * M && Bricks.pointInRing(p.x / M, p.z / M, b.ring)) return 'building';
      if (W.props) for (const it of W.props.near(p.x, p.z, 1.5 * M)) { const b = it.box; if (it.group && !it.group.visible) continue; if (it.id !== skipId && b && p.x > b.min.x - 0.5 * M && p.x < b.max.x + 0.5 * M && p.z > b.min.z - 0.5 * M && p.z < b.max.z + 0.5 * M && p.y > b.min.y - 0.5 * M && p.y < b.max.y + 0.5 * M) return 'prop'; }
      if (W.ship && W.ship.visible && W.mode !== 'fly') { /* a ride a scene has put away blocks no camera */ const sp = W.ship.position; if (Math.hypot(sp.x - p.x, sp.z - p.z) < 6.5 * M && p.y < sp.y + 5 * M) return 'ship'; }
      return null;
    };
    /** Can the camera see the subject: twelve samples along the line, none inside anything but the subject itself. */
    F.los = (cam, tgt, S) => {
      const P = new THREE.Vector3();
      for (let i = 1; i <= 12; i++) { const t = 0.04 + 0.86 * (i / 12); P.lerpVectors(cam, tgt, t); if (S && Math.hypot(P.x - S.x, P.z - S.z) < S.r * 1.15 + 0.5 * M) break; const hit = F.inside(P, S && S.id); if (hit) return hit; }
      return null;
    };
    const FILL = { wide: 0.38, medium: 0.6, close: 1, low: 0.7, aerial: 0.36, shoulder: 0 };
    F.stage = sh => {
      const S = F.subject(sh.on), frame = FRAMES[sh.frame] != null || sh.frame === 'pov' || sh.frame === 'under' ? sh.frame : 'medium';
      if (frame === 'pov' || frame === 'under') {                                        // from the seat, or from beneath: no bearing, no clear check but the ground
        const h = S.heading != null ? S.heading : Math.PI, fx = Math.sin(h), fz = Math.cos(h), fov = clamp(+sh.lens || (frame === 'pov' ? 70 : 80), 12, 110), sec = clamp(+sh.sec || F.sec, 0.5, 120);
        const k = frame === 'pov' ? { pos: new THREE.Vector3(S.x + fx * S.r * 0.3, S.y0 + S.h * 0.45, S.z + fz * S.r * 0.3), tgt: new THREE.Vector3(S.x + fx * 60 * M, S.y0 + S.h * 0.45 - 6 * M, S.z + fz * 60 * M), fov }
          : { pos: new THREE.Vector3(S.x - fx * S.r * 0.2, Math.max(S.y0, groundH(S.x, S.z)) + 0.5 * M, S.z - fz * S.r * 0.2), tgt: new THREE.Vector3(S.x + fx * S.r * 0.5, S.y0 + S.h * 0.92, S.z + fz * S.r * 0.5), fov };
        k.frame = { bearing: h, asked: h, tried: 1, clear: true }; const keys = [k];
        return { name: String(sh.name || `${frame} on ${S.what}`).slice(0, 48), keys, sec, act: null, on: S.what, frame, from: sh.from || 's', move: 'hold', readout: `on ${S.what} · ${frame} · ${frame === 'pov' ? 'from its seat' : 'from beneath'}`, d: 0, clear: true };
      }
      const fov = clamp(+sh.lens || LENS[frame], 12, 110), sec = clamp(+sh.sec || F.sec, 0.5, 120), A = ASPECTS[F.aspect];
      const fovV = fov * Math.PI / 180, fovH = 2 * Math.atan(Math.tan(fovV / 2) * A), fill = FILL[frame] || 0.6;
      const hh = frame === 'close' ? Math.max(S.h * 0.15, 0.25 * M) : Math.max(S.h / 2, 0.4 * M), hw = frame === 'close' ? Math.min(S.r, 0.4 * M) : Math.max(S.r, 0.4 * M);   // half height and half width to fit; a close-up frames the head
      let d = Math.max(2 * M, hh / (fill * Math.tan(fovV / 2)), hw / (fill * Math.tan(fovH / 2)));   // far enough that the taller of the two spans fills its share of the frame
      let bear = (BEAR[String(sh.from || '').toLowerCase()] != null ? BEAR[String(sh.from).toLowerCase()] : 180) * Math.PI / 180;
      if (String(sh.from || '').toLowerCase() === 'front' && S.heading != null) bear = -S.heading + Math.PI; else if (String(sh.from || '').toLowerCase() === 'behind' && S.heading != null) bear = -S.heading;
      if (frame === 'shoulder' && W.rig) { bear = -W.rig.heading; if (String(sh.on || 'me') === 'me') d = 2.6 * M; }
      const rel = /^(front|behind)$/i.test(String(sh.from || '')) && S.heading != null; if (sh.bearKeep != null) bear = rel ? sh.bearKeep - S.heading : sh.bearKeep;   // a follow shot keeps the bearing it found, turning with the subject when it was asked for the front or the back   // a heading h looks along (sin h, cos h); the bearing b stands the camera at (sin b, -cos b): behind the figure is b = -h
      const tgtY = S.y0 + S.h * (frame === 'wide' ? 0.45 : frame === 'close' ? 0.85 : frame === 'shoulder' ? 0.9 : 0.5);
      const pose = (dist, b, kind, raise) => {
        const k = kind || frame; let cx = S.x + Math.sin(b) * dist, cz = S.z - Math.cos(b) * dist, cy;
        if (k === 'aerial') { const el = 50 * Math.PI / 180; cx = S.x + Math.sin(b) * dist * Math.cos(el); cz = S.z - Math.cos(b) * dist * Math.cos(el); cy = S.y0 + S.h / 2 + dist * Math.sin(el); }
        else if (k === 'low') cy = groundH(cx, cz) + 0.4 * M;
        else if (k === 'shoulder') cy = S.y0 + S.h * 0.95;
        else if (k === 'close') cy = tgtY + 0.05 * S.h;
        else cy = Math.max(S.y0 + S.h * (k === 'wide' ? 0.55 : 0.5), groundH(cx, cz) + 0.6 * M);
        if (k !== 'aerial' && k !== 'low') { const g = groundH(cx, cz) + 0.5 * M; if (cy < g) cy = g; }
        if (raise) cy += raise;
        const tgt = new THREE.Vector3(S.x, tgtY, S.z); if (k === 'shoulder') { tgt.x = S.x - Math.sin(b) * 6 * M; tgt.z = S.z + Math.cos(b) * 6 * M; tgt.y = S.y0 + S.h * 0.7; }
        return { pos: new THREE.Vector3(cx, cy, cz), tgt, fov };
      };
      /** The bearing asked, then its neighbours, then the far side; if all are blocked the camera rises until it sees. */
      const clear = (dist, b, kind) => {
        const order = sh.bearKeep != null ? [0] : [0, 45, -45, 90, -90, 135, -135, 180]; let fallback = null;
        for (let i = 0; i < order.length; i++) {
          const bb = b + order[i] * Math.PI / 180, k = pose(dist, bb, kind); const inb = F.inside(k.pos, S.id), blocked = inb || F.los(k.pos, k.tgt, S);
          if (!blocked) { k.frame = { bearing: bb, asked: b, tried: i + 1, clear: true }; return k; }
          if (!fallback) fallback = { k, why: blocked };
        }
        for (let r = 1; r <= 8; r++) { const k = pose(dist, b, kind, r * Math.max(2 * M, S.h * 0.25)); if (!F.inside(k.pos, S.id) && !F.los(k.pos, k.tgt, S)) { k.frame = { bearing: b, asked: b, tried: 8 + r, clear: true, raised: r }; return k; } }
        const k = fallback.k; k.frame = { bearing: b, asked: b, tried: 16, clear: false, why: fallback.why }; return k;
      };
      const k0 = clear(d, bear), bearUsed = k0.frame.bearing, keys = [k0], move = MOVES.includes(sh.move) ? sh.move : 'hold';
      if (move === 'push') keys.push(clear(d / 2, bearUsed)); else if (move === 'pull') keys.push(clear(d * 2, bearUsed));
      else if (move === 'orbit') { keys.push(clear(d, bearUsed + Math.PI / 4)); keys.push(clear(d, bearUsed + Math.PI / 2)); }
      else if (move === 'crane') keys.push(clear(d, bearUsed, 'aerial')); else if (move === 'track') { const k2 = pose(d, bearUsed); k2.pos.x += Math.cos(bearUsed) * d * 0.6; k2.pos.z += Math.sin(bearUsed) * d * 0.6; k2.frame = { bearing: bearUsed, asked: bear, tried: 1, clear: !F.inside(k2.pos, S.id) && !F.los(k2.pos, k2.tgt, S) }; keys.push(k2); }
      let act = null; if (sh.act && sh.act.who) { const w = sh.act.walk || sh.act.drive; if (Array.isArray(w) && w.length >= 2) act = { who: 'me', kind: sh.act.drive ? 'drive' : 'walk', x: +w[0] * M, z: +w[1] * M }; else if (typeof w === 'string') { const T = F.subject(w); act = { who: 'me', kind: sh.act.drive ? 'drive' : 'walk', x: T.x, z: T.z }; } }
      const fr = k0.frame, deg = Math.round(((fr.bearing * 180 / Math.PI) % 360 + 360) % 360), asked = Math.round(((fr.asked * 180 / Math.PI) % 360 + 360) % 360);
      const readout = `on ${S.what} · ${frame} · ${(d / M).toFixed(0)} m · from ${deg}°${deg !== asked ? ` (asked ${asked}°)` : ''}${fr.raised ? ` · raised ${fr.raised}` : ''} · ${fr.clear ? 'clear' : 'blocked by ' + fr.why}`;
      return { name: String(sh.name || `${frame} on ${S.what}`).slice(0, 48), keys, sec, act, on: S.what, frame, from: sh.from || 's', move, readout, d, clear: fr.clear, bearKeep: rel ? bearUsed + S.heading : bearUsed };
    };
    /** The same words without the model: subjects, frames, bearings, seconds and moves, one shot per clause. */
    F.parseWords = text => {
      const shots = []; let prev = null;
      for (let clause of String(text || '').split(/\bthen\b|;|\n|\.\s+(?=[A-Za-z])/i)) {
        clause = clause.trim().replace(/^(and|next|after that|finally|first|now)\s+/i, ''); if (!clause) continue;
        const low = clause.toLowerCase(), sh = { name: clause.replace(/[.,]+$/, '').slice(0, 48) };
        const bareMove = /^\s*(push|dolly|move|pull|zoom|orbit|circle|crane|rise|track|slide|pan|hold)\b/.test(low.replace(/^(the camera|camera|we|it)\s+/, '')) && !/\b(of|on|at|from)\b/.test(low);
        if (bareMove && prev) {   // "then push in, 3 seconds" is the previous shot's move, not a new shot
          prev.move = /\b(push|dolly in|move in|closer|zoom in)\b/.test(low) ? 'push' : /\b(pull|dolly out|move out|pull back|zoom out|reveal)\b/.test(low) ? 'pull' : /\b(orbit|circle|around)\b/.test(low) ? 'orbit' : /\b(crane|rise|rising|lift)\b/.test(low) ? 'crane' : /\b(track|tracking|slide|pan|sideways)\b/.test(low) ? 'track' : 'hold';
          const sec = low.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds?)\b/); if (sec) prev.sec = +sec[1]; continue;
        }
        sh.frame = /\b(wide|establishing|long shot|far)\b/.test(low) ? 'wide' : /\b(close|close-up|closeup|tight|detail)\b/.test(low) ? 'close' : /\b(aerial|overhead|top-?down|bird|from above|drone)\b/.test(low) ? 'aerial' : /\b(low angle|low shot|from below|worm|from the ground)\b/.test(low) ? 'low' : /\b(over the shoulder|over-the-shoulder|shoulder|behind me|from behind)\b/.test(low) ? 'shoulder' : 'medium';
        const fm = low.match(/from the (north-?east|north-?west|south-?east|south-?west|north|south|east|west)\b/); sh.from = fm ? fm[1].replace('-', '').replace(/north(east|west)/, 'n$1').replace(/south(east|west)/, 's$1').replace(/^n(east)$/, 'ne').replace(/^n(west)$/, 'nw').replace(/^s(east)$/, 'se').replace(/^s(west)$/, 'sw').replace(/^north$/, 'n').replace(/^south$/, 's').replace(/^east$/, 'e').replace(/^west$/, 'w') : (/\bfrom behind\b/.test(low) ? 'behind' : 's');
        const sec = low.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds?)\b/); sh.sec = sec ? +sec[1] : F.sec;
        const lens = low.match(/(?:lens|fov)\s*(\d+)|(\d+)\s*mm/); sh.lens = lens ? (lens[1] ? +lens[1] : Math.round(2 * Math.atan(12 / +lens[2]) * 180 / Math.PI)) : 0;
        sh.move = /\b(push|dolly in|move in|closer|zoom in)\b/.test(low) ? 'push' : /\b(pull|dolly out|move out|pull back|zoom out|reveal)\b/.test(low) ? 'pull' : /\b(orbit|circle|around)\b/.test(low) ? 'orbit' : /\b(crane|rise|rising|lift|up and away)\b/.test(low) ? 'crane' : /\b(track|tracking|slide|pan|sideways)\b/.test(low) ? 'track' : 'hold';
        const walk = low.match(/\b(?:i|me|we)?\s*(?:walk|walks|walking|run|runs|go|goes)\s+(?:to|toward|towards|up to)\s+(the\s+[\w' -]+?|[\w'-]+)(?=[,.;]|\s+(?:for|while|as|and|then)\b|$)/); if (walk) sh.act = { who: 'me', walk: walk[1].trim() };
        const drive = low.match(/\b(?:drive|drives|driving|fly|flies)\s+(?:to|toward|towards)\s+(the\s+[\w' -]+?|[\w'-]+)(?=[,.;]|\s+(?:for|while|as|and|then)\b|$)/); if (drive) sh.act = { who: 'me', drive: drive[1].trim() };
        let on = null; const of = low.match(/\b(?:of|on|at)\s+(the\s+[\w' -]+?|[\w'-]+)(?=[,.;]|\s+(?:from|for|while|as|and|then|with|in|at|over|walking|walks|walk|push|pull|orbit|crane|track|\d)|$)/);
        if (/\b(me|myself|on me|of me|the hero|vader|the player)\b/.test(low) && !(of && !/^(me|myself|the hero|the player|vader)$/.test(of[1]))) on = 'me';
        else if (of) on = of[1]; else { for (const [k, re] of Object.entries(KIT_WORDS)) if (re.test(low)) { on = k; break; } if (!on) { const tw = low.match(/\b(tower|church|stadium|cathedral|bridge|station|castle|house|building)\b/); on = tw ? 'the ' + tw[1] : 'me'; } }
        if (sh.from === 'behind') { sh.frame = sh.frame === 'medium' ? 'shoulder' : sh.frame; sh.from = 's'; }
        if (on === 'me' && prev && !/\b(me|myself|the hero|vader|the player)\b/.test(low) && !of) on = prev.on;   // a clause without a subject stays on the last one
        sh.on = on; shots.push(sh); prev = sh;
      }
      const low = String(text || '').toLowerCase(), set = /\b(forest|woods?|redwoods?|endor|jungle)\b/.test(low) ? 'forest' : /\b(snow(field)?|ice|hoth|glacier|tundra)\b/.test(low) ? 'snowfield' : /\b(desert|dunes?|tatooine|sand)\b/.test(low) ? 'desert' : null;
      const subjects = [...new Set(shots.map(sh => String(sh.on)))], story = { title: String(text || '').slice(0, 40), location: set || (W.place && W.place.name) || 'here', entities: subjects.map(on => ({ id: on, type: on === 'me' ? 'figure' : 'subject', name: on })), goals: [{ id: 'g1', name: 'shoot the film', owner: 'me' }], obstacles: [], shifts: shots.map((sh, i) => ({ id: 's' + (i + 1), name: sh.name })), relations: subjects.filter(o => o !== 'me').map(o => `[frames] me -> ${o}`), timeline: [{ id: 't1', description: String(text || '').slice(0, 80), scenes: shots.map((sh, i) => ({ id: 's' + (i + 1), description: sh.name, entities: [String(sh.on)] })) }] };
      shots.forEach((sh, i) => { sh.shift = 's' + (i + 1); });
      return { name: String(text || '').slice(0, 40), shots, story, set };
    };
    /** Words to a shot list: the model with the film spec and the scene, or the local parser; every shot is staged and joins the reel. */
    F.words = async (text, opts = {}) => {
      text = String(text || '').trim(); if (!text || F.busy) return null;
      F.busy = true; let plan = null, how = 'local';
      try {
        const Ai = window.Ai;
        if (!opts.local && !F.local && Ai && Ai.key()) {
          say('asking the model for a shot list', 'busy');
          try {
            const scene = F.scene(); const brief = `SCENE (metres, x east, z south): player ${JSON.stringify(scene.me)}; landmarks ${JSON.stringify(scene.landmarks)}; named buildings ${JSON.stringify(scene.buildings)}; sky ${scene.sun ? scene.sun.mode + ', night ' + scene.sun.night : 'day'}.\nFILM BRIEF: ${text}\nAnswer with the shot list as one JSON object.`;
            const r = await Ai.request(brief, { system: FILM_SPEC, stage: 'FRAMING', detail: 'a shot list', parse: raw => { let p = null; try { p = JSON.parse(raw); } catch (e) { const m = String(raw || '').match(/\{[\s\S]*\}/); if (m) try { p = JSON.parse(m[0]); } catch (x) { } } if (!p || !Array.isArray(p.shots)) throw new Error('the model did not return a shot list'); return p; }, signal: opts.signal });
            plan = r.program; how = 'model';
          } catch (e) { if (e && e.name === 'AbortError') throw e; F.log.push('model: ' + (e.message || e)); plan = null; }
        }
        if (!plan) plan = F.parseWords(text);
        if (plan.set && W.filmSet && !(W.sets && W.sets.kind === plan.set)) { W.filmSet(plan.set, { r: 160 }); F.scene = F.scene || { name: plan.name, actors: [], builds: [], abs: true, up: true, ready: true }; F.scene.set = { kind: plan.set, r: 160, seed: 1, centre: W.sets ? { x: W.sets.centre.x, z: W.sets.centre.z } : null, abs: true }; }   // the words ask for a set the place cannot be
        const staged = plan.shots.map(sh => { try { const st = F.stage(sh); if (sh.shift) st.shift = sh.shift; return st; } catch (e) { F.log.push('stage: ' + (e.message || e)); return null; } }).filter(Boolean);
        if (!staged.length) { say('no shot in those words', 'warn'); return null; }
        if (plan.story) F.story = plan.story;
        const at = F.shots.length; F.shots.push(...staged); F.sel = at; changed('words');
        say(`${staged.length} shot${staged.length === 1 ? '' : 's'} from your words (${how}) · ${staged.map(s => s.name).join(' · ')}`, 'ok');
        F.setMode('shot');
        return { how, set: plan.set || null, story: !!plan.story, shots: staged.map(s => ({ name: s.name, on: s.on, frame: s.frame, from: s.from, move: s.move, keys: s.keys.length, sec: s.sec, act: s.act, shift: s.shift || null })) };
      } finally { F.busy = false; }
    };

    /* ── a film from a program: shots as words (staged when they play), titles, planets and characters ── */
    F.loadProgram = (prog, append) => {
      const shots = []; const actsOf = list => (list || []).map(a => { const o = { ...a }; if (o.to && Array.isArray(o.to)) o.to = { x: o.to[0], z: o.to[1], rel: true }, o.rel = true; if (o.to && o.to.rel) o.rel = true; if (o.aim && Array.isArray(o.aim)) o.aim = { x: o.aim[0], z: o.aim[1] }; if (o.look && Array.isArray(o.look)) o.look = { x: o.look[0], z: o.look[1], rel: true }; return o; });
      const eventsOf = list => (list || []).map(e => { const o = { ...e, what: String(e.what).toUpperCase() }; if (Array.isArray(o.at)) o.at = o.at[0]; if (o.xz) { o.x = o.xz[0]; o.z = o.xz[1]; o.rel = true; delete o.xz; } return o; });
      for (const sh of (prog && prog.shots) || []) {
        const set = (sh.world || sh.as || sh.time || sh.weather) ? { world: sh.world || null, as: sh.as || null, time: sh.time || null, weather: sh.weather || null } : null;
        if (sh.title != null && !sh.on) { shots.push({ name: sh.name || sh.title.slice(0, 32), title: sh.title, style: sh.style || 'card', keys: [], sec: clamp(+sh.sec || 3, 0.5, 120), act: null, set, acts: actsOf(sh.acts), events: eventsOf(sh.events), shift: sh.shift || undefined, score: sh.score }); continue; }
        const plan = { on: sh.on || 'me', frame: sh.frame || 'medium', from: sh.from || 's', lens: sh.lens || 0, sec: sh.sec || F.sec, move: sh.move || 'hold', name: sh.name };
        let act = null; if (sh.act) { act = { who: 'me', ...sh.act }; if (Array.isArray(act.walk)) { act.kind = 'walk'; act.x = act.walk[0] * M; act.z = act.walk[1] * M; act.rel = true; } if (Array.isArray(act.drive)) { act.kind = 'drive'; act.x = act.drive[0] * M; act.z = act.drive[1] * M; act.rel = true; } delete act.walk; delete act.drive; }
        const shot = { name: sh.name || `${plan.frame} on ${plan.on}`, keys: [{ pos: new THREE.Vector3(0, 4 * M, 0), tgt: new THREE.Vector3(0, 2 * M, -10 * M), fov: 50 }], sec: clamp(+sh.sec || F.sec, 0.5, 120), act, set, plan, follow: !!sh.follow, acts: actsOf(sh.acts), events: eventsOf(sh.events) };
        if (sh.title != null) { shot.title = sh.title; shot.style = sh.style || 'hud'; }
        if (sh.shift) shot.shift = sh.shift; if (sh.score !== undefined) shot.score = sh.score; if (sh.lamp) shot.lamp = true; if (sh.speed != null) shot.speed = clamp(+sh.speed, 0.05, 4); shots.push(shot);
      }
      if (!append) { F.teardown(!!(prog && prog.set)); F.shots = []; } F.shots.push(...shots); F.sel = F.shots.length ? (append ? F.shots.length - shots.length : 0) : -1; F.name = prog && prog.name || F.name; if (prog && prog.story) F.story = prog.story; else if (!append) F.story = null;
      if (prog && (prog.actors || prog.builds || prog.set)) { F.scene = { name: prog.name, actors: (prog.actors || []).map(a => ({ ...a, r: a.r ? a.r * M : undefined })), builds: (prog.builds || []).map(b => ({ ...b })), set: prog.set ? { ...prog.set, corridor: prog.set.corridor ? prog.set.corridor.map(p => p.slice()) : null, abs: false } : null, routes: prog.routes ? Object.fromEntries(Object.entries(prog.routes).map(([k, v]) => [k, v.map(p => p.slice())])) : null, world: prog.world || null, as: prog.as || null, ground: prog.ground || null, weather: prog.weather || null, time: prog.time || null, me: prog.me || null, abs: false }; F.setup(); }
      if (F.prepareEnvs) F.prepareEnvs(); changed('program'); return shots.length;
    };
    F.trailer = name => { const t = TRAILERS[name || 'a-new-hope'] || SCENES[name]; if (!t) return 0; const n = F.loadProgram(t); say(`${t.name}: ${n} shots${F.scene ? ' · ' + F.scene.actors.length + ' actors' : ''} · Play previews it, Rec takes it`, 'ok'); return n; };

    /* ── what the page and the tests read ── */
    F.line = () => {
      if (F.hold && F.play.on) return `shot ${F.play.i + 1}/${F.shots.length} · ${F.hold.why}`;
      if (F.rec) { const R = F.rec; return `REC ${R.t.toFixed(1)} s · ${R.frames} frames${F.play.on && F.shots[F.play.i] ? ` · ${F.play.i + 1}/${F.shots.length} ${F.shots[F.play.i].name}` : ''}`; }
      if (F.play.on && F.shots[F.play.i]) return `shot ${F.play.i + 1}/${F.shots.length} · ${F.shots[F.play.i].name} · ${F.play.t.toFixed(1)} / ${F.shots[F.play.i].sec} s`;
      if (F.mode === 'free') return `free camera · lens ${Math.round(F.free.fov)} · left thumb dollies, right looks, pinch zooms`;
      if (F.mode === 'shot' && F.shots[F.sel]) { const s = F.shots[F.sel]; return `shot ${F.sel + 1}/${F.shots.length} · ${s.name} · ${s.keys.length > 1 ? 'a move over ' : 'held '}${s.sec} s`; }
      return '';
    };
    F.state = () => ({ mode: F.mode, sel: F.sel, n: F.shots.length, play: { ...F.play }, hold: !!F.hold, name: F.name || null, world: W.world, character: W.character, playerMode: W.mode, scene: F.scene ? F.scene.name : null, actors: F.actors.size, rec: F.rec ? { t: +F.rec.t.toFixed(3), frames: F.rec.frames, until: F.rec.until } : null, aspect: F.aspect, fps: F.fps, size: F.size, time: F.time, lights: F.lights.length, sun: F.sun ? { color: '#' + F.sun.color.getHexString(), intensity: F.sun.intensity } : null, steps: F.steps, take: F.take, busy: F.busy, status: F.status, free: { pos: F.free.pos.toArray().map(v => +v.toFixed(1)), yaw: +F.free.yaw.toFixed(3), pitch: +F.free.pitch.toFixed(3), fov: +F.free.fov.toFixed(1) },
      band: F.bandOn ? F.lastBand : null,
      story: F.story || null, sound: window.Sound ? Sound.stats() : null, shots: F.shots.map(s => ({ name: s.name, sec: s.sec, shift: s.shift || null, score: s.score, lamp: !!s.lamp, title: s.title != null ? s.title : undefined, style: s.style, set: s.set || null, plan: s.plan || null, follow: !!s.follow, readout: s.readout || null, frame: s.keys[0] && s.keys[0].frame || null, acts: s.acts || [], events: (s.events || []).map(e => ({ what: e.what, who: e.who, at: e.at })), act: s.act ? { ...s.act } : null, keys: s.keys.map(k => ({ pos: k.pos.toArray().map(v => +v.toFixed(1)), tgt: k.tgt.toArray().map(v => +v.toFixed(1)), fov: +k.fov.toFixed(1) })) })) });
    F.ASPECTS = ASPECTS; F.SIZES = SIZES; F.FRAMES = FRAMES; F.SPEC = FILM_SPEC;
    return F;
  }

  window.Film = { create, ASPECTS, SIZES, FRAMES, BEAR, MOVES, TRAILERS, SCENES, SPEC: FILM_SPEC };
})();
