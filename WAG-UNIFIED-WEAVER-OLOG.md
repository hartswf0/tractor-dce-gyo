# Unified L-System Ontology Weaver · Research Olog

## Intent

The **Unified L-System Ontology Weaver** (Assembly Line) is a four-column studio for thinking about an MPD scene as a pipeline:

- **SOURCE (VOID)** – raw MPD lines as text.
- **TEMPLATE (ENTITY)** – per-line entity interpretation (type, name, color, optional description).
- **TRANSFORM (STUD)** – per-line stud skeleton in world + grid space.
- **EXECUTE (ARTIFACT)** – visual artifacts and exports built from that skeleton.

It is the place where we see **lines becoming entities, entities becoming transforms, transforms becoming artifacts**, with XRAY (RB) GOLD as a primary feed.


## Columns and Semantics

### SOURCE (VOID)

- **What it shows**
  - One card per MPD line (`processedData[i].entity.raw`).
  - Distinguishes type-1 geometry from type-0 meta / STEP comments.
- **Stats**
  - Column header summary: `N MPD lines` (total processed lines).
- **Role**
  - Ground truth for all downstream reasoning.
  - The thing you search when you filter by text or line index.


### TEMPLATE (ENTITY)

- **What it shows**
  - For type-1 lines:
    - `#index`, `Type 1` badge.
    - `part name` (e.g. `parts/24190.dat`).
    - `color` chip and color ID.
    - Optional `DESC:` line when present in MPD:
      - Parsed from preceding `0 // Desc:` comments.
      - E.g. `DESC: Constraction Torso 5 x 10 with Partial Gear and Connector`.
  - For meta lines:
    - A softer, dashed card with the interpreted meta name (e.g. `STEP` or `Meta Command`).
- **Stats**
  - Column header summary: `M parts` or `No parts` where `M` is the count of geometry lines with studs.
- **Role**
  - Bridges raw MPD into semantic entities (part + color + description).
  - Primary surface for ontology-like questions: "what parts are here?", "what is this line?".


### TRANSFORM (STUD)

- **What it shows**
  - Per-line transform data for geometry:
    - Position row: `POS X/Y/Z`.
    - 3×3 transform matrix grid.
    - Stud visualization:
      - **STUD MAPPING** grid for low density.
      - **GALAXY MAP** canvas for high-density stud clouds.
    - Optional **Transform / Compare** overlays when modes are enabled.
- **Source of studs**
  - From `stud_skeleton_v2.nodes` when present (via XRAY/COOL pipeline).
  - From template / local library or synthetic fallback when skeletons are not available.
- **Stats**
  - Column header summary (via `updateStudMapSummary()`):
    - `K lines · S studs`
    - `K` = number of geometry lines with at least one stud.
    - `S` = total stud count across those lines.
- **Role**
  - The canonical per-line stud skeleton view.
  - Entry point for building **StudMap MPD** exports and GOLD scenes.


### EXECUTE (ARTIFACT)

- **What it shows**
  - A visual artifact per geometry line:
    - Title row: `#index · part name` (truncated for long names).
    - Canvas preview (`preview-canvas`) of the part’s stud skeleton.
    - Action buttons:
      - `JSON` – export per-line artifact JSON.
      - `Redraw` – re-render the preview.
- **Stats**
  - Column header summary: `K artifacts` or `No artifacts` where `K` matches geometry lines with studs.
- **Role**
  - The **action** layer: per-line outputs that other systems or users can consume.
  - Mirrors what a future XRAY/COOL-aware viewer might show line-by-line.


## Selection, Scrolling, and Weave

### Selection semantics

- **Hover**
  - Soft preview: draws the SVG weave (`#weave-canvas`) for that line and refreshes its canvas preview.
  - Does **not** lock scroll or set `selectedId`.
- **Click**
  - Hard select:
    - `state.selectedId = lineId`.
    - `highlightRow(lineId)` marks the same line in all four columns.
    - `snapToLine(lineId)` scrolls each column so that line is centered.
    - `drawWeave(lineId)` redraws the connecting arcs between SOURCE → TEMPLATE → TRANSFORM → EXECUTE.
- **Unselect**
  - Moving the pointer out of `#app` clears highlights and selection:
    - Columns go back to independent scroll.

### Coupled scroll

- With `state.selectedId != null`:
  - Scrolling one `col-content` computes a scroll ratio and applies it to the others.
  - This keeps all columns “locked” on the same vertical band while exploring nearby context.
- With `selectedId == null`:
  - Columns scroll independently.


## Assembly Line Mode and Shuttle Bar

- **Assembly Line mode** runs a per-line build:
  - Finds the next geometry line (`morphism.isGeometry`).
  - Updates assembly status (current line, studs built, progress).
  - Calls `animateColumnBuild(column, lineId, colIdx)` for each layer.
- **Shuttle bar** (per-line assembly-progress):
  - A glowing bar anchored to the bottom of the card.
  - Animates from 0 → 100% width, acting like a shuttle pass over that line.
  - Each column call is slightly delayed, so the shuttle visually walks SOURCE → TEMPLATE → TRANSFORM → EXECUTE.
- This is the visual metaphor for the loom: the machine advancing one line at a time through the four layers.


## Search, Filtering, and Parts-Only Mode

- **Search input (`weaverSearch`)**
  - Filters lines by:
    - raw MPD text,
    - part name,
    - parsed `DESC:` text,
    - line index.
  - Filter is applied before DOM creation; non-matching lines are omitted from all four columns.
- **PARTS ONLY**
  - Toggles `state.partsOnly`.
  - When enabled, only type‑1 geometry lines are shown.
  - Combines with search, so you can, for example, filter to “Dragon Head” parts only.


## XRAY (RB) Integration

XRAY (RB) is the formal name for the Red Bull line sampler.

- **Input**
  - MPD scene in Courage.
  - XRAY (RB) action emits:
    - `mpd_content` (text),
    - `stud_skeleton_v2` (nodes per line),
    - `redbull_events` (temporal sampling log).
- **Transport**
  - GOLD fragment persisted as `localStorage.wag_redbull_gold`.
  - Broadcast on `wag-frank` bus as `kind: 'redbull-gold'`.
- **Assembly Line behavior**
  - Listener for `redbull-gold`:
    - Validates `mpd_content` + skeleton nodes.
    - Persists GOLD to localStorage.
    - Calls `initFromMpdAndSkeleton(mpdContent, skeletonNodes, redBullEvents)`.
    - Calls `rebuildDOM()`.
  - Auto-focus logic:
    - Chooses a representative line to focus on:
      - Prefer the smallest `lineIndex` present in `redbull_events`.
      - Fallback to the first geometry line with studs.
    - Calls:
      - `highlightRow(targetLine)`
      - `snapToLine(targetLine)`
      - `drawWeave(targetLine)`
      - `state.selectedId = targetLine`
    - Result: after XRAY (RB) runs in Courage, Unified Weaver immediately shows and locks onto one XRAY’d line across all columns.


## Media Bar (Footer)

To keep the top of the studio focused on work, camera controls live in a footer bar:

- **Footer contents**
  - Left: `Media for Thinking: MPD → Entity → Transform → Artifact Pipeline`.
  - Right:
    - `Rotation` slider and numeric label.
    - `XY` (top view) and `ISO` (45° isometric) buttons.
    - `Zoom` slider and numeric label.
- **Behavior**
  - Toggled via `MEDIA BAR` button in the header.
  - On small screens, can be collapsed to maximize vertical space.


## Haptics and Sound

- **Rotation detents**
  - When rotation crosses 45° buckets, we trigger:
    - Light `navigator.vibrate()` (where supported).
    - A short, low-frequency Web Audio “thump”.
- **Assembly steps**
  - Each line build (`animateLineBuild`) triggers the same thump/haptic pattern.
- **Goal**
  - Make the Assembly Line feel like a precise, satisfying machine without being noisy: every “tick” corresponds to a meaningful state change.


## Relationship to Other Studios

- **Courage + XRAY (RB)**
  - Courage is the primary producer of XRAY GOLD (`redbull-gold`).
  - Unified Weaver consumes those fragments as its canonical input for stud skeletons.
- **Line Grid Viewer**
  - Another view on per-line studs and MPD content.
  - Shares the GOLD ingest path and StudMap MPD exports with Unified Weaver.
- **KINETIC BELT (mobile-assembler.html)**
  - Mobile-first belt view of lines and studs.
  - Listens to `wag_redbull_gold` and `redbull-gold` like Unified Weaver.
- **BLUE-LOOM (mobile-blue-loom.html)**
  - Mobile matrix/loom view of per-part transforms and studs.
  - Also XRAY-aware via GOLD + `redbull_events`.
- **TRUBADOR / WAG-COOL-OLOG**
  - TRUBADOR suite treats Unified Weaver as the MPD→Entity→Transform→Artifact lens.
  - WAG-COOL-OLOG defines the canonical stud/grid contracts that Weaver relies on (`stud_skeleton_v2`, `grid_spec`, XRAY (RB) semantics).


## Open Questions / Future Work

- **Shuttle visualization**
  - Today, each line’s build bar acts as a local shuttle.
  - Future: a single SVG “carriage” moving across all columns at the selected line’s Y-position, synchronized with Assembly Line steps and XRAY events.
- **Side-panel camera on mobile**
  - Rotation/Zoom currently live in the footer.
  - Future: move sliders into a right-side tab or flyout on very small screens, leaving only the tagline in the footer.
- **Deeper Neural Flow integration**
  - Neural Flow could key off `redbull_events` for the selected line, drawing one event particle per XRAY event.
  - This would make XRAY’s temporal behavior more legible inside Unified Weaver itself.
