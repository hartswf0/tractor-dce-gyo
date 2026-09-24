# The Odyssey as LDraw: the forage

Generated 2026-09-24 by `tools/odyssey-forage.js` from the atlas in odyssey-halfworld (`viewer/odyssey-manifest.json`). Browse it in [odyssey-forage.html](../odyssey-forage.html); load any card in [Hand Butter](../play/hand-butter-odyssey.html?scene=OD-B01-S01).

**582 cards** (430 assets, 152 scenes) · **111,882 pieces** · **5,245 sub-builds** · **413,451 stud joints** · 14 donor sets · 567 green, 15 yellow, 0 red.

## How a card is foraged

The trailer builds a city as a tree: the whole model, its builds, their sub-builds, down to parts, every joint counted. The forage does the same for the atlas.

1. **Forage.** Each card type has its way of being got (`tools/forage/table.js`). Locations and vehicles take a sub-build from a real set: a FILE block of a community LDraw model, flattened, minifigures stripped. Characters are minifigures assembled from real parts on the standard skeleton, dressed by role, with accessories held in a hand grip measured from the donors. Creatures, props and effects are readymade parts (horse, pig, goblet, bow, lightning bolt, transparent columns). The pieces a scene needs beside a set (colonnades, hearths, seats, trees, rocks, roads, water) are procedural kits laid by `world/dsl.js`.
2. **Assemble.** The components are settled (the lowest underside on the ground, the stud lattice in phase) and laid side by side on a plate. A scene card is its location's set, cut to a window, with its cast of asset cards on an apron in front: the scene's assets are its sub-builds.
3. **Verify.** `tools/forage/ldraw.js` resolves every part in `ldraw/`, finds every stud on every piece, and tests it against the undersides above it (a stud joint). It then traces each piece to the plate through joints, or through contact for clips, hands and hinges. Pieces that touch nothing are reported as detached. Rope and hose segments carry contact but are counted apart. A card is green when every part resolves, every donor is found and almost nothing is detached.
4. **Stage.** Locations the story returns to stand on hero sets (`tools/forage/sets.js`): the megaron at Ithaca, Olympus, the Cyclops's cave, Circe's hall, Eumaeus's farm, the hall of Alcinous, Calypso's grove. Each is a room of furniture, foraged or stud-built, with named marks (the threshold, the hearth, the throne, the loom). Any other place becomes a stage: its set at the back, a floor in front, marks laid on the floor. A scene with no place named stands where the book last stood (or, before that, where the book first stands); places the atlas names but has not built stand on the set they belong to (the aftermath hall is the megaron).
5. **Block.** `tools/forage/stage.js` stands the cast on the marks: a card named like a mark goes to it (Zeus to his throne), the rest in turn; a crowd is split into its figures; each takes the free spot nearest its mark, never inside furniture (an occupancy grid of the set).
6. **Previs.** The beats become shots (`odyssey/previs/<id>.json`): who each beat is about (the cast its words name; a beat opening on a pronoun keeps the last subject), who walks where (a verb of going sends the subject toward the other one named or to a named mark), and the camera: an establishing crane, a two-shot or an over-the-shoulder for talk, a push-in for violence, an orbit for the gods, a track for a walk, a pull-back to end. The viewer plays it: figures walk with their legs swinging, speakers gesture, the camera finds a line of sight past the furniture.
7. **Look.** `tools/forage/look.js` (`--t 2,7,11` for previs frames) renders cards through the viewer; the thumbnails in `odyssey/thumbs/` are those frames.
8. **Play.** `tools/butter-odyssey.js` writes Hand Butter with a scene per card; each scene file (`odyssey/butter/<id>.json`) is fetched when loaded, and a foraged build stands pinned until a piece is picked up.

## By type

| type | cards | pieces | sub-builds | stud joints | yellow |
|---|---|---|---|---|---|
| character | 87 | 1,379 | 178 | 247 | 0 |
| creature | 27 | 386 | 132 | 829 | 1 |
| location | 68 | 21,883 | 564 | 79,560 | 9 |
| prop | 73 | 662 | 248 | 840 | 0 |
| ensemble | 67 | 4,717 | 502 | 1,025 | 0 |
| divine fx | 59 | 2,180 | 264 | 1,914 | 0 |
| set piece | 18 | 576 | 79 | 916 | 1 |
| environment | 12 | 540 | 52 | 1,154 | 0 |
| vehicle | 11 | 3,512 | 43 | 6,125 | 0 |
| sound source | 6 | 215 | 31 | 68 | 0 |
| wearable | 2 | 42 | 12 | 12 | 0 |
| scene | 152 | 75,790 | 3,140 | 320,761 | 4 |

## Donors

Community LDraw models, redistributed under CCAL 2.0; each foraged FILE keeps its author in its header.

| model | author | cards |
|---|---|---|
| 6285 - Black Seas Barracuda.mpd | Philippe Hurbain [Philo] | 78 |
| 6279-1 - Skull Island.mpd | Stan Isachenko [angmarec] | 14 |
| 6080 - Kings Castle.mpd | Stefan Frenz [smf] | 6 |
| ithaca-cove.mpd |  | 5 |
| forest-clearing.mpd | word to world, tools/model.js | 5 |
| cave-of-shadows.mpd | word to world, tools/model.js | 4 |
| 7410-1 - Jungle River.mpd | Philippe Hurbain [Philo] | 4 |
| 6716-1 - Covered Wagon.mpd | Willy Tschager [Holly-Wood] | 3 |
| 6264 - Forbidden Cove.mpd | MLCad | 2 |
| 6278 6292 - Enchanted Island.mpd | MLCad | 2 |
| 6245 - Harbor Sentry.mpd | Stefan Frenz [smf] | 2 |
| 6071 - Forestmens Crossing.mpd | Takeshi Takahashi [RainbowDolphin] | 1 |
| ogygia-grove.mpd |  | 1 |
| 6066 - Camouflaged Outpost.mpd | Takeshi Takahashi [RainbowDolphin] | 1 |

## Not green, and why

- **creature.scylla** SCYLLA: 3 pieces touch nothing (a donor's loose detail or ropes' ends)
- **location.aeolia-floating-island** AEOLIA FLOATING ISLAND: 1 parts the library lacks were left out (6029b)
- **location.goat-island-harbor** GOAT ISLAND HARBOR: 1 parts the library lacks were left out (6029b)
- **location.laertess-orchard** LAERTES'S ORCHARD: 4 pieces touch nothing (a donor's loose detail or ropes' ends)
- **location.lotus-shore-and-meadow** LOTUS SHORE AND MEADOW: 1 parts the library lacks were left out (6029b)
- **location.phaeacian-orchard-and-garden** PHAEACIAN ORCHARD AND GARDEN: 4 pieces touch nothing (a donor's loose detail or ropes' ends)
- **location.river-washing-pools** RIVER WASHING POOLS: 52 pieces touch nothing (a donor's loose detail or ropes' ends)
- **location.road-to-laertess-farm** ROAD TO LAERTES'S FARM: 3 pieces touch nothing (a donor's loose detail or ropes' ends)
- **location.scherian-coast-and-river-mouth** SCHERIAN COAST AND RIVER MOUTH: 54 pieces touch nothing (a donor's loose detail or ropes' ends)
- **location.thrinacia** THRINACIA: 1 parts the library lacks were left out (6029b)
- **set-piece.orchard-inventory** ORCHARD INVENTORY: 3 pieces touch nothing (a donor's loose detail or ropes' ends)
- **OD-B06-S02** LAUNDRY AND BALL AT THE RIVER: 22 pieces touch nothing (a donor's loose detail or ropes' ends)
- **OD-B06-S03** THE NAKED STRANGER EMERGES: 22 pieces touch nothing (a donor's loose detail or ropes' ends)
- **OD-B09-S09** THE BLINDING: 70 pieces touch nothing (a donor's loose detail or ropes' ends)
- **OD-B24-S04** THE SCAR AND THE ORCHARD TREES: 7 pieces touch nothing (a donor's loose detail or ropes' ends)

## Rebuilding

```
git clone https://github.com/hartswf0/odyssey-halfworld ../odyssey-halfworld
cd films/forage && node fetch-odyssey-ldraw.mjs && cd ../..   # the donor corpus (not kept in the repository)
node tools/odyssey-forage.js --halfworld ../odyssey-halfworld
node tools/butter-odyssey.js WAG-HAND-BUTTER-26.HTML
NODE_PATH=<playwright@1.56, three@0.128> node tools/forage/look.js --all --jpeg --out <dir>   # then convert to webp in odyssey/thumbs
```

## What comes next

- **Sub-build kits by function.** The trailer shows 113 builds grouped into repeatable kits: tower, tree, arcade, canopy, lamp. The next forage should cut donors into connected chunks (a mast, a gate, a stair, a palm) and index them by what they do, so one Ithacan hall can be assembled from a castle gate, a Lincoln Memorial colonnade and a blacksmith's hearth rather than taken whole.
- **More donors.** The 14 models the fetcher could not reach (Eldorado Fortress, Imperial Trading Post, Viking Village, Trevi Fountain and others) would each replace a stand-in; the part 6029b (the islands' palm base) is missing from the library.
- **More hero sets.** Seven places have rooms; the ship at sea, the underworld pit, the Phaeacian games, the Sirens' rock and Laertes's farm are next, each with its marks.
- **Blocking from the halfworld.** Books XVI to XXIV already have blocking in plan space (`scenes/_plans`, the MOVES tables `tools/odyssey.js` reads); where a plan exists its stations should become the set's marks and its moves the previs moves.
- **Shots from the direction table.** The halfworld's direction table gives each beat a direction and a reason; the shot grammar here guesses from verbs, and should take the direction where it exists.
- **Export.** The previs plays in the browser; `tools/export-film.js` records the case films, and the same recorder could render a previs to video with its lines.
- **The joint graph.** The audit knows every joint; drawing it over the model, as the trailer does in blue and orange, would show where a set is weak before it is shot.
