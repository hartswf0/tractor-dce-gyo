ZETTEL

ID:
Z-HOGWARTS-EVOLUTION-001

TITLE:
Evolutionary Search Should Mutate Assemblies, Not 6,020 Independent Coordinates

SOURCE:
Maxim Peysakhov and William C. Regli — Using assembly representations to enable evolutionary design of Lego structures — AI EDAM — 2003.
Sangyeop Lee et al. — Finding an Optimal LEGO Brick Layout of Voxelized 3D Object Using a Genetic Algorithm — GECCO 2015.

PASSAGE:
[PARAPHRASE] Peysakhov and Regli evolve LEGO designs represented as labeled assembly graphs, with crossover and mutation applied to the representation. Lee et al. optimize LEGO layouts using genetic search while explicitly rewarding connectivity and low brick count. 26

RESEARCH OBJECT:
Evolutionary algorithms already tell us why the representation matters.

Do not mutate:

x,y,z coordinates of 6,020 unrelated bricks.

Mutate:

modules,
connector edges,
repeated subgraphs,
roof grammars,
tower grammars,
bridge grammars,
subassembly ordering.

Then selection operates on meaningful heritable structure.

LOCAL MOVE:
Make recursive subassembly the genotype.

SOURCE TERMS:
“assembly graph”
“genetic algorithm”
“mutation”
“crossover”
“connectivity”
“fitness”

WHAT BECAME STRANGE:
Assembly Theory speaks of selection navigating assembly space.

Evolutionary computation gives us an executable mechanism that literally does this.

But the trajectory it discovers need not be the shortest path.

Selection optimizes fitness under representation and operators, not Assembly Index.

QUESTION:
What structures become heritable when the genotype is an LDraw/connector subassembly graph?

DEEPER QUESTION:
Can repeated Hogwarts motifs emerge as evolutionary modules before we tell the search that they are modules?

MECHANISM:
population of partial assembly programs
→ evaluate against castle target + physics
→ select
→ graph crossover
→ graph mutation
→ retain reusable motifs
→ repeat.

FORMAL SHIFT:
<SELECTION AS EXPLANATORY WORD>
→ <EXPLICIT EVOLUTIONARY OPERATOR>
→ [MUTATE / SELECT]
→ <OBSERVED LINEAGES THROUGH ASSEMBLY SPACE>

SOURCE FORMALISM:
Peysakhov and Regli use labeled assembly graphs and genetic operators to evolve LEGO assemblies. 27

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Genome:
hierarchical connector graph/program.

Fitness:
F =
target_similarity

physical_stability

connectivity

reusable_module_bonus


illegal_parts

collision

excess_steps.


TENSION:
Rewarding reuse explicitly risks baking Assembly Theory's desired conclusion into the fitness function.

MISSING:
A neutral experiment in which repeated modules may or may not emerge.

BOUNDARY:
Evolutionary search finding a castle does not demonstrate that natural biological evolution follows the same search process.

CITATION TRAIL:
[[Z-ASSEMBLY-POLICY-001]]
→ evolutionary LEGO assembly
→ graph genotype
→ modularity
→ artificial selection in assembly space.

TEST:
Run paired evolutionary searches:

A. no reuse reward.
B. reuse/compression reward.

Compare whether repeated architectural motifs emerge spontaneously and whether they improve exact-target search.

PLATFORM:
[[EVOLUTION IN ASSEMBLY SPACE]]

LINKS:
[[Z-ASSEMBLY-POLICY-001]]
[[Z-LDRAW-GRAMMAR-001]]

BIBTEX:
@article{peysakhov2003assembly,
author  = {Maxim Peysakhov and William C. Regli},
title   = {Using Assembly Representations to Enable Evolutionary Design of Lego Structures},
journal = {AI EDAM},
volume  = {17},
number  = {2},
pages   = {155--168},
year    = {2003},
doi     = {10.1017/S0890060403172046}
}

@inproceedings{lee2015lego,
author    = {Sangyeop Lee and Jinhyun Kim and Jae Woo Kim and Byung-Ro Moon},
title     = {Finding an Optimal LEGO Brick Layout of Voxelized 3D Object Using a Genetic Algorithm},
booktitle = {Proceedings of GECCO},
pages     = {1215--1222},
year      = {2015},
doi       = {10.1145/2739480.2754667}
}