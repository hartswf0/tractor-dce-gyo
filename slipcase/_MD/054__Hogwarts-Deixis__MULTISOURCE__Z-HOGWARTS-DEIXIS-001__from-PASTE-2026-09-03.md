ZETTEL

ID:
Z-HOGWARTS-DEIXIS-001

TITLE:
“D — Slab — There” Is Closer to an Assembly Language Than “Slab!”

SOURCE:
Ludwig Wittgenstein — Philosophical Investigations — 1953 — §§2–8.
LDraw.org Standards Board — LDraw File Format Specification — Line Type 1. 3

PASSAGE:
[PARAPHRASE] Wittgenstein expands the builder language with numerals and deictic expressions such as “this” and “there”; LDraw line type 1 identifies a part plus translation and transformation.

RESEARCH OBJECT:
The technically interesting builder game is not the four-word toy vocabulary.

It is the moment the game acquires:

COUNT,
REFERENCE,
PLACE,
ORIENTATION.

“d — slab — there”

already decomposes an assembly operation into:

HOW MANY
WHAT
WHERE.

LDraw adds:

AT WHAT TRANSFORM.

LOCAL MOVE:
Read Wittgenstein's expanded builder game as a proto-interface schema rather than merely an illustration of use.

SOURCE TERMS:
“this”
“there”
numerals
“slab”

LDraw:
translation
transformation matrix
sub-file reference

WHAT BECAME STRANGE:
The path from “Slab!” to LDraw is not primarily an increase in vocabulary.

It is an increase in ADDRESSABILITY.

The language becomes capable of identifying exactly which object, relation, quantity, and place participate in the next state transition.

QUESTION:
What are the irreducible address fields of a LEGO assembly language-game?

DEEPER QUESTION:
Which fields can remain implicit because the current world state resolves them?

MECHANISM:
call
→ resolve part identity
→ resolve multiplicity
→ resolve attachment referent
→ resolve relative pose
→ check legality
→ execute.

FORMAL SHIFT:
<NOUN CALL>
→ <ADDRESSABLE ACTION>
→ [BIND VARIABLES]
→ <LEGAL STATE TRANSITION>

SOURCE FORMALISM:
LDraw type 1 encodes a referenced file, colour, position, and transformation matrix. 4

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Assembly utterance:

U =
{
part,
quantity?,
anchor?,
connector?,
relative_transform?,
target_region?
}

Fields may be omitted iff G_t supplies a unique resolution.

TENSION:
LDraw's pose specification describes final geometry more directly than physical insertion procedure.

MISSING:
An explicit connector/action layer between LDraw placement syntax and physical assembly language.

BOUNDARY:
Addressability does not guarantee buildability.

CITATION TRAIL:
[[Z-HOGWARTS-BUILDER-GAME-001]]
→ expanded builder language
→ LDraw pose language
→ BrickNet connector relations.

TEST:
Create a controlled assembly DSL.

Delete one address field at a time and let contextual inference recover it.

Measure where ambiguity first becomes operationally unsafe.

PLATFORM:
[[HOGWARTS LANGUAGE-GAME]]

LINKS:
[[Z-HOGWARTS-BUILDER-GAME-001]]
[[Z-LDRAW-GRAMMAR-001]]
[[Z-PROMPT-ACTION-ONTOLOGY-001]]

BIBTEX:
@book{wittgenstein1953investigations,
author     = {Ludwig Wittgenstein},
title      = {Philosophical Investigations},
publisher  = {Blackwell},
year       = {1953},
translator = {G. E. M. Anscombe}
}

@manual{ldraw2012format,
author       = {{LDraw.org Standards Board}},
title        = {LDraw File Format Specification},
year         = {2012},
organization = {LDraw.org},
note         = {Revision 1.0.2}
}