# S06 — EVENT-TRIGGERED-CALL   (read slipcase/_PROMPTS/S06__EVENT-TRIGGERED-CALL.txt first)
"The reasoner is scheduled by the castle, not by the clock."

You do NOT place pieces. The repository's layered builder builds the castle card unattended;
you are called only on EVENTS and may change ONE plan parameter per round.
Round 0: `echo '{}' > runs/S06/plan0.json`, then
  `node compose.js --plan runs/S06/plan0.json --out runs/S06/round0.mpd --seed 1`
  `node world.js S06 judge-file runs/S06/round0.mpd`
Read the events: E1 refusal streaks (the compose output lists refused placements per layer and
why), E3 axes out of band (judge-file), E5 the structural open share vs the kit band.
Then write runs/S06/plan1.json with ONE change and compose again (each compose takes ~40 s).
Plan fields you may set (values are overrides applied after the card): instanceCap (int),
mirrorFrame (true/false), spread (number, e.g. 1.2), vocabSpread (int), figures (array of
{x,z}), props (array of {x,z}), perHost (int, side-stud hosts), structureColours (array of
LDraw colours), skinColour, accentColour, halfStudDrift (number), blockSplit (true/false),
extraFittings (int), poseJoints (int), openings (array), massing (the full massing array of
the castle card — see /home/user/tractor-dce-gyo/nabugo-brand.js CARDS.castle — you may
change courses/studs/roof/instances/positions). At most 8 rounds. Keep the best round as
runs/S06/castle-S06.mpd and finish with `node world.js S06 report-file runs/S06/castle-S06.mpd <rounds>`.
In NOTES.md list every event you answered, the one change you made, and what the judge did.
Hypothesis: answering events one parameter at a time reaches more axis bands than the closed loop.
