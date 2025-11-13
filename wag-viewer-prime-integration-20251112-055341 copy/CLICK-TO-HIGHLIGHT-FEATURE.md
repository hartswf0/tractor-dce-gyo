# 🎯 Click-to-Highlight Feature (Bronze → Gold)

## What It Does

**Click a 3D part** → **Highlights its line in MPD editor!**

This is the "dope" feature from Bronze/Primitive where clicking on any 3D element in the scene automatically scrolls to and highlights the corresponding line in the MPD editor.

---

## How It Works

### 1. **Raycasting** (Click Detection)
```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener('click', (event) => {
  // Convert mouse position to normalized device coordinates
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  // Cast ray from camera through mouse position
  raycaster.setFromCamera(mouse, camera);
  
  // Find intersecting objects
  const intersects = raycaster.intersectObjects(meshes, false);
});
```

### 2. **Line Number Storage**
```javascript
// When creating mesh (in Bronze)
mesh.userData.lineNum = part.lineNum;  // Store source line
```

### 3. **Highlight MPD Line**
```javascript
function highlightMPDLine(lineIdx) {
  // Clear previous
  document.querySelectorAll('.line-wrapper').forEach(el => {
    el.style.background = '';
    el.style.borderLeft = '';
  });
  
  // Highlight clicked line
  const lineDiv = document.querySelector(`[data-line-idx="${lineIdx}"]`);
  lineDiv.style.background = 'rgba(255, 215, 0, 0.3)';  // Gold!
  lineDiv.style.borderLeft = '3px solid var(--accent)';
  lineDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
```

### 4. **Visual Feedback**
```javascript
// Flash the clicked part yellow
clickedObj.material.color.setHex(0xffff00);
setTimeout(() => {
  clickedObj.material.color.setHex(originalColor);
}, 300);
```

---

## Implementation in Gold

### Added Functions

**1. setupClickToHighlight()**
- Sets up canvas click listener
- Uses Three.js raycaster for 3D picking
- Finds clicked mesh and extracts line number
- Calls highlightMPDLine()

**2. highlightMPDLine(lineIdx)**
- Clears previous highlights
- Finds line wrapper by data-line-idx
- Applies gold highlight background
- Scrolls into view
- Shows status message

---

## User Experience

### Before (No Feature)
```
Click 3D part → Nothing happens
Must manually search for line in editor
```

### After (With Feature)
```
Click 3D part → 
  ↓
Yellow flash on part (300ms)
  ↓
Scroll to MPD line
  ↓
Gold highlight on line
  ↓
Status: "Line 42 selected"
```

---

## Visual Flow

```
┌─────────────┐         ┌──────────────┐
│  3D Viewer  │  click  │  Raycaster   │
│   (Part)    │────────>│  (Three.js)  │
└─────────────┘         └──────────────┘
                               │
                               │ intersects[0]
                               ↓
                        ┌──────────────┐
                        │  mesh.userData│
                        │  .lineNum: 42 │
                        └──────────────┘
                               │
                               ↓
                        ┌──────────────┐
                        │ highlightMPD │
                        │   Line(42)   │
                        └──────────────┘
                               │
                               ↓
                        ┌──────────────┐
                        │  MPD Editor  │
                        │  Line 42 ⭐  │ ← Gold highlight
                        └──────────────┘
```

---

## Bronze vs Gold

### Bronze Implementation
```javascript
// Bronze stores lineNum when creating meshes
mesh.userData.lineNum = part.lineNum;
mesh.userData.originalColor = color;
mesh.cursor = 'pointer';

// Bronze's click handler
canvas.addEventListener('click', (event) => {
  const intersects = raycaster.intersectObjects(STATE.modelGroup.children);
  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    if (mesh.userData.lineNum) {
      highlightLine(mesh.userData.lineNum);
    }
  }
});
```

### Gold Implementation  
```javascript
// Gold uses Prime engine wrapper
STATE.viewer.engine.modelWrapper.traverse(obj => {
  if (obj.isMesh) meshes.push(obj);
});

const intersects = raycaster.intersectObjects(meshes);
let lineNum = clickedObj.userData?.lineNum;

// Also check parent if not found
if (lineNum === undefined && clickedObj.parent) {
  lineNum = clickedObj.parent.userData?.lineNum;
}
```

---

## Key Difference: Line Number Storage

**Issue:** Prime engine's LDrawLoader may not store line numbers in userData by default.

**Solution Needed:** Ensure the loader stores line numbers when parsing MPD:
```javascript
// In LDrawLoader parse function
mesh.userData = {
  lineNum: currentLineIndex,
  partName: partFile,
  color: colorCode
};
```

---

## Testing

### Test Sequence
```
1. Load hello-world.mpd
2. Wait for scene to render
3. Click on RED minifig
4. Should see:
   ✓ Yellow flash on clicked part
   ✓ Scroll to line in editor
   ✓ Gold highlight on line
   ✓ Status: "Line X selected"
```

### Debug Console
```
[CLICK] Part clicked, line: 42
[HIGHLIGHT] MPD line 42 highlighted
```

---

## Benefits

✅ **Quick debugging** - Find which line creates which part  
✅ **Learning tool** - Visual MPD line-to-part connection  
✅ **Navigation** - Jump to any part's definition instantly  
✅ **Bronze parity** - Same UX as working editor  

---

## Current Status

✅ Raycaster setup complete  
✅ Click handler added  
✅ Highlight function working  
✅ Visual feedback (yellow flash)  
⚠️ Need to verify: LDrawLoader stores lineNum in userData  

**Test now:** Click any 3D part to highlight its MPD line! 🎯
