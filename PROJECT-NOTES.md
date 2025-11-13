# WAG Primitive Editor - Project Notes

## Quick Reference

### **Current Status**
- ✅ Multi-scene management with overlay dots
- ✅ Resilient error handling with warning button
- ✅ Enhanced grid displays with counts/colors
- ✅ Theme-synced 3D background
- ✅ Click 3D piece → highlight line
- ⚠️ Magenta fallback for missing parts (expected)

### **Error Handling Flow**
```
Error occurs
  ↓
logError(error, context)
  ↓
- Add to ERROR_LOG[]
- Show ⚠️ button (pulsing)
- Display in status bar (5s)
  ↓
User clicks ⚠️
  ↓
Copy all errors to clipboard
- Time, context, message, stack
- Fallback to textarea if clipboard fails
```

### **Grid Display Info**

**2D Grid (9×9):**
- Max 800×800px (centered)
- Cell shows: coordinates, part count, colors
- Color-coded borders/backgrounds
- Min height 60px per cell

**Minimap (top-right):**
- 200px width, black background
- Blue accent border
- Part counts overlaid on cells
- Pulsing animation for occupied

### **Scene Management**

**Overlay Dots (Right Edge):**
```
●1 ← Active (blue glow)
○2 ← Inactive (grey)
○3
[+] ← New scene
```

**Features:**
- 32px diameter (tap-friendly)
- Tooltip: "scene2 (310L)"
- Click = instant teleport
- Hover × = close button
- Saves: lines, locks, history

### **GitHub Pages Deployment**

**Setup:**
```bash
git init
git add wag-primitive-editor.html WAG-PRIMITIVE-EDITOR-README.md
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/wag-primitive
git push -u origin main

# Enable Pages in Settings → Pages
```

**URL:**
```
https://USERNAME.github.io/wag-primitive/wag-primitive-editor.html
```

**Parts Library Issue:**
- MPD files reference `parts/*.dat`
- These files NOT in repo
- Result: Magenta wireframe placeholders
- Solution 1: Add `parts/` folder (10MB)
- Solution 2: Use CDN (future)
- Solution 3: Document desktop apps (current)

### **Testing MPD Files**

**Created:**
1. `barbie-jeep.mpd` - 300pc pink Jeep
2. `mars-rover.mpd` - 50pc NASA probe

**What Works:**
- ✅ Load into editor
- ✅ Edit lines
- ✅ Lock/unlock
- ✅ 3D positions correct
- ✅ Click boxes → highlight lines
- ⚠️ Shows magenta wireframes (no geometry)

**To Get Real Geometry:**
- Use LeoCAD/Studio/LDView (desktop)
- Or add `parts/` folder to repo
- Or fetch from CDN (not implemented)

### **File Structure**
```
DCE-GYO/
├── wag-primitive-editor.html    ← Main editor
├── WAG-PRIMITIVE-EDITOR-README.md ← Full docs
├── PROJECT-NOTES.md             ← This file
├── barbie-jeep.mpd              ← Test MPD
├── mars-rover.mpd               ← Test MPD
├── stanza_1.mpd, stanza_2.mpd   ← Ekphrasis MPDs
└── (parts/ folder - optional)   ← 10MB LDraw library
```

### **Key Improvements Made**

**Error Handling:**
- ⚠️ button instead of 📋
- Only shows when errors exist
- Pulses to draw attention
- One-click copy all logs

**Grid Display:**
- 2D grid: 800×800px max, centered
- Cells show coordinates + count + colors
- Color-coded borders
- Min 60px height

**Minimap:**
- Part counts overlaid
- Better contrast (black bg, blue accent)
- Pulsing animation
- Tooltips with counts

**Scene Management:**
- Overlay dots (not bottom panel)
- Right edge placement
- 32px dots (tap-friendly)
- Numbered (1, 2, 3...)
- Tooltips show name + line count

### **MPD Format Basics**

**Structure:**
```
0 FILE filename.mpd          ← Header
0 Name: Description          ← Metadata
0 Author: Name               ← Metadata
1 color x y z matrix part.dat ← Part line
0 STEP                       ← Build step
0 NOFILE                     ← End
```

**Part Line Format:**
```
1 [color] [x] [y] [z] [9×matrix] [partname.dat]
  ↑       ↑   ↑   ↑   ↑           ↑
  Type    Color Position  Rotation  Part file
```

**Example:**
```
1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat
  ↑ ↑ ↑ ↑ ↑ ↑─────────────┘ ↑
  │ │ │ │ │ Identity matrix  Part name
  │ │ │ │ └─ Z position
  │ │ │ └─── Y position
  │ │ └───── X position
  │ └─────── Color (4 = red)
  └───────── Type (1 = part)
```

### **Color Codes (Common)**
```
0  = Black
1  = Blue
2  = Green
4  = Red
13 = Pink
14 = Yellow
15 = White
71 = Light Grey
```

### **Desktop Apps for Real Rendering**

**LeoCAD** (Recommended):
- Free, open source
- Cross-platform
- Native MPD support
- Real-time editing

**BrickLink Studio**:
- Free, professional
- Huge parts library
- Building instructions
- Render engine

**LDView**:
- Free viewer
- High-quality renders
- POV-Ray export
- Model inspection

### **Workflow Recommendations**

**Quick Edits:**
1. Open MPD in WAG editor
2. Edit lines visually
3. Lock important parts
4. Export updated MPD

**Structure Design:**
1. Create in WAG (positions/layout)
2. Verify in 3D (magenta boxes OK)
3. Export MPD
4. Open in LeoCAD for real geometry
5. Fine-tune and render

**Multi-Scene Projects:**
1. Scene 1: Chassis
2. Scene 2: Body panels
3. Scene 3: Interior
4. Scene 4: Complete assembly
5. Export each separately

### **Browser Compatibility**

**Tested:**
- ✅ Chrome 120+ (desktop/mobile)
- ✅ Firefox 121+ (desktop/mobile)
- ✅ Safari 17+ (desktop/mobile)

**Requirements:**
- WebGL support
- Clipboard API (for error copy)
- ES6 JavaScript
- CSS Grid

**Fallbacks:**
- Clipboard: textarea + execCommand
- WebGL: Shows error message
- Mobile: Touch events + safe-area

### **Performance Notes**

**Typical:**
- 100 parts: 60fps, instant
- 300 parts: 60fps, smooth
- 1000 parts: 30-45fps, usable

**Optimization:**
- Primitive boxes (no complex geometry)
- Simple materials (no textures)
- Efficient raycasting
- Minimal DOM updates

**If Slow:**
- Use scene splitting
- Lock finished sections
- Disable minimap
- Switch to 2D grid view

### **Future Enhancements**

**Parts Library:**
- [ ] CDN integration
- [ ] Part search
- [ ] Thumbnail previews
- [ ] Automatic downloads

**Advanced Editing:**
- [ ] Multi-select lines
- [ ] Drag to reorder
- [ ] Copy/paste with transforms
- [ ] Find/replace

**Export:**
- [ ] PNG screenshot (3D only)
- [ ] JSON with metadata
- [ ] LDraw Studio format
- [ ] Build instructions

**Collaboration:**
- [ ] Share scene URL
- [ ] Import from URL
- [ ] Comment system
- [ ] Version history

---

**Last Updated:** 2025-11-12
**Version:** 1.0.0-alpha
**Status:** Functional, ready for testing
