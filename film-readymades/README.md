# Film Butter experiment: shop, open the door, leave

Open `index.html`, play the level, or watch `production/Film-Butter-Final.mp4`. The accepted scripted run collects three native foods with character hands, deposits them, checks out for $4, opens the entrance with a mouse-driven hand interaction, and exits onto the pavement. Evidence: `gameplay/final-run-verification.json`. Main repository index links this as an experiment.

# Human walking and grab repair

The visible native legs now animate. Tap the actual food to reach and grab with a free native hand. `gameplay/human-input-verification.json` records successful browser mouse grabs for all three foods and native leg motion, with no browser errors. These are input acceptance tests using developer positioning, not a human usability study or an LLM trial. The earlier video predates this repair.

# Character-hand revision

See [hand controls and verification limits](gameplay/HAND-CONTROLS.md). The current hand test is scripted engineering evidence. Both attempted visual LLM operators hit a usage limit before playing; no new two-LLM success is claimed.

# Visual-test correction

The prior two-LLM run was an assisted transaction test. Destination lookup solved navigation and named event messages supplied the detective’s answers. It is not evidence of visual shopping or watching. The prior video is retained as an archive, not the current acceptance result.

The revised player restores the native Marge, Maggie and cashier figures with an overhead follow view and eye-view toggle. Groceries must be in front of the player to collect. `ShopOperators` now exposes rendered eye-view images, the player’s own task/state, and bounded move/turn/interact/note controls. No partner coordinates, target lookup or named pickup feed are supplied. The older oracle-assisted interface is retained only as `AssistedShopOperators` for reproducing the archived test.

A visual trial must be reported separately; implementation alone is not a passed perception test, and fun is not established by a software test.

---

# Playable shopping and the detective experiment

Open `index.html` and choose **Play the shop**. This continues the existing native Green Grocer rather than replacing it. Collect bananas, a croissant and carrots; checkout at the left-hand register commits a $4.00 game receipt. Two joysticks and keyboard movement remain available. Accepted movement and transactions are replayable.

The first completed test rejects out-of-reach collection, duplicate pickups and incomplete checkout, and reproduces the paid inventory in replay. Read `gameplay/README.md` for controls, role tools, reproduction and collision scope. The older hand-transfer animation remains a separate failed contact review; a game inventory transfer is not a solved physical grip.

Maggie has a separate observation notebook. PeerJS 1.5.5 and QR invitations are implemented, but public signaling failed in this environment and local signaling produced no usable WebRTC connection. The recorded two-LLM experiment therefore uses the explicitly labelled BroadcastChannel local two-tab transport. A hosted reachable URL and real-device WebRTC test are still required before claiming phone scan-to-play works.

`gameplay/llm-operators.json` preserves actual model-issued public commands, short reasons, returned observations and outcomes. `go`/`follow` are deterministic navigation tools; the LLMs choose destinations and transactions. Model waiting time is omitted from the action-clock replay. No provider key or hidden reasoning is included. The accompanying essay identifies these distinctions.

The material renderer uses double-sided native surfaces and whole-piece visibility. This does not repair every donor surface intersection or establish a structurally valid LEGO build. All 15 earlier scenes, donor provenance, source definitions and assembly review remain.

The sections below document earlier stages. Their former Film mode is now the explicit **Inspect archived take** route (`?inspect=1`); the grocery's **Replay** mode plays shopping runs.

---

# Contact-review repair · build remains unverified

The earlier MP4 is an archived, invalid prototype with known clipping. It is not the current acceptance result. Open `index.html`, then **Inspect in Butter**. Film mode is now an inspection surface: Play runs a clearance review and blocks this take when unresolved contacts remain. Scrubbing stays available. Expand the contact review, select a failure to inspect it in the scene, or save its JSON report.

The renderer now hides complete native leaf instances for camera access, rather than slicing through bricks with uncapped clip planes. The full architecture and native exports remain intact. Cashier and buggy placement, apple stem attachment, and initial prop positions have been revised against measured geometry. The original source assembly review is retained.

`performance/contact-report.json` contains the current failed review; `performance/contact-before-report.json` records the earlier baseline. These are conservative cast/prop envelope versus triangle tests at 12 Hz, plus unresolved hand/prop envelope overlaps. Transparent glass, the buggy and authored display housing remain obstacles. The review can flag safe hollow grips; it does not classify every possible containment, continuous swept motion, or self-collision. No connection, support, insertion, clutch, balance or strength solver exists here. **This is not a verified LEGO build.** Remaining prop transfers and grips must be solved before another film export is accepted.

Run `node performance/test_contacts.cjs` for the playback/export rejection and cutaway checks, and `node performance/test_take.cjs` for workspace state preservation. The contact review reports failure as failure; passing the software tests does not mean the model passes clearance.

---

# Film Butter continuation — Unidentified Item in Green Grocer

Open **production/Film-Butter-Readymades.html**. This continues the existing Butter/Hand player: the new Green Grocer location is first, followed by all fifteen earlier scenes. It does not replace the earlier films.

- **Whole building:** the authored shop, apartments, roof terrace, façade, stairs and fixtures, with the existing Butter cast at the checkout.
- **Shop cutaway:** upper floors hidden and foreground native leaf instances hidden for inspection. This is a reversible display cutaway, not a construction edit. Original coordinates remain intact.
- **Source assembly:** 193 review pages cover all 723 direct ground-floor placements in source order, at most six additions per page. Past geometry is neutral, current additions are highlighted, future geometry and cast are hidden. Named source subassemblies can be downloaded as native MPD booklets; their internal steps are preserved, not replaced with a pretend single-piece BOM.
- **Walk:** existing two-stick/keyboard navigation uses 947 native leaf bounding envelopes, transformed with their owning editable batch, instead of treating the whole shop as a solid box. These conservative envelopes are navigation approximations; closed doors remain barriers.
- **Native MPD:** production/Film-Butter-Grocer.mpd preserves source definition bodies, colours, steps and the four architecture parent transforms. This export excludes the donor minifigure extras; the player supplies the existing Butter cast. The player’s separate Edited MPD exports a posed triangle snapshot.

**The earlier 48-second take is retained for inspection inside the authored location.** Choose Film to inspect it. Playback is gated by the contact review. Its original scan/rejection/squeak/crunch score is synchronized to the same clock as the cast, props and cuts. Other cases retain their previous sets and scouting playback. No strength, insertion, clutch or ergonomic validation is claimed.

The performance reuses the earlier story, native shop and checkout, existing Butter cast, an open buggy derived from the donor, and native apple geometry. The apple accessory is uniformly reduced to half scale for the take; the duck and register display carry forward authored film-prop construction. The baby's neck mounting is corrected during the take. Character and prop actions remain stylized; this is not a physical grip/contact simulation.

Film mode uses a whole-piece foreground-wall cutaway for camera access and lifted upper floors. It preserves the donor checkout, including transparent glass. The source MPD stays intact. Leaving the take restores prior actor placements and joints; saving during playback records the pre-take workspace positions. Native location MPD is architectural; the open buggy has a separate native export. Performance prop poses are retained in the deterministic take code, not in the architectural MPD.

The exported **production/Unidentified-Item-Green-Grocer.mp4** is rendered from the same in-player take, at 1280 × 720, 12 frames per second, with stereo sound. Film mode fits the complete 16:9 frame on portrait screens. Titles appear only at the beginning and end.

Known rendering limits: glass uses approximate transparency, without refraction or TEXMAP. Dynamic shadows are disabled for this heavier edition; the new location caps drawing at 25 fps while input continues updating. Actual mobile hardware performance has not been measured.

## Rebuild this continuation

The gzip-compressed base player is the exact prior Film Butter player. The build changes its scene data and injects the location extension inside its workspace closure; it does not rebuild the Hand environment from scratch.

```sh
python build_location.py
python test_location.py
python build_performance_assets.py
python build_butter.py
node performance/test_take.cjs
node performance/render.cjs
# Encode as documented in performance/README.md
```

The browser check needs Playwright and Chromium; its paths reflect the current workspace. Location reports and desktop/mobile views are under production/; take checks, contact sheet and export report are under performance/. Geometry generation needs NumPy. All original donor, atlas and dependency files below remain intact.

---

# Film Butter — Readymade donor atlas

This forage replaces the previous repetitive construction approach with actual published LDraw kit models and their authored submodels. Open **Film-Butter-Donor-Atlas.html** in a browser. Choose a film, select a donor kit, search its model definitions and export a rooted MPD. On a phone, swipe the image to move between film cases and open the Modules sheet for the hierarchy.

## What is included

- 21 acquired donor kit MPDs, preserved as retrieved.
- 1,094 reachable model definitions, including the 21 main model roots. Every definition has a separately exported MPD containing its referenced descendants.
- A film-to-donor map covering grocery, forest action, Undaunted, Sheep Parliament, band class, Plato’s Cave, Searchers, Odyssey locations, rocket launch and proposed Jellyfish alternatives.
- Source authors, licence headers, file checksums, direct placements, child-module occurrences, source step groups and local transform warnings.
- Native LDraw geometry previews where rendering succeeds, with a report of failures.
- The program theory, a reusable parser/extractor, and preservation tests.

The embedded HTML can export a module without network access. Standard external parts still require an LDraw installation when opening an MPD in another application. The package includes the acquired dependency files and explicitly records remaining unresolved references. Do not treat a source reference as a downloaded file, a model definition as a physically detachable module, or a rendered image as a strength test.

## Strongest immediate choices

| Film | Start with | Extract and preserve |
|---|---|---|
| Grocery | 10185 Green Grocer | Complete grocery floor, cashier desk, shelves, produce displays, gateway, doors and apartment floors |
| Forest action | 21318 Tree House, 6071 Forestmen’s Crossing, 6066 Camouflaged Outpost | Authored canopy/cabin construction, crossing building, doors, rock-side and tree-side buildings |
| Undaunted | 6769 Fort Legoredo, 6716 Covered Wagon, 7410 Jungle River | Wall sections, tower, roofs, fireplace, wagon, drawbar, boat and crate |
| Sheep Parliament | 7637 Farm, 31048 Lakeside Lodge, 21325 Medieval Blacksmith | Barn, stable, silo, building, furniture and detailed timber construction |
| Band class | 10218 Pet Shop, 10243 Parisian Restaurant | Rooms, stairs, chairs, benches and tables; retain the existing band scene’s instruments |
| Plato’s Cave | 6066 Camouflaged Outpost, 6080 King’s Castle, 6769 Fort Legoredo | Rock-side building, prison bars, drawbridge and fireplace |
| Searchers | 31048 Lakeside Lodge, 10218 Pet Shop, 6716 Covered Wagon | Domestic shell, window, bed, chair, furnished rooms and horse/wagon |
| Odyssey locations | 6264 Forbidden Cove, 6278 Enchanted Island, 6285 Black Seas Barracuda | Coastal geography; named boat, stern, deck, mast, rudder, lamps and chest |
| Rocket | 21309 Saturn V | Authored stage-related and curved-panel groups, at their native scale |
| Jellyfish | Source still unlocated | Town Hall, Detective’s Office and Saturn V are proposed construction donors only |

These are adaptation choices, not claims that all film sets have been assembled. Fort Legoredo is not a historically accurate Fort Mandan. Saturn V is not minifigure scale. A donor’s setting, scale, signs, uniforms and mechanisms must be reconsidered before reuse.

## Verified specifics

Green Grocer’s acquired file contains 156 model definitions. Its grocery-floor root expands to 947 leaf placements; its cashier desk is an authored 29-leaf group and its shelf an 11-leaf group. The file also contains named upper floors, fire escapes, fireplace details and rooftop furnishings. These are inspectable MPD boundaries, not names invented for generated boxes.

Fort Legoredo contains 36 model definitions, including named wall sections, a tower, roof supports, fireplace, windows and trapdoors. Farm contains named barn, stable, silo and tractor groups. Black Seas Barracuda contains authored stern, deck, mast, rudder, boat and furniture groups.

Forbidden Cove and Enchanted Island are flat source models. The atlas reports one root for each; it does not invent a subassembly hierarchy. Both reference 6029b.dat, which was absent from the available part index at the time of this forage.

## Counting and validation

“Leaf placements” means expanded LDraw reference occurrences at the boundary of a part definition. It is not a retail piece count. Flexible hoses, chains, shortcuts and embedded geometry change the counting unit. “Model definitions” includes tiny repeated details, whole floors, mechanism fragments and main roots; it is not a count of detachable modules.

`test_catalogue.py` checks all 1,094 extracts against their donor: exact transitive definition closure, preserved placements and transforms, preserved source step markers, and unchanged expanded occurrence counts. It also checks repeated-instance counting and cycle rejection.

`dependency-state.json` reports unresolved external names and any files still to acquire. `render-report.json` records actual native-geometry rendering outcomes. An absent preview is reported, not filled with approximate brick geometry. Texture-map rendering is not implemented by the preview renderer; any donor that uses TEXMAP needs a renderer that supports it for complete appearance.

The catalogue reports local singular or non-rigid transforms. It does not repair them, run collision tests, establish connection strength, calculate torque, certify independent module stability or infer hand clearance.

## Sources and access limits

The repository sources are public copies of authored LDraw models. The `models-annotated` mirror may contain descriptive annotation added by its maintainer. Source names and transforms are preserved; annotations should be inspected against geometry before being treated as semantic ground truth.

- Tractor model collection: https://github.com/hartswf0/tractor-dce-gyo/tree/main/ldraw/models
- Annotated model mirror: https://github.com/anteloc/ldraw-lib/tree/master/models-annotated
- Official Model Repository: https://library.ldraw.org/omr/sets
- Modular-building source discussion: https://forums.ldraw.org/thread-22624.html

Direct terminal OMR downloads returned HTTP 403. The public forum attachment route required login. The browser download route did not complete. For relevant kits, public GitHub copies and previously acquired MPDs supplied the actual files. `sources.json` retains the initial retrieval attempts; `catalogue.json` records the source used for each acquired donor.

71016 Kwik-E-Mart, 10236 Ewok Village and 10255 Assembly Square remain reference targets; their files are not included. Grand Piano 21323 was listed in the mirror but content retrieval returned empty. The specific Jellyfish Data Temples MPD was not located. These gaps are intentionally visible.

## Theory before further implementation

Read `THEORY.md` for the shared entities, operations, invariants, screen states, code-sketch corrections and change tests. The next implementation should use the same module-instance identities for the assembled view, diagnostics, hierarchy and instructions.

The donor-atlas layer implements forage, extraction and catalogue inspection; the continuation above adds a location, source assembly review, navigation and the retargeted short. It does not implement the proposed stress heatmap, insertion solver, projected-occlusion optimizer or complete ergonomic instruction paginator. The supplied sketch’s hard-coded stress message must not be presented as a result.

## Reproduce

Python 3 and NumPy are required for graph diagnostics. Pillow is required for native triangle previews.

```sh
python catalogue.py
python test_catalogue.py
python dependencies.py
python render.py
python bundle.py
```

`dependencies.py` copies available dependencies and lists missing ones; it does not fetch arbitrary files automatically. `render.py` uses the included geometry compiler and preserves the original source scale. Preview subpixel triangles may be omitted during rasterization for speed; MPD exports retain all references and geometry. `bundle.py` builds the offline atlas from acquired source files, metadata and completed previews.

Original part/model author and licence headers are retained. See `ldraw/CAreadme.txt`. Where an old model contains no licence declaration, none is invented. All extracts are rooted copies of source definitions, not new authorship claims.


Extraction preserves local coordinates and inherited colour 16. Parent placement transforms and colours are not baked into an isolated definition; retain the original parent instance when positioning it in a film set. Preview rasterization does not support texture maps and simplifies transparency.
