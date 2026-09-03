ZETTEL

ID:
Z-HOGWARTS-ICRL-LANGUAGE-GAME-001

TITLE:
Reward Can Stabilize the Local Meaning of “Do That Again”

SOURCE:
Kefan Song et al. — Reward Is Enough: LLMs Are In-Context Reinforcement Learners — 2026.
Humberto R. Maturana — Metadesign.
Peter Kulits and Cordelia Schmid — BrickNet — 2026. 24

PASSAGE:
[PARAPHRASE] ICRL repeatedly supplies responses with scalar rewards in context, producing inference-time improvement; Maturana locates language in recurrent coordination rather than isolated messages.

RESEARCH OBJECT:
The castle's temporary language-game can be trained during use.

Suppose the model proposes a local build sequence.

The environment returns:

+1 legal
+1 exact-target progress
+1 stable
-3 collision
-5 dead end.

The next time the human says:

“same move on the west side”

the expression is conditioned not only by semantics but by a history of rewarded and punished coordinations.

LOCAL MOVE:
Use reward to stabilize a local language-action coupling.

SOURCE TERMS:
“reward”
“prior responses”
“context”
“self-improvement”
“coordination”

WHAT BECAME STRANGE:
Meaning and policy can co-adapt within a session without changing model weights.

A phrase may become more reliable because the context contains its consequences.

QUESTION:
Can reward-bearing interaction transform vague shorthand into reliable assembly control?

DEEPER QUESTION:
When does the model learn the local phrase and when is it merely copying a recent successful trajectory?

MECHANISM:
call u
→ action sequence τ
→ reward r
→ retain (u,τ,r)
→ later related call
→ behavior shifts toward rewarded coordination.

FORMAL SHIFT:
<MEANING FROM SEMANTICS>
→ <MEANING SHAPED BY CONSEQUENCE HISTORY>
→ [REWARD]
→ <LOCAL CONTROL DIALECT>

SOURCE FORMALISM:
ICRL prompting appends prior model responses and numerical rewards to future context. 25

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

C_t =
[(u_i, τ_i, r_i)]_{i<t}

π_t(a | u,S)

LLM(a | u,S,C_t).

TENSION:
Reward can stabilize the wrong shorthand if the scalar objective misses global completion constraints.

MISSING:
Long-horizon credit assignment from subassembly success to final castle feasibility.

BOUNDARY:
Inference-time reward adaptation is not equivalent to persistent language learning across sessions.

CITATION TRAIL:
[[Z-HOGWARTS-CONTEXT-ASSEMBLY-POOL-001]]
→ ICRL
→ local coordination
→ hierarchical castle reward.

TEST:
Teach novel arbitrary calls such as “florp” for a specific validated connector motif entirely through reward-bearing demonstrations.

Test transfer to unseen locations and fresh sessions.

PLATFORM:
[[REWARDED BUILDER LANGUAGE]]

LINKS:
[[Z-HOGWARTS-CONTEXT-ASSEMBLY-POOL-001]]
[[Z-PROMPT-LANGUAGING-001]]
[[Z-HOGWARTS-ICRL-001]]

BIBTEX:
@inproceedings{song2026reward,
author    = {Kefan Song and Amir Moeini and Peng Wang and Lei Gong and Rohan Chandra and Shangtong Zhang and Yanjun Qi},
title     = {Reward Is Enough: LLMs Are In-Context Reinforcement Learners},
booktitle = {International Conference on Learning Representations},
year      = {2026}
}