# Nobody's Hands: the Odyssey, played by hand

The whole *Odyssey* is played as voiced LEGO cinema on the Regulars' Cut (`odyssey/kits/cut.json`): 102 kept scenes in 24 books, about 84 minutes. At eight turns of the poem your hand takes over, and the object that performs the moment is the thing you play (the raft, the stake, the bag, the mast, the bow, the bed). Hand Butter is the engine.

| Page | What it is |
|---|---|
| `play/odyssey-game.html` | The desktop game. It is the Hand Butter 26 workspace (`play/hand-butter-odyssey.html`) with the game layer injected by `tools/odyssey-game.js`. It is 29 MB, and scene cards, parts and audio load by URL. |
| `play/odyssey-mobile.html` | The phone game in **one file** (about 20 MB), built by `tools/odyssey-mobile.js`. It holds all code, a baked geometry bank for every part the game shows (`tools/odyssey-mobile-bake.js`), and every voice line of the cut. Only the music beds stream, from `odyssey/take/bed/`. On GitHub Pages: `https://hartswf0.github.io/tractor-dce-gyo/play/odyssey-mobile.html` |

URL options: `?book=9` starts the poem at Book IX. `?level=03-cyclops` plays one trial. `?speed=3` runs the game clock faster (used by the tests). `?lite` turns shadows off. `?mute` starts silent. `?render=ms` (tests only) draws the 3D view at most that often, so a starved software-GL page keeps the game's clock and Butter's hand tracks alive; the tests force a frame before every screenshot.

## Playing on a phone

Open **https://hartswf0.github.io/tractor-dce-gyo/play/odyssey-mobile.html** in the phone's browser (Safari on iPhone, Chrome on Android), portrait or landscape. It is one 20 MB page: once it has loaded, every scene, part and voice line is on the phone, and only the music beds stream (without a connection the books play without music). Phones start sound only after a touch: if a scene is silent, tap **Sound**.

1. The **chart** opens: the 24 books on the Aegean. Tap a book to see its card, then **Play book**; or tap one of the eight **Trials of the hand** to play it alone. Gold books are sailed; a red ring marks a book with a trial.
2. In a **cinematic**, **Skip** jumps to the next scene, **Chart** goes back, **Sound** mutes.
3. At a **trial**, read the card and tap **Begin**. The gestures with fingers:

| Trial | With a finger (or two) |
|---|---|
| 1 · The Opening | touch and hold where Athena should go; move the finger along the waymarks |
| 2 · Calypso's Isle | drag each timber from the pile onto its green ghost on the keel and let go (it clicks when its studs seat); then drag the keel toward the sea |
| 3 · The Cyclops | drag the stake's point into the fire and hold until it glows; with the finger down below the eye, flick up into it; then drag each man under a ram before the lane darkens and the hand sweeps it |
| 4 · The Bow | put two fingers down and spread them to string the bow (or drag one finger away); then press, bring the swaying sight onto the line of rings, and lift to loose |
| 5 · The Bag of Winds | when a crewman reaches (a red ring fills), hold a finger on the bag; lift between reaches to rest your grip |
| 6 · The Sirens | circle a finger round the mast three times to bind him; then swipe up and down to row |
| 7 · Scylla and Charybdis | hold a finger and steer left and right through the strait |
| 8 · The Bed | drag the bed up (it will not move); hold on the root; drag Penelope to Odysseus |

**Hands** turns on the camera and MediaPipe (fetched from its CDN only then): the poses below then work on a phone as on a computer.

## How to play

Press **Hands** and allow the camera. MediaPipe tracks your hands in a worker; Hand Butter smooths the tracks and reads your pose. Hold your hands about 50 cm from the camera, palm toward it. A drawn skeleton shows what the game sees.

Everything can also be done with a mouse, a finger or the keys:
- One finger is the pointer.
- Two fingers are the two hands.
- Arrows move a key cursor, **Tab** jumps it to the next target, and **Space** presses.
- **S** skips a scene. **M** opens the chart. **R** replays. **N** continues.

The poses are the ones Hand Butter's own classifier (`gestureOf`) reads:

```
 POINT        PINCH          FIST          OPEN          V
   |         _/\ ||          ___         | | | |       \ /
   |        (_ ) ||         |___|        | | | |        V
 _|||_       |____|          |__|        |_____|      _|||_
 index out   thumb touches   all folded    all four    two out
 the rest    index tip,      in, thumb     up, thumb   (Butter's
 folded      three fingers   across        out          copy gesture)
             up
```

- **Thrust**: push your hand toward the screen, so the hand grows by 30% in the image within half a second. On a phone or mouse, flick upward while pressing.
- **Circle**: trace circles with a finger.
- **Pump**: move your hand up and down; each reversal is a stroke.
- **Pull**: pinch with both hands and draw them apart.
- **Steer**: move an open palm left and right.

## The poem: what plays, and what the hand does, book by book

**Scenes** are voiced cinematics. Each is staged on its Butter scene card (`odyssey/butter/OD-*.json`), with:
- the kept voice segments as one clip, and captions from the halfworld's spoken lines;
- the book's BRONZE COUNCIL bed, ducked under the voice (0.18 falling to 0.10, with 150 ms ramps);
- halfworld faces put on the baked figures of the twelve, where the previs places them;
- the gate-checked key cameras for the 31 keyframed scenes, and automatic coverage (wide, mid, close) for the rest. All shots avoid parts that block the view and put a person's head on the upper third of the frame.

**Trials** are the hand levels. A trial replaces its scene or scenes, which remain the fallback: *Watch the scene instead*. **Touches** are small hand actions inside a scene. They light up for the length of their segment, add 30 kleos, and never hold the story.

| Book | Title · place | What plays | The hand |
|---|---|---|---|
| I | Athena Inspires the Prince · Olympus · Ithaca | The Gods Consider Odysseus (keyframed) → Athena's Two-Part Plan → **TRIAL 1: The Opening** (plays The Stranger at the Threshold) → Athena Arms Telemachus with a Course | trial: point; touch: take the stranger's spear (pinch) |
| II | Telemachus Sets Sail · Ithaca: the assembly | Telemachus Calls the Assembly → The Secret of Penelope's Loom (keyframed) → _bridge_ → The Night Launch → _bridge_ | touch: unweave the shroud (sweep) |
| III | King Nestor Remembers · Pylos | Telemachus Questions Nestor → _bridge_ → Athena Reveals Herself at Pylos → _bridge_ | touch: pour the libation (pinch and tip) |
| IV | The King and Queen of Sparta · Sparta | Recognition through Tears → Helen's Drug and the Beggar in Troy → The Wooden Horse (keyframed) → Menelaus Wrestles Proteus (keyframed) → The Suitors Prepare an Ambush | touch: Helen circles the horse (circle) |
| V | Odysseus: Nymph and Shipwreck · Ogygia | Hermes Carries the Decree → Odysseus Distrusts Freedom → **TRIAL 2: Calypso's Isle** (plays Building the Raft) → Poseidon Breaks the Sea (keyframed) → The River Accepts the Castaway | trial: pinch and place |
| VI | The Princess and the Stranger · Scheria | Athena Enters Nausicaa's Dream → Laundry and Ball at the River → The Naked Stranger Emerges (keyframed) | touch: catch the ball (pinch) |
| VII | Phaeacia's Halls and Gardens · Scheria | Athena Hides the Walk through Scheria → The Palace and the Gardens → Supplication at Arete's Knees → Arete Recognizes Her Work | touch: clasp the queen's knees (fist) |
| VIII | A Day for Songs and Contests · Scheria | The Phaeacian Assembly and the Ship → The Trojan Horse Song and the Name (keyframed) | touch: hand Demodocus the lyre (pinch) |
| IX | In the One-Eyed Giant's Cave · the Cyclops | Odysseus Names Himself → The Raid on the Cicones → The Lotus-Eaters (keyframed) → Goat Island → The Empty Cave → Polyphemus Seals the Cave → The First Killings → **TRIAL 3: The Cave of the Cyclops** (plays The Name Nobody and the Stake, The Blinding, Escape beneath the Rams) → The Boast and the Curse (keyframed) | trial: hold, thrust, tuck |
| X | The Bewitching Queen of Aeaea · Aeolia · Aeaea | **TRIAL 5: The Bag of Winds** (plays Aeolus and the Bag of Winds) → The Laestrygonian Harbor (keyframed) → Scouts on Aeaea → Circe Transforms the Crew (keyframed) → Hermes Gives the Moly (keyframed) → Odysseus Defeats Circe's Spell → _bridge_ → The Road to the Dead | trial: fist; touch: take the moly (pinch) |
| XI | The Kingdom of the Dead · the Dead | The Blood Pit Opens (keyframed) → Elpenor Asks for Burial → Tiresias Names the Cost → Anticleia and the Three Embraces → _bridge_ → Achilles Chooses Life → _bridge_ | touch: hold the shades back (point) |
| XII | The Cattle of the Sun · Sirens · Scylla · the Sun | **TRIAL 6: The Sirens** (plays The Sirens' Song) → **TRIAL 7: Scylla and Charybdis** (plays Between Scylla and Charybdis) → The Island of the Sun → The Cattle Are Slaughtered (keyframed) → Zeus Destroys the Last Ship (keyframed) | trials: circle and pump; flat palm |
| XIII | Ithaca at Last · the shore | The Phaeacians Carry Odysseus Home (keyframed) → Odysseus Wakes → The Cretan Lie → The Treasure Is Hidden → Athena Makes the Beggar | touch: seal the treasure cave (thrust) |
| XIV | The Loyal Swineherd · Eumaeus's hut | The Dogs at Eumaeus's Yard (keyframed) → The Swineherd Laments His Master | touch: calm the dogs (open palm) |
| XV | The Prince Sets Sail for Home | Athena Wakes Telemachus → _bridge_ → Telemachus Lands in Secret | touch: row ashore (pump) |
| XVI | Father and Son · the hut | The Son Reaches the Hut → The Father Reveals Himself (keyframed) → The Plan against the Suitors → The Beggar Returns | touch: the embrace (open palm) |
| XVII | Stranger at the Gates | The Road with Melanthius → Argos Recognizes His Master (keyframed) → The Beggar Enters His Hall → Antinous Throws the Stool | touch: stroke old Argos (sweep) |
| XVIII | The Beggar-King of Ithaca · the hall | Odysseus Drops Irus → Penelope Appears before the Suitors → _bridge_ | touch: drop Irus (fist) |
| XIX | Penelope and Her Guest · the hall by night | The Weapons Leave the Hall → The Stranger Describes Odysseus → Eurycleia Finds the Scar (keyframed) → The Boar Hunt → The Dream of the Geese → _bridge_ | touch: point to the scar |
| XX | Portents Gather · the last feast | The Herdsmen Arrive → The Hall of Death | touch: shield your eyes (open palm) |
| XXI | Odysseus Strings His Bow | Penelope Retrieves the Bow → The Contest Is Set → The Suitors Fail the Bow → Odysseus Recruits the Herdsmen → The Beggar Requests the Bow → The Doors Are Secured → **TRIAL 4: The Bow and the Axes** (plays The Bow Sings) | trial: pull, aim, open |
| XXII | Slaughter in the Hall | Antinous Falls (keyframed) → Eurymachus → The Storeroom → Melanthius → Athena Tests the Battle → The Hall Is Cleared → The House Calls Penelope | touch: loose the arrow (pinch) |
| XXIII | The Great Rooted Bed · the chamber | Eurycleia Wakes Penelope → Penelope Studies the Stranger → The False Wedding Noise → **TRIAL 8: The Bed** (plays The Bed Test) → _bridge_ | trial: lift, point, embrace |
| XXIV | Peace · Laertes's farm | The Scar and the Orchard Trees → Athena Makes Peace | touch: make peace (open palm) |

## The chart

The voyage chart is the Aegean as a studded blue baseplate, with the land in brick and Ithaca drawn large. It shows all 24 books where they happen: gold means sailed, a red ring means the book has a trial, and a pulsing ring marks where you are. Progress is saved in `localStorage` (a private window simply forgets). From the chart you can:
- **Continue** from where you left off;
- **replay** any book;
- play any of the eight trials alone.

## The eight trials

| # | Trial | Book | Hand | Mouse / touch | Keys | Win | Lose |
|---|---|---|---|---|---|---|---|
| 1 | The Opening (tutorial) | I | point: Athena follows your fingertip down Olympus, along five waymarks | hold and move | arrows; Tab to the next waymark | Telemachus welcomes her at the gate | time |
| 2 | Calypso's Isle | V | pinch a timber, carry it onto the keel, open over its green ghost (Butter's stud magnet and exact stud test click it); then sweep an open palm to launch | drag and drop; drag toward the sea | Tab, Space | 5 of 5 parts seated, the raft floats | time |
| 3 | The Cave of the Cyclops | IX | pinch the stake and hold it in the fire until it glows; thrust at the eye; pinch each man and tuck him under a ram before the giant's hand sweeps his lane | drag; flick up; drag | Tab, Space | all free men out under the rams | 3 missed thrusts; more than 2 men caught; time |
| 4 | The Bow and the Axes | XXI | two pinching hands pulled apart string the bow; hold the pinch and bring the swaying sight onto the line of twelve rings; open to loose | drag away (or two fingers); press and aim, release | hold Space; Tab aims | clean through all twelve | three arrows clang |
| 5 | The Bag of Winds | X | when a crewman's arm reaches (a red ring fills), close a fist over the bag; your grip tires, so rest it between reaches | hold the button or finger on the bag | hold Space | Ithaca's fires reached | a hand reaches unopposed and the winds burst |
| 6 | The Sirens | XII | circle a finger to wind the rope round Odysseus and the mast; pump a hand to row while the song pulls toward the rocks | circle-drag; swipe up and down | C; Up and Down in turn | past the isle | the ship drifts onto the rocks |
| 7 | Scylla and Charybdis | XII | an open, flat palm steers; heads rear, then strike the left of the channel; the whirlpool pulls from the right | pointer or finger x | Left, Right | through the strait (kleos = men kept) | Charybdis, or every man taken |
| 8 | The Bed | XXIII | pinch the bed and lift (it will not move: it is pinned, rooted); point at the root under the opened floor; bring two open hands together | drag up; hold on the root; drag Penelope to Odysseus | Tab, Space + Up; Space | the embrace | time |

**Kleos** is scored as 600 × accuracy plus 400 × time (full marks at or under par). Three stars from 850, two from 600.

## Sound

- **Voice**: the halfworld recordings. `tools/odyssey-game-story.py` cuts every kept segment of the cut into `cut/<scene>.ogg`. `tools/odyssey-game-audio.py` cuts the level lines into `voice/`; they are resolved through `drive/voice-manifest.json`, `drive-script.json` and `viewer/spoken-lines.json` in `/home/user/odyssey-halfworld`, which is read only.
- **Music**: BRONZE COUNCIL, one track per book (`odyssey/take/bed/`). The five tracks that were missing were copied from the halfworld.
- **Effects**: the trailer's synthesised library (`tools/trailer-sound.py` FX), rendered to `sfx/`. The Sirens' song is an oscillator choir.

## Files

- `tools/odyssey-game.js` is the desktop builder. It adds a hook in `processHands` that hands Butter's smoothed tracks to `OdysseyHands.take`, gives the game its own store keys, and adds the script tags.
- `tools/odyssey-mobile.js` builds the one-file mobile page, and `tools/odyssey-mobile-bake.js` bakes its geometry bank.
- `tools/odyssey-game-story.py` builds `story.json` and the cut audio; `tools/odyssey-game-audio.py` builds the level lines and effects.
- `play/odyssey-game/*.js` is the game layer:
  - `engine.js` is the bridge to Butter: camera, props, card staging, actors and faces, and the carry built on Butter's transaction.
  - `input.js` holds the hand hook, mouse, touch and keys, and the recognisers.
  - `synth-hand.js` builds synthetic landmarks.
  - `audio.js`, `hud.js`, `map.js`, `cinema.js`, `story.js` and `game.js` handle sound, the HUD, the chart, the cinematics, the poem runner and the level runner.
  - `levels/*.js` and `levels/*.json` are the trials; `mobile/butter-lite.js` is the phone's cut of Hand Butter.

## Tests

The http server must be running on :8899, serving the repository.

```
node tools/odyssey-game.js && node tools/odyssey-mobile.js                                   # build both pages first
NODE_PATH=…/node_modules node tools/test-odyssey-game.js --levels --render 600000            # every trial: synthetic hands, mouse/keyboard, and a loss
NODE_PATH=…/node_modules node tools/test-odyssey-game.js --frames                            # every shot of the keyframed scenes and each book's first scene
NODE_PATH=…/node_modules node tools/test-odyssey-game.js --spine --render 600000             # the whole poem, fast, trials solved with synthetic hands (--no-frames skips the frames pass it starts with)
NODE_PATH=…/node_modules node tools/test-odyssey-mobile.js --speed 1 --render 600000 --frames --no-spine   # the phone file, see below
NODE_PATH=…/node_modules node tools/test-odyssey-mobile.js --devices "Pixel 7" --orient portrait --speed 1 --render 600000 --no-trials   # + the spine by touch
```

- **`--render`**: on this machine one frame of a trial's scene takes 0.4–2.3 s of software GL, which starves the game clock and lets Hand Butter forget a hand track (it drops a track unseen for 750 ms). With `--render 600000` the game's logic runs every animation frame but the 3D view is drawn only when a test takes a screenshot; frame times, the cinematic check and the frames test always draw every frame.
- **Synthetic hands** are 21 MediaPipe landmarks per hand in the poses above. They are fed to Hand Butter's own `WagWorkshop.processHands`, so Butter's tracking, pinch hysteresis and `gestureOf` do the reading. The test first checks that Butter classifies all five poses correctly.
- **The phone test** (`tools/test-odyssey-mobile.js`) loads the one file under Playwright's `Pixel 7` and `iPhone 13` descriptors (viewport, pixel ratio, touch, mobile user agent; in Chromium, the only browser here), in portrait and in landscape. On each: the load to the chart, JS heap and frame time; nothing on the chart off the screen; a book card opened by tapping and a cinematic played; each of the eight trials played by touch (Chrome DevTools touch events: one finger, or two for the bow) to a win and again to a loss; no page errors; and nothing over the network but the music beds. `--frames` then sets up every shot of **every one of the 102 kept scenes** on the phone build and fails on a near-uniform frame, a broken camera, or a shot on a person whose head is off screen or below the middle.
- **The frames test** fails on a near-uniform frame (over 90% of pixels one colour) and on a person shot whose head is off-screen or below the middle of the frame.
- **Screenshots** go to `play/odyssey-game/shots/` and `shots/mobile/`, with results in `results*.json`.

## What is and is not verified

- **Verified here (headless Chromium, software GL, a shared and very busy CPU):**
  - Desktop: every trial played to a win with synthetic hands (Butter's `processHands`) and with mouse/keyboard, and to a loss.
  - Desktop: the spine walked from Book I to Book XXIV with every trial solved by synthetic hands.
  - Phone file, Pixel 7 and iPhone 13, portrait and landscape: loads to the chart, a book opened by tapping, a cinematic, and all eight trials won and lost by touch; the whole spine by touch on Pixel 7 portrait (all 24 books sailed).
  - Phone file: every shot of all 102 kept scenes set up and rendered (flat frames, broken cameras, heads off screen or low).
- **Measured (software GL, so only relative):** the phone file reaches the chart in 1.1–2.2 s from localhost with a JS heap of about 43 MB; the chart draws at 17 ms a frame; a trial's scene at 0.4–1.8 s and a cinematic at 2–3 s a frame at the phones' full pixel ratio, on a CPU rasteriser shared with three other browsers. A phone's GPU is not measured here.
- **Not verified: a real phone.** Emulation is Chromium with a phone's viewport, pixel ratio, touch and user agent: not Safari/WebKit, not a phone GPU, not a phone's memory limit, not real fingers (touches are exact CDP events).
- **Not verified: a live camera.** Headless Chromium has no camera, so MediaPipe's real landmarks were never seen here. Real hands are noisier than the synthetic ones, and the thresholds (pinch hysteresis, thrust = 1.3× growth in 0.5 s, stroke amplitude 0.06–0.07, circle turns) may need tuning on a real camera and in real light.
- **Not heard: sound.** Voice, beds and effects are wired and logged, but nobody listened here. Voice clips are Opus/Vorbis in `.ogg`, which older Safari may not play.
- **Timing.** Frame times here are a CPU rasteriser's; the trials are tested with the game clock at 1 and the 3D view drawn only for screenshots (`?render`), so they say whether the logic and the gestures work, not whether a phone keeps 60 fps. The per-run numbers are in `shots/mobile/results*.json` and the test logs.
- **Visual gaps:**
  - Halfworld faces go on the baked minifig heads the previs names: the card's printed head is hidden and a plain head carries the halfworld face, so there is one face, not two. A figure that is one of the twelve but not in the previs keeps its printed head.
  - Key cameras come from the film's staging, where cast were restaged. They are corrected here: named targets go to the baked head, and the camera turns to the face and around occluders. A few may still frame imperfectly.
  - The mobile bank is LITE: 8-segment curves, no stud logos, no underside tubes.
  - Some printed parts in the desktop build draw in a single colour, because the desktop cards use one material per part.
