# MPD Structure Guide - How to Make Files That Actually Work!

## ❌ What DOESN'T Work: External .ldr Files

```ldraw
0 FILE scene.mpd
1  16    0    0    0    1  0  0    0  1  0    0  0  1    minifig-01.ldr  ← 404 ERROR!
```

**Problem**: The loader tries to find `minifig-01.ldr` as a separate file → **404 Not Found**

## ✅ What WORKS: ONE BIG MPD with Embedded Subfiles

```ldraw
0 FILE scene.mpd
0 Name: My Scene
0 Author: You

0 MAIN SCENE - References subfiles defined below
1  16    0    0    0    1  0  0    0  1  0    0  0  1    minifig-01.ldr  ← This works!
1  72    0    0    0    1  0  0    0  1  0    0  0  1    parts/3024.dat  ← Direct part

0 STEP
0 NOFILE


0 FILE minifig-01.ldr  ← Subfile defined INSIDE same MPD
0 Name: My Minifig
1  28    0  -84    0    1  0  0    0  1  0    0  0  1    parts/3626bp01.dat
1  28    0  -60    0    1  0  0    0  1  0    0  0  1    parts/973c01.dat
1  28  -15.552  -51  0    1  0  0    0  1  0    0  0  1    parts/3818.dat
1  28   15.552  -51  0    1  0  0    0  1  0    0  0  1    parts/3819.dat
1  28    0  -28    0    1  0  0    0  1  0    0  0  1    parts/3815.dat
1  28   -6  -16    0    1  0  0    0  1  0    0  0  1    parts/3816.dat
1  28    6  -16    0    1  0  0    0  1  0    0  0  1    parts/3817.dat
0 NOFILE  ← Ends this subfile
```

## Key Rules

### 1. **ONE BIG MPD File**
Everything must be in **one `.mpd` file** - no separate `.ldr` files

### 2. **Main Scene First**
```ldraw
0 FILE yourfile.mpd
... main scene here ...
0 STEP
0 NOFILE
```

### 3. **Subfiles After NOFILE**
```ldraw
0 FILE subfile-name.ldr
... subfile contents ...
0 NOFILE

0 FILE another-subfile.ldr
... more contents ...
0 NOFILE
```

### 4. **Parts Must Have `parts/` Prefix**
```ldraw
✅ parts/3626bp01.dat
❌ 3626bp01.dat  ← Missing prefix, won't load!
```

## Structure Template

```ldraw
0 FILE myproject.mpd
0 Name: My Project
0 Author: Me
0 BFC CERTIFY CCW

0 ═══════════════════════════════════════════════════
0 MAIN SCENE
0 ═══════════════════════════════════════════════════

0 Floor
1  72    0    0    0    1  0  0    0  1  0    0  0  1    parts/3024.dat

0 Character 1 - Uses subfile
1  16  -50    0    0    1  0  0    0  1  0    0  0  1    character-red.ldr

0 Character 2 - Uses subfile  
1  16   50    0    0    1  0  0    0  1  0    0  0  1    character-blue.ldr

0 STEP
0 NOFILE


0 ═══════════════════════════════════════════════════
0 SUBFILE DEFINITIONS
0 ═══════════════════════════════════════════════════

0 FILE character-red.ldr
0 Name: Red Character
1  4    0  -84    0    1  0  0    0  1  0    0  0  1    parts/3626bp01.dat
1  4    0  -60    0    1  0  0    0  1  0    0  0  1    parts/973c01.dat
1  4  -15.552  -51  0    1  0  0    0  1  0    0  0  1    parts/3818.dat
1  4   15.552  -51  0    1  0  0    0  1  0    0  0  1    parts/3819.dat
1  4    0  -28    0    1  0  0    0  1  0    0  0  1    parts/3815.dat
1  4   -6  -16    0    1  0  0    0  1  0    0  0  1    parts/3816.dat
1  4    6  -16    0    1  0  0    0  1  0    0  0  1    parts/3817.dat
0 NOFILE

0 FILE character-blue.ldr
0 Name: Blue Character
1  1    0  -84    0    1  0  0    0  1  0    0  0  1    parts/3626bp01.dat
1  1    0  -60    0    1  0  0    0  1  0    0  0  1    parts/973c01.dat
1  1  -15.552  -51  0    1  0  0    0  1  0    0  0  1    parts/3818.dat
1  1   15.552  -51  0    1  0  0    0  1  0    0  0  1    parts/3819.dat
1  1    0  -28    0    1  0  0    0  1  0    0  0  1    parts/3815.dat
1  1   -6  -16    0    1  0  0    0  1  0    0  0  1    parts/3816.dat
1  1    6  -16    0    1  0  0    0  1  0    0  0  1    parts/3817.dat
0 NOFILE
```

## Working Examples

### ✅ `hello-world.mpd`
- Main scene + inline minifigs
- All parts have `parts/` prefix
- **WORKS PERFECTLY**

### ✅ `monkey-data-center-working.mpd`  
- Main scene references subfiles
- Subfiles embedded in same MPD
- All parts have `parts/` prefix
- **WORKS PERFECTLY**

### ✅ `minifig-configurator.mpd`
- 8 minifig subfiles embedded
- Can be imported by other MPDs
- All parts have `parts/` prefix
- **WORKS PERFECTLY**

### ❌ `monkey-data-center-components.mpd` (OLD VERSION)
- References external `.ldr` files
- Those files don't exist
- **404 ERRORS - BROKEN!**

## How to Fix Broken Files

### Step 1: Run MPD Validator
```
Open mpd-validator.html
Drop your .mpd file
See which .ldr references are missing
```

### Step 2: Convert to ONE BIG MPD
```
1. Keep main scene at top
2. Add 0 NOFILE after main scene
3. Copy each .ldr subfile contents below
4. Wrap each with:
   0 FILE subfile-name.ldr
   ... contents ...
   0 NOFILE
```

### Step 3: Add `parts/` Prefix
```
Find all lines like:
1  16  ...  3626bp01.dat

Replace with:
1  16  ...  parts/3626bp01.dat
```

### Step 4: Test in Grace Editor
```
Load in Grace Editor
See pink placeholders for any remaining issues
Check Grace Report in console
Fix remaining problems
```

## Grace Editor Benefits

When you use Grace Editor:
- **Loads what works** even with some errors
- **Shows pink cubes** where parts are missing
- **Console report** lists all problems with line numbers
- **Can still edit** and fix issues while viewing
- **No more frustration** from empty scenes!

## Summary

**The Golden Rule**: Everything in ONE MPD file!

**Why Your Files Were Broken**:
- Tried to reference separate `.ldr` files
- Those files don't exist as separate files
- Loader returned 404 → empty scene

**How to Fix**:
1. ONE BIG MPD file
2. Embed all subfiles inside
3. Use `parts/` prefix for all parts
4. Test in Grace Editor (forgiving) or Gold Editor (strict)

**Working Files to Copy From**:
- `hello-world.mpd` - Inline approach
- `monkey-data-center-working.mpd` - Subfile approach
- `minifig-configurator.mpd` - Library approach

---

💚 **Remember**: The machine of loving grace will help you even when things break!
