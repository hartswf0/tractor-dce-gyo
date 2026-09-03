ZETTEL

ID:
Z-OMNICAD-AGENTIC-ASSEMBLY-001

TITLE:
The Current Frontier Still Breaks on Assemblies Averaging Twelve Parts

SOURCE:
Mingjia Wang et al. — OmniCAD: A Large-Scale Benchmark for 3D Spatial Reasoning in Robotics Assemblies — 2026. 0

PASSAGE:
[PARAPHRASE] OmniCAD contains 25,000 real-world mechanical assemblies averaging 12 component instances, with 21 mate types, multi-view renders, B-Rep and mesh geometry, component poses, and explicit mate graphs. Its agentic condition allows models to request new viewpoints, visualizations, measurements, and geometric conflict checks, then iteratively revise the assembly. Current general-purpose VLMs still produce wrong poses, invalid mate relations, repeated-part errors, interpenetration, and worsening performance as assembly complexity rises. 1

RESEARCH OBJECT:
This is the closest current benchmark to the Hogwarts thought experiment because it finally makes ASSEMBLY REASONING an iterative tool-using problem rather than merely:

image
→ final 3D guess.

But its scale receipt is brutal.

State-of-the-art models already struggle when the average assembly has only about twelve parts.

A 6,020-piece Hogwarts build is therefore not simply a larger OmniCAD problem.

It likely requires a different unit of reasoning.

LOCAL MOVE:
Use OmniCAD's tool-augmented loop as the lower-scale control condition, then test where flat component reasoning collapses and hierarchical subassembly reasoning becomes necessary.

SOURCE TERMS:
“component identification”
“6-DoF”
“mate graph”
“agentic constraint-aware assembly reasoning”
“iterative”
“geometric conflict checks”
“adaptive viewpoint selection”

WHAT BECAME STRANGE:
The multimodal model can have:

the parts,
the target views,
the geometry,
the mate vocabulary,
and tools

and still fail to reconstruct a small mechanism.

This weakens any proposal in which Hogwarts is solved merely by giving an LLM more context.

QUESTION:
At what assembly size does flat tool-augmented VLM reasoning become qualitatively inferior to hierarchical subassembly reasoning?

DEEPER QUESTION:
Is context-window pressure actually the main scaling failure, or do repeated-part identity, mate constraints, and 6-DoF combinatorics dominate first?

MECHANISM:
candidate part library

target views
→ identify instances
→ estimate poses
→ infer mate graph
→ render/check
→ request diagnostic tool
→ receive residual
→ revise assembly
→ repeat.


FORMAL SHIFT:
<ONE-SHOT 3D RECONSTRUCTION>
→ <TOOL-AUGMENTED ASSEMBLY HYPOTHESIS>
→ [MEASURE / RENDER / CHECK]
→ <ITERATIVE PHYSICAL REFINEMENT>

SOURCE FORMALISM:
OmniCAD evaluates PartID, position and rotation accuracy, Chamfer distance, mate-pair F1, mate-type accuracy, graph similarity, collision-free rate, runtime, parse rate, and average agent iterations. 2

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

At scale n:

S_n = {
instances,
poses,
mate_graph,
residuals
}

Compare:

FlatAgent(S_n)

against

HierarchicalAgent(
CompressToSubassemblies(S_n)
).

Find n* where:

Success_hierarchical(n) - Success_flat(n)

becomes persistently positive.

TENSION:
OmniCAD reconstructs completed assemblies from evidence; Hogwarts also asks for a legal CONSTRUCTION TRAJECTORY.

Correct final poses do not establish buildability.

MISSING:
An OmniCAD-like benchmark that couples mate-graph reconstruction to executable assembly order and motion.

BOUNDARY:
OmniCAD does not demonstrate thousand-part assembly reasoning.

CITATION TRAIL:
[[Z-HOGWARTS-ORCHESTRATION-001]]
→ OmniCAD
→ agentic constraint-aware assembly
→ hierarchical scaling test.

TEST:
Run identical agents on assemblies of increasing size while preserving the same mate vocabulary.

Compare:
flat JSON state,
graph state,
two-level subassembly graph,
recursive hierarchy.

Record first catastrophic scaling point for each.

PLATFORM:
[[HOGWARTS ASSEMBLY GAUNTLET]]

LINKS:
[[Z-HOGWARTS-ORCHESTRATION-001]]
[[Z-HOGWARTS-HIERARCHICAL-SLAB-001]]
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]

BIBTEX:
@article{wang2026omnicad,
author  = {Mingjia Wang and others},
title   = {OmniCAD: A Large-Scale Benchmark for 3D Spatial Reasoning in Robotics Assemblies},
journal = {arXiv preprint arXiv:2608.22637},
year    = {2026}
}