ZETTEL

ID:
Z-HOGWARTS-SOTA-SCALE-LADDER-001

TITLE:
Hogwarts Should Be a Scaling Experiment, Not a Single Heroic Run

SOURCE:
Yunsheng Tian et al. — ASAP — 2024.
Danrui Li et al. — AssemblyBench — 2026.
Mingjia Wang et al. — OmniCAD — 2026.
Minho Heo et al. — FurnitureBench — 2023. 50

PASSAGE:
[PARAPHRASE] Current assembly benchmarks occupy very different regimes: contact-level robotic assembly, furniture-scale long-horizon manipulation, industrial objects with part trajectories, and mechanical CAD assemblies with mate graphs and agentic tool use. None approaches an exact thousands-of-components language-model assembly benchmark. 51

RESEARCH OBJECT:
The Hogwarts challenge is most scientifically useful if the 6,020-piece castle is the END OF A CURVE.

Not:

“Can GPT build Hogwarts?”

Instead:

WHERE DOES EACH ARCHITECTURE BREAK?

10 parts.
25.
50.
100.
250.
500.
1,000.
2,500.
6,020.

At each scale record whether the failure came from:

representation,
planning,
reasoning,
context,
tool latency,
geometry,
physics,
memory,
or policy.

LOCAL MOVE:
Turn the castle into a scaling law for prompt orchestration.

SOURCE TERMS:
“assembly”
“long-horizon”
“physical feasibility”
“agentic”
“complexity”
“benchmark”

WHAT BECAME STRANGE:
The first important result may be FAILURE AT 87 PARTS.

A clean phase transition in orchestration can teach more than an opaque successful 6,020-piece demo.

QUESTION:
Which architecture exhibits the slowest degradation with assembly depth?

DEEPER QUESTION:
Do qualitative regime changes appear—for example, a point where flat prompting suddenly needs hierarchy, then hierarchy suddenly needs memoization, then memoization suddenly needs policy learning?

MECHANISM:
choose target family with increasing n
→ run fixed architectures
→ log resources and failure type
→ identify scaling curves
→ introduce one new mechanism
→ rerun.

FORMAL SHIFT:
<HERO DEMO>
→ <SCALING CURVE>
→ [CONTROLLED FAILURE]
→ <ARCHITECTURAL PHASE TRANSITIONS>

SOURCE FORMALISM:
NONE shared across sources.

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

For architecture A:

Success_A(n)
Cost_A(n)
Rollback_A(n)
Context_A(n)
PlanningNodes_A(n)

Find breakpoints:

n_hierarchy
n_memory
n_policy
n_physics.

TENSION:
LEGO structures of equal part count can have radically different structural difficulty.

MISSING:
A structural-complexity variable beyond n:
mate density,
repetition,
treewidth,
insertion depth,
symmetry,
part entropy.

BOUNDARY:
Piece count alone is not assembly complexity.

CITATION TRAIL:
[[Z-HOGWARTS-DOUBLE-BENCHMARK-001]]
→ current assembly benchmarks
→ controlled scale ladder
→ full Hogwarts.

TEST:
Construct a benchmark family from real Hogwarts subgraphs selected to vary independently in:

part count,
repetition,
mate-graph treewidth,
assembly depth,
symmetry.

Run every orchestration architecture on the same ladder.

PLATFORM:
[[HOGWARTS ASSEMBLY GAUNTLET]]

LINKS:
[[Z-HOGWARTS-DOUBLE-BENCHMARK-001]]
[[Z-OMNICAD-AGENTIC-ASSEMBLY-001]]
[[Z-ASSEMBLYBENCH-TRAJECTORY-001]]
[[Z-ASAP-DISASSEMBLY-001]]

BIBTEX:
@article{wang2026omnicad,
author  = {Mingjia Wang and others},
title   = {OmniCAD: A Large-Scale Benchmark for 3D Spatial Reasoning in Robotics Assemblies},
journal = {arXiv preprint arXiv:2608.22637},
year    = {2026}
}

@inproceedings{li2026assemblybench,
author    = {Danrui Li and others},
title     = {AssemblyBench: Physics-Aware Assembly of Complex Industrial Objects},
booktitle = {CVPR},
year      = {2026}
}

@inproceedings{tian2024asap,
author    = {Yunsheng Tian and others},
title     = {ASAP: Automated Sequence Planning for Complex Robotic Assembly with Physical Feasibility},
booktitle = {ICRA},
year      = {2024}
}