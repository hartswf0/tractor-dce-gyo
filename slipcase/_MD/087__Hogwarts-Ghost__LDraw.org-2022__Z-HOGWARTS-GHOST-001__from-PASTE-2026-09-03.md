ZETTEL

ID:
Z-HOGWARTS-GHOST-001

TITLE:
The Most Interesting Assembly Object May Be the Part the Final Castle Does Not Contain

SOURCE:
LDraw.org — !CATEGORY and !KEYWORDS Language Extension.
LDraw.org — Parts Library records and histories.
LDraw.org — Official Model Repository Specification.

PASSAGE:
[PARAPHRASE] LDraw parts can carry categories, free-form keywords, author information, update history, base-part relationships, set/theme identifiers, and derivational structure in addition to geometry. A Hogwarts-patterned part record, for example, explicitly identifies a base part and includes Harry Potter/Hogwarts/set keywords while its body recursively references subparts. 28

RESEARCH OBJECT:
LDraw contains a second assembly space that the final geometry does not show:

the historical-cultural space of how parts became thinkable, classifiable, reusable, and available.

A castle depends on:

part genealogy,
standard dimensions,
naming conventions,
themes,
colour system,
mould families,
library authors,
legacy compatibility,
and prior sets.

These are GHOST COMPONENTS.

They constrain construction without appearing as 6,020 visible bricks.

LOCAL MOVE:
Expand assembly history from present components to inherited interfaces.

SOURCE TERMS:
“Base Part”
“Category”
“Keywords”
“History”
“Author”
“Update”
“Alias”
“Set”

WHAT BECAME STRANGE:
The most causally important “part” may be the standard stud interface.

It appears nowhere as one extra castle brick.

Yet almost every legal assembly action depends on it.

Likewise, a base-part lineage can make hundreds of patterned variants possible without redesigning geometry.

QUESTION:
Can Assembly Theory represent inherited standards and interfaces that alter the space of possible future objects without appearing as components in the final object?

DEEPER QUESTION:
Is a shared interface more like an object, a rule, a memory, or an evolutionary prior?

MECHANISM:
historical part ecology
→ standardized interfaces
→ reusable mould families
→ available vocabulary
→ constrained design search
→ castle.

FORMAL SHIFT:
<OBJECT HISTORY = HISTORY OF PRESENT COMPONENTS>
→ <OBJECT HISTORY INCLUDES ABSENT ENABLING CONSTRAINTS>
→ [INHERIT INTERFACE]
→ <EXPANDED CAUSAL LINEAGE>

SOURCE FORMALISM:
LDraw metadata separates geometric content from categories, keywords, authorship, history, and base-part relations. 29

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Let:

O = final object.
B = present components.
R = inherited rules/interfaces.
H = historical availability graph.

Construction possibility:

Possible(O) = f(B,R,H)

even when:

R ∉ visible_parts(O).

TENSION:
Assembly Theory can place physical rules in the definition of assembly space rather than count them as object components.

But then causal history resides partly in the rule set outside the index.

MISSING:
A principled accounting of inherited rule complexity.

BOUNDARY:
LDraw metadata is community-maintained descriptive infrastructure, not direct evidence of LEGO's complete manufacturing history.

CITATION TRAIL:
[[Z-ASSEMBLY-BASIS-LEGO-001]]
→ LDraw base-part derivation
→ standards as inherited constraints
→ enabling ghosts
→ evolution of construction spaces.

TEST:
Remove one inherited rule family at a time from a simulated LEGO universe:

stud connection,
hinges,
Technic pins,
SNOT interfaces,
specific part families.

Measure the collapse in reachable model space while the target object description remains unchanged.

PLATFORM:
[[GHOSTS OF ASSEMBLY SPACE]]

LINKS:
[[Z-ASSEMBLY-BASIS-LEGO-001]]
[[Z-LDRAW-CONNECTION-GAP-001]]
[[Z-PROMPT-DISTRIBUTED-001]]

BIBTEX:
@manual{ldrawcategorykeywords,
author       = {{LDraw.org Standards Committee}},
title        = {!CATEGORY and !KEYWORDS Language Extension},
organization = {LDraw.org},
year         = {2022}
}