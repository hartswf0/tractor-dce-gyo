# Review ledger — OD-B23-S04

## Observed repairs

| Pass | Observed in native output | Responsible change | Evidence |
|---|---|---|---|
| v1 → v2 | At recording 8s Penelope had not reached the source command beat. Odysseus's eruption was late. | Replace uniform 78/52.82 scaling with explicit beat-to-recording knots. | `v1-lego-8.png`, `v2-lego-8.png`, both full movies |
| v1 → v2 | Washed-out costume colors and an oversized hearth flame dominated the scene. | Convert native material colors once for sRGB output; use actual candle-flame parts after inspecting geometry. | `v1-lego-0.png`, `v2-lego-0.png` |
| v1 → v2 | The pair remained far apart after Penelope's approach. | Reduce native end-mark separation from about 115 to 50 LDU. | `v1-lego-35.4.png`, `v2-lego-35.4.png` |
| v2 → v3 | The command gesture hid Penelope's face and the nurse was cropped. | Lower the pointing arm and widen/reposition command coverage. | `v2-lego-8.png`, `v3-lego-8.png` |
| v3 diagnostic → repaired v3 | A widened command camera was inside the solid stair structure. The image became a wall of tan. | Move camera clear of the stairs to X335,Y175,Z−70; keep both participants in frame. | `diagnostic-camera-in-stair.png`, `v3-lego-8.png` |
| v2 → v3 | The bed read as a square platform; rooted structure was concealed and another set leaked into the insert. | Rebuild a longer bed with an exposed root/post junction, move camera and hide hall only during the labelled insert. | `v2-lego-20.png`, `v3-lego-20.png` |
| v3 contact diagnostic → repaired v3 | 50 LDU spacing read as handholding. | Move final mark to 34 LDU separation and use the native 0.35-radian arm outward limit. | `diagnostic-handclasp.png`, `v3-lego-35.4.png` |
| v2 → v3 | Figures overlapped stair treads at the landing. | Bind the native stair mark and sampled foot height to actual stair solids. | `v2-lego-0.png`, `v3-lego-0.png` |

All three movie files contain the complete available recorded performance. Short still diagnostics are labelled as diagnostics, not counted as additional complete iterations.

## What was verified

- Native renders and source-matched images were inspected at eleven times. The encoded v3 movie was decoded in full and its 2-second contact sheet inspected from beginning to end.
- v3 has 660 frames, 55 seconds, five native actors, two supported native assemblies and zero asset loading errors.
- Original M4A and exported MP4 decode to exactly the same 2,531,200 mono 48-kHz float samples. The seven cut windows also match. No word can be truncated by a camera cut in this export.
- Local automatic transcription of the v1 export recovers the command and the final sentence through “reunite.” All exports use identical decoded audio. The automatic transcript misrecognizes some proper names; it is evidence of coverage, not a replacement script.
- Browser transport was exercised with play, a jump to 6.1s, playback through the scene ending and a paused seek to 20s. Additional reproduction checks are in `evidence/browser-checks.json`.

## Limits and next repair target

The recording is abridged narration, with only short direct speech; the fuller authored dialogue has no recovered matching recording. Mouth movement is not phoneme-aligned. There is no human listening or artistic approval sign-off. The set and performance still need refinement to match the strongest trailer close-ups, and the nurse's return is outside the final close coverage.

The next native challenge is **OD-B09-S09, The Blinding**. Its source composes a cave, an inset eye effect and an ensemble of four stake bearers; those image layers do not recover a single 3D stage. First author and test one physical shared stake, four hand contacts, giant eye contact and cave entry geometry in a wide view. Only then introduce shot coverage. The following escape scene is OD-B09-S10 and must remain a separate continuity test.
