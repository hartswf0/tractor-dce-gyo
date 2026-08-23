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
