ZETTEL

ID:
Z-CASTLE-PRECISION-WEIGHTED-ERROR-001

TITLE:
Not Every Residual Deserves Attention; Attention Should Care How Much the Error Can Be Trusted

SOURCE:
Harriet Feldman and Karl Friston — “Attention, Uncertainty, and Free-Energy” lineage; Karl Friston and colleagues — “Active Inference, Attention, and Motor Preparation” — 2011. 27

PASSAGE:
[PARAPHRASE] In the cited predictive-coding/active-inference account, attention is associated with optimizing the precision assigned to prediction errors so that more reliable sensory discrepancies receive greater gain. 28

RESEARCH OBJECT:
The beaver architecture still needs another variable.

RUNNING WATER matters only if the cue is reliable.

A cheap noisy collision proxy should not summon 8,000 tokens of reasoning every time it flickers.

The interrupt should depend on:

ERROR × CONFIDENCE IN ERROR.

LOCAL MOVE:
Move from RESIDUAL MAGNITUDE to PRECISION-WEIGHTED RESIDUAL.

SOURCE TERMS:
“prediction error”
“precision”
“attention”
“reliability”
“gain”
“proprioceptive channels”

WHAT BECAME STRANGE:
The largest apparent discrepancy may deserve less attention than a smaller but highly reliable violation.

Example:

VLM says “roof looks slightly wrong” with low confidence.

Exact connector checker says “expected stud not engaged.”

The second should dominate even if its natural-language description is shorter.

QUESTION:
Can assembly attention be routed by calibrated confidence in residuals rather than their linguistic salience?

DEEPER QUESTION:
How should several incompatible validators with different reliabilities compete for deliberative attention?

MECHANISM:
expected state
→ observation
→ residual e_i
→ estimate precision π_i
→ weighted residual π_i e_i
→ attention threshold
→ escalate relevant channel.

FORMAL SHIFT:
<ERROR → ATTEND>
→ <ERROR × RELIABILITY>
→ [PRECISION WEIGHT]
→ <ATTENTION>

SOURCE FORMALISM:
The source frames attention as context-dependent optimization of the precision of prediction errors. 29

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

AttentionScore_i =
Precision_i × |Residual_i| × Consequence_i.

Escalate source i if:

AttentionScore_i > θ_i.

TENSION:
The active-inference account is a theory of biological perception/action and should not be silently converted into an LLM mechanism.

MISSING:
Calibrated reliability estimates for castle validators.

BOUNDARY:
High precision does not imply high task importance; consequence must remain separate.

CITATION TRAIL:
[[Z-HOGWARTS-ERROR-RESIDUAL-001]]
→ active-inference precision weighting
→ validator reliability
→ event-triggered attention.

TEST:
Inject known noise levels into visual, collision, force, and graph validators.

Compare:
raw-error routing
versus
precision-calibrated routing.

PLATFORM:
[[ATTENTION ROUTER]]

LINKS:
[[Z-HOGWARTS-ERROR-RESIDUAL-001]]
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
[[Z-HOGWARTS-VERIFY-COMPUTE-001]]

BIBTEX:
@article{friston2011active,
title   = {Active Inference, Attention, and Motor Preparation},
journal = {Frontiers in Psychology},
volume  = {2},
pages   = {218},
year    = {2011},
doi     = {10.3389/fpsyg.2011.00218}
}