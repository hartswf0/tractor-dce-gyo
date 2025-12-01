# LEGOS Worldbuilding Philosophy — Brickbender Grid Olog

## 0. Overview

This note explains the **Brickbender worldbuilding grid** in words, so you can carry the same ideas into other tools (Taxonomizer, Minifigurator, GOLD, camera labs) without the UI.

Brickbender is a 9×9 interactive grid that teaches a simple worldbuilding stack:

> **Ground → Site → Sky → Perspective**
>
> Build from the ground up, site by site, under a sky, for a perspective.

Each cell in the grid is a tiny **Location Patch**. Different layers paint different meanings onto those patches.

- **Ground layer**: navigation base — where you can walk.
- **Site layer**: places and boundaries — where events happen.
- **Sky layer**: atmosphere and mood — how it feels over time.
- **Perspective layer**: camera and viewpoint — what is actually shown.

The Brickbender HTML file (`brickbender-philosophy.html`) implements four separate 9×9 grids (`ground-grid`, `site-grid`, `sky-grid`, `full-grid`) and a set of small functions (`createGrid`, `toggleCell`, `playExample`, etc.) that animate this philosophy.

This markdown is the research/teaching companion for that surface.

---

## 1. The 9×9 Grid as a Coordinate System

The grid has **81 cells**, indexed `0…80`. Conceptually it is a **top-down map**:

- Indexing in the HTML is row-major:
  - row 0: cells `0–8` (top row),
  - row 1: cells `9–17`,
  - …
  - row 8: cells `72–80` (bottom row).
- Each cell can be in several visual states, depending on layer:
  - base: dark cell (`demo-cell`),
  - `ground`: cyan-tinted tile,
  - `site`: blue-tinted tile,
  - `sky`: purple-tinted tile,
  - `active`: pulsing yellow highlight.

In code, the grid is built by:

```js
for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div');
    cell.className = 'demo-cell';
    cell.dataset.index = i;
    cell.onclick = () => toggleCell(containerId, i);
    container.appendChild(cell);
}
```

So **the grid is just a flat array of indices** — philosophy and worldbuilding come from how you *label* and *layer* those indices.

---

## 2. Ground Layer — Navigation Base

> **Question:** Where can the player safely move?

### 2.1 Object

- A ground cell is a patch that participates in **navigation**:
  - walkable corridors,
  - safe zones,
  - ramps or bridges.

### 2.2 Morphism

- Clicking a cell in the **ground grid** toggles it in `groundState`:

```js
if (gridId === 'ground-grid') {
    if (groundState.includes(index)) {
        groundState = groundState.filter(i => i !== index);
        cell.classList.remove('ground', 'active');
    } else {
        groundState.push(index);
        cell.classList.add('ground', 'active');
    }
}
```

So **each click** is a morphism:

> `(groundState, index) → groundState'`  
> either adding or removing that index from the walkable set.

### 2.3 Interpretation on the grid

- Designer paints a **high-contrast path** across the 9×9 board.
- The cyan tiles are the **verb** "you may walk here".
- The empty tiles are implicitly **"void, walls, or danger"**.

The philosophy: before you worry about story or sky, **you must make navigation obvious and kind.**

---

## 3. Site Layer — Places & Boundaries

> **Question:** Where do meaningful events happen?

### 3.1 Object

- A site cell is a **Location Frame**:
  - a room,
  - a landmark,
  - a threshold or checkpoint,
  - a boss arena.

Each site should have a job: *intro, challenge, reward, transition*.

### 3.2 Morphism

- Clicking a cell in the **site grid** toggles it in `siteState`:

```js
if (gridId === 'site-grid') {
    if (siteState.includes(index)) {
        siteState = siteState.filter(i => i !== index);
        cell.classList.remove('site', 'active');
    } else {
        siteState.push(index);
        cell.classList.add('site', 'active');
    }
}
```

Again, each click is a morphism adjusting the set of active sites.

### 3.3 Interpretation on the grid

- Sites sit **on top of** ground:
  - you might only place sites where the ground is walkable.
- Blue cells mark **rooms and beats**:
  - `"Lab-A"` as safe intro,
  - `"Crater Edge"` as dangerous payoff.

The philosophy: ground tells you *where you can move*; **sites tell you why those moves matter**.

---

## 4. Sky Layer — Atmosphere & Mood

> **Question:** What does the space *feel* like while you are there?

### 4.1 Object

- A sky cell is a piece of **light and mood**:
  - morning vs noon vs night,
  - storm vs calm,
  - warm vs cold color cast.

### 4.2 Morphism

- Clicking a cell in the **sky grid** toggles it in `skyState` and applies the `sky` class:

```js
if (gridId === 'sky-grid') {
    if (skyState.includes(index)) {
        skyState = skyState.filter(i => i !== index);
        cell.classList.remove('sky', 'active');
    } else {
        skyState.push(index);
        cell.classList.add('sky', 'active');
    }
}
```

- Buttons like `setSky('morning')`, `setSky('noon')`, `setSky('night')` are **named presets**:
  - they don’t yet paint the grid by themselves, but conceptually they are tags for global sky states.

### 4.3 Interpretation on the grid

- The top row in the **full example** (`indices 0–8`) is reserved for sky.
- Color and density of sky tiles communicate **story beats**:
  - calm, clear morning at the start,
  - stormy sky as you approach danger.

The philosophy: sky is **tempo and emotion**; it should change when the story changes.

---

## 5. Perspective Layer — Camera & Viewpoint

> **Question:** From which angle does the player see this world?

### 5.1 Object

- Perspective is not stored per cell; it is a **mode over the whole scene**:
  - first-person: intimacy, embodiment,
  - overhead: strategy, planning,
  - cinematic: spectacle, authored framing.

### 5.2 Morphism

- Buttons call `setPerspective('first')`, `setPerspective('overhead')`, `setPerspective('cinematic')`.

```js
function setPerspective(mode) {
    console.log('Perspective:', mode);
}
```

In the current surface, this just logs, but conceptually each call is a morphism:

> `(world, mode) → viewport(world, mode)`

Changing perspective is changing the **projection** from the underlying grid-world to the player’s screen.

### 5.3 Interpretation on the grid

- The same 9×9 arrangement can be viewed:
  - as a **tactical map** (overhead),
  - as a sequence of **framed scenes** (cinematic),
  - as immersive **first-person corridors**.

The philosophy: perspective is a *storytelling decision*, not just a rendering detail.

---

## 6. Full Example — Lab-A to Crater Edge

The `playExample()` function animates all layers together on the `full-grid`.

### 6.1 Path definition

```js
const path = [72, 63, 54, 45, 36, 27, 18, 9];
const sites = [72, 9];       // Start and goal
const sky   = [0,1,2,3,4,5,6,7,8]; // Top row = sky
```

- **Ground path** (cyan) climbs from bottom-left (`72`) to top-right-ish (`9`) in a diagonal staircase.
- **Sites** mark the endpoints:
  - `72` = **Lab-A** (safe start),
  - `9`  = **Crater Edge** (dangerous goal).
- **Sky row** covers `0–8` (the top row), representing the global sky above the journey.

### 6.2 Animation

The function animates in three passes:

1. **Ground:**

   ```js
   path.forEach((i, delay) => {
       setTimeout(() => {
           const cell = grid.querySelector(`[data-index="${i}"]`);
           cell.classList.add('ground', 'active');
       }, delay * 200);
   });
   ```

   - One by one, each path cell lights up as ground + active.
   - This is the **route being discovered or taught**.

2. **Sites:**

   ```js
   sites.forEach((i, idx) => {
       setTimeout(() => {
           const cell = grid.querySelector(`[data-index="${i}"]`);
           cell.classList.add('site');
       }, (path.length + idx) * 200);
   });
   ```

   - Start and goal are then marked as **places** on that path.

3. **Sky:**

   ```js
   sky.forEach((i, idx) => {
       setTimeout(() => {
           const cell = grid.querySelector(`[data-index="${i}"]`);
           cell.classList.add('sky');
       }, (path.length + sites.length + idx) * 100);
   });
   ```

   - Finally, the entire top row fills with sky, signaling a **global atmospheric state**.

The accompanying text in the HTML describes the scenario:

- "Player navigates from Lab-A (safe) to Crater Edge (danger)."
- Ground, sites, sky, and perspective all have jobs:
  - ground: path from `72 → 9`,
  - sites: start/goal anchors,
  - sky: evolving mood (morning → storm),
  - perspective: first-person in lab, overhead at crater.

### 6.3 Reset

`resetExample()` simply removes the per-cell classes to clear the board:

```js
function resetExample() {
    document.querySelectorAll('#full-grid .demo-cell').forEach(c => c.className = 'demo-cell');
}
```

This returns the world to a **neutral canvas**.

---

## 7. LEGOS Primitives Toolbox

The Brickbender tutorial closes with a toolbox of primitives. In olog terms they are the basic objects and morphisms you use to build worlds:

- **Entity Block** — any thing (character, prop, rule).
- **Morphism Arrow** — connection or action between entities.
- **Goal Flag** — desired outcomes.
- **Obstacle Wall** — blockers and challenges.
- **Shift Bolt** — turning points (before/after states).
- **Location Frame** — spatial containers (rooms, sites).
- **Timepoint Pin** — specific moments.
- **Timeline Track** — sequences of events.
- **Scene Panel** — playable beats combining everything above.

The 9×9 grid gives you a **concrete playground** to arrange these primitives:

- ground paints where motion is allowed,
- sites declare which patches carry meaning,
- sky and perspective control mood and framing,
- the example run demonstrates a **micro-story** (safe lab → dangerous crater) in this language.

---

## 8. How to Use This Document

- As a **teaching aid** next to `brickbender-philosophy.html`:
  - show the interactive grid, keep this markdown open as the verbal explanation.
- As a **design checklist** when building new scenes:
  - have you made ground legible?
  - are sites clearly framed and named?
  - does sky match narrative beats?
  - is perspective chosen intentionally?
- As a **bridge to other tools**:
  - Taxonomizer can think of branches as sites and playlists as paths.
  - Camera tools (MENTO) can think of perspective and sky as explicit tracks.

Brickbender’s grid is a small, discrete world that demonstrates a bigger idea:  
**worlds are built from layers of structure, not just from geometry.**

---

## 9. The Hyper Grid Family — Surfaces of the Same Idea

Brickbender is not alone. It sits in a *family* of grid-based instruments:

- `brickbender-philosophy.html` — **worldbuilding pedagogy** (Ground / Site / Sky / Perspective).
- `hyper-grid-00.html` — **media for thinking** with UI bricks, source, preview, and state.
- `hyper-grid.html` — **inception builder**, a simpler grid-to-HTML surface.
- `hyper-monitor.html` — **runtime monitor**, mapping code into a semantic execution grid.

All four share a core pattern:

> 9×9 grid of cells  
> + mapping from **cells → semantic atoms**  
> + mapping from **semantic atoms → other worlds** (code, layouts, runtime, stories).

In olog terms, each surface provides:

- an object **G** = grid of cells (indices `0…80`),
- a world of **atoms** (locations, bricks, functions, variables, controls),
- a functor from **G** into that atom world,
- a further functor out into some external representation (HTML, JSON, MPD, execution trace).

The philosophy paper you are reading is the shared story that keeps these functors aligned.

### 9.1 Brickbender — Grid as World Map

Brickbender’s object-of-interest is **playable space**:

- **Objects:** location patches and layers (ground, sites, sky, perspective).
- **Morphisms:** painting / erasing patches, animating a path, shifting sky presets.
- **Exports (conceptual):** a *world sketch* — a path from Lab-A to Crater Edge, framed by atmosphere and camera.

The key functor:

> `F_world: G → (Ground, Site, Sky, Perspective)`

assigns each cell one or more roles in the layered worldbuilding stack.

### 9.2 hyper-grid-00 — Grid as UI / Code Surface

`hyper-grid-00.html` keeps the 9×9 spatial intuition but turns it into a **UI & code instrument**:

- **Grid cells** become **UI bricks** (`layout`, `button`, `text`, etc.), each with code-shape glyphs.
- The bottom panel shows:
  - a **SOURCE** pane (synthetic HTML/JS representation of those bricks),
  - a **PREVIEW** pane (concrete layout preview),
  - a **STATE** pane (JSON representation, logs, pills summarizing grid state).
- A modal allows JSON import/export of the grid configuration.

In olog terms:

- **Objects:**
  - `G` — grid cells,
  - `B` — brick definitions (layout / button / text / empty),
  - `H` — HTML/JS snippets and preview nodes,
  - `Σ` — state snapshots (JSON, logs).

- **Functors:**
  - `F_grid→bricks: G → B` (paint bricks onto cells),
  - `F_bricks→html: B^G → H` (derive source lines and preview nodes from the painted grid),
  - `F_state: B^G → Σ` (serialize grid into JSON + log events as a stream).

Where Brickbender asks *"where is the path?"*, hyper-grid-00 asks *"what UI/code lives in each tile, and how does that roll up into a layout and state model?"*.

### 9.3 hyper-grid — Inception Builder

`hyper-grid.html` is a simplified sibling of hyper-grid-00:

- Same **9×9 grid**, same cell header/body/footer vocabulary.
- A single **SOURCE STREAM & PREVIEW** panel, without the extra tabs and state log.
- The data model is intentionally lighter:
  - cells track their brick type and optional text,
  - the bottom panel outputs a small HTML fragment and a structural preview (`[row,col]` labels per node).

It plays the role of **inception builder**:

- quick way to sketch HTML surfaces as a grid of bricks,
- exportable, copyable, understandable by looking at one screen.

As an olog:

- **Objects:** `G` (grid), `B` (simple bricks), `H_simple` (minimal HTML), `P` (preview nodes).
- **Functors:**
  - `F_grid→B_simple: G → B`,
  - `F_B_simple→HTML: B^G → H_simple`,
  - `F_B_simple→preview: B^G → P`.

If Brickbender is the **worldbuilding tutor**, hyper-grid is the **first drafting tool**: you use it when you graduate from drawing concept maps to actually writing markup.

### 9.4 hyper-monitor — Grid as Execution Map

`hyper-monitor.html` takes the same grid intuition and applies it to **code execution**:

- The top 9×9 grid is filled with **blocks** typed by semantic role:
  - `function`, `variable`, `control` (styled with rose / teal / amber),
  - wires between them show **call and dependency relationships**.
- The bottom panel is a **code stream** with semantic highlighting and a **minimap**:
  - each line is linked back to blocks on the grid,
  - a `Tracer` proxy wraps key logic functions to flash blocks and wires when they run.

Formally:

- **Objects:**
  - `S_src` — source lines,
  - `N_sem` — semantic nodes (functions, variables, control sites),
  - `G_sem` — semantic grid occupancy (which node lives on which of the 81 cells),
  - `R_rt` — runtime trace (call events, execution order).

- **Functors / mappings:**
  - `parse: S_src → N_sem` (extract definitions & call sites),
  - `lay: N_sem → G_sem` (map semantic nodes onto grid cells),
  - `trace: R_rt → (highlights on G_sem × S_src)` via the `Tracer` proxy.

Where Brickbender uses the grid as a **map of imagined space**, hyper-monitor uses it as a **map of live computation**.

### 9.5 One Philosophy, Many Grids

Seen together, Brickbender, hyper-grid-00, hyper-grid, and hyper-monitor implement one core belief:

> Complex systems become legible when you  
> 1) choose a finite, discrete **grid** of attention,  
> 2) assign each cell a clear **semantic job**, and  
> 3) define **functors** from that grid into other worlds (code, runtime, stories).

- Brickbender: grid → *(Ground, Site, Sky, Perspective)* → **world sketch**.
- hyper-grid / hyper-grid-00: grid → *(UI bricks)* → **HTML/layout + state**.
- hyper-monitor: grid → *(semantic code nodes)* → **execution trace visualization**.

The systems differ in domain, but they share a **philosophy of bounded, visual thinking**:

- keep the canvas small (9×9),
- keep the layers explicit (navigation / site / mood / view; data / layout / runtime),
- keep the mappings reversible enough that a human can mentally step between grid, code, and world.

This is why the same 9×9 motif shows up across tools: it is not an arbitrary design choice, but a commitment to making thinking *about* systems as tactile and composable as building with bricks.
