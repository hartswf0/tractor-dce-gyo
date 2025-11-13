# ✅ Gold Quality-of-Life Features (Bronze Parity)

## Screenshot Capture ✨

### Button
- **Location:** Top-right corner → `IMG` button
- **Action:** Captures 3D canvas and downloads PNG

### Keyboard Shortcut
```
Ctrl + Shift + S  →  Screenshot
```

### Filename Format
```
wag_gold_scene_1_2025-11-12_11-45-30.png
```
- Includes scene name, date, and time
- Automatic download to browser downloads folder

### How It Works
1. Gets canvas from Prime engine
2. Forces render frame
3. Converts to PNG data URL
4. Triggers download
5. Status: "Screenshot saved!"

---

## Right-Click Context Menu 🖱️

### Visual Menu (Bronze Style)

Right-click any line in editor → Professional context menu appears:

```
┌─────────────────────┐
│ Line 42             │
├─────────────────────┤
│ 🔒 Lock             │
│ 📋 Copy Line        │
│ ✂️ Cut Line         │
│ 📝 Duplicate        │
│ ➕ Insert Above     │
│ ➕ Insert Below     │
├─────────────────────┤
│ ↑ Move Up          │
│ ↓ Move Down        │
│ 🗑 Delete          │
└─────────────────────┘
```

### Features
- ✅ Hover highlights
- ✅ Click to execute
- ✅ Auto-closes on outside click
- ✅ Styled like Bronze (gold accents)
- ✅ All line operations in one place

### Actions Available
1. **Lock/Unlock** - Protect line from editing
2. **Copy Line** - Copy to clipboard
3. **Cut Line** - Copy and delete
4. **Duplicate** - Clone line below
5. **Insert Above** - Add blank line above
6. **Insert Below** - Add blank line below
7. **Move Up** - Swap with line above
8. **Move Down** - Swap with line below
9. **Delete** - Remove line

---

## Keyboard Shortcuts ⌨️

### Global Shortcuts

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Ctrl+Shift+S` | Screenshot | Downloads PNG |
| `Cmd+S` / `Ctrl+S` | Compile/Render | Force update |

### Line Editor Shortcuts (Bronze Parity)

| Shortcut | Action | Context |
|----------|--------|---------|
| `Enter` | New line below | Any line |
| `Delete` | Delete empty line | Empty line |
| `Backspace` | Delete empty line | Empty line |
| `Ctrl+D` | Duplicate line | Any line |
| `Ctrl+↑` | Move line up | Any line |
| `Ctrl+↓` | Move line down | Any line |
| `↑` / `↓` | Navigate lines | Arrow keys |
| `Ctrl+V` | Paste zone | Global |

### Paste Shortcuts

| Action | Behavior |
|--------|----------|
| `Ctrl+V` (global) | Opens paste zone modal |
| `Ctrl+V` (in line) | Splits multi-line paste |
| Single line paste | Inserts at cursor |

---

## Command-Click / Meta-Click Support

### Compile with Cmd+S (Mac) or Ctrl+S (Windows)
```javascript
if ((e.metaKey || e.ctrlKey) && e.key === 's') {
  e.preventDefault();
  compile();
}
```

- **Mac:** `Cmd+S` → Renders scene
- **Windows:** `Ctrl+S` → Renders scene
- Prevents browser "Save Page" dialog
- Immediate visual feedback

---

## Bronze Parity Checklist

| Feature | Bronze | Gold | Status |
|---------|--------|------|--------|
| Screenshot button | ✅ | ✅ | ✅ |
| Screenshot shortcut | ✅ | ✅ | ✅ |
| Right-click menu | ✅ | ✅ | ✅ NEW! |
| Visual context menu | ✅ | ✅ | ✅ NEW! |
| Copy line | ✅ | ✅ | ✅ |
| Cut line | ✅ | ✅ | ✅ NEW! |
| Duplicate line | ✅ | ✅ | ✅ |
| Insert above/below | ✅ | ✅ | ✅ NEW! |
| Move line up/down | ✅ | ✅ | ✅ |
| Delete line | ✅ | ✅ | ✅ |
| Lock/Unlock | ✅ | ✅ | ✅ |
| Cmd+S compile | ✅ | ✅ | ✅ NEW! |
| Ctrl+Shift+S screenshot | ✅ | ✅ | ✅ NEW! |
| Undo/Redo | ✅ | ✅ | ✅ |
| Paste zone | ✅ | ✅ | ✅ |
| Multi-line paste | ✅ | ✅ | ✅ |

---

## User Experience Improvements

### Before (Missing QoL)
- ❌ No screenshot capture
- ❌ Clunky prompt-based menus
- ❌ Limited keyboard shortcuts
- ❌ No command-click support
- ❌ Manual copy/paste only

### After (Full Bronze Parity)
- ✅ One-click screenshots
- ✅ Professional visual menus
- ✅ Complete keyboard control
- ✅ Mac/Windows command support
- ✅ Rich clipboard operations
- ✅ Insert/duplicate/cut helpers
- ✅ Smooth, intuitive workflow

---

## Technical Implementation

### Screenshot Function
```javascript
function captureScreenshot() {
  const canvas = document.querySelector('#viewer canvas');
  const dataURL = canvas.toDataURL('image/png');
  
  // Create filename with timestamp
  const filename = `wag_gold_${scene}_${date}_${time}.png`;
  
  // Trigger download
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  a.click();
}
```

### Context Menu System
```javascript
function showLineContextMenu(e, idx) {
  // Create styled div at mouse position
  const menu = document.createElement('div');
  menu.style.cssText = `position: fixed; left: ${e.clientX}px; top: ${e.clientY}px; ...`;
  
  // Add menu items with actions
  items.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.addEventListener('click', () => item.action());
    menu.appendChild(menuItem);
  });
  
  // Auto-close on outside click
  document.addEventListener('click', closeMenu);
}
```

### Global Shortcuts
```javascript
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    captureScreenshot();
  }
  
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    compile();
  }
});
```

---

## Result

Gold now has **complete Bronze quality-of-life parity**:

✅ **Screenshot capture** - One click or Ctrl+Shift+S  
✅ **Visual context menus** - Professional, intuitive  
✅ **Full keyboard shortcuts** - Power user friendly  
✅ **Command-click support** - Mac & Windows  
✅ **Rich clipboard ops** - Copy, cut, paste, duplicate  
✅ **Line manipulation** - Insert, move, delete  
✅ **Undo/Redo** - 50-step history  

**The editor is now as smooth and powerful as Bronze, with Prime's engine underneath!**
