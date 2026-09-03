# The bar

These are real LEGO sets, authored in LDraw, downloaded from the
[LDraw Official Model Repository](https://omr.ldraw.org/) as mirrored in the
[three.js](https://github.com/mrdoob/three.js) LDrawLoader example
(`examples/models/ldraw/officialLibrary/models/`).

They are here for one reason: a gauntlet loop is only worth running if the thing it
compares against is real. A description of a good LEGO build can be argued with. A
1,153-placement, 89-submodel UCS AT-ST cannot.

| file | set | what it is |
|---|---|---|
| `10174-imperial-atst-ucs.mpd` | 10174 | UCS Imperial AT-ST — 89 submodels, 1,153 placements |
| `7140-xwing-fighter.mpd` | 7140 | X-wing Fighter — 21 submodels, 346 placements |
| `5935-island-hopper.mpd` | 5935 | Island Hopper seaplane |
| `1621-lunar-mpv.mpd` | 1621 | Lunar MPV Vehicle |
| `889-radar-truck.mpd` | 889 | Radar Truck |
| `4489-atat-mini.mpd` | 4489 | Mini AT-AT |
| `4494-imperial-shuttle-mini.mpd` | 4494 | Mini Imperial Shuttle |
| `4838-mini-vehicles.mpd` | 4838 | Mini Vehicles |
| `4915-mini-construction.mpd` | 4915 | Mini Construction |
| `4918-mini-flyers.mpd` | 4918 | Mini Flyers |
| `6156-window-brick.mpd` | 6156 | Window Brick |
| `6965-tie-interceptor.mpd` | 6965 | TIE Interceptor |
| `6966-jedi-starfighter-mini.mpd` | 6966 | Mini Jedi Starfighter |
| `30023-lighthouse.mpd` | 30023 | Lighthouse |
| `30051-xwing-mini.mpd` | 30051 | Mini X-wing |
| `30054-atst-mini.mpd` | 30054 | Mini AT-ST |
| `car.mpd` | — | James Jessiman's demonstration car, the oldest LDraw model there is |

These are "Packed" MPDs: every part `.dat` the model references is inlined as a further
`0 FILE` block, so they render with no library lookup at all. A `0 FILE` block whose name
ends `.dat` is an inlined part definition, not a submodel of the kit.

## Licence

LDraw Parts Library and OMR models: **CC BY 2.0**. This software uses the LDraw Parts
Library. LEGO® is a trademark of the LEGO Group, which does not sponsor, authorise or
endorse this work.
