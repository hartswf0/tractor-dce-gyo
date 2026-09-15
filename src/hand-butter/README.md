# Hand Butter spatial architecture

The construction exists in one world frame. Changing the view never rotates or translates its parts, rigid bodies, joints, or saved coordinates.

## Coordinate contract

- World X points right, Y points up, and positive Z points toward the seated user.
- One stud is 20 LDraw units; one plate is 8. These are model units, not measured physical distances.
- Desk is a perspective view registered to the mirrored, cover-cropped webcam image. The same image transform maps landmarks to pixels. The desk plane is manually positioned and estimated.
- 3D ROOM retains the gridded walls and wall-tap controls at a fixed perspective angle.
- Front, Back, Left, Right, and Top are exact orthographic inspection views. These show virtual geometry; they do not claim to reconstruct unseen camera views. A projected hand cutout represents the action hand in these views.
- Front/Desk movement separates X/Y from depth. Positive hidden-axis input pushes away along negative world Z and cannot change height. Top separates X/Z from height. Side views separate Z/Y from width.

## Modules

`spatial-core.js` has no DOM, Three.js, MediaPipe, or physics dependency. It defines the named frames, image registration, hidden-axis signs, position descriptions, and target latching. Its tests run in Node.

`spatial-runtime.js` adapts these rules to the existing workshop's selection, transaction, physics, and rendering services. Touch and tracked hands dispatch the same `setFace` operation. A face change preserves the held transaction, resets motion samples and offsets, and rebases the grip. View changes cannot inject throwing velocity.

`spatial.css` owns the single face gizmo and the small placement readout. The existing shelf, clipboard, and advanced controls are retained.

Run `python scripts/build-hand-butter-spatial.py` after editing these sources. It embeds the modules into `WAG-HAND-BUTTER.HTML`, so the download remains standalone. Do not edit the generated block directly.

## Placement contract

Picking intersects actual part geometry. A previous target stays latched only while it remains under the ray and within a small pointer movement band. No stale nearby target may acquire a new grip. The floor footprint and height/depth readout describe that target before acquisition.

A landing ghost is a preview, not a connection. It finds support beneath the selection and checks the prospective placement using the existing geometry and stud checks. Land or a deliberate release commits the placement; only a verified stud contact creates a joint and connection sound. View switching preserves previously connected groups.

## Extending the inputs

A future second-camera or phone input should provide timestamped observations, device identity, calibration identity, coordinate frame, landmarks or pointer rays, and uncertainty. It should not write part positions directly. Convert the observations into this world/input contract before the transaction layer consumes them.

Metric registration, synchronization between devices, camera intrinsics/extrinsics, triangulation, room reconstruction, and physical occlusion are not implemented. Adding another camera or an IMU does not make those quantities known automatically.

## Verification

- `node tests/wag-butter-spatial-core.cjs`
- `node tests/wag-butter-03.cjs`
- `node tests/wag-butter-02.cjs` for retained group, clipboard, physics, and audio behavior.

Browser tests require Playwright. Set `BROWSER_EXECUTABLE` to use an existing Chromium installation. Automated landmark replay checks the interaction contract, not comfort or accuracy with a person's real hands.
