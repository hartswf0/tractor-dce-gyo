# LDRAW-ROVER — CAMERA-FIRST ODYSSEY

ROVER builds only the world required by the camera.

## Invariant operator order

```text
REFERENCE
→ CAMERA
→ FRAME
→ REQUIRE
→ FORAGE
→ RESOLVE
→ ASSEMBLE
→ STAGE
→ BIND
→ PERFORM
→ WATCH
→ REPAIR
→ COMMIT
```

This order is normative. Later operators may not silently bypass earlier ones.

## Core rule

The Odyssey source world is evidence, not geometry.

```text
Odyssey references + scene contracts + performance intent
                    ↓
                 ROVER
                    ↓
       camera-required relations
                    ↓
          LDraw assemblies
```

Do not build a complete location first and then search for a camera.

```text
WRONG: WORLD → CAMERA
RIGHT: REFERENCE → CAMERA → FRAME → REQUIRED WORLD
```

## Operators

### REFERENCE
Collect the evidence relevant to a shot.

Inputs may include:
- Odyssey scene module
- jobs/manifest records
- reference images
- procedural Halfworld render
- dramatic direction / WHY
- voice timing and authored line

Output: `ReferencePacket`.

### CAMERA
Declare the observing camera before construction.

Output: `CameraContract` with position/orientation/lens intent or a looser framing description.

### FRAME
Resolve what must be visible and what may remain absent.

Output: `FrameContract`:
- subjects
- foreground / middle / background relations
- silhouette requirements
- occlusion requirements
- attention hierarchy
- required entrances/exits

### REQUIRE
Infer the minimum world needed to make the frame and performance possible.

A requirement may be:
- visible
- touched
- traversed
- supports performance
- blocks light
- establishes scale
- establishes place
- required by continuity

Output: `Requirement[]`.

### FORAGE
Search the LDraw corpus and reusable submodels only for unresolved requirements.

Priority:

```text
REUSE → ADAPT → ASSEMBLE → CUSTOM
```

Output: `CandidateSet[]`.

### RESOLVE
Choose candidates by perceptual and operational fit, not lexical identity.

Evaluate:
- semantic fit
- silhouette fit
- affordance fit
- camera fit
- rig fit
- continuity fit
- reuse value
- edit cost

Output: `Resolution[]`.

### ASSEMBLE
Construct only the assemblies needed by the frame.

Every assembly should expose useful anchors/ports where applicable:
- root
- hand.L / hand.R
- head
- seat
- threshold
- entry
- surface
- path
- camera anchor

Output: `LDrawAssembly[]`.

### STAGE
Place resolved assemblies relative to the camera and one another.

The stage is shot-local. Global architectural consistency is optional unless continuity requires it.

### BIND
Bind Odyssey identities to resolved LDraw assemblies and anchors.

Example:

```text
BIND ART.B01.ATHENA_MENTES
TO ldraw://cast/athena_mentes_v1
```

### PERFORM
Drive the resolved LEGO body using the Odyssey dramatic/performance layer.

Suggested internal order:

```text
WHY
→ DIRECTION
→ HIPS
→ HEAD
→ ARMS
→ ATTENTION
→ SPEECH
→ CARRIAGE
→ FACE
```

### WATCH
Render or inspect from the declared camera.

Evaluation happens from the camera, not from omniscient scene view.

### REPAIR
Modify the smallest responsible layer.

Examples:
- framing wrong → camera/stage
- missing silhouette → assembly/stage
- gesture reads wrong → performance channel
- clutter distracts → omit/deemphasize
- unseen geometry contributes nothing → remove

### COMMIT
Commit the take only after the camera-view assertions pass.

Record:
- source references used
- camera contract
- requirements
- resolutions
- assembly bindings
- performance operations
- repairs
- remaining unresolved items

## Camera frontier

The initial construction frontier for a shot is:

```text
FRONTIER =
    visible_to_camera
  ∪ touched_by_actor
  ∪ traversed_by_actor
  ∪ required_for_occlusion_or_light
  ∪ required_for_continuity
```

Everything else is deferred.

## ROVER sentence

Human form:

```text
Use this reference.
Put the camera here.
Frame Odysseus against the doorway.
Build only what this shot needs.
Find a doorway, floor, table edge, and the two figures.
Keep the recognition readable.
```

Machine form:

```text
REFERENCE refs...
CAMERA shot.camera
FRAME Odysseus AGAINST doorway
REQUIRE FROM frame
FORAGE unresolved FROM ldraw
RESOLVE BY perceptual_fit + affordance_fit
ASSEMBLE frontier
STAGE FOR camera
BIND identities
PERFORM beat
WATCH camera
REPAIR failures
COMMIT take
```

## Non-negotiable

The camera is not a presentation layer added after world construction.

**The camera determines which world is worth constructing.**
