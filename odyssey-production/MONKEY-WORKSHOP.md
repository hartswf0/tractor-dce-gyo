# Monkey Business · dedicated Hand Butter workshop

Open [Monkey Business / Hand Butter](monkey-butter.html). This is a separate entry point devoted to the 83-second film, with all 13 shots and their exact deterministic performance states. No prior scene transfer is needed.

## Work a shot

1. Choose a shot, or scrub the film timeline. This previews the original camera and performance at that time.
2. Press **Edit this moment**. The current pose becomes named, editable assemblies in Hand Butter: monkeys, inspector when present, racks, consoles and dressing.
3. Choose an assembly. Use Hand Butter's drag, movement, rotation, copy and parts-library controls.
4. Under **Saved shot states & project files**, enter a variation name and press **Keep state**.
5. Switching to another shot or back to the film saves a local draft for the time being edited. **Open state** restores a named variation. **Export project** downloads all saved states; **Import project** restores that JSON on another browser.

State storage is browser-local, keyed by film time, and separate from other scene transfers. Export before clearing browser storage or moving to another origin. Closing while editing asks the browser to warn about unsaved work. A deep link such as `monkey-butter.html?time=45` opens the inspection moment.

## Scope

Scrubbing evaluates the original film animation; editing creates a static staging variation. Edits do not rewrite the performance animation, score, or final MP4. Whole named assemblies are editable; limb keyframing and automatic edited-film rendering are future work. Project JSON contains geometry rather than references alone and can be large (import limit 150 MB / 100 states).

Imported set assemblies have open space inside their bounding boxes, so the workbench enforces its outer bounds but permits overlaps between imported assemblies. This fixes false collisions when an actor moves beside or inside a set. Physics remains paused. Adapted-state loading preserves world placement rather than recentering a saved edit.

## Validation

- Opened shot 8 at 45 seconds with 11 assemblies including the inspector.
- Moved the inspector one stud from X −233.5 to −213.5; movement was accepted.
- Saved a named state, switched to another shot, and reopened the state with X −213.5 preserved.
- Confirmed saved states persisted across a page reload.
- Existing eight production checks and JavaScript syntax checks pass.

## Compact filmmaker controls

The shot selector, preview/edit icons and scrubber occupy a fixed compact header. Every icon has an accessible label and tooltip. The takes icon opens a small backup card with Save take, Restore take, Export and Import. Named takes are browser-local; Export backup makes a portable file.

The shared parts library uses six real LDraw thumbnail cards per page, text/ID search, category filters and previous/next buttons. Cast controls have their own Cast toggle. The page and library do not scroll; the scene remains above the fixed library.

Select an assembly, then use the in-scene rotation strip: X/Y/Z axis, 15/45/90 degree steps, backward/forward, and undo. Rotations preserve each selected object's center and lift it above the floor when necessary. Undo restores the complete previous placement. Save a named take before exploring larger changes.

Validated at 390×844: no document overflow, cards visible, native card insertion, rotation/undo and named take save.
