# ODYSSEY FORAGE

**FORAGE BEFORE FABRICATION. ANCESTOR BEFORE ASSEMBLY.**

This directory is the bridge between the Odyssey Halfworld and the real LDraw library. It does not treat a photograph, Rebrickable page, PDF instruction booklet, or attractive MOC render as buildable geometry. A donor enters the acquisition corpus only when editable geometry can actually be obtained and inspected.

## The search order

```text
HALFWORLD SCENE
    ↓
WORLD DONOR
    ↓
SITE ASSEMBLY
    ↓
OBJECT ASSEMBLY
    ↓
SUBASSEMBLY
    ↓
PART
    ↓
CUSTOM FABRICATION LAST
```

The same rule applies to physical settings. A scene first gets a real-world spatial ancestor, then existing LEGO/LDraw precedents are searched for the terrain, structures, objects, and subassemblies needed to block it.

## Geometry states

- **GREEN** — a real `.mpd` or `.ldr` is downloadable from a legitimate source. Prefer OMR-compliant models. Before production use, resolve all external Type-1 references against the local LDraw library.
- **AMBER** — editable geometry exists, but it still needs conversion, unofficial-part resolution, inlining, or other validation. Typical examples are Studio `.io`, LXF, or MPDs with unresolved unofficial dependencies.
- **RED** — reference only: image, PDF, instructions, video, page, or MOC without obtainable editable geometry. RED material may teach a construction idea but is not a donor.

`donors.json` intentionally contains acquisition metadata and source links rather than copies of third-party model files. Preserve author/source/license information. Do not rehost protected MOC geometry without permission.

## Browser workflow

Serve the repository and open:

```text
/odyssey-forage/index.html
```

The page provides:

1. a searchable corpus of verified real-geometry donors;
2. morphology/world tags instead of theme-only categories;
3. source and MPD links;
4. an in-browser `.mpd/.ldr` inspector.

Drop a legitimately obtained MPD/LDR onto the inspector. Parsing happens locally in the browser; nothing is uploaded. The inspector reports `0 FILE` sections, Type-1 instances, unique `.dat` part references, embedded submodels, and external model references.

## Command-line ingest

For deeper validation use the dependency-free Node parser:

```bash
node odyssey-forage/ingest-mpd.mjs ~/Downloads/6285.mpd --id 6285-1
```

Validate its referenced files against a local LDraw installation:

```bash
node odyssey-forage/ingest-mpd.mjs ~/Downloads/6285.mpd \
  --id 6285-1 \
  --ldraw ~/ldraw \
  --out odyssey-forage/working/6285-1.json
```

The report contains:

- every MPD `0 FILE` submodel;
- embedded-submodel graph;
- direct `.dat` part references;
- external `.ldr/.mpd` references;
- reference counts and owners;
- cycle detection;
- local LDraw resolution results.

A donor is not fully validated merely because the source page calls it OMR compliant. The local resolution pass is the final production check.

## Do not flatten MPDs into parts too early

The valuable unit may already be a solved assembly:

```text
6285 Black Seas Barracuda.mpd
    ├── hull grammar
    ├── mast grammar
    ├── deck grammar
    ├── stern grammar
    └── rigging grammar
```

Halfworld retrieval should therefore search at several levels:

```text
WORLD → SITE → OBJECT → SUBASSEMBLY → PART
```

An extracted three-bay arcade can be more useful than the 400 atomic bricks that compose it. Once a useful assembly has been adapted and validated, it becomes an Odyssey **learned readymade** for future scenes.

## Worldbuilding taxonomy

Do not search only by nouns such as `palace`, `ship`, or `horse`. Search the differences that make a scene legible.

### Atmospheric state

- clarity
- humidity
- weather
- visibility
- palette
- light direction
- particulate / smoke / spray
- wetness / dryness

### Spatial skeleton

- **path** — where movement is invited or forced
- **edge** — what divides or contains
- **district** — a coherent zone with a different rule
- **node** — a concentration of action or choice
- **landmark** — what orients the frame/world

### Material realization

- ground
- boundary
- threshold
- structure
- labor
- storage
- food system
- maintenance
- wear / trace
- sound infrastructure
- mobility
- failure mode
- temporal state

A scene should usually be describable by 3–5 differences that survive aggressive simplification. Those differences become Taxonomizer queries.

Example:

```text
CYCLOPS CAVE
GIANT SCALE × DAIRY LABOR × BOULDER THRESHOLD × ANIMAL DENSITY × NO CIVIC ORDER

forage:
  rock shell
  giant movable boulder
  racks / shelves
  baskets / vessels
  sheep grammar
  dairy-storage grammar
```

## Suggested local working tree

These directories are ignored and should remain local unless a file's rights and provenance permit redistribution:

```text
odyssey-forage/
  downloads/      # acquired source MPDs/LDRs
  working/        # ingest reports
  derived/        # extracted / kitbashed assemblies
  renders/        # canonical-view renders
```

The intended production loop is:

```text
SOURCE
  ↓ download legitimately
DOWNLOADS
  ↓ ingest-mpd.mjs
VALIDATED MODEL GRAPH
  ↓ extract useful 0 FILE sections / connected assemblies
DERIVED READYMADES
  ↓ canonical render + tags
TAXONOMIZER
  ↓ match Halfworld scene requirement
ODYSSEY SCENE MPD
```

## Current seed corpus

The seed corpus concentrates on high-coverage families rather than one donor per card:

- large and small ships, rafts, islands, docks, forts, rocky coastal sites;
- horse/cart/chassis grammar;
- walls, gates, courtyards, stairs, workshops, rural buildings;
- monumental columns, stylobates, arcades, radial walls, and public-space grammar.

The goal is not to make the Odyssey look like Pirates, Castle, or Architecture sets. Theme identity is discarded. **Solved morphology is retained.**

## Next ingest targets

1. farm / cattle / sheep / pig donors;
2. horse and stable MPDs with isolated animal submodels;
3. tree / grove / rocky-river / cave world donors;
4. Ancient / monumental structural MPDs;
5. creature grammars for Scylla, serpent, eagle, boar, dogs;
6. furniture / loom / vessel / weapon readymades at the correct Halfworld scale.

For each addition, record the exact source, format, geometry status, known missing dependencies, extractable grammar, and Halfworld targets.
