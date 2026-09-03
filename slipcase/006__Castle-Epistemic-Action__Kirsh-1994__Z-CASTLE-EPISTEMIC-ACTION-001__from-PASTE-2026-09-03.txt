ZETTEL

ID:
Z-CASTLE-EPISTEMIC-ACTION-001

TITLE:
Sometimes the Right Assembly Move Is One That Learns Rather Than Builds

SOURCE:
David Kirsh and Paul Maglio — “On Distinguishing Epistemic from Pragmatic Action” — 1994. 15

PASSAGE:
[PARAPHRASE] Kirsh and Maglio found that some Tetris rotations and translations are performed not to advance directly toward the final arrangement but to make perceptual or cognitive questions easier to answer; they call these epistemic actions. 16

RESEARCH OBJECT:
This splits the Hogwarts move ontology.

PRAGMATIC MOVE:
place the piece because it belongs there.

EPISTEMIC MOVE:
rotate, temporarily position, probe, render, measure, test-fit, or partially insert the piece because doing so reveals information needed to decide what belongs there.

A failed placement can therefore be useful without becoming part of the castle.

LOCAL MOVE:
Add TEST-FIT and PROBE as first-class actions rather than treating them as planner mistakes.

SOURCE TERMS:
“epistemic action”
“pragmatic action”
“change the world”
“simplify”
“problem-solving”

WHAT BECAME STRANGE:
The injunction:

NEVER MAKE AN INCORRECT MOVE

may make the assembler worse.

A temporary action that increases information can reduce total reasoning cost.

QUESTION:
When is it cheaper for an LLM-agent to manipulate or simulate the geometry than to reason further in language?

DEEPER QUESTION:
Could prompt expertise be measured by choosing cheap epistemic interventions that collapse expensive uncertainty?

MECHANISM:
uncertain relation
→ candidate epistemic action
→ world temporarily changes / new view obtained
→ hidden information becomes easier to perceive
→ belief/action set shrinks
→ pragmatic action follows.

FORMAL SHIFT:
<ACTION = PROGRESS TOWARD CASTLE>
→ <ACTION = PROGRESS OR INFORMATION>
→ [PROBE WORLD]
→ <CHEAPER DECISION>

SOURCE FORMALISM:
Kirsh and Maglio distinguish:

PRAGMATIC ACTION:
moves physically toward a goal.

EPISTEMIC ACTION:
changes the world to make cognitive or perceptual computation easier. 17

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Choose probe p when:

ExpectedInformationGain(p)

> 

Cost(p)
+
ExpectedCostOfMoreInternalReasoning.

Candidate LEGO probes:

test-fit,
rotate view,
temporary insertion,
force sweep,
collision query,
remove neighboring panel.

TENSION:
Physical epistemic actions can damage parts or create irreversible states.

MISSING:
A safe sandbox in which epistemic assembly actions are cheap and reversible.

BOUNDARY:
Not every exploratory move is informative.

CITATION TRAIL:
[[Z-RYLE-EXPERIMENT-001]]
→ Kirsh/Maglio epistemic action
→ physical test-fit as reasoning
→ world-assisted prompt praxis.

TEST:
Construct hidden-fit tasks.

Compare:
language-only reasoning,
tool-query reasoning,
physical/simulated epistemic actions.

Measure total compute and success.

PLATFORM:
[[PROMPTING AS EXPERIMENTAL SCIENCE]]

LINKS:
[[Z-RYLE-EXPERIMENT-001]]
[[Z-HOGWARTS-RYLE-REWARD-001]]
[[Z-HOGWARTS-MATERIAL-TALKS-BACK-001]]

BIBTEX:
@article{kirsh1994epistemic,
author  = {David Kirsh and Paul Maglio},
title   = {On Distinguishing Epistemic from Pragmatic Action},
journal = {Cognitive Science},
volume  = {18},
number  = {4},
pages   = {513--549},
year    = {1994},
doi     = {10.1207/s15516709cog1804_1}
}