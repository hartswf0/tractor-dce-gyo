# Rendering a trailer

The edit lists in this folder (`<id>.json`) are played by the trailer render path. Everything below runs from the repository root.

Since round 1 the JSON files carry the review revisions and are ahead of `build_trailers.py`: edit the JSON (then `trailers.py`,
and regenerate the .md with `python3 -c "import json;from build_trailers import write_md;write_md(json.load(open('<id>.json')))"`
from this folder), or port the changes into build_trailers.py before re-running it. Reviews per trailer: `<id>.review.md`.

## Before anything

```sh
# the repository served on :8899 (the player and the forage page load over http)
curl -s -o /dev/null -w "%{http_code}" http://localhost:8899/odyssey-forage.html   # 200, else:
(setsid nohup python3 -m http.server 8899 --directory "$PWD" > /dev/null 2>&1 &)
export NODE_PATH=<a node_modules with playwright@1.56 and three@0.128>   # the scratchpad's nm/node_modules in the builder sessions
python3 tools/forage/product/trailers.py            # 0 errors, every rule passing, before any render
```

## The tools

| file | what it does |
|---|---|
| `film-readymades/odyssey-trailer.js` | `window.OdysseyTrailer` in the Film Butter player: stages a shot's key exactly as the keyframe gate does, lays the shot's `look` over it, runs the camera move, restores the pose every frame with Perform's idle life, faces and lip sync on the speaker, flickers the warm practicals, draws CARD and BLACK shots on a 2D canvas, applies the trailer's `grade` (letterbox, vignette). It uses only the page's globals, so the exporter injects the working-tree file; `python3 film-readymades/patch_trailer.py` also embeds it in the built player. |
| `tools/export-trailer.js` | the renderer: groups shots by scene (each location loaded once), draws every frame (full) or 2-3 samples per shot (animatic) into a frame folder, then mixes the sound and muxes. `--resume` continues a crashed render. |
| `tools/trailer-sound.py` | the sound: music cues (in/out/at/gain/fades, crossfades by overlap), voice clips at their times (each brought to -16 LUFS), the music ducked under voice by the take's bed law (0.10/0.18, 150 ms raised cosine; `shot.duck_db` to go deeper), synthesised effects matched from the `sfx` names, mastered to -14 LUFS integrated, true peak under -1 dBTP. `--fx-only` writes the effects library to `films/trailers/fx/` to audition. |
| `tools/trailer-assemble.py` | the animatic: each shot's samples held for their share of the shot, 0.12 s dissolves inside a shot (hard cuts between shots), at 24 fps under the full mix. |
| `tools/trailer-review.py` | the critic's material: a contact sheet of every shot (start/middle/end of a move), the frames either side of each hit and in each voice line, the reference frames, and the loudness (integrated, true peak, the short-term loudness of every line against the second before it, every hit against the half second before it). |

## Commands

```sh
# an animatic (960x540, 3 real frames a shot, the full sound). Round 1 took 8.0 min (A), 16.3 (B: 9 kit renders were 8 of it), 11.4 (C);
# a location loads in ~40 s the first time and 2-4 s after; a frame ~2.3 s; a kit render 30-75 s
node tools/export-trailer.js b-nobody --mode animatic --out films/trailers/b-nobody-r2-animatic.mp4

# the full render (1280x720; --fps 24 or 12): ~2.6 s a frame on swiftshader + ~40 s for the first location; the 30 s teaser at 24 fps
# (720 frames, 530 of them 3D) takes 19.5 min, so a 2-minute trailer at 24 fps is ~75-90 min (at 12 fps about half)
node tools/export-trailer.js teaser --fps 24 --out films/trailers/teaser.mp4 [--resume]

# stills at trailer times, to check a revision before rendering it
node tools/export-trailer.js teaser --stills 4,9.5,17 --frames /tmp/teaser-stills

# one shot only (e.g. after re-staging it), into the same frame folder, then re-run without --shots and with --resume to finish
node tools/export-trailer.js a-long-way-home --shots 7 --fps 24 --frames films/trailers/a-long-way-home.frames

# the sound alone, and the review
python3 tools/trailer-sound.py teaser --out films/trailers/teaser.wav
python3 tools/trailer-review.py films/trailers/teaser.mp4 teaser
```

Run heavy renders one at a time, in the background, with generous timeouts. Frame folders (`<out>.frames/`) can be deleted after a
render; keep them while iterating so `--resume` and `--shots` can reuse frames.

## What the edit list can say (beyond the validator's fields)

These are read by the render path and ignored by `trailers.py`:

- `doc.grade`: `{letterbox: 2.39, vignette: 0.35}` for every SCENE frame; `shot.grade` overrides it per shot (`wash`, `washAlpha` too).
- `shot.look`: `sky`, `fog`, `exposure`, `fill`, `dim`, `time` (night dims the set's own lights to 0.2, dusk/storm to 0.45), `key`
  `{from, color, intensity}` (a directional light; `from` is read as words: high/low, left/right, behind/front, relative to the
  camera; or give `dir: [x, y, z]`), `lights` (extra point lights, added to the key's own), `no_lights`.
- `shot.stage.hide_actors`: figures the key stages that this shot does not want (restored at the next shot).
- `shot.camera.override`: fields laid over the key's gate camera before the move (`r`, `h`, `az`, `fov`, `pos`, `target`...). A
  frame reframed this way has not been through the gate: check it with `--stills`.
- `shot.camera.move`: `type` push | pull | zoom | orbit | crane | track | hold, `amount` (a fraction of the lens-to-target distance;
  orbit in radians; crane up, negative down, the aim rising `tilt` (1.3) times as far), `ease` in | out | inOut | linear,
  `stepped: 12` (positions a second, stop-motion), `wobble` (a hand-held weight, 0-1).
- `shot.speaker_actor`: whose lips move, when the speaker's name does not match an actor id in the key.
- `shot.sfx_at` `{name: seconds}` and `shot.sfx_gain` `{name: dB}`: move or trim an effect; `shot.duck_db`: the duck under this
  shot's line (default -5.1 dB); `voice.gain`: dB on one line after the loudness match.
- KIT shots: `camera.kit_view` `{card, az, el, zoom, at}` (look.js's studio camera, degrees and LDraw units) when the kit still's
  camera is not in `KITVIEW` (tools/export-trailer.js). Moves: orbit turns az, push/pull scale zoom, crane moves el (amount x 100
  degrees), track turns az a little. Full mode renders one true render per step at `--kit-rate` (default 4 a second).
- CARD styles: `nolan` (small tracked serif capitals), `nolan-title` (9% of frame height), `bronze` (engraved gold, a 3% push),
  `brick` (letters of 1x2 plates snapping on at 12 a second, in 5x7 glyphs: the letters A-Y used by the cards so far, `,` and space).

## Limits worth knowing

- A shot plays one key: actions that need a second pose (Polyphemus toppling, a head lifting, the bag bursting) are the key's pose
  plus the camera move, the faces and the speech; nothing is animated between keys inside a shot.
- The Film Butter locations' shadows are drawn once per shot (the cast barely moves), so frames are ~2.7 s at 1280x720.
- KIT shots are lit by the forage studio (dark seamless, key and rim), not by the shot's `look`.
- Effects are synthesised: they sit under the score and read as the right event, but they are not foley.
