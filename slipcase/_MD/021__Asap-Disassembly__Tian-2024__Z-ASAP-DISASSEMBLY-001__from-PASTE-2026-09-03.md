ZETTEL

ID:
Z-ASAP-DISASSEMBLY-001

TITLE:
Do Not Ask How to Build Hogwarts First; Ask How Hogwarts Can Come Apart

SOURCE:
Yunsheng Tian et al. — ASAP: Automated Sequence Planning for Complex Robotic Assembly with Physical Feasibility — ICRA 2024. 6

PASSAGE:
[PARAPHRASE] ASAP uses “assembly-by-disassembly”: because rigid-part assembly and disassembly sequences correspond, it begins from the completed assembly, searches a disassembly tree, and reverses a physically feasible disassembly sequence into an assembly sequence. Each candidate removal is checked for an available motion path and gravitational stability of what remains. 7

RESEARCH OBJECT:
The Hogwarts target is unusually favorable because the full answer already exists.

The model does not have to imagine a 6,020-step forward policy ex nihilo.

It can DECOMPILE THE FINISHED CASTLE.

This turns target geometry into a planning instrument.

LOCAL MOVE:
Add a backward planner to the Gauntlet.

SOURCE TERMS:
“assembly-by-disassembly”
“disassembly tree”
“SelectNode”
“SelectPart”
“SelectPose”
“CheckAssemblable”
“CheckStable”

WHAT BECAME STRANGE:
A forward construction move may have an enormous branching factor.

A completed castle can constrain the reverse problem drastically:

which part or subassembly can legally be removed now?

QUESTION:
Does reverse planning collapse the Hogwarts search space enough to make exact long-horizon assembly tractable?

DEEPER QUESTION:
What structures cannot be recovered by rigid assembly-by-disassembly because their construction depends on flex, temporary deformation, or simultaneous insertion?

MECHANISM:
complete target G_0
→ choose removable part/subassembly
→ choose pose
→ test disassembly path
→ test remaining stability
→ remove
→ recurse
→ reverse successful path.

FORMAL SHIFT:
<GENERATE CASTLE FORWARD>
→ <DECOMPILE CASTLE BACKWARD>
→ [PHYSICS-CONSTRAINED SEARCH]
→ <REVERSE INTO BUILD POLICY>

SOURCE FORMALISM:
ASAP's search constructs a disassembly tree whose nodes are partial assemblies and whose edges are feasible or infeasible removals. The algorithm explicitly checks assemblability and stability for each proposed tree expansion. 8

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Given target G*:

τ_remove =
SearchBackward(G*)

τ_build =
Reverse(τ_remove).

Hierarchical variant:

RemoveMacro(H)
before
RemovePart(p)

when H forms a validated physical subassembly.

TENSION:
The shortest disassembly path is not automatically the best learning, human, or robotic assembly path.

MISSING:
A comparison among:
minimal reverse path,
manual path,
learning-aware path,
LLM-generated path.

BOUNDARY:
ASAP demonstrates assemblies up to dozens of parts, not thousands.

CITATION TRAIL:
[[Z-ASSEMBLY-POLICY-001]]
→ ASAP assembly-by-disassembly
→ target decompilation
→ hierarchical Hogwarts reverse planner.

TEST:
Start with completed LEGO submodels.

Compare forward search against reverse-disassembly search under equal physics evaluation budgets.

Scale until one becomes infeasible.

PLATFORM:
[[HOGWARTS DECOMPILER]]

LINKS:
[[Z-ASSEMBLY-POLICY-001]]
[[Z-LDRAW-HISTORY-001]]
[[Z-HOGWARTS-ASSEMBLY-OF-PROMPT-001]]

BIBTEX:
@inproceedings{tian2024asap,
author    = {Yunsheng Tian and Karl D. D. Willis and Bassel Al Omari and Jieliang Luo and Pingchuan Ma and Yichen Li and Farhad Javid and Edward Gu and Joshua Jacob and Shinjiro Sueda and Hui Li and Sachin Chitta and Wojciech Matusik},
title     = {ASAP: Automated Sequence Planning for Complex Robotic Assembly with Physical Feasibility},
booktitle = {IEEE International Conference on Robotics and Automation},
year      = {2024},
doi       = {10.1109/ICRA57147.2024.10611595}
}