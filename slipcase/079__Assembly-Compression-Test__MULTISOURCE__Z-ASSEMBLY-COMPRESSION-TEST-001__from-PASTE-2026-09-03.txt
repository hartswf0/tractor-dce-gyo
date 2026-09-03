ZETTEL

ID:
Z-ASSEMBLY-COMPRESSION-TEST-001

TITLE:
LDraw Can Make the Assembly-Theory Compression Dispute Empirical

SOURCE:
Abrahão et al. — Assembly Theory is an approximation to algorithmic complexity based on LZ compression that does not explain selection or evolution — PLOS Complex Systems — 2024.
Kempes et al. — Assembly theory and its relationship with computational complexity — npj Complexity — 2025.
Ozelim et al. — Assembly theory collapses to dictionary compression and is rendered redundant by common statistical algorithms — npj Complexity — 2026.

PASSAGE:
[PARAPHRASE] Critics argue that assembly index is fundamentally a dictionary/grammar-compression construction and identify it with minimal context-free grammar structure. Assembly Theory's authors dispute formal equivalence to standard compression algorithms and argue that AT's physically realizable joining operations and copy number address a different causal question. The dispute remains active in peer-reviewed literature. 14

RESEARCH OBJECT:
LEGO/LDraw may be an unusually clean testbed because the two readings can be implemented separately.

COMPRESSION READING:
find the smallest reusable grammar producing the final castle representation.

PHYSICAL-ASSEMBLY READING:
find the shortest path through connector-compatible, collision-free, stable, physically executable intermediate structures.

If the two measures strongly diverge, we have a concrete discriminant.

LOCAL MOVE:
Stop arguing abstractly whether assembly index “is compression.”

Build both objects.

SOURCE TERMS:
“assembly index”
“minimum context-free grammar”
“compression”
“physically implementable”
“copy number”
“selection”

WHAT BECAME STRANGE:
LDraw gives us an actual grammar.

BrickNet/LDCad can give us a physical connection graph.

The same castle can therefore inhabit both mathematical worlds.

QUESTION:
How much of LEGO assembly index is explained by reusable symbolic substructure, and how much is added by physical feasibility constraints?

DEEPER QUESTION:
Do the two measures rank complex LEGO structures differently?

MECHANISM:
target LDraw model
→ minimum reusable grammar G_min.

Separately:

target connector graph
→ physically feasible assembly search
→ minimum physical path H_min.

Compare G_min with H_min.

FORMAL SHIFT:
<ONE CLAIM ABOUT ASSEMBLY INDEX>
→ <TWO EXECUTABLE MODELS>
→ [COMPARE]
→ <EMPIRICAL DISCRIMINATION>

SOURCE FORMALISM:
The competing papers give incompatible formal accounts of the relation between Assembly Index and compression. 15

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

C_grammar(O) =
minimum reusable grammar cost.

C_physical(O) =
minimum legal construction-path cost.

Investigate:

ρ(C_grammar, C_physical)

across many LEGO objects.

TENSION:
Assembly Theory's authors can reasonably answer that the physical object, not the LDraw string, is their intended domain.

That makes connector-constrained physical assembly the essential comparison rather than raw text compression.

MISSING:
A benchmark corpus where both exact geometry and physical connection semantics are available.

BOUNDARY:
The current literature does not establish consensus that Assembly Theory is either fully reducible to or wholly distinct from compression.

CITATION TRAIL:
[[Z-LDRAW-GRAMMAR-001]]
→ smallest grammar
→ AT/compression dispute
→ BrickNet physical graphs
→ LEGO discriminant.

TEST:
For 100–1,000 LDraw models calculate:

gzip size,
smallest grammar approximation,
Assembly Index,
connector-constrained minimum physical sequence.

Look for counterexamples where rankings reverse.

PLATFORM:
[[ASSEMBLY THEORY BENCHMARK]]

LINKS:
[[Z-LDRAW-GRAMMAR-001]]
[[Z-LDRAW-CONNECTION-GAP-001]]

BIBTEX:
@article{abrahao2024assembly,
author  = {Felipe S. Abrahão and Santiago Hernández-Orozco and Narsis A. Kiani and Jesper Tegnér and Hector Zenil},
title   = {Assembly Theory Is an Approximation to Algorithmic Complexity Based on LZ Compression That Does Not Explain Selection or Evolution},
journal = {PLOS Complex Systems},
year    = {2024}
}

@article{kempes2025assembly,
author  = {Christopher P. Kempes and Michael Lachmann and Andrew Iannaccone and G. Matthew Fricke and M. Redwan Chowdhury and Sara I. Walker and Leroy Cronin},
title   = {Assembly Theory and Its Relationship with Computational Complexity},
journal = {npj Complexity},
year    = {2025},
doi     = {10.1038/s44260-025-00049-9}
}