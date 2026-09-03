ZETTEL

ID:
Z-CASTLE-FIELD-AFFORDANCES-001

TITLE:
The Whole Castle Is the Landscape; Attention Should See Only the Field of Relevant Affordances

SOURCE:
Ludger van Dijk, Erik Rietveld, Julian Kiverstein, and colleagues — “Foregrounding Sociomaterial Practice in Our Understanding of Affordances: The Skilled Intentionality Framework” — 2016/2017. 0

PASSAGE:
[PARAPHRASE] The Skilled Intentionality Framework distinguishes the relatively persistent “landscape of affordances” from the “field of relevant affordances”: the subset that currently stands out as significant to a skilled individual in a concrete situation. 1

RESEARCH OBJECT:
This gives the Hogwarts attention problem a much better ontology than CONTEXT WINDOW.

The completed castle exposes a LANDSCAPE:

thousands of pieces,
open and closed connectors,
possible insertions,
supports,
dependencies,
motifs,
subassemblies.

But competent action requires a FIELD:

the few affordances that currently solicit action.

The attention router should therefore not summarize Hogwarts.

It should continuously construct the CURRENT FIELD OF RELEVANT ASSEMBLY AFFORDANCES.

LOCAL MOVE:
Replace:
WHAT PART OF THE CASTLE SHOULD ENTER CONTEXT?

with:

WHICH CURRENT ACTION POSSIBILITIES SHOULD STAND OUT?

SOURCE TERMS:
“landscape of affordances”
“field of relevant affordances”
“solicitation”
“skilled intentionality”
“action readiness”
“selective engagement”

WHAT BECAME STRANGE:
The scalable representation may not be a compressed castle at all.

It may be a dynamically changing set of solicitations such as:

SEAT THIS CONNECTION.
KEEP THIS CAVITY OPEN.
REPEAT THIS MOTIF.
THIS JOINT IS TANGLED.
THIS MODULE IS READY TO CLOSE.

Expertise then changes not only which action is selected but which parts of the world become experientially relevant enough to compete for action.

QUESTION:
Can assembly competence be measured by how accurately an agent constructs the right field of relevant affordances from a much larger assembly landscape?

DEEPER QUESTION:
Does expertise reduce reasoning cost primarily by improving solutions, or by preventing irrelevant possibilities from becoming candidates for deliberation in the first place?

MECHANISM:
complete assembly landscape
→ agent abilities + current concerns + current state
→ affordances become differentially salient
→ small field of relevant affordances
→ action selection.

FORMAL SHIFT:
<COMPLETE CASTLE STATE>
→ <LANDSCAPE OF POSSIBLE ACTIONS>
→ [SKILL-CONDITIONED RELEVANCE]
→ <FIELD OF CURRENT SOLICITATIONS>

SOURCE FORMALISM:
The source distinguishes:
LANDSCAPE OF AFFORDANCES
from
FIELD OF RELEVANT AFFORDANCES

and characterizes skilled intentionality as selective engagement with multiple affordances in a concrete situation. 2

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Let:

A(S_t) = all currently available assembly affordances.

The attention router constructs:

F_t ⊂ A(S_t)

where:

F_t =
TopRelevant(
A(S_t),
current_goal,
skill_memory,
residuals,
future_dependencies
).

Reasoning cost should scale primarily with |F_t|,
not with |S_t|.

TENSION:
The ecological literature concerns skilled biological agents embedded in forms of life.

An engineered relevance filter can imitate the functional distinction without establishing phenomenological equivalence.

MISSING:
An operational metric for FIELD QUALITY.

BOUNDARY:
Not every legally available connector should count as a relevant affordance.

CITATION TRAIL:
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
→ Skilled Intentionality Framework
→ landscape / field distinction
→ relevance-filtered assembly state.

TEST:
For each Hogwarts move obtain the legal action set A(S_t).

Compare:
full action set,
random k actions,
heuristic frontier,
learned field-of-affordances router.

Measure whether the correct eventual action survives pruning while irrelevant candidates disappear.

PLATFORM:
[[ATTENTION-SCALED BUILDER GAME]]

LINKS:
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
[[Z-HOGWARTS-PROMPT-IS-CONTROL-LAW-001]]
[[Z-LDRAW-CONNECTION-GAP-001]]

BIBTEX:
@article{vandijk2017foregrounding,
author  = {Ludger van Dijk and Erik Rietveld and others},
title   = {Foregrounding Sociomaterial Practice in Our Understanding of Affordances: The Skilled Intentionality Framework},
journal = {Frontiers in Psychology},
volume  = {7},
pages   = {1969},
year    = {2017},
doi     = {10.3389/fpsyg.2016.01969}
}