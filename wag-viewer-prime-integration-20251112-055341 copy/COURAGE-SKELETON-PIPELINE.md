# Courage Skeleton Pipeline (Experiment)

This document captures the current experimental pipeline for using **Courage** as the source of truth for MPD scenes, exporting **GOLD** snapshots, and round‑tripping skeleton data through new WAG tools.

It is intentionally practical: how to use it *today*, and how the pieces fit together.

---

## 1. Courage viewer (wag-courage.html)

**Role:** Authoritative viewer/editor for MPD scenes. Generates diagnostics and GOLD snapshots.

Key behaviors:

- **MPD input**
  - Loads standard LDraw MPD/ldr files.
  - Type‑1 lines follow the usual LDraw format:
    
    ```
    1 <col> <x> <y> <z>  <a> <b> <c>  <d> <e> <f>  <g> <h> <i>  <partId>
    ```

- **Stud skeleton computation**
  - `computeStudSkeletonAndPlanes()` scans the compiled scene and builds:
    - `STATE.studSkeleton`: array of stud nodes with `worldPos`, `gridX`, `gridZ`, `layer`, and `lineNum` (the MPD source line).
    - `STATE.groundViolationSummary`: per‑line `deltaY` and violation stats.
  - `drawStudSkeletonOverlay()` draws:
    - Cyan "normal" studs.
    - Red "problem" studs (below the base grid, `deltaY > 0`).
    - Optional green "ghost" targets at the corrected height.
  - Controlled by diagnostics flags: `studNormal`, `studProblem`, `studGhost`, `skeletonOnly`.

- **Ground correction**
  - We fixed the ground correction path so that:
    - Only the **Y token** on type‑1 lines is updated.
    - Part IDs and other tokens remain unchanged.
    - Positive `deltaY` moves studs **up** in MPD space (more negative LDraw Y).

- **Skeleton MPD export**
  - `buildStudSkeletonMPD()` can synthesize a proxy MPD representing the skeleton, using `3003.dat` bricks at stud centers.
  - This is useful for debugging and for external tools that only understand MPD.

---

## 2. GOLD snapshot format

When you capture a screenshot from Courage, it writes a **GOLD JSON** file with:

- `mpd_content`
  - The full MPD text of the current scene (after any edits / ground fixes).

- `stud_skeleton`
  - An array of stud nodes:
    
    ```json
    {
      "x": <number>,
      "y": <number>,
      "z": <number>,
      "layer": <int>,
      "kind": "stud",
      "lineNum": <int>
    }
    ```
  - `lineNum` is the original MPD line this stud belongs to.

- `diagnostics`
  - Capture of which overlays were enabled (grid, axes, skeletonOnly, studNormal/studProblem/studGhost, etc.).

Other experimental files such as `*_skeletons.json` may store per‑line skeleton summaries as:

```json
{
  "studPitch": 20,
  "plateHeight": 8,
  "lines": [
    {
      "lineNum": 35,
      "raw": "1 4  40  0 -60 ... 3003.dat",
      "partId": "3003.dat",
      "color": 4,
      "studs": [ /* per‑stud data, optional */ ]
    }
  ]
}
```

---

## 3. WAG WERE — Master Builder adaptor (wag-were.html)

**Role:** A "werewolf" adaptor that walks between **MPD form** and **skeleton form**.

Main capabilities:

### 3.1 Inputs

- **Raw MPD**
  - `📄 EDIT RAW` overlay: paste any MPD, `LOAD SCENE` → parsed into `state.lines`.

- **GOLD JSON / skeleton JSON**
  - `📦 JSON` overlay or drag‑and‑drop:
    - If JSON has `stud_skeleton` → uses that as skeleton.
    - If JSON has `lines[].studs` → flattens them into a `stud_skeleton`‑style array.
    - If JSON has `mpd_content` only → loads the MPD scene.
    - Bare arrays are treated as `stud_skeleton`.

### 3.2 Skeleton handling

- **Stud storage**
  - `state.studs` retains the loaded stud array (from GOLD or skeleton JSON).

- **Line color map**
  - When GOLD with `mpd_content` is loaded, `buildLineColorsFromMpd()` scans it and builds:
    
    ```js
    state.lineColors[lineNum] = colorCode; // 1-based line numbers
    ```

- **Skeleton MPD synthesis**
  - `loadSkeletonFromStuds(studs)` builds a new MPD:
    
    ```ldraw
    0 FILE wag_skeleton_from_studs.mpd
    0 Name: WAG Skeleton From Courage
    0 !LDRAW_ORG Model
    0 BFC CERTIFY CCW

    0 line 35 layer 0 stud 0
    1 4   x y z  1 0 0  0 1 0  0 0 1 3003.dat
    ```
  - For each stud `s`:
    - Position from `s.x,y,z` or `s.worldPos`.
    - Color:
      - `s.color` if present, otherwise
      - `state.lineColors[s.lineNum]` if known, otherwise
      - default `4` (red).
  - Comments `0 line N layer L stud K` preserve the mapping to original MPD lines.

### 3.3 Visual layers

- **BricksRoot (proxy bricks)**
  - One `3003.dat`‑sized cube per skeleton MPD line.
  - Inherits color from the synthesized skeleton MPD (see above).

- **BonesRoot (bounding boxes)**
  - For each original `lineNum`, we aggregate the positions of all associated proxy bricks and draw a cyan wireframe box around them.
  - Bones are tagged with `userData.groupKey = String(lineNum)`.

- **StudsRoot (orbs / point cloud)**
  - Each stud becomes a small sphere at its exact center.
  - Color:
    - Cyan = normal.
    - Red = `deltaY > 0` (problem stud) if that field is present.
    - Green = `isGhost` studs if present.
  - Orbs also carry `userData.groupKey = String(lineNum)` so they can be used for selection.

### 3.4 Group selection by part

- We interpret "group by line" as **group by original MPD lineNum**.

- During `update3D()`:
  - Bricks and bones corresponding to a given `lineNum` share a `groupKey`.

- On click in the viewport:
  - A `Raycaster` intersects bones and stud orbs.
  - We find the first hit whose `userData.groupKey` is set.
  - All `state.lines` with the same `groupKey` are marked `selected = true`.
  - The editor re-renders, and dials now operate on that entire group.

This gives a concrete control surface:

- Click any bone or orb for a piece → select all geometry for that original MPD line.

### 3.5 Export

- `📋 EXPORT` copies the current MPD (skeleton MPD or regular scene MPD) to the clipboard.
- You can paste this directly back into Courage, into another editor, or into a file.

---

## 4. WAG SYMBIOGENE (wag-symbiogene.html)

**Role:** Experimental skeleton visualizer for Courage.

- Loads **Courage stud skeleton JSON**.
- Renders:
  - Stud spheres.
  - Bounding box "bones" grouped by `lineNum`.
- Useful for visually validating detection, layers, and ground relationships.

It shares the same mental model as WAG WERE’s skeleton layer, but without the MPD editor UI.

---

## 5. Concept: WAG VAMP (future)

Working name: `wag-vamp.html` — part bat, part human.

Intended role:

- Live in **world/Y‑up space**, not MPD space.
- Consume GOLD `stud_skeleton` or point‑cloud JSON as its native format.
- Render:
  - Very small orbs (point cloud) for studs.
  - Pure **volume wireframes** per part (no thick cubes), possibly lozenges or cages.
- Focus on:
  - Editing skeleton densities and volumes.
  - Making higher‑level bone structures for animation / rigging.

WAG VAMP would *feed* WAG WERE:

- VAMP edits the skeleton in a clean, volume‑centric space.
- WERE converts that back into proxy MPD and MPD transforms for Courage.

---

## 6. Current round-trip summary

1. **Author in Courage**
   - Build/adjust scene in Courage (wag-courage).
   - Let Courage compute `stud_skeleton` and ground violations.

2. **Capture GOLD**
   - Take a GOLD screenshot → `.json` with `mpd_content` + `stud_skeleton` + diagnostics.

3. **Skeleton inspection / editing**
   - Open `wag-were.html`.
   - `📦 JSON` → paste GOLD JSON or drag‑drop the file.
   - WERE builds:
     - `state.studs` point cloud.
     - Proxy skeleton MPD (one part per stud) with colors per original MPD line.
     - Bones (one bounding box per original MPD line).
   - Use:
     - `⚪ ORBS` + 🔵/🔴/🟢 to control stud visibility.
     - `🦴 BONES` to toggle volumes.
     - Click any bone/orb to select the whole piece.
     - Dials to nudge parts in LDraw space.

4. **Export back to MPD**
   - `📋 EXPORT` → MPD to clipboard.
   - Paste into Courage or another tool for further work.

---

This pipeline is experimental but already useful for:

- Diagnosing ground issues.
- Visualizing per-part volumes from Courage.
- Building and editing MPD skeleton representations that stay keyed to original line numbers and colors.

---

## 7. WAG MASTER LAB (wag-master.html)

**Role:** Containment-field lab that overlays Courage GOLD skeleton data on top of a compact MPD line editor.

### 7.1 Inputs

- **Plain MPD**
  - Paste or load MPD text via the RAW overlay.
  - Parsed into `state.lines` (type‑1 parts + headers), with dials for color, X/Y/Z, and the 3×3 matrix.

- **GOLD JSON** (from Courage)
  - `mpd_content` → parsed into `state.lines`.
  - `stud_skeleton` → `state.studs` (per‑stud point cloud keyed by `lineNum`).
  - `part_skeletons` → `state.partSkeleton` (one control node per MPD line).
  - `ground_violations` → `state.groundViolations` (per‑line counts of below‑grid studs).

### 7.2 3D scene and bricks

- Scene lives inside a **containment box** with walls and a floor used for telemetry.
- `worldRoot` flips Y so MPD space appears in a familiar up/down orientation.
- Each type‑1 MPD line becomes a simple proxy brick:
  - BoxGeometry scaled heuristically (baseplates vs normal bricks).
  - Tinted by LDraw color via `lColors`.
  - Selected bricks glow and cast colored projections onto the room walls.

### 7.3 Skeleton overlays

All overlays live under `skeletonRoot` so they share the same coordinate transform as bricks.

- **Stud cloud** (from `stud_skeleton`)
  - Each node becomes a small sphere at `(x, y, z)`.
  - Colored by the owning MPD line’s LDraw color when possible.
  - Filtered by selection: if any parts are selected, only studs for those `lineNum` values are drawn.

- **Bones** (per‑line proxy volumes)
  - For each `lineNum`, accumulate a `Box3` over all associated studs and draw a wireframe box.
  - Tinted by part color when mapped back to `state.lines[lineNum‑1]`.
  - If that `lineNum` appears in `ground_violations`, the bone is **hot red** to highlight problem parts.

- **Part control dots** (from `part_skeletons`)
  - Each entry is treated as a **single control point per MPD line**:
    - `lineNum` (0‑based editor index) and `worldPos`.
    - Drawn as a larger sphere so it reads as a handle rather than a stud.
    - Colored by the MPD line’s LDraw color.
  - Only shown for currently selected lines when a selection exists, making them act as per‑part “anchors”.

### 7.4 Selection and interaction

- **Click‑to‑select** uses the same mental model as WERE, but with more entry points:
  - Click a **stud** → toggles the corresponding `lineNum` in the editor.
  - Click a **bone** → toggles that line.
  - Click a **part control dot** → also toggles that line.
  - Click a **brick** (proxy geometry) → original MPD‑driven selection.
- The editor surface then exposes dials for all selected lines:
  - Moves and rotations propagate to every selected part so group edits stay coherent.
  - Exported MPD remains valid because each edit re‑compiles the type‑1 line.

### 7.5 Part‑dot validation in Courage

- In Courage itself, a `buildPartControlSkeleton()` pass walks the current MPD and emits one **part node** per type‑1 line:
  - `kind: 'part'`, `lineNum`, `partId`, `color`, `worldPos`.
- `drawPartControlOverlay()` renders one yellow dot per part and tags each mesh with `userData.lineNum`.
- A small self‑test helper (`runPartControlSkeletonSelfTest()`) verifies that:
  - The number of part nodes equals the number of eligible type‑1 lines.
  - Each node’s `worldPos` matches the parsed X/Y/Z for that line.
  - The overlay group has an equal number of meshes with matching `lineNum`.

These same semantics are mirrored into GOLD via `part_skeletons` and then into WAG MASTER’s part‑dot layer.

---

## 8. Courage / MASTER studio (courage-master-studio.html)

**Role:** Two‑panel studio that keeps Courage and WAG MASTER in sync via GOLD, so skeleton views update live as you snapshot.

### 8.1 Layout

- Tabs: **Courage** and **Master**.
- Layout modes:
  - **TABS** (single‑panel) – one tool at a time.
  - **2‑UP** – Courage and Master side by side for large screens.

### 8.2 Wolf bus bridge

- Courage emits GOLD snapshots with:
  - `type: 'courage-gold-snapshot'` and `payload` (full GOLD object).
- The studio listens for this message and forwards it into WAG MASTER’s iframe as:
  - `type: 'studio-load-gold-from-courage'`, `payload`.
- WAG MASTER’s listener calls `applyGoldPayloadFromObject(payload)` and then `renderEditor()` + `update3D()`.

Effectively:

1. Author / adjust scene in Courage.
2. Capture GOLD.
3. MASTER immediately refreshes its studs, bones, part dots, and containment‑field telemetry.

This complements the existing **Courage / WERE / SYMBIOGENE** studio, which routes GOLD into WERE and raw skeletons into Symbiogene.

---

## 9. WAG INFINITY LAB (wag-infinity.html)

**Role:** Experimental GOLD‑aware MPD lab that focuses on per‑line proxy bones and aggregated numeric views for multiple selected parts.

Key characteristics:

- Accepts both **plain MPD** and **Courage GOLD JSON**:
  - GOLD: `mpd_content` + `stud_skeleton` → MPD lines + per‑line bones.
  - Tolerant of a trailing `"}."` suffix in JSON files.
- Renders a simple proxy brick scene and **per‑line bones** derived from `stud_skeleton`.
  - When nothing is selected: all bones are shown.
  - When some lines are selected: only bones for those lines are drawn, giving a per‑group proxy cage.
- Exposes a compact STYLE toggle so you can flip between:
  - **BRICKS** only.
  - **BONES** only.
  - **MIXED** bricks + bones.
- Aggregates HUD values over **all selected blocks** instead of a single active line.
  - Makes it easier to reason about ranges and deltas for a selection set.

Infinity is intentionally more MPD‑centric than WERE/MASTER, but GOLD‑aware enough to serve as a bridge between raw MPD editing and skeleton‑driven analysis.

---

## 10. Calibration snapshots and orphan studs

Calibration artifacts live under `Brickfilm_Studio_Kit/wag_courage_tests/` and serve as shared test data for all these tools:

- **MPD source**
  - `wag_courage_calibration_compass.mpd` – canonical test scene for ground and skeleton experiments.

- **GOLD snapshots**
  - `wag-gold-scene-calibration-compass.json` – primary GOLD snapshot with clean `lineNum` wiring; ideal for WERE/MASTER/INFINITY.
  - `wag_gold_scene_1_2025-11-19_03-25-45 (1).json` – alternative GOLD snapshot where many `stud_skeleton` entries have `lineNum: null`.
    - Used to study **orphan studs** (points that cannot be bound back to a specific MPD line).
    - The `ground_violations` summary in this file shows how some parts dominate the below‑ground count (e.g. `lineNum: 39, count: 29`).

- **Skeleton‑only JSON**
  - `wag_courage_calibration_compass_skeletons.json` – per‑line skeleton summaries without embedded MPD, useful for Symbiogene or direct skeleton labs.

Open questions:

- How should orphan studs (`lineNum: null`) be attributed back to parts?
  - Nearest‑neighbor against part‑control dots?
  - Voting by bounding box overlap?
  - Layer‑aware clustering?
- How should labs visually distinguish **trusted** vs **inferred** line ownership for studs?

The WAG MASTER LAB, Infinity lab, and both studios are set up so these calibration files can be loaded quickly to iterate on attribution heuristics.

---

## 11. Future directions

- **WAG VAMP** (planned)
  - Y‑up, volume‑only skeleton / point‑cloud editor that treats GOLD as its native format.
  - Would sit “above” WERE/MASTER, focusing on editing bone volumes and higher‑level rigs, then handing results down as updated MPD transforms or skeleton MPDs.

- **Heuristic line attribution**
  - Design and test concrete heuristics for assigning orphan studs to MPD lines using the calibration compass snapshots.
  - Document failure cases and confidence scores in GOLD.

- **Richer joint views**
  - Combine part control dots, bones, and studs into multi‑layer views where each layer can be toggled independently.
  - Use color, scale, and animation to signal which points are authoritative vs inferred vs problematic.

Together, these notes plus the existing pipeline description form a living research olog for the Courage → GOLD → WAG skeleton ecosystem.
