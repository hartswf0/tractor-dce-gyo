# TAXONOMIZER Research Olog — Limits, Hopes, and Challenges

## 0. Overview

Taxonomizer is an interactive map of a LEGO parts taxonomy. It lets a human curator:

- see a hierarchical slice of the LDraw parts universe,
- select branches to form a "playlist" of parts,
- export that playlist as either a catalog-style MPD or a structured JSON slice,
- feed those exports into downstream tools (Minifigurator, GOLD, etc.).

This note is a research olog: it describes the *objects* and *morphisms* that Taxonomizer touches, its current limitations, and the hopes and challenges that motivate further work.

---

## 1. Objects — What Worlds Does Taxonomizer Touch?

### 1.1 Taxonomy world (T)

- **Object:** a taxonomy node
  - e.g. `KINGDOM / PHYLUM / CLASS / ORDER / FAMILY` for LEGO parts.
  - Fields: `name`, `depth`, `parent`, optional `_parts[]`.
- **Morphisms:** parent→child arrows between nodes.
- **Structure:** a rooted, mostly-tree-shaped slice of the LEGO parts universe, loaded from `parts-taxonomy.json` → `window.TAXONOMY_DATA`.

### 1.2 Part atoms (P)

- **Object:** a single part (an LDraw file + metadata).
  - Fields: `filename`, `description`, `name`, `path`, tags, and other attributes (e.g. `headRole`, `upperComplete`).
- **Morphisms:**
  - equivalence or aliasing (e.g. same geometry, different print),
  - "same role" relations (e.g. all animal heads).

### 1.3 Playlists / selections (S)

- **Object:** a finite set of taxonomy nodes with their induced parts (a *playlist of branches*).
- **Morphisms:**
  - inclusion / removal of nodes from the playlist,
  - refinements such as selecting or deselecting entire subtrees.

### 1.4 Exports (E)

- **Objects:**
  - `E_mpd`: catalog MPDs (header box + 6-column grid of parts, `taxonomy_catalog_*.mpd`),
  - `E_json`: taxonomy-batch JSON slices with `nodes[]` and enriched `parts[]` (including `taxonomyPath`).
- **Morphisms:** serialization transforms that turn a `(taxonomy, selection)` pair into concrete files for other tools.

### 1.5 Queries (Q)

- **Object:** a text query string (e.g. `"animal"`, `"hedgehog"`, `"cape"`).
- **Morphisms:** query edits and refinements (`"animal" → "animal head" → "animal minifig head"`).

### 1.6 User traces (U)

- **Object:** a session trace of user actions:
  - zooms and pans,
  - searches and filters,
  - selections and deselections,
  - exports.
- **Morphisms:**
  - appending new actions to the trace,
  - summarizing traces into higher-level patterns ("this user likes forest animals + cloaks").

### 1.7 Theories / roles (R)

- **Object:** a hypothesis about how parts should be grouped, such as:
  - `"heads vs helmets vs hair"`,
  - `"weapons vs tools vs props"`,
  - `"play roles"` like villain / civilian / animal / vehicle.
- **Morphisms:** refinement, splitting, or merging of these theories as the library and use cases evolve.

---

## 2. Morphisms — What Arrows Matter?

This section focuses on the important arrows between the worlds above.

### 2.1 Structure embedding

- **η: P → T**
  - Assigns each part to at least one taxonomy node (family).
  - "This geometry lives under *this* branch of the taxonomy tree."

### 2.2 Selection

- **σ: (T × U) → S**
  - From a concrete navigation and click history, we derive a playlist of branches.
  - Examples of inputs: Selection Mode taps, right-click branch toggles, "Select Entire Branch" / "Deselect Branch" actions.

### 2.3 Export functors

- **F: (T, S) → E_mpd** — *Branch selection → catalog MPD.*
  - Domain: taxonomy nodes with user-marked selections.
  - Codomain: a single MPD file with each unique part from the selection arranged in a numbered 6-column catalog grid.

- **G: (T, S) → E_json** — *Branch selection → taxonomy-batch JSON.*
  - Domain: same taxonomy + selection playlist.
  - Codomain: `taxonomy-batch` JSON with `nodes[]`, each carrying `path`, `depth`, and enriched `parts[]` including `taxonomyPath` and other original fields.

- **H: E_json → L** — *Taxonomy slice → local minifig library.*
  - Domain: a taxonomy-batch JSON export.
  - Codomain: a JSON library of buckets (`parts.heads`, `parts.torsos`, `parts.hips`, etc.) compatible with Minifigurator.

Together, these functors define a channel:

> `(taxonomy branches, inclusion) → (selection playlist) → (MPD catalog / JSON slice) → (minifig buckets / scenes)`

### 2.4 Search / filter

- **φ: (T × Q) → (T', P_hits)**
  - Input: taxonomy + query string.
  - Output:
    - `T'`: filtered/highlighted view of the tree,
    - `P_hits`: global list of matching parts (with descriptions and paths, copyable and clickable).

### 2.5 Refactoring

- **ρ: T → T'**
  - Moves, merges, or splits nodes and reattaches `_parts[]`.
  - This is the (mostly future) "taxonomy editor" transformation: from one human-curated structure to another.

### 2.6 Versioning over time

- **v: T_t → T_{t+1}**
  - Captures changes to the taxonomy as new parts arrive or semantics shift.
  - Important for reasoning about drift and historical compatibility.

---

## 3. Theory — What Is Taxonomizer Trying to Be?

### 3.1 A visual slice of the world graph

- The underlying LEGO world is not a tree; it is a messy graph where parts are multi-role and multi-context.
- Taxonomizer chooses to display a *tree-shaped slice* of that world: a readable, navigable compromise.

### 3.2 A bridge from parts to stories

- The ultimate target is not static geometry but *playable scenes*:
  - minifigs, props, dioramas, camera paths, and story beats.
- Taxonomizer’s job is to let a human carve out *semantically meaningful regions*:
  - "all forest animals",
  - "all cloaks and capes",
  - "all wizard heads and hands".
- Those regions then flow into tools that stage minifigs and worlds.

### 3.3 An interface between human categories and machine categories

- Human language uses soft, overlapping concepts ("cute animal", "angry face", "wizard stuff").
- Machine tooling wants hard buckets (`parts.heads`, `props.swords`, `terrain.rocky`).
- Taxonomizer sits exactly between them:
  - humans navigate and click using soft intuitions,
  - exports express the result as sharp, typed structures.

### 3.4 A functor factory

- Each export is a functor into another world (GOLD, Minifigurator, GLB pipelines, prompt libraries).
- If the functors are clean and composable, you can:
  - assemble complex instruments (family generators, catalog builders, camera labs),
  - swap parts of the pipeline without rewriting selection logic.

---

## 4. Limitations — Where Does It Currently Fail?

### 4.1 Tree vs reality (DAG / world-graph)

- Parts often belong to multiple semantic families:
  - a sword is both a *weapon* and an *accessory*,
  - a printed tile is both a *geometry type* and a *UI screen*.
- A strict tree forces a single parent; any cross-cutting view (play-role, theme, color) has to be expressed elsewhere.

### 4.2 Thin semantics

- Most meaning is embedded in free-text fields (`description`, `name`).
- There are few explicit, machine-readable roles or relations:
  - no `role: "animal-head"`, `material: "rubber"`, etc.
- Search is lexical, not conceptual:
  - it can match "hedgehog", but it cannot infer that "badger" is a related *animal head*.

### 4.3 Manual curation and drift

- Nodes and parts are placed by hand.
- As the library grows, it is easy to accumulate:
  - inconsistent depth and granularity between branches,
  - near-duplicate nodes and orphans,
  - conflicts between older placements and new roles.

### 4.4 One-way and lossy exports

- MPD catalogs and JSON slices are projections of `(T, S)`.
- Edits made downstream (e.g. in Minifigurator or GOLD) do **not** flow back into the taxonomy.
- There is no formal round-trip or reconciliation step; the taxonomy cannot yet "learn" from how exports are actually used.

### 4.5 Limited model of use and context

- Taxonomy encodes *what* parts exist and roughly *where* they sit.
- It does not yet encode:
  - which parts are frequently used together,
  - typical co-occurrence patterns in scenes,
  - how usage might imply new categories (e.g. "these heads are almost always villains").

### 4.6 UI-level bottlenecks

- Large hierarchies are hard to navigate on small screens.
- Multi-branch selections are powerful but cognitively heavy:
  - it is easy to lose track of what is in the playlist vs what is just visible.
- Search results, while global, are not yet explanatory:
  - they highlight hits, but do not tell you *why* a part matched or how it sits in the larger concept space.

---

## 5. Hopes — What Would a "Finished" Taxonomizer Look Like?

### 5.1 From tree to typed world-graph

- Enrich nodes and parts with explicit roles, materials, and constraints.
- Support carefully controlled multi-parentage (a DAG) so parts can live in multiple views without duplicating data.
- Make these relations first-class, not just comments in descriptions.

### 5.2 Neurosymbolic bridge

- Use LLMs and embeddings to propose, but not decree:
  - candidate categories and refactors,
  - suggested placements for new parts,
  - synonyms and tags from images, descriptions, and usage.
- Keep the canonical truth in the symbolic taxonomy; models propose, humans approve.

### 5.3 Playlist semantics as a language

- Treat selections as *programs over the taxonomy*:
  - unions, intersections, and differences of branches,
  - queries like "all capes AND all forest animals BUT no licensed IP".
- Compile that "playlist algebra" into:
  - exports (MPD, JSON), and
  - queries for other systems (camera rigs, scene generators, analytics).

### 5.4 Closed loops with downstream tools

- Feed back from Minifigurator, GOLD, and others:
  - which parts and branches are heavily used vs ignored,
  - which combinations are common or problematic,
  - which implicit semantics show up (heroes vs villains, foreground vs background props).
- Use those signals to:
  - refactor the taxonomy,
  - train better autocomplete and recommendation models,
  - identify missing categories or overcomplicated ones.

### 5.5 Richer search and discovery

- Evolve from string search to structured, semantic queries:
  - query-as-diagram: "animals with 2×2 footprint, any color, below torso height",
  - similarity search for visual motifs,
  - semantic zooming from themes down to micro-variations.

### 5.6 A general lab for world-building ontology

- Use LEGO as a concrete testbed for *any* object ontology in simulations or narrative engines.
- Once the Taxonomizer pipeline is solid, the same pattern applies to:
  - props in a game,
  - entities in a knowledge graph,
  - conceptual atoms in purely textual worlds.

---

## 6. Why This Is Hard (And Worth It)

### 6.1 Combinatorial explosion

- Number of parts × prints × roles × scenes is huge.
- Any static taxonomy feels wrong as soon as you push on it; the system must be designed for continuous evolution.

### 6.2 Fuzzy human categories vs sharp code categories

- People reason in fuzzy sets; code needs crisp predicates.
- Taxonomizer must respect both:
  - provide enough structure for machines to work,
  - stay malleable enough for human sense-making.

### 6.3 Multiple overlapping views

- No single tree can simultaneously respect:
  - geometry,
  - play role,
  - theme,
  - color,
  - build region (head / torso / hand / environment).
- The challenge is picking one primary structure while providing good functors to the others.

### 6.4 Bridging symbolic and continuous spaces

- To be useful for generative models, we need:
  - crisp, symbolic categories, and
  - soft, continuous similarity notions.
- Getting those to cooperate without collapsing one into the other is a central neurosymbolic alignment problem.

### 6.5 UX as part of the ontology

- If humans cannot comfortably *see* and *edit* the categories, the ontology will drift or stagnate.
- The Taxonomizer UI is part of the model because it shapes what curators will actually do.

---

## 7. How to Use This Olog

- **As a design north star.**
  - When proposing new features or refactors, ask:
    - Which objects and morphisms does this touch?
    - Which functors become cleaner or more composable?

- **As a limitations checklist.**
  - When something feels off (search, selection, exports), map it back to:
    - tree vs reality,
    - thin semantics,
    - one-way projections,
    - missing feedback from use.

- **As a research agenda.**
  - Each hope above can be turned into a concrete experiment:
    - multi-parent DAGs and role tagging,
    - neurosymbolic tagging pilots,
    - playlist algebra prototypes,
    - closed-loop taxonomy refinement based on real scenes.

This document is intended to sit next to the existing "TAXONOMY / MINIFIG OLOG" in the main manifest as a deeper research note on Taxonomizer's role, limitations, and future directions.
