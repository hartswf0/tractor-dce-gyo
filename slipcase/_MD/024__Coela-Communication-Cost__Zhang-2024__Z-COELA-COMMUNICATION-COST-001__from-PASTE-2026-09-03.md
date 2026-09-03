ZETTEL

ID:
Z-COELA-COMMUNICATION-COST-001

TITLE:
A Multi-Agent Builder Must Decide Whether a Message Is Worth Sending

SOURCE:
Hongxin Zhang et al. — Building Cooperative Embodied Agents Modularly with Large Language Models — ICLR 2024. 15

PASSAGE:
[PARAPHRASE] CoELA addresses decentralized agents with raw sensory observations, costly communication, and long-horizon cooperation. Its architecture separates perception, memory, communication, planning, and execution. The communication module first decides what information to send and then whether communicating is preferable to another action. 16

RESEARCH OBJECT:
This supplies the missing ANTI-CHAT mechanism for multi-agent Hogwarts.

If every specialist narrates everything it sees after every brick, the coordination system destroys itself with context.

Communication must itself be an action with cost.

LOCAL MOVE:
Charge every agent message against the same budget as reasoning and tool use.

SOURCE TERMS:
“costly communication”
“Perception”
“Memory”
“Communication”
“Planning”
“Execution”
“what to send”

WHAT BECAME STRANGE:
Silence can be expert behavior.

The geometry agent does not need to tell the planner:

“everything still looks fine.”

It should speak when its information changes the next decision.

QUESTION:
Can communication value be estimated from expected change in another agent's policy?

DEEPER QUESTION:
Does a mature prompt micro-language become terse partly because agents learn what no longer needs to be said?

MECHANISM:
agent observes local information
→ retrieve relevance
→ formulate possible message
→ estimate communication value
→ send OR act silently.

FORMAL SHIFT:
<ALL AGENTS SHARE EVERYTHING>
→ <COMMUNICATION AS COSTLY ACTION>
→ [GATE]
→ <SELECTIVE COORDINATION>

SOURCE FORMALISM:
CoELA contains separate semantic, episodic, and procedural memory and explicitly mediates communication before planning/execution. 17

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Send(m) iff:

ExpectedPolicyChange(receiver | m)
× ExpectedTaskValue

> 

TokenCost(m) + InterruptionCost(m).

TENSION:
Important negative information may have low immediate action value but high future safety value.

MISSING:
A communication-value model with delayed credit.

BOUNDARY:
CoELA's transport/household benchmarks do not test assembly geometry.

CITATION TRAIL:
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
→ CoELA
→ costly communication
→ assembly message gating.

TEST:
Fix the same multi-agent castle architecture and vary:

unlimited sharing,
periodic summaries,
learned communication gating,
event-triggered residual messages.

Measure performance per token and per tool call.

PLATFORM:
[[ATTENTION-SCALED MULTI-AGENT BUILDER]]

LINKS:
[[Z-HOGWARTS-ATTENTION-BUDGET-001]]
[[Z-HOGWARTS-DISTRIBUTED-BUILDER-001]]
[[Z-PROMPT-LANGUAGING-001]]

BIBTEX:
@inproceedings{zhang2024coela,
author    = {Hongxin Zhang and Weihua Du and Jiaming Shan and Qinhong Zhou and Yilun Du and Joshua B. Tenenbaum and Tianmin Shu and Chuang Gan},
title     = {Building Cooperative Embodied Agents Modularly with Large Language Models},
booktitle = {International Conference on Learning Representations},
year      = {2024}
}