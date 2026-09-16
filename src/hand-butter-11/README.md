# Hand Butter 11: arena, cast and eye view

Open [`WAG-HAND-BUTTER-11.HTML`](../../WAG-HAND-BUTTER-11.HTML). This named version preserves the older WAG-HAND-BUTTER.HTML entry point. The download bundles its parts and cast geometry and does not fetch local file URLs for these assets.

## Operate

- Open the picker. Choose Pieces or Cast. Swipe the card or search by name, then tap Add.
- Choose Scenes to load a preset with its cast.
- Choose Placed and search or swipe to an individual character. Move → tap clear floor space. Cancel placement remains visible on stage. Turn rotates the chosen character 90 degrees.
- Tap a figure or choose Eyes. Tap Back, the stage, or Escape to return. Release a held brick before entering.
- The selected actor responds to the existing performer controls. Other cast members keep their poses and rotate with the build plate. Characters stay clear of existing bricks when placed; this is not a full character physics solver.
- Save/Open scene stores bricks, character kinds and positions, headings and plate angle. Browser storage restores the same scene on reload. Scene replacement has a single Undo entry that restores both parts and cast.

## Add real parts and characters

`catalog.json` lists additional parts and available character definitions. Geometry comes from the repository's `ldraw/` files; rig definitions come from `world/minifig.js`. Each part needs its LDraw ID, name, body height (without studs) and `[minX,maxX,minZ,maxZ]` collision bounds in bottom-origin, Y-up LDU. Set `studGrid: true` only for a verified rectangular grid of standard studs and sockets. Other shapes need explicit connection metadata before snapping can be claimed. New definitions can be added to `world/minifig.js` and referenced by the catalog. Weapons/capes are omitted in this builder.

From the repository root:

```sh
python3 scripts/embed-hand-butter-11.py
node scripts/build-hand-butter-11-assets.cjs
BROWSER_EXECUTABLE=/path/to/chromium node tests/wag-butter-11.cjs
```

The embed script copies the repository's rig, fixed LDraw loader, eye-view module, cast module and catalog into the standalone file. The asset build reads actual LDraw dependency files from the checkout, or tracked Git objects in sparse checkouts, then embeds those sources and converts part triangles once. No runtime CDN dependency is added for these assets. Missing source files fail the build. Retain the LDraw license and author records carried in the embedded sources.

The older `scripts/build-hand-butter-spatial.py` targets WAG-HAND-BUTTER.HTML only. Do not run that older pipeline against the 11 page: its interaction modules predate independent grip/tool controls.

## Freeze diagnosis and regression

The loader emitted a final geometry material group with `count: Infinity`. Three r128's multi-material Mesh.raycast bounds its triangle loop by the group count and draw range; both were infinite. A real click on the figure never returned. Calling `ButterEye.enter()` directly bypassed that hit test and missed the bug.

The shared loader and embedded copy now emit `numGroupVerts`, the actual final group's vertex count. Figure picking tests solid meshes, not decorative lines. The regression launches the entire HTML, clicks rendered head coordinates, checks frame advancement, exits, and repeats at desktop and phone dimensions. It also parses all three bundled rigs, places characters, rejects out-of-bounds placement, turns the plate and adds a new part. Live MediaPipe recognition, physical phone performance and speech recognition still require device testing.

## Preloaded scenes

Parts → Scene → Load scene opens Workshop, Parts + Cast, or Odyssey · Pig farm study. Every scene includes its cast. The farm uses real `87621.dat` pig geometry from `ldraw/parts/`, identified by the supplied Odyssey forage manifest. It is a purpose-built blocking study, not the complete 7637 Farm donor. `odyssey-forage.json` preserves the supplied donor index; its 38 MPD models are not bundled or claimed as imported scenes.

`scenes.json` contains scene records: existing part IDs plus actor kinds, plate-local positions and headings. Add recipes here and run the embed script. A launch URL can select a scene, for example `WAG-HAND-BUTTER-11.HTML?scene=odyssey-farm`. Scene loading prepares all rigs and validates character positions before replacing the workspace; errors leave the existing scene available.

Run `node tests/wag-butter-11-scenes.cjs` with the same browser setup to exercise preset buttons at desktop and phone widths, full-scene Undo, failed-import preservation and reload persistence. Irregular donor parts use `autoBounds: true` to derive conservative collision bounds and a separate LDraw origin offset; no snap ports are invented for them.

## Movieator catalog and phone picker

The picker uses a single fixed-height card: Pieces, Cast, Scenes, Placed. Swipe horizontally or use the previous/next buttons; arrow keys also work. Search narrows the card sequence. Adding an item closes the picker. It overlays the stage without resizing it and has no internal scrolling. The compact operator toolbar also applies to phone landscape widths up to 1100px.

`scripts/import-movieator-catalog.cjs` regenerates the recipes, six scene presets and searchable index from the tracked Movieator sources. Run it before the embed and asset-build scripts when those sources change.

`movieator.js` assembles all 23 recipes from `movieator-production-data.js`: Simpsons, Star Wars, Gremlins, Scooby-Doo, Back to the Future and Stranger Things. It preserves printed source parts and source base-figure substitutions. Upper-body assemblies are separated at their existing arm pivots; assembled lower bodies retain their source geometry. They can be positioned and turned independently; this does not port Movieator's wardrobe/attachment solver or articulate every assembled leg. The six new presets contain individual cast instances. Printed source dependencies are embedded so the cast works without downloading geometry.

`movieator-index.json` contains 4,915 non-obsolete minifigure and prop records from Movieator's all-parts descriptor catalog. Searching Pieces includes that index. Added repository parts load via HTTPS, preserve source vertex colors, and use conservative bounds. They are separate stage objects, not automatically attached clothing or weapons. Extra parts require internet again when reopening a saved scene; their geometry is not included in scene JSON. Load failures preserve current scene contents and can be retried. The HTTP source carries its existing LDraw attribution.

Additional regression commands:

```sh
BROWSER_EXECUTABLE=/path/to/chromium node tests/wag-butter-11-picker.cjs
BROWSER_EXECUTABLE=/path/to/chromium node tests/wag-butter-11-repository.cjs
```

The repository test bridges browser downloads through Python to retrieve actual HTTPS sources in restricted test environments; it tests failure, retry, geometry conversion and reload. Live network behavior and hand gestures on a physical phone still require device testing.
