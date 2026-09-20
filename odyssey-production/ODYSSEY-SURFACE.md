# Odyssey world: operation-based controls

## 1. Way
The operator works on one live location. Play controls the avatar and transport; Stage selects a rehearsal and blocking marks; Place adds and edits scenery; Settings holds world, rendering, connections and files. Four stable destinations absorb new capabilities without adding primary tabs. Controls stay in a bounded side panel; the scene remains visible.

## 2. Obstruction
The old surface mixed a 37-character button wall, duplicate atmosphere controls, appearance controls, catalogues, performance commands and diagnostics. Mounted movement was explicitly rejected by the performance command handler. Keyboard movement also ignores focused buttons, leaving users stuck after closing the menu. Scenery horses looked like the separately rigged rideable horse.

## 3. Keep–cut ledger
| Element | Decision / current claim |
|---|---|
| Character buttons | One selector; selected actor stays visible |
| Five overlapping tabs | Four operations; no separate shell/scout top-level tab |
| Wide/peek/glass header | Move width and opacity to Settings; persistent close |
| Mounted controls | Show only when mounted; gait and flight only for horses |
| Movement | Three-second riding cues, immediate Stop, physical-input override |
| Library horses | Explicit scenery label; Play creates a rigged, rideable horse |
| Transform form | Appears only for a selected assembly |
| Rotation | Direct 15°/90° steps plus numeric input and undo |
| Reference prose | Collapsed reference / limitations, still available |
| Static-host save | Download geometry and transforms as JSON; no nonexistent POST endpoint |

## 4. State map
- Loading → disabled movement and loading state.
- On foot → actor, location, Ride a horse, walking and Stop.
- Loading horse → disabled duplicate request, visible loading; error retained with retry action.
- Mounted → transport, speed, forward/reverse/turn, Stop, dismount; horse gait/flight controls are contextual.
- Cue running → speed and cue status; expires after three simulation seconds. Physical input cancels the cue. Stop, blur, closing or changing operations cancels it.
- Placing → selection, transform, snap, rotation, Undo, Finish.
- Finished → transform hidden; assembly selector remains available to reopen editing.
- Invalid transform → unchanged geometry plus numeric range explanation.

## 5. Wireframes
```
ODYSSEY / WORLD                     ×
[ Play ][ Stage ][ Place ][ Settings ]
Character [Odysseus with the sword ▾]
On foot · Voidokilia
[ Ride a horse ]
[ Left ][ Walk 5 m ][ Right ] [ Stop ]
> Speech, weapons & performance
```
```
Horse · 3.0 m/s · cue running
[ Dismount ]
[ Left ][ Ride 3 s ][ Right ]
[ Reverse ][ Stop ]
[ Walk gait ][ Gallop ][ Fly ]
```
```
Place
> Location, light & weather
Assembly tray [shell-raised ▾] [Place ahead]
Selected [1 · shell-raised ▾]
[Undo last change]
X / Height / Z / Rotation / Scale
[Apply] [Snap] [Finish] [−15°] [+15°] [+90°]
[Download setup JSON]
> Reference & limitations
```

## 6. Void contract
New controls must belong to an existing operation. Catalogues grow through selectors or disclosed groups, not more primary navigation. Preserve native handlers and delegated events. Keep keyboard tab navigation, focus indication, close/Escape, visible recovery and bounded scrolling. Do not label a static prop rideable. Do not claim a file was saved remotely when it was downloaded locally.

## 7. Failure and limits
Scenery assemblies remain visual blocking geometry without collision. Roadside horses are scenery. Flight is an existing prototype; these changes do not establish cinematic flight quality. Downloaded setup JSON is a portable geometry/transform record, not a live-terrain offline package or a complete film project. Remove last is still a separate deletion operation; transform Undo restores move/rotate/scale and ground-snap changes, not removed objects. Horse/terrain contact and film quality still require shot-specific visual review.

## 8. Implementation and verification
Files: native/world/odyssey-menu-tabs.js, odyssey-performance.js, odyssey-rehearsal.js, main.js, and native/word-to-world.html.

Checks:
- `node tests/horse-performance.cjs`: mounted forward/turn/reverse, Stop, blur, physical override, expiry, on-foot commands.
- `node tests/published-ldraw-paths.cjs`: published and local geometry paths.
- `python3 tools/run-tests.py` from odyssey-production: eight existing suites.
- Browser interaction: direct horse mount → forward with nonzero live speed → Stop → dismount. Shell 180° → 270° → Undo → 180°. Phone panel uses bounded internal scrolling and fixed four-tab navigation.

These checks verify controls and recovery, not the artistic quality of the Odyssey film.
