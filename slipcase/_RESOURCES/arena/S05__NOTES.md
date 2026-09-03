# S05 — BODY-AND-JOINTS — notes

## What I did
- Planned the whole castle on a cell grid first (four 4x4 towers, 1-stud curtain walls 3 courses high
  with 1x1 merlons / 1x2 tan tiles, a hollow 6x6 keep of 6 courses with two windows and a plate floor
  under a 33-degree slope ridge, a 1x6 arch gatehouse with 1x2x2 flanking columns, a tiled ward with a
  dark-tan path out of the gate, a well, two trees, two minifigs).
- Kept a field model in a scratch script: BODY table from `tray`, ground ids by the formula, takes =
  footprint cells over open studs at the level, gives = the BODY number. Every piece went in with
  `place ... --joints takes=n,gives=m`, chained ~14 per shell call, one `field --level L` per course.
- `batch` in world.js never checks JOINTS (it calls tryPlace/commit directly), so batch would have
  bypassed the seed's mechanism; I used `place` for all 270 seatings, which is why calls ended at 301.

## What the world said back that changed what I did
- New stud ids are not a geometric rule: each part numbers its studs in its own catalogue order
  (2x4: z-desc/x-desc; 1x6: x-desc; 1x4, 1x3: x-asc; rotated pieces along z). After the level-3
  check found 44 id mismatches I stopped predicting ids and imported them from each level's field read.
- The minifig parts are off-grid bodies: legs reported at x = +/-100 rather than +/-90/110, the torso's
  studs one cell east of its port. Hips "give 2 up", but the torso takes only 1 of them.
- The 3037 probe seated with "takes 4 of 8": not a slope rule but a stale port id (a guard had skipped
  the level-15 read, the model guessed p1675 = corner; it was in the south row). Undid 8 pieces,
  resynced, and added a SEATED-centre check to the apply step. Slopes (3037, 3298) carry their studs on
  the max-z row as drawn, so ridges use e/w pairs.
- After the tower roofs and ridge tiles the structural open share fell to 0.102, below the kit band.
  Ground studs do not count, so two 4x6 yard plates (48 open studs) and leaving the keep ridge as
  open studs lifted it to 0.122.
- The scratchpad is shared by the seven builders; my plan.js was overwritten by an S02 planner mid-run.
  Moved everything to a private S05/ subdirectory.

## Final numbers
- pieces 261 (262 type-1 lines with the 3811 baseplate), 1 block; structural open share 0.122
  (kit band 0.112–0.431).
- judge: 2 WIN (COLOUR, DENSITY) / 10 LOSS (VOCAB, SNOT, ROT, POSE, LATTICE, ANATOMY, REUSE,
  SYMMETRY, SERVICES, STUFF) / 0 TIE.
- JOINTS right/wrong 270/5 (98.2%); refusals 7 (5 wrong JOINTS + 2 head placements on ids the
  world never issued); undos 9; calls 301.
- Wrong predictions: torso takes=2 (true 1) twice for each minifig — the second pair was my own
  tooling fault (a failed plan regeneration re-emitted the refuted line); roof probe takes=8 (true 4)
  from the stale id. No prediction of gives was ever wrong: the BODY number held for every part.
- Accuracy by phase: ground 49/49, courses 2–4 159/161, courses 5, roofs and figures 62/63.

## Next mutation operator
m3 (exact stud coordinates in the port index, not counts). Every miss came from not knowing where a
stud physically was — off-grid minifig studs, a guessed id — never from the count on the BODY line.
With coordinates the takes prediction becomes a lookup and the slope/minifig cases stop being probes;
m2 (predict vs report after the fact) would then be the clean ablation of whether the echo itself,
rather than the coordinates, is what keeps floats and clashes at zero (they were zero here).
