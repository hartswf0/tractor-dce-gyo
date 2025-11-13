# Gold ↔ Bronze Interface Mapping (for Engine Swap)

## Strategy: Same Structure, Different Engines

**Goal:** Bronze's mature UI + Gold's working Prime engine

**Approach:** Map every UI element position and function, then swap the backend

---

## Top Left → Top Right Systematic Comparison

### 1. Top Left Corner

**Bronze:**
```
[?] [Scene 1]
```

**Gold:**
```
[?] [Scene 1]
```

✅ **Identical** - Help button + scene name

**Functions:**
- `#help-btn` → Show help modal/alert
- `#file-name` → Display active scene name

---

### 2. Header Center (Mode Buttons)

**Bronze:**
```
[↶↷ |] [∅] [⌖] [⎘] [⬚] [⊗]
```

**Gold:**
```
[↶↷ |] [∅] [⌖] [⊗]
```

⚠️ **Bronze has more modes:**
- `⎘` Copy mode
- `⬚` Group mode

**Functions:**
- `#undo-btn` / `#redo-btn` → Global undo/redo
- `#clear-btn` → Clear scene
- `#select-mode` → Default mode (click to select)
- `#lock-mode` → Lock lines mode
- Missing in Gold: `#copy-mode`, `#group-mode`

**Gold can add these easily** - just mode state switches

---

### 3. Top Right Corner

**Bronze:**
```
[☼]
```

**Gold:**
```
[☼]
```

✅ **Identical** - Theme toggle

**Functions:**
- `#theme-btn` → Cycle themes

---

### 4. Editor Panel Header Left

**Bronze:**
```
[↶] [↷] [New] [Discard]
```

**Gold:**
```
[↶] [↷] [New] [Discard]
```

✅ **Identical structure**

**Functions:**
- `#mpd-undo-btn` → Undo MPD edits
- `#mpd-redo-btn` → Redo MPD edits
- `#new-mpd-btn` → Bronze: New template | Gold: Load file
- `#clear-mpd-btn` → Discard unlocked lines

**Note:** Gold's "New" should create template **and** have file picker option

---

### 5. Editor Panel Header Right

**Bronze:**
```
[⎘] [↓] [⟳]
```

**Gold:**
```
[⎘] [⟳]
```

⚠️ **Bronze has Export button**

**Functions:**
- `#copy-all-btn` → Copy all MPD to clipboard
- `#export-mpd-btn` → Download MPD file (missing in Gold)
- `#render-btn` / `#rerender-btn` → Force render

**Gold needs:** Export/download button

---

### 6. Editor Panel (Lines)

**Bronze:**
```
[☑] [1] [0 FILE ...]
[☑] [2] [0 Name: ...]
```

**Gold:**
```
[☑] [1] [0 FILE ...]
[☑] [2] [0 Name: ...]
```

✅ **Identical structure**

**Functions:**
- `.line-checkbox` → Enable/disable line
- `.line-number` → Show line number
- `.line-content` → ContentEditable span
- Line classes: `.locked`, `.file-line`, `.step-line`, `.compiling`, `.highlighted`

---

### 7. Minimap (Editor Right Edge)

**Bronze:**
```
│░│ Empty
│■│ Part
│▓│ Comment
│🔒│ Locked
```

**Gold:**
```
│░│ Empty
│■│ Part
│▓│ Comment
│🔒│ Locked
```

✅ **Identical**

**Functions:**
- `#mpd-minimap` → Render strips
- `.mpd-minimap-strip` → Click to jump to line
- Classes: `.part`, `.comment`, `.empty`, `.locked`

---

### 8. Viewer Panel Top Bar

**Bronze:**
```
[3D | 2D Grid]    [W A G ▣ IMG]
```

**Gold:**
```
[3D | 2D Grid]    WAGY: [W A G Y S ⌖]    [IMG]
```

⚠️ **Different layouts, same function**

**Bronze separates:**
- Left: Mode tabs
- Right: Controls (with minimap toggle ▣)

**Gold centralizes:**
- Left: Mode tabs
- Center: WAGY controls (all diagnostics)
- Right: Screenshot

**Functions:**
- `#mode-3d-tab` → 3D view
- `#mode-2d-tab` → 2D grid view
- `#wire-quick` / `#wireframe-toggle` → Wireframe
- `#axes-quick` / `#axes-toggle` → Axes
- `#grid-quick` / `#grid-toggle` → Grid
- `#flipy-quick` / `#flip-y` → Flip Y
- `#spin-quick` / `#toggle-spin` → Auto spin
- `#reset-quick` / `#reset-camera` → Reset view
- `#screenshot-btn` → Screenshot
- Bronze only: `#minimap-toggle` → Toggle 2D minimap overlay

---

### 9. Viewer Canvas

**Bronze:**
```
<canvas> + Optional 2D grid overlay
```

**Gold:**
```
<canvas> (no 2D grid yet)
```

⚠️ **Bronze has 2D grid visualization**

**Functions:**
- `#viewer-canvas` / `#viewer` → Three.js canvas
- `#grid-2d` → 9×9 cell grid showing part placement (Bronze only)
- `#minimap` → Corner minimap showing grid state (Bronze only)

**Gold needs:** 2D grid implementation

---

### 10. Footer Left

**Bronze:**
```
[⇄]
```

**Gold:**
```
[⇄]
```

✅ **Identical**

**Functions:**
- `#import-export-btn` → Open import/export modal

---

### 11. Footer Center

**Bronze:**
```
[Scene: example] [Ready]
```

**Gold:**
```
[Scene 1 ▼] [Ready]
```

✅ **Same function, different style**

**Bronze:** Text label + scene name  
**Gold:** Dropdown selector

**Functions:**
- `#scene-selector` → Switch scenes
- `#status-text` → Status messages

**Gold's dropdown is superior** - easier scene switching

---

### 12. Footer Right

**Bronze:**
```
[⚠] [✓]
```

**Gold:**
```
[+]
```

⚠️ **Different buttons**

**Bronze:**
- `#copy-errors-btn` → Copy error log (conditional)
- `#check-all-btn` → Enable all lines

**Gold:**
- `#new-scene-btn` → Create new scene

**Gold needs:** Check All button (more useful than + since right-click scene selector can create)

---

## Function Router (Engine Swap Plan)

### Core Engine Functions (Replace These)

```javascript
// Bronze uses older engine
function loadModel(text) {
  // Bronze's THREE.LDrawLoader implementation
}

// Gold uses Prime engine
function loadManualText(text, meta) {
  await STATE.viewer.loadText(text);
  // Beta-Prime-Engine with better file map
}
```

**Swap Plan:**
1. Keep Bronze's entire UI structure
2. Replace Bronze's loader with Gold's `BetaPrimeEngine.create()`
3. Replace Bronze's `loadModel()` with Gold's `loadManualText()`
4. Replace Bronze's diagnostics with Gold's `viewer.setDiagnostics()`
5. Keep Bronze's 2D grid (add to Gold)
6. Keep Bronze's scene dots (migrate to Gold's scene dropdown)

### Shared Function Signatures

Both need these interfaces:

```javascript
// Viewer API
viewer.loadText(text)
viewer.setDiagnostics({grid, axes, wireframe, flipY, showEdges})
viewer.setAutoSpin(bool)
viewer.fitToCurrent()
viewer.clear()

// Editor API
renderEditor(lines)
compile()
switchScene(idx)

// UI API
setToggleButtonState(button, active)
updateStatus(text)
```

✅ **Gold already has all these** - Bronze needs to adopt them

---

## Differences Summary

### Bronze Has (Gold Needs)

1. ⚠️ **Copy mode** (`#copy-mode`) - Click line to copy
2. ⚠️ **Group mode** (`#group-mode`) - Multi-line selection
3. ⚠️ **Export button** (`#export-mpd-btn`) - Download file
4. ⚠️ **2D Grid view** (`#grid-2d`) - 9×9 cell visualization
5. ⚠️ **Grid minimap** (`#minimap`) - Corner mini-grid
6. ⚠️ **Check All button** (footer right)
7. ⚠️ **Error log** (`#copy-errors-btn`) - Conditional

### Gold Has (Bronze Needs)

1. ✅ **Prime Engine** - Better LDraw loading
2. ✅ **File map** - 500K+ variants
3. ✅ **Scene dropdown** - Better than dots
4. ✅ **WAGY bar** - Centralized controls
5. ✅ **Compile animation** - Wave effect
6. ✅ **Better colors** - FILE/STEP highlighting

---

## Engine Swap Checklist

### Phase 1: Align UI (Gold → Bronze parity)
- [ ] Add Copy mode
- [ ] Add Group mode
- [ ] Add Export download button
- [ ] Add Check All (footer right)
- [ ] Add 2D grid view
- [ ] Add grid minimap

### Phase 2: Extract Prime Engine
- [ ] Package BetaPrimeEngine as standalone
- [ ] Document API surface
- [ ] Create adapter for Bronze

### Phase 3: Inject Prime into Bronze
- [ ] Replace Bronze's loader initialization
- [ ] Replace loadModel() calls
- [ ] Replace diagnostics system
- [ ] Test with Bronze's UI

### Phase 4: Merge Best of Both
- [ ] Bronze UI + Gold engine
- [ ] Gold's WAGY bar → Bronze (optional)
- [ ] Bronze's 2D grid → Gold (done)
- [ ] Unified codebase

---

## Why This Works

**Same Structure:**
- Both use line-based editor
- Both have panel headers
- Both have minimap
- Both have checkboxes
- Both have mode buttons
- Both have footer controls

**Different Backends:**
- Bronze: Older THREE.LDrawLoader
- Gold: BetaPrimeEngine with file map

**Compatibility:**
- All UI element IDs are similar
- Function signatures are compatible
- State management is similar (Bronze: STATE, Gold: STATE)
- Event wiring is identical

**Result:**
- Drop-in replacement possible
- Keep Bronze's mature features
- Gain Gold's engine power
- Best of both worlds

---

## Implementation Priority

1. **First:** Complete Gold's missing UI features (2D grid, export)
2. **Then:** Test Gold as complete standalone
3. **Finally:** Inject Gold's engine into Bronze as proof of concept

**This is a good plan!** ✅
