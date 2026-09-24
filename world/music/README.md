# The score: Silt Wire & Mountain Current

Five recorded cues, labelled by reel position (m0 to m3a), used as the films' scores through the sound engine's
`score: 'file:../music/<name>.ogg'` (world/sound.js): the track runs on the score bus, dips under every spoken line,
and mixes with the foley and the set's ambient bed; the export renders it into the film's WAV with the rest.

`cues.json` is the analysis (librosa): length, tempo, beat and bar, the first beat, section boundaries, where sound
starts and ends, loudness every two seconds, and every beat time. Cut on it.

| cue | length | tempo | shape | film |
|---|---|---|---|---|
| m0 Weather Ahead for Finley | 51.8 s | 108 bpm | dark low chords 0-10.5, a plucked build 10.5-25.7, the band at 25.7, a hit and break at 42.75, the tail to 52 | The Searchers: the door, the sighting and the approach, home, the turn in the door, the leaving |
| m1 Trouttown Working Day | 149.0 s | 122 bpm (bar 1.973 s from 0.21 s) | a steady working groove; sections turn at bars 8 and 23 | The List: every cut on a bar line, the track faded over the end card from bar 23 |
| m3a Swim Against the Current | 66.6 s | 144 bpm | driving from 3.7 s to 61.5 s | the forest skirmish, when it is re-cut |
| m2 Lost & Found Under the Courthouse Eddy | 99.9 s | 108 bpm | a quiet head, the bass in at 10.7, a turn at 66 | the cave, when it is re-cut |
| m0 Blue Ridge Over the Wire | 150.8 s | 123 bpm | a long steady ride, sections at 17, 42, 64, 95, 142 | a longer cut, or the reel |

## searchers-score.ogg (original)

An original score for The Searchers case, written note by note in `tools/score-searchers.py` and rendered by it (strings,
horn, finger-picked guitar, flute, a fiddle, a trotting woodblock, male voices on "oo", harmonica, timpani, a stereo hall), in
the manner of a 1950s Western studio score. The case is cut shot for shot to the film's ending (111.5 s with the card), so the
score follows the ending's music as a map, not as notes: the same key areas at the same seconds (E major on the porch, a lift
through A-flat at the pool, a bright D major as Lucy runs, D minor on Martha, E major dying away under the lift from the saddle,
A major for Mose, C-sharp minor and D on the homecoming, a low A in the room, E major on the man alone, the choir as he turns,
a rising A major into the door), and the same loudness half second by half second (a table of levels measured from a reference
copy, which the mix is ridden to). No audio of the original is used or kept; every note is written in the script. It is not
Max Steiner's score nor the songs "What Makes a Man to Wander?" and "Ride Away", all still in copyright.
