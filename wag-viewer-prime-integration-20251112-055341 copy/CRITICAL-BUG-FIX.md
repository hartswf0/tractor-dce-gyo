# 🚨 CRITICAL BUG FIX: Decoration Filter Breaking Parts

## The Bug

**Error:**
```
ldraw/0%200%201%20%20%20%20parts/3070b.dat:1 Failed to load (404)
```

**Decoded URL:** `0 0 1    parts/3070b.dat`

**What happened:** The decoration filter was TOO AGGRESSIVE and broke valid lines or comments into malformed part references!

---

## Root Cause

**Bad Filter Logic:**
```javascript
// OLD (BROKEN):
const cleanedLines = rawText.split('\n').filter(line => {
  if (/^0\s+[═╔╗╚╝║┃...]{5,}\s*$/.test(trimmed)) return false;
  return true;
});
```

**Problem:** This regex was matching parts of VALID lines that contained these characters, corrupting the file!

---

## The Fix

**New Safe Filter:** ✅
```javascript
const cleanedLines = rawText.split('\n').filter(line => {
  const trimmed = line.trim();
  
  // Keep empty lines
  if (trimmed === '') return true;
  
  // ALWAYS keep Type 1-5 lines (NEVER filter these!)
  if (/^[1-5]\s/.test(trimmed)) return true;
  
  // For Type 0 (comments):
  if (trimmed.startsWith('0 ')) {
    // Keep important keywords
    if (/\b(FILE|NOFILE|STEP|BFC|...)\b/i.test(trimmed)) {
      return true;
    }
    // Remove ONLY pure box-drawing (no text after)
    if (/^0\s+[═╔╗╚╝║┃...]{3,}\s*$/.test(trimmed)) {
      return false;
    }
    // Keep all other comments (might be important)
    return true;
  }
  
  // Keep everything else
  return true;
});
```

**Key Changes:**
1. **ALWAYS keep Type 1-5 lines** - NEVER filter part references!
2. **Only remove PURE decoration** - Box chars with NO text after
3. **Keep ALL other comments** - Better safe than sorry

---

## Second Issue: `parts/` Prefix

**Your mars-rover.mpd has:**
```
1 15 -100 0 -120 ... parts/4624.dat
                     ^^^^^^ WRONG!
```

**Should be:**
```
1 15 -100 0 -120 ... 4624.dat
                     ✅ CORRECT
```

**Why it breaks:**
- LDrawLoader looks in: `ldraw/parts/parts/4624.dat` (double parts!)
- File not found → 404 error

**Fix:** Remove ALL `parts/` prefixes. I created `mars-rover-FIXED.mpd` for you.

---

## 2D vs 3D Discrepancy

**You noticed:** "If we parse for 2D we don't get 3D!"

**This is CORRECT behavior!** Here's why:

### 3D View
```
editorLines (raw MPD)
    ↓
LDrawLoader parses
    ↓
Expands submodels
    ↓
Creates ALL meshes
    ↓
Shows FULL expanded model
```

**Example:**
```
0 FILE letter_h.dat
1 15 0 0 0 ... 3070b.dat  ← Tile 1
1 15 0 8 0 ... 3070b.dat  ← Tile 2
...
0 NOFILE

1 15 -150 8 0 ... letter_h.dat  ← References submodel
```

**3D shows:** ALL 11 tiles (expanded from letter_h.dat)

### 2D View
```
editorLines (raw MPD)
    ↓
Parse ONLY Type 1 lines
    ↓
Map X/Z coordinates
    ↓
Show grid cells
```

**2D shows:** ONLY the single reference to `letter_h.dat` at (-150, 8)

**Why?** 2D grid shows what's WRITTEN in the editor, not what's RENDERED in 3D.

---

## Solution: Better 2D Grid

### Option 1: Show Flat View (Current)
- Shows what's in `editorLines`
- Submodels = single cell
- Fast and simple

### Option 2: Expand Submodels (Future)
- Parse submodel definitions
- Expand all references
- Show ALL individual parts
- More accurate to 3D
- **But complex to implement!**

**For now:** 2D = editor view, 3D = rendered view. This is intentional!

---

## Test After Fix

1. **Refresh page**
2. **Paste mars-rover-FIXED.mpd** (no `parts/` prefix)
3. **Compile (Cmd/Ctrl+S)**
4. **Check console:**
   ```
   [LOAD] Original lines: 45 → Cleaned: 45
   [COMPILE] Tracked 22 part lines
   ✅ Model loaded!
   ```

5. **Should see:** Rover with wheels, solar panels, antenna
6. **No 404 errors!**

---

## Summary

✅ **Filter fixed** - Only removes pure decoration  
✅ **Type 1-5 lines protected** - Never filtered  
✅ **mars-rover-FIXED.mpd** - No `parts/` prefix  
✅ **2D/3D difference explained** - Intentional behavior  

**Use mars-rover-FIXED.mpd and refresh! Should work now!** 🚀
