ZETTEL

ID:
Z-LEGOGPT-ROLLBACK-001

TITLE:
The Castle Can Be Generated as Guess → Test Physics → Roll Back

SOURCE:
Ava Pun et al. — Generating Physically Stable and Buildable LEGO Designs from Text — ICCV 2025.

PASSAGE:
[PARAPHRASE] LegoGPT autoregressively predicts the next brick from text but couples generation to validity checks and physics-aware rollback, pruning infeasible predictions under physical and assembly constraints. The resulting designs were shown to be manually and robotically assemblable. 22

RESEARCH OBJECT:
This gives the Ryle/Dewey prompt loop a literal LEGO implementation.

TRY A TRACK.
SEE WHETHER IT HOLDS.
IF IT DOES NOT, BACK UP.
TRY ANOTHER.

For the exact Hogwarts target, the generator need not know the complete path in advance.

It can operate as constrained hypothesis testing over the next move.

LOCAL MOVE:
Make “informative failed prompt” into “informative failed brick placement.”

SOURCE TERMS:
“next brick”
“validity check”
“physics-aware rollback”
“assembly constraints”
“stable”
“buildable”

WHAT BECAME STRANGE:
Failure is not outside the generation algorithm.

Failure can be the mechanism by which the construction path is discovered.

QUESTION:
Could the full castle be treated as a 6,020-round Rylean sequence of self-correcting move experiments?

DEEPER QUESTION:
What hierarchy is required so that rollback does not have to reason over 6,000 flat decisions?

MECHANISM:
target/context
→ propose next brick
→ connection check
→ collision/stability check
→ target consistency
→ accept

OR

reject
→ rollback
→ alternative proposal.

FORMAL SHIFT:
<GENERATE COMPLETE MODEL>
→ <PROPOSE ONE MOVE>
→ [WORLD/PHYSICS SAYS NO]
→ <REVISE TRAJECTORY>

SOURCE FORMALISM:
LegoGPT uses autoregressive next-brick prediction with validity checking and physics-aware rollback. 23

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

a_t ~ πθ(a | s_t, target)

if Valid(s_t,a_t):
s_(t+1) = Apply(s_t,a_t)
else:
reject a_t
resample/search.

Add exact-target condition:

Distance(G_(t+1), G_target)
must remain recoverable.

TENSION:
Local validity does not guarantee eventual global completion.

A sequence can make every legal local move and still trap itself.

MISSING:
Lookahead, hierarchical planning, and dead-end detection.

BOUNDARY:
LegoGPT did not demonstrate exact reconstruction of Hogwarts Castle.

CITATION TRAIL:
[[Z-RYLE-EXPERIMENT-001]]
→ LegoGPT rollback
→ search/backtracking
→ hierarchical castle planner.

TEST:
Compare three target-conditioned assemblers:

greedy next-brick,
physics-aware rollback,
rollback + lookahead.

Measure dead-end rate as model size increases.

PLATFORM:
[[Rylean Assembly Loop]]

LINKS:
[[Z-RYLE-EXPERIMENT-001]]
[[Z-ASSEMBLY-POLICY-001]]
[[Z-BRICKNET-HOGWARTS-001]]

BIBTEX:
@inproceedings{pun2025legogpt,
author    = {Ava Pun and Kangle Deng and Ruixuan Liu and Deva Ramanan and Changliu Liu and Jun-Yan Zhu},
title     = {Generating Physically Stable and Buildable LEGO Designs from Text},
booktitle = {Proceedings of the IEEE/CVF International Conference on Computer Vision},
year      = {2025}
}