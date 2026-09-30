# What the scenes need from the performance engine

Generated with `odyssey/perform/needs.json` (the data; this page is its reading). What each voiced scene asks of the performance engine (tools/perform), read from the take (cut plan, clips, blocking), the Halfworld script (drive-script, spoken-lines, performance-turns, _direction.mjs) and the cineosis direction block. Times are on the take's cut clock (seconds from the scene's start). Coverage is derived: intent kinds with a realiser in tools/perform/intents.js (engine), kinds a motion.js clip sketches but no realiser plays (clip), and the rest (missing); combat relations and machinery have no realiser yet.

## Reading: what to build first

1. **Machinery before intents.** Boats are in 10 of the 30 scenes: a ship or raft with riders, oars on one shared phase clock whose tempo is a parameter (it rises after each threat and loses oars when rowers are taken), and the sea as an actor (wave fronts from impacts, whirlpool rings, spouts). The rough pass has only a ship that pitches, rolls and heaves. Missing: a ship pushed along by a wave (B09-S11), a ship that breaks up (B12-S07), a raft that capsizes (B05-S05) and a fleet (B10-S02).
2. **Contact is the most-needed relation that the engine lacks.** CONTACT appears in 12 scenes, and IMPACT only covers a blow. The scenes need a sustained grip or touch that has an owner and a duration: a hand over a mouth (B04-S04), a hand at the throat (B19-S04), four men holding a shape-changer (B04-S05), a giant's hand passing over the rams' backs (B09-S10), embraces held for 10 to 20 s (B23-S04, B16-S03). One primitive would cover SEIZE, DRAG, HOLD_BACK, GRAPPLE, CARRY a person, EMBRACE and TEND: two bodies coupled at contact points, with ownership and a release.
3. **Posture changes are the most-needed intent kind** (POSTURE, 9 scenes): sit, lie, crouch, cower and slump, entered and left by a move and held while breathing. Next come WEEP (7 scenes; a motion.js clip exists but has no realiser), ROPE_WORK (6: bind, moor, lash, unbind; rope is also machinery), ROW (6, clip only), TOOL_WORK (6: chop, carve, bore, dig), then ARM, EAT and RECOGNISE (5 each).
4. **Transformations** (4 scenes, plus the costume swap in B16-S03): one actor id keeps its identity while the body is replaced (figure to pig, lion, water or tree; beggar to king; stature grown). No transformation exists in the take or in the engine.
5. **Giants and animals are staged as props, not bodies.** In the takes, Polyphemus, the Laestrygonians, Scylla, Argos, the rams and the dogs are set pieces, so the engine cannot give them intents. The hardest scenes (the three Cyclops scenes, B10-S02, B12-S04, B14-S01, B17-S03) need a giant rig with reach and grasp, and quadrupeds with walk, head and tail channels.
6. **Chosen stillness.** Many holds must read as alive but still: the lotus languor, men hidden in the horse, a sleeper carried, the long embraces, a dog's death. They need HOLD reasons that the dead-frame metric accepts. A dead HOLD (Argos) must turn the breath off.
7. **Recordings.** Seven dialogue segments speak the script's summary instead of the line (the table below). The take captions them with the line, so the words a performance times its stresses to are not the words heard.

The hardest scenes, in order: **B09-S08** (a prop made on screen in four time-skipped phases, a giant who eats men, the offer upward; no location yet), **B09-S10** (men slung under walking rams, and a blind hand search that must miss; no location yet), **B09-S11** (two sets on one axis, a thrown mountain, a wave that pushes the ship, a 45 s curse by a giant who exists only as a prop), **B09-S03** (bliss that must not read as a dead frame, then a drag against resistance and binding), **B10-S02** (a fleet massacred in 35 s at a fast cut).

## Totals

Missing intent kinds, by how many scenes ask for them (`clip`: a motion.js clip sketches it, no realiser; `missing-shape`: a GESTURE/REACT variant the realiser lacks):

| kind | scenes | cover | where |
| --- | --- | --- | --- |
| POSTURE | 9 | missing | B09-S08 B09-S03 B04-S04 B04-S05 B19-S04 B14-S01 B01-S01 B13-S01 B01-S02 |
| WEEP | 7 | clip | B09-S03 B12-S04 B23-S04 B16-S03 B24-S03 B08-S05 B17-S03 |
| ROPE_WORK | 6 | missing | B09-S10 B09-S03 B10-S02 B12-S07 B05-S05 B05-S04 |
| ROW | 6 | clip | B09-S10 B09-S11 B09-S03 B10-S02 B12-S04 B13-S01 |
| TOOL_WORK | 6 | missing | B09-S08 B10-S05 B12-S06 B05-S04 B11-S01 B24-S03 |
| ARM | 5 | missing | B10-S02 B10-S05 B12-S04 B21-S07 B11-S01 |
| EAT | 5 | missing | B09-S08 B09-S03 B12-S07 B12-S06 B24-S05 |
| RECOGNISE | 5 | missing | B09-S11 B23-S04 B16-S03 B19-S04 B24-S05 |
| FLEE | 4 | missing | B10-S02 B10-S04 B14-S01 B06-S03 |
| HERD | 4 | missing | B09-S08 B09-S10 B10-S04 B12-S06 |
| SACRIFICE | 4 | missing | B09-S10 B14-S01 B12-S06 B11-S01 |
| SEIZE | 4 | missing | B09-S08 B10-S02 B04-S05 B19-S04 |
| STRUGGLE | 4 | missing | B09-S03 B12-S04 B04-S04 B04-S05 |
| TEND | 4 | missing | B19-S04 B05-S04 B24-S05 B01-S02 |
| THROW | 4 | missing | B09-S11 B10-S02 B10-S04 B14-S01 |
| TRANSFORM | 4 | missing | B10-S04 B04-S05 B16-S03 B24-S05 |
| CLIMB | 3 | clip | B09-S10 B05-S05 B13-S01 |
| EMBRACE | 3 | clip | B23-S04 B16-S03 B24-S03 |
| STRIKE | 3 | clip | B10-S04 B12-S04 B16-S03 |
| TURN_AWAY | 3 | missing | B16-S03 B19-S04 B17-S03 |
| HAUL | 2 | missing | B12-S07 B05-S04 |
| LOCOMOTE | 2 | missing | B23-S04 B14-S01 |
| MOVE_STONE | 2 | missing | B09-S08 B09-S10 |
| SWIM | 2 | clip | B12-S07 B05-S05 |
| WAKE | 2 | clip | B09-S08 B12-S07 |
| WEAVE | 2 | clip | B10-S04 B02-S02 |
| ANIMAL:fawn | 1 | missing | B10-S04 |
| ANIMAL:lift-head | 1 | missing | B17-S03 |
| ANIMAL:wag | 1 | missing | B17-S03 |
| BRACE | 1 | missing | B05-S05 |
| CARESS | 1 | missing | B09-S10 |
| CIRCLE | 1 | missing | B04-S04 |
| CROWD | 1 | missing | B11-S01 |
| CUT | 1 | missing | B10-S02 |
| DIE | 1 | missing | B17-S03 |
| DRAG | 1 | missing | B09-S03 |
| DROWN | 1 | missing | B12-S07 |
| GRAPPLE | 1 | missing | B04-S05 |
| GROPE | 1 | missing | B09-S10 |
| GUARD | 1 | missing | B11-S01 |
| LEAVE | 1 | missing | B01-S02 |
| LIFT | 1 | missing | B12-S04 |
| PLAY_INSTRUMENT | 1 | missing | B08-S05 |
| PLUCK | 1 | missing | B21-S07 |
| PURSUE | 1 | missing | B14-S01 |
| RIDE | 1 | missing | B12-S07 |
| STRING_BOW | 1 | missing | B21-S07 |

Combat relations (as intent kinds in tools/perform/intents-action.js):

| relation | scenes | engine | where |
| --- | --- | --- | --- |
| SEPARATION | 13 | engine | B09-S08 B09-S10 B09-S11 B10-S02 B10-S04 B12-S04 B12-S07 B05-S05 B16-S03 B14-S01 B10-S01 B13-S01 B06-S03 |
| CONTACT | 12 | partial: IMPACT (a blow), no sustained grip/touch | B09-S08 B09-S10 B09-S03 B10-S04 B10-S05 B12-S04 B23-S04 B04-S04 B04-S05 B16-S03 B19-S04 B24-S03 |
| THREAT | 10 | engine | B09-S08 B09-S10 B09-S11 B12-S04 B21-S07 B04-S04 B14-S01 B11-S01 B06-S03 B02-S02 |
| ATTACK | 9 | partial: SHOOT, THRUST | B09-S08 B09-S11 B10-S02 B10-S04 B12-S04 B12-S07 B05-S05 B04-S05 B14-S01 |
| EVADE | 7 | engine | B09-S08 B09-S10 B09-S11 B10-S02 B12-S04 B04-S05 B14-S01 |
| IMPACT | 6 | engine | B09-S11 B10-S02 B12-S07 B05-S05 B21-S07 B19-S04 |
| RECOVER | 6 | engine | B09-S11 B12-S04 B12-S07 B05-S05 B04-S04 B04-S05 |
| BLOCK | 5 | partial: DUCK (an evasion, not a parry) | B09-S03 B04-S04 B04-S05 B19-S04 B11-S01 |
| PURSUIT | 3 | engine | B10-S02 B14-S01 B11-S01 |
| RETARGET | 1 | engine | B09-S11 |

Machinery (no `tools/perform/machinery.js` yet; tools/choreograph.js's rough pass has a ship rig with riders):

| machinery | scenes | where |
| --- | --- | --- |
| SHIP | 8 | B09-S10 B09-S11 B09-S03 B10-S02 B12-S04 B12-S07 B10-S01 B13-S01 |
| OARS | 6 | B09-S10 B09-S11 B09-S03 B10-S02 B12-S04 B13-S01 |
| QUADRUPEDS | 6 | B10-S04 B04-S05 B14-S01 B12-S06 B11-S01 B17-S03 |
| SEA | 5 | B09-S11 B10-S02 B12-S04 B12-S07 B05-S05 |
| GIANT_RIG | 4 | B09-S08 B09-S10 B09-S11 B10-S02 |
| ROPE | 4 | B09-S10 B09-S03 B10-S02 B12-S07 |
| SAIL | 4 | B09-S03 B12-S07 B05-S05 B05-S04 |
| TRANSFORM | 4 | B10-S04 B04-S05 B16-S03 B24-S05 |
| FIRE | 3 | B09-S08 B19-S04 B12-S06 |
| PROP_STATE | 3 | B10-S05 B12-S06 B24-S03 |
| RAFT | 3 | B12-S07 B05-S05 B05-S04 |
| SEATED_CROWD | 3 | B21-S07 B01-S01 B08-S05 |
| BOULDER | 2 | B09-S11 B10-S02 |
| DOOR_STONE | 2 | B09-S08 B09-S10 |
| FLOCK | 2 | B09-S08 B09-S10 |
| LOOM | 2 | B10-S04 B02-S02 |
| ARROW | 1 | B21-S07 |
| AXES | 1 | B21-S07 |
| BASIN | 1 | B19-S04 |
| BED | 1 | B23-S04 |
| BENCH | 1 | B09-S03 |
| BOW | 1 | B21-S07 |
| BRANCH | 1 | B06-S03 |
| CLOAK | 1 | B08-S05 |
| HORSE | 1 | B04-S04 |
| LAMP | 1 | B23-S04 |
| LIGHTNING | 1 | B12-S07 |
| LYRE | 1 | B08-S05 |
| MEMORY_FRAME | 1 | B04-S04 |
| PEN | 1 | B10-S04 |
| POLE | 1 | B09-S11 |
| SCYLLA_RIG | 1 | B12-S04 |
| SEALSKIN | 1 | B04-S05 |
| SHADES | 1 | B11-S01 |
| SLEEPER | 1 | B13-S01 |
| SPITS | 1 | B12-S06 |
| STAFF | 1 | B02-S02 |
| STAKE | 1 | B09-S08 |
| STEERING_OAR | 1 | B05-S05 |
| STONES | 1 | B14-S01 |
| THUNDER | 1 | B21-S07 |
| TOOLS | 1 | B05-S04 |
| TREASURE | 1 | B13-S01 |
| TREE | 1 | B12-S07 |
| TRENCH | 1 | B11-S01 |
| VEIL | 1 | B05-S05 |
| WAND | 1 | B16-S03 |
| WIND_BAG | 1 | B10-S01 |

Scene types (homeostat bands): dialogue 7; fight 5; recognition 5; labour 4; ritual 3; storm 2; revelation 2; escape 1; transformation 1

## Recordings that do not speak the line

Seven DIALOGUE segments in the 34 voiced takes speak the drive-script's summary, not the authored line (all in Books XVI-XXIV: audio recorded before the authored lines landed; halfworld d540c51 says those books were re-voiced, these segments were not). Two more cannot be decided by duration (the line and the summary are the same length); with them the count is nine. The take captions these segments with the authored line, so caption and sound disagree. Also listed: narration segments that speak a fragment of a summary (script-level, not a recording fault).

- **OD-B16-S03 gi5** (Odysseus, 5.36 s, summary): 5.36 s holds the 52-char script text at 9.7 chars/s (the cast speaks 9-12) but not the 126-char authored line (23.5 chars/s): it speaks "Himself the father for whom Telemachus has suffered."
- **OD-B16-S03 gi7** (Telemachus, 3.68 s, summary): 3.68 s holds the 35-char script text at 9.5 chars/s (the cast speaks 9-12) but not the 159-char authored line (43.2 chars/s): it speaks "Athena's control of his appearance."
- **OD-B21-S07 gi8** (Odysseus, 9.32 s, summary): 9.32 s holds the 83-char script text at 8.9 chars/s (the cast speaks 9-12) but not the 238-char authored line (25.5 chars/s): it speaks "Tells you that the stranger has not disgraced the house and signals the next phase."
- **OD-B23-S04 gi2** (Penelope, 4.72 s, summary): 4.72 s holds the 59-char script text at 12.5 chars/s (the cast speaks 9-12) but not the 147-char authored line (31.1 chars/s): it speaks "Move the marriage bed outside the chamber for the stranger."
- **OD-B23-S04 gi7** (Penelope, 4.40 s, summary): 4.40 s holds the 35-char script text at 8.0 chars/s (the cast speaks 9-12) but not the 245-char authored line (55.7 chars/s): it speaks "Fear of deception caused her delay."
- **OD-B24-S03 gi5** (Odysseus, 6.92 s, summary): 6.92 s holds the 53-char script text at 7.7 chars/s (the cast speaks 9-12) but not the 137-char authored line (19.8 chars/s): it speaks "Unable to continue, I embraces him and names himself."
- **OD-B24-S03 gi7** (Laertes, 3.88 s, summary): 3.88 s holds the 24-char script text at 6.2 chars/s (the cast speaks 9-12) but not the 183-char authored line (47.2 chars/s): it speaks "For proof beyond desire?"
- **OD-B21-S07 gi3** (Odysseus, 3.80 s, undecidable): line and script text are the same length (26 vs 25 chars in 3.80 s): the duration cannot tell them apart; listen: line "Hear that. It still sings." / script "Sing now: like a swallow."
- **OD-B02-S02 gi5** (Antinous, 9.00 s, undecidable): line and script text are the same length (97 vs 92 chars in 9.00 s): the duration cannot tell them apart; listen: line "Send her back to her father Icarius, and let her marry the man he names, and the man she chooses." / script "Send her to her father. Let Icarius arrange the marriage, and this house will be free of us."

## Scenes, hardest first

### OD-B09-S08 The Name Nobody and the Stake

**Type** labour. **Total** 68.04 s. **Prepared**: nothing. Not prepared: the film player (film-readymades/production/Film-Butter-Odyssey.html.gz) has no location for this scene (no staged set, no keyframe file), so the take cannot be probed; it needs staging (odyssey/keyframes/<scene>.json and a rebuild of the player) first.

**Why it is hard**: Four time-skipped phases in 68 s (night, dawn meal, day labour, evening offer) on one set; a giant at 3-4 figure heights who eats men; a prop that is made on screen (trunk -> stake -> charred point -> hidden); the offer reaches up to a giant hand.

**Essential variables**: giant scale: eye lines and reaches up 3-4 H; the stake's stages as one prop with states; time-of-day skips inside one take (fire light); crew fear held without going dead; the offer upward (bowl lifted over the head)

Dramatic chain:

- 0.6 s: Odysseus stands over the sleeping giant, hand on the hilt, sword not drawn -> he looks to the door stone: no man can move it -> the impulse is checked (Im: the pressure stored)
- 11.9 s: dawn: Polyphemus wakes, seizes two men, eats, milks, rolls the stone aside, drives the flock out, re-seals -> crew recoil to the wall; the cave is shut again
- 23.1 s: Odysseus picks the green olive trunk by the pen, cuts a fathom; the men smooth it; he sharpens it and hardens the point in the fire -> the stake exists (Fe: insert of the glowing point)
- 35.7 s: the men hide the stake under the dung; they draw lots, four helpers chosen -> the plan is set; the stake waits, lit by one ember
- 44.0 s: evening: the giant returns; Odysseus lifts the wine bowl up to him and names himself Nobody -> Polyphemus drinks (the next scene's collapse)

Lines (speech act, affect, body):

- gi6 44.0 s odysseus -> polyphemus: ASSERT (offer + false name), contempt, OFFER [engine]. "drink wine on that man-flesh... Nobody is my name"

Intents: HOLD odysseus 0.6-8.0 (hand on hilt, restraint) [engine]; ATTEND odysseus > door-stone 3.0-6.0 [engine]; DECIDE odysseus 6.0-8.0 [engine]; WAKE polyphemus 11.9-13.0 [clip]; SEIZE polyphemus > crew-1 13.0-15.0 (giant hand closes on a man; carried) [missing]; EAT polyphemus 15.0-18.0 [missing]; POSTURE(cower) crew > polyphemus 13.0-20.0 [missing]; HERD polyphemus > flock 18.0-22.0 [missing]; MOVE_STONE polyphemus > door-stone 19.0-22.0 [missing]; TOOL_WORK(chop) odysseus > olive-trunk 23.1-27.0 [missing]; TOOL_WORK(carve) crew > stake 27.0-31.0 (smooth) [missing]; TOOL_WORK(sharpen) odysseus > stake 29.0-32.0 [missing]; HEAT odysseus > stake 32.0-35.5 (point turned in the fire) [engine]; SET_DOWN(hide_object) crew > stake 35.7-39.0 (under dung) [engine]; GAMBLE(cast_lots) crew 39.0-43.5 (four chosen: each reacts) [engine]; OFFER odysseus > polyphemus 45.0-50.0 (bowl lifted over the head to a giant) [engine]; DRINK polyphemus 50.0-56.0 (giant scale) [engine]

Relations: THREAT polyphemus>crew 11.9; ATTACK polyphemus>crew-1 13.0 (seize); EVADE crew>polyphemus 13.0 (press to the wall); CONTACT polyphemus>crew-1 13.5 (hand closes); SEPARATION door-stone>crew 21.0 (sealed in)

Machinery: DOOR_STONE: rolled aside and back by the giant only; seals the set; STAKE: one prop with states: trunk, stake, charred point, hidden; FIRE: hearth light; the point glows (emissive state); FLOCK: sheep driven out past the stone; GIANT_RIG: Polyphemus as a scaled body with reach and grasp, not a restaged prop

Contacts and handoffs: 13.5 s polyphemus seizes crew-1 and crew-2 (bodies carried) [owner polyphemus]; 23.5 s odysseus takes the olive trunk (sword as axe) [owner odysseus]; 27.0 s stake passed to two crew to smooth, back to odysseus [owner crew -> odysseus]; 32.0 s stake point into the fire [owner odysseus]; 36.0 s stake laid under dung [owner the floor]; 45.0 s wine bowl odysseus -> polyphemus [owner polyphemus]

Holds: odysseus 0.6-8.0: restraint: the stone would trap them; the hand stays on the hilt; stake 36.0-44.0: the charged object waits (Fe insert, one ember); crew 20.0-23.0: shock after the meal: breath only

### OD-B09-S10 Escape beneath the Rams

**Type** escape. **Total** 72.44 s. **Prepared**: nothing. Not prepared: the film player (film-readymades/production/Film-Butter-Odyssey.html.gz) has no location for this scene (no staged set, no keyframe file), so the take cannot be probed; it needs staging (odyssey/keyframes/<scene>.json and a rebuild of the player) first.

**Why it is hard**: Men carried upside down under walking rams, the giant's hands passing over every back at the door on a fixed rhythm, a blind search that must miss; then outside: unbinding, driving the flock, boarding, rowing, a sacrifice.

**Essential variables**: a rider slung under a quadruped (hands in wool, legs round the belly); the hand search as a timed contact test that misses; breath held against the speech over his head; the matched triad framings (Dm/Mk); no quadruped walk in the engine

Dramatic chain:

- 0.6 s: dawn: Polyphemus rolls back the stone and sits in the mouth, hands out, feeling every back -> the flock must pass under his hands
- 10.9 s: Odysseus binds rams three abreast with withies; a man under each middle ram -> the triads walk out, hands pass over the tops
- 23.4 s: last, the lead ram with Odysseus clinging under its belly; the giant stops it and speaks to it -> Odysseus freezes; the hand strokes the ram's back above him; the ram is let go
- 53.9 s: outside: the men drop from the rams, drive the flock to the ship, row away -> distance from the cave
- 63.9 s: Odysseus divides the animals, sacrifices the great ram to Zeus -> the next scene's boast

Lines (speech act, affect, body):

- gi4 23.4 s odysseus -> polyphemus: RECOUNT (quoting the giant), resolve, HOLD [engine]. "I hung beneath his belly... Sweet ram, why last from the cave today"

Intents: MOVE_STONE polyphemus > door-stone 0.6-4.0 [missing]; GROPE polyphemus > flock 4.0-50.0 (hands pass over each back) [missing]; ROPE_WORK(bind) odysseus > rams 10.9-20.0 (withies, three abreast) [missing]; CLING crew > ram 12.0-50.0 (under the middle ram) [engine]; CLING odysseus > lead-ram 23.4-53.0 [engine]; HOLD odysseus 30.0-50.0 (breath held) [engine]; CARESS polyphemus > lead-ram 30.0-50.0 [missing]; CARESS(speak_to_animal) polyphemus > lead-ram 30.0-50.0 [missing]; ROPE_WORK(unbind) crew 54.0-58.0 [missing]; HERD crew > flock 56.0-62.0 [missing]; CLIMB(board) crew > ship 58.0-62.0 [clip]; ROW crew 60.0-64.0 [clip]; SACRIFICE odysseus > lead-ram 63.9-72.0 [missing]

Relations: THREAT polyphemus>odysseus 4.0 (the search); EVADE odysseus>polyphemus 23.4 (concealment under the ram); CONTACT polyphemus>lead-ram 30.0 (hand on the back, a hand-width from Odysseus); SEPARATION crew>polyphemus 54.0

Machinery: DOOR_STONE: opened at dawn; FLOCK: rams in triads walking a gate lane at a steady cadence; riders slung underneath; ROPE: withies binding three rams; released outside; SHIP: boarding and pushing off; OARS: shared phase clock from 60 s; GIANT_RIG: seated giant, two searching hands

Contacts and handoffs: 12.0 s crew bound under the middle rams (riders of the ram) [owner ram]; 23.4 s odysseus grips the lead ram's wool [owner lead-ram]; 30.0 s giant hand on the lead ram's back; 54.0 s men drop from the rams [owner crew]; 64.0 s lead ram led to the altar; the knife [owner odysseus]

Holds: odysseus 30.0-50.0: held breath under the ram while the giant speaks (concealment); polyphemus 30.0-50.0: the stillness of grief over the ram, the hand moving only

### OD-B09-S11 The Boast and the Curse

**Type** fight. **Total** 100.52 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: Two sets on one axis (ship and shore) with a thrown mountain crossing it; the rock's splash drives a wave that pushes the ship back to shore; a blind thrower aims by the voice; a long curse (45 s) that must stay alive on a single figure.

**The take**: cast odysseus, odysseus-s-crew-1, odysseus-s-crew-2, odysseus-s-crew-3, odysseus-s-crew-4, odysseus-s-crew-5; 5 keys, 49 shots; staged only as a set piece: polyphemus; rough-pass density (after) 0.961, longest still 1.75 s.

**Essential variables**: ship as a dynamic body pushed by a wave (not just pitch/roll); ballistic rock with a splash and wave front; aim by sound: the giant re-orients on each shout; crew restraining their captain (hands on him); a 45 s speech from one body: prayer arms, recognition grief, curse

Dramatic chain:

- 0.6 s: from the stern Odysseus jeers at the Cyclops; the crew plead with him to stop -> the voice reaches the shore
- 17.7 s: Polyphemus tears off a peak and hurls it; it lands ahead; the wave drives the ship back toward shore -> Odysseus poles off; the crew row hard
- 28.7 s: further out, Odysseus names himself: Odysseus, sacker of cities, Laertes' son of Ithaca -> the crew grab at him; the giant has a name
- 47.4 s: Polyphemus remembers the prophecy, then lifts his hands and prays to Poseidon: late, broken, alone -> the curse the rest of the poem pays
- 92.5 s: a second, bigger rock falls just astern; its wave carries the ship to the fleet -> escape

Lines (speech act, affect, body):

- gi2 0.6 s odysseus -> polyphemus: TAUNT, triumph, GESTURE:taunt [engine]. "Cyclops! It was no weak man's friends you ate"
- gi4 28.7 s odysseus -> polyphemus: REVEAL, pride, GESTURE:chest [engine]. "it was Odysseus, sacker of cities"
- gi6 47.4 s polyphemus -> poseidon: CURSE (prayer), anguish, GESTURE:invoke [engine]. "So the old prophecy comes home... Hear me, Poseidon"

Intents: GESTURE:plead(plead) crew > odysseus 3.0-16.0 (hands on his arm) [engine]; LISTEN polyphemus > odysseus 1.0-16.0 (by ear, head cocked) [engine]; THROW polyphemus > ship 17.7-20.0 (two-handed overhead, rock torn from the peak) [missing]; ROW crew 20.0-28.0 (tempo up) [clip]; STEER(pole_off) odysseus > shore 21.0-25.0 [engine]; HOLD_BACK(restrain) crew > odysseus 29.0-40.0 [engine]; ATTEND polyphemus > odysseus 29.0-46.0 (by ear) [engine]; RECOGNISE polyphemus 47.4-60.0 (the prophecy) [missing]; GESTURE:invoke(pray) polyphemus > sky 62.0-90.0 (arms raised) [engine]; THROW polyphemus > ship 92.5-95.0 [missing]; ROW crew 95.0-100.5 [clip]

Relations: THREAT odysseus>polyphemus 0.6 (the taunt); RETARGET polyphemus>ship 17.0 (aim from the voice); ATTACK polyphemus>ship 17.7 (rock); IMPACT rock>sea 19.5 (ahead of the bow); EVADE ship>rock 20.0; RECOVER ship>wave 22.0 (pole off the shallows); RETARGET polyphemus>ship 30.0 (on the name); ATTACK polyphemus>ship 92.5; IMPACT rock>sea 94.0 (astern); SEPARATION ship>shore 96.0

Machinery: SHIP: pitch/roll/heave plus translation: pushed by the wave toward shore, then away; OARS: shared phase clock, tempo rising after each rock; SEA: splash and a travelling wave front from each impact; BOULDER: ballistic arc from the giant's hands to the water; POLE: a pole planted on the bottom, the ship pushed off; GIANT_RIG: standing giant on the shore, throw and prayer poses

Contacts and handoffs: 3.0 s crew hands on Odysseus' arms (plea); 17.7 s the peak torn off: rock owned by Polyphemus [owner polyphemus]; 19.5 s rock released to the air [owner none]; 29.0 s crew grip Odysseus (restraint)

Holds: crew 19.5-21.0: the splash: a beat of shock before the oars; polyphemus 60.0-62.0: the recognition lands before the prayer

Previz: Contact sheet read (20 drawings). Polyphemus speaks the 45 s curse but is a set piece, not a rig: during his lines the SPK/REACT cameras frame the crew, and at 59 s (d709 REACT) the camera sits inside the crowd, with heads and oars filling the lens. The crew stand holding their oars upright in one hand: no rowing, though the sheet declares a ship rig. The wides are tiny figures on a wireframe ship. No T-poses.

### OD-B09-S03 The Lotus-Eaters

**Type** labour. **Total** 43.12 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A stillness that must read as bliss, not a dead frame (7 s holds, Ba sign: "no movement but breath"), then a violent rescue: men dragged weeping, bound under benches, the rest sent to the oars.

**The take**: cast odysseus, three-scouts-1, three-scouts-2, three-scouts-3, lotus-eaters-1, lotus-eaters-2, lotus-eaters-3, lotus-eaters-4, lotus-eaters-5; 3 keys, 5 shots; not in the take's cast: crew, scout-1; rough-pass density (after) 0.728, longest still 2.25 s.

**Essential variables**: sanctioned stillness vs the dead-frame metric (lotus languor); drag: two coupled bodies, the dragged resisting and weeping; binding a figure under a bench (rope and pose); the storm (nine days) as ship machinery in the first 8 s

Dramatic chain:

- 0.6 s: a north wind drives the ships nine days -> landfall
- 8.0 s: they land; Odysseus sends three scouts inland -> the scouts meet the Lotus-eaters
- 16.2 s: the Lotus-eaters offer lotus; the scouts take it and eat -> they forget home
- 21.1 s: the scouts lie in the meadow among the eaters, breathing only -> Odysseus must fetch them
- 28.2 s: Odysseus drags the weeping scouts to the ship, binds them under the benches, orders the rest to the oars -> departure

Lines (speech act, affect, body):

- gi6 28.2 s odysseus -> crew: COMMAND, command, GESTURE:point [engine]. "bind them under the benches... to your oars now"

Intents: STEER odysseus > ship 0.6-8.0 [engine]; LEAD odysseus 8.0-12.0 [engine]; GESTURE:point odysseus 9.0-10.0 (send the scouts) [engine]; OFFER lotus-eater > scout-1 16.2-18.0 (lotus) [engine]; TAKE scout-1 17.0-18.5 [engine]; EAT scout-1 18.5-21.0 [missing]; POSTURE(lie_down) scout-1 21.0-23.0 [missing]; HOLD scout-1 23.0-28.0 (languor: breath only) [engine]; DRAG odysseus > scout-1 28.2-34.0 [missing]; STRUGGLE(resist) scout-1 > odysseus 28.5-34.0 [missing]; WEEP scout-1 28.5-38.0 [clip]; ROPE_WORK(bind) odysseus > scout-1 34.0-38.0 (under the bench) [missing]; ROW crew 38.0-43.0 [clip]

Relations: CONTACT odysseus>scout-1 28.5 (grip on the arm); BLOCK scout-1>odysseus 29.0 (passive resistance: dead weight)

Machinery: SHIP: storm pitch in the opening, beached, then rowed off; SAIL: north wind: the sail full, the mast straining; ROPE: bonds under the benches; OARS: from 38 s; BENCH: a figure bound lying under a thwart

Contacts and handoffs: 17.0 s lotus eater -> scout [owner scout-1]; 28.5 s odysseus grips the scout [owner odysseus]; 34.0 s scout bound to the bench [owner ship]

Holds: scouts 23.0-28.0: lotus languor: the stillness is the point (Ba); breath only, never zero; lotus-eaters 16.0-28.0: gentle, unhurried: slow breath and sway

Previz: Contact sheet read. The OBJ inserts from 3.6 to 17 s (the lotus insert, by the direction) all frame Odysseus' chest: nothing charged is in shot, because the lotus is not staged. The scouts' languor (22-26 s) reads as sitting upright, not lying in the meadow. At 20.9 s a red figure stands on the green scout's head (two figures stacked at one mark). The REACT shots from 29 to 40 s put the camera inside Odysseus' head, and the scouts overlap one another (bodies interpenetrating). No T-poses.

### OD-B10-S02 The Laestrygonian Harbor

**Type** fight. **Total** 34.96 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A massacre in 35 s at a fast cut: a fleet of ships in a ring of cliffs, giants hurling boulders and spearing men like fish, one ship outside on a cable that is cut; many agents and several ships each needing its own motion.

**The take**: cast odysseus, three-scouts-1, three-scouts-2, three-scouts-3; 4 keys, 13 shots; staged only as a set piece: antiphates; not in the take's cast: crew, fleet-crews, giant-girl, laestrygonians, scout-2; rough-pass density (after) 0.821, longest still 1.833 s.

**Essential variables**: several ships, each its own rig (the fleet); boulders from above with impacts and sinking; mooring cable under tension, cut, the ship released; giants vs minifigs (scale); spearing men in the water; rowing at maximum tempo to escape

Dramatic chain:

- 0.6 s: the fleet rows into the narrow harbour ringed by cliffs -> trapped
- 8.2 s: Odysseus alone moors outside, cable to a rock -> his ship can still leave
- 14.9 s: three scouts meet the giant girl, who points them to her parents' house -> they meet the queen
- 18.4 s: the queen summons Antiphates; he seizes and eats a scout; two flee -> the town is roused
- 22.0 s: (cut from the voice, in the keys) giants mass on the cliffs, hurl boulders, spear the crews -> the fleet is crushed
- 27.3 s: Odysseus draws his sword, cuts the cable, orders the oars; one ship escapes -> alone

Intents: ROW fleet-crews 0.6-8.0 [clip]; ROPE_WORK(moor) odysseus > rock 8.2-14.0 (cable made fast) [missing]; GESTURE:point giant-girl > house 15.0-16.5 [engine]; SEIZE antiphates > scout-1 18.4-20.0 [missing]; FLEE scout-2 > ship 19.0-24.0 [missing]; THROW laestrygonians > fleet 22.0-27.0 [missing]; THRUST(spear) laestrygonians > crew-in-water 23.0-27.0 [engine]; ARM(draw_weapon) odysseus > sword 27.3-28.0 [missing]; CUT odysseus > cable 28.0-29.0 [missing]; GESTURE:chop odysseus > crew 29.0-30.0 (row!) [engine]; ROW crew 29.5-35.0 (maximum tempo) [clip]

Relations: PURSUIT laestrygonians>scout-2 19.0; ATTACK laestrygonians>fleet 22.0 (boulders); IMPACT boulder>ship 23.0; ATTACK laestrygonians>crew-in-water 24.0 (spear); EVADE odysseus-ship>harbour 29.0; SEPARATION odysseus-ship>fleet 31.0

Machinery: SHIP: a fleet (several hulls), each pitched and rolled; crushed and sinking hulls; OARS: phase clock per ship; tempo ramp at the escape; ROPE: mooring cable: tension, cut, slack; BOULDER: ballistic from the cliffs, many; SEA: splashes, spouts; GIANT_RIG: giants on the cliff tops, throwing and spearing

Contacts and handoffs: 8.5 s cable odysseus-ship -> rock [owner rock]; 18.8 s antiphates seizes scout-1 [owner antiphates]; 28.0 s cable cut: ship released [owner none]

Previz: Contact sheet read. The rig cast is only Odysseus and three scouts: no crews, no giants, no fleet (the Laestrygonians, Antiphates and the ships are set pieces). From K3 (18.4 s) three-scouts-2 is blocked 158 units above the floor (y 205): the seized scout floats in the air, tumbling at 21-23 s, as if carried by the giant who is not there. The wides at 0.6-3.6 s and 12-15 s are tiny figures in a wireframe box, and the wides at 18-19 s and 25.7 s frame no one. The cable cut (27.3 s) shows Odysseus alone, with no ship and no crew to row. No T-poses.

### OD-B10-S04 Circe Transforms the Crew

**Type** transformation. **Total** 52.09 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: Beasts fawning around men (quadrupeds with intent), a host turning jailer, a wand strike that swaps bodies (minifig to pig by replacement on twos, torso held), pigs herded into pens, and a hidden witness who flees.

**The take**: cast circe, eurylochus, five-scouts-1, five-scouts-2, five-scouts-3, five-scouts-4, five-scouts-5; 5 keys, 25 shots; staged only as a set piece: crew; not in the take's cast: wolves-lions; rough-pass density (after) 0.787, longest still 2 s.

**Essential variables**: body replacement mid-scene (figure -> pig) with identity carried (the same actor id); wolves and lions that fawn (quadruped business); a watcher hidden and still, then fleeing; the loom and the song at the start

Dramatic chain:

- 0.6 s: the scouts reach Circe's house; she sings at her loom; wolves and lions fawn round them -> the men are drawn in
- 11.7 s: all enter but Eurylochus, who hangs back at the edge -> a witness outside
- 16.2 s: Circe seats them, serves drugged food and wine; when they have drunk she strikes them with her wand -> they turn
- 24.1 s: the men become pigs, minds intact -> they grunt and weep
- 31.7 s: Circe drives them into the sties, throws acorns -> penned
- 38.1 s: Eurylochus runs back and reports: they are gone -> Odysseus goes (next scene)

Lines (speech act, affect, body):

- gi7 38.1 s eurylochus -> odysseus: REPORT, fear, GESTURE:plead [engine]. "They are gone, Odysseus, all of them!"

Intents: WEAVE circe 0.6-12.0 [clip]; SING circe 0.6-12.0 [engine]; ANIMAL:fawn(fawn) wolves-lions > crew 0.6-12.0 [missing]; APPROACH crew > circe 3.0-12.0 [engine]; WELCOME circe > crew 11.7-14.0 [engine]; HIDE eurylochus 11.7-37.0 (watches from cover) [engine]; POUR circe 16.2-18.0 [engine]; OFFER circe > crew 17.0-19.0 [engine]; DRINK crew 18.0-21.0 [engine]; STRIKE(strike_wand) circe > crew 21.0-23.0 [clip]; TRANSFORM crew 23.0-26.0 (figure -> pig, identity kept) [missing]; HERD circe > pigs 31.7-35.0 [missing]; THROW circe > pen 34.0-36.0 (acorns) [missing]; FLEE eurylochus 36.0-38.0 [missing]; GESTURE:plead(report) eurylochus > odysseus 38.1-52.0 [engine]

Relations: ATTACK circe>crew 21.0 (the wand); CONTACT wand>crew 21.5; SEPARATION eurylochus>house 36.0

Machinery: LOOM: Circe weaving: shuttle and beater on the song's beat; TRANSFORM: mesh swap figure -> pig over four drawings on twos, torso held; QUADRUPEDS: wolves, lions, pigs: walk, fawn, crowd; PEN: sty gate shut on the pigs

Contacts and handoffs: 17.0 s cups circe -> crew [owner crew]; 21.5 s wand touches each man; 34.0 s acorns thrown into the pen

Holds: eurylochus 12.0-36.0: hidden and frozen in dread (not dead: shallow breath, eyes tracking)

Previz: Contact sheet read. There is no transformation: the scouts are simply made invisible key by key (K3, K4), with no pig and no beasts (the wolves, lions and swine are set pieces). Eurylochus is invisible until K5 (38.1 s), so the hidden witness is never seen watching. At K3 (24.1 s) Circe is blocked 12 units above the floor (y 25 on a floor at 13): she floats. His report (38-52 s) is played to Circe, the only figure present (Odysseus is not in the scene), with the camera behind Eurylochus' head, which fills most of the frame for 14 s. The seated scouts are at y -8, possibly sunk into the benches. No T-poses.

### OD-B10-S05 Hermes Gives the Moly

**Type** dialogue. **Total** 68.11 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A two-hander that is mostly instruction (three long Hermes lines) with one charged prop pulled from the earth and handed over; the instruction rehearses a future fight (wand, sword, oath) that the body should pre-enact without doing it.

**The take**: cast odysseus, hermes-as-young-man; 4 keys, 12 shots; not in the take's cast: eurylochus; rough-pass density (after) 0.854, longest still 1.083 s.

**Essential variables**: the moly: dug, lifted, shown (root and flower), handed; ownership to Odysseus; Hermes interrupting a walk (step into the path); rehearsal gestures that mime the future (draw sword, rush) at small amplitude; arming at the start (sword over shoulder, bow)

Dramatic chain:

- 0.6 s: Odysseus slings on his sword, takes his bow, and sets off alone despite Eurylochus -> walking the valley
- 10.8 s: Hermes, as a young man, steps into his path: where now, unlucky man? -> Odysseus stops
- 28.5 s: Hermes pulls the moly from the earth, shows it, gives it -> Odysseus holds the charm
- 48.1 s: Hermes instructs: when she strikes, draw and rush her; make her swear the oath -> the plan for the next scene

Lines (speech act, affect, body):

- gi3 10.8 s hermes -> odysseus: WARN, irony, GESTURE:open [engine]. "Where now, unlucky man..."
- gi4 28.5 s hermes -> odysseus: GIVE, wonder, OFFER [engine]. "take this herb of power... moly"
- gi5 48.1 s hermes -> odysseus: INSTRUCT, command, GESTURE:chop [engine]. "draw your sword and rush her..."

Intents: ARM odysseus 0.6-4.0 (sword over the shoulder, bow) [missing]; GESTURE:plead(plead) eurylochus > odysseus 1.0-6.0 (holds his arm) [engine]; APPROACH(walk) odysseus 4.0-11.0 [engine]; APPROACH(intercept) hermes > odysseus 10.0-11.5 [engine]; NOTICE odysseus > hermes 11.0-12.0 [engine]; LISTEN odysseus 11.0-68.0 [engine]; TOOL_WORK(dig) hermes > moly 28.5-32.0 [missing]; GESTURE:show(show) hermes > moly 32.0-36.0 (root and flower in one frame) [engine]; OFFER hermes > odysseus 36.0-38.0 [engine]; TAKE odysseus 37.0-39.0 [engine]; GESTURE:mime(mime) hermes 50.0-58.0 (draw and rush, small) [engine]

Relations: CONTACT eurylochus>odysseus 2.0 (restraining hand, shaken off)

Machinery: PROP_STATE: moly: in the earth, pulled (root black, flower white), carried

Contacts and handoffs: 2.0 s eurylochus grips odysseus' arm; released; 30.0 s moly from the earth [owner hermes]; 37.5 s moly hermes -> odysseus [owner odysseus]

Holds: odysseus 11.0-12.0: stopped dead by the stranger in the path; moly 33.0-36.0: the insert: root and flower held up (Fe)

### OD-B12-S04 Between Scylla and Charybdis

**Type** fight. **Total** 53.52 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A ship under oars between a whirlpool and a cliff; six serpent heads strike at once and lift six rowers up the rock; an armed captain looking the wrong way; the survivors row on under the screams.

**The take**: cast odysseus, six-seized-sailors-1, six-seized-sailors-2, six-seized-sailors-3, six-seized-sailors-4, six-seized-sailors-5, six-seized-sailors-6; 5 keys, 24 shots; staged only as a set piece: scylla; not in the take's cast: crew, helmsman, rowers; rough-pass density (after) 0.606, longest still 2.667 s.

**Essential variables**: six simultaneous strikes out of the rowing (pose-to-pose on twos); bodies lifted out of the ship (ownership to the monster); the whirlpool rings rotating (sea machinery); oars that keep their clock while men are taken (gaps in the bank); Odysseus' search: attention on the cliff face, armed, futile

Dramatic chain:

- 0.6 s: the crew hear Charybdis roar and see the spray; oars falter -> Odysseus steadies them
- 10.9 s: Odysseus: row, hold her off the smoke, hug the cliff -> the ship hugs Scylla's rock (he keeps her secret)
- 25.7 s: he arms himself, two spears, goes to the bow and searches the rock face -> looking at the wrong place
- 34.3 s: Scylla's six heads strike and lift six rowers screaming his name -> six gaps in the benches
- 42.6 s: the survivors row past both monsters, watching their companions die above -> grief under the oars

Lines (speech act, affect, body):

- gi3 10.9 s odysseus -> crew: COMMAND, resolve, GESTURE:point [engine]. "Row, friends... hug the cliff"

Intents: ROW crew 0.6-53.5 [clip]; REACT:startle crew 1.0-2.0 (Charybdis roar) [engine]; GESTURE:point odysseus > cliff 12.0-13.0 [engine]; STEER helmsman 11.0-53.5 [engine]; ARM odysseus 25.7-29.0 (armour and two spears) [missing]; SEARCH odysseus > cliff-face 29.0-34.0 [engine]; STRIKE(strike_down) scylla > rowers 34.3-36.0 (six heads at once) [clip]; LIFT scylla > rowers 36.0-42.0 [missing]; STRUGGLE rowers 36.0-45.0 (hands and feet in the air) [missing]; ATTEND(look_up) crew > rowers 42.6-53.5 [engine]; WEEP(grief) odysseus 42.6-53.5 [clip]

Relations: THREAT charybdis>ship 0.6; EVADE ship>charybdis 11.0; ATTACK scylla>rowers 34.3 (six heads); CONTACT scylla>rowers 35.0; SEPARATION rowers>ship 37.0 (lifted away); RECOVER crew>ship 40.0 (oars back on the clock); SEPARATION ship>monsters 48.0

Machinery: SHIP: rolling in the strait, hugging the cliff; OARS: shared phase clock; six oars drop out at 34 s, the rest keep time; SEA: whirlpool: concentric rings rotating, spray columns; SCYLLA_RIG: six necks from the cliff: strike, grip, lift (IK chains)

Contacts and handoffs: 35.0 s six rowers seized from the benches [owner scylla]; 27.0 s odysseus takes two spears [owner odysseus]

Holds: odysseus 42.6-48.0: the icon: face turned up, the men out of frame (the grief held)

### OD-B12-S07 Zeus Destroys the Last Ship

**Type** storm. **Total** 60.73 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: Accusation, departure, a thunderbolt to the mast, the ship shattering and every man drowning, a raft lashed from keel and mast, and a man hanging from a fig tree over a whirlpool: five situations and a lone survivor, mostly held in extreme wides.

**The take**: cast odysseus, drowning-crew-1, drowning-crew-2, drowning-crew-3, drowning-crew-4, drowning-crew-5; 5 keys, 7 shots; not in the take's cast: helmsman; rough-pass density (after) 0.93, longest still 2.333 s.

**Essential variables**: ship break-up: the hull into pieces (keel, mast) with men thrown into the sea; drowning crowd (swim then sink); lashing keel and mast (rope) and riding them; hang from the fig tree: a sustained grip hold with the body swinging; the only moving thing is the whirlpool (hold, Ba)

Dramatic chain:

- 0.6 s: Odysseus wakes, smells the roasting meat, and condemns the crew -> the crew feast six days regardless
- 18.1 s: on the seventh day the wind drops; they raise the mast and sail -> at sea, no land
- 27.5 s: Zeus gathers a black cloud and strikes the mast with lightning -> the mast falls on the helmsman; the ship fills with fire
- 34.5 s: the ship shatters; every crewman drowns -> Odysseus alone
- 41.6 s: he lashes keel and mast together and rides them -> drifting
- 47.4 s: driven back to Charybdis, he leaps to the fig tree and hangs until the timbers come up, then drops and drifts -> to Calypso

Lines (speech act, affect, body):

- gi2 0.6 s odysseus -> crew: CONDEMN, anguish, GESTURE:invoke [engine]. "What have you done... O father Zeus"

Intents: WAKE odysseus 0.6-2.0 [clip]; GESTURE:point(accuse) odysseus > crew 3.0-17.0 [engine]; EAT crew 3.0-17.0 (feasting, ignoring) [missing]; HAUL(hoist) crew > mast 18.1-26.0 (raise mast, spread sail) [missing]; FALL helmsman 29.0-31.0 [engine]; FALL crew 34.5-36.0 (thrown into the sea) [engine]; SWIM crew 35.0-40.0 [clip]; DROWN crew 37.0-41.0 [missing]; ROPE_WORK(bind) odysseus > keel+mast 41.6-46.0 [missing]; RIDE odysseus > raft 45.0-50.0 [missing]; LEAP odysseus > fig-tree 50.0-51.0 [engine]; CLING(hang) odysseus > fig-tree 51.0-58.0 [engine]; SET_DOWN(drop) odysseus 58.0-60.0 [engine]

Relations: ATTACK zeus>ship 27.5 (thunderbolt); IMPACT bolt>mast 28.0; IMPACT mast>helmsman 29.5 (skull crushed); SEPARATION crew>ship 34.5; RECOVER odysseus>wreck 42.0 (lashes a raft)

Machinery: SHIP: sailing, then break-up into keel and mast pieces; SAIL: raised at 18 s; LIGHTNING: bolt, flash, fire on deck; SEA: storm swell; whirlpool (Charybdis) rings; ROPE: the lashing of keel to mast; RAFT: keel and mast as a rideable pair; TREE: fig tree over the whirlpool: a grip anchor

Contacts and handoffs: 41.6 s odysseus grips keel and mast, lashes them [owner odysseus]; 51.0 s hands on the fig branch [owner fig-tree]; 58.0 s releases, falls to the timbers [owner raft]

Holds: odysseus 51.0-58.0: hanging like a bat: only the whirlpool moves (Ba, En); breath and grip strain only

### OD-B05-S05 Poseidon Breaks the Sea

**Type** storm. **Total** 47.25 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A man alone on a raft in a four-wind storm: the raft rolls, he is swept off and swims back, a sea goddess climbs aboard with a veil, he strips and swims; the god on the headland; the sea is the other actor.

**The take**: cast odysseus, poseidon, ino-leucothea; 5 keys, 6 shots; rough-pass density (after) 0.64, longest still 2.667 s.

**Essential variables**: the raft as a body in heavy sea (roll, pitch, heave, a capsize-level roll); a figure swept overboard and regaining the raft (swim, climb); the veil: given, tied round the chest (prop attached to the body); Poseidon at a distance on one axis with the raft (Bi); the steering oar in hand for the first 11 s

Dramatic chain:

- 0.6 s: seventeen days Odysseus steers by the stars; Scheria rises ahead -> hope
- 11.6 s: Poseidon sees him from the Solymi mountains, gathers clouds, stirs the sea with the trident -> the four winds storm
- 21.7 s: the raft rolls; the mast snaps -> he is thrown
- 26.4 s: swept away, he swims, drags himself back aboard -> barely holding on
- 32.8 s: Ino rises, sits on the raft: leave it, swim; gives her veil -> he ties on the veil
- 37.3 s: Athena stills all winds but the north; he swims toward land -> the next scene

Intents: STEER odysseus > raft 0.6-11.6 (the steering oar) [engine]; ATTEND(look_up) odysseus > stars 3.0-8.0 [engine]; GESTURE:invoke(invoke) poseidon 11.6-16.0 (trident stirs the sea) [engine]; BRACE odysseus > raft 16.0-22.0 [missing]; FALL odysseus 22.0-24.0 (thrown overboard) [engine]; SWIM odysseus 24.0-28.0 [clip]; CLIMB odysseus > raft 28.0-31.0 [clip]; ARRIVE ino 32.8-34.0 (rises from the sea, sits on the raft) [engine]; OFFER ino > odysseus 34.0-35.5 (the veil) [engine]; TAKE odysseus 35.0-36.0 [engine]; ROPE_WORK(tie_on) odysseus > veil 36.0-38.0 [missing]; SWIM odysseus 40.0-47.0 [clip]

Relations: ATTACK poseidon>raft 11.6 (the storm); IMPACT wave>raft 21.7; SEPARATION odysseus>raft 22.0; RECOVER odysseus>raft 28.0; SEPARATION odysseus>raft 39.0 (abandons it)

Machinery: RAFT: heavy sea motion; a roll past 60 degrees; mast broken; SEA: storm swell, breaking waves, spouts; SAIL: the raft's sail and mast (snap); STEERING_OAR: held and worked; VEIL: cloth prop tied round the chest

Contacts and handoffs: 1.0 s hands on the steering oar [owner odysseus]; 22.0 s loses the oar; thrown off [owner none]; 28.0 s grips the raft's edge, climbs back; 34.5 s veil ino -> odysseus [owner odysseus]

Holds: odysseus 0.6-10.0: the long watch: steady at the oar, only the head to the stars and the sea moving (hold_min 5 s)

### OD-B21-S07 The Bow Sings

**Type** revelation. **Total** 51.45 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: The bow is the actor: strung by bending it against the body, the string plucked (a note), an arrow nocked, drawn and loosed through twelve axe rings in a line; a beggar's posture falling away through handling; a hall of seated suitors reacting to a sound; thunder answering.

**The take**: cast odysseus, telemachus, six-suitors-1, six-suitors-2, six-suitors-3, six-suitors-4, six-suitors-5, six-suitors-6; 5 keys, 13 shots; staged only as a set piece: zeus; rough-pass density (after) 0.476, longest still 4 s.

**Essential variables**: bow machinery: bend, string, pluck, nock, draw (string tension), release; arrow flight through 12 aligned rings (a path constraint); posture change beggar -> king over the scene (a continuous affect parameter); Telemachus arming and taking position (sword and spear handoff to himself); a hall of seated listeners reacting to a sound (string, thunder)

Dramatic chain:

- 0.6 s: Odysseus turns the bow in his hands, bends it and strings it without effort, as a bard strings a lyre -> the suitors go pale
- 10.1 s: he plucks the string: it sings like a swallow -> Zeus answers with thunder
- 14.3 s: thunder: Zeus' sign on the day -> Odysseus is glad; suitors dismayed
- 22.1 s: Telemachus girds on his sword, takes his spear, stands at his father's side -> two armed men at the threshold
- 32.4 s: Odysseus nocks an arrow and shoots, seated, through all twelve axes -> the mark is made
- 41.5 s: he tells Telemachus the stranger has not disgraced him: supper, then other sport -> the slaughter (Book 22)

Lines (speech act, affect, body):

- gi3 10.1 s odysseus -> telemachus: SONG (aside), resolve, GESTURE:open [engine]. "Hear that. It still sings."
- gi5 14.3 s zeus -> odysseus: REPLY (sign), command. "It is time, son of Laertes"
- gi8 41.5 s odysseus -> telemachus: DIRECT, resolve, GESTURE:point [engine]. "the stranger... has not disgraced you... other sport in this house"

Intents: ATTEND(inspect) odysseus > bow 0.6-3.0 (turned in the hands) [engine]; STRING_BOW odysseus > bow 3.0-9.0 [missing]; PLUCK odysseus > bowstring 10.1-11.0 [missing]; REACT:startle suitors 11.0-12.0 [engine]; ATTEND(look_up) odysseus > sky 14.3-16.0 (thunder) [engine]; REACT:flinch suitors 14.5-15.5 [engine]; ARM telemachus 22.1-26.0 (sword and spear) [missing]; APPROACH telemachus > odysseus 26.0-31.0 [engine]; SHOOT(nock) odysseus 32.4-34.0 [engine]; SHOOT(draw_bow) odysseus 34.0-36.0 [engine]; SHOOT odysseus > axes 36.0-36.5 [engine]; SHAME suitors 37.0-41.0 [engine]; HOLD telemachus 31.0-51.0 (armed at his side) [engine]

Relations: THREAT odysseus>suitors 10.1 (the bow strung); THREAT telemachus>suitors 31.0 (armed); IMPACT arrow>axes 36.3 (passes, touching none)

Machinery: BOW: bend to string, string tension on the draw, the release snap; the note on the pluck; ARROW: nock, flight on a straight line through 12 rings; AXES: twelve axe heads in a row, holes aligned (path constraint); THUNDER: sound stimulus with a light flicker; SEATED_CROWD: suitors seated in a row behind (Dm framing)

Contacts and handoffs: 3.0 s bow tip braced against the body; string hooked [owner odysseus]; 22.5 s telemachus takes sword and spear [owner telemachus]; 32.4 s arrow from the quiver to the string [owner odysseus]; 36.2 s arrow released [owner none]

Holds: suitors 11.0-14.0: dismay at the note: they freeze (turned pale), a held breath; odysseus 36.5-39.0: the follow-through held after the release

### OD-B23-S04 The Bed Test

**Type** recognition. **Total** 45.53 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A trick by speech, an eruption of anger through craft memory (building the bed round a living olive), the recognition as a run and an embrace, then the lovers holding each other a long time; the bed itself is a rooted object that cannot move.

**The take**: cast penelope, odysseus, eurycleia; 5 keys, 7 shots; rough-pass density (after) 0.521, longest still 3.75 s.

**Essential variables**: anger that turns into exact description (gestures describe the trunk, the frame, the drilling); recognition: stillness, knees giving, then a run into an embrace (two bodies coupled); a long held embrace that stays alive (weeping, rocking); the olive-trunk bed as an immovable set piece (insert, flashback)

Dramatic chain:

- 0.6 s: Penelope, calm, orders Eurycleia to carry the bed out of the chamber for him -> Odysseus hears his bed has been moved
- 5.8 s: Odysseus erupts: who moved my bed? He built it round a living olive; its trunk is the post -> the sign only the two of them know
- 19.0 s: the secret proves him -> her knees give, her heart melts
- 24.6 s: Penelope runs to him, throws her arms round his neck, kisses him -> embrace
- 30.3 s: she explains: she feared a stranger with a smooth story -> he weeps holding her
- 35.2 s: Athena holds back the dawn while they weep and reunite -> the long night

Lines (speech act, affect, body):

- gi2 0.6 s penelope -> eurycleia: COMMAND (a test), guarded, GESTURE:open [engine]. "carry the great bed out of the bridal chamber"
- gi7 30.3 s penelope -> odysseus: EXPLAIN, recognition, EMBRACE [clip]. "Do not be angry with me... as dry land to swimmers"

Intents: GUARDED_WELCOME penelope 0.6-5.0 [engine]; REACT:startle odysseus 5.5-6.5 [engine]; GESTURE:point(accuse) odysseus > penelope 5.8-19.0 [engine]; GESTURE:describe(describe) odysseus 7.0-18.0 (hands build the bed: trunk, frame, drill) [engine]; RECOGNISE penelope 19.0-24.0 [missing]; LOCOMOTE(run) penelope > odysseus 24.6-26.5 [missing]; EMBRACE penelope > odysseus 26.5-45.5 [clip]; WEEP odysseus 30.0-45.5 [clip]; WEEP penelope 26.5-45.5 [clip]

Relations: CONTACT penelope>odysseus 26.5 (arms round his neck)

Machinery: BED: the olive bed: rooted, immovable; a lamp-lit insert; LAMP: lamp light held low; dawn held back (light that does not change)

Contacts and handoffs: 26.5 s embrace: two bodies coupled until the end

Holds: penelope 19.0-24.0: recognition lands: knees go, stillness before the run; both 35.2-45.5: the long embrace under the held dawn (weeping, never frozen)

### OD-B04-S04 The Wooden Horse

**Type** dialogue. **Total** 47.72 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A told scene staged as a memory: men crushed inside a dark horse, a voice outside imitating their wives, the urge to answer, one man's mouth held shut by Odysseus; plus the listeners at Menelaus' table (Telemachus, Helen).

**The take**: cast odysseus, helen-at-the-horse, hidden-greek-warriors-1, hidden-greek-warriors-2, hidden-greek-warriors-3, hidden-greek-warriors-4, hidden-greek-warriors-5; 4 keys, 5 shots; not in the take's cast: anticlus, hidden-greeks, menelaus, telemachus; rough-pass density (after) 0.518, longest still 4.667 s.

**Essential variables**: two frames: the telling table and the remembered horse (layered time); crouched bodies packed in a small volume, still and tense (not dead); the urge to answer: a lean and a breath in, checked; a hand over another's mouth held for seconds (contact hold); Helen circling outside, patting the horse (a walk round an object)

Dramatic chain:

- 0.6 s: Menelaus answers Helen: hear the horse's tale from within -> the telling
- 19.4 s: Helen circles the horse three times, patting it, calling each chief in his wife's voice -> the men inside ache to answer
- 28.2 s: the hidden Greeks nearly answer; Diomedes and Menelaus start up -> Odysseus holds them
- 33.6 s: Odysseus holds them back; Anticlus alone would speak; Odysseus clamps his hands on his mouth -> silence until Athena leads Helen away
- 39.7 s: Telemachus hears the proof of his father's endurance -> grief and pride at the table

Lines (speech act, affect, body):

- gi2 0.6 s menelaus -> helen: REPLY (recount), irony, GESTURE:open [engine]. "True, wife, yet you tell only half"

Intents: POSTURE(crouch) hidden-greeks 0.0-47.7 (inside the horse) [missing]; CIRCLE helen > horse 19.4-28.0 (three times, patting) [missing]; GESTURE:open(mimic) helen 20.0-28.0 (another's voice) [engine]; REACT:lean(lean_in) hidden-greeks > voice 28.2-30.0 [engine]; HOLD_BACK(restrain) odysseus > diomedes 30.0-33.6 [engine]; HOLD_BACK(cover_mouth) odysseus > anticlus 33.6-40.0 [engine]; STRUGGLE anticlus 33.6-37.0 [missing]; LISTEN telemachus > menelaus 0.6-47.7 [engine]; REACT:nod telemachus 40.0-42.0 [engine]

Relations: THREAT helen>hidden-greeks 19.4 (the lure); BLOCK odysseus>diomedes 30.0 (hand on the chest); CONTACT odysseus>anticlus 33.6 (hands over the mouth); RECOVER anticlus>odysseus 38.0 (gives up)

Machinery: HORSE: the wooden horse: an enclosure with men inside, dark; opened in the keys (horseOpen); MEMORY_FRAME: the table in the present, the horse in the past: two sets cut together

Contacts and handoffs: 20.0 s helen pats the horse; 33.6 s odysseus' hands on anticlus' mouth until Athena takes Helen away [owner odysseus]

Holds: hidden-greeks 0.0-28.0: packed stillness inside the horse: tense breath (Sn: faces barely lit, frozen listeners); odysseus 33.6-40.0: the hand over the mouth held

### OD-B04-S05 Menelaus Wrestles Proteus

**Type** fight. **Total** 30.14 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: An ambush from under sealskins and a grapple with a shape-changer: the held body becomes a lion, a serpent, water, a tree, while the men's hands stay constant; then the defeated god speaks.

**The take**: cast menelaus, proteus, eidothea, three-men-1, three-men-2, three-men-3; 3 keys, 8 shots; rough-pass density (after) 0.74, longest still 2.583 s.

**Essential variables**: grapple: four men on one body, holds kept through the changes; replacement on twos: the held body swapped for beasts, water, a tree (hands constant); the ambush: men lying hidden under skins among seals, then springing; the telling frame (Telemachus asks at the table)

Dramatic chain:

- 0.0 s: (cut) Telemachus asks for news of his father; Menelaus begins the tale of Pharos -> the telling
- 0.6 s: Menelaus and three men lie under sealskins among the seals; Proteus counts his seals and lies down -> they spring and seize him
- 10.6 s: Proteus becomes a lion, a serpent, a leopard, a boar, water, a tree; they hold on -> he tires and yields
- 20.4 s: Proteus, himself again, tells that Odysseus lives, held by Calypso -> Telemachus' hope

Intents: HIDE menelaus 0.6-5.0 (under a sealskin) [engine]; ATTEND(count) proteus > seals 2.0-5.0 [engine]; POSTURE(lie_down) proteus 4.5-5.5 [missing]; SEIZE(ambush) menelaus > proteus 5.5-6.5 [missing]; GRAPPLE menelaus > proteus 6.5-20.0 [missing]; GRAPPLE men > proteus 6.5-20.0 [missing]; TRANSFORM proteus 10.6-19.0 (lion, serpent, leopard, boar, water, tree) [missing]; STRUGGLE proteus 6.5-19.0 [missing]; POSTURE(yield) proteus 19.0-20.4 [missing]; GESTURE:open(prophesy) proteus 20.4-30.0 [engine]

Relations: ATTACK menelaus>proteus 5.5 (ambush); CONTACT men>proteus 6.5 (four holds); EVADE proteus>men 10.6 (by changing); BLOCK men>proteus 11.0 (hold kept); RECOVER proteus>men 19.0 (yields)

Machinery: TRANSFORM: the held body replaced on twos (lion, snake, water column, tree), the grips constant; SEALSKIN: cloth props covering lying men; QUADRUPEDS: seals lying and flopping on the beach

Contacts and handoffs: 6.5 s four men grip proteus (arms, legs, neck) [owner the men]

Holds: menelaus 0.6-5.5: hidden under the skin, the stench endured: still, breath only

### OD-B16-S03 The Father Reveals Himself

**Type** recognition. **Total** 42.61 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A body transformed off-screen and re-entering changed (beggar -> king: costume swap with the same actor), a son recoiling in terror, a declaration, a refusal, then an embrace with the force of birds robbed of their young.

**The take**: cast odysseus-restored, telemachus; 5 keys, 7 shots; staged only as a set piece: athena; rough-pass density (after) 0.516, longest still 2.5 s.

**Essential variables**: the costume/figure swap for one actor id across a cut (odysseus-as-beggar -> odysseus-restored); fear: recoil and averted eyes held (not doubt: terror); the embrace as a crash of two bodies with sustained weeping; Athena at the threshold (a goddess only Odysseus sees)

Dramatic chain:

- 0.6 s: outside the hut Athena touches Odysseus with her wand: strength, clothes, skin, dark hair restored -> he re-enters changed
- 11.1 s: he re-enters transformed -> Telemachus sees a god
- 17.1 s: Telemachus recoils, eyes averted, offers sacrifice -> Odysseus must say who he is
- 24.1 s: Odysseus: I am no god; I am your father -> Telemachus refuses: a god mocking his grief
- 29.9 s: Telemachus: you are not my father -> Odysseus tells him it is Athena's doing
- 34.0 s: they embrace and weep like birds robbed of their young -> the reunion

Lines (speech act, affect, body):

- gi5 24.1 s odysseus -> telemachus: DECLARE, tenderness, GESTURE:chest [engine]. "I am no god... I am your father"
- gi7 29.9 s telemachus -> odysseus: REFUSE, fear, GESTURE:recoil [engine]. "You are not my father"

Intents: BECKON athena > odysseus 0.6-3.0 [engine]; STRIKE(strike_wand) athena > odysseus 3.0-5.0 [clip]; TRANSFORM odysseus 5.0-10.0 (beggar -> restored, the same actor) [missing]; ARRIVE odysseus 11.1-14.0 [engine]; RECOIL telemachus 17.1-20.0 [engine]; TURN_AWAY(avert) telemachus > odysseus 18.0-29.0 [missing]; APPROACH odysseus > telemachus 24.0-27.0 [engine]; RECOGNISE telemachus 32.0-34.0 [missing]; EMBRACE odysseus > telemachus 34.0-42.6 [clip]; WEEP telemachus 34.0-42.6 [clip]; WEEP odysseus 34.0-42.6 [clip]

Relations: SEPARATION telemachus>odysseus 17.1 (recoil to the wall); CONTACT odysseus>telemachus 34.0 (embrace)

Machinery: TRANSFORM: costume and figure swap of one actor (beggar -> restored); WAND: Athena's golden wand touch

Contacts and handoffs: 3.5 s athena's wand on odysseus; 34.0 s embrace until the end

Holds: telemachus 18.0-24.0: terror: frozen, eyes averted (Ic: close held long)

### OD-B19-S04 Eurycleia Finds the Scar

**Type** recognition. **Total** 45.11 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A foot-washing by an old nurse: the basin, the hands on the leg, the scar under the fingers, the foot dropped and the basin tipped, then a grip at the throat to swear her silence while Penelope must not see.

**The take**: cast eurycleia, odysseus-as-beggar, penelope; 4 keys, 11 shots; rough-pass density (after) 0.382, longest still 3.083 s.

**Essential variables**: hand-on-body contact (washing the foot and shin) that must stay on the surface; the basin tipping and water spilling (prop physics); the throat grip: firm but gentle, held through a whispered oath; Penelope in the room kept unaware (attention turned away by Athena)

Dramatic chain:

- 0.6 s: Penelope bids Eurycleia wash the stranger's feet: his hands and feet must be like Odysseus' now -> the nurse fetches the basin
- 18.2 s: Odysseus turns from the fire: the scar will give him away, but he cannot refuse -> he sits into the dark
- 22.0 s: (cut) she washes the leg, her hand finds the boar scar, she knows him -> she drops the foot
- 26.5 s: the foot drops into the basin, it tips, the water spills; she reaches toward Penelope -> Odysseus stops her
- 35.9 s: he grips her throat and makes her swear silence -> she swears

Lines (speech act, affect, body):

- gi2 0.6 s penelope -> eurycleia: COMMAND, weariness, GESTURE:open [engine]. "wash the feet of your master's age-mate"

Intents: CARRY(fetch) eurycleia > basin 17.0-20.0 [engine]; SET_DOWN eurycleia 20.0-21.0 [engine]; TURN_AWAY odysseus > fire 18.2-21.0 [missing]; POSTURE(sit) odysseus 20.0-22.0 [missing]; TEND(wash) eurycleia > foot 21.0-25.0 [missing]; RECOGNISE eurycleia 25.0-26.5 [missing]; SET_DOWN(drop) eurycleia > foot 26.5-27.0 [engine]; GESTURE:reach(reach) eurycleia > penelope 27.5-30.0 [engine]; SEIZE odysseus > eurycleia 30.0-31.0 (throat) [missing]; GESTURE:oath(swear) eurycleia 36.0-45.0 [engine]

Relations: CONTACT eurycleia>odysseus 21.0 (hands on the shin); IMPACT foot>basin 26.8 (tips); BLOCK odysseus>eurycleia 30.0 (stops the reach); CONTACT odysseus>eurycleia 31.0 (hand at the throat)

Machinery: BASIN: bronze basin with water: set down, tipped, spilled; FIRE: hearth light he turns from

Contacts and handoffs: 21.0 s eurycleia holds odysseus' foot [owner eurycleia]; 26.5 s foot dropped into the basin [owner none]; 31.0 s odysseus' right hand on her throat, left draws her close

Holds: eurycleia 25.0-26.5: the recognition under her fingers; penelope 25.0-45.0: Athena turns her mind away: she looks elsewhere (a held look, not dead)

### OD-B14-S01 The Dogs at Eumaeus's Yard

**Type** fight. **Total** 25.18 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: Four dogs rush a sitting beggar, a swineherd runs out throwing stones to scatter them, then turns to hospitality: pursuit by quadrupeds, a defensive sit, thrown stones, and the switch to welcome in 25 s.

**The take**: cast odysseus-as-beggar, eumaeus; 3 keys, 3 shots; staged only as a set piece: dogs; rough-pass density (after) 0.579, longest still 3 s.

**Essential variables**: dogs as pursuers with a rush path and a stop distance; the defensive drop: staff let fall, the man sits; stones thrown (small ballistic props) and the dogs scattering; the switch from protection to welcome

Dramatic chain:

- 0.6 s: the disguised Odysseus comes up the path to the farm -> the dogs see him
- 3.0 s: (cut) four dogs rush him barking; he drops his staff and sits -> they stop short
- 7.6 s: Eumaeus runs out, shouting, scatters the dogs with stones, leads him in -> the stranger is safe
- 16.6 s: Eumaeus gives him his own seat of brushwood and a skin, prepares two piglets -> hospitality

Intents: APPROACH odysseus > gate 0.6-3.0 [engine]; PURSUE(charge) dogs > odysseus 3.0-6.0 [missing]; SET_DOWN(drop_item) odysseus > staff 3.5-4.0 [engine]; POSTURE(sit) odysseus 4.0-5.0 (to avoid attack) [missing]; LOCOMOTE(run) eumaeus > dogs 7.6-9.0 [missing]; THROW eumaeus > dogs 9.0-11.0 (stones) [missing]; FLEE dogs 10.0-12.0 [missing]; WELCOME eumaeus > odysseus 12.0-16.0 [engine]; LEAD eumaeus 13.0-16.6 [engine]; OFFER eumaeus > odysseus 16.6-19.0 (his own seat) [engine]; SACRIFICE(butcher) eumaeus > piglets 19.0-25.0 [missing]

Relations: PURSUIT dogs>odysseus 3.0; THREAT dogs>odysseus 4.5 (at the stop distance); EVADE odysseus>dogs 4.0 (sits: submission); ATTACK eumaeus>dogs 9.0 (stones); SEPARATION dogs>odysseus 11.0

Machinery: QUADRUPEDS: four dogs: run, bark, stop, scatter; STONES: small thrown props

Contacts and handoffs: 3.5 s staff dropped [owner none]; 9.0 s stones from eumaeus' hand [owner none]; 13.0 s eumaeus takes the stranger's arm; 17.0 s brushwood seat and goatskin given [owner odysseus]

Holds: odysseus 4.0-7.6: sitting still to avoid the dogs (a chosen stillness)

### OD-B12-S06 The Cattle Are Slaughtered

**Type** labour. **Total** 38.19 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: Persuasion of a crowd, then the sacrifice with substitutes (oak leaves for barley, water for wine), the slaughter and roasting, and an omen: the hides crawl and the meat bellows on the spits.

**The take**: cast eurylochus, sleeping-odysseus, crew-sacrificial-group-1, crew-sacrificial-group-2, crew-sacrificial-group-3, crew-sacrificial-group-4, crew-sacrificial-group-5; 4 keys, 15 shots; rough-pass density (after) 0.585, longest still 2.917 s.

**Essential variables**: a persuader working a crowd (turning heads, the crowd yielding); slaughter and butchery kept offscreen-ish but the labour on screen; spits turning over a fire (a row, regular); the omen: a hide crawling (a prop moving by itself), the meat bellowing (sound)

Dramatic chain:

- 0.0 s: (cut) food gone; Odysseus goes inland to pray and sleeps -> the crew alone
- 0.6 s: Eurylochus persuades them: every death is hateful, but hunger is the worst -> they drive in the best cattle
- 10.0 s: they sacrifice with oak leaves for barley, water for wine, kill, butcher, roast -> the meat on the spits
- 22.7 s: the hides crawl, the meat bellows on the spits -> dread, but they eat
- 30.0 s: Lampetie tells Helios, who demands Zeus punish them -> the next scene's bolt

Intents: GESTURE:open(persuade) eurylochus > crew 0.6-10.0 [engine]; REACT:nod crew 6.0-9.0 [engine]; HERD crew > cattle 9.0-11.0 [missing]; SACRIFICE eurylochus > cattle 10.0-14.0 [missing]; POUR eurylochus 12.0-13.0 (water for wine) [engine]; SACRIFICE(butcher) crew 14.0-18.0 [missing]; TOOL_WORK(roast) crew > spits 18.0-30.0 (turning) [missing]; REACT:startle crew 23.0-24.5 [engine]; EAT crew 26.0-38.0 [missing]

Machinery: SPITS: a row of spits turning over a fire; FIRE: cooking fire, smoke; QUADRUPEDS: cattle driven in; PROP_STATE: the hides crawling (an omen: a prop moves)

Contacts and handoffs: 12.0 s oak leaves and water in place of barley and wine; 18.0 s meat onto the spits

Holds: crew 24.0-26.0: dread at the omen before they eat

### OD-B05-S04 Building the Raft

**Type** labour. **Total** 61.91 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: Four days of carpentry in 62 s as quotidian held mediums: felling, trimming, boring, joining, decking, rigging; the raft is a prop built in stages (Mk: booklet steps); the script's action lines name Calypso as the builder (a script error: Odysseus builds).

**The take**: cast odysseus, calypso; 4 keys, 6 shots; rough-pass density (after) 0.676, longest still 3.167 s.

**Essential variables**: tool actions with contact (axe, adze, auger) on timbers; the raft as one prop in stages; a supplier who gives and withdraws (Calypso: axe, adze, cloth, cord); long holds of work that must not read as dead

Dramatic chain:

- 0.6 s: Calypso leads him to the tall trees, gives axe, adze, cloth and cord -> he begins
- 28.4 s: he fells twenty trees, trims, bores, joins and decks them (four days) -> the raft grows
- 40.7 s: he rigs mast, yard, sail, steering oar and ballast -> the raft is ready
- 49.9 s: Calypso bathes and clothes him, loads food and water, sends a warm wind -> he sails (the next scene)

Lines (speech act, affect, body):

- gi2 0.6 s calypso -> odysseus: DECLARE (give), tenderness, OFFER [engine]. "Take the great bronze axe and the adze..."

Intents: LEAD calypso > odysseus 0.6-8.0 [engine]; OFFER calypso > odysseus 10.0-26.0 (axe, adze, cloth, cord) [engine]; TAKE odysseus 11.0-27.0 [engine]; TOOL_WORK(chop) odysseus > trees 28.4-32.0 [missing]; TOOL_WORK(carve) odysseus > timbers 32.0-35.0 (adze) [missing]; TOOL_WORK(bore) odysseus > timbers 35.0-37.0 [missing]; TOOL_WORK(hammer) odysseus > pegs 37.0-40.0 [missing]; HAUL(hoist) odysseus > mast 40.7-45.0 [missing]; ROPE_WORK(rig) odysseus > sail 45.0-49.9 [missing]; TEND(dress) calypso > odysseus 50.0-54.0 [missing]; CARRY calypso > provisions 54.0-58.0 [engine]

Machinery: RAFT: built in stages (logs, deck, rail, mast, sail); TOOLS: axe, adze, auger, mallet: contact on the timber; SAIL: rigged at the end, filling with the warm wind

Contacts and handoffs: 11.0 s axe calypso -> odysseus [owner odysseus]; 20.0 s adze calypso -> odysseus [owner odysseus]; 26.0 s cloth and cord [owner odysseus]; 54.0 s provisions loaded [owner raft]

Holds: odysseus 28.4-49.9: long quotidian holds (7 s) of work: the labour itself is the motion, never a freeze

### OD-B01-S01 The Gods Consider Odysseus

**Type** dialogue. **Total** 71.22 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A council of seated gods with three long speeches; the ring must listen and turn from Zeus to Athena; Athena petitions (not commands); an empty throne is the most important object.

**The take**: cast zeus, athena, assembly-of-gods-1, assembly-of-gods-2, assembly-of-gods-3, assembly-of-gods-4, assembly-of-gods-5; 3 keys, 10 shots; rough-pass density (after) 0.383, longest still 3.083 s.

**Essential variables**: group attention shifts (ring of listeners) on the speaker change; appeal vs command: petition gesture vocabulary; seated speakers who rise inside the order (Mi); the empty throne as a held insert

Dramatic chain:

- 0.6 s: the gods take their places in a ring; Poseidon's seat is empty -> the council opens without him
- 4.0 s: (cut) Zeus on Aegisthus: mortals blame the gods -> Athena seizes the turn
- 12.8 s: Athena: it is Odysseus my heart breaks for, held on Calypso's island -> Zeus answers
- 40.7 s: Zeus: how could I forget him; Poseidon rages; let us shape his return -> the plan (next scene)

Lines (speech act, affect, body):

- gi5 12.8 s athena -> zeus: PETITION, appeal, GESTURE:plead [engine]. "Father Zeus... it is Odysseus my heart breaks for"
- gi6 40.7 s zeus -> athena: DECLARE, command, GESTURE:open [engine]. "My child, how could I forget godlike Odysseus?"

Intents: POSTURE(sit) gods 0.6-4.0 (take their places) [missing]; ATTEND gods > zeus 4.0-12.8 [engine]; RISE athena 12.0-13.5 [engine]; ATTEND gods > athena 13.0-40.0 [engine]; NOTICE gods > empty-throne 3.0-5.0 [engine]; ATTEND gods > zeus 41.0-71.0 [engine]; REACT:nod athena 60.0-62.0 [engine]

Machinery: SEATED_CROWD: a ring of thrones; the empty one kept empty

Holds: empty-throne 3.0-6.0: the absence as an insert (Dm); athena 38.0-40.5: held two beats after her key line (Ic push)

### OD-B10-S01 Aeolus and the Bag of Winds

**Type** dialogue. **Total** 31.53 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A gift (the bag) made fast under the deck, nine days at sea, sleep at the helm, the crew opening the bag, a blast of winds that spins the ship back; then the host's horrified refusal. Most of the action is cut from the voice.

**The take**: cast aeolus, odysseus; 2 keys, 6 shots; rough-pass density (after) 0.846, longest still 0.75 s.

**Essential variables**: the bag as a charged prop (silver wire, lashed under the deck); the crew's hands on the cord (pose-to-pose, Sy); sleep at the helm (a head that drops); a ship spun by a blast (time-lapse, Ga); refusal: the host's dismissal gesture

Dramatic chain:

- 0.6 s: Aeolus gives the oxhide bag, silver-wired, and looses only the West Wind -> the voyage home
- 8.0 s: (cut) nine days; Ithaca in sight; Odysseus falls asleep at the helm -> the crew open the bag
- 10.0 s: (cut) the winds burst out and blow them back to Aeolia -> they return disgraced
- 16.7 s: Aeolus: out of my island, worst of living men; the gods hate you -> expelled

Lines (speech act, affect, body):

- gi3 0.6 s aeolus -> odysseus: DECLARE (give), tenderness, OFFER [engine]. "Take this bag of oxhide..."
- gi6 16.7 s aeolus -> odysseus: REFUSE, confrontation, GESTURE:dismiss [engine]. "Out of my island, out, worst of living men"

Intents: OFFER aeolus > odysseus 1.0-4.0 (the bag) [engine]; TAKE odysseus 3.0-5.0 [engine]; SHAME odysseus 17.0-31.0 [engine]; RECOIL aeolus > odysseus 16.7-18.0 [engine]

Relations: SEPARATION aeolus>odysseus 17.0 (expelled)

Machinery: WIND_BAG: oxhide bag with silver wire: lashed, opened, bursting; SHIP: sailing, then spun back

Contacts and handoffs: 3.0 s bag aeolus -> odysseus [owner odysseus]

Holds: odysseus 17.0-31.0: shamed stillness under the refusal: head down

### OD-B13-S01 The Phaeacians Carry Odysseus Home

**Type** ritual. **Total** 43.99 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A silent hall after the tale, a command of gifts, the boarding at sunset, a sleeper on a stern bed while the ship runs, and the crew carrying him and his treasure ashore without waking him.

**The take**: cast odysseus, alcinous, arete, phaeacian-convoy-crew-1, phaeacian-convoy-crew-2, phaeacian-convoy-crew-3, phaeacian-convoy-crew-4, phaeacian-convoy-crew-5; 4 keys, 5 shots; not in the take's cast: phaeacians; rough-pass density (after) 0.778, longest still 6 s.

**Essential variables**: a silence held by a whole hall (group stillness that breathes); a sleeping body carried by several (limp, cradled); the ship running fast (hawk speed) under oars; treasure carried and set down (tripods, cauldrons)

Dramatic chain:

- 0.6 s: Odysseus finishes; the Phaeacians sit spellbound in silence -> Alcinous speaks
- 9.2 s: Alcinous: one more chest, a tripod and cauldron from every lord; feast; he sails at sundown -> the gifts
- 25.8 s: at sunset Odysseus boards and lies on the bed in the stern -> he sleeps
- 30.0 s: (cut) the ship runs faster than a hawk to Ithaca -> arrival before dawn
- 36.8 s: the crew lift the sleeper ashore with his treasure and leave -> he wakes alone (next scene)

Lines (speech act, affect, body):

- gi3 9.2 s alcinous -> lords: COMMAND, command, GESTURE:point [engine]. "Bring out one more chest..."

Intents: HOLD phaeacians 0.6-9.0 (spellbound silence) [engine]; CLIMB(board) odysseus > ship 25.8-28.0 [clip]; POSTURE(lie_down) odysseus 28.0-30.0 [missing]; HOLD(sleep) odysseus 30.0-44.0 [engine]; ROW crew 30.0-37.0 [clip]; CARRY crew > odysseus 36.8-42.0 (limp, on his bedding) [engine]; CARRY crew > treasure 38.0-43.0 [engine]; SET_DOWN crew 41.0-43.0 [engine]

Relations: SEPARATION ship>odysseus 43.0 (they leave him)

Machinery: SHIP: running fast, the stern bed; OARS: shared phase clock; TREASURE: tripods, cauldrons, a chest: carried and set down; SLEEPER: a limp body lifted by several hands

Contacts and handoffs: 37.0 s crew lift odysseus with his bedding [owner crew]; 41.0 s odysseus laid on the sand [owner the shore]; 42.0 s treasure set by the olive [owner the shore]

Holds: phaeacians 0.6-9.0: spellbound silence after the tale (Ma: listeners still, breathing); odysseus 30.0-44.0: asleep: breath only, carried limp

### OD-B11-S01 The Blood Pit Opens

**Type** ritual. **Total** 41.55 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A rite as repeated gesture (dig, pour three libations, cut sheep's throats over the pit), a crowd of shades of every age rising and pressing in, and a man holding them back with a drawn sword until the right one comes.

**The take**: cast odysseus, crew-ritual-assistants-1, crew-ritual-assistants-2, crew-ritual-assistants-3, crew-ritual-assistants-4, crew-ritual-assistants-5; 4 keys, 5 shots; staged only as a set piece: shades; rough-pass density (after) 0.923, longest still 2.667 s.

**Essential variables**: ritual steps as a repeated frontal gesture (Bg); a crowd of shades pressing toward a pit (crowd attraction with a barrier); the sword held out as a boundary (a held threat pose that keeps a crowd off); empty frames (As) before the rite

Dramatic chain:

- 0.6 s: the ship reaches the misty land of the Cimmerians -> they land
- 9.2 s: Odysseus digs a trench, pours libations, cuts the sheep's throats over it -> the blood runs
- 23.6 s: the dead gather in multitudes, crying round the blood -> they press in
- 32.3 s: Odysseus sits by the trench, sword drawn, keeping all back until Tiresias -> the wait

Intents: TOOL_WORK(dig) odysseus > trench 9.2-12.0 [missing]; POUR odysseus 12.0-16.0 (milk-honey, wine, water) [engine]; SACRIFICE odysseus > sheep 16.0-22.0 [missing]; ARM(draw_weapon) odysseus > sword 23.6-24.5 [missing]; CROWD(crowd_in) shades > pit 23.6-41.5 [missing]; GUARD(ward_off) odysseus > shades 25.0-41.5 [missing]; HOLD odysseus 32.3-41.5 (waiting for Tiresias) [engine]

Relations: THREAT odysseus>shades 25.0 (sword out); BLOCK odysseus>shades 26.0 (boundary at the trench); PURSUIT shades>pit 23.6 (drawn to the blood)

Machinery: TRENCH: a pit dug, filling with libations and blood; QUADRUPEDS: sheep led and killed; SHADES: a crowd of translucent figures rising and pressing (spawned)

Contacts and handoffs: 16.0 s sheep held over the trench [owner odysseus]

Holds: odysseus 32.3-41.5: guarding the blood: still, sword out, head tracking the shades

### OD-B24-S03 Odysseus Tests Laertes

**Type** recognition. **Total** None s. **Prepared**: nothing.

**Why it is hard**: Not in the Regulars' Cut (no cut clock): a son finding his father digging round a tree, a false tale that breaks the old man (he pours dust on his head), a declaration and a demand for proof. The two DIALOGUE recordings speak the summary, not the lines.

**Essential variables**: an old man at labour (digging round a vine) with slow weight; grief: dust poured over the head (a two-hand gesture with a prop: dust); the son breaking the test (rushes, embraces); recordings too short for the lines

Dramatic chain:

- gi1 s: Odysseus finds Laertes alone in patched clothes, digging round a tree -> he decides to test him
- gi2 s: he sends the companions to prepare food -> alone with his father
- gi3 s: he claims to have hosted Odysseus years ago; Laertes pours dust on his head and groans -> the son breaks
- gi5 s: Odysseus: I am the man you are grieving -> Laertes demands a sign
- gi7 s: Laertes: give me a sign I cannot argue with -> the scar and the trees (next scene)

Lines (speech act, affect, body):

- gi5 gi5 s odysseus -> laertes: DECLARE, tenderness, EMBRACE [clip]. "Father, put down the dust. I am the man you are grieving."
- gi7 gi7 s laertes -> odysseus: QUESTION, skepticism, GESTURE:recoil [engine]. "give me a sign I cannot argue with"

Intents: TOOL_WORK(dig) laertes > tree gi1-gi2 [missing]; GESTURE:dismiss odysseus gi2-gi2 (sends the companions) [engine]; APPROACH odysseus > laertes gi2-gi3 [engine]; WEEP(grief) laertes gi3-gi5 (dust on the head) [clip]; EMBRACE odysseus > laertes gi5-gi5 [clip]; RECOIL laertes gi7-gi7 [engine]

Relations: CONTACT odysseus>laertes gi5 (the embrace, refused)

Machinery: PROP_STATE: dust handfuls poured over the head

Contacts and handoffs: gi3 s laertes scoops dust; gi5 s odysseus holds him

### OD-B06-S03 The Naked Stranger Emerges

**Type** dialogue. **Total** 43.09 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A wild man emerging from bushes with a branch over his nakedness, maids scattering, one girl standing her ground; distance kept on purpose (he does not touch her knees); much of the action is cut from the voice.

**The take**: cast odysseus, nausicaa, nausicaa-s-maids-1, nausicaa-s-maids-2, nausicaa-s-maids-3, nausicaa-s-maids-4, nausicaa-s-maids-5; 2 keys, 20 shots; rough-pass density (after) 0.867, longest still 3.667 s.

**Essential variables**: the branch as a held cover prop (two hands low); maids fleeing in a scatter (group flight); deliberate distance kept (proxemics as intent); the plea without contact (supplication at a distance)

Dramatic chain:

- 0.6 s: Odysseus debates clasping her knees or speaking from afar -> he breaks a leafy branch
- 3.0 s: (cut) he emerges like a mountain lion; the maids flee; Athena keeps Nausicaa steady -> she stands alone
- 5.0 s: (cut) he pleads from a distance: goddess or mortal? -> she answers
- 9.9 s: Nausicaa: you shall lack nothing; stand, girls, this man is no enemy -> the maids return

Lines (speech act, affect, body):

- gi7 9.9 s nausicaa -> odysseus: REPLY (welcome), tenderness, WELCOME [engine]. "Stranger, you seem neither base nor witless..."

Intents: DECIDE odysseus 0.6-3.0 [engine]; TAKE(break_branch) odysseus 2.0-3.0 [engine]; ARRIVE(emerge) odysseus 3.0-5.0 [engine]; FLEE maids 3.5-6.0 [missing]; HOLD nausicaa 3.5-9.9 (stands her ground) [engine]; GESTURE:plead(plead) odysseus > nausicaa 5.0-9.9 (at a distance) [engine]; WELCOME nausicaa > odysseus 9.9-20.0 [engine]; BECKON nausicaa > maids 30.0-34.0 [engine]; APPROACH(return) maids 34.0-43.0 [engine]

Relations: THREAT odysseus>maids 3.0 (read as a lion); SEPARATION maids>odysseus 3.5; SEPARATION odysseus>nausicaa 5.0 (kept on purpose)

Machinery: BRANCH: a leafy branch held as cover

Contacts and handoffs: 2.5 s odysseus breaks off a branch [owner odysseus]

Holds: nausicaa 3.5-9.9: steadied by Athena: she holds her ground (not frozen: breath, eyes on him)

### OD-B08-S05 The Trojan Horse Song and the Name

**Type** revelation. **Total** 56.47 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: A singer and a listener: the song carried by the voice, the listener breaking into tears under his cloak, a host who notices and stops the lyre; weeping as the main action for long stretches.

**The take**: cast odysseus, demodocus, alcinous; 2 keys, 13 shots; not in the take's cast: phaeacians; rough-pass density (after) 0.368, longest still 2 s.

**Essential variables**: weeping hidden under a cloak (cloak over the head, one eye); the lyre played (string hand, the song's beat); the host noticing the guest (NOTICE, then speech); a hall that listens (seated group)

Dramatic chain:

- 0.0 s: (cut) Odysseus honours Demodocus with meat and asks for the horse song -> the singer begins
- 0.6 s: Demodocus sings the Greeks' emergence, the sack, Odysseus at Deiphobus' house -> Odysseus melts
- 10.9 s: Odysseus weeps like a woman over her fallen husband, cloak over his head -> Alcinous notices
- 18.9 s: Alcinous stops the lyre and asks the stranger's name, land, and why he weeps -> he must answer
- 49.8 s: Odysseus gathers himself to tell his wanderings -> Book 9

Lines (speech act, affect, body):

- gi6 18.9 s alcinous -> odysseus: QUESTION, concern, GESTURE:open [engine]. "Stop the lyre, Demodocus... tell me the name"

Intents: PLAY_INSTRUMENT(play_lyre) demodocus 0.6-18.9 [missing]; SING demodocus 0.6-18.9 [engine]; LISTEN phaeacians > demodocus 0.6-18.9 [engine]; WEEP odysseus 10.9-49.8 [clip]; WEEP(cover_face) odysseus 11.0-18.9 (cloak over the head) [clip]; NOTICE alcinous > odysseus 15.0-17.0 [engine]; GESTURE:chop alcinous > demodocus 19.0-20.0 (stop) [engine]; ATTEND phaeacians > odysseus 20.0-49.8 [engine]; RISE odysseus 49.8-53.0 [engine]; DECIDE odysseus 52.0-56.0 [engine]

Machinery: LYRE: plucked on the song's beat, stopped at 19 s; CLOAK: drawn over the head; lowered at 49 s; SEATED_CROWD: the feasting hall

Contacts and handoffs: 11.0 s cloak drawn over the head; 49.8 s cloak lowered

Holds: odysseus 11.0-18.9: hidden weeping: the cloak still, the shoulders shaking (Ic)

### OD-B02-S02 The Secret of Penelope's Loom

**Type** dialogue. **Total** 59.98 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: An assembly speech by one accuser against a young man with a staff; the loom story told as inserts (web full, unpicked by torchlight, full again, a maid in the doorway) that the rough pass cannot stage as the same frame three times.

**The take**: cast antinous, telemachus, penelope-at-the-loom, melantho, four-suitors-1, four-suitors-2, four-suitors-3, four-suitors-4; 3 keys, 17 shots; not in the take's cast: assembly; rough-pass density (after) 0.63, longest still 3.167 s.

**Essential variables**: a hostile speech with a crowd split behind each side (Bi); the loom as a prop with states (woven, unpicked) and a torch; Telemachus with the herald's staff (held, the speaker's right); the maid's betrayal as an insert

Dramatic chain:

- 0.6 s: Antinous rounds on Telemachus: the fault is your mother's -> the assembly listens
- 21.6 s: he tells of the web: woven by day, unpicked by torchlight, three years -> the trick
- 45.0 s: (cut) a maid betrayed it; they caught her at the loom and forced the web to its end -> the demand
- 50.4 s: send her back to her father Icarius and let her marry -> Telemachus must answer

Lines (speech act, affect, body):

- gi2 0.6 s antinous -> telemachus: REFUSE (accuse), contempt, GESTURE:point [engine]. "do not lay your blame at our door"
- gi3 21.6 s antinous -> telemachus: RECOUNT, irony, GESTURE:open [engine]. "She set up her great loom..."
- gi5 50.4 s antinous -> telemachus: DEMAND, contempt, GESTURE:dismiss [engine]. "Send her back to her father Icarius"

Intents: HOLD telemachus 0.6-60.0 (the staff held, jaw set) [engine]; ATTEND assembly > antinous 0.6-60.0 [engine]; WEAVE penelope 22.0-35.0 (insert) [clip]; WEAVE(unravel) penelope 30.0-40.0 (insert, by torchlight) [clip]; REACT:nod suitors 40.0-45.0 [engine]; SHAME telemachus 50.4-60.0 [engine]

Relations: THREAT antinous>telemachus 0.6 (verbal)

Machinery: LOOM: the web with states: full, unpicked, full; the torch beside it; STAFF: the herald's staff in Telemachus' hand

Holds: loom 22.0-45.0: three matched overhead frames of the loom (Mk)

### OD-B17-S03 Argos Recognizes His Master

**Type** recognition. **Total** 31.94 s. **Prepared**: marks, sheet, cameras, rig, previz.

**Why it is hard**: The actor is a dying dog on a dung heap: lift of the head, ears dropping, the tail moving, then death; the man turns aside to hide a tear. Almost no motion, all of it meaningful.

**The take**: cast odysseus-as-beggar, eumaeus; 3 keys, 5 shots; staged only as a set piece: argos; rough-pass density (after) 0.644, longest still 2.417 s.

**Essential variables**: a quadruped with head, ears and tail channels (no dog rig); death as a chosen stillness after recognition (a HOLD with reason: dead); the tear hidden by turning aside; Eumaeus answering about the dog

Dramatic chain:

- 0.6 s: near the palace Odysseus sees Argos lying neglected on the dung -> the dog knows him
- 5.0 s: (cut) Argos lifts his head, drops his ears, wags his tail -> Odysseus cannot go to him
- 10.9 s: Odysseus turns aside and wipes a tear, asks Eumaeus about the dog -> Eumaeus tells of the dog's glory
- 19.9 s: after twenty years Argos dies, having seen his master -> they go in

Intents: NOTICE odysseus > argos 0.6-3.0 [engine]; ANIMAL:lift-head(lift_head) argos 5.0-7.0 [missing]; ANIMAL:wag(wag) argos 6.0-12.0 [missing]; TURN_AWAY odysseus 10.9-13.0 [missing]; WEEP(wipe_tear) odysseus 12.0-14.0 [clip]; GESTURE:open(ask) odysseus > eumaeus 14.0-18.0 [engine]; DIE argos 19.9-23.0 [missing]

Machinery: QUADRUPEDS: Argos: head, ears, tail; a death

Contacts and handoffs: 12.0 s hand to the eye

Holds: argos 23.0-31.9: dead: a chosen stillness (breath off); odysseus 13.0-19.0: turned aside (Op): no move

### OD-B24-S05 Laertes Is Restored

**Type** ritual. **Total** None s. **Prepared**: nothing.

**Why it is hard**: Not in the Regulars' Cut (no cut clock): a bath and anointing, a goddess making an old man taller, servants returning from the fields in recognition, a feast. Narration only.

**Essential variables**: a transformation of stature (scale up) on one actor; a group entering and recognising (Dolius and sons); a feast (seated eating)

Dramatic chain:

- gi1 s: Laertes is bathed and anointed -> Athena restores him
- gi2 s: Athena makes him taller and stronger -> Odysseus marvels
- gi3 s: Dolius and his sons come from the fields, recognise Odysseus, take his hands -> they join the feast
- gi4 s: the household eats while rumour of the massacre spreads -> the town rises (next scene)

Intents: TEND(bathe) servant > laertes gi1-gi1 [missing]; TRANSFORM laertes gi2-gi2 (taller) [missing]; ARRIVE dolius gi3-gi3 [engine]; RECOGNISE dolius > odysseus gi3-gi3 [missing]; TAKE dolius > odysseus gi3-gi3 (his hands, kissed) [engine]; EAT household gi4-gi4 [missing]

Machinery: TRANSFORM: scale of one actor up (stature)

Contacts and handoffs: gi3 s dolius takes odysseus' hands

### OD-B01-S02 Athena's Two-Part Plan

**Type** dialogue. **Total** 50.3 s. **Prepared**: nothing. Not prepared: the film player (film-readymades/production/Film-Butter-Odyssey.html.gz) has no location for this scene (no staged set, no keyframe file), so the take cannot be probed; it needs staging (odyssey/keyframes/<scene>.json and a rebuild of the player) first.

**Why it is hard**: Not in the film: no location to probe. Two errands assigned in speech, then Athena fastens her golden sandals, takes the spear and drops from Olympus.

**Essential variables**: assignment gestures toward two absent destinations (vector); fastening sandals (a seated two-hand action on the feet); the spear taken; a drop/descent

Dramatic chain:

- 0.6 s: Athena: send Hermes to Calypso with the decree -> Hermes lifts his wand
- 18.5 s: Athena: I go to Ithaca to rouse the son -> the plan
- 39.2 s: Athena fastens her gold sandals, takes her spear, drops from Olympus -> the Gate (B01-S03)

Lines (speech act, affect, body):

- gi2 0.6 s athena -> zeus: PROPOSE, resolve, GESTURE:point [engine]. "Then send Hermes... to Ogygia"
- gi3 18.5 s athena -> zeus: DECLARE, resolve, GESTURE:chest [engine]. "And I go to Ithaca myself"

Intents: POSTURE(sit) athena 39.2-40.0 [missing]; TEND(fasten) athena > sandals 40.0-44.0 [missing]; TAKE athena > spear 44.0-45.5 [engine]; LEAVE(depart) athena 46.0-50.3 (drops from Olympus) [missing]; RISE hermes 12.0-14.0 [engine]

Contacts and handoffs: 44.5 s spear to athena's hand [owner athena]

