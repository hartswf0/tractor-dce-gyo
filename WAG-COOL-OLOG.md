# WAG-COOL Stud Pipeline OLOG

## Intent

WAG-COOL is an experimental branch of the WAG toolchain (Courage → WERE → Master → Symbiogene)
built to prototype a **canonical stud skeleton pipeline** and a **universal grid spec** without
risking regressions in the production tools.

Goals:

- **Per-line stud ownership.** Every stud is owned by exactly one MPD type-1 line.
- **Per-part reuse.** Each `partId` has a reusable local stud layout (part skeleton library).
- **Viewer independence.** Stud provenance comes from MPD + templates, not mesh heuristics.
- **Canonical grid.** A single stud lattice (`grid_spec`) that all tools agree on.
- **Versioned data.** New `stud_skeleton_v2` block in GOLD, tagged by `source` and `studVersion`.

The COOL entrypoints (`wag-cool-were.html`, `wag-cool-master.html`) give us a clean place to
consume this new data and evolve visualization/rigging behavior.

## Problem Statement (Line 22 Pathology)

Earlier GOLD snapshots (e.g. `update-test.json`) showed **all studs marked with `lineNum: 22`**,
regardless of which MPD line actually owned the geometry. Root causes:

- Global grid sampling over the entire assembled mesh.
- Per-cell ownership assigned as `min(contributing lineNums)`.
- Meshes often merged or re-ordered by the viewer; many vertices inherited the *same* `lineNum`.

Consequences:

- WERE/MASTER could not reliably rig or select by MPD line.
- Skeleton MPD exports collapsed to a single line owner.
- Any higher-level rig/animation logic built on this was unstable.

## New Courage GOLD Format (WAG-COOL side)

In `wag-viewer-prime-integration-20251112-055341 copy/wag-courage.html` we now:

- Generate studs **per MPD line** via `computeStudSkeletonAndPlanes` (Option A):
  - Build `meshesByLine` keyed by `userData.lineNum`.
  - For each type-1 MPD line index `i`, sample only meshes for line `i` into a local grid.
  - Emit studs with `lineNum: i`, `gridX`, `gridZ`, `layer`, `partId`, and `local`.
  - Tag these nodes with `source: 'sampled'`, `studVersion: 1`.

- Instantiate template studs from a per-part skeleton library:
  - `buildTemplateStudSkeletonFromLibrary()` walks MPD lines.
  - For each part with a template, it transforms local studs by the line’s 3×3 matrix + translation.
  - Emits studs with the same fields, tagged `source: 'template'`, `studVersion: 1`.

- Export a **canonical skeleton block** in GOLD:

  ```jsonc
  "stud_skeleton_v2": {
    "version": 1,
    "source": "template" | "sampled" | "mixed" | "unknown",
    "nodes": [
      {
        "x": 300,
        "y": 32,
        "z": -600,
        "layer": 4,
        "kind": "stud",
        "lineNum": 22,
        "gridX": 15,
        "gridZ": -30,
        "partId": "23798.dat",
        "studIndex": 0,
        "local": { "x": 10, "y": 24, "z": -10 },
        "source": "template",
        "studVersion": 1
      }
    ]
  }
  ```

- Preserve a **legacy** skeleton for existing tools:

  ```jsonc
  "stud_skeleton": [
    { "x": 300, "y": 32, "z": -600, "layer": 4, "kind": "stud", "lineNum": 22,
      "gridX": 15, "gridZ": -30, "partId": "23798.dat", "studIndex": 0,
      "local": { "x": 10, "y": 24, "z": -10 } }
  ]
  ```

  `stud_skeleton` is now derived from `stud_skeleton_v2.nodes`, so it stays compatible.

- Add a **unified grid spec**:

  ```jsonc
  "grid_spec": {
    "cellLDU": 20,
    "layerHeightLDU": 8,
    "origin": { "x": 0, "y": 0, "z": 0 },
    "axis": {
      "right": "x",
      "up": "y",
      "forward": "-z"
    }
  }
  ```

This gives WAG-COOL downstream tools a single lattice and coordinate system to respect.

## WAG-COOL Entry Points

### `wag-cool-were.html`

- **What it is:**
  - A thin wrapper that full-screen embeds the existing `wag-were.html`.
  - Title/branding: "WAG-COOL WERE".
  - Used as an experimental entrypoint for loading GOLD snapshots that
    contain `stud_skeleton_v2` + `grid_spec`.

- **Why a wrapper instead of a fork (for now):**
  - Keeps the production WERE code untouched.
  - Allows studio shells and bookmarks to target the COOL entrypoint explicitly.
  - As the v2 pipeline stabilizes, we can either:
    - Migrate the internals of WERE to prefer `stud_skeleton_v2`, or
    - Introduce a dedicated WAG-COOL WERE implementation behind this entry.

- **Behavior today:**
  - Still relies on `payload.stud_skeleton` when receiving GOLD.
  - Since Courage now mirrors `stud_skeleton_v2.nodes` into `stud_skeleton`,
    the COOL entry already sees improved per-line ownership.
  - Next steps (future work):
    - Update WERE internals to consume `stud_skeleton_v2.nodes` directly,
      honoring `grid_spec` and `source` tags.

### `wag-cool-master.html`

- **What it is:**
  - A thin wrapper that full-screen embeds the existing `wag-master.html`.
  - Title/branding: "WAG-COOL MASTER".
  - Used as an experimental entrypoint in studios that want to pair
the new Courage GOLD with the MASTER visualizer.

- **Why a wrapper:**
  - Same reasoning as WERE: we want to experiment without touching the
    v9 MASTER code path.
  - The existing MASTER already respects `state.studs` and per-line
    bounding boxes; as `stud_skeleton` quality improves, MASTER visuals
    improve automatically.

- **Behavior today:**
  - Receives GOLD via `studio-load-gold-from-courage`.
  - Calls `applyGoldPayloadFromObject(payload)` which still reads
    `payload.stud_skeleton`.
  - Because COOL Courage’s `stud_skeleton` is derived from `v2.nodes`,
    MASTER now effectively consumes the canonical per-line studs.
  - Future WAG-COOL work can:
    - Extend `applyGoldPayloadFromObject` in a COOL fork to prefer
      `stud_skeleton_v2.nodes`.
    - Use `grid_spec` to align containment walls and HUD glyphs with the
      canonical lattice.

## Studio Integration

Existing studios such as `courage-were-studio.html` currently embed:

- `wag-viewer-prime-integration-20251112-055341 copy/wag-courage.html`
- `wag-were.html`
- `wag-symbiogene.html`

They forward GOLD snapshots via a "Wolf bus" message:

```js
relayTo(wereFrame, {
  type: 'studio-load-gold-from-courage',
  payload
});
```

WAG-COOL studios can instead point their iframes at:

- `wag-viewer-prime-integration-20251112-055341 copy/wag-courage.html` (COOL Courage)
- `wag-cool-were.html`
- `wag-cool-master.html` (in a courage-master-style shell)

No message schema needs to change: GOLD payloads remain the same shape,
with `stud_skeleton_v2` and `grid_spec` added.

## Research Notes / Open Questions

- **Part skeleton coverage.**
  - Today, only parts that have entries in `STATE.partSkeletonLibrary`
    get `source: 'template'` studs. Others rely on `source: 'sampled'`.
  - We need a workflow (likely inside Courage) to bootstrap and save
    per-part skeletons using `debugExtractPartSkeleton(partId)`.

- **Mesh-to-lineNum annotation.**
  - Per-line sampling (Option A) still depends on `mesh.userData.lineNum`.
  - For heavily merged scenes (e.g., catalog plates), we need either:
    - A more reliable mesh annotation pass, or
    - A purely MPD + template-driven reconstruction for stud positions.

- **Grid origin.**
  - `origin: {x:0,y:0,z:0}` is a reasonable default, but for production
    we may want to align origin with the dominant baseplate or floor.

- **Symbiogene.**
  - Currently still consumes `stud_skeleton` only.
  - WAG-COOL Symbiogene could:
    - Visualize `stud_skeleton_v2.nodes` directly.
    - Use `source` to color-code template vs sampled studs.

## Summary

WAG-COOL is the experimental lane for a **line-faithful, grid-faithful** stud
pipeline. Courage now emits versioned, source-tagged stud data and a canonical
grid spec; the COOL WERE/MASTER entrypoints give us a place to consume and
iterate on that data while keeping the mainline tools stable.
