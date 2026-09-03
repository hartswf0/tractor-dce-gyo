# S05 — BODY-AND-JOINTS   (read slipcase/_PROMPTS/S05__BODY-AND-JOINTS.txt first)
"Give the piece proprioception."

In your world every `place` REQUIRES a JOINTS prediction: `--joints takes=<n>,gives=<m>`, where
takes = how many open studs this placement will cover, gives = how many studs the part exposes
(its BODY line says "gives m up"). A wrong prediction is REFUSED with the true JOINTS line and
the piece is not placed; predict again. The world counts right/wrong (`status`). Work it out
from the BODY line and the field (the run WxD at a port tells you how many open studs lie in
a row). Keep your prediction accuracy high and rising.
Start: `node world.js S05 init`, `tray`, `field`.
Hypothesis: a builder that must say what it takes and gives makes fewer floating/clashing placements.
