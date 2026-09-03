ZETTEL

ID:
Z-HOGWARTS-BLACKBOX-DIALECT-001

TITLE:
The Best Castle Word Might Be Nonsense

SOURCE:
Antonio Sabbatella et al. — A Bayesian Approach for Prompt Optimization in Pre-trained Language Models — 2023.
Peter Kulits and Cordelia Schmid — BrickNet — 2026. 26

PASSAGE:
[PARAPHRASE] Black-box prompt optimization treats prompt candidates as variables to be selected by downstream performance rather than requiring an interpretable semantic account of why their wording works.

RESEARCH OBJECT:
A brutal test of the “language-game” account is to allow non-semantic prompt strings into the Hogwarts arena.

If:

ZXQ-17

reliably evokes the correct six-step buttress procedure better than:

“repeat the buttress construction”

then operational success and human-readable linguistic meaning come apart.

LOCAL MOVE:
Permit an alien builder dialect.

SOURCE TERMS:
“black-box”
“optimization”
“candidate”
“performance”
“build sequence”

WHAT BECAME STRANGE:
A coordination can become reliable before it becomes interpretable.

The builder game does not logically require that the call resemble a description of the object.

Wittgenstein's “slab” works because of learned use, not because the sound intrinsically resembles masonry.

QUESTION:
How far can the castle's prompt language drift from ordinary English while becoming more operationally precise?

DEEPER QUESTION:
At what point should such a control vocabulary stop being called language and start being called an interface code?

MECHANISM:
candidate token sequence q
→ model response
→ assembly validation score
→ optimizer retains/mutates q
→ locally effective token established.

FORMAL SHIFT:
<SEMANTIC PROMPTING>
→ <ARBITRARY CONTROL SIGNAL>
→ [SELECTION]
→ <OPERATIVE DIALECT>

SOURCE FORMALISM:
Black-box optimization evaluates candidates according to external task score.

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

q* =
argmax_q
CompletionScore(π(. | S,q))

subject optionally to:

HumanInterpretability(q) ≥ κ.

TENSION:
Opaque strings may exploit transient quirks and fail under model updates, context perturbations, or neighboring tasks.

MISSING:
A robustness penalty distinguishing stable convention from prompt superstition.

BOUNDARY:
Performance alone does not establish semantic content.

CITATION TRAIL:
[[Z-PROMPT-BLACKBOX-001]]
→ arbitrary call formation
→ Wittgenstein learned use
→ robustness under model drift.

TEST:
Optimize short arbitrary tokens for ten recurring assembly motifs.

Compare with descriptive English calls on:
accuracy,
transfer,
paraphrase,
model-version stability,
recoverability after context loss.

PLATFORM:
[[ALIEN BUILDER LANGUAGE]]

LINKS:
[[Z-PROMPT-BLACKBOX-001]]
[[Z-HOGWARTS-BUILDER-GAME-001]]
[[Z-PROMPT-LANGUAGING-001]]

BIBTEX:
@article{sabbatella2023bayesian,
author  = {Antonio Sabbatella and Andrea Ponti and Antonio Candelieri and Ilaria Giordani and Francesco Archetti},
title   = {A Bayesian Approach for Prompt Optimization in Pre-trained Language Models},
journal = {arXiv preprint arXiv:2312.00471},
year    = {2023}
}