# Hand Butter 05: fixed room and calibrated input roles

The room, camera, back-wall video, lights, and hand image stay fixed. Only the construction frame turns, in 90-degree steps. The previous orthographic camera-switch model is superseded.

## Frames and invariants

- Model coordinates, physics bodies, stud joints, exports, and Undo remain in plate-local coordinates (20 LDU/stud; 8 LDU/plate).
- A `construction-frame` group rotates render geometry. Its inverse maps input displacement into model coordinates. Picking uses actual transformed mesh geometry. Projected selection cues use that same transform. Wall-grid controls convert through it.
- Grip movement spans the camera's screen plane. Tool movement spans the perpendicular camera direction. Both vectors transform through the inverse plate rotation; no input assumes model Z is always the third direction.
- A plate turn does not mutate parts, release ownership, or inject throwing velocity. Held movement is rebased after turning.
- The same transaction may combine mouse grip + hand tool, hand grip + mouse tool, or two hands. Mouse release only commits a mouse-owned grip; ending a mouse tool drag never releases a hand-owned grip.

## Calibration

On first camera entry, or through Calibrate, choose the input pairing. Teach eight comfortable control-volume corners. The first tracked hand is the grip; the other is the tool. The UI labels both. Point left/right and high/low with the grip input, and move the tool down/near or up/away. Hold steady. After stable observations and an 800 ms dwell, the pose captures automatically. A progress bar reports the dwell. The next pose cannot capture until the required input axes move toward the next corner. Missing inputs or unstable samples reset the timer. No capture click is required, and successful verification returns to building automatically.

The pure calibration module fits separate, signed ranges for the three input channels. It rejects insufficient reach, inconsistent corners, and non-finite samples. A separate verification pass requires all eight corners to stay within 8% of each normalized axis range for 600 ms. Losing an input resets the dwell. The report stores the worst error across each successful hold. Fitting samples alone never counts as passing verification.

A verified profile is stored locally for the selected input pairing, camera settings, and stage aspect. A changed setup invalidates it and rebases any grip. This is personalized control reach, not a reconstruction or measurement of the user's physical room. The verification cube depicts the three input channels; it is not proof of millimeter physical accuracy or 99.999% acquisition reliability.

Palm-scale ratios are reported as an experimental relative-distance cue during teaching. Inconsistent pair ratios reject that cue. The cue never moves a piece. Foreshortening can still mimic depth, and a uniformly changing projection can evade the shape check. No PnP, metric camera calibration, or MediaPipe-Z fusion is claimed.

## Source boundary

- `spatial-core.js`: existing image mapping and compatibility frame definitions.
- `spatial-runtime.js`: fixed room, plate transform, projection/picking, landing previews, contact cues.
- `calibration-core.js`: fit, mapping, stability, error, and palm-scale diagnostics, without renderer dependencies.
- `soft-hand-runtime.js`: video hand overlay, feathered crop edges, and retained pixels during tracking loss. The overlay deliberately stays visible over virtual geometry, matching the skeleton; it does not claim physical occlusion.
- `input-runtime.js`: grip/tool adapters, calibration lifecycle, mixed input ownership, and profile persistence.
- `spatial.css`: plate tab and temporary calibration UI.

Run `python scripts/build-hand-butter-spatial.py` to embed the modules into the standalone `WAG-HAND-BUTTER.HTML`. Do not edit the generated block. A future camera or wrist sensor should contribute observations through an input adapter and should not write part positions directly.

## Verification

- `node tests/wag-butter-05.cjs`: no-click eight-corner teaching, automatic completion, preserved hybrid controls, and hand overlay/retained-texture checks.

- `node tests/wag-butter-04.cjs`: fixed camera/video/walls, plate projection, held ownership, mouse/hand in both directions, fit rejection, independent corner verification, and mobile layout.
- `node tests/wag-butter-02.cjs`: retained group, clipboard, joint, audio-signal, and layout behavior.
- `node tests/wag-butter-spatial-core.cjs`: pure image/frame helpers.

Browser tests require Playwright and optionally `BROWSER_EXECUTABLE`. Automated landmark replay checks the contract. It does not establish real-person comfort, camera accuracy, or speaker audibility. Butter 03's camera-switch tests are replaced by the 04 suite.
