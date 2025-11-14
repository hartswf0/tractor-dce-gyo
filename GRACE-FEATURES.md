# 💚 Grace Editor - Complete Feature List

## What Makes Grace Special

Grace Editor is the **"Machine of Loving Grace"** - it keeps working even when things break. Unlike Gold Editor (strict mode), Grace will:
- Load scenes with missing parts
- Show pink placeholder cubes where parts are missing
- Give you a **visual error report** you can click
- Highlight problematic lines in pink
- Let you copy error reports to fix issues

---

## 📱 Mobile-Friendly Features

### **📋 PASTE Button**
- **Big yellow button** in header: `📋 PASTE`
- Tap it to open full-screen paste zone
- Paste entire MPD from your phone
- Works on iOS, Android, any mobile device

### **Touch-Friendly Interface**
- Large tap targets for buttons
- Vertical stacking on small screens (editor below viewer)
- Smooth scrolling to error lines
- Pinch to zoom in 3D viewer

---

## 🎯 Error Handling Features

### **Visual Error Highlighting**
When you load a file with missing parts:
1. **Pink pulsing lines** in editor (animated)
2. **💔 MISSING** badge on each error line
3. **Error panel** slides up from bottom

### **Interactive Error Panel**
- Lists every missing part with line numbers
- **Click any error** to:
  - Jump to that line in editor
  - Highlight it with yellow pulse
  - Scroll smoothly into view
- **📋 COPY button** to copy full error report
- **✕ CLOSE button** to dismiss panel

### **Console Report**
Detailed console output:
```
💚 MACHINE OF LOVING GRACE - Missing Parts Report
═══════════════════════════════════════════════════
Scene rendered with 3 missing components:

  📦 minifig-01.ldr
     Occurrences: 1
     Lines: 42
     💡 Tip: Check if this should be "parts/minifig-01.ldr"
```

---

## ⌨️ Keyboard Shortcuts

### **Selection & Editing**
- **Cmd+Click** - Multi-select lines
- **Delete** or **Backspace** - Delete selected lines
- **Cmd+C** - Copy selected lines
- **Cmd+S** - Compile/Render scene
- **Cmd+Z** - Undo
- **Cmd+Shift+Z** - Redo

### **Quick Actions**
- **Ctrl+Shift+S** - Screenshot (4:3 + JSON)
- **Ctrl+V** - Show paste zone

---

## 🎨 Visual Feedback

### **Line States**
```
🟢 Normal - Black background
🟡 Selected - Blue highlight with gold border
🔒 Locked - Gold tint, can't edit
💔 Missing Part - Pink pulsing animation
⚡ Highlighted - Yellow pulse (2 times)
🔨 Compiling - Gold wave animation
```

### **Error Line Appearance**
```css
Pink pulsing background (animated)
Pink left border (3px)
💔 MISSING badge on right
Smooth 2s pulse loop
```

---

## 📦 Working with MPD Files

### **What Grace Handles**
✅ Missing external `.ldr` files (shows placeholders)  
✅ Missing `parts/` prefix (warns in report)  
✅ 404 errors (intercepts and logs gracefully)  
✅ Malformed subfiles (continues loading)  
✅ Partial scenes (renders what works)

### **Grace Report Shows**
- Part name that's missing
- How many times it's referenced
- Exact line numbers (clickable!)
- Suggested fix (add `parts/` prefix)
- Total placeholder count

---

## 🔧 How to Use Grace

### **From Phone**
1. Copy MPD content on phone
2. Open Grace Editor in browser
3. Tap `📋 PASTE` button (yellow, top-left)
4. Paste content
5. Tap "Load"
6. See scene render with placeholders for missing parts
7. Tap error lines in pink panel to jump to problems

### **From Desktop**
1. Open Grace Editor
2. Paste MPD with Ctrl+V (or click PASTE button)
3. Scene loads with placeholders
4. Error panel shows at bottom
5. Click error items to highlight lines
6. Click "📋 COPY" to get error report
7. Fix issues and reload

---

## 🆚 Grace vs Gold

| Feature | Grace 💚 | Gold 🟨 |
|---------|----------|---------|
| **Missing parts** | Shows pink placeholders | Fails to load |
| **Error feedback** | Visual panel + console | Console only |
| **Line highlighting** | Auto-highlights errors | Manual only |
| **Mobile paste** | Big button, easy | Small button |
| **Philosophy** | Forgiving, helpful | Strict, precise |
| **Best for** | Fixing broken files | Clean validated files |

---

## 🎯 Use Cases

### **1. Debugging 404 Errors**
Load file → Grace shows pink lines → Click error → Jump to line → Fix reference

### **2. Phone Testing**
Copy MPD on phone → Paste in Grace → See what renders → Copy error report → Fix on desktop

### **3. Learning LDraw**
Try building → Some parts missing? → Grace shows what's wrong → Learn correct format

### **4. Batch Validation**
Load multiple files → Grace reports all issues → Copy reports → Fix systematically

---

## 📋 Error Report Format

When you click "📋 COPY", you get:
```
💚 GRACE REPORT - Missing Parts
═══════════════════════════════════════

📦 parts/3626bp01.dat
   Occurrences: 8
   Lines: 49, 75, 101, 127, 153, 179, 205, 231
   💡 Tip: Check if this should be "parts/parts/3626bp01.dat"

📦 minifig-01-archivist.ldr
   Occurrences: 1
   Lines: 38
   💡 Tip: Check if this should be "parts/minifig-01-archivist.ldr"

✅ Scene loaded with 2 placeholders
```

---

## 🚀 Quick Start

1. **Open Grace**: Click `💚 GRACE` from manifest
2. **Load file**: Tap `📋 PASTE` or drag file
3. **See errors**: Pink lines pulse in editor
4. **Click errors**: Tap error panel items to jump
5. **Copy report**: Tap `📋 COPY` button
6. **Fix & reload**: Update MPD and compile again

---

## 💡 Pro Tips

### **Finding Pattern Issues**
If you see many similar errors (e.g., all minifig parts), likely missing `parts/` prefix everywhere

### **External File References**
If Grace shows `.ldr` file missing, you need to embed it inside your MPD (see `MPD-STRUCTURE-GUIDE.md`)

### **Testing Partial Scenes**
Grace lets you see what DOES work while fixing what doesn't - no more empty viewer!

### **Mobile Workflow**
1. Work on desktop
2. Test on phone (paste & view)
3. Copy error report from phone
4. Fix issues on desktop
5. Repeat until clean

---

## 🔗 Related Docs

- **`GRACE-EDITOR-PHILOSOPHY.md`** - Why Grace exists
- **`MPD-STRUCTURE-GUIDE.md`** - How to fix broken files
- **`mpd-validator.html`** - Validate before loading

---

💚 **The machine of loving grace is always here for you, even when things break!**
