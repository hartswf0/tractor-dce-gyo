# ATORScript — the script is the genome

> A giant castle should not be authored as forty thousand MPD lines. It should
> be authored as a compact developmental program that compiles into them.

```
the script          is the genome
the assembly graph  is the developing organism
the MPD             is the compiled phenotype
```

Which changes the job from *write coordinates* to *write construction
procedures*. Change `columns=5` to `columns=7` and the ring, the spacing and
the entablature regenerate; nobody rewrites a thousand placements, and a
mutation that flips one number coherently changes hundreds of them.

---

## The language

Small, typed, and not a general-purpose one. Every statement is one of a fixed
set of construction verbs resolved against the module library, so a model can
write it without being able to reach anything else. A bad line is a parse error
with a line number, not a silent no-op.

```
WORLD "Cathedral of the Drowned"
SEED 4812
USE ECOLOGY eco_monumental_architecture
USE ECOLOGY eco_aquatic_membrane
INVITE ECOLOGY eco_animal_morphology AT 0.25
SITE span=2400
PIN shaft 2 x 2              -- steer a role without naming a part
COLOR coral 2

PLACE  cathedral AT 0,0 WITH bays=5 span=130 spire=16
RING   pavilion  AROUND 0,0 RADIUS 620 COUNT 5 WITH columns=6
GRID   datatemple COLS 2 ROWS 2 PITCH 660 WITH racks=5
REPEAT ruin   COUNT 4 SPREAD 820
SCATTER reef  COUNT 18 SPREAD 1000
AGE 0.10                     -- ruination as an operator

ASSERT compiles
ASSERT no_collisions
ASSERT supported
ASSERT parts > 900
ASSERT distinct > 30
ASSERT modules > 24
PROBE silhouette
PROBE variety
```

| group | verbs |
|---|---|
| declare | `WORLD` `SEED` `SITE` `PIN` `COLOR` |
| ecology | `USE ECOLOGY` `INVITE … AT` `EXCLUDE` |
| place | `PLACE` `RING` `GRID` `REPEAT` `SCATTER` |
| history | `AGE` |
| check | `ASSERT` `PROBE` |

`ASSERT` understands `compiles`, `no_collisions`, `supported`, `connected`, and
comparisons on `parts`, `distinct`, `height`, `modules`. `PROBE` reports rather
than judges: `silhouette`, `density`, `variety`, `ground`, `habitation`.

**`PIN` is the point of the role system.** The script asks for *a 2×2 shaft*,
not for part `3062b`. Which part answers depends on which ecologies are active,
so the same programme builds a marble colonnade or a coral one.

---

## Modules the script can call

Compound assemblies from `nabugo-modules.js`. Each knows its own footprint and
height, so the site can put a pediment on a colonnade without measuring twice.

`plinth` `floor` `column` `colonnade` `pediment` `stair` `wall` `rotunda`
`vault` `buttress` `spire` `medusa` `datastack` `reef` `rubblefield` `wreck`
`shrine`

and the compositions: `temple` `ruin` `gardens` `harbour` `pavilion`
`cathedral` `datatemple` `bloom`.

A `temple` is plinth + floor + two colonnades + pediment + stair — about 250
pieces from one line of script.

---

## Mutation targets the genes

```
mut1  columns: 5 → 7         →   440 pieces
mut2  reseeded to 59215      →   447 pieces
mut3  module: reef → gardens →  1650 pieces
```

`NabugoScript.mutate` changes a number, reseeds, or swaps a module for a
sibling. `recombine` crosses two programmes by taking each one's placement
statements in turn. Both operate on twenty lines of text and regenerate
everything below.

---

## Two loops that drive it

### Cathedral Forager — searching the material

The programme states what it wants; the forager goes into the catalogue to find
material that satisfies it. It reads the loudest failing `ASSERT`, forms **one**
hypothesis about the gene pool, and tries exactly that. It never edits geometry.

```
R 1 score  92%  5/6   580p  25m KEEP  parts > 900   recruited eco_curved_enclosure
      ↳ the pool was too narrow to fill parts > 900
R 6 score  94%  5/6   737p  28m KEEP  parts > 900   COUNT 9 → 14
R10 score 100%  6/6  1084p  34m       —             the programme satisfies itself
```

Final: **1,084 pieces, 34 modules, 41 distinct, 0 collisions, 0 floating.**

### Medusa Scriptorium — searching the programme

A population of programmes. Mutate, cross, compile every variant, keep a
**Pareto frontier** over five traits — lawful, mass, reach, variety, economy —
never summed. What survives is a *way of building*.

```
R1 front  2 | champ L1  5/5 1529p 19m 904h  L1←L0  height: 12 → 15
R2 front  1 | champ L7  5/5 1650p 20m 832h  L7←L3  module: reef → gardens
R6 front 10 | champ L7  5/5 1650p 20m 832h
```

Champion L7: **1,650 pieces, 832 LDU tall, 5/5 asserts, 0 collisions, 0
floating.** Lineage traceable to the founder.

---

## What this does not do yet

Honest gaps, in the order they matter:

- **Macro-ports.** Modules attach by footprint and top face, not by named
  `wall_join` ports. A tower cannot yet be told to attach to a curtain wall's
  east end; it is placed beside it.
- **The tiler.** `FILL region WITH ecology BOND staggered` is not implemented.
  `wall` and `plinth` lay a running bond, but there is no constrained tiler
  that works around door and window voids.
- **`CUT`.** No boolean subtraction, so no gatehouse cut into a curtain wall.
- **Modular MPD.** Output is flat — every placement expanded into the master
  scene. `COMPILE MODULAR` with internal `0 FILE` submodels would make a
  1,600-piece file legible and let modules be reused by reference.
- **Incremental rebuild.** Changing one tower recompiles the whole programme.
  Module identity, content hashing and cached fragments are the fix.
- **`POPULATE`** parses but defers to the expedition's purser.

At site scale the architecture still reads as platforms with colonnades rather
than as the reference builds. Recipe depth — richer wall sections, roofs,
interiors — is the work that closes that gap, and it is recipe work, not
engine work.

---

## Files

| file | what |
|---|---|
| `nabugo-atorscript.js` | parser, compiler, `ASSERT`/`PROBE`, mutation, recombination |
| `nabugo-modules.js` | the module library and the site planner |
| `nabugo-loops.js` | Forager and Scriptorium |
| `cathedral-forager.html` | underwater cathedral ruin |
| `medusa-scriptorium.html` | jellyfish data temples |
| `nabugo-gallery.html` | every generation, on a phone |

## Console

```js
const prog = NabugoScript.parse(document.getElementById('script').value);
const r = NabugoScript.compile(prog, {});
r.audit.parts;                      // pieces
r.verdicts;                         // the script's own claims, checked
r.graph;                            // what was raised, where, out of how many
NabugoScript.mutate(src, Math.random).note;
```
