ZETTEL

ID:
Z-STATECAD-STRUCTURED-STATE-001

TITLE:
Multi-Round Geometry Needs an Editable State Between Language and Code

SOURCE:
Dawei Lin, Yuanning Liu — State-CAD: Precise and Iterative CAD Modeling with Structured State Representation and Reinforcement Learning — Computer-Aided Design — 2026. 33

PASSAGE:
[PARAPHRASE] State-CAD argues that when design state exists only implicitly in dialogue or the prior generated result, local edits can violate already satisfied dimensions and topology. It introduces an updatable Structured State Representation that explicitly records geometric parameters and topological structure, then conditions CAD generation on that state; reinforcement learning supplies geometric and topological feedback. 34

RESEARCH OBJECT:
This source attacks a precise weakness in prompt-in-motion systems.

A HISTORY is not the same thing as a STATE.

History says what happened.

State says what is currently true.

For Hogwarts, the reasoning trace may be disposable while these must survive exactly:

remaining inventory,
placed instances,
mate graph,
open interfaces,
completed subassemblies,
blocked insertion paths.

LOCAL MOVE:
Separate EVENT LOG from AUTHORITATIVE STATE.

SOURCE TERMS:
“structured state representation”
“geometry”
“topology”
“multi-round refinement”
“editable”
“traceable”
“GRPO”

WHAT BECAME STRANGE:
Context compression becomes much easier once we stop asking language to remember the world.

QUESTION:
How little conversational history is required if the full relevant geometric state is externally reconstructed every turn?

DEEPER QUESTION:
Could the prompt itself become only the delta between two explicit states?

MECHANISM:
user instruction
→ parse into state update
→ SSR_t
→ CAD generator
→ geometry
→ geometric/topological reward
→ refinement
→ SSR_(t+1).

FORMAL SHIFT:
<DIALOGUE CARRIES DESIGN>
→ <STRUCTURED STATE CARRIES DESIGN>
→ [LANGUAGE UPDATES STATE]
→ <STABLE MULTI-ROUND EDITING>

SOURCE FORMALISM:
State-CAD uses a CAD-Parser to produce SSR, then SFT followed by GRPO-based reinforcement fine-tuning using geometric and topological feedback. 35

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Event log:
H_t = {all prior actions}

Authoritative state:
S_t = Reduce(H_t)

Prompt need only carry:

ΔS_desired.

TENSION:
A reduced state may omit path-dependent information relevant to future assembly.

MISSING:
A distinction between:
current geometry state
and
history-dependent construction affordances.

BOUNDARY:
Markovian state sufficiency must be demonstrated rather than assumed.

CITATION TRAIL:
[[Z-HOGWARTS-CONTEXT-EXHAUST-001]]
→ State-CAD
→ external structured state
→ path-dependent assembly state.

TEST:
Delete all natural-language history every N moves while preserving explicit state.

Measure the point at which performance degrades.

Then identify the missing historical variables.

PLATFORM:
[[EXPLICIT CASTLE STATE]]

LINKS:
[[Z-HOGWARTS-CONTEXT-EXHAUST-001]]
[[Z-HOGWARTS-ORCHESTRATION-001]]
[[Z-HOGWARTS-THREE-LOOPS-001]]

BIBTEX:
@article{lin2026statecad,
author  = {Dawei Lin and Yuanning Liu},
title   = {State-CAD: Precise and Iterative CAD Modeling with Structured State Representation and Reinforcement Learning},
journal = {Computer-Aided Design},
volume  = {199},
pages   = {104128},
year    = {2026},
doi     = {10.1016/j.cad.2026.104128}
}