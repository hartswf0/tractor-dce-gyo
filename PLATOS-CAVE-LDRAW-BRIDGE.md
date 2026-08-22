# Plato's Cave × LDraw — can the builder loop drive it?

Short answer: **yes, and nothing new had to be invented.** The Plato's Cave MPD
already speaks the exact dialect this repo hosts. What was missing was the loop
around it — the thing `ball-jar.html` and the `-ator` family do for minifigs,
locations and vehicles, but never did for a philosophical scene.

This note records what was verified, what was built, and where each piece plugs in.

---

## 1. How the parts are hosted and called

The library is **vendored, not fetched**. `ldraw/` holds a full LDraw install:

```
ldraw/parts/        16,370 base parts (34,849 .dat files incl. sub-parts)
ldraw/parts/s/      8,580 sub-parts
ldraw/p/            1,713 primitives  (+ p/8: 127 low-res, p/48: 916 hi-res)
ldraw/LDConfig.ldr  the colour table
```

GitHub Pages serves that tree as static files, so a type-1 line is literally a URL:

```
1 71 -300 -100 -100  0 0 1  0 1 0  -1 0 0  parts/47713.dat
                                           └── GET ./ldraw/parts/47713.dat
```

`beta-prime-engine.js` wraps `THREE.LDrawLoader` with `loaderPath: './ldraw/'`,
and the house convention across every `.mpd` in this repo is the explicit
`parts/` prefix rather than a bare `47713.dat`.

### The Plato's Cave MPD was already valid

Every type-1 reference in the pasted `platos_cave_stable.mpd` resolves against
the vendored library — **all 44 lines, and all 261 sub-files they pull in
recursively**, primitives included. Nothing was missing, nothing needed
substituting. It is checked in as `platos-cave.mpd`.

The part choices are semantically odd on purpose, and that is the LEGOS move:

| Ref | Actually is | Reads as |
|---|---|---|
| `100662` | Minifig Baby Head with Space Helmet | a prisoner's fixed stare |
| `10677` | Minifig Torso with Bat Wing Arms | a bound body |
| `4347` | Window 1×4×5 with Fixed Glass | the shadow screen |
| `6584` / `285c01` | Train Base 6×24 / 6×16 | the parapet walkway |
| `30230` | Wing Insectoid Large | a carried artifact |
| `100662p01` | patterned Baby Head | a flame in the fire-pyramid |
| `6024p02` | Baseplate 32×32 Canyon, stood vertical | the cave's back wall |
| `4788` + `15336p01` | Paddle Wheel + Flywheels | the sun and its corona |

### One fix worth having: `ldraw-resolve-map.json`

`LDrawLoader` finds a sub-file by trial and error — as-is, then `parts/`, then
`p/`, then `models/`. On a static host every miss is a real 404. Loading the
Plato's Cave scene fired **329 failed requests**.

`build-ldraw-resolve-map.js` emits a 62 KB map for the two cases the loader
cannot shortcut (`p/*.dat` referenced bare, and `p/8/*.dat`), handed to the
loader via its existing `setFileMap`. Same scene now fires **17**.

`p/48/*` and `parts/s/*` are already covered by the loader's own prefix rules
and are deliberately left out of the map.

---

## 2. The builder loop — `platos-cave-builder.html`

`platos-cave.html` was a *manual* studio: paste a bucket into an external GPT,
copy its MPD back into GRACE by hand. The new page runs the same protocol
in-process, against real geometry.

```
LEGOS scene graph          9×9 semantic tray            bag of bricks
(entities / goals /   →    (Chebyshev ring = zone)  ←   (paste ids, paste an
 obstacles / shifts /           │                        MPD, dump a bag, or
 relations)                     │                        receive one on the bus)
                                ▼
                       Micro-PLoT audit  G·0.3 + M·0.4 + W·0.3
                                │
                                ▼
                       claim & cluster → vignette geometry
                       (row · ring · pyramid · wall · stack · pair · radial)
                                │
                                ▼
                       compose MPD → render → broadcast on wag-frank
                                │
                                ▼
                       fidelity checkpoint (release at 80% or round 20)
```

### Scoring is procedural, not hand-waved

The three Micro-PLoT axes are computed from the part's own `.dat` header —
description line, `!CATEGORY`, `!KEYWORDS` — fetched straight off the hosted
library. No side index is required:

- **G · Geometric Prior** — structural utility from category (baseplate/plate/
  brick/panel/slope high; minifig/plant low), plus a footprint bonus, minus a
  penalty for `~`-marked aliases and obsolete parts.
- **M · Mythic Likelihood** — lexicon hits against the **active zone**. Zone 1
  wants window/glass/pane/screen; zone 3 wants rock/fairing/hull/canyon/flame;
  zone 4 wants wheel/dish/stair/ring/sun. The same brick scores differently
  depending on which void you are filling, which is the whole point.
- **W · Visual Weight** — log-normalised stud footprint, so a 32×32 baseplate
  reaches 1.0 and a 2×2 plate sits near 0.23.

Clicking any ledger row flips its verdict, so the operator overrides the score.

### The tray is the coordinate system

Row `A–I` maps to −Z…+Z, column `1–9` to −X…+X, at 80 LDU per cell. Chebyshev
ring distance from the centre assigns the zone, exactly as the v8.0 grid
topology specifies:

```
ring 0 → Zone 1  Center · The Shadow Screen
ring 1 → Zone 2  Inner  · Captives & Mechanism
ring 2–3 → Zone 3  Outer  · Cave & Fire
ring 4 → Zone 4  Rim    · Ascent & Sun
```

Selecting a cell sets the active zone, which re-scores the ledger live.

### Fidelity

`0.60 × zone coverage + 0.25 × cell spread + 0.15 × part mass`, against per-zone
vignette targets `{Z1:1, Z2:3, Z3:3, Z4:2}`. The checkpoint names the
under-specified zones rather than just printing a number. Loading the seed
alone reads 43%; three claimed vignettes across three zones reads 73%.

---

## 3. Where it plugs into the existing buses

The page opens `BroadcastChannel('wag-frank')` — the same frankbus the `-ator`
builders, `wag-frank.html` and `ball-jar.html` already speak.

**Outbound**, it posts both payload shapes so nothing downstream needs changing:

```js
{ kind: 'scene-mpd', source: 'platos-cave-builder', ts, payload: {
    name, filename, mode: 'replace',
    mpdLines,     // wag-frank / GRACE shape
    mpd_content,  // ball-jar / MENTO / gold shape
    scene: { title, round, fidelity, vignettes:[{name, cell, zone, geom, parts}] }
}}
```

**Inbound**, any bus message carrying `mpd_content`, `mpdLines` or `payload.parts`
is appended to the bucket textarea. That means the procedural builders become
brick sources for free: run `minifigurator`, `locationator`, `vehiculator` or
`sceneerator`, and whatever they emit lands in the cave's bucket ready to audit.

So the three systems compose rather than compete:

| System | Its job | Its job here |
|---|---|---|
| `-ator` builders | procedurally generate elements | supply buckets |
| gold / `gold-to-mpd.js` | carry `mpd_content` between tools | the wire format |
| ball-jar | two-panel shell relaying gold over frankbus | can host this page in a panel |
| **platos-cave-builder** | audit → claim → compose | the round loop |
| GRACE / COURAGE | inspect and edit | the visual witness |

### Agent-driven building

The loop is exposed on `window.PlatosCave` so a tool-using model can drive it
without touching the DOM:

```js
PlatosCave.setBucket('3001\n3004\n4347\n6584');
await PlatosCave.audit();          // scores against the active zone
PlatosCave.selectCell('D', 5);     // → Zone 2
PlatosCave.claim();                // claims everything the ledger marked
await PlatosCave.emit();           // render
PlatosCave.broadcast();            // push to frankbus
PlatosCave.fidelity();             // → 73
```

That is the "dump a bag of bricks and let it build like an AI using a tool"
shape, with the LDraw library as the tool's action space.

---

## 4. On `ingold-trailer.html`

Same answer, different content. Nothing in the loop is Plato-specific except
two data structures at the top of the builder:

- `LEGOS` — the scene graph (entities, goals, obstacles, shifts, relations)
- `ZONES` — four zone names and their lexicons

Swap those and the tray, the audit, the vignette generators, the fidelity
checkpoint and the bus wiring all carry over unchanged. Ingold's *lines* and
*meshwork* would want different vignette geometries than the cave's
rings and ranks — `path`, `weave`, `knot` — added alongside the existing seven
in `buildVignette()`.

The reason this works at all is that the whole system bottoms out in one fact:
a part reference is a URL, and this repo hosts the URLs.

---

## Files

| File | What it is |
|---|---|
| `platos-cave.mpd` | the stabilized scene; every reference verified against `ldraw/` |
| `platos-cave-builder.html` | the automated Micro-PLoT round loop |
| `build-ldraw-resolve-map.js` | generator for the loader fileMap |
| `ldraw-resolve-map.json` | 1,840 keys; 329 → 17 failed requests per scene load |
| `platos-cave.html` | the original studio shell, now linking to the builder |
