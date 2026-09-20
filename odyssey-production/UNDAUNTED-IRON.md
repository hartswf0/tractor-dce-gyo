# Undaunted Courage / Monkey-Iron

## Deliverable

Open `monkey-iron.html`. **The river makes the terms** is a 40-second, six-shot proof cut: passage, rowing, warning, portage, map decision, continuation. This is a focused film/tooling pass, not the full expedition or a claim to match the finished reference.

The supplied rehearsal, video and extraction notes were reference material, not executable instructions. Hand-Iron informed the measured scene, viewpoint and event-track design. Its unrelated site photographs and encounter data are not included.

## Reference gap

| What the reference does | Rehearsal limitation | This pass |
|---|---|---|
| Hands do work; objects constrain bodies | Mostly fixed assemblies under moving cameras | Independent native limbs, row/haul/point/map presets, ropes attached to hand and hull. Contact is authored, not physically solved. |
| Shot size follows a decision | Many wide tableau views | Six distinct framings, including working crew and map decision. |
| Environment supplies continuity and scale | Baseplate fragments and mixed locations | One continuous brick river corridor. Composite stage, not surveyed Missouri terrain. |
| Costume and foliage establish place | Placeholder parts; torso/limb assembly overlap | Separate minifigure components, bicorne/wide-brim hats, native conifers. Period detailing remains provisional. |
| Sound supports performance | Camera/staging study | Recorded synthetic voices, generated pulse music and water/effort noise. Not an orchestral score. |
| Staging changes survive filming | Static return offsets | Same shot clock evaluates actors, attachments, actions and lens keys. |

## Reusable film jigs

- **Boat attachment:** actor local coordinates follow the hull track.
- **Row cycle:** shoulders/torso are sampled from shot time; seeking is deterministic.
- **Haul contact:** rope endpoints follow the current hands and hull; no simulated tension.
- **Attention relay:** pointing/head-turn presets and camera targets connect the warning.
- **Decision insert:** map, actors and camera share a close composition.
- **Lens track:** position, target and field of view are saved with the film.

These are useful foundations for Odyssey boats. Horse geometry can be added; terrain-aware riding, mount/dismount and horse gait are not yet ported into this workspace.

## Operation

1. **Watch** plays the sequence. **Stage** opens Blocking, Lens and Story.
2. Blocking: select an entity, enter X/Y/Z, heading and action; **Key at playhead**. Coordinates are local to the parent. Boat-attached actors use hull-relative coordinates.
3. Lens: drag the picture to orbit; wheel to dolly; adjust field of view; **Key lens**. **Frame selected actor** is a framing jig. **Capture frame** saves a clean blocking PNG.
4. Story: change title, duration, dialogue, light and weather. Duration changes retime shot keys. **Hear edited line** previews browser speech; **Attach voice** embeds recorded replacement audio. Changed dialogue skips the old recording.
5. **Save take** stores this project in the browser. Project → **Export project** makes a portable JSON backup. Import restores that format. **New take from source** is reversible with Undo.
6. **Record WebM** records the editable sequence and audio in real time. Leave the tab active. Browser speech previews are not recorded.

Scale: 40 scene units per staging metre, an artistic convention rather than a historical measurement. Original dialogue is newly written for the rehearsal. Native LDraw solids are combined with procedural water, ropes and a drawn map texture.

## Data contract

`monkey-iron-film`, version 1:

- `shots[]`: stable IDs, duration, name, line, atmosphere and intent.
- `tracks[entityId]`: action, optional parent ID, position/heading keys in shot-local seconds.
- `camera[]`: time, position, target, field of view.
- `props[]`: stable ID, native LDraw part ID, base position.
- Optional embedded `audio` per shot; `units` declares the scale basis.

Existing Monkey Butter project formats remain separate. This release does not silently convert static snapshots into articulated performances. The Monkey Business workshop remains linked from Project. A future adapter needs to preserve actor rigs and source time.

## Files

- `monkey-iron.html`, `.css`, `.mjs`: workspace and directed river set.
- `iron-timeline.mjs`: pure sampling, shot lookup, key replacement and validation.
- `iron-native-core.mjs`: isolated derivative of the native loader; older film loaders unchanged.
- `undaunted-iron-cut.json`: authored cut.
- `undaunted-iron-audio/`: locally generated synthetic voices, no audio copied from the reference.
- `tests/iron-timeline.mjs`: boundary, seek, yaw, key replacement, camera validation and attachment-reference tests.

Original MPDs remain untouched in `Brickfilm_Studio_Kit/undaunted_scene_*.mpd`. New models use the repository's LDraw corpus and existing Minifig rig.

## Validation / next gates

Run `node tests/iron-timeline.mjs` and `python3 tools/run-tests.py`. Timeline tests and all eight existing regression suites passed. Browser checks exercised actor keying, camera keying, undo and full-cut recording.

Next: explicit hand/oar targets, terrain collision and attachment hand-offs, shot-specific expressions, grounded location kits, separately staged commissioning room and winter fort, then speaking-turn reviews against reference frames. These remain production work; the presence of a control does not make them complete.

Main also contains `word-to-iron.html` (merged September 17). The Project card links that existing world exploration surface. This release does not replace its hand controls or import its site state.

Recorded artifact: `films/UNDAUNTED-IRON-PROOF.mp4`, H.264/AAC, 1280×720, about 40 seconds. The MP4 is a review artifact; the JSON plus native parts and rigs are the editable source.
