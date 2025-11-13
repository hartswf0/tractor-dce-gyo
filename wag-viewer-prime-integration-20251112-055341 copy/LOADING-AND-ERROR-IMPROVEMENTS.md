# ✅ Loading Animations + Error Indicators + Copy Selection

## Problems Solved

1. **❌ No loading feedback** → Page seems frozen during compile/load
2. **❌ "Copy line(s)" confusing** → Changed to "Copy Selection"
3. **❌ 404 errors silent** → Missing primitive parts (8/3-8cylo.dat) cause model failure
4. **❌ Can't tell which lines have problems** → No visual indication

---

## 1. Full-Screen Loading Overlay ✨

### What Changed
**Added proper loading overlay with spinner and progress text!**

```css
#loading {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(4px);
    z-index: 10000;
}

.loading-spinner {
    width: 60px;
    height: 60px;
    border: 4px solid var(--border-primary);
    border-top: 4px solid var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
```

### When It Shows

**During Compile:**
```
📝 Compiling MPD...
   Parsing lines and preparing 3D model...
```

**During Model Load:**
```
⚙️ Loading Model...
   Building 3D geometry...
```

**During Library Load:**
```
📚 Loading LDraw Library...
   Fetching part catalog...
   Building library index...
```

### Helper Functions

```javascript
showLoadingOverlay(text, subtext) {
    // Shows full-screen overlay with spinner
    // Updates text dynamically
}

hideLoadingOverlay() {
    // Removes overlay
}
```

**Result:** User always knows system status. No more "is it frozen?" moments!

---

## 2. "Copy Selection" Instead of "Copy Line(s)" 📋

### What Changed

**BEFORE:**
```
✓ Copied 5 line(s) to clipboard
No lines selected
```

**AFTER:**
```
✓ Copied selection (5 lines)
No selection to copy
```

### Why Better
- More concise and clear
- Matches user mental model ("I'm copying my selection")
- Handles singular/plural gracefully: "selection (1 line)" or "selection (5 lines)"

---

## 3. Missing Part Indicators (404 Errors) ⚠️

### The Problem

**LDraw primitive parts missing:**
```
GET ldraw/8/3-8cylo.dat → 404
GET ldraw/8/3-8edge.dat → 404
GET ldraw/8/3-8cyli.dat → 404
GET ldraw/parts/8/3-8chrd.dat → 404
```

These are **primitive shapes** (cylinders, edges, chords) used to build complex parts. When missing, the model loads but looks broken or incomplete.

### The Solution

**Visual indicators on problematic lines:**

```css
.editor-line.missing-part {
    background: rgba(255, 0, 0, 0.1);
    border-left: 3px solid #ff4444;
}

.editor-line.missing-part::after {
    content: '⚠ 404';
    position: absolute;
    right: 8px;
    color: #ff4444;
    font-size: 11px;
    font-weight: 700;
    background: rgba(0,0,0,0.5);
    padding: 2px 6px;
    border-radius: 3px;
}
```

**Visual Result:**
```
Normal line:  1 15 0 0 0 ... 3001.dat

Problem line: 1 4 100 0 40 ... 3070b.dat  [⚠ 404]
              ↑ Red background + warning badge
```

### How It Works

```javascript
function highlightMissingParts(missing404Parts) {
    editorLines.forEach((line, idx) => {
        const partName = tokens[tokens.length - 1];
        
        // Check if this part is in the 404 list
        for (const missingPart of missing404Parts) {
            if (missingPart.includes(partName)) {
                const lineEl = editorContainer.children[idx];
                lineEl.classList.add('missing-part');
                lineEl.title = `Missing part: ${missingPart}`;
            }
        }
    });
    
    document.getElementById('status-text').textContent = 
        `⚠ ${missing404Parts.size} missing part(s) - check red lines`;
}
```

**Status Bar Updates:**
```
⚠ 12 missing part(s) - check red lines
```

**Console Log:**
```
[404 ERRORS] Missing 12 primitive parts
```

---

## Complete User Flow

### Scenario 1: Paste Large MPD

```
1. USER: Pastes mars-rover.mpd (200+ lines)
   SYSTEM: Shows "Loading Model..." with spinner

2. SYSTEM: Compiles MPD
   SYSTEM: Shows "Compiling MPD... Parsing lines and preparing 3D model..."

3. SYSTEM: Detects 12 missing primitives (8/3-8cylo.dat, etc.)
   SYSTEM: Marks 12 lines with red background + ⚠ 404 badge

4. SYSTEM: Model loads (partial - some primitives missing)
   STATUS: "⚠ 12 missing part(s) - check red lines"

5. USER: Scrolls editor, sees red-highlighted problem lines
   USER: Hovers → Tooltip shows "Missing part: 8/3-8cylo.dat"
```

### Scenario 2: Multi-Selection Copy

```
1. USER: Cmd+Click lines 10, 15, 20, 25
   SYSTEM: Blue glow on all 4 lines

2. USER: Cmd+C
   SYSTEM: "✓ Copied selection (4 lines)"

3. USER: Pastes in external editor
   RESULT: All 4 lines copied in order!
```

### Scenario 3: Compile with Missing Parts

```
1. USER: Cmd+S to compile
   SYSTEM: Full-screen overlay "Compiling MPD..."

2. SYSTEM: Parses 210 lines
   SYSTEM: Overlay updates "Building 3D geometry..."

3. SYSTEM: Loads model, detects 404 errors
   SYSTEM: Highlights problem lines with ⚠ 404

4. SYSTEM: Overlay disappears
   STATUS: "⚠ 8 missing part(s) - check red lines"

5. USER: Can immediately see which lines have problems
```

---

## Technical Details

### Loading Overlay HTML

```html
<div id="loading">
    <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
        <div class="loading-subtext">Please wait...</div>
    </div>
</div>
```

### CSS Classes

- `.loading-spinner` → Animated spinner
- `.loading-text` → Main message (16px, accent color)
- `.loading-subtext` → Detailed message (12px, secondary color)
- `#loading.active` → Visible (display: flex)

### When Overlay Shows/Hides

**Shows:**
- `compile()` → Start of compilation
- `loadManualText()` → Start of 3D load
- `loadLibraryCatalog()` → Start of library load

**Hides:**
- After `loadManualText()` completes
- After `compile()` completes
- After library catalog loads
- On error

---

## Benefits

✅ **Clear System Status** → User always knows what's happening  
✅ **No More "Frozen" Feeling** → Loading overlay shows progress  
✅ **Error Visibility** → Red lines + 404 badges show problems  
✅ **Better Copy UX** → "Copy Selection" is clearer  
✅ **Debugging Aid** → Instantly see which lines reference missing parts  
✅ **Professional Feel** → Smooth animations, clear feedback  

---

## Example Console Output

```
[COMPILE] Tracked 68 part lines for click-to-highlight
📝 Compiling 210 enabled lines...
[LOAD] Original lines: 210 → Cleaned: 192
[WAG] Load result: gs {uuid: '...', name: '', type: 'Group', ...}
[404 ERRORS] Missing 12 primitive parts
[WAG] Camera fitted to model
✓ Compiled successfully!
```

**With 404s:**
```
[404 ERRORS] Missing 12 primitive parts
⚠ 12 missing part(s) - check red lines
```

**Highlighted lines in editor:**
```
Line 45:  1 4 100 0 40 ... 3070b.dat  [⚠ 404]  ← Red background
Line 67:  1 7 -60 0 80 ... 3062b.dat  [⚠ 404]  ← Red background
```

---

## Summary

**Loading is no longer awkward!**
- Full-screen overlay with spinner
- Progress text updates
- Auto-hides when done

**Errors are visible!**
- Red-highlighted lines
- ⚠ 404 badges
- Hover tooltips
- Status bar warnings

**Copy is clearer!**
- "Copy Selection" instead of "Copy line(s)"
- Handles singular/plural gracefully

**Test now:**
1. Refresh page
2. Paste mars-rover.mpd
3. Watch loading overlay!
4. See red lines with 404 badges!
5. Cmd+Click multiple lines
6. Cmd+C → "✓ Copied selection (5 lines)"

**No more awkward loading! 🚀**
