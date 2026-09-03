ZETTEL

ID:
Z-HOGWARTS-DOUBLE-BENCHMARK-001

TITLE:
The Castle Can Benchmark Whether Prompting Builds Objects or Builds the Conditions for Building

SOURCE:
Ludwig Wittgenstein — Philosophical Investigations — 1953.
Sharma et al. — Assembly Theory — 2023.
Lin Ma et al. — Assembly Sequence Planning — 2022.
Peter Kulits and Cordelia Schmid — BrickNet — 2026.
Kefan Song et al. — ICRL — 2026. 41

PASSAGE:
NONE

RESEARCH OBJECT:
The full experiment should score TWO products.

PRODUCT 1:
THE CASTLE.

Did 6,020 pieces reach the exact target legally?

PRODUCT 2:
THE LANGUAGE-GAME.

Did the interaction produce a compact, reusable, increasingly effective system of distinctions, demonstrations, macros, validations, memories, and policies that made later construction easier?

The second may be the more interesting PhD object.

LOCAL MOVE:
Make the evolving coordination machinery measurable alongside the finished artifact.

SOURCE TERMS:
“language-game”
“assembly index”
“sequence”
“graph”
“reward”
“context”

WHAT BECAME STRANGE:
The castle can fail while the language-game succeeds.

An agent may discover excellent reusable assembly primitives yet not finish under the time budget.

Conversely, it can finish by brute force while learning no reusable practice.

Those are different outcomes.

QUESTION:
What is the assembly index of a learned practice?

DEEPER QUESTION:
Can we measure how much of the second half of Hogwarts is made possible by coordination structures assembled during the first half?

MECHANISM:
early building
→ errors
→ stabilized distinctions
→ reusable macros
→ better policy
→ reduced later search/communication cost.

FORMAL SHIFT:
<ONE FINAL ARTIFACT METRIC>
→ <ARTIFACT + PRACTICE TRAJECTORY>
→ [MEASURE LEARNING OF THE GAME]
→ <DOUBLE BENCHMARK>

SOURCE FORMALISM:
Assembly Theory distinguishes object assembly index from ensemble copy number and selection. 42
ICRL demonstrates improved inference-time performance as reward-bearing history accumulates. 43

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Castle metrics:
C =
{
exactness,
physical validity,
steps,
search compute
}

Practice metrics:
G =
{
tokens_per_successful_move,
macro_reuse,
prediction_accuracy,
rollback_rate,
context_efficiency,
transfer_to_new_module
}

Learning of language-game exists if:

Performance_late

> 

Performance_early

under comparable assembly difficulty,
without parameter updates.

TENSION:
Later castle sections may be easier or more repetitive, producing apparent learning without genuine improvement.

MISSING:
Matched early/late subassemblies with equivalent structural difficulty.

BOUNDARY:
Improved efficiency does not by itself establish emergence of a genuinely new language.

CITATION TRAIL:
[[Z-HOGWARTS-ORCHESTRATION-001]]
→ language-game formation
→ assembly metrics
→ matched transfer tests.

TEST:
Interleave matched structural motifs throughout the build.

For each recurrence, measure:
prompt length,
success probability,
planning compute,
number of corrections.

Then transfer the learned local vocabulary to a held-out castle-like model.

PLATFORM:
[[HOGWARTS AS PROMPT PRAXIS BENCHMARK]]

LINKS:
[[Z-HOGWARTS-ORCHESTRATION-001]]
[[Z-HOGWARTS-TWO-ASSEMBLIES-001]]
[[Z-HOGWARTS-HIERARCHICAL-SLAB-001]]
[[Z-HOGWARTS-ICRL-LANGUAGE-GAME-001]]

BIBTEX:
@article{sharma2023assembly,
author  = {Abhishek Sharma and others},
title   = {Assembly Theory Explains and Quantifies Selection and Evolution},
journal = {Nature},
volume  = {622},
pages   = {321--328},
year    = {2023}
}

@article{ma2022planning,
author  = {Lin Ma and Jiangtao Gong and Hao Xu and Hao Chen and Hao Zhao and Wenbing Huang and Guyue Zhou},
title   = {Planning Assembly Sequence with Graph Transformer},
journal = {arXiv preprint arXiv:2210.05236},
year    = {2022}
}

@inproceedings{kulits2026bricknet,
author    = {Peter Kulits and Cordelia Schmid},
title     = {BrickNet: Graph-Backed Generative Brick Assembly},
booktitle = {CVPR},
year      = {2026}
}

@inproceedings{song2026reward,
author    = {Kefan Song and others},
title     = {Reward Is Enough: LLMs Are In-Context Reinforcement Learners},
booktitle = {ICLR},
year      = {2026}
}