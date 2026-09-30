# Staging

The film's scenes as the performance engine receives them: the set each is played on, who stands where at each key, and what the cameras see.
This file records the scenes staged for the engine, the blocking defects fixed in existing takes, and a scan of every probed take for the
defects that remain.

## New scenes staged

| scene | set | cast (actors) | keys | notes for the engine |
|---|---|---|---|---|
| OD-B09-S08 The Name Nobody and the Stake | the forage's cave (card as foraged) | Odysseus, four chosen helpers, crewman-1 and crewman-2 (added by `film-readymades/staging.py`: the two eaten at dawn) | K1 night, K2 dawn, K3 day, K4 and K5 evening, one per voiced turn on the Regulars' Cut clock (`clock` in the spec) | Polyphemus is a prop the rig replaces: `polyphemusSprawl` asleep (K1), `polyphemus` standing (K2, K5), scale 1.4. crewman-1 hangs in the giant's right fist in K2 (`@polyphemus.handR`): the rider for `grip.R` (SEIZE, EAT). The stake is one prop with states (`stakeStates`): trunk, stakeCold, stake (glowing, in the fire), stakeCold under the `dung` prop. The offer: the `bowl` in Odysseus's raised hands, the giant three heights over him (K5). The flock (`ram`, `ramBlack`) at the door in K2 and K5 |
| OD-B09-S10 Escape beneath the Rams | the cave mouth: the Cyclops kit's headland and shore (`tools/forage/product/cyclops.py`) without its posed moment, nameplate or yard rams, turned so the lane runs out toward +z, and opened above the vault as the forage's caves are, keeping the arch over the mouth tunnel (`staging.py`). World units: the vault z -295..-49, the tunnel x -56..84 out to the mouth at z ~70, the fire (-70, -165), the cheese racks (112, -137), the yard wall z 4..102, the strip of turf and sand z 74..130, the water beyond (the black ship afloat, x -337..-28) | Odysseus, crewman-1 to crewman-6 | K1 dawn at the door, K2 the binding (night), K3 the lead ram stopped, K4 west along the strip to the ship, K5 the great ram for Zeus | Polyphemus `polyphemusSprawl` sitting in the door at (-75, 40), scale 1.5 (the rig's `sit`; GROPE across the lane, then `reach` to `lead:back`). The flock: `team<n>-a/b/c` three abreast (scale 1.4, 30 apart), the man under each `b` (riders `belly`, lie `under`); K1 has four teams in single file down the lane and two already out on the strip (the floor holds no more at once: they pass one after another). The lead ram `lead`, scale 2.6, Odysseus beneath it (K3). The men beneath are tilted face up and held just off the floor (`tilt`, `air`, arms up into the fleece) |
| OD-B01-S02 Athena's Two-Part Plan | the forage's Olympus (the OD-B01-S01 frame) | Athena, Hermes | K1 the errand to Hermes, K2 Ithaca for herself, K3 the sandals and the spear (T03, narration, is cut) | K3 seats Athena on her throne leaning to her feet (SIT, TEND); the `spear` prop stands by the throne for the TAKE; the descent (the frame of light at (-175, -79)) is the LEAVE. The baked sandals and spear are hidden |

Props added to `odyssey/keyframes/props.json`: `dung` (a heap over the stake), `spear` (Athena's bronze-shod spear, 4497 in gold),
`oar` (a shaft of two 4L antennas and a blade, anchors `grip`, `loom`, `blade`).

## Blocking defects fixed in existing takes

| scene | defect (NEEDS.md) | fix |
|---|---|---|
| OD-B10-S02 | from 18.4 s the seized scout blocked 158 units in the air (y 205, over Antiphates' hand, not in it) | K3: three-scouts-2 hangs by the waist from `@antiphates.hand` (feet at y 155): the rider for the Laestrygon rig's `grip.R`. It still reads as floating in the rig desk's previz until the engine rigs Antiphates |
| OD-B10-S02 | wides at 24.4-26.1 s frame no one (every actor absent in K4: the giants are props) | K4: Odysseus watches from his own ship outside the mouth (`on` black ship 3), a soft subject of the still |
| OD-B10-S02 | the cable cut with no ship or crew | K5: the two scouts who fled are aboard his ship at the benches, facing aft, arms forward (the ship `black ship 3` was never hidden; now it is manned) |
| OD-B10-S04 | Circe 12 units up at 24 s | K3: Circe `y: ground` |
| OD-B10-S04 | Eurylochus invisible until 38 s, the witness never seen | K2, K3: Eurylochus at the lion gate (130, 200), watching in, not entering |
| OD-B10-S04 | his head fills the frame for 14 s (the report shot over his shoulder onto Circe) | K5: Circe is not in the still (he runs back to the ship to report), so the take has no one to shoot the report over his head onto |
| OD-B09-S03 | the lotus inserts (3.6-17 s) frame Odysseus's chest: no lotus staged in K1 | K1: a lotus-eater holds out the lotus (`lotusHeld`, id `lotus`, in her left hand); a soft subject of the still |
| OD-B09-S03 | the scouts sit instead of lying | K3: the three lie back in the meadow (`lie`), arms kept |
| OD-B09-S03 | at 20.9 s a figure stands on another's head | not a stacking: Odysseus on the ship's deck far behind, drawn over three-scouts-2's head from the K1 camera. K1: the scouts moved off that line (x -85, -30) |
| OD-B09-S11 | the crew hold upright oars and do not row | every key: the crew sit (`sit`) at the gunwales facing aft, arms forward, each with an `oar` from the hand out over the side to the water. The stroke is the engine's |

## Defects that are not blocking (for the engine and the take)

- **The take's shot cameras.** SPK, REACT and OBJ cameras are placed by the take's cutter (`film-readymades/odyssey-take.js`), not by
  the keyframes. The scan finds them inside a figure or inside set geometry: OD-B09-S11 92.7-93.9 s and 97-98.9 s (SPK close-ups
  inside crew-2 and the hull), OD-B09-S03 28.8-43 s (inside the lotus land's piece), OD-B19-S04, OD-B12-S04, OD-B21-S07 and others (table below).
  A cutter check against the location's colliders and the figures' bodies before a camera is kept would clear the class.
- **Previz heading.** In the rig desk's previz of OD-B09-S03 (29-40 s) Odysseus is drawn with his back to the lens while the take
  turns him to face it (heading pi, facing -z, the camera at -z): the desk seems to draw some headings flipped, which reads as "the camera
  inside his head".
- **Giants and flocks as props.** Riders (the seized scout, crewman-1 in K2 of OD-B09-S08, the men under the rams) float or sink in the
  previz until the creature rigs replace the props and carry them.
- **Read and left as they are.** OD-B08-S05's empty wides (0-4.6 s, 13.7-17.6 s) are the song made visible: the horse alone on the
  shore, no actor in the still, by design. The long `in-figure` runs of OD-B16-S03 (34-42.5 s) and OD-B23-S04 (19-29.5 s, 35-45.4 s)
  are the embraces (CONTACT, the engine's). OD-B12-S04's `on-head` at 41.2 s is a sailor in Scylla's jaws over Odysseus (a rider).
  The runs of three to five drawings in `in-figure` (OD-B02-S02 49.8 s, OD-B04-S04 34.5 s, OD-B05-S05 32.3 s, OD-B10-S04 10.7 s,
  OD-B12-S03 14.7 s, 33.9 s, 36 s, OD-B12-S07 39.8 s) are figures crossing while the take eases them between two keys' marks: the
  marks are clear, the path between them is not (a walk that steps round is the engine's).
- **`lie` and `y: ground` under a roof.** `kfGround` casts from y 2000, so under any roof (a vault, a palm) it finds the roof, and a
  `floor: true` prop lands on it. The cave mouth is opened above the vault for this reason; a set with a roof over its cast needs
  `kfGround` to cast from the figure's own height (`odyssey-runtime.js`), not yet done.

## The scan

`python3 odyssey/keyframes/staging_scan.py [scenes] --md odyssey/keyframes/STAGING.md` reads, drawing by drawing, what
`odyssey/cascade/tools/rig_probe.cjs` recorded of each take (the shot camera, every figure's seven body points and in-frame flag) with
the location's collider boxes, and lists runs of three drawings or more of: the lens inside a figure (`cam-in-figure`) or a set piece
(`cam-in-set`), two figures through each other (`in-figure`), feet on a head (`on-head`), an upright figure over (`float`) or under
(`sunk`) the highest surface beneath it, and shots with no figure in frame (`empty-wide`, `empty-shot`: an OBJ insert of a prop may be
right). `cam-in-set` reads every piece's colliders whether or not a key hides the piece: a lens inside a hidden baked giant
(OD-B09-S08 51-60 s, `polyphemus`) is no defect. The support test uses collider boxes (a bench, a hull, a rock's box), so `float` and `sunk` are candidates to look at, not
verdicts: a man seated on a bench or standing in a hull's box shows as sunk. The table is the scan of the probes on record; the scenes
whose blocking changed above are re-probed when they are prepared again.

<!-- scan:begin -->
| scene | defect | who | take clock (s) | drawings | shot | whose |
|---|---|---|---|---|---|---|
| OD-B01-S01 | sunk | zeus | 11.17-13.17 | 25 | d:1:WIDE:WIDE | blocking |
| OD-B01-S01 | sunk | athena | 11.17-11.42 | 4 | d:1:WIDE:WIDE | blocking |
| OD-B01-S01 | sunk | zeus | 40.67-40.92 | 4 | d:6:SPK:MID | blocking |
| OD-B01-S03 | float | palace-servants-2 | 0.08-1.08 | 13 | d:10:WIDE:WIDE | blocking |
| OD-B01-S03 | float | palace-servants-4 | 0.17-0.75 | 8 | d:10:WIDE:WIDE | blocking |
| OD-B01-S03 | float | palace-servants-3 | 1.92-2.75 | 11 | d:0:WIDE:WIDE | blocking |
| OD-B01-S03 | float | palace-servants-4 | 2.42-3.33 | 12 | d:0:WIDE:WIDE | blocking |
| OD-B01-S03 | float | palace-servants-2 | 2.58-3.83 | 16 | d:0:WIDE:WIDE | blocking |
| OD-B01-S03 | float | palace-servants-3 | 4.75-5.17 | 6 | d:0:WIDE:WIDE | blocking |
| OD-B01-S03 | float | palace-servants-3 | 11.75-13.33 | 20 | d:3:REACT:CLOSE | blocking |
| OD-B01-S03 | sunk | the-suitors-1 | 11.75-12.08 | 5 | d:3:REACT:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-4 | 12.42-13.67 | 16 | d:3:REACT:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-4 | 15.08-15.58 | 7 | d:3:REACT:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-3 | 15.42-16.08 | 9 | d:3:REACT:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-4 | 17.42-17.83 | 6 | d:4:WIDE:WIDE | blocking |
| OD-B01-S03 | sunk | the-suitors-1 | 20.17-21.33 | 15 | d:4:WIDE:WIDE | blocking |
| OD-B01-S03 | float | palace-servants-4 | 20.5-20.75 | 4 | d:4:WIDE:WIDE | blocking |
| OD-B01-S03 | float | palace-servants-3 | 21.42-21.83 | 6 | d:5:WIDE:WIDE | blocking |
| OD-B01-S03 | float | palace-servants-3 | 23.08-23.75 | 9 | d:5:WIDE:WIDE | blocking |
| OD-B01-S03 | float | palace-servants-3 | 25.42-26.25 | 11 | d:6:SPK:MID | blocking |
| OD-B01-S03 | float | palace-servants-3 | 30.58-30.75 | 3 | d:7:REACT:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-2 | 31.08-32 | 12 | d:7:REACT:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-3 | 31.08-31.5 | 6 | d:7:REACT:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-3 | 32.92-34.17 | 16 | d:8:SPK:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-4 | 33.17-33.75 | 8 | d:8:SPK:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-4 | 35.75-36.75 | 13 | d:9:SPK:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-3 | 35.83-36.42 | 8 | d:9:SPK:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-4 | 38.42-38.75 | 5 | d:9:SPK:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-3 | 39.83-41.17 | 17 | d:9:SPK:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-4 | 40.25-41 | 10 | d:10:SPK:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-4 | 42.83-44.08 | 16 | d:10:SPK:CLOSE | blocking |
| OD-B01-S03 | float | palace-servants-3 | 43.08-44.42 | 17 | d:10:SPK:CLOSE | blocking |
| OD-B02-S02 | float | penelope-at-the-loom | 21.92-25.92 | 49 | d:6:SPK:MID | blocking |
| OD-B02-S02 | cam-in-set | column 4 | 26-28.5 | 31 | insert:loom | take camera (cutter) |
| OD-B02-S02 | empty-shot | INSERT | 26-28.5 | 31 | insert:loom | take camera (cutter) |
| OD-B02-S02 | float | penelope-at-the-loom | 28.58-50.5 | 264 | d:8:SPK:MID | blocking |
| OD-B02-S02 | sunk | penelope-at-the-loom | 49.58-50.5 | 12 | d:14:SPK:MID | blocking |
| OD-B02-S02 | in-figure | antinous / four-suitors-1 | 49.75-50.08 | 5 | d:14:SPK:MID | blocking |
| OD-B02-S02 | sunk | four-suitors-3 | 50.25-50.58 | 5 | d:14:SPK:MID | blocking |
| OD-B02-S02 | float | penelope-at-the-loom | 50.67-59.83 | 111 | d:14:SPK:MID | blocking |
| OD-B02-S02 | sunk | penelope-at-the-loom | 50.67-59.83 | 111 | d:14:SPK:MID | blocking |
| OD-B02-S02 | sunk | four-suitors-1 | 50.67-51.08 | 6 | d:14:SPK:MID | blocking |
| OD-B04-S04 | in-figure | odysseus / hidden-greek-warriors-4 | 34.5-34.67 | 3 | d:4:SPK:MID | blocking |
| OD-B04-S04 | in-figure | odysseus / hidden-greek-warriors-1 | 34.83-35 | 3 | d:4:SPK:MID | blocking |
| OD-B04-S05 | empty-shot | REACT | 10.33-10.5 | 3 | d:2:REACT:CLOSE | take camera (cutter) |
| OD-B04-S05 | empty-shot | OBJ | 10.58-13.33 | 34 | d:3:OBJ:INSERT | take camera (cutter) |
| OD-B04-S05 | float | menelaus | 13.42-16.5 | 38 | d:4:WIDE:WIDE | blocking |
| OD-B04-S05 | float | three-men-1 | 13.42-16.5 | 38 | d:4:WIDE:WIDE | blocking |
| OD-B04-S05 | float | three-men-2 | 13.42-16.5 | 38 | d:4:WIDE:WIDE | blocking |
| OD-B04-S05 | empty-shot | OBJ | 16.58-19 | 30 | d:5:OBJ:INSERT | take camera (cutter) |
| OD-B04-S05 | float | menelaus | 19.08-19.42 | 5 | d:5:OBJ:INSERT | blocking |
| OD-B04-S05 | float | three-men-1 | 19.08-30 | 132 | d:5:OBJ:INSERT | blocking |
| OD-B04-S05 | float | three-men-2 | 19.08-25.33 | 76 | d:5:OBJ:INSERT | blocking |
| OD-B05-S04 | sunk | odysseus | 39.5-39.75 | 4 | d:3:SPK:MID | blocking |
| OD-B05-S04 | sunk | calypso | 40.08-40.5 | 6 | d:3:SPK:MID | blocking |
| OD-B05-S04 | sunk | odysseus | 40.17-40.67 | 7 | d:3:SPK:MID | blocking |
| OD-B05-S05 | sunk | odysseus | 0.08-47.17 | 566 | d:5:WIDE:WIDE | blocking |
| OD-B05-S05 | sunk | poseidon | 11.5-21.33 | 119 | d:1:WIDE:WIDE | blocking |
| OD-B05-S05 | sunk | ino-leucothea | 32.17-33.92 | 22 | d:4:OBJ:INSERT | blocking |
| OD-B05-S05 | in-figure | odysseus / ino-leucothea | 32.25-32.58 | 5 | d:4:OBJ:INSERT | blocking |
| OD-B05-S05 | sunk | ino-leucothea | 35.17-36.67 | 19 | d:4:OBJ:INSERT | blocking |
| OD-B06-S03 | float | nausicaa | 0.25-3.58 | 41 | d:19:OBJ:INSERT | blocking |
| OD-B06-S03 | float | nausicaa | 6.75-6.92 | 3 | d:3:REACT:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 7.92-9.83 | 24 | d:3:REACT:CLOSE | blocking |
| OD-B06-S03 | sunk | nausicaa-s-maids-2 | 9.33-9.75 | 6 | d:3:REACT:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 15-15.42 | 6 | d:6:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 17-17.42 | 6 | d:8:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 17.58-17.92 | 5 | d:8:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 18.08-19.25 | 15 | d:8:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 21.08-22.42 | 17 | d:9:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 22.67-23.08 | 6 | d:10:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 23.58-23.75 | 3 | d:10:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 24.83-26 | 15 | d:10:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 27.5-28.25 | 10 | d:12:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 28.83-29.75 | 12 | d:13:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 30-30.17 | 3 | d:13:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 30.67-30.92 | 4 | d:14:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 31.17-34.42 | 40 | d:14:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 34.75-35 | 4 | d:16:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 36-36.25 | 4 | d:16:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 37.58-38.67 | 14 | d:17:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 39.92-40.33 | 6 | d:18:SPK:CLOSE | blocking |
| OD-B06-S03 | float | nausicaa | 40.5-40.75 | 4 | d:19:OBJ:INSERT | blocking |
| OD-B06-S03 | float | nausicaa | 41.5-43 | 19 | d:19:OBJ:INSERT | blocking |
| OD-B08-S05 | empty-wide | WIDE | 0-4.58 | 56 | d:12:WIDE:WIDE | blocking |
| OD-B08-S05 | empty-shot | SPK | 4.67-13.58 | 108 | d:1:SPK:CLOSE | take camera (cutter) |
| OD-B08-S05 | empty-wide | WIDE | 13.67-17.58 | 48 | d:3:WIDE:WIDE | blocking |
| OD-B08-S05 | empty-shot | OBJ | 17.67-21.58 | 48 | d:4:OBJ:INSERT | take camera (cutter) |
| OD-B08-S05 | empty-shot | SPK | 21.67-29.75 | 98 | d:5:SPK:CLOSE | take camera (cutter) |
| OD-B08-S05 | empty-shot | INSERT | 29.83-33.75 | 48 | insert:lyre | take camera (cutter) |
| OD-B08-S05 | empty-shot | SPK | 33.83-43.58 | 118 | d:7:SPK:CLOSE | take camera (cutter) |
| OD-B08-S05 | empty-shot | OBJ | 43.67-47.58 | 48 | d:10:OBJ:INSERT | take camera (cutter) |
| OD-B08-S05 | empty-shot | SPK | 47.67-51.58 | 48 | d:11:SPK:CLOSE | take camera (cutter) |
| OD-B09-S03 | sunk | three-scouts-2 | 0.67-3.58 | 36 | d:0:WIDE:WIDE | blocking |
| OD-B09-S03 | sunk | three-scouts-2 | 18.17-21.33 | 39 | insert:lotus | blocking |
| OD-B09-S03 | sunk | three-scouts-2 | 27.17-27.75 | 8 | d:2:WIDE:WIDE | blocking |
| OD-B09-S03 | sunk | three-scouts-1 | 27.83-28.33 | 7 | d:2:WIDE:WIDE | blocking |
| OD-B09-S03 | sunk | odysseus | 28-28.17 | 3 | d:2:WIDE:WIDE | blocking |
| OD-B09-S03 | float | odysseus | 28.17-28.33 | 3 | d:2:WIDE:WIDE | blocking |
| OD-B09-S03 | cam-in-set | the lotus eaters land | 28.75-43 | 172 | d:3:SPK:CLOSE | take camera (cutter) |
| OD-B09-S08 | float | crewman-1 | 9.42-10.25 | 11 | d:1:OBJ:INSERT | blocking |
| OD-B09-S08 | in-figure | four-chosen-helpers-1 / four-chosen-helpers-2 | 10-10.75 | 10 | d:1:OBJ:INSERT | blocking |
| OD-B09-S08 | sunk | odysseus | 10.83-11.5 | 9 | d:1:OBJ:INSERT | blocking |
| OD-B09-S08 | float | crewman-1 | 11.17-11.42 | 4 | d:1:OBJ:INSERT | blocking |
| OD-B09-S08 | in-figure | four-chosen-helpers-1 / four-chosen-helpers-4 | 21.5-21.67 | 3 | d:2:OBJ:INSERT | blocking |
| OD-B09-S08 | in-figure | four-chosen-helpers-1 / four-chosen-helpers-2 | 21.83-22.42 | 8 | d:2:OBJ:INSERT | blocking |
| OD-B09-S08 | sunk | four-chosen-helpers-3 | 35.08-35.92 | 11 | d:4:OBJ:INSERT | blocking |
| OD-B09-S08 | sunk | four-chosen-helpers-1 | 35.58-35.83 | 4 | d:4:OBJ:INSERT | blocking |
| OD-B09-S08 | sunk | four-chosen-helpers-4 | 36.08-36.33 | 4 | d:5:SPK:CLOSE | blocking |
| OD-B09-S08 | cam-in-figure | four-chosen-helpers-2 | 39-39.42 | 6 | d:5:SPK:CLOSE | take camera (cutter) |
| OD-B09-S08 | sunk | four-chosen-helpers-4 | 39.5-42.08 | 32 | insert:stake | blocking |
| OD-B09-S08 | in-figure | four-chosen-helpers-2 / four-chosen-helpers-3 | 42.25-42.58 | 5 | d:5:SPK:CLOSE | blocking |
| OD-B09-S08 | in-figure | four-chosen-helpers-1 / four-chosen-helpers-4 | 42.58-42.75 | 3 | d:5:SPK:CLOSE | blocking |
| OD-B09-S08 | sunk | four-chosen-helpers-2 | 42.75-43.42 | 9 | d:5:SPK:CLOSE | blocking |
| OD-B09-S08 | in-figure | four-chosen-helpers-3 / four-chosen-helpers-4 | 43.08-43.58 | 7 | d:5:SPK:CLOSE | blocking |
| OD-B09-S08 | sunk | four-chosen-helpers-1 | 43.25-43.67 | 6 | d:5:SPK:CLOSE | blocking |
| OD-B09-S08 | cam-in-set | polyphemus | 51-60.42 | 114 | d:7:SPK:CLOSE | take camera (cutter) |
| OD-B09-S11 | float | odysseus-s-crew-5 | 0-17.67 | 213 | d:48:WIDE:WIDE | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 0-17.67 | 213 | d:48:WIDE:WIDE | blocking |
| OD-B09-S11 | float | odysseus-s-crew-5 | 19.25-20.75 | 19 | d:8:SPK:CLOSE | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 19.25-20.75 | 19 | d:8:SPK:CLOSE | blocking |
| OD-B09-S11 | float | odysseus-s-crew-5 | 22.5-26.92 | 54 | d:10:SPK:CLOSE | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 22.5-26.92 | 54 | d:10:SPK:CLOSE | blocking |
| OD-B09-S11 | float | odysseus-s-crew-5 | 28.75-48.75 | 241 | d:13:SPK:MID | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 28.75-48.75 | 241 | d:13:SPK:MID | blocking |
| OD-B09-S11 | float | odysseus-s-crew-5 | 49.42-54.92 | 67 | d:23:SPK:CLOSE | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 49.42-54.92 | 67 | d:23:SPK:CLOSE | blocking |
| OD-B09-S11 | float | odysseus-s-crew-5 | 56.58-60.42 | 47 | d:27:SPK:CLOSE | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 56.58-60.42 | 47 | d:27:SPK:CLOSE | blocking |
| OD-B09-S11 | sunk | odysseus | 60.33-60.92 | 8 | d:28:SPK:CLOSE | blocking |
| OD-B09-S11 | sunk | odysseus | 61.5-61.75 | 4 | d:29:WIDE:WIDE | blocking |
| OD-B09-S11 | float | odysseus-s-crew-5 | 62.5-68.33 | 71 | d:30:SPK:CLOSE | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 62.5-68.33 | 71 | d:30:SPK:CLOSE | blocking |
| OD-B09-S11 | float | odysseus-s-crew-5 | 69.92-72.83 | 36 | d:34:SPK:CLOSE | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 69.92-72.83 | 36 | d:34:SPK:CLOSE | blocking |
| OD-B09-S11 | float | odysseus-s-crew-5 | 75.33-80.75 | 66 | d:36:SPK:CLOSE | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 75.33-80.75 | 66 | d:36:SPK:CLOSE | blocking |
| OD-B09-S11 | float | odysseus-s-crew-5 | 82.83-85.08 | 28 | d:40:SPK:CLOSE | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 82.83-85.08 | 28 | d:40:SPK:CLOSE | blocking |
| OD-B09-S11 | float | odysseus-s-crew-5 | 86.83-92.17 | 65 | d:42:SPK:CLOSE | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 86.83-92.17 | 65 | d:42:SPK:CLOSE | blocking |
| OD-B09-S11 | cam-in-figure | odysseus-s-crew-2 | 92.67-93.92 | 16 | d:44:SPK:CLOSE | take camera (cutter) |
| OD-B09-S11 | cam-in-set | black ship | 92.67-93.92 | 16 | d:44:SPK:CLOSE | take camera (cutter) |
| OD-B09-S11 | float | odysseus-s-crew-5 | 95.5-96.92 | 18 | d:46:WIDE:WIDE | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 95.5-96.92 | 18 | d:46:WIDE:WIDE | blocking |
| OD-B09-S11 | cam-in-figure | odysseus-s-crew-2 | 97-98.92 | 24 | d:47:SPK:CLOSE | take camera (cutter) |
| OD-B09-S11 | cam-in-set | black ship | 97-98.92 | 24 | d:47:SPK:CLOSE | take camera (cutter) |
| OD-B09-S11 | float | odysseus-s-crew-5 | 99-100.42 | 18 | d:48:WIDE:WIDE | blocking |
| OD-B09-S11 | sunk | odysseus-s-crew-5 | 99-100.42 | 18 | d:48:WIDE:WIDE | blocking |
| OD-B10-S01 | none found | | | | | |
| OD-B10-S02 | float | three-scouts-1 | 14.58-16.5 | 24 | d:5:WIDE:WIDE | blocking |
| OD-B10-S02 | sunk | three-scouts-1 | 14.67-16.5 | 23 | d:5:WIDE:WIDE | blocking |
| OD-B10-S02 | float | three-scouts-2 | 16.25-17 | 10 | d:6:SPK:MID | blocking |
| OD-B10-S02 | empty-shot | SPK | 17.08-20.67 | 44 | d:6:SPK:MID | take camera (cutter) |
| OD-B10-S02 | float | three-scouts-2 | 20.75-24.33 | 44 | d:7:WIDE:WIDE | blocking |
| OD-B10-S02 | cam-in-set | the sea | 21.33-21.92 | 8 | d:7:WIDE:WIDE | take camera (cutter) |
| OD-B10-S02 | cam-in-set | black ship | 22.33-23.67 | 17 | d:7:WIDE:WIDE | take camera (cutter) |
| OD-B10-S02 | empty-wide | WIDE | 24.42-26.08 | 21 | d:8:WIDE:WIDE | blocking |
| OD-B10-S02 | empty-shot | SPK | 26.17-26.42 | 4 | d:9:SPK:MID | take camera (cutter) |
| OD-B10-S04 | in-figure | five-scouts-3 / five-scouts-4 | 10.67-10.83 | 3 | d:5:SPK:MID | blocking |
| OD-B10-S04 | sunk | five-scouts-3 | 12.08-13.17 | 14 | d:6:REACT:CLOSE | blocking |
| OD-B10-S04 | sunk | five-scouts-3 | 16.25-23.17 | 84 | d:8:WIDE:WIDE | blocking |
| OD-B10-S04 | sunk | five-scouts-1 | 23.25-23.58 | 5 | d:10:SPK:MID | blocking |
| OD-B10-S04 | sunk | circe | 23.83-24 | 3 | d:10:SPK:MID | blocking |
| OD-B10-S04 | cam-in-set | circe s house | 37.42-38.08 | 9 | d:16:WIDE:WIDE | take camera (cutter) |
| OD-B10-S05 | empty-shot | REACT | 7.67-9.83 | 27 | d:2:REACT:CLOSE | take camera (cutter) |
| OD-B10-S05 | cam-in-set | the forest path | 9.92-10.5 | 8 | d:2:REACT:CLOSE | take camera (cutter) |
| OD-B11-S01 | cam-in-set | black ship | 9.92-23.58 | 165 | d:1:WIDE:WIDE | take camera (cutter) |
| OD-B11-S01 | sunk | crew-ritual-assistants-5 | 22.83-23 | 3 | d:2:WIDE:WIDE | blocking |
| OD-B11-S01 | float | crew-ritual-assistants-5 | 23.17-24.25 | 14 | d:2:WIDE:WIDE | blocking |
| OD-B11-S01 | sunk | crew-ritual-assistants-4 | 35.25-37.33 | 26 | d:4:WIDE:WIDE | blocking |
| OD-B11-S01 | float | crew-ritual-assistants-4 | 40.42-41.08 | 9 | d:4:WIDE:WIDE | blocking |
| OD-B12-S03 | sunk | crew-at-the-oars-3 | 7.33-8 | 9 | d:1:SPK:CLOSE | blocking |
| OD-B12-S03 | float | crew-at-the-oars-3 | 7.42-8 | 8 | d:1:SPK:CLOSE | blocking |
| OD-B12-S03 | in-figure | odysseus / crew-at-the-oars-3 | 14.67-14.92 | 4 | d:2:OBJ:INSERT | blocking |
| OD-B12-S03 | sunk | crew-at-the-oars-1 | 14.67-16.17 | 19 | d:2:OBJ:INSERT | blocking |
| OD-B12-S03 | sunk | crew-at-the-oars-3 | 14.83-15.92 | 14 | d:2:OBJ:INSERT | blocking |
| OD-B12-S03 | float | crew-at-the-oars-3 | 14.92-16.25 | 17 | d:2:OBJ:INSERT | blocking |
| OD-B12-S03 | float | crew-at-the-oars-1 | 14.92-16.08 | 15 | d:2:OBJ:INSERT | blocking |
| OD-B12-S03 | sunk | crew-at-the-oars-1 | 30.33-31.75 | 18 | d:3:SPK:CLOSE | blocking |
| OD-B12-S03 | float | crew-at-the-oars-1 | 30.5-31.67 | 15 | d:3:SPK:CLOSE | blocking |
| OD-B12-S03 | in-figure | odysseus / crew-at-the-oars-4 | 33.92-34.08 | 3 | d:3:SPK:CLOSE | blocking |
| OD-B12-S03 | in-figure | odysseus / crew-at-the-oars-4 | 36-36.67 | 9 | d:3:SPK:CLOSE | blocking |
| OD-B12-S03 | float | crew-at-the-oars-2 | 36.33-37.5 | 15 | d:3:SPK:CLOSE | blocking |
| OD-B12-S03 | float | crew-at-the-oars-1 | 36.42-37.42 | 13 | d:3:SPK:CLOSE | blocking |
| OD-B12-S03 | sunk | crew-at-the-oars-1 | 36.42-37.5 | 14 | d:3:SPK:CLOSE | blocking |
| OD-B12-S03 | sunk | crew-at-the-oars-5 | 36.5-37.17 | 9 | d:3:SPK:CLOSE | blocking |
| OD-B12-S04 | sunk | six-seized-sailors-1 | 10-10.25 | 4 | d:4:WIDE:WIDE | blocking |
| OD-B12-S04 | sunk | six-seized-sailors-2 | 10.08-10.25 | 3 | d:4:WIDE:WIDE | blocking |
| OD-B12-S04 | sunk | six-seized-sailors-1 | 24.67-24.92 | 4 | d:11:SPK:CLOSE | blocking |
| OD-B12-S04 | cam-in-set | black ship | 26.75-26.92 | 3 | d:11:SPK:CLOSE | take camera (cutter) |
| OD-B12-S04 | cam-in-set | scylla s rock | 30.92-31.92 | 13 | d:14:WIDE:WIDE | take camera (cutter) |
| OD-B12-S04 | cam-in-figure | six-seized-sailors-5 | 33.83-34.25 | 6 | d:15:SPK:CLOSE | take camera (cutter) |
| OD-B12-S04 | cam-in-set | scylla s rock | 39-40.25 | 16 | d:17:SPK:MID | take camera (cutter) |
| OD-B12-S04 | float | six-seized-sailors-6 | 40.33-40.58 | 4 | d:17:SPK:MID | blocking |
| OD-B12-S04 | sunk | six-seized-sailors-6 | 40.33-40.58 | 4 | d:17:SPK:MID | blocking |
| OD-B12-S04 | float | six-seized-sailors-3 | 40.5-42.17 | 21 | d:18:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-2 | 40.58-42.83 | 28 | d:18:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-4 | 40.58-44.08 | 43 | d:18:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-5 | 40.58-44.08 | 43 | d:18:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-1 | 40.83-43.5 | 33 | d:18:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-6 | 41.08-44.08 | 37 | d:18:WIDE:WIDE | blocking |
| OD-B12-S04 | on-head | six-seized-sailors-5 on odysseus | 41.17-41.5 | 5 | d:18:WIDE:WIDE | blocking |
| OD-B12-S04 | sunk | six-seized-sailors-1 | 42-42.33 | 5 | d:18:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-3 | 42.42-44.08 | 21 | d:18:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-2 | 43.17-44.08 | 12 | d:18:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-6 | 45.67-47.92 | 28 | d:20:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-3 | 45.67-47.92 | 28 | d:20:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-1 | 45.67-47.92 | 28 | d:20:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-2 | 45.67-47.92 | 28 | d:20:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-4 | 45.67-47.92 | 28 | d:20:WIDE:WIDE | blocking |
| OD-B12-S04 | float | six-seized-sailors-5 | 45.67-47.92 | 28 | d:20:WIDE:WIDE | blocking |
| OD-B12-S06 | in-figure | crew-sacrificial-group-1 / crew-sacrificial-group-2 | 9.17-9.42 | 4 | d:3:SPK:CLOSE | blocking |
| OD-B12-S06 | in-figure | eurylochus / crew-sacrificial-group-1 | 14.5-15.33 | 11 | d:5:WIDE:WIDE | blocking |
| OD-B12-S07 | cam-in-set | black ship | 30.17-31.92 | 22 | d:4:OBJ:INSERT | take camera (cutter) |
| OD-B12-S07 | in-figure | drowning-crew-3 / drowning-crew-5 | 39.83-40 | 3 | d:5:WIDE:WIDE | blocking |
| OD-B12-S07 | sunk | drowning-crew-2 | 39.92-40.25 | 5 | d:5:WIDE:WIDE | blocking |
| OD-B12-S07 | sunk | drowning-crew-1 | 39.92-41.83 | 24 | d:5:WIDE:WIDE | blocking |
| OD-B12-S07 | sunk | drowning-crew-5 | 39.92-41.75 | 23 | d:5:WIDE:WIDE | blocking |
| OD-B12-S07 | sunk | drowning-crew-3 | 40.08-40.58 | 7 | d:5:WIDE:WIDE | blocking |
| OD-B12-S07 | sunk | drowning-crew-4 | 40.08-42 | 24 | d:5:WIDE:WIDE | blocking |
| OD-B12-S07 | sunk | drowning-crew-2 | 40.83-41.92 | 14 | d:5:WIDE:WIDE | blocking |
| OD-B12-S07 | sunk | drowning-crew-3 | 40.83-41.92 | 14 | d:5:WIDE:WIDE | blocking |
| OD-B12-S07 | sunk | odysseus | 41-46.5 | 67 | d:5:WIDE:WIDE | blocking |
| OD-B12-S07 | float | odysseus | 46.83-60.58 | 166 | d:5:WIDE:WIDE | blocking |
| OD-B13-S01 | float | phaeacian-convoy-crew-2 | 8.67-9.25 | 8 | d:0:WIDE:WIDE | blocking |
| OD-B13-S01 | float | phaeacian-convoy-crew-4 | 8.67-9.33 | 9 | d:0:WIDE:WIDE | blocking |
| OD-B13-S01 | sunk | odysseus | 8.67-9.17 | 7 | d:0:WIDE:WIDE | blocking |
| OD-B13-S01 | cam-in-figure | phaeacian-convoy-crew-2 | 9.25-9.58 | 5 | d:1:SPK:MID | take camera (cutter) |
| OD-B13-S01 | float | phaeacian-convoy-crew-2 | 18.75-25.08 | 77 | d:2:WIDE:WIDE | blocking |
| OD-B13-S01 | float | phaeacian-convoy-crew-4 | 18.75-24.75 | 73 | d:2:WIDE:WIDE | blocking |
| OD-B13-S01 | float | odysseus | 18.75-23.5 | 58 | d:2:WIDE:WIDE | blocking |
| OD-B13-S01 | sunk | odysseus | 18.75-23.75 | 61 | d:2:WIDE:WIDE | blocking |
| OD-B13-S01 | float | phaeacian-convoy-crew-1 | 24.83-26 | 15 | d:2:WIDE:WIDE | blocking |
| OD-B13-S01 | float | phaeacian-convoy-crew-1 | 36.58-37.75 | 15 | d:3:SPK:MID | blocking |
| OD-B13-S01 | float | phaeacian-convoy-crew-2 | 36.83-37.17 | 5 | d:4:SPK:CLOSE | blocking |
| OD-B14-S01 | sunk | eumaeus | 8.08-8.25 | 3 | d:1:REACT:CLOSE | blocking |
| OD-B14-S01 | sunk | eumaeus | 13.5-13.75 | 4 | d:1:REACT:CLOSE | blocking |
| OD-B14-S01 | sunk | odysseus-as-beggar | 13.92-17.42 | 43 | d:1:REACT:CLOSE | blocking |
| OD-B16-S03 | empty-shot | OBJ | 0-0.58 | 8 | d:6:OBJ:INSERT | take camera (cutter) |
| OD-B16-S03 | empty-shot | SPK | 3.67-9.17 | 67 | d:1:SPK:MID | take camera (cutter) |
| OD-B16-S03 | cam-in-set | recognition embrace | 5.5-6.42 | 12 | d:1:SPK:MID | take camera (cutter) |
| OD-B16-S03 | in-figure | odysseus-restored / telemachus | 34.25-42.5 | 100 | d:5:SPK:MID | blocking |
| OD-B17-S03 | none found | | | | | |
| OD-B19-S04 | cam-in-set | boar scar | 3.17-5.25 | 26 | d:1:OBJ:INSERT | take camera (cutter) |
| OD-B19-S04 | cam-in-set | boar scar | 11.92-13.67 | 22 | d:3:OBJ:INSERT | take camera (cutter) |
| OD-B19-S04 | cam-in-set | boar scar | 15.5-16.92 | 18 | d:4:OBJ:INSERT | take camera (cutter) |
| OD-B19-S04 | sunk | penelope | 16.92-18.58 | 21 | d:4:OBJ:INSERT | blocking |
| OD-B19-S04 | sunk | eurycleia | 25.25-26.83 | 20 | d:6:SPK:MID | blocking |
| OD-B19-S04 | sunk | odysseus-as-beggar | 25.5-26.83 | 17 | d:6:SPK:MID | blocking |
| OD-B19-S04 | sunk | odysseus-as-beggar | 34.67-36.25 | 20 | d:8:OBJ:INSERT | blocking |
| OD-B19-S04 | sunk | eurycleia | 34.67-36.25 | 20 | d:8:OBJ:INSERT | blocking |
| OD-B21-S07 | cam-in-set | column 3 | 22.08-23.17 | 14 | d:5:WIDE:WIDE | take camera (cutter) |
| OD-B21-S07 | cam-in-set | column 3 | 23.42-32.33 | 108 | d:6:WIDE:WIDE | take camera (cutter) |
| OD-B21-S07 | sunk | telemachus | 41.67-51.33 | 117 | d:11:WIDE:WIDE | blocking |
| OD-B22-S01 | float | odysseus-revealed | 1.42-1.67 | 4 | d:0:WIDE:WIDE | blocking |
| OD-B23-S04 | sunk | odysseus | 0.67-5.5 | 59 | d:0:WIDE:WIDE | blocking |
| OD-B23-S04 | sunk | penelope | 5.5-5.75 | 4 | d:0:WIDE:WIDE | blocking |
| OD-B23-S04 | in-figure | penelope / odysseus | 19.25-29.5 | 124 | d:3:WIDE:WIDE | blocking |
| OD-B23-S04 | sunk | odysseus | 32.08-33.58 | 19 | d:5:SPK:CLOSE | blocking |
| OD-B23-S04 | sunk | odysseus | 34.42-35.5 | 14 | d:5:SPK:CLOSE | blocking |
| OD-B23-S04 | sunk | penelope | 34.42-35.5 | 14 | d:5:SPK:CLOSE | blocking |
| OD-B23-S04 | in-figure | penelope / odysseus | 35-45.42 | 126 | d:5:SPK:CLOSE | blocking |
<!-- scan:end -->
