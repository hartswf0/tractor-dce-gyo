Shared builder branch
====================

Base: 139b8602c5db1fb2c42d02f7787e0569ad849d6a (the user's selected snapshot).
Entry: word-to-world.html. Existing archived snapshots are untouched.

The existing builder resolves placements for reticle, hand and depth controls.
Either hand can own a grab. While holding, pinch the other hand and raise/lower
it to move farther/nearer. Near/Far offers discrete steps; Snap returns to
surface placement. Existing Up/Down adjusts height in plate steps. Release
commits a valid placement; tracking loss cancels the preview. Movement uses
the same Undo history as brick placement.

The existing word bar, palette, key settings, Read, code, log, and video remain.
Talk records on the first tap, stops and transcribes on the second. The transcript
is editable in the word bar; Build/Change submits it with its recorded scene
reference. Voice tools retain playback, transcription retry and browser speech.
Questions use the answer action without executing a scene edit.

Verification
------------
Run with Node and the same Three r128 UMD bundle used by the application:

    THREE_TEST_PATH=/absolute/path/three.min.cjs node tests/shared-builder-unit.cjs

Passed: stacking, overlap rejection, explicit depth, below-ground rejection,
move Undo, stable hand ownership across reordered detections, missing-hand
ownership and tracking loss. JavaScript syntax and git diff checks passed.

The browser fixture test is tests/shared-builder.mjs. It additionally requires
Playwright (CODEX_PRIMARY_RUNTIME_NODE_MODULES) and an installed Chromium;
CHROMIUM_TEST_PATH can specify the executable. It loads the actual HTML/CSS
and placement scripts with a small synthetic world, not the full asset pipeline.
This browser test was not run successfully in the authoring environment:
Chromium downloads timed out and Cloud Browser denied the local/data preview.

Still required on a phone: visual layout in portrait/landscape and with keyboard;
real camera tracking with crossing/occluded hands; microphone permission,
recording and paid API transcription/inference; full world asset loading.
