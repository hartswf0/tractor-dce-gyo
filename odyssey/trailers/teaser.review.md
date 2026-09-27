# Nobody (teaser): render reviews

Three rounds of render and critique. Each round's film is kept: `films/trailers/teaser-r1.mp4`, `-r2.mp4`, `-r3.mp4`; the final is
also `films/trailers/teaser.mp4`. Frames were pulled with `tools/trailer-review.py` (a frame at the start, middle and end of every
moving shot, both sides of every hit, the middle of the line) and set beside the 23 studio frames (`films/ref/odyssey-trailer/`),
REFERENCE.md's rules and the teaser's own six rules. Loudness is ffmpeg's ebur128 on the muxed AAC.

---

## Round 1 — `films/trailers/teaser-r1.mp4`

1280x720, 24 fps, 720 frames; 19.7 min to render (2.5-2.7 s a frame on swiftshader, 40 s to load the cave, 3 s the shore).
The edit list exactly as written: 6 shots, the key's own light and camera in every SCENE shot.

**Sound.** -14.1 LUFS integrated, true peak -1.6 dBTP, LRA 15.5 LU. The line “Nobody is my name.” sits at a median momentary
-17.4 LUFS against -35.7 in the second before it: it is spoken into the score's silence, as planned, and is completely clear. The
title hit lands: -25.3 → -11.4 LUFS across 25.35 (a 14 dB step). The roar does not: the score only swells there (-13.9 → -10.2, under
4 dB), so the cut to the rearing giant arrives on a crest, not on a blow.

**What fails.**

1. **Shot 2 is crowded and says nothing about scale.** Five men stand at the giant's shoulder (Odysseus is one red torso among four
   helmets), the cold stake lies across the foreground and the fire's tall flame elements cut a bar through the men. Rule 4 of the
   teaser (“the man small beside the sleeping giant”) is half kept: he is small, but he is not alone, so he is not the subject.
   Against 16.5 and 68.5 in the studio trailer (one figure, vast ground) it reads as a toy shelf.
2. **The light is the location's, not firelight.** The set's own lights are dimmed only to 22% and the key's two lamps plus the
   hemisphere fill light the cave walls evenly; the walls read as brown cardboard, the open top of the set as a black sky. Rule 5
   (“firelight inside, moonlight outside; nothing else”) fails in every cave shot. The reference is near-black with one warm side
   light (61, 71, 73).
3. **The line lands on no one.** “Nobody is my name.” comes at 5.9 s into a 9.2 s static wide in which the speaker is 60 px tall.
   The studio trailer puts its few words on faces; ours is heard over a room. And 9.2 s is the longest hold in the teaser with the
   least in it (REFERENCE rhythm: 2.5-6 s holds).
4. **Shot 4 (the roar) has sliced figures.** A stake-bearer's helmet is cut by the left edge and Odysseus by the right; the
   giant is centred with a torch beside him. It should be one silhouette. And the swell is not a hit (see Sound).
5. **Shot 5 breaks the teaser's own scale rule and the crane fights the image.** The blinded giant, hands up, is the best frame of
   the round (blue night, moon key, the rock a shape), but he is big in frame, and the crane rises and tilts so that by the end he
   has slid to the bottom and is cut at the chest. The note wanted “the giant small against the night”.
6. **No frame shape.** The studio trailer is 2.39:1; ours is full 16:9 with the busy cave floor at the bottom and the set's open top
   at the top of every frame.
7. What works: the black opening with firelight and breathing before any picture; the title card (tracked serif, 9% of height)
   on the score's hit; the line in the silence; the loudness.

**Revisions (applied to `teaser.json`, validated: 0 errors, 3/3 rules).**

- `grade`: letterbox 2.39:1 and a 0.35 vignette on every SCENE frame (the studio frame; it also crops the open top and the floor).
- A firelight look on every cave shot: the set's lights to 12%, the key's lamps replaced by one low warm point at the hearth
  (#ff7a2a, 3.0, 520 LDU, shadows), a dark cool fill (0.16), exposure 0.9. Tested in three still passes (the first was too bright, the
  second black; the third keeps the faces and lets the walls fall off).
- Shot 2 split in two (the 9.2 s hold becomes two 4.6 s shots):
  - 2: K1 wide with the four stake-bearers cleared (`stage.hide_actors`): one small man beside the sleeping giant, push 0.08.
  - 3: K1 re-shot over the giant's shoulder (`camera.override`: an orbit round the brow at az 5.35, r 150, h 120, aimed between
    the two): the giant's arm a dark mass filling the left of the frame, Odysseus small in the right third, lit by the fire, his own
    shadow the size of the giant on the wall behind him. The line moves with it (voice.at 1.3: still 8.9 s on the trailer clock,
    in the score's silence), and his lips now move on a man we can see.
- Shot 5 (the roar): the stake-bearers and Odysseus cleared; one silhouette in the firelight. `single low drum` added on the cut and
  the ROAR raised 3 dB (`sfx_gain`), so the swell's crest is struck.
- Shot 6 (the prayer): the crane replaced by a slow widening of the lens (zoom -0.10): the giant shrinks into the night as he prays
  instead of sliding out of the frame; the edge figure (Odysseus's bow on the ship) cleared.
- Unchanged: the black open, the stake shot (now in firelight), the title and its hit, the music cue.

---

## Round 2 — `films/trailers/teaser-r2.mp4`

1280x720, 24 fps, 7 shots; 19.4 min. The round-1 revisions, all of them visible.

**Sound.** -14.1 LUFS integrated, true peak -1.6 dBTP, LRA 15.8 LU. The line: median momentary -18.2 LUFS against -36.5 before it
(18 dB clear). The roar now strikes: -14.8 → -8.7 LUFS across 15.9 (6 dB, the drum on the cut and the roar up 3 dB). The title:
-26.1 → -12.2 (14 dB). Stems at the master gain: music -15.4, voice -15.7, effects -13.0 LUFS; the effects are loudest only because
the roar and drum sit on the one crest, and nothing masks the line (the score is silent under it). Balanced; no change needed.

**What is better.** The letterbox and the firelight change the film's register completely: the cave now reads as night lit by one
fire, the walls fall to black, the open top of the set is gone under the bar. Shot 2 is the teaser's idea in one frame (a small man
beside a sleeping mountain). Shot 3 puts the line on the man: the giant's arm fills the left of the frame, and his own shadow on the
wall is as tall as the giant. The roar is one silhouette.

**What still fails.**

1. **The line is spoken by a face 25 pixels high.** The halfworld face is on him and the lips run on the clip, but at this size the
   mouth is a smudge; the push (0.05) does not travel. The words deserve the face.
2. **The stake shot is cut by the letterbox.** K3 was framed for 16:9: the white eye and the stake's tip now touch the top bar, and
   the frame's centre is the dark stake shaft. The act is there, the point of it is not.
3. **The prayer does not shrink.** A 10% widening over 4.75 s is invisible, and the letterbox crops the giant at the waist; he is
   still big and right of centre with the rock filling the right half. Rule 4 (“the giant small against the night”) is still not
   kept.
4. The fire's flame elements stand as a bright bar in the right third of shot 2; they are the hearth, so they stay, but they draw the
   eye from the man. (Noted, not changed: it is the one warm source the rule asks for.)
5. The rhythm is even (4.6, 4.6, 3.7, 4.7, 4.75): fine for a teaser whose music sets the pace, but nothing accelerates into the roar.
   (Noted, not changed: the cuts are the score's; the teaser is a render test with the score's own structure.)

**Revisions (applied, validated: 0 errors, 3/3 rules; framings checked with `--stills` first).**

- Shot 3 (the line): push 0.05 → 0.20, eased: the camera creeps in over the giant's arm to his face while he speaks; at the end his
  head is twice the size.
- Shot 4 (the stake): K3's aim raised 22 LDU (`camera.override.target`): the eye, the red and the stake's tip come down into the
  frame, clear of the bar.
- Shot 6 (the prayer): from K4's own mark, a wider lens (fov 70) aimed higher (target y 165): he stands lower and smaller with the
  night above him; zoom -0.08 widens it further. The set limits this: the headland's rocks hide his legs from every mark on the
  shore side that is not inside the ship or the splash (five marks tried; see Round 3 for what the next pass would need).

---

## Round 3 (final) — `films/trailers/teaser-r3.mp4` = `films/trailers/teaser.mp4`

1280x720, 24 fps, 720 frames, 8.0 MB; 19.5 min. -14.1 LUFS integrated, true peak -1.6 dBTP, LRA 15.8 LU (the mix is unchanged
from round 2: line 18 dB clear of the silence it sits in, roar +6 dB on its cut, title +14 dB on its hit).

**Verdict against the teaser's rules.**

| rule | kept? |
|---|---|
| One idea: the man who called himself Nobody, and what it cost | yes: sleep, name, stake, roar, prayer, title; nothing else in 30 s |
| Two locations plus a title | yes (OD-B09-S09, OD-B09-S11) |
| One line, spoken in the music's silence | yes: 8.9-11.5 s inside the score's 8.5-12.5 silence; the camera creeps to his face while he says it |
| Scale: the man small beside the sleeping giant; the giant small against the night | the first fully (shots 2-3); the second partly: he is lower and smaller under more night, but still big in frame |
| Firelight inside, moonlight outside; nothing else | yes |
| The title lands on the hit | yes (25.35, +14 dB) |

Against REFERENCE.md: one idea per shot (yes), letterboxed 2.39:1 (yes), night with one warm source (yes), a frame within a frame
(shot 3, the giant's arm), restraint about the monster (the giant is a silhouette in two of his three shots; the blinding is the one
shot that shows the act). The eye-level push to the face during the line, the drum on the roar and the zoom-out on the prayer all
land.

**What is left (for whoever takes the teaser further).**

1. The prayer. The shore set cannot make the giant small: every mark outside the ship puts the headland's rocks over his legs. The
   fix is a new key on OD-B09-S11 staged for it (the giant on the headland's top, camera low on the water at 400+ LDU, fov 35), put
   through the gate, or the headland kit (`set.cyclops-cave-headland`) as a KIT shot at night.
2. The stake shot is the one busy frame left: two helmeted bearers and the flame elements crowd the left third. A key K3b with the
   bearers behind the stake (or cleared, leaving Odysseus alone on it) would keep the act and lose the crowd.
3. Lip sync is correct but only legible in the last second of the push; a proper close-up key on Odysseus (gate-checked) would let
   the line be a face, as the studio trailer does.
4. The effects are synthesised (fire, snore, hiss, roar, drum, sea, far thunder). They sit under the score and read as their events;
   a real foley pass (the roar especially) would lift the middle of the teaser.
5. Three framings are `camera.override`s that the keyframe gate has not scored (shots 3, 4, 6); they were checked by eye with
   `--stills`. If the gate is to be the rule for trailers too, add them as keys.
