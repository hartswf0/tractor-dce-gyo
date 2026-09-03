# S04 — DECOMPILE-FIRST   (read slipcase/_PROMPTS/S04__DECOMPILE-FIRST.txt first)
"Do not ask how to build it first; ask how it can come apart."

Step 1: `node world.js S04 init`, then `node world.js S04 describe /home/user/tractor-dce-gyo/builds/card-castle.mpd`
(the existing 182-piece castle: every piece with its BODY line and what it rests on; also written
to runs/S04/described.json). Step 2: write runs/S04/groups.json: named sub-assemblies (towers,
wall bays, keep, gatehouse, roofs, figures…) as lists of piece indices, and a REMOVAL ORDER in
which each group can be taken off with nothing left resting on it. `adopt runs/S04/groups.json`
checks the order; fix until it says OK. Step 3: build a NEW castle from those named things:
`instance <noun> AT <port> [MIRRORED]` at new positions (a different plan: e.g. towers further
apart, a mirrored gatehouse, the keep off-centre), adding new pieces with `place` where the
decompiled parts do not reach. It must not be the same castle. Named things become submodels.
Hypothesis: a build replayed from decompiled sub-assemblies lands in the anatomy/reuse bands.
