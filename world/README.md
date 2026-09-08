# The world, in one page

`word-to-world.html` is one page and one loop. Everything below lives in `world/*.js` and is wired in `world/main.js`.

## The loop and the modes

`simulate(dt)` runs every frame (and from the test hook `__world.step`). The player is in one **mode**:

| mode | who moves | camera | input |
|---|---|---|---|
| `walk` | the minifig rig (`minifig.js`) | over the shoulder (`Minifig.camera`) | left thumb walks, right looks; tap right swings or shoots; two fingers Force push |
| `fly` | the TIE (`tie.js`) | chase (`Tie.camera`) | drag carves, second finger boosts, tap fires, hold torpedoes |
| `ride` | a vehicle prop (`drive.js`) | chase (`Drive.camera`) | left thumb drives or flies, second finger boosts, tap fires, hold fires heavy |
| build (a flag on `walk`) | the rig | reticle aim | palette, tap places |

## The things, and who owns collisions

| thing | file | what it is | collisions |
|---|---|---|---|
| ground | `ground.js` | a heightfield from AWS terrain, draped in Esri imagery, cratered by blasts | `G.h(x, z)` is the floor for everyone |
| city | `bricks.js` | OpenStreetMap buildings as brick instances, roads as strips | `city.near / aabbs / pushRing`; `city.blast` knocks bricks |
| bricks | `build.js` | pieces the players placed or the builder made (one InstancedMesh per part) | `build.pushOut / floorAt / aabbs` |
| props | `props.js` | LDraw sub-models: figures, vehicles, whole rides | `props.pushOut / floorAt / aabbs`; a blast flings parts |
| rides | `drive.js` | a prop with a controller while someone is in it | `vehPushOut` in main.js pushes out of city, bricks and other props |
| crowd | `characters.js` | citizens and troopers; troopers shoot unless `peace` | `crowd.hitWithin / hitBy` |
| debris | `debris.js` | everything that falls | spheres from the loop |
| fx | `fx.js` | sounds, haptics, smoke, hit marks | |

`allBoxes(x, z, r)` in main.js is the union the TIE and the debris use; `pushOut(pos, r)` is the walker's; `WALK.groundH` stacks bricks and props on the ground.

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
- Rooms (`net.js`, PeerJS): `p` player state 12 Hz, `bolt`, `blast`, `crater`, `edit` (brick and prop rows, per id, merged), `crowd` mirror from the host, `place` from the host. A driven prop moves through `edit` rows; a rider's figure is seated on the guest's copy when `p.veh` names a prop that is there.

## Where to add X

| you want | touch |
|---|---|
| a new build op | `dsl.js` OPS + SPEC + a caption line; the part in `bricks.js HARVEST`, `flatten.py WORLD_EXTRA`, `python3 flatten.py` |
| a new vehicle kind | `dsl.js vehicleMPD` + `drive.js KINDS` |
| a new mode | `simulate` branch, `promptAction`, `hintFor`, `paint`, `myState`/`stepRemotes` |
| a new thing that blocks | its `pushOut / aabbs / floorAt`, then `allBoxes` and `pushOut` in main.js |
| a new HUD element | `word-to-world.html` markup + CSS, `paint()` |

## Tests

Playwright with a mocked Earth (scratchpad `mocks.js`): `run.js` one page, `run2.js` host + guest, `run3.js` the studio. Suites: builder (`c-mb.js`), drive, peace, build, destruction, worlds, loader, rooms. Node: `t-dsl.js`, `t-dec.js`. Start the static server from the repo root.
