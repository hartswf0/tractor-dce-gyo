# Monkey Butter Builder

Open `monkey-butter-builder.html` from the main index or **Story builder** in Monkey Hand Butter. This is a separate editing page; the original film and shot-state workshop remain available.

## Restage and refilm

1. Choose one of the 13 source shots. Edit its title, duration, dialogue and acting notes. Duplicate a shot for an alternate; Earlier/Later reorder the cut.
2. Press **Stage**. Add cast or native LDraw props. The workbench Parts drawer searches the full catalog. Robot and Alien are recolored Inspector costumes, not new articulated rigs.
3. Place all required assemblies, frame the camera, then **Capture start**. Move existing assemblies and orbit the camera, then **Capture end**.
4. Scrub **Shot motion**, or **Play shot**. **Play my cut** runs the ordered sequence. Start/end movement interpolates whole assembly position, rotation and scale, plus camera position and target. Acting notes are saved directions, not automatically generated choreography. Articulated hands, lip sync and original procedural film animation are not baked into these snapshots.
5. Existing recorded dialogue is loaded for unchanged original lines. **Hear line** previews edited text with a browser voice. Attach a recorded audio file to include new dialogue or sound in export. Changing a line skips its old recording until replaced. Choose pulse music, tension or silence.
6. **Record shot** / **Record WebM** downloads a 1280×720 canvas recording with attached audio and generated music. Keep the tab active during real-time recording. Audio longer than its shot is cut at the transition. Browser speech previews are not captured.
7. **Save project** stores the cut in this browser. **Export** writes a portable JSON with scene states and embedded audio; **Import** restores that builder project. Export regularly: browser storage is not a remote backup. Limits: 40 shots, 200 assemblies/state, 12 MB per audio file, 200 MB imported project.

Add objects before capturing start; objects created only at the end are not filmed. Names identify assemblies across keys, so keep names distinct. This format is separate from the older static Monkey Hand Butter state-project format.

## Implementation

- `monkey-butter-builder.html`: standalone studio UI.
- `monkey-butter-builder.mjs`: ordered shot model, state capture, audio, interpolation and WebM recording.
- `native/world/hand-butter-loader.js`: reusable snapshot, viewState and addAssembly bridge.
- `monkey-film.mjs` / `monkey-audio/`: existing source geometry, shot timings and recordings.

Run regressions from this directory: `python3 tools/run-tests.py`. Browser verification exercised cast insertion, native banana insertion, start/end capture, shot playback and recording. Existing eight regression suites pass. This is a staging editor and real-time refilming workflow, not a finished replacement cut.
