# The Odyssey in Cascade

A [Cascade](https://github.com/marcuswendt/cascade) project (FIELD.IO's node-graph runtime, MIT, npm `@field/cascade`, pinned
at 0.7.1) built around five stepping stones of the LEGO Odyssey, each grown from a failure or an aberration of the film, the
game or the kits. The page that shows them is `index.html` (made by `tools/forage/product/cascadepage.py`).

| Graph | Stone | What it reads | What it makes |
| --- | --- | --- | --- |
| `kit.cascade` | A kit of a motion, not a moment | `assets/gestures.json` (Telemachus's slice of `odyssey/choreo/OD-B01-S03.json`, Odysseus's of `OD-B22-S01`) | the hand's trail swept by minifigure kinematics, quantized to studs and plates: SVG, frames, player, and `gesture-cells.json` for the kit |
| `attention.cascade` | The attention knob | `assets/hall.json` (the twelve figures of the gate, per-drawing scripted motion) | an explicit `cascade.core.Feedback` loop that invents business below a threshold; trails from its history |
| `clocks.cascade` | Two clocks | nothing: two parameters | the raft laid at the performer's rate, sun and moon arcs at the world's rate; the ratio is a parameter |
| `forbidden.cascade` | The illegal Odyssey | `assets/clashes.json` (from `tools/clashes.py`, the line's checker on the pre-strict Troy and Ithaca modules) | only the volumes where two parts fill the same space, per card |
| `facing.cascade` | The facing field | nothing: seeded | objects in the Cyclops' cave facing away from a groping point by an explicit `N`, turned by `cascade.geo.CopyToPoints` |

## Layout

- `nodes/<Name>/index.ts`: the project's definition-v1 nodes, all `runsOn: 'portable'` (CPU and Canvas 2D only, so every
  graph cooks under `cascade run` and in the static player): ChoreoHand, StudGrid, View, Bricks, Plot, Paint, Hall, Business,
  Marks, SkyArcs, Planks, Forbidden, FacingField.
- `lib/`: what nodes share (the choreography sampler and minifigure kinematics, the hall, the view). Pure functions.
- `assets/`: small JSON cut from the project's data by `tools/extract.cjs` and `tools/clashes.py` (the sources are read, never changed).
- `graphs.json`: every graph's frame range, rate, output node and the parameters its player exposes.
- `players/<name>/`: `cascade build` output (committed, served by GitHub Pages); `players/view.html?g=<name>` mounts one with its
  own `embed.js` and puts its parameters on sliders.
- `media/`: the print (`<name>.svg`) and motion (`<name>.mp4`, `<name>.jpg`) of each graph, from `tools/media.mjs`.
- `kit/`: the gesture built in LDraw parts (`cascade.gesture-welcome.mpd`), its check and its renders.
- `verify.json`: the last headless verification (`tools/verify.mjs`).

## Commands (from this folder, after `npm install`)

```sh
npm run check            # type-check the nodes
npm run check:graphs     # cascade check every graph
npm run extract          # re-cut assets/ from odyssey/choreo and odyssey/cards
npm run kit              # cook the gesture, then build and check the kit (kitlib; 0 loose, 0 clashes or it fails)
npm run media            # every frame headless -> media/*.mp4, *.jpg, *.svg (renders/ is not committed)
npm run build            # every graph -> players/<name>/ (old player removed first; cascade build needs a new directory)
npm run verify           # the critics: every graph cooked bounded and headless, outputs and one question per graph checked
python3 ../../tools/forage/product/cascadepage.py      # the page
```

Render the kit (with the repository served on :8899):
`NODE_PATH=<playwright + three> node tools/forage/look.js --out <dir> --w 1600 --h 1100 --jpeg --studio dark --az 205 --el 28 --zoom 1.7 ../cascade/kit/cascade.gesture-welcome`
(run from the repository root; the id is relative to `odyssey/cards/`).

## Conventions

- Coordinates: the graphs work in the film's frame (three.js: y up, the gate toward +z, world units, LDU where the node says so).
  LDraw is y down and the film shows a model turned half round x, so `tools/gesture_kit.py` maps the film's z to -z.
- Determinism: nothing reads a clock or `Math.random`. Time reaches a node as an expression on a prop (`$T`, `$F`), variation
  from a seeded hash. The attention loop re-simulates from drawing 1 at every frame (Feedback `steps` wired from `cascade.core.Time`),
  so it scrubs.
- A parameter a visitor changes must hold a plain value, not an expression: `setProp` does not override an expression.
- `node_modules/`, `renders/` and `.cascade-cache/` stay out of git.
