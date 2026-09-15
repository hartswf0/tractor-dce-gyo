# MOVIEATOR FORAGE LANE

Purpose: use the existing recognizable movie-character corpus as a reusable candidate pool for Odyssey casting and for cross-character performance tests.

This lane does not change the camera-first order. Character identity is resolved only after REFERENCE -> CAMERA -> FRAME -> REQUIRE establish what must read in the shot.

## Two experiment lanes

### Odyssey lane
Tests whether scene intent survives translation into LEGO:

WHY -> DIRECTION -> BODY -> FACE -> SPEECH -> CARRIAGE -> LEGO RETARGET

Primary questions:
- can a character remain recognizable while the body is mechanically constrained?
- can dramatic direction survive a change of LEGO identity basis?
- can face/speech channels remain independent of body pose?

### Stylization lane
Existing `ASSEMBLE SIMPSONS` remains a useful stress test for extreme non-human head/face geometry, but it should not be the canonical facial-animation benchmark.

Use it to test:
- custom head topology
- eye-only / mouth-atlas alternatives
- silhouette preservation
- identity under aggressive adaptation

## Candidate source hierarchy

For a frame-derived character target:

1. ROVER_CACHE — previously resolved compatible actor
2. MOVIEATOR — recognizable existing character/minifigure assembly
3. LDRAW_MODEL — generic or franchise model/submodel
4. LDRAW_PART — component-level assembly
5. CUSTOM — last resort

A Movieator candidate is useful as a *basis*, not an identity assertion. ROVER may reuse body, hair, headgear, costume topology, hand-held prop relationships, or rig structure while replacing identity-specific details.

## Rule

DO NOT ask: "Which movie character looks like Athena?"

Ask:
- Which candidate provides the closest camera-visible silhouette?
- Which candidate already supports the required hand/prop relation?
- Which candidate has the right head/hair/helmet topology?
- Which candidate minimizes edits while preserving Odyssey identity?

The selected result is then ADAPTed and rebound to the Odyssey source asset.
