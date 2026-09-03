ZETTEL

ID:
Z-HOGWARTS-HIERARCHICAL-SLAB-001

TITLE:
“Slab!” Must Eventually Name a Tower

SOURCE:
LDraw.org Standards Board — LDraw File Format Specification.
Sharma et al. — Assembly Theory — 2023.
Peter Kulits and Cordelia Schmid — BrickNet — 2026. 27

PASSAGE:
[PARAPHRASE] LDraw permits recursive subfile references; Assembly Theory recursively reuses previously assembled objects; BrickNet generates builds relationally through graphs.

RESEARCH OBJECT:
A 6,020-piece language-game cannot remain at individual-brick granularity.

It must recursively promote completed constructions into higher-level addressable objects:

BRICK
→ WINDOW
→ BUTTRESS
→ WALL BAY
→ TOWER
→ WING
→ CASTLE.

The crucial prompt operation is therefore not merely:

PLACE.

It is:

NAME THIS COMPLETED RELATION SO WE CAN OPERATE ON IT AS ONE THING.

LOCAL MOVE:
Make abstraction itself an assembly operation.

SOURCE TERMS:
“sub-file”
“recursive”
“reuse”
“graph”
“assembly pool”

WHAT BECAME STRANGE:
The castle becomes tractable when yesterday's sentence can become today's noun.

A 40-step successful sequence is compressed into:

“north-window module.”

That noun then participates in larger operations.

QUESTION:
Can an LLM autonomously decide when a completed sequence deserves promotion into a reusable symbolic subassembly?

DEEPER QUESTION:
What criterion distinguishes a useful abstraction from a premature grouping that hides necessary detail?

MECHANISM:
repeated successful sequence
→ detect structural closure
→ assign submodel identity
→ validate interfaces
→ expose as macro-object
→ use macro-object in higher-level planning.

FORMAL SHIFT:
<FLAT ACTION SEQUENCE>
→ <PROMOTED SUBASSEMBLY>
→ [NAME / REUSE]
→ <HIERARCHICAL LANGUAGE GAME>

SOURCE FORMALISM:
LDraw type-1 references permit a file/submodel to be reused under transformations. 28

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Promote subgraph H to macro M if:

InterfaceBoundary(H) small
∧ InternalCohesion(H) high
∧ Reuse(H) likely
∧ Validation(H) complete.

Then replace H by M in planning graph.

TENSION:
The smallest reusable grammar may discover abstractions that are poor physical assembly units.

MISSING:
A jointly geometric, physical, and linguistic criterion for macro formation.

BOUNDARY:
Hierarchical compression is not equivalent to minimal physical assembly.

CITATION TRAIL:
[[Z-LDRAW-GRAMMAR-001]]
→ recursive files
→ Assembly Theory reuse
→ macro induction
→ hierarchical prompting.

TEST:
Compare fixed human submodels with automatically induced macros.

Measure planning depth, context use, invalidation cost, and final completion.

PLATFORM:
[[RECURSIVE BUILDER LANGUAGE]]

LINKS:
[[Z-LDRAW-GRAMMAR-001]]
[[Z-HOGWARTS-CONTEXT-ASSEMBLY-POOL-001]]
[[Z-HOGWARTS-TWO-ASSEMBLIES-001]]

BIBTEX:
@manual{ldraw2012format,
author       = {{LDraw.org Standards Board}},
title        = {LDraw File Format Specification},
organization = {LDraw.org},
year         = {2012}
}

@article{sharma2023assembly,
author  = {Abhishek Sharma and others},
title   = {Assembly Theory Explains and Quantifies Selection and Evolution},
journal = {Nature},
year    = {2023},
volume  = {622},
pages   = {321--328}
}