# Gold: Primitive's Line-by-Line Editor System

## Critical Difference

**Current Gold (Simple):**
```html
<textarea id="editor-textarea">...</textarea>
```

**Primitive (Serious):**
```html
<div id="mpd-editor">
  <div class="editor-line" data-line-num="1">
    <input type="checkbox" class="line-checkbox" checked>
    <span class="line-number">1</span>
    <span class="line-content" contenteditable="true">0 FILE model.mpd</span>
  </div>
  <div class="editor-line" data-line-num="2">...</div>
</div>
<div id="mpd-minimap">...</div>
```

## Line Structure (Composition)

```
┌──┬────┬─────────────────────────────────────┐
│☑ │ 1  │ 0 FILE model.mpd                   │
│☑ │ 2  │ 0 Name: Example Model              │
│☐ │ 3  │ 1 16 0 0 0 1 0 0 0 1 0 0 0 1 3001  │ ← disabled (unchecked)
│☑ │ 4  │ 1 4 40 0 0 1 0 0 0 1 0 0 0 1 3002  │
│🔒│ 5  │ 0 STEP                              │ ← locked (orange)
└──┴────┴─────────────────────────────────────┘
```

## Panel Header (Above Editor)

```
┌─────────────────────────────────────────────┐
│ ↶ ↷ New Discard      Copy ↓ ⟳              │
│ Undo/Redo Actions    Export Controls        │
└─────────────────────────────────────────────┘
```

**Left Side:**
- `↶` Undo (mpd history)
- `↷` Redo
- `New` Create new MPD
- `Discard` Clear all (keep locked)

**Right Side:**
- `⎘` Copy All MPD
- `↓` Export MPD file
- `⟳` Force Rerender

## Minimap (20px, right side)

```
│░│ ← empty line
│■│ ← part line (blue)
│▓│ ← comment (gray)
│▓│
│■│
│■│
│🔒│ ← locked line (orange)
│░│
```

Shows entire document at a glance, clickable to jump.

## Line States

```css
/* Normal line */
.editor-line {
  background: var(--bg-main);
  border-left: 3px solid transparent;
}

/* Hover */
.editor-line:hover {
  background: rgba(102, 170, 255, 0.05);
}

/* Compiling (animation) */
.editor-line.compiling {
  background: rgba(102, 170, 255, 0.15);
  border-left-color: var(--accent);
  animation: compileWave 0.6s;
}

/* Highlighted (from 3D click) */
.editor-line.highlighted {
  background: rgba(255, 215, 0, 0.2);
  border-left-color: #ffd700;
  animation: pulse 1s ease-in-out 2;
}

/* Locked (protected) */
.editor-line.locked {
  background: rgba(255, 170, 0, 0.08);
  border-left-color: #fa0;
}

/* Disabled (unchecked) */
.line-content.disabled {
  color: var(--text-tertiary);
  text-decoration: line-through;
  opacity: 0.4;
}
```

## Line Content Types

```css
/* Comment */
.line-content.comment {
  color: var(--text-tertiary);
  font-style: italic;
}

/* Part (type 1 line) */
.line-content.part {
  color: var(--text-primary);
  font-weight: 600;
}

/* Locked */
.editor-line.locked .line-content {
  color: #fa0;
  font-weight: 600;
}
```

## Keyboard Navigation

```javascript
// Arrow keys - move between lines
case 'ArrowUp': focusPrevLine(); break;
case 'ArrowDown': focusNextLine(); break;

// Enter - new line below
case 'Enter':
  e.preventDefault();
  insertLineBelow(currentIdx);
  break;

// Delete - remove empty line
case 'Delete':
case 'Backspace':
  if (isEmpty(currentLine)) deleteLine(currentIdx);
  break;

// Ctrl+D - duplicate line
case 'd':
  if (e.ctrlKey) duplicateLine(currentIdx);
  break;

// Ctrl+↑/↓ - move line up/down
case 'ArrowUp':
  if (e.ctrlKey) moveLine(currentIdx, -1);
  break;
```

## ContentEditable Magic

```javascript
const content = document.createElement('span');
content.className = 'line-content';
content.textContent = line;
content.contentEditable = true;  // ← Inline editing!
content.spellcheck = false;

// On blur - save changes
content.addEventListener('blur', () => {
  editorLines[idx] = content.textContent;
  compile();  // Auto-recompile
});

// On Enter - new line
content.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    insertNewLineBelow(idx);
  }
});
```

## Modes (Header Center Buttons)

**Select Mode** (default)
- Click lines to focus
- Edit inline
- Arrow keys navigate

**Lock Mode**
- Click lines to lock/unlock
- Locked lines can't be deleted
- Orange border

**Copy Mode**
- Click line to copy text
- Status shows "Copied!"

**Group Mode**
- Select multiple lines
- Move/delete as group

## Viewer Panel Tabs

```
┌────┬────────┬───────────────────────┐
│ 3D │ 2D Grid│ W A G ▣ IMG          │
└────┴────────┴───────────────────────┘
```

**Tab Group** (left):
- `[3D]` (active by default)
- `[2D Grid]` (9×9 visual grid)

**Controls** (right):
- `W` Wireframe toggle
- `A` Axes toggle
- `G` Grid toggle (active by default)
- `▣` Minimap toggle
- `IMG` Screenshot

## Footer (4 Corners)

```
┌──┬────────────┬─────────┬──┐
│⇄ │Scene: S1   │ Ready   │✓ │
└──┴────────────┴─────────┴──┘
```

1. **⇄** Import/Export modal
2. **Scene:** Scene selector
3. **Status** text
4. **✓** Enable all parts (check all)

## Why This is Better

✅ **Line-by-line control**
- Enable/disable individual parts
- Lock important lines
- See line numbers

✅ **Inline editing**
- ContentEditable = no textarea
- Edit directly in place
- Natural text editing

✅ **Visual feedback**
- Animations on compile
- Highlight from 3D clicks
- Color-coded line types

✅ **Minimap overview**
- See entire document
- Jump to sections
- Visual structure

✅ **Keyboard power**
- Arrow navigation
- Line manipulation
- Shortcuts

✅ **Professional feel**
- Looks like VS Code
- Serious tool
- Not a toy

## Implementation Priority

1. **Line rendering** - Replace textarea with line divs
2. **ContentEditable** - Inline editing
3. **Checkboxes** - Enable/disable parts
4. **Panel header** - Above editor controls
5. **Minimap** - Document overview
6. **Keyboard nav** - Arrow keys, shortcuts
7. **Animations** - Compile wave, pulse
8. **Lock mode** - Protect lines
9. **Viewer tabs** - 3D/2D toggle
10. **Footer corners** - Import/Export/Check All

## Code Size Impact

- **Current**: ~950 lines (textarea-based)
- **Target**: ~1400 lines (line-based editor)
- **Worth it**: Absolutely - this is the CRITICAL AREA

The composition of line structure + panel header + minimap + keyboard nav = Professional MPD editor
