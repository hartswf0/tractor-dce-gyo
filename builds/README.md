# The builds

Every file here was produced by the code in this repo, on a single unattended run, and
committed next to it. Nothing is curated: no reruns, no picking the good seed. Where a
build looks thin or scattered, that is the state of the generator.

Each build is a pair:

- `<name>.mpd` — the emitted LDraw model. Opens in LDView, LeoCAD, Bricklink Studio or
  any LDraw tool. References `parts/*.dat` from the vendored library in `ldraw/`.
- `<name>.png` — a render of that exact file, made by loading it into the same viewer
  the pages use, framed the same way for every build so they can be compared.

`manifest.json` carries the piece count, submodel-block count and byte size of each.

## How they were made

Each builder page was opened headlessly, given one command, and left alone until it
stopped. Then its MPD was taken straight out of the page's own state — the same string
the DOWNLOAD MPD button produces — and rendered.

| build | page | command |
|---|---|---|
| `gauntlet-shore-station` | `gauntlet.html` | `run 6` against 5935 Island Hopper |
| `hms-beagle`, `isabela`, `santiago` | the expedition pages | `run 60` watches |
| `finch-ground`, `finch-cactus`, `finch-warbler` | the finch pages | `run` to settled |
| `cathedral-forager` | `cathedral-forager.html` | `run 8` |
| `medusa-scriptorium` | `medusa-scriptorium.html` | `run 4` |
| `operator-trace`, `correspondence` | the duelling doctrines | `run 20` |

The renders do **not** come from the pages. Each builder frames its own world
differently — the gauntlet splits the bed into blind A/B panes and hides both models for
the length of a parse — so page screenshots cannot be put side by side. Every picture here
is the emitted `.mpd` loaded into one neutral viewer at the same zoom.

## What the block counts tell you

A real LEGO kit is cut into submodels: 89 in 10174 UCS Imperial AT-ST, 21 in 7140 X-wing,
nesting six deep. Read the `blocks` column in `manifest.json` against that.

The two paths that cut submodels are the ones that know what an assembly is. The crew
path stamps figures and vessels, so an expedition emits a handful of blocks. The brand
path cuts one per shearing layer plus a block per named assembly, and instances the
repeated ones. Everything else still emits a single flat block, which is the gap the
gauntlet exists to measure.

## Comparing them to the bar

`kits/renders/` holds the same treatment applied to the 16 real sets, and `builds.html`
puts both galleries on one page. The numbers under each card are measured by
`build-kit-index.js` / `NabugoKits.measurePlacements` — the same function on both sides,
which is the only reason the comparison means anything.

## The arena castles

Seven seed prompts, seven separate agents, seven castles, one world (`slipcase-build/arena/world.js`):
each agent could only place pieces by relation to open ports (or, for S06/S07, only change a plan
parameter or a card), and every castle was judged blind against 5935 Island Hopper on the twelve
axes. The full table, per-axis verdicts and each agent's notes are in
`slipcase-build/arena/RESULTS.md` (and in the slipcase under `_RESOURCES/arena/`).

| build | seed | pieces | W/L | structural open share |
|---|---|---:|---|---:|
| `arena-s01-field-routing` | S01 FIELD-ROUTING | 205 | 7/5 | 0.225 |
| `arena-s02-residual-packet` | S02 RESIDUAL-PACKET | 184 | 8/4 | 0.312 |
| `arena-s03-builders-game` | S03 BUILDERS-GAME | 213 | 5/7 | 0.178 |
| `arena-s04-decompile-first` | S04 DECOMPILE-FIRST | 245 | 7/5 | 0.325 |
| `arena-s05-body-and-joints` | S05 BODY-AND-JOINTS | 262 | 2/10 | 0.122 |
| `arena-s06-event-triggered-call` | S06 EVENT-TRIGGERED-CALL | 185 | 7/5 | 0.258 |
| `arena-s07-card-to-massing` | S07 CARD-TO-MASSING | 138 | 8/4 | 0.386 |

Kit band for the open share: 0.112–0.431. The baseline `card-castle` (no agent) is 182 pieces, 4/8, 0.227.
