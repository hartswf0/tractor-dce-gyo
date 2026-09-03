ZETTEL

ID:
Z-GAUNTLET-REASON-LEARN-SWITCH-001

TITLE:
A Hard Brick Can Demand More Reasoning Without Deserving a New Policy

SOURCE:
Ke Niu et al. — CAD-RL — 2026.
Ke Niu et al. — CME-CAD — 2025.
Baiqing Wang et al. — MeCo — 2026.
Liang Wang et al. — Text2CAD-Bench — 2026. 49

PASSAGE:
[OUR INFERENCE] The current literature separates several phenomena that prompt practice often calls “thinking harder”: harder geometric examples benefit from stronger reasoning or reward-guided optimization; repeated difficult examples can become hard negatives; structurally similar solved tasks can be memoized; benchmark performance degrades systematically as topology and feature complexity increase.

RESEARCH OBJECT:
The Hogwarts Gauntlet needs a ROUTER that distinguishes four reasons for difficulty:

CASE DIFFICULTY:
this move is intrinsically hard.
→ spend more deliberation now.

POLICY DEFECT:
the same class of mistake keeps recurring.
→ change reusable policy.

REPRESENTATION DEFECT:
the current state/action vocabulary cannot express the distinction.
→ redesign the language-game.

MEMORY FAILURE:
we solved this before but failed to retrieve it.
→ retrieve/memoize.

LOCAL MOVE:
Make failure TYPE determine which loop receives compute.

SOURCE TERMS:
“Overlong Filtering”
“hard negative”
“memoization”
“complex topology”
“advanced features”

WHAT BECAME STRANGE:
A single instruction such as:

“think harder”

collapses four technically different interventions.

That may be why generic reasoning prompts plateau.

QUESTION:
Can a residual classifier reliably choose among DELIBERATE, LEARN, REFRAME, and RETRIEVE?

DEEPER QUESTION:
Is expert prompting partly expertise at assigning failure to the correct timescale?

MECHANISM:
failure residual r_t
→ classify cause z_t

z=case:
increase local search.

z=policy:
compile lesson.

z=representation:
alter state/action schema.

z=memory:
retrieve solved analogue.

→ retry.

FORMAL SHIFT:
<FAILURE → MORE COT>
→ <FAILURE → CAUSAL ROUTING>
→ [ALLOCATE CORRECT LOOP]
→ <ADAPTIVE REASONING SYSTEM>

SOURCE FORMALISM:
The sources provide separate mechanisms—reasoning-length control/reward, hard-negative buffering, task memoization, and complexity-stratified benchmarking—but not this unified runtime router.

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

z_t =
Classifier(
residual_type,
recurrence_count,
novelty,
structural_similarity_to_memory,
uncertainty,
validator_disagreement
)

Action on orchestration:

Ω(z_t).

TENSION:
The classifier itself becomes another model capable of misdiagnosing failure.

MISSING:
A counterfactual test:
would a different intervention actually have fixed the failure more cheaply?

BOUNDARY:
This four-way split is our synthesis, not established taxonomy.

CITATION TRAIL:
[[Z-HOGWARTS-THREE-LOOPS-001]]
→ CAD-RL
→ CME-CAD
→ MeCo
→ Text2CAD-Bench
→ failure router.

TEST:
Construct benchmark episodes whose ground-truth failure cause is deliberately known:

insufficient local search,
bad reusable rule,
missing representation,
forgotten prior solution.

Score whether the orchestrator invokes the right loop.

PLATFORM:
[[ADAPTIVE GAUNTLET]]

LINKS:
[[Z-HOGWARTS-THREE-LOOPS-001]]
[[Z-HOGWARTS-TWO-CLOCKS-001]]
[[Z-HOGWARTS-ERROR-COMPILES-POLICY-001]]
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]

BIBTEX:
@inproceedings{niu2026cadrl,
author    = {Ke Niu and others},
title     = {From Intent to Execution: Multimodal Chain-of-Thought Reinforcement Learning for Precise CAD Code Generation},
booktitle = {Proceedings of the AAAI Conference on Artificial Intelligence},
year      = {2026}
}

@article{wang2026meco,
author  = {Baiqing Wang and others},
title   = {MeCo: Enhancing LLM-Empowered Multi-Robot Collaboration via Similar Task Memoization},
journal = {arXiv preprint arXiv:2601.20577},
year    = {2026}
}