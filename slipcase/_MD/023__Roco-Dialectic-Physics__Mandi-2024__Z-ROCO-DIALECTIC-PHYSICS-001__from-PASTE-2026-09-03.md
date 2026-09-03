ZETTEL

ID:
Z-ROCO-DIALECTIC-PHYSICS-001

TITLE:
RoCo Already Makes Multi-Agent Language Answer to Collision

SOURCE:
Zhao Mandi, Shreeya Jain, Shuran Song — RoCo: Dialectic Multi-Robot Collaboration with Large Language Models — ICRA 2024. 12

PASSAGE:
[PARAPHRASE] RoCo equips multiple robots with LLMs that discuss task strategy, propose subtask plans and task-space waypoints, then passes those proposals to motion planning. Environmental feedback including collision checking is returned to the agents so they can revise plans in context. RoCoBench contains six collaborative manipulation tasks. 13

RESEARCH OBJECT:
This is one of the cleanest existing realizations of the language-game you are describing.

The dialogue is not self-validating.

Agents talk.

Then geometry gets a vote.

Invalid plans return to language as a correction.

LOCAL MOVE:
Use RoCo as the minimum multi-agent baseline for a Hogwarts Gauntlet.

SOURCE TERMS:
“dialectic”
“multi-agent dialog”
“sub-task plan”
“task-space waypoints”
“collision checking”
“in-context”
“multi-arm motion planner”

WHAT BECAME STRANGE:
The conversation only becomes useful because an external planner can reject it.

Without collision feedback, multi-agent discussion risks being several models agreeing in prose.

QUESTION:
Does adding more reasoning agents improve assembly once an exact geometric validator already exists?

DEEPER QUESTION:
Should agents debate PLANS or should they each own different constraints whose disagreements expose specific residuals?

MECHANISM:
agent dialogue
→ proposed joint plan
→ waypoint generation
→ centralized motion planner
→ collision/feasibility feedback
→ dialogue revision
→ validated execution.

FORMAL SHIFT:
<MULTI-AGENT DISCUSSION>
→ <DIALECTIC + PHYSICAL REFUTATION>
→ [REVISE IN CONTEXT]
→ <EXECUTABLE COLLABORATION>

SOURCE FORMALISM:
RoCo separates multi-agent dialog, LLM-generated subtask/waypoint planning, and centralized multi-arm motion planning with feedback on invalid plans. 14

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Agent proposals:
P_i

World verifier:
V(P_1,...,P_n)

If V rejects:
feedback residual r
→ next dialogue round.

The physical checker is not an agent opinion.

TENSION:
RoCo's six tasks are small tabletop collaborations and do not demonstrate deep hierarchical construction.

MISSING:
Persistent shared memory and subassembly abstraction across thousands of moves.

BOUNDARY:
RoCo supports the feedback architecture, not the Hogwarts scale claim.

CITATION TRAIL:
[[Z-HOGWARTS-DISTRIBUTED-BUILDER-001]]
→ RoCo
→ dialectic planning
→ physical validator
→ multi-agent Hogwarts.

TEST:
Compare:
single planner,
three identical debating agents,
three constraint-specialized agents

with the exact same physics validator and token budget.

PLATFORM:
[[MULTI-AGENT HOGWARTS GAUNTLET]]

LINKS:
[[Z-HOGWARTS-DISTRIBUTED-BUILDER-001]]
[[Z-HOGWARTS-ERROR-RESIDUAL-001]]
[[Z-HOGWARTS-VERIFY-COMPUTE-001]]

BIBTEX:
@inproceedings{mandi2024roco,
author    = {Zhao Mandi and Shreeya Jain and Shuran Song},
title     = {RoCo: Dialectic Multi-Robot Collaboration with Large Language Models},
booktitle = {IEEE International Conference on Robotics and Automation},
pages     = {286--299},
year      = {2024},
doi       = {10.1109/ICRA57147.2024.10610855}
}