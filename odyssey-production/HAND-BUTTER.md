# Independent Hand Butter scene loader

Open `native/hand-butter-scenes.html`. This is a separate app based on the supplied WAG-HAND-BUTTER-11 (15).HTML; the Downloads original is untouched.

Cinerium and Word to World offer **Open in Hand Butter**. Night Shift does too. The loader has a transferred-scene picker, named assembly selection, file loading, saving and Fit scene. Existing Hand Butter movement, rotation, copying and part-shelf tools operate on imported assembly snapshots. Physics pauses for imported scenes to prevent accidental throwing.

Scene files contain geometry and materials, not just links to donors. Cast imports are static geometry. Live animation rigs, location terrain, weather, film score and animation curves do not transfer. Edited scenes save to JSON and can be reopened in this loader; returning changes to Cinerium is not implemented. Legacy labs without a handoff button are not yet importable through this interface.

Cinerium's earlier pose-key panel is now labeled **Actor keys** to distinguish it from the full Hand Butter app. Webcam tracking is retained from the supplied app but has not been tested in this integration.

## Mobile parts library (September 16)

**Parts** opens a scrollable lower drawer and reframes the scene above it. Close returns the full work area. The search accepts an LDraw number or description; shortest matching descriptions rank first, exact IDs take priority. The local development corpus exposes 19,186 parts. Only 60 matches render at once to keep the drawer responsive. A result loads real geometry, selects the new assembly and adds it to the assembly picker. New geometry starts above the selected assembly, or near the origin when nothing is selected. Use the existing movement/rotation tools to place it; Save adapted scene preserves it.

**Upright**, **Front** and **Top** reset the plate orientation and camera. Imported scenes remain physics-paused. The assembly limit is 200.

Verified in the browser at 390 × 844: drawer scrolling, visible scene framing, search by banana and 33085, actual banana insertion, and assembly selection. Full catalog search requires the complete LDraw corpus. In the repository release, the workshop uses the existing root `ldraw/` directory; keep `odyssey-production/` alongside it. The local development server uses its full native corpus. Webcam tracking was not enabled during these checks.
