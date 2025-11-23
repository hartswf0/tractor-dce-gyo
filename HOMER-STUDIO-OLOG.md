# HOMER Studio · Research Olog

## Intent

HOMER Studio is a **multi-panel TRUBADOR shell** that docks:

- SWISS Designator
- WAG FRANK (Homer-tuned wrapper)
- COURAGE
- Unified L-System Ontology Weaver (Assembly Line)
- WAG WERE
- WAG MASTER
- MENTO / Momento capture

inside a single chrome, with **TAB** and **grid** layouts and a **shared wag-frank bus**. It is the place to:

- See **MPD**, **GOLD**, and **stud skeletons** flow between tools.
- Perform **fine-grain placement** in WERE / MASTER.
- Send the resulting **MPD back to Courage** for reuse and further GOLD runs.
- Treat HOMER as a **bridge** between Bull Assembly-style Weaver flows and TIMBER-style lab flows.


## Components (Docked Tools)

### SWISS Designator

- Acts as a high-level **scene / project selector**.
- Lives in the first panel/slot of HOMER.
- Conceptually precedes detailed MPD work: “what narrative / scene are we working on?”

### FRANK · HOMER Wrapper (`wag-frankwag-fromer.html`)

- Embeds the existing `wag-frank.html` surface but **re-skinned** for HOMER.
- Disables the direct **Grace editor launch path**, so HOMER can route traffic toward Courage / Weaver / WERE / MASTER instead of Swiss-Frank-Grace.
- Continues to expose the `wag-frank` **BroadcastChannel** as the canonical bus:
  - GOLD fragments from Courage (XRAY / Red Bull).
  - GOLD exports from Unified Weaver.
  - Future MENTO / mobile fragments.

### COURAGE (inside HOMER)

- Same flagship MPD viewer/editor as in TIMBER and Bull Assembly.
- Still responsible for producing **GOLD snapshots** with:
  - `mpd_content`
  - `stud_skeleton` (and `stud_skeleton_v2` in COOL flows)
  - diagnostics / ground plane metadata.
- In HOMER, Courage additionally **consumes MPD** that comes back from WERE / MASTER via the HOMER bridge:
  - Message type: `studio-load-mpd-from-were`.
  - Replaces its active scene’s MPD with the incoming text and recompiles.

### Unified Ontology Weaver (Assembly Line)

- Same **four-column SOURCE / TEMPLATE / TRANSFORM / EXECUTE** tool as in Bull Assembly.
- In HOMER, Weaver keeps its XRAY (RB) role:
  - Ingests `redbull-gold` fragments from Courage over `wag-frank`.
  - Builds **per-line stud maps** and **StudMap MPD + GOLD exports**.
- Adds a **Homer bridge affordance**:
  - A control to send Weaver GOLD scenes onto the bus as `weaver-gold`.
  - HOMER listens and forwards those GOLD payloads to WERE / MASTER.

### WAG WERE (line lab)

- Skeleton + line-centric editor for MPD.
- In HOMER, receives GOLD via:

  ```js
  window.addEventListener('message', (event) => {
    if (msg.type === 'studio-load-gold-from-courage') {
      const payload = msg.payload;
      loadFromGoldJson(payload);
      if (Array.isArray(payload.stud_skeleton)) {
        loadSkeletonFromStuds(payload.stud_skeleton);
      }
    }
  });
  ```

- Two primary modes in HOMER:
  1. **Direct MPD mode** — when `mpd_content` is loaded directly.
  2. **Skeleton MPD mode** — when `stud_skeleton` is provided:
     - WERE builds a `wag_skeleton_from_studs.mpd` with `3003.dat` proxies.
     - Each proxy is annotated via preceding `0 line <lineNum> layer <layer> stud <idx>` comments.
- **State-of-the-art in HOMER:**
  - WERE now **remembers the original MPD** (`state.sourceLines`) when loading GOLD.
  - When exporting MPD from a skeleton scene, WERE:
    - Reads the `lineNum` metadata from skeleton comments.
    - Copies edited `x/y/z` and 3×3 matrix from the 3003 proxies.
    - Rewrites those transforms onto the **original MPD lines** in `sourceLines`.
    - Leaves the original `file` token (tmpd/ontology part path) untouched.
  - Result: exports back to Courage use the **original part files with updated transforms**, not 3003 proxies.

### WAG MASTER (room lab)

- Containment-field / room-scale lab for GOLD:
  - Draws bricks, bones, and stud orbs.
  - Uses the same `studio-load-gold-from-courage` channel as WERE.
- In HOMER, MASTER:
  - Receives GOLD forwarded by the Homer shell (from Courage or Weaver).
  - Lets users adjust part transforms with dials against the active GOLD/MPD.
  - Exports a full MPD back to the shell via `master-export-mpd`.
- The **Homer bridge** then relays these MPD exports to Courage.

### MENTO

- Docked capture / narrative surface (Momento).
- Today: mostly independent from the MPD/GOLD round-trips.
- Future: candidate sink for **Weaver/WERE/MASTER snapshots** tagged with narrative beats.


## Homer Shell and Bus Bridge

### Layout and Tabs

- HOMER provides:
  - **Tab strip** to switch between tools in single-panel mode.
  - A **GRID toggle** to view multiple tools at once.
- This layout is intentionally similar to TIMBER / Bull Assembly shells, so studio users can transfer muscle memory.

### GOLD Ingest Bridge

- HOMER subscribes to the **`wag-frank` BroadcastChannel**:

  - On `kind: 'redbull-gold'` (Courage):
    - Extracts the GOLD payload.
    - Forwards it as `studio-load-gold-from-courage` to WERE and MASTER iframes.

  - On `kind: 'weaver-gold'` (Unified Weaver):
    - Does the same relay into WERE and MASTER.

- Net effect:
  - Whether GOLD comes from **Courage directly** or from **Weaver’s XRAY pipeline**, HOMER ensures the labs see a consistent payload.

### MPD Return Bridge

- WERE and MASTER emit MPD via postMessage:

  - WERE:
    - `type: 'were-export-mpd', mpd: <text>`.
  - MASTER:
    - `type: 'master-export-mpd', mpd: <text>`.

- HOMER listens at the shell level and forwards a unified message into Courage:

  ```js
  courageFrame.contentWindow.postMessage({
    type: 'studio-load-mpd-from-were',
    mpd
  }, '*');
  ```

- Courage already understands this message and treats the payload as its new MPD scene.


## Round-trip Editing in HOMER

### Direct GOLD → WERE/MASTER → Courage

1. **Author in Courage** (or load an MPD there).
2. Run **XRAY (RB)** or related actions to emit a GOLD snapshot.
3. HOMER forwards that GOLD to WERE and MASTER via `studio-load-gold-from-courage`.
4. In WERE or MASTER:
   - Use dials and group selection to move/rotate selected parts.
5. Export MPD from the lab:
   - WERE: `exportLDraw()` / `downloadMpdFile()`.
   - MASTER: its MPD export action.
6. HOMER captures `were-export-mpd` / `master-export-mpd` and forwards a single MPD stream to Courage.
7. Courage recompiles and becomes the **new source of truth** for the scene.

### GOLD via Weaver → Labs → Courage

1. **Courage → XRAY (RB) → GOLD** on `wag-frank`.
2. **Unified Weaver** ingests GOLD and builds per-line studs.
3. Weaver exports an enriched GOLD scene (`weaver-gold`) onto `wag-frank`.
4. HOMER hears `weaver-gold` and relays it to WERE / MASTER as GOLD.
5. From here the loop is the same as above: WERE/MASTER tweaks → MPD → Courage.

This makes **Weaver optional but powerful** in the middle of the Homer loop.


## Relationship to Other Studios

### Versus Swiss / Frank / Grace Studio

- Swiss-Frank-Grace focuses on:
  - Swiss: designator / hub.
  - Frank: bus.
  - Grace: primary editor.
- HOMER instead:
  - Keeps Swiss + Frank roles.
  - Routes flows primarily through **Courage + Weaver + WERE + MASTER**, not Grace.
  - Still allows Grace flows elsewhere in the repo; Homer just doesn’t auto-launch Grace from its Frank wrapper.

### Versus TIMBER Studio

- TIMBER is a **Courage / WERE / Master / Symbiogene** shell focused on:
  - GOLD loop.
  - Selection loop.
  - Skeleton debug loop.
- HOMER:
  - Emphasizes **TRUBADOR chain** (Swiss → Frank → Courage → Weaver → WERE → MASTER → MENTO).
  - Adds **Weaver** and **MENTO** into the loop.
  - Uses the same `studio-load-gold-from-courage` and `studio-load-mpd-from-were` contracts where possible.

### Versus Bull Assembly Studio

- Bull Assembly concentrates on:
  - **Courage → GOLD → Weaver → WERE/MASTER** as a pipeline.
- HOMER:
  - Reuses the same Weaver and lab tools.
  - Adds a **studio-level bus bridge and layout** shared with Swiss, Frank, and MENTO.


## Current State of the Art (HOMER)

- **Panels & layout**: HOMER provides tabbed + grid layouts for SWISS / FRANK / COURAGE / WEAVER / WERE / MASTER / MENTO.
- **Homer FRANK wrapper**: `wag-frankwag-fromer.html` rethemes Frank and prevents direct Grace launches inside HOMER.
- **Bus integration**:
  - Listens on `wag-frank` for `redbull-gold` and `weaver-gold`.
  - Relays GOLD as `studio-load-gold-from-courage` into WERE and MASTER.
- **Lab ingest**:
  - WERE and MASTER both understand `studio-load-gold-from-courage` and load `mpd_content` and `stud_skeleton`.
- **Skeleton-aware MPD export from WERE**:
  - When working from a stud skeleton, WERE now maps edited 3003 proxies back onto the original MPD lines using `lineNum`, preserving original part file paths.
- **Return path to Courage**:
  - HOMER listens for `were-export-mpd` and `master-export-mpd` and forwards MPD to Courage as `studio-load-mpd-from-were`.
- **Favicons / identity**:
  - HOMER and all docked tools in the HOMER chain have themed SVG favicons blending **Homer Simpson** and **ancient Greek** motifs.


## Open Questions / Future Work

- **Weaver re-weave of lab edits**
  - Optional path where WERE/MASTER-adjusted MPD is sent back through Unified Weaver to:
    - Rebuild per-line templates and stud maps.
    - Produce updated GOLD and StudMap MPD artifacts.
  - Constraint: must not break existing direct WERE/MASTER → Courage loop.

- **MENTO integration**
  - Define a canonical way to:
    - Capture keyframes or narrative beats from HOMER.
    - Attach references to Courage/Weaver/WERE/MASTER snapshots.

- **Symbiogene in HOMER**
  - Today HOMER docks WERE and MASTER, but not Symbiogene.
  - A future Homer variant could:
    - Add a Symbiogene panel.
    - Share GOLD and selection signals with TIMBER.

- **GOLD v2 awareness in Homer shell**
  - Currently the shell treats GOLD as an opaque payload.
  - Future: HOMER could surface metadata (e.g., `stud_skeleton_v2.source`, `grid_spec`) in a lightweight HUD.

- **TRUBADOR documentation**
  - HOMER is one concrete TRUBADOR chain.
  - A broader TRUBADOR Olog could:
    - Classify different studio types (Swiss-Frank-Grace, TIMBER, Bull Assembly, HOMER).
    - Describe how HOMER composes those patterns.


## Summary

HOMER Studio is the **state-of-the-art TRUBADOR shell** for:

- Running **Courage → GOLD → Weaver → WERE/MASTER → Courage** loops in one surface.
- Connecting that loop to **SWISS** (designation) and **MENTO** (capture).
- Using a **Homer-tuned Frank bus wrapper** and a **Homer shell bridge** to route GOLD and MPD between tools.

As of this Olog, HOMER provides a **closed geometry loop**:

> COURAGE / WEAVER → GOLD → WERE / MASTER (skeleton-aware MPs) → MPD → COURAGE

with preserved part file paths, and it is ready to host additional TRUBADOR research flows on top of that foundation.
