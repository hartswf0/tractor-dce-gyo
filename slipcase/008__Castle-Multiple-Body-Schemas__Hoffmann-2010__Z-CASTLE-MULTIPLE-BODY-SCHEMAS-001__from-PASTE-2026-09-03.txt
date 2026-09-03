ZETTEL

ID:
Z-CASTLE-MULTIPLE-BODY-SCHEMAS-001

TITLE:
A Builder May Need Several Partial Body Schemas, Not One Complete Geometric Self-Model

SOURCE:
Matej Hoffmann, Hugo Gravato Marques, Alejandro Hernández Arieta, Hidenobu Sumioka, Max Lungarella, Rolf Pfeifer — “Body Schema in Robotics: A Review” — 2010. 21

PASSAGE:
[PARAPHRASE] The review emphasizes that biological body representation is unlikely to be one unitary representation; multiple partial representations serve different purposes and integrate proprioceptive, visual, tactile, vestibular, auditory, and motor information for action. 22

RESEARCH OBJECT:
“Give the assembler a body schema” may still be too monolithic.

The useful architecture may contain several ACTION-SPECIFIC SCHEMAS:

REACH SCHEMA:
what can the manipulator reach?

INSERTION SCHEMA:
what approach trajectories fit?

SUPPORT SCHEMA:
what can be released safely?

CONNECTOR SCHEMA:
what can mate?

OCCUPANCY SCHEMA:
what volume is unavailable?

TOOL SCHEMA:
what changes when a grasped LEGO element effectively extends the manipulator?

LOCAL MOVE:
Replace one enormous embodied state with several partial action-oriented representations.

SOURCE TERMS:
“body schema”
“body representation”
“proprioception”
“multiple”
“reference frames”
“forward model”
“action-oriented”

WHAT BECAME STRANGE:
The attention tax can reappear inside an excessively rich “embodied” representation.

Adding physics is insufficient if every subsystem receives every physical variable.

QUESTION:
Which partial body/world schema is actually required for each class of LEGO operation?

DEEPER QUESTION:
Can the system dynamically compose schemas only when a difficult junction requires cross-modal reasoning?

MECHANISM:
raw sensors/world state
→ multiple specialized partial schemas
→ current action determines relevant schema set
→ localized integration
→ move.

FORMAL SHIFT:
<ONE COMPLETE PHYSICAL MODEL>
→ <MULTIPLE ACTION-ORIENTED PARTIAL SCHEMAS>
→ [TASK-DEPENDENT COMPOSITION]
→ <LOWER REPRESENTATIONAL TAX>

SOURCE FORMALISM:
The review distinguishes action-oriented body schemas from other body representations and surveys explicit and implicit robot body models supporting control and adaptation. 23

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Schemas:

Σ = {
reach,
contact,
support,
connector,
collision,
tool
}.

For action class a:

RelevantSchemas(a) ⊂ Σ.

Context receives only:

Fuse(RelevantSchemas(a)).

TENSION:
Cross-schema inconsistency can become a new coordination problem.

MISSING:
A shared reference system sufficient to reconcile partial schemas without recreating one monolithic state.

BOUNDARY:
Robotic body-schema research does not imply an LLM itself possesses proprioception.

CITATION TRAIL:
[[Z-LDRAW-CONNECTION-GAP-001]]
→ robotic body schema
→ multiple action-oriented representations
→ selective embodied context.

TEST:
Compare monolithic physical state against task-specific schema routing on insertion, collision, support, and SNOT tasks.

PLATFORM:
[[EMBODIED BUILDER GAME]]

LINKS:
[[Z-LDRAW-CONNECTION-GAP-001]]
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
[[Z-HOGWARTS-DISTRIBUTED-BUILDER-001]]

BIBTEX:
@article{hoffmann2010bodyschema,
author  = {Matej Hoffmann and Hugo Gravato Marques and Alejandro Hernandez Arieta and Hidenobu Sumioka and Max Lungarella and Rolf Pfeifer},
title   = {Body Schema in Robotics: A Review},
journal = {IEEE Transactions on Autonomous Mental Development},
volume  = {2},
number  = {4},
pages   = {304--324},
year    = {2010},
doi     = {10.1109/TAMD.2010.2086454}
}