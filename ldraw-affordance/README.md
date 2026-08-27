# LDraw Affordance Library

**Second library, not replacement library.**

The existing `ldraw/` tree remains authoritative for geometry. This sibling library describes **use**: interfaces, ports, transformations, compatibility, attention at seams, and the capabilities that disappear when a part is removed.

> Do not standardize the object. Standardize how objects meet.

## What is here

- `library/core.json` — first 18-part operational basis. Each part points to its normal LDraw `.dat` file and adds ports + operators.
- `library/compatibility.json` — connection protocol rules and seam-tax defaults.
- `schema/part-api.schema.json` — machine-readable API contract.
- `src/engine.js` — compatibility, snapping, MPD export, capability scoring, and ablation.
- `tests/task-suite.json` — tasks used to ask whether the vocabulary can stack, offset, turn planes, bridge System/Technic, translate pin/axle, etc.
- `tests/run-tests.mjs` — zero-dependency command-line bench.
- `bench/index.html` — phone-first instrument for building through exposed ports and testing variety absorption.
- `bench/bench-01.mpd` — generated proof-of-loop model.

## Part API

A part is not only a mesh or noun.

```json
{
  "id": "4070",
  "file": "4070.dat",
  "name": "Brick 1 x 1 with Headlight",
  "ports": [
    {"id":"top","type":"stud","gender":"male","p":[0,0,0],"n":[0,-1,0]},
    {"id":"front","type":"stud","gender":"male","p":[0,10,-10],"n":[0,0,-1]}
  ],
  "operators": ["TURN_PLANE_90", "EXPOSE_SIDE_STUD", "OFFSET_PLATE"]
}
```

The `.dat` says what `4070` **is geometrically**. This entry says what it **does in assemblies**.

### Confidence

Port geometry is explicitly marked:

- `exact` — anchored from verified LDraw geometry.
- `semantic` — connection is correct but the port abstracts a multi-stud or internal receiving region.
- `approx` — usable for exploration but needs geometric calibration before precision production.

This prevents the semantic library from pretending that inferred connector coordinates are ground truth.

## Run the bench

From the repository root:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/ldraw-affordance/bench/
```

Or, when GitHub Pages serves the repository:

```text
https://hartswf0.github.io/tractor-dce-gyo/ldraw-affordance/bench/
```

The bench has three surfaces:

1. **BUILD** — choose an exposed port, then choose a compatible part. The engine snaps compatible port frames, accumulates seam tax, and exports an MPD.
2. **TEST** — run the current capability suite and rank parts by **ablation loss**: what becomes impossible when this part is removed?
3. **LIBRARY** — inspect the vocabulary by operator, connector, and provisional variety score rather than by conventional LEGO category.

`RUN BENCH` constructs a small mixed assembly that exercises ordinary stud stacking, the System→Technic bridge, a side-stud SNOT turn, a sideways plate, and a Technic pin.

## Command-line test

```bash
cd ldraw-affordance
node tests/run-tests.mjs
```

Current assertions include:

- every task in the initial suite is covered by the vocabulary;
- stud→receiver snapping works;
- a plate snapped to the top of a brick resolves to `Y=-8 LDU`;
- MPD export contains the expected LDraw parts;
- ablation ranks interface/adapter primitives by capability loss.

## Attention model

For a direct seam:

```text
seam tax = protocol base tax
         + confidence tax(part A port)
         + confidence tax(part B port)
```

The schema is intentionally ready to grow into the larger seam model:

```text
IDENTIFY + GEOMETRY + DATUM + ORIENTATION + TOLERANCE
+ ACCESS + TOOLING + FASTENER + SEQUENCE + HOLDING
+ VERIFICATION + REVERSIBILITY + DAMAGE + NOVELTY
```

The important unit is the **edge between parts**, not only the nodes.

## Variety / Basic LDraw experiment

`tests/task-suite.json` is the first executable definition of “absorbs variety.” A vocabulary gets credit for retaining operational capabilities, not for containing many shapes.

Ablation is computed as:

```text
loss(part) = capability_score(full vocabulary)
           - capability_score(vocabulary without part)
```

This makes a 2×4 brick cheap to remove when smaller Cartesian primitives can substitute for it, while a jumper, SNOT element, System/Technic gateway, or pin↔axle translator can score highly because removing it destroys a whole operation.

The next scale step is not to hand-pick 64 parts. It is to expand the task corpus from real OMR assemblies and ask the search to discover the smallest vocabulary preserving the largest set of connection/topology operations.

## Relation to Tractor / BRICK

The implementation follows the repo's existing BRICK pattern:

```text
source geometry → semantic projection → focused object/port
→ legal neighbors → actuation → preview → trace/test
```

Here the shared coordinate system is LDraw's LDU transform space, and the semantic atoms are physical ports/operators rather than code blocks.

## Rule for expansion

Every new entry must answer:

1. Which existing `.dat` geometry does it refer to?
2. What ports does it expose?
3. Which physical protocol does each port speak?
4. Which transformations/operators become possible because this part exists?
5. Is each port coordinate exact, semantic, or approximate?
6. What task fails when this part is ablated?

If question 6 has no answer, the part is probably vocabulary bulk rather than a primitive.
