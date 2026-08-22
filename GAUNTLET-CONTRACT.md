# GAUNTLET CONTRACT

**Status: binding.** Four builders implement against this document in parallel. Nothing here is a
suggestion. Where the readers disagreed, one answer was picked and the reason is one sentence.

Everything in this file that carries a number was measured today, on this machine, from
`kits/*.mpd` and from twelve of our own generator outputs. Provenance for every number is in
§0.3. If a builder finds a number wrong, fix the number in this file first and then the code —
never the code alone.

---

## 0. GROUND

### 0.1 LDraw facts. Non-negotiable.

```
Y IS DOWN. Up is negative Y. Ground is y = 0.
stud pitch 20 LDU · plate 8 LDU · brick 24 LDU · stud protrusion 4 LDU
type-1 line:  1 <colour> x y z  a b c d e f g h i  <part.dat>     (a..i row-major 3x3)
AABBs in nabugo-parts.json INCLUDE the 4 LDU stud protrusion: a legal stack overlaps by 4.
det(M) < 0 IS ILLEGAL. Real LEGO cannot be mirrored. Zero of 1242 kit placements do it.
```

### 0.2 The canonical placement

Every module in this contract speaks exactly one placement shape. There is no second one.

```js
/** @typedef {Object} Placement
 *  @property {string}   part    part number, no "parts/" prefix, no ".dat" suffix, lowercased
 *  @property {number}   color   LDraw colour code, resolved (never 16 in a flat list)
 *  @property {number[]} pos     [x,y,z] WORLD LDU
 *  @property {number[]} mat     9 numbers, row-major, WORLD
 *  @property {number[]} lpos    [x,y,z] LOCAL to its parent block (== pos for root-level)
 *  @property {number[]} lmat    9 numbers, LOCAL to its parent block
 *  @property {string}   parent  name of the model block that authored it ('root' at top level)
 *  @property {number}   depth   1 at root
 *  @property {string}   layer   'SITE'|'STRUCTURE'|'SKIN'|'SERVICES'|'SPACE'|'STUFF'|'UNASSIGNED'
 *  @property {?string}  asm     assembly id, or null. Two placements with the same asm are one object.
 */
```

`lpos`/`lmat` are load-bearing: four of the twelve axes are measured in LOCAL coordinates because
that is where a kit's grid discipline actually lives (`gridLocal.xzOn10Share` median 0.859 vs world
`grid.xzOn20Share` median 0.173 — a kit is tidy inside its submodel and posed in the world).

### 0.3 Provenance of every number in this document

| source | what it gave |
|---|---|
| `/home/user/tractor-dce-gyo/kit-index.json` | 80-metric norm over the 16 real model kits (`kitNorm`) |
| `/home/user/tractor-dce-gyo/build-kit-index.js` | `FAMILY_RULES`, `SHEARING_MAP`, `affordanceTags` — the family and layer classifiers, reused verbatim |
| `<scratchpad>/axes.js` (written today) | the twelve axis values, computed identically for kits and for our builds |
| `<scratchpad>/layers.js` (written today) | shearing-layer shares of our own outputs |
| `kits/*.mpd` | the bar |

---

## 1. THE BAR

The bar is a named, fetchable file. Never a description of one.

| role | kit | file | pieces | why |
|---|---|---|---|---|
| **DEFAULT BAR** | `5935-island-hopper` | `kits/5935-island-hopper.mpd` | 184 flat / 203 indexed | The only kit in the corpus that scores **all twelve axes as applicable**. It is a place with a building, a vehicle, water, minifigs and props — the same thing our generators claim to make, and it beats every one of them on every axis. |
| ANATOMY BAR | `7140-xwing-fighter` | `kits/7140-xwing-fighter.mpd` | 250 flat / 287 indexed | 22 model blocks, depth 4, named body parts. Use when the worst axis is AX-ANATOMY or AX-REUSE. |
| STRETCH BAR | `10174-imperial-atst-ucs` | `kits/10174-imperial-atst-ucs.mpd` | 1060 | 90 blocks, depth 6, 200 distinct matrices, snot 0.893, 33 reused submodels. Only after the default bar has been beaten. |
| LOW-ROAD BAR | `4838-mini-vehicles` | `kits/4838-mini-vehicles.mpd` | 77 | Dense (29.3 pieces/M LDU³), 3 blocks, cheap, symmetric. The Building-20 comparison. |

`6156-window-brick` is **not a kit**. It is a single LDraw part file (Panel 1x4x3 with Glass), 6
primitive blocks, 0 pieces. It is excluded from every norm and may never be used as a bar. The bar
is 16 kits, not 17.

### 1.1 Scale parity — a gate, not an axis

A 1782-piece platform is not blind-comparable to a 184-piece hopper; the critic would be judging
size. **Our build must have between 0.5× and 2.0× the bar's flat piece count** or the comparison is
VOID and the round does not count. Against `5935` that is **92–368 pieces**. Every current output
except the three finches (50/66/56) is out of band on the high side: `beagle.mpd` is 1782.

Building smaller is a builder's job, not the critic's problem.

---

## 2. GATES — checked before any axis is scored

A gate failure is an automatic loss of the whole round, no axis scoring, no partial credit. Gates
are binary and cheap.

| gate | rule | measured today |
|---|---|---|
| **G-DET** | `det(mat) > 0` for every placement | kits: 0 of 1242 violate. Never negate a matrix column. |
| **G-KNOWN** | every `part` resolves in `Nabugo.Catalog` | our generators pass |
| **G-CLASH** | zero pairs with `Nabugo.Geom.penetration(a,b) > 0`, except within one `asm` | enforced by `NabugoCrew.commit` |
| **G-FLOAT** | every placement traceable to ground via `NabugoModules.groundSettle` | enforced by `commit` |
| **G-SCALE** | `0.5 ≤ ours.pieces / bar.pieces ≤ 2.0` | §1.1 |
| **G-BUFFER** | envelope occupancy ceilings per layer, §5.7 | STRUCTURE ≤ 0.45, +SKIN ≤ 0.60, all ≤ 0.75 |
| **G-BLIND** | the critic receives no filename, no author line, no `0 // NABUGO` meta, no colour-71 tell | §6.2 |

---

## 3. THE AXES

**Twelve axes. They are NEVER summed, averaged, or weighted.** A weighted sum is a supreme judge in
disguise; it lets a builder trade a catastrophic SNOT rate of 0.000 against a good colour count and
call the build improved. Each axis is won, lost, or N/A on its own. The build wins when every
applicable axis is won.

**Ties go to the kit.** Our value must strictly beat the bar's.

### 3.1 Applicability rule

An axis is **N/A for a given bar** when the bar's own value falls outside the axis band. A bar that
does not exercise an axis cannot judge it. (`30023-lighthouse` has snot 0.000 — it cannot be the
judge of SNOT. `4838` has reuse 0.000 — it cannot be the judge of REUSE.) N/A axes are excluded
from the exit condition and reported as `N/A`, never as a win.

### 3.2 Direction semantics

- `higher` — ours must be strictly greater than the bar's.
- `lower` — ours must be strictly less than the bar's.
- `band [lo,hi]` — ours must be inside the band **and** strictly closer to the corpus median than
  the bar is, OR inside the band while the bar is at the band edge. Formally:
  `win = inBand(ours) && (dist(ours) < dist(bar))` where `dist(v) = 0` inside the band and
  `min(|v-lo|,|v-hi|)` outside. A band exists so that overshoot is not rewarded: 63 distinct parts
  in 66 pieces (`finch-cactus`) is not vocabulary, it is a bag of curiosities.

**All twelve axes in this contract are `band`.** `higher` and `lower` are defined so a future axis
can use them; no axis may be added without a measured bar value and a kill test against §3.4.

### 3.3 The table

Every value below is measured, today. "ours" is the range across the twelve generator outputs;
the bracketed name is which of our builds hit that end.

| id | label | Brand layer | measure (from a flat Placement[]) | direction | 5935 bar | 7140 | 10174 | **ours** |
|---|---|---|---|---|---|---|---|---|
| `AX-VOCAB` | vocabulary | SKIN | `distinct(part) / pieces` | band [0.25, 0.60] | **0.332** | 0.368 | 0.145 | 0.038 (forager) – 0.091 (cathedral); 0.82–0.95 (finches, overshoot) |
| `AX-COLOUR` | effective colours | SKIN | `exp(H)` where `H = -Σ s·ln s` over colour shares | band [3.5, 9.0] | **8.00** | 6.27 | — | 1.00 (forager, monochrome) – 4.11 (santiago) |
| `AX-SNOT` | studs off vertical | SKIN | share of placements whose world matrix column 1 `(m[1],m[4],m[7])` is not `±Y` (`abs(abs(m[4])-1) > 0.01`) | band [0.10, 0.70] | **0.147** | 0.176 | 0.893 | **0.000 — all twelve builds, 9994 pieces** |
| `AX-ROT` | rotation vocabulary | STRUCTURE | `distinctRoundedMatrices / pieces × 100`, matrices rounded to 1e-3 | band [4, 40] | **8.15** | 11.20 | 18.87 | 0.056 (beagle) – 6.0 (finch-ground) |
| `AX-POSE` | off-axis pose | SERVICES | share of placements whose matrix has any element that is neither ~0 nor ~±1 | band [0.02, 0.55] | **0.147** | 0.088 | 0.891 | **0.000 everywhere** |
| `AX-LATTICE` | lattice discipline | STRUCTURE | share of placements with `lpos.x`≡0 mod 10 **and** `lpos.z`≡0 mod 10 **and** `lpos.y`≡0 mod 4, tolerance 0.51 LDU | band [0.55, 1.00] | **0.853** | 0.852 | — | 0.18 (finch-ground) – 0.898 (site) |
| `AX-ANATOMY` | body parts | STRUCTURE | `modelBlocks / pieces × 100`; **scores 0 by definition when `modelBlocks < 2`** | band [1.5, 15] | **2.72** | 8.80 | 8.49 | 0.056–0.233 (all one block) |
| `AX-REUSE` | instanced assemblies | STRUCTURE | share of pieces whose parent block is instantiated ≥ 2× | band [0.05, 0.60] | **0.174** | 0.064 | 0.371 | **0.000 everywhere** |
| `AX-SYMMETRY` | bilateral symmetry | SKIN | best sagittal plane `x=c` over `{bboxMid, mean(x), 0}`; a piece counts when another piece with the same part id **or its chirality twin** sits within 4 LDU of `2c−x`, same y,z within 4 LDU | band [0.30, 0.95] | **0.755** | 0.520 | — | 0.001 (beagle) – 0.387 (site) |
| `AX-DENSITY` | inhabited volume | SITE | `pieces / (bboxVolume / 1e6)` in LDU³ | band [1.0, 32] | **1.15** | 2.18 | 1.72 | 0.225 (finch-ground) – 1.279 (site) |
| `AX-SERVICES` | fast layer present | SERVICES | share of pieces in families `hinge+turntable`, `bracket+clip`, `window+door`, `bar+antenna` (`SHEARING_MAP.SERVICES`) | band [0.04, 0.35] | **0.084** | 0.105 | 0.091 | 0.000 (7 of 12 builds) – 0.013 (santiago); finch-ground 0.12 is the lone exception |
| `AX-STUFF` | inhabitants | STUFF | share of pieces in families `minifig`, `wheel+tyre`, `flag+cloth`. **`plant+animal` is deliberately excluded** | band [0.02, 0.50] | **0.049** | 0.129 | 0.006 | **0.000 everywhere** |

### 3.4 Axes that were considered and KILLED

Killing an axis is as much a part of this contract as keeping one. These fail criterion (a): no
real kit measurably wins.

- **AX-INTERIOR / enclosure.** Measured as XZ plan cells empty in the upper band but walled on all
  four sides: `5935` = 0.000, `30023` = 0.000, `7140` = 0.012, `1621` = 0.007 — while
  `loop-forager.mpd` scores **0.125**. *We already beat every kit.* Kits at 25–300 pieces are
  effectively solid; enclosure measures our sprawl, not their craft. Dead.
- **AX-TOP5SHARE.** Correlates ≥0.9 with `AX-VOCAB` on our corpus (forager 0.913/0.038, 5935
  0.271/0.332). Two axes for one property is a weighted sum with extra steps. Folded into `AX-VOCAB`.
- **AX-TOP1SHARE.** Same reason. A build with top1 = 0.429 cannot have `distinctRatio` in band.
- **AX-MIRRORED (det<0 share).** Kit value is 0.000 in all 16, ours is 0.000. Zero variance is
  noise. Promoted to gate **G-DET**.
- **AX-IDENTITYSHARE.** Kit median 0.165, ours 0.944 — a real gap, but a strict function of
  `AX-ROT`; moving `AX-ROT` moves it. Reported as diagnostic `raw.identityShare`, not scored.
- **AX-PIECES / AX-FOOTPRINT.** Size is not quality. Promoted to gate **G-SCALE**.
- **AX-STEPS.** `steps.piecesPerStepAll` median 2.86 — trivially gameable by emitting `0 STEP`
  every third line. Not a property of the model.

### 3.5 SPACE PLAN has no axis, and that is deliberate

There is no measurable SPACE PLAN property that a 25–300 piece kit wins. Enclosure is dead (§3.4).
SPACE PLAN is therefore governed by **G-BUFFER** (§5.7) and read through `AX-SERVICES` (doors,
hinges and clips are what a partition is made of). A builder who wants credit for interior planning
gets it by shipping openings that score on `AX-SERVICES` inside an envelope that passes G-BUFFER.

---

## 4. MODULE BOUNDARIES

Exactly four new files. One owner each. **No shared edits.** If builder B needs something in
builder A's file, it goes in the API below or it does not happen this round.

No new placement path. `NabugoCrew.commit(exp, places, opts)` is the single checked one, and
`NabugoBrand.Build.place()` wraps it. Anything that pushes into `site.places` directly is a bug.

### 4.1 `nabugo-kits.js` → `window.NabugoKits` — owner: KITS builder

Loads a kit MPD, flattens it, measures it, caches it. **Owns the axis registry.** Pure measurement;
places nothing, mutates nothing.

May call: `Nabugo.Catalog` (`get`, `all`, `load`), `Nabugo.Geom` (`worldBox`, `IDENT`).
May NOT call: `NabugoCrew`, `NabugoModules`, `NabugoBrand`.

```js
window.NabugoKits = {

  /** The 17 files as shipped. `bar:true` marks the four in §1. */
  KITS: [ { kit:'5935-island-hopper', file:'kits/5935-island-hopper.mpd', bar:true, role:'DEFAULT' },
          /* … 16 more … */ ],

  /** THE AXIS REGISTRY. The one home. nabugo-gauntlet.js reads it and must not redefine an axis. */
  AXES: [ {
    id:'AX-SNOT', label:'studs off vertical', layer:'SKIN',
    direction:'band', band:[0.10,0.70], median:0.374,
    /** @param {Placement[]} places @param {MeasureCtx} ctx @returns {number} */
    measure(places, ctx) {…}
  }, /* … 11 more, exactly as §3.3 … */ ],

  GATES: [ { id:'G-DET', check(places, ctx) { return {ok:Boolean, why:String}; } }, /* … */ ],

  /** kit-index.json, parsed and cached. Never re-fetched. */
  loadIndex(url = './kit-index.json'): Promise<KitIndex>,

  /** Fetch + parse one kit. Cached by name. Applies the four parsing gotchas. */
  load(kitName: string): Promise<KitDoc>,
  //  KitDoc = { kit:string, file:string, text:string,
  //             blocks: Map<lowercaseName, {name, lines:string[], isPart:boolean, isFlex:boolean}>,
  //             root: {name, lines} }
  //  ROOT RULE: within the pre-first-`0 FILE` section, the LAST `0 Name:` that is not
  //             LDConfig.ldr names the root. If there is none (our own MPDs), the FIRST
  //             `0 FILE` block is the root.
  //  PART RULE: a block whose name ends `.dat` is an inlined part definition, never a submodel.
  //  FLEX RULE: a block with `0 !LDCAD PATH_SKIN` or a name matching /flex|hose/i collapses to
  //             ONE piece. 10174: 1249 raw refs -> 1060 pieces.
  //  PRIM RULE: refs to `s/*`, `48\*`, `NN-NNxxx` and anything absent from Nabugo.Catalog are
  //             dropped before counting.

  /** Recursive flatten to world coords. THE flattening rule; nobody writes a second one. */
  flatten(doc: KitDoc): Placement[],

  /** Measure ANY flat placement list — kit or ours. One code path, or the comparison is a lie. */
  measurePlacements(places: Placement[], opts?: {label?:string}): AxisVector,
  //  AxisVector = {
  //    label: string, pieces: number,
  //    axes:  Record<axisId, number>,          // the 12 values
  //    gates: Record<gateId, {ok:boolean, why:string}>,
  //    raw:   { distinct, top1Share, top5Share, identityShare, distinctMatrices, colours,
  //             bbox:[w,h,d], bboxMin:[3], bboxMax:[3], volume, modelBlocks, maxDepth,
  //             familyShare: Record<family,number>,
  //             layerShare:  Record<'SITE'|'STRUCTURE'|'SKIN'|'SERVICES'|'SPACE'|'STUFF'|'UNASSIGNED', number>,
  //             occupancy:   { STRUCTURE:number, STRUCTURE_SKIN:number, ALL:number },
  //             affordances: Record<'clip'|'hinge'|'handle'|'stud-on-side'|'bar-or-pin'|'groove'|'ball'|'hole', number> }
  //  }

  /** load + flatten + measure, cached by kit name. */
  measure(kitName: string): Promise<AxisVector>,

  /** The bar object the critic and the builders both use. */
  bar(kitName = '5935-island-hopper'): Promise<Bar>,
  //  Bar = { kit:string, file:string, vector:AxisVector, pieces:number,
  //          scaleBand:[number,number],                 // [0.5*pieces, 2.0*pieces]
  //          applicable: axisId[],                      // axes whose bar value is in band (§3.1)
  //          targets: Record<axisId, {barValue:number, band:[number,number], direction:string}> }

  /** kitNorm from the index: min/p25/median/p75/max/argmin/argmax per dotted metric path. */
  norm(metricPath: string): {min,p25,median,p75,max,mean,argmin,argmax} | null,

  // ---- classifiers, ported VERBATIM from build-kit-index.js. Do not re-derive. ----
  familyOf(partId: string): string,     // 16 families, FAMILY_RULES order matters
  layerOf(partId: string):  string,     // SHEARING_MAP: STRUCTURE|SKIN|SERVICES|STUFF|UNASSIGNED
  affordancesOf(partId: string): string[],

  /** Chirality table built once from Catalog descriptions ending ' Left'/' Right' plus the
   *  hand-verified wedge/wing families. 7140 uses 3 families, 10174 uses 8. */
  chiralityTwin(partId: string): string | null,
  CHIRALITY_PAIRS: Array<[string,string]>,   // ['30355','30356'], ['41770','41769'], …

  clearCache(): void
};
```

**Verified pairs that must be in `CHIRALITY_PAIRS` on day one** (from the kits, not from a regex):
`30355/30356` (Wing 6x12 L/R), `6564/6565` (Wedge 3x2 R/L), `3818/3819` (Minifig Arm R/L),
`41770/41769` (Wing 2x4), `41748/41747` (Wedge 2x6 Double), `43720/43721` (Wedge 4x2 Sloped),
`41750/41749` (Slope Round 3x8x2), `43722/43723` (Wing 2x3), `47397/47398` (Wing 3x12),
`43710/43711` (Wedge 4x2 Double).

### 4.2 `nabugo-brand.js` → `window.NabugoBrand` — owner: BRAND builder

The six shearing layers as a build engine. This is where builds come from now.

May call: `Nabugo.Catalog`, `Nabugo.Geom`, `Nabugo.Scene`, `NabugoEvo.Ports.of`,
`NabugoModules.Palette`, `NabugoModules.Cursor`, `NabugoModules.Site`, `NabugoModules.groundSettle`,
`NabugoCrew.commit`, `NabugoCrew.Stores`, `NabugoKits` (read-only: `layerOf`, `familyOf`,
`chiralityTwin`, `measurePlacements`, `bar`).
May NOT call: `NabugoGauntlet`, and may NOT push into `site.places` except through `Build.place`.

```js
window.NabugoBrand = {

  /** The six layers, in build order. Frozen. */
  LAYERS: [
    { id:'SITE',      order:0, clock:'permanent',   shareBand:[0.02,0.15], … },
    { id:'STRUCTURE', order:1, clock:'30-300 yr',   shareBand:[0.25,0.50], … },
    { id:'SKIN',      order:2, clock:'20-30 yr',    shareBand:[0.20,0.45], … },
    { id:'SERVICES',  order:3, clock:'7-15 yr',     shareBand:[0.04,0.35], … },
    { id:'SPACE',     order:4, clock:'3-30 yr',     shareBand:[0.00,0.15], … },
    { id:'STUFF',     order:5, clock:'daily',       shareBand:[0.02,0.50], … }
  ],   // full field list in §5

  TEMPERAMENT: { LOW: {…}, HIGH: {…} },     // §5.8

  /** The build host. `commit()` needs `.site.places`, `.site.claims` and `.rng`; Build provides
   *  exactly that shape, so NabugoCrew.commit(build, …) works unmodified. */
  Build: class {
    constructor(opts: { seed?:number, extent?:number, temperament?:'LOW'|'HIGH',
                        bar?:Bar, name?:string, palette?:NabugoModules.Palette })
    // fields (duck-typed for commit):
    site: { places: Placement[], claims: Array<{x,z,w,d,label}>, extent: number, log: [] }
    rng:  () => number                  // Nabugo.mulberry32(seed)
    layer: string                        // current open layer, '' when none
    ledger: Array<{layer, op, parts, refused, why}>

    /** Open a layer. Throws if a slower layer is opened after a faster one has closed. */
    openLayer(id: string): void
    closeLayer(): { layer:string, parts:number, share:number, occupancy:number, ok:boolean, why:string }

    /** THE ONLY WAY IN. Stamps layer + asm, runs G-DET and the layer's mayNotTouch rule,
     *  runs the G-BUFFER ceiling for the open layer, then delegates to NabugoCrew.commit.
     *  @returns { ok, parts, clashed, unsupported, refused:string[], reason?:string } */
    place(places: Placement[], opts?: { atomic?:boolean, requireSupport?:boolean,
                                        selfClash?:boolean, asm?:string }): CommitResult

    /** Cut a submodel. Everything `fn` places lands inside one assembly.
     *  @param name  human name — 'Left Foot', 'Cockpit', 'Nose'. Becomes the .ldr filename.
     *  @returns the asm id */
    asm(name: string, fn: (b: Build) => void): string

    /** Re-instance an assembly already cut. This is what moves AX-REUSE off 0.000.
     *  Copies the asm's placements, transformed. Refuses det<0. */
    instance(asmId: string, pos:[number,number,number], mat?: number[]): CommitResult

    /** MIRROR — three legal implementations, tried in order. NEVER negates a matrix column.
     *   (i)  part has a chirality twin -> emit twin at reflected pos with the SAME matrix
     *   (ii) part is 2-fold symmetric about Y -> emit it with rotY(180) at reflected pos
     *   (iii) neither -> refuse, and name the part in `refused`
     *  @param plane 'x'|'z' @param about LDU coordinate of the mirror plane */
    mirror(places: Placement[], plane: 'x'|'z', about: number): { places: Placement[], refused: string[] }

    /** RING — n copies around a hub on the XZ plane, each yawed 360*i/n + phase.
     *  n must be 4 for square-footprint parts; 4, 6 or 8 for round. */
    ring(hub:{x,z}, radius:number, n:number, part:string,
         opts?:{phase?:number, y?:number, color?:number}): Placement[]

    /** Reserve volume no layer may enter. Scenario buffering, §5.7. */
    reserve(box: {min:[3], max:[3]}, why: string): void

    buffer(): { STRUCTURE:number, STRUCTURE_SKIN:number, ALL:number, ok:boolean, ceiling:string }

    toScene(): Nabugo.Scene           // asm stamps survive; Scene.toMPD cuts the submodels
    toMPD(opts?): string
    measure(): AxisVector             // delegates to NabugoKits.measurePlacements(this.site.places)
  },

  // ---- layer generators. Each returns Placement[] in LOCAL coords around {x:0,z:0}; the caller
  // ---- positions them. Each declares `layer` on every placement it returns.
  SITE:      { plate(b, o), shoreline(b, o), plot(b, o) },
  STRUCTURE: { frame(b, o), bay(b, o), spine(b, o), leg(b, o) },
  SKIN:      { cladding(b, o), roof(b, o), nose(b, o), band(b, o) },
  SERVICES:  { opening(b, o), hingeJoint(b, o), clipRail(b, o), ladder(b, o) },
  SPACE:     { partition(b, o), deck(b, o), circulation(b, o) },
  STUFF:     { minifig(b, o), vehicle(b, o), prop(b, o) },
  // signature for all: (build: Build, opts: object) => Placement[]

  /** The corrected minifig skeleton. See §5.6 — the shipped minifigurator table is WRONG. */
  MINIFIG_SKELETON: {
    head:  { dy:-84, x:0,      mat:'IDENT' },
    torso: { dy:-60, x:0,      mat:'IDENT' },
    armL:  { dy:-51, x:-15.552 }, armR: { dy:-51, x:15.552 },
    hips:  { dy:-28, x:0,      mat:'IDENT' },
    legL:  { dy:0,   x:0, mat:[1,0,0, 0,0,1, 0,-1,0] },   // BOTH legs at x=0
    legR:  { dy:0,   x:0, mat:[1,0,0, 0,0,1, 0,-1,0] }
  },

  /** Compose a whole build from a brief. The four builders' integration point. */
  compose(opts: { bar: Bar, seed?: number, temperament?: 'LOW'|'HIGH',
                  subject?: string, focusAxis?: string }): Promise<Build>
};
```

### 4.3 `nabugo-gauntlet.js` → `window.NabugoGauntlet` — owner: GAUNTLET builder

The blind harsh critic and the loop. **The critic never builds. The builder never judges.**

May call: `NabugoKits` (everything), `NabugoBrand` (`compose`, `Build.measure`).
May NOT call: `Nabugo.Catalog`/`Geom` directly for scoring — all measurement is `NabugoKits`.

```js
window.NabugoGauntlet = {

  /** Strip every tell. Returns two anonymous, order-randomised entrants.
   *  Removes: filename, 0 Author, 0 Name, 0 // NABUGO meta, 0 !LDRAW_ORG, submodel names
   *  (renamed to sub-1.ldr, sub-2.ldr…), and any comment line. */
  blind(a: AxisVector, b: AxisVector, rng: () => number):
    { A: AxisVector, B: AxisVector, key: { A:'ours'|'kit', B:'ours'|'kit' } },
  //  `key` is SEALED: only gauntlet-page.js reads it, and only on the `reveal` command.
  //  judgeAxis/compare never receive it.

  /** Score one axis, harshly. Ties go to the kit. */
  judgeAxis(axis: AxisDef, ours: number, bar: number):
    { id:string, ours:number, bar:number, verdict:'WIN'|'LOSS'|'N/A',
      margin:number, why:string },
  //  verdict rules, in order:
  //    bar outside axis.band                            -> 'N/A'
  //    !inBand(ours)                                    -> 'LOSS'  (why names the direction of miss)
  //    dist(ours) >= dist(bar)                          -> 'LOSS'  (ties go to the kit)
  //    else                                             -> 'WIN'

  /** The whole comparison. Gates first; a gate failure short-circuits to a VOID round. */
  compare(oursVector: AxisVector, bar: Bar, opts?: {rng?}):
    { void:boolean, voidReason?:string,
      gates: Array<{id, ok, why}>,
      axes:  Array<AxisVerdict>,               // one per axis, in AXES order
      wins:  number, losses: number, na: number,
      worst: AxisVerdict | null,               // largest normalised shortfall among LOSSes
      allWon: boolean,
      verdict: string },                       // one harsh sentence, no praise

  /** The brief handed to the next build. Names ONE axis. */
  brief(worst: AxisVerdict, bar: Bar):
    { axis:string, target:number, barValue:number, layer:string,
      instruction:string,                      // imperative, e.g. "SKIN: place 14% of pieces studs-sideways"
      forbidden:string[] },                    // the other axes' current values, as regressions to avoid

  /** One turn of the loop. Never runs more than one build. */
  round(state: GauntletState): Promise<GauntletState>,
  //  GauntletState = { bar:Bar, seed:number, temperament:'LOW'|'HIGH',
  //                    round:number, build:Build|null, vector:AxisVector|null,
  //                    result:CompareResult|null, brief:Brief|null,
  //                    history: Array<{round, worst, wins, losses, void}>,
  //                    stopped:boolean, stopReason:string }

  /** Run until every applicable axis wins, or `state.stopped`. NO round-count exit. */
  run(state: GauntletState, onRound?: (s: GauntletState) => void): Promise<GauntletState>,

  start(opts: { kit?:string, seed?:number, temperament?:'LOW'|'HIGH' }): Promise<GauntletState>,
  stop(state: GauntletState, why: string): GauntletState
};
```

### 4.4 `gauntlet-page.js` → `window.GauntletBoot` — owner: PAGE builder

The Hilux bootstrap, matching `HILUX.md` and the shape of `expedition-page.js`.

```js
/** @param cfg { title, source, brief?, kit?, seed?, temperament?, note?, background? } */
window.GauntletBoot = async function boot(cfg) { … }
```

Mounts:

```js
const hx = Hilux.mount({
  title: cfg.title,
  chips: ['round', 'wins', 'worst', 'bar'],
  placeholder: 'run · round · bar 7140 · temper low · mpd · fit · stop',
  rounds: true,
  panels: [
    { id:'card',  label:'CARD',  glyph:'▤', title:'the blind card',      build: panelCard   },
    { id:'axes',  label:'AXES',  glyph:'⊞', title:'twelve axes, per axis', build: panelAxes },
    { id:'brief', label:'BRIEF', glyph:'▶', title:'the next brief',      build: panelBrief  },
    { id:'layers',label:'LAYERS',glyph:'▥', title:'six clocks',          build: panelLayers },
    { id:'bar',   label:'BAR',   glyph:'★', title:'the kit',             build: panelBar    }
  ],
  onCommand: command, onWorld, onFit, onTrace, onResize
});
```

Rules for the page: two viewers side by side in the bed via `NabugoUI.makeViewer` — **left and
right, unlabelled, until the user taps REVEAL**. `hx.logRound({who:'CRITIC', score:wins, delta,
text:verdict})` once per round. The axes panel renders one row per axis with `WIN`/`LOSS`/`N/A`
and never a total. Commands: `run`, `round`, `bar <kit>`, `temper low|high`, `seed <n>`, `reveal`,
`mpd`, `fit`, `stop`, `help`.

---

## 5. THE LAYER PLAN

Six layers, six clocks. **A fast layer is never trapped inside a slow one.** Enforced, not hoped:
`Build.openLayer` refuses to reopen a slower layer once a faster one has closed, and
`Build.place` refuses a placement whose family belongs to another layer's `owns`.

Shares are of total pieces and are targets for a 92–368 piece build against `5935`. Kit-measured
comparanda are `shearingLayerShare` from `kit-index.json` (STRUCTURE median 0.430, SKIN 0.326,
SERVICES 0.098, STUFF 0.048).

### 5.1 SITE — clock: permanent

- **Owns**: the plot boundary, the ground plane, the water line, the legal extent. `site.claims`.
- **Generates**: baseplates and ground plates. Families `plate` (baseplate subtype) only.
  Colours: 2 Green / 19 Tan / 71 Light Bluish Grey / 1 Blue for water. **2–8% of pieces.**
- **Source**: **the locationator.** `scene-shells.json` (116 shells) via `NabugoCrew.Stores`,
  filtered by `Stores.groundShells()`. Take the *shell ids only* — `locationSlotDefaults` and
  `LOCATION_LAYOUT` are Y-inverted placeholders (`WALL {y:80}`, `ROOF {y:160}` bury the roof 160 LDU
  underground) and are hereby **quarantined**: no layer may read them.
- **May NOT touch**: anything above y = −8. SITE places no walls, no columns, no props.

### 5.2 STRUCTURE — clock: 30–300 years

- **Owns**: the load-bearing frame. Everything else hangs off it.
- **Generates**: families `brick`, `plate`, `technic`. Big staples: 3001/3002/3003/3020/3022/3023.
  1–3 colours, muted (71, 72, 70, 0). **25–50% of pieces** (kit median 0.430).
- **Source**: `NabugoModules.Palette` roles `block`, `slab`, `beam` — the existing role table is
  correct for this layer and only this layer.
- **Must**: be cut into named `asm` blocks (§4.2 `Build.asm`) — 'Left Foot', 'Hull Bay 2'. This is
  where `AX-ANATOMY` and `AX-REUSE` are won.
- **May NOT touch**: tiles, slopes, hinges, clips, windows, minifigs. If the frame needs a slope it
  is not the frame.
- **Buffer ceiling**: ≤ 0.45 envelope occupancy at close.

### 5.3 SKIN — clock: 20–30 years

- **Owns**: the weather face. Cladding, roofing, nose, wing surfaces, the colour band.
- **Generates**: families `tile`, `slope`, `panel+windscreen`, `round+cone`. **20–45% of pieces**
  (kit median 0.326; `6965-tie-interceptor` runs 0.78).
- **This is where SNOT lives.** Target `AX-SNOT` ≥ 0.15 by using the named anchor vocabulary,
  nothing else: `47905` (Brick 1x1 with Studs on Two Opposite Sides), `30414` (Brick 1x4 with Studs
  on Side), `4070` (Headlight brick), `2555` (Tile 1x1 with Clip), `3794a`/`47457` (studs-down
  plates). The offsets are exact half-widths: side stud face at 10 LDU from a 1x1 centre, plus
  8 LDU of plate body = 18. The single most common SNOT matrix in the corpus is
  `1 0 0  0 0 -1  0 1 0` (+90 pitch about X): 20× in 10174, 8× in 7140.
- **Colour band rule**: a horizontal band is made by **substituting the part**, not recolouring it.
  30023 stacks white `87081` round bricks and swaps in a `RING(hub, r, 4, '3063b')` of red corner-
  rounds at the banded course. Keep the outer diameter constant.
- **May NOT touch**: the frame's own geometry, hinges, doors, minifigs.
- **Buffer ceiling**: STRUCTURE+SKIN ≤ 0.60 envelope occupancy at close.

### 5.4 SERVICES — clock: 7–15 years

- **Owns**: everything that wears out and must be reachable. Doors, windows, hinges, clips, ladders,
  bars, lights, antennae.
- **Generates**: families `hinge+turntable`, `bracket+clip`, `window+door`, `bar+antenna`.
  **4–20% of pieces** (kit median 0.098; `4489-atat-mini` 0.317).
- **Source**: **not an -ator — the catalogue.** `NabugoKits.affordancesOf` over `Nabugo.Catalog`,
  cross-checked against `NabugoEvo.Ports.of` for joinability. The `sceneerator` is honest but emits
  one part; the vehiculator and locationator slot tables resolve six of seven slots to `3001.dat`
  and are quarantined (§5.1).
- **Must**: pose at least one joint off-axis. `3937` Hinge 1x2 Base + `6134` Hinge 2x2 Top posed
  inside a submodel at an exact angle — 10174 uses 63.0° (`1 0 0  0 0.454 -0.891  0 0.891 0.454`)
  and 45° (`1 0 0  0 0.707 0.707  0 0.707 -0.707`). This is the whole of `AX-POSE`.
- **CRITICAL**: `NabugoModules.NOT_STRUCTURAL` bans `hinge`, `clip`, `hook`, `handle`, `hole`,
  `pin`, `axle`, `wheel` from every Palette role. That regex is **correct for STRUCTURE and SKIN and
  must not be relaxed.** SERVICES bypasses `Palette` entirely and selects from `Catalog` directly.
  This is the single reason our SERVICES share is 0.000 in seven of twelve builds.
- **May NOT touch**: the frame. A door is cut into an opening the STRUCTURE layer already left.

### 5.5 SPACE PLAN — clock: 3–30 years

- **Owns**: interior partitions, decks, circulation.
- **Generates**: reuses SKIN and STRUCTURE families (`plate`, `tile`, `panel`) but **only inside the
  envelope**, and only into volume the buffer has reserved. **0–15% of pieces.**
- **Source**: `NabugoModules.MODULES.floor` and the `Cursor`, run against a reserved box.
- **Has no axis** (§3.5). Its discipline is the buffer.
- **May NOT touch**: the exterior envelope, the frame, the site.

### 5.6 STUFF — clock: daily

- **Owns**: the inhabitants. Minifigs, vehicles, furniture, props.
- **Generates**: families `minifig`, `wheel+tyre`, `flag+cloth`. **2–20% of pieces**
  (`5935` 0.049, `7140` 0.129, `889-radar-truck` 0.486).
- **Source**: **the minifigurator and the vehiculator**, for their data only:
  - `minifig-library.json` (curated figures) via `NabugoCrew.Stores.figures`, and
    `buildPartsFromSelection`'s composite-avoidance logic — the only such logic in the repo.
  - `vehicle-library.json` for part ids via `Stores.vessels`. **`VEHICLE_LAYOUT` is quarantined**:
    `WINDSCREEN {y:40}`, `ENGINE {y:20}`, `TAIL {y:50}` are below the chassis and `WHEELS {y:-20}`
    is above the roof, because the table was written Y-up.
  - `MINIFIG_HEIGHTS` is correct for head/torso/arms/hips (verified against
    `kits/1621-lunar-mpv.mpd:521-530` and `kits/5935-island-hopper.mpd:566-572`) and **wrong for the
    legs**: it puts the left leg at x=−20 with an identity matrix. The kits put **both** `3816` and
    `3817` at x=0, y=+44 relative to torso, with matrix `1 0 0  0 0 1  0 -1 0`. Use
    `NabugoBrand.MINIFIG_SKELETON` (§4.2), never the shipped table.
- **Must**: every figure and every vehicle is one `asm`. That is what makes them removable, and it
  feeds `AX-REUSE`.
- **May NOT touch**: anything. STUFF is placed last, rests on a surface found by
  `NabugoCrew.surfaceAt`, and removing all of it must leave a legal build.

### 5.7 SCENARIO BUFFERING — a hard rule, with a number

Over-specifying every cubic LDU locks out the future. The engine enforces this by voxelising the
build's own bounding envelope at **20 × 8 × 20 LDU** and measuring occupied-voxel share at the close
of each layer.

```
STRUCTURE alone            ≤ 0.45      (corpus: 5935 0.020, 7140 0.042, 30023 0.118, 4838 0.579)
STRUCTURE + SKIN           ≤ 0.60      (corpus: 5935 0.050, 7140 0.130, 30023 0.444, 4838 0.683)
all six layers             ≤ 0.75      (corpus max 0.760 at 4838; 5935 0.153, 7140 0.147)
=> AT LEAST 25% OF THE ENVELOPE STAYS UNCOMMITTED, PERMANENTLY.
```

Enforcement is in `Build.place`: a placement that would push the open layer past its ceiling is
**refused**, counted in `ledger`, and named in `CommitResult.refused`. `Build.reserve(box, why)`
additionally hard-blocks a volume for a named future layer; `place` refuses any placement whose
world AABB penetrates a reserve.

The buffer is measured against the **model's own envelope, not the plot**, so it cannot be satisfied
by spreading out. Spreading out is punished separately by `AX-DENSITY` (floor 1.0 pieces per
1e6 LDU³; our best build today is 1.279 and our worst is 0.225).

### 5.8 LOW ROAD vs HIGH ROAD — a temperament that changes real parameters

Not a mood. Six named parameters, read by `NabugoBrand.compose` and the layer generators.

| parameter | LOW ROAD (Building 20) | HIGH ROAD (the UCS shelf) |
|---|---|---|
| `paletteNovelty` | 0.0 — staples only, `part.id.length <= 4` | 0.6 — chirality pairs, wedges, wings required |
| `colourTarget` (effective colours) | 3.5–5.0 | 6.0–9.0 |
| `snotTarget` | 0.12 (band floor) | 0.35 |
| `reuseTarget` | **0.35** — repetition is the point; a low-road building is the same bay again | 0.15 |
| `blocksPer100Target` | 2.0–4.0, large blocks | 6.0–12.0, small named blocks + 2–5 part detail atoms |
| `structureCeiling` (buffer) | **0.30** — leave more room to re-cut | 0.45 |
| `tileCapRate` (exposed top faces tiled) | 0.10 | 0.60 |
| `courseUnit` | brick (24 LDU) — fewer, bigger courses | plate (8 LDU) — fine control |
| default bar | `4838-mini-vehicles` | `7140-xwing-fighter`, then `10174` |

### 5.9 The two-tier submodel policy (both temperaments)

From the kits, not invented. 10174 has 90 blocks, median 5 leaf parts; 44 of 85 non-hose blocks are
≤ 5 parts; 33 blocks are instanced more than once and deliver 26.7% of all pieces.

- **TIER A — anatomy.** One `asm` per named body part. Target 10–80 parts. Named after the thing.
  Depth ≤ 5 from root.
- **TIER B — detail atoms.** 2–5 part assemblies, cut into their own block **the moment they are
  used more than once**, and required to be used at least twice. `10174 - subModel-8.ldr` is two
  lines and is instanced 8 times across 5 parents.
- **Rejection rules**: the largest block may not hold > 35% of pieces; at least 20% of blocks must
  be ≤ 5 parts; ≥ 25% of pieces should arrive through instanced blocks (HIGH ROAD: ≥ 15%).

---

## 6. THE LOOP

### 6.1 Pseudocode

```
state = NabugoGauntlet.start({ kit: '5935-island-hopper', seed, temperament })
bar   = await NabugoKits.bar(state.kit)          # named, fetchable, measured

loop forever:                                     # NO round count. NO max rounds.
    if state.stopped: break                       # only the user stops it

    # ---- BUILD ---------------------------------------------------------
    # The builder sees ONE brief: last round's worst axis. It does not see the
    # critic's other verdicts as a scoreboard, and it never scores itself.
    build  = await NabugoBrand.compose({ bar, seed: state.seed + state.round,
                                         temperament: state.temperament,
                                         focusAxis: state.brief?.axis })
    for layer in [SITE, STRUCTURE, SKIN, SERVICES, SPACE, STUFF]:
        build.openLayer(layer)
        LAYER_GENERATORS[layer](build, briefFor(layer, state.brief))
        r = build.closeLayer()                    # buffer ceiling checked here
        if not r.ok: record(r.why)                # refusal, not a crash

    ours = build.measure()                        # NabugoKits.measurePlacements — same code as the kit

    # ---- CRITIC (fresh context, no memory of the build) ----------------
    { A, B, key } = NabugoGauntlet.blind(ours, bar.vector, rng)   # labels stripped, order shuffled
    result = NabugoGauntlet.compare(ours, bar)

    if result.void:                               # a gate failed, or scale parity broke
        state.brief = briefFromGate(result.voidReason)
        state.round += 1
        continue                                  # the round does not count as progress

    # ---- PER AXIS. NEVER SUMMED. --------------------------------------
    for axis in NabugoKits.AXES:
        verdict = judgeAxis(axis, ours.axes[axis.id], bar.vector.axes[axis.id])
        # 'N/A' when the bar's own value is outside the axis band
        # ties -> LOSS. The kit keeps the point.

    if result.allWon:                             # every APPLICABLE axis won
        emit('THE BUILD BEATS ' + bar.kit + ' ON ALL ' + result.wins + ' APPLICABLE AXES')
        bar = await NabugoKits.bar(nextHarderBar(bar))    # 5935 -> 7140 -> 10174
        continue                                  # the exit is winning, and then a harder bar

    # ---- BRIEF: exactly one axis, the worst -----------------------------
    state.brief = NabugoGauntlet.brief(result.worst, bar)
    state.history.push({ round: state.round, worst: result.worst.id,
                         wins: result.wins, losses: result.losses })
    state.round += 1
```

### 6.2 Rules the loop may not break

1. **The builder never judges itself.** `NabugoBrand` must not import `NabugoGauntlet`. The only
   number it may read about its own quality is the brief's single target.
2. **The comparison is blind.** `NabugoGauntlet.blind` strips filename, `0 Author`, `0 Name`,
   `0 !LDRAW_ORG`, all `0 //` comments, and renames submodels to `sub-N.ldr` before anything is
   shown or scored. Our default colour 71 is itself a tell: `AX-COLOUR` fixes that, and until it
   does the critic scores from the vector, not the text.
3. **Harsh.** `compare().verdict` is one sentence naming the worst failure. There is no praise
   field. A round where nine axes improved and `AX-SNOT` is still 0.000 reports the 0.000.
4. **Ties go to the kit.** `dist(ours) >= dist(bar)` is a LOSS.
5. **Worst axis** = largest normalised shortfall, `shortfall = dist(ours) / max(bandWidth, 1e-6)`,
   over LOSSes only. Ties broken by `AXES` order (SNOT before COLOUR before VOCAB…).
6. **No round-count exit.** The only exits are `allWon` (which promotes the bar) and `state.stopped`
   set by the user.
7. **One axis per brief.** Handing a builder four targets produces four half-fixes and a regression.

---

## 7. DISAGREEMENTS, RESOLVED

One sentence each. These are decided.

1. **Kit count: 16, not 17.** `6156-window-brick` is a part file; it enters no norm and is never a bar.
2. **Default bar: `5935-island-hopper`, not `10174`.** 5935 is the only kit that scores all twelve
   axes as applicable and it is already within reach at 184 pieces; 10174 is the stretch.
3. **Piece counts: use the flat count from `NabugoKits.flatten`, not `kit-index.pieces`.** They
   differ (5935: 184 vs 203) because the index counts flex groups and alias hops the flattener
   drops; one number, one code path, and the flattener is the one both sides use.
4. **Axes are measured in LOCAL coordinates where the kit's discipline is local** (`AX-LATTICE`) and
   in WORLD where the reader sees it (`AX-SNOT`, `AX-SYMMETRY`) — the readers reported both; this is
   the split.
5. **`plant+animal` is excluded from `AX-STUFF`.** With it in, `beagle.mpd` scores 0.118 STUFF and
   beats the island hopper's 0.049 while containing zero minifigs and zero wheels — corals are not
   inhabitants.
6. **Enclosure is not an axis.** We beat every kit on it (0.125 vs max 0.012); it measures our
   sprawl, not their craft.
7. **`NOT_STRUCTURAL` stays as it is.** It is right for STRUCTURE and SKIN; SERVICES bypasses
   `Palette` and reads `Catalog` directly rather than weakening a regex that is doing its job.
8. **The -ator layout tables are quarantined, their data is kept.** `VEHICLE_LAYOUT`,
   `locationSlotDefaults`, `LOCATION_LAYOUT` and `vehicleSlotDefaults` are Y-inverted or resolve to
   `3001.dat`; the JSON libraries behind them are fine.
9. **`minifigurator.html`'s leg placement is a bug, not a variant.** Both legs at x=0 with
   `1 0 0  0 0 1  0 -1 0`, per the kits.
10. **One measuring function.** `NabugoKits.measurePlacements` measures the kit and measures us. Any
    second implementation invalidates the comparison and is a build failure.

---

## 8. DEFINITION OF DONE

Not "the code runs". Done is:

```
NabugoGauntlet.compare(ours, await NabugoKits.bar('5935-island-hopper')).allWon === true
```

with zero gate failures, at 92–368 pieces, blind. Then the bar becomes `7140-xwing-fighter` and the
loop continues.
