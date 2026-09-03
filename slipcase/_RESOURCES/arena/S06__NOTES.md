# S06 — EVENT-TRIGGERED-CALL — notes

Method: compose.js built the castle card unattended (seed 1); I placed nothing. Each round answered one
named event with ONE plan-parameter change; plans are cumulative (planN = planN-1 + one change).
Judge: `world.js S06 judge-file`, bar 5935 Island Hopper. WIN = inside the band AND strictly closer to the
corpus median than the kit; ties to the kit. Best round kept: round 7 -> castle-S06.mpd (report-file, 8 rounds).

| rd | one change                              | event answered                                   | pcs | W/L | open  | what the judge did |
|----|-----------------------------------------|--------------------------------------------------|-----|-----|-------|--------------------|
| 0  | {}                                      | baseline                                         | 182 | 4/8 | 0.247 | wins LATTICE ANATOMY SYMMETRY DENSITY |
| 1  | figures=[(0,60)]                        | E1 minifig streak x18 (hands vs gatehouse face)  | 182 | 4/8 | 0.247 | nothing: hips vs ward floor plate, legs vs plot |
| 2  | figures=[(90,60)]                       | E1 minifig streak x11 at the ward floor          | 182 | 4/8 | 0.247 | nothing: legs refused "with 3865 (plot)" |
| 3  | figures=[(0,220)]                       | E1 again; catalogue: 3865 is a 16x8 plate (z±80) | 191 | 5/7 | 0.247 | COLOUR 3.11->3.60 WIN; STUFF 0.016->0.063 |
| 4  | props=[]                                | E1 prop streak (frond/flag vs walls) + E3 STUFF over target | 187 | 6/6 | 0.228 | STUFF 0.048 WIN, SNOT 0.139 WIN, COLOUR 3.41 LOSS |
| 5  | massing: +outer garden terrace (0,-230) | E3 COLOUR left the band                          | 196 | 6/6 | 0.248 | COLOUR 3.81 WIN; SNOT diluted to 0.133 LOSS |
| 6  | massing: corner tower courses 5->4      | E3 SNOT left its winning side                    | 182 | 6/6 | 0.275 | SNOT 0.143 WIN; STUFF 0.0495 LOSS by one piece |
| 7  | massing: inner ward (0,60)->(0,80)      | E1 paving x5 + keep-window streak; E3 STUFF      | 185 | 7/5 | 0.258 | STUFF 0.049 WIN; paving refusals 5->2, keep window placed |
| 8  | instanceCap=1                           | E3 REUSE overshoot, the brief's own knob         | 185 | 7/5 | 0.258 | nothing: placements byte-identical to round 7 |

What the world said back that changed what I did
- The verdict is closer-to-median, not more-is-better. STUFF (median 0.046, kit 10/203) therefore wants exactly
  one 9-piece figure with the three prop flags gone, and 9/N only wins for N in 183..188 once SNOT (26/N,
  kit 28/203) is also held. Rounds 4-7 are that arithmetic: every later change had to conserve piece count.
- The refusal packets named a different blocker each time (wall, floor plate, plot). The plot clash only made
  sense after reading nabugo-parts.json: the card's ground 3865 has a 16x8 box, so a figure standing on it
  always penetrates it; (0,220) is off the plate, on the centre line, and symmetric.
- E5 never fired: structural open share stayed 0.228-0.275, inside the kit band 0.112-0.431, all nine composes.
- Knobs the brief lists that the massing (castle) path never reads: perHost, instanceCap, mirrorFrame,
  vocabSpread, poseJoints, halfStudDrift, blockSplit, extraFittings, openings (nabugo-brand.js massingPass;
  `spread` only moves figures). Round 8 confirmed instanceCap empirically. Live levers: figures, props,
  massing, structureColours, skinColour, accentColour.
- Streaks that repeat identically every round (cladding ~83: side-stud hosts sit in the wall-head course;
  bay 18: curtain ends in towers; frame 16: 4-stud east window flanks are the corner cells; tower windows:
  no door gap at 4 studs) are generator geometry, not plan parameters. No one-parameter answer exists.

Final numbers (round 7 = castle-S06.mpd): 185 pieces, 20 blocks, 7 WIN / 5 LOSS, structural open share 0.258.
Wins: COLOUR 4.19, SNOT 0.141, LATTICE 0.849, ANATOMY 9.19, SYMMETRY 0.616, DENSITY 5.27, STUFF 0.049.
Losses: VOCAB 0.141 (needs >0.335), ROT 3.8 (needs >7.9 distinct matrices %), POSE 0.011 (needs 0.02 and
~0.12), SERVICES 0.005 (needs 16-21 services pieces), REUSE 0.432 (needs 0.05-0.177; four instanced towers
alone are 0.43 — de-instancing them costs SYMMETRY/ANATOMY, so left).

Which changes moved which axes: figures -> STUFF, COLOUR (+3 colours), SNOT (+2 rotated legs);
props=[] -> STUFF (-3 flags), COLOUR (-), DENSITY (bbox shrank 4.4->6.5); massing terrace -> COLOUR (+8 tiles
in 4 colours), SNOT (-, dilution); massing tower courses -> SNOT (+), STUFF (-); massing ward -> STUFF (+3),
SERVICES 0->0.005, ANATOMY; instanceCap -> nothing.

Mutation operator to try next: m3 (rewrite the generator's plan, not one parameter). All five remaining losses
need pieces the massing generators cannot emit — side-stud hosts one course higher, a door gap in 4-stud
frames so windows seat, posed joints beyond the two hands. m1 {E1,E3} was sufficient (E5 silent); for m2 the
streak threshold k should count across rounds, since the big streaks recur unchanged every compose.
Hypothesis: 4 -> 7 axis bands in 8 composes (~20 s each); the wins came from the plan's geometry
(figures/props/massing), never from the numeric knobs.
