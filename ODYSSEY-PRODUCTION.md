# Odyssey production workspace

Open [Scene & test library](odyssey-production/scene-library.html) for previews, filters and explicit integration status. [Production README](odyssey-production/README.md) documents startup, operation, current limits and the continuation handoff.

The sheep escape is [catalogued separately](odyssey-production/scene-library.html#sheep-escape), with its film, still and source; it is not yet part of the on-location cave rehearsal.

Run locally: `python3 odyssey-production/serve.py --port 8918`, then open `http://127.0.0.1:8918/scene-library.html`.

Run regressions: from `odyssey-production`, run `python3 tools/run-tests.py`. Seven checks cover motion, audio intervals, grounding, horse/boat controls, roads and scene inventory. These are not final-art acceptance checks.

This release lives in its own directory so the existing root production tools remain independently available.
