# Odyssey mode inside Word to World

This supersedes the two plate-based location blockouts as the environment direction. It is a working scouting prototype, not a finished ancient-world renderer.

## Run

From the production kit directory run `python3 odyssey-pipeline/serve.py`, then open:

`http://127.0.0.1:8917/native/word-to-world.html?world=odyssey&ground=real&as=odysseus-sword&place=Vathy%20Ithaca%20Greece&sky=day&weather=clear&mute=1`

Use **WHO · WHERE → Odyssey**, **GO ANYWHERE**, the existing sky/weather controls, **Blocking plane**, **Hide buildings**, **Stage donor test**, and **Capture scout**. Capture writes the native frame and a provenance receipt to `evidence/odyssey-scout.*`. Internet is required for geocoding, terrain, maps and some runtime CDN dependencies.

## What changed

- Added Odyssey to the existing world presets. Real place search, heightfield, map coordinates, sky and weather remain native.
- Asphalt becomes earth-colored road surfaces. Lane stripes, parking bays, curbs and zebra crossings are omitted; foot support remains registered. Map path layouts and widths are still modern references.
- Motor traffic is cleared. Up to twelve unscaled LDraw horses are placed along mapped routes. Mapped herd placements remain static. The separate Place horse / rehearsal controls support boarding, steering and braking; molded legs remain rigid. See PLAYABLE-REHEARSALS.md.
- Crowd spawns use the sailor definition without a weapon; existing walkers remain active.
- Streetlight meshes and the parked TIE are hidden in Odyssey mode. Native candle flames over native 4740 dishes supply low lamp forms, with up to eight actual warm light sources driven by the sky's night value.
- Up to 100 nearby map-derived tree positions receive two extracted Viking Village pine-tree assemblies. Generic native flora/towers are hidden in this mode. Species selection, density, slope support and collision shapes still need production work.
- A neutral stone/earth/timber building palette reduces height and disables windows and modern building-type styles. **It does not reconstruct Bronze Age architecture.** Hide buildings for landscape blocking; modern footprints remain in the data.
- Failed map fetches in Odyssey mode no longer populate an invented village. The scouting panel identifies terrain, map and imagery availability separately.
- A simple removable ground grid provides a blocking plane. It is horizontal at the actor's position, not a terrain-flattening operation.

## Actual donor ingestion

Downloaded Philippe Hurbain's full **21343 Viking Village MPD**; indexed 98 subfiles. Extracted ten assemblies: `pinetree`, `pinetree2`, `GreatHallPillar`, `throne`, `forgewall`, `GreatHallDoor1`, `GreatHallDoor2`, `GreatHallBackWall`, `barrels` and `bridgeplank` with embedded dependencies. The live mode uses the trees; the donor-test button stages trees, a horse and the pillar beside the actor. These are explicit comparison props, not claims about the real site's vegetation or architecture.

Source: https://brickshelf.com/gallery/Philo/SetModels/Set21343/21343_-_viking_village.mpd

Author: Philippe Hurbain [Philo]. Source headers declare CC BY 2.0 and CC BY 4.0. See https://creativecommons.org/licenses/by/4.0/ and https://creativecommons.org/licenses/by/2.0/ . Original downloaded file and author headers are preserved. Extracted files normalize embedded names and add `Unofficial_Model` headers to `.ldr` submodels for this loader. Geometry coordinates are unchanged. At runtime the two trees replace explicit white and inherited snow colors with green; original source files remain unchanged. Parts retain their own LDraw headers. `donor-index.json` contains the original file hash and named hierarchy. `dependencies.json` records 346 resolved canonical dependencies and zero missing.

## Validation and limits

Live UI resolved **Voidokilia beach, Petrochori** and **Vathy, Ithaca Municipality**. Voidokilia returned live terrain and 39 roads; Vathy returned live terrain, 842 building footprints and 118 roads. Vathy's first completed receipt reports 100 donor trees, 12 horse placements and eight light sources. Aerial imagery was unavailable in the first run and loaded successfully in the next live inspection. These counts establish successful ingestion and placement, not visual approval.

Road regression: a sample road emits 120 vertices in Odyssey mode versus 540 in Earth mode, with the lane-marking geometry removed; no parking/sidewalk overlay remains, and road support remains 10 LDU above the test datum. JS syntax checks pass. Browser inspection caught and repaired embedded filename and model-header errors. A trial sea-level plane flooded low land and was removed; no bathymetry or coastline reconstruction is claimed.

Remaining: convincing irregular dirt surfaces; geology and shore masks; correct botanical families; horse gait/riding and collision integration; animal populations; authored ancient architecture and donor segmentation beyond the first tree/pillar samples; cinema cameras and staged performance on the geography. Do not present the current mode as a film-ready environment.

## Scouting discipline

The user's screenshot resolved **Hisarlık Mahallesi, Tire**. Do not silently accept a same-name result as the intended Troy site. Keep the resolved place name/coordinates with each capture, inspect the map and landmark, and reject ambiguous geocoding.

The supplied film-location list is a set of scouting leads. [Vogue's location report](https://www.vogue.com/article/where-was-the-odyssey-filmed) mentions Voidokilia/Nestor's Cave, Favignana, Morocco, Iceland and Scotland. Scene-to-location assignments and mythological identifications require separate confirmation. A film stand-in, a traditional mythic association and a surveyed site must have different labels.

Next high-value scouts: Voidokilia for cove/cave relationships; Ithaca for homecoming terrain; Favignana for elevated coastal staging; Aït Benhaddou for earthen massing; Hjörleifshöfði for exposed dark terrain. Each must be evaluated at camera height before importing more scenery.
