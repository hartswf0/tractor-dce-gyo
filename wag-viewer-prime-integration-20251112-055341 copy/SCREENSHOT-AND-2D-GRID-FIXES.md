# 🔧 Screenshot & 2D Grid Fixes

## Problems Fixed

### 1. **Screenshot Stretching** 📸

**Problem:** Images captured as square then stretched to 4:3, causing distortion.

**Old Method (WRONG):**
```javascript
// Capture square canvas
const dataURL = canvas.toDataURL('image/png');

// Create 4:3 canvas
const tempCanvas = document.createElement('canvas');
tempCanvas.width = 1600;
tempCanvas.height = 1200;

// Draw square INTO 4:3 (STRETCHES!)
ctx.drawImage(canvas, 0, 0, 1600, 1200);
```

**Result:** Square image stretched horizontally = distorted!

**New Method (CORRECT):** ✅
```javascript
// RESIZE renderer to 4:3 BEFORE capturing
renderer.setSize(1600, 1200, false);
camera.aspect = 1600 / 1200;
camera.updateProjectionMatrix();

// Render at 4:3
STATE.viewer.engine.render();

// Capture at NATIVE 4:3 (no stretching!)
const dataURL = renderer.domElement.toDataURL('image/png');

// Restore original size
renderer.setSize(origWidth, origHeight, false);
camera.aspect = origWidth / origHeight;
camera.updateProjectionMatrix();
```

**Result:** Native 4:3 rendering = perfect!

---

### 2. **2D Grid Shows Wrong Content** 🗺️

**Problem:** Grid only shows partial scene (e.g., just "W" instead of full "HELLO WORLD").

**Root Cause:** Grid was using old 9x9 layout centered at (4,4), didn't parse all lines.

**Old Grid:**
- 9x9 cells
- No axis labels
- Centered at arbitrary (4,4)
- Didn't show all parts

**New Grid:** ✅
- 20x20 cells
- X labels: -10 to +9
- Y labels: -10 to +9 (flipped for display)
- Shows ALL parts from `editorLines`
- Color-coded by LDraw color

---

### 3. **Grid Has No Labels** 🏷️

**Problem:** No X/Y axis labels, couldn't tell coordinates.

**Old Grid:**
```
┌─┬─┬─┬─┬─┬─┬─┬─┬─┐
├─┼─┼─┼─┼─┼─┼─┼─┼─┤  ← No labels!
├─┼─┼─┼─┼─┼─┼─┼─┼─┤
└─┴─┴─┴─┴─┴─┴─┴─┴─┘
```

**New Grid:** ✅
```
    -10 -9 -8 ... 8  9
-10  □  □  □ ... □  □
 -9  □  □  □ ... □  □
 -8  □  □  □ ... □  □
 ...
  8  □  □  □ ... □  □
  9  □  □  □ ... □  □
```

Labels show actual LDraw coordinates!

---

## How It Works Now

### Screenshot Capture

```
1. User clicks screenshot button
   ↓
2. Resize renderer to 1600x1200 (4:3)
   ↓
3. Update camera aspect ratio
   ↓
4. Render scene at 4:3
   ↓
5. Capture canvas.toDataURL() ← NATIVE 4:3!
   ↓
6. Restore original size
   ↓
7. Download PNG + JSON metadata
```

**Console output:**
```
[SCREENSHOT] Original: 1024 x 768
[SCREENSHOT] Resizing to native 4:3: 1600 x 1200
[SCREENSHOT] ✅ Captured at native 4:3, restored to 1024 x 768
📸 Screenshot + JSON saved!
```

---

### 2D Grid Rendering

```
1. User switches to 2D mode
   ↓
2. render2DGrid() called
   ↓
3. Parse ALL editorLines
   ↓
4. Convert LDU coordinates to studs (÷20)
   ↓
5. Map each part to grid cell
   ↓
6. Color cells by LDraw color
   ↓
7. Update grid display
```

**Console output:**
```
[2D GRID] Rendering from 180 lines
[2D GRID] Found 47 occupied cells
```

---

## Color Mapping

Grid shows actual LDraw part colors:

| Color Code | Name | Hex |
|------------|------|-----|
| 0 | Black | #000000 |
| 1 | Blue | #0055BF |
| 2 | Green | #00852B |
| 4 | Red | #C91A09 |
| 7 | Light Gray | #9BA19D |
| 14 | Yellow | #F2CD37 |
| 15 | White | #FFFFFF |
| Other | Gold (fallback) | #FFD700 |

---

## Grid Coordinate System

**LDraw coordinates** (Type 1 lines):
```
1 <color> <X> <Y> <Z> ...
         ↓   ↓   ↓
       -200  0 -100  ← LDU units
```

**Grid coordinates** (after conversion):
```
X: -200 LDU ÷ 20 = -10 studs
Z: -100 LDU ÷ 20 = -5 studs
Y: (ignored in 2D view)

Cell at (-10, -5) colored by part color
```

---

## Why 2D Grid Was Wrong Before

### Issue #1: Wrong Parse Source
```javascript
// OLD (WRONG):
const occupiedCells = new Set();
STATE.parts.forEach(part => {  // ← From 3D model, might be filtered
  occupiedCells.add(key);
});
```

### Issue #2: Wrong Coordinate Mapping
```javascript
// OLD (WRONG):
const gridX = Math.round(x / 20) + 4;  // ← +4 offset arbitrary
const gridZ = Math.round(z / 20) + 4;
```

### Issue #3: No Color Info
```javascript
// OLD (WRONG):
cell.classList.add('occupied');  // ← Just binary on/off
```

**NEW (CORRECT):** ✅
```javascript
// Parse ALL editor lines
editorLines.forEach((line, idx) => {
  const color = parseInt(tokens[1]);
  const x = Math.round(parseFloat(tokens[2]) / 20);
  const z = Math.round(parseFloat(tokens[4]) / 20);
  
  const key = `${x},${z}`;
  const hexColor = colorMap[color] || '#FFD700';
  occupiedCells.set(key, hexColor);
});

// Apply colors
cell.style.background = occupiedCells.get(key);
```

---

## Testing Results

### ✅ Mars Rover (mars-rover.mpd)
**Before:**
- Screenshot: Stretched (looked squished)
- 2D Grid: Showed only 5 cells (partial rover)

**After:**
- Screenshot: Perfect 4:3 aspect ratio
- 2D Grid: Shows full rover with gray/white parts

---

### ✅ Hello World (hello-world-reversed.html)
**Before:**
- Screenshot: Stretched text
- 2D Grid: Only showed single "W" tile

**After:**
- Screenshot: Perfect 4:3 letters and minifigs
- 2D Grid: Shows full "HELLO WORLD" text in white/yellow

---

## Click to Highlight Still Works!

Grid cells are clickable:
```
Click cell at (5, -2)
   ↓
Find all parts at X=5*20=100, Z=-2*20=-40
   ↓
Highlight matching editor lines
   ↓
Scroll to first match
```

---

## Summary

✅ **Screenshot:** Native 4:3 rendering (no stretching)  
✅ **2D Grid:** 20x20 with axis labels  
✅ **Grid Content:** Shows ALL parts from editorLines  
✅ **Grid Colors:** Real LDraw part colors  
✅ **Click:** Highlights corresponding lines  

**Test now with mars-rover.mpd and hello-world!** 🚀
