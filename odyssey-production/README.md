# Odyssey production workspace

Start with **[Scene & test library](scene-library.html)**. Search, filter by type, select a card to preview a saved frame or rendered test, then open its editable scene or separate laboratory.

## New: Monkey Business and separate Hand Butter

**[Monkey-only shot workshop](monkey-butter.html)** — scrub all 13 shots, edit any moment in Hand Butter, keep named variations, and export/import a project. [Guide and limitations](MONKEY-WORKSHOP.md).

**[Watch Monkey Business](films/NIGHT-SHIFT.mp4)** — finished 83-second short with voices, music, effects, animated workstations and 13 directed shots. **[Rehearse / edit a snapshot](monkey-film.html)**. See [cut and source notes](MONKEY-CUT.md).

**[Hand Butter workshop](native/hand-butter-scenes.html)** is a separate app. Transfer a current scene moment from the film, Cinerium or Word to World, then move/copy assemblies, search the large LDraw library, and save an adapted JSON scene. Mobile uses a scrolling parts drawer while retaining the scene view. Assembly snapshots do not retain animation rigs or return edits to the film automatically.

## What is actually here

- **8 native book rehearsals:** journey-home assembly, boat, stake, cave, Circe, Argos, axes and rooted bed.
- **10 earlier registered native programs:** Odyssey trailer, cast, four Halfworld scene adaptations, three Star Wars tests and Simpsons intro.
- **Separate laboratories and exported films:** sheep escape, hero props, Circe/Argos, location studies, earlier bed revisions and test assemblies.
- **41 catalog entries total.** Entries are views/artifacts, not 40 unique finished scenes. `scene-catalog.json` is the inventory; automated checks verify every registered native program appears and every listed local target exists.

## Sheep escape: found, but not integrated

[Stone and flock](scene-library.html#sheep-escape) includes the 24-second exported film, native geometry source, and evidence frames. The rock slides shut/open and three custom sheep carry minifigures out. These are blockout animals. The giant pushing the stone, grip constraints, fleece, and real-location integration are unfinished. The native cave rehearsal does **not** load this sequence. Do not mark it complete because the file exists.

## Operate

- **Watch:** Play film, sound and scene selection.
- **Direct:** editable shots/cameras and **Actor keys** poses. Keep a pose at one time, advance time, keep another; play the shot. Frame actor lets you inspect the puppet without replacing the authored shot camera.
- **Stage:** geography, weather, light and assembly controls.
- **Export:** record and download a take. Actor-key motion has a separate JSON export; it is not included in MENTO export.

See [Hand Butter instructions](HAND-BUTTER.md) and [tests](TESTS.md).

## Run locally

Python 3: `python3 serve.py --port 8918` from this directory. Open `http://127.0.0.1:8918/scene-library.html`. Keep the process running. Native dependencies are bundled; terrain/imagery and other world services may still require network access. This is a local development server, not a permanent service. The server writes captures only through its local capture/evidence endpoints.

Static hosting can serve the library and native programs. Capture POST endpoints need the Python server. Existing legacy laboratory code includes root-relative `/native/` URLs; the repository release rewrites those for its directory so project-page hosting works.

## Maintain / continue

Core files in `native/world/`: `odyssey-book-library.js` (on-location programs), `odyssey-assembly.js` (Halfworld compilation), `odyssey-direction.js` (45 spoken-turn plans), `odyssey-boat.js`, `cinerium-workspace.js` (UI), `cinerium-butter.js` (motion layer). Halfworld voice timing/audio live under `native/world/lines/odyssey/`. Donor provenance is retained in source files and acquisition receipts. `direction-board.json` lists the 75-shot assembly coverage.

The older `production-handoff.md` is a chronological work log; some early status statements are superseded. This document and current catalog describe the latest integration boundaries. Do not rerun old finish/patch scripts blindly.

## Outstanding production work

- Integrate sheep escape into on-location native actors/props and editable motion.
- Finish Cyclops, stake grip, bow release/arrow, embrace and animal contact rigs.
- Replace prototype environments with grounded architecture/flora; combined film still shares one coastal stage.
- Validate webcam tracking in the separate Hand Butter loader; mouse/touch assembly editing is verified.
- Continue quality review of the Odyssey film assemblies; their status is separate from the finalized Monkey Business short.
