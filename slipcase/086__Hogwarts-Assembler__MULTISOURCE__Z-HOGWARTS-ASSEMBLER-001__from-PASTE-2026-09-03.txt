ZETTEL

ID:
Z-HOGWARTS-ASSEMBLER-001

TITLE:
The Full Castle Wants a Hierarchical Counterexample Machine

SOURCE:
LDraw.org — LDraw File Format and Parts Library.
Peter Kulits and Cordelia Schmid — BrickNet — CVPR 2026.
Ava Pun et al. — LegoGPT — ICCV 2025.
Song et al. — Reward Is Enough — ICLR 2026.
Sharma et al. — Assembly Theory — Nature 2023.

PASSAGE:
NONE

RESEARCH OBJECT:
The strongest experiment is no longer:

“What is Hogwarts' Assembly Index?”

It is:

CAN DIFFERENT THEORIES OF ASSEMBLY ACTUALLY BUILD THE SAME 6,020-PIECE CASTLE?

Construct a common arena and let them compete.

AGENT A:
shortest reusable-grammar search.

AGENT B:
classical assembly planner.

AGENT C:
BrickNet-style autoregressive graph model.

AGENT D:
LegoGPT-style physics rollback.

AGENT E:
evolutionary assembly graph.

AGENT F:
in-context RL prompt loop.

All receive the same target and physical rules.

LOCAL MOVE:
Turn Assembly Theory from analogy into an adversarial benchmark.

SOURCE TERMS:
“assembly space”
“connectivity”
“build sequence”
“rollback”
“reward”
“selection”

WHAT BECAME STRANGE:
The castle can distinguish concepts that sound identical in lecture form:

shortest description,
shortest construction,
easiest construction,
most learnable construction,
most human construction,
most stable construction,
and historically selected construction

are not obviously the same path.

QUESTION:
Which theory actually gets Hogwarts built?

DEEPER QUESTION:
Which measure best predicts when an unseen assembler gets stuck?

MECHANISM:
TARGET:
complete LDraw castle.

COMPILE:
part-instance graph

exact inventory

connector semantics

collision meshes.


DECOMPOSE:
discover repeated subgraphs/subassemblies.

RUN:
multiple planners/policies.

VERIFY:
every accepted state physically legal.

COMPARE:
trajectory length,
search compute,
rollback count,
reuse,
human similarity,
minimum grammar,
Assembly Index.

FORMAL SHIFT:
<ASSEMBLY THEORY AS EXPLANATION>
→ <MULTIPLE EXECUTABLE ASSEMBLERS>
→ [COMMON CASTLE]
→ <THEORY EARNS ITS CLAIMS THROUGH PERFORMANCE>

SOURCE FORMALISM:
NONE shared across sources.

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

State:

S_t =
{
placed_graph,
remaining_inventory,
available_interfaces,
completed_modules,
history
}

Target:
G* = castle connector graph.

Legal actions:
A(S_t).

Evaluator vector:

E(τ) = {
exact_completion,
physical_validity,
steps,
search_nodes,
wall_time,
rollback,
module_reuse,
description_length,
human_path_similarity
}.

Do not collapse E to one scalar initially.

TENSION:
If the complete target LDraw model is supplied, the problem is sequence reconstruction rather than open-ended design.

If only photographs or geometry are supplied, part inference and design enter the problem.

Those should be separate benchmark tracks.

MISSING:
The complete machine-readable 71043 target with:
instance identity,
inventory alignment,
connector graph,
and preferably official step correspondence.

BOUNDARY:
No cited system has yet demonstrated autonomous exact reconstruction of the full 6,020-piece 71043 castle.

CITATION TRAIL:
[[Z-BRICKNET-HOGWARTS-001]]
→ [[Z-LEGOGPT-ROLLBACK-001]]
→ [[Z-HOGWARTS-ICRL-001]]
→ [[Z-HOGWARTS-EVOLUTION-001]]
→ full-castle arena.

TEST:
Track 0:
100-piece submodel.

Track 1:
500-piece module.

Track 2:
~1,500-piece major section.

Track 3:
full 6,020-piece castle.

Require exact final graph equality.

Record where each paradigm crosses from feasible to intractable.

PLATFORM:
[[HOGWARTS ASSEMBLY ARENA]]

LINKS:
[[Z-BRICKNET-HOGWARTS-001]]
[[Z-LEGOGPT-ROLLBACK-001]]
[[Z-HOGWARTS-ICRL-001]]
[[Z-HOGWARTS-EVOLUTION-001]]
[[Z-ASSEMBLY-COMPRESSION-TEST-001]]

BIBTEX:
@inproceedings{kulits2026bricknet,
author    = {Peter Kulits and Cordelia Schmid},
title     = {BrickNet: Graph-Backed Generative Brick Assembly},
booktitle = {CVPR},
year      = {2026}
}

@inproceedings{pun2025legogpt,
author    = {Ava Pun and Kangle Deng and Ruixuan Liu and Deva Ramanan and Changliu Liu and Jun-Yan Zhu},
title     = {Generating Physically Stable and Buildable LEGO Designs from Text},
booktitle = {ICCV},
year      = {2025}
}

@article{sharma2023assembly,
author  = {Abhishek Sharma and others},
title   = {Assembly Theory Explains and Quantifies Selection and Evolution},
journal = {Nature},
volume  = {622},
pages   = {321--328},
year    = {2023}
}