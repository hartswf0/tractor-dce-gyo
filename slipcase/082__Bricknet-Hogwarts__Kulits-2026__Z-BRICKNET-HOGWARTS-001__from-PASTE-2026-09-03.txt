ZETTEL

ID:
Z-BRICKNET-HOGWARTS-001

TITLE:
BrickNet Already Builds the Missing Graph Between LDraw and an LLM

SOURCE:
Peter Kulits and Cordelia Schmid — BrickNet: Graph-Backed Generative Brick Assembly — CVPR 2026.

PASSAGE:
[PARAPHRASE] BrickNet trains a language model to autoregressively generate LEGO build sequences using more than 100,000 human-designed LDraw structures. Directly predicting absolute brick poses quickly produces invalid assemblies, so BrickNet converts models into graphs whose edges explicitly encode part connectivity and serializes spanning trees as build-order text. 20

RESEARCH OBJECT:
This is almost exactly the technical bridge the Hogwarts experiment needs.

LDraw:
final absolute poses.

BrickNet:
LDraw
→ connector graph
→ build tree
→ serialized path
→ language-model training.

The critical insight is:

THE CASTLE IS NOT PRIMARILY A CLOUD OF 6,020 COORDINATES.

It is a relational graph.

LOCAL MOVE:
Replace coordinate-generation with relation-generation.

SOURCE TERMS:
“graph-backed”
“connectivity”
“tree”
“build order”
“path text”
“collision”
“LDraw”

WHAT BECAME STRANGE:
A language model becomes more physically competent when the language it predicts stops naming arbitrary positions and begins naming legal relationships.

That is a precise instance of language being redesigned by the action ontology.

QUESTION:
Could 71043 be reconstructed by training or prompting a model over connector-relative assembly paths rather than raw LDraw lines?

DEEPER QUESTION:
Does the graph representation also provide the right substrate for calculating a physically grounded LEGO assembly index?

MECHANISM:
LDraw target
→ parse instances
→ infer connector edges
→ graph
→ choose spanning/build tree
→ serialize relation sequence
→ autoregressive prediction
→ collision/validity checking
→ LDraw.

FORMAL SHIFT:
<BRICK = PART + XYZ + MATRIX>
→ <BRICK = PART + CONNECTION TO EXISTING STRUCTURE>
→ [AUTOREGRESS]
→ <BUILDABLE PATH>

SOURCE FORMALISM:
BrickNet repository exposes:

LDR → Graph → Tree → path text

and scores generated paths with parsability and collision checks. 21

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

State:

G_t = partial connector graph.

Action:

a_t =
(part_id,
connector_existing,
connector_new,
relative_transform).

Goal:

G_t → G_target.

TENSION:
BrickNet generates structures from learned distributions; it is not demonstrated as an exact 6,020-piece reconstruction system.

MISSING:
Long-horizon exact-target planning and hierarchical subassembly memory.

BOUNDARY:
BrickNet demonstrates the representation and generative mechanism, not successful autonomous reconstruction of 71043.

CITATION TRAIL:
[[Z-LDRAW-CONNECTION-GAP-001]]
→ BrickNet graph
→ exact-target conditioned generation
→ hierarchical 6k-piece castle.

TEST:
Parse the target castle into BrickNet's graph format.

Train/evaluate progressively:

100-piece section,
500-piece wing,
1,500-piece tower cluster,
full castle.

Track exact graph completion and physical validity.

PLATFORM:
[[HOGWARTS AI ASSEMBLER]]

LINKS:
[[Z-LDRAW-CONNECTION-GAP-001]]
[[Z-ASSEMBLY-POLICY-001]]

BIBTEX:
@inproceedings{kulits2026bricknet,
author    = {Peter Kulits and Cordelia Schmid},
title     = {BrickNet: Graph-Backed Generative Brick Assembly},
booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition},
year      = {2026},
pages     = {39252--39261}
}