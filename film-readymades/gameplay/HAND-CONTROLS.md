# Film Butter: character hands

This revision keeps the acquired Green Grocer and the original native minifig models. Marge's shoulders and C-shaped hands manipulate the actual native food instances. The original donor remains unchanged; `production/produce-adaptations.json` records the adapted display placements and native tile surfaces.

## Play

The file opens in **Play**; **Build** remains available. Move with the left stick or WASD; orient with the right stick. **Eyes** puts the camera above the body while retaining the attached arms. Face the food and **tap the actual food to reach and grab**. The controller chooses a reachable contact on its surface and can use the other free hand. If it is too far away, it raises the selected arm and tells you to move closer. Tap a supporting counter to aim and place, or use **Grip / place** (keyboard **G**). **L / R** selects a hand for manual aim. Keyboard **1 / 2** selects a hand. The camera button enables the existing tracked-hand input: pinch grips, opening places. Webcam behavior has not been verified with a live camera in this environment.

Aiming does not pull food toward you. The hand must actually approach its surface. If a crate blocks the arm, step back, raise the arm, and approach. Carry the item to the register and open the hand above a supporting surface. A successful register placement transfers it into the game's checkout basket and clears the work surface. Pay after all three goods have been deposited. Basket transfer is a game inventory operation; no animated cashier or bag physics is claimed.

## Human and machine parity

`ShopOperators` exposes rendered observations and bounded movement, turning, aiming, gripping, release and checkout. It supplies no destination lookup or automatic following. The detective's observation excludes shopper coordinates, inventory and pickup names. Notes are written by the observer.

The completed engineering test grasped and deposited all three items, then paid $4.00 in a 25.15-second action timeline with 543 recorded states and no browser errors. The latest engineering result is in `gameplay/hand-verification.json`. The test drives the shared controller with a scripted route; it is not an LLM perception result. Both visual LLM operators were launched, but both stopped with an account usage-limit error before playing. No successful two-LLM visual run or updated video essay is claimed. The previous event-fed demonstration is archived and does not pass this test.

## Scope of checks

Movement uses native leaf envelopes. Arm clearance samples offset rays; carried objects are checked for surface crossings against native fixture triangles. Release requires a nearby supporting surface. These checks are incomplete: they do not certify continuous collision freedom, solid containment, all character-to-character or food-to-food contacts, grip legality, balance, studs, clutch or structural strength. The displayed architecture is not a solver-verified LEGO build.

PeerJS invitations remain available. A hosted HTTPS address is necessary for phone invitations and camera access; successful cross-device WebRTC has not been verified. Local two-tab transport was verified in the preceding revision, not re-certified by this hand test.

## Walking and human input repair

The native 3815c01 lower assembly is now loaded as its original hips, right-leg and left-leg descendants attached to their matching joints. The earlier walk cycle animated empty joints. Both original legs now alternate according to actual displacement and return to rest when movement stops. Open hands start raised for approaching displays. The earlier MP4 predates this control repair.

The virtual character shoulders also allow a bounded sideways reach. Native arms keep their shape and length; this extra joint freedom is a game control, not physical LEGO joint validation.

Latest check: native leg movement and browser mouse-input grabs passed for banana, bread and carrot, with no browser errors. Developer routes positioned the player for those tests. The banana test clicked three screen locations to hit its curved visible surface; the other foods succeeded on the first tested click. This is input acceptance evidence, not a usability study.

## Open the entrance and leave

After paying, walk toward the front entrance at the end of the aisle. Face the native door, move close and tap its panel with a free hand. The panel swings on its hinge, and the frame opening becomes traversable. Marge bows near the low lintel; walk up the threshold and down onto the pavement. Walking and hand controls remain active after checkout. The receipt folds away when you leave the register.

The final scripted run passed all three grabs and deposits, checkout, a real mouse click on the native entrance, and walking onto the exterior pavement. Door angles and the exit event are saved and replayed. The MP4 uses that accepted run with generated footstep and interface foley, plus an authored closing camera. It is not a two-LLM visual trial. Live webcam pinch and cross-device PeerJS remain unverified.

Door frames use separate jamb, lintel and sill navigation envelopes. Door swing and crouching remain game approximations, without continuous body/door collision or LEGO structural certification. Supported release allows a short drop of up to 24 scene units.
