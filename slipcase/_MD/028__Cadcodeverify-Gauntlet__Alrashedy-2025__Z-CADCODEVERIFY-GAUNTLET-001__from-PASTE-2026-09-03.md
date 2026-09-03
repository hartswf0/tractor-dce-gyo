ZETTEL

ID:
Z-CADCODEVERIFY-GAUNTLET-001

TITLE:
The Gauntlet Loop Already Exists in CAD: Generate, Render, Interrogate, Correct

SOURCE:
Kamel Alrashedy et al. — Generating CAD Code with Vision-Language Models for 3D Designs — ICLR 2025. 27

PASSAGE:
[PARAPHRASE] CADCodeVerify generates CAD scripting code, renders the resulting 3D object, prompts a VLM to generate and answer validation questions about the object, then feeds ameliorative feedback back into code correction. On GPT-4, the reported loop reduced point-cloud distance by 7.30% and improved program success rate by 5 percentage points over the compared baseline. 28

RESEARCH OBJECT:
This is the most direct published precursor to the GAUNTLET LOOP.

PROMPT
→ CODE
→ EXECUTE
→ RENDER
→ LOOK
→ ASK WHAT IS WRONG
→ PATCH
→ REPEAT.

The crucial advance over ordinary self-reflection is that critique sees the consequence of execution.

LOCAL MOVE:
Use CADCodeVerify as the baseline Gauntlet, then replace its primarily visual critique with multiple exact LEGO validators.

SOURCE TERMS:
“iteratively verify”
“visual feedback”
“validation questions”
“CAD code”
“correct deviations”
“CADPrompt”

WHAT BECAME STRANGE:
The model does not merely write a better sentence after reconsideration.

It gets access to a NEW OBJECT that did not exist before the previous reasoning step:

the rendered geometry.

QUESTION:
Which feedback modality adds the largest marginal value after execution: render, graph residual, collision report, dimensional measurement, or insertion simulation?

DEEPER QUESTION:
Should the verifier generate questions freely, or should the action ontology determine a fixed suite of interrogations?

MECHANISM:
description
→ CAD code
→ execute
→ render
→ generate validation questions
→ inspect
→ feedback
→ revise code.

FORMAL SHIFT:
<SELF-CRITIQUE OF TEXT>
→ <CRITIQUE OF EXECUTED ARTIFACT>
→ [VISUAL RESIDUAL]
→ <CORRECTED PROGRAM>

SOURCE FORMALISM:
CADCodeVerify explicitly loops generated CAD code through visual validation and corrective feedback. 29

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Gauntlet_0:

P_t
→ Code_t
→ Geometry_t
→ Render_t
→ Critique_t
→ Patch_t
→ P_(t+1).

Hogwarts extension:

Geometry_t
→ {
render,
mate_graph_check,
collision,
inventory,
trajectory,
stability
}
→ ResidualVector_t.

TENSION:
A VLM can confidently misread its own render.

MISSING:
Deterministic feedback channels wherever the geometry admits exact checks.

BOUNDARY:
CADCodeVerify evaluates individual CAD objects, not long-horizon assembly processes.

CITATION TRAIL:
[[Z-HOGWARTS-MATERIAL-TALKS-BACK-001]]
→ CADCodeVerify
→ multimodal executable critique
→ Hogwarts Gauntlet.

TEST:
Ablate each feedback channel from a multi-verifier CAD loop and measure which error classes return.

PLATFORM:
[[GAUNTLET LOOP]]

LINKS:
[[Z-HOGWARTS-MATERIAL-TALKS-BACK-001]]
[[Z-HOGWARTS-ERROR-RESIDUAL-001]]
[[Z-HOGWARTS-VERIFY-COMPUTE-001]]

BIBTEX:
@inproceedings{alrashedy2025cadcodeverify,
author    = {Kamel Alrashedy and Pradyumna Tambwekar and Zulfiqar Haider Zaidi and Megan Langwasser and Wei Xu and Matthew Gombolay},
title     = {Generating CAD Code with Vision-Language Models for 3D Designs},
booktitle = {International Conference on Learning Representations},
year      = {2025}
}