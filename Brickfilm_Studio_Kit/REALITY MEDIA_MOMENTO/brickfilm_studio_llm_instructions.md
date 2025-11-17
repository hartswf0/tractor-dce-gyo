# Brickfilm Studio / Reality Media Capture – LLM Instructions

This document is for an LLM that will help develop and maintain the **Brickfilm Studio** and related capture tools inside the `reality-media-explorer` repo.

It explains:

- The existing capture system (MOMENTO) and how it is documented
- The proposed **Brickfilm Studio** architecture
- Which files are reference-only vs. where new code should live
- Constraints and design rules you must respect when editing code

The goal is a **robust, long-lived LEGO brickfilm studio** that uses **LDraw assets** rendered via **Three.js**, with a clean capture pipeline.

---

## 1. Context and key docs

Important high-level system maps (HTML, documentation only):

- `system-map.html`
  - "Swiss Designator – System Map" for the broader builder/MPD ecosystem.
  - Treat this as conceptual reference, not something you modify.

- `REALITY MEDIA_MOMENTO/video_capture_system_map.html`
  - System map for the existing Reality Media MOMENTO capture surface.
  - Describes how the iframe-based CCapture pipeline works today.

- `REALITY MEDIA_MOMENTO/brickfilm_studio_system_map.html`
  - **Authoritative map for the proposed Brickfilm Studio architecture.**
  - Shows the Brickfilm Studio Surface, Runtime Core, Capture Backends, LDraw Asset Manager, Shot Configs, and how they relate.

- `REALITY MEDIA_MOMENTO/brickfilm_studio_llm_instructions.md` (this file)
  - Share this alongside the system maps when you hand context to an LLM.

These HTML files are **docs only**: do not embed business logic there.

---

## 2. Existing MOMENTO capture components (reference and reuse)

These files implement the current iframe-based capture system. You may **mine them for patterns and utility code**, but the Brickfilm Studio should not depend on iframes or global state the way these do.

- `REALITY MEDIA_MOMENTO/video_capture.html`
- `REALITY MEDIA_MOMENTO/video_capture_app.js`
- `REALITY MEDIA_MOMENTO/video_capture_interface.js`
- `REALITY MEDIA_MOMENTO/universal_scene_template.js`
- `REALITY MEDIA_MOMENTO/video_capture_manager.js`
- `REALITY MEDIA_MOMENTO/video_capture_validator.js`

Key patterns to reuse conceptually:

- CCapture usage (start, capture, stop, save)
- Progress UI and logging patterns
- Renderer/camera/scene validation checks

Key patterns **not** to copy forward:

- Injecting scripts into iframes to discover `renderer/scene/camera`
- Heavy reliance on `window.*` globals across the iframe boundary
- Multiple competing animation loops (scene `animate()` and capture `animate()`)

Also present, and useful as inspiration (not as part of Brickfilm Studio core):

- `REALITY MEDIA_MOMENTO/dynamic-camera.html`
  - Audio-reactive camera motion and environment effects.
- `REALITY MEDIA_MOMENTO/index_hub.html`
  - A Three.js realm hub with portals; shows how scenes expose renderer/scene/camera.

---

## 3. Brickfilm Studio – target architecture

The Brickfilm Studio is a **new** system that should be implemented using ES modules and a **single Three.js runtime core**. Do NOT use iframes for its pipeline.

### 3.1 Core idea

- One runtime owns: `renderer`, `scene`, `camera`.
- All LEGO geometry is defined via **LDraw models** and loaded through an asset manager.
- Each shot is defined by **data** (JSON): which model(s), how they are placed, camera rig, lights, FPS, duration, resolution.
- Capture is done by **backends** that accept a canvas and frame sequence.

### 3.2 New files to implement (proposed paths)

Implement these in `REALITY MEDIA_MOMENTO/` unless the user specifies otherwise.

1. **Studio surface (UI)**

   - `brickfilm_studio.html`
     - One viewport canvas (`#viewport`) rendered by the runtime.
     - UI elements for:
       - Selecting a shot (from `shots/*.json`)
       - Editing shot parameters (fps, duration, resolution, camera rig options)
       - Preview / Record buttons
       - Status (current frame, total frames), logs, metrics (FPS, memory if available)
     - Loads JS modules via `<script type="module">` and *does not* use iframes.

2. **Runtime core**

   - `brickfilm_runtime.js`
     - Responsibilities:
       - Create/own `THREE.WebGLRenderer`, `THREE.Scene`, `THREE.Camera`.
       - Integrate with LDraw Asset Manager to place models.
       - Manage lights and environment for a shot.
       - Provide a minimal API:
         - `async loadShot(shotConfig)`
         - `updateAtTime(tSeconds)`
         - `renderFrame()`
         - `getCanvas()` → returns `renderer.domElement`
       - Handle viewport resize.

   - `runtime_validator.js`
     - Refactor logic from `video_capture_validator.js` into a runtime-oriented validator:
       - `validateRenderer(renderer)`
       - `validateCamera(camera)`
       - `validateScene(scene)`
       - `validateCanvas(canvas)`
     - Provide an aggregate `validateAll(runtimeState)` that returns `{ valid, diagnostics[] }`.

   - `studio_metrics.js`
     - Non-invasive metrics and logging utilities:
       - FPS and optional memory usage (if `performance.memory` exists).
       - Human-readable logs associated with studio actions.
       - Hooks for the UI to subscribe to metrics updates.

3. **LDraw asset integration**

   - Directory structure (example):
     - `ldraw/` – LDraw library (official + custom parts)
     - `REALITY MEDIA_MOMENTO/scenes/` – MPD/LDR models for specific brick scenes

   - `ldraw_asset_manager.js`
     - Initialize and wrap `THREE.LDrawLoader`.
     - `async init({ basePath })` – set up loader and any materials.
     - `async loadModel(id)` – load parsed/cached model by ID, returning a `THREE.Group` ready to insert into the runtime scene.
     - Ensure consistent scale/orientation across models.

4. **Shot configs and playback**

   - `shots/` (under `REALITY MEDIA_MOMENTO/`)
     - JSON files describing shots, e.g. `intro_pan.json`, `closeup_minifig.json`.

   - Shot config shape (example):

     ```jsonc
     {
       "id": "intro_pan",
       "modelId": "scenes/space_base.mpd",
       "fps": 24,
       "durationSeconds": 6,
       "resolution": { "w": 1920, "h": 1080 },
       "cameraRig": {
         "type": "orbit", 
         "from": { "x": 0, "y": 10, "z": 60 },
         "to":   { "x": 0, "y": 10, "z": 0 },
         "easing": "easeInOutCubic"
       },
       "lights": [
         { "type": "ambient", "color": 0x404040, "intensity": 1.0 },
         { "type": "directional", "color": 0xffffff, "intensity": 1.5, "position": { "x": 20, "y": 30, "z": 10 } }
       ]
     }
     ```

   - `shot_player.js`
     - Provides:
       - `previewShot(shotConfig)` – uses `requestAnimationFrame` for interactive preview (`t = (timeMs/1000) mod duration`).
       - `async captureShot(shotConfig, backend)` – deterministic offline capture:
         - Compute `totalFrames = fps * duration`
         - Loop over frames: `t = frameIndex / fps`, call `loadShot` (once), `updateAtTime(t)`, `renderFrame()`, `backend.captureFrame(canvas, frameIndex)`.
       - Uses `runtime_validator` before capture.

   - (Optional) `timeline_sequencer.js`
     - Chains multiple shots defined in a `sequence.json` into a longer film.

5. **Capture backends**

   - Common interface:

     ```ts
     interface CaptureBackend {
       start(opts: { fps: number; resolution: { w: number; h: number } }): Promise<void>;
       captureFrame(canvas: HTMLCanvasElement, frameIndex: number): Promise<void>;
       finish(): Promise<void>;
     }
     ```

   - `capture_backend_ccapture.js`
     - Wraps `CCapture` in this interface.
     - Use patterns from `video_capture_app.js`.

   - `capture_backend_mediarecorder.js`
     - Uses `canvas.captureStream(fps)` + `MediaRecorder`.
     - Useful for real-time or browser-native capture.

   - `capture_backend_noop.js`
     - Implements the interface but discards frames.
     - For testing/preview flows.

---

## 4. Rules and constraints for the LLM

When working inside this repo on Brickfilm Studio and capture systems:

1. **Do not** reintroduce iframes or cross-window global hacks for Brickfilm Studio.
   - All Brickfilm capture should operate in a single window / document with a single Three.js runtime.

2. Treat system maps (`system-map.html`, `video_capture_system_map.html`, `brickfilm_studio_system_map.html`) as **documentation**, not as dynamic code.
   - You may update text/diagram descriptions if the architecture legitimately changes.
   - Do not embed application logic in them.

3. Preserve MOMENTO-era files as historical/experimental artifacts.
   - You may refactor specific utility logic out into new modules (validators, metrics), but:
     - Keep the original files unless the user explicitly approves deprecation/removal.

4. Favor **shots-as-data**.
   - New brickfilm behavior should be driven by shot JSON + LDraw assets, not hard-coded camera paths or ad-hoc scripts.
   - When you add a new camera move or lighting style, expose it as a parameterized rig type in `shotConfig` rather than scattering ad-hoc code.

5. Single timeline, deterministic capture.
   - For offline capture, there must be **one canonical loop** that steps time by `1/fps` and calls `updateAtTime(t)` + `renderFrame()`.
   - Do not mix multiple competing animation loops that call `render()` independently during capture.

6. Respect the directory structure.
   - New Brickfilm Studio modules should live in `REALITY MEDIA_MOMENTO/` alongside the system maps, unless the user specifies another location.

7. Avoid adding many new top-level HTML files.
   - Prefer a single `brickfilm_studio.html` surface.
   - Support additional views (e.g., diagnostics) through UI modes or tabs inside that page.

---

## 5. Suggested kit to zip and share with an LLM

When packaging a minimal context zip for another LLM, include at least:

- `system-map.html`
- `REALITY MEDIA_MOMENTO/video_capture_system_map.html`
- `REALITY MEDIA_MOMENTO/brickfilm_studio_system_map.html`
- `REALITY MEDIA_MOMENTO/brickfilm_studio_llm_instructions.md`
- `REALITY MEDIA_MOMENTO/video_capture_app.js`
- `REALITY MEDIA_MOMENTO/video_capture_validator.js`
- `REALITY MEDIA_MOMENTO/video_capture_manager.js`
- `REALITY MEDIA_MOMENTO/video_capture_interface.js`
- `REALITY MEDIA_MOMENTO/universal_scene_template.js`
- `REALITY MEDIA_MOMENTO/dynamic-camera.html`
- `REALITY MEDIA_MOMENTO/index_hub.html`

Optionally, include any existing or new LDraw-related directories (e.g. `ldraw/`, `REALITY MEDIA_MOMENTO/scenes/`, `REALITY MEDIA_MOMENTO/shots/`) once they exist.

**Example zip command (run from the repo root):**

```bash
zip -r Brickfilm_Studio_Kit.zip \
  "system-map.html" \
  "REALITY MEDIA_MOMENTO/video_capture_system_map.html" \
  "REALITY MEDIA_MOMENTO/brickfilm_studio_system_map.html" \
  "REALITY MEDIA_MOMENTO/brickfilm_studio_llm_instructions.md" \
  "REALITY MEDIA_MOMENTO/video_capture_app.js" \
  "REALITY MEDIA_MOMENTO/video_capture_validator.js" \
  "REALITY MEDIA_MOMENTO/video_capture_manager.js" \
  "REALITY MEDIA_MOMENTO/video_capture_interface.js" \
  "REALITY MEDIA_MOMENTO/universal_scene_template.js" \
  "REALITY MEDIA_MOMENTO/dynamic-camera.html" \
  "REALITY MEDIA_MOMENTO/index_hub.html"
```

You can hand this zip and this instructions file to another LLM as a compact working context for continuing the Brickfilm Studio implementation.
