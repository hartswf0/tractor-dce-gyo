# Shield of Achilles · HOMER × MENTO Shell

## Intent

**Shield of Achilles** is a **HOMER-derived studio shell** that:

- Keeps the full **Swiss / Frank / Courage / Weaver / Were / Master** chain.
- Replaces the legacy **Momento** panel with the new **MENTO v8 camera surface** (`mento-369.html`).

Where `homer.html` still docks the older Momento capture app, **`shield-of-achilles.html` is the variant where MENTO v8 is mounted directly into the TRUBADOR chrome.**

This olog documents:

1. What changed between `homer.html` and `shield-of-achilles.html`.
2. How the MENTO-369 panel is wired.
3. How to use Shield of Achilles in relation to the rest of the studio surfaces.

---

## Lineage

### From HOMER Studio

HOMER (see `HOMER-STUDIO-OLOG.md`) is a TRUBADOR shell that:

- Docks:
  - SWISS Designator.
  - WAG FRANK (Homer-tuned wrapper).
  - COURAGE.
  - Unified Ontology Weaver.
  - WAG WERE.
  - WAG MASTER.
  - Momento capture panel.
- Bridges GOLD / MPD between Courage, Weaver, Were, and Master.
- Treats the **Momento panel** as a lightweight capture surface that reads `MomentoInterface` / `_captureData` from Courage.

### From MENTO v8 (368 / 369)

The MENTO v8 surfaces (`mento-368.html`, `mento-369.html`) are **standalone camera and capture instruments**:

- Own their own Three.js scene and GLB loader.
- Parse `!MENTO SHOT` manifests into structured shot objects.
- Provide a sculptural camera path editor.
- Implement deterministic capture timing.
- Have mobile-aware UI (splitter, fullscreen, safe areas) and an LDraw-style ruler.

`mento-369.html` in particular boots into a **Grace lab**:

- Scene presets: GRACE / DESERT / BLANK.
- Built-in `GRACE-SCENE-SAMPLE.bin` GLB.
- `LOAD GRACE SAMPLE` button for `Searchers_Rider_Grounded_SpinFix.mpd`.

Shield of Achilles **brings that surface into the Homer chrome** as a docked panel.

---

## Layout: Shield of Achilles Shell

File: `shield-of-achilles.html`

Starting point: a direct copy of `homer.html`, with minimal but precise edits:

- **Header title** still describes the tab set:
  - Swiss / Frank / Courage / Weaver / Were / Master / Mento.
- **Panels**:
  - `data-panel="swiss"` → Swiss Designator.
  - `data-panel="frank"` → `wag-frankwag-fromer.html` (Homer Frank wrapper).
  - `data-panel="courage"` → `wag-courage.html` (Homer Courage).
  - `data-panel="weaver"` → `assembly-line.html` (Unified Weaver).
  - `data-panel="were"` → `wag-were.html`.
  - `data-panel="master"` → `wag-master.html`.
  - `data-panel="mento"` → **MENTO-369** (Shield-specific change).

The key panel difference:

```html
<section class="panel" data-panel="mento">
  <div class="panel-body">
    <iframe src="mento-369.html" title="MENTO v8 Camera"></iframe>
  </div>
</section>
```

vs. Homer’s original:

```html
<section class="panel" data-panel="mento">
  <div class="panel-body">
    <iframe src="Brickfilm_Studio_Kit/REALITY MEDIA_MOMENTO/momento.html?host=homer" title="Momento / Mento"></iframe>
  </div>
</section>
```

So Shield of Achilles is **HOMER with the MENTO tab bound to the new 369 camera surface instead of the legacy Momento host**.

---

## How MENTO-369 Behaves Inside Shield

Inside the Mento panel, `mento-369.html` runs unchanged:

- Owns its own Three.js scene, GLB loading, and camera.
- Offers the GRACE / DESERT / BLANK scene presets.
- Provides the MENTO SHOT parser, keyframe editor, and capture stack.
- Uses the mobile splitter and fullscreen affordances.

In other words, in Shield of Achilles **MENTO-369 is not yet wired into Courage’s `MomentoInterface`**. It is a **parallel camera lab** that simply shares chrome and screen real estate with Homer’s GOLD chain.

This yields a concrete, usable pattern:

- Use **Swiss / Frank / Courage / Weaver / Were / Master** exactly as in Homer:
  - MPD/GOLD authoring and lab work.
- Use **Shield’s Mento tab (MENTO-369)** as a dedicated camera + capture surface aimed at:
  - Grace sample scenes.
  - Desert GLB experiments.
  - Any GLB + MENTO manifest you choose to load in 369.

All of this lives in **one browser window**, with Homer’s tab + grid layout.

---

## Relationship to Other Docs

- `HOMER-STUDIO-OLOG.md`
  - Explains the original Homer shell: Swiss / Frank / Courage / Weaver / Were / Master / Momento capture.
  - Focuses on GOLD / MPD loops and lab integration.

- `MENTO-HOMER-OLOG.md`
  - Maps how standalone MENTO-368/369 surfaces conceptually relate to Homer.
  - Describes side-by-side, docked-panel, and future `MomentoInterface` mounting patterns.

- `SHIELD-OF-ACHILLES-OLOG.md` (this file)
  - Records the **first concrete docked-panel mount**:
    - A Homer-derived shell where the Mento panel is explicitly **MENTO-369**.
    - Does not yet share COURAGE’s scene/camera; that’s reserved for a future integration pass.

Together, these three ologs trace a path from:

> HOMER (geometry + GOLD loop) → MENTO (camera instrument) → Shield of Achilles (Homer × MENTO shell).

---

## Future Work (Shield Variant)

Open questions for Shield of Achilles:

1. **Shared scene / camera via MomentoInterface**
   - Should Shield grow a variant of MENTO-369 that can attach to Courage’s active scene via `MomentoInterface`?
   - How should that coexist with 369’s own GLB loader and scene presets?

2. **Capture artifact routing**
   - Where should MENTO-369’s captures and camera manifests live in relation to GOLD / MPD?
   - Possible pattern: store camera paths alongside MPD scenes in the same Swiss/Frank project tree.

3. **Naming and identity**
   - HOMER already uses a Homer/Greek visual identity in favicons and copy.
   - Shield of Achilles could extend that motif to the MENTO panel (badges, HUD copy, or color accents) without breaking the existing studio palette.

For now, Shield of Achilles is the **practical mount point** where:

- The full **HOMER TRUBADOR chain** and the **MENTO-369 camera lab** live in one surface.
- Operators can keep geometry and camera in view together, and iterate narratively on both.
