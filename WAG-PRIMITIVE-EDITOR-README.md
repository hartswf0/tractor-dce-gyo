# WAG Primitive Editor

**A minimal, professional MPD (LDraw Multi-Part Document) editor with 3D preview and multi-scene management.**

## 🎯 Core Features

### **MPD Editor (Left Panel)**
- Line-by-line editing with click-to-edit
- Lock lines (orange) to protect parts
- Undo/redo (50-step history)
- Auto-compile on blur
- Context menu: duplicate, move, delete, lock
- MPD minimap sidebar with viewport indicator
- Color-coded line types: part/comment/empty/locked

### **3D Viewer (Right Panel)**
- Real-time Three.js rendering
- Box primitives (20×8×20 LDU)
- Click 3D piece → highlights MPD line
- OrbitControls (drag to rotate, scroll to zoom)
- Wireframe/axes/grid toggles
- Theme-synced background (dark/light/terminal green)

### **Multi-Scene Management**
- Scene dots overlay on right edge (⭕)
- Click dot = instant teleport between scenes
- Each scene = independent MPD with history
- Hover dot = shows tooltip (name + line count)
- [+] button to create new scenes
- × to close scenes (keeps minimum 1)

### **Resilient Error Handling** ⚠️
- **Warning button (⚠️) only appears when errors exist**
- Click to copy all errors to clipboard
- Fallback wireframe boxes for missing parts
- Magenta wireframe = missing/error placeholder
- Full error logging with context + stack traces
- Mobile-friendly copy (textarea fallback)

### **Enhanced Grid Displays**

**2D Grid View:**
- 9×9 cells with proper sizing (max 800×800px)
- Coordinates in top-left of each cell
- Part count shown large (18px bold)
- Color info: "Color 1,4" (multiple colors per cell)
- Color-coded borders and backgrounds
- Centered with padding for readability

**Minimap (Top-Right):**
- 9×9 overview of occupied cells
- Part count overlaid on each cell
- Pulsing animation for active cells
- Tooltip shows part count
- Better contrast (black background, blue glow)

## 📦 GitHub Pages Deployment

### **Will This Work Online?**

**YES** - The editor HTML file will work perfectly on GitHub Pages!

**However - Part Library Issue:**
```
❌ PROBLEM: MPD files reference parts like "parts/3001.dat"
❌ These are external files from LDraw Parts Library (~10MB)
❌ Your repo doesn't include them = 404 errors = magenta boxes
```

### **Solutions:**

#### **Option 1: Fallback Boxes (Current)**
```javascript
// Already implemented!
try {
  // Render normal part
} catch (error) {
  // Show magenta wireframe placeholder
  // Log error with part name
  // Continue rendering other parts
}
```

**Result:** Editor works, shows magenta wireframes for real parts, no crashes!

#### **Option 2: Include Parts Library**
```bash
# Clone LDraw library
git clone https://github.com/LDraw/ldraw-parts-library
cd ldraw-parts-library

# Copy to your repo
cp -r parts/ /Users/gaia/DCE-GYO/parts/
```

**Result:** Real 3D models render! (But adds 10MB to repo)

#### **Option 3: Use CDN (Future)**
```javascript
// Modify loadPart() to fetch from CDN
const PARTS_CDN = 'https://cdn.ldraw.org/parts/';
const partData = await fetch(PARTS_CDN + partName);
```

**Result:** No repo bloat, real parts load online!

### **GitHub Pages Setup**

1. **Push to GitHub:**
```bash
cd /Users/gaia/DCE-GYO
git init
git add wag-primitive-editor.html
git commit -m "Add WAG Primitive Editor"
git remote add origin https://github.com/YOUR-USERNAME/wag-primitive
git push -u origin main
```

2. **Enable Pages:**
- Go to repo Settings → Pages
- Source: Deploy from branch `main`
- Folder: `/ (root)`
- Save

3. **Access:**
```
https://YOUR-USERNAME.github.io/wag-primitive/wag-primitive-editor.html
```

## 🧪 Testing with Real MPD Files

### **You Created:**
1. `barbie-jeep.mpd` - 300-piece vehicle (pink Jeep)
2. `mars-rover.mpd` - 50-piece probe (NASA-style)

### **What Happens When You Load Them:**

**With fallback rendering (current):**
```
✓ MPD loads successfully
✓ All lines appear in editor
✓ Can edit/lock/move lines
✓ 3D view shows magenta wireframe boxes
✓ Correct positions (X/Y/Z from MPD)
✓ Click box → highlights line
⚠️ No actual geometry (missing parts library)
```

**Example - Barbie Jeep:**
```
parts/3703.dat (Technic Brick 1×16) → magenta wireframe box
parts/4624.dat (Wheel rim) → magenta wireframe box
parts/3641.dat (Tire) → magenta wireframe box
```

**Why This Is Actually Useful:**
- Positions are correct!
- Scale is correct!
- You can verify structure/layout
- Edit lines and see changes
- Export working MPD file
- Open in LeoCAD/Studio later for real rendering

### **To Get Real Rendering:**

**Option A: Desktop Apps (Recommended)**
- **LeoCAD** (free): leocad.org
- **BrickLink Studio** (free): bricklink.com/studio
- **LDView** (free): ldview.sourceforge.net

Load your MPD → See full 3D model with textures!

**Option B: Add Parts to Repo**
```bash
# Download LDraw library
curl -O https://library.ldraw.org/library/ldrawlib/complete.zip
unzip complete.zip
cp -r ldraw/parts /Users/gaia/DCE-GYO/parts/
```

Now your editor will load real geometry!

## 🎯 Why "Primitive" Editor?

### **Primitive Boxes vs Real Geometry**

**This editor uses simple 20×8×20 LDU box primitives for ALL parts:**

```javascript
// Every part = simple box
const geometry = new THREE.BoxGeometry(20, 8, 20);
```

**Why boxes instead of real LEGO shapes?**
1. ⚡ **Fast** - No geometry loading, instant render
2. ✅ **Consistent** - Every part same size, easy to see
3. 🎯 **Structural** - Shows positions/layout, not appearance
4. 📦 **Reliable** - Always works without parts library
5. ✏️ **Editor-focused** - For editing structure, not final visuals

**For beautiful rendering with real minifigure heads/torsos/legs:**
- Use **wag-viewer-prime.html** (has full LDraw geometry)
- Or desktop apps: LeoCAD, BrickLink Studio, LDView

### **Comparison:**

**hello-world.mpd in Primitive Editor:**
```
🔴 Red character = 6 red boxes stacked
🟢 Green character = 6 green boxes stacked
🔵 Blue character = 6 blue boxes stacked
"HELLO WORLD" = ~100 small boxes on ground
```

**hello-world.mpd in Viewer Prime:**
```
🔴 Red character = actual minifigure with head/torso/arms/legs
🟢 Green character = actual minifigure with proper geometry
🔵 Blue character = actual minifigure with face details
"HELLO WORLD" = letter-shaped tiles on baseplate
```

**Both are correct!** Different tools, different purposes.

## 🎨 UI/UX Philosophy

### **Efficiency (Requested)**
- **Scene dots**: Like thousand-tetrad's timeline
- **Warning button**: Only when needed
- **Click-to-teleport**: No menus, instant switch
- **Minimap counts**: See density at a glance
- **2D grid fills space**: No max-width, uses full panel
- **Grid info**: Coordinates + count + colors per cell

### **Symmetry**
```
MPD Editor (Left)         3D Viewer (Right)
├─ Minimap (right edge)   ├─ Scene dots (right edge)
├─ Line boxes             ├─ Part boxes (primitives)
├─ Viewport indicator     ├─ 9×9 grid overlay
└─ Scroll container       └─ Orbit controls
```

### **Mobile-Friendly**
- Large tap targets (32px dots)
- Warning button (flex display)
- Textarea fallback for copy
- Responsive grid sizing
- Safe-area padding

## 🔧 Technical Architecture

### **State Management**
```javascript
STATE = {
  scenes: [
    {
      name: 'example',
      lines: ['0 FILE...', '1 4 0 0 0...'],
      lockedLines: Set([2, 5, 8]),
      history: [...],
      historyIndex: 3
    }
  ],
  activeSceneIdx: 0,
  lockedLines: Set(),
  history: [],
  historyIndex: -1
}
```

### **Error Logging**
```javascript
ERROR_LOG = [
  {
    time: '2025-11-12T14:05:23.456Z',
    context: 'render3D',
    message: 'Missing part parts/3001.dat',
    stack: '...'
  }
]

// Shows warning button when length > 0
// Click → copies all to clipboard
```

### **Resilient Rendering**
```javascript
parts.forEach(part => {
  try {
    // Render normal geometry
  } catch (error) {
    logError(error, 'render3D');
    // Create magenta fallback wireframe
    // Continue to next part
  }
});
```

### **Multi-Scene Flow**
```
renderSceneDots()
    ↓
Creates dots 1, 2, 3...
    ↓
Active = blue glow
    ↓
Click dot → switchScene(idx)
    ↓
Save current scene state
    ↓
Load new scene lines/locks/history
    ↓
Render editor + 3D
    ↓
Update footer "Scene: name"
```

## 📊 Grid Improvements

### **Before (Out of Control):**
- Small cells, cramped
- No part count
- No color info
- Single color number
- Hard to read

### **After (Information Rich):**
```
Grid Cell Example:
┌──────────────┐
│ 2,3          │ ← Coordinates (top-left)
│              │
│      5       │ ← Part count (18px bold)
│  Color 1,4   │ ← Color IDs (10px)
└──────────────┘
  ↑ Border colored by first part color
  ↑ Background tinted with color
```

**Minimap:**
```
[●][●][○][○][○][○][○][○][○]
[●][3][2][○][○][○][○][○][○]
[○][○][○][○][○][1][○][○][○]
     ↑
  Part count overlaid (bold)
```

## 🚀 Next Steps

### **Phase 1: Documentation** ✓
- [x] README with deployment info
- [x] GitHub Pages instructions
- [x] MPD file explanation
- [x] UI/UX notes

### **Phase 2: Parts Library Integration**
- [ ] Add parts/ folder to repo
- [ ] Or implement CDN fetching
- [ ] Or document desktop app workflow

### **Phase 3: Advanced Features**
- [ ] Part search/filter
- [ ] Color palette picker
- [ ] Export to PNG (screenshot)
- [ ] Import from LDraw library
- [ ] Subfile support (nested MPD)

### **Phase 4: Community**
- [ ] Example MPD gallery
- [ ] Tutorial videos
- [ ] Contribution guide
- [ ] Issue templates

## 📝 Notes

### **Why MPD Format?**
- **Standard**: LDraw community uses it
- **Simple**: Plain text, easy to edit
- **Portable**: Works across all LDraw tools
- **Extensible**: Supports subfiles, comments, meta-commands

### **Why Primitive Boxes?**
- **Fast**: No geometry loading
- **Consistent**: Every part same size
- **Predictable**: Always renders
- **Useful**: Positions/scales are correct

### **When to Use Desktop Apps:**
- Final rendering with textures
- Complex models (1000+ parts)
- Export to other formats
- Photorealistic renders

### **When to Use WAG Editor:**
- Quick edits
- Line-level precision
- Multi-scene workflows
- Structure verification
- Learning MPD format

## 🐛 Known Issues

1. **Missing Parts** → Magenta wireframes (intended behavior)
2. **Large MPD files** → May slow down (browser memory limits)
3. **Complex geometry** → Not supported (primitive boxes only)

## 🔗 Resources

- **LDraw Official**: ldraw.org
- **Parts Library**: ldraw.org/library
- **LeoCAD**: leocad.org
- **BrickLink Studio**: bricklink.com/studio
- **MPD Format Spec**: ldraw.org/article/218.html

---

**Built with:** Three.js, OrbitControls, Web Clipboard API, CSS Grid

**License:** MIT (or your choice)

**Author:** Garden Uprising Collective

**Status:** Alpha - Functional with fallback rendering
