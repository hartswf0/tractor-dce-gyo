# 💚 Grace Parts Browser

## What This Solves

> "can we allow us to view in the scene selector or in a copy of wag-grace all of the parts from ldraw-parts-manifest.json is this not the real way to make sure we have the parts?"

**YES! You're absolutely right!**

The Parts Browser loads the actual `ldraw-parts-manifest.json` file so you can **see exactly which parts exist** before using them in your MPD files.

---

## 🎯 The Problem

**Before**:
```
You: "I want to use u9107p04c01.dat (Fabuland raccoon)"
Grace: *Crashes with null error*
You: "Does this part even exist?"
Grace: "¯\_(ツ)_/¯"
```

**After**:
```
You: Open Parts Browser
Browser: Shows all 23,511 parts
You: Search "raccoon"
Browser: Shows which raccoon parts exist (if any)
You: Click part → Copy LDraw line
Grace: Loads it perfectly!
```

---

## ✅ What You Get

### **1. Browse All Available Parts**
- **23,511+ parts** from the official LDraw library
- Organized by category (Parts, Primitives, etc.)
- See exactly what exists before using it

### **2. Search Everything**
Search by:
- Part number: "3001", "3003", "u9107"
- Description: "brick", "minifig", "wheel", "raccoon"
- Author name: "Philo", "Steffen"

### **3. Part Details**
For each part, see:
- **Filename**: `3001.dat`
- **Description**: "Brick 2 x 4"
- **Full path**: `parts/3001.dat`
- **Category**: Parts
- **File size**: 1024 bytes
- **Author**: Whoever created it

### **4. Copy LDraw Lines**
Click "📋 Copy LDraw Line" to get:
```
1 16 0 0 0 1 0 0 0 1 0 0 0 1 parts/3001.dat
```
Ready to paste into your MPD!

---

## 🚀 How To Use

### **Open the Browser**
From the manifest:
```
TOOLS → 💚 PARTS BROWSER
```

Or direct:
```
http://localhost:8000/wag-viewer-prime-integration-20251112-055341 copy/parts-browser.html
```

### **Search for Parts**
1. Type in search box: "brick", "wheel", "minifig"
2. See matching parts instantly
3. First 500 results shown (refine search to see more)

### **View Part Details**
1. Click any part in the list
2. See full details on the right
3. Shows path, description, author, size

### **Copy to Grace**
1. Click "📋 Copy LDraw Line"
2. Opens Grace Editor
3. Paste the line (Ctrl+V)
4. Part loads perfectly!

---

## 💡 Real Example

### **Finding Basic Bricks**:
```
1. Open Parts Browser
2. Search: "brick 2 x 4"
3. See: 3001.dat - Brick 2 x 4
4. Click it
5. Copy line:
   1 16 0 0 0 1 0 0 0 1 0 0 0 1 parts/3001.dat
6. Paste in Grace
7. Change color: 1 4 (red) or 1 14 (yellow)
8. Change position: 1 4 -40 0 0 ...
9. Compile → Perfect brick!
```

### **Finding Minifig Parts**:
```
1. Search: "minifig torso"
2. See all torso variants
3. Pick one you like
4. Copy line
5. Build your minifig!
```

### **Checking If Part Exists**:
```
1. Search: "u9107p04c01" (Fabuland raccoon)
2. Results: 0 parts found
3. Conclusion: Part doesn't exist in library!
4. Use Parts Browser to find alternatives
```

---

## 🔍 What The Manifest Contains

### **Categories**:
- **Parts** (23,511 files) - Regular building parts
- **Primitives** (P folder) - Low-level geometry
- **Subparts** (S folder) - Part components
- **Models** (Complete builds)

### **Part Information**:
```json
{
  "filename": "3001.dat",
  "path": "parts/3001.dat",
  "relativePath": "parts/3001.dat",
  "size": 1024,
  "name": "3001.dat",
  "description": "Brick 2 x 4",
  "author": "James Jessiman [Jessiman]"
}
```

---

## 🎨 Interface

### **Left Panel - Parts List**:
```
┌─────────────────────────┐
│ 3001.dat                │ ← Click to select
│ Brick 2 x 4             │
├─────────────────────────┤
│ 3003.dat                │
│ Brick 2 x 2             │
├─────────────────────────┤
│ 3004.dat                │
│ Brick 1 x 2             │
└─────────────────────────┘
```

### **Right Panel - Part Details**:
```
┌─────────────────────────────────────┐
│ 3001.dat                            │
├─────────────────────────────────────┤
│ Description: Brick 2 x 4            │
│ Path: parts/3001.dat                │
│ Category: Parts                     │
│ Size: 1024 bytes                    │
│ Author: James Jessiman              │
│                                     │
│ [📋 Copy LDraw Line]                │
│                                     │
│ Use in MPD:                         │
│ 1 16 0 0 0 1 0 0 0 1 0 0 0 1 ...   │
└─────────────────────────────────────┘
```

### **Header - Search & Filter**:
```
┌──────────────────────────────────────────────────────┐
│ 💚 Grace Parts Browser                                │
│ [Search...] [Category ▼] 23,511 / 23,511 parts      │
└──────────────────────────────────────────────────────┘
```

---

## 📊 Why This Matters

### **Before Parts Browser**:
```
You: Try part → Crash
You: Try another → Crash
You: Try another → Works!
You: "Why did the first two crash?"
Grace: "¯\_(ツ)_/¯"
```

### **After Parts Browser**:
```
You: Search in browser → Part doesn't exist
You: Find alternative that does exist
You: Copy line → Paste in Grace
Grace: Loads perfectly! 💚
```

---

## 🔧 Technical Details

### **Data Source**:
- Reads: `ldraw-parts-manifest.json`
- Generated: November 10, 2025
- Total parts: 23,511
- Root: `./ldraw/`

### **Search Performance**:
- Instant search (no lag)
- Searches filename + description
- Shows first 500 results
- Refine search to see more

### **No 3D Viewer**:
- Currently shows part INFO only
- No 3D preview yet (would slow down browsing)
- Future: Could add 3D preview on click

---

## 💡 Use Cases

### **1. Building From Scratch**:
```
Need: Wheels for vehicle
Search: "wheel"
Find: Multiple wheel types
Pick: The one you want
Copy: LDraw line
Build: Perfect vehicle!
```

### **2. Verifying Parts Exist**:
```
Have: Old MPD file with errors
Open: Parts Browser
Search: Each part name
Find: Which parts don't exist
Replace: With alternatives
Fix: All errors gone!
```

### **3. Exploring Library**:
```
Wonder: What minifig parts exist?
Search: "minifig"
Discover: Hundreds of variants
Get Ideas: For your builds
Learn: LDraw library structure
```

### **4. Finding Alternatives**:
```
Want: Fabuland raccoon (doesn't exist)
Search: "animal"
Find: Other animal parts
Choose: One that exists
Build: Working scene!
```

---

## 🎯 Workflow Integration

### **Parts Browser → Grace Editor**:
```
1. Open Parts Browser
2. Search for parts you need
3. Click part
4. Copy LDraw line
5. Open Grace Editor
6. Paste line (Ctrl+V)
7. Edit coordinates/colors
8. Compile → See result!
```

### **Typical Workflow**:
```
Plan:
├─ "I want to build a vehicle"
├─ Open Parts Browser
├─ Search "wheel" → Find wheels
├─ Search "chassis" → Find base
├─ Search "seat" → Find seats
└─ Copy all lines

Build:
├─ Open Grace Editor
├─ Paste all parts
├─ Arrange with coordinates
├─ Batch edit positions (Cmd+E)
├─ Compile → See vehicle!
└─ Iterate until perfect

Share:
└─ Copy All → Share MPD!
```

---

## ✨ Summary

**What It Does**:
✅ Shows all 23,511+ available LDraw parts  
✅ Search by name, description, author  
✅ See full details for each part  
✅ Copy LDraw lines ready to paste  
✅ Verify parts exist before using  

**Why It Matters**:
✅ No more guessing if parts exist  
✅ No more crashes from missing parts  
✅ Faster building (find parts quickly)  
✅ Learn what's in the library  
✅ Grace can gracefully handle what exists  

**How To Access**:
✅ From index: TOOLS → 💚 PARTS BROWSER  
✅ Direct URL: `/parts-browser.html`  
✅ Use before building in Grace  

---

💚 **Now you can SEE what parts exist before trying to use them!**
