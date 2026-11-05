# Cinerium Director Composer

Open `director-composer.html` from the repository HTTP server. It embeds Cinerium on the same origin and works with the existing film engine.

Select a film and shot. Use camera controls without a model call, or write a direction, prepare the prompt, inspect the exact instructions/context, and send it using Cinerium's model connection. Returned JSON is shown verbatim, validated and only applied when requested. Camera patches preserve shot durations, events, soundtracks and actor actions. Supported native moves: hold, push, pull, orbit, crane and track.

The session history records application prompts, responses, validation failures, applied camera keys, playback, captures and undo. Export it as JSON. It does not expose model-internal reasoning or API keys. History is in memory until exported.

This version directs existing shots and subjects. It does not generate new sets, change performances, add shots, infer BEFLIX objects, or automatically perform image-based evaluation. Capture exports the currently viewed frame for inspection.

## Checks

`node tools/check-director-core.js` validates allowed subjects/camera fields and verifies that edits preserve duration, speech, actor actions and soundtrack references.

The core was exercised in an isolated JavaScript runtime; scripts were syntax-checked. The local execution runtime remained unavailable, so browser interaction, embedded Cinerium, image capture and live API calls are NOT verified. Keep this as a draft until tested on desktop and mobile. No paid model calls were made during development.

The model call uses the existing `Ai.request` path with explicit instructions and a JSON-only input. It makes one request with no automatic fallback or repair. The existing model and transport settings remain controlled by Cinerium.
