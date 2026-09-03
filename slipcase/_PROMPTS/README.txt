_PROMPTS/ — the assembly instrument and the seed prompts
=========================================================

00__ASSEMBLY-PROMPT__SLIPCASE-POML.txt   the exact prompt that assembled this package (verbatim)
00__REQUEST-LINE.txt                     the exact request line that preceded the zettel batches (verbatim)
S01 … S07                                seed prompts ("stones") for LDraw assembly by a language model

WHAT A SEED IS
A seed is a prompt template plus the world it presupposes: what the model is shown,
what it must say back, what the world returns, what is measured, and how the seed
can be mutated. A seed without a measure is a slogan. Every seed here names the
gauntlet axes it should move (GAUNTLET-CONTRACT.md in the repository: AX-VOCAB,
AX-COLOUR, AX-SNOT, AX-ROT, AX-POSE, AX-LATTICE, AX-ANATOMY, AX-REUSE, AX-SYMMETRY,
AX-DENSITY, AX-SERVICES, AX-STUFF; gates G-DET, G-KNOWN, G-CLASH, G-FLOAT, G-SCALE,
G-BUFFER, G-BLIND) and one shadow measure the critic does not yet see: the share of
structural studs facing air (defined in S01).

HOW TO TEST A SEED
1. Fix the bar: one real kit (default 5935 Island Hopper, kits/5935-island-hopper.mpd).
2. Fix the target card and seed (card castle, seed 1) so the run is deterministic.
3. Run the builder with the seed prompt and without it. Emit both MPDs.
4. Judge both blind against the bar, per axis, never summed. Ties go to the kit.
5. Also measure the shadow number (structural open-stud share). The kit band is
   0.112–0.431 across the 16 non-empty kits (median 0.228). Landing
   inside the band counts; landing below it is an overshoot, not a win.
6. Keep the seed only if at least one axis flips to WIN and none flips to LOSS.

HOW TO EVOLVE A SEED
Population = the seven seeds plus their mutants. Each seed lists its mutation
operators. Fitness is the vector of per-axis verdicts (never a scalar) plus the
shadow number's distance to the kit band. Selection keeps a mutant only if it is
not worse on any axis (Pareto), which is the gauntlet's own rule. Record every
run as a row: seed, mutation, card, bar, axes before/after, shadow before/after.
The stones are the seeds that survive ten generations without a LOSS flip.

STATUS OF THE SEVEN
S01 FIELD-ROUTING          TESTED (naive version) — numbers below, and in _RESOURCES/field-results.json
S02 RESIDUAL-PACKET        PARTIAL — the gauntlet brief is an axis-level residual; no per-placement residual exists
S03 BUILDERS-GAME          UNTESTED
S04 DECOMPILE-FIRST        UNTESTED — the kit index measures anatomy but nothing disassembles a kit yet
S05 BODY-AND-JOINTS        PARTIAL — computed once in the originating session, not preserved here: UNVERIFIED
S06 EVENT-TRIGGERED-CALL   UNTESTED
S07 CARD-TO-MASSING        IMPLEMENTED in nabugo-brand.js (planForCard); two cards yield two structures

THE ONE TESTED NUMBER
S01 was run in its cheapest form (a closing pass that tiles open studs). Structural
open-stud share, kits first:
  10174-imperial-atst-ucs      pieces  1060  structural studs open   540  share 0.112
  1621-lunar-mpv               pieces   104  structural studs open    59  share 0.201
  30023-lighthouse             pieces    25  structural studs open    19  share 0.167
  30051-xwing-mini             pieces    61  structural studs open    16  share 0.188
  30054-atst-mini              pieces    47  structural studs open    24  share 0.308
  4489-atat-mini               pieces    82  structural studs open    63  share 0.294
  4494-imperial-shuttle-mini   pieces    84  structural studs open    45  share 0.226
  4838-mini-vehicles           pieces    79  structural studs open    64  share 0.300
  4915-mini-construction       pieces    67  structural studs open    24  share 0.169
  4918-mini-flyers             pieces    75  structural studs open    44  share 0.228
  5935-island-hopper           pieces   203  structural studs open   342  share 0.391
  6965-tie-interceptor         pieces    32  structural studs open    22  share 0.431
  6966-jedi-starfighter-mini   pieces    39  structural studs open    17  share 0.198
  7140-xwing-fighter           pieces   287  structural studs open   483  share 0.368
  889-radar-truck              pieces    35  structural studs open    14  share 0.161
  car                          pieces    61  structural studs open    36  share 0.277

Our builds, before → close-all → ragged-only:
  card-castle              share 0.227 → close-all 0.019 → ragged 0.148   pieces 182 → 262 → 209   bar verdict W/L 4/8 → 4/8 → 4/8
  card-fallingwater        share 0.419 → close-all 0.000 → ragged 0.419   pieces 93 → 367 → 93   bar verdict W/L 1/11 → 3/9 → 1/11
  gauntlet-shore-station   share 0.426 → close-all 0.088 → ragged 0.346   pieces 208 → 359 → 239   bar verdict W/L 5/7 → 4/8 → 6/6
  hms-beagle               share 0.553 → close-all 0.046 → ragged 0.382   pieces 648 → 1264 → 851   bar verdict W/L 1/11 → 1/11 → 1/11
  finch-cactus             share 0.541 → close-all 0.126 → ragged 0.186   pieces 78 → 128 → 120   bar verdict W/L 1/11 → 2/10 → 2/10
  medusa-scriptorium       share 0.367 → close-all 0.019 → ragged 0.149   pieces 1672 → 3165 → 2644   bar verdict W/L 1/11 → 1/11 → 1/11

Control (the pass applied to two real kits — it tiles over their deliberate open surfaces):
  5935-island-hopper       open/piece 1.773 → close-all 0.183 (added 103 tiles) → ragged 0.565 (added 73)
  7140-xwing-fighter       open/piece 1.69 → close-all 0.293 (added 143 tiles) → ragged 0.469 (added 112)

Reading: the naive field closes ports 225→12 on the castle and the
kit critic barely notices (W4/L8 → W4/L8). It moves the shore station from W5/L7 to
W6/L6 in the ragged form and fallingwater from W1/L11 to W3/L9 in the close-all form,
and it overshoots every kit's band in the close-all form. So the field must be a field
of SOLICITATIONS (weighted), not a to-do list of every open port — which is what the
zettels said before the number did (Z-CASTLE-FIELD-AFFORDANCES-001,
Z-HOGWARTS-REWARD-SHAPING-TRAP-001).
