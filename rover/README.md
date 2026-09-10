# ROVER

Camera-first Odyssey → LDraw integration.

## Operator invariant

`REFERENCE → CAMERA → FRAME → REQUIRE → FORAGE → RESOLVE → ASSEMBLE → STAGE → BIND → PERFORM → WATCH → REPAIR → COMMIT`

The camera determines the construction frontier. References are evidence. LDraw is the target construction substrate.

## Current first slice

- `contracts.mjs` — typed contracts for references, cameras, frames, requirements, and forage targets.
- `odyssey-camera-first.js` — executable operator-order guard, requirement derivation, forage planning, candidate scoring, assembly planning, watch/repair/commit loop.
- `scenes/OD-B01-S03.rover.json` — first Odyssey seed, **The Stranger at the Threshold**, derived from the Odyssey scene module and Book 1 jobs.
- `ROVER-CAMERA-FIRST-ODYSSEY.md` — architectural contract and operator semantics.

## Rule

Never begin with a complete LEGO world.

1. Read references.
2. Establish the camera.
3. Establish the frame.
4. Derive only what the frame and performance require.
5. Forage the LDraw library for those requirements.
6. Assemble and stage for the camera.
7. Bind Odyssey identities.
8. Perform.
9. Watch from the camera.
10. Repair the smallest failing layer.
11. Commit only a passing take.
