# MODULAR BUILD GUIDE
## Monkey Data Center 4X Scale

### Philosophy: Reproducible Modules

Instead of stacking parts vertically, we build **modular panels** that can be:
- **Reproduced** (copy the pattern for more walls)
- **Spaced out** (40 LDU breathing room between elements)
- **Layered** (4 vertical layers per wall = texture and depth)

---

## Scale Comparison

### Original Build (Cramped)
```
Room: 160×160×120 LDU (8×8×5 bricks)
Walls: 3 layers × 3 parts = 9 parts per wall
Spacing: 20 LDU (1 brick)
Result: CRAMPED, stacked on top of each other
```

### Modular Build (Breathing Room)
```
Room: 320×320×480 LDU (16×16×20 bricks) = 4X SCALE
Walls: 4 layers × 4 sections = 16 parts per wall
Floor: 25 tiles (5×5 grid)
Spacing: 40 LDU (2 bricks) between elements
Result: BREATHABLE, modular, reproducible
```

---

## Wall Module Template

Each wall follows this **4-layer pattern**:

### Layer Heights (Every 72 LDU)
```
Y=-240  LAYER 4: Upper detail (status lights, small controls)
Y=-168  LAYER 3: Control panels (interactive elements)
Y=-96   LAYER 2: Main displays (large screens, info panels)
Y=-24   LAYER 1: Base structure (texture tiles, foundation)
```

### Horizontal Sections (4 across, 40 LDU apart)
```
X=-60   Section 1 (left)
X=-20   Section 2 (center-left)
X=+20   Section 3 (center-right)
X=+60   Section 4 (right)
```

### Total Per Wall: 4 layers × 4 sections = **16 panel positions**

---

## Reproduction Example: North Wall

Want to add a 5th wall section? Just **copy the pattern**:

```ldraw
0 // Add section at X=100 (far right)
1  72  100  -24 -160    1  0  0    0  1  0    0  0  1    15561.dat
1  72  100  -96 -160    1  0  0    0  1  0    0  0  1    15561.dat
1   1  100 -168 -160    1  0  0    0  1  0    0  0  1    14718px1.dat
1  72  100 -240 -160    1  0  0    0  1  0    0  0  1    15561.dat
```

The **module repeats** across X positions: -60, -20, 20, 60, 100, 140...

---

## Floor Module (Large Panel)

Instead of a few scattered tiles, we build a **9×9 tile base**:

```
5 rows × 5 columns = 25 tiles
Covers: -80 to +80 on both X and Z axes
Spacing: 40 LDU grid (every 2 bricks)
```

This creates a **solid foundation** that feels like an actual room floor.

---

## Monkey Color Change: BLACK ONLY

**Old:** Color 6 (Brown)  
**New:** Color 0 (Black)  

```ldraw
0 // BLACK monkeys (no brown)
1   0    0 -160    0    1  0  0    0  1  0    0  0  1    3626bph4.dat
1   0    0 -120    0    1  0  0    0  1  0    0  0  1    2866.dat
```

All three monkeys (Alpha, Beta, Gamma) now use **color 0**.

---

## Spacing Strategy (Breathing Room)

### Horizontal Spacing
- **Monkeys:** X=-100, 0, +100 (100 LDU apart = 5 bricks)
- **Wall panels:** 40 LDU between sections (2 bricks)
- **Floor tiles:** 40 LDU grid pattern

### Vertical Spacing
- **Wall layers:** 72 LDU apart (3 bricks)
- **Monkeys to floor:** 160 LDU (8 bricks standing height)
- **Console to floor:** 96 LDU (4 bricks up)

**Result:** Scene has **room to breathe** and elements don't overlap.

---

## Texture Focus: 4X Depth

### Original Wall (Thin)
```
Y=-24   Base
Y=-48   Control
Y=-72   Upper
= 3 layers, 48 LDU total depth
```

### Modular Wall (Thick)
```
Y=-24   Layer 1: Base texture
Y=-96   Layer 2: Main displays
Y=-168  Layer 3: Control panels
Y=-240  Layer 4: Upper detail
= 4 layers, 216 LDU total depth = 4.5X DEEPER
```

**Each layer adds texture and visual interest.**

---

## Rotation Matrices (East/West Walls)

### East Wall (X=160, faces room center)
```
Matrix: 0 0 1 / 0 1 0 / -1 0 0
Effect: Part rotates 90° clockwise (Z→X axis)
```

### West Wall (X=-160, faces room center)
```
Matrix: 0 0 -1 / 0 1 0 / 1 0 0
Effect: Part rotates 90° counter-clockwise (Z→-X axis)
```

**Both walls face inward** toward the room center.

---

## Part Count Summary

### Walls (16 parts × 4 walls)
- 48× `15561.dat` (wall texture base)
- 12× `14718px1.dat` (large display panels)
- 16× `5306.dat` (control modules)
- 8× Server doors and detail tiles

### Floor
- 25× `3069bpc0.dat` (1×1 tiles in 5×5 grid)

### Interior
- 4× Console parts
- 3× Ceiling vents
- 6× Monkey parts (3 heads + 3 bodies)

**Total: ~120 parts** (vs. ~40 in cramped version)

---

## Build Sequence

1. **Floor first** - Establish the base grid
2. **4 walls** - Build each as complete module (all 4 layers)
3. **Interior** - Add console and ceiling once walls exist
4. **Characters last** - Place monkeys in their positions

**Container-first thinking** = walls define the space, interior fills it.

---

## Modular Thinking Benefits

### Reproducibility
- Each wall is a template
- Copy sections to expand sideways
- Copy layers to expand upward

### Spacing
- 40 LDU grid = consistent rhythm
- No cramming or overlap
- Visual breathing room

### Texture
- 4 layers per wall = depth and detail
- Each layer has distinct function
- Walls feel substantial, not thin

### Scalability
- Want bigger room? Add more sections
- Want taller walls? Add more layers
- Pattern remains consistent

---

## LDU Math Reference

```
20 LDU = 1 brick width (stud spacing)
8 LDU = 1 plate height
24 LDU = 1 brick height (3 plates)
40 LDU = 2 bricks (our spacing unit)
72 LDU = 3 bricks (our layer height)
160 LDU = 8 bricks (room half-width)
```

**All measurements are multiples** - makes math predictable and modular reproduction easy.

---

## Next Steps

1. **View the build** - Load `monkey-data-center-modular.mpd` in viewer
2. **Notice spacing** - Elements don't overlap, room breathes
3. **Study a wall** - See how 4 layers create texture
4. **Try reproduction** - Copy a wall section pattern to expand
5. **Scale up more** - Apply 8X scale for massive builds

**Modular thinking** = master builder methodology at scale.
