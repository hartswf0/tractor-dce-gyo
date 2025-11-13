# Silver Editor Debugging Tests

## 🔍 Changes Made

### **1. Virtual Path Matching**
Now extracts the filename from the MPD's `0 FILE` declaration and passes it as the `virtualPath` parameter:

```javascript
// Before:
await STATE.primeViewer.loadText(mpdText, { filename: 'editor-model.mpd' });
// virtualPath defaulted to 'manual-input.ldr'

// After:
const fileMatch = firstLine.match(/^0\s+FILE\s+(\S+)/i);
const virtualPath = fileMatch ? fileMatch[1] : 'editor-model.mpd';
await STATE.primeViewer.loadText(mpdText, { filename: virtualPath }, virtualPath);
// virtualPath matches FILE declaration!
```

### **2. Debug Logging Added**
Console will now show:
- MPD text length
- First 200 characters
- Virtual path being used
- Loader path configuration
- Model wrapper details
- Number of children in loaded model

## 🧪 Test Cases

### **Test 1: hello-world.mpd (Known Working)**

```bash
open wag-silver-editor.html
# Load hello-world.mpd
```

**Expected Console:**
```
🎨 Initializing Prime Viewer Engine...
✓ Prime Viewer Engine ready!
Using MPD-declared filename: hello_world_tutorial.mpd
MPD Text length: ~15000
First 200 chars: 0 FILE hello_world_tutorial.mpd...
Using virtualPath: hello_world_tutorial.mpd
Loader path: ./ldraw/
🎨 Rendering with Prime Viewer Engine...
✓ Model loaded: {...}
✓ Prime Viewer rendered successfully
Model children: 374
```

**Expected Visual:**
- ✅ Real minifigs with heads/torsos/legs
- ✅ "HELLO WORLD" tiles
- ✅ Three characters (red, green, blue)

### **Test 2: barbie-jeep.mpd (Currently Failing)**

```bash
# Still in Silver Editor
# Load barbie-jeep.mpd
```

**Check Console For:**

**If it shows:**
```
Using MPD-declared filename: barbie_jeep_300pc.mpd
MPD Text length: ~12000
Loader path: ./ldraw/
✓ Prime Viewer rendered successfully
Model children: 66
```
**→ SUCCESS!** The virtualPath fix worked!

**If it still shows:**
```
❌ Loaded model is empty
Model children: 0
```
**→ Check network tab for 404 errors on parts**

## 🔎 Debugging Steps

### **Step 1: Check Network Tab**

Open browser DevTools → Network tab → Filter: `ldraw`

**Look for:**
- ✅ 200 responses for `ldraw/parts/*.dat`
- ✅ 200 responses for `ldraw/p/8/*.dat` (primitives)
- ❌ 404 errors mean ldraw isn't accessible

### **Step 2: Check Console Logs**

**Good signs:**
```
✓ LDrawLoader available - real geometry enabled!
✓ Prime Viewer Engine ready!
Using MPD-declared filename: [matches FILE line]
✓ Prime Viewer rendered successfully
Model children: [number > 0]
```

**Bad signs:**
```
❌ Loaded model is empty
Model children: 0
404: ldraw/parts/...
```

### **Step 3: Verify ldraw Directory**

```bash
# In terminal:
ls -la ldraw/parts/3001.dat
# Should show file, not "No such file"

curl http://127.0.0.1:5501/ldraw/parts/3001.dat
# Should return file contents, not 404
```

### **Step 4: Compare with Viewer-Prime**

```bash
# Open viewer-prime
open "wag-viewer-prime-integration-20251112-055341 copy/wag-viewer-prime.html"

# Paste barbie-jeep.mpd content in Manual Loader
# Click "Load Pasted"
```

**If viewer-prime works:**
- ✅ ldraw files are accessible
- ✅ MPD format is correct
- ❌ Issue is Silver-specific (parsing difference)

**If viewer-prime also fails:**
- ❌ MPD format issue
- ❌ Missing parts in ldraw library

## 🐛 Known Issues & Solutions

### **Issue 1: Symlink Not Followed**
**Symptom:** 404 errors on all ldraw files
**Solution:** Already fixed - ldraw is now a real directory

### **Issue 2: virtualPath Mismatch**
**Symptom:** "Loaded model is empty" even though parts load
**Solution:** Just implemented - now matches FILE declaration

### **Issue 3: Missing Primitives**
**Symptom:** Parts load but primitives (8/3-8cylo.dat) return 404
**Check:** 
```bash
ls ldraw/p/8/3-8cylo.dat
# Should exist!
```

### **Issue 4: CORS/Server Configuration**
**Symptom:** CORS errors in console
**Solution:** Ensure Live Server is serving from DCE-GYO root

## 📊 Expected Results

| File | Primitive | Bronze | Silver (Fixed) |
|------|-----------|--------|----------------|
| **hello-world.mpd** | ⚠️ Boxes | ✅ Real minifigs | ✅ Real minifigs |
| **barbie-jeep.mpd** | ⚠️ Boxes | ✅ Real Jeep | 🔄 Testing now! |
| **all_watched_over.mpd** | ✅ Pure geometry | ✅ Pure geometry | ❌ Needs type 1 lines |

## 🎯 What to Report Back

After testing, report:

1. **hello-world.mpd in Silver:**
   - ✅ Works / ❌ Fails
   - Console logs (first 10 lines)
   - Network tab: any 404s?

2. **barbie-jeep.mpd in Silver:**
   - ✅ Works / ❌ Fails
   - Console logs
   - "Model children:" count
   - Any 404s in network tab?

3. **Comparison with viewer-prime:**
   - Does barbie-jeep.mpd work in viewer-prime?
   - Same error or different?

## 💡 Next Steps Based on Results

**If both work now:**
🎉 SUCCESS! The virtualPath fix solved it!

**If hello-world works but barbie-jeep fails:**
→ Issue is specific to barbie-jeep.mpd structure
→ Check for special characters or formatting

**If both fail:**
→ Issue is more fundamental (ldraw access, loader config)
→ Need to check server/path configuration

**If viewer-prime works but Silver doesn't:**
→ Parse difference between direct call and editor integration
→ May need to adjust how we prepare the MPD text

---

**Test now and report back what you see in the console!** 🔍
