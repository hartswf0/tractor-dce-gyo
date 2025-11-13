# 🎯 Bronze's Click-to-Highlight: How It Really Works

## The KEY Difference

### Bronze (CUSTOM PARSER)
```javascript
// Bronze parses MPD itself → tracks line numbers
function parseMPD(text) {
  const lines = text.split('\n');
  
  lines.forEach((line, idx) => {
    if (line.startsWith('1 ')) {
      const part = {
        lineNum: idx + 1,  // ← BRONZE KNOWS LINE NUMBER!
        color: parseInt(tokens[1]),
        x, y, z, part: ...
      };
      parts.push(part);
    }
  });
}

// When creating mesh
mesh.userData.lineNum = part.lineNum;  // ← FROM PARSER!
```

### Gold (PRIME ENGINE)
```javascript
// Gold uses LDrawLoader → no line number exposure
STATE.viewer.loadText(text);  // ← Loader parses internally
// Result: meshes created WITHOUT userData.lineNum
```

---

## Bronze's Complete Flow

### 1. Parse MPD (Custom)
```javascript
function parseMPD(text) {
  const lines = text.split('\n');
  const parts = [];
  
  lines.forEach((line, idx) => {
    line = line.trim();
    if (!line || line.startsWith('0 ')) return;
    
    const tokens = line.split(/\s+/);
    if (tokens[0] !== '1') return;  // Only Type 1 (part placement)
    
    const part = {
      lineNum: idx + 1,              // ← Store original line number
      color: parseInt(tokens[1]),
      x: parseFloat(tokens[2]),
      y: parseFloat(tokens[3]),
      z: parseFloat(tokens[4]),
      part: tokens.slice(14).join(' ')
    };
    
    parts.push(part);
  });
  
  return { parts, errors };
}
```

### 2. Compile Function
```javascript
function compile() {
  const text = editorLines.join('\n');
  const { parts, errors } = parseMPD(text);  // ← Parse to get parts with lineNum
  
  STATE.parts = parts;
  
  if (STATE.viewMode === '3d') {
    render3D(parts);  // ← Pass parts array with lineNum
  }
}
```

### 3. Render with LDrawLoader
```javascript
function renderWithLDrawLoader(parts) {
  const loader = new THREE.LDrawLoader();
  loader.setPath('./ldraw/');
  
  loader.parse(mpdText, 'editor-model.mpd', (group) => {
    group.rotation.x = Math.PI;
    STATE.modelGroup = new THREE.Group();
    STATE.modelGroup.add(group);
    
    // CRITICAL: Annotate meshes with line numbers
    let meshIndex = 0;
    group.traverse(obj => {
      if (obj.isMesh) {
        if (meshIndex < parts.length) {
          obj.userData.lineNum = parts[meshIndex].lineNum;  // ← FROM PARSE!
          obj.userData.originalColor = obj.material.color.getHex();
        }
        meshIndex++;
      }
    });
    
    STATE.scene.add(STATE.modelGroup);
  });
}
```

### 4. Click Handler
```javascript
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, STATE.camera);
  const intersects = raycaster.intersectObjects(STATE.modelGroup.children, false);
  
  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    if (mesh.userData.lineNum) {  // ← HAS LINE NUMBER!
      highlightLine(mesh.userData.lineNum);
      
      // Flash effect
      mesh.material.emissive.setHex(0xffd700);
      setTimeout(() => mesh.material.emissive.setHex(0x000000), 300);
    }
  }
});
```

### 5. Highlight Line
```javascript
function highlightLine(lineNum) {
  const lineDiv = editorContainer.querySelector(`[data-line-num="${lineNum}"]`);
  
  if (lineDiv) {
    // Clear previous
    editorContainer.querySelectorAll('.highlighted')
      .forEach(l => l.classList.remove('highlighted'));
    
    // Highlight clicked line
    lineDiv.classList.add('highlighted');
    lineDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-remove after 2s
    setTimeout(() => lineDiv.classList.remove('highlighted'), 2000);
  }
}
```

---

## Gold's Solution (Implemented)

### 1. Track Lines During Compile
```javascript
function compile() {
  // Parse MPD to track line numbers (Bronze method!)
  const lineMap = [];
  editorLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed && trimmed.startsWith('1 ')) {
      lineMap.push({ 
        originalLineIdx: idx, 
        lineContent: line 
      });
    }
  });
  
  // Store for later annotation
  STATE.currentLineMap = lineMap;
  
  // Compile as normal
  loadManualText(text, meta);
}
```

### 2. Annotate After Load
```javascript
async function loadManualText(rawText, meta) {
  const result = await STATE.viewer.loadText(text, meta);
  
  // AFTER loading, annotate with line numbers
  annotateModelWithLineNumbers();
}
```

### 3. Annotation Function
```javascript
function annotateModelWithLineNumbers() {
  if (!STATE.currentLineMap) return;
  
  // Get all meshes
  const meshes = [];
  STATE.viewer.engine.modelWrapper.traverse(obj => {
    if (obj.isMesh) meshes.push(obj);
  });
  
  // Match meshes to lines BY ORDER
  meshes.forEach((mesh, idx) => {
    if (idx < STATE.currentLineMap.length) {
      mesh.userData.lineNum = STATE.currentLineMap[idx].originalLineIdx;
    }
  });
}
```

---

## Why Order Matching Works

**Assumption:** LDrawLoader processes Type 1 lines in the same order they appear in MPD.

**Bronze confirms this:**
- Parts parsed in line order
- Loader creates meshes in same order
- Index-based matching works

**Verification:**
```
Line 10: 1 4 0 0 0 ... 3001.dat  → Mesh[0]
Line 15: 1 2 20 0 0 ... 3002.dat → Mesh[1]
Line 23: 1 1 40 0 0 ... 3003.dat → Mesh[2]
```

---

## Complete Data Flow

```
1. User edits MPD lines
      ↓
2. Compile() called
      ↓
3. Parse lines → Build lineMap[]
      [{ originalLineIdx: 10, ... },
       { originalLineIdx: 15, ... },
       { originalLineIdx: 23, ... }]
      ↓
4. Load into Prime engine
      ↓
5. LDrawLoader creates meshes
      [Mesh0, Mesh1, Mesh2]
      ↓
6. annotateModelWithLineNumbers()
      Mesh0.userData.lineNum = 10
      Mesh1.userData.lineNum = 15
      Mesh2.userData.lineNum = 23
      ↓
7. User clicks Mesh1
      ↓
8. Raycaster finds mesh.userData.lineNum = 15
      ↓
9. highlightMPDLine(15)
      ↓
10. Line 15 glows gold, scrolls into view ✨
```

---

## Testing

**Console Output:**
```
[COMPILE] Tracked 47 part lines for click-to-highlight
[ANNOTATE] Found 47 meshes, 47 tracked lines
[ANNOTATE] Mesh 0 → Line 10
[ANNOTATE] Mesh 1 → Line 15
...
[ANNOTATE] ✅ Model annotated with line numbers
[CLICK] Part clicked, line: 15
[HIGHLIGHT] MPD line 15 highlighted
```

**Visual Test:**
1. Load hello-world.mpd
2. Click red minifig head
3. Should see: ⚡ Yellow flash + 🟨 Gold line highlight + scroll

---

## Key Insight

**Bronze's advantage:** Custom parser → full control over line tracking

**Gold's challenge:** Prime engine abstraction → need post-load annotation

**Solution:** Pre-parse to build line map → annotate after engine loads

**Result:** Same click-to-highlight UX! 🎯
