ZETTEL

ID:
Z-CASTLE-WORLD-AS-MODEL-001

TITLE:
Serializing Hogwarts May Recompute Information the World Already Possesses

SOURCE:
Rodney A. Brooks — “Intelligence Without Representation” — 1991. 18

PASSAGE:
[QUOTE] Brooks: “It turns out to be better to use the world as its own model.” 19

RESEARCH OBJECT:
This provides a hard opposition to the instinct to build ever richer prompt state.

If the simulator or physical castle can answer:

IS THIS OCCUPIED?
IS THIS CONNECTED?
IS THIS REACHABLE?
IS THIS SUPPORTED?

then copying those answers into a large linguistic representation before every move may be unnecessary duplication.

LOCAL MOVE:
Ask every prompt-state field:

WHY IS THIS BEING REPRESENTED IN LANGUAGE RATHER THAN QUERIED FROM THE WORLD WHEN NEEDED?

SOURCE TERMS:
“real world”
“perception”
“action”
“representation”
“complete systems”
“world as its own model”

WHAT BECAME STRANGE:
A huge context window can become an inferior cached copy of a precise live environment.

The larger the copy becomes, the more opportunities arise for staleness, contradiction, and binding errors.

QUESTION:
Which Hogwarts variables genuinely need persistent internal representation, and which should be read just-in-time from the environment?

DEEPER QUESTION:
Could context length reduction improve correctness even when unlimited context is technically available?

MECHANISM:
world retains exact state
→ current need arises
→ targeted perception/query
→ small transient representation
→ action
→ representation discarded.

FORMAL SHIFT:
<COPY WORLD INTO CONTEXT>
→ <QUERY WORLD JUST IN TIME>
→ [LOCAL REPRESENTATION]
→ <ACT>

SOURCE FORMALISM:
Brooks decomposes intelligence into parallel activity-producing systems interfacing through perception and action rather than making a central explicit world representation the organizing principle. 20

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

For state variable x:

StoreInContext(x)

only if:

RetrievalLatency(x)
+
QueryCost(x)

> 

MemoryCost(x)
+
StalenessRisk(x)
+
InterferenceCost(x).

Otherwise query x from world.

TENSION:
Brooks's strongest anti-representational claims arose from relatively low-level mobile robotics.

Long-horizon construction clearly requires some persistent abstract representation.

MISSING:
A principled representation boundary rather than a blanket anti-representational stance.

BOUNDARY:
“Use the world as its own model” does not imply zero state or zero memory.

CITATION TRAIL:
[[Z-HOGWARTS-CONTEXT-EXHAUST-001]]
→ Brooks
→ world as model
→ just-in-time assembly representation.

TEST:
Ablate cached state fields one by one and replace them with live queries.

Measure context cost, query cost, stale-state failures, and completion.

PLATFORM:
[[ASSEMBLY-AWARE CONTEXT ENGINEERING]]

LINKS:
[[Z-HOGWARTS-CONTEXT-EXHAUST-001]]
[[Z-CASTLE-STIGMERGIC-MEMORY-001]]
[[Z-STATECAD-STRUCTURED-STATE-001]]

BIBTEX:
@article{brooks1991intelligence,
author  = {Rodney A. Brooks},
title   = {Intelligence without Representation},
journal = {Artificial Intelligence},
volume  = {47},
number  = {1--3},
pages   = {139--159},
year    = {1991},
doi     = {10.1016/0004-3702(91)90053-M}
}