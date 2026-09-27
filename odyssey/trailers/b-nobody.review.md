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
