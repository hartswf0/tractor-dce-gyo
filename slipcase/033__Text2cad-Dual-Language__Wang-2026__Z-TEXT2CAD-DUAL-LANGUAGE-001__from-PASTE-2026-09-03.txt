ZETTEL

ID:
Z-TEXT2CAD-DUAL-LANGUAGE-001

TITLE:
The Same Geometry Can Be Prompted as Appearance or as Procedure

SOURCE:
Liang Wang et al. — Text2CAD-Bench: A Benchmark for LLM-based Text-to-Parametric CAD Generation — 2026. 42

PASSAGE:
[PARAPHRASE] Text2CAD-Bench contains 600 human-curated examples across four complexity levels. Each target is paired with two prompt styles: geometric descriptions resembling non-expert descriptions of what the object is like, and procedural sequences resembling expert instructions for how to construct it. Performance falls sharply on complex topology, freeform surfaces, and advanced features. 43

RESEARCH OBJECT:
This is almost a ready-made benchmark for:

PROMPT AS EKPHRASIS

versus

PROMPT AS PROGRAM-LIKE PROCEDURE.

The target can stay constant while the LANGUAGE GAME changes.

LOCAL MOVE:
Use dual prompt styles to test prompt ontology empirically instead of debating whether prompts are more like poems or programs.

SOURCE TERMS:
“geometric descriptions”
“procedural sequences”
“L1”
“L2”
“L3”
“L4”
“complex topology”

WHAT BECAME STRANGE:
More explicit procedure may help because it supplies construction history.

But geometric description may allow the model to choose a better construction history than the user would have specified.

Neither should dominate uniformly.

QUESTION:
At what complexity does procedural language begin outperforming descriptive language, and where does it overconstrain generation?

DEEPER QUESTION:
Can an iterative agent migrate between modes:
description → procedure → shorthand,
as shared state stabilizes?

MECHANISM:
same target O
→ descriptive prompt D
OR
procedural prompt P
→ generated CAD
→ execution
→ geometric/topological evaluation.

FORMAL SHIFT:
<ONE PROMPT BENCHMARK>
→ <TWO LANGUAGE GAMES, SAME TARGET>
→ [COMPARE BY COMPLEXITY]
→ <CONDITIONAL PROMPT ONTOLOGY>

SOURCE FORMALISM:
Text2CAD-Bench explicitly separates four levels of geometric complexity and pairs each example with non-expert geometric and expert procedural descriptions. 44

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

For complexity c:

Δ(c) =
Score(procedural,c)

Score(descriptive,c).

Do not assume sign(Δ) is constant.

TENSION:
A generated benchmark description does not reproduce the situated iterative work of an expert designer.

MISSING:
Longitudinal prompt trajectories where users switch representational mode during construction.

BOUNDARY:
Text2CAD-Bench concerns object generation, not embodied assembly.

CITATION TRAIL:
[[Z-PROMPT-POLYMORPH-001]]
→ Text2CAD-Bench dual prompts
→ operative ekphrasis
→ description/procedure switching.

TEST:
Take identical castle subassemblies and expose agents to:

final render description,
procedural build sequence,
both,
description with tools.

Stratify by structural complexity.

PLATFORM:
[[PROMPT TYPE BENCHMARK]]

LINKS:
[[Z-PROMPT-POLYMORPH-001]]
[[Z-PROMPT-POEM-001]]
[[Z-PROMPT-PROGRAM-001]]
[[Z-OPERATIVE-EKPHRASIS-THICK-001]]

BIBTEX:
@article{wang2026text2cadbench,
author  = {Liang Wang and Heng Meng and Zekai Xiang and Jin Liu and Pingyi Zhou and Litao Chen and Yongqiang Tang},
title   = {Text2CAD-Bench: A Benchmark for LLM-based Text-to-Parametric CAD Generation},
journal = {arXiv preprint arXiv:2605.18430},
year    = {2026}
}