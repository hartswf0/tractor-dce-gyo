# ✨ Section Selection + 3D Bounding Boxes (Like Bronze/Silver!)

## New Features Added

### 1. **Section Selection in MPD** 🎯

**Two ways to select a section:**

#### A. Click a Comment Line (Header)
- Click any line starting with `0 //` or `0 ═══`
- Selects ALL parts beneath it until next comment/STEP
- Example:
  ```
  0 // ═══ WHEEL FRAME ═══  ← CLICK HERE
  1 15 -100 0 -120 ... 4624.dat
  1 0 -100 0 -120 ... 3641.dat
  1 15 100 0 -120 ... 4624.dat
  1 0 100 0 -120 ... 3641.dat
  0 // ═══ AXLES ═══  ← Stops here
  ```
  **Result:** All 4 wheel lines selected!

#### B. Double-Click Any Line
- Double-click any part line
- Finds section boundaries automatically
- Selects from previous comment to next comment
- Example:
  ```
  0 // Solar panels
  1 71 0 -8 0 ... 3029.dat
  1 71 0 -16 0 ... 3029.dat  ← DOUBLE-CLICK HERE
  1 71 0 -24 0 ... 3029.dat
  0 STEP
  ```
  **Result:** All 3 solar panel lines selected!

---

### 2. **3D Bounding Boxes (Like Bronze!)** 🎆

When you select a section, **green wireframe boxes** appear around those parts in the 3D scene!

**Visual Effect:**
- Green glowing edges around each part
- Pulsing laser-grid style (like Bronze/Silver)
- Shows EXACTLY which parts are in the selection
- Updates in real-time

**Technical Implementation:**
```javascript
// Creates THREE.LineSegments with EdgesGeometry
const edges = new THREE.EdgesGeometry(mesh.geometry);
const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00ff00,  // Green
    linewidth: 2,
    transparent: true,
    opacity: 0.8
});
const wireframe = new THREE.LineSegments(edges, lineMaterial);
```

---

## How It Works

### Section Detection Algorithm

**Start from clicked line, look backwards:**
```javascript
// Find previous comment
for (let i = idx - 1; i >= 0; i--) {
    if (line.startsWith('0 //') || line.startsWith('0 ═══')) {
        sectionStart = i;
        break;
    }
}
```

**Then look forwards:**
```javascript
// Find next comment or STEP
for (let i = idx + 1; i < editorLines.length; i++) {
    if (line.startsWith('0 //') || line === '0 STEP' || line === '0 NOFILE') {
        sectionEnd = i - 1;
        break;
    }
}
```

**Result:** Section boundaries defined!

---

### 3D Bounding Box Creation

**Steps:**
1. Get part line indices in selected section
2. Find corresponding meshes in 3D scene by `userData.lineNum`
3. For each mesh, create `EdgesGeometry` (wireframe outline)
4. Apply green glowing material
5. Copy mesh transforms (position, rotation, scale)
6. Group all wireframes together
7. Add to scene with name `selection-bounding-boxes`

**Cleanup:**
- Previous bounding boxes removed automatically
- Single-line selection clears boxes
- New section selection replaces old boxes

---

## Complete Interaction Flow

```
USER CLICKS COMMENT LINE "// WHEELS"
    ↓
1. Detect it's a comment line
2. Find section boundaries (backward/forward scan)
3. Select all lines in section (add .selected class)
4. Highlight lines in blue in editor
5. Extract part line indices (Type 1 lines only)
    ↓
6. For each part index:
   - Find grid cell coordinates
   - Add .selected class → green pulse on 2D grid
    ↓
7. Find meshes in 3D scene with matching lineNum
8. Create EdgesGeometry for each mesh
9. Apply green material + transforms
10. Add wireframe group to scene
11. Force render
    ↓
STATUS: "Selected section: 8 parts (lines 20-35)"
CONSOLE: "[SELECT SECTION] Lines 20-35, 8 parts"
CONSOLE: "[BOUNDING BOX] Drawing boxes for 8 meshes"
```

---

## Visual Examples

### MPD Editor:
```
Before:                          After Clicking "// WHEELS":

0 FILE mars-rover.mpd            0 FILE mars-rover.mpd
0 Name: Mars Rover               0 Name: Mars Rover

0 // ═══ WHEELS ═══              0 // ═══ WHEELS ═══
1 15 -100 0 -120 ... 4624.dat   █1 15 -100 0 -120 ... 4624.dat█
1 0 -100 0 -120 ... 3641.dat    █1 0 -100 0 -120 ... 3641.dat█
1 15 100 0 -120 ... 4624.dat    █1 15 100 0 -120 ... 4624.dat█
1 0 100 0 -120 ... 3641.dat     █1 0 100 0 -120 ... 3641.dat█
                                 ↑ All selected with blue glow!
0 // ═══ AXLES ═══               0 // ═══ AXLES ═══
1 0 0 0 -120 ... 3707.dat        1 0 0 0 -120 ... 3707.dat
```

### 2D Grid:
```
Before:                After:

  -5  0  5              -5  0  5
-6 □  □  □           -6 □  □  □
 0 ■  □  ■            0 ⬛ □  ⬛  ← Green pulse!
 6 □  □  □            6 □  □  □
```

### 3D Scene:
```
Before:                After:

   🚗                  ┌─────┐
  /##\                 │ 🚗  │ ← Green wireframe boxes!
 [○  ○]                │/##\ │
                       │[⬚ ⬚]│
                       └─────┘
                       Glowing edges around wheels!
```

---

## Section Types

### Example MPD Structure:
```
0 FILE mars-rover.mpd
0 Name: Mars Rover

0 // ═══ SOLAR PANELS ═══        ← Section 1 (3 parts)
1 71 0 -8 0 ... 3029.dat
1 71 0 -16 0 ... 3029.dat
1 71 0 -24 0 ... 3029.dat

0 // ═══ WHEELS ═══               ← Section 2 (8 parts)
1 15 -100 0 -120 ... 4624.dat
1 0 -100 0 -120 ... 3641.dat
1 15 100 0 -120 ... 4624.dat
1 0 100 0 -120 ... 3641.dat
1 15 -100 0 120 ... 4624.dat
1 0 -100 0 120 ... 3641.dat
1 15 100 0 120 ... 4624.dat
1 0 100 0 120 ... 3641.dat

0 // ═══ AXLES ═══                ← Section 3 (2 parts)
1 0 0 0 -120 ... 3707.dat
1 0 0 0 120 ... 3707.dat

0 STEP                            ← End of sections
0 NOFILE
```

**Click any section header → Select all parts in that section!**

---

## Integration with Existing Features

### Single Line Selection:
- **Click** line → Single line selected, green box on that part
- **Double-click** line → Whole section selected, green boxes on all parts

### 2D Grid:
- Selected section → Multiple grid cells pulse green
- Shows spatial distribution of section

### 3D Scene:
- Selected section → Green wireframe boxes
- Visual confirmation of which parts are selected
- Like Bronze/Silver editors!

### Clear Selection:
- Click another line → Clears boxes, new selection
- Click background (future) → Clears all selections

---

## Console Output

**When selecting section:**
```
[SELECT SECTION] Lines 20-28, 8 parts
[BOUNDING BOX] Drawing boxes for 8 meshes
```

**When no meshes found:**
```
[BOUNDING BOX] No meshes found for selected parts
```

**When single line selected:**
```
[SELECT] Line 23 → Grid (5, -2)
```

---

## Comparison with Bronze/Silver

### Bronze/Silver:
- Click part → Yellow bounding box
- Manual mesh finding
- Simple box helper

### Gold (NOW):
- Click section → Green wireframe boxes
- Automatic section detection
- Multiple boxes at once
- EdgesGeometry for clean wireframe
- Integrated with MPD structure

**Gold now has Bronze/Silver's visual feedback!** ✅

---

## Use Cases

### 1. **Assembly Workflow**
- Organize MPD with section comments
- Click "// CHASSIS" → Select all chassis parts
- Verify placement in 3D with green boxes
- Edit section as a unit

### 2. **Debugging Positioning**
- Double-click suspicious line
- See whole section highlighted
- Check 2D grid distribution
- Verify 3D bounding boxes match expectations

### 3. **Batch Operations** (Future)
- Select section
- Delete/move/transform all at once
- Lock/unlock section
- Copy section to another scene

### 4. **Understanding Structure**
- Click section headers to explore
- See how model is organized
- Visual feedback confirms section boundaries
- Learn MPD structure interactively

---

## Summary

✅ **Click comment line** → Select whole section  
✅ **Double-click any line** → Select containing section  
✅ **Green wireframe boxes** → Like Bronze/Silver!  
✅ **2D grid shows section** → Multiple cells pulse  
✅ **Status bar shows count** → "8 parts (lines 20-28)"  
✅ **Auto section detection** → Smart boundary finding  
✅ **Clean wireframe style** → Professional look  

**Test now:**
1. Paste mars-rover.mpd
2. Compile
3. Click "// ═══ WHEELS ═══"
4. Watch all wheel lines select + green boxes appear in 3D!
5. Double-click any line → Section selects automatically!

**The connection you wanted is complete!** 🚀✨
