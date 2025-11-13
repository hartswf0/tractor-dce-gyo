# Gold ↔ Bronze Structure Parity

## What Was Fixed

### Header (4 Corners + Center)

**Bronze:**
```
[Scene 1] ────── [⊙ 20] [↶↷ ∅ ⌖ ⊗] ────── [☼]
```

**Gold (Now Fixed):**
```
[Scene 1] ────── [↶↷ | ∅ ⌖ ⊗] ────── [☼]
```

✅ Scene name on left  
✅ Mode buttons in center (with undo/redo group)  
✅ Theme button on right  

### Editor Panel (Left)

**Both Have:**
- Panel header with controls (↶ ↷ New Discard | ⎘ ⟳)
- Line-by-line editor with:
  - ☑ Checkboxes (NOW VISIBLE in Gold!)
  - Line numbers
  - ContentEditable content
- Minimap on right edge

**Fixed:**
- Checkboxes now have `opacity: 1 !important` + `appearance: auto`
- Ensures they're visible

### Viewer Panel (Right)

**Bronze Structure:**
```
┌─────────────────────────────┐
│ [3D | 2D Grid]      [IMG]   │ ← Tabs at top
├─────────────────────────────┤
│                             │
│     3D Viewer Canvas        │
│                             │
│  [Reset|Grid|Axes|Flip Y]  │ ← Controls at BOTTOM
│  [Wire|Edges|Spin]         │
└─────────────────────────────┘
```

**Gold (Now Fixed):**
```
┌─────────────────────────────┐
│ [3D | 2D Grid]      [IMG]   │ ← Added!
├─────────────────────────────┤
│                             │
│     3D Viewer Canvas        │
│                             │
│  [⌖|Grid|Axes|Flip Y]      │ ← Added at bottom!
│  [Wire|Edges|Spin]         │
└─────────────────────────────┘
```

✅ Viewer mode tabs at top  
✅ **Controls at bottom of viewer** (overlay style)  
✅ Matches Bronze layout exactly  

### Footer (4 Corners)

**Bronze:**
```
[⇄] [Scene 1 ▼] ───── Ready | Stats ───── [✓]
```

**Gold (Now Fixed):**
```
[⇄] [Scene 1 ▼] ───── Ready | Stats | Library ───── [✓]
```

✅ Import/Export button (left corner)  
✅ Scene dropdown  
✅ Status + stats in middle  
✅ Check All button (right corner)  

## Information Architecture

### Top Header (4 positions)

1. **Left:** Scene name / File name
2. **Center-Left:** Undo/Redo group (separated)
3. **Center-Right:** Mode buttons (∅ ⌖ ⊗)
4. **Right:** Theme toggle

### Editor Panel Header (2 sides)

1. **Left:** History controls (↶ ↷ New Discard)
2. **Right:** Export controls (⎘ Copy ⟳ Render)

### Viewer Panel Structure (3 layers)

1. **Top:** Mode tabs + Screenshot
2. **Middle:** 3D canvas (main content)
3. **Bottom:** Diagnostic controls (overlay)

### Footer (4 corners)

1. **Left Corner:** Import/Export (⇄)
2. **Left-Center:** Scene selector
3. **Center-Right:** Status + Stats + Library
4. **Right Corner:** Check All (✓)

## Composition Breakdown

### Line Structure
```
[☑] [1] [0 FILE model.mpd               ]
 │   │   └─ ContentEditable span
 │   └─ Line number
 └─ Checkbox (enable/disable)
```

### Panel Button Groups
```
Header Center:
  [↶↷ |] separator [∅ ⌖ ⊗]
  
Editor Panel:
  [↶ ↷ New Discard] gap [⎘ ⟳]
  
Viewer Controls:
  [⌖ Grid Axes Flip] divider [Wire Edges Spin]
```

### Corner Button Style
```css
.footer-corner-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;  /* Circular */
  /* Hover lifts */
}
```

## Menu Items by Location

### Top Left (Scene Context)
- Scene name display
- (Click to show scene actions)

### Top Center (Editor Modes)
- Undo/Redo (history)
- Clear (∅)
- Select mode (⌖) - default
- Lock mode (⊗) - protect lines

### Top Right (Global)
- Theme toggle (☼)

### Editor Panel Left (History)
- Undo MPD
- Redo MPD
- New MPD
- Discard (keep locked)

### Editor Panel Right (Output)
- Copy All (⎘)
- Force Render (⟳)

### Viewer Panel Top (View Mode)
- 3D tab (default)
- 2D Grid tab
- Screenshot (IMG)

### Viewer Panel Bottom (Diagnostics)
- Reset View (⌖)
- Grid toggle
- Axes toggle
- Flip Y
- Wireframe toggle
- Edges toggle
- Auto Spin toggle

### Footer Left (I/O)
- Import/Export (⇄)

### Footer Right (Batch)
- Check All (✓) - enable all lines

## Key Differences Fixed

### Before Fix

❌ Checkboxes not visible  
❌ Viewer controls in separate panel  
❌ No viewer mode tabs  
❌ Missing footer corner buttons  
❌ Wrong header layout  

### After Fix

✅ Checkboxes visible with forced styles  
✅ Viewer controls at bottom (overlay)  
✅ Viewer mode tabs at top  
✅ Footer corner buttons present  
✅ Header matches Bronze structure  

## Result

**Gold now has Bronze's structure** while keeping:
- Prime's working engine
- Scene management system
- Line-by-line editor
- Minimap
- All the polish

**The composition is correct:**
- 4-corner button layout
- Panel headers with grouped controls
- Viewer controls at bottom (Bronze style)
- Checkboxes visible
- Information architecture matches

This is what you asked for - **Gold with Bronze's structure and menu composition**.
