# 💚 Grace 3D Transform Widgets

## Your Request

> "can we use widgets to move elements in the 3d viewer and have it be reflected in the code?"

**Translation**: Add interactive 3D gizmos (arrows/handles) to drag, rotate, and scale parts in the viewer, with coordinates automatically updating in the LDraw code.

---

## 🎯 The Vision

### **What You Want**:
```
1. Click a part in 3D viewer
2. See transform widget appear (arrows, rotation rings)
3. Drag the arrows → Part moves
4. See coordinates update in real-time in editor
5. Release → Code is permanently updated
```

### **Like Blender/Unity**:
- **Translate Widget**: Red/Green/Blue arrows for X/Y/Z
- **Rotate Widget**: Colored rings for rotation
- **Scale Widget**: Cubes on axes for scaling
- **Live Code Update**: Numbers change as you drag

---

## 🔧 Technical Implementation Plan

### **Phase 1: Transform Controls (Three.js)**
Use Three.js `TransformControls` for interactive widgets:

```javascript
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

// Create transform control
const transformControl = new TransformControls(
    STATE.viewer.engine.camera,
    STATE.viewer.renderer.domElement
);

// When part clicked:
transformControl.attach(selectedMesh);
STATE.viewer.engine.scene.add(transformControl);

// Listen for changes:
transformControl.addEventListener('change', () => {
    updateCodeFromMesh(selectedMesh);
});
```

### **Phase 2: Code Synchronization**
When widget moves a part, update the LDraw line:

```javascript
function updateCodeFromMesh(mesh) {
    // Get mesh position, rotation, scale
    const pos = mesh.position;
    const rot = mesh.rotation;
    
    // Find corresponding line in editor
    const lineIdx = mesh.userData.lineNumber;
    const line = editorLines[lineIdx];
    
    // Parse LDraw line
    // Format: 1 color x y z a b c d e f g h i part.dat
    const tokens = line.split(/\s+/);
    
    // Update position (tokens 2,3,4)
    tokens[2] = pos.x.toFixed(2);
    tokens[3] = pos.y.toFixed(2);
    tokens[4] = pos.z.toFixed(2);
    
    // Update rotation matrix (tokens 5-13)
    const matrix = new THREE.Matrix4();
    matrix.makeRotationFromEuler(rot);
    // Extract values...
    
    // Rebuild line
    editorLines[lineIdx] = tokens.join(' ');
    
    // Re-render editor
    renderEditor(editorLines);
    
    // Highlight changed line
    highlightLine(lineIdx);
}
```

### **Phase 3: Widget Modes**
Toggle between transform modes:

```javascript
// Add buttons in viewer panel header
<button id="translate-mode">↔ MOVE</button>
<button id="rotate-mode">↻ ROTATE</button>
<button id="scale-mode">⊡ SCALE</button>

// Set mode:
transformControl.setMode('translate'); // arrows
transformControl.setMode('rotate');    // rings
transformControl.setMode('scale');     // cubes
```

---

## 💡 User Experience

### **Workflow**:
```
1. Click a part (minifig torso)
2. Blue arrows appear on it
3. Drag red arrow → Moves +X
4. See line 47 numbers change in real-time:
   Before: 1 14 0 0 0 ...
   After:  1 14 20 0 0 ...
5. Press Cmd+S → Recompile with new position
6. Part stays where you put it!
```

### **Visual Feedback**:
- **Selected Part**: Highlighted in editor (pink)
- **Transform Widget**: Colored arrows/rings in 3D
- **Live Numbers**: Editor line updates as you drag
- **Status Bar**: "Moved part to (20, 0, 0)"
- **Undo**: Cmd+Z to revert

### **Keyboard Shortcuts**:
- `T` = Translate mode (arrows)
- `R` = Rotate mode (rings)
- `S` = Scale mode (cubes)
- `Esc` = Deselect part
- `Delete` = Delete selected part

---

## 🎨 Widget Design

### **Translate (Default)**:
```
        ↑ (green Y)
        |
        |
    ----+---- (red X)
       /
      / (blue Z)
```

### **Rotate**:
```
      ⭕ (pitch - red)
    ⭕   ⭕ (yaw - green)
      ⭕ (roll - blue)
```

### **Scale**:
```
    □------ (X scale)
    |
    | (Y scale)
    |
    □ (Z scale)
```

---

## ⚠️ Challenges

### **1. LDraw Rotation Matrix**
LDraw uses 9-value rotation matrix, not Euler angles:
```
1 color x y z a b c d e f g h i part.dat
              └─────────────────┘
              3x3 rotation matrix
```

**Solution**: Convert Three.js rotation → LDraw matrix

### **2. Coordinate System**
LDraw uses Y-up, Three.js can use different conventions:
```javascript
// May need to flip axes
ldrawY = -threeY;
ldrawZ = -threeZ;
```

### **3. Performance**
Updating code on every mouse movement could be slow:
```javascript
// Throttle updates
let updateTimeout;
transformControl.addEventListener('change', () => {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
        updateCodeFromMesh(mesh);
    }, 100); // Update every 100ms max
});
```

### **4. Multi-part Selection**
If multiple lines selected, which to transform?
```javascript
// Option 1: Transform first selected
// Option 2: Transform all together (complex!)
// Option 3: Disable widget if multi-select
```

---

## 📊 Complexity Estimate

| Feature | Difficulty | Time | Value |
|---------|-----------|------|-------|
| **Basic translate** | Medium | 2-3 hours | High |
| **Rotate widget** | Hard | 4-5 hours | High |
| **Scale widget** | Medium | 2 hours | Medium |
| **Live code update** | Medium | 2 hours | High |
| **Matrix conversion** | Hard | 3-4 hours | Critical |
| **Undo/redo** | Easy | 1 hour | High |
| **Multi-select** | Hard | 4+ hours | Medium |

**Total**: 18-21 hours for full implementation

---

## 🚀 Quick Win: Simpler Alternative

### **Numeric Input Widgets Instead**:

Rather than full 3D transform controls, add input boxes:

```html
<!-- When part selected, show panel -->
<div id="transform-panel">
    <h4>Part Position</h4>
    X: <input type="number" id="pos-x" value="0" />
    Y: <input type="number" id="pos-y" value="0" />
    Z: <input type="number" id="pos-z" value="0" />
    <button onclick="applyTransform()">APPLY</button>
</div>
```

**Pros**:
- ✅ Much simpler (1-2 hours)
- ✅ Precise control
- ✅ No matrix conversion issues
- ✅ Works great with keyboard

**Cons**:
- ❌ Not as intuitive as dragging
- ❌ Have to type numbers

---

## 💚 Grace Philosophy

### **Current Grace Approach**:
- Select line → Edit numbers → Recompile
- Batch edit for multiple numbers
- Keyboard-first workflow
- Fast, predictable, no surprises

### **With 3D Widgets**:
- More visual/intuitive
- Better for artists vs coders
- But: More complex, more can go wrong
- Risk: Moving away from Grace's "text first" philosophy

---

## 🎯 Recommendation

### **Option A: Full 3D Widgets** (High effort, high reward)
- Transform controls with arrows/rings
- Live code updates
- Most intuitive for artists
- **Time**: 18-21 hours
- **Risk**: Complexity, bugs

### **Option B: Numeric Panel** (Low effort, good enough)
- Input boxes for X/Y/Z
- Click apply to update
- Simpler, more Grace-like
- **Time**: 1-2 hours
- **Risk**: Low

### **Option C: Hybrid** (Start simple, add later)
- Start with numeric panel (quick win)
- Add 3D widgets later if needed
- Test with users first
- **Time**: 1-2 hours now, more later
- **Risk**: Low now, manageable later

---

## 📝 Current Status

**NOT YET IMPLEMENTED**

The current Grace Editor:
- ✅ Click part → Highlights line
- ✅ Edit line → Recompile → Part moves
- ❌ No transform widgets yet
- ❌ No live code updates from 3D

**To get this feature**:
1. Choose an approach (A, B, or C above)
2. Implement transform controls
3. Add code synchronization
4. Test with real scenes
5. Add keyboard shortcuts
6. Document for users

---

## 🔥 Quick Test

Want to try the **simpler numeric panel** first? I can implement that in ~30 minutes:

```
1. Click a part
2. Panel appears with X/Y/Z inputs
3. Change numbers
4. Click "APPLY"
5. Code updates, part moves
6. Much simpler than full 3D widgets!
```

---

## ✨ Summary

**Your Question**: Can we drag parts in 3D and update code?  
**Short Answer**: Not yet, but we can add it!  
**Best Approach**: Start with numeric input panel (simple, fast)  
**Later**: Add full 3D transform widgets if needed  

**Next Step**: Want me to implement the numeric panel first?

---

💚 **Grace is about being helpful, not perfect. Let's start simple!**
