ZETTEL

ID:
Z-LDRAW-CONNECTION-GAP-001

TITLE:
LDraw Knows Where a Brick Is but Not Necessarily How It Can Connect

SOURCE:
Roland Melkert — LDCad Shadow Library — current repository.
Peter Kulits and Cordelia Schmid — BrickNet: Graph-Backed Generative Brick Assembly — CVPR 2026.

PASSAGE:
[PARAPHRASE] The LDCad Shadow Library exists because the core LDraw format does not contain enough information for accurate part snapping and mirroring; it appends additional metadata to parts. BrickNet likewise augments LDraw structures with explicit connector semantics and collision information. 5

RESEARCH OBJECT:
This is a major problem for turning LDraw directly into an Assembly Theory universe.

LDraw encodes GEOMETRIC POSSIBILITY.

It does not by itself fully encode ASSEMBLY POSSIBILITY.

A brick at pose (x,y,z,R) may:
look correct,
interpenetrate another brick,
float,
lack a legal stud connection,
require an impossible insertion,
or be physically inaccessible at that stage of construction.

LOCAL MOVE:
Separate geometry space from assembly space.

SOURCE TERMS:
LDCad:
“snapping”
“mirroring”
“patch files”

BrickNet:
“connectivity semantics”
“Stud”
“Hinge”
“Axle”
“Ball”
“Fixed”
“collision”

WHAT BECAME STRANGE:
Sara Walker's LEGO analogy says that “there are rules in a Lego universe.”

The primary LDraw file does not contain all those rules.

The rules live partly elsewhere:
in geometry,
community connection metadata,
collision meshes,
physical brick tolerances,
and embodied construction practice.

QUESTION:
Where exactly is the LEGO universe's law book?

DEEPER QUESTION:
Does Assembly Theory underestimate how much domain-specific machinery is required before “physically possible joining operation” becomes computable?

MECHANISM:
LDraw pose data

connector metadata

collision geometry

insertion/reachability constraints

stability
→ admissible joining operation.


FORMAL SHIFT:
<ALL PLACEMENTS IN LDRAW>
→ <CONNECTOR GRAPH>
→ [COLLISION + PHYSICS + ACCESS]
→ <ASSEMBLY-POSSIBLE TRANSITIONS>

SOURCE FORMALISM:
BrickNet models five broad connector classes:
stud,
hinge,
axle,
ball,
fixed. 6

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

A transition:

S_t + part p at pose T → S_(t+1)

is legal only if:

ConnectorCompatible(p,S_t)
∧ ¬Collision(p,S_t)
∧ Stable(S_(t+1))
∧ ReachableInsertion(p,S_t).

TENSION:
Assembly Theory defines its assembly space in terms of physically implementable operations, so these constraints can in principle be added.

But then much explanatory work comes from the domain-specific transition model rather than from assembly index alone.

MISSING:
A complete open connector + collision + insertion ontology covering all LDraw parts.

BOUNDARY:
Geometrically valid LDraw does not imply physically buildable LEGO.

CITATION TRAIL:
[[Z-PROMPT-ACTION-ONTOLOGY-001]]
→ LDraw connectivity gap
→ LDCad Shadow Library
→ BrickNet connector graph
→ physically admissible assembly space.

TEST:
Take a corpus of valid .ldr models.

Measure how many placements remain valid after progressively adding:

pose syntax,
snap compatibility,
collision,
stability,
insertion reachability.

PLATFORM:
[[ASSEMBLY POSSIBLE]]

LINKS:
[[Z-PROMPT-ACTION-ONTOLOGY-001]]
[[Z-PROMPT-PRAXIS-SWITCH-001]]

BIBTEX:
@inproceedings{kulits2026bricknet,
author    = {Peter Kulits and Cordelia Schmid},
title     = {BrickNet: Graph-Backed Generative Brick Assembly},
booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition},
year      = {2026},
pages     = {39252--39261}
}

@misc{melkertldcadshadow,
author = {Roland Melkert},
title  = {LDCad Shadow Library},
note   = {LDraw snapping and mirroring metadata}
}