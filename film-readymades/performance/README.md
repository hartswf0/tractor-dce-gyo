# Current status: contact review fails

The MP4 below is retained as an earlier, unvalidated prototype. The current player blocks playback and frame export when contact checks fail. Use `test_contacts.cjs`, inspect `contact-report.json`, and scrub the proposed poses in Butter. Do not present the retained MP4 or source-preservation tests as geometric or structural validation.

Whole native leaf instances are now hidden for camera access; no clipping plane slices their shells. Cast and initial prop placement have been revised, but transfer and grip problems remain. The current check includes native glass, the buggy and display housing. Its conservative envelope tests cannot certify a hollow grip, support, stud connections or structural integrity.

The exporter is intentionally gated. Clearances must be resolved before the older render/encode instructions below can produce a new accepted take.

---

# Unidentified Item — Green Grocer take

The prior 48-second story is retargeted into the acquired Green Grocer location inside the existing Butter/Hand renderer. `take.js` contains all performance, prop and camera timing. `soundtrack.mp3`, `sound.py` and `sound-cues.json` preserve the earlier synthesized soundtrack and its cues.

The native location is unchanged. Film-mode visibility opens a foreground camera wall, lifts upper floors and hides construction guides. Glass triangles are split into transparent draw geometry, while complete geometry remains in the native/export catalogue. The native buggy adaptation omits the donor adult and folded hood; the apple accessory is scaled to 0.5 for this animation. The duck, cashier facial artwork, display housing and juice particles are authored film props. The baby body has limited articulation; contact remains approximate. Neither animation nor collision envelopes certify physical construction.

Film entry captures actor placement, scale, joints and active performer state. Leaving restores them. Playback audio supplies the active clock when available; pause, scrub, end-of-film and page visibility changes stop playback. Saving a workspace during a take saves the original placements. Scene changes leave the take before disposing its assets.

Install Playwright and provide its module path with `PLAYWRIGHT_MODULE` and a Chromium executable with `CHROMIUM`; the defaults reflect the development workspace. To export after building the player, run `node performance/render.cjs`, then:

```sh
ffmpeg -framerate 12 -i performance/frames-release/%04d.png \
  -i performance/soundtrack.mp3 -t 48 \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart \
  production/Unidentified-Item-Green-Grocer.mp4
```

Clear `frames-release` before a changed take is rendered; the exporter resumes existing frames. The export uses the same scene, camera, title canvas and pose function as interactive playback. It does not screen-record the builder's controls.

Source architecture: Green Grocer 10185, Max Martin Richter and credited revisers; original donor notices retained in `donors/10185.mpd`. Native apple 33051: Philippe Hurbain and credited contributors, notice retained in `ldraw/parts/33051.dat`. All additional LDraw contributor notices remain with their native files. Existing Simpsons characters are reused fan-animation assets, not original character designs.
