ZETTEL

ID:
Z-HOGWARTS-DISTRIBUTED-BUILDER-001

TITLE:
There Is No Single Assistant B Anymore

SOURCE:
Edwin Hutchins — Cognition in the Wild — 1995.
Peter Kulits and Cordelia Schmid — BrickNet — 2026.
Ava Pun et al. — Generating Physically Stable and Buildable Brick Structures from Text — 2025. 18

PASSAGE:
[PARAPHRASE] Brick-generation systems already distribute work across representation, learned generation, validity checking, and physical constraints rather than asking a single model to internally solve everything.

RESEARCH OBJECT:
Wittgenstein's A/B builder game becomes misleading at castle scale.

The practical “assistant” is a distributed assembly:

HUMAN
→ ORCHESTRATOR
→ LLM
→ GRAPH QUERY
→ INVENTORY SERVICE
→ COLLISION CHECKER
→ PHYSICS VALIDATOR
→ RENDERER
→ MEMORY
→ EXECUTOR.

Prompting orchestrates transformations across this system.

LOCAL MOVE:
Replace USER ↔ MODEL with a distributed language-game.

SOURCE TERMS:
Hutchins:
“distributed”
“representation”
“task system”

BrickNet:
“graph”
“connectivity”

Brick generation:
“validity check”
“physics-aware rollback”

WHAT BECAME STRANGE:
A “better prompt” may improve the castle because it sends the right representation to the right component rather than because it changes anything interesting inside the LLM.

QUESTION:
Which parts of castle-building competence belong to the LLM and which belong to the orchestration architecture?

DEEPER QUESTION:
Can the entire system perform reliably with a weaker language model if representations and validators are sufficiently well designed?

MECHANISM:
problem state
→ language framing
→ graph retrieval
→ candidate action
→ symbolic validation
→ physical validation
→ execution
→ render
→ human/model inspection
→ next state.

FORMAL SHIFT:
<MODEL BUILDS CASTLE>
→ <SOCIOTECHNICAL ASSEMBLY BUILDS CASTLE>
→ [REPRESENTATIONS MOVE]
→ <DISTRIBUTED COGNITION>

SOURCE FORMALISM:
NONE shared.

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Σ =
{
human,
LLM,
graph,
memory,
inventory,
validator,
renderer,
executor
}

Success =
F(inter-component transformations)

rather than:

F(LLM intelligence alone).

TENSION:
Broad distributed explanations can obscure responsibility for specific failures.

MISSING:
Causal ablations across components.

BOUNDARY:
Calling the whole system cognitive is an analytic choice, not proof that each component thinks.

CITATION TRAIL:
[[Z-PROMPT-DISTRIBUTED-001]]
→ Hutchins
→ BrickNet
→ physics-aware generation
→ orchestration benchmark.

TEST:
Hold target and prompt constant.

Systematically remove:
graph access,
validator,
memory,
renderer,
inventory tracker,
human correction.

Record the failure surface.

PLATFORM:
[[DISTRIBUTED BUILDER GAME]]

LINKS:
[[Z-PROMPT-DISTRIBUTED-001]]
[[Z-BRICKNET-HOGWARTS-001]]
[[Z-LEGOGPT-ROLLBACK-001]]

BIBTEX:
@book{hutchins1995wild,
author    = {Edwin Hutchins},
title     = {Cognition in the Wild},
publisher = {MIT Press},
year      = {1995}
}

@inproceedings{pun2025brick,
author    = {Ava Pun and others},
title     = {Generating Physically Stable and Buildable Brick Structures from Text},
booktitle = {ICCV},
year      = {2025}
}