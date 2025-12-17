# OLOG: WAG Courage Architecture — Parts, Transforms & Mysteries

**Date:** 2025-12-17  
**System:** WAG Courage Editor  
**Status:** RESEARCH IN PROGRESS  

---

## 1. OBSERVED PHENOMENA

### 1.1 Parts Catalog — Two Modes of Operation

| Mode | Categories | Behavior | UX Quality |
|------|------------|----------|------------|
| **Search** | All parts via text query | Add pieces ONE-BY-ONE | ✅ Direct, Surgical |
| **Category Browser** | Folk, Minifigs, Locations | Batch load entire MPD | ❌ Brutish, All-or-nothing |

**User Request:** Make category browsing work like search — shop around, add individual pieces incrementally.

### 1.2 Coordinate Transform Mismatch

| View | Observed Position | Coordinate System |
|------|-------------------|-------------------|
| **2D Grid** | Parts in upper-left region | Grid cells (A1-I9) |
| **Minimap** | Matches 2D layout | Miniaturized grid |
| **3D Viewer** | Appears FLIPPED/MIRRORED | Three.js world coords |

**Symptom:** Visual disconnect between 2D representation and 3D reality.

### 1.3 Unexplained UI Elements

| Element | Location | Display Value | Purpose? |
|---------|----------|---------------|----------|
| `↖ A1` | Bottom-left corner | Static label | Unknown |
| `Library: 279,165 variants` | Bottom-right footer | Dynamic count | Unknown |

---

## 2. ENTITIES & MORPHISMS

### 2.1 Coordinate Systems (Objects in Category)

```
LDraw Coords (LDU)     Three.js World         2D Grid (A1-I9)        Minimap Pixels
       ↓                     ↓                      ↓                      ↓
   x: right              x: right               col: 1-9               x: 0-width
   y: DOWN               y: UP                  row: A-I               y: 0-height  
   z: forward            z: forward             cell: (col,row)        px: (x,y)
```

### 2.2 Transformations (Morphisms)

```
                    flipY?
LDraw ──────────────────────► Three.js
  │                              │
  │ gridMapping                  │ projection
  ▼                              ▼
2D Grid ◄────────────────────── Camera View
           ???
```

**Key Question:** What transformation chain produces the mismatch?

### 2.3 Suspected Flip Points

1. **`group.rotation.x = Math.PI`** in `finalizeGroup()` — flips model 180° around X axis
   - This converts LDraw's Y-down to Three.js's Y-up
   - Side effect: Z axis is also inverted (−Z becomes +Z visually)

2. **`modelWrapper.scale.y = diag.flipY ? -1 : 1`** in `applyDiagnostics()` — optional Y flip

3. **Grid cell indexing** — uses Z for rows (rowOffset = zLdu / cellSize)
   - Row -4 (A) = negative Z = rendered at TOP of 2D grid
   - Row +4 (I) = positive Z = rendered at BOTTOM of 2D grid

4. **Camera orientation** — OrbitControls default looks at -Z
   - After the Math.PI rotation, what was -Z is now +Z visually

### 2.4 The Mismatch Explained

```
2D Grid Mapping:
  LDraw X → column (left-to-right)
  LDraw Z → row (top-to-bottom, A=negative Z, I=positive Z)

3D Camera View (after rotation.x = Math.PI):
  Looking from above (Y+) toward origin
  X axis: left-to-right ✅ MATCHES
  Z axis: INVERTED due to 180° X rotation ❌ MISMATCH
```

**Root Cause:** The `rotation.x = Math.PI` flip inverts Z, but the 2D grid doesn't account for this.

### 2.5 FIX APPLIED ✅ (2025-12-17 16:27)

**Solution:** Negate BOTH colOffset AND rowOffset in 2D grid mapping

```javascript
// BEFORE (mismatched):
const colOffset = Math.round(xLdu / FRANK_GRID_CONFIG.cellSizeLDU);
const rowOffset = Math.round(zLdu / FRANK_GRID_CONFIG.cellSizeLDU);

// AFTER (aligned with 3D view):
const colOffset = -Math.round(xLdu / FRANK_GRID_CONFIG.cellSizeLDU);
const rowOffset = -Math.round(zLdu / FRANK_GRID_CONFIG.cellSizeLDU);
```

**Why both axes?** The `rotation.x = Math.PI` (180° around X) flips both Y and Z. From the camera's perspective looking down, this effectively mirrors both horizontal axes.

**Files fixed:**
- `wag-courage.html` — render2DGrid() and highlightLinesAtGridPosition()
- `wag-brave.html` — same functions

---

## 3. MYSTERY #1: Library Variants Count — SOLVED ✅

### 3.1 What is "279,165 variants"?

**Answer:** The count of unique path variants in `STATE.libraryFileMap`.

### 3.2 Source Code (line 5058)
```javascript
const variantCount = Object.keys(STATE.libraryFileMap || {}).length;
libStatus.textContent = `Library: ${variantCount.toLocaleString()} variants`;
console.log('✓ Library catalog loaded:', variantCount, 'path variants');
```

### 3.3 What is a "Variant"?

The library contains ~34,994 actual files but generates ~279K+ path variants because:
- Same part can be referenced multiple ways
- Each file gets registered with ALL possible path formats:

```
One file → Multiple path variants:
  ldraw/parts/3001.dat  → registered as:
    - ldraw/parts/3001.dat
    - parts/3001.dat
    - 3001.dat
    - LDRAW/PARTS/3001.DAT (case variants)
```

This ensures LDraw files can reference parts in any format and still resolve.

---

## 4. MYSTERY #2: "↖ A1" Corner Marker — SOLVED ✅

### 4.1 What is "↖ A1"?

**Answer:** Origin indicator for the FRANK grid coordinate system.

**Purpose:**
- Shows that TOP-LEFT of 2D grid = cell A1
- Matches yellow corner markers (△) on A1 cells in both 2D grid and minimap
- Orients user: "I'm looking at the scene from above, A1 is top-left"

### 4.2 Code Location (line 1137)
```html
<div id="frank-corner-tab" style="position: absolute; bottom: 10px; left: 10px; ...">
    ↖ A1
</div>
```

### 4.3 The FRANK Grid System

Named after a coordinate system used across WAG tools:
```
FRANK_GRID_CONFIG = {
    lduPerStud: 20,      // 1 stud = 20 LDU
    cellSizeLDU: 160,    // 1 FRANK cell = 8×8 studs = 160×160 LDU
    halfCells: 4         // 9×9 grid → offsets -4..+4 around center
}
```

Grid labels: A1 (top-left) → I9 (bottom-right), like spreadsheet coordinates.

---

## 5. ARCHITECTURE ANALYSIS: SEARCH vs CATEGORY

### 5.1 Search Flow (Direct, Works Well)

```
User types query
       ↓
Filter 279K library entries
       ↓
Show matching parts as cards/list
       ↓
User clicks ONE part
       ↓
Generate single Type-1 line
       ↓
Append to current MPD
       ↓
Recompile scene
```

### 5.2 Category Flow (Brutish, Problematic)

```
User selects "Minifigs" category
       ↓
Load ENTIRE category MPD file (e.g., Minifig_01.mpd)
       ↓
REPLACE current scene contents
       ↓
User loses previous work OR gets overwhelmed
```

### 5.3 Proposed Fix: Unified "Add Part" Pattern

All categories should work like search:
1. Show parts as browsable cards/thumbnails
2. Each card has "Add to Scene" button
3. Clicking adds ONE part at current cursor/origin
4. Scene accumulates parts incrementally

**Implementation Sketch:**
```javascript
// Instead of loading entire MPD:
function addPartFromCategory(partId, color = 4) {
    const newLine = `1 ${color} 0 0 0 1 0 0 0 1 0 0 0 1 ${partId}`;
    editorLines.push(newLine);
    renderEditor(editorLines);
    compileCurrentMPD();
}
```

---

## 6. TRANSFORM INVESTIGATION PLAN

### 6.1 Step 1: Trace Grid → 3D Mapping

Find where 2D grid position is computed:
```javascript
// Look for code like:
const gridX = Math.floor(partX / CELL_SIZE);
const gridZ = Math.floor(partZ / CELL_SIZE);
```

### 6.2 Step 2: Check Coordinate Signs

| Axis | LDraw | Three.js | 2D Grid |
|------|-------|----------|---------|
| X | +right | +right | +col |
| Y | +down | +up | N/A (height) |
| Z | +forward | +forward | +row? -row? |

**The Y-flip is known** (`rotation.x = Math.PI`). The question is whether Z or X is also inverted somewhere.

### 6.3 Step 3: Test with Known Coordinates

Place a part at LDraw position `(100, 0, 100)`:
- Expected 2D cell: depends on grid origin
- Actual 2D cell: observe
- If mismatch: trace the sign flip

---

## 7. ENTITY RELATIONSHIP DIAGRAM

```
┌─────────────────┐
│   LDraw File    │
│   (MPD/LDR)     │
└────────┬────────┘
         │ parse
         ▼
┌─────────────────┐
│  Type-1 Lines   │
│  x, y, z, part  │
└────────┬────────┘
         │ load into Three.js
         ▼
┌─────────────────┐      ┌─────────────────┐
│   3D Scene      │      │  Editor Lines   │
│   (meshes)      │◄────►│  (text array)   │
└────────┬────────┘      └────────┬────────┘
         │                        │
         │ project               │ grid mapping
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│   Camera View   │      │   2D Grid       │
│   (canvas)      │      │   (A1-I9)       │
└─────────────────┘      └────────┬────────┘
                                  │ miniaturize
                                  ▼
                         ┌─────────────────┐
                         │    Minimap      │
                         └─────────────────┘
```

---

## 8. NEXT STEPS

### 8.1 Research Tasks
- [ ] Find grid mapping code in wag-courage.html
- [ ] Compare grid origin convention (top-left vs bottom-left)
- [ ] Trace library variant count source
- [ ] Document the coordinate transform chain

### 8.2 Implementation Tasks
- [ ] Refactor Folk/Minifigs/Locations to use card-based selection
- [ ] Add "Add Part" button to each browsable item
- [ ] Fix 2D↔3D coordinate mismatch

### 8.3 Diagnostic Output Needed
```javascript
console.log('[GRID] Part at LDraw:', x, y, z);
console.log('[GRID] Mapped to cell:', col, row);
console.log('[3D] World position:', mesh.position);
```

---

## 9. GLOSSARY

| Term | Meaning |
|------|---------|
| **LDU** | LDraw Unit (1 LDU ≈ 0.4mm) |
| **Type-1 Line** | LDraw part reference: `1 color x y z a b c d e f g h i part.dat` |
| **Variant** | A single path variant in the library (same part may have multiple paths) |
| **Frank** | Origin corner indicator (↖ A1) |
| **Stud** | The cylindrical bump on top of LEGO bricks (8 LDU diameter) |
| **Grid Cell** | 20 LDU × 20 LDU square in 2D view |

---

## 10. RELATED OLOGS

- [LDraw Material Pathology](OLOG-ldraw-material-pathology-20251217.md) — Loading/rendering issues
- [WAG-COOL-OLOG](../WAG-COOL-OLOG.md) — Optimization strategies
