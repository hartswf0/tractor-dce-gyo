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

---

## Round 2 — animatic `films/trailers/a-long-way-home-r2-animatic.mp4`

960x540, 26 shots, 66 real frames, letterboxed 2.39:1, vignette 0.4; 12.9 min to render (the machine shared with two other
renders; 102 s of location loads). Before it, three `--stills` passes (20 + 10 + 4 frames) checked the round-1 revisions and every
new framing from a scratch copy of the edit list (`--doc`), so the animatic was the fourth look at every changed shot, not the first.

**What the stills found in the round-1 revisions.**

1. **The Ithaca interiors were still daylight.** The cause was in the look itself, not in the dim: the night-interior `key`
   ("the lamp/torch practical") has no direction words, so the render path reads it as the painter's key: a warm *directional*
   light, front left, 30 degrees up, at 1.6. In an open-topped set a directional light is the sun. Dimming the set's lights to 10%
   changed nothing because the warm sun was doing the lighting.
2. **Olympus was still a white box**, because the key's daylight fill (hemisphere, 0.45) stayed at full; **the raft-building shot was
   still saturated green** for the same reason.
3. **The dead were still pink toys with printed smiles:** the fog (60-420) lies behind the near shades and cannot reach them.
4. **Scylla was shown whole**, and the three drop shots were busy wides (as round 1 said).

**Revisions (each checked with `--stills` before the animatic).**

- **Night interiors (18, 19, 22, 23, 24, 25): firelight only.** The directional key is now a faint cool moon through the open roof
  (0.10, `#3a4a78`). The set's lights go to 4%, the fill to 0.06, the sky to black, and the warm light comes from point-light
  practicals (`look.lights`) placed where a lamp or fire would be: a torch at Penelope's right (18, the key's own torch kept), the
  hearth low by the basin (19), a torch at the door and embers in the hall (22), a torch beside the archer (23), a lamp at
  Antinous's table (24), and one lamp beside the bed with a cool breath from the window (25, the key's lamps replaced).
- **6 (Olympus):** fill 0.15, set lights 25%, exposure 0.55, low gold key, warm haze. (The animatic showed that fog at 120-650 hid the
  gods, who stand ~500 LDU off. The haze now starts at 380: the ring of gods reads in a dim gold room.)
- **9 (the raft built):** fill 0.12, set lights 15%, exposure 0.7: the island goes to dark shapes against the dusk.
- **13 (the dead):** the moon moved behind the shades (a rim, 1.2), fill 0.08, exposure 0.5, fog 20-240: Odysseus is a dark back
  holding up the sword, and the shades are grey shapes.
- **12 (Scylla):** K5's aim lowered (target y 190 → 110, fov 52): the necks leave the top of the frame and one taken man hangs
  above Odysseus and his useless bow.
- **23 (the axes):** over the archer's shoulder, down the row of axe-heads (Telemachus cleared). Two framings failed first: from
  inside the row, the axe handles filled the frame; the second cut his head at the bar.
- **24 (the cup):** Antinous alone with the cup lifted, seen from Odysseus's side (the first try cut his head).
- **25 (the embrace):** level, the two in profile holding each other on the red bed, the lamp at left, the wall falling to dark
  (the first two tries were from above and cut the heads).
- **Sound:** `single low drum` on the 26.05 cut (the raft); `duck_db` -12 to -14 under every line of the build, and `voice.gain`
  +2 to +5 dB on the lines the score was burying (6, 11, 12, 13, 14, 17, 18, 19).

**The animatic, reviewed.** -14.1 LUFS integrated, true peak -1.4 dBTP, LRA 9.7 LU.

| hit | before → after (momentary LUFS) | lands? |
|---|---|---|
| 1.20 drum 1 | -40.9 → -16.5 | yes |
| 6.00 drum 2 (card) | -33.4 → -14.7 | yes |
| 11.00 drum 3 (fig tree) | -40.8 → -13.1 | yes |
| 16.00 drum 4 (card) | -30.7 → -12.0 | yes |
| 26.05 the raft | -18.7 → -11.9 | yes, now (+6.8 dB; round 1 +4.4) |
| 101.00 cut to black | -10.2 → silence | yes: a true stop |
| 102.85 slam | -42.2 → -15.0 | yes (+27 dB) |

Lines against the second before them (median momentary): 6 +0.5, 7 +2.6, 8 +11.8, 9 +4.7, 10 +10.7, 11 +2.4, 12 +4.0, 13 +4.0,
14 +1.7, 17 +0.1, 18 -0.8, 19 +7.5, 25 +27.5. So four lines were still level with the score: Athena's first line, "Row, friends",
"After twenty years" and Antinous's "thread by thread". The last is a soft take, 3 dB quieter than the others after the match.

Picture, shot by shot, against the reference frames:

- **Kept, and they would sit beside the reference:** 2 (the horse at dusk on an empty shore, the fleet small: 16.5 and 51 in
  bricks), 4 (a man on a fig tree against black: 68.5's scale), 10 (the giant against the night sky), 12 (now: the taken man above,
  the bow below, the monster off screen: the restraint rule), 13 (now: a dark back and grey shades, the closest we come to 75.5),
  18 (Penelope by one torch), 22 (the threshold by one torch; the doorway black), 25 (the embrace by one lamp: the reference's last
  frame, 102.5, in bricks).
- **Kept as good enough:** 8 (asleep at the helm at dusk), 11 (lightning: figures against black), 14 (the ship between the rock and
  the spout), 19 (the scar: warm and dark, but the beggar's back blocks the left half and the nurse's hands are not the subject),
  20 (the bow against the dark), 23 and 24 (one readable thing each at 2.4 s), 9 (dusk, dark, but still a busy forest).
- **Failed in the animatic:** 6 (the haze swallowed the gods: a beige wall and a boulder), 7 (the white sail dominated; the letterbox
  cut Odysseus at the waist), 17 (Argos, flat frontal light on a white wall: the most sincere image in the poem lit like a catalogue).
- **Would the LEGO Movie's editors keep them?** The drop (22-24) now cuts on three single objects, a man, a row of blades and a
  cup, and it plays. The long build still holds each shot 4.5-7.5 s on a nearly still camera (pushes of 4-6%), which is the Nolan
  register but leaves 7, 13 and 14 flat for their last two seconds. The arc works: war, sea, curse, the dead, the long way, home,
  the drop, touch.

**Revisions after the animatic (checked with `--stills`, validated: 0 errors, 7/7 rules).**

- 6: haze 380-1100 (see above).
- 7: K1 re-shot from further back, aimed lower (`camera.override` pos [-190,60,320], target [30,30,-60], fov 40), exposure 0.62: the
  whole man small on the raft, the sea around him, the sail no longer the subject.
- 17: fill 0.12, set lights 20%, exposure 0.75: Argos and the beggar go to silhouette against the dusk.
- Voices: 6 and 17 +5 dB with a -14 dB duck, 18 +4 dB (-14), 14 +2 dB. Remixed and measured (the WAV only): -14.1 LUFS, -1.6 dBTP;
  every line now +1.8 to +27.6 dB over the second before it (6 +2.4, 7 +1.8, 11 +2.7, 14 +2.5, 17 +2.0, 18 +2.1), with the score
  12-14 dB down under each.
