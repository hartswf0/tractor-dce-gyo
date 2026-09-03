# Nabugo — a build engine for dueling LDraw doctrines

Ball-jar had the right idea and the wrong mechanism. Two iframes shouting
`mpd_content` at each other over a BroadcastChannel is a kludge: neither side
has any notion of what a *scene* is, so nothing can be compared, scored, or
argued about. You get two documents, not two builds.

Nabugo keeps the idea — two builders, one arena, one bus — and throws away the
iframes. Both doctrines run in one page against one catalogue, one geometry
kernel, and one scoring function.

```
                        ┌─────────────────────────────┐
                        │   nabugo.js — the engine    │
   nabugo.html ────────►│  Catalog · Geom · Scene     │◄──── lego-operator-trace.html
   (the arena,          │  Audit · Strategy           │      (OPERATOR alone)
    both doctrines)     │  Vignette · Brief           │
                        │  Doctrine · Arena · Bus     │◄──── lego-correspondence.html
                        └─────────────────────────────┘      (CORRESPONDENCE alone)
                                     │
                        ldraw/ (vendored) + nabugo-parts.json
```

---

## 1. The catalogue is real geometry, not descriptions

`build-nabugo-index.js` walks all 23,511 part files in the vendored `ldraw/`
tree and, for each one, resolves its **actual axis-aligned bounding box** —
recursively, applying every subfile matrix down the tree. Verified against
known parts:

| part | indexed AABB (LDU) | true dimension |
|---|---|---|
| `3001` Brick 2×4 | 80 × 28 × 40 | 80 × 28 × 40 ✓ (24 body + 4 stud) |
| `3024` Plate 1×1 | 20 × 12 × 20 | 20 × 12 × 20 ✓ (8 body + 4 stud) |
| `6092` Baseplate 32×32 | 640 × 80 × 640 | 32 studs × 20 LDU ✓ |

`nabugo-parts.json` holds **15,117 parts** (stickers, obsolete aliases and
internal sub-assemblies are excluded) with AABB, stud footprint, height in
plates, category, keywords, and connectivity signature.

This is what makes the rest possible. A builder that only knows part
*descriptions* can only guess whether its build stands up.

---

## 2. The feedback engine is deterministic and offline

Nothing in Nabugo calls a model. Every judgement is a measurement:

| finding | how it is computed |
|---|---|
| **compiles** | every reference resolves in the real library |
| **collision** | pairwise AABB interpenetration volume, 1.5 LDU slack |
| **floating** | grounding propagated upward from y = 0 through stacked contacts |
| **cohesion** | union-find over touching parts, *within each vignette* |
| **coverage** | parts per narrative zone against the brief's targets |
| **fidelity** | narrative coverage × a soundness multiplier |

Fidelity is deliberately gated: an unbuildable scene cannot be faithful. A
build that collides, floats or fragments loses fidelity no matter how well it
covers the brief.

**Global fragmentation is reported but not judged.** A tray scene is *meant*
to be separated clusters — that is the whole Vignette Protocol. What counts as
a defect is a cluster that fails to cohere internally: confetti pretending to
be a construction. Getting this wrong was the first version's worst bug; it
demanded one connected component and deadlocked every run at `FRAGMENT`.

The critic names exactly **one** defect, in the priority order both source
builders insist on:

```
EMPTY → COMPILE → COLLISION → FLOAT → LOOSE → VOID → MONOTONE → CROWDED → THIN → SETTLED
      structure ─────────────────────► relation ─────────► finish ─────────► detail
```

---

## 3. Variety: three ways to answer the same void

This is the part the Ship of Theseus brief is actually testing. Given one
void, the three strategies reach into the same catalogue and come back with
genuinely different answers:

- **BRICKWORK** — masonry. Small standard parts (≤ 4×4 studs, ≤ 4 plates),
  the thing built literally. Ranks `G·0.55 + M·0.25 + W·0.30`.
- **READYMADE** — the part that already *is* the thing. Searches for
  semantic hits: a boat hull for a ship, a canyon baseplate for a cave.
  Ranks `M·0.70 + W·0.25 + G·0.05`.
- **KITBASH** — a part used against its nature. Deliberately **inverts** M:
  rewards parts whose category has nothing to do with the brief but whose
  form carries weight. `(1−M)·0.45 + W·0.35 + G·0.20`. This is the move that
  put a baby space-helmet head in Plato's cave.

Scoring uses the Micro-PLoT axes — Geometric Prior, Mythic Likelihood, Visual
Weight — computed from real part data. Mythic Likelihood is scored against the
**active zone's lexicon**, so the same brick scores differently depending on
which void it is filling.

Candidates are sampled from the ranked head rather than taken top-*n*, so two
rounds on the same void do not return the same bag.

### Cell scale

A 48-stud boat hull is a perfectly good readymade and nearly a metre of tray on
its own. Cell-scale retrieval is capped at 240 LDU (three cells); placed
uncapped, one such part swallows its neighbours and every later gesture
collides with it. That single bug produced most of the early deadlocks.

---

## 4. Vignette geometry is laid out from real dimensions

Eight generators — `row · ring · wall · stack · pyramid · pair · radial · path`
— place parts by their **own** widths and heights, not a fixed spacing. A stack
of 1×1 plates and a rank of wedges need very different pitches; guessing one
number for both gives you either overlap or confetti.

`wall` lays a running bond (alternate courses offset half a part) so masonry
interlocks. `stack` and `pyramid` advance by each part's true height so pieces
land on each other exactly. `ring` sizes its radius from the summed widths so
the circumference actually fits. Courses wrap at the cell boundary.

A vignette is staged in full and checked for collisions **before** any of it is
committed — admitting the handful of survivors from a mostly-rejected cluster
is what produced parts stranded hundreds of LDU from their cell.

---

## 5. The two doctrines

Same machinery, different temperament.

|  | OPERATOR | CORRESPONDENCE |
|---|---|---|
| creed | *fucked until proven otherwise* | *one telling gesture* |
| strategies | BRICKWORK ×2, KITBASH, READYMADE | READYMADE, KITBASH, READYMADE, BRICKWORK |
| geometries | wall, row, stack, pyramid, pair | ring, path, radial, pair, row |
| bag size | 9 | 5 |
| cells | anchors cardinally, works inward | scatters |
| on regression | reverts the gesture | keeps it, answers the next accusation |
| page | `lego-operator-trace.html` | `lego-correspondence.html` |

**Operator** reverts a *construction* gesture that measurably worsened the
build — but never a *repair*. Reverting a repair is self-defeating: dropping a
stray part costs mass before it buys cohesion, and guarding removals that way
made the doctrine undo its own fix and re-earn the same accusation every round
until it ran out of rounds. Its page foregrounds **blast radius** (how much
each gesture disturbed) and a world-line of fidelity per round.

**Correspondence** makes one gesture a round and shows its work as an
**accusation chain** — scout (where to look) → critic (what is wrong,
≤30 words) → builder (what was done) — with `BETTER / SAME / WORSE / NEW`
trajectory. Its page foregrounds **economy**: how much of the brief is carried
by how few parts.

Both **escalate**. When the same accusation survives two rounds they state a
commitment — and, unlike the first version, the commitment actually changes the
next gesture: fall back to a geometry that cannot fail to cohere (`stack` /
`pair`) and a small predictable bag. Stating a commitment and then building
exactly as before is how the first version deadlocked.

Both are seeded with a deterministic RNG, so a duel replays exactly.

---

## 6. Ship of Theseus, mechanised

The default brief makes replacement the *mechanic*, not the theme. Parts
claimed in Zone 1 are provisional by design: from round 3 each round swaps some
of them out, and the discards accumulate as a stack in Zone 4. The build
therefore carries a visible history of its own replacement while the hull in
Zone 2 is meant to stay recognisable.

`ingold` (lines / meshwork) and `cave` (carried over from
`platos-cave-builder.html`) ship alongside it. A brief is just a LEGOS graph
plus four zone lexicons — nothing else in the engine is brief-specific.

---

## 7. A representative run

Ship of Theseus, 20 rounds, no API, no human:

```
              OPERATOR   CORRESPONDENCE
fidelity           80%              84%
parts               23               15
compiles           YES              YES
collisions           0                0
floating             0                0
zones hit          4/4              4/4
strategies   BRICKWORK+READYMADE+CHURN   READYMADE+CHURN+BRICKWORK+KITBASH

leads: fidelity CORRESPONDENCE · economy CORRESPONDENCE
       variety  CORRESPONDENCE · soundness TIE
```

Both emitted MPDs were validated against the vendored library: every type-1
reference and every sub-file it pulls in resolves.

The terminal defect for both is `THIN` — the engine's own verdict that a
vignette-scale build does not yet have the mass to read as a ship. That is the
feedback engine working, not failing.

---

## 8. One renderer bug worth recording

Picking parts out of a 15k catalogue means hitting LDrawLoader's edge cases
regularly. The one that mattered:

`LDrawLoader` resolves a subfile's edge colour (code 24) to the code stored on
the *parent* material's `edgeMaterial`. For some colours that code is `-1` —
direct `0x2RRGGBB` colours literally define themselves as `CODE -1`, and the
loader's own defaults carry no code. The next subfile that asks for edge colour
24 under such a parent looks up material `"-1"`, finds nothing, and **throws
from inside an async callback**, stranding the viewer at `rendering…` forever.

`NabugoUI.repairEdgeColours()` makes the lookup total: dangling edge codes are
pointed back at 24 and a material is registered under `-1` as a backstop. It
runs once per viewer, on the loader, without touching the shared
`examples/js/loaders/LDrawLoader.js` that other pages depend on.

An earlier attempt screened 2,553 parts out of the catalogue on the theory that
METAL colours were to blame. They were not; that pass is removed.

Rendering is also queued per viewer — one render at a time, keeping only the
latest pending request. Firing both lanes concurrently on every round floods
the connection pool and locks the page up.

---

## 9. The bus, de-kludged

`NabugoBus` speaks the same `BroadcastChannel('wag-frank')` as the `-ator`
builders, `wag-frank.html` and ball-jar — one connection, both payload shapes
(`mpdLines` for wag-frank/GRACE, `mpd_content` for ball-jar/MENTO/gold), no
iframes. Any inbound message carrying an MPD is treated as a bag of bricks, so
the procedural builders remain brick sources with no changes on their side.

---

## Files

| file | what it is |
|---|---|
| `nabugo.js` | the engine — catalogue, geometry, audit, strategies, vignettes, doctrines, arena, bus |
| `nabugo-ui.js` | shared viewer + widgets, including the edge-colour repair |
| `nabugo.css` | shared chrome |
| `nabugo.html` | the arena — both doctrines, one brief, side by side |
| `lego-operator-trace.html` | OPERATOR alone; blast radius and world-line |
| `lego-correspondence.html` | CORRESPONDENCE alone; accusation chain and economy |
| `build-nabugo-index.js` | the index builder |
| `nabugo-parts.json` | 15,117 parts with recursively-resolved AABBs |

## Driving it from a console

```js
const a = new Nabugo.Arena('theseus');
a.run(20);
a.scoreboard();                 // both audits + who leads on what
a.a.toMPD();                    // OPERATOR's build
Nabugo.Bus.emit(a.b.scene, {}); // push CORRESPONDENCE to wag-frank
```
