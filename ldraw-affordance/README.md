# LDraw Affordance Library

**Second library, not replacement library.**

The existing `ldraw/` tree remains authoritative for geometry. This sibling library describes **use**: ports, transformations, compatibility, releasers, and the physical operations that a part can silence in an assembly.

> Do not standardize the object. Standardize how objects meet.

> Do not build from a part script. Hear what the substrate still needs.

## Two libraries

```text
ldraw/
  parts/4070.dat
  p/stud.dat
       ↓
  authoritative geometry

ldraw-affordance/
  ports
  operators
  compatibility
  releasers
  connector audits
       ↓
  what the geometry can do
```

A part's semantic API can propose a connection. It cannot certify one.

## CLICK is a reserved state

**Compatible is not clicked. Aligned is not clicked. A coincident semantic port is not clicked.**

For a LEGO stud joint the builder may emit `CLICK` only when all of the following are true:

1. a male semantic port is backed by an actual male LDraw stud primitive (`stud.dat`, `stud2.dat`, or `stud2a.dat`, including recursive subparts/stud groups);
2. the female anti-stud receiver datum is calibrated `exact`;
3. the transformed real stud base and receiver datum coincide within tolerance;
4. their physical axes oppose correctly.

`src/ldraw-connectors.js` recursively reads the real `.dat` tree and derives male stud coordinates from primitive transforms. `bench/beaver.js` uses that geometry oracle before consuming a port, extinguishing a releaser, playing the click sound, or firing haptic feedback.

If verification fails:

```text
NO CLICK
→ do not consume either port
→ do not extinguish the releaser
→ keep hearing the physical demand
```

Pin and axle protocols can be seated when both endpoints are calibrated, but they do **not** borrow the LEGO stud `CLICK` state.

## Beaver / releaser loop

The current bench is deliberately not a `BUILD ALL PARTS` demonstration.

It begins with an existing substrate. The world emits local demands such as:

```text
SIDE-FACING STUD NEEDED HERE
A STUD IS NEEDED BETWEEN THE EXISTING STUDS
PIN SOCKET NEEDED AT THIS SERVICE DATUM
```

The builder repeatedly performs:

```text
READ SUBSTRATE
→ strongest unresolved releaser
→ search usable parts/operators
→ propose a physical handshake
→ verify connector geometry
→ place only if verified
→ reread substrate
→ stop when quiet
```

`tests/releaser-field.json` contains the current benchmark field. Removing the SNOT family should leave the side-facing-stud releaser loud. The builder must stop rather than route around a missing capability with decorative geometry.

## What is here

- `library/core.json` — operational part vocabulary. Geometry remains in normal LDraw `.dat` files.
- `library/compatibility.json` — protocol compatibility and seating rules.
- `library/seam-overrides.json` — calibrated connector datums with provenance.
- `src/engine.js` — transforms, compatibility, snapping, MPD output, task scoring and ablation.
- `src/ldraw-connectors.js` — recursive geometry oracle for real LDraw stud primitives.
- `tests/task-suite.json` — capability-ablation corpus.
- `tests/releaser-field.json` — substrate-driven/beaver benchmark.
- `bench/index.html` + `bench/beaver.js` — phone-first real-LDraw builder.

## Part API

A part is not only a mesh or noun.

```json
{
  "id": "4070",
  "file": "4070.dat",
  "name": "Brick 1 x 1 with Headlight",
  "ports": [
    {"id":"top","type":"stud","gender":"male","p":[0,0,0],"n":[0,-1,0]},
    {"id":"front","type":"stud","gender":"male","p":[0,10,-6],"n":[0,0,-1]}
  ],
  "operators": ["TURN_PLANE_90", "EXPOSE_SIDE_STUD", "OFFSET_PLATE"]
}
```

But the semantic claim `front = male stud` is checked against the actual `4070.dat` reference to `stud2a.dat` before it can participate in a click.

### Confidence

- `exact` — calibrated from/against real LDraw geometry and eligible for physical verification.
- `semantic` — useful description but **not sufficient for CLICK**.
- `approx` — exploratory only; never a verified connector.

The library should become stricter over time, not more confident by declaration.

## Run

From the repository root:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/ldraw-affordance/bench/
```

or Pages:

```text
https://hartswf0.github.io/tractor-dce-gyo/ldraw-affordance/bench/
```

Press **RUN BEAVER** or **HEAR + ACT**. The user gesture arms WebAudio. An audible/haptic stud click is produced only by a geometry-certified stud↔anti-stud handshake.

Press **REMOVE SNOT FAMILY** and run again. The first side-facing-stud cue should remain `STILL HEAR / BLOCKED` and no stud click should occur.

## Variety / Basic LDraw

The vocabulary is evaluated by what classes of physical demands it can silence, not by how many pieces it contains.

```text
loss(part) = capability_score(full vocabulary)
           - capability_score(vocabulary without part)
```

This is why adapters/operators can matter more than another long brick. A useful primitive does not merely add geometry. It makes a recurring physical problem go quiet.

## Attention

The seam is where attention **leaks** when a reusable operation fails to close itself.

A good interface is self-locating, self-constraining, visible, reversible, and repeatable. With repetition, the situated attention required by a solved seam should approach zero.

But amortization happens only **after physical verification**. A bad handshake does not become cheap merely because we repeat it.

## Rule for expansion

Every new entry must answer:

1. Which real `.dat` geometry does it refer to?
2. What connector primitives or calibrated receiver datums support each port claim?
3. What physical demand/releaser can the part silence?
4. What operation does it add to the vocabulary?
5. Can a proposed connection be independently verified rather than inferred from semantic coincidence?
6. What capability fails when the part/operator is removed?

If the library cannot answer #2, the port may be useful for search, but **it cannot click**.
