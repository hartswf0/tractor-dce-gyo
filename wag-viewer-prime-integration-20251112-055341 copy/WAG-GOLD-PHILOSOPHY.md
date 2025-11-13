# WAG GOLD EDITOR PHILOSOPHY

## The Problem with Silver

Silver Editor kept failing because we were **building on broken foundations**:
- Complex line-by-line editor infrastructure
- Scene management system
- Trying to retrofit library catalog onto existing broken code
- Too many moving parts, too many failure points

## The Gold Solution

**Start from what works. Add minimally.**

### What We Kept (From Prime)
✅ Complete working Prime engine infrastructure  
✅ Library catalog loading (11.2MB manifest, 34K+ files)  
✅ File map building with 500K+ path variants  
✅ Path resolution and fallback system  
✅ Model browser with search/filter  
✅ All diagnostics (grid, axes, wireframe, etc.)  
✅ Auto-spin, camera controls  
✅ The EXACT loader mechanism that works in Prime  

### What We Added (Minimal)
➕ Single textarea for editing (300px height, resizable)  
➕ One RENDER button that calls working `loadManualText()`  
➕ Load-into-editor on library click (so you can edit reference models)  

### What We Removed (Complexity)
❌ Line-by-line editor  
❌ Scene management  
❌ Multiple views  
❌ Undo/redo  
❌ Line locking  
❌ Grouping  
❌ Everything that wasn't essential  

## The Flow

```
1. Open Gold Editor → Library catalog loads (same as Prime)
2. Paste MPD/LDR into textarea → Click RENDER → Renders (using Prime's loadManualText)
3. OR: Click model from library → Loads into editor + renders → Edit → Click RENDER
4. OR: Load file → Goes into editor → Edit → Click RENDER
```

## Why It Works

**Prime works. Gold IS Prime + textarea.**

- Same initialization sequence
- Same loader mechanism  
- Same file map
- Same LDrawLoader setup
- No complex parsing layers
- No editor state management
- No scene transitions
- Just: `WAG.viewer.loadText(text, meta)`

## The Code

**Rendering (1 function):**
```javascript
document.getElementById('render-btn').addEventListener('click', () => {
  const text = document.getElementById('editor-textarea').value;
  loadManualText(text, {
    filename: 'gold-editor.mpd',
    name: 'Gold Editor',
    origin: 'Gold Editor'
  });
});
```

**That's it.** 

`loadManualText()` is the EXACT function from Prime that WORKS.

## Philosophy

> "When you start from working code and add minimally,  
> you never stray far from working.  
> When you try to fix broken code with more code,  
> you compound the brokenness."

Silver tried to be sophisticated. Gold tries to work.

## Test

1. Open `wag-gold-editor.html`
2. Check console: Should see library catalog load (500K+ variants)
3. Paste barbie-jeep.mpd into textarea
4. Click ⚡ RENDER
5. Should render successfully

If it fails, check console for diagnostic messages. But it shouldn't fail, because it's using Prime's working mechanism.

## Future Enhancements (If Needed)

- Syntax highlighting (CodeMirror)
- Line numbers
- Find/replace
- Auto-save to localStorage
- Export button
- Screenshot button

But **only add these if rendering keeps working**. Never sacrifice the working core.

## The Lesson

Sometimes you need to **throw away the complexity** and start from simplicity.

Gold Editor is ~50 lines different from Prime Viewer.  
Silver Editor was ~3000 lines different and broken.

**Less is more.**
