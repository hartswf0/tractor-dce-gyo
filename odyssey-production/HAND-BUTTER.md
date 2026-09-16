# Hand Butter in Cinerium

Open **Direct → Hand Butter** after the scene finishes loading. The scene is already loaded: actors, props, light and cameras stay in Cinerium.

1. Select a shot, then an actor.
2. At time 0, pose the actor and press **Keep pose**.
3. Move Time forward. Drag the floor pad to move the actor, adjust the joints or select a starting pose.
4. Press **Keep pose** again, then **Play shot**.
5. Use **Save motion file** for a portable backup. Keys also save in this browser, per scene. **Load motion file** requires the same scene and shot names.

**Walk between keys** adds a leg cycle during translation. Slide / hold pose is useful for seated rowing or held gestures. Keep multiple poses to create anticipation, action and recovery; presets alone are static poses. Delete nearest key and Undo key edit are available.

This is a native adaptation of the attached WAG Hand Butter workflow, not an importer for its workshop JSON. That file stores catalogued brick rows and a separate performer, while Cinerium has named actors, shots and recorded performances. Its webcam hand tracker, physics constraints and brick assembly controls have not been ported. The native tool uses mouse/touch floor dragging and joint sliders. It does not solve hand-to-prop contact or collision constraints. Motion is a separate local layer and JSON backup; it is not embedded in MENTO script export.
