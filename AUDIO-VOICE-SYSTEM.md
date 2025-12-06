# ONYX Audio Voice System

## Overview

The ONYX Audio tab transforms chapter narratives into dramatic radio plays using the Web Speech API. Each chapter is parsed into a structured script with distinct voice assignments for different roles.

## Voice Architecture

### Four Voice Roles

| Role | Purpose | Voice Selection Priority | Speech Style |
|------|---------|-------------------------|--------------|
| **PRESENTER** | Chapter announcements | British male (Daniel) | Normal pitch, clear |
| **NARRATOR** | Stage directions, scene-setting | American female (Samantha) | Slower (0.9x), lower pitch (0.95) |
| **P1** | First speaker dialogue | American male (Fred/Ralph) | Slightly lower pitch (0.9) |
| **P2** | Second speaker dialogue | Irish/Australian female (Moira/Karen) | Slightly higher pitch (1.1) |

### Voice Selection Logic

```
PRESENTER: Daniel (British) → Reed UK → Eddy UK → any male → fallback
NARRATOR:  Samantha → Karen → Tessa → any different from presenter
P1:        Fred → Ralph → Reed US → Grandpa → Rishi → fallback
P2:        Moira → Kathy → Tessa → Grandma → fallback
```

### Why These Choices?

1. **PRESENTER (Daniel)** - British accent conveys authority and formality for chapter introductions. The BBC-style delivery sets the stage.

2. **NARRATOR (Samantha)** - Warm American female voice provides contrast to the presenter. Slower rate (0.9x) and slightly lower pitch (0.95) creates a storytelling intimacy for stage directions like *"The Foreman gestures to a subordinate..."*

3. **P1 (Fred/Ralph)** - American male voices for the first speaker. Lower pitch (0.9) suggests gravitas. Falls back to character voices (Grandpa, Rishi) for variety.

4. **P2 (Moira/Karen)** - Irish or Australian accent creates clear distinction from P1. Higher pitch (1.1) provides contrast. The accent difference helps listeners track who is speaking.

## Script Element Types

### Parsed from Markdown

| Type | Example | Voice Used |
|------|---------|------------|
| `presenter` | "Chapter 12. When The Bishop meets The Foreman" | PRESENTER |
| `narration` | "On the outskirts of an ancient city..." | NARRATOR |
| `dialogue` | "'Observe', says THE BISHOP" | P1 or P2 |
| `shout` | "Slab!" | Speaker's voice, higher pitch (1.2), faster (1.1x) |

### Speech Parameters by Type

```javascript
narration: { pitch: 0.95, rate: speed * 0.9, voice: NARRATOR }
shout:     { pitch: 1.2,  rate: speed * 1.1, voice: speaker }
presenter: { pitch: 1.0,  rate: speed,       voice: PRESENTER }
dialogue:  { pitch: 0.9-1.1, rate: speed,    voice: P1 or P2 }
```

## Available macOS Voices (41 English)

### Quality Voices (Recommended)

**British:**
- Daniel (en_GB) - Male, authoritative
- Reed UK (en_GB) - Male
- Eddy UK (en_GB) - Male

**American:**
- Samantha (en_US) - Female, clear
- Fred (en_US) - Male, classic
- Ralph (en_US) - Male
- Kathy (en_US) - Female
- Reed US (en_US) - Male
- Eddy US (en_US) - Male

**International:**
- Karen (en_AU) - Australian female
- Moira (en_IE) - Irish female
- Tessa (en_ZA) - South African female
- Rishi (en_IN) - Indian male

**Character:**
- Grandpa UK/US - Older male
- Grandma UK/US - Older female
- Whisper (en_US) - Soft, intimate

### Novelty Voices (Avoided)

These are excluded from automatic selection:
- Albert, Bells, Boing, Bubbles, Cellos
- Bad News, Good News, Jester, Junior
- Organ, Superstar, Trinoids, Zarvox, Wobble

## Script Parsing

### Input: Chapter Markdown

```markdown
'Observe', says THE BISHOP, pointing to a flat piece of stone. 
'Here is the essence of language.'

THE FOREMAN sighs, picking up a heavy mallet. 'My dear Bishop, 
you are painting a picture of language that is at home in a nursery.'

The Foreman shouts a single, sharp syllable: "Slab!"
```

### Output: script.json

```json
{
  "chapter": "M-12",
  "title": "When The Bishop meets The Foreman",
  "script": [
    { "type": "dialogue", "speaker": "THE BISHOP", "text": "Observe", "action": "says, pointing to a flat piece of stone" },
    { "type": "dialogue", "speaker": "THE BISHOP", "text": "Here is the essence of language", "action": null },
    { "type": "dialogue", "speaker": "THE FOREMAN", "text": "My dear Bishop, you are painting a picture...", "action": "sighs, picking up a heavy mallet" },
    { "type": "narration", "text": "The Foreman shouts a single, sharp syllable:" },
    { "type": "shout", "speaker": "THE FOREMAN", "text": "Slab!", "action": "shouts" }
  ]
}
```

## Parsing Challenges Solved

### Possessives and Contractions

**Problem:** `'assistant's mind'` was being split at the apostrophe.

**Solution:** Two-pass quote detection:
1. Find all `'` positions
2. Filter out possessives (`'s`, `'t`, `'d`, `'ll`, `'re`, `'ve`)
3. Pair remaining quotes as dialogue boundaries

### Speaker Attribution

**Patterns recognized:**
- `'dialogue', says THE SPEAKER` (attribution after)
- `THE SPEAKER says, 'dialogue'` (attribution before)
- `'dialogue'` (continuation from previous speaker)

### Shouts vs Emphasis

**Problem:** Double quotes used for both shouts and emphasis.

**Solution:** Only treat as shout when preceded by shout verbs:
```regex
/(?:shouts?|cries?|yells?|exclaims?)[^"]*"([^"]+)"/
```

## UI Controls

### Toggles
- **Text** - Show/hide dialogue text
- **Narration** - Show/hide stage directions (also skips during playback)
- **Actions** - Show/hide parenthetical actions

### Playback
- **Speed** - 0.5x to 2.0x
- **Play/Pause/Stop** - Standard controls
- **Prev/Next** - Jump between lines
- **Click line** - Jump to specific position

## Files

| File | Purpose |
|------|---------|
| `parse-chapter-script.js` | Node script to extract scripts from markdown |
| `chapters/script-manifest.json` | Index of all chapter scripts |
| `chapters/{folder}/script.json` | Per-chapter dramatic script |
| `onyx-thumb.html` | Audio player UI and Web Speech integration |

## Statistics

- **42 chapters** parsed
- **1090 script elements** total
- **659 dialogue** lines
- **430 narration** passages
- **1 shout** ("Slab!")

## Console Debugging

When a chapter loads, the console shows:
```
🎭 Voice Cast:
  PRESENTER: Daniel
  NARRATOR: Samantha
  THE BISHOP: Fred
  THE FOREMAN: Moira
  Available voices: 41
```

## Future Improvements

1. **Voice persistence** - Remember user's preferred voice assignments
2. **Custom voice mapping** - Let users assign specific voices to speakers
3. **SSML support** - Use Speech Synthesis Markup for better prosody
4. **Audio export** - Generate MP3 files for offline listening
5. **Background music** - Add ambient soundscapes per chapter theme
