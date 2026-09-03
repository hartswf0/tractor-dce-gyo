ZETTEL

ID:
Z-HOGWARTS-DEMONSTRATION-001

TITLE:
Showing Three Towers May Specify the Fourth Better Than Describing the Rule

SOURCE:
Peter Kulits and Cordelia Schmid — BrickNet — 2026.
Lin Ma et al. — Planning Assembly Sequence with Graph Transformer — 2022.
Kefan Song et al. — Reward Is Enough — 2026. 11

PASSAGE:
[PARAPHRASE] BrickNet learns build-sequence regularities from more than 100,000 human-designed LDraw objects; Ma et al. learn assembly-order patterns from LEGO assembly graphs and sequences.

RESEARCH OBJECT:
For Hogwarts, demonstrations can function as EVIDENCE FROM WHICH AN ASSEMBLY RULE IS INFERRED.

Suppose three windows obey a repeated but awkward relation:

arch
→ tan plate
→ inset pane
→ slope pair.

Instead of writing the entire rule, provide three completed local examples and ask for the fourth.

The prompt is then not primarily an instruction.

It is an observed sample of a local construction distribution.

LOCAL MOVE:
Convert repeated Hogwarts motifs into in-context learning episodes.

SOURCE TERMS:
“build sequences”
“graph”
“ground truth assembly sequence”
“latent rules”
“in-context”

WHAT BECAME STRANGE:
The castle itself contains its own few-shot dataset.

Every repeated architectural motif can teach the policy needed to complete another occurrence.

QUESTION:
Can partial repetition inside the target model serve as in-context training data for finishing the same model?

DEEPER QUESTION:
What is the minimum number and diversity of motif examples required before continuation becomes reliable?

MECHANISM:
completed motif instances D
→ infer latent assembly rule h_D
→ locate incomplete homologous region
→ predict next connection sequence
→ validate against target graph.

FORMAL SHIFT:
<DESCRIBE CONSTRUCTION RULE>
→ <SHOW INSTANCES>
→ [INFER RULE]
→ <COMPLETE HOMOLOGOUS STRUCTURE>

SOURCE FORMALISM:
Ma et al. represent LEGO models as heterogeneous graphs and train a transformer to predict assembly sequences. 12

BrickNet similarly models build order through connectivity relations. 13

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

D_motif =
{τ_1, τ_2, τ_3}

h =
InferAssemblyRule(D_motif)

τ_4 =
h(partial_target_4).

TENSION:
Repeated visual motifs may differ structurally in hidden support, orientation, or legal insertion order.

MISSING:
A motif-equivalence detector sensitive to connector topology rather than surface appearance alone.

BOUNDARY:
Few-shot similarity does not prove the inferred rule is globally valid.

CITATION TRAIL:
[[Z-PROMPT-BAYES-001]]
→ [[Z-PROMPT-HYPOTHESIS-001]]
→ BrickNet graph examples
→ intra-castle demonstration prompting.

TEST:
Hide one member of repeated motif families.

Prompt only from the other completed instances.

Measure exact connector-graph recovery of the hidden member.

PLATFORM:
[[CASTLE AS ITS OWN PROMPT]]

LINKS:
[[Z-PROMPT-BAYES-001]]
[[Z-PROMPT-HYPOTHESIS-001]]
[[Z-BRICKNET-HOGWARTS-001]]

BIBTEX:
@inproceedings{kulits2026bricknet,
author    = {Peter Kulits and Cordelia Schmid},
title     = {BrickNet: Graph-Backed Generative Brick Assembly},
booktitle = {CVPR},
year      = {2026}
}

@article{ma2022planning,
author  = {Lin Ma and Jiangtao Gong and Hao Xu and Hao Chen and Hao Zhao and Wenbing Huang and Guyue Zhou},
title   = {Planning Assembly Sequence with Graph Transformer},
journal = {arXiv preprint arXiv:2210.05236},
year    = {2022}
}