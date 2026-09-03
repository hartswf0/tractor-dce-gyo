ZETTEL

ID:
Z-CASTLE-SPACE-AS-COMPUTATION-001

TITLE:
Arrange the Workspace So the Geometry Performs Some of the Reasoning

SOURCE:
David Kirsh — “The Intelligent Use of Space” — 1995. 44

PASSAGE:
[PARAPHRASE] Kirsh argues that spatial arrangement can simplify choice, simplify perception, and simplify internal computation; managing where objects and work-in-progress are placed is integral to thinking and planning rather than an afterthought. 45

RESEARCH OBJECT:
The Hogwarts sandbox itself can be engineered to lower attention tax.

Do not merely store every loose piece in an unordered digital inventory.

Arrange the workspace so state is perceptually legible:

next-use parts colocated,
completed modules spatially segregated,
dangerous open dependencies visibly marked,
candidate pieces staged beside target interface,
rejected alternatives moved away,
mirrored motifs placed for direct comparison.

The environment becomes a cognitive data structure.

LOCAL MOVE:
Treat WORKSPACE DESIGN as prompt engineering.

SOURCE TERMS:
“spatial arrangements”
“simplify choice”
“simplify perception”
“simplify internal computation”
“work-in-progress”

WHAT BECAME STRANGE:
A model can receive less text and perform better because the 3D sandbox has been reorganized to make the distinction visually obvious.

Prompting can therefore happen by moving objects before saying anything.

QUESTION:
Which spatial reorganizations most reduce the amount of symbolic context required for assembly reasoning?

DEEPER QUESTION:
Should an autonomous prompting agent be allowed to rearrange its own workspace purely to make later cognition easier?

MECHANISM:
difficult perceptual/cognitive state
→ rearrange workspace
→ relevant distinctions become visually/locality salient
→ smaller linguistic representation
→ easier decision.

FORMAL SHIFT:
<PROMPT CHANGES WORDS>
→ <PROMPT PRAXIS CHANGES WORKSPACE>
→ [PERCEPTION BECOMES EASIER]
→ <LESS INTERNAL COMPUTATION>

SOURCE FORMALISM:
Kirsh classifies intelligent spatial arrangements by how they simplify:
choice,
perception,
and internal computation. 46

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Choose spatial operation q to minimize:

C_total =
C_rearrange(q)
+
C_perceive(World after q)
+
C_reason(World after q).

q may leave final castle unchanged.

TENSION:
A digital environment can trivially expose overlays and metadata unavailable in physical assembly.

MISSING:
A matched digital/physical account of workspace manipulation cost.

BOUNDARY:
Spatial simplification is not equivalent to changing the target assembly.

CITATION TRAIL:
[[Z-CASTLE-EPISTEMIC-ACTION-001]]
→ Kirsh intelligent use of space
→ workspace as cognitive artifact
→ nonverbal prompt intervention.

TEST:
Present identical assembly problems under:
unordered parts,
semantic bins,
next-action staging,
automatically optimized workspace.

Measure prompt tokens and solution accuracy.

PLATFORM:
[[PROMPTING AS WORLD ARRANGEMENT]]

LINKS:
[[Z-CASTLE-EPISTEMIC-ACTION-001]]
[[Z-HOGWARTS-PROMPT-UPSTREAM-001]]
[[Z-PROMPT-DISTRIBUTED-001]]

BIBTEX:
@article{kirsh1995space,
author  = {David Kirsh},
title   = {The Intelligent Use of Space},
journal = {Artificial Intelligence},
volume  = {73},
number  = {1--2},
pages   = {31--68},
year    = {1995},
doi     = {10.1016/0004-3702(94)00017-U}
}