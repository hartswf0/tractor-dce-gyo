ZETTEL

ID:
Z-CMECAD-HARD-NEGATIVE-001

TITLE:
Multi-Agent Geometry Gets Interesting When the Experts Fail Differently

SOURCE:
Ke Niu et al. — CME-CAD: Heterogeneous Collaborative Multi-Expert Reinforcement Learning for CAD Code Generation — 2025/2026. 39

PASSAGE:
[PARAPHRASE] CME-CAD uses heterogeneous expert models with distinct system prompts to generate different reasoning styles, then performs cross-expert reinforcement learning. Its reward requires valid format and executable code and additionally scores 3D IoU and coordinate-system consistency. Difficult examples on which experts repeatedly fail are retained in a hard-negative buffer for targeted later training. 40

RESEARCH OBJECT:
This suggests a stronger multi-agent pattern than generic debate.

DO NOT MAKE FIVE AGENTS WHO ALL TRY TO “SOLVE THE CASTLE.”

Create experts whose failure surfaces differ.

For Hogwarts:

TOPOLOGY EXPERT
SEQUENCE EXPERT
PHYSICS EXPERT
INVENTORY EXPERT
VISUAL DISCREPANCY EXPERT.

Collaboration becomes informative when their disagreements are structured.

LOCAL MOVE:
Replace roleplay diversity with VERIFIER/REPRESENTATION DIVERSITY.

SOURCE TERMS:
“heterogeneous”
“Multi-Expert Fine-Tuning”
“Multi-Expert Reinforcement Learning”
“hard negative sample buffering”
“executability”
“IoU”
“work plane”

WHAT BECAME STRANGE:
The worst cases are not discarded as noise.

They become a curriculum.

A recurrent castle failure should similarly graduate from:

error message
to
hard-negative test case.

QUESTION:
Can recurrent assembly failures automatically create new unit tests for the orchestration policy?

DEEPER QUESTION:
Should expert specialization be learned from empirical error clusters rather than assigned before the experiment?

MECHANISM:
multiple expert strategies
→ multiple candidate solutions
→ executable/geometric rewards
→ identify strongest and weakest
→ cross-expert transfer
→ buffer repeatedly failed cases
→ targeted retraining/reasoning.

FORMAL SHIFT:
<MULTI-AGENT DISCUSSION>
→ <HETEROGENEOUS ERROR SURFACES>
→ [VERIFIABLE REWARD]
→ <COLLABORATIVE LEARNING>

SOURCE FORMALISM:
CME-CAD's total reward gates geometric reward on valid format and code execution, and its hard-negative buffer preserves inputs that repeatedly yield incorrect outputs. 41

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

For castle state S:

experts E_i produce hypotheses h_i.

Validator vector:
V(h_i) = {
topology,
executability,
geometry,
physics,
inventory
}

Persistent failure state:

if FailureCount(S) > k:
HardNegativeBuffer.add(S).

TENSION:
CME-CAD's experts are a training paradigm; it ultimately allows efficient single-expert inference.

This is not evidence that many inference-time agents are always beneficial.

MISSING:
A fair test of:
multi-expert training
versus
multi-agent inference
versus
single-agent + exact tools.

BOUNDARY:
Expert diversity should not be confused with multi-robot embodiment.

CITATION TRAIL:
[[Z-HOGWARTS-ERROR-COMPILES-POLICY-001]]
→ CME-CAD
→ hard negatives
→ verifier-specialized castle agents.

TEST:
Cluster all failed castle moves by validator residual.

Create one specialist prompt/tool policy per cluster.

Test whether learned specialization beats hand-assigned roles.

PLATFORM:
[[HARD-NEGATIVE GAUNTLET]]

LINKS:
[[Z-HOGWARTS-ERROR-COMPILES-POLICY-001]]
[[Z-HOGWARTS-DISTRIBUTED-BUILDER-001]]
[[Z-HOGWARTS-PROCESS-REWARD-001]]

BIBTEX:
@article{niu2025cmecad,
author  = {Ke Niu and Haiyang Yu and Zhuofan Chen and Zhengtao Yao and Weitao Jia and Xiaodong Ge and Jingqun Tang and Benlei Cui and Bin Li and Xiangyang Xue},
title   = {CME-CAD: Heterogeneous Collaborative Multi-Expert Reinforcement Learning for CAD Code Generation},
journal = {arXiv preprint arXiv:2512.23333},
year    = {2025}
}