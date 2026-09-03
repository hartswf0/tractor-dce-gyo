ZETTEL

ID:
Z-HOGWARTS-MATERIAL-TALKS-BACK-001

TITLE:
The Next Prompt Should Be Caused by What the Castle Just Did

SOURCE:
Donald A. Schön — Designing as Reflective Conversation with the Materials of a Design Situation — 1992.
Ava Pun et al. — Generating Physically Stable and Buildable Brick Structures from Text — 2025. 19

PASSAGE:
[PARAPHRASE] Schön treats a design move as something whose consequences become newly visible and alter subsequent seeing; the brick-generation system operationalizes a narrow version through validation and physics-aware rollback. 20

RESEARCH OBJECT:
The strongest castle prompting loop is not:

PROMPT
→ MODEL
→ PROMPT
→ MODEL.

It is:

PROMPT
→ ASSEMBLY MOVE
→ CASTLE STATE
→ RENDER/PHYSICS/ERROR
→ NEW SEEING
→ NEXT PROMPT.

The artifact becomes an active source of the next linguistic move.

LOCAL MOVE:
Put the return path CASTLE → LANGUAGE at the center.

SOURCE TERMS:
“reflective conversation”
“design situation”
“unintended consequences”
“validity”
“rollback”

WHAT BECAME STRANGE:
The best next prompt may not have been thinkable before the previous brick was placed.

The construction reveals the problem that language must then name.

QUESTION:
Can the next prompt be generated from discrepancies in the evolving assembly rather than from a predetermined instruction script?

DEEPER QUESTION:
What kinds of discrepancy—visual, structural, physical, inventory, historical—produce the most informative next linguistic moves?

MECHANISM:
P_t
→ proposed action
→ execute/simulate
→ state S_(t+1)
→ detect discrepancy D_(t+1)
→ formulate P_(t+1).

FORMAL SHIFT:
<PROMPT PRECEDES ARTIFACT>
→ <ARTIFACT GENERATES CONDITIONS FOR NEXT PROMPT>
→ [SEE]
→ <REFLECTION-IN-ACTION>

SOURCE FORMALISM:
The 2025 brick-generation work checks physical validity during autoregressive generation and rolls back infeasible predictions. 21

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

P_(t+1) =
PromptFrom(
target_delta,
current_graph,
collisions,
stability,
remaining_inventory,
visual_discrepancy
)

not:
P_(t+1) = next prewritten sentence.

TENSION:
Physics rejection is not equivalent to Schönian reflective seeing; the latter includes reframing goals and meanings.

MISSING:
A higher-level discrepancy interpreter capable of revising both means and ends.

BOUNDARY:
Rollback is feedback, not yet praxis.

CITATION TRAIL:
[[Z-PROMPT-SCHON-002]]
→ Schön
→ physics-aware rollback
→ artifact-generated prompting.

TEST:
Compare:
fixed instruction sequence
against
artifact-conditioned next-prompt generation.

Introduce unplanned obstructions or inventory substitutions.

Measure recovery.

PLATFORM:
[[CASTLE TALKS BACK]]

LINKS:
[[Z-PROMPT-SCHON-002]]
[[Z-PROMPT-PRAXIS-SWITCH-001]]
[[Z-LEGOGPT-ROLLBACK-001]]

BIBTEX:
@article{schon1992designing,
author  = {Donald A. Sch{"o}n},
title   = {Designing as Reflective Conversation with the Materials of a Design Situation},
journal = {Research in Engineering Design},
volume  = {3},
pages   = {131--147},
year    = {1992}
}

@inproceedings{pun2025brick,
author    = {Ava Pun and others},
title     = {Generating Physically Stable and Buildable Brick Structures from Text},
booktitle = {ICCV},
year      = {2025}
}