# ONYX THUMB — Guardian Chapter Player

**A cinematic audio-visual reader for the DCE-GYO Guardian debates.**

## Overview

Onyx Thumb transforms the Guardian chapter archive into an immersive reading and listening experience. Each chapter presents a philosophical debate between two archetypal figures—THE BISHOP vs THE FOREMAN, THE SCRIBE vs THE GOLEM, and so on—exploring themes of technological governance, digital sovereignty, and the future of human-machine relations.

## Features

### 📖 Three View Modes

- **TEXT** — Full chapter transcript with formatted dialogue, narration, and action beats
- **VISUAL** — Image gallery from chapter media folders with lightbox viewing
- **PLAY** — Audio player with text-to-speech, synchronized slideshow, and cinema mode

### 🎬 Cinema Mode

Press `F` or click the TV icon to enter fullscreen cinema mode:
- **Full-screen images** fill the viewport
- **Subtitle bar** at bottom displays dialogue with speaker colors
- **Progress bar** shows position in transcript
- **Hover controls** for play/pause and navigation
- Press `C` to toggle subtitles on/off

### 🔊 Audio Playback

- **Text-to-Speech** with distinct voices for each speaker role
- **Speed control** (0.5x to 2x)
- **Auto-advance** to next chapter when complete
- **Sync toggle** to advance slideshow images with audio

### 📱 Mobile-Friendly

- **Collapsible sidebar** with tap-to-close overlay
- **Swipe gestures** for chapter navigation
- **Responsive layout** adapts to all screen sizes
- **Touch-friendly controls** throughout

### ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` `→` | Previous / Next line |
| `J` `K` | Previous / Next chapter |
| `F` | Toggle cinema mode |
| `C` | Toggle subtitles (in cinema) |
| `Esc` | Exit / Stop |

### 🎨 Settings

- **Show/hide dialogue text** — Toggle spoken lines
- **Show/hide narration** — Toggle stage directions
- **Show/hide action verbs** — Toggle action beats
- **Sync slideshow** — Auto-advance images with audio

## Chapter Media

Each chapter can have an associated media folder at:
```
media/ch{NUMBER}_{SPEAKER-A}-vs-{SPEAKER-B}/
```

Images in these folders appear in the Visual grid and the Play mode slideshow.

### Chapters Without Images

The following chapters currently have no media:
- Ch 18: THE-TAXONOMIST vs THE-INTERPRETER
- Ch 25: THE-PLANNER vs THE-DRIFTER  
- Ch 38: THE-PRODUCER vs THE-PARASITE
- Ch 41: THE-BROTHER vs THE-MONEY-CHANGER
- Ch 45: THE-GRIEVER vs THE-ASTROBIOLOGIST
- Ch 51: THE-IDEALIST vs THE-SYSTEM-BUILDER
- Ch 53: THE-KANTIAN vs THE-BIOLOGIST
- Ch 63: THE-ARTIST vs THE-MACHINE

## Data Views

### Fighter Panels
Each chapter displays two participant panels showing:
- **Name** and **archetype**
- **Score** (0-10 scale)
- **Verdict** summary
- **Key arguments**

### Data Tab
- Win/loss statistics
- Argument strength breakdown
- Comparative analysis

## Technical Notes

- Built as a single HTML file with embedded CSS and JavaScript
- Uses Web Speech API for text-to-speech
- Fullscreen API for cinema mode
- No external dependencies beyond Font Awesome icons
- Chapter data loaded from `chapters/` directory JSON files

## Related Files

- `onyx-thumb.html` — Main player application
- `onyx-abs.html` — Abstract grid view
- `research-index.html` — One-line verdict log
- `chapter-manifest.json` — Chapter metadata
- `chapter-final-decisions.json` — Winner/comparison data
- `media/MANIFEST.md` — Media folder documentation

---

*Part of the DCE-GYO project — exploring technological governance through dialectical encounters.*
