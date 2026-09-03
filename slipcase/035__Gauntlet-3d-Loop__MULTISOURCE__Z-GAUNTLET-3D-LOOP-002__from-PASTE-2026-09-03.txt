ZETTEL

ID:
Z-GAUNTLET-3D-LOOP-002

TITLE:
The State of the Art Converges on a Gauntlet, Not a Mega-Prompt

SOURCE:
Kamel Alrashedy et al. — CADCodeVerify — 2025.
Fengxiao Fan et al. — CADDesigner — 2026.
Dawei Lin, Yuanning Liu — State-CAD — 2026.
Mingjia Wang et al. — OmniCAD — 2026. 48

PASSAGE:
[OUR INFERENCE] Across these independent systems, successful 3D reasoning repeatedly moves computation outside a one-shot prompt: design intent is converted into explicit or executable state, geometry is generated, external tools expose discrepancies, and those discrepancies condition another round.

RESEARCH OBJECT:
A technically grounded GAUNTLET LOOP now looks like:

INTENT
→ EXPLICIT STATE
→ PLAN
→ EXECUTABLE REPRESENTATION
→ SANDBOX
→ ARTIFACT
→ MULTI-VIEW OBSERVATION
→ EXACT CHECKS
→ RESIDUAL VECTOR
→ REPAIR
→ MEMORY DECISION
→ NEXT ROUND.

The “prompt” is distributed across this loop.

LOCAL MOVE:
Stop optimizing the sentence and benchmark the update architecture.

SOURCE TERMS:
“iterative visual feedback”
“structured state representation”
“tool-augmented”
“geometric conflict checks”
“verification”
“executable”

WHAT BECAME STRANGE:
The visible natural-language prompt is becoming a thinner and thinner portion of the machinery.

Meanwhile the loop gains:

state,
tools,
validators,
rewards,
memory,
rollback,
and executable code.

QUESTION:
At what point should research stop calling this prompt engineering and start naming the loop as the primary object?

DEEPER QUESTION:
What remains uniquely linguistic once explicit state and exact validators take over most operational work?

MECHANISM:
Intent_t
→ State_t
→ Proposal_t
→ Execute
→ Observe
→ Residual_t
→ Diagnose
→ Patch
→ Consolidate reusable lesson
→ State_(t+1).

FORMAL SHIFT:
<PROMPT → OUTPUT>
→ <PROMPT → WORLD → RESIDUAL → PROMPT>
→ [STATE + TOOL + MEMORY]
→ <RECURSIVE CONTROL SYSTEM>

SOURCE FORMALISM:
NONE shared across all sources.

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

GAUNTLET(S_t, I_t):

1. Q_t = AssembleContext(S_t,I_t)


2. h_t = Propose(Q_t)


3. A_t = Execute(h_t)


4. r_t = Verify(A_t,target)


5. if r_t != 0:
classify(r_t)
allocate_compute(r_t)
repair


6. else:
consolidate


7. update S_t


8. repeat.



TENSION:
A giant orchestration loop can conceal the fact that some tasks are solved better by a small direct model call.

MISSING:
A complexity trigger for escalating from direct prompting into Gauntlet mode.

BOUNDARY:
The synthesis is ours; none of the sources defines “Gauntlet Loop.”

CITATION TRAIL:
[[Z-HOGWARTS-THREE-LOOPS-001]]
→ CADCodeVerify
→ CADDesigner
→ State-CAD
→ OmniCAD
→ explicit Gauntlet architecture.

TEST:
For identical geometry tasks compare:

one-shot,
self-reflection,
render-feedback loop,
explicit-state Gauntlet,
full multi-verifier Gauntlet.

Plot quality against tokens, tool calls, latency, and task complexity.

PLATFORM:
[[GAUNTLET LOOP]]

LINKS:
[[Z-HOGWARTS-THREE-LOOPS-001]]
[[Z-HOGWARTS-PROMPT-IS-CONTROL-LAW-001]]
[[Z-CADCODEVERIFY-GAUNTLET-001]]
[[Z-STATECAD-STRUCTURED-STATE-001]]

BIBTEX:
@inproceedings{alrashedy2025cadcodeverify,
author    = {Kamel Alrashedy and others},
title     = {Generating CAD Code with Vision-Language Models for 3D Designs},
booktitle = {International Conference on Learning Representations},
year      = {2025}
}

@article{fan2026caddesigner,
author  = {Fengxiao Fan and others},
title   = {CADDesigner: Conceptual CAD Model Generation with a General-Purpose Agent},
journal = {Computer-Aided Design},
volume  = {198},
pages   = {104087},
year    = {2026}
}

@article{lin2026statecad,
author  = {Dawei Lin and Yuanning Liu},
title   = {State-CAD: Precise and Iterative CAD Modeling with Structured State Representation and Reinforcement Learning},
journal = {Computer-Aided Design},
volume  = {199},
pages   = {104128},
year    = {2026}
}