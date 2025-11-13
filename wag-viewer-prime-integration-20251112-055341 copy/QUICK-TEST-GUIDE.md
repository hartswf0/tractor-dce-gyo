# ✅ Quick Test Guide - All New Features

## 🟨 1. Favicon
**Where:** Browser tab  
**What:** Gold square emoji  
**Test:** Just look at your browser tab! 🟨

---

## 📸 2. Screenshot (4:3 + JSON)

**Where:** IMG button (top-right WAGY bar)

**Test:**
1. Click **IMG** button
2. Two files download:
   - `wag_gold_scene_1_2025-11-12_16-30-45.png` (1600×1200)
   - `wag_gold_scene_1_2025-11-12_16-30-45.json` (metadata)
3. Open JSON to see full scene data

**JSON includes:**
- Filename, date, time
- Line count, locked lines
- Camera position
- Diagnostics state
- Full MPD content
- Error count

---

## 🎨 3. Background Color Picker

**Where:** WAGY bar (color square between Y and ▣)

**Test:**
1. Click color picker
2. Choose any color (try white #ffffff)
3. Scene background changes instantly
4. Status shows: "Background: #ffffff"

**Perfect for:**
- White backgrounds
- Custom branding
- Photo-realistic renders

---

## ⚠️ 4. Error Warning Button

**Where:** Auto-appears next to 🌙 theme button when errors occur

**Test:**
1. Paste invalid MPD line: `0 ...........`
2. Red **⚠ 1** button appears automatically
3. Click button to copy all errors
4. Status shows: "📋 Copied 1 errors!"

**Shows:**
- Error count
- Click to copy all to clipboard
- Bronze-style visual feedback

---

## 🎯 5. Error Line Highlighting

**Auto-triggered when parse errors occur**

**Test:**
1. Paste MPD with decoration line: `0 ═══════════`
2. Error occurs
3. Line 72 highlights in RED automatically
4. ⚠️ icon appears on line with tooltip
5. Auto-scrolls to error
6. Clears after 5 seconds

**Visual:**
- Red background (20% opacity)
- Red left border (3px)
- ⚠️ warning icon
- Smooth scroll
- Tooltip with error message

---

## 🎨 6. Three Themes

**Where:** 🌙 button (top-right)

**Test:**
1. Click 🌙 → Changes to ☀️ (light theme)
2. Click ☀️ → Changes to 🌿 (green theme)
3. Click 🌿 → Back to 🌙 (dark theme)

**Themes:**
- 🌙 Dark (black + gold)
- ☀️ Light (white + blue)
- 🌿 Green (matrix style)

---

## Quick Test Sequence

**30-second full test:**

```
1. Look at browser tab → See 🟨 favicon
2. Click color picker → Choose white → See white background
3. Click 🌙 button → Cycles through 3 themes
4. Paste invalid line → See ⚠ button appear + line highlight
5. Click ⚠ button → Errors copied to clipboard
6. Click IMG button → Download PNG + JSON
7. Open JSON → See full metadata
```

---

## All Features Working!

✅ **Favicon** - Gold square in tab  
✅ **Screenshot** - 4:3 ratio (1600×1200)  
✅ **JSON Export** - Full scene metadata  
✅ **BG Color** - Real-time Three.js update  
✅ **Error Log** - Bronze-style warning button  
✅ **Line Highlight** - Auto-scroll to errors  
✅ **3 Themes** - Dark/Light/Green  
✅ **Mobile** - Full-width responsive  
✅ **Copy Feedback** - Visual + emoji  

**Gold Editor = Production Ready! 🚀**
