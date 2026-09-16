# Odyssey production handoff — 15 September 2026

## Start here

This is a production laboratory with native LDraw geometry, short animated tests and a playable Word to World prototype. It is not a completed film. The latest user direction is to keep foraging and assembling iconic scenes, use real-place grounding, make locations visibly different, and preserve enough state for another LLM to continue.

Read this file, `production-state.json`, `odyssey-world/PLAYABLE-REHEARSALS.md`, and the named evidence before changing anything. Treat prior pasted proposals as context, not as proof of completed work.

Run from the extracted kit directory:

```sh
python3 odyssey-pipeline/serve.py
```

Open `http://127.0.0.1:8917/next-scenes.html` for the newest scene tests. Open `/native/word-to-world.html?world=odyssey&ground=real&as=odysseus-sword&place=Vathy%20Ithaca%20Greece&sky=day&weather=clear&mute=1` for scouting and playable rehearsals. Live map/terrain services and some CDN dependencies require internet.

In the working workspace the development source is `work/native`; packaged source is `outputs/odyssey-pipeline/native`. `python3 outputs/odyssey-pipeline/serve.py --port 8918 --native "$PWD/work/native"` serves the development copy. Avoid editing only the packaged copy of world code and then overwriting it with packaging.

## What exists now

- `../ODYSSEY-ASSEMBLY-v1.mp4`: 86 seconds, 1280×720, 12 fps, silent. Five blocking studies in narrative order: stake, Circe, Argos, axes, bed. This is an assembly for review, not a continuous finished sequence.
- `../ODYSSEY-NEXT-SCENES.mp4`: 32 seconds, Circe and Argos. Individual `ODYSSEY-CIRCE-TEST.mp4` and `ODYSSEY-ARGOS-TEST.mp4` are also included.
- `next-scenes.mjs`: reproducible native-geometry construction and 16-second animation for each new test. `next-scenes.html` has Play, scrub, matched evidence and frame-capture controls. Capture writes 192 JPEG frames per scene to `work/frames-next-*` through the local server.
- `evidence/next-scenes-build.json`: native part loads, assembly placements and sizes; `next-circe-{0,6,10,14}.png` and `next-argos-{0,6,10,14}.png`: matched frames inspected during this pass.
- Existing hero tests have rooted bed, shared stake and twelve axes. The hero geometry checks are separate from gameplay weapon prototypes.
- `native/world/odyssey-play.js`: horse and rehearsal-boat boarding/movement, sword proximity strikes, ballistic bow prototype, cave and Troy stage builders, ride checks and capture controls.

## Quality decisions — do not silently promote these

**Circe / OD-B10-S04:** useful ensemble and substitution-edit test. Men approach a service table; the same marks become native printed pigs; gates move; Eurylochus escapes. No drinking contact, animal gait, transformation morph or historically grounded palace is validated. The donor walls and pines are a staging kit. The sparse plate environment is not approved production design.

**Argos / OD-B17-S03:** useful camera-distance and two-men-beside-the-heap test. Native printed shepherd 92586p01 is explicitly REJECTED as final Argos: standing, young-looking, no ear/tail/head articulation. Do not rotate a rigid standing dog onto its side and call it a recumbent performance. The walking staff was removed after a grip-orientation failure. Build a low recumbent body with controllable head, ears and tail before refining the emotional close-up.

**World mechanics:** live horse rehearsal moved 7.0 m, turned and stopped; boat moved about 6.15 m, remained on its rehearsal water plane and stopped. Sword target reached 65/100 and arrow target 75/100. See `evidence/odyssey-interaction-checks.json`. Horses have rigid molded legs. Boat is a small native prototype on an explicitly bounded rectangular basin, not a navigable real coastline. Bow projectile is a harpoon stand-in. Mounted bow works; mounted sword does not. Cyclops is a static brick giant, not an enemy AI. Troy builder exists but has not passed visual review.

**Evidence gaps:** `odyssey-play-cave.png` is occluded by the horse; new Scene view control was added but not yet recaptured. Boat floor was repaired after its saved screenshot. Re-capture both before calling them current visual evidence. Run the Troy builder and inspect it next. Do not use these older screenshots as beauty frames.

**Real locations:** Vathy/Ithaca and Voidokilia have live scouting receipts. Modern footprints and road layouts remain references, even after earth colors and lamp substitutions. The screenshot's Hisarlik Mahallesi, Tire is NOT a validated Troy location. Check coordinates and labels before dressing any site. Film-location associations from pasted web summaries are research leads, not verified scene assignments.

## Forage acquired versus used

21343 Viking Village by Philippe Hurbain: original MPD preserved; 98 subfiles indexed. Ten extracted assemblies now exist: pinetree, pinetree2, GreatHallPillar, throne, forgewall, GreatHallDoor1, GreatHallDoor2, GreatHallBackWall, barrels, bridgeplank. New films use walls, pillars, one door type and pines. The other assemblies are available but not approved by their mere presence. Source headers and CC BY attribution are preserved. Native parts retain individual headers.

31120 Medieval Castle by Marco Orsi / marco9999: 95,208-byte source downloaded in `work/31120-medieval-castle.mpd`; 13 submodels indexed in `odyssey-world/castle-forage-index.json`. Not yet rendered or integrated. No license declaration found; source is outside the portable distribution, which contains the provenance index. Inspect L2/R2/F1 for usable masonry or gate assemblies; reject medieval signatures rather than copying the whole castle into Troy.

Sources: [castle author post](https://forums.ldraw.org/thread-26775.html), [Viking Village source](https://brickshelf.com/gallery/Philo/SetModels/Set21343/21343_-_viking_village.mpd), [Odyssey Book 10](https://www.theoi.com/Text/HomerOdyssey10.html), [Odyssey Book 17](https://www.theoi.com/Text/HomerOdyssey17.html).

## Best next tests, in order

1. **Cyclops: the boulder seals the entrance.** Use the existing shared stake and cave as scale references. Forage actual sheep/ram and boulder geometry. First solve giant-to-human scale, movable boulder, escape clearance and low camera silhouettes against a researched limestone cave mouth. Required evidence: three views, collision clearance, entrance open/closed and actor-under-sheep fit. No generic gray-room acceptance.
2. **Argos: recognition without a speech.** Build the missing recumbent hound performance. Keep the two men beside the litter heap, not on it. Head lift → ears → tail → Odysseus turns away. This is the strongest precision-acting test and exposes whether creature foraging supports the book.
3. **Sirens: rowing onward while Odysseus strains at the mast.** Forage a native hull, oars, mast, attachment clips and rope; test wrist/torso restraint, seated rower clearance and a continuous rowing cycle. Separate rigged ship motion from the current gameplay basin boat. Use a low coast/horizon with an offshore axis; avoid reusing the cave framing.
4. **Troy: a gate opens into fire.** First inspect the downloaded castle subassemblies and existing gate prototype. Choose one gate action, defenders and a horse silhouette before expanding to a city. Bronze Age references, smoke depth, crowd paths and distinct earthen architecture must carry the shot.
5. **Nausicaa: the ball falls and the stranger emerges.** Beach light, washing cloth and ensemble spacing offer a needed contrast to combat and interiors. Scout a specific coast, then integrate terrain/background planes with native foreground actors.

For each location record LAND (landform), BUILD (architecture), AIR (light/weather), flora, color and dominant motion. A different name over the same plate is not a different location. Use actual scout coordinates and source references; keep unsupported historical identification explicit.

## Reproduction and integration cautions

- New films are isolated tests. They are not yet wired into the complete Halfworld film timeline or loaded as playable World missions.
- `halfworld/scenes/OD-B10-S04.mjs` and `OD-B17-S03.mjs` provide existing story records; `next-scenes.mjs` is the implemented test, not a rewrite of all Halfworld.
- Geometry uses LDraw/THREE native meshes. Full `work/native/ldraw` is the source cache; the kit contains a dependency subset. `work/package_odyssey_mode.py` copies current world code and closes donor/selected-part dependencies. Latest closure: 346 dependencies, zero missing. Extend selected-part roots when adding assets.
- Do not rerun old patch/finish scripts blindly: some append text or replace files and are not idempotent. Rebuild hashes and the zip after code, evidence or films change.
- Avoid unbounded THREE raycasts on these LDraw assemblies; previous hero work uses bounded geometry checks. Instanced world props require explicit instance bounds.
- Validate world behavior with `node outputs/odyssey-pipeline/odyssey-world/test-playable.cjs` and `test-roads.cjs` from the workspace. Read their paths before running in an extracted kit. Inspect browser frames as well as tests.
- Frame encoding: `ffmpeg -framerate 12 -i work/frames-next-circe/%05d.jpg -c:v libx264 -crf 19 -pix_fmt yuv420p -movflags +faststart outputs/ODYSSEY-CIRCE-TEST.mp4` (repeat for Argos). Assembly ordering and durations are in `production-state.json`.
- Original user video is a reference, never an overwrite target. Avoid broad git status in this workspace: its ancestor repository contains unrelated user work.

## Latest recovery

The preview returned connection refused after the interrupted execution session. Restart initially failed because local socket binding was restricted; network permission then allowed restart. This establishes a server-availability failure, not a diagnosis of all historical crashes. The newest 384 frames have now been encoded, both reels rebuilt, and the 86-second assembly fully decoded without error. The preview is still a foreground development server, not a supervised persistent service. Saved MP4s remain independently reviewable.

## User forage v0.1 and Cyclops entrance pass

The supplied ZIP contains 45 manifest records and two helper scripts, not embedded geometry. Scripts were not executed. 6273's attachment returned HTML, so it is rejected as an acquisition. 6279 Skull Island downloaded successfully and matched the manifest Git blob SHA. The CCAL 2.0 original and acquisition receipt are in `odyssey-world/new-forage/`. The cave uses its identified 6082 rock-panel vocabulary in a new assembly; it does not import the whole pirate island. Other manifest entries remain leads.

`cyclops-sequence.html` / `.mjs` build a 24-second native entrance rehearsal: stone closes, pause, dawn opening, three custom sheep carry full-size minifigures out. `ODYSSEY-CYCLOPS-ENTRANCE-TEST.mp4` is the resulting test. Source has no mesh scaling. First inspection found insufficient lateral space between the sheep legs; leg centers were widened from ±35 to ±50 LDU. The receipt records actor bounds and the resulting clearance. This is an engineering blockout, not accepted creature or cave art. The stone slides, no Cyclops push is animated, figures are parented under sheep without grip constraints, and the cave has no real-location terrain/background integration. Do not mark the complete cave sequence done. The next work is a rolling/pushing boulder rig, Cyclops performance, hand-to-fleece contact, organic fleece assembly and location-grounded limestone silhouette.

## Location rehearsal controls

See LOCATION-REHEARSALS.md for four real-place presets, lighting/weather controls, ten-item local assembly tray, automatic small-kit loading with kit=1, and setup/screenshot export. Full donor corpus preload, automatic saved-setup restoration, transform gizmos and full asset-card renders remain unimplemented. Voidokilia resolved with live terrain, imagery, one building and 39 roads during UI inspection. Ready-made animals take priority; sheep lead 74188 remains unverified locally.

## Tab and avatar command repair

Fixed mode-gated empty tabs; Earth now shows Rehearse/Scout/Location controls. Added Odyssey activation, blast protection for Build/Props, and normal Minifig walking targets. Live UI Walk forward moved 4.767 m and stopped (evidence/avatar-command-check.json). Point-and-speak infer routes simple forward/turn/stop commands to the same controller; walk-there now drives movement rather than a waypoint alone. Live mic/body tracking and theatre-specific motion retargeting were not tested. Three DAT shells have direct tray buttons, but remain visual scenery without terrain collision. Shells are not fully integrated.


## Cinerium bridge and server recovery — 2026-09-16

Local preview again required a server restart. It is now detached for this session, but is not a permanent supervised service. From the extracted outputs directory run START-ODYSSEY.command and keep its terminal window open. Server defaults to packaged native files; developers can pass --native work/native using an absolute path.

/native/cinerium.html includes ODYSSEY · BOOKS & REHEARSALS: six existing silent rendered tests in Books 9, 10, 17, 21 and 23, with source-study links, book filtering and an embedded video player. Cyclops 24-second video loading was verified in the browser. This library does not import MP4 motion or standalone geometry into editable Film shots. Existing Cinerium Scenes includes the Bed Test and other previously authored Odyssey scenes. Next integration: translate one native blocking study into Film actors/builds, shot cameras and performance tracks, beginning with the rooted-bed recognition beat; preserve shot IDs and rejected-asset status.

Horse gaits/flight, transform widgets and glass menu are now packaged; see LOCATION-REHEARSALS.md for verified behavior and limitations. Earlier rigid-horse and missing numeric-transform notes are superseded.


## On-location books supersede the video sidebar — 2026-09-16

User rejected the separate video library. odyssey-book-library.js now places book controls inside the Cinerium toolbar and loads native Film programs on live terrain. Travel & stage sets place, real ground, character, light and weather through URL parameters; staging waits for world readiness. Six presets cover stake, cave, Circe, Argos, axes and bed. Each creates native MPD props, named performers and three editable camera shots with an approach action. Hero assemblies reuse hero-items MPDs; other scenery reuses the acquired donor MPDs and DAT animals. Film MPD-only build bounds were repaired so framing metadata stays finite.

Verified in the browser: Book 23 resolves Vathy, Ithaca Municipality; native bed, two actors and four assemblies appear against the harbor terrain; three shots appear in the reel and Play starts them. Apply light/weather changes dusk/clear to day/cloudy in that same scene. No video element remains. Other five presets are wired but have not individually passed visual acceptance. Native dependency closure now 429, no missing files.

Limits: these are initial on-location blocking programs, not exact transfers of all previous standalone choreography. Circe is a standing character proxy; pigs are present without a transformation edit. The cave has goat flock proxies, static stone and no giant performance. Argos remains a standing dog proxy. Modern map buildings remain visible; architectural clearance, terrain-adapted assembly footing and creature rigs need further art/blocking work. Loading a preset replaces the current reel at that location; saved source films and rendered videos remain separate.


## Grounding repair and native boat test — 2026-09-16

User rejected buried cave parts and generic films. Root cause confirmed: native DAT attachment origins are not bottom anchors. Film builds now pass an opt-in groundBase flag; Props seats measured bounds at the requested height. Existing non-opted props retain their coordinates. work/test_prop_grounding.cjs reproduces a top-origin part and verifies the corrected bottom. The cave now uses one assembled rock-panel enclosure with a lintel instead of six disconnected placements. Live screenshot inspection confirms visible walls and entrance, but it remains a rough open-roof maquette, not finished cave art.

Boat preset: bookScene=boat at Voidokilia, day/clear. odyssey-boat.js builds a native 52572 hull, four 2542 oars, four bench plates, four seated sailors and Odysseus at the stern. Three shots span 18 seconds; the late Film update synchronizes the hull's translation/bob, oar pivots and crew poses with reel time. The water is an explicitly controlled raised stage over the real location, not a detected shoreline, ocean simulation or navigable coast. No hand-to-oar constraint or historically accurate galley is claimed. The first visual loop corrected a missing LDraw model header, cropped bow, visible edge lines and oar orientation; sailor spears were removed. Capture blocking saves the main canvas and scene receipt to evidence/on-location-boat.png/json.

Boat-specific geometry/animation is reconstructed from bookScene URL; it is not yet serialized by the generic Film save alone. The generic Scenes selector can clear its meshes, but restoring a saved boat reel requires the boat URL. Full location quality and automatic shore placement are still unresolved; don't call this a finished film.


## Continuous Halfworld reel — 2026-09-16

The authoritative corpus is /Users/gaia/Downloads/odyssey-halfworld, not only the packaged subset. It contains all seven needed recordings, drive/drive-script.json and drive/voice-manifest.json. The initial assumption that Circe/Argos/axes recordings were missing was wrong. Do not generate replacement dialogue. The unsuccessful system-voice experiment was removed from runtime assets.

work/import_halfworld_reel.py imports seven original M4A recordings as MP3, computes 50 Hz facial envelopes and joins the canonical segment text, speaker IDs, sourceTurnId, offsets and durations into world/lines/odyssey/halfworld-reel.json. These cover OD-B09-S07/S09/S11, OD-B10-S04, OD-B17-S03, OD-B21-S07, OD-B23-S04. Existing score tracks are reused. Source dialogue fragments are preserved rather than silently rewritten.

bookScene=film now compiles 47 shots / 45 spoken segments / 526.19 seconds. Seven native rehearsal sets share one coastal production area with separate stage offsets. This is NOT travel between seven real places. Play with voices & music unlocks sound, decodes all required audio, then runs one continuous Film reel. PHRASE, LOOK, arm/head channels and SPEAK envelopes use the trailer's Perform system; recorded voices and score ducking use Sound. Boat motion is driven by the same reel clock. Every selected segment fits its shot and recording bounds. Browser verification reached the speaking Odysseus close-up after the prologue with subtitles, score/voice decoding successful. Full 8m46s visual/audio acceptance was not completed.

Limits: this is an assembled performance rehearsal, not final cinematic art. Halfworld audio/timing is canonical, but the full Halfworld blocking plans and creature rigs are not yet retargeted. Cave/Cyclops actions, Circe transformation, dog pose, bow firing and actor contacts still need actual choreography. Sets and cameras remain prototype quality. Runtime changes include a Crowd.patrol fix: re-read the road after pickRoad and reject absent waypoint targets, preventing an observed undefined-x exception during playback.


## Turn-level direction pass — 2026-09-16

The combined film now has 75 editable shots across the same 8m46s runtime. `native/world/odyssey-direction.js` assigns coverage to all 45 recorded turns: speaker, listener, prop insert, explicit camera endpoints and actor crossing cues. `direction-board.json` is the full shot breakdown with source offsets and intentions. Long recordings are split across cuts without dropping or duplicating source intervals (compiler regression checks continuity).

Circe has three scouts and a visibility transition to native pigs. Telemachus crosses to his father; the bed scene closes the distance between husband and wife. The boat has helm, oar, waterline and departure coverage with camera height preserved above its controlled water stage. Selecting a semantic shot now stages its preview camera immediately.

This remains a directed rehearsal: giant/contact action, embrace, dying dog and accurate hand-to-prop interaction are not completed rigs. Seven sets still share a coastal production stage; they are not seven independently travelled live locations. Browser spot-checks do not constitute a complete rendered-film QC pass. Preserve the canonical Halfworld audio instead of generating substitute voices.

## Cinerium workspace — 2026-09-16

Default Watch interface: Play film / Stop, rehearsal selection, sound state and duration. Direct contains existing shot/camera/performance controls; Stage contains location, light/weather and other productions; Export contains recording, resolution and download. Existing DOM nodes are moved, preserving original event handlers. New modules: `world/cinerium-workspace.js` and `.css`, loaded after the book library. Watch hides gameplay HUD and authoring panels. Audio preparation honors the displayed Sound on/off state.

## Native Hand Butter — 2026-09-16

`world/cinerium-butter.js` adds actor puppeteering inside Direct. Scene/shot/actor keyed poses store floor coordinates relative to scene spawn plus joint angles and lift above terrain. Preview applies interpolated tracks after Film.late (and after boat / assembly hooks). A separate localStorage motion layer and validated same-scene JSON import/export keep changes across native page loads. Not part of MENTO export. See HAND-BUTTER.md for workflow and limits. The source attachment was inspected as reference data; its workshop JSON is not a full-film exchange format. Webcam tracking is not connected.

## Unified scene library
The Watching picker now includes all eight book rehearsals, all Film.SCENES / Film.TRAILERS registry entries (including the Odyssey trailer and four earlier Halfworld adaptations), and five linked legacy review/laboratory pages. Native registry scenes use nativeScene URL keys and can use the same Direct / Hand Butter tools. Legacy lab pages are links, not converted native programs.
