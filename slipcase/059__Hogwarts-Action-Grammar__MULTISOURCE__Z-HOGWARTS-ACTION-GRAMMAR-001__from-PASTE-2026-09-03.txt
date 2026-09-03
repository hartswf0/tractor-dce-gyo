ZETTEL

ID:
Z-HOGWARTS-ACTION-GRAMMAR-001

TITLE:
The Castle Should Teach the Model Verbs Before It Teaches It Parts

SOURCE:
Wenlong Huang et al. — Language Models as Zero-Shot Planners — 2022.
Peter Kulits and Cordelia Schmid — BrickNet — 2026.
LDraw.org — File Format Specification. 15

PASSAGE:
[PARAPHRASE] Embodied planning work separates plausible high-level language from actions admitted by the environment; BrickNet encodes LEGO through explicit connection relations because unrestricted pose generation quickly becomes invalid. 16

RESEARCH OBJECT:
The decisive prompt vocabulary for Hogwarts is not the 17k nouns in the part library.

It is the much smaller set of ACTION RELATIONS that make those nouns operational.

Examples:

ATTACH_STUD
INSERT_AXLE
HINGE_TO
STACK_ON
CLIP_TO
ALIGN_WITH
REPEAT_MODULE
CLOSE_GAP
VERIFY_STABILITY
ROLLBACK.

The nouns specify what exists.

The verbs specify what can happen.

LOCAL MOVE:
Build the prompt language from the transition system outward.

SOURCE TERMS:
“admissible actions”
“connectivity”
“build sequence”
“physical constraints”

WHAT BECAME STRANGE:
The effective language can become smaller as the part universe gets larger.

Thousands of parts may participate in a relatively compact connection grammar.

QUESTION:
What is the minimum action vocabulary needed to express every legal transition in 71043?

DEEPER QUESTION:
Could the action grammar itself be learned from connector metadata and successful build traces rather than designed manually?

MECHANISM:
part inventory

connector ontology
→ derive permissible action templates
→ instantiate against current state
→ model selects action
→ validator executes/rejects.


FORMAL SHIFT:
<PROMPT OVER OBJECT NAMES>
→ <PROMPT OVER ACTION GRAMMAR>
→ [BIND PARTS TO VERBS]
→ <EXECUTABLE ASSEMBLY>

SOURCE FORMALISM:
BrickNet emphasizes part connectivity as the structural representation supporting generation. 17

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Action schema:

ATTACH(
new_part,
new_connector,
existing_part,
existing_connector,
relative_transform
)

Legal iff preconditions hold.

TENSION:
Some LEGO assembly operations involve temporary flex, multi-part alignment, or accessibility constraints not captured by simple binary connector relations.

MISSING:
Higher-order actions involving several parts simultaneously.

BOUNDARY:
A connector grammar is not a complete physics model.

CITATION TRAIL:
[[Z-PROMPT-ACTION-ONTOLOGY-001]]
→ BrickNet connector semantics
→ assembly verb induction
→ Hogwarts action DSL.

TEST:
Derive all target edges from the castle connector graph.

Cluster them into action schemas.

Measure how many schemas cover 50%, 90%, 99%, and 100% of edges.

PLATFORM:
[[HOGWARTS ACTION LANGUAGE]]

LINKS:
[[Z-PROMPT-ACTION-ONTOLOGY-001]]
[[Z-LDRAW-CONNECTION-GAP-001]]
[[Z-HOGWARTS-DEIXIS-001]]

BIBTEX:
@article{huang2022language,
author  = {Wenlong Huang and Pieter Abbeel and Deepak Pathak and Igor Mordatch},
title   = {Language Models as Zero-Shot Planners: Extracting Actionable Knowledge for Embodied Agents},
journal = {arXiv preprint arXiv:2201.07207},
year    = {2022}
}

@inproceedings{kulits2026bricknet,
author    = {Peter Kulits and Cordelia Schmid},
title     = {BrickNet: Graph-Backed Generative Brick Assembly},
booktitle = {CVPR},
year      = {2026}
}