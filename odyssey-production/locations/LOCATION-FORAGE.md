# Locations are production assets

## Built in this pass

Two authored native LDraw blockouts, 825 part instances in total, each with a minifigure, wide shot, actor camera, overhead anchors, MPD and reproducible JSON. They use existing canonical parts; they are **not imported MOCs or surveyed terrain**.

| Halfworld requirement | New native blocking | Still missing |
|---|---|---|
| Ithacan shore: surf, prayer position, harbor view, town path, launch route | Water/land boundary, prayer stone, central landing/launch lane, flanking rock terraces, grove edge, town-exit anchor | Actual hull, distant harbor silhouette, foam/wet beach, irregular pebble shore, walking and launch performance |
| Ogygia cavern and grove: threshold, hearth, loom, woods, four springs, shore route, raft clearing, vines/birds | Open-backed portal, loom-sized frame, grove edge, four spring plates, timber placeholders, shore-to-cave route | Enclosed cavern, hearth, functioning loom, vines/birds, felled logs and raft, lush varied canopy, two-character staging |

The grove is a fictional stage. Ithacan references inform coastal material choices, not an asserted geographical identification of Ogygia. Halfworld anchors remain source-space references; all 3D positions were authored explicitly in LDU.

## Real place → feature → shot

- **Skinos, Ithaca:** municipal page describes pine trees, pebbles and clear turquoise water. Its displayed beach photograph was inspected: a close pebble-to-shallow-water gradient with distant slopes. Use a narrow pale shore, graded sea color and a tree boundary. Current blockouts only establish the broad bands; detailed pine anatomy and pebble density remain to build. [Municipality of Ithaca](https://www.ithaca.gr/en/home/interests-activities/paralies-en/skinos-en/)
- **Dexa:** a candidate for the homecoming reference board. The tourism authority describes its traditional association with Phorcys; this is not archaeological proof of the story's location. [Greek National Tourism Organisation](https://www.visitgreece.gr/en/experiences/beaches/beloved-beaches/beaches-of-ithaca)
- **Afales / Platia Ammos:** candidate for the harsher cliff-and-shore palette. **Polis / Loizos Cave:** candidate for harbor-to-cave spatial research. These are researched leads, not yet photo-matched blockouts. [Same official coastal guide](https://www.visitgreece.gr/en/experiences/beaches/beloved-beaches/beaches-of-ithaca)

## Donor map: inspect assemblies before collecting isolated parts

| Donor | Evidence / access status | Useful recurring construction | Adaptation for Odyssey |
|---|---|---|---|
| LEGO 21318 Tree House | Official product and public instruction PDF located; model not imported | Removable canopy and roofs; concentrated tree/landscape parts | Grove tree modules, accessible camera side, roots adjoining architecture; remove elevated cabins |
| nobsta's Arcadian Hut, MOC-55068 | Rebrickable search listing confirms a 21318 alternate. Direct page fetch returned 402; files and licence unverified | Candidate for a combined rustic dwelling/tree/landscape solution | Compare with Eumaeus farm and Ogygia, extract only after accessible model/instructions are checked |
| LEGO 21343 Viking Village | Official product and announcement verified; no digital model acquired | Connected landscape sections, removable interiors, bridge and cave | Rock/wood foundation and camera-access construction; replace Norse architectural identifiers |
| MOC-45744 Greek Warship | User-supplied lead; secondary listing found, creator/file not verified | Potential long hull / rowing deck | Keep in queue until authoritative file and geometry can be inspected; not counted as coverage |
| Native Odyssey trailer | Local source present in world/scenes-trailer.js | Ridge/shore/cavern patches, galleys and stage-based camera placement | Reuse native staging language and inspect assemblies before rebuilding |

Sources: [Tree House](https://www.lego.com/en-us/product/tree-house-21318), [official Tree House instructions](https://www.lego.com/cdn/product-assets/product.bi.core.pdf/6294834.pdf), [Arcadian Hut](https://rebrickable.com/mocs/MOC-55068/nobsta/arcadian-hut/), [Viking Village](https://www.lego.com/en-us/product/viking-village-21343), [LEGO's design announcement](https://ideas.lego.com/blogs/a4ae09b6-0d4c-4307-9da8-3ee9f3d368d6/post/3ba52cbb-e0d5-4f0b-a43f-12147480ad06).

## Word to World integration boundary

Existing `world/geo.js` already provides Nominatim place search, AWS Terrarium height decoding, Overpass map features and Esri imagery. Its local geography frame is metres, +X east / +Z south. `world/ground.js` supports flat/gentle/real relief. `world/sets.js` and `scenes-trailer.js` already provide authored shore/ridge staging.

Use two layers for future location production:

1. **Geography shell:** resolve a named place; retain the returned coordinate, extent, provider attribution, source date and raw response/tile identifiers. Inspect shoreline, relief and photo references. Fail visibly on missing data; never label the baked fallback as Ithaca.
2. **Performing set:** map the chosen view into native LDraw units with an explicit scale transform, quantize buildable terrain, then place the actor routes, entrances and removable set walls. Preserve every deliberate departure from real geography.

This pass did not fetch elevation or OSM data and does not claim a working geospatial import. It establishes the location ledger and first native stage layer. Modern roads/buildings should be reference context, not automatically imported into an ancient setting.

## Repeatable loop

Select an uncovered location → inspect Halfworld source card → choose place/photo and donor assembly → declare what is literal versus adapted → build native geometry → place actor and routes → capture overhead/wide/actor shots → inspect occlusions and support → repair → retain evidence and coverage status.

Tests in `evidence/location-tests.json` use 63 sampled actor boxes per scene against obstacle boxes. They exclude surfaces, canopy and lintel; passing means the central upright-body corridor clears the tested obstacles, not that walking, headroom, supports or physical connections are certified. The first visual pass caught floating upper foliage; the repaired pass removes that layer and aligns foliage with the actual last trunk brick. Both use unscaled native parts.

`location-inventory.json` lists all 68 source locations. Only two are marked native-blockout in this pass; other entries remain unassessed here. This avoids mistaking a reference, donor lead or existing prop test for a finished location.
