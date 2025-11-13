# Gold ← Primitive Convergence Plan

## Current State
**Gold**: Sidebar (editor + scenes) | Viewer  
**Primitive**: Header | Editor Panel | Viewer Panel (3D + 2D Grid) | Footer

## Target Architecture

```
┌────────────────────────────────────────────────────┐
│ Header: WAG GOLD | Center Controls | Corner Btns  │ ← 44px fixed
├────────────────────┬───────────────────────────────┤
│ Editor Panel       │ Viewer Panel                  │
│ ┌────────────────┐ │ ┌───────────────────────────┐ │
│ │ MPD Text       │ │ │ 3D Canvas                 │ │
│ │ (line numbers) │ │ │ OR                        │ │
│ │                │ │ │ 2D Grid (9×9)             │ │
│ │                │ │ │                           │ │
│ └────────────────┘ │ └───────────────────────────┘ │
│ Stats: X lines     │ View: [3D] [2D] [Grid] [Spin] │
├────────────────────┴───────────────────────────────┤
│ Footer: Scene Selector | Status | Controls        │ ← 44px fixed
└────────────────────────────────────────────────────┘
```

## What to Remove from Gold
❌ Sidebar navigation (move to footer dropdown)  
❌ Library/model browser section  
❌ Scene list in sidebar (move to footer)  
❌ Info panel overlay  

## What to Add from Primitive
➕ **Header Structure**
   - File name in center (or "Scene N")  
   - Mode buttons (3D/2D) in center  
   - Corner controls (Grid, Wireframe, etc.)

➕ **Editor Panel**
   - Line numbers (optional but nice)  
   - Full-height text area  
   - Stats below (lines, chars)  
   - No scrollable sidebar

➕ **Viewer Panel**
   - 3D canvas (already have)  
   - 2D Grid option (9×9 cells)  
   - View toggles at bottom  
   - Grid shows occupied cells

➕ **Footer**
   - Scene selector DROPDOWN (not list)  
   - Left: Scene name  
   - Center: View controls  
   - Right: Status + model stats

## Layout Grid Structure

```css
body {
  display: grid;
  grid-template-rows: 44px 1fr 44px;  /* Header, Main, Footer */
  grid-template-columns: 400px 1fr;   /* Editor, Viewer */
}

#header {
  grid-column: 1 / -1;  /* Span both columns */
}

#editor-panel {
  grid-row: 2;
  grid-column: 1;
}

#viewer-panel {
  grid-row: 2;
  grid-column: 2;
}

#footer {
  grid-column: 1 / -1;  /* Span both columns */
}
```

## Scene Management Changes

**OLD (Gold Sidebar):**
```
🎬 SCENES
[+ NEW SCENE]
• Scene 1 (active)
• Scene 2
• Scene 3
```

**NEW (Footer Dropdown):**
```
┌────────────────────────────┐
│ Scene: Scene 1 ▼           │  ← Click to open
└────────────────────────────┘

Dropdown opens:
┌────────────────┐
│ Scene 1 ✓      │  ← Active
│ Scene 2        │
│ Scene 3        │
├────────────────┤
│ + New Scene    │
│ Rename...      │
│ Delete Scene   │
└────────────────┘
```

## 2D Grid System (From Primitive)

**9×9 Grid** showing part placement:
- Empty cells: faint border
- Occupied cells: glowing, shows:
  - Cell coordinate (0,0) 
  - Part count
  - Part color code

**Toggle**: 3D ⇄ 2D button in viewer panel

**Implementation:**
```javascript
function render2DGrid(parts) {
  const grid = Array(9).fill().map(() => Array(9).fill(null));
  
  parts.forEach(part => {
    const row = Math.floor(part.y / 20);  // Scale to grid
    const col = Math.floor(part.x / 20);
    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      if (!grid[row][col]) grid[row][col] = [];
      grid[row][col].push(part);
    }
  });
  
  // Render grid cells with counts
}
```

## Header Controls Layout

```
┌──────────────────────────────────────────────┐
│ ⚙ WAG GOLD    [3D] [2D]   ⌖ ▦ ◇ ↻ 🎨       │
│   File        View Mode   Diagnostics Theme │
└──────────────────────────────────────────────┘
```

**Left Corner:**
- ⚙ Settings menu

**Center:**
- View mode toggles (3D/2D)  
- Scene name/file name

**Right Corner:**
- ⌖ Reset camera
- ▦ Toggle grid
- ◇ Wireframe
- ↻ Auto-spin
- 🎨 Theme

## Footer Controls Layout

```
┌──────────────────────────────────────────────┐
│ Scene: Scene 1 ▼ | ⊞ Grid Ready | 1K tris   │
└──────────────────────────────────────────────┘
```

**Left:**
- Scene selector dropdown

**Center:**
- ⊞ Collapse/expand grid button
- Status text

**Right:**
- Model stats (triangles, meshes)

## Migration Steps

1. **Fix Grid Structure**
   ```css
   body {
     grid-template-rows: 44px 1fr 44px;
     grid-template-columns: 400px 1fr;
   }
   ```

2. **Move Scenes to Footer**
   - Remove scene list from sidebar
   - Add dropdown in footer
   - Keep STATE.scenes array

3. **Simplify Sidebar → Editor Panel**
   - Remove section titles
   - Full-height textarea
   - Stats at bottom only

4. **Add 2D Grid View**
   - Create grid-2d element
   - Toggle between canvas/grid
   - Parse parts for grid display

5. **Add Header Controls**
   - Center: File name + view toggles
   - Corners: Diagnostic buttons

6. **Simplify Footer**
   - Scene dropdown
   - Status text
   - Model stats

## Benefits

✅ **Cleaner Layout**
- No scrolling sidebar
- More space for editor + viewer
- Professional app feel

✅ **Better Scene Management**
- Dropdown doesn't take vertical space
- Quick scene switching
- Context menu for rename/delete

✅ **Grid Visualization**
- See part placement in 2D
- Easier debugging
- Spatial understanding

✅ **Primitive Parity**
- Same controls
- Same workflow
- Plus: scenes + working loader!

## Code Size Target

- Primitive: ~3000 lines (with all features)
- Gold Converged: ~1200 lines (scenes + Prime engine, no line editor complexity)

**Why smaller:** No line-by-line editor, no locking, no undo per line, simpler state.
