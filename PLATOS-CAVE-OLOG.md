# PLATO'S CAVE — Shield of Achilles Reconstruction Lab

## Aim

Treat the reconstruction of the Shield of Achilles (from Homer / ekphrasis) as an
**inverse 20 Questions game** driven by the LEGOS Cognitive Architect GPT and
MPD buckets of LEGO parts.

Instead of the computer guessing what object the human is thinking of, the
Oracle (GPT) is trying to discover **which structural and narrative voids** exist
on the Shield, and which minimal vignettes of LEGO parts can satisfy them.

The physical studio shell is `platos-cave.html`. It docks:

- **Swiss Designator** — source of curated buckets (minifigs, locations, vehicles).
- **LEGOS Cognitive Architect v8.0** — external GPT session (cannot be iframed).
- **Grace / Courage** — MPD / scene viewers for each reconstruction round.

---

## Roles

### 1. LEGOS-GPT — The Semantic Surveyor / Oracle

- Maps the Iliad Shield description into a **9×9 Semantic Grid** ("The Tray").
- Defines the **Ideal State** as a set of Voids:
  - Zone 1 (Center): Core Concept / Axis Mundi.
  - Zone 2 (Inner Ring): Systems / Protagonists.
  - Zone 3 (Outer Ring): Environment / Antagonists.
  - Zone 4 (Rim): Boundary / Timeframe / Oceanus.
- Tracks a global `Narrative_Fidelity` score and `Round_Count` (max 20).
- Operates as a forensic academic: infers rings, gates, vineyards, cities,
  constellations from the text and expresses them as **holes** to be filled.

### 2. Swiss Designators — Bucket Curator

- Selects candidate parts and motifs from the existing LEGO / MPD library.
- Groups them into **buckets**:
  - BUCKET 01 – Oceanus & rim segments.
  - BUCKET 02 – Cities, processions, dances.
  - BUCKET 03 – War vignettes, horses, chariots.
  - BUCKET 04 – Vineyards, harvest, livestock.
  - BUCKET 05 – Stars, radial spokes, sun motifs.
- Buckets are exported as standalone MPD files presented to the Oracle.

### 3. Grace / Courage — Visual Witness

- Load each round's partial MPD (from the Oracle) and show the Shield draft.
- Provide a sanity check against:
  - Physical plausibility (no impossible overlaps).
  - Visual rhythm (rings feel distinct, centers are anchored).
  - Narrative coverage (no important motif missing).

---

## Core Mechanics — Inverse 20Q over MPD Buckets

### State

- `Global_Scene_Graph` — ledger of all claimed vignettes and their semantic zone.
- `Round_Count` (0–20).
- `Narrative_Fidelity` (0–100%).
- 9×9 Semantic Grid marking where vignettes live (e.g. Oceanus rim, War Gates).

### Micro-PLoT Ledger (Evidence Audit)

Every candidate part in a bucket is scored along three axes:

1. **Geometric Prior (G)** — structural utility
   - Stackability, ability to form rings, spokes, or gates.
   - Compatibility with radial / circular compositions.

2. **Mythic Likelihood (M)** — narrative fit
   - Does the shape or signage invoke the Shield motif (city, war, harvest,
     constellations, Oceanus, etc.)?

3. **Visual Weight (W)** — anchor potential
   - Can it plausibly serve as a radial anchor, focal vignette, or boundary?

**Score:** `Score = (G * 0.3) + (M * 0.4) + (W * 0.3)`

For each high-scoring part (or small cluster), the Oracle decides:

- **CLAIM** — will be used this round as part of a vignette.
- **HOLD** — plausible but not yet needed; keep for future rounds.
- **REJECT** — does not help this Shield; remains unused.

### Vignette Protocol — Sophisticated Composition

The Oracle obeys the Vignette rules:

- **Imply, Don’t Saturate.**
  - Use the viewer’s imagination as the final brick.
  - Prefer a "Gatehouse of 12" to a "Wall of 100".

- **Representative Arrays.**
  - Build small, legible clusters that stand in for cities, armies, vineyards,
    not literal 1:1 mappings of the entire scene.

- **Cardinal Anchoring.**
  - Use N / S / E / W placements and ring structure to make the Shield legible.

- **Detail Density.**
  - High detail at focal vignettes.
  - Negative space allowed to breathe between rings.

Each round’s output modifies both:

- The **9×9 grid** (void map).
- The **Global Scene Graph** (list of vignettes and claimed parts).

### Release Condition — When to Stop

At the end of each round:

- Recalculate `Narrative_Fidelity`.
- If `Fidelity > 80%` or `Round_Count == 20`:
  - Propose **RELEASE**: "The scene is narratively stable. Shall I generate the MPD now?"
  - Offer an option to keep refining a specific zone instead.
- If user says "Generate":
  - Compile the Master MPD from `Global_Scene_Graph`.
  - Ensure relative coordinates are sane (no clipping).

---

## Interaction Loop (Human + GPT + Studio Shell)

1. **Initialize**
   - User provides the Iliad Shield passage and any secondary refs.
   - Oracle builds the semantic grid and initial Void list.

2. **Round N (max 20)**

   1. User selects an MPD bucket from Swiss and opens it in a text editor.
   2. User pastes the bucket into the GPT (LEGOS Architect) as the current
      **evidence set**.
   3. Oracle:
      - Runs Micro-PLoT on each candidate.
      - Proposes a small set of vignettes (CLAIM) and explains why.
      - Updates the 9×9 grid and the Global Scene Graph.
      - Outputs the updated MPD fragment (or a diff) in the Standard Response Template.
   4. User pastes that MPD into GRACE / COURAGE and inspects the result.
   5. Oracle and user agree on which zones are still under-specified.

3. **Release or Continue**
   - If the Shield feels complete, generate the full MPD and archive the log.
   - Otherwise, user prepares a new bucket targeted at the thin zones.

---

## Standard Response Template (Oracle)

The GPT always responds in this skeleton, so humans and tools can parse it:

```text
[Scene Title] | Round [X]/20 | Fidelity: [0-100]%

1. Void Analysis & Strategy
- Current Zone: [Zone Name]
- Strategy: "I will deploy a [Geometry] of [Part X] to represent [Concept]."

2. Micro-PLoT Ledger (Evidence Audit)
Part ID | Description | G | M | W | Score | Verdict & Logic
...

3. The Construct (Visual Synthesis)
- Vignette description and justification.

4. The Dig Site (Focal Point Map)
- Updated 9×9 grid ASCII map with markers for key vignettes.

5. Global Scene Tracker
- Zone 1–4 summaries of what is now represented.

6. The Checkpoint
- Current Fidelity level, and whether to RELEASE or continue.
- If continuing, explicit request for next bucket attributes.
```

---

## Why "Plato's Cave"?

- The Shield is never seen directly; we work from **shadows** cast by the text.
- Each vignette is an **approximation** that implies a larger, unseen world.
- The studio shell dramatizes this:
  - Left: Swiss curates candidate shadows (buckets).
  - Center: Oracle interprets and arranges them.
  - Right: Grace / Courage shows the evolving projection on the cave wall.

This olog pairs with `platos-cave.html`, `PLATOS-CAVE-tutorial.html`, and the
LEGOS Cognitive Architect GPT as the conceptual spec for the
Shield-of-Achilles reconstruction lab.

---

## Worked Example — "Moonlit Forest Skirmish" (Ewoks vs Robots)

The Plato's Cave lab was first exercised on a proxy scene:
**Moonlit Forest Skirmish (Ewoks vs robots)**. This serves as a dry run for the
Shield, using the same protocol but on a smaller ring.

### Round 0 — Narrative & Grid

- Narrative: an Ewok village ambushes a small robot patrol under a moonlit
  forest canopy.
- Oracle projects this onto the 9×9 grid:
  - Center: the main clash / clearing.
  - Inner ring: Ewok village elements and traps.
  - Outer ring: deeper forest and robot approach.
  - Rim: hints of wider war (tracks, train, plane).
- Output: an ASCII grid with `{T}` trees, `[C]` clearings, `[E]` Ewoks,
  `[R]` robots, and markers for the train/plane vectors.

### Round 1 — Minifig Family Bucket (Agents)

- Input bucket: a 5×5 **minifig_family.mpd** grid of 25 characters
  (Ewoks, robots, elders, children).
- Oracle treats the families as a portrait **array**, not 25 isolated parts.
- Micro-PLoT:
  - High **M** (mythic) score for hooded Ewoks and clear robot silhouettes.
  - Medium **G** (geometric) — they stack cleanly on plates and perches.
  - High **W** (weight) for a small subset that can anchor the vignette.
- Claims:
  - 4–5 Ewok fighters as the **ambush core**.
  - 3–4 robots as the **patrol core**.
  - Leaves the elders/children as implied population (not built here).
- Result:
  - Global Scene Graph now has two agent clusters, placed opposite each other
    on the grid centerline.

### Round 2 — Forest & Ground Bucket (Environment)

- Input bucket: **production_scene.mpd** with trees, stumps, bushes, slopes,
  baseplates, and a few architectural pieces.
- Oracle looks for candidate **species** of forest geometry:
  - Tall columns: canopy trees.
  - Short stumps: cut trunks / cover.
  - Wedges & slopes: ridgelines / ramps.
  - Bushes & leaves: undergrowth.
- Micro-PLoT:
  - Assigns high **G** to stackable trunks and slopes.
  - Assigns high **M** to parts that visually read as "forest" even in small
    numbers.
- Vignettes:
  - A ring of mixed-height trees around the central clearing.
  - A few stumps + rocks as cover points near Ewok and robot positions.
  - Negative space deliberately left in the exact fight zone.
- Result:
  - Grid now shows a **treeline ring** with clear sightlines through the
    middle; Narrative Fidelity jumps as the environment now matches the story.

### Round 3 — Vehicle Fleet Bucket (Pressure & Scale)

- Input bucket: **vehicle_fleet.mpd** with a short train, a scout plane, and
  other chassis.
- Oracle does not fill the scene with every vehicle; it chooses **vectors**:
  - Train: a rim-level intrusion vector slicing across one edge of the grid.
  - Plane: an overhead marker for surveillance / incoming threat.
- Micro-PLoT:
  - High **M** for a single, legible train segment and a single plane.
  - High **W** because each becomes a directional anchor (where the war is
    coming from / going to).
- Placement:
  - Train aligned along the outer ring, parallel to the forest edge.
  - Plane elevated above the grid, slightly off-center, to avoid colliding
    with trees while still reading as "in frame".
- Result:
  - Rim and sky zones are now populated; the skirmish reads as part of a
    larger conflict without overbuilding the set.

### Takeaways for the Shield of Achilles

- The Ewok skirmish proves the protocol on a tractable scene:
  - Start from **voids** (empty zones on the grid).
  - Feed in small, themed buckets (agents → ground → vehicles).
  - Use Micro-PLoT to CLAIM only a few parts each round.
  - Let the rest remain implied population and off-screen infrastructure.
- For the actual Shield:
  - Replace "forest" with rings of **city / war / harvest / stars / Oceanus**.
  - Replace "Ewoks vs robots" with human / divine actors.
  - Keep the same discipline: representative arrays, cardinal anchoring, and
    early release when Narrative Fidelity passes the threshold instead of
    chasing every literal detail.
