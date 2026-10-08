# The clipping audit of the published films (books 1-24)

Measured 2026-10-08 with `tools/metis/clip.js` (rules, tolerances and limits in its header) on the 49 published performed films `films/odyssey/<id>-performed.mp4` of books 1-24, against the current keyframes, sheets (`odyssey/score/<id>.choreo.json`) and the bundle's sets, every sixth of a second. The cameras are each film's own: its json's cinematographer report replayed (lens where the solver put it, aimed at the subjects), or the take's own grammar where the film has no plan (OD-B01-S03, OD-B09-S09). Per-scene JSON beside this file; the worst three visible faults of each scene as stills in `odyssey/metis/evidence/<id>/clip-<n>.jpg` (magenta: the offending part; yellow: the other body's parts).

**Visible s** is the time some unintended fault is in frame and not behind the set (the gate counts these). **Faults** are the intervals seen for 0.25 s or more. **Off s** is clipping that the shot does not show (offscreen or behind a set part): not counted, listed for the record. **Shade s** is a shade passing through the living: deliberate. Depth is in the smaller figure's height H (a head is about 0.3 H across).

| # | Scene | Visible s | Faults | Longest | Worst visible fault | Off s | Shade s | Gate |
|---|---|---|---|---|---|---|---|---|
| 1 | OD-B09-S11 | 74.0 | 11 | 52.7 | odysseus-s-crew-1 + odysseus-s-crew-2: limb through body (right arm / torso), 0.23 H, 48.0-100.7 s | 10.0 | 0.0 | fails |
| 2 | OD-B09-S09 | 49.0 | 29 | 27.7 | odysseus + polyphemus: body through a creature (head / elbow.L), 0.57 H, 0.5-28.5 s | 36.7 | 0.0 | fails |
| 3 | OD-B09-S08 | 30.5 | 40 | 9.5 | odysseus + polyphemus: body through a creature (hips / hips), 0.49 H, 0.0-9.7 s | 8.3 | 0.0 | fails |
| 4 | OD-B09-S10 | 23.5 | 83 | 13.0 | crewman-1 + team2-b: body through a creature (head / body), 1.42 H, 0.0-22.8 s | 37.0 | 0.0 | fails |
| 5 | OD-B12-S04 | 20.3 | 33 | 9.7 | six-seized-sailors-4 + six-seized-sailors-5: body through body (torso / head), 0.20 H, 44.0-53.7 s | 7.2 | 0.0 | fails |
| 6 | OD-B12-S06 | 18.2 | 8 | 9.8 | eurylochus + crew-sacrificial-group-1: head through head (head / head), 0.11 H, 10.5-22.2 s | 17.5 | 0.0 | fails |
| 7 | OD-B04-S04 | 16.2 | 8 | 9.7 | helen-at-the-horse: feet below the surface prop:horse (right leg (foot)), 0.24 H, 19.0-31.7 s | 3.7 | 0.0 | fails |
| 8 | OD-B13-S01 | 14.8 | 7 | 5.7 | odysseus: feet below the surface prop:rug (right leg (foot)), 0.19 H, 38.3-44.0 s | 6.2 | 0.0 | fails |
| 9 | OD-B22-S01 | 14.5 | 6 | 7.5 | suitors-1 + suitors-2: body through body (head / torso), 0.25 H, 39.5-52.3 s | 20.3 | 0.0 | fails |
| 10 | OD-B07-S03 | 12.7 | 6 | 8.8 | arete: feet below the surface construction-frame (right leg (foot)), 0.14 H, 9.0-58.3 s | 50.2 | 0.0 | fails |
| 11 | OD-B09-S06 | 12.0 | 8 | 4.8 | odysseus-s-expedition-2: feet below the surface construction-frame (left leg (foot)), 0.18 H, 12.3-23.3 s | 13.2 | 0.0 | fails |
| 12 | OD-B11-S01 | 10.2 | 4 | 9.3 | crew-ritual-assistants-3 + crew-ritual-assistants-5: body through body (right arm / head), 0.32 H, 32.3-41.7 s | 16.2 | 0.0 | fails |
| 13 | OD-B14-S01 | 8.8 | 3 | 7.5 | odysseus-as-beggar + dog3: body through a creature (hips / body), 0.22 H, 5.0-12.5 s | 2.2 | 0.0 | fails |
| 14 | OD-B19-S04 | 8.7 | 4 | 4.2 | odysseus-as-beggar: feet below the surface prop:stool1 (right leg (foot)), 0.13 H, 0.0-17.0 s | 24.7 | 0.0 | fails |
| 15 | OD-B22-S06 | 8.0 | 4 | 7.7 | medon + telemachus: limb through body (head / torso), 0.33 H, 22.8-34.8 s | 10.3 | 0.0 | fails |
| 16 | OD-B16-S03 | 7.2 | 3 | 6.2 | odysseus-restored + telemachus: head through head (head / head), 0.14 H, 34.5-40.7 s | 0.0 | 0.0 | fails |
| 17 | OD-B10-S04 | 6.7 | 14 | 2.7 | five-scouts-4 + lion2: body through a creature (hips / body), 0.26 H, 8.5-11.2 s | 3.8 | 0.0 | fails |
| 18 | OD-B04-S05 | 6.0 | 15 | 3.7 | three-men-1: feet below the surface construction-frame (left leg (foot)), 0.11 H, 0.0-9.5 s | 11.5 | 0.0 | fails |
| 19 | OD-B23-S04 | 5.7 | 4 | 3.5 | penelope + odysseus: head through head (head / head), 0.14 H, 26.0-29.5 s | 0.8 | 0.0 | fails |
| 20 | OD-B12-S03 | 5.5 | 14 | 1.0 | crew-at-the-oars-3 + crew-at-the-oars-4: head through head (head / head), 0.23 H, 11.7-12.7 s | 2.7 | 0.0 | fails |
| 21 | OD-B12-S07 | 4.3 | 14 | 1.3 | drowning-crew-5: feet below the surface construction-frame (left leg (foot)), 0.23 H, 39.0-40.3 s | 2.5 | 0.0 | fails |
| 22 | OD-B10-S02 | 4.0 | 8 | 1.2 | three-scouts-3: feet below the surface construction-frame (right leg (foot)), 0.23 H, 23.3-24.7 s | 6.8 | 0.0 | fails |
| 23 | OD-B22-S02 | 3.0 | 3 | 2.7 | eurymachus + four-suitors-1: body through body (head / hips), 0.18 H, 28.8-39.7 s | 8.8 | 0.0 | fails |
| 24 | OD-B01-S03 | 2.8 | 5 | 1.3 | telemachus: feet below the surface construction-frame (right leg (foot)), 0.10 H, 17.8-19.2 s | 18.3 | 0.0 | fails |
| 25 | OD-B08-S05 | 2.5 | 2 | 1.5 | odysseus: feet below the surface prop:stoolO (right leg (foot)), 0.17 H, 48.7-50.2 s | 8.2 | 0.0 | fails |
| 26 | OD-B21-S03 | 2.2 | 7 | 0.8 | eurymachus + suitor-bow-challengers-4: head through head (head / head), 0.27 H, 38.3-39.2 s | 0.8 | 0.0 | fails |
| 27 | OD-B05-S05 | 1.8 | 2 | 1.2 | odysseus: sunk into the sea (hips), 0.83 H, 37.3-39.5 s | 3.2 | 0.0 | fails |
| 28 | OD-B02-S02 | 1.3 | 4 | 1.3 | antinous + four-suitors-1: limb through body (head / torso), 0.31 H, 49.7-51.0 s | 0.7 | 0.0 | fails |
| 29 | OD-B15-S05 | 1.2 | 6 | 0.7 | theoclymenus + piraeus: body through body (torso / head), 0.30 H, 33.3-34.0 s | 0.8 | 0.0 | fails |
| 30 | OD-B18-S02 | 1.2 | 3 | 0.7 | amphinomus + four-suitors-3: body through body (head / torso), 0.31 H, 39.0-39.7 s | 1.3 | 0.0 | fails |
| 31 | OD-B05-S04 | 0.7 | 1 | 0.7 | odysseus: feet below the surface prop:trunk2 (right leg (foot)), 0.14 H, 38.7-39.3 s | 0.5 | 0.0 | fails |
| 32 | OD-B09-S03 | 0.7 | 1 | 0.7 | three-scouts-1 + three-scouts-2: limb through body (right leg / right leg), 0.29 H, 27.7-28.3 s | 0.3 | 0.0 | fails |
| 33 | OD-B17-S03 | 0.7 | 1 | 0.5 | odysseus-as-beggar + eumaeus: body through body (right arm / torso), 0.18 H, 19.5-20.0 s | 0.0 | 0.0 | fails |
| 34 | OD-B24-S05 | 0.5 | 2 | 0.5 | dolius-s-sons-1 + dolius-s-sons-2: limb through body (torso / head), 0.31 H, 17.5-18.0 s | 0.0 | 0.0 | fails |
| 35 | OD-B01-S01 | 0.0 | 0 | 0.0 |  | 0.5 | 0.0 | passes |
| 36 | OD-B01-S02 | 0.0 | 0 | 0.0 |  | 0.2 | 0.0 | passes |
| 37 | OD-B03-S05 | 0.0 | 0 | 0.0 |  | 0.0 | 0.0 | passes |
| 38 | OD-B06-S03 | 0.0 | 0 | 0.0 |  | 1.0 | 0.0 | passes |
| 39 | OD-B10-S01 | 0.0 | 0 | 0.0 |  | 0.0 | 0.0 | passes |
| 40 | OD-B10-S05 | 0.0 | 0 | 0.0 |  | 0.0 | 0.0 | passes |
| 41 | OD-B11-S04 | 0.0 | 0 | 0.0 |  | 0.0 | 7.0 | passes |
| 42 | OD-B11-S07 | 0.0 | 0 | 0.0 |  | 0.0 | 1.3 | passes |
| 43 | OD-B13-S03 | 0.0 | 0 | 0.0 |  | 0.0 | 0.0 | passes |
| 44 | OD-B17-S05 | 0.0 | 0 | 0.0 |  | 0.0 | 0.0 | passes |
| 45 | OD-B19-S03 | 0.0 | 0 | 0.0 |  | 5.8 | 0.0 | passes |
| 46 | OD-B20-S04 | 0.0 | 0 | 0.0 |  | 0.2 | 0.0 | passes |
| 47 | OD-B20-S05 | 0.0 | 0 | 0.0 |  | 2.2 | 0.0 | passes |
| 48 | OD-B21-S07 | 0.0 | 0 | 0.0 |  | 18.5 | 0.0 | passes |
| 49 | OD-B24-S03 | 0.0 | 0 | 0.0 |  | 0.0 | 0.0 | passes |

## The worst intervals

The twenty-five worst visible intervals of the audit, ranked by seconds seen times depth, with the still of each where one was made (the three worst of every scene have one).

| # | Scene | Time (s) | Who | What | Depth | Seen s | Shot | Still | Note |
|---|---|---|---|---|---|---|---|---|---|
| 1 | OD-B09-S11 | 48.0-100.7 (worst 98.3) | odysseus-s-crew-1 + odysseus-s-crew-2 | limb through body (right arm / torso, torso / left arm) | 0.23 H | 52.7 | c24:GIANT:CLOSE, c22:GIANT:MID | [clip-1.jpg](../evidence/OD-B09-S11/clip-1.jpg) | checked: two crewmen stand in one another at the stern through the giant's curse |
| 2 | OD-B09-S09 | 0.5-28.5 (worst 14.2) | odysseus + polyphemus | body through a creature (head / elbow.L, head / hand.L) | 0.57 H | 27.7 | d:0:WIDE:WIDE, d:10:SPK:CLOSE | [clip-1.jpg](../evidence/OD-B09-S09/clip-1.jpg) | Odysseus inside the seated giant's left arm; the film's own frames at 6.0 and 14.2 s are inside the giant (a camera fault: this take predates the cinematographer) |
| 3 | OD-B09-S10 | 0.0-22.8 (worst 4.5) | crewman-1 + team2-b | body through a creature (head / body, head / leg.FL) | 1.42 H | 13.0 | c2:GIANT:CLOSE, c3:ACTION:WIDE | [clip-1.jpg](../evidence/OD-B09-S10/clip-1.jpg) | the man under his ram is also inside the next team's ram: the flock is packed tighter than the rams are long (his own ram is allowed) |
| 4 | OD-B09-S10 | 0.0-10.2 (worst 6.5) | crewman-2 + team3-b | body through a creature (head / body, torso / leg.FL) | 1.42 H | 8.3 | c2:GIANT:CLOSE, c0:WIDE:WIDE | [clip-2.jpg](../evidence/OD-B09-S10/clip-2.jpg) | the man under his ram is also inside the next team's ram: the flock is packed tighter than the rams are long (his own ram is allowed) |
| 5 | OD-B09-S09 | 0.0-26.5 (worst 6.0) | odysseus | leg through construction-frame (right leg, left leg) | 0.61 H | 14.2 | d:5:OBJ:INSERT, d:6:SPK:MID | [clip-2.jpg](../evidence/OD-B09-S09/clip-2.jpg) | his legs in the cave floor under the giant's arm |
| 6 | OD-B09-S10 | 54.8-62.5 (worst 55.2) | crewman-4 + lead | body through a creature (head / body, torso / leg.HR) | 1.78 H | 6.2 | c15:GIANT:MID, c14:GIANT:WIDE | [clip-3.jpg](../evidence/OD-B09-S10/clip-3.jpg) |  |
| 7 | OD-B09-S10 | 0.0-10.2 (worst 0.2) | crewman-2 + crewman-3 | limb through body (head / right leg, head / left leg) | 1.27 H | 7.2 | c2:GIANT:CLOSE, c0:WIDE:WIDE |  | the man under his ram is also inside the next team's ram: the flock is packed tighter than the rams are long (his own ram is allowed) |
| 8 | OD-B09-S10 | 0.0-10.2 (worst 8.7) | crewman-3 + team4-b | body through a creature (head / body, head / leg.FL) | 1.22 H | 7.2 | c2:GIANT:CLOSE, c0:WIDE:WIDE |  | the man under his ram is also inside the next team's ram: the flock is packed tighter than the rams are long (his own ram is allowed) |
| 9 | OD-B09-S10 | 54.2-63.2 (worst 54.8) | odysseus + crewman-1 | limb through body (torso / head, hips / right arm) | 1.42 H | 6.2 | c15:GIANT:MID, c14:GIANT:WIDE |  |  |
| 10 | OD-B09-S10 | 54.5-72.5 (worst 55.3) | crewman-5 + lead | body through a creature (head / body, torso / body) | 2.25 H | 4.2 | c14:GIANT:WIDE, c17:HOT:WIDE |  |  |
| 11 | OD-B09-S10 | 54.7-72.5 (worst 63.7) | crewman-6 + lead | body through a creature (head / body, torso / body) | 2.33 H | 3.7 | c14:GIANT:WIDE, c17:HOT:WIDE |  |  |
| 12 | OD-B09-S08 | 0.0-9.7 (worst 0.5) | odysseus + polyphemus | body through a creature (hips / hips, torso / hips) | 0.49 H | 9.5 | c1:HOT:WIDE, c0:WIDE:WIDE | [clip-1.jpg](../evidence/OD-B09-S08/clip-1.jpg) | checked from the side: Odysseus's head and body inside the standing giant's hips |
| 13 | OD-B09-S11 | 5.5-22.3 (worst 19.8) | odysseus-s-crew-1 + odysseus-s-crew-2 | limb through body (right arm / head, head / left arm) | 0.17 H | 14.0 | c8:GIANT:CLOSE, c3:WIDE:WIDE | [clip-2.jpg](../evidence/OD-B09-S11/clip-2.jpg) |  |
| 14 | OD-B09-S10 | 55.2-70.7 (worst 63.3) | crewman-5 + crewman-6 | head through head (head / head) | 2.06 H | 3.0 | c14:GIANT:WIDE, c16:HOT:MID |  |  |
| 15 | OD-B11-S01 | 32.3-41.7 (worst 32.7) | crew-ritual-assistants-3 + crew-ritual-assistants-5 | body through body (right arm / head, right arm / torso) | 0.32 H | 9.3 | c4:WIDE:WIDE, c3:WIDE:WIDE | [clip-1.jpg](../evidence/OD-B11-S01/clip-1.jpg) | two crewmen at the pit share one place |
| 16 | OD-B04-S04 | 19.0-31.7 (worst 22.0) | helen-at-the-horse | feet below the surface prop:horse (right leg (foot), left leg (foot)) | 0.24 H | 9.7 | c2:HOT:WIDE, c1:HOT:WIDE | [clip-1.jpg](../evidence/OD-B04-S04/clip-1.jpg) |  |
| 17 | OD-B11-S01 | 32.3-41.7 (worst 33.0) | crew-ritual-assistants-3 + crew-ritual-assistants-5 | head through head (head / head) | 0.23 H | 9.3 | c4:WIDE:WIDE, c3:WIDE:WIDE | [clip-2.jpg](../evidence/OD-B11-S01/clip-2.jpg) | two crewmen at the pit share one place |
| 18 | OD-B12-S04 | 44.0-53.7 (worst 45.7) | six-seized-sailors-4 + six-seized-sailors-5 | body through body (torso / head, hips / left arm) | 0.20 H | 9.7 | c17:GIANT:CLOSE, c18:GIANT:MID | [clip-1.jpg](../evidence/OD-B12-S04/clip-1.jpg) | the six seized sailors in Scylla's heads packed into each other |
| 19 | OD-B09-S09 | 42.5-51.8 (worst 50.8) | odysseus + four-stake-bearers-2 | body through body (torso / head, hips / head) | 0.26 H | 8.7 | d:23:SPK:MID, d:24:OBJ:INSERT | [clip-3.jpg](../evidence/OD-B09-S09/clip-3.jpg) |  |
| 20 | OD-B22-S06 | 22.8-34.8 (worst 33.8) | medon + telemachus | limb through body (head / torso, head / right arm) | 0.33 H | 7.7 | c11:TWO:MID, c12:HOT:MID | [clip-1.jpg](../evidence/OD-B22-S06/clip-1.jpg) | Medon (under the hide) and Telemachus |
| 21 | OD-B12-S04 | 45.0-53.7 (worst 47.2) | six-seized-sailors-2 + six-seized-sailors-3 | limb through body (torso / left arm, right arm / head) | 0.22 H | 8.7 | c17:GIANT:CLOSE, c18:GIANT:MID | [clip-2.jpg](../evidence/OD-B12-S04/clip-2.jpg) |  |
| 22 | OD-B12-S06 | 10.5-22.2 (worst 17.2) | eurylochus + crew-sacrificial-group-1 | head through head (head / head) | 0.11 H | 9.8 | c4:HOT:MID, c5:HOT:CLOSE | [clip-1.jpg](../evidence/OD-B12-S06/clip-1.jpg) | Eurylochus's face in a sacrificer's head |
| 23 | OD-B07-S03 | 9.0-58.3 (worst 9.0) | arete | feet below the surface construction-frame (right leg (foot), left leg (foot)) | 0.14 H | 8.8 | c11:WIDE:MID, c20:TWO:MID | [clip-1.jpg](../evidence/OD-B07-S03/clip-1.jpg) | Arete seated: her legs in the dais |
| 24 | OD-B09-S09 | 44.8-53.2 (worst 44.8) | four-stake-bearers-2 + polyphemus | body through a creature (head / torso, torso / torso) | 0.39 H | 6.3 | d:23:SPK:MID, d:24:OBJ:INSERT |  |  |
| 25 | OD-B22-S01 | 39.5-52.3 (worst 46.0) | suitors-1 + suitors-2 | body through body (head / torso, head / left arm) | 0.25 H | 7.5 | c20:WIDE:WIDE, c19:REACT:MID | [clip-1.jpg](../evidence/OD-B22-S01/clip-1.jpg) | two suitors at the back wall in one another |

## Deliberate: the shades and the hiding places

Not counted. The shades pass through the living by design (Anticleia slipping through her son's arms three times, Achilles and his dead company); a hiding place is a prop the score names as one (affords `hide`) with a figure whose own intents say it is under or in it (Menelaus's men under the sealskins).

| Scene | Time (s) | Who | What | Why | Seen s |
|---|---|---|---|---|---|
| OD-B04-S05 | 0.0-9.7 | three-men-2 | leg through prop:skin2 | hidden under skin2 | 9.7 |
| OD-B04-S05 | 0.0-9.7 | three-men-1 | leg through prop:skin1 | hidden under skin1 | 7.8 |
| OD-B11-S04 | 44.5-47.2 | odysseus + anticleia | limb through body | shade | 2.7 |
| OD-B11-S04 | 48.5-50.7 | odysseus + anticleia | limb through body | shade | 2.2 |
| OD-B11-S04 | 45.0-47.0 | odysseus + anticleia | head through head | shade | 2.0 |
| OD-B11-S04 | 48.5-50.5 | odysseus + anticleia | head through head | shade | 2.0 |
| OD-B11-S04 | 42.3-44.0 | odysseus + anticleia | limb through body | shade | 1.7 |
| OD-B11-S04 | 42.3-43.8 | odysseus + anticleia | head through head | shade | 1.5 |
| OD-B11-S04 | 51.0-51.5 | odysseus + anticleia | limb through body | shade | 0.5 |
| OD-B11-S07 | 57.5-58.5 | achilles + patroclus | body through body | shade | 0.8 |
| OD-B11-S07 | 57.7-58.3 | achilles + patroclus | head through head | shade | 0.7 |
| OD-B11-S07 | 57.3-58.0 | achilles + antilochus | head through head | shade | 0.3 |
| OD-B11-S07 | 57.2-58.0 | achilles + antilochus | limb through body | shade | 0.3 |
| OD-B11-S07 | 57.3-58.0 | patroclus + antilochus | limb through body | shade | 0.3 |
| OD-B11-S07 | 57.5-57.7 | patroclus + antilochus | head through head | shade | 0.0 |


