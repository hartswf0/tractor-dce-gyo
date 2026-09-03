ZETTEL

ID:
Z-LDRAW-COUNT-001

TITLE:
The Current LDraw Number Is 17,116 — but “Part” Is Already an Ontological Choice

SOURCE:
LDraw.org — LDraw.org Parts Library — 2026-08 update.
LDraw.org — Parts List — accessed 2026-09-03.

PASSAGE:
[PARAPHRASE] The 2026-08 official update states that the LDraw Parts Library contains 17,116 “unique shapes or patterned parts.” The unfiltered library interface simultaneously exposes 46,202 file records because the database also contains other file types, statuses, subparts, primitives, shortcuts, variants, stickers, and unofficial material. 0

RESEARCH OBJECT:
Yes: if the question is “How many unique official LDraw shapes or patterned parts are there?”, the current number is much closer to 17k than 24k:

17,116.

But LDraw immediately destabilizes the supposedly obvious Assembly Theory primitive “part.”

The library distinguishes:
part,
subpart,
primitive,
8-segment primitive,
48-segment primitive,
shortcut,
patterned part,
sticker,
alias,
composite,
and model subfile.

The count changes with the ontology.

LOCAL MOVE:
Turn a numerical correction into an assembly-basis problem.

SOURCE TERMS:
“unique shapes”
“patterned parts”
“Part”
“Subpart”
“Primitive”
“Shortcut”
“Official”
“Unofficial”

WHAT BECAME STRANGE:
BrickNet's 2026 paper describes the LDraw ecosystem as containing “over 24,000 CAD replicas,” while LDraw itself currently reports 17,116 unique shapes or patterned parts. 1

Those statements need not contradict each other.

They are probably counting different representational entities.

Before calculating an assembly space, one must decide what counts as one kind of object.

QUESTION:
What exactly should count as an elementary LEGO object for Assembly Theory: LDraw unique shapes, library files, mould designs, element-colour pairs, physical bricks, or geometric primitives?

DEEPER QUESTION:
If changing the library's bookkeeping changes the assembly index, how much of the measured “history” belongs to the object and how much belongs to the chosen representation?

MECHANISM:
physical LEGO ecology
→ LDraw classification rules
→ library entities
→ chosen primitive alphabet
→ assembly-space size
→ computed shortest path.

FORMAL SHIFT:
<THERE ARE ~17K LEGO PARTS>
→ <THERE ARE MULTIPLE NESTED PART ONTOLOGIES>
→ [CHOOSE BASIS]
→ <DIFFERENT ASSEMBLY SPACE>

SOURCE FORMALISM:
LDraw officially distinguishes Part, Subpart, Primitive, 8_Primitive, 48_Primitive, and Shortcut in its file headers. 2

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Let B be the chosen basic-object vocabulary.

Then:

AI_B(O)

rather than simply:

AI(O).

For LEGO:

B_mould
≠ B_element
≠ B_LDrawPart
≠ B_subpart
≠ B_primitive
≠ B_polygon.

TENSION:
Assembly Theory explicitly permits different object classes to have different well-defined building blocks, so basis dependence is not automatically a refutation.

The stronger question is whether cross-basis claims about “depth,” “history,” or “selection” remain invariant enough to support the interpretation.

MISSING:
Assembly indices for the same LEGO object computed under several legitimate LDraw granularities.

BOUNDARY:
17,116 is not the total count of every .dat file or every physical LEGO element ever manufactured.

It is LDraw's current count of unique shapes or patterned parts in the official core library.

CITATION TRAIL:
[[Z-PROMPT-INVARIANT-002]]
→ LDraw library ontology
→ Assembly Theory building-block choice
→ representation-dependent complexity.

TEST:
Download the 2026-08 complete library.

Count separately:
official Parts,
Subparts,
Primitives,
Shortcuts,
patterns,
stickers,
aliases.

Compute a small LEGO model's assembly index under at least three bases.

PLATFORM:
[[LDRAW AS ASSEMBLY SPACE]]

LINKS:
[[Z-PROMPT-INVARIANT-002]]
[[Z-PROMPT-POLYMORPH-001]]

BIBTEX:
@misc{ldraw2026library,
author       = {{LDraw.org}},
title        = {LDraw.org Parts Library},
year         = {2026},
note         = {2026-08 update: 17,116 unique shapes or patterned parts}
}