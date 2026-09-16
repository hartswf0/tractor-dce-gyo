# Tests and evidence

## Three different meanings of “test”

| Label | What it is | What a pass does not establish |
|---|---|---|
| Automated regression | Executable assertions; current results in `test-results.json` | Final visual quality or real hands/physics |
| Blocking laboratory | Isolated scene/geometry prototype, usually a separate renderer | Integration into Cinerium or acceptance as final art |
| Rendered test | Existing MP4 output, previewable in the library | Editable scene or current code correctness |

## Automated suite

Run `python3 work/run_production_tests.py` from the development workspace. The repository release includes an equivalent portable `tools/run-tests.py`.

| ID | Checks |
|---|---|
| motion-interpolation | Key endpoints, midpoint, shortest heading turn and walking interval |
| spoken-coverage | 75-shot / seven-chapter compilation; recorded audio files, offsets, continuity and cut bounds |
| grounding | Ground-base placement regression |
| horse-gaits | Synthetic geometry segmentation, walk/gallop, flight/landing controller |
| playable-controls | Horse steering/braking, bounded water stage, swept arrow hit/miss |
| period-roads | Lane/asphalt suppression with ground support retained |
| scene-inventory | All 10 native registry entries, 40 catalog targets, sheep source/still/video |

`test-results.json` records actual execution time, status and scope. Historical files under `evidence/` retain their original dates and meaning; they are not silently promoted into new test passes.

## Manual browser checks for a release

1. Search library for “sheep”: inspect still/video and the “not integrated” status.
2. Open trailer and a book rehearsal; verify stage readiness and no new console errors.
3. Watch: play/stop, sound state, scene picker. Direct/Stage/Export: controls accessible without overlapping the film.
4. Hand Butter: keep two poses, preview transition, reload and verify persistence; export/import in the same scene.
5. Review actual rendered frames for clipping, contact, composition and readable action. Full-film QC remains open.

## Monkey Business final cut

`tools/test_monkey_cut.cjs` checks the 83-second continuous timeline, 13 finite camera/action cues and recorded voice assets. The final MP4 was probed at 1280 × 720, 996 frames, 83.000 seconds, H.264/AAC. All 11 dialogue clips fit their shot durations. Workstations, inspector and ending were visually reviewed. This does not assert physically constrained hand contact or lip sync.

Mobile Hand Butter was checked at 390 × 844: independent drawer scrolling, retained scene framing, search, native banana insertion and assembly selection.
