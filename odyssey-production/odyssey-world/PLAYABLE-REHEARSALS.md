# Odyssey: playable rehearsals

Open `/native/word-to-world.html?world=odyssey&ground=real&as=odysseus-sword&place=Vathy%20Ithaca%20Greece&sky=day&weather=clear&mute=1` through the supplied local server. The **Odyssey · Playable Rehearsal** panel is at upper left.

## Controls

- **Cyclops cave / Troy gate:** construct a raised, walkable native-brick rehearsal stage at the current scout. These are maquettes, not archaeological reconstructions or finished environments.
- **Place horse:** adds a rideable LDraw 4493c01 horse beside the character. Approach and press **E**. **WASD** rides; **Shift** increases pace; **E** dismounts. Legs remain rigid.
- **Walk to dock:** moves the actor to a marked rehearsal position. Press **E** to board the rowing-boat prototype. Movement stays inside its explicit water rectangle; disembark near the dock. Open-world coastline water masks are not yet implemented.
- **Sword / Bow:** select Odysseus's weapon while on foot. **Space / Attack** swings or shoots. Sword hits require proximity and facing; arrows have gravity, a cooldown and swept collision against targets, people and geometry. Bow shots also work while mounted. Mounted sword attacks are not implemented.
- **Sword mark / Bow mark:** jump to reproducible actor marks for checking each target.
- **Rehearse ride (reset):** when mounted, runs forward, turns, brakes and records the result, then restores the starting position. Ordinary riding still uses WASD.
- **Capture rehearsal:** saves the renderer frame and interaction receipt in `evidence/odyssey-play-cave.*` or `odyssey-play-troy.*`.

## Implemented changes

Fixed sword input incorrectly spawning laser bolts. Added a separate horse controller profile and boarding verbs; horses and boats have no headlights, engine audio or vehicle lasers in Odyssey mode. Disabled invisible TIE boarding in that mode. Boats in rehearsal have a fixed water level, a hull-radius boundary margin and dock-only disembarking. Repeated stage parts use native-geometry instancing to reduce draw calls; their boxes explicitly account for every instance.

The bow is LDraw **93231** (includes a molded arrow), and the flying projectile is **18041**, a harpoon-shaped placeholder. They prove control, trajectory and collision; they do not settle the final hero bow/arrow design. The Cyclops is a brick-built scale silhouette with a single printed eye, not an animated enemy. Neither test is a complete mission.

## Scene design gates

| Episode | Distinct spatial problem | Hero geometry still required | Performance gate |
|---|---|---|---|
| Book 9: Polyphemus | Exposed limestone approach; compressed cave mouth; enormous occupant; hearth inside | Convincing rock donor assemblies, rolling entrance boulder, sheep, cheese racks, wine vessel, olive stake, articulated giant | Entrance closes; giant crosses crew route; stake interaction; escape beneath sheep; retreat to boat |
| Troy remembered | Vertical ochre walls; narrow gate; fire-lit foreground; dense human movement | Gate leaves, breached masonry, Trojan horse donor/build, shields, spears, debris and fire dressing | Mounted approach through actual gate clearance; squad routes; readable sword encounters without crowd overlap |
| Book 21: bow trial | Long enclosed hall; twelve aligned apertures; stillness before one shot | Final separate bow/string/arrow; integrate already developed axe-ring alignment assets | Real projectile passes every aperture; release and impact readable from actor and spectator cameras |
| Book 23: rooted bed | Intimate chamber anchored around an immovable olive trunk | Integrate existing rooted-bed build with a credible olive donor and enclosing architecture | Camera reveals tree-to-bed continuity without cutting away; actor can move around it |

A scene cannot be marked visually accepted simply because these mechanics pass. Require separate proof for native geometry, believable local landform/vegetation, hero-prop silhouette, actor clearance, and interaction. Cave and Troy intentionally differ in opening proportions, vertical mass, palette and action direction. Regional flora and final architecture remain open.

## Verification

Run `node odyssey-world/test-playable.cjs` from any directory with Node installed (the script resolves the bundled runtime relative to itself). Checks cover horse travel/turn/braking, boat boundary and water elevation, and projectile tunnelling/near misses. UI evidence is stored separately from these controller tests.

LDraw source licensing and author headers remain with the bundled part files. Viking Village donors retain the attribution documented in README.md. The rehearsal meshes use those native parts without enlarging a minifigure into a giant.
