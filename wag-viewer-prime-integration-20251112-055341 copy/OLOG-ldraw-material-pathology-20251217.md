# OLOG: LDraw Loader Material Pathology

**Date:** 2025-12-17  
**System:** WAG Courage Editor  
**Status:** IN PROGRESS - Workaround Applied  

---

## 1. INITIAL SYMPTOMS

### 1.1 Page Unresponsive
- Browser showed "Page Unresponsive" dialog when adding parts from catalog browser
- Entire UI would freeze for extended periods

### 1.2 404 Errors  
```
GET http://localhost:8080/catalogs/Other_30.mpd 404 (File not found)
```

### 1.3 Loader Crash
```
TypeError: Cannot read properties of undefined (reading 'push')
    at LDrawLoader.objectParse (LDrawLoader.js:1441:17)
```

### 1.4 Missing Visual Geometry
- Yellow control orbs visible (part overlays working)
- Actual LEGO geometry not rendering
- Only grid and axes visible

---

## 2. ROOT CAUSES IDENTIFIED

### 2.1 Heavy Computation on Hot Path
**Function:** `computeStudSkeletonAndPlanes()`  
**Problem:** Iterating through EVERY VERTEX of EVERY MESH on every compile  
**Impact:** Page freeze during model load

### 2.2 Overlapping Compiles
**Problem:** No guard against multiple simultaneous compiles  
**Impact:** Resource exhaustion, race conditions

### 2.3 Malformed Placeholder Content
**Problem:** Fetch interceptor creating placeholder MPD with emoji characters and missing `0 NOFILE` terminator  
**Impact:** LDrawLoader crash during parsing

### 2.4 Missing Scene Terminators
**Problem:** Default scene template missing `0 STEP` and `0 NOFILE`  
**Impact:** Parser confusion, incomplete geometry

### 2.5 Catalog Path Resolution
**Problem:** HTML in subdirectory, catalogs in parent - relative path `../catalogs/` failed from some server roots  
**Solution:** Created symlink `catalogs -> ../catalogs`

### 2.6 Material Assignment Failure (CURRENT)
**Symptom:**
```
[DEBUG] Mesh: visible: true material: undefined
[DEBUG] Model has 1 meshes with 160029 total vertices
```
**Problem:** LDrawLoader creating geometry but NOT assigning materials  
**Hypothesis:** LDrawLoader.parse() (text input) handles materials differently than LDrawLoader.load() (file input)

---

## 3. FIXES APPLIED

### 3.1 Remove Heavy Computation
```javascript
// REMOVED from loadManualText():
// computeStudSkeletonAndPlanes();
```

### 3.2 Add Compile Guard
```javascript
let compileInProgress = false;

async function compile() {
    if (compileInProgress) {
        console.log('[COMPILE] Skipping - compile already in progress');
        return;
    }
    compileInProgress = true;
    // ... compile logic ...
    compileInProgress = false;
}
```

### 3.3 Fix Placeholder Format
```javascript
const fakeData = `0 FILE ${partName}
0 Placeholder - Part not found
0 Name: ${partName}
0 Author: Grace Placeholder
0 !LDRAW_ORG Unofficial_Part
0 BFC CERTIFY CCW

4 494 -10 -10 -10  10 -10 -10  10 -10  10 -10 -10  10
// ... quad geometry ...

0 NOFILE
`;
```

### 3.4 Fix Scene Template
```javascript
lines: [
    `0 FILE wag_scene_${Date.now()}.mpd`,
    `0 Name: WAG Scene ${STATE.scenes.length + 1}`,
    '0 Author: WAG Courage Builder',
    '0 !LDRAW_ORG Model',
    '0 !LICENSE Redistributable under CCAL version 2.0',
    '0 BFC CERTIFY CCW',
    '0 ',
    '0 // Default starter brick - add more parts below!',
    '1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat',
    '0 ',
    '0 STEP',
    '0 NOFILE'
]
```

### 3.5 Material Fallback (WORKAROUND)
```javascript
// In beta-prime-engine.js finalizeGroup():
group.traverse(child => {
    if (child.isMesh && !child.material) {
        console.warn('[PRIME] Mesh missing material, applying fallback');
        child.material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            metalness: 0.1,
            roughness: 0.7
        });
    }
});
```

---

## 4. DIAGNOSTIC ADDITIONS

### 4.1 Debug Logging in loadManualText
```javascript
if (STATE.viewer && STATE.viewer.modelWrapper) {
    const wrapper = STATE.viewer.modelWrapper;
    let meshCount = 0;
    let totalVerts = 0;
    wrapper.traverse(obj => {
        if (obj.isMesh) {
            meshCount++;
            if (obj.geometry?.attributes?.position) {
                totalVerts += obj.geometry.attributes.position.count;
            }
            const matInfo = Array.isArray(obj.material) 
                ? `Array[${obj.material.length}]` 
                : (obj.material ? obj.material.type : 'undefined');
            console.log('[DEBUG] Mesh:', obj.name, 'visible:', obj.visible, 'material:', matInfo);
        }
    });
    console.log('[DEBUG] Model has', meshCount, 'meshes with', totalVerts, 'total vertices');
}
```

---

## 5. REMAINING INVESTIGATION

### 5.1 Why LDrawLoader.parse() Doesn't Create Materials
- THREE.LDrawLoader uses LDConfig.ldr for color definitions
- File exists at `./ldraw/LDConfig.ldr` (65KB)
- `preloadLDConfig()` is called during engine initialization
- Materials work when using `loader.load()` (file path)
- Materials undefined when using `loader.parse()` (text input)

### 5.2 Potential Solutions
1. **Ensure LDConfig preload completes** before parsing
2. **Manually assign materials** from LDConfig color map
3. **Use loader.load() with Blob URL** instead of parse()
4. **Debug LDrawLoader.parse()** to trace material creation

---

## 6. FILES MODIFIED

| File | Changes |
|------|---------|
| `wag-courage.html` | Compile guard, fixed scene template, debug logging |
| `beta-prime-engine.js` | Material fallback in finalizeGroup() |
| `catalogs/` | Symlink created → `../catalogs` |

---

## 7. COMPARISON: COURAGE vs GRACE

| Aspect | Grace (Working) | Courage (Broken) |
|--------|-----------------|------------------|
| LIBRARY_BASE | `./ldraw/` | `./ldraw/` |
| BetaPrimeEngine.create | Identical | Identical |
| loadManualText | Identical | + debug logging |
| computeStudSkeletonAndPlanes | Not present | Removed from hot path |

**Key Difference:** Both use same engine, but Courage has additional features (stud skeleton, part controls) that were causing issues.

---

## 8. TIMELINE

1. **Initial State:** Catalog loading crashes with "push" error
2. **Fix 1:** Correct catalog paths → Still 404s
3. **Fix 2:** Create symlink → Files accessible
4. **Fix 3:** Fix placeholder format → No more crashes
5. **Fix 4:** Remove computeStudSkeletonAndPlanes → No more freezes
6. **Fix 5:** Add compile guard → Stable compiles
7. **Current:** Geometry loads (160K verts) but material undefined → Gray fallback applied

---

## 9. NEXT STEPS

- [ ] Verify that models are now appearing correctly in the viewer after loading from the catalog browser and on initial load.
- [ ] Investigate LDrawLoader.parse() material creation
- [ ] Consider switching to Blob URL + loader.load() approach
- [ ] Test if preloadLDConfig race condition exists

---

## 10. UPDATE: Control Dots Fix (2025-12-17 16:15)

### 10.1 Problem
Control dots (cyan/red/green stud indicators) visible in `wag-brave.html` but NOT in `wag-courage.html`.

### 10.2 Root Cause
`computeStudSkeletonAndPlanes()` was removed from `loadManualText()` hot path to fix page freezing. Side effect: `STATE.studSkeleton` never populated → no data for dots.

### 10.3 Solution
Re-added the call but **DEFERRED by 500ms**:
```javascript
setTimeout(() => {
    try {
        computeStudSkeletonAndPlanes();
        console.log('[WAG] Deferred stud skeleton computed');
    } catch (e) {
        console.warn('[WAG] Deferred stud skeleton failed:', e);
    }
}, 500);
```

### 10.4 Tradeoff Table
| Approach | UI Freeze | Control Dots |
|----------|-----------|--------------|
| Sync call (wag-brave) | Yes | ✅ |
| No call (wag-courage v1) | No | ❌ |
| Deferred 500ms (wag-courage v2) | No | ✅ (after delay) |
