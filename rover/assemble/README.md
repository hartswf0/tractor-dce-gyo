# ROVER ASSEMBLE

ASSEMBLE consumes RESOLVE output. It never searches and never decides what the shot needs.

The camera has already decided that upstream.

Outputs are not naked `.ldr` filenames. Every assembly declares:
- source candidate and evidence
- kind
- camera scope when shot-local
- parts/submodels
- anchors
- affordances
- performance channels
- attachments
- KEEP / MAY_CHANGE constraints

Kinds:
- ACTOR
- PROP
- LOCATION_FRAGMENT
- ENSEMBLE_FRAGMENT
- LIGHT_BLOCKER

Location construction is deliberately fragmentary. A threshold, visible wall, stair hint, floor path, or occluder may be a complete assembly when that is all the active camera requires.

After ASSEMBLE:

STAGE places the assembly for a particular frame/camera.

BIND connects the Odyssey source identity to that staged LDraw realization.

Only then may PERFORM begin.
