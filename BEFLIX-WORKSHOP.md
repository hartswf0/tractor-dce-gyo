# BEFLIX → Bricks workshop

Open `beflix-workshop.html` from the repository's HTTP server.

This first workshop converts BEFLIX silhouettes into extruded assemblies using the existing DSL compiler and real LDraw part geometry. It supports CLR, PNT, LIN and REC; image import generates editable PNT commands. Select recorded states, choose depth and ink threshold, trace a source cell back to its command, orbit the model, inspect omitted cells, and export MPD or the build program with source provenance.

A source cell maps to one stud horizontally and one brick course vertically (20 × 24 LDU). The source view uses this same aspect. Depth is a user decision, not inferred from brightness. The conversion ignores ink colour after thresholding and uses tan bricks.

The compiler's support handling can remove cells. The red comparison shows those differences. Grid agreement is not a physical connection or strength certificate. The first test fixture compiles to 42 bricks with exact projected occupancy.

## Verification

Run `node tools/check-beflix-bricks.js`.

Core logic was also exercised against the repository DSL in an isolated JavaScript runtime: doorway, diagonal, clipping, empty state, multiple immutable states, and four invalid-command cases. A diagonal correctly reports lost cells after unsupported pieces are removed.

Browser rendering, responsive layout, image import, LDraw network loading and downloads have not been verified in a running browser because the local runtime was unavailable. Keep this change in draft until those checks pass.

## Scope

This is a silhouette extrusion workshop. It does not reconstruct unseen geometry, infer semantic objects or joints, retarget Halfworld plans, animate transitions between recorded states, or publish changes into Cinerium. Those are subsequent adapters. The export is the reviewable handoff to the existing LEGO tools.

All image processing happens in the browser. The page loads its existing Three.js CDN dependencies and repository LDraw parts. No paid model calls or film media uploads are involved.
