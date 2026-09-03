ZETTEL

ID:
Z-CASTLE-CONTACT-AS-OBSERVATION-001

TITLE:
The Click Is Not Merely Reward; Contact Reveals Which State the Joint Is Actually In

SOURCE:
“A Simulation Benchmark for Dexterous Peg-in-Hole Assembly With Force-Tactile-Based Pose Estimation Across Multiple Embodiments” — IEEE Access — 2026. 24

PASSAGE:
[PARAPHRASE] The benchmark treats force and tactile data generated during contact as information for closed-loop estimation of insertion pose; contact is used to infer alignment state during the assembly process rather than solely as a success/failure signal. 25

RESEARCH OBJECT:
SEATED should not be modeled merely as:

REWARD = +1.

A stud click or characteristic force signature can be an OBSERVATION that collapses uncertainty about latent physical state.

Before contact:

aligned?
partially engaged?
hovering?
jammed?
correct hole?

After informative contact:

posterior over these possibilities changes.

LOCAL MOVE:
Separate CONTACT-AS-EVIDENCE from CONTACT-AS-REWARD.

SOURCE TERMS:
“force”
“tactile”
“pose estimation”
“contact”
“closed-loop”
“alignment”
“insertion”

WHAT BECAME STRANGE:
A physically grounded builder can become more certain without generating more language.

The world answers through force.

QUESTION:
How much geometric ambiguity can tactile/contact feedback resolve before an LLM needs to deliberate?

DEEPER QUESTION:
Could contact events be compiled into tiny symbolic observations such as SEATED, EDGE_CONTACT, JAMMED, and MISALIGNED without throwing away diagnostically useful structure?

MECHANISM:
candidate insertion
→ contact
→ force/tactile signal
→ infer relative pose/contact mode
→ update physical state estimate
→ continue / withdraw / escalate.

FORMAL SHIFT:
<PLACEMENT → SCORE>
→ <PLACEMENT → CONTACT OBSERVATION>
→ [STATE ESTIMATION]
→ <UPDATED ACTION AFFORDANCES>

SOURCE FORMALISM:
The source's assembly strategy uses force/tactile observations generated at contact for closed-loop pose estimation during peg alignment and insertion. 26

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

latent contact state:

z ∈ {
free,
edge_contact,
aligned,
partial_insert,
jammed,
seated
}.

Observation:

y_t = ForceTactile_t.

Infer:

P(z | y_1:t).

Escalate to language only if:

H[P(z | y_1:t)] > θ.

TENSION:
LEGO clutch-force signatures differ substantially from generic peg-in-hole mechanics.

MISSING:
LEGO-specific tactile data.

BOUNDARY:
A click alone may not uniquely establish correct identity, orientation, or global structural correctness.

CITATION TRAIL:
[[Z-HOGWARTS-ERROR-RESIDUAL-001]]
→ force/tactile pose estimation
→ contact mode inference
→ attention escalation by residual uncertainty.

TEST:
Simulate/measure several LEGO connection states and train a contact-state estimator.

Compare raw sensor context against compact event labels and uncertainty-triggered escalation.

PLATFORM:
[[EMBODIED BUILDER GAME]]

LINKS:
[[Z-HOGWARTS-ERROR-RESIDUAL-001]]
[[Z-CASTLE-MULTIPLE-BODY-SCHEMAS-001]]
[[Z-HOGWARTS-MATERIAL-TALKS-BACK-001]]

BIBTEX:
@article{pegbenchmark2026,
title   = {A Simulation Benchmark for Dexterous Peg-in-Hole Assembly With Force-Tactile-Based Pose Estimation Across Multiple Embodiments},
journal = {IEEE Access},
year    = {2026},
doi     = {10.1109/ACCESS.2026.3709302}
}