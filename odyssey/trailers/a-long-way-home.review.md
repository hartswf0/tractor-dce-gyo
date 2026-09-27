# The Long Way Home: render reviews

## Round 1 — animatic `films/trailers/a-long-way-home-r1-animatic.mp4`

960x540, 26 shots, 66 real frames (start / middle / end of every moving shot, one per card and black), each held for its share
of the shot with 0.12 s dissolves, at 24 fps, under the full mix. 8.0 min to render (16 locations, 88 s of loads, ~2.3 s a frame).
Made with `node tools/export-trailer.js a-long-way-home --mode animatic` (see RENDER.md). The edit list as written, so no letterbox.

**Sound.** -14.1 LUFS integrated, true peak -1.4 dBTP, LRA 9.3 LU. The four drums land on their cuts (1.2, 6.0, 11.0, 16.0: each
+24 to +28 dB out of near-silence), the slam onto the threshold at 102.85 is +27 dB, the last line “Odysseus goes home.” sits 28 dB
clear of the room tone. But under the long build (King of Ithaca, 26-101 s) the lines stand barely clear of the score: shot 6's
line is 2.4 dB *under* the second before it, shot 11 +1.5, 13 +1.2, 17 +0.7, 19 +1.5 (median momentary loudness). The bed law's
-5.1 dB duck was made for a quiet bed, not a trailer build. The 26.05 hit (the raft) is only +4.4 dB: King of Ithaca enters near
silence, so the cut is carried by Trial of the Bow's tail alone.

**The 8 problems that matter, in order.**

1. **Interiors in daylight.** Every Ithaca shot (18, 19, 22-25) is marked “night interior, one warm source, the rest falls to black”
   and renders as a bright sunny courtyard: the palace sets are open-topped, and the key's daylight fill and the location's lights
   were only partly dimmed. The ending (the embrace in the olive-tree room, rule 9 of the reference: the last image is intimacy in
   candlelight) is a well-lit toy room. This is the biggest single failure against the Nolan register.
2. **Flat daylight where the rules forbid it.** Shot 6 (Olympus, “late afternoon haze”) is a white-and-gold box in full light;
   shot 9 (Odysseus building the raft on Calypso's island) is saturated green in noon light. Rule 3: “no flat daylight”.
3. **The lines are lost in the build** (see Sound): Athena's first line, the Cyclops's curse, Tiresias's prophecy and “After twenty
   years” are under or level with the score.
4. **The dead are comic.** Shot 13 (Tiresias, the shades) shows rows of pink translucent figures with printed smiles in clear light:
   the one place the reference trailer is darkest (68.5, 75.5) is our most toy-like.
5. **Scylla is shown whole.** Shot 12 frames the six heads in full, lifting the men; rule 9 of the cut (“no monster is shown
   whole”) and REFERENCE's restraint rule both ask for less. (Revision left to round 2: needs a reframe checked with `--stills`.)
6. **The three shots in the drop (22-24) are busy wides.** At 2.4 s each they need one readable thing (the bow, the threshold, the
   cup); 23 is a crowded hall with the axe-heads, suitors and two figures at the lens. (Round 2: tighter overrides on the bow and the
   cup.)
7. **What works:** the wooden horse at dusk on the empty shore (shot 2) is the best frame of the three animatics: a silhouette,
   a low horizon, one idea; the man on the fig tree over the black water (4) keeps the scale rule; the cards are in the right grammar
   and on the drums; the blinded giant at night (10) and the ship on the night sea (16) hold.
8. **No frame shape**, as in the teaser's first round: the studio's 2.39:1 would take the open tops out of the palace sets.

**Revisions applied to `a-long-way-home.json` (validated: 0 errors, 7/7 rules).**

- `grade`: letterbox 2.39:1, vignette 0.4.
- Every “night interior” look: the set's lights to 10%, fill to 0.1, exposure 0.75 (the lamp key stays). The render path now also
  lets a night look's key fill fall to 35% when the shot gives no fill of its own.
- Shot 6 (Olympus): exposure 0.8, the set's lights to 60%, close haze (fog 180-900).
- Shot 9 (the raft built): the late-afternoon haze replaced by the dusk backlight (low sun behind, 6 degrees, figures to silhouette).
- Shot 13 (the dead): near fog (60-420), a black-blue sky, exposure 0.65: the shades become shapes behind him.
- `duck_db: -11` under the lines of shots 6, 11, 12, 13, 14, 17 and 19 (the score drops 11 dB under them instead of 5).

**For round 2 (not done here):** reframe 12 so only one or two heads are in frame; tighten 22-24 onto one object each; check the
Ithaca interiors after the new look with `--stills` (a lamp practical may need adding as `look.lights` where the set has none);
consider a drum sample on the 26.05 cut (`sfx: single low drum`) if the score's hit stays weak.
