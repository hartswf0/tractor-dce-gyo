# The Odyssey: the moving-image vocabulary

What the film has to make move, found in the beats of all 152 scenes (`harness/atlas.json` beats and assets in the halfworld,
`odyssey/kits/locations.json` places), counted, and ranked by what it is worth to the film. The data is `motion.json`; the page is
`odyssey/kits/cineosis.html` (built by `tools/forage/product/cineosis.py`). The sign score that says *how* each scene is cut is `score.json`.

**How it was counted.** A pattern over each scene's title, beats, assets and place, with hand corrections where a word matched and the
motion did not (the corrections are listed in the census as `FALSE`). Two kinds are also read off the sign score, because the score is
what asks for them: *transitions* (every scene holding a rich dream, strong destiny, peaks of the present or gaseous perception needs a
dissolve or a superimposition) and *transformation* (every scene holding limpid and opaque needs one face to clear as another clouds).

**How it was ranked.** `value = (scenes in the cut + 0.3 × dropped scenes) / 102 × story (1-3) × weakness (have 1, partial 2, missing 3) × 10`.
Story is how much the motion carries the plot where it appears (the embrace at a recognition carries the film; a cup raised does not).

**What the pipeline does today** (read from the renderers):

- `film-readymades/odyssey-take.js`: the keyframe keys staged and snapshotted; the cast eased between keys, with a walk cycle (legs and arms on
  a sine), turning, sitting and rising; the syncwatch cutting grammar (RHYTHM per book, SPK/REACT/OBJ/WIDE, the authored INSERTS); the twelve
  halfworld faces with viseme lip sync, listener carriage, key-beat emotions, idle life and blinks; captions; the bed ducked under the voice.
- `film-readymades/odyssey-trailer.js`: one staged pose per shot (no blocking change inside a shot); camera moves push, pull, zoom, orbit, crane,
  track, hold with eases, `stepped` for stop-motion on twos, a wobble; looks overridden per shot (sky, fog, a key placed by words, night
  dimming); warm practicals that flicker; a grade (vignette, wash, letterbox); cards, including brick letters built at 12 plates a second.
- `film-readymades/odyssey-runtime.js`: staging, props (78 of them, including the creatures and their pose variants: `polyphemusSprawl`,
  `polyphemusRoar`, `scyllaStrike`, `scyllaLift`, `ram`, `pig`, `argos`, `laestrygon`, `whirl`, `steam`), lights, ropes (`kfRope`), a
  collision and support check (`kfPhysics`).
- `play/odyssey-game/cinema.js` and `engine.js`: the scene card drawn as instanced parts, a studded sea plane whose texture can scroll,
  automatic WIDE/MID/CLOSE coverage cut on segment seams with a 4% drift, faces with jaw on the audio level, `E.burst` (a burst of 1×1 plates).
- `tools/forage/product/landscape.py`: static brick water (clear tiles over blue, foam, deep water, beaches, streams, quays).
- `play/odyssey-game/sfx/`: 34 synthesised effects, among them sea, sea-calm, storm, whirlpool, thunder, wind-howl, oars, fire, splash,
  rock, roar, bowstring, lyre, clang, clatter.

**The rule for every technique below: brick terms, on twos.** Nothing is drawn that could not be built (the LEGO Movie's law: water,
fire, smoke and explosions made of parts); motion is keyed pose to pose and held for two frames at 24 fps (12 drawings a second), the
camera a stop-motion photographer's (the trailer renderer's `stepped` already does this for the camera). Sets and effects are instanced
meshes whose matrices move; no new geometry is generated per frame.

## The ranked build list

| rank | kind | status | scenes (cut / all) | story | value |
|---:|---|---|---:|---:|---:|
| 1 | Embraces, recognitions and weeping | partial | 34 / 44 | 3 | 21.76 |
| 2 | Sea states: calm, swell, surf, the sea as ground | partial | 33 / 43 | 3 | 21.18 |
| 3 | Crowds, assemblies and feasts | partial | 26 / 42 | 3 | 18.12 |
| 4 | Optical transitions: dissolve, double exposure, marked flashback | missing | 17 / 26 | 3 | 17.38 |
| 5 | Single combat and the grapple | missing | 13 / 17 | 3 | 12.53 |
| 6 | Falls and deaths | missing | 13 / 16 | 3 | 12.26 |
| 7 | Transformation (Proteus, Circe, Athena restoring and ageing Odysseus) | partial | 16 / 22 | 3 | 10.47 |
| 8 | Disguise and the god among men | partial | 22 / 33 | 2 | 9.92 |
| 9 | Rowing | missing | 16 / 17 | 2 | 9.59 |
| 10 | Walking journeys, arrivals and departures | partial | 19 / 30 | 2 | 8.75 |
| 11 | Battle and slaughter: the Cicones, the hall, the last clash | missing | 9 / 12 | 3 | 8.74 |
| 12 | Sleep, waking and dreams | partial | 20 / 25 | 2 | 8.43 |
| 13 | Animals: rams, sheep, goats, pigs, cattle | partial | 19 / 26 | 2 | 8.27 |
| 14 | Archery: stringing the bow, the shot through the axes | partial | 13 / 14 | 3 | 7.82 |
| 15 | Thrown and hurled things: rocks, stools, spears, the discus | missing | 9 / 16 | 2 | 6.53 |
| 16 | Sailing under sail | partial | 14 / 18 | 2 | 5.96 |
| 17 | Fire, smoke and steam | partial | 14 / 18 | 2 | 5.96 |
| 18 | Weather and sky: dawn, dusk, night, fog, the sun held back | have | 25 / 41 | 2 | 5.84 |
| 19 | Eating, drinking and devouring | partial | 25 / 39 | 1 | 5.73 |
| 20 | Ghosts rising; the dead | missing | 8 / 13 | 2 | 5.59 |
| 21 | The Cyclops | partial | 9 / 9 | 3 | 5.29 |
| 22 | Birds and omens: eagles, hawk and dove, geese | missing | 7 / 13 | 2 | 5.18 |
| 23 | Bathing, washing and foot-washing | partial | 10 / 15 | 2 | 4.51 |
| 24 | Dance and song | partial | 8 / 13 | 2 | 3.73 |
| 25 | Ship in storm; lightning; the storm at human scale | partial | 6 / 7 | 3 | 3.71 |
| 26 | Building: the raft, the stake, the bed | partial | 7 / 9 | 2 | 2.98 |
| 27 | A god's flight and descent | missing | 4 / 7 | 2 | 2.88 |
| 28 | Shipwreck, drifting and swimming | missing | 3 / 3 | 3 | 2.65 |
| 29 | Divine mist and darkness that hide a figure | partial | 5 / 6 | 2 | 2.08 |
| 30 | The dog: Argos and the farm dogs | partial | 5 / 5 | 2 | 1.96 |
| 31 | Weaving and the loom | partial | 4 / 6 | 2 | 1.8 |
| 32 | Whirlpool | missing | 2 / 3 | 2 | 1.35 |
| 33 | Binding, hanging, ropes and cables | have | 12 / 15 | 1 | 1.26 |
| 34 | Horses, chariots, mule carts | partial | 2 / 5 | 1 | 0.57 |
| 35 | Scylla and the strait | partial | 1 / 2 | 2 | 0.51 |
| 36 | The Laestrygonians | partial | 1 / 1 | 2 | 0.39 |

**Reading the list.** The embrace comes first because every recognition (the film's summit events, all kept) ends in one, weeping runs
through half the film, and a minifigure cannot close its arms. The sea is second: it is the ground of half the poem and we have only still
water. The crowd is third because the hall, the assemblies and the feasts are a third of the film and every extra is a statue. Transitions
come fourth though they are fewer, because they are missing outright and the time-images the score asks for (the scar's flashback, the bed,
the orchard, the dreams, the hall of death) cannot be made without them. Single combat and falls follow: the tales and Book XXII depend on
them and we have nothing between two poses. The monsters rank low not because they matter little but because they are few scenes and
already half built (pose variants exist); they are the showpieces, and the ranking says to build the general machinery (keyed poses, the
sea, falls, replacement animation) first and let the monsters reuse it.

**Three pieces of machinery cover most of the list.** (1) *A keyed-pose track on twos* for any figure or creature (combat, battle, falls,
archery, rowing, dance, the Cyclops, Scylla, quadrupeds, embraces): the take renderer already eases between keys; it needs holds instead
of eases, anticipation and impact keys, and to run in trailer mode too. (2) *A replacement track* (swap a part or a whole build at a frame:
transformation, disguise, sails, flames, the Proteus chain, the Cyclops's big poses). (3) *Instanced brick fields driven by a function*
(the sea's h(x,t), rain streaks, smoke, spray, the whirlpool's rings, the web on the loom, a set building itself). With a compositor pass
for dissolves in the exporters, these three make almost every kind here.

## Each kind

### 1. Embraces, recognitions and weeping  ·  partial

*34 scenes in the cut, 44 in all; story 3; value 21.76.* Scenes: B03-S05, B04-S02, B04-S03, B05-S02, B05-S03, B07-S03, B07-S04, B08-S02, B08-S05, B09-S03, B09-S09, B09-S11, B10-S06, B10-S07, B11-S02, B11-S03, B11-S04, B13-S02, B13-S05, B15-S05, B16-S01, B16-S02, B16-S03, B17-S01, B17-S03, B17-S04, B17-S07, B19-S03, B19-S04, B20-S02, B20-S03, B20-S05, B21-S01, B21-S02, B21-S04, B22-S06, B22-S08, B23-S02, B23-S03, B23-S04, B24-S02, B24-S03, B24-S04, B24-S05.

- **Excellent:** The LEGO Movie's sincerity: the joke stops and the hug is held; Nolan ends on a hand on a face (102.5). Minifigures cannot close their arms, so the embrace is the heads together and the arms up.
- **We have:** Halfworld faces with the key-beat emotions (recognition, grief, appeal) played on the principal's face; kfPhysics allows touching pairs; lip sync.
- **Missing:** Tears; the move into the embrace; the held two-shot where both faces read.
- **Technique (brick terms):** An embrace key pair (arms raised to 60°, heads 4 LDU apart, a 5° lean in) eased over 8 frames and then held; tears as a trans-clear 1x1 round plate sliding down the face decal over 24 frames; recognitions framed by their sign (score.json).

### 2. Sea states: calm, swell, surf, the sea as ground  ·  partial

*33 scenes in the cut, 43 in all; story 3; value 21.18.* Scenes: B02-S03, B02-S05, B02-S07, B03-S01, B03-S02, B03-S03, B03-S05, B04-S05, B05-S01, B05-S03, B05-S04, B05-S05, B05-S06, B06-S02, B07-S01, B08-S01, B09-S02, B09-S03, B09-S04, B09-S10, B09-S11, B10-S02, B10-S03, B11-S01, B11-S02, B11-S03, B11-S04, B11-S05, B11-S07, B11-S08, B12-S01, B12-S02, B12-S03, B12-S04, B12-S05, B12-S07, B13-S01, B13-S02, B13-S03, B13-S05, B15-S03, B15-S05, B16-S05.

- **Excellent:** The LEGO Movie's sea is built from parts: rows of 1x1 round plates and tiles in trans-blue and trans-clear stepping on twos, foam of white plates at the break; Nolan's trailer keeps the sea a horizon a third up the frame, black at night with one warm light (frames 47, 51).
- **We have:** Static brick water in the landscape library (landscape.py: clear tiles over blue, foam, deep water, beach with shingle and shallows); the game's studded sea plane with a texture that can scroll; sea and sea-calm synthesised beds.
- **Missing:** No sea that moves in take or trailer mode: water is a still surface; no swell height, no surf line, no wake behind a hull, no difference between calm, swell and storm except the sky.
- **Technique (brick terms):** Sea as a field of 1x2 and 2x2 trans-blue tiles on a stud grid, each row raised by a height function h(x,t) quantised to plate steps (1/3 brick) and stepped on twos (12 fps): calm = amplitude 0 with a glint layer of trans-clear 1x1 round plates toggled at random; swell = one plate of amplitude, 48-stud wavelength; storm = two bricks, crests capped with white 1x1 round plates. One instanced mesh per colour; only matrices move.

### 3. Crowds, assemblies and feasts  ·  partial

*26 scenes in the cut, 42 in all; story 3; value 18.12.* Scenes: B01-S01, B01-S03, B01-S04, B01-S05, B01-S06, B02-S01, B02-S02, B02-S03, B02-S04, B04-S01, B05-S05, B07-S02, B08-S01, B08-S02, B08-S04, B08-S05, B09-S01, B09-S02, B09-S04, B10-S06, B10-S07, B11-S01, B11-S06, B11-S08, B12-S07, B13-S01, B16-S05, B18-S01, B18-S02, B18-S04, B20-S03, B20-S04, B20-S05, B21-S03, B21-S05, B22-S01, B22-S05, B23-S03, B24-S01, B24-S05, B24-S06, B24-S09.

- **Excellent:** The LEGO Movie's crowds are dozens of minifigures with small individual loops (a head turn, a cup raise); Nolan keeps crowds as texture behind one figure (57).
- **We have:** Ensembles baked in the cards; kfSpread spreads a cast; idle life and blinks (Perform) on the named cast; halfworld faces on twelve principals.
- **Missing:** Crowd members are statics: no drinking, turning, laughing, no crowd reaction to a line.
- **Technique (brick terms):** A crowd layer: each extra gets one of six two-pose idles (cup raise, head turn, lean, laugh, point, gamble) with a random phase, on twos; a reaction wave (all heads turn toward a source within 6 frames, nearest first) for cues like the stool and the bow.

### 4. Optical transitions: dissolve, double exposure, marked flashback  ·  missing

*17 scenes in the cut, 26 in all; story 3; value 17.38.* Scenes: B02-S05, B02-S07, B03-S01, B03-S06, B04-S05, B04-S07, B06-S01, B07-S02, B09-S11, B10-S01, B10-S06, B11-S02, B11-S03, B11-S06, B11-S08, B12-S02, B19-S03, B19-S04, B19-S05, B19-S06, B20-S01, B20-S05, B23-S04, B23-S05, B24-S01, B24-S04.

- **Excellent:** The time-image needs optics: the marked flashback (dissolve, warmer or monochrome, slower), the dream's superimposition, the vision inside the present.
- **We have:** Cards fade in and out; the grade can wash a frame.
- **Missing:** No shot-to-shot dissolve, no superimposition, no marked flashback look in take, trailer or game mode.
- **Technique (brick terms):** A compositor pass in the exporters: crossfade two rendered frames over n frames (dissolve); additive blend at 40% for a double exposure; a 'marked past' grade (warm wash, 0.75 saturation, frames held on threes).

### 5. Single combat and the grapple  ·  missing

*13 scenes in the cut, 17 in all; story 3; value 12.53.* Scenes: B02-S07, B04-S05, B08-S03, B09-S02, B10-S02, B10-S05, B10-S06, B12-S02, B13-S01, B15-S03, B16-S04, B18-S01, B18-S02, B19-S04, B19-S05, B22-S02, B24-S04.

- **Excellent:** The LEGO Movie: fights as pose-to-pose keys at 12 fps (on twos), strong silhouettes, a held anticipation pose before every hit, a two-frame impact, a plastic clack on contact; Nolan: close, handheld, the face.
- **We have:** Pose holds from keyframes; the take eases between keys (arms and legs lerped); kfPhysics detects clashes between figures; clack sfx (clang, thud).
- **Missing:** No choreography: no anticipation, no impact frames, no reaction, no fall.
- **Technique (brick terms):** A fight is a list of key poses (anticipation, strike, impact, recoil, settle) on the six minifigure joints plus a root move, held on twos with no in-betweens except the strike (one smear frame of a trans-clear arc plate); contact frames checked by kfPhysics so hands meet targets; a 2-frame camera shake and a clack on each impact.

### 6. Falls and deaths  ·  missing

*13 scenes in the cut, 16 in all; story 3; value 12.26.* Scenes: B04-S07, B09-S02, B09-S07, B09-S09, B10-S03, B10-S08, B12-S07, B17-S03, B19-S04, B22-S01, B22-S02, B22-S06, B22-S07, B24-S03, B24-S04, B24-S08.

- **Excellent:** A fall as two held poses and a bounce: plastic does not ragdoll; the LEGO Movie's figures fall stiff and clack.
- **We have:** Lying poses via keys.
- **Missing:** No fall between poses.
- **Technique (brick terms):** Stiff-body fall: rotate the whole figure about the heel over 4 frames on twos, one-plate bounce, then settle; accessories come loose as parts.

### 7. Transformation (Proteus, Circe, Athena restoring and ageing Odysseus)  ·  partial

*16 scenes in the cut, 22 in all; story 3; value 10.47.* Scenes: B01-S06, B02-S05, B03-S05, B04-S05, B06-S04, B07-S01, B07-S03, B08-S01, B10-S04, B10-S07, B11-S04, B13-S03, B13-S05, B16-S02, B16-S03, B16-S06, B18-S02, B18-S04, B19-S06, B23-S03, B24-S05, B24-S09.

- **Excellent:** Replacement animation, the stop-motion way: heads, hair and torsos swapped one element at a time on twos while the camera holds; Proteus through lion, snake, water and tree in two frames each.
- **We have:** Faces are decals that can be swapped (Face.attach 'halfworld:<who>'); plain heads replace printed ones; separate disguise cast ids exist in the keyframes.
- **Missing:** No on-screen change: a disguise is a different figure between shots.
- **Technique (brick terms):** A transformation track: a list of (frame, slot, part) swaps on the same rig (head, hair, torso print, legs, accessory), on twos, with a one-frame white flash on the first swap for a god and none for Athena's slow restorations; Proteus as a chain of prop replacements at a fixed mark.

### 8. Disguise and the god among men  ·  partial

*22 scenes in the cut, 33 in all; story 2; value 9.92.* Scenes: B01-S03, B01-S04, B01-S05, B02-S05, B02-S07, B03-S01, B03-S02, B03-S04, B03-S05, B04-S03, B04-S06, B04-S07, B06-S01, B07-S01, B08-S01, B10-S01, B10-S05, B11-S08, B13-S02, B13-S05, B14-S01, B15-S01, B16-S01, B16-S02, B16-S06, B17-S02, B17-S07, B18-S04, B20-S01, B20-S04, B22-S05, B24-S08, B24-S09.

- **Excellent:** The disguise is costume: rags, a hood, a staff (the wardrobe); the god is lit a little apart from the room.
- **We have:** wardrobe.py costumes; disguise cast ids (athena-as-mentor); the trailer's look can light one figure.
- **Missing:** Nothing tells the audience the god is there except the dialogue.
- **Technique (brick terms):** A rim light and a 5% warmer grade on the disguised god only (a per-figure light link), and a two-frame glint when the disguise speaks as a god.

### 9. Rowing  ·  missing

*16 scenes in the cut, 17 in all; story 2; value 9.59.* Scenes: B02-S07, B04-S07, B05-S04, B09-S02, B09-S03, B09-S10, B09-S11, B10-S01, B10-S02, B10-S08, B11-S01, B12-S03, B12-S04, B12-S07, B13-S01, B15-S03, B24-S04.

- **Excellent:** LEGO: oars as long bars through clips moving in a looped four-pose cycle, the whole bank in step, a small splash of white plates at each catch; Nolan: oars out on a labouring galley (94.5).
- **We have:** The oars.ogg synthesised sfx; oar props (Elpenor's oar) as statics.
- **Missing:** No oar cycle; rowers are seated statics.
- **Technique (brick terms):** A four-pose loop per oar (catch, drive, finish, recovery) on twos, the rowers' torsos leaning with it (torso.lean already in Perform); one offset for the whole bank so it reads as a crew; a splash burst (E.burst of 1x1 round white plates) at each catch.

### 10. Walking journeys, arrivals and departures  ·  partial

*19 scenes in the cut, 30 in all; story 2; value 8.75.* Scenes: B01-S03, B02-S05, B02-S07, B03-S05, B03-S06, B06-S04, B07-S01, B07-S02, B09-S05, B10-S03, B10-S05, B10-S08, B11-S02, B11-S07, B12-S03, B13-S02, B13-S05, B14-S01, B15-S02, B15-S03, B15-S05, B16-S01, B16-S02, B17-S02, B17-S04, B18-S03, B23-S06, B24-S01, B24-S02, B24-S03.

- **Excellent:** Nolan: men walking away from us into mist or dark (31, 66), the journey as a direction; LEGO: a waddle walk on twos, legs swinging in two poses.
- **We have:** Take mode: a walk cycle between keyframe marks (legs and arms on a sine, turn and settle, sit and rise); the camera follows a walking figure (hero framing).
- **Missing:** Trailer mode and the game's cinema have no walking; walks are only mark-to-mark, not long journeys through a landscape.
- **Technique (brick terms):** Keep take mode's cycle but step it on twos (the two-pose minifig waddle); long journeys as a path through the landscape kit with a track move holding the walker small in the frame (the scale rule).

### 11. Battle and slaughter: the Cicones, the hall, the last clash  ·  missing

*9 scenes in the cut, 12 in all; story 3; value 8.74.* Scenes: B09-S02, B10-S02, B12-S06, B18-S03, B21-S01, B22-S02, B22-S03, B22-S05, B22-S06, B24-S02, B24-S08, B24-S09.

- **Excellent:** Nolan: the massed army soft behind two figures; the LEGO Movie: mass action as a few foreground fighters on keys plus a background of cycling extras, fast cuts on the payoff.
- **We have:** Ensembles baked into scene cards (suitors, crews) as statics; the syncwatch grammar cuts fast in books XXI-XXII.
- **Missing:** No crowd motion, no deaths, no bodies falling across tables.
- **Technique (brick terms):** Three layers: two or three hero fights on keys (as single combat); a mid layer of 6-10 figures on four-pose loops (strike, parry, stagger, fall) with random offsets; a background of statics. Deaths as a two-pose fall (knees, flat) with the figure's accessories scattering as loose parts.

### 12. Sleep, waking and dreams  ·  partial

*20 scenes in the cut, 25 in all; story 2; value 8.43.* Scenes: B02-S07, B04-S07, B05-S06, B06-S01, B06-S02, B09-S07, B09-S08, B09-S09, B10-S01, B10-S08, B12-S01, B12-S06, B12-S07, B13-S01, B13-S02, B14-S04, B15-S01, B16-S06, B18-S04, B19-S06, B20-S01, B20-S03, B23-S01, B23-S05, B24-S01.

- **Excellent:** Sleep as a held body; the dream as a dissolve and a double exposure (rich dream) or a straight cut (restrained dream).
- **We have:** Seated and lying poses (r.sat); snore.ogg.
- **Missing:** No transitions: no dissolve or superimposition in any renderer.
- **Technique (brick terms):** Sleep as a held lying pose (the figure laid flat on its bed or the ground, the torso rising half a plate every 48 frames for breath); waking as a two-pose rise on twos; the dream by its sign: rich dream as a dissolve and a double exposure, restrained dream as a straight cut (see transitions).

### 13. Animals: rams, sheep, goats, pigs, cattle  ·  partial

*19 scenes in the cut, 26 in all; story 2; value 8.27.* Scenes: B01-S06, B03-S01, B03-S05, B09-S02, B09-S04, B09-S06, B09-S08, B09-S10, B10-S03, B10-S04, B10-S07, B11-S01, B11-S03, B12-S05, B12-S06, B13-S01, B14-S01, B14-S02, B14-S04, B15-S02, B17-S02, B18-S01, B18-S04, B20-S03, B21-S04, B24-S07.

- **Excellent:** LEGO animals are single moulded parts; motion is a three-pose walk (legs are moulded, so the body bobs and the head turns) and a herd moves as a mass with offsets.
- **We have:** Built ram, pig, cow props (and black ram, red cow); pig heads for Circe's swine.
- **Missing:** No quadruped motion; a herd is a still group.
- **Technique (brick terms):** Quadruped step: body bob of half a plate and head nod on a 4-frame loop on twos, the animal slid along its path; herds as boids-lite (follow a leader spline with random offsets); the rams under the men: the man tied under, moving with the ram.

### 14. Archery: stringing the bow, the shot through the axes  ·  partial

*13 scenes in the cut, 14 in all; story 3; value 7.82.* Scenes: B10-S02, B12-S04, B19-S06, B21-S01, B21-S02, B21-S03, B21-S04, B21-S05, B21-S06, B21-S07, B22-S01, B22-S02, B22-S03, B24-S02.

- **Excellent:** The shot is a series: the string hooked, the draw, a hold, the release on one frame, the arrow's flight through twelve rings in an insert down the line.
- **We have:** Bow, arrow and axes props; bowstring.ogg; the syncwatch insert on the bow (XXI-S07); the arrow can be placed.
- **Missing:** No stringing action, no draw, no arrow flight.
- **Technique (brick terms):** Stringing: three held poses (bow braced on the thigh, the loop sliding, strung) and a pluck with the string element vibrating on ones for six frames; the shot: an arrow moved along the axis 40 studs a frame, the camera an insert down the axe line; hits as a two-frame impact and a fall.

### 15. Thrown and hurled things: rocks, stools, spears, the discus  ·  missing

*9 scenes in the cut, 16 in all; story 2; value 6.53.* Scenes: B01-S04, B04-S06, B05-S06, B08-S03, B09-S07, B09-S11, B10-S02, B10-S04, B12-S04, B17-S05, B18-S05, B20-S04, B22-S05, B24-S01, B24-S08, B24-S09.

- **Excellent:** A projectile on a clean arc, stepped on twos, with a readable anticipation pose and a splash or clatter at the end; Polyphemus's rock driving a wave back at the ship.
- **We have:** Boulder, stool props; rock.ogg, clatter.
- **Missing:** No projectile motion.
- **Technique (brick terms):** Parabolic arc sampled on twos with a spin of 30° per frame, a motion trail of three fading copies at 30% opacity; at impact a burst of loose plates or white water plates.

### 16. Sailing under sail  ·  partial

*14 scenes in the cut, 18 in all; story 2; value 5.96.* Scenes: B01-S05, B02-S05, B02-S07, B04-S07, B05-S04, B05-S05, B07-S03, B08-S01, B09-S03, B10-S01, B10-S08, B11-S08, B12-S02, B12-S03, B12-S05, B12-S07, B13-S01, B15-S03.

- **Excellent:** Nolan: two ships as silhouettes against dusk, the sail the only shape (frame 51); a galley labouring side-on in a heavy sea (94.5). LEGO: the sail is a printed cloth or a curved slope wall that bellies in three held shapes.
- **We have:** Ship sets exist as kit builds (black ship, raft, Phaeacian ship in the cards); trailer camera moves (track, crane) can travel with a still ship; wind sfx.
- **Missing:** No hull motion (bob, pitch, roll, heel under wind), no sail that fills, no wake; a ship at sea reads as a building.
- **Technique (brick terms):** Three sail replacements (slack, half, full belly) swapped on twos as the wind rises; the hull on a rig that pitches ±4° and heaves one plate on the sea's own h(x,t) at the bow and stern; a wake of white 1x1 round plates spawned at the stern and fading after 24 frames.

### 17. Fire, smoke and steam  ·  partial

*14 scenes in the cut, 18 in all; story 2; value 5.96.* Scenes: B02-S02, B03-S01, B03-S02, B05-S01, B07-S03, B09-S04, B09-S06, B09-S08, B09-S09, B10-S03, B12-S01, B12-S06, B14-S03, B19-S01, B19-S02, B19-S03, B21-S03, B22-S08.

- **Excellent:** LEGO: flame elements (the 'flame' part in trans-orange and trans-yellow) swapped on twos; smoke as stacked round bricks drifting up and fading; Nolan: one warm source in blue night (47, 71, 82).
- **We have:** Warm practicals flicker (trailer: point lights modulated by a sine noise); fire.ogg; ember and steam props; E.burst plate bursts.
- **Missing:** No flame geometry that moves, no smoke column, no steam.
- **Technique (brick terms):** Flame: three flame-element replacements cycled on twos with the existing light flicker in phase; smoke: 1x1 and 2x2 round bricks in light and dark grey spawned at the source every 4 frames, rising 1 plate a frame, drifting with the wind vector, fading and removed after 36 frames; steam (the blinding) the same in white, faster.

### 18. Weather and sky: dawn, dusk, night, fog, the sun held back  ·  have

*25 scenes in the cut, 41 in all; story 2; value 5.84.* Scenes: B01-S06, B02-S01, B02-S02, B02-S07, B03-S01, B03-S05, B03-S06, B05-S04, B05-S05, B05-S06, B07-S04, B08-S01, B09-S02, B09-S03, B09-S04, B09-S06, B09-S08, B09-S10, B10-S01, B10-S03, B11-S01, B12-S01, B12-S02, B12-S05, B12-S07, B13-S01, B14-S04, B15-S01, B15-S03, B17-S01, B17-S06, B17-S07, B18-S05, B19-S02, B19-S05, B20-S01, B20-S02, B20-S05, B23-S04, B23-S05, B23-S06.

- **Excellent:** Nolan: hard low sun or blue night with one warm source, overcast haze by day, horizons a quarter to a third up the frame (rules 3-4). The sun held back (XXIII) is a dawn that stops.
- **We have:** The keyframe look (sky gradient, fog distances, exposure, fill, a sun key placed by words: 'low sun behind', 'moon, high left'), trailer overrides for time of day, night dimming, grade (vignette, wash, letterbox).
- **Missing:** Time does not pass inside a shot: no light that changes (dawn rising, the sun held back, a day compressed).
- **Technique (brick terms):** Animate the look: interpolate sky, fog and sun elevation over a shot from a start look to an end look, stepped on twos (the sun as a brick disc on a rig for wides); 'the sun held back' is a dawn that rises for 4 s and then freezes while the rest moves.

### 19. Eating, drinking and devouring  ·  partial

*25 scenes in the cut, 39 in all; story 1; value 5.73.* Scenes: B01-S03, B02-S06, B03-S01, B03-S02, B04-S02, B04-S03, B04-S06, B05-S06, B06-S01, B06-S02, B06-S04, B09-S02, B09-S05, B09-S07, B09-S08, B09-S09, B10-S02, B10-S04, B10-S06, B10-S07, B11-S01, B11-S03, B11-S04, B11-S05, B11-S06, B11-S08, B12-S01, B12-S06, B14-S01, B14-S02, B14-S04, B15-S02, B16-S01, B16-S06, B18-S02, B18-S03, B20-S04, B22-S01, B24-S05.

- **Excellent:** One gesture: a cup raised, a bite; the Cyclops's devouring seen in the faces and a shadow.
- **We have:** Cup, bowl, wine props; the listening carriage.
- **Missing:** No hand-to-mouth action.
- **Technique (brick terms):** A two-pose cup raise (arm at 0° and 110°) on twos; devouring as silhouette on the cave wall.

### 20. Ghosts rising; the dead  ·  missing

*8 scenes in the cut, 13 in all; story 2; value 5.59.* Scenes: B04-S07, B10-S08, B11-S01, B11-S02, B11-S03, B11-S04, B11-S05, B11-S06, B11-S07, B11-S08, B20-S05, B24-S01, B24-S02.

- **Excellent:** The dead as translucent figures in a continuous mist, rising from the ground; Nolan's ashen shore with braziers (82).
- **We have:** The land-of-the-dead kit; a shade prop; the Tiresias figure.
- **Missing:** No translucency, no rising, no pass-through (Anticleia's three embraces need arms that pass through).
- **Technique (brick terms):** Ghost material: the figure's meshes at 0.45 opacity, trans-clear tint, depth-write off, a slow 2-plate bob; rising = the figure raised through the floor over 24 frames on twos; the embrace: the living figure's arms keyed through the shade with kfPhysics told to ignore the pair.

### 21. The Cyclops  ·  partial

*9 scenes in the cut, 9 in all; story 3; value 5.29.* Scenes: B09-S04, B09-S05, B09-S06, B09-S07, B09-S08, B09-S09, B09-S10, B09-S11, B11-S03.

- **Excellent:** Nolan's restraint: the Cyclops shown in faces and a hand at the frame edge; the LEGO scale of a big-fig built from bricks, moved slowly and heavily on twos.
- **We have:** A built Polyphemus with pose variants (polyphemus, polyphemusSprawl, polyphemusRoar), the cyclops kit and a rendered film (films/odyssey-cyclops.mp4); his halfworld face.
- **Missing:** No locomotion (walking, stooping, groping), no grab, no rock throw.
- **Technique (brick terms):** Treat him as a stop-motion puppet: 6-8 key poses per action (stoop, reach, grab, lift, smash) swapped as replacement builds on twos; his steps shake the camera by 1 plate; his scale told by men in the foreground.

### 22. Birds and omens: eagles, hawk and dove, geese  ·  missing

*7 scenes in the cut, 13 in all; story 2; value 5.18.* Scenes: B01-S06, B02-S03, B03-S05, B04-S06, B11-S08, B13-S01, B15-S02, B15-S05, B16-S03, B19-S06, B20-S04, B21-S07, B22-S06.

- **Excellent:** One sharp action in the sky: two eagles slashing at each other, a hawk tearing a dove; held to one idea per shot.
- **We have:** Nothing but the words.
- **Missing:** No bird models or flight.
- **Technique (brick terms):** Birds as small brick builds with two wing positions swapped on ones (fast), on an air path; omen shots are inserts (OBJ) on sky only.

### 23. Bathing, washing and foot-washing  ·  partial

*10 scenes in the cut, 15 in all; story 2; value 4.51.* Scenes: B01-S04, B02-S05, B03-S05, B04-S01, B04-S03, B05-S04, B06-S01, B06-S02, B06-S03, B06-S04, B10-S06, B17-S05, B19-S04, B23-S03, B24-S05.

- **Excellent:** The basin, the hands, the scar under water; the foot dropped and the water spilling in an insert.
- **We have:** Basin and spill props; the scar as a set piece.
- **Missing:** No water motion in a vessel; no spill.
- **Technique (brick terms):** Water in a basin as a trans-blue tile that ripples by swapping to two ring variants; the spill as the basin tipping on twos and a spill prop sliding out.

### 24. Dance and song  ·  partial

*8 scenes in the cut, 13 in all; story 2; value 3.73.* Scenes: B01-S06, B08-S02, B08-S03, B08-S04, B08-S05, B10-S04, B12-S03, B15-S01, B17-S04, B21-S07, B22-S06, B23-S03, B24-S02.

- **Excellent:** The Phaeacian ball dance as precise leaps and exchanges; the bard's hands on the lyre; the wedding noise heard from the street.
- **We have:** lyre.ogg; the bed tracks; the Perform idle; lip sync for the singer's lines.
- **Missing:** No dance loops, no hand motion on the lyre.
- **Technique (brick terms):** Dance: an 8-pose loop per dancer (step, leap, turn) on twos, dancers phased in pairs; the lyre: a two-pose strum on ones in the strumming beats.

### 25. Ship in storm; lightning; the storm at human scale  ·  partial

*6 scenes in the cut, 7 in all; story 3; value 3.71.* Scenes: B05-S05, B07-S04, B10-S01, B12-S05, B12-S07, B14-S04, B24-S09.

- **Excellent:** Nolan: grey spray almost erasing the image, a body flung through the air, then a wet face and a red sail close (88-97): the storm told in spray and a face. LEGO: lightning as a yellow lightning-bolt element held for two frames, the set lit white for one.
- **We have:** Look overrides make a storm sky (dark gradient, fog, dim); storm, thunder, wind-howl sfx; handheld wobble on the trailer camera.
- **Missing:** No rain, no spray, no lightning flash, no hull roll, no one thrown by a wave.
- **Technique (brick terms):** Storm = sea at storm amplitude + rain rig + spray bursts: rain as trans-clear 1x1 round plates on vertical streak rigs (a column of 4 plates stretched 3x in y) falling 2 plates per frame on twos; spray as white 1x1 round plates bursting at crests; lightning as a one-frame white exposure plus the bolt element for two frames, synced to thunder.ogg.

### 26. Building: the raft, the stake, the bed  ·  partial

*7 scenes in the cut, 9 in all; story 2; value 2.98.* Scenes: B05-S03, B05-S04, B09-S08, B09-S09, B11-S01, B11-S02, B12-S01, B15-S03, B23-S04.

- **Excellent:** The film's native act: a model growing brick by brick on the beat, as the brick title card builds its letters at 12 plates a second.
- **We have:** The brick card's build animation (12 a second); every set is a list of parts in build order (the Butter cards).
- **Missing:** No set builds itself on screen.
- **Technique (brick terms):** Build-on-screen: reveal a card's rows in build order, n parts per frame on twos, each part dropping 1 plate onto its studs with a click sfx (stud.ogg); the raft in four matched top-down stages (V-S04).

### 27. A god's flight and descent  ·  missing

*4 scenes in the cut, 7 in all; story 2; value 2.88.* Scenes: B01-S02, B01-S06, B03-S05, B05-S01, B11-S08, B21-S07, B24-S07.

- **Excellent:** A figure crossing the frame fast on a clear arc, a streak behind; the LEGO answer is a minifigure on a transparent stand, moved on twos with a motion trail.
- **We have:** The trailer's crane and track moves can travel through space.
- **Missing:** No figure can leave the ground (take mode walks between marks on the floor).
- **Technique (brick terms):** An air path for a figure: a spline between marks, the figure in a flying pose (arms back), moved on twos, a trail of three trans-clear copies; for the eagle and swallow forms, the transformation below then the bird on the same path.

### 28. Shipwreck, drifting and swimming  ·  missing

*3 scenes in the cut, 3 in all; story 3; value 2.65.* Scenes: B05-S05, B05-S06, B12-S07.

- **Excellent:** LEGO: a model coming apart brick by brick, pieces tumbling on twos; Nolan: a figure tiny in the water, the scale shot. The swimmer is a head and arms in the surf, not a full figure.
- **We have:** Keel, raft, veil and fig-tree props as statics; splash sfx.
- **Missing:** No breaking apart, no swimming pose cycle, no half-submerged figure (the sea is a floor, not a volume).
- **Technique (brick terms):** Break-apart: the ship's parts given outward velocities and spins, stepped on twos, gravity to the sea surface, then bobbing on h(x,t); swimmer: a torso-and-head rig set at water level with a two-pose crawl stroke on twos and a white-plate splash each stroke; the sea tiles drawn over the figure's legs (a cut-away of the water plane).

### 29. Divine mist and darkness that hide a figure  ·  partial

*5 scenes in the cut, 6 in all; story 2; value 2.08.* Scenes: B07-S01, B07-S02, B07-S03, B13-S02, B20-S05, B23-S06.

- **Excellent:** A veil around one figure only: the city sharp, the hero half there; LEGO would build it from trans-clear plates as a shell around the minifigure.
- **We have:** Global scene fog.
- **Missing:** No local mist on one figure or area; no mist that lifts.
- **Technique (brick terms):** A shell of trans-clear and trans-white 1x1 plates around the figure, opacity 0.35, drifting one plate per 6 frames; lifting it = removing plates top-down on twos (VII-S03).

### 30. The dog: Argos and the farm dogs  ·  partial

*5 scenes in the cut, 5 in all; story 2; value 1.96.* Scenes: B02-S01, B07-S02, B14-S01, B16-S01, B17-S03.

- **Excellent:** Argos's ears drop and his tail moves: tiny moves held long; the farm dogs rush in a pack.
- **We have:** Argos, dog, black and white dog props.
- **Missing:** No tail, ears or head motion; no rush.
- **Technique (brick terms):** Argos: tail and head as separate hinged parts keyed on twos (lift, drop ears, tail three beats, head down); the rush: the quadruped step at double speed with a 1-plate jump at the end.

### 31. Weaving and the loom  ·  partial

*4 scenes in the cut, 6 in all; story 2; value 1.8.* Scenes: B02-S02, B05-S01, B05-S02, B07-S02, B10-S04, B19-S02.

- **Excellent:** The shuttle across, the beater down, the web growing row by row; unweaving as the same film backwards.
- **We have:** Loom props (loomFull, loomHalf); the penelopes-loom kit.
- **Missing:** No shuttle or web motion.
- **Technique (brick terms):** The web as rows of 1x1 plates revealed one row per beat; unweaving is the reveal reversed; the weaver's arms on a two-pose loop (throw, beat).

### 32. Whirlpool  ·  missing

*2 scenes in the cut, 3 in all; story 2; value 1.35.* Scenes: B12-S02, B12-S04, B12-S07.

- **Excellent:** Concentric rings of trans-blue and white tiles turning at different speeds, the centre dropping away; the ship tilted toward it.
- **We have:** A whirl prop (static) and whirlpool.ogg.
- **Missing:** No rotation, no funnel.
- **Technique (brick terms):** Five rings of 1x1 round plates on turntable rigs, inner rings faster (angular speed doubling inward), each ring one plate lower than the last; stepped on twos; a spray burst every 12 frames at the rim.

### 33. Binding, hanging, ropes and cables  ·  have

*12 scenes in the cut, 15 in all; story 1; value 1.26.* Scenes: B04-S05, B04-S06, B08-S04, B09-S03, B09-S09, B09-S10, B10-S02, B12-S03, B12-S07, B13-S03, B16-S06, B19-S05, B21-S06, B22-S04, B22-S07.

- **Excellent:** Rope as a real thing that holds a body: the mast (XII), the gate cable (XXI), the rafter (XXII).
- **We have:** kfRope: rope tubes wound round a figure and a post, with hauled ends to named hands (the Sirens' mast).
- **Missing:** Rope does not tighten or move.
- **Technique (brick terms):** Tighten by shrinking the rope's radius over 6 frames on twos when the crew hauls.

### 34. Horses, chariots, mule carts  ·  partial

*2 scenes in the cut, 5 in all; story 1; value 0.57.* Scenes: B03-S06, B04-S01, B06-S01, B06-S02, B15-S02.

- **Excellent:** A chariot running on a road with the landscape passing; wheels turning.
- **We have:** A horse prop, vehicle library.
- **Missing:** No wheel rotation or gait.
- **Technique (brick terms):** Wheels rotated by distance travelled; horse gait as the quadruped loop at 4x speed; the landscape handed through the frame by a track move.

### 35. Scylla and the strait  ·  partial

*1 scenes in the cut, 2 in all; story 2; value 0.51.* Scenes: B12-S02, B12-S04.

- **Excellent:** Six necks striking from the cliff, each head a separate animation offset; the men lifted and gone in two seconds.
- **We have:** scyllaStrike and scyllaLift pose props; the scylla-charybdis kit.
- **Missing:** No strike motion between the poses.
- **Technique (brick terms):** Each neck a chain of 1x1 round bricks on a spline; strike = three keys (coiled, extended, lifted) on twos, the six necks offset by 3 frames; a man attached to the head at the lift key.

### 36. The Laestrygonians  ·  partial

*1 scenes in the cut, 1 in all; story 2; value 0.39.* Scenes: B10-S02.

- **Excellent:** Giants on the cliff rim in silhouette hurling boulders into a harbour full of ships.
- **We have:** Laestrygon props (three colours, a girl, Antiphates).
- **Missing:** No throwing, no ships breaking.
- **Technique (brick terms):** Reuse the thrown-object arc and the break-apart; giants as three-pose throwing loops on the rim.
