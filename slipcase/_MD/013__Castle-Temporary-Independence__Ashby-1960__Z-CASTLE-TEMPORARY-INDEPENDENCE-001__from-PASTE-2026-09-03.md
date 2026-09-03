ZETTEL

ID:
Z-CASTLE-TEMPORARY-INDEPENDENCE-001

TITLE:
Ashby Says Learning Requires Parts of the System to Stop Affecting One Another

SOURCE:
W. Ross Ashby — Design for a Brain — 1960 — §11/11, “Temporary Independence.” 36

PASSAGE:
[QUOTE] Ashby writes that if ultrastability is to work quickly, “partial successes must be retained.” 37

RESEARCH OBJECT:
This may be the deepest ghost for LLM context.

Ashby's next move is crucial:

retaining partial successes requires some parts NOT to communicate with or affect some other parts.

That sounds almost exactly like the problem of prompt-context pollution.

You solve the east tower.

Then a later roof failure should not destabilize every validated distinction, macro, state, and policy learned for the east tower.

LOCAL MOVE:
Make CONTEXT ISOLATION a prerequisite for cumulative learning.

SOURCE TERMS:
“partial successes”
“retained”
“temporary independence”
“local stabilities”
“communicate”
“effect”

WHAT BECAME STRANGE:
Maximum information sharing can make adaptation worse.

A giant unified context allows every new error, reflection, hypothesis, and repair to perturb everything already learned.

Modularity is therefore not only a computational convenience.

It may be required to preserve successful regulation.

QUESTION:
Should validated Hogwarts subassemblies become temporarily cognitively independent from unrelated later failures?

DEEPER QUESTION:
Can context boundaries be learned from the causal dependency graph of the assembly rather than chosen manually?

MECHANISM:
solve subsystem H_i
→ validate local policy/state
→ freeze/protect H_i
→ later adaptation occurs in H_j
→ H_i remains unaffected unless dependency edge H_j→H_i demands reopening.

FORMAL SHIFT:
<ONE FULLY CONNECTED LEARNING CONTEXT>
→ <LOCAL STABILITIES>
→ [TEMPORARY INDEPENDENCE]
→ <CUMULATIVE ASSEMBLY LEARNING>

SOURCE FORMALISM:
Ashby argues that retaining partial successes requires restrictions on how components influence one another in the adaptive system. 38

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Let H be the subassembly dependency graph.

Policy memory is partitioned:

M = {M_1,...,M_k}.

Failure in H_j updates M_i only if:

CausalPath(H_j,H_i) exists
or
shared invariant violated.

Otherwise:

M_i remains frozen.

TENSION:
Too much isolation prevents useful transfer between structurally analogous modules.

MISSING:
A mechanism balancing STABILITY against TRANSFER.

BOUNDARY:
Ashby's claim concerns adaptive systems generally, not LLM context architecture specifically.

CITATION TRAIL:
[[Z-HOGWARTS-CONTEXT-EXHAUST-001]]
→ Ashby §11/11
→ temporary independence
→ modular context memories
→ causal reopening.

TEST:
Introduce a late failure in one castle region.

Compare:
global reflection update,
all-memory rewrite,
dependency-local update.

Measure regression in already validated subassemblies.

PLATFORM:
[[ASSEMBLY-AWARE CONTEXT ENGINEERING]]

LINKS:
[[Z-HOGWARTS-CONTEXT-EXHAUST-001]]
[[Z-HOGWARTS-ERROR-COMPILES-POLICY-001]]
[[Z-HOGWARTS-HIERARCHICAL-SLAB-001]]

BIBTEX:
@book{ashby1960design,
author    = {W. Ross Ashby},
title     = {Design for a Brain: The Origin of Adaptive Behaviour},
edition   = {2},
publisher = {Chapman and Hall},
year      = {1960}
}