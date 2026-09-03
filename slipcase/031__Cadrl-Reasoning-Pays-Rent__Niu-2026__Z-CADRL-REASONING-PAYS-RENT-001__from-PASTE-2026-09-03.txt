ZETTEL

ID:
Z-CADRL-REASONING-PAYS-RENT-001

TITLE:
Longer Reasoning Is Not Automatically Better Geometry

SOURCE:
Ke Niu et al. — From Intent to Execution: Multimodal Chain-of-Thought Reinforcement Learning for Precise CAD Code Generation — AAAI 2026. 36

PASSAGE:
[PARAPHRASE] CAD-RL combines multimodal chain-of-thought cold start with reinforcement learning using executability, geometric accuracy, and external evaluation rewards. Its optimization includes Precision Token Loss for dimensional values and Overlong Filtering to reduce noisy long reasoning. 37

RESEARCH OBJECT:
This gives the Hogwarts adaptive-reasoning idea a useful constraint:

THE REASONING TRACE MUST PAY RENT IN EXECUTABLE GEOMETRY.

Hard geometry may deserve more reasoning.

But overlong reasoning can itself become supervision noise.

LOCAL MOVE:
Schedule reasoning by expected geometric value rather than prestige of “thinking longer.”

SOURCE TERMS:
“Multimodal Chain-of-Thought”
“executability reward”
“geometric accuracy reward”
“external evaluation reward”
“Precision Token Loss”
“Overlong Filtering”

WHAT BECAME STRANGE:
Numerical precision can require a different optimization pressure from conceptual reasoning.

The model may know the correct construction strategy and still fail because one dimension token is wrong.

QUESTION:
Should reasoning budgets be allocated separately to:
topology,
sequence,
numeric geometry,
and policy learning?

DEEPER QUESTION:
Can the Gauntlet detect which reasoning regime produced the residual and increase only that form of compute?

MECHANISM:
input
→ reasoning trace
→ CAD code
→ execute
→ geometry
→ multiple verifiable rewards
→ post-training / policy improvement.

FORMAL SHIFT:
<MORE COT>
→ <REASONING UNDER GEOMETRIC REWARD>
→ [FILTER USELESS LENGTH]
→ <PRECISION-AWARE DELIBERATION>

SOURCE FORMALISM:
CAD-RL uses three task-specific reward classes and targeted optimization for exploration, precision tokens, and excessive reasoning length. 38

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Given residual type e:

if e = topology:
allocate graph reasoning
elif e = numerical:
allocate parameter verification
elif e = trajectory:
allocate search/simulation
elif e = repeated policy failure:
update policy memory.

TENSION:
Training-time techniques do not automatically transfer into inference-time orchestration.

MISSING:
A runtime classifier mapping residual class to compute strategy.

BOUNDARY:
CAD-RL does not study long-horizon assembly.

CITATION TRAIL:
[[Z-HOGWARTS-TWO-CLOCKS-001]]
→ CAD-RL
→ overlong filtering
→ residual-conditioned reasoning.

TEST:
Create matched CAD tasks where only one difficulty axis varies:
topology,
numerical precision,
construction sequence,
visual ambiguity.

Allocate equal versus specialized reasoning budgets.

PLATFORM:
[[GAUNTLET COMPUTE SCHEDULER]]

LINKS:
[[Z-HOGWARTS-TWO-CLOCKS-001]]
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
[[Z-HOGWARTS-ERROR-RESIDUAL-001]]

BIBTEX:
@inproceedings{niu2026cadrl,
author    = {Ke Niu and Haiyang Yu and Zhuofan Chen and Mengyang Zhao and Teng Fu and Bin Li and Xiangyang Xue},
title     = {From Intent to Execution: Multimodal Chain-of-Thought Reinforcement Learning for Precise CAD Code Generation},
booktitle = {Proceedings of the AAAI Conference on Artificial Intelligence},
volume    = {40},
number    = {10},
pages     = {8160--8167},
year      = {2026},
doi       = {10.1609/aaai.v40i10.37763}
}