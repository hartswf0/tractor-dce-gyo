ZETTEL

ID:
Z-CASTLE-COOK-DING-SCHEDULER-001

TITLE:
Cook Ding Does Not Think More Everywhere; He Changes Regime at the Complicated Joint

SOURCE:
Zhuangzi — Inner Chapters — “Nourishing the Lord of Life” / Cook Ding passage — received text; English translation available through Chinese Text Project. 39

PASSAGE:
[PARAPHRASE] Cook Ding describes ordinary cutting as following the natural openings of the ox, but when he encounters a complicated joint he becomes cautious, fixes attention on the place, and moves slowly and subtly. 40

RESEARCH OBJECT:
This is a far more precise model of adaptive reasoning than:

NOVICE = LITTLE COT
EXPERT = LOTS OF COT.

Cook Ding's skill produces heterogeneous computation.

ROUTINE OPENING:
structure carries action.

COMPLICATED JOINT:
attention narrows,
speed drops,
local precision rises.

Expertise changes WHERE computation is concentrated.

LOCAL MOVE:
Turn “complicated joint” into an executable assembly-state classifier.

SOURCE TERMS:
“natural lines”
“crevices”
“cavities”
“complicated joint”
“caution”
“slowly”
“subtlety”

WHAT BECAME STRANGE:
The master may expend dramatically less total explicit cognition than the novice while spending dramatically MORE on the few states that resist routinized passage.

QUESTION:
Can reasoning quality be improved by making compute variance across assembly states larger rather than simply increasing average reasoning length?

DEEPER QUESTION:
Does expertise appear as an increasingly sparse distribution of high-compute states?

MECHANISM:
state encountered
→ test whether learned structural passage applies.

if yes:
flow through low-cost policy.

if no:
mark KNOT
→ narrow attention
→ slow execution
→ increase local search/verification.

FORMAL SHIFT:
<EXPERT = MORE REASONING>
→ <EXPERT = CHEAP PASSAGE + EXPENSIVE KNOTS>
→ [STATE-DEPENDENT REGIME SWITCH]
→ <SPARSE HIGH-COMPUTE DELIBERATION>

SOURCE FORMALISM:
NONE in modern computational syntax.

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

KnotScore_t =
f(
novelty,
constraint density,
validator disagreement,
branching,
irreversibility,
policy confidence
).

Reasoning budget:

B_t =
B_low
if KnotScore_t < θ

else

B_high(KnotScore_t).

Expertise prediction:

Var(B_t) ↑
while
Mean(B_t) may ↓.

TENSION:
Cook Ding is philosophical/literary evidence, not empirical evidence for optimal compute allocation in LLMs.

MISSING:
A measurable definition of KNOT independent of model self-confidence.

BOUNDARY:
The story should generate an experimental architecture, not be treated as proof of it.

CITATION TRAIL:
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
→ Cook Ding complicated joint
→ adaptive compute variance
→ sparse reasoning events.

TEST:
Compare fixed token budgets against knot-triggered budgets with equal total compute.

Measure success specifically at high-constraint junctions.

PLATFORM:
[[COOK DING COMPUTE SCHEDULER]]

LINKS:
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
[[Z-HOGWARTS-TWO-CLOCKS-001]]
[[Z-CASTLE-EVENT-TRIGGERED-THOUGHT-001]]

BIBTEX:
@book{zhuangziinner,
author = {{Zhuangzi}},
title  = {Inner Chapters: Nourishing the Lord of Life},
note   = {Cook Ding passage; received pre-Qin text}
}