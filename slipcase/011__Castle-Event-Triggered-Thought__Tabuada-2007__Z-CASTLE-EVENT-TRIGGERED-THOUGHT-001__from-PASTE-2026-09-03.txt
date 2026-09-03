ZETTEL

ID:
Z-CASTLE-EVENT-TRIGGERED-THOUGHT-001

TITLE:
The Reasoner Should Be Scheduled by the Castle, Not by the Clock

SOURCE:
Paulo Tabuada — “Event-Triggered Real-Time Scheduling of Stabilizing Control Tasks” — 2007. 30

PASSAGE:
[PARAPHRASE] Tabuada treats a real-time scheduler as a feedback controller and develops event-triggered execution rather than requiring control tasks to run periodically regardless of system state. 31

RESEARCH OBJECT:
This is a technical formulation of:

MOST OF HOGWARTS IS QUIET.

The LLM need not reason after every brick.

A scheduler can decide whether the expensive reasoning task runs at all.

Events might include:

CONTACT_STATE_UNCERTAIN.
DEPENDENCY_AT_RISK.
VALIDATORS_DISAGREE.
MOTIF_NOVEL.
ROLLBACK_THRESHOLD_EXCEEDED.

LOCAL MOVE:
Turn CALL_LLM into an event-triggered control decision.

SOURCE TERMS:
“event-triggered”
“scheduler”
“feedback controller”
“real-time”
“stabilizing control task”

WHAT BECAME STRANGE:
The prompt loop itself need not be periodic.

A system can remain in cheap embodied control for hundreds of actions until the environment crosses a condition requiring higher-order deliberation.

QUESTION:
What event condition minimizes LLM calls without increasing catastrophic assembly errors?

DEEPER QUESTION:
Can the event threshold itself adapt as the builder becomes skilled?

MECHANISM:
cheap controller operates continuously
→ monitor error/uncertainty/dependency variables
→ event condition becomes true
→ schedule expensive reasoner
→ reasoner modifies local plan/policy
→ return to cheap control.

FORMAL SHIFT:
<EVERY MOVE → LLM>
→ <CONTINUOUS CHEAP CONTROL>
→ [EVENT]
→ <SPARSE DELIBERATION>

SOURCE FORMALISM:
Tabuada studies scheduling control tasks based on events rather than fixed periodic execution while preserving stability guarantees for the control setting considered. 32

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

CallReasoner iff:

g(S_t, residual_t, uncertainty_t) ≥ 0.

Candidate:

g =
max_i AttentionScore_i - θ.

Otherwise:

execute cached/reflex policy.

TENSION:
A rare but catastrophic latent dependency may not generate a large local event until it is too late.

MISSING:
Predictive triggers for future irreversibility.

BOUNDARY:
Control-theoretic stability guarantees do not transfer automatically to LLM orchestration.

CITATION TRAIL:
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
→ Tabuada event-triggered control
→ sparse reasoner scheduling
→ predictive assembly interrupts.

TEST:
Compare:

LLM every move,
LLM every N moves,
event-triggered LLM,
predictive-event LLM.

Hold exact assembly task and base policy fixed.

PLATFORM:
[[ATTENTION-SCALED BUILDER GAME]]

LINKS:
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
[[Z-CASTLE-PRECISION-WEIGHTED-ERROR-001]]
[[Z-HOGWARTS-PROMPT-IS-CONTROL-LAW-001]]

BIBTEX:
@article{tabuada2007event,
author  = {Paulo Tabuada},
title   = {Event-Triggered Real-Time Scheduling of Stabilizing Control Tasks},
journal = {IEEE Transactions on Automatic Control},
volume  = {52},
number  = {9},
pages   = {1680--1685},
year    = {2007},
doi     = {10.1109/TAC.2007.904277}
}