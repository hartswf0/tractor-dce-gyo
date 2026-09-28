# The Gods Are Watching: render reviews

## Round 1 — animatic `films/trailers/c-gods-watching-r1-animatic.mp4`

960x540, 24 shots, 68 real frames, held and dissolved to the edit list at 24 fps under the full mix. 11.4 min to render (136 s of
scene frames, 74 s of location loads, 222 s for the three true renders of the turned council kit at the crane's start / middle / end).

**Sound.** -14.1 LUFS integrated, true peak -1.4 dBTP, LRA 6.3 LU. The title slam at 106.35 is +21 dB and the drop to silence for
the dead at 67.0 falls 13 dB, both as designed. But:
- **The big hit does not hit.** 36.5 (“the big hit: Poseidon's storm”, Boulder-Drop Bass 56.5) measures -11.5 → -10.3: the cue is
  already loud before it, so the storm's cut arrives on a plateau.
- **The return at 74.8 is a whisper** (-43.5 → -35.3): Boulder-Drop's 95 s build starts near silence. “Athena sends him home” is
  carried by her line (28 dB clear), not by the score; acceptable, but it is not the “return” the note promises.
- **Six lines lose to the score**: 2 “Poseidon's seat remains empty” (-18.9 under -14.3 before), 4 Zeus's “It is Poseidon…” (-13.9 /
  -12.1), 6 the Cyclops's prayer (-13.0 / -10.2), 8 the storm narration (-13.5 / -11.5), 13 Zeus's bolt (-15.0 / -14.8), and the
  verdict 22 “one god cannot hold out against us all” (-16.6 / -12.3), which is the last line of the cut.

**The 8 problems that matter.**

1. **The verdict and the thesis lines are buried** (above): a trailer whose argument is spoken by the gods cannot let the score cover
   Zeus.
2. **The world of men is lit like Olympus in three places.** Rule 2 (“Olympus is the only sunlit place”) fails at 7 (the rock torn
   from the peak: grey daylight, no look), 12 (Scylla: daylight) and 16-21 (the bow and the hall: marked night interior, rendered as
   sunlit open-topped rooms, 16 with a blue day sky behind the archer).
3. **Olympus is burnt white.** 2-4 and 22 at exposure 1.0 under a high sun: the marble floor and the columns clip, the gods are small
   white figures on white. Sunlit should still have shape.
4. **The opening kit shot does not show the thesis.** The turned council should look *down its column at Ithaca*; at the studio
   camera the kit is a small model on a black sweep, the column and the island unreadable, and the crane down (-0.15) moves only the
   elevation. It is the cut's first image.
5. **The dead are comic** (14): the same pink smiling shades as in A, in clear light, over Tiresias's “he does not forget”.
6. **The escalation reads, the scale does not.** One giant (5-7), many (10-11), six heads (12), the bolt (13): the order is right, but
   every monster is framed at the same middle distance; nothing is a tiny figure against vast ground.
7. **The storm's hit (8) has nothing on the cut:** the frame is good (black sky, spray columns), the sound under it is not.
8. **What works:** the Cyclops at night (6), the Laestrygonians' dusk (10-11, the boulders against an orange sky) and the storm frame
   (8) are the cut's strongest images; the bronze title card (engraved gold, a 3% push) is in the right grammar; the black before the
   slam and the slam itself land.

**Revisions applied to `c-gods-watching.json` (validated: 0 errors, 4/4 rules).**

- `duck_db: -11` under the lines of 2, 4, 6, 8, 13 and 22.
- Shot 8: `thunder crack` on the cut, +3 dB, so the storm's cut is struck even where the score plateaus.
- Shot 7: the night look (moon high left, blue-black sky); shot 12: a storm-night look (black sky, lightning key from above).
- Every night interior (16, 18-21): the set's lights to 10%, fill 0.1, exposure 0.75; the render path also drops a night look's key
  fill to 35% when no fill is given.
- Olympus (2-4, 22): exposure 1.0 → 0.85.
- Shot 14 (the dead): near fog (60-420), black-blue sky, exposure 0.65.
- Shot 1: the kit camera higher and closer (`kit_view`: el 40, zoom 2.2) so the council and the column fill the frame.

**For round 2:** check the relit interiors and Scylla with `--stills` (the open-topped palace sets may need a lamp practical in
`look.lights`); give the opening kit shot an `at` aim on the council (LDraw units) so the crane travels down the column to the
island; reframe one monster shot as a scale shot (a tiny ship under Scylla's cliff, from far off); decide whether the 74.8 return
needs a drum (`single low drum`) or a different in-point.

---

## Round 2: animatic `films/trailers/c-gods-watching-r2-animatic.mp4`

960x540, 24 shots, 68 real frames under the full mix. 15.8 min to render: 5.0 min for the three true renders of the turned council
kit (run first with `--shots 1`), then 10.8 min for the rest with `--resume` (297 s of scene frames, 77 s of location loads). The
machine was shared with two other renders (load 7-9 on 4 cores).

**Checking round 1's revisions with `--stills` first (two passes, 21 + 12 stills).** What they showed:
- **Olympus at 0.85**: the marble has shape now (grey in the shade of the columns, gold reads as gold); kept.
- **The relit interiors did not work.** 16 and 18-21 were still daylight: round 1's night look set `dim` and `fill` but no `sky`,
  so the key's blue day sky showed through the doors and the open tops, and the sun-strength key (1.6) threw hard noon shadows.
- **The dead (14)**: near fog alone did nothing (the camera stands among them); still pink smiling shades, lit by the trench's red
  light.
- **The prayer (6)**: the crane slid the giant under the bottom of the frame; **the stake (5)** had no look and its eye was cut by
  the (new) letterbox; **the rock (7)** is night now, with the archer sliced by the right edge.
- **The opening kit**: the round-1 fix (el 40, zoom 2.2, no aim) framed the wrong side of the build. Six studio renders (az 20, 110,
  200, 290, then 245 at el 50 and 35) found the view: from the Ithaca side, aimed at the column (`at` 250,-330,-100 LDraw), the
  council on the top looking down, the golden trail, the ship and the palace at its foot.

**The sound, measured.** The big hit's problem was the music, not the mix: the 56.5 "hit" in Boulder-Drop Bass is one swell of a
3.3 s riff (-9.6 at 55.8, a trough to -15.5 at 56.4, -7.7 at 56.8), so it can never step off a plateau. Per-line clarity measured
from the mixer's own stems (voice against music + effects under the line, `tools/trailer-sound.py`'s mix before the master): every
line 6-22 dB clear; `tools/trailer-review.py`'s measure (the line against the second before it) flags 2, 4, 6 and 22 only because
the second before each is a loud cut or the score at full, not because the words are masked.

**Revisions applied before the animatic.**
- `grade` for the whole cut: letterbox 2.39:1, vignette 0.35 (as the teaser and A): the studio frame, and it takes the open tops out.
- **The big hit**: the cue is split around a 0.55 s declared silence (35.95-36.5, in the riff's own trough); the score stops under the
  torn-off rock and comes back on the storm's cut with a `single low drum` and the thunder crack. The rock's rumble -6 dB so the
  hole is heard. Momentary loudness across the cut: -29 in the hole, -9.6 after it (a 19 dB step; round 1: 1.2 dB).
- **The return (74.8)**: a `single low drum` on the cut (-43 → -11 LUFS momentary). With the drum at 4.2 (score's entry, -3 dB),
  the storm and the return, the three drums are the cut's pulse: above, the god's blow, home.
- **Night interiors** (16, 18-21): a black sky, fog 300-1100, the key down to a weak low warm light (0.7, then 0.5 in the hall), the
  set's lights at 10%, and in the hall (OD-B22-S01, which has no practicals of its own) two warm points: one at the threshold
  behind Odysseus, one over the suitors' tables.
- **The dead** (14): the trench's red light off (`no_lights`), one cold light behind the crowd, a low backlight key, fog 30-240,
  exposure 0.7: the shades are grey glass shapes, their faces in shadow.
- **The stake** (5): the teaser's firelight look and its letterbox-safe aim (K3 tilted up 22 LDU).
- **The prayer** (6): the teaser's framing (K4's mark, fov 70, aimed higher), a slow widening instead of the crane, the moon up to
  1.2; Odysseus cleared. **The rock** (7): Odysseus cleared from the right edge.
- **The scale shot** (12, Scylla): two overrides tested; kept the far high one (`pos` -330,250,-560, fov 42): the ship and one small
  man under a black cliff, the heads and the six men above. Push 0.04.
- **The kit** (1): `kit_view` az 245, el 50, zoom 1.2, `at` on the column; crane -0.15 stepped on twos.

**The critic's pass on the animatic.**

*Composition, scale, silhouette.* The letterbox changes the register: the storm (8), the winds (9), the Laestrygonians (10-11) and
the Cyclops's night (6-7) now sit in the studio frame's shape, and three of them would stand beside the reference (7: the rock as a
black mass against a blue night, like 40's citadel; 10: the boulders against a sunset, like 57's backlight; 9: the torn sail and
spray columns on black, like 88). Scylla (12) is the first shot in the cut where a man is small against the ground (75.5's rule),
and it is where the escalation turns from "a monster" to "a world against him". The dead (14) now read as ghosts at night, a real
improvement; the frame is still Odysseus's back filling the middle third.

*Light and colour.* Rule 2 holds: Olympus is the only sunlit place (2-4, 22); everything below is night, storm or dusk. The hall
(18-21) is warm night, one colour; it is still evenly lit across the floor (the two points are wide), so it reads as "a lamp-lit
room" rather than the reference's single source (73), acceptable for 1.2 s shots. The storm (8) is the weakest light: the sea plates
are a bright swimming-pool blue under the lightning key.

*Pace and the arc.* 4-8 s holds through the argument (1-4), 1.8-5 s through the monsters, a 7.8 s hold in the silence for the
dead, 1.2 s cuts in the hall: the escalation builds, and the three drums and the hole before the storm give it a pulse it did not
have. The verdict (22) cuts from the hall's crash to Athena's face with the score at full ducked under Zeus: the line is 17.7 dB clear
but the whole mix drops 4 dB as it starts, which reads as a step down just where the cut should peak.

*What still fails.*
1. **The kit opening** is a model on a black sweep (not letterboxed, since the kit is lit by the studio, not graded), and the crane
   from el 50 to 35 turns the model rather than travelling: it does not read as a move.
2. **The storm frame** (8) is over-lit: black sky, but the sea is lit like a pool.
3. **The verdict's dip** (above), and line 8 (the storm narration, 5.6 dB clear over the drum and the crack) is the least clear.
4. **The convoy ship** (15) is cluttered (a magenta plate and grey crates in the foreground); the hall (20-21) is busy. Noted, not
   changed: the keys are the gate's, and the shots are 5.2 and 1.2 s.
5. Scylla (12) is dark: the cliff is a black mass and the heads read only against it.

**Revisions for round 3 (applied, validated: 0 errors, 4/4 rules).**
- Kit (1): el 45, the crane replaced by a push (zoom x1.2 over the shot), stepped on twos: a visible move in on the column.
- Storm (8): lightning key 3.0 → 2.0, exposure 0.8 → 0.7.
- Scylla (12): exposure 0.8 → 0.95.
- Voice: the verdict (22) +2 dB with the duck -9 (was -11): the line sits higher instead of the score falling away; the storm
  narration (8) +2 dB (7.6 dB clear); the opening line (2) +2 dB; the threshold line (18) +1.5 dB.

---

## Round 3 (final): `films/trailers/c-gods-watching-r3.mp4` = `films/trailers/c-gods-watching.mp4`

1280x720, **12 fps** (1320 frames), 27.5 MB, 110.0 s. **Why 12, not 24:** the first 24 fps attempt ran at 11-13 s a frame
(three full trailer renders were sharing the 4 cores, load 12-13), an 8-hour projection; it was stopped after 11 min and its 110
even-numbered frames were reused as the 12 fps frames (`--resume`). The 12 fps render then took 156 min (8077 s of scene frames at
5-11 s each under contention, 91 s of location loads, 885 s for the kit's 9 true renders of the stepped push).

**Sound.** -14.1 LUFS integrated, true peak -1.3 dBTP, LRA 6.2 LU (stems at the master gain: music -19.1, voice -14.1, effects
-21.3). The hits, momentary loudness before → after each cut:

| trailer | what | before → after |
|---|---|---|
| 4.20 | the score enters, Olympus (drum) | -19.7 → -12.0 |
| 36.50 | the big hit, Poseidon's storm (0.55 s hole, drum, crack) | -29 in the hole → -9.6 (round 1: -11.5 → -10.3) |
| 67.00 | drop to silence, the dead | -19.3 → -32.2 |
| 74.80 | the return, the ship home (drum) | -43.6 → -11.5 (round 1: -43.5 → -35.3) |
| 102.90 | the dip to black | -22.6 → -21.0 (the bowstring creak) |
| 106.35 | the slam, the title | -32.7 → -11.1 |

Every line is clear of its bed (voice stem against music + effects under the line: +7.6 to +22 dB; the verdict +17.7 dB at
-14 LUFS, now louder than the second before it instead of 4 dB under it). All 13 lines are single, verified clips, one per shot, none
crossing a cut.

**Frames at every shot and every hit** (`tools/trailer-review.py`: the start, middle and end of every moving shot, both sides of
every hit). Every hit falls on its cut to the frame. What is on screen matches the edit list shot for shot; the round-2 revisions
all rendered: the kit pushes in visibly on the column (zoom 1.2 → 1.44 in eight steps), the storm is a shade darker, Scylla's cliff
reads, the hall is warm night throughout.

**Verdict against the cut's rules.**

| rule | kept? |
|---|---|
| Cut between above and below | yes: Olympus 1-4, the god's son praying 6, Poseidon 8, Aeolus's line 9, Zeus's bolt 13, Athena 15, the thunder 17, Athena and Zeus 22 |
| Only Olympus is sunlit | yes (round 1: failed in 7, 12, 16-21) |
| Escalate: one giant, many, six heads, the bolt | yes, and Scylla is now a scale shot (the one tiny man under the cliff) |
| Every monster a god's instrument, said aloud | yes (the curse, "the blessed gods themselves hate you", "he does not forget") |
| Cut on the score | yes: six hits on cuts; the big hit now hits (a made hole in the riff, not the track's own shape) |
| The bow and the hall answered by thunder | yes (17) |
| Silence before the drop, title on the slam | yes (3.45 s of black, the slam +21 dB) |
| One line per shot, none across a cut | yes |

**Beside the reference frames, honestly.** Four frames would sit beside the studio trailer's in grammar (not in finish): the rock
against the blue night (7, like 40), the Laestrygonians' boulders against the sunset (10, like 57's backlight), the torn sail in
spray on black (9, like 88), and the tiny man under Scylla's cliff (12, like 68.5 / 75.5). The dead (14) are now spectral, but the
frame is Odysseus's back, not the dead. Olympus (2-4, 22) is correct for the thesis (bright, the only daylight) but it is a set of
white bricks under a flat blue sky: sunlit without a sun, no shadow direction, no haze; it looks like a toy on a table more than any
other location in the cut. The kit opening is a product shot on a black sweep, clear about "gods above, men below" but not cinema.
The storm (8) is still the weakest light (the sea plates read as a pool). The hall (18-21) is warm night, but evenly lit; the
reference's one-source darkness is not there.

**Not fixed in round 3, and why.** None of the remaining problems is a mistake that a cheap re-render would correct: each is a
look or a key the sets impose (Olympus's flat sky, the pool-blue sea, the cluttered convoy ship, the hall's width), and a shot
re-render costs 5-11 s a frame on the shared machine. They are the next pass's work:
1. Olympus: a low warm sun from behind the thrones (`key` from "behind, low", elev 15) and a hazier sky would give the marble a
   direction and the gods silhouettes; try with `--stills` on 2-4 and 22.
2. The storm (8): a darker, desaturated sea (`fog` near, 120-500, colour off the sky) or a reframe on Poseidon against the black.
3. The kit: the studio lights it, not the look; a warm top light and a haze pass (or a letterboxed crop in post) would put it in
   the same world as the rest.
4. The convoy ship (15) and the hall (20-21): `stage.hide_actors` and a tighter override for each, checked with `--stills`.
5. 24 fps when the machine is free (~2 h at 2.6 s a frame; the 12 fps frames are every other frame of it, so `--resume` into a
   24 fps folder after renaming them would save half).

**Final verdict.** The trailer now does what its idea says: the gods argue in daylight, the monsters come in the dark in order of
size, each one named as a god's weapon, the score falls away for the dead and comes back on a drum, and Zeus's verdict is heard
over the score before black and the slam. The sound is finished work (on target, every line clear, every hit a hit). The picture
is a strong animatic-grade film: the light rules hold everywhere and four frames have the reference's grammar, but Olympus and the
opening kit, the two images that carry the thesis, are the least cinematic in the cut. Ship it as the round-3 cut of C; the next
pass should spend its time on those two.
