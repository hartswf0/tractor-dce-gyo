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
