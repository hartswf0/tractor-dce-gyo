# ✅ Gold Equal Layout (50/50 Split)

## Desktop Layout (50/50 Equal Importance)

```
┌────────────────────────────────────────────────┐
│ Header (44px)                                  │
├─────────────────────┬──────────────────────────┤
│                     │                          │
│   EDITOR PANEL      │    VIEWER PANEL          │
│      (50%)          │       (50%)              │
│                     │                          │
│   MPD Lines         │    3D/2D Grid            │
│   Checkbox/Edit     │    Visual Output         │
│   + Minimap         │    + Scene Dots          │
│                     │    + Minimap             │
│                     │                          │
├─────────────────────┴──────────────────────────┤
│ Footer (44px)                                  │
└────────────────────────────────────────────────┘
```

**Key Change:**
- ❌ Old: 400px editor, flex viewer (unequal)
- ✅ New: 1fr editor, 1fr viewer (equal 50/50)

---

## Mobile/Tablet Layout (Stacked, Grid on Top)

```
┌──────────────────────┐
│ Header               │
├──────────────────────┤
│                      │
│   VIEWER PANEL       │ ← Grid on TOP
│    (Full Width)      │
│                      │
│   3D/2D Grid         │
│   Visual Output      │
│                      │
├──────────────────────┤
│                      │
│   EDITOR PANEL       │ ← Editor on BOTTOM
│    (Full Width)      │
│                      │
│   MPD Lines          │
│   Checkbox/Edit      │
│                      │
├──────────────────────┤
│ Footer               │
└──────────────────────┘
```

**Responsive Breakpoint:** 900px

**When screen < 900px:**
1. Viewer moves to top (row 2)
2. Editor moves to bottom (row 3)
3. Both take full width
4. Border changes: right → top

---

## Why This Matters

### Equal Visual Weight

**Before (400px / flex):**
```
[Editor] [========== Viewer ==========]
  33%              67%
```
- Editor felt like sidebar
- Viewer dominated
- Implied editor was less important

**After (1fr / 1fr):**
```
[====== Editor ======] [====== Viewer ======]
         50%                    50%
```
- Equal importance
- Balanced composition
- Code and visual output are peers
- Neither dominates the other

### Philosophy

**The MPD code IS as important as the visual:**
- Code defines the model
- Visual shows the result
- Both deserve equal screen space
- User needs both equally

### Bronze Parity

Bronze also uses equal split:
- Editor and viewer are peers
- Neither is subordinate
- Balanced workflow
- Stacks on mobile (Bronze: editor on top, Gold: grid on top)

---

## Mobile Philosophy: Grid First

**Why Grid on Top:**

1. **Visual First**
   - See the result immediately
   - Understand what you're editing
   - Grid is more scannable

2. **Touch Interaction**
   - Easier to tap grid cells (bigger targets)
   - Scrolling editor is easier below
   - Natural reading flow (visual → code)

3. **Workflow**
   - Mobile users likely viewing, not editing heavily
   - Grid interaction is primary on touch
   - Code inspection is secondary

**Bronze Choice:** Editor on top (code-first workflow)  
**Gold Choice:** Grid on top (visual-first workflow)  

Both valid! Gold optimizes for visual exploration.

---

## Responsive Behavior

### Desktop (> 900px)
```css
grid-template-columns: 1fr 1fr;  /* Side by side */
grid-template-rows: 44px 1fr 44px;
```

### Mobile (≤ 900px)
```css
grid-template-columns: 1fr;  /* Full width */
grid-template-rows: 44px 1fr 1fr 44px;  /* Stacked */
```

### Adjustments
- Minimap: 120px → 90px (smaller)
- Scene dots: 6px padding → 4px (compact)
- Borders: right → top (orientation change)

---

## User Experience

### Desktop Work
- **Equal split** shows both are important
- Easy to reference code while viewing
- Easy to reference visual while coding
- Balanced, professional layout

### Mobile View
- **Grid first** for quick visual checks
- Scroll down to see/edit code
- Compact controls (smaller minimap)
- Full-width panels for readability

### Tablet (iPad)
- **Stacked layout** gives more vertical space
- Each panel gets full attention
- Switch between visual and code
- Better for touch interaction

---

## Implementation

```css
/* Desktop: Equal */
body {
  grid-template-columns: 1fr 1fr;
}

/* Mobile: Stacked */
@media (max-width: 900px) {
  body {
    grid-template-columns: 1fr;
    grid-template-rows: 44px 1fr 1fr 44px;
  }
  #viewer-panel { grid-row: 2; }  /* Top */
  #editor-panel { grid-row: 3; }  /* Bottom */
}
```

---

## Comparison

| Aspect | Old | New | Benefit |
|--------|-----|-----|---------|
| Split | 400px / flex | 1fr / 1fr | Equal importance |
| Editor | 33% | 50% | More space |
| Viewer | 67% | 50% | Balanced |
| Mobile | No stack | Stacks | Responsive |
| Grid | Bottom | Top | Visual-first |
| Philosophy | Viewer-focused | Equal peers | Better UX |

---

## Result

✅ **Editor and viewer are equal partners**
- 50/50 split shows equal importance
- Neither dominates the layout
- Code and visual have same value
- Respects both aspects of the work

✅ **Mobile responsive**
- Stacks vertically < 900px
- Grid on top (visual-first)
- Editor below (code inspection)
- Full-width for readability

✅ **Bronze parity**
- Same equal-split philosophy
- Same responsive behavior
- Different stacking order (intentional)
- Same respect for both panels

**The MPD editor and the grid viewer are now equal collaborators, not primary/secondary.**
