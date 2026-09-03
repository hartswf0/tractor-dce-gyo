ZETTEL

ID:
Z-FURNITUREBENCH-REALITY-001

TITLE:
Real Assembly Remains Hard Even After Thousands of Demonstrations

SOURCE:
Minho Heo et al. — FurnitureBench: Reproducible Real-World Benchmark for Long-Horizon Complex Manipulation — RSS 2023. 45

PASSAGE:
[PARAPHRASE] FurnitureBench supplies standardized real-world furniture assembly, FurnitureSim, 3D-printable furniture models, and more than 200 hours / 5,000 demonstrations. Its benchmark results show substantial remaining difficulty for offline reinforcement learning and imitation learning on long-horizon real-world assembly. 46

RESEARCH OBJECT:
This prevents the Hogwarts experiment from becoming a language-model parlor trick.

Assembly has failure modes that enormous linguistic competence does not erase:

grasping,
contact,
alignment,
force,
occlusion,
recovery,
long-horizon error accumulation.

LOCAL MOVE:
Maintain two Gauntlet tracks:

DIGITAL ASSEMBLY:
exact LDraw/physics.

EMBODIED ASSEMBLY:
robot actually constructs selected subassemblies.

SOURCE TERMS:
“long-horizon”
“complex manipulation”
“real-world”
“FurnitureSim”
“demonstrations”
“reproducible”

WHAT BECAME STRANGE:
A planner can possess the correct high-level sequence and still fail continuously at execution.

This makes “what does the prompt know?” distinct from “what can the coupled system reliably do?”

QUESTION:
Which discoveries in the digital Hogwarts sandbox survive embodiment?

DEEPER QUESTION:
At what scale does the dominant bottleneck shift from language/reasoning to contact-rich control?

MECHANISM:
high-level assembly plan
→ robot policy
→ contact-rich manipulation
→ observed physical outcome
→ retry/recovery.

FORMAL SHIFT:
<ASSEMBLY AS SYMBOLIC ORDER>
→ <ASSEMBLY AS CONTACT-RICH CONTROL>
→ [REAL WORLD]
→ <EXECUTION GAP>

SOURCE FORMALISM:
FurnitureBench provides matched real-world and simulated assembly settings plus a large teleoperation dataset for benchmarking RL/IL. 47

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Digital success:
G_final = G_target.

Embodied success additionally requires:

∀t:
ExecutePhysical(a_t) succeeds within tolerance.

TENSION:
LEGO has different contact mechanics from the FurnitureBench furniture designs.

MISSING:
A reproducible LEGO robotic assembly sandbox.

BOUNDARY:
Simulation success should not be labeled physical assembly success.

CITATION TRAIL:
[[Z-HOGWARTS-TYPE-BY-LOOP-001]]
→ FurnitureBench
→ simulation/real gap
→ physical LEGO track.

TEST:
Select one repeated Hogwarts module.

Require:
digital graph completion,
physics-sim completion,
robot completion.

Track which error classes appear at each boundary.

PLATFORM:
[[HOGWARTS SIM-TO-REAL]]

LINKS:
[[Z-HOGWARTS-TYPE-BY-LOOP-001]]
[[Z-HOGWARTS-MATERIAL-TALKS-BACK-001]]
[[Z-ASSEMBLYBENCH-TRAJECTORY-001]]

BIBTEX:
@inproceedings{heo2023furniturebench,
author    = {Minho Heo and Youngwoon Lee and Doohyun Lee and Joseph J. Lim},
title     = {FurnitureBench: Reproducible Real-World Benchmark for Long-Horizon Complex Manipulation},
booktitle = {Proceedings of Robotics: Science and Systems},
year      = {2023},
doi       = {10.15607/RSS.2023.XIX.041}
}