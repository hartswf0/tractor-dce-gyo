# OLOG: Cinematic MPD Experiments
## Date: 2025-12-17
## Status: IN PROGRESS - MULTILOAD IMPLEMENTED

---

## 1. SITUATION

We have a set of **four cinematic MPD experiments** that extend LDraw syntax with custom MENTO directives for:
- **Lighting** (`!MENTO LIGHT`)
- **Camera/Shots** (`!MENTO SHOT`)
- **Cinematic structure** (shots as keyframes, not just geometry)

These are designed to be pasted into a viewer and demonstrate Deleuzian image-types rendered as LEGO scenes.

### The Four Experiments

| Scenario | Image-Type | Form | Key Techniques |
|----------|------------|------|----------------|
| **Fragmented Hero** | Action-Image | Small Form | Handheld, low-key, chiaroscuro, medium close-up |
| **Symbolic Void** | Any-Space-Whatever | Perception-Image | Wide angle, gaseous perception, cool monochrome |
| **Memory Loop** | Mental-Image | Relation-Image | Golden hour, soft focus, bracket syntagma |
| **Power Shift** | Action-Image | Large Form | High→Low angle, vertical axis, hard contrast |

---

## 2. ENTITIES

### E1: MPD File
```
Type: Text/Data Structure
Properties:
  - Header (FILE, Name, Author, !LDRAW_ORG)
  - Comments (0 //)
  - MENTO Extensions (0 !MENTO ...)
  - Geometry Lines (1 color x y z matrix part.dat)
  - Terminator (0 NOFILE)
```

### E2: MENTO LIGHT Directive
```
Syntax: 0 !MENTO LIGHT "name" TYPE [SPOT|POINT|SUN] POS x y z TGT tx ty tz COLOR #hex INTENSITY f SHADOWS [TRUE|FALSE]

Types:
  - SPOT: Directional with cone (KEY lights, RIM lights)
  - POINT: Omnidirectional (FILL, BOUNCE)
  - SUN: Distant parallel rays (Global wash, daylight)

Properties mapped to Three.js:
  - POS → light.position
  - TGT → light.target.position (for spot)
  - COLOR → light.color
  - INTENSITY → light.intensity
  - SHADOWS → light.castShadow
```

### E3: MENTO SHOT Directive
```
Syntax: 0 !MENTO SHOT "name" POS x y z TGT tx ty tz LENS mm

Properties:
  - POS → camera.position
  - TGT → controls.target / camera.lookAt
  - LENS → camera.fov (derived from mm focal length)

Relationship: Multiple shots = keyframes for cinematic sequence
```

### E4: Scene Collection (Proposed)
```
A container for multiple MPD files that can be:
  - Loaded together
  - Switched between (like scene tabs)
  - Sequenced for playback
```

---

## 3. MORPHISMS

### M1: MPD → Three.js Scene
```
Current:
  Geometry lines (1 ...) → LDrawLoader → THREE.Group
  
Proposed Extension:
  MENTO LIGHT → THREE.SpotLight / THREE.PointLight / THREE.DirectionalLight
  MENTO SHOT → Camera preset / keyframe
```

### M2: Focal Length → FOV
```
The LENS parameter (mm) needs conversion to Three.js FOV (degrees):
  fov = 2 * atan(sensorHeight / (2 * focalLength)) * (180/π)
  
Common mappings (35mm equivalent):
  24mm → ~84° (wide)
  35mm → ~63° (normal-wide)
  50mm → ~47° (normal)
  85mm → ~29° (portrait)
  100mm → ~24° (telephoto)
```

### M3: Handheld Effect → Shot Sequence
```
Scenario 1 demonstrates "handheld feel" via micro-jitter keyframes:
  Shot 1: POS 30 -35 60
  Shot 2: POS 32 -34 61 (micro-offset)
  Shot 3: POS 29 -36 59 (micro-offset)
  
This suggests: Shots can be interpolated for animation
```

### M4: Multiple MPDs → Scene Collection
```
Current state:
  - Single MPD loaded at a time
  - Scenes array exists but initialized one-at-a-time
  
Proposed morphism:
  [mpd1, mpd2, mpd3, mpd4] → STATE.scenes[]
  
The "+" button could:
  1. Open file picker for multiple .mpd/.ldr files
  2. Parse each into separate scene
  3. Add to scene tabs
  4. Allow switching/sequencing
```

---

## 4. ARCHITECTURAL QUESTIONS

### Q1: Where do MENTO directives get parsed?
```
Option A: In LDrawLoader (fork/extend)
  - Pro: Single parse pass
  - Con: Modifying library code

Option B: Pre-process before LDrawLoader
  - Pro: Clean separation
  - Con: Two-pass parsing

Option C: Post-process with regex on raw text
  - Pro: Simple to implement
  - Con: Fragile
  
Recommendation: Option B - extract MENTO lines first, then pass clean LDraw to loader
```

### Q2: How to handle lights?
```
Current: Viewer has fixed lighting setup
Proposed: 
  1. Clear existing lights when MENTO LIGHT found
  2. Create lights from directives
  3. Store light configs per-scene
```

### Q3: How to handle shots?
```
Current: Free camera with OrbitControls
Proposed:
  1. Parse MENTO SHOT into shot list
  2. UI: Shot picker dropdown or timeline
  3. Click shot → animate camera to position
  4. Optional: Sequence playback with timing
```

### Q4: Batch MPD Loading
```
Current UX for "+" button (bottom right):
  - Opens catalog browser
  
Alternative UX:
  - Long-press or secondary action → "Import MPD Files..."
  - File picker allows multiple selection
  - Each file becomes a scene tab
  
Or separate button:
  - "📁 Import" in toolbar
  - Accepts .mpd, .ldr files
  - Batch import into scene collection
```

---

## 5. IMPLEMENTATION SKETCH (NOT CODE YET)

### Phase 1: MENTO Parser
```
function extractMentoDirectives(mpdText) {
  const lights = [];
  const shots = [];
  const cleanLines = [];
  
  mpdText.split('\n').forEach(line => {
    if (line.includes('!MENTO LIGHT')) {
      lights.push(parseMentoLight(line));
    } else if (line.includes('!MENTO SHOT')) {
      shots.push(parseMentoShot(line));
    } else {
      cleanLines.push(line);
    }
  });
  
  return { lights, shots, cleanMpd: cleanLines.join('\n') };
}
```

### Phase 2: Light Application
```
function applyMentoLights(scene, lights) {
  // Remove existing lights
  scene.traverse(obj => {
    if (obj.isLight) scene.remove(obj);
  });
  
  // Create from directives
  lights.forEach(cfg => {
    const light = createLightFromMento(cfg);
    scene.add(light);
  });
}
```

### Phase 3: Shot Selector
```
function createShotUI(shots) {
  // Dropdown or chips for each shot
  // Click → animate camera to shot position
}
```

### Phase 4: Batch Import
```
function handleBatchImport(files) {
  files.forEach(file => {
    const text = await file.text();
    createScene(text.split('\n'));
  });
  updateSceneSelector();
}
```

---

## 6. THE CINEMATIC EXPERIMENTS (Reference)

### Scenario 1: The Fragmented Hero
- **Image-Type**: Action-Image (Small Form)
- **Lighting**: Low-key chiaroscuro (hard key, weak cool fill, rim)
- **Camera**: Handheld micro-jitter, 85mm portrait lens
- **Subject**: Single minifig, industrial void

### Scenario 2: The Symbolic Void
- **Image-Type**: Any-Space-Whatever (Perception-Image)
- **Lighting**: Monochromatic cool (sun wash, distant cyan source)
- **Camera**: Extreme wide, high angle, gaseous perception
- **Subject**: Ruins, tiny figure lost in space

### Scenario 3: The Memory Loop
- **Image-Type**: Mental-Image (Relation-Image)
- **Lighting**: Golden hour (warm sun, bounce fill)
- **Camera**: Bracket syntagma (macro on token, shallow on face)
- **Subject**: Token object, separated figure

### Scenario 4: The Power Shift
- **Image-Type**: Action-Image (Large Form)
- **Lighting**: High contrast (top-down divine, red uplight)
- **Camera**: Vertical axis crane (high→low angle shift)
- **Subject**: Figure on throne/podium

---

## 7. IMPLEMENTATION STATUS

### ✅ COMPLETED: Multiload (2025-12-17 18:24 EST)

**📁 Import Button** (footer, next to +)
- Triggers file picker for `.mpd`, `.ldr`, `.dat` files
- Supports multiple file selection
- Each file → separate scene tab

**Drag & Drop**
- Drop files onto viewer container
- Yellow dashed outline on dragover
- Same import logic as button

**Code Location**: `wag-courage.html` lines 5241-5359

```javascript
// Import MPD Files button (📁)
document.getElementById('import-mpd-btn').addEventListener('click', () => {
    document.getElementById('mpd-file-input').click();
});

// Handle MPD file imports (multiload)
document.getElementById('mpd-file-input').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    // ... parse each file, create scene, update UI
});

// Drag and Drop onto viewer
viewerContainer.addEventListener('drop', async (e) => {
    const files = Array.from(e.dataTransfer.files).filter(f => 
        /\.(mpd|ldr|dat)$/i.test(f.name)
    );
    // ... same import logic
});
```

### NEXT STEPS

1. ~~Batch import - File picker for multiple MPDs~~ ✅
2. **Test MPDs manually** - Drop the 4 experiment files
3. **Prototype MENTO parser** - Extract directives without breaking loader
4. **Implement lights** - Most visual impact
5. **Add shot selector** - Camera presets

---

## 8. OPEN QUESTIONS

- Should MENTO become a formal extension spec?
- How to handle animation timing between shots?
- Can we export renders with these lighting/camera settings?
- Integration with timeline/sequencer UI?

---

*This OLOG maps the conceptual territory before implementation. The cinematic MPD experiments bridge film theory (Deleuze) with LEGO visualization, extending LDraw with lighting and camera semantics.*
