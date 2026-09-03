ZETTEL

ID:
Z-HOGWARTS-ASSEMBLY-OF-PROMPT-001

TITLE:
The Shortest Castle and the Shortest Language for Building It Are Different Objects

SOURCE:
Sharma et al. — Assembly Theory — 2023.
LDraw.org — File Format Specification.
Peter Kulits and Cordelia Schmid — BrickNet — 2026. 32

PASSAGE:
[PARAPHRASE] Assembly index minimizes recursively reusable construction steps; LDraw permits recursive symbolic subfiles; BrickNet serializes relational build structures for language-model generation.

RESEARCH OBJECT:
The Hogwarts experiment supports at least TWO minimization problems:

MATERIAL MINIMUM:
shortest valid physical path from loose pieces to castle.

CONTROL MINIMUM:
smallest reusable linguistic/programmatic structure capable of reliably generating that physical path.

These need not coincide.

A physically long process may have a tiny control grammar:

“repeat module M twelve times.”

A physically short process may demand complicated context-sensitive instructions.

LOCAL MOVE:
Separate complexity of OBJECT from complexity of ORCHESTRATING THE OBJECT.

SOURCE TERMS:
“assembly index”
“shortest”
“recursive”
“sub-file”
“build sequence”

WHAT BECAME STRANGE:
Assembly Theory asks how hard the object is to assemble.

Prompt praxis asks something orthogonal:

how much control structure is required to reliably cause that assembly?

QUESTION:
What is the relationship between material assembly index and orchestration complexity?

DEEPER QUESTION:
Can an object have high physical assembly depth but low prompt/program description because its history is highly modular?

MECHANISM:
target O
→ physical planner yields τ*
→ orchestration compiler compresses τ*
→ prompt grammar Γ
→ Γ expands conditionally during execution
→ τ* or equivalent path.

FORMAL SHIFT:
<ONE ASSEMBLY INDEX>
→ <OBJECT ASSEMBLY / CONTROL ASSEMBLY>
→ [COMPARE]
→ <TWO COMPLEXITY AXES>

SOURCE FORMALISM:
Assembly Theory defines assembly index as steps on a minimal recursive assembly path. 33

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

A_material(O) =
min physical legal joins.

A_control(O) =
min cost(Γ)
such that:

Execute(Γ, environment)
→ O

with reliability ≥ ρ.

TENSION:
A_control begins to resemble minimum description length or program complexity, reopening the Assembly Theory/compression dispute.

MISSING:
A physically grounded definition of execution cost for Γ.

BOUNDARY:
A compressed control description does not eliminate the material work required to instantiate repeated modules.

CITATION TRAIL:
[[Z-LDRAW-COPY-001]]
→ Assembly Theory
→ grammar compression
→ prompt orchestration
→ physical versus control complexity.

TEST:
Across 100 LEGO models, measure:

physical placement count,
estimated Assembly Index,
LDraw grammar size,
prompt macro grammar size,
planner compute.

Find structures where rankings diverge.

PLATFORM:
[[ASSEMBLY OF ASSEMBLY INSTRUCTIONS]]

LINKS:
[[Z-LDRAW-COPY-001]]
[[Z-ASSEMBLY-COMPRESSION-TEST-001]]
[[Z-PROMPT-HYPOTHESIS-001]]

BIBTEX:
@article{sharma2023assembly,
author  = {Abhishek Sharma and others},
title   = {Assembly Theory Explains and Quantifies Selection and Evolution},
journal = {Nature},
volume  = {622},
pages   = {321--328},
year    = {2023}
}