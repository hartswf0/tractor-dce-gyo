# Production release — 16 September 2026

## Watch

[Monkey Business · Night Shift](films/NIGHT-SHIFT.mp4) is the final 83-second cut: 13 camera shots, articulated monkey performances, an inspection entrance, screen animation, keyed button presses, an alarm/repair/recovery arc, prerecorded synthetic dialogue, original score and effects. Export: 720p, 12 fps, H.264/AAC. [Rehearsal player](monkey-film.html) supports scrubbing, shot selection/looping and a separate Hand Butter handoff.

## Build

[Hand Butter scene workshop](native/hand-butter-scenes.html) imports named scene assemblies independently of Cinerium. Mobile has a large scrolling part drawer and a retained scene viewport. Search 19,186 LDraw parts by name/number using the repository's root corpus. Upright/front/top reset controls, assembly selection and saved JSON adaptation are available. Geometry snapshots do not preserve animation curves, weather or voice tracks, and there is no automatic return to the film.

## Find existing work

[Scene library](scene-library.html) labels 41 artifact entries: book rehearsals, native programs, isolated blocking laboratories, review pages and exported films. Sheep escape remains a separate test; it is not silently counted as integrated on-location work. The root repository index links the film, rehearsal player, library and workshop.

## Verification and continuation

Run `python3 tools/run-tests.py` here: eight checks cover motion, spoken coverage, grounding, horse gaits, playable controls, period roads, inventory and the monkey cut. `evidence/monkey-final-verification.json` records the finished film's SHA-256 and media probe. Browser verification includes packaged film assembly and mobile part insertion at 390 × 844.

To rebuild sound, run `python3 tools/render-monkey-audio.py` here with NumPy and ffmpeg installed. On the local production server, Stage / rehearse → Render complete cut writes 996 JPEG frames to the server's capture directory. Encode those at 12 fps with the generated WAV. Native rendering geometry and the shot list are the reproducible sources; temporary frame caches and incomplete real-time recordings are not published.

The production workspace is in `odyssey-production/` and reuses the existing root `ldraw/` corpus for the workshop. Existing root tools remain available. See [production status](PRODUCTION-README.md), [cut notes](MONKEY-CUT.md), [workshop guide](HAND-BUTTER.md) and [test scopes](TESTS.md) for limitations and next work.
