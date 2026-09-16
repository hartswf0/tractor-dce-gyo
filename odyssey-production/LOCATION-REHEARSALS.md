# Location rehearsals

Use `/native/word-to-world.html?world=odyssey&ground=real&as=odysseus-sword&place=Voidokilia%20Beach%20Greece&sky=dawn&weather=clear&rehearsal=cave&kit=1&mute=1`. Open WHO · WHERE → Location & kit. Rehearse and Scout now share this menu as tabs; no separate floating panels. Scene shells opens the existing Grecian Urn catalogue.

Four presets: Cyclops/Voidokilia dawn, Ithaca/Vathy dusk, Circe/Culbin daytime fog, Troy/Ait Benhaddou clear night. These are scouting candidates, not verified historical or film-shot identifications. Go as Odysseus loads live terrain and automatically places the preset's small local kit. The tray offers ten verified-local readymades/assemblies. It does not preload every reported corpus donor. Weather and light remain independently editable.

Place ahead uses the actor's position and heading; walk to a new mark to place the next object. Remove last undoes a placement. These tray objects are visual blocking props, not collidable/rideable rigs. Use the existing Place horse control for a rideable horse. Save setup + screenshot writes `evidence/location-rehearsal-{preset}.json/png`, including location, network state, lighting and MPD geometry. This is a saved receipt; automatic restoration and transform gizmos are not implemented. Live map/terrain data is not an offline preload.

## Animal-first policy

Forage a ready-made before designing a substitute. Local verified candidates: goat 95341p01, dog 92586p01, pig 87621p01, cow 64452, horse 4493c01. Pasted leads for sheep 74188 / fleece 1570 and articulated dog 30578 still require acquisition, dependency and pose checks here. A valid standing animal does not establish a valid recumbent Argos or rider clearance. The custom sheep in the prior film remain engineering proxies.

## Compare the actual requirement

| Halfworld requirement | Current rehearsal | Missing |
|---|---|---|
| Polyphemus cave: giant vaulted interior, backlit arched mouth | Native panels and straight lintel | Vault, interior scale, location silhouette |
| Sealing stone: controlled blocked/open threshold | Sliding brick disk | Push/roll contact and giant performance |
| Flock: distinct sheep/goats, credible movement | Custom carrier proxies; ready-made goat now available | Acquire sheep, validate dimensions, leg animation and grips |
| Real coast: physical approach to cave | Live Voidokilia scouting | Integrate precise cave placement with foreground set |

`rehearsal-comparison.png` shows the existing Halfworld Blinding scene, two cave rehearsal frames, and an earlier real-place scout. They are explicitly different camera views; this is a gap comparison, not a matched-shot claim. Full asset-card imagery is not currently packaged for these assets.

## Wiring correction

Rehearse/Scout/Location controls now stay visible outside Odyssey mode. Rehearse includes Use Odyssey world, protected scenery, deterministic avatar walk/turn/stop controls and the existing Point + speak entry. Spoken walk-there now sends a bounded 20-second movement target through the existing Minifig gait/collision loop instead of only setting a waypoint. Manual stick movement cancels that target. The command panel uses the same target for a five-metre walk. Existing camera/body input is reused; direct theatre motion retargeting has not been implemented or validated.

Scene shells now places three locally available DAT shells (2552, 6024, 6092) through the tray. They are fixed visual scenery, not navigable terrain surfaces. Set protection prevents Props/Build blast disassembly; it does not establish the root cause of every reported thrown part. Menu buttons/selects no longer trigger world keyboard actions.

## Scene visibility

WHO · WHERE defaults to a 390px translucent side panel. Glass adjusts opacity from 35–100%; Wide panel restores the wide layout; Peek at scene collapses the tabs and contents while retaining the small toolbar. On narrow screens the menu height is limited to 48vh. This changes the overlay, not the camera framing.

Horse research: native 10509 includes 10350c01 head, 10352c01 body and 10354c01 paired rear legs. This supports head/rearing articulation but is not a ready-made four-leg gait rig. Independent walking legs require additional geometry segmentation or an articulated assembly. Superseded by the mounted-horse update below.


## Mounted horse and placement update — 2026-09-16

Freshly placed rideable horses have a lightweight four-pivot mesh segmentation rig. Rehearse → Walk gait, Gallop, Fly and Land operate the mounted horse. This is mechanical preview animation with visible joint limitations, not a physically certified articulated LEGO model; flight has no wings. Existing roadside horses remain static. Live checks recorded 4.95 m walking, 8.20 m galloping, a climb and landing/dismount. Controller and synthetic segmentation checks are in work/test_horse_motion.cjs in the development workspace.

Placing a tray prop now selects it with a green outline and opens Assembly placement. Edit X/Height/Z (metres), rotation (degrees), and scale (1 = native size), then Apply or Snap to ground. Finish placement returns to performance. Transform values are saved in the receipt; automatic receipt restoration, drag gizmos and scenery collision remain unfinished. The tray includes 13 items, including three native scene shells.

WHO · WHERE now uses a narrow blue-gray glass panel with matching controls and scrollbars, opacity, side/wide layout and Peek.
