ZETTEL

ID:
Z-HOGWARTS-CONTEXT-ASSEMBLY-POOL-001

TITLE:
The Context Window Can Function as an Assembly Pool

SOURCE:
Sharma et al. — Assembly Theory Explains and Quantifies Selection and Evolution — 2023.
Kefan Song et al. — Reward Is Enough: LLMs Are In-Context Reinforcement Learners — 2026. 9

PASSAGE:
[PARAPHRASE] Assembly Theory makes constructed objects available for later recursive reuse; ICRL prompting retains prior responses and rewards in context so later behavior can improve without updating model weights.

RESEARCH OBJECT:
The context window can be treated as a temporary ASSEMBLY POOL OF PAST ACHIEVEMENTS.

Not merely conversation history.

It can contain:

validated subassemblies,
successful connector patterns,
rejected moves,
named motifs,
rewarded strategies,
temporary macros,
remaining inventory,
and unresolved constraints.

The crucial design decision becomes:

WHAT SHOULD REMAIN AVAILABLE FOR REUSE?

LOCAL MOVE:
Turn context management into assembly-pool curation.

SOURCE TERMS:
Assembly Theory:
“assembly pool”
“subsequent steps”
“reuse”

ICRL:
“context”
“prior responses”
“rewards”
“self-improvement”

WHAT BECAME STRANGE:
A 6,020-step task cannot simply preserve everything.

The problem becomes selective memory:

which past constructions deserve to remain as reusable building blocks of future inference?

QUESTION:
Can context compression be driven by assembly relevance rather than recency?

DEEPER QUESTION:
What is the smallest set of reusable linguistic/material objects sufficient to continue the castle without losing capability?

MECHANISM:
trajectory history
→ detect validated reusable object
→ promote to memory/macro
→ discard redundant trace
→ expose reusable object in later context.

FORMAL SHIFT:
<CONTEXT AS TRANSCRIPT>
→ <CONTEXT AS CURATED ASSEMBLY POOL>
→ [PROMOTE / FORGET]
→ <HIERARCHICAL LONG-HORIZON CONTROL>

SOURCE FORMALISM:
ICRL prompting concatenates previous outputs with numerical rewards in subsequent rounds. 10

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Memory object m enters pool if:

Validated(m)
∧ ReuseProbability(m) high
∧ RetrievalValue(m) > TokenCost(m).

Context_t =
CurrentState

RelevantPool(S_t)

ImmediateTrajectory.


TENSION:
A context object that was useful earlier can become misleading after state changes.

MISSING:
Garbage collection for obsolete prompt macros and obsolete partial plans.

BOUNDARY:
A context window is not literally Assembly Theory's physical assembly pool.

CITATION TRAIL:
[[Z-HOGWARTS-TWO-ASSEMBLIES-001]]
→ assembly pool
→ ICRL trajectory memory
→ hierarchical context management.

TEST:
Compare full-history prompting with:
recency memory,
summary memory,
validated-subassembly memory.

Measure full-model completion length before performance collapses.

PLATFORM:
[[ASSEMBLY-AWARE CONTEXT ENGINEERING]]

LINKS:
[[Z-HOGWARTS-TWO-ASSEMBLIES-001]]
[[Z-HOGWARTS-ICRL-001]]
[[Z-PROMPT-DISTRIBUTED-001]]

BIBTEX:
@article{sharma2023assembly,
author  = {Abhishek Sharma and others},
title   = {Assembly Theory Explains and Quantifies Selection and Evolution},
journal = {Nature},
year    = {2023},
volume  = {622},
pages   = {321--328}
}

@inproceedings{song2026reward,
author    = {Kefan Song and Amir Moeini and Peng Wang and Lei Gong and Rohan Chandra and Shangtong Zhang and Yanjun Qi},
title     = {Reward Is Enough: LLMs Are In-Context Reinforcement Learners},
booktitle = {International Conference on Learning Representations},
year      = {2026}
}