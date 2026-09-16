# Builder WAG

Experimental entry point `builder-wag.html?noloc=1`, derived from the restored 139b860 world. It changes no existing entry point.

WAG Master supplies the part/coordinate/result relationship. The original prompt entry, Build, Read, generation Stop, and advanced builder nodes retain their original callbacks. The scene occupies a measured rectangle between the entry area and the control footer. Tool trays reflow that rectangle rather than cover it. Choosing a part closes the tray. Open trays pause hand placement, brick placement, and queued construction.

Tap a brick and drag to preview. X/Y/Z steps expose exact positions. Place commits a checked transaction; Cancel does not mutate the build. Stack copy creates a top-surface preview requiring Place. Either hand can grab. Two hands may hold two different bricks or one brick together. A single hand uses palm-size change for depth; two hands holding one piece use their separation. A release or tracking loss holds the preview without committing it. Terrain remains a lower bound; parts can stack above it.

Hands → Calibrate reach measures two observed palm sizes and fits a bounded gain mapping that reach to six studs. Hands → Practice stacking creates green support and red/blue practice pieces and checks actual lift, camera-relative depth travel, and top-surface contact. These are building controls and a measurable practice task, not claims of accurate monocular metric depth.

Geometry/transaction/hand-routing tests:
`THREE_PATH=/path/to/three-r128.js BUILD_PATH=/path/to/world/build.js node builder-wag/verify.cjs`

Tests cover panel gates, preview isolation, stacking, failed movement preservation, two-piece collisions, atomic commits, grouped Undo, actual gesture-classifier routing for each hand, simultaneous ownership and tracking loss. Physical hand jitter, camera permissions and mobile GPU rendering still require device checks. Imported models and buildings retain their existing paths. Calibration is stored under builder-wag.depth-gain; world edits use the existing build storage.
