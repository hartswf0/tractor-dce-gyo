# WAG Reactive MPD Editor - Media for Thinking the Unthinkable

## Overview
The enhanced MPD editor implements **Bret Victor's "Media for Thinking"** principles, creating a reactive system where text, sliders, 3D view, and AI chat are **entrained** - touching one triggers updates in all others.

## Architecture

### Four-Pane Layout
```
┌─────────────┬────────────┬─────────────┐
│   EDITOR    │  SLIDERS   │  3D VIEWER  │
│   (Text)    │  (Direct   │  (Visual)   │
│             │   Manip)   │             │
├─────────────┴────────────┴─────────────┤
│          AI CHAT ASSISTANT              │
└─────────────────────────────────────────┘
```

### Reactive Data Flow
```
      CLICK 3D PART
          ↓
    SELECT LINE INDEX
          ↓
    ┌─────┴─────┐
    ↓           ↓           ↓
TEXT HIGHLIGHT  SLIDERS UPDATE  CAMERA FOCUS
```

```
     MOVE SLIDER
          ↓
    UPDATE VALUE
          ↓
    ┌─────┴─────┐
    ↓           ↓
UPDATE TEXT    UPDATE 3D MESH
(preserve format) (smooth transition)
```

```
     EDIT TEXT
          ↓
    PARSE CHANGES
          ↓
    ┌─────┴─────┐
    ↓           ↓
UPDATE SLIDERS  RE-RENDER 3D
(if part selected) (debounced)
```

---

## Bret Victor Principles Applied

### 1. **Surface the Invisible** 
✅ **Implemented**:
- Slider values show exact numeric coordinates (not just visual position)
- Real-time part count, color count, line count
- Selection indicator overlays in 3D
- Synchronized highlighting across text/3D
- Color swatches with LDraw codes visible

### 2. **Overcome Cognitive Limits**
✅ **Implemented**:
- **Sliders** for spatial coordinates (humans bad at mental 3D rotation)
- **Multiple views** of same data (text + spatial + visual)
- **Immediate feedback** (no compile-render-check loop)
- **Undo-by-slider** (continuous exploration vs discrete edits)

### 3. **Support Multiple Modes of Thought**

#### Interactive Thinking (Sliders)
```javascript
// Drag X slider → part moves in real-time
slider.oninput = (e) => {
  updatePartPosition(selectedIndex, {x: e.target.value});
  updateTextLine(selectedIndex);  // Sync text
  update3DMesh(selectedIndex);     // Sync visual
};
```

#### Visual Thinking (3D View)
- Click part → see its parameters
- Rotate view → understand structure
- Color coding → identify patterns

#### Symbolic Thinking (Text Editor)
- See raw LDraw commands
- Edit precise values
- Copy/paste/transform

### 4. **Enable Rapid What-If Exploration**
✅ **Implemented**:
- Slider changes are **instant** (no render button needed in reactive mode)
- Multiple files/tabs for A/B comparison
- Emoji toggle for clean/playful interfaces
- Reactive mode toggle (on/off for performance)

### 5. **Link Perspectives**
✅ **Core Feature**:

| Action | Text Effect | Slider Effect | 3D Effect |
|--------|-------------|---------------|-----------|
| **Click 3D part** | Highlight line | Show params | Select mesh |
| **Move slider** | Update coords | Move thumb | Transform mesh |
| **Edit text** | Type freely | Update if selected | Re-render |
| **AI command** | Insert/modify | Update params | Add/move parts |

### 6. **Abstract and Generalize**
🔄 **Partially Implemented**:
- Slider system is **generic** (works for x, y, z, rotation, color)
- Can extend to other LDraw line types
- Parameter templates could be saved/shared

**TODO**:
- Save slider configurations as "presets"
- Parameter space visualization (x vs y plot)
- Animation timelines for slider sequences

---

## Key Features

### 1. **Reactive Mode** ⚡
When enabled (default):
- **Slider → Text → 3D** (immediate sync)
- **Text → Slider → 3D** (debounced parsing)
- **3D → Text → Slider** (click selection)

When disabled:
- Manual "Render" button required
- Better for large files (performance)
- Traditional workflow

### 2. **No-Emoji Interface** 😊➡️ABC
Toggle removes all emoji from:
- Title ("🧱 WAG" → "WAG")
- Chat messages
- Button labels
- Cleaner for professional contexts

### 3. **Direct Manipulation Sliders**

#### Position (X, Y, Z)
```
X: [-200] ========●===== [200]
Y: [-200] ========●===== [200]  
Z: [-200] ========●===== [200]
```

#### Rotation (Future)
```
RX: [0°] ========●======= [360°]
RY: [0°] ========●======= [360°]
RZ: [0°] ========●======= [360°]
```

#### Color
```
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 0 │ 1 │ 2 │ 4 │ 5 │ 6 │ 7 │ 14│  ← LDraw codes
│ ■ │ ■ │ ■ │ ■ │ ■ │ ■ │ ■ │ ■ │  ← Color swatches
└───┴───┴───┴───┴───┴───┴───┴───┘
   Click to change part color
```

### 4. **AI Assistant Chat**
Natural language commands:
```
User: "Move selected part up 10 units"
AI:   Updates Y coordinate, syncs all views

User: "Add a red brick at 40, 0, 0"
AI:   Inserts new line in text, renders immediately

User: "Make all blue parts yellow"
AI:   Finds color:1, replaces with color:14

User: "Create a 3x3 grid of bricks"
AI:   Generates loop, inserts 9 parts
```

### 5. **Multiple File Management**
```
[untitled.mpd ×] [model-2.mpd ×] [+ New]
     Active          Inactive      Create
```
- Tab switching
- Independent edit histories
- Compare models side-by-side (future)

---

## Implementation Details

### Reactive State Management
```javascript
const STATE = {
  reactiveMode: true,
  selectedPartIndex: null,
  emojiMode: false,
  files: [{name, content}],
  parts: [{x, y, z, color, lineIndex}]
};
```

### Synchronization Functions

#### 1. **Slider → Text + 3D**
```javascript
function onSliderChange(param, value) {
  if (!STATE.reactiveMode) return;
  
  // Update internal state
  STATE.parts[STATE.selectedPartIndex][param] = value;
  
  // Update text (preserving formatting)
  const line = reconstructLDrawLine(STATE.parts[STATE.selectedPartIndex]);
  replaceTextLine(STATE.parts[STATE.selectedPartIndex].lineIndex, line);
  
  // Update 3D mesh
  const mesh = STATE.modelGroup.children[STATE.selectedPartIndex];
  mesh.position[param] = value;
}
```

#### 2. **3D Click → Text + Sliders**
```javascript
function on3DClick(mesh) {
  const partIndex = mesh.userData.partIndex;
  STATE.selectedPartIndex = partIndex;
  
  // Highlight text line
  highlightEditorLine(STATE.parts[partIndex].lineIndex);
  
  // Update sliders
  populateSliders(STATE.parts[partIndex]);
  
  // Focus camera
  focusCameraOn(mesh);
}
```

#### 3. **Text Edit → Sliders + 3D**
```javascript
function onTextChange() {
  debounce(() => {
    if (!STATE.reactiveMode) return;
    
    // Parse changed lines
    const newParts = parseMPDText(editor.value);
    
    // Update sliders if selected part changed
    if (STATE.selectedPartIndex !== null) {
      const part = newParts[STATE.selectedPartIndex];
      updateSliderValues(part);
    }
    
    // Re-render 3D (only changed parts)
    incrementalRender(newParts);
  }, 500);
}
```

---

## Mobile Optimization

### Responsive Breakpoints
```css
/* Desktop: 3 columns */
@media (min-width: 1024px) {
  grid-template-columns: 1fr 280px 1fr;
}

/* Tablet: 2 columns (hide sliders) */
@media (max-width: 1024px) {
  grid-template-columns: 1fr 1fr;
  #param-panel { display: none; }
}

/* Mobile: 1 column (stack all) */
@media (max-width: 768px) {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 1fr 200px;
}
```

### Touch Gestures
- **Drag sliders** → smooth thumb movement
- **Pinch 3D view** → zoom camera
- **Two-finger rotate** → orbit camera
- **Tap part** → select
- **Long press** → context menu (future)

---

## Usage Guide

### Basic Workflow
1. **Load sample** or paste MPD text
2. **Click Render** (or enable reactive mode)
3. **Click a part** in 3D view
4. **Drag sliders** to manipulate
5. **See text update** in real-time
6. **Ask AI** for complex edits

### Advanced Techniques

#### A. **Slider Animation**
1. Select part
2. Hold slider and drag smoothly
3. Watch part move in 3D in real-time
4. Text updates continuously

#### B. **Text-Driven Modeling**
1. Type/paste bulk LDraw code
2. Click Render
3. Tweak individual parts with sliders
4. Copy modified text out

#### C. **AI-Assisted Building**
1. Describe what you want in chat
2. AI generates LDraw commands
3. See result immediately in 3D
4. Refine with sliders

---

## Future Enhancements

### Phase 1: Advanced Sliders
- [ ] Rotation matrix sliders
- [ ] Scale factor (non-standard LDraw)
- [ ] Part type dropdown
- [ ] Duplicate part button

### Phase 2: Visual Programming
- [ ] Node graph (part dependencies)
- [ ] Constraint system (relative positioning)
- [ ] Animation timeline
- [ ] Keyframe recording

### Phase 3: Collaborative Features
- [ ] Real-time multi-user editing
- [ ] Version control (git-like)
- [ ] Share via URL
- [ ] Export animations

### Phase 4: AI Intelligence
- [ ] Auto-suggest next part
- [ ] Detect symmetry, offer mirroring
- [ ] Structural analysis (stability)
- [ ] Style transfer (copy building technique)

---

## Bret Victor Quote

> "The most powerful way to gain insight into a system is by moving between levels of abstraction."

This editor enables:
- **Concrete** (3D mesh)
- **Intermediate** (sliders)
- **Abstract** (text)
- **Narrative** (AI chat)

All linked in real-time.

---

## Files

- `/Users/gaia/DCE-GYO/wag-fork-mpd-editor.html` - **Enhanced reactive editor**
- `/Users/gaia/DCE-GYO/mac-01.html` - Mac-style integrated viewer
- `/Users/gaia/DCE-GYO/wag-fork-integrated.html` - Multi-channel proof-of-concept

---

## References

1. **Bret Victor - "Media for Thinking the Unthinkable"**
   http://worrydream.com/MediaForThinkingTheUnthinkable/

2. **LDraw File Format Specification**
   https://www.ldraw.org/article/218.html

3. **Three.js Documentation**
   https://threejs.org/docs/

4. **Reactive Programming Principles**
   https://gist.github.com/staltz/868e7e9bc2a7b8c1f754

---

**Status**: ✅ Core reactive features implemented  
**Next**: Add click-to-3D selection and AI command parsing  
**Vision**: The editor becomes a **thinking tool**, not just a text editor
