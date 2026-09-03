ZETTEL

ID:
Z-ASSEMBLY-POLICY-001

TITLE:
Assembly Index Gives a Score on the Maze; It Does Not Give the Policy Through It

SOURCE:
Sharma et al. — Assembly theory explains and quantifies selection and evolution — Nature — 2023.
Ma et al. — Planning Assembly Sequence with Graph Transformer — 2022.

PASSAGE:
[PARAPHRASE] Assembly Theory defines the assembly index by minimizing over possible recursively assembled pathways. Assembly-sequence planning is a separate computational problem; LEGO ASP work models assemblies as graphs and learns or searches for feasible orderings. 18

RESEARCH OBJECT:
The analogy:

SELECTIVE MECHANISM = RL POLICY

is useful precisely because it exposes something Assembly Index does not provide.

Assembly Theory gives:

OBJECT
→ shortest possible path length.

A policy gives:

CURRENT STATE
→ NEXT ACTION.

Those are different mathematical objects.

LOCAL MOVE:
Separate metric from controller.

SOURCE TERMS:
“assembly space”
“shortest pathway”
“assembly sequence planning”
“graph”
“sequence”

WHAT BECAME STRANGE:
Knowing Hogwarts has a minimal path of length k does not tell us which brick to place now.

To actually build the castle, something must navigate the space.

That missing something can be:
manual,
planner,
search algorithm,
learned policy,
evolutionary process,
LLM,
or hybrid.

QUESTION:
What policy class can reliably discover a 6,020-piece target through LEGO assembly space?

DEEPER QUESTION:
Can the cost of DISCOVERING the construction policy dwarf the Assembly Index of the final object?

MECHANISM:
metric:
target O
→ all possible paths
→ minimum cost.

policy:
state s_t
→ choose action a_t
→ state s_(t+1)
→ repeat.

FORMAL SHIFT:
<ASSEMBLY COMPLEXITY>
→ <ASSEMBLY CONTROL>
→ [POLICY]
→ <ACTUAL TRAJECTORY>

SOURCE FORMALISM:
Assembly Index:

minimum number of joining operations among assembly paths. 19

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

AI(O) =
min_τ Cost(τ)

but an assembler requires:

π(a | s, O)

or search procedure:

SEARCH(s_0, O) → τ.

TENSION:
Assembly Theory is not advertised as a general-purpose assembly planner, so this is a missing mechanism only when the framework is used to explain how the castle actually gets built.

MISSING:
A measure of policy-discovery complexity distinct from object assembly complexity.

BOUNDARY:
Short path length does not imply easy path discovery.

CITATION TRAIL:
[[Z-PROMPT-SYSTEM-ID-001]]
→ Assembly Index
→ assembly sequence planning
→ policy search
→ RL and ICRL.

TEST:
Construct models with similar Assembly Index but radically different planner search costs.

Ask which better predicts difficulty for humans and AI.

PLATFORM:
[[POLICY OF ASSEMBLY]]

LINKS:
[[Z-PROMPT-SYSTEM-ID-001]]
[[Z-RYLE-EXPERIMENT-001]]

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