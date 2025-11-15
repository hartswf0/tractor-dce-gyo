# 📦 Grace Parts Catalog Generator

**Generates organized, human-readable MPD catalogs from the LDraw parts manifest.**

## 🎯 What This Solves

### ❌ Before (Browser-based):
- Downloaded 300+ files at once (browser nightmare)
- Parts stacked on top of each other
- No spatial awareness
- Hard to read/parse
- 50 parts per file (too dense)

### ✅ After (Node.js script):
- Generates to `/catalogs/` folder
- **Proper 3D spacing** - no overlaps!
- **Above grid line** (Y = -50, visible)
- **Human & machine readable**
- 30 parts per file (clearer)
- 6-column layout (wider spacing)
- **Smart grouping** by part type
- **Auto-updates Grace dropdown**

---

## 🚀 Usage

### Run the Generator:
```bash
node generate-part-catalogs.js
```

### Output:
```
📦 GRACE PARTS CATALOG GENERATOR

📖 Loading manifest...
✅ Loaded 23,511 parts

🔍 Analyzing part families...
📊 Found 1,234 part families
📊 Found 14 part types

🏗️  Generating catalogs by type...

  ✓ Brick: 1,250 parts → 42 catalog(s)
  ✓ Plate: 890 parts → 30 catalog(s)
  ✓ Slope: 450 parts → 15 catalog(s)
  ✓ Technic: 3,200 parts → 107 catalog(s)
  ✓ Wheel: 180 parts → 6 catalog(s)
  ✓ Minifig: 520 parts → 18 catalog(s)
  ...

✅ Generated 247 catalog files in /catalogs/

🔄 Updating Grace Editor dropdown...
✅ Grace Editor dropdown updated!
```

### Generated Files:
```
catalogs/
├── Brick_01.mpd          (30 brick parts)
├── Brick_02.mpd          (30 brick parts)
├── Plate_01.mpd          (30 plate parts)
├── Slope_01.mpd          (30 slope parts)
├── Technic_01.mpd        (30 technic parts)
├── Wheel_01.mpd          (30 wheel parts)
└── ...                   (247 files total)
```

---

## 📐 Layout Improvements

### Spacing (No More Overlaps!):
```
Grid Spacing:  200 LDU  (was 100 - doubled!)
Columns:       6        (was 10 - wider)
Y Offset:      -50 LDU  (above grid, visible)
Parts Per File: 30      (was 50 - clearer)
```

### Visual Layout:
```
Row 1:  [Part] [Part] [Part] [Part] [Part] [Part]
         ↓200   ↓200   ↓200   ↓200   ↓200   ↓200
Row 2:  [Part] [Part] [Part] [Part] [Part] [Part]
         ↓200   ↓200   ↓200   ↓200   ↓200   ↓200
Row 3:  [Part] [Part] [Part] [Part] [Part] [Part]
...

All parts at Y = -50 (above grid)
Centered on X axis
Spaced by Z rows
```

---

## 🧠 Smart Grouping

### Part Type Detection:
The script analyzes part names/filenames and groups by:

- **Brick** - Basic building blocks
- **Plate** - Thin plates
- **Tile** - Smooth tiles
- **Slope** - Angled pieces
- **Wedge** - Wedge shapes
- **Technic** - Technic system
- **Wheel** - Wheels & tires
- **Minifig** - Minifigure parts
- **Window** - Window pieces
- **Door** - Door pieces
- **Panel** - Panel pieces
- **Hinge** - Hinge mechanisms
- **Axle** - Axles
- **Connector** - Connectors
- **Other** - Uncategorized

### Part Family Extraction:
```javascript
"3001.dat"     → Family: 3001
"3001p01.dat"  → Family: 3001 (pattern variant)
"3001d01.dat"  → Family: 3001 (decorated variant)
```

All variants of a part grouped together!

---

## 📄 MPD File Format

Each catalog is **human & machine readable**:

```ldraw
0 FILE Brick_01.mpd
0 Name: Brick Catalog Part 1/42
0 Author: Grace Parts Catalog Generator
0 !LDRAW_ORG Model
0 !LICENCE Redistributable under CCAL version 2.0
0 BFC CERTIFY CCW
0 //
0 // ╔════════════════════════════════════════════════════════════╗
0 // ║  PARTS CATALOG: BRICK                                      ║
0 // ║  Showing 30 parts in 6-column grid                         ║
0 // ║  Spacing: 200 LDU | Above grid: 50 LDU                     ║
0 // ╚════════════════════════════════════════════════════════════╝
0 //

0 STEP

0 // ═══════════════════════════════════════════════════════════
0 // PART 01: Brick 1 x 1
0 // File: parts/3005.dat
0 // Position: (-500, -50, 0)
0 // Desc: Basic building block
0 // ═══════════════════════════════════════════════════════════
1 1 -500 -50 0 1 0 0 0 1 0 0 0 1 parts/3005.dat

0 // ═══════════════════════════════════════════════════════════
0 // PART 02: Brick 1 x 2
0 // File: parts/3004.dat
0 // Position: (-300, -50, 0)
0 // Desc: Two-stud brick
0 // ═══════════════════════════════════════════════════════════
1 4 -300 -50 0 1 0 0 0 1 0 0 0 1 parts/3004.dat

... (28 more parts)

0 STEP
0 NOFILE
```

### Features:
- ✅ **Box-drawn headers** - Easy to spot
- ✅ **Part metadata** - Name, file, position, description
- ✅ **Clear separators** - Boxes around each part
- ✅ **Color cycling** - Different colors for visual distinction
- ✅ **Parsable** - Scripts can extract data easily

---

## 🎨 Grace Integration

### Dropdown Auto-Updated:
```
💚 Current Scene
─────────────────────
📦 Available MPD Files
  Brick 1/42 (30 parts)      ← NEW!
  Brick 2/42 (30 parts)      ← NEW!
  Plate 1/30 (30 parts)      ← NEW!
  Slope 1/15 (30 parts)      ← NEW!
  Technic 1/107 (30 parts)   ← NEW!
  ─────────────────────
  🧱 SIMPLE TEST (3 bricks)
  DATA CENTER ✅
  BARBIE JEEP
  ...
```

**Catalogs added to top**, existing files preserved below!

---

## 🔧 Configuration

Edit these constants in the script:

```javascript
// Layout settings
const GRID_SPACING = 200;      // LDU between parts
const COLUMNS = 6;              // Grid columns
const Y_OFFSET = -50;           // Height above grid
const PARTS_PER_CATALOG = 30;   // Parts per file
```

### Want different layouts?

**More parts, tighter grid:**
```javascript
const GRID_SPACING = 150;
const COLUMNS = 8;
const PARTS_PER_CATALOG = 50;
```

**Fewer parts, wider spacing:**
```javascript
const GRID_SPACING = 300;
const COLUMNS = 4;
const PARTS_PER_CATALOG = 20;
```

---

## 📊 Output Summary

After running, you get:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CATALOG GENERATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Parts:      23,511
Catalogs Created: 247
Parts Per File:   30
Grid Columns:     6
Part Spacing:     200 LDU
Height Offset:    50 LDU above grid
Output Directory: catalogs/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 CATALOGS BY TYPE:

  Brick: 1,250 parts in 42 file(s)
  Plate: 890 parts in 30 file(s)
  Slope: 450 parts in 15 file(s)
  Technic: 3,200 parts in 107 file(s)
  Wheel: 180 parts in 6 file(s)
  Minifig: 520 parts in 18 file(s)
  Other: 15,021 parts in 501 file(s)
```

---

## 🎯 Workflow

**1. Generate Catalogs:**
```bash
node generate-part-catalogs.js
```

**2. Open Grace Editor:**
```
All catalogs auto-added to dropdown!
```

**3. Browse Parts:**
```
Select "Brick 1/42" → Loads 30 bricks in 3D
Rotate → See each part clearly spaced
Click part → See name in editor
Copy part filename → Use in your models
```

**4. Explore Categories:**
```
Brick_01.mpd    → Basic bricks
Technic_01.mpd  → Technic beams
Wheel_01.mpd    → Wheels & tires
Minifig_01.mpd  → Minifig parts
```

---

## 💡 Why This is Better

| Aspect | Before | After |
|--------|--------|-------|
| **Generation** | Browser (slow) | Node.js (fast) |
| **File management** | 300+ downloads | `/catalogs/` folder |
| **Spacing** | 100 LDU (overlap!) | 200 LDU (clear) |
| **Layout** | 10 columns (tight) | 6 columns (wide) |
| **Parts per file** | 50 (too many) | 30 (just right) |
| **Y position** | 0 (on grid) | -50 (above grid) |
| **Grouping** | Category only | Type + Family |
| **Readability** | Basic comments | Box-drawn headers |
| **Metadata** | Minimal | Full descriptions |
| **Grace integration** | Manual | Auto-updated |

---

## 🚀 Next Steps

**Want even smarter grouping?**

Add to the script:
- Group by **size** (1x1, 2x2, 2x4, etc.)
- Group by **color families** (trans, chrome, etc.)
- Group by **era** (classic, modern, etc.)
- Group by **common usage** (chassis, details, structure)

**Want different formats?**

Modify the MPD generation to:
- Add rotation variants
- Show parts from multiple angles
- Include assembly instructions
- Generate HTML indexes

---

## 📝 Notes

- Script preserves existing MPD files in Grace dropdown
- Catalogs use relative paths (`../catalogs/filename.mpd`)
- Safe to re-run - overwrites old catalogs
- Grace Editor must be reloaded after running script

---

💚 **Happy part browsing!**
