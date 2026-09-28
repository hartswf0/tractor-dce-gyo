# Nobody: render reviews

## Round 1 — animatic `films/trailers/b-nobody-r1-animatic.mp4`

960x540, 32 shots, 96 real frames (three per SCENE and KIT shot, three per brick card, one per other card), held and dissolved to
the edit list at 24 fps under the full mix. 16.3 min to render: 184 s of scene frames, 82 s of location loads, and 492 s for the 9
kit frames (true renders at the start / middle / end camera of each move through `odyssey-forage.html?render=<card>&studio=dark`:
the-opening 71 s each, headland 61 s, bag-of-winds 31 s).

**Sound.** -14.3 LUFS integrated, true peak -1.4 dBTP, LRA 4.6 LU (a dense, driving mix, as the register asks). The bag-burst hit at
24.5 is +12 dB and the montage's return at 83.55 is +9 dB. But Circe's Loom drives under the whole comic section, and five of the
lines only tie or lose to it: shot 4 “sewn shut with silver wire” (-14.0 against -13.4 before), 7 “Out of my island” (-13.9 / -13.1),
8 the pigs (-14.2 / -13.2), 10 “I eat Nobody last” (-14.7 / -15.5) and 13 the neighbours (-14.4 against -10.1). In a comedy the line
is the joke; these are lost. The record-scratch into silence at 54.9 reads on the waveform (the score stops) but the momentary meter
lags across it; listen, it works.

**The 8 problems that matter.**

1. **The punchlines are under the music** (above). The gag chain is the spine of this cut and it is inaudible in four places.
2. **The brick title cards are small and slow.** “MEANWHILE, DOWN HERE” and “THE ODYSSEY” were built from 1x2 plates at 2% of the
   frame's height, and at the animatic's middle frame they are half built (“MEANWHILE, DO”, “THE ODYS”): the gag of the title
   building itself works, but the letters are a caption's size, not a title's.
3. **The sincere turn is lit like the jokes.** Shot 18 (Penelope at the loom: “All day she wove at that web”) is a sunny white hall;
   the edit says “by torchlight”, and the cut's own rule says the music and the gags drop away here. Shot 19 happens to be dark and
   is the better image; the two do not match.
4. **The opening kit is small in its frame.** Shot 1 (Olympus over Ithaca) fills a third of the frame on the black studio sweep,
   the gods unreadable; the 0.12 rad orbit is invisible across three samples. It is the first image and a straight-faced one; it has
   to be grand.
5. **Kit shots vs. filmed shots.** The three kit stills (1, 5, 13) are product photography on a dark seamless; between filmed sets
   in daylight they read as a different film. This suits the LEGO Movie register (the brick as brick) at the open, less in the middle
   (13: the neighbours outside the cave are not in the kit, so their line plays over an empty headland).
6. **The Nobody shots (9-12, 14) use the cave's own flat light**, the same problem the teaser had in round 1: five men and a flame
   bar crowd the joke's set-up; the teaser's round-2 firelight look and cleared frame would carry over.
7. **The tag (32, “The raft rolls.”) does not read**: a grey box among white spray columns; the joke needs the raft to be seen to
   roll.
8. **What works:** the pace (the comic section and the 1-second montage read as intended even as stills), the pig gag (8) is the
   best frame of the cut (the brick as brick: the pig-head minifig at the table), the rock held over the giant's head (16) and the
   splash (17) pay off, the embraces at the end of the montage (29-30) land.

**Revisions applied to `b-nobody.json` (validated: 0 errors, 7/7 rules).**

- `duck_db: -11` under the lines of shots 2, 4, 7, 8, 10 and 13: the score drops 11 dB under each joke.
- Shots 18 and 19: one torchlight look (the set's lights to 12%, a low warm key from the torch side, a dark fill, exposure 0.8).
- Shot 1: the kit camera closer (`camera.kit_view.zoom` 1.5 → 1.9).
- The render path's brick cards: letters now scaled to fill ~84% of the frame's width (6% of the height per plate row at most).

**For round 2:** carry the teaser's cave look and cleared frames into 9-12 and 14; reframe the tag so the raft tips toward the lens;
consider staging the neighbours for 13 (they exist only as hidden “cyclopes outside” in OD-B09-S09); render a full pass of the kit
shots at `--kit-rate 4` to judge the stepped orbit.

---

## Round 2 — animatic `films/trailers/b-nobody-r2-animatic.mp4`

**Checking round 1's revisions first (`--stills`, 28 frames at 960x540, 6.7 min, then 9 more variants, 4.5 min).** The duck
(-11 dB) was not enough: measured as speech against the bed (the voice stem against music + effects, 50 ms windows while the voice
speaks, median; my own measure through `trailer-sound.py`'s stems, because `trailer-review.py`'s "line against the second before"
compares a line with whatever precedes it, often another ducked line) the jokes sat only 4-9 dB clear, and **“Nobody is my name.”,
the spine of the cut, was -0.8 dB: under the music and the fire**, because shot 9 had the default -5 dB duck. The brick letters were
bigger but one line of 20 letters is still a caption (9% of height). The loom's torchlight override left the day sky blue behind a
dimmed hall: it read as dusk in a daylit room. The opening kit at zoom 1.9 ran off the left of the frame with black on the right.
Shots 9 and 10 were the same static wide (K1, the giant already asleep) for 8.8 s under two lines. The tag was a grey box.

**What changed (validated: 0 errors, 7/7 rules; every reframing checked with `--stills` before the animatic).**

- *Line clarity.* `duck_db` -16 under the jokes (2, 4, 7, 8), -18 under the Nobody pair (9, 10), -20 and `voice.gain` +2 under the
  neighbours (13, where Circe's Loom builds to its drop), -14 under the bag set-up (5), -10 under the narrator on the opening, -9 under
  the loom line (18); the fire, the breathing, the snore and the crickets trimmed 6-8 dB under their lines. Speech against bed now:

  | shot | line | r1-revised | r2 |
  |---|---|---|---|
  | 1 | The gods take their places… | 6.3 | 11.2 |
  | 2 | How mortals love to blame the gods… | 7.6 | 12.6 |
  | 4 | sewn shut with silver wire | 7.3 | 11.7 |
  | 5 | The crew opens the bag, believing it contains treasure | 4.2 | 11.7 |
  | 7 | Out of my island — out, worst of living men! | 8.2 | 13.0 |
  | 8 | The men become pigs… human minds | 8.8 | 13.5 |
  | 9 | Nobody is my name. | **-0.8** | 11.9 |
  | 10 | I eat Nobody last, after all his friends | 5.2 | 12.1 |
  | 13 | If Nobody harms you… sickness sent by Zeus | 2.0 | 11.8 |
  | 15, 18, 19, 20 | the boast, the loom, Argos | 10.6-15.2 | 12.9-15.2 |

  Every line is now 11-15 dB over its bed (dialogue-over-score practice is 10+). The mix: -14.1 LUFS integrated, true peak -1.5 dBTP,
  LRA 4.7 LU; stems music -18.3, voice -14.2, effects -17.4 LUFS.
- *The bag joke gets its beat.* Shot 4 starts its line 0.2 s earlier and ends at 18.05 (3.05 s); shot 5 starts there (6.45 s), so
  “…believing it contains treasure,” ends 0.33 s before the WHOOMPH on the score's hit at 24.5: the momentary loudness is -30 LUFS
  in the half second before the cut and -11.5 after it, an 18 dB smash cut (round 1: +12).
- *Shot 5: the kit is cut.* The bag-of-winds kit put a small boat on a black sweep between two sunlit filmed shots. OD-B10-S01 K3
  (dusk, Ithaca in sight, Odysseus asleep by the mast with the bag at his feet) is the set-up in the film's own light and leads into
  K4's night burst. It saves ~13 kit renders in the full pass.
- *The cave (9-12, 14): the teaser's look.* The firelight (set lights to 12%, one low warm point at the hearth, a cool dark fill,
  exposure 0.9) and a 0.35 vignette on every cave shot, kept at 16:9 (this trailer's full, bright LEGO Movie frame; the dark does
  the work the teaser's letterbox did). The four stake-bearers cleared from 9, 10, 12 and 14 (and Odysseus from 12 and 14): one
  small man, one giant. 9 is the teaser's shot 3 (over the giant's arm, the name said to a face, push 0.12 on twos); 10 is new: an
  orbit round the giant's brow (az 5.9, r 120, h 150), his one eye in the firelight filling the frame while he promises, snore on the
  last beat; 12 gets the teaser's drum under the roar (+3 dB); 14 is K4 on a 40° lens, a jump in on the same giant, so the beat after
  the joke is his face, not a repeat of 12.
- *The heart's own light.* 18: the day ending (a purple-to-amber sky, a low amber key from the left); 19: the key's own night look
  (black hall, the torch on her): day to night on the cut, which is the story (“all day… every night”). 20-21 (Argos, the tear):
  dusk, a low gold sun behind the old dog. The comedy stays in bright noon, so the turn is visible before a word is said.
- *The brick title.* Both cards set on two lines (“MEANWHILE, / DOWN HERE”, “THE / ODYSSEY”): 18 and 26 px cells at 720p, letters
  17% and 25% of the frame's height, built by 72% of the card and held.
- *The opening kit* aimed at the council on its column (`kit_view.at` [300,-500,-200], zoom 2.6) instead of the whole base; the
  orbit steps twice a second (a time-lapse tripod, 13 true renders in the full pass).
- *The tag.* K3 re-shot close behind Odysseus (pos [-120,100,210], fov 36): the raft's grey deck swings up over his raised arms.
- *Kit 13 (the neighbours outside)* kept as one true render held (`stepped: 0.1`, so the full pass makes one render, not ten); it is
  the one exterior of the cave in the cut and the voices come from inside that rock.

**Render.** 18.0 min (with the other two editors' renders on the same four cores): 405 s of scene frames, 94 s of location loads,
347 s for 4 kit renders (80-96 s each under contention), 96 samples.

**The critic's pass on the r2 animatic.**

| | verdict |
|---|---|
| composition, scale | The cave is now one idea a shot: small man (9), eye (10), stake (11), silhouette (12), closer silhouette (14). The pig gag (8) and the boast (15) are still the best comic frames: the brick doing the joke. The bag burst (6) is a small figure in a big night: it is a 1.5 s hit, it reads. The opening is grand but lopsided: Olympus sits left of centre, the pediment touches the top edge and the right half is black sweep. |
| light | Three registers, each on purpose: bright noon for the gags, firelight for the cave, amber dusk into torchlight night for the heart. The montage is bright and mixed, as a montage should be. |
| pace | 0-66.5 s: 17 shots, mean 3.9 s, none over 7 s. The montage cuts every 1.0-1.2 s from the score's return (83.5, onset 83.55) to the title. |
| jokes on cuts | Zeus's complaint → the MEANWHILE card (0.3 s beat); “treasure,” → WHOOMPH on the hit (0.33 s beat); “worst of living men!” → the pigs; “human minds.” → the cave; “I eat Nobody last” → the stake; “sickness sent by Zeus,” → the drop into silence at 54.9 (the score is at -105 LUFS by 56.0); “who blinded you” → the mountain-top lifted. Every pay-off is on a cut; the three tightest (7→8, 8→9, 15→16) leave 0.07-0.2 s after the last word, which is the LEGO Movie's smash-cut habit, not a clipped word. |
| the heart | Sincere: no gag and no hit plays over 18-21, the score is the soft pulse ducked under Antinous and the narrator, the tear (21) is held 2.6 s in silence but for room tone. |
| the arc | open grand → the complaint → the chain of gags → the silence → the boast and its price → the truth → the montage → the title → the tag. It holds. |
| would The LEGO Movie's editors keep it? | Most of it. They would lose a second of the neighbours' kit (a 6.5 s static product shot is the longest hold in the comic section) and they would want the raft tag to move; neither is cheap to change here (the kit has no neighbours to stage, the key has one pose). |

**Revised for round 3 (validated: 0 errors, 7/7 rules).** Only the opening kit's aim (`at` raised to y -540, zoom 2.6 → 2.4) so
the pediment clears the frame; the full render re-renders every kit step anyway, so it costs nothing extra.
