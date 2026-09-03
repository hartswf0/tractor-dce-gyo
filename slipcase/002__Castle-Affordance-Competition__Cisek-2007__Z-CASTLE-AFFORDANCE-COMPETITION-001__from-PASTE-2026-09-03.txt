ZETTEL

ID:
Z-CASTLE-AFFORDANCE-COMPETITION-001

TITLE:
Attention May Be an Early Assembly-Action Selector, Not a Better Reader of the Castle

SOURCE:
Paul Cisek — “Cortical Mechanisms of Action Selection: The Affordance Competition Hypothesis” — 2007. 3

PASSAGE:
[PARAPHRASE] Cisek proposes that sensory processing specifies several currently available potential actions in parallel; these compete for further processing while attention and other biases progressively restrict which alternatives survive toward execution. 4

RESEARCH OBJECT:
This is stronger than:

FIRST UNDERSTAND THE WORLD
THEN DECIDE WHAT TO DO.

The Hogwarts system can instead construct several CURRENTLY POSSIBLE ACTIONS directly:

attach roof slope here,
leave cavity open,
retrieve stair module,
close buttress,
inspect failed seat.

Those actions compete.

Attention is partly the process that prevents thousands of other geometrically conceivable possibilities from even becoming fully represented action candidates.

LOCAL MOVE:
Move selective attention BEFORE expensive planning.

SOURCE TERMS:
“affordance competition”
“action specification”
“action selection”
“selective attention”
“potential actions”
“competition”

WHAT BECAME STRANGE:
The LDraw attention tax may come from reversing this architecture.

LDraw encourages:

represent everything precisely
→ reconstruct relations
→ generate actions.

Affordance competition suggests:

extract only currently available potential actions
→ let those compete
→ elaborate the promising few.

QUESTION:
Can a LEGO assembly agent skip full scene serialization by deriving candidate action representations directly from local connector geometry?

DEEPER QUESTION:
How much expensive reasoning disappears if impossible or irrelevant actions are pruned before they ever become linguistic candidates?

MECHANISM:
sensor/world state
→ parallel specification of currently possible actions
→ attentional pruning / bias
→ competition
→ one action receives deeper specification
→ execution.

FORMAL SHIFT:
<WORLD MODEL → PLAN>
→ <WORLD → POTENTIAL ACTIONS>
→ [ATTENTIONAL COMPETITION]
→ <SELECTED MOVE>

SOURCE FORMALISM:
Cisek separates two pragmatic problems:

ACTION SPECIFICATION:
what actions are currently possible and their parameters.

ACTION SELECTION:
which action should actually occur.

Selective attention reduces how much sensory information is transformed into action-related representation. 5

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Instead of:

LLM(Serialize(S_t)) → action

use:

A_t = AffordanceCompiler(S_t)

F_t = AttentionFilter(A_t)

a_t = Deliberate(F_t).

Compute allocation:

B_reason ∝ Ambiguity(F_t)

rather than:

B_reason ∝ Size(S_t).

TENSION:
Some assembly actions depend on distant future constraints invisible in the local affordance set.

Aggressive local pruning can destroy the only globally successful trajectory.

MISSING:
A mechanism for preserving low-salience but high-future-value actions.

BOUNDARY:
The Affordance Competition Hypothesis is a neuroscience hypothesis, not an LLM architecture.

CITATION TRAIL:
[[Z-CASTLE-FIELD-AFFORDANCES-001]]
→ Cisek affordance competition
→ action-first representation
→ pre-deliberative pruning.

TEST:
Hold planner/model constant.

Compare reasoning from:
full serialized state,
full legal action set,
top-k affordance candidates.

Measure token cost, success, and catastrophic-pruning rate.

PLATFORM:
[[ATTENTION-SCALED BUILDER GAME]]

LINKS:
[[Z-CASTLE-FIELD-AFFORDANCES-001]]
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
[[Z-HOGWARTS-ACTION-GRAMMAR-001]]

BIBTEX:
@article{cisek2007affordance,
author  = {Paul Cisek},
title   = {Cortical Mechanisms of Action Selection: The Affordance Competition Hypothesis},
journal = {Philosophical Transactions of the Royal Society B},
volume  = {362},
number  = {1485},
pages   = {1585--1599},
year    = {2007},
doi     = {10.1098/rstb.2007.2054}
}