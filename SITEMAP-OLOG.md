# SITEMAP Research Olog — Studios, Birth Order, and LEGO Boards

## 0. Overview

The **SITEMAP system** is a family of surfaces for seeing the DCE‑GYO project not as a flat folder of files, but as a set of

- **studios** (SWISS / FRANK / GRACE, HOMER, TIMBER, BULL, ONYX, etc.),
- **Modulex / LEGO boards** that those studios live on,
- **chronological layers** (birth order and evolution over time),
- and **pattern signatures** (GOLD, ONYX, LEGOS, MPD, stud skeleton, WAG, …).

This olog documents the objects and morphisms that emerged while building:

- `sitemap-live.html` — metadata grid for all HTML/Markdown.
- `sitemap-modulex.html` — Modulex‑styled board.
- `sitemap-studios.html` — planning board grouped by studios.
- `sitemap-lego.html` — LEGO construction view of studios.
- `sitemap-infrastructure.html` — infrastructural inversion view.
- `sitemap-evolution.html` — studio evolution + similarity timeline.
- `sitemap-evolution-lite.html` — mobile‑first birth‑order LEGO list.
- `analyze-sitemap.sh` → `sitemap-data.json` — crawler.
- `birth-dates.json`, `file-learnings.json` — git‑derived birth times + pattern signatures.

The goal: a **coherent ecology of sitemap views** that show how HTML tools click together into studios, how those studios evolved, and how their LEGO metaphors relate back to deeper infrastructural processes.

---

## 1. Objects — What Worlds Does SITEMAP Touch?

### 1.1 Project world (P)

- **Object:** a file in the DCE‑GYO universe.
  - HTML tools (studios, editors, viewers, docs).
  - Markdown docs.
  - MPD / LDraw models (via links and manifests).
- Examples: `index.html`, `homer.html`, `wag-frank.html`, `onyx-abs.html`, `thousand-tetrad.html`, `brick-branch.html`, `wag-gold-editor.html`, `timber-studio.html`.

### 1.2 Sitemap dataset (D)

- **Object:** a JSON record describing each file.
  - `sitemap-data.json` from `analyze-sitemap.sh` includes:
    - `name`, `size`, `modified` timestamps,
    - detected technologies (THREE, LDraw, BroadcastChannel, etc.),
    - outgoing links (`href`, `src`, `iframe`).
- **Morphisms:** updates whenever the crawler is run.

### 1.3 Studio manifest (M)

- **Object:** the *hand‑crafted* studio layout in `index.html`.
  - Bricks laid out in a planning grid with labels like:
    - **HUB & CORE**, **FLAGSHIP EDITORS**, **TIMBER STUDIO**, **BULL ASSEMBLY STUDIO**, **BRICK GRID FAMILY**, **DCE‑GYO / ONYX**, **WAG PRESENTATIONS**, **CORE PROJECTS**, **DOCUMENTATION**.
  - Each anchor brick has:
    - `href` (file), size class (`brick-1x3`, `brick-3x4`…),
    - color class (`color-teal`, `color-yellow`, …),
    - optional `title` tooltip and MPD metadata.
- This is the **authoritative human taxonomy** of studios.

### 1.4 Studio families (F)

- **Object:** a *studio family id* grouping related files.
  - Examples:
    - `swiss-frank-grace`, `gold-courage`, `homer`, `timber`, `bull`, `onyx`,
      `brick-grid`, `ators`, `wag-core`, `tutorials`, `core-projects`, `mento`.
  - Each family carries:
    - `name`, `color` (LEGO‑like),
    - `keywords[]` / `patterns[]` tying it back to files and patterns.
- Implemented in `sitemap-studios.html`, `sitemap-lego.html`, `sitemap-evolution*.html`.

### 1.5 LEGO / Modulex boards (B)

- **Object:** a visual board surface.
  - `b_live`: **metadata grid** in `sitemap-live.html`.
  - `b_modulex`: **Modulex planning board** in `sitemap-modulex.html`.
  - `b_studios`: **studio construction board** in `sitemap-studios.html`.
  - `b_lego`: **LEGO brick construction** of studios in `sitemap-lego.html`.
  - `b_evo`: **evolution lanes** in `sitemap-evolution.html`.
  - `b_evo_lite`: **mobile LEGO stack** in `sitemap-evolution-lite.html`.
- Each board chooses a different visual metaphor (studs, baseplates, bricks, lanes) over the same underlying data.

### 1.6 Birth order / timeline (T)

- **Object:** a chronological view over project files.
  - `birth-dates.json` is built from `git log` and filesystem stats:
    - `file → created_at` epoch.
  - In `file-learnings.json`, each file record carries `born` and later `order` (#1, #2, …) after sorting.
- This enables **birth order** and day/week/month grouping.

### 1.7 Pattern signatures (Σ)

- **Object:** a set of detected patterns for each file.
  - Extracted via lightweight grep from HTML contents:
    - tech: `BroadcastChannel`, `iframe`, `localStorage`, `fetch`, `THREE`, `LDraw`, `WebSocket`.
    - domain: `LEGOS`, `ONYX`, `GOLD`, `MPD`, `stud`, `skeleton`.
    - studio actors: `swiss`, `frank`, `grace`, `courage`, `were`, `master`, `mento`, `weaver`, `wag-`.
  - Stored as comma‑separated `patterns` in `file-learnings.json`.
- Σ is a **semantic fingerprint** for clustering and similarity.

### 1.8 Infrastructural insights (I)

- **Object:** summaries about surfaces vs processes.
  - Extracted in `sitemap-infrastructure.html` from FILES + Σ:
    - how many tools embed iframes (nested studios),
    - where `stud_skeleton` appears (hidden maintenance labor),
    - which files belong to SWISS→FRANK→COURAGE→WEAVER chains.
- This is the bridge to the **Infrastructural Architect** system definition.

---

### 1.9 Topological manifolds (N)

- **Object:** a family of contour / terrain views over SITEMAP.
  - `n_cultural_1`: `sitemap-manifold.html`
    - ATG‑style cultural contour field over studios and roles.
  - `n_cultural_2`: `sitemap-manifold-02.html`
    - ATG shell wired directly to `file-learnings.json` as a scrolling manifold.
  - `n_unified_terrain`: `sitemap-manifold-03.html`
    - Unified ATG terrain originally hand‑authored across WAG / Fork / 1000 Futures.
  - `n_studios_territory`: `sitemap-manifold-04.html`
    - Agent‑based terrain where studio families are **territories** and agents “eat” heat.
  - `n_ethics_pathways`: `sitemap-manifold-05.html`
    - Ethics‑Pathways overlay using studios as regions and steps as terrain metaphors.
  - `n_thesis_pathways`: `sitemap-manifold-06.html`
    - Thesis Pathways grid auto‑populated from `file-learnings.json` (pyramids/essays/interventions/theories).
- **Hub / manifest:** `sitemap-manifold-index.html` gathers all N as an internal **manifold manifest**, in the same way `index.html` is the studio manifest for surface tools.
- All N consume the same underlying objects:
  - studios / families (F),
  - birth order / timeline (T),
  - pattern signatures (Σ),
  - studio manifest (M) for labels and destinations.

---

## 2. Morphisms — What Arrows Did We Build?

### 2.1 Crawl: κ — Files → Sitemap dataset

- **κ: P → D**
  - Implemented by `analyze-sitemap.sh`.
  - For each `file ∈ P`:
    - runs `stat`, greps for known libraries, parses `<a>` and `<iframe>` links,
    - writes a JSON record into `sitemap-data.json`.
- κ turns the **filesystem** into a navigable metadata table.

### 2.2 Manifest embedding: ε — Files → Studio bricks

- **ε: (P, M) → F**
  - Reads `index.html` planning grid.
  - For every brick `a[href=file]` in manifest:
    - assigns that file to a studio family (HOMER, TIMBER, BULL, etc.).
  - Drives the layout in `sitemap-studios.html` and `sitemap-lego.html`.
- ε encodes the **author’s intent** about where each tool “lives” on the board.

### 2.3 Pattern extraction: ρ — Files → Signatures

- **ρ: P → Σ**
  - For each HTML file, a shell/JS pass extracts:
    - occurrences of tech words (`iframe`, `BroadcastChannel`, `THREE`, …),
    - domain words (`LEGOS`, `ONYX`, `GOLD`, `MPD`, `stud`, …),
    - studio names (swiss/frank/grace, courage/weaver/were/master/mento).
  - Stores a **bag of tokens** as `patterns` in `file-learnings.json`.
- ρ provides a cheap, local approximation to the *semantic role* of a surface.

### 2.4 Studio assignment: α — (File, Σ) → Studio family

- **α: (P, Σ, M) → F**
  - Implemented as simple keyword rules in `sitemap-studios.html`, `sitemap-lego.html`, `sitemap-evolution*.html`.
  - For each file, α checks:
    - manifest membership (from ε),
    - name and patterns (`onyx-`, `brick-`, `wag-`, `*tutorial*`, etc.).
  - Returns a studio family id with a LEGO color.
- α is a **partial functor** from raw files into the studio graph.

### 2.5 Birth order: β — Git history → Timeline

- **β: P → T**
  - Uses `git log --diff-filter=A` to find each file’s first commit timestamp.
  - Fallback: `stat` modification times.
  - Writes `birth-dates.json` and propagates into `file-learnings.json` as `born`.
  - `sitemap-evolution.html` and `sitemap-evolution-lite.html` then:
    - sort by `born`,
    - assign **global birth index** (`#1`, `#2`, …).
- β produces a **discrete birth order** over otherwise flat files.

### 2.6 Surface projection: π — Data → LEGO / Modulex boards

- **π₁: (D, F) → b_live**
  - `sitemap-live.html` renders all files in a metadata grid with filters.

- **π₂: (F, M) → b_modulex, b_studios, b_lego**
  - `sitemap-modulex.html` simulates a Modulex planning board.
  - `sitemap-studios.html` stacks hub + components + docs as **studio miniboards**.
  - `sitemap-lego.html` renders each studio as a **literal LEGO assembly** (hub brick + flow bricks, color‑coded).

- **π₃: (T, F, Σ) → b_evo, b_evo_lite**
  - `sitemap-evolution.html` draws multi‑lane evolution with similarity bars.
  - `sitemap-evolution-lite.html` collapses this into one mobile‑friendly LEGO‑style stack.

Collectively, π is the set of **views** over the same project world.

### 2.7 Manifold projection: μ — Data → Topological manifolds

- **μ₁: (T, F, Σ) → N (cultural manifolds)**
  - `sitemap-manifold.html` and `sitemap-manifold-02.html` use contour fields to show studio activity as elevation over cultural roles and phases.
  - They treat birth order and pattern density as **height** on a noise‑perturbed terrain.

- **μ₂: (T, F, Σ, M) → N (unified terrain & territories)**
  - `sitemap-manifold-03.html` maps multiple related repos into one ATG “world map”.
  - `sitemap-manifold-04.html` converts studio families into **territories** whose height and area come from file clusters in `file-learnings.json`, with agents tracing usage paths.

- **μ₃: (T, F, Σ, M) → N (Pathways overlays)**
  - `sitemap-manifold-05.html` overlays an Ethics Pathways workflow onto the studio terrain, letting a user annotate incidents as steps along the manifold.
  - `sitemap-manifold-06.html` builds Thesis Pathways boards auto‑from `file-learnings.json`, treating sitemap files as draggable characters in an argument path.

- `sitemap-manifold-index.html` is the **manifest for μ**:
  - lists all N, links back to each HTML surface,
  - makes explicit that manifolds are just additional projections over the same core objects (P, D, M, F, Σ, T).

### 2.8 Infrastructural inversion: ι — (Σ, F, T) → Insights

- **ι: (Σ, F, T) → I**
  - Implemented in `sitemap-infrastructure.html`:
    - counts iframe usage (nested studios),
    - finds where stud/skeleton tooling appears (maintenance labor),
    - highlights which surfaces participate in SWISS→FRANK→COURAGE→WEAVER chains.
  - Organizes results into:
    - **Surface → Process:** dashboards vs the rituals that produce them.
    - **User → Worker:** editors vs skeleton maintainers.
    - **Deep structures:** meetings, budgets (file formats), laws (LDraw / GOLD).
- ι aligns the SITEMAP work with the **Infrastructural Architect** role and `system_definition` you provided.

---

## 3. Theory — What Is SITEMAP Trying To Be?

### 3.1 A LEGO atlas of studios

- Instead of a flat file tree, SITEMAP treats the project as **studios made of bricks**:
  - HOMER docks SWISS/FRANK/COURAGE/WEAVER/WERE/MASTER/MENTO.
  - TIMBER and BULL are **pipeline studios** hanging off COURAGE and GOLD.
  - BRICK Grid, Taxonomizer, Minifigurator, WAG, ONYX are **adjacent neighborhoods** on the same baseplate.
- The Modulex / LEGO visuals are not just theme; they are a **UI contract**:
  - each brick = one file / surface,
  - each board = one composition of those surfaces into a studio.

### 3.2 Birth order as a hidden dimension

- β and the evolution views treat each file as an **event** in time:
  - early files: core experiments (WAG editors, ONYX body parts, first BRICK instruments).
  - later files: studios, docs, protocols, pipelines.
- The chronological layer answers:
  - “When did HOMER absorb the WAG chain?”
  - “When did stud skeletons appear relative to GOLD / MPD work?”
  - “Which studios grew in bursts vs slow accretion?”

### 3.3 Pattern signatures as LEGO studs

- Σ is intentionally small and discrete (like studs):
  - small vocabulary, but combinable into many configurations.
- A file with `LEGOS,ONYX,GOLD,stud` sits at the intersection of:
  - LEGOS grammar,
  - ONYX ontology,
  - GOLD text representation,
  - physical stud skeletons.
- This enables **quick, rough clustering** without heavyweight NLP.

### 3.4 Many boards, one world

- Each HTML sitemap surface is just one **projection**:
  - some emphasize **space** (Modulex board, studios board),
  - some emphasize **time** (evolution, birth‑order),
  - some emphasize **process & power** (infrastructural view).
- The underlying world (P, D, M, F, Σ, T) remains the same.

---

## 4. Limitations and Open Questions

### 4.1 Heuristic studio assignment

- α is currently rule‑based and brittle:
  - uses substring matches instead of a formal manifest.
  - some files sit in multiple conceptual studios but only show up in one family.
- Future: a **typed manifest** (JSON / YAML) listing studios, roles, and weights.

### 4.2 One‑way extraction

- κ and ρ are one‑way:
  - they scrape file contents but do not record **how** the boards are used.
- There is no feedback loop from user behavior (which boards you open, which bricks you touch) back into the sitemap model.

### 4.3 Visual experiments vs stable contracts

- Several boards (especially `sitemap-evolution.html` and its LEGO skins) went through rapid, opinionated iterations.
- This olog records the *conceptual* work, but the concrete visuals may change:
  - some surfaces may be retired,
  - new ones may share the same data objects and arrows.

### 4.4 No explicit functor into ONYX / BRICK yet

- Conceptually, there should be a functor from **SITEMAP world** into ONYX or BRICK worlds:
  - e.g. "files as scenes" in ONYX, or "tools as nodes" in a BRICK grid.
- Right now, that bridge exists only informally (through pattern tags and studio names).

---

## 5. Where This Olog Should Be Used

- As a **design record** for any future sitemap work (do not repeat the same exploratory steps blindly).
- As a **bridge** to your Infrastructural Architect `system_definition`:
  - the objects and arrows here can be referenced inside that system as concrete examples.
- As a **coordination map** if new agents or collaborators touch:
  - `sitemap-*.html` surfaces,
  - `analyze-sitemap.sh` / `sitemap-data.json`,
  - studio manifests and LEGO metaphors in `index.html`.

This olog is intentionally high‑level: it names the key worlds and transformations so that future changes to style or implementation can be evaluated against a stable conceptual skeleton.
