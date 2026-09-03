ZETTEL

ID:
Z-HOGWARTS-SYSTEM-ID-001

TITLE:
The First Fifty Prompts Should Learn the Builder Before They Build the Castle

SOURCE:
Lennart Ljung — System Identification: Theory for the User — 1999.
Peter Kulits and Cordelia Schmid — BrickNet — 2026.
Ava Pun et al. — Generating Physically Stable and Buildable Brick Structures from Text — 2025. 14

PASSAGE:
[PARAPHRASE] LEGO generative models exhibit specific failure regimes: BrickNet reports rapid invalidity under direct pose generation, while the 2025 brick-generation system adds validity checks and physics-aware rollback.

RESEARCH OBJECT:
Before asking an unfamiliar LLM-agent stack to build 6,020 pieces, use prompting to IDENTIFY ITS LOCAL COMPETENCE.

Probe:

Can it parse LDraw?
Can it infer connectors?
Can it preserve inventory?
Can it copy motifs?
Can it reason over graph adjacency?
Can it predict insertion order?
Can it recover after rollback?
Can it respect submodel boundaries?

These are system-identification experiments.

LOCAL MOVE:
Separate CALIBRATION PHASE from CONSTRUCTION PHASE.

SOURCE TERMS:
“input”
“output”
“black-box”
“build sequences”
“validity”
“rollback”

WHAT BECAME STRANGE:
Immediately beginning the castle wastes failures.

The first failures should identify the control surface.

QUESTION:
What is the smallest calibration battery that predicts whether a model/harness can survive the full castle?

DEEPER QUESTION:
Can early probe responses predict which representation—text, graph, submodel, image, tool call—the system should use for the rest of the build?

MECHANISM:
unknown builder Σ
→ diagnostic prompts p_i
→ measured responses y_i
→ infer capability profile Ĉ
→ choose orchestration architecture
→ begin castle.

FORMAL SHIFT:
<PROMPT TO BUILD>
→ <PROMPT TO IDENTIFY BUILDER>
→ [MODEL RESPONSE SURFACE]
→ <ADAPT BUILD STRATEGY>

SOURCE FORMALISM:
System identification estimates behavior from controlled input-output observations.

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Capability vector:

Ĉ =
[
LDraw_parse,
connector_reason,
inventory_track,
motif_copy,
sequence_plan,
rollback,
long_horizon_memory
]

Choose architecture:

A* = argmax_A ExpectedCompletion(A | Ĉ).

TENSION:
Calibration consumes context and compute and may fail to transfer to the much larger target.

MISSING:
Scaling laws from diagnostic microtasks to large assembly success.

BOUNDARY:
Good local performance does not imply 6,020-step reliability.

CITATION TRAIL:
[[Z-PROMPT-SYSTEM-ID-001]]
→ BrickNet failure modes
→ BrickGPT rollback
→ builder calibration suite.

TEST:
Evaluate several model/harness combinations on 20 small diagnostic tasks.

Then run 500-piece assembly.

Fit which diagnostics predict completion.

PLATFORM:
[[ASSEMBLER CALIBRATION]]

LINKS:
[[Z-PROMPT-SYSTEM-ID-001]]
[[Z-BRICKNET-HOGWARTS-001]]
[[Z-LEGOGPT-ROLLBACK-001]]

BIBTEX:
@book{ljung1999system,
author    = {Lennart Ljung},
title     = {System Identification: Theory for the User},
edition   = {2},
publisher = {Prentice Hall},
year      = {1999}
}

@inproceedings{pun2025brick,
author    = {Ava Pun and Kangle Deng and Ruixuan Liu and Deva Ramanan and Changliu Liu and Jun-Yan Zhu},
title     = {Generating Physically Stable and Buildable Brick Structures from Text},
booktitle = {Proceedings of ICCV},
year      = {2025},
pages     = {14798--14809}
}