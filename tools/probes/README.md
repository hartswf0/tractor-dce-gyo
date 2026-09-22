# The probes: how a film is looked at before it is shot

Headless Playwright drives the pages the way the tests do (`NODE_PATH=<dir with playwright 1.56 and three@0.128> node tools/probes/run.js '?noloc' ./tools/probes/<probe>.js`, the static server at `python3 -m http.server 8899` from the repository root, `mocks.js` serving three from node_modules and refusing every other host so the page falls back to its baked valley). Each probe writes its frames next to itself (`<name>-<key>-*.png`); tile them with ffmpeg (`-pattern_type glob -i 'scout-case-x-*.png' -vf "scale=400:-1,tile=4x4"`) and look.

- `scout.js` (KEYS=case-a,case-b): lays each case, cuts to every shot, keeps its first frame and a frame at 55 percent: the cameras judged without playing the film through (about twenty seconds a shot).
- `setmap.js` (KEYS): a height map of the laid set from rays above (metres from the spawn, x east, z south, glyphs by height), the donor box and where the actors stand.
- `finemap.js` (KEY, RANGE='[x0,x1,z0,z1]'): the same at one metre.
- `colours.js` (KEY): the bounding box of every vertex colour of the laid set, low (under 12 m) and high: where the red things are, where the white wall is.
- `plan.js` (KEYS): a plan view from above and four obliques in daylight, plus exact floor heights at given points.
- `c-cases.js`: plays each case to its end and asserts every shot was reached (the regression; ten to fifteen minutes a case).
- `manual-probe.js <model>`: loads `play/manual.html?model=`, pages through it, checks the piece count against the sheet, keeps four pages as images.
- `probe-butter.js`: loads the Hand Butter scenes page and its presets.
