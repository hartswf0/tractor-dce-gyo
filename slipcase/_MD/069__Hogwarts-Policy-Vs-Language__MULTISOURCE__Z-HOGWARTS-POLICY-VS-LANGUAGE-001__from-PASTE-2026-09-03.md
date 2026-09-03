ZETTEL

ID:
Z-HOGWARTS-POLICY-VS-LANGUAGE-001

TITLE:
The Builder’s Language Is Not the Builder’s Policy

SOURCE:
Lin Ma et al. — Planning Assembly Sequence with Graph Transformer — 2022.
Peter Kulits and Cordelia Schmid — BrickNet — 2026.
Ludwig Wittgenstein — Philosophical Investigations — 1953. 34

PASSAGE:
[PARAPHRASE] Assembly-sequence planning chooses an ordering over graph-structured components; Wittgenstein's builder language specifies the socially learned calls through which building actions are coordinated.

RESEARCH OBJECT:
A castle prompt language and a castle-building policy must be separated.

LANGUAGE:
which distinctions and calls are available.

POLICY:
which call/action should happen NOW.

One can possess a perfect vocabulary and still build terribly.

One can also possess a crude vocabulary while following an excellent policy.

LOCAL MOVE:
Separate representational competence from strategic competence.

SOURCE TERMS:
“language-game”
“assembly sequence”
“graph”
“planning”
“latent rules”

WHAT BECAME STRANGE:
“Slab” tells B what A's call means.

It does not tell A whether a slab should be requested at this stage of the castle.

QUESTION:
What portion of prompt expertise is language design and what portion is policy design?

DEEPER QUESTION:
Can the same compact language support radically different assembly policies whose final success differs by orders of magnitude?

MECHANISM:
language L defines action/address vocabulary.

policy π observes S_t and chooses expression/action from L.

executor realizes action.

FORMAL SHIFT:
<PROMPT LANGUAGE = CONTROL>
→ <LANGUAGE + POLICY>
→ [SELECT MOVE]
→ <TRAJECTORY>

SOURCE FORMALISM:
Ma et al. treat assembly sequence planning as a graph-based ordering problem and learn sequence rules using a graph transformer. 35

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

L = valid communicative/action primitives.

π:
S_t → L.

Performance depends on:

π
not merely expressive power(L).

TENSION:
In natural-language LLM interaction, linguistic representation can itself strongly shape the induced policy, so the layers are not independent.

MISSING:
Experiments holding vocabulary fixed while changing planning strategy.

BOUNDARY:
A better prompt vocabulary is not equivalent to better planning.

CITATION TRAIL:
[[Z-ASSEMBLY-POLICY-001]]
→ Wittgenstein builder language
→ assembly sequence planning
→ policy/language separation.

TEST:
Hold the castle DSL constant.

Compare:
greedy policy,
graph-transformer policy,
search policy,
ICRL policy,
human policy.

PLATFORM:
[[BUILDER POLICY]]

LINKS:
[[Z-ASSEMBLY-POLICY-001]]
[[Z-HOGWARTS-ACTION-GRAMMAR-001]]
[[Z-HOGWARTS-BUILDER-GAME-001]]

BIBTEX:
@article{ma2022planning,
author  = {Lin Ma and Jiangtao Gong and Hao Xu and Hao Chen and Hao Zhao and Wenbing Huang and Guyue Zhou},
title   = {Planning Assembly Sequence with Graph Transformer},
journal = {arXiv preprint arXiv:2210.05236},
year    = {2022}
}

@inproceedings{kulits2026bricknet,
author    = {Peter Kulits and Cordelia Schmid},
title     = {BrickNet: Graph-Backed Generative Brick Assembly},
booktitle = {CVPR},
year      = {2026}
}