# ODYSSEY REAL LDRAW FORAGE v0.1

This is a **geometry-first donor manifest**. Every entry points to an actual `.mpd` or `.dat` source. `GREEN` means real downloadable geometry with no blocking caveat found in this pass. `YELLOW` means the geometry is real, but its model/part has a known OMR, unofficial-part, missing-flex/sail, or `Needs Work` caveat.

**Corpus:** 45 entries = 38 MPDs + 7 DAT readymades. 44 are directly fetchable by the included downloader.

## Highest-value donors to ingest first

- **6285 Black Seas Barracuda** `6285 - Black Seas Barracuda.mpd` — K13_SHIP, K08_PORT, K04_TIMBER. Targets: BLACK ITHACAN SHIP, PYLOS HARBOR, SCHERIA CITY AND HARBOR, WOODEN HORSE INTERIOR. **GREEN**.
- **6286 Skull's Eye Schooner** `6286 - Skulls Eye Schooner.mpd` — K13_SHIP, K08_PORT, K04_TIMBER. Targets: BLACK ITHACAN SHIP, SCHERIA CITY AND HARBOR, PYLOS HARBOR. **GREEN**.
- **6273 Rock Island Refuge** `6273 - Rock Island Refuge.mpd` — K02_ROCK, K14_CAVE, K08_PORT. Targets: POLYPHEMUS'S CAVE, OGYGIA CAVERN AND GROVE, TELEPYLUS HARBOR, NARROW MONSTER STRAIT. **GREEN**.
- **6276 Eldorado Fortress** `6276 - Eldorado Fortress.mpd` — K12_FORTIFICATION, K08_PORT, K05_STONE_ARCH. Targets: AEOLIA FLOATING ISLAND, SCHERIA CITY AND HARBOR, TELEPYLUS HARBOR, ITHACAN ASSEMBLY GROUND. **GREEN**.
- **6278 Enchanted Island** `6278 6292 - Enchanted Island.mpd` — K02_ROCK, K07_VEGETATION, K03_WATER. Targets: OGYGIA CAVERN AND GROVE, AEOLIA FLOATING ISLAND, GOAT ISLAND HARBOR. **GREEN**.
- **6279 Skull Island** `6279-1 - Skull Island.mpd` — K02_ROCK, K08_PORT, K12_FORTIFICATION, K07_VEGETATION. Targets: AEOLIA FLOATING ISLAND, OGYGIA CAVERN AND GROVE, TELEPYLUS HARBOR. **GREEN**.
- **21343 Viking Village** `21343_-_viking_village.mpd` — K02_ROCK, K04_TIMBER, K09_INTERIOR, K12_FORTIFICATION. Targets: EUMAEUS HUT INTERIOR, CIRCE'S FOREST PALACE, ODYSSEUS'S PALACE THRESHOLD AND HALL, OGYGIA CAVERN AND GROVE. **GREEN**.
- **21318 Tree House** `21318 - Tree House.mpd` — K07_VEGETATION, K04_TIMBER, K01_GROUND. Targets: OGYGIA CAVERN AND GROVE, OGYGIA TIMBER GROVE, LAERTES'S ORCHARD, PHAEACIAN ORCHARD AND GARDEN. **GREEN**.
- **21325 Medieval Blacksmith** `21325 - Medieval Blacksmith.mpd` — K09_INTERIOR, K04_TIMBER, K05_STONE_ARCH, K17_LIFE. Targets: EUMAEUS HUT INTERIOR, CIRCE'S FOREST PALACE, MENELAUS'S PALACE, MARRIAGE CHAMBER. **GREEN**.
- **6080 King's Castle** `6080 - Kings Castle.mpd` — K12_FORTIFICATION, K05_STONE_ARCH, K06_COLUMN. Targets: ODYSSEUS'S PALACE THRESHOLD AND HALL, FIGHT THRESHOLD, TROY INTERIOR MEMORY SET, NESTOR'S PALACE AND COURTYARD. **GREEN**.
- **6071 Forestmen's Crossing** `6071 - Forestmens Crossing.mpd` — K07_VEGETATION, K04_TIMBER, K15_ROAD, K03_WATER. Targets: FOREST MEETING PATH, AEAEA COAST AND FOREST, ROAD FROM RIVER TO SCHERIA. **GREEN**.
- **6066 Camouflaged Outpost** `6066 - Camouflaged Outpost.mpd` — K07_VEGETATION, K12_FORTIFICATION, K04_TIMBER. Targets: AEAEA COAST AND FOREST, FOREST MEETING PATH, SECRET ITHACAN LANDING. **GREEN**.
- **21020 Trevi Fountain** `21020 - Trevi Fountain.mpd` — K05_STONE_ARCH, K06_COLUMN, K03_WATER. Targets: AEOLIA FLOATING ISLAND, ALCINOUS'S PALACE, OLYMPIAN COUNCIL HALL, NESTOR'S PALACE AND COURTYARD. **GREEN**.
- **7410 Jungle River** `7410-1 - Jungle River.mpd` — K03_WATER, K07_VEGETATION, K13_SHIP. Targets: RIVER WASHING POOLS, SCHERIAN COAST AND RIVER MOUTH, OGYGIA CAVERN AND GROVE. **GREEN**.
- **7637 Farm** `7637 - Farm.mpd` — K10_FARM, K17_LIFE, K04_TIMBER. Targets: EUMAEUS'S PIG FARM, THRINACIA, POLYPHEMUS'S CAVE, PIG HERD. **GREEN**.
- **6716 Covered Wagon** `6716-1 - Covered Wagon.mpd` — K15_ROAD, K04_TIMBER. Targets: PYLOS-TO-SPARTA ROAD, ROAD TO LAERTES'S FARM. **GREEN**.
- **6799 Showdown Canyon Carriage** `6799-1 - Showdown Canyon - Carriage.mpd` — K15_ROAD, K04_TIMBER. Targets: PYLOS-TO-SPARTA ROAD, MATCHED HORSE TEAM. **GREEN**.

## Verified readymades

- **27256.dat — Minifig Lightning Bolt with Rim** → ZEUS'S THUNDERBOLT. **GREEN**.
- **3847.dat — Minifig Sword Shortsword** → BRONZE SWORD WITH IVORY HILT. **GREEN**.
- **10169.dat — Minifig Sack with Hand Grab** → BAG OF WINDS. **GREEN**.
- **10509.dat — Animal Horse Poseable** → MATCHED HORSE TEAM. **GREEN**.
- **87621.dat — Animal Pig** → PIG HERD, PARNASSUS BOAR. **GREEN**.
- **64452.dat — Animal Cow** → SACRED CATTLE, HELIOS'S CATTLE AND SHEEP. **GREEN**.
- **4429.dat — Figure Flask with Handle** → WATER PITCHER. **YELLOW**.

## What to extract from each MPD

Parse every `0 FILE` block first. Treat each embedded file/submodel as a candidate donor chunk. Preserve `{source_set, source_filename, subfile, lines, transforms, part_refs}`. Then compute bounds and connection candidates. Only after that create connected-component chunks that cross subfile boundaries.

Suggested taxonomy: `WORLD → SCENE TYPE → KIT FAMILY → BEHAVIOR/TOPOLOGY → SOURCE SET → SUBMODEL → DAT PARTS`.

## Caveats worth keeping visible

- **7326 Rise of the Sphinx**: Unofficial_Model header verified. Real LDraw geometry, but header marks it Unofficial_Model.
- **6270 Forbidden Island**: not OMR compliant at posting; unofficial part not inlined; missing items none. Real MPD; requires normalization.
- **6271 Imperial Flagship**: not OMR compliant at posting; sail placeholders / missing sail geometry. Ship geometry useful; sail caveats.
- **6277 Imperial Trading Post**: not OMR compliant at posting; sails/print/flexible ropes missing. Excellent port/market/dock geometry despite missing flexible/sail details.
- **4429 Figure Flask with Handle**: official LDraw part; description marks Needs Work. Real part, but LDraw header says Needs Work.

## Acquisition

Run `node fetch-odyssey-ldraw.mjs` in the same folder as the JSON manifest. It downloads all entries with a direct URL into `odyssey-ldraw-corpus/models/` and `odyssey-ldraw-corpus/parts/`. For GitHub-backed sources it verifies the Git blob SHA, not merely the HTTP status. The Farm MPD is left as a manual LDraw-forum acquisition because the direct attachment URL was not reliably exposed in this retrieval pass.
