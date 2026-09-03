ZETTEL

ID:
Z-MECO-MOTIF-MEMO-001

TITLE:
Do Not Re-Reason a Buttress You Already Learned How to Build

SOURCE:
Baiqing Wang et al. — MeCo: Enhancing LLM-Empowered Multi-Robot Collaboration via Similar Task Memoization — 2026. 21

PASSAGE:
[PARAPHRASE] MeCo argues that current LLM multi-robot systems repeatedly replan similar tasks from scratch. It retrieves previously solved similar tasks and reuses their plans, avoiding unnecessary LLM invocation; MeCoBench evaluates similar-task collaboration. 22

RESEARCH OBJECT:
This is a direct implementation receipt for the repeated Hogwarts motif.

Once one buttress has been solved:

DO NOT ASK THE MODEL TO REDISCOVER BUTTRESSING.

Retrieve the nearest solved coordination pattern and adapt only the difference.

LOCAL MOVE:
Replace generic memory retrieval with TASK-STRUCTURE MEMOIZATION.

SOURCE TERMS:
“similar task”
“memoization”
“cache and reuse”
“task similarity”
“plan reuse”

WHAT BECAME STRANGE:
A repeated architectural motif is not just a visual pattern.

It is a previously solved POLICY FRAGMENT.

QUESTION:
What representation lets two LEGO construction episodes be recognized as “the same enough” for plan reuse?

DEEPER QUESTION:
Can a motif differ in rotation, scale, color, inventory, or attachment boundary while preserving the same underlying assembly policy?

MECHANISM:
new subtask q
→ compute similarity to solved tasks
→ retrieve τ_old
→ transform τ_old into current coordinates/parts
→ validate
→ execute or locally repair.

FORMAL SHIFT:
<REASON FROM SCRATCH>
→ <RETRIEVE SOLVED TRAJECTORY>
→ [ADAPT DELTA]
→ <MEMOIZED ASSEMBLY>

SOURCE FORMALISM:
MeCo introduces a task-similarity mechanism to retrieve and reuse plans for similar multi-robot tasks. 23

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Retrieve τ_i if:

Sim(
connector_graph(q),
boundary_interfaces(q),
required_actions(q),
constraints(q)
) > θ.

Then:

τ_new =
Transform(τ_i, Δgeometry, Δinventory).

TENSION:
Wrong analogies can create systematic repeated errors more efficiently than replanning.

MISSING:
A verifier for memoized-plan applicability.

BOUNDARY:
MeCo addresses repeated collaboration tasks, not geometric subassembly equivalence.

CITATION TRAIL:
[[Z-HOGWARTS-LEARNING-CONTROL-001]]
→ MeCo
→ task memoization
→ motif policy cache.

TEST:
Create motif pairs under controlled transformations:
rotation,
mirror,
color,
one-part substitution,
changed surrounding geometry.

Measure safe plan reuse.

PLATFORM:
[[CASTLE POLICY CACHE]]

LINKS:
[[Z-HOGWARTS-LEARNING-CONTROL-001]]
[[Z-HOGWARTS-CONTEXT-ASSEMBLY-POOL-001]]
[[Z-HOGWARTS-DEMONSTRATION-001]]

BIBTEX:
@article{wang2026meco,
author  = {Baiqing Wang and Helei Cui and Bo Zhang and Xiaolong Zheng and Bin Guo and Zhiwen Yu},
title   = {MeCo: Enhancing LLM-Empowered Multi-Robot Collaboration via Similar Task Memoization},
journal = {arXiv preprint arXiv:2601.20577},
year    = {2026}
}