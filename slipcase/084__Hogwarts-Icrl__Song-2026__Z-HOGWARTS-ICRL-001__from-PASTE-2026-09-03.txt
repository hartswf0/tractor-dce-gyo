ZETTEL

ID:
Z-HOGWARTS-ICRL-001

TITLE:
The Prompt Loop Can Become the Assembly Policy Without Updating the Weights

SOURCE:
Kefan Song et al. — Reward Is Enough: LLMs Are In-Context Reinforcement Learners — ICLR 2026.
Haodong Liang and Lifeng Lai — Transformers Provably Implement In-Context Reinforcement Learning with Policy Improvement — 2026.

PASSAGE:
[PARAPHRASE] ICRL prompting gives a language model successive responses together with scalar rewards in the context; later rounds improve without parameter updates. Separate 2026 theory shows transformer constructions capable of implementing policy-improvement procedures such as SARSA and actor-critic in context under controlled assumptions. 24

RESEARCH OBJECT:
The castle experiment does not require fine-tuning after every failed assembly.

The evolving context itself can contain:

state,
attempt,
failure,
reward,
correction,
successful motif,
next state.

That turns the prompt history into a temporary learning substrate.

LOCAL MOVE:
Connect prompt-in-motion directly to sequential assembly.

SOURCE TERMS:
“in-context reinforcement learning”
“reward”
“trajectory”
“without parameter updates”
“policy improvement”

WHAT BECAME STRANGE:
The prompt ceases to be the initial instruction.

The prompt becomes the accumulated interaction history through which the model learns how THIS castle behaves.

This is far closer to Ryle's self-made tracks than one-shot “prompt engineering.”

QUESTION:
Can an LLM improve its LEGO assembly policy during one long castle construction solely from reward-bearing interaction traces?

DEEPER QUESTION:
What must be compressed out of the history so a 6,020-step task does not drown in its own context?

MECHANISM:
state s_t
→ propose assembly action
→ simulator/world returns reward r_t
→ append (s_t,a_t,r_t)
→ transformer conditions on trajectory
→ improved next action.

FORMAL SHIFT:
<STATIC PROMPT>
→ <REWARD-BEARING TRAJECTORY>
→ [IN-CONTEXT POLICY UPDATE]
→ <ADAPTIVE ASSEMBLY PRACTICE>

SOURCE FORMALISM:
ICRL prompting concatenates earlier outputs and associated scalar rewards into subsequent context. 25

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Context:

C_t =
[(s_0,a_0,r_0), ... , (s_(t-1),a_(t-1),r_(t-1))]

Policy:

a_t ~ LLM(C_t, s_t, target).

Candidate reward:

r_t =
w1·target_graph_progress

w2·stability

w3·connection_legality


w4·collision

w5·inventory_violation

w6·dead_end_risk.


TENSION:
A scalar reward can collapse important structural information and may reward deceptive local progress toward an impossible completion.

MISSING:
Hierarchical credit assignment over subassemblies.

BOUNDARY:
Existing ICRL results do not show a transformer solving a 6,020-step LEGO construction problem.

CITATION TRAIL:
[[Z-ASSEMBLY-POLICY-001]]
→ ICRL
→ hierarchical RL
→ subassembly rewards
→ context compression.

TEST:
Create increasingly long exact-target LEGO tasks and compare:

no feedback,
natural-language critique,
scalar ICRL,
state-action-reward trajectory,
hierarchical subassembly rewards.

PLATFORM:
[[PROMPT LOOP AS POLICY]]

LINKS:
[[Z-ASSEMBLY-POLICY-001]]
[[Z-PROMPT-LANGUAGING-001]]
[[Z-RYLE-EXPERIMENT-001]]

BIBTEX:
@inproceedings{song2026reward,
author    = {Kefan Song and Amir Moeini and Peng Wang and Lei Gong and Rohan Chandra and Shangtong Zhang and Yanjun Qi},
title     = {Reward Is Enough: LLMs Are In-Context Reinforcement Learners},
booktitle = {International Conference on Learning Representations},
year      = {2026}
}