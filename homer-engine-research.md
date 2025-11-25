# HOMER ENGINE · Research Queries & Answer Templates

_This document is the working notebook for HOMER Studio / HOMER ENGINE research. Each question targets one discoverable unit: one UI component, one data flow, one message type, one interaction pattern._

Use the **Research Answer Template** at the end of this file when filling in answers.

Status legend for answers:
- ✅ Confirmed
- ⚠️ Needs verification
- ❌ Not implemented
- 🔍 TODO: needs design / not in code yet

---

## PART A · Pipeline-Oriented Research Prompts

These prompts follow the HOMER pipeline steps: **Swiss → Frank → Courage → Weaver → Were → Master → Mento**, plus cross-cutting shells and message protocols.

### STEP 1 · Swiss → Frank → Courage Flow

#### 1.1 Swiss Builders Research

**Goal:** Map Swiss builder UIs and their connection to the wag-frank bus.

**Swiss Designator / Builders**

1. **Exact button labels for each builder**
   - **SCENEERATOR**
     - What buttons exist? (e.g. `Load Scene Shell`, `Save MPD`, `Export`, etc.)
   - **LOCATIONATOR**
     - What taxonomy categories are exposed as UI chips or filters?
       - Expected: `FLOOR`, `WALL`, `DOOR`, `WINDOW`, `ROOF`, `TREE`, `PROP`.
   - **VEHICULATOR**
     - What slot types exist? (e.g. `chassis`, `wheels`, `windscreen`, `hull`, `engine`)
   - **MINIFIGURATOR**
     - What part categories exist? (e.g. `hat`, `head`, `torso`, `legs`, `accessories`)

2. **Messages each builder broadcasts on `wag-frank`**
   - For each builder, document:
     - Message structure: `{ kind: '?', payload: { ... } }`
     - All possible `kind` values (e.g. `scene-mpd`, `minifig-mpd`, `vehicle-mpd`, `location-mpd`, etc.)
     - What metadata is included in each `payload`.

3. **Visual feedback on "Save MPD" / export actions**
   - What happens when you click `Save MPD` (or equivalent emit button)?
     - Toast notification?
     - Button state change?
     - Confirmation message / status pill?

4. **Swiss connection status to Frank**
   - Where does Swiss show connection status to Frank?
   - Is there a `FRANK online/offline` indicator?
   - Exact label and visual style.

#### 1.2 Frank Grid Research

**Goal:** Understand Frank’s inbox + 9×9 grid UI and how it composes `wag-frank-scene.mpd`.

1. **Exact UI affordances in Frank**
   - How do you see the **inbox** of incoming MPDs from Swiss?
   - What does an `ASSIGN TO CELL` control look like?
   - Is there drag‑and‑drop or click‑to‑assign?
   - What is the exact label for the emit button? (e.g. `EMIT SCENE`, `BUILD SCENE IN GRACE`, `EMIT TO HOMER`)

2. **Metadata Frank adds to MPD lines**
   - FRANK cell metadata format: e.g. `! FRANK_CELL D4` or similar.
   - Confirm spacing formula (expected: `160` studs per grid cell).
   - Does Frank add rotation metadata? If so, exact syntax.

3. **Visual feedback for cell assignments**
   - How do grid cells look:
     - Empty state
     - Filled state
     - Selected / hover state
   - Do you see thumbnails, text labels, or both?
   - Can you unassign / reassign cells? How?

4. **Composed `scene.mpd` output**
   - Confirm filename: `wag-frank-scene.mpd`.
   - Structure:
     - How multiple MPD inputs are combined.
     - Whether Frank adds a header comment (and exact text if so).

#### 1.3 Courage Stage Research

**Goal:** Document Courage’s editor + viewer layout and how it receives scenes from Frank.

1. **Exact toolbar layout in Courage viewer**
   - Confirm right‑side buttons order: `IMG | GOLD | GLB | RB`.
   - For each button:
     - What does it do exactly?
     - Any tooltip text? (copy exact tooltip if present.)

2. **How Courage receives scenes from Frank/HOMER**
   - Does Courage auto‑load when Frank emits a scene?
   - Is there a manual `Load Scene` button / menu?
   - Which BroadcastChannel messages does Courage listen for (kinds + payloads)?

3. **Split layout structure**
   - Left panel: MPD text editor – confirm features.
   - Right panel: 3D viewer – confirm.
   - Is there a resize handle or splitter? Collapsible panels?

4. **File operations in Courage**
   - Export MPD button(s).
   - Copy to clipboard.
   - Download / export options (MPD, IMG, GLB).

---

### STEP 2 · Courage RB → GOLD Flow

#### 2.1 Red Bull (RB) Button Research

**Goal:** Make RB a fully documented sampler: UI, data outputs, and prerequisites.

1. **Exact RB button placement + appearance**
   - Confirm location: far right of Courage viewer toolbar, beside `IMG`, `GOLD`, `GLB`.
   - What does it look like?
     - Label text (`RB`?)
     - Color / highlight state
     - Icon, if any
   - Is it always visible or conditional on state?

2. **What happens when you click RB?**
   - Visual feedback:
     - Button state change (pressed, loading, disabled)?
     - Progress indicator (spinner, status text)?
   - Timing:
     - How long does sampling normally take (rough scale)?
   - Completion:
     - Any toast or console message when done?

3. **RB outputs: GOLD + stud skeleton**
   - Confirm localStorage key: `wag_redbull_gold`.
   - Data structure of the stored GOLD document:
     - Field names, including `stud_skeleton_v2`.
   - BroadcastChannel message structure:
     - `{ kind: 'redbull-gold', payload: { ... } }`
     - Exact payload shape.

4. **RB prerequisites**
   - Requirements for RB to work:
     - Valid MPD loaded in Courage?
     - Scene successfully rendered in viewer?
     - Does camera position matter?
     - Any part types that are skipped or unsupported?

5. **Visual changes in viewer after RB**
   - Do studs change color or gain overlays?
   - Is there a toggle for skeleton view (on/off)?
   - Any legend / hint text about sampled studs?

---

### STEP 3 · Weaver Assembly Line / XRAY / GOLD Bus

#### 3.1 Weaver Interface Research

**Goal:** Understand how Weaver consumes GOLD, builds StudMap MPD, and publishes on GOLD bus.

1. **Weaver buttons and controls**
   - Confirm exact labels:
     - `Assembly Line`
     - `XRAY RB`
     - `GOLD bus`
   - Any other controls (filters, export buttons, tabs)?

2. **How Weaver loads GOLD data**
   - Does Weaver auto‑detect `localStorage.wag_redbull_gold`?
   - Is there a `Load GOLD` or equivalent button?
   - Any status message when GOLD is ready or missing.

3. **`Assembly Line` behavior**
   - Input: scene‑level GOLD document.
   - Output: per‑part **StudMap MPD**.
   - Visual changes:
     - UI update in stud map panels.
     - Any progress indicator.
   - Performance characteristics.

4. **XRAY view**
   - Output format:
     - Text log vs visual overlay vs both.
   - Semantics of statuses: `OK`, `MISSING`, `ambiguous`.
   - Can you filter by status? Click to inspect particular lines/parts?

5. **`GOLD bus` button behavior**
   - BroadcastChannel message structure when GOLD is published:
     - `{ kind: '?', payload: { ... } }`
   - Which tools listen (Were, Master – confirm from code).
   - Visual feedback when GOLD bus is sent.

6. **Other Weaver views**
   - Ontology / taxonomy view of studs or parts.
   - Stud coverage stats (per part / per region).
   - Filters or search controls.

---

### STEP 4 · Master Tuning → Export Back (and Were)

#### 4.1 Master Overlay Editor Research

**Goal:** Capture Master’s overlay editor, tuning controls, and round‑trip back to Courage/Weaver.

1. **Master UI layout**
   - Left: MPD list/editor?
   - Right: GOLD stud overlay / viewer?
   - Split panels or tabbed layout?

2. **Tuning controls**
   - ΔX / ΔZ sliders – confirm exact labels, ranges, and units.
   - ABS / ANIM flip toggles – confirm exact names and behavior.
   - Offset controls – labels and semantics.
   - Whether controls are per‑line, per‑part, or global.

3. **Selection model**
   - How you choose what to tune:
     - Click MPD line
     - Click stud/brick in overlay
     - Dropdown or list selectors

4. **Export controls**
   - Exact button labels:
     - `Save + Copy`?
     - `Export MPD`?
     - `Copy to Clipboard`?
   - Behavior of each export action.

5. **Master → Courage round‑trip**
   - Event name: confirm `master-export-mpd`.
   - Does HOMER intercept and route this automatically to Courage and Weaver?
   - Does Courage reload instantly? Any visual confirmation?

6. **Metadata Master adds to MPD**
   - Skeleton offset comments.
   - Tuning annotations / version markers.
   - Timestamps or provenance info.

#### 4.2 Were Lab Research

**Goal:** Position Were relative to Master and document its affordances.

1. **Were’s purpose vs Master**
   - Is Were used for experiments / analysis while Master is tuned for production round‑trips?
   - What unique operations exist in Were?

2. **Were UI / features**
   - Overall layout – similar to Master or distinct?
   - Does it show GOLD overlays or skeleton‑only MPD?
   - Export options and their targets.

---

### STEP 5 · Mento Brickfilm Recording

#### 5.1 Mento Camera Panel Research

**Goal:** Fully map Mento’s docked UI, recording controls, and gallery behavior.

1. **Mento docking with Courage**
   - Confirm SINGLE mode auto‑pair: clicking `MENTO` docks **Courage + Mento** together.
   - Do they share the same viewer canvas or is Mento a separate render target attached to Courage’s viewer?
   - Layout specifics: Courage left, Mento right? Resizable?

2. **Exact recording controls**
   - Aspect ratio chips – exact options and labels (e.g. `4:3`, `16:9`, `1:1`).
   - Quality chips – exact options and labels (e.g. `480p`, `720p`, `960p`, `1080p`).
   - Path selector – options like `Manual`, `Orbit`, `Push-through-center` (confirm spelling and set).

3. **Button states and labels**
   - Before recording:
     - Label and appearance of `REC`.
   - During recording:
     - Does `REC` flip to `STOP`, or is there a separate `STOP` button?
     - Any label like `RECORDING…`.
   - After recording:
     - `SAVE` button behavior.
     - Are REC/STOP/SAVE separate persistent buttons or stateful switches?

4. **Visual / audio feedback**
   - Recording indicator:
     - Red dot? Flashing header? `STBY/REC` pill state?
   - Sound cues when starting/stopping.
   - Haptic/vibration on mobile.
   - Any timer or frame counter visible.

5. **File output format**
   - Confirm filename pattern: `mento_<scene>_<timestamp>.webm`.
   - Download target (browser Downloads vs custom location).
   - Automatic addition to gallery strip.
   - Gallery UI:
     - Thumbnail format
     - Labels shown (filename, duration, resolution).

6. **IMG/GLB exports from Mento/Courage**
   - Are stills/GLB captures paired with WebM by timestamp or name?
   - Separate buttons vs automatic pairing.
   - Do they capture directly from Courage’s viewer at the same frame as video?

7. **Camera paths**
   - Manual path controls (orbit via mouse vs scripted camera).
   - Orbit path:
     - Speed, radius, direction controls.
   - Push‑through‑center path:
     - Exact definition and any tunable parameters.
   - How to preview a path before recording.

---

### CROSS‑CUTTING · HOMER Shell + Message Protocols + Taxonomy

#### C.1 HOMER Shell / Multi‑Window System

**Goal:** Document HOMER’s modes, docking rules, and navigation.

1. **Modes**
   - `SINGLE` mode: one panel full width.
   - `MULTI` mode: multiple columns side‑by‑side.
   - Any additional modes or presets?

2. **Mode switching**
   - Mode toggle button location.
   - Keyboard shortcuts.
   - Mobile behavior (forced SINGLE, etc.).

3. **Column layout in MULTI mode**
   - Max number of columns.
   - Column resize behavior.
   - Minimum width per panel.
   - Horizontal scroll vs fixed layout.

4. **Dock combinations**
   - Known combinations:
     - Swiss + Frank + Courage.
     - Courage + Mento (SINGLE mode auto‑pair).
   - Any others (e.g. Weaver + Master, Swiss + Docs, etc.)?

5. **Navigation between tools**
   - Tab bar / header layout.
   - Active tab indicators.
   - Any breadcrumbs or context indicators.

#### C.2 BroadcastChannel Message Catalog

**Goal:** Create a complete catalog of BroadcastChannel usage.

1. **Channel names**
   - `wag-frank` – confirm and list any others.

2. **Message kinds on each channel**
   - For `wag-frank` (expected kinds – verify from code):
     - `scene-mpd`
     - `minifig-mpd`
     - `vehicle-mpd`
     - `location-mpd`
     - `frank-scene`
     - `redbull-gold`
     - `weaver-gold`
     - `master-export-mpd`
     - Any additional kinds.

3. **Per‑message documentation (see template in Part D)**
   - For each `kind`, capture:
     - Sender(s)
     - Receiver(s)
     - Trigger condition (what user action or event)
     - Payload structure
     - Example payload

#### C.3 Taxonomy and Parts Research

**Goal:** Understand parts taxonomy used by Swiss builders and Weaver.

1. **Taxonomy files**
   - `parts-taxonomy.json` – structure and key fields.
   - `taxonomy-primitives.json` – mapping primitive heads → families/parts.
   - `scene-shells.json` – structure of scene shells.
   - Any location library files (e.g. for props, walls, trees).

2. **How builders use taxonomy**
   - How Locationator filters parts (by category / kingdom / family).
   - How Vehiculator finds wheels / chassis / windscreens.
   - How Minifigurator matches hats/heads/torsos/legs/accessories.

3. **Hierarchies and mappings**
   - Kingdom → Family → Part hierarchy.
   - Primitive → Part mappings.
   - Depth and breadth of taxonomy (how many levels).

---

## PART B · HOMER ENGINE Documentation Research Framework

These prompts define the **shape of research**, independent of pipeline step.

### 1. COMPONENT INVENTORY (What exists?)

**Goal:** Catalog every UI element in HOMER ENGINE.

#### 1.1 Swiss Builders

- Q: What builder UIs exist in Swiss?
  - List each builder by name (`SCENEERATOR`, `LOCATIONATOR`, etc.).
  - For each builder, enumerate:
    - Top‑level controls (dropdowns, search, filters).
    - Item grid/list display.
    - Action buttons (`Load`, `Save`, `Export`, etc.).
    - Status indicators (connection to Frank, selected item indicators).

- Q: What is the exact layout of SCENEERATOR?
  - Header controls.
  - Scene shell grid.
  - Selected scene display.
  - Action button row.
  - Toggles / settings.

- Q: What is the exact layout of LOCATIONATOR?
  - Taxonomy filter chips (`FLOOR`, `WALL`, `DOOR`, ...).
  - Part browser grid.
  - Selected part preview.
  - Action button row.

- Q: What is the exact layout of VEHICULATOR?
  - Slot selector (chassis, wheels, windscreen, ...).
  - Part options per slot.
  - Current vehicle assembly preview.
  - Action button row.

- Q: What is the exact layout of MINIFIGURATOR?
  - Body part selector (hat, head, torso, legs, ...).
  - Part options per category.
  - Current minifig assembly preview.
  - Accessory picker.
  - Action button row.

#### 1.2 Frank Grid

- Q: What is Frank's UI structure?
  - Inbox panel (incoming MPDs from Swiss).
  - 9×9 grid panel (cell assignment interface).
  - Cell detail panel (when a cell is selected).
  - Action button row (`EMIT SCENE`, `CLEAR GRID`, etc.).

- Q: What does a Frank inbox item look like?
  - Icon/thumbnail.
  - Label (scene name, part type).
  - Metadata display (size, part count).
  - Assign button behavior.

- Q: What does a Frank grid cell look like?
  - Empty state.
  - Filled state (with assigned MPD).
  - Selected state.
  - Hover state.

- Q: What controls exist for cell operations?
  - Assign MPD to cell.
  - Remove from cell.
  - Swap cells.
  - Preview cell content.

#### 1.3 Courage Stage

- Q: What is Courage's panel layout?
  - Left panel: MPD text editor
    - Line numbers, syntax highlighting, cursor/selection.
    - Save/Export controls.
  - Right panel: 3D viewer
    - Canvas, camera controls.
    - Toolbar (`IMG | GOLD | GLB | RB`).
    - Stats/info overlay.
  - Resize handle between panels.

- Q: What is the exact viewer toolbar?
  - Button order (left to right).
  - Button labels.
  - Button icons.
  - Button tooltips.
  - Active/inactive states.

- Q: What MPD editor features exist?
  - Line editing.
  - Search/replace.
  - Undo/redo.
  - Comment toggling.
  - Syntax validation / error highlighting.

#### 1.4 Weaver Lab

- Q: What is Weaver's UI structure?
  - GOLD data status panel (loaded/not loaded).
  - Assembly Line controls.
  - StudMap viewer/editor.
  - XRAY diagnostic panel.
  - GOLD bus publish controls.

- Q: What buttons/controls exist in Weaver?
  - `Load GOLD` (if manual).
  - `Run Assembly Line`.
  - `View XRAY`.
  - `Publish GOLD bus`.
  - `Export StudMap MPD`.

- Q: What is the XRAY panel layout?
  - Per‑line status list (`OK`/`MISSING`/`ambiguous`).
  - Stud coverage stats.
  - Filters.
  - Clickable rows to focus viewer.

#### 1.5 Master Tuner

- Q: What is Master's UI structure?
  - MPD line list (left).
  - 3D viewer with GOLD overlay (right).
  - Tuning control panel (bottom or sidebar).
  - Export controls.

- Q: What tuning controls exist?
  - Per‑line selector.
  - ΔX slider (range, step, label).
  - ΔZ slider (range, step, label).
  - ABS/ANIM flip toggles.
  - Offset inputs.
  - Reset/Apply buttons.

- Q: What overlay visualization exists?
  - How studs are rendered (color, opacity).
  - How misalignment is shown.
  - Toggle overlay on/off.
  - Isolate single parts.

- Q: What export controls exist?
  - `Save + Copy` (exact label).
  - Export to file.
  - Copy to clipboard.
  - Push to Courage / Weaver.

#### 1.6 Mento Camera

- Q: What is Mento's UI when docked with Courage?
  - Shared viewer vs separate.
  - Recording control panel location.
  - Gallery panel location.

- Q: What recording controls exist?
  - Aspect ratio selector (chips).
  - Quality selector (chips).
  - Path mode selector (`Manual`, `Orbit`, etc.).
  - REC/STOP/SAVE sequence.
  - Recording indicator.

- Q: What is the gallery UI?
  - Shot strip (thumbnails).
  - Selected shot preview.
  - Export buttons per shot (WebM, IMG, GLB).
  - Delete/rename controls.

---

### 2. INTERACTION AFFORDANCES (What can users do?)

Repeat per component:

- Selection patterns.
- Emit/Export actions.
- Connection and status indicators.

(Use the prompts from the pipeline section above and fill answers using the template.)

---

### 3. DATA FLOWS (What moves where?)

Map flows:

- Swiss → Frank (MPD messages).
- Frank → Courage (scene.mpd emission).
- Courage RB → GOLD (localStorage + bus).
- Weaver Assembly Line / XRAY / GOLD bus.
- Master Tuning → Courage / Weaver.
- Mento recording pipeline.

Each flow should get its own Answer Template block.

---

### 4. MESSAGE PROTOCOLS (What gets broadcast?)

- Identify all BroadcastChannel names.
- For each, enumerate `kind` values and document with the **Per‑Message Template** below.

(See Part D: Answer Templates.)

---

### 5. STATE TRANSITIONS (What changes when?)

For key interactions (RB click, Assembly Line run, scene emit, recording start/stop), document:

- Visual state transitions (button states, overlays, toasts).
- Data state transitions (localStorage keys, in‑memory STATE).

---

### 6. ERROR STATES (What breaks and how?)

For each subsystem (Swiss/Frank/Courage/Weaver/Master/Mento):

- Connection errors (BroadcastChannel failures, offline scenarios).
- Processing errors (RB sampling failures, Assembly Line gaps, Master tuning validation).
- User input errors (no selection, invalid operations).

Document:

- Error messages / UI.
- Recovery / retry behavior.
- Whether operations are queued or dropped.

---

## PART C · Research Answer Templates

Use this template **once per research unit** (component, interaction, data flow, message, state change, or error).

```text
### [COMPONENT / FLOW] → [SPECIFIC QUESTION]

**SOURCE**: [file path(s) and/or "code search: [pattern]"]

**ANSWER**:
[Concise summary of what the code + UI show.]

**UI LABELS**:
- Button: "[exact text]"
- Tooltip: "[exact text]"
- Status text: "[exact text]"

**CODE REFERENCE**:

// Relevant code snippet showing implementation
[copy actual snippet here]

**VISUAL STATES**:
- Default: [description]
- Hover: [description]
- Active/Pressed: [description]
- Disabled: [description]

**DATA FLOW**:
- Input: [what data is required]
- Process: [transformations]
- Output: [what data is produced / where it is stored or sent]

**EDGE CASES**:
- If [condition]: [behavior]
- If [error]: [message / recovery]

**STATUS**: ✅ Confirmed | ⚠️ Needs verification | ❌ Not implemented | 🔍 TODO: needs design
```

### Per‑Message Documentation Template

Use this for each BroadcastChannel `kind` you find (e.g. `scene-mpd`, `redbull-gold`, `master-export-mpd`).

```text
MESSAGE: { kind: '[kind-name]' }

**CHANNEL**: 'wag-frank' (or other)

**SENDER(S)**:
- [Component(s) that call postMessage]

**RECEIVER(S)**:
- [Component(s) that addEventListener/onmessage]

**TRIGGER**:
- [User action or internal event that causes send]

**PAYLOAD STRUCTURE**:
{
  kind: '[kind-name]',
  payload: {
    // list keys and types
  }
}

**EXAMPLE PAYLOAD**:
{
  kind: '[kind-name]',
  payload: { ... }
}

**STATUS**: ✅ Confirmed | ⚠️ Needs verification | ❌ Not implemented | 🔍 TODO: needs design
```

---

_Use this file as the single source of truth for HOMER ENGINE research. As you answer prompts, append Answer Template blocks under the relevant section with a clear STATUS for each._
