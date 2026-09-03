ZETTEL

ID:
Z-CASTLE-SKILL-COMPRESSES-SALIENCE-001

TITLE:
Expertise Should Be Visible as Fewer Things Needing to Stand Out

SOURCE:
Ludger van Dijk et al. — Skilled Intentionality Framework — 2017.
Zhuangzi — Cook Ding passage.
W. Ross Ashby — Design for a Brain — 1960. 48

PASSAGE:
[OUR INFERENCE] Skilled intentionality makes only some affordances solicit action in a given situation; Cook Ding distinguishes routine passage through familiar structure from unusual joints that recruit concentrated caution; Ashby separately studies habituation and adaptation in recurrent situations.

RESEARCH OBJECT:
A better policy should leave a detectable ATTENTIONAL FOSSIL.

The same castle encountered at two stages of expertise should generate different relevance fields.

NOVICE:
everything looks potentially important.

EXPERT:
most structure becomes quiet.

Only deviations from learned regularity solicit costly attention.

This gives a behavioral definition of skill acquisition that is neither:
more knowledge
nor
more chain-of-thought.

Skill is the progressive SILENCING of distinctions that no longer require deliberation.

LOCAL MOVE:
Measure expertise by the entropy of attention-triggering states.

SOURCE TERMS:
“relevant affordances”
“solicitation”
“complicated joint”
“recurrent situation”
“habituation”

WHAT BECAME STRANGE:
Policy learning should change the future ATTENTION DISTRIBUTION.

If the system keeps emitting the same long reasoning traces after mastering a repeated motif, it may have improved output accuracy without developing anything resembling skill.

QUESTION:
Does successful in-context policy learning reduce the number of states that trigger expensive deliberation?

DEEPER QUESTION:
Can failure to compress salience distinguish memorized correctness from genuine routinization?

MECHANISM:
repeated experience
→ stable policy/macro
→ familiar states become high-confidence
→ fewer states cross attention threshold
→ remaining compute concentrates on residual novelty.

FORMAL SHIFT:
<LEARNING → BETTER ANSWERS>
→ <LEARNING → ALTERED SALIENCE DISTRIBUTION>
→ [ROUTINIZATION]
→ <SPARSE DELIBERATION>

SOURCE FORMALISM:
NONE shared.

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

For episode k:

P_k(reason | state).

Skill acquisition predicts:

E_state[P_k(reason|state)] ↓

for mastered state classes,

while:

P_k(reason|novel knot) remains high.

Define:

AttentionCompression(k)

1 -
DeliberativeEvents_k /
PotentialDecisionEvents_k.

TENSION:
A reckless overconfident agent can also deliberate less.

MISSING:
A correctness-preserving definition of attention compression.

BOUNDARY:
Reduced reasoning is evidence of skill only when performance and transfer remain stable.

CITATION TRAIL:
[[Z-HOGWARTS-LEARNING-CONTROL-001]]
→ skilled intentionality
→ Cook Ding
→ habituation
→ attention compression.

TEST:
Repeat structurally homologous castle motifs.

Track:
reasoner calls,
reasoning tokens,
repair rate,
transfer accuracy.

Skill requires falling deliberation without rising error.

PLATFORM:
[[ATTENTION AS LEARNED PRACTICE]]

LINKS:
[[Z-HOGWARTS-LEARNING-CONTROL-001]]
[[Z-CASTLE-COOK-DING-SCHEDULER-001]]
[[Z-CASTLE-FIELD-AFFORDANCES-001]]
[[Z-CASTLE-ULTRASTABLE-ESCALATION-001]]

BIBTEX:
@article{vandijk2017foregrounding,
author  = {Ludger van Dijk and Erik Rietveld and others},
title   = {Foregrounding Sociomaterial Practice in Our Understanding of Affordances: The Skilled Intentionality Framework},
journal = {Frontiers in Psychology},
volume  = {7},
pages   = {1969},
year    = {2017}
}

@book{ashby1960design,
author    = {W. Ross Ashby},
title     = {Design for a Brain},
publisher = {Chapman and Hall},
year      = {1960}
}