# tools/perform: the performance engine

Words become edits to embodied action on the film's LDraw minifig rigs, regulated by thermal and homeostatic measures. The engine
never adds motion to beat a threshold: every key it writes is caused by an intent in the score, and every intent by an utterance, a
stimulus, another body's action or a HOLD's reason. A stillness is a HOLD with a reason; motion without a cause is a defect the
metrics report.

```
node tools/perform/perform.js author   OD-B01-S03 [--force]        scene module -> score (authored layer)
node tools/perform/perform.js compile  OD-B01-S03                  score -> body score (sheet) + events
node tools/perform/perform.js measure  OD-B01-S03                  metrics and temperatures, before (the acted sheet) and after
node tools/perform/perform.js why      OD-B01-S03 telemachus 37.6  "why is he moving here?"
node tools/perform/perform.js homeostat OD-B01-S03 [--max 40]      uniselectors step the parameters until the variables are in band
node tools/perform/perform.js patch    OD-B01-S03 "make Telemachus more suspicious"
node tools/perform/perform.js chain    OD-B01-S03                  five instructions in a row, with timeline diffs
node tools/perform/perform.js hardware OD-B01-S03                  stop-motion pose sheet and servo timeline (CSV)
node tools/perform/previz.js           OD-B01-S03 [--sheet f --score f --name n --from s --to s]
node tools/perform/probe.js            OD-B09-S09 [--poses] [--ground-only] [--verbose]   marks, shot cameras and the ground grid from the film's page
  --variant wake-early [--frozen]      a disturbed run (the Blinding): odyssey/score/variants/
```

## Files

| file | what |
|---|---|
| `body.js` | the take's blocking at any t (a port of odyssey-take.js castAt), the sheet laid over it as choreo.js lays it, forward kinematics on the film's pivot tree (checked against the page's own points: 0.15 units mean) |
| `score.js` | the score format (odyssey-score/1): lanes, events, causes, `why()`, the rig desk's lane view |
| `compile.js` | the intent compiler: utterances, intents, machinery, walks, breath, solvers, legality -> odyssey-choreo/1 sheet + events |
| `intents.js` | attention, holds, speech acts (WELCOME, GUARDED_WELCOME), the handoff (OFFER/TAKE), LEAD/FOLLOW, business (GAMBLE, DRINK, POUR, REACT, GESTURE) |
| `intents-action.js` | labour, force, combat: SIGNAL, HEAT, CARRY, THRUST, TWIST, STRAIN, RECOIL, HIDE, CLING, ADVANCE, RETIME, THREAT, SHOOT, IMPACT, FALL, DUCK, EVADE, SEARCH, LEAP, POUR_OUT, SEPARATION, RETARGET, RECOVER, PURSUIT |
| `intents-more.js` | the kinds the other scenes ask for (odyssey/perform/needs.json): POSTURE, WEEP, TOOL_WORK, ARM, EAT, RECOGNISE, the contact primitive (SEIZE, HOLD_ON, EMBRACE, DRAG, TEND), STRUGGLE, FLEE, HERD, SACRIFICE, THROW, SWING (hit or miss: MISS and OPENING stimuli), BLOCK |
| `intents-extra.js` | ROW (one clock per name, rowers joining late in phase), GRIP (a held grip solved at every drawing on twos, with its residual), the attack kinds STAB CLUB PUNCH SHOVE and defences PARRY DODGE CATCH (ATTACK/DEFEND dispatch by `params.kind`), LOCOMOTE LEAVE CIRCLE RIDE CLIMB SWIM DROWN WEAVE MOVE_STONE CARESS WAKE DIE |
| `ground.js` | the floor under a point as the take finds it: the probed ray grid (`odyssey/choreo/ground/<scene>.json`), else the piece boxes |
| `intents-creature.js` | intents for creatures (film-readymades/creatures.js rigs): POSE SLEEP TALK STIR BLINDED ROAR WALK GROPE REACH SEIZE EAT THROW HERD STRIKE ATTEND RECOGNISE INVOKE; `place()` fits a rig over the take's piece |
| `scenes/_auto.js` | a first score for any prepared scene from odyssey/perform/needs.json: lines, intents, chain, sea machinery, creatures from the keyframes, a generic causal model |
| `machinery.js` | the Blinding's coupled homeostat model; ROWING (one phase clock, per-body offsets); SIRENS_CHAIN (crew force -> hull -> mast -> rope -> strain) |
| `metrics.js` | per actor per drawing states through the shot cameras; the report |
| `thermo.js` | motion heat (through couplings, by material), causal entropy, media temperature, contrast, viability, the field |
| `homeostat.js` | the uniselector homeostat and the coupled four-unit homeostat |
| `patches.js` | instruction -> patch table; timeline and body diffs |
| `hardware.js` | pose sheet and servo timeline (figures, and creatures' angular channels on a giant puppet's segment model) |
| `previz.js`, `previz-draw.js` | the light previz |
| `scenes/<scene>.js` | a scene's direction (authors the score). Director's modules: OD-B01-S03 (the Gate), OD-B09-S08 (the Stake), OD-B09-S09 (the Blinding), OD-B09-S10 (the Rams), OD-B09-S11 (the Taunt), OD-B10-S04 (Circe), OD-B10-S02 (the Harbour), OD-B12-S03 (the Sirens), OD-B12-S04 (Scylla), OD-B12-S07 (the Thunderbolt), OD-B05-S05 (the Storm and the Raft), OD-B22-S01 (the Hall), OD-B17-S03 (Argos). Modules for scenes with a sea build on the first score (`require('./_auto.js')(M, X, needs)`) and lay the direction over it |

Data: `odyssey/score/<scene>.json` (score), `<scene>.choreo.json` (sheet the take plays: `tools/export-odyssey.js --choreo`),
`measures/`, `chains/`, `variants/`, `cameras/`, `hardware/`.

## The score (odyssey-score/1)

```
{ format, scene, title, type: dialogue|fight|revelation|machinery, total, clock, marks,
  actors:  { id: { role, body: 'minifig'|'prop', principal?, group?, affect?: {fear, weight, suspicion, cunning, heat} } },
  objects: { id: { kind, material, at?: [x,y,z] | track?: [[t,[x,y,z]],...], holder?: 'actor:R', touches?: [ids], exit?, affords: [...] } },
  authored: { intents, holds, stimuli, goals, couplings, machinery, causal, camera?, coupled? },
  params, params0, bands, events, measures, log: { homeostat, patches } }
```

Lanes, top to bottom: VOICE STIMULUS INTENT ACTION CONTACT | ROOT WEIGHT TORSO HEAD GAZE ARM.L ARM.R HAND.L HAND.R LEG.L LEG.R FACE
PROP | CAMERA LIGHT SET/VEHICLE FX. An event: `{id, lane, actor?, actors?, t0, t1, kind, label, because: [{id, latency, rel?}],
lanes?, params?}`. An ACTION carries the body lanes it moves in `lanes`. `because` is the causal graph (rel: `anticipates` for a
body's preparation before its intent's nominal start, `realises` for an intent that realises an utterance). `validate()` checks that
causes exist and precede their effects.

## Authoring a scene module

`tools/perform/scenes/<scene>.js` exports `author(M, X)` where `M` is the marks and `X.voiceOf(clip)` gives
`{phrases, stresses, words}` for a clip (words placed on the voice's phrases by their letters). It returns
`{type, title, actors, objects, authored}`. Times come from the take: `M.keys` (each key `{id, t, win:[t0,t1], snap, moves}`), the
clips' words, the stresses. See `scenes/OD-B01-S03.js` (acting: dialogue, a handoff) and `scenes/OD-B09-S09.js` (a coupled
homeostat decides the timings).

An intent: `{id, actor, kind, t0, t1, target?, utterance? (a clip gi), key? (the blocking key whose walk it owns), label, params,
because: [{id}]}`. A hold: `{id, actor, t0, t1, reason, params: {look: [[target, seconds], ...], weight: bool, grip: 'R'|'L',
still: bool, offset}, because}`. A stimulus: `{id, t0, t1, kind (SOUND, SIGHT, SCENE, WORD, NEEDLE, ...), label, actor?, because}`.
A target is an actor id, an object id, or a point `[x,y,z]`.

### The CAMERA lane (what the cinematographer reads)

Kept stable for tools/cinematographer/plan.js. Events `{lane: 'CAMERA', t0, t1, kind, label}`: `FOLLOW` (a request: the camera to
the causal hot spot, `authored.camera.follow`), `ELIDE` (a request: cut before effects, `authored.camera.elide`), and one derived
event per shot of the take's own cut (`kind` the shot kind, `derived: true`). The planner also reads, unchanged in format: INTENT
events (speech kinds, holds), VOICE UTTERANCE and NARRATION, CONTACT events with `actors` (GRIP, GRIP SYNC, IMPACT, SEIZE, PUSH, PARRY,
TOUCH, RIDER, PUSH), STIMULUS events with their causes, the measures' `after` series, and the sheet's `creatures` (with `present`
windows and `floor`). New lanes or kinds are added, never renamed.

### Intent kinds and their parameters

- `ATTEND {target, params.track}`; `NOTICE {target, params.gazeHold}` (the double take); `SHAME {params.lookAt, hold}`;
  `DECIDE`; `LISTEN {target, params.nods: [t]}`; `REACT {params: how (nod|laugh|lean|flinch|startle|turn), lookAt, latencyScale}`.
- `HOLD` (see above). `STEP {target, params.dist (heights, + toward), dur}`. `SET_DOWN {params.side, what}` (hides the held prop).
  `RISE`. `ARRIVE {params.from: [dx,dz], dur}`. `KNOCK {params.stim}` (writes a SOUND stimulus). `APPROACH {key, target}` (owns the
  blocking walk; the head tracks the target).
- `WELCOME` / `GUARDED_WELCOME {target, utterance, params: approach, openness, headLead, weight, handToSpearDelay, gazeHold,
  backBias, maxBeats, beatsOnlyKey, side}`: PRE (the head acquires the target), ON STRESS (the act's gesture), AFTER (the gaze held),
  TRANSITION (the handoff and the lead are their own intents).
- `TAKE {target (giver), params: prop, from 'giver:R', to 'receiver:R', word, of (the speech intent), reach}` with
  `OFFER {params.with (the TAKE id)}`: the grip instant is the word + the speech act's handToSpearDelay; both hands are solved by
  forward kinematics to a meeting point; CONTACT GRIP SYNC; props `give` (persistent state at t).
- `LEAD {params: path [[x,z],...], speed (heights/s), freeArm}` / `FOLLOW {params: leader (LEAD id), path, speed}`.
- `GAMBLE {params.throws: [t]}` (writes stimuli `dice:<actor>:<k>`), `DRINK {params.at}`, `POUR {params.at, cupOf}`,
  `GESTURE {params: shape (open|point|chop|fist|chest|dismiss|plead|recoil), at, side, amp, hold}`.
- `SIGNAL {params: how (go|hush|flee), to: [ids], lookAt, side}` (the signalled answer); `HEAT {params.glowAt, glowId}`;
  `CARRY {params.with}`; `THRUST {target, params: with, impactId, impact}` (CONTACT IMPACT); `TWIST {params.period}` (FX steam);
  `STRAIN`; `RECOIL {params.from}`; `HIDE {params: from, to}`; `CLING`.
- `ADVANCE {params: key, arrive}` and `RETIME {params: key, delay}`: a blocking move to a key started early or held, as a whole
  (root, heading, every joint, the legs walking).
- Combat: `THREAT {target, params.side}`, `SHOOT {target, params: draw, hold, looseId}` (SOUND stimulus at the loose),
  `IMPACT {params: until, label}`, `FALL {params.key}`, `DUCK`, `EVADE`, `SEARCH`, `LEAP {params.landId}`, `POUR_OUT`,
  `SEPARATION`, `RETARGET {target}`, `RECOVER`, `PURSUIT {target}`.

Every realiser writes through `X.move(actor, layer, kind, cause, k => { k(t, {channel: value | X.sheet.rel(d) | {abs: v}}, ease) })`
(a move starts from where its lane is; `{abs}` is an absolute joint angle, converted to an offset over the blocking's pose) and
`X.look(actor, target, t, cause, opts)`. Layers: `gaze act grip loco weight react mech limit`. Add a kind by adding a function
`(X, I, e)` to `intents.js` or `intents-action.js`.

### More kinds (intents-extra.js)

- `ROW {params: clock (a name), period, origin, offset, amp}`: every ROW of one clock strokes on its period from its origin, each body
  at its own offset; a rower who joins late comes in on the phase (the ROWING machinery and ROW share `machinery.js stroke`).
- `GRIP {target, params: point (shoulder | arm | wrist | hand | waist | neck | head | back), side, targetSide, reach, answer}`: a
  held grip. A solver (after the sheet is written) finds, every sixth of a second, the arm pitch, arm out and lean that put the hand on
  that point of the other body as the sheet poses it; the CONTACT GRIP carries the residual series (units) with its mean and worst.
  `answer: 'struggle'` makes the held one fight it.
- Attacks: `STAB`, `CLUB`, `PUNCH`, `SHOVE` (the pushed one's STAGGER is caused by the CONTACT PUSH), with `params.hit`: a hit is a
  CONTACT IMPACT, a miss a MISS and an OPENING stimulus. Defences: `PARRY` (CONTACT PARRY and a DEFLECTED stimulus on the attacker),
  `DODGE` (a side step and lean, `params.to`), `CATCH` (a GRIP on the attacking wrist). `ATTACK {params.kind}` and `DEFEND
  {params.kind}` dispatch to these, SWING, BLOCK and DUCK.
- `LOCOMOTE {path, speed}`, `LEAVE {to}`, `CIRCLE {target, radius, turn}`, `RIDE {period}`, `CLIMB {rise, period}`, `SWIM {period}`,
  `DROWN {sink}` (the breath stops at its end), `WEAVE {period, at}` (the shuttle, the beater: a CONTACT TOOL each pass),
  `MOVE_STONE {target}`, `CARESS {target, side, strokes}`, `WAKE {rise}`, `DIE {key}` (the fall, then no breath).

### Machinery

`authored.machinery: [{kind: 'ROWING', clock: {period, t0, t1}, offsets: {actor: fraction}, amp, busy}, {kind: 'SIRENS_CHAIN', ...}]`
(see `machinery.js`). Couplings for the heat: `authored.couplings: [{from, to, via (a material), k?, t0, t1, env?}]`.

`{kind: 'SEA', level: [[t, 0..1]], causes: [{t, id}], hulls: [{id, piece, pivot, riders, gain, omega, zeta, impulses: [{t, roll,
pitch, id, label}]}], swimmers: [{actor, t0, t1}], rowers: [ids], fx}`: the sea as an actor. A wave field of three crests scaled by
the level; each change of level is a `SEA RISES` / `SEA FALLS` event caused by the scene step named in `causes`. Each hull is a
damped oscillator in pitch and roll, driven by the slope under its pivot and by the impulses; its heave is the crest. It writes
`rigs[id]` (a ship rig: the player turns the piece and its riders). Standing riders who are not rowers get a BALANCE move against the
deck. Swimmers ride the swell (`root.y`, lean, roll). SPLASH FX mark breaking crests. The sea is an object of water with a heat
source (level x crest speed) marked `room`: on a stage of one or two figures, contrast is read against it.

Ropes. A ROPE intent with `params.at` also records its window in the sheet's `ropes` (`[{how: bind|haul, by, at, t0, t1}]`). The take
(odyssey-take.js `ropeLive`) then winds the key's rope (`k.rope`: post, heights) turn by turn over the binding, with the live end in a
binder's hand, as thin coils round the man's body where it is at each drawing and round the mast as the hull rolls it
(`OdysseyChoreo.player().ship()`), and runs the hauled ends to the haulers' hands while they haul, in place of the key's static loops.

Ship riders are an id or `[id, t0, t1]` (a window: thrown off at a SEPARATION, back aboard at a RECOVER). choreo.js, body.js,
metrics.js and thermo.js all honour the window (`Body.rides(R, id, t)`).

### Creatures

`authored.creatures: {id: {kind, scale, at: [x, y, z, h] | place: {preset, box | center, y, h}, procs}}` declares a giant, a ram,
a dog or Scylla (film-readymades/creatures.js kinds: polyphemus, laestrygon, ram, dog, cattle, scylla). `place` fits a preset's body
over the take's set piece (the box's centre and floor). The compiled sheet carries them in `creatures` (the rig's own format:
`procs` and `channels`, see film-readymades/CREATURES.md). An intent whose actor is a creature is realised by `intents-creature.js`:
POSE, SLEEP, TALK (the jaw on the voice's phrases), STIR, BLINDED, ROAR {place}, WALK {path} (heavy for giants, a gait for animals),
GROPE, REACH, SEIZE (the man rides grip.R from the grip: a CONTACT GRIP event), EAT, THROW (a rock's parabola as a PROP FLIGHT event
and a `rock` object with a track), HERD, STRIKE {targets} (Scylla: riders on the jaws), ATTEND/LISTEN, RECOGNISE, INVOKE, GESTURE.
Each is an ACTION event on the creature with lanes mapped from its channels (elbows to the arms, knees to the legs, jaw and eye to
FACE). A creature that is also an object of the score (`objects[id]`, `actors[id].body: 'prop'`) gets a heat source from its own
motion (the larger of that and any authored source), and its head decides whether it is on screen for C_T. A figure a creature
carries (`riders`) is placed at the anchor by body.js (`carried`) and skipped by the slide and balance checks. The first-score
builder finds creatures in the take's keyframes (odyssey/keyframes/<scene>.json: a prop named polyphemus..., laestrygon..., ram...)
and places them where the take puts the prop. The film's player does not load the rigs yet (CREATURES.md, "Wiring it into the
film"): the take shows its staged prop; the previz, the metrics and the heat use the rig.

More creature kinds: `MOVE_STONE {target, to, object}` (both hands on the stone, its track a PROP MOVED event and the object's
track), `DRINK {gulps}`, `CARESS {target, anchor, strokes}` (reach procedures drawn along a ram's back), `FAWN {target, path}`,
`GRAZE`, `CARRY {riders: [{actor, at, lie, from, to, offset}]}` (CONTACT RIDER), `CHANGE {man, at}` (the beast's half of TRANSFORM:
see below). A beast's small acts (Argos, OD-B17-S03): `WATCH {target, lift, hold}` (the head kept on a moving figure, re-aimed every half
second, the ears pricked), `EARS {how: drop|prick}`, `WAG {period, amp, fade, lift}` (the tail's beat, weakening), `BREATHE {period, depth}`,
`DIE {roll, sink}` (the head to the ground, ears and tail slack, the body rolled onto its side; a HOLD 'dead' after). Kinds: polyphemus, laestrygon, ram, dog, cattle, scylla, and Circe's pig, wolf and lion (cut from the set pieces' 87621p01,
48812 and 14734 by tools/creatures/build.js).

Where a creature stands. `place` puts a preset's body over a box or a centre on the ground the take finds there
(`ground.js`: the probe's ray grid, which keeps each surface that faces up with air over it, so a cave's floor under its roof; the piece
boxes for a scene not yet probed), and the sheet records it as the creature's `floor`. The player casts the take's own ray under the
rig from just above that floor at every drawing (cached by cell) and lifts or lowers the rig by the difference
(`creatures.js sample(..., {ctx: {ground}})`), so a walk goes over the set as it is. A creature's `present: [[t0, t1], ...]` are the
windows in which the take stages its prop (the first score reads them from the keyframes); outside them it is not drawn.

Where a creature stays. A `gait`, `heavy`, `herd` or `place` procedure leaves the root where it ended until a later procedure moves it
(the rise of ROAR is a `place`; before this the rise's root keys pinned the Blinding's giant, who never walked to the door). Keys on a
lane named `channel@span` hold only between their first and last key (a place taken for a moment: the in-between of a change, a
flock's place at one key).

TRANSFORM as a part swap. The man goes down on all fours over the four drawings on twos before the middle of the key's window (where
the take stops drawing him); the beast's CHANGE puts its `morph` channel at 2 for the drawing before: only the animal's head is drawn,
set on the man's head (the pig's face is the minifig pig headdress 17351p01; a wolf's or lion's own cut head), then at the swap the
beast in its own place. `morph` 1 draws nothing.

The eye. The Cyclops' eye states come from parts the packs have: open (the black round tile), half shut (a 1 x 2 tile in his skin over
the upper half of the white), shut (a 2 x 2 round tile in his skin over the eye), put out (the round tile dark red). A swap state may
carry extra meshes: `[part, colour, [{part, col, m}]]`.

### The coupled homeostats

Each director's module that decides its timings by needles has its model in `machinery.js`: `blinding` (OD-B09-S09), `stake`
(OD-B09-S08: rage and restraint, appetite, terror, the work whose integral is the stake's progress), `rams` (OD-B09-S10: the flock's
pace, the searching hands' suspicion, the crew's fear, Odysseus's hold; a search that must miss: detection is the failure), `strait`
(OD-B12-S04: fear loses strokes, the ship's way brings Scylla's hunger up), `taunt` (OD-B09-S11: rage by ear on the taunt's stresses,
the rock, the sea's blow and push), `storm` (OD-B12-S07 and OD-B05-S05: a god's anger, the sea, the vessel's integrity, the hero's
endurance), `harbour` (OD-B10-S02: the town roused brings each giant in, each rock a blow to the fleet and to his alarm; he cuts the
cable in resolve between 0.7 and 0.95, frozen above it). `homeostat.couple(spec, {frozen})` runs them; `perform.js author <scene> --variant <name> [--frozen] --force` writes a
disturbed or held run beside the baseline (`odyssey/score/variants/`).

### Scene types and bands

`dialogue`, `fight`, `revelation`, `machinery`, and two more: `transformation` (motion warm to hot [0.2, 0.5], causes warm, contrast of
one body lit [0.03, 0.3]: Circe) and `escape` (motion cool, causes warm, one body lit: the rams).

### The causal model

`authored.causal: {tau, actions: {actor: [{a, base, f: {'feature:arg:arg': weight}, uses: [object ids]}]}}`. Features (thermo.js):
`dist:x`, `near:x:r`, `sees:x`, `seated[:x]`, `walking[:x]`, `holds:prop`, `intent:KIND`, `after:eventId`, `threat:x`,
`speaking[:x]`, `open:door`. p = softmax(u / tau), S_c = -sum p log2 p. A first score from the needs catalogue (`scenes/_auto.js`) declares a
generic model, marked `generic: true`: stay; each of the figure's own intents (rising while it runs and after its chain step); turn
to a principal (more while he speaks, less once seen); leave (non-principals, under a principal's heat); answer each chain step
(principals, until the next). H2 is then the change rate of those options, not of a director's.

## Compiler parameters (the homeostat's selectors, 25 positions each)

`latency amp separation threat attack pause camera affordance env horizon focus` (compile.js PARAMS: range and default). amp scales
every expressive move (act, react, weight layers); focus cools figures the scene does not name as principals.

## Metrics, temperatures, homeostat

States per actor per drawing: ACTION, REACTION, ALIVE_HOLD (authored HOLD, or attention on something active, or a motivated state
change within 2 s), DEAD. The report: coverage, literal movement, unmotivated freeze and action, reaction latency, gesture density,
channel diversity, contact integrity, pose legality, balance. Temperatures: T_m (heights/s squared, integrated, conducted), S_c
(bits), T_media (0-1, McLuhan's definition, not thermodynamics), C_T (hottest on screen minus the room), V (violations).
Homeostat essential variables H1-H4 with bands by scene type (homeostat.js WORD, TYPES); patches set bands relative to the scene's
current reading.

## Rebuilding the player

The film player (`film-readymades/production/Film-Butter-Odyssey.html.gz`) carries, beside what `build_odyssey.py` builds, four
working-tree files that a rebuild does not put back by itself: `motion.js`, `choreo.js`, `creatures.js` (the creature rigs a sheet's
`creatures` plays) and `odyssey-take.js` (the take, with its [choreo] hooks: the choreography player, the ship rigs and their rider
windows, and the creature stage that loads the rigs and hides the staged prop of the same id). The sequence, from the repository root:

1. Take the lock: wait while `/tmp/claude-0/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/scratchpad/bundle.lock` exists, then
   create it with your name and the time (`echo "<name> $(date -u +%FT%TZ)" > .../bundle.lock`).
2. Rebuild if you need to: `python3 film-readymades/build_odyssey.py` (never `odyssey/trailers/build_trailers.py`).
3. Re-apply every patch, always, after any rebuild: `python3 film-readymades/patch_motion.py --take`. This one command embeds
   motion.js, choreo.js and creatures.js as their own scripts, refreshes the trailer runtime, and replaces the take block with the
   working-tree `film-readymades/odyssey-take.js` (the creature and choreography hooks live there; there is no separate creature
   patch). It prints the size and fails if the .gz is 95 MB or more.
4. Check: `curl -s localhost:8899/film-readymades/production/Film-Butter-Odyssey.html.gz | zcat | grep -c 'data-odyssey-creatures'`
   prints 1, and `grep -c creaturesStage` on the same stream prints at least 1.
5. Delete the lock.

A render already running has loaded the player and is not affected by a rebuild; do not start a render (tools/export-odyssey.js)
while the lock exists. After a rebuild, a render of a scene whose sheet has `creatures` logs `creatures {"<id>":{"kind":..,"meshes":N}}`
in its export log: N > 0 means the rig was attached.

## Hooks for later work

- A creature rig (film-readymades/creatures.js, to come) gives a giant or a quadruped channels: add them to body.js's pivot tree,
  to choreo.js's CLAMP and applyRig, and write GIANT_RIG / QUADRUPED intents (SEIZE, EAT, THROW, HERD) here.
- The needs catalogue (odyssey/perform/needs.json) lists the kinds scenes ask for (see intents-extra.js for the ones added since). Present: the three intent files above, ROPE (bind,
  haul), SEAL, SING, BECKON, STEER, PLEAD_BOUND, ROWING and SIRENS_CHAIN machinery; gesture shapes open point chop fist chest dismiss plead
  recoil offer invoke taunt describe mime oath reach show, SEA (hulls, rafts, swimmers, rowers on one clock). TRANSFORM (the man down
  onto all fours over four drawings on twos, ending at the key where the take swaps him for the animal: a SWAP event keeps his
  identity; the beast's CHANGE draws its face on him for the drawing before). Missing: a hull breaking up into pieces (the Thunderbolt's
  wreck is the take's cut, the sea's impulse and the men thrown). Ships translate (a rock's wave pushes a
  hull toward the shore: `dx`, `dz` channels) and creatures act (see Creatures).
- `tools/perform/pagedata.js` builds the page's data; `perform.js desk <scene>` writes the engine's lanes into the rig desk's score.
