Current downloadable arena and cast work: [Hand Butter 11](../hand-butter-11/README.md). The following documents the preserved 06/07 pipeline.

# Hand Butter 06: pointing calibrated on construction targets

The room, camera orientation, rear video, and hand frame stay fixed. The build plate turns in 90-degree steps. Framing includes all four actual plate corners.

## Corrected calibration contract

The former calibration diagram was not the build volume. It fitted three independent input ranges, then verified them against another diagram. Butter 06 removes that UI and stops calling it volume calibration.

Set pointing creates four temporary 2×2 brick meshes at the actual 800-LDU workbench corners, using the same geometry catalog and plate transform as ordinary parts. One index fingertip teaches these four targets. No palm orientation, open-hand pose, second hand, or hand-size measurement is required by this calibration state machine. Steady pointing captures automatically. Moving away rearms the next target.

A 2D affine map fits raw fingertip observations to the projected scene targets. The fitted map is applied to pointing, held movement, and the rendered action hand. Degenerate or inconsistent samples are rejected. This is screen pointing calibration, not metric depth reconstruction.

Verification uses the normal `pick` function and the same raycaster as building. The fingertip must actually intersect each corner brick for 600 ms, then an ordinary building brick (up to two visible bricks). Pointing at another object cannot pass. Missing or out-of-frame fingertip observations reset capture/dwell. Only this successful selection sequence saves a profile. Instructions occupy the footer, outside the workbench; there is no independently drawn cube. Temporary targets do not change the user's parts, physics, Undo, or exports.

The tracking model still needs enough visible hand evidence to infer landmarks. No fingertip-only detector or reliable reconstruction of unseen fingers is implemented. Close-up tracking loss is shown as paused capture, not guessed success. Physical LEGO detection, physical depth calibration, and camera intrinsics are not implemented.

## Input and frame invariants

- Model positions, physics bodies, joints, exports, and Undo remain plate-local (20 LDU/stud; 8 LDU/plate).
- The construction group rotates render geometry. Its inverse maps movement into model coordinates. Wall-grid controls convert through the same transform.
- Grip movement spans the camera screen plane. The other input moves perpendicular to it. The second hand may remain still during pointing setup.
- Two hands, mouse grip + hand depth, and hand grip + mouse depth use the same transaction. A plate turn preserves ownership and clears old throw velocity. Mouse-tool release cannot release a hand grip.
- Soft video hands render over virtual geometry, like their skeletons. Lost tracking retains the last captured texture and fades it. This is an action overlay, not physical occlusion.

## Modules

- `spatial-core.js`: coordinate and image helpers.
- `spatial-runtime.js`: plate transform, shared picking, landing previews, contact cues.
- `calibration-core.js`: affine pointing fit and validation; older helpers retained for compatibility.
- `input-runtime.js`: one-finger setup, real target verification, mixed input ownership, and versioned profile persistence.
- `soft-hand-runtime.js`: feathered video hands and retained textures.
- `spatial.css`: compact plate tab and footer setup instructions.

Run `python scripts/build-hand-butter-spatial.py` to embed source modules into the standalone `WAG-HAND-BUTTER.HTML`. Future sensors should provide input observations instead of writing part positions directly.

## Verification

- `node tests/wag-butter-06.cjs`: fixed frame, plate rotation, mixed inputs in both directions, one-index-only calibration, wrong-target rejection, missing-input pause, selection of a real building brick, retained hand pixels, and mobile layout.
- `node tests/wag-butter-02.cjs`: retained groups, clipboard, joints, audio signal, and layout.
- `node tests/wag-butter-spatial-core.cjs`: pure coordinate helpers.

Browser tests require Playwright and optionally `BROWSER_EXECUTABLE`. Synthetic replay verifies the program's contract, not reliability with a person's camera and hands. Earlier 03–05 test entry points run the current interaction contract.

### Butter 07: pinch acquisition repair

`trackHands` owns calibrated fingertip smoothing. The input adapter no longer
replaces that filtered point with raw landmarks; held movement uses it too.
`ButterSpatial.pinchTarget` remembers open-hand aim and freezes it when the pinch
ratio crosses 0.5, before the existing 100 ms close debounce. The visible hover
stays on that brick through closure. The lock expires after 500 ms, a tracking gap
over 180 ms, substantial palm displacement, or excessive fingertip displacement.
Plate rotations clear aim. Mouse raycasts and pointing verification stay exact.

`tests/wag-butter-07.cjs` replays actual `processHands` acquisition and release
against rendered brick geometry. This replay misses on 06 and succeeds on 07;
it also checks stale aim, empty-space closure and adjacent-target intent.
This is synthetic regression evidence, not a measured live-hand success rate.
