ZETTEL

ID:
Z-LDRAW-COPY-001

TITLE:
A Reused LDraw Submodel Is a Pointer, Not Another Physical Castle Piece

SOURCE:
LDraw.org Standards Board — LDraw File Format Specification — line type 1.
Sharma et al. — Assembly theory explains and quantifies selection and evolution — Nature — 2023.

PASSAGE:
[PARAPHRASE] Assembly Theory makes an object constructed along an assembly path available for subsequent reuse. LDraw likewise permits the same file to be referenced repeatedly under different transforms. 10

RESEARCH OBJECT:
The formal resemblance may expose the deepest challenge in applying Assembly Theory to LEGO.

In LDraw:

make submodel definition once
→ reference it ten times.

Computational cost:
almost free.

Physical castle:

build one tower module
→ you still need enough bricks and work to construct the other nine physical copies.

Digital reuse is POINTER REUSE.

Physical reuse requires PRODUCTION.

LOCAL MOVE:
Split discovery cost from copy-production cost at the level of internal subassemblies.

SOURCE TERMS:
Assembly Theory:
“reuse”
“assembly pool”
“copy number”

LDraw:
“sub-file reference”
“transformation”

WHAT BECAME STRANGE:
The shortest symbolic construction history can become dramatically shorter than the shortest physical building process for exactly the same reason a compressed file is shorter than the object it describes.

QUESTION:
When Assembly Theory says a constructed motif remains “available for reuse,” what physical operation corresponds to instantiating another copy?

DEEPER QUESTION:
Is assembly index partly measuring reusable description rather than actual material work?

MECHANISM:
DISCOVERY:
construct motif M once.

SYMBOLIC REUSE:
reference M repeatedly.

PHYSICAL PRODUCTION:
manufacture/assemble additional instances M_1...M_n.

FORMAL SHIFT:
<REUSE AS ONE OPERATION>
→ <DISCOVERY / REFERENCE / PRODUCTION>
→ [SEPARATE COSTS]
→ <THREE ASSEMBLY MEASURES>

SOURCE FORMALISM:
Assembly Theory distinguishes assembly index from copy number and later combines them in an ensemble-level Assembly measure. 11

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

For repeated motif M:

C_description(M,n)
≈ C(M) + n·C(pointer)

C_physical(M,n)
≈ n·C_make(M)

unless a physical replication mechanism itself exists.

TENSION:
Assembly Theory's ensemble-level copy number is intended precisely to add information absent from assembly index alone.

But internal repetition inside one composite and ensemble copy number are not obviously the same quantity.

MISSING:
A formal treatment of repeated physical subassemblies nested within one higher-level object.

BOUNDARY:
LDraw pointer reuse cannot be equated directly with physical replication.

CITATION TRAIL:
[[Z-LDRAW-GRAMMAR-001]]
→ assembly reuse
→ grammar compression
→ copy-number interpretation
→ physical production cost.

TEST:
Construct models with one motif repeated n times.

Compare scaling of:

LDraw compressed size,
minimum grammar,
Assembly Index,
physical brick placements,
physical assembly time.

PLATFORM:
[[REUSE VERSUS REPLICATION]]

LINKS:
[[Z-LDRAW-GRAMMAR-001]]
[[Z-PROMPT-HYPOTHESIS-001]]

BIBTEX:
@article{sharma2023assembly,
author  = {Abhishek Sharma and Dániel Czégel and Michael Lachmann and Christopher P. Kempes and Sara I. Walker and Leroy Cronin},
title   = {Assembly Theory Explains and Quantifies Selection and Evolution},
journal = {Nature},
volume  = {622},
pages   = {321--328},
year    = {2023},
doi     = {10.1038/s41586-023-06600-9}
}