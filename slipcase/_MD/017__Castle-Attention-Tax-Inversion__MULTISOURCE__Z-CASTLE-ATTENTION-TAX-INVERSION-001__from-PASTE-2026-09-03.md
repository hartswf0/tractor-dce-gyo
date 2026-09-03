ZETTEL

ID:
Z-CASTLE-ATTENTION-TAX-INVERSION-001

TITLE:
The Attention Tax Is the Cost of Making the Wrong Things Explicit

SOURCE:
Paul Cisek — Affordance Competition — 2007.
David Kirsh — The Intelligent Use of Space — 1995.
Rodney Brooks — Intelligence Without Representation — 1991.
Ludger van Dijk et al. — Skilled Intentionality Framework — 2017. 47

PASSAGE:
[OUR INFERENCE] Across these sources, capable situated action repeatedly depends on avoiding full explicit reconstruction: use the environment directly, structure the environment to simplify cognition, select among currently available actions, and let only a field of relevant affordances stand out.

RESEARCH OBJECT:
ATTENTION TAX should not mean:

TOKENS ARE EXPENSIVE.

A stronger definition is:

THE COST INCURRED WHEN INFORMATION THAT COULD REMAIN IMPLICIT IN WORLD, SKILL, AFFORDANCE, TOOL, OR LOCAL STATE IS FORCED THROUGH AN EXPLICIT GENERAL-PURPOSE REPRESENTATION BEFORE ACTION.

LDraw is pathological when it forces the model to repeatedly convert:

coordinates
→ relations
→ affordances
→ action candidates.

The tax comes from REPRESENTATIONAL DETOUR.

LOCAL MOVE:
Define attention tax relative to the minimum representation required for competent next action.

SOURCE TERMS:
“selective attention”
“potential actions”
“world as its own model”
“simplify internal computation”
“field of relevant affordances”

WHAT BECAME STRANGE:
A shorter prompt can still have a huge attention tax if it encodes the task in the wrong variables.

A longer relational prompt may have lower tax if it presents exactly the distinctions needed for action.

QUESTION:
Can attention tax be empirically separated from token count?

DEEPER QUESTION:
What is the optimal intermediate representation between a complete physical world and a generative model's next-token interface?

MECHANISM:
world contains task-relevant regularities
→ representation R extracts some variables
→ reasoner must reconstruct missing actionable relations
→ choose action.

Tax depends on reconstruction burden induced by R.

FORMAL SHIFT:
<ATTENTION TAX = CONTEXT LENGTH>
→ <ATTENTION TAX = REPRESENTATIONAL DETOUR>
→ [MEASURE RECONSTRUCTION WORK]
→ <ACTION-RELATIVE COST>

SOURCE FORMALISM:
NONE shared.

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

For representation R and task τ:

T_attn(R,τ) =
C_encode(R)
+
C_recover_affordances(R,τ)
+
C_bind(R,τ)
+
C_select(R,τ)
+
C_repair_errors(R,τ).

Compare against direct actionable representation R*.

Representational overhead:

ΔT =
T_attn(R,τ)

T_attn(R*,τ).

TENSION:
Internal LLM computation is not directly observable from output tokens or latency.

MISSING:
Behavioral proxies for hidden reconstruction work.

BOUNDARY:
The equation is an experimental construct, not a transformer-complexity theorem.

CITATION TRAIL:
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
→ affordance competition
→ intelligent spatial arrangement
→ world-as-model
→ representation-relative attention tax.

TEST:
Encode the same exact LEGO state as:

raw LDraw,
natural-language description,
connector graph,
affordance list,
deictic working field.

Hold model and target constant.

Measure:
tokens,
latency,
tool calls,
reasoning length,
binding errors,
action accuracy.

PLATFORM:
[[ATTENTION TAX BENCHMARK]]

LINKS:
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
[[Z-LDRAW-GRAMMAR-001]]
[[Z-CASTLE-FIELD-AFFORDANCES-001]]
[[Z-CASTLE-AFFORDANCE-COMPETITION-001]]

BIBTEX:
@article{cisek2007affordance,
author  = {Paul Cisek},
title   = {Cortical Mechanisms of Action Selection: The Affordance Competition Hypothesis},
journal = {Philosophical Transactions of the Royal Society B},
volume  = {362},
pages   = {1585--1599},
year    = {2007}
}

@article{kirsh1995space,
author  = {David Kirsh},
title   = {The Intelligent Use of Space},
journal = {Artificial Intelligence},
volume  = {73},
pages   = {31--68},
year    = {1995}
}

@article{brooks1991intelligence,
author  = {Rodney A. Brooks},
title   = {Intelligence without Representation},
journal = {Artificial Intelligence},
volume  = {47},
pages   = {139--159},
year    = {1991}
}