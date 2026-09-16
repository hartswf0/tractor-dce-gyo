# Builder Alley (experimental)

Separate entry point: `../builder-alley.html?noloc=1`. Based on user-approved 139b860. The restored Word to World entry point and historical snapshots are unchanged.

Build opens the original brick engine: paged parts, colour, rotate, lift, lower, place. Aim at the top face to stack. Move → Select from scene selects a brick; X/Z and height steps preview a move; Place move commits, Cancel leaves the piece untouched. Copy on top creates a checked, undoable copy.

Hands: two MediaPipe landmark sets, associated by handedness rather than array order. Default right hand grabs and moves on the camera-facing plane; the left fist clutches depth (down = farther, up = nearer). Open the grab hand to commit. Swap grab hand reverses the assignment. Tracking loss cancels the uncommitted preview. Monocular landmark Z is not treated as metric depth.

Placement uses the existing LDraw origin and rotated footprint, stud-grid X/Z, plate-height Y, surface snapping, and overlap rejection. A move and subsequent placement share chronological Undo history. Terrain is a lower bound, not a forced destination.

Edge categories reparent original operator nodes, preserving their existing callbacks. Only one tool drawer opens. Two persistent move/look sticks have independent pointer capture, cancellation and blur resets. Page scrolling is disabled; long legacy content scrolls inside its bounded drawer for accessibility.

Validation: `THREE_PATH=/path/to/three-r128.js node builder-alley/verify.cjs`. Tests exercise the real Build class and gesture move function: stacking, support, collision, self-exclusion, off-centre origins, independent depth/height, terrain clamp, interleaved Undo and failure preservation.

Limitations: real camera gesture stability, handedness on individual devices and GPU interaction require device testing. Prop/building moves retain their previous ground-based behavior. The normal builder and gesture paths still use the existing generative backend. This is not a replacement deployment of the approved demo.
