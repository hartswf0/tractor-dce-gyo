# BRICK Grid Research Olog — 9×9 Code Terrains

## 0. Overview

The **BRICK Grid system** is a family of 9×9 instruments for seeing, slicing, and staging code as a *terrain* rather than a flat file.  It generalizes the Brickbender GS2P stack:

> **Ground → Site → Sky → Perspective**
>
> applied to **code**, **runtime**, and **UI**.

This olog describes the shared objects and morphisms across the BRICK family:

- **Philosophy / seed**
  - `brickbender-philosophy.html`, `BRICKBENDER-PHILOSOPHY.md`
- **Core 9×9 code instruments**
  - `brick-branch.html` (Multimodal Core)
  - `brick-architect.html` and `brick-arch.html` (Architect HUDs)
  - `brick-apex.html` (Apex editor)
  - `brick-utility.html` (Aether utility grid)
  - `brick-create.html` (Hyper-Grid FULL_STACK)
- **Forking / preview instruments**
  - `brick-sovereign.html` (Sovereign scope explorer)
  - `brick-inc.html` (Forking Path)
  - `build-bus.html` (Build-bus preview & playback)
- **Hyper surfaces and graphs**
  - `hyper-grid.html`, `hyper-grid-00.html`, `hyper-monitor.html`
  - `lgi-brickbender.html`, `lgi-pro.html`
- **Family overview**
  - `brick-grid-family.html` (visual atlas of all of the above)

The goal: a **coherent ecology** of instruments where each 9×9 grid is a different projection of the same underlying code/world, and where branching, autoplay, and previews stay legible.

---

## 1. Objects — What Worlds Does BRICK Touch?

### 1.1 Code terrain (C)

- **Object:** a codebase slice (HTML / JS / CSS / Markdown / mixed).
- **Internal structure:**
  - `lines[]`: raw text lines.
  - `blocks[0..80]`: semantic buckets projected into 9×9 cells.
    - `type ∈ {function, variable, tag, control, style, block}`
    - `name`: symbol or tag name.
    - `line`: representative line index.
    - `deps[]`, `callers[]`: adjacency in the call / reference graph.
- Each BRICK instrument ingests `C` and builds its own view over `blocks` + `edges`.

### 1.2 Grid cells (G)

- **Object:** a single cell `g ∈ {0..80}` in a 9×9 grid.
- **Attributes:**
  - `row, col` (0–8 each), `index = row*9 + col`.
  - `state` flags depending on instrument:
    - `focus`, `up`, `down`, `muted`, `preview-visible`, playback state.
- In philosophy terms, each cell is a **location patch** that can be painted as Ground/Site/Sky/Perspective.

### 1.3 Branch instances (B)

- **Object:** a derived view cut out of `C`.
- In `brick-branch.html` and its cousins, branches carry:
  - `id`: stable branch id.
  - `rootIndex`: the grid cell / block that spawned this branch.
  - `startLine, endLine`: contiguous slice of `lines`.
  - `lines[]`: local lines (copy of that slice).
  - `fullContext[]`: optional view of the parent code.
- In Sovereign/Forking Path/Build-Bus, **branch** is often implicit:
  - a scope path in the branch bar (stack of `{name, start, end, depth}` scopes).

### 1.4 Scope paths (S)

- **Object:** a stack of lexical scopes that contain a given `block`.
  - `S = [ROOT, function, inner block, tag ...]`.
- Rendered as a **branch bar** in:
  - `brick-sovereign.html`, `brick-inc.html`, `build-bus.html`, `brick-branch.html` (variants).
- Acts as a *navigable address* into the code terrain.

### 1.5 Preview DOM (P)

- **Object:** the DOM tree running inside an iframe when instruments are in PREVIEW/RUN mode:
  - Sovereign, Forking Path, Build-Bus, Apex all have a `preview-frame`.
- Important sub-objects:
  - `p.element`: matched DOM node for a given `block` (by `id` or `tag`).
  - `p.viewport`: visible window into the DOM (scroll region).

### 1.6 Runtime traces (R)

- **Object:** temporal annotations over C.
  - In Hyper-Monitor / Brick-Branch, R shows up as playback, flashing wires, active lines.
- Not every instrument implements true runtime, but all share the idea of **stepping** through `blocks` in time.

### 1.7 Instruments (I)

- **Object:** a specific tool surface with a 9×9 core:
  - `I_branch`, `I_arch`, `I_apex`, `I_utility`, `I_create`, `I_sovereign`, `I_inc`, `I_build`, `I_hyper-grid`, `I_hyper-monitor`, `I_lgi`…
- Each `I` chooses:
  - how to map `C → (blocks, edges)`;
  - how to render `G` and `B`;
  - what controls (branch, autoplay, preview, ingest) to expose.

---

## 2. Morphisms — What Arrows Matter?

### 2.1 Ingestion

- **ι: Source → C**
  - From:
    - `document.documentElement.outerHTML` (self-ingest), or
    - pasted code in an ingest textarea.
  - To:
    - `lines[]` + reset of `blocks`, `edges`, `scopes`, `branches`.
- Implemented in all BRICK instruments as `ingestSelf()` / `ingest()`.

### 2.2 Projection to grid

- **π: (C, heuristics) → (blocks[0..80], edges)**
  - Uses regex-based heuristics:
    - functions/classes → `type='function'`.
    - `const/let/var` → `variable`.
    - `<tag>` → `tag`.
    - control words → `control`.
  - Divides `lines` into ~81 chunks (`linesPerCell`) and assigns blocks by priority.
- Each instrument tweaks π slightly (e.g., Brick-Create includes CSS, style roles).

### 2.3 Focus / xray

- **χ: (C, blocks, idx) → (grid state, HUD, branch bar)**
  - Input: active index `idx`.
  - Effects:
    - reset classes on `.block`, `.line`, `.cable`.
    - mark `focus`, `up`, `down`, `muted` according to `deps` / `callers`.
    - compute scope path for that `block.line` and render branch crumbs.
    - update USED BY / USES chips with clickable neighbors.
- Implemented as `xray(idx)` + `updateNav` + `updateBranch` in each surface.

### 2.4 Branch creation

- **β: (C, idx) → B**
  - In Multimodal Core: explicit branch instances with `startLine..endLine` slices.
  - In Sovereign / Forking Path / Build-Bus: *implicit* branches are paths through scopes:
    - selecting a grid cell chooses a **lexical branch** (chain of scopes) and shows it as breadcrumbs.
- Over time, these branches can be stored, named, and revisited; instruments differ in how far that pipeline is implemented.

### 2.5 Autoplay / traversal

- **τ: (blocks, order) → time‑indexed focus**
  - Instruments provide a `toggleAutoplay` or `play` control.
  - At each step:
    - choose next `idx` (scanning, BFS, specific script); 
    - apply χ (`xray(idx)`),
    - scroll the code view to `block.line`,
    - optionally drive preview and sound.
- τ turns the grid into a **tour guide** over the terrain.

### 2.6 Preview coupling

- **φ: (idx, C) → viewport(P)**
  - Sovereign / Forking Path / Build-Bus / Apex couple grid to PREVIEW:
    - grid/click or autoplay → compute approximate line range → map to vertical scroll position in iframe;
    - search for DOM element by `id`/`tag` to apply `.inception-focus` bounding box;
    - scroll element into center.
- Combined with τ, this yields **“what am I looking at?”** feedback for each territory.

### 2.7 Bus / cross‑instrument linking

- **ψ: (I₁, I₂, C) → shared coordinates**
  - `brick-grid-family.html` is the human‑level atlas.
  - `build-bus.html` and related surfaces start acting as a *code bus*, where the same source / branch path can be explored in multiple instruments.
- The long‑term aim is a **functor** from BRICK instruments to other studio tools (e.g., GS2P graphs → LGI‑Pro), but the first step is consistent 9×9 coordinates and shared scope paths.

---

## 3. Theory — What Is BRICK Trying To Be?

### 3.1 A 9×9 atlas for code worlds

- Codebases are usually seen as flat files or trees.
- BRICK insists that code is a **terrain**:
  - blocks as **sites**,
  - connections as **paths/wires**, 
  - traces as **weather / traffic**, 
  - previews as **views from a camera**.
- The 9×9 grid is small enough to fit a single glance, large enough to host a non‑trivial structure.

### 3.2 GS2P for software

- Brickbender introduced GS2P for worldbuilding; BRICK applies it to code:
  - **Ground**: stable structure and navigation (blocks, scopes, dependencies).
  - **Site**: important regions (branches, scopes, hotspots).
  - **Sky**: temporal / aesthetic overlays (runtime flashes, preview framing, color semantics).
  - **Perspective**: instrument choice and camera/view mode.
- Different instruments emphasize different slices:
  - Branch / Monitor: Ground + Perspective.
  - Architect / LGI‑Pro: Ground + Site + architectural Sky.
  - Sovereign / Forking Path / Build‑Bus: Perspective & branching between code and preview.

### 3.3 Many instruments, one coordinate system

- Each BRICK tool is a different **projection** of the same underlying objects:
  - Where Brick‑Branch uses wires and audio, Brick‑Arch uses HUD chips.
  - Where Sovereign/Inc show scope stacks and previews, APEX focuses on editing and apex‑level structure.
  - Hyper‑Grid / Hyper‑Grid‑00 treat 9×9 as UI or media surface rather than just code.
- The shared 0–80 indexing and ingestion pipeline mean **knowledge can travel**:
  - e.g. a hot path identified in Branch can be re‑seen in Sovereign’s preview, or exported as nodes into LGI‑Pro.

### 3.4 A bridge between symbolic and perceptual reasoning

- Symbolic side:
  - scopes, call graphs, dependency layers, functors between tools.
- Perceptual side:
  - colors, motion, sound, haptics, bounding boxes.
- BRICK aims to make code **felt**, not just read.
  - e.g. playback speed / tempo in Branch, light‑up nodes in Hyper‑Monitor, preview bounding boxes in Sovereign / Inc / Build‑Bus.

---

## 4. Limitations — Where Does It Currently Fail?

### 4.1 Heuristic parsing

- Projection π uses simple regexes.
- Limitations:
  - misses complex JS/TS, JSX, nested templates;
  - confuses multiple declarations per line;
  - cannot yet follow imports across files.
- Result: some blocks are empty or misleading; wires may be approximate.

### 4.2 Local slices, not whole‑project graphs

- Most instruments ingest a **single HTML file** (self or paste).
- Cross‑file graphs (modules, packages) are not yet first‑class.
- A true “project‑scale” BRICK would need:
  - project‑wide indexing,
  - symbol resolution across files,
  - navigation that hops between grids.

### 4.3 Manual branch semantics

- Branches/scopes are mostly lexical (based on braces / tags), not semantic.
- Autoplay orders are simple sweeps, not optimized tours.
- Instruments do not yet share a **canonical branch language** (named and storable cuts) across the family.

### 4.4 Loose coupling to runtime

- Hyper‑Monitor and Branch hint at runtime traces but do not yet ingest structured traces (coverage, profiling, logs).
- Preview coupling is based on scroll heuristics and DOM id/tag matching, not on a formal mapping from code locations to rendered elements.

### 4.5 Fragmented UI vocabulary

- Each instrument explores slightly different HUDs and controls.
- While this is healthy experimentation, it increases cognitive load.
- A future “Brick Design System” could unify:
  - nav decks, branch bars, playback controls, ingest panels,
  - semantics of color and motion across tools.

---

## 5. Hopes — What Would a "Finished" BRICK System Look Like?

### 5.1 Project‑scale BRICK atlas

- 9×9 views per module, stitched into a **project atlas**.
- Cross‑file navigation as natural as moving across cells.
- Branch language that can name, save, and revisit cuts across the whole codebase.

### 5.2 True GS2P functors

- Functors from code GS2P → world GS2P:
  - map functions to **Ground** in story world (services, paths),
  - map UI components to **Sites**, 
  - map background processes / logs to **Sky**,
  - map user journeys to **Perspectives**.
- BRICK instruments become a **bridge** between software architecture and narrative/worldbuilding tools.

### 5.3 Runtime‑aware grids

- Ingest profiling, coverage, and traces to tint cells and wires with live data.
- “Weather maps” of hot paths, slow calls, error zones.
- Time controls that scrub across execution, with Sovereign‑style previews of what that looks like in the UI.

### 5.4 Shared buses and exports

- A small, explicit protocol for moving BRICK state between instruments:
  - `(source, lines, blocks, scopes, focus, branches)` as a payload.
- Build‑Bus and LGI‑Pro as first‑class buses/graphs:
  - BRICK → LGI: export GS2P graphs or system diagrams.
  - LGI → BRICK: import story/system plans as overlays on code.

### 5.5 Better onboarding and pedagogy

- Brick‑Grid family page + this olog + per‑instrument docs form a coherent **curriculum**:
  - start with Brickbender philosophy (worldbuilding GS2P),
  - then move into Branch / Architect (code GS2P),
  - then Sovereign / Inc / Build‑Bus (preview and branching),
  - then Hyper‑Grid / LGI‑Pro (UI and system graphs).
- Aim: make it feel natural to think of code, scenes, and systems as 9×9 terrains that can be explored from many perspectives.
