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
