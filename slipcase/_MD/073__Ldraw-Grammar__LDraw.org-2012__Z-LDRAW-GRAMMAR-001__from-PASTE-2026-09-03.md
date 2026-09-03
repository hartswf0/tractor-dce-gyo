ZETTEL

ID:
Z-LDRAW-GRAMMAR-001

TITLE:
LDraw Is Already a Recursive Assembly Grammar

SOURCE:
LDraw.org Standards Board — LDraw File Format Specification — rev. 1.0.2.
LDraw.org — Official Parts Library Header Specification.

PASSAGE:
[PARAPHRASE] LDraw line type 1 references another file together with colour, translation, and a 3×3 transformation matrix. Subfiles can themselves contain further subfile references, and the specification places no formal limit on nesting depth. 3

RESEARCH OBJECT:
The LDraw library does not merely give an AI 17,116 unrelated meshes.

It gives it a recursive symbolic construction language.

A line such as:

1 colour x y z a b c d e f g h i file.dat

means approximately:

TAKE reusable object file.dat
→ transform it
→ place an instance here.

That is already extraordinarily close to an assembly grammar.

LOCAL MOVE:
Move from “parts database” to executable hierarchical representation.

SOURCE TERMS:
“sub-file reference”
“transformation matrix”
“sub-part”
“primitive”
“nested”
“colour”

WHAT BECAME STRANGE:
The assembly operation is literally encoded into the representation.

LDraw's hierarchy can be:

primitive
→ subpart
→ part
→ submodel
→ model.

The same subfile can be referenced repeatedly under different rigid transforms.

This is not a flat combinatorial universe.

It is a reusable DAG waiting to be exposed.

QUESTION:
Is the natural Assembly Theory representation of an LDraw castle its final brick list, or the smallest reusable subfile grammar capable of generating it?

DEEPER QUESTION:
Would the minimal reusable LDraw DAG recover the same repeated structures that human builders recognize as windows, buttresses, towers, roofs, bridges, and façade modules?

MECHANISM:
primitive geometry
→ reusable subpart
→ reusable part
→ transformed instances
→ reusable submodel
→ complete model.

FORMAL SHIFT:
<FLAT SET OF 6,020 BRICKS>
→ <HIERARCHICAL REFERENCE GRAPH>
→ [REUSE]
→ <COMPRESSED GENERATIVE CASTLE>

SOURCE FORMALISM:
Line type 1:

1 <colour> x y z a b c d e f g h i <file>

with translation and matrix transformation. 4

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Represent an LDraw model as DAG:

G = (V,E)

where:
V = reusable files/submodels,
E = transformed references.

A candidate digital assembly index becomes related to:

minimize |V_unique| + |E_construction|

subject to:

Expand(G) = target geometry.

TENSION:
The LDraw hierarchy was designed for geometric reuse and authoring convenience.

It is not necessarily a historical record of physical construction.

MISSING:
Comparison among:
author-chosen submodel hierarchy,
automatically discovered minimum grammar,
manual building hierarchy,
physically feasible assembly hierarchy.

BOUNDARY:
A reusable file reference is not automatically a physically reusable constructed object.

CITATION TRAIL:
[[Z-PROMPT-HYPOTHESIS-001]]
→ LDraw type-1 recursion
→ smallest grammar problem
→ Assembly Theory shortest reusable paths.

TEST:
Flatten a known LDraw model completely.

Then recompress it by repeated-subgraph mining.

Compare:
original MPD hierarchy,
minimum discovered DAG,
file size,
assembly index,
human-recognizable subassemblies.

PLATFORM:
[[LDRAW AS ASSEMBLY GRAMMAR]]

LINKS:
[[Z-PROMPT-HYPOTHESIS-001]]
[[Z-PROMPT-PROGRAM-001]]

BIBTEX:
@manual{ldrawformatspec,
author       = {{LDraw.org Standards Board}},
title        = {LDraw File Format Specification},
organization = {LDraw.org},
year         = {2012},
note         = {Revision 1.0.2}
}