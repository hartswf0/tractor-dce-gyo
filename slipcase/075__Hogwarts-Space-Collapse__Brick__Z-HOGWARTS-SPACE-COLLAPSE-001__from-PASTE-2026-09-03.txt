ZETTEL

ID:
Z-HOGWARTS-SPACE-COLLAPSE-001

TITLE:
The Hogwarts Search Space Is Not 17,116 Parts

SOURCE:
Brick Bag Inventory — LEGO 71043 Hogwarts Castle inventory.
BrickLink — Inventory of Set 71043-1.
LDraw.org — Parts Library — 2026-08.

PASSAGE:
[PARAPHRASE] Set 71043 contains 6,020 nominal pieces. One bag-level inventory represents those as 628 lots across 37 numbered bags; BrickLink's regular inventory contains hundreds rather than thousands of distinct part lots. 7

RESEARCH OBJECT:
If the target is the actual 71043 Hogwarts Castle, an AI should almost never search the entire 17,116-shape LDraw library.

The box already supplies an enormous amount of selection.

Its inventory collapses the alphabet from:

17,116 possible shapes

to:

roughly hundreds of permitted part/colour lots

with fixed multiplicities summing to 6,020 pieces.

LOCAL MOVE:
Treat inventory as a massive prior constraint rather than an incidental lookup table.

SOURCE TERMS:
“inventory”
“lot”
“quantity”
“part”
“colour”
“bag”

WHAT BECAME STRANGE:
The LEGO set box is itself a causal artifact.

Before the first instruction step, somebody has already:

selected the vocabulary,
selected copy numbers,
selected colours,
partitioned parts into bags,
and removed almost the entire LDraw universe.

The assembly problem starts after colossal selection has already happened.

QUESTION:
How much of Hogwarts' apparent assembly difficulty disappears once exact inventory is treated as given information?

DEEPER QUESTION:
Should the informational history encoded by the selected 6,020-piece inventory count toward the castle's assembly measure?

MECHANISM:
global LDraw vocabulary
→ set design
→ inventory selection
→ multiplicity constraints
→ bag partition
→ assembly sequence
→ castle.

FORMAL SHIFT:

<SEARCH 17,116 SHAPES AT EVERY STEP>  
→ <SEARCH REMAINING INVENTORY>  
→ [CONSUME ONE COPY]  
→ <SHRINKING ACTION SPACE>  SOURCE FORMALISM:
NONE

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

At state t:

A_t =
{
(pose, part, colour)
:
inventory_remaining(part,colour) > 0
∧ physically_legal(...)
}

not:

A_t = 17,116 × all poses.

TENSION:
If the research goal is to reconstruct the castle from only a target surface or photograph, the inventory cannot simply be assumed.

Then inventory inference becomes part of the problem.

MISSING:
Two benchmark regimes:

KNOWN INVENTORY.
UNKNOWN INVENTORY.

BOUNDARY:
628 lots is an inventory grouping, not 628 geometrically unique moulds.

CITATION TRAIL:
[[Z-LDRAW-COUNT-001]]
→ exact 71043 inventory
→ constrained combinatorial search
→ bag structure
→ human manual path.

TEST:
Run the same assembly planner with:

A. whole LDraw library,
B. correct set inventory,
C. correct inventory plus bag order.

Measure branching factor and search cost.

PLATFORM:
[[HOGWARTS ASSEMBLY BENCHMARK]]

LINKS:
[[Z-LDRAW-COUNT-001]]
[[Z-PROMPT-SYSTEM-ID-001]]

BIBTEX:
@misc{brickbag71043,
author = {{Brick Bag Inventory}},
title  = {71043 Hogwarts Castle Bag Inventory},
note   = {6,020 pieces; 628 lots}
}