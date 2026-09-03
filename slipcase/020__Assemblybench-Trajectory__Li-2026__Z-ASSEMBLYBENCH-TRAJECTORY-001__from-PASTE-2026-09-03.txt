ZETTEL

ID:
Z-ASSEMBLYBENCH-TRAJECTORY-001

TITLE:
Correct Final Geometry Is Not Enough; the Part Must Be Able to Get There

SOURCE:
Danrui Li et al. — AssemblyBench: Physics-Aware Assembly of Complex Industrial Objects — CVPR 2026. 3

PASSAGE:
[PARAPHRASE] AssemblyBench contains 2,789 industrial objects with multimodal manuals, 3D parts, and physically plausible 6-DoF assembly trajectories. AssemblyDyno jointly predicts assembly order and part trajectories, and trajectory feasibility is evaluated with physics simulation. 4

RESEARCH OBJECT:
This corrects a major weakness in the Hogwarts loop.

A brick's TARGET POSE does not specify a valid MOVE.

The agent must predict:

where the brick ends,
how it approaches,
what orientation it follows,
and whether that path is physically feasible.

For assembly, trajectory is part of correctness.

LOCAL MOVE:
Promote MOVE TRAJECTORY into the Gauntlet state instead of evaluating only before/after geometry.

SOURCE TERMS:
“6-DoF motions”
“assembly trajectories”
“assembly order”
“trajectory feasibility”
“physics-based simulations”

WHAT BECAME STRANGE:
Two agents can produce exactly the same final LDraw castle while only one knows how it could have been assembled.

The final model erases this distinction.

QUESTION:
How many Hogwarts state transitions that are geometrically correct become illegal once insertion trajectory is checked?

DEEPER QUESTION:
Should the construction trace be treated as part of the generated artifact rather than disposable provenance?

MECHANISM:
manual/reference

part geometry
→ infer part order
→ predict 6-DoF trajectory
→ physics simulation
→ feasible / infeasible
→ revise.


FORMAL SHIFT:
<TARGET POSE>
→ <POSE + PATH>
→ [PHYSICS]
→ <ASSEMBLABLE MOVE>

SOURCE FORMALISM:
AssemblyDyno jointly predicts the discrete assembly order and continuous part assembly trajectories, with physical feasibility evaluated in simulation. 5

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Move:

m_t = {
part,
start_pose,
path ξ_t:[0,1]→SE(3),
target_pose
}

Valid(m_t) requires:

collision_free(ξ_t)
∧ connector_compatible
∧ stable_after
∧ target_correct.

TENSION:
LEGO insertion mechanics include tolerances, flex, clutch force, temporary hand support, and multi-part manipulations absent from generic rigid-body path models.

MISSING:
LEGO-specific insertion and clutch models.

BOUNDARY:
AssemblyBench's industrial objects do not establish physical realism for LEGO connections.

CITATION TRAIL:
[[Z-HOGWARTS-MATERIAL-TALKS-BACK-001]]
→ AssemblyBench
→ trajectory feasibility
→ LEGO insertion sandbox.

TEST:
Take a known-valid LDraw subassembly.

Randomize assembly order while preserving final poses.

Measure what fraction of pose-correct sequences become trajectory-infeasible.

PLATFORM:
[[HOGWARTS PHYSICS GAUNTLET]]

LINKS:
[[Z-HOGWARTS-MATERIAL-TALKS-BACK-001]]
[[Z-LDRAW-CONNECTION-GAP-001]]
[[Z-HOGWARTS-PROCESS-REWARD-001]]

BIBTEX:
@inproceedings{li2026assemblybench,
author    = {Danrui Li and Jiahao Zhang and Bernhard Egger and Moitreya Chatterjee and Suhas Lohit and Tim K. Marks and Anoop Cherian},
title     = {AssemblyBench: Physics-Aware Assembly of Complex Industrial Objects},
booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition},
pages     = {17326--17335},
year      = {2026}
}