ZETTEL

ID:
Z-MANUAL2SKILL-HIERARCHY-001

TITLE:
The Manual Should Compile Into a Hierarchy Before It Compiles Into Motion

SOURCE:
Chenrui Tie et al. — Manual2Skill: Learning to Read Manuals and Acquire Robotic Skills for Furniture Assembly Using Vision-Language Models — 2025. 9

PASSAGE:
[PARAPHRASE] Manual2Skill uses a VLM to extract structured information from instruction diagrams, constructs hierarchical assembly graphs representing parts and subassemblies, estimates relative 6D poses for components, and passes these to motion planning for real-world furniture assembly. 10

RESEARCH OBJECT:
This is a direct technical answer to the Builder's Game at scale.

Do not translate:

MANUAL SENTENCE
→ ROBOT MOTION.

Translate:

MANUAL
→ HIERARCHICAL ASSEMBLY GRAPH
→ CURRENT SUBGOAL
→ RELATIVE POSE
→ MOTION.

Language first changes representation.

Only then does it act.

LOCAL MOVE:
Make the hierarchy compiler an explicit agent in the Hogwarts Gauntlet.

SOURCE TERMS:
“hierarchical assembly graphs”
“parts”
“subassemblies”
“relative 6D poses”
“motion planning”
“instructional images”

WHAT BECAME STRANGE:
The most consequential linguistic operation may be deciding that forty individual pieces now constitute ONE SUBASSEMBLY.

This is exactly where the language-game invents a noun.

QUESTION:
Can the Hogwarts manual and LDraw hierarchy be used as competing supervision for learning the correct abstraction boundaries?

DEEPER QUESTION:
When human manual hierarchy and minimum computational hierarchy disagree, which one better supports an LLM assembler?

MECHANISM:
manual image/text
→ structured extraction
→ hierarchical assembly graph
→ choose active node
→ estimate relative pose
→ motion plan
→ execute.

FORMAL SHIFT:
<INSTRUCTION FOLLOWING>
→ <HIERARCHY INDUCTION>
→ [GROUND SUBASSEMBLY]
→ <EXECUTABLE SKILL>

SOURCE FORMALISM:
Manual2Skill explicitly constructs hierarchical assembly graphs and couples them to pose estimation and motion planning. 11

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

H = ParseManual(manual)

Node(H) ∈ {
part,
subassembly,
assembly
}

At time t:

goal_t = ActiveFrontier(H, S_t).

TENSION:
Manual hierarchies are pedagogical artifacts, not necessarily minimal physical or algorithmic decompositions.

MISSING:
A benchmark comparing human-authored versus automatically induced hierarchy quality.

BOUNDARY:
Manual2Skill does not address thousands of LEGO elements.

CITATION TRAIL:
[[Z-HOGWARTS-HIERARCHICAL-SLAB-001]]
→ Manual2Skill
→ hierarchical graph
→ castle macro induction.

TEST:
Hide the official LEGO step/submodel boundaries.

Infer hierarchy independently from:
geometry,
manual images,
LDraw graph,
repetition statistics.

Compare each as a scaffold for downstream planning.

PLATFORM:
[[HOGWARTS HIERARCHY COMPILER]]

LINKS:
[[Z-HOGWARTS-HIERARCHICAL-SLAB-001]]
[[Z-HOGWARTS-DEMONSTRATION-001]]
[[Z-HOGWARTS-ACTION-GRAMMAR-001]]

BIBTEX:
@article{tie2025manual2skill,
author  = {Chenrui Tie and Shengxiang Sun and Jinxuan Zhu and Yiwei Liu and Jingxiang Guo and Yue Hu and Haonan Chen and Junting Chen and Ruihai Wu and Lin Shao},
title   = {Manual2Skill: Learning to Read Manuals and Acquire Robotic Skills for Furniture Assembly Using Vision-Language Models},
journal = {arXiv preprint arXiv:2502.10090},
year    = {2025}
}