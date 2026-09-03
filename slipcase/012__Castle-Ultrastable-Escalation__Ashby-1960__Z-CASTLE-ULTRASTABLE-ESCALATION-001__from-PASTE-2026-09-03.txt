ZETTEL

ID:
Z-CASTLE-ULTRASTABLE-ESCALATION-001

TITLE:
Policy Learning Should Begin Only When an Essential Variable Leaves Its Safe Region

SOURCE:
W. Ross Ashby — Design for a Brain — 2nd ed. 1960 — chapters “The Ultrastable System,” “The Homeostat,” “Repetitive Stimuli and Habituation.” 33

PASSAGE:
[PARAPHRASE] Ashby's ultrastable architecture distinguishes ordinary system dynamics from a second-order adaptive process that changes parameters when essential variables move outside acceptable limits; the Homeostat supplies a concrete model of this architecture. 34

RESEARCH OBJECT:
This clarifies the split between:

ATTENTION ROUTING
and
POLICY LEARNING.

A difficult but successfully resolved SNOT junction does not necessarily justify rewriting the policy.

Policy change should be recruited when an ESSENTIAL VARIABLE repeatedly or seriously leaves its admissible region.

Castle essential variables might include:

physical validity,
future reachability,
inventory consistency,
target graph correctness.

LOCAL MOVE:
Reserve meta-adaptation for failures of regulation, not ordinary difficulty.

SOURCE TERMS:
“essential variables”
“limits”
“ultrastable system”
“step-functions”
“adaptation”
“stability”
“recurrent situation”

WHAT BECAME STRANGE:
More reasoning and more learning can move in opposite directions.

A rare knot:
MORE REASONING.
NO POLICY CHANGE.

Repeated connector-selection failure:
LESS LOCAL REASONING.
CHANGE POLICY.

QUESTION:
Can the assembler distinguish exceptional difficulty from evidence that its reusable policy is structurally inadequate?

DEEPER QUESTION:
What should count as an ESSENTIAL VARIABLE for an LLM-mediated construction practice?

MECHANISM:
ordinary policy
→ acts
→ essential variables monitored.

if within safe bounds:
continue.

if outside bounds:
trigger second-order search/change
→ test altered policy
→ retain configuration restoring viability.

FORMAL SHIFT:
<EVERY ERROR → LEARN>
→ <MONITOR ESSENTIAL VARIABLES>
→ [OUT-OF-BOUNDS]
→ <SECOND-ORDER ADAPTATION>

SOURCE FORMALISM:
Ashby's ultrastability introduces a second feedback system that changes parameters when essential variables leave their permitted limits. 35

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Essential vector:

E_t = {
physical_validity,
goal_reachability,
inventory_integrity,
error_rate
}.

If:

E_t ∈ SafeRegion

then:
no policy update.

If:

E_t ∉ SafeRegion

then:
activate POLICY_LOOP.

TENSION:
Binary viability thresholds may discard useful graded performance information.

MISSING:
A principled safe region for long-horizon assembly.

BOUNDARY:
Ashby's ultrastability is not equivalent to modern reinforcement learning.

CITATION TRAIL:
[[Z-HOGWARTS-TWO-CLOCKS-001]]
→ Ashby ultrastability
→ essential variables
→ gated policy learning.

TEST:
Construct four failure classes:

hard one-off,
repeated local error,
reward degradation,
true policy inadequacy.

Compare always-update policy learning against essential-variable-triggered policy learning.

PLATFORM:
[[THREE-LOOP BUILDER GAME]]

LINKS:
[[Z-HOGWARTS-TWO-CLOCKS-001]]
[[Z-HOGWARTS-THREE-LOOPS-001]]
[[Z-HOGWARTS-ERROR-COMPILES-POLICY-001]]

BIBTEX:
@book{ashby1960design,
author    = {W. Ross Ashby},
title     = {Design for a Brain: The Origin of Adaptive Behaviour},
edition   = {2},
publisher = {Chapman and Hall},
year      = {1960}
}