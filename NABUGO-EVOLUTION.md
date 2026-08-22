# The evolutionary ecology of construction

> The judges supply selective pressure. **The compiler defines viability.**

A visually convincing candidate does not survive if its bricks float, collide,
reference parts that do not exist, or fail to connect. No judge can overrule
that, and no compiler can declare a temple narratively convincing.

This is the layer that resurrects Atlantis — a place nobody has seen, so no
readymade *is* it, and the only way to reach it is to let several ecologies
exchange material until something surfaces that the description did not ask for.

| Evolutionary term | Builder equivalent | Where it lives |
|---|---|---|
| Environment | brief, void ledger, standing scene | `NabugoBrief`, `NabugoVoidLedger` |
| Gene pool | 15,117 indexed parts | `nabugo-parts.json` |
| Ecology | guilds cutting sideways across taxonomy | `NabugoEcology` |
| Genome | relational assembly plan | `NabugoGenome` |
| Phenotype | compiled placements | `NabugoCompiler` |
| Mutation | substitute, repeat, rotate, damage, migrate | `NabugoOperators` |
| Recombination | join fragments from two lineages | `NabugoOperators.recombine` |
| Viability | hard gates | `NabugoViability` |
| Selection pressure | six judges, Pareto frontier | `NabugoJudges` |
| Niche | one void | `brief.voids[]` |
| Fossil record | six archives | `NabugoArchive` |
| Beak | one temperament over one gene pool | `NabugoFinch` |

---

## 1. The compiler chooses coordinates. Nothing else does.

A genome states *relationships*:

```js
{ id: 'a_sup0', role: 'vertical_support', part: '3062b',
  attach: { target: 'a_base', port: 'top' }, repeat: 2, symmetry: 'bilateral' }
```

No coordinates, no matrices, no part paths written in prose. The compiler
resolves the rest against a **port registry extracted from the real library**.

### The port registry

`build-nabugo-ports.js` walks every part with the same recursive matrix pass
used for its bounding box. Every LDraw stud primitive occupies y ∈ [−4, 0] and
protrudes along local −Y; tube variants are the female side. Each reference
yields a transformed origin and up-axis — a port.

**7,312 parts · 40,280 ports.** Verified: brick 2×4 gives exactly its 8-stud
lattice at 20 LDU pitch (x ∈ ±10, ±30; z ∈ ±10) plus 3 underside tubes.

This replaces the hand-written `studLibrary` in `assembly-line.html`, a table of
six parts that disagrees with the geometry where it is checkable — it gives Tile
1×2 Grille two studs (a tile has none) and Panel 1×4 two studs at a z-offset (it
has four along x). `ldraw-part-skeletons.json` already had the right schema for
all 23,511 parts and **every entry was empty**; `build-skeleton-backfill.js`
fills it from the extraction, in the `bounds / ports / collision_hulls` shape,
so weaver and nabugo read the same numbers instead of keeping two answers.

### Seating

To seat B on A: `B.pos.y = topFace(A) − B.b[4]`, where `topFace` is A's AABB
min Y plus the 4 LDU its studs protrude. XZ snaps to A's **actual** stud lattice.
Seats are consumed as they are used, and when a parent runs out, the child
climbs onto the most recently placed sibling — without that, every assembly
asked the base for the same central seat and seven of eight collided.

A part with no upward studs (a tile, a dish, a smooth slope) still offers a
**rest surface**: a synthesised lattice over its top face, marked `join: 'rest'`
rather than `'stud'`. Refusing those meant every genome whose foundation was a
tile compiled down to a single brick.

---

## 2. Ecologies cut sideways

An ecology is not another category. If "Atlantis" is a folder of hand-picked
blue bricks we have rebuilt the taxonomy under a thematic name.

Eight ecologies, each declaring **guilds** — anchors, supports, membranes,
signals, connectors, inhabitants — filled by recruiting across kingdoms, plus
the neighbours it can borrow from:

```
eco_aquatic_membrane      eco_monumental_architecture   eco_animal_morphology
eco_technic_motion        eco_curved_enclosure          eco_luminous_machine
eco_ruin                  eco_ritual
```

`NabugoEcology.keystones()` finds the parts that score in several at once —
the ones that let ecologies exchange material, and usually where a surprising
construction comes from.

### Bags are populations, not lists

A bag has internal complementarity plus **migrants** (from a neighbouring
ecology) and **wild cards** (unconditioned), so the population cannot close
around its own clichés. Sampling is `pow(rng, 1.7)` over a ranked head — biased
toward good members without going uniform, which would just return whatever
dominates the archive.

---

## 3. Hard gates, then soft pressure

```js
viable = hasParts && validParts && noCollision && supported && coherent
```

Nothing reaches a judge until every one passes. Then six judges, each returning
a score **and its evidence**:

| judge | asks |
|---|---|
| **void** | What absence does this address? |
| **composition** | Does it establish weight, rhythm, negative space? |
| **narrative** | What does it make legible without explanation? |
| **ecological** | Do the participating parts transform one another's roles? |
| **novelty** | Does this open a lineage not already present? |
| **habitation** | Can a figure enter, stand, and reach? |

**No weighted sum.** A single score is a supreme judge in disguise, and
candidates learn its rhetorical preferences until everything looks like
"sophisticated composition". Survivors are kept on a **Pareto frontier**: a
candidate lives if nothing beats it on every axis at once. Each is labelled with
the axis it is champion of, so you can see *why* it survived.

---

## 4. Losers are kept

```
viable      compiles and connects
selected    chosen for the present world
novel       unlike existing constructions
deceptive   strong ecological claim, poor current void score
repairable  one localized physical failure
fossil      an ancestor retained in construction history
```

A candidate that failed because one hinge is oriented wrongly is not erased —
`breedingStock()` draws from selected, novel *and* repairable, so its genome can
mutate and return.

---

## 5. The void ledger, not a percentage

A single `Narrative_Fidelity: 83%` is invented rather than measured. Instead a
ledger of `resolved / partial / unresolved`, each with the evidence that moved
it, and an **emergent** column for the upstream reversal:

> *A part from Luminous Machine survived as structure here; the void reads less
> like "Evidence the city once did something, not just stood" and more like
> something that signals across water.*

That is the material talking back. Description generates construction,
construction resists description, resistance revises description. A temple that
compiles as a machine is a result, not an error.

---

## 6. Three beaks, one gene pool

Darwin's finches diverged by what they could get at, not by what was available.
Same catalogue, same compiler, same judges — different sampling pressure and
different survival rule.

| | Ground | Cactus | Warbler |
|---|---|---|---|
| beak | heavy, crushing | long, probing | fine, tool-using |
| composition | anchors 2, supports 4 | membranes 3, signals 3 | spread thin, everything |
| migrant / wild | 1 / 1 | 2 / 1 | **3 / 3** |
| population | 5 + 2 mutations | 6 + 2 | **7 + 3** |
| operators | repeat, substitute, rotate | migrate, substitute, rotate | migrate, **damage**, substitute |
| selects for | composition, no weak axis | narrative + habitation | **novelty + ecological** |
| page | `finch-ground.html` | `finch-cactus.html` | `finch-warbler.html` |

Ground will not select a candidate that any judge scores near zero. Warbler
takes the strangest thing on the frontier rather than the strongest.

### A representative Atlantis run — no API, no human

```
                 GROUND   CACTUS  WARBLER
parts                50       66       56
collisions            0        0        0
floating              0        0        0
compiles            YES      YES      YES
novel archived       52       59       71

per-axis champions
  void GROUND · composition GROUND · narrative WARBLER
  ecological CACTUS · novelty CACTUS · habitation CACTUS
```

All three emitted MPDs validate against the vendored library: every type-1
reference and every sub-file it pulls in resolves.

---

## 7. Two engine bugs this uncovered

**LDraw AABBs include the stud protrusion**, so *any* legal stack registered as
interpenetration. `Geom.penetration` now allows 4 LDU of vertical overlap while
keeping horizontal tolerance at 1.5. This was suppressing stacking in the
original doctrines too — it is why the first Ship of Theseus builds came out as
scattered single parts that never sat on one another. Fixing it took a finch
from 8 parts to 60.

**Committing a build piecemeal orphans its stacks.** Dropping only the parts
that clash with the standing world removes whatever the rest was resting on, so
a candidate verified as supported arrives unsupported. Commits are atomic now:
if a build cannot land intact, the next candidate on the frontier gets the cell.

---

## Files

| file | what it is |
|---|---|
| `nabugo-evo.js` | the whole evolutionary layer |
| `build-nabugo-ports.js` | port extractor |
| `nabugo-ports.json` | 7,312 parts · 40,280 ports |
| `build-skeleton-backfill.js` | fills `ldraw-part-skeletons.json` from the extraction |
| `finch-ground.html` · `finch-cactus.html` · `finch-warbler.html` | one beak each |
| `finch-page.js` · `finch-shared.css` | shared bootstrap and generation view |
| `nabugo.html` | arena — **⇄ Aviary** switches from the duel to the three finches |

## Driving it from a console

```js
const av = new NabugoEvo.Aviary('atlantis');
av.run(16);
av.scoreboard();                       // three audits, archives, void ledgers
av.get('warbler').ledger.emergent;     // where the material contradicted the brief
av.get('cactus').archive.counts();
av.get('ground').toMPD();
```
