ZETTEL

ID:
Z-HOLODECK-CONSTRAINT-COMPILER-001

TITLE:
Let Language Specify Relations; Let a Solver Spend the Coordinates

SOURCE:
Yue Yang et al. — Holodeck: Language Guided Generation of 3D Embodied AI Environments — CVPR 2024. 24

PASSAGE:
[PARAPHRASE] Holodeck uses an LLM to generate spatial relational constraints among scene objects and then uses constraint-based optimization to arrange the 3D assets, rather than asking the LLM to directly solve every coordinate. 25

RESEARCH OBJECT:
This is a powerful alternate reading of prompting 3D geometry.

The LLM need not be the geometric solver.

Its job can be to produce the RIGHT CONSTRAINTS.

For Hogwarts:

“this arch mates concentrically with these studs”
may be a better language-model output than
“place at x=37.44, y=...”

LOCAL MOVE:
Move continuous geometric precision out of language whenever a deterministic solver can own it.

SOURCE TERMS:
“spatial relational constraints”
“constraint-based optimization”
“layout”
“3D assets”

WHAT BECAME STRANGE:
The most effective prompt pipeline may become LESS end-to-end as the geometry gets harder.

Language handles:

semantics,
relations,
decomposition.

Solvers handle:

coordinates,
optimization,
collision,
exact constraint satisfaction.

QUESTION:
Which Hogwarts variables should the LLM never be permitted to choose directly?

DEEPER QUESTION:
Does successful prompt engineering partly mean discovering where language should STOP?

MECHANISM:
natural-language goal
→ infer relational constraints
→ formal constraint graph
→ numerical/geometric solver
→ candidate geometry
→ render/check
→ revise constraints if necessary.

FORMAL SHIFT:
<LLM GENERATES GEOMETRY>
→ <LLM GENERATES CONSTRAINTS>
→ [SOLVER]
→ <GEOMETRY>

SOURCE FORMALISM:
Holodeck explicitly generates spatial relations using an LLM and optimizes layout under those relations. 26

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

LLM:
C = InferConstraints(goal,state)

Solver:
x* = argmin_x Loss(x)
subject to C(x)=true.

TENSION:
A wrong constraint can make the solver perfectly produce the wrong scene.

MISSING:
Constraint provenance and counterexample-based validation.

BOUNDARY:
Holodeck concerns scene layout rather than tight mechanical assembly.

CITATION TRAIL:
[[Z-HOGWARTS-ACTION-GRAMMAR-001]]
→ Holodeck
→ relation compiler
→ mechanical mate solver.

TEST:
Compare direct-coordinate LLM placement against:
LLM-generated constraints + exact solver

for identical 3D assembly tasks.

PLATFORM:
[[LANGUAGE-TO-CONSTRAINT COMPILER]]

LINKS:
[[Z-HOGWARTS-ACTION-GRAMMAR-001]]
[[Z-HOGWARTS-VERIFY-COMPUTE-001]]
[[Z-LDRAW-CONNECTION-GAP-001]]

BIBTEX:
@inproceedings{yang2024holodeck,
author    = {Yue Yang and Fan-Yun Sun and Luca Weihs and Eli VanderBilt and Alvaro Herrasti and Winson Han and Jiajun Wu and Nick Haber and Ranjay Krishna and Lingjie Liu and Chris Callison-Burch and Mark Yatskar and Aniruddha Kembhavi and Christopher Clark},
title     = {Holodeck: Language Guided Generation of 3D Embodied AI Environments},
booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition},
pages     = {16227--16237},
year      = {2024}
}