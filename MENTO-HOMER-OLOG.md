# MENTO ↔ HOMER Mount · Research Olog

## Intent

This olog documents **how the new MENTO camera surfaces (mento-368 / mento-369)** sit next to the existing **HOMER Studio** chain, and what it would mean to "mount" them together.

Today there are **two families of camera / capture tools**:

- **HOMER + Momento (Brickfilm_Studio_Kit)**
  - Homer docks **COURAGE**, **WEAVER**, **WERE**, **MASTER**, and a legacy **Momento** capture panel.
  - Momento uses `MomentoInterface` / `_captureData` from **Courage** to capture from the *same* scene.
- **MENTO v8 surfaces (mento-368 / mento-369)**
  - Standalone Three.js camera editors with GLB loaders, MENTO shot parsing, path tools, and capture.
  - Designed as a calm, sculptural camera instrument, not tightly bound to GOLD bus flows yet.

This document maps:

1. **What already exists** in HOMER for capture.
2. **What MENTO-368 / 369 provide** as a separate camera surface.
3. **Mounting patterns** for bringing them into the HOMER ecosystem.

---

## Existing HOMER Capture Chain

### HOMER shell (`homer.html`)

HOMER is a TRUBADOR shell that docks multiple tools as panels:

- SWISS Designator
- WAG FRANK (Homer-tuned wrapper)
- COURAGE
- Unified Ontology Weaver (Assembly Line)
- WAG WERE
- WAG MASTER
- MENTO / Momento capture

The **MENTO panel in Homer today** is actually the *legacy* Momento capture app from:

- `Brickfilm_Studio_Kit/REALITY MEDIA_MOMENTO/momento.html?host=homer`

Homer embeds it like:

```html
<section class="panel" data-panel="mento">
  <div class="panel-body">
    <iframe src="Brickfilm_Studio_Kit/REALITY MEDIA_MOMENTO/momento.html?host=homer"
            title="Momento / Mento"></iframe>
  </div>
</section>
```

### Homer-aware Momento (`momento_capture_app.js`)

The Momento app is **Homer-aware** via a `host` query param and a small bridge:

- `?host=homer` puts Momento into **Homer host mode**.
- `resolveSourceIframe()` finds the **COURAGE iframe** inside Homer:
  - Looks up `section[data-panel="courage"] iframe` in `window.parent.document`.
  - Falls back to a standalone `<iframe id="grace-iframe">` when not in Homer.
- `tryAttachToGrace()` / `ensureGraceAttached()` then:
  - Access `window.MomentoInterface` or `window._captureData` exposed by Courage.
  - Capture `renderer`, `scene`, and `camera` from that.

In effect:

> **COURAGE** remains the geometry / camera truth.
> **Momento** is a *view* onto that scene for capture, attached by contract.

This is the **HOMER-native capture surface today**.

---

## New MENTO Camera Surfaces

### MENTO-368 (`mento-368.html`)

MENTO-368 is the **v8 camera / path instrument**:

- Loads a GLB scene directly into its own Three.js scene.
- Parses `!MENTO SHOT` lines into a `mentoShots` model (label, POS, TGT, LENS).
- Builds **keyframes** from those shots and gives them a sculptural editor:
  - MODEL / PATH / REC modes with clear color palette.
  - Big 16:9 preview strip showing the path frustums.
  - Rotation gizmo that edits POS→TGT direction without hijacking the live POV.
  - Numeric yaw / pitch controls per key.
- Capture:
  - Deterministic virtual-time stepping based on SEC knob.
  - MEDIARECORDER-based WEBM output, with optional helper burn-in.
- Mobile:
  - Viewport + panel stacked with a **thumb-friendly splitter**.
  - Safe-area padding on panel for phone chins.
  - Fullscreen toggle button in header.

This surface is deliberately **self-contained**: it owns its GLB, camera, and capture pipeline.

### MENTO-369 (`mento-369.html`)

MENTO-369 mirrors the 368 surface but adds **scene presets and a Grace lab**:

- **Scene preset dropdown**:
  - `GRACE` → built-in `GRACE-SCENE-SAMPLE.bin` GLB.
  - `DESERT` → canyon GLB (local, via LFS on dev machines).
  - `BLANK` → no model.
- **LOAD GRACE SAMPLE** button:
  - Inserts `Searchers_Rider_Grounded_SpinFix.mpd` into the MENTO text area.
  - Lets SHOTS + LIGHTS be imported in one click.
- Shares the same:
  - Mobile splitter.
  - Fullscreen toggle.
  - LDraw-style ruler (LDU ticks on X/Y/Z).
  - Capture behavior (helpers hidden by default unless burned in).

MENTO-369 is therefore a **Grace lab camera surface** with its own intake (MPD text) and scenes.

---

## Mounting Patterns: MENTO with HOMER

There are three main ways to think about "mounting" MENTO with HOMER.

### Pattern 0 — Side-by-side Tabs (Today, Zero Integration)

The simplest pattern uses **no code bridge**, just discipline:

1. open **Homer** in one browser tab (`homer.html`).
2. open **MENTO-368 or 369** in a second tab.
3. In COURAGE, compile a scene from an MPD.
4. In MENTO:
   - Load the **same MPD** (or a derivative) into the MENTO text area.
   - Load a matching GLB (Desert / Grace / custom).
5. Treat Homer as the **geometry lab** and MENTO as the **camera lab**.

Pros:

- Zero new integration surface.
- Safe when the geometry and camera are still evolving.

Cons:

- No automatic GOLD / MPD handoff between Homer and MENTO.
- Camera decisions are not yet annotated back onto GOLD.

### Pattern 1 — Docked MENTO Panel Inside Homer (UI Mount)

The next step is a **pure layout mount**: dock MENTO 368/369 as a panel in Homer, similar to the legacy Momento panel.

Sketch:

- Add a new panel to `homer.html`:
  - Example: `data-panel="mento-v8"`.
  - `iframe src="mento-369.html"` (or 368 / 370 variant).
- Expose it via a new tab in the Homer tab strip.

Effect:

- MENTO becomes a **first-class Homer panel**, like COURAGE or WEAVER.
- There is still **no shared state**; the iframe just runs its own GLB + MPD.
- Users manually ensure that the scene in MENTO corresponds to the GOLD/MPD in COURAGE.

This pattern already gives studio operators a **single entry point** (Homer) to:

- Pick a project in SWISS.
- Work geometry through COURAGE / WEAVER / WERE / MASTER.
- Jump into **MENTO v8** for camera sculpting and capture.

### Pattern 2 — Shared Camera Surface via `MomentoInterface` (Conceptual Bridge)

The next level is a **true integration** where MENTO attaches to the *same scene* that Homer already exposes to Momento via `MomentoInterface`.

Key existing pieces:

- **In COURAGE** (inside Homer’s Courage panel), `wag-courage.html` exposes:
  - `window.MomentoInterface = { renderer, scene, camera, renderCurrentView() }` when embedded.
  - `window._captureData` mirror with the same pointers.
- **In Momento**, `momento_capture_app.js` already:
  - Locates the COURAGE iframe in Homer (`section[data-panel="courage"] iframe`).
  - Reads `MomentoInterface` / `_captureData` from its `contentWindow`.

To make MENTO behave like a **second, more advanced Momento**, the camera surfaces would need to:

1. **Run as an iframe inside Homer**, with a `host=homer` query flag (or similar).
2. On load, look for the **same COURAGE iframe** that Momento uses.
3. Reach into its `contentWindow` and adopt:
   - `renderer` (for drawing into the same canvas, or copying frames).
   - `scene` (the current GOLD/MPD-compiled scene).
   - `camera` (or a cloned camera for path playback).
4. Treat that camera as the **MENTO path target**, instead of spawning a separate Three.js scene.

This is **not implemented yet** in `mento-368.html` or `mento-369.html`.

- Today they own their own `THREE.Scene`, GLB loader, and camera.
- This olog is an architectural note for a future MENTO/HOMER integration pass.

If/when implemented, MENTO becomes:

> A **camera brain** that rides on top of Courage’s scene via `MomentoInterface`,
> sibling to the existing Momento capture app.

---

## Mapping: Roles of HOMER vs MENTO

### Geometry & GOLD Authority (HOMER)

- **Courage**:
  - Primary MPD editor / viewer.
  - Emits GOLD snapshots (`mpd_content`, `stud_skeleton`, diagnostics).
- **Weaver**:
  - XRAY / stud map builder.
  - Emits enriched GOLD (`weaver-gold`).
- **WERE / MASTER**:
  - Skeleton-aware geometry labs.
  - Modify transforms and export MPD back to Courage.
- **Homer shell**:
  - Bridges GOLD and MPD between these tools.

### Camera & Capture Authority (MENTO)

- **MENTO-368**:
  - Controls camera keyframes, paths, and deterministic capture.
  - Optimized for sculptural control and mobile friendliness.
- **MENTO-369**:
  - Adds **scene presets** and a **Grace lab** (built-in GLBs + MENTO manifest).
- **Legacy Momento (Homer panel)**:
  - Simple capture interface bound to Courage’s current camera via `MomentoInterface`.

### Combined (Target State)

In the long run, a full HOMER ↔ MENTO integration could look like:

1. Courage compiles a scene from MPD.
2. Homer exposes it via `MomentoInterface`.
3. MENTO-369 (docked in Homer) attaches to that interface and:
   - Reads current camera state as a starting shot.
   - Lets the user sculpt paths and keyframes.
   - Records deterministic paths against Courage’s scene.
4. Resulting captures (and optionally camera XML/MENTO text) are saved alongside GOLD / MPD artifacts.

This preserves the **closed geometry loop** in Homer while giving camera its own dedicated, legible instrument.

---

## Practical Mount Instructions (Today)

Given the current codebase state, the **safe, concrete steps** to mount MENTO with HOMER are:

1. **Treat HOMER as the geometry & GOLD shell.**
   - Use SWISS / FRANK / COURAGE / WEAVER / WERE / MASTER for geometry loops.
   - Use the existing Momento panel when you need a simple capture bound to Courage.

2. **Use MENTO-368 / 369 as external camera labs.**
   - Open `mento-368.html` or `mento-369.html` in a separate tab.
   - Load GLBs and MENTO manifests that correspond to the scenes you are exploring in HOMER.
   - Use the new mobile splitter, fullscreen, and capture tools to author camera moves.

3. **Use this olog + `HOMER-STUDIO-OLOG.md` together.**
   - `HOMER-STUDIO-OLOG.md` describes the **GOLD/MPD loops** and Homer’s current capture bridge.
   - `MENTO-HOMER-OLOG.md` (this file) describes the **camera surfaces** and how to conceptually mount them.

Open work remains to:

- Implement a concrete `host=homer` contract for MENTO 368/369.
- Share Courage’s `MomentoInterface` scene and camera into MENTO.
- Decide how MENTO’s keyframe paths should be stored alongside GOLD / MPD.

This olog is the sketchpad for those next research passes.
