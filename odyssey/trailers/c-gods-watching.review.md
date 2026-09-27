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
