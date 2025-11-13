# WAG Gold Scenes - Clean Architecture Plan

## What to Keep from Prime (Working)
✅ Beta Prime Engine setup  
✅ LDraw catalog loading (ldraw-parts-manifest.json)  
✅ File map building  
✅ loadText() mechanism  
✅ Diagnostics (grid, wireframe, etc.)  
✅ Three.js + OrbitControls  

## What to Remove from Prime (Not Needed)
❌ root-models-manifest.json loading  
❌ Model library browser  
❌ Model filtering/search  
❌ Quarantine list  
❌ buildCandidatePaths()  
❌ loadWithFallbacks()  
❌ Complex file path resolution  

## What to Add (From Silver/Bronze Lineage)
➕ Scene system (STATE.scenes array)  
➕ Scene switcher (list in sidebar)  
➕ New/Close scene buttons  
➕ Scene persistence (save text to scenes)  
➕ Simple scene rendering  

## Architecture

```javascript
STATE = {
  scenes: [scene1, scene2, scene3],
  activeSceneIdx: 0,
  viewer: BetaPrimeEngine,
  libraryFileMap: {...}  // For LDraw parts only
}

scene = {
  name: "Scene 1",
  text: "0 FILE scene1.mpd\n...",
  timestamp: 123456789
}
```

## Flow

1. Init → Load LDraw catalog → Create first scene
2. User pastes MPD → Text goes into textarea
3. Click RENDER → `viewer.loadText(text)` → Renders
4. Text automatically saved to current scene
5. Click scene in list → Loads that scene's text → Re-renders
6. New scene → Creates empty scene → Switches to it
7. Close scene → Removes from list → Switches to previous

## Key Simplifications

**Scene = Just Text**
- No line-by-line editor
- No locked lines
- No undo/redo per scene
- Just: name + text + timestamp

**No Complex Loading**
- No file paths to resolve
- No manifests to load
- Just: paste text → render

**Direct Rendering**
```javascript
function renderScene(idx) {
  const scene = STATE.scenes[idx];
  document.getElementById('editor-textarea').value = scene.text;
  STATE.viewer.loadText(scene.text, {
    filename: scene.name + '.mpd',
    origin: 'Gold Scenes'
  });
}
```

## UI Structure

```
Header: GOLD SCENES | ⌖ ▦ ◇ ↻
Sidebar:
  ✏️ EDITOR
    [textarea]
    [char count]
    [RENDER]
  🎬 SCENES  
    [+ NEW SCENE]
    • Scene 1 (active)
    • Scene 2
    • Scene 3
Viewer: 3D canvas
Footer: Status | Model stats | LDraw catalog status
```

## Scene List Item

```html
<div class="scene-item active">
  <div class="scene-name">Scene 1</div>
  <div class="scene-meta">1,234 chars</div>
  <button class="scene-close">×</button>
</div>
```

## What Makes It Better Than Silver

1. **Simpler Data**
   - Scene = {name, text, timestamp}
   - Not: {name, lines[], lockedLines, history[], historyIndex}

2. **Faster Switching**
   - Just load text into textarea
   - Not: Parse lines, rebuild editor DOM, restore state

3. **Working Renderer**
   - Prime's loadText() works
   - Not: Silver's broken loader

4. **No Complexity**
   - ~500 lines total
   - Not: 3300+ lines

## Implementation Steps

1. Start from Prime (working)
2. Remove library loading (keep LDraw catalog)
3. Replace manual-text section with proper editor
4. Add STATE.scenes array
5. Add scene list UI
6. Add switchScene(), newScene(), closeScene()
7. Auto-save on edit
8. Done!

**Estimated**: 400-500 lines (vs Silver's 3300)
