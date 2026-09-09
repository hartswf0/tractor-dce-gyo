# The world, in one page

`word-to-world.html` is one page and one loop. Everything below lives in `world/*.js` and is wired in `world/main.js`.

## The loop and the modes

`tick()` measures the frame and runs `simulate(dt)` in fixed substeps (up to four of 1/60 s; a slower frame slows the world rather than jumping it), also from the test hook `__world.step`. `W.stats` carries `ms`, `fps`, `steps`; when the frame rate stays low the **quality** tier drops (pixel ratio, city radius, crowd cap) and comes back when it recovers; `?quality=auto|high|low` and the menu row pin it (`world.quality`). The player is in one **mode**:

| mode | who moves | camera | input |
|---|---|---|---|
| `walk` | the minifig rig (`minifig.js`) | over the shoulder (`Minifig.camera`) | left thumb walks, right looks; tap right swings or shoots; two fingers Force push |
| `fly` | the TIE (`tie.js`) | chase (`Tie.camera`) | drag carves, second finger boosts, tap fires, hold torpedoes |
| `ride` | a vehicle prop (`drive.js`) | chase (`Drive.camera`) | left thumb drives or flies, second finger boosts, tap fires, hold fires heavy |
| build (a flag on `walk`) | the rig | reticle aim | palette, tap places |

## The things, and who owns collisions

| thing | file | what it is | collisions |
|---|---|---|---|
| ground | `ground.js` | a heightfield from AWS terrain, draped in Esri imagery, cratered by blasts; `streets()` also registers what it lays (`G.layers`: road strips by class, sidewalks, paths, lots, plazas, lawns) | `G.h(x, z)` plus `Ground.layerAt(G, x, z)` is the floor for everyone: feet and wheels stand on the road top, the sidewalk, the lot, not in the paint |
| city | `bricks.js` | OpenStreetMap buildings as brick instances, built the way the world's preset says (`palette.style`: height, window pitch, slits, stilts, bands, stepped roofs) and the way the map's tags say (`KIND_STYLE`, `ROOF_SHAPE`: gabled and hipped slope roofs, a church's tower and spire, a stadium's tiered bowl and masts, sheds, warehouses, curtain walls); the plinth is capped at twelve courses, a door sits where the outside ground is highest and gets steps down to it (`b.stairs`, `City.floorAt`); windows are `pane-1x2x2` or `pane-lit` | on foot a building is its walls: `city.gapAt` (a hole three courses tall, or an open door) lets you in, `pushWalls` in main.js; ships and rides use `aabbs / pushRing`; `city.blast` knocks bricks; `city.doors` swings doors for whoever comes |
| streets | `ground.js` | roads for wheels (`roads`) and `streets`: roads lifted by class (motorway highest, service lowest, so junctions read), markings by class (centre dashes, edge and lane lines on the wide ones), sidewalks with curbs, footways, cycleways, parking lots with bays (kept off the driven roads), plazas, zebra crossings where a footway meets a road, bridges as decks on piers with ramps (`G.decks`, `Ground.deckAt`), rivers, and the ground cover from the map: water, parks, woods, pitches, cemeteries, a stadium's pitch; OSM areas come as `win.areas` | the decks are a floor (`WALK.groundH`); the rest is paint |
| lamps | `lamps.js` | street lamps along the roads, spaced and coloured by the world's `lights` preset (`worlds.js`: `lamp`, `pool`, `window`, `every`, `moon`, `suns`, `fireflies`); `setNight` from the sky | none |
| flora | `flora.js` | trees (a round trunk and a brick crown, instanced) at the map's tree nodes, through its woods and along residential streets; towers and masts as columns with a red lamp | `flora.pushOut`; a ride fells a tree into debris |
| traffic | `traffic.js` | cars, vans and buses from the DSL's `vehicle` op, one instanced mesh per model and colour: parked in the lot bays and at the kerbs, thirty driving the right-hand lane, turning at junctions, keeping their distance, stopping short of a walker or a ride in the lane, every one pitched and rolled to the ground under its four wheels; headlights at night; in a room the host streams the moving cars and guests follow them | `traffic.pushOut`; a ride's ram flings a whole car into the debris (`traffic.hit`); walk up to any car and Get in: `traffic.take` turns it into a prop you drive |
| vehicles | `vehicles.js` | the character's own ride (`DEFS[...].ride`, laid as `lm-me` and relaid when you change who you are; Vader has the TIE) and each planet's own vehicles laid by the spawn from the preset's `vehicles` list (Hoth an AT-AT, an AT-ST and a snowspeeder; Endor an AT-ST and speeder bikes; Tatooine speeders; the Death Star a craft and a speeder), as props with fixed ids that are never saved | as props; a walker is boarded like a car |
| map | `map.js` | the round minimap (north-up, 220 m), the full map (`#bigmap`: pan, pinch, names along the roads and at the big buildings, a tap sets a waypoint, a long press goes there), the nearest road's name in `#stat`, a building's name when you enter it, the compass in the top bar | none |
| bricks | `build.js` | pieces the players placed or the builder made (one InstancedMesh per part) | `build.pushOut / floorAt / aabbs` |
| props | `props.js` | LDraw sub-models: figures, vehicles, whole rides | `props.pushOut / floorAt / aabbs`; a blast flings parts |
| rides | `drive.js` | a prop with a controller while someone is in it; ground kinds settle on the ground under their four corners (`Drive.settle`: height, pitch, roll); walker kinds (`atat`, `atst`) swing their leg sub-models with their speed (`Drive.gait`), bob, stomp, and fire from the head | `vehPushOut` in main.js pushes out of city, bricks and other props |
| crowd | `characters.js` | citizens (half of them women, with their own hair) and troopers; troopers shoot unless `peace` | `crowd.hitWithin / hitBy` |
| people | `minifig.js` | the roster in `DEFS`: Vader, a stormtrooper, a rebel pilot, Luke, Leia, Han, Chewbacca, Yoda, C-3PO, Rey, a citizen; a `bare` def wears a whole-head mask seated at the neck, a `short` def stands on one-piece legs (16 LDU shorter); every part is in the world pack (`WORLD_EXTRA` in `slipcase-build/arena/assembly/flatten.py`, sculpted parts slimmed) | the rig's `radius`, `height` and `feet` |
| debris | `debris.js` | everything that falls; wall bricks lie as rubble for ten minutes and are a floor for the walker (`WALK.groundH`), a knee-high step is climbable | spheres from the loop |
| fx | `fx.js` | sounds, haptics, smoke, hit marks | |
| lease | `lease.js` | one live instance per browser: booting claims the graphics over a BroadcastChannel, other tabs drop their WebGL context and wait behind a Resume veil, a tab hidden 90 s lets go on its own; `?lease=share` for a room guest in the same browser | |
| sky | `sky.js` | a dome and sun on the camera, stars, cloud sprites, rain points; `worlds.js` gives the day colours, the clock at the place (or a pinned mode) turns them toward night, the weather greys and fogs them | |

`allBoxes(x, z, r)` in main.js is the union the TIE and the debris use; `pushOut(pos, r)` is the walker's; `WALK.groundH` stacks bricks and props on the ground (and its layers). The walker's camera (`Minifig.camera`) marches from the head toward where it wants to be and stops short of a hillside or a wall (`WALK.solid`), so it closes in rather than climbing over the head.

## The sky

Night is published as `S.night` and fanned out by `nightFall` in main.js: the city's lit panes (`paneMat` emissive), the lamps, a ride's headlights, the TIE's engine glow and the page's vignette (`--vig`). The Death Star is `litAlways`.

The stars sit on the dome with depth testing on, so the ship and the buildings occlude them. Each world's `lights` preset colours its lamps and windows: Hoth cold and sparse under a bright moon, Tatooine amber with two suns by day, Endor torches on the footways with fireflies at night, the Death Star white. `Ground.daylight` makes the two lights and the fog once; `Worlds.apply` paints a preset's day colours and palette; `W.sky.set` (in `setWorld`, `setSky`, `setWeather`) then blends them by the sun's height and the weather and moves the sun light. `auto` reads the device clock at the place's latitude and longitude; `day / dawn / dusk / night` pin the sun. Weather is `clear / cloudy / fog / rain / storm` (a storm has lightning). Both persist (`world.sky`, `world.weather`) and take `?sky=` / `?weather=`. The page's chrome follows the horizon colour (`--sky`, `--skyA`, `body.dark`). Minifig accessories: a hand's grip is 9.9 LDU ahead of its origin at 14.5° (3820.dat); `Minifig.toolMount` puts a tool there, bars turned to rise from the fist, and the aim pose levels the blaster.

## Words to bricks

```
words ──ai.js──▶ program {name, ops} ──dsl.compile──▶ pieces (cells → tiler → support) + props
       stream  ▲                        │                       │
       op by op│                        ▼                       ▼
        partialProgram          dsl.toRows (LDU)        Props.place (MPD)
                                        │
                                        ▼
                             Build.addRows → InstancedMesh
```

- `ai.js`: the brain. One text per turn to the Responses API, streamed. `ask` = design → local check → review (skipped when the design was slow or needed a lower effort); `edit` and `repair` are one call. `requestSafely` retries at lower reasoning when the model runs out of output room. `onStatus` and `onDelta` feed the page.
- `dsl.js`: the build language (`SPEC`), the compiler, `decompile` (bricks → program), `caption` (program → words), `partialProgram` (a half-written answer → its finished ops). Every piece carries the op that made it.
- `main.js` builder section: `mbDraft` (words → draft), `mbEdit` (words about a draft), `readBuild` (what stands → program), `mbCommit` (draft → bricks, or one rideable prop when `drive`/`fly` is chosen), the code panel (`paintOps`, `litOp`), the log (`mbLog`), the library (`saveBuild`).

## Memory and rooms

- Per place (lat/lon rounded to 3 decimals): `world.build.<key>` (brick rows), `world.props.<key>` (prop rows with their source op), `world.damage.<key>` (knocked city bricks). The library of builds: `world.saves`.
- Rooms (`net.js`, PeerJS): `p` player state 12 Hz with the spot on the globe (`ll`) and the height above the sender's own ground (`g`), so the other phone stands the figure on its own terrain (`geoRef` / `geoPoint` in main.js); `say` (a bubble over the speaker, the `#chat` line, `?me=` names the player); `bolt`, `blast`, `crater`, `edit` (brick and prop rows, per id, merged), `crowd` mirror and `cars` (the moving traffic, 4 Hz) from the host, `place` from the host. A driven prop moves through `edit` rows; a rider's figure is seated on the guest's copy when `p.veh` names a prop that is there. The map draws the other players; the room panel lists them with distance and bearing.

## Where to add X

| you want | touch |
|---|---|
| a new build op | `dsl.js` OPS + SPEC + a caption line; the part in `bricks.js HARVEST`, `flatten.py WORLD_EXTRA`, `python3 flatten.py` |
| a new vehicle kind | `dsl.js vehicleMPD` (or `walkerMPD` for something with legs) + `drive.js KINDS` |
| a planet's vehicle | `worlds.js` preset `vehicles: [{ kind, dx, dz, len, col }]` |
| a new character | `minifig.js DEFS` (+ the part in `WORLD_EXTRA`, then `write_world` and `packslim`) and `CROWD_PARTS`; a crowd hair also in `characters.js SLOT_PARTS` |
| a new mode | `simulate` branch, `promptAction`, `hintFor`, `paint`, `myState`/`stepRemotes` |
| a new thing that blocks | its `pushOut / aabbs / floorAt`, then `allBoxes` and `pushOut` in main.js |
| a new HUD element | `word-to-world.html` markup + CSS, `paint()` |
| a new building kind or roof from the map | `geo.js` (keep the tag), `bricks.js` `KIND_STYLE` / `ROOF_SHAPE` and its branch in `buildBricks` |
| a new kind of ground cover | `geo.js` query + `areas`, `ground.js` `COVER` |

## Tests

Playwright with a mocked Earth (scratchpad `mocks.js`): `run.js` one page, `run2.js` host + guest, `run3.js` the studio. Suites: builder (`c-mb.js`), drive, peace, build, destruction, worlds, loader, rooms (`run2.js`: also the same ground, say, the room list, the host's cars), night, streets, map, real (the map's structures), smooth (substeps, quality, the TIE's turn), traffic, inside, lease, people, wheels (a car on the hill), board (getting into a traffic car), walkers (`?world=hoth`), floor (feet on the layers, the camera at a hill and a wall, a ride of your own). Node: `t-dsl.js`, `t-dec.js`. Start the static server from the repo root; the suites pin `?quality=high` because a headless sandbox runs slowly.
